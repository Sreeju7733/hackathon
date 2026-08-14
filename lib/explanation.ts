export const GRAPH_ACTIONS = [
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
] as const;
export type SceneMode = "graph" | "formula";
export const EXPLANATION_QUALITY_VERSION = 2;
export type LessonSource = "gemini" | "verified-local" | "deterministic-graph";
export type LessonBlock = {
  type: "text" | "latex" | "visual";
  content: string;
};
export type LessonAction = {
  type: (typeof GRAPH_ACTIONS)[number];
  expression?: string;
  objectId?: string;
  translationX?: number;
  translationY?: number;
};
export type LessonStep = {
  id: string;
  narration: string;
  blocks: LessonBlock[];
  actions: LessonAction[];
  graphExpression?: string;
};
export type FormulaVariable = {
  symbol: string;
  name: string;
  meaning: string;
  unit: string;
  unitNote?: string;
};
export type FormulaMetadata = {
  name: string;
  subject: string;
  topic: string;
  confidence: number;
  identityNote?: string;
  variables: FormulaVariable[];
  assumptions: string[];
  limitations: string[];
  proofStatus:
    | "derived"
    | "geometric_proof"
    | "empirical"
    | "definition_based"
    | "conceptual";
};
export type ExplanationPlan = {
  mode: SceneMode;
  title: string;
  approach:
    | "derivation"
    | "geometric_proof"
    | "concept_explanation"
    | "empirical_law"
    | "dimensional_explanation"
    | "worked_example";
  steps: LessonStep[];
  formula?: FormulaMetadata;
  qualityVersion?: number;
  source?: LessonSource;
};

const isString = (value: unknown, max = 500): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
const safeLatex = (value: unknown) => isString(value, 240) && !/[<>]/.test(value);
const safeExpression = (value: unknown) =>
  typeof value === "string" &&
  value.length <= 180 &&
  /^[0-9a-zA-Z+\-*/^=()., ]+$/.test(value);
const approaches = [
  "derivation",
  "geometric_proof",
  "concept_explanation",
  "empirical_law",
  "dimensional_explanation",
  "worked_example",
] as const;
const proofStatuses = [
  "derived",
  "geometric_proof",
  "empirical",
  "definition_based",
  "conceptual",
] as const;

export function validatePlan(
  value: unknown,
  expectedMode: SceneMode,
): ExplanationPlan | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const max = expectedMode === "formula" ? 5 : 8;
  if (
    raw.mode !== expectedMode ||
    !isString(raw.title, 90) ||
    !approaches.includes(raw.approach as (typeof approaches)[number]) ||
    !Array.isArray(raw.steps) ||
    raw.steps.length < 1 ||
    raw.steps.length > max
  )
    return null;
  const stepIds = new Set<string>();
  const objectIds = new Set<string>();
  const steps: LessonStep[] = [];
  for (const entry of raw.steps) {
    if (!entry || typeof entry !== "object") return null;
    const step = entry as Record<string, unknown>;
    if (
      !isString(step.id, 60) ||
      stepIds.has(step.id) ||
      !isString(step.narration, 360) ||
      !Array.isArray(step.blocks) ||
      (expectedMode === "graph" && !Array.isArray(step.actions))
    )
      return null;
    stepIds.add(step.id);
    const blocks: LessonBlock[] = [];
    for (const entry of step.blocks) {
      if (!entry || typeof entry !== "object") return null;
      const block = entry as Record<string, unknown>;
      if (
        !(block.type === "text" || block.type === "latex" || block.type === "visual") ||
        !isString(block.content, 500) ||
        (block.type === "latex" && !safeLatex(block.content))
      )
        return null;
      blocks.push({ type: block.type, content: block.content });
    }
    const actions: LessonAction[] = [];
    for (const entry of Array.isArray(step.actions) ? step.actions : []) {
      if (!entry || typeof entry !== "object") return null;
      const action = entry as Record<string, unknown>;
      const type = action.type as LessonAction["type"];
      if (
        !GRAPH_ACTIONS.includes(type) ||
        (action.expression !== undefined && !safeExpression(action.expression)) ||
        (action.objectId !== undefined && !isString(action.objectId, 60))
      )
        return null;
      if (
        [action.translationX, action.translationY].some(
          (n) =>
            n !== undefined &&
            (typeof n !== "number" || !Number.isFinite(n) || Math.abs(n) > 100),
        )
      )
        return null;
      if (
        type === "ADD_EXPRESSION" &&
        (!action.expression ||
          !action.objectId ||
          objectIds.has(action.objectId as string))
      )
        return null;
      if (
        [
          "DRAW_BASE_GRAPH",
          "TRANSFORM_GRAPH",
          "HIGHLIGHT_GRAPH",
          "REMOVE_EXPRESSION",
          "FADE_OBJECT",
        ].includes(type) &&
        !action.objectId
      )
        return null;
      if (type === "ADD_EXPRESSION") objectIds.add(action.objectId as string);
      actions.push({
        type,
        ...(typeof action.expression === "string"
          ? { expression: action.expression }
          : {}),
        ...(typeof action.objectId === "string" ? { objectId: action.objectId } : {}),
        ...(typeof action.translationX === "number"
          ? { translationX: action.translationX }
          : {}),
        ...(typeof action.translationY === "number"
          ? { translationY: action.translationY }
          : {}),
      });
    }
    if (step.graphExpression !== undefined && !safeExpression(step.graphExpression))
      return null;
    steps.push({
      id: step.id,
      narration: step.narration,
      blocks,
      actions,
      ...(typeof step.graphExpression === "string"
        ? { graphExpression: step.graphExpression }
        : {}),
    });
  }
  let formula: FormulaMetadata | undefined;
  if (expectedMode === "formula") {
    if (!raw.formula || typeof raw.formula !== "object") return null;
    const meta = raw.formula as Record<string, unknown>;
    if (
      !isString(meta.name, 120) ||
      !isString(meta.subject, 60) ||
      !isString(meta.topic, 100) ||
      typeof meta.confidence !== "number" ||
      !proofStatuses.includes(meta.proofStatus as (typeof proofStatuses)[number]) ||
      !Array.isArray(meta.variables) ||
      !Array.isArray(meta.assumptions) ||
      !Array.isArray(meta.limitations)
    )
      return null;
    const variables: FormulaVariable[] = [];
    for (const entry of meta.variables) {
      if (!entry || typeof entry !== "object") return null;
      const variable = entry as Record<string, unknown>;
      if (
        !isString(variable.symbol, 40) ||
        !isString(variable.name, 80) ||
        !isString(variable.meaning, 240) ||
        !isString(variable.unit, 80) ||
        (variable.unitNote !== undefined && !isString(variable.unitNote, 180))
      )
        return null;
      variables.push({
        symbol: variable.symbol,
        name: variable.name,
        meaning: variable.meaning,
        unit: variable.unit,
        ...(typeof variable.unitNote === "string"
          ? { unitNote: variable.unitNote }
          : {}),
      });
    }
    if (
      !meta.assumptions.every((item) => isString(item, 240)) ||
      !meta.limitations.every((item) => isString(item, 240))
    )
      return null;
    formula = {
      name: meta.name,
      subject: meta.subject,
      topic: meta.topic,
      confidence: Math.max(0, Math.min(1, meta.confidence)),
      ...(typeof meta.identityNote === "string"
        ? { identityNote: meta.identityNote }
        : {}),
      variables,
      assumptions: meta.assumptions,
      limitations: meta.limitations,
      proofStatus: meta.proofStatus as FormulaMetadata["proofStatus"],
    };
  }
  return {
    mode: expectedMode,
    title: raw.title,
    approach: raw.approach as ExplanationPlan["approach"],
    steps,
    ...(formula ? { formula } : {}),
    qualityVersion: EXPLANATION_QUALITY_VERSION,
    source: "gemini",
  };
}

const compactExpression = (value: string) => value.replace(/\s/g, "").toLowerCase();

export function isReusablePlan(plan: ExplanationPlan, expression: string): boolean {
  if (plan.mode === "graph") {
    if (plan.steps.length < 2) return false;
    const expressions = plan.steps
      .map((step) => step.graphExpression)
      .filter((item): item is string => Boolean(item));
    return (
      expressions.length >= 2 &&
      compactExpression(expressions[expressions.length - 1]) ===
        compactExpression(expression)
    );
  }
  return Boolean(
    plan.formula && plan.formula.variables.length > 0 && plan.steps.length >= 2,
  );
}

export function upgradePlan(plan: ExplanationPlan): ExplanationPlan {
  return {
    ...plan,
    qualityVersion: EXPLANATION_QUALITY_VERSION,
    source: plan.source || "gemini",
  };
}

export function graphFallback(input: {
  latex: string;
  canonicalExpression: string;
}): ExplanationPlan {
  const expression = input.canonicalExpression.replace(/\s/g, "");
  const quadratic = expression.match(
    /^y=\(x([+-]\d+(?:\.\d+)?)?\)\^2([+-]\d+(?:\.\d+)?)?$/,
  );
  const steps: LessonStep[] = [
    {
      id: "axes",
      narration:
        "Start with the coordinate axes. We will build the final curve from a familiar parent function so every change has a visible meaning.",
      blocks: [{ type: "text", content: "Set up the coordinate plane." }],
      actions: [{ type: "SHOW_AXES" }, { type: "SHOW_GRID" }],
    },
  ];

  if (quadratic) {
    const innerOffset = Number(quadratic[1] || 0);
    const horizontal = -innerOffset;
    const vertical = Number(quadratic[2] || 0);
    steps.push({
      id: "parent-parabola",
      narration:
        "First draw the parent function y equals x squared. Its vertex is at the origin and it opens upward.",
      blocks: [
        { type: "latex", content: "y=x^2" },
        { type: "text", content: "This parent parabola is the starting shape." },
      ],
      actions: [
        { type: "ADD_EXPRESSION", expression: "y=x^2", objectId: "parabola" },
        { type: "DRAW_BASE_GRAPH", objectId: "parabola" },
      ],
      graphExpression: "y=x^2",
    });
    let current = "y=x^2";
    if (horizontal) {
      current = `y=(x${innerOffset < 0 ? "-" : "+"}${Math.abs(innerOffset)})^2`;
      steps.push({
        id: "horizontal-shift",
        narration: `Replacing x with x ${horizontal < 0 ? "+" : "minus"} ${Math.abs(horizontal)} moves every point ${Math.abs(horizontal)} unit${Math.abs(horizontal) === 1 ? "" : "s"} ${horizontal < 0 ? "left" : "right"}.`,
        blocks: [
          { type: "latex", content: current },
          {
            type: "text",
            content:
              "Changes inside the parentheses move the graph horizontally in the opposite direction of the sign.",
          },
        ],
        actions: [
          {
            type: "TRANSFORM_GRAPH",
            objectId: "parabola",
            translationX: horizontal,
          },
        ],
        graphExpression: current,
      });
    }
    if (vertical) {
      steps.push({
        id: "vertical-shift",
        narration: `${vertical < 0 ? "Subtracting" : "Adding"} ${Math.abs(vertical)} outside the square shifts every point ${Math.abs(vertical)} unit${Math.abs(vertical) === 1 ? "" : "s"} ${vertical < 0 ? "downward" : "upward"}. This creates the final graph.`,
        blocks: [
          { type: "latex", content: input.latex },
          {
            type: "text",
            content: "Changes outside the function move the graph vertically.",
          },
        ],
        actions: [
          {
            type: "TRANSFORM_GRAPH",
            objectId: "parabola",
            translationY: vertical,
          },
          { type: "HIGHLIGHT_GRAPH", objectId: "parabola" },
        ],
        graphExpression: expression,
      });
    } else if (horizontal) {
      steps.push({
        id: "final-graph",
        narration:
          "That horizontal translation is the final graph. The parabola keeps its shape because only its position changed.",
        blocks: [{ type: "latex", content: input.latex }],
        actions: [{ type: "HIGHLIGHT_GRAPH", objectId: "parabola" }],
        graphExpression: expression,
      });
    }
    return {
      mode: "graph",
      title: "Constructing the parabola",
      approach: "concept_explanation",
      qualityVersion: EXPLANATION_QUALITY_VERSION,
      source: "deterministic-graph",
      steps,
    };
  }

  const parent = expression.includes("sin(")
    ? "y=sin(x)"
    : expression.includes("cos(")
      ? "y=cos(x)"
      : expression.includes("tan(")
        ? "y=tan(x)"
        : expression.includes("abs(")
          ? "y=abs(x)"
          : expression.includes("sqrt(")
            ? "y=sqrt(x)"
            : expression.includes("^3")
              ? "y=x^3"
              : "y=x";
  steps.push({
    id: "parent-function",
    narration: `First draw the parent function ${parent.replace("=", " equals ")}. It gives us the base shape before applying the details of your equation.`,
    blocks: [{ type: "latex", content: parent }],
    actions: [
      { type: "ADD_EXPRESSION", expression: parent, objectId: "parent" },
      { type: "DRAW_BASE_GRAPH", objectId: "parent" },
    ],
    graphExpression: parent,
  });
  steps.push({
    id: "final-expression",
    narration: `Now apply the complete rule ${input.latex}. The graph morphs from the parent shape into the final relationship, so you can compare what the equation changes.`,
    blocks: [
      { type: "latex", content: input.latex },
      {
        type: "text",
        content:
          "Compare this curve with the parent function to see the effect of the added terms and composition.",
      },
    ],
    actions: [
      { type: "TRANSFORM_GRAPH", objectId: "parent" },
      { type: "HIGHLIGHT_GRAPH", objectId: "parent" },
    ],
    graphExpression: expression,
  });
  return {
    mode: "graph",
    title: "Building the graph from a parent function",
    approach: "concept_explanation",
    qualityVersion: EXPLANATION_QUALITY_VERSION,
    source: "deterministic-graph",
    steps,
  };
}

export function formulaFallback(input: {
  latex: string;
  canonicalExpression: string;
  subject?: string;
}): ExplanationPlan | null {
  const compact = input.canonicalExpression
    .toLowerCase()
    .replace(/[\s*·×]/g, "")
    .replace(/rho/g, "ρ");
  if (/^f=ma$/.test(compact)) {
    return {
      mode: "formula",
      title: "Newton’s second law",
      approach: "derivation",
      qualityVersion: EXPLANATION_QUALITY_VERSION,
      source: "verified-local",
      formula: {
        name: "Newton’s second law of motion",
        subject: input.subject || "Physics",
        topic: "Classical mechanics",
        confidence: 0.99,
        identityNote:
          "For constant mass, the net force on an object equals its mass times its acceleration.",
        proofStatus: "definition_based",
        variables: [
          {
            symbol: "F",
            name: "net force",
            meaning: "The vector sum of all forces acting on the object",
            unit: "N",
          },
          {
            symbol: "m",
            name: "mass",
            meaning: "The object’s resistance to changes in motion",
            unit: "kg",
          },
          {
            symbol: "a",
            name: "acceleration",
            meaning: "Rate of change of velocity",
            unit: "m/s²",
          },
        ],
        assumptions: [
          "Mass is constant in the chosen reference frame",
          "F represents the net external force, not one force among many",
          "Speeds are far below the speed of light",
        ],
        limitations: [
          "For changing mass, use the momentum form F equals dp divided by dt",
          "Relativistic motion requires relativistic momentum",
        ],
      },
      steps: [
        {
          id: "net-force",
          narration:
            "Newton’s second law connects the net force on an object to how its motion changes. Only the combined, or net, force determines the acceleration.",
          blocks: [
            { type: "latex", content: input.latex },
            {
              type: "text",
              content:
                "Forces in opposite directions partially cancel, so use their vector sum before applying the law.",
            },
          ],
          actions: [],
        },
        {
          id: "units",
          narration:
            "A newton is the force needed to accelerate one kilogram by one metre per second squared. The units make F equals m a dimensionally consistent.",
          blocks: [
            { type: "latex", content: "1\,N=1\,kg\cdot m/s^2" },
            {
              type: "text",
              content:
                "Multiplying kilograms by metres per second squared gives kg metres per second squared: one newton.",
            },
          ],
          actions: [],
        },
        {
          id: "example",
          narration:
            "For example, a two kilogram cart with a net force of six newtons accelerates at three metres per second squared.",
          blocks: [
            { type: "latex", content: "a=F/m=6\,N/2\,kg=3\,m/s^2" },
            {
              type: "text",
              content:
                "Doubling the net force doubles acceleration; doubling the mass halves it when the force stays fixed.",
            },
          ],
          actions: [],
        },
      ],
    };
  }
  if (/^v=ir$/.test(compact)) {
    return {
      mode: "formula",
      title: "Ohm’s law",
      approach: "empirical_law",
      qualityVersion: EXPLANATION_QUALITY_VERSION,
      source: "verified-local",
      formula: {
        name: "Ohm’s law",
        subject: input.subject || "Physics",
        topic: "Electric circuits",
        confidence: 0.99,
        identityNote:
          "For an ohmic component at approximately constant temperature, voltage equals current times resistance.",
        proofStatus: "empirical",
        variables: [
          {
            symbol: "V",
            name: "voltage",
            meaning: "Electric potential difference across the component",
            unit: "V",
          },
          {
            symbol: "I",
            name: "current",
            meaning: "Rate of electric charge flow",
            unit: "A",
          },
          {
            symbol: "R",
            name: "resistance",
            meaning: "Opposition to electric current",
            unit: "Ω",
          },
        ],
        assumptions: [
          "The component behaves approximately ohmically",
          "Temperature is approximately constant",
        ],
        limitations: [
          "Diodes, lamps, and many semiconductors are not ohmic over all operating ranges",
          "Resistance often changes with temperature",
        ],
      },
      steps: [
        {
          id: "relationship",
          narration:
            "Ohm’s law says that the voltage across an ohmic component is proportional to the current through it. Resistance is the constant of proportionality.",
          blocks: [
            { type: "latex", content: input.latex },
            {
              type: "text",
              content:
                "For a fixed resistance, increasing voltage increases current by the same factor.",
            },
          ],
          actions: [],
        },
        {
          id: "units",
          narration:
            "One ohm is one volt per ampere, so volts equal amperes times ohms. This confirms that the units in the equation agree.",
          blocks: [
            { type: "latex", content: "1\\,Ω=1\\,V/A" },
            {
              type: "text",
              content: "Use volts for V, amperes for I, and ohms for R.",
            },
          ],
          actions: [],
        },
        {
          id: "example",
          narration:
            "A twelve volt source across a four ohm resistor produces three amperes of current: current equals voltage divided by resistance.",
          blocks: [
            { type: "latex", content: "I=V/R=12\\,V/4\\,Ω=3\\,A" },
            {
              type: "text",
              content:
                "Doubling resistance halves the current when voltage stays fixed.",
            },
          ],
          actions: [],
        },
      ],
    };
  }
  if (!/^f=ρgv$/.test(compact)) return null;
  return {
    mode: "formula",
    title: "Buoyant force",
    approach: "empirical_law",
    qualityVersion: EXPLANATION_QUALITY_VERSION,
    source: "verified-local",
    formula: {
      name: "Archimedes’ principle — buoyant force",
      subject: input.subject || "Physics",
      topic: "Buoyancy and fluid statics",
      confidence: 0.98,
      identityNote:
        "This gives the magnitude of the buoyant force when V is the displaced-fluid volume.",
      proofStatus: "derived",
      variables: [
        {
          symbol: "F",
          name: "buoyant force",
          meaning: "Upward force exerted by the fluid",
          unit: "N",
        },
        {
          symbol: "\\rho",
          name: "fluid density",
          meaning: "Mass per unit volume of the surrounding fluid",
          unit: "kg/m³",
        },
        {
          symbol: "g",
          name: "gravitational acceleration",
          meaning: "Local acceleration due to gravity",
          unit: "m/s²",
        },
        {
          symbol: "V",
          name: "displaced volume",
          meaning: "Volume of fluid displaced by the object",
          unit: "m³",
        },
      ],
      assumptions: [
        "The fluid is approximately uniform in density",
        "V is the displaced-fluid volume",
        "Gravity is approximately constant",
      ],
      limitations: [
        "For a floating object, the displaced volume adjusts until forces balance",
        "Density can vary significantly in compressible or stratified fluids",
      ],
    },
    steps: [
      {
        id: "principle",
        narration:
          "This is Archimedes’ principle. A fluid pushes upward on an object by an amount equal to the weight of the fluid it displaces.",
        blocks: [
          { type: "latex", content: input.latex },
          {
            type: "text",
            content:
              "The buoyant force is caused by greater pressure on the bottom of an immersed object than on its top.",
          },
        ],
        actions: [],
      },
      {
        id: "density",
        narration: "Density times displaced volume gives the mass of displaced fluid.",
        blocks: [
          { type: "latex", content: "m=\\rho V" },
          {
            type: "text",
            content:
              "Here rho is the fluid density, so rho V is the mass of the displaced fluid.",
          },
        ],
        actions: [],
      },
      {
        id: "weight",
        narration:
          "Multiplying that mass by gravitational acceleration gives its weight, which is the buoyant force magnitude.",
        blocks: [
          { type: "latex", content: "F=mg=\\rho gV" },
          {
            type: "text",
            content:
              "For example, displacing more water increases the upward force in direct proportion.",
          },
        ],
        actions: [],
      },
    ],
  };
}
