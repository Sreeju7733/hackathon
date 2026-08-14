import { NextResponse } from "next/server";
import {
  formulaFallback,
  graphFallback,
  isReusablePlan,
  validatePlan,
  type ExplanationPlan,
  type SceneMode,
} from "../../../lib/explanation";

export const runtime = "nodejs";
export const maxDuration = 35;

const MAX_LATEX_LENGTH = 240;
const MAX_EXPRESSION_LENGTH = 180;
const MAX_ATTEMPTS = 2;
const GEMINI_TIMEOUT_MS = 25_000;
const GEMINI_MODEL = "gemini-3.1-flash-lite";

const ACTION_NAMES = [
  "SET_VIEWPORT",
  "SHOW_AXES",
  "SHOW_GRID",
  "ADD_EXPRESSION",
  "REMOVE_EXPRESSION",
  "DRAW_BASE_GRAPH",
  "TRANSFORM_GRAPH",
  "DRAW_POINT",
  "MOVE_POINT",
  "DRAW_LINE",
  "DRAW_CIRCLE",
  "DRAW_GUIDE",
  "SHOW_LABEL",
  "HIGHLIGHT_TERM",
  "HIGHLIGHT_GRAPH",
  "FADE_OBJECT",
  "CLEAR_TEMPORARY_OBJECTS",
].join(", ");

type ExplorationInput = {
  latex: string;
  canonicalExpression: string;
  mode: SceneMode;
  subject: string;
};

type GeminiPayload = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string; thought?: boolean }>;
    };
  }>;
};

function parseInput(payload: unknown): ExplorationInput | null {
  if (!payload || typeof payload !== "object") return null;

  const body = payload as Record<string, unknown>;
  const isMode = body.mode === "graph" || body.mode === "formula";
  const validLengths =
    typeof body.latex === "string" &&
    typeof body.canonicalExpression === "string" &&
    body.latex.length <= MAX_LATEX_LENGTH &&
    body.canonicalExpression.length <= MAX_EXPRESSION_LENGTH;

  if (!isMode || !validLengths) return null;

  return {
    latex: body.latex as string,
    canonicalExpression: body.canonicalExpression as string,
    mode: body.mode as SceneMode,
    subject:
      typeof body.subject === "string" &&
      body.subject.trim().length > 0 &&
      body.subject.trim().length <= 60
        ? body.subject.trim().replace(/[^a-zA-Z0-9 .,&()/-]/g, "") || "Physics"
        : "Physics",
  };
}

function extractText(payload: unknown): string {
  const response = payload as GeminiPayload;

  return (
    response.candidates?.[0]?.content?.parts
      ?.filter((part) => !part.thought)
      .map((part) => part.text || "")
      .join("") || ""
  );
}

function buildInstruction(input: ExplorationInput): string {
  const stepLimit = input.mode === "graph" ? 8 : 5;
  const modeInstructions = [
    `Mode is ${input.mode}. Create no more than ${stepLimit} substantive steps.`,
    input.mode === "formula"
      ? "Return JSON only with title, approach, formula, and steps."
      : "Return JSON only with mode, title, approach, and steps.",
  ];

  const sharedInstructions = [
    "You create a safe, accurate structured teaching plan for a mathematics " +
      "and science learning UI.",
    ...modeInstructions,
    "Approach is derivation, geometric_proof, concept_explanation, empirical_law, " +
      "dimensional_explanation, or worked_example.",
    "Every step has id, narration under 300 characters, blocks, actions, and " +
      "graphExpression only for graph steps.",
    "Blocks are typed text, latex, or visual. Never use dollar delimiters.",
    `Allowed action types only: ${ACTION_NAMES}.`,
    "For graph mode, graphExpression is safe ASCII. Begin with axes, then draw a " +
      "recognizable parent function, then make one visible transformation or " +
      "construction decision per step. The final graphExpression must equal the input " +
      "ASCII expression. Describe exactly which term causes each shift, stretch, " +
      "reflection, composition, intercept, or asymptote; never say only that the graph " +
      "was drawn. Include at least two graph steps and use actions that match each step.",
    "Never generate executable code.",
  ];

  if (input.mode === "formula") {
    sharedInstructions.push(
      `The requested academic subject is "${input.subject}". Explain the input in that subject context and set formula.subject to exactly "${input.subject}".`,
      "For formula mode, formula is required: name, subject, topic, confidence, " +
        "identityNote if uncertain, variables, assumptions, limitations, and proofStatus.",
      "formula.variables must be an array of objects with symbol, name, meaning, unit, " +
        "and optional unitNote. formula.assumptions and formula.limitations must be arrays of short strings.",
      "proofStatus is derived, geometric_proof, empirical, definition_based, or " +
        "conceptual.",
      "For formula mode, return formula metadata and steps with id, narration, and blocks only. The application adds mode and actions.",
      "Define every variable and give its unit when meaningful. Use SI units for " +
        "physics and suitable labels such as unitless, count, category, or not applicable " +
        "for other subjects. Explain the derivation or empirical basis honestly, and state " +
        "assumptions and limitations.",
      "Include an interpretation or worked example. Never use generic filler or " +
        "falsely claim a proof for an empirical law.",
    );
  }

  sharedInstructions.push(
    `Input LaTeX: ${input.latex}. Input ASCII: ${input.canonicalExpression}.`,
  );

  return sharedInstructions.join(" ");
}

function createGeminiUrl(apiKey: string): string {
  return (
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}` +
    `:generateContent?key=${encodeURIComponent(apiKey)}`
  );
}

const actionSchema = {
  type: "OBJECT",
  properties: {
    type: { type: "STRING", enum: ACTION_NAMES.split(", ") },
    expression: { type: "STRING" },
    objectId: { type: "STRING" },
    translationX: { type: "NUMBER" },
    translationY: { type: "NUMBER" },
  },
  required: ["type"],
};

const stepSchema = {
  type: "OBJECT",
  properties: {
    id: { type: "STRING" },
    narration: { type: "STRING" },
    blocks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING", enum: ["text", "latex", "visual"] },
          content: { type: "STRING" },
        },
        required: ["type", "content"],
      },
    },
    actions: { type: "ARRAY", items: actionSchema },
    graphExpression: { type: "STRING" },
  },
  required: ["id", "narration", "blocks", "actions"],
};

const formulaStepSchema = {
  type: "OBJECT",
  properties: {
    id: { type: "STRING" },
    narration: { type: "STRING" },
    blocks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING", enum: ["text", "latex", "visual"] },
          content: { type: "STRING" },
        },
        required: ["type", "content"],
      },
    },
  },
  required: ["id", "narration", "blocks"],
};

function responseSchema(mode: SceneMode) {
  if (mode === "formula") {
    return {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        approach: {
          type: "STRING",
          enum: [
            "derivation",
            "geometric_proof",
            "concept_explanation",
            "empirical_law",
            "dimensional_explanation",
            "worked_example",
          ],
        },
        steps: { type: "ARRAY", items: formulaStepSchema },
        formula: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            topic: { type: "STRING" },
            confidence: { type: "NUMBER" },
            identityNote: { type: "STRING" },
            proofStatus: {
              type: "STRING",
              enum: [
                "derived",
                "geometric_proof",
                "empirical",
                "definition_based",
                "conceptual",
              ],
            },
            variables: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  symbol: { type: "STRING" },
                  name: { type: "STRING" },
                  meaning: { type: "STRING" },
                  unit: { type: "STRING" },
                  unitNote: { type: "STRING" },
                },
                required: ["symbol", "name", "meaning", "unit"],
              },
            },
            assumptions: { type: "ARRAY", items: { type: "STRING" } },
            limitations: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["name", "variables"],
        },
      },
      required: ["steps", "formula"],
    };
  }
  const properties: Record<string, unknown> = {
    mode: { type: "STRING", enum: [mode] },
    title: { type: "STRING" },
    approach: {
      type: "STRING",
      enum: [
        "derivation",
        "geometric_proof",
        "concept_explanation",
        "empirical_law",
        "dimensional_explanation",
        "worked_example",
      ],
    },
    steps: { type: "ARRAY", items: stepSchema },
  };
  const required = ["mode", "title", "approach", "steps"];
  return { type: "OBJECT", properties, required };
}

function createGeminiRequest(instruction: string, mode: SceneMode) {
  return {
    contents: [{ role: "user", parts: [{ text: instruction }] }],
    generationConfig: {
      maxOutputTokens: 3600,
      responseMimeType: "application/json",
      responseSchema: responseSchema(mode),
    },
  };
}

const approaches = new Set<ExplanationPlan["approach"]>([
  "derivation",
  "geometric_proof",
  "concept_explanation",
  "empirical_law",
  "dimensional_explanation",
  "worked_example",
]);
const proofStatuses = new Set<NonNullable<ExplanationPlan["formula"]>["proofStatus"]>([
  "derived",
  "geometric_proof",
  "empirical",
  "definition_based",
  "conceptual",
]);
const blockTypes = new Set(["text", "latex", "visual"]);
const trimText = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

function normalizeFormulaPlan(
  raw: unknown,
  input: ExplorationInput,
): ExplanationPlan | null {
  const value = asRecord(raw);
  const formula = asRecord(value?.formula);
  if (!value || !formula) return null;
  const variables = (Array.isArray(formula.variables) ? formula.variables : [])
    .map(asRecord)
    .flatMap((variable) => {
      if (!variable) return [];
      const symbol = trimText(variable.symbol, 40);
      const name = trimText(variable.name, 80);
      const meaning = trimText(variable.meaning, 240);
      const unit = trimText(variable.unit, 80);
      if (!symbol || !name || !meaning || !unit) return [];
      const unitNote = trimText(variable.unitNote, 180);
      return [
        {
          symbol,
          name,
          meaning,
          unit,
          ...(unitNote ? { unitNote } : {}),
        },
      ];
    });
  const steps = (Array.isArray(value.steps) ? value.steps : [])
    .slice(0, 5)
    .map(asRecord)
    .flatMap((step, index) => {
      if (!step) return [];
      const narration = trimText(step.narration, 360);
      if (!narration) return [];
      const blocks = (Array.isArray(step.blocks) ? step.blocks : [])
        .map(asRecord)
        .flatMap((block) => {
          if (!block || !blockTypes.has(block.type as string)) return [];
          const content = trimText(block.content, block.type === "latex" ? 240 : 500);
          if (!content || (block.type === "latex" && /[<>]/.test(content))) return [];
          return [{ type: block.type as "text" | "latex" | "visual", content }];
        });
      return [
        {
          id: trimText(step.id, 60) || `step-${index + 1}`,
          narration,
          blocks: blocks.length
            ? blocks
            : [{ type: "text" as const, content: narration }],
          actions: [],
        },
      ];
    });
  const name = trimText(formula.name, 120);
  if (!name || !variables.length || steps.length < 2) return null;
  const candidate = {
    mode: "formula" as const,
    title: trimText(value.title, 90) || name,
    approach: approaches.has(value.approach as ExplanationPlan["approach"])
      ? (value.approach as ExplanationPlan["approach"])
      : ("concept_explanation" as const),
    steps,
    formula: {
      name,
      subject: input.subject,
      topic: trimText(formula.topic, 100) || "Formula interpretation",
      confidence:
        typeof formula.confidence === "number"
          ? Math.max(0, Math.min(1, formula.confidence))
          : 0.6,
      ...(trimText(formula.identityNote, 180)
        ? { identityNote: trimText(formula.identityNote, 180) }
        : {}),
      variables,
      assumptions: (Array.isArray(formula.assumptions) ? formula.assumptions : [])
        .map((item) => trimText(item, 240))
        .filter(Boolean),
      limitations: (Array.isArray(formula.limitations) ? formula.limitations : [])
        .map((item) => trimText(item, 240))
        .filter(Boolean),
      proofStatus: proofStatuses.has(formula.proofStatus as never)
        ? (formula.proofStatus as NonNullable<
            ExplanationPlan["formula"]
          >["proofStatus"])
        : ("conceptual" as const),
    },
  };
  return validatePlan(candidate, "formula");
}

async function requestPlan(
  input: ExplorationInput,
  apiKey: string,
): Promise<ReturnType<typeof validatePlan>> {
  const instruction = buildInstruction(input);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const retry = attempt
        ? " Your previous output failed schema validation. Include every required " +
          "field and return complete valid JSON."
        : "";
      const response = await fetch(createGeminiUrl(apiKey), {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        body: JSON.stringify(createGeminiRequest(instruction + retry, input.mode)),
      });

      if (!response.ok) {
        throw new Error(`Gemini status ${response.status}`);
      }

      const raw = JSON.parse(extractText(await response.json()));
      const plan =
        input.mode === "formula"
          ? normalizeFormulaPlan(raw, input)
          : validatePlan(raw, input.mode);
      if (plan && isReusablePlan(plan, input.canonicalExpression)) return plan;
      if (input.mode === "graph") return null;
    } catch (error) {
      console.error("Gemini exploration attempt failed", error);
    }
  }

  return null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = parseInput(body);

  if (!input) {
    return NextResponse.json(
      { error: "Invalid exploration request." },
      { status: 400 },
    );
  }

  if (input.mode === "formula") {
    const knownFormula = formulaFallback(input);
    if (knownFormula) {
      return NextResponse.json({ plan: knownFormula, source: "verified-local" });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI explanations need GEMINI_API_KEY on the server." },
      { status: 503 },
    );
  }

  const plan = await requestPlan(input, apiKey);
  if (plan) return NextResponse.json({ plan, source: "gemini" });

  if (input.mode === "graph") {
    return NextResponse.json({
      plan: graphFallback(input),
      source: "fallback",
    });
  }

  return NextResponse.json(
    { error: "The AI could not generate this formula lesson. Please retry." },
    { status: 502 },
  );
}
