import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const instruction = [
  "You are an OCR engine for air-drawn mathematics.",
  "The image is only white ink on a black background; ignore anything except the ink.",
  "Read the COMPLETE equation regardless of stroke order.",
  "Correctly interpret multiple strokes as one symbol, =, superscripts/powers,",
  "parentheses, and fractions.",
  "Preserve every unary minus: y=-x^2 must never become y=x^2.",
  "Return JSON with latex, canonicalExpression, confidence, recommendedMode,",
  "and classificationConfidence.",
  "canonicalExpression must be concise mathematical notation, such as y=(x-2)^2-4, F=m*a, or λ=h/p.",
  "Prefer plain notation, but Greek letters, subscripts, fractions, and common mathematical symbols are allowed for formulas.",
  "confidence must be a number from 0 to 1.",
  "Do not explain, guess extra symbols,",
  "or emit markdown.",
].join(" ");
function extractText(payload: unknown): string {
  const candidate = payload as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    }>;
  };
  return (
    candidate.candidates?.[0]?.content?.parts
      ?.filter((part) => !part.thought)
      .map((part) => part.text || "")
      .join("") || ""
  );
}

// Formula text is never executed. Only normalizeCanonicalExpression can admit
// a value to the graph evaluator; this broader transport check lets valid
// scientific notation reach the explanation model.
function isSafeFormulaTransport(value: string) {
  return (
    value.length > 0 && !/[\u0000-\u001f\u007f]/.test(value) && !/[<>&"'`]/.test(value)
  );
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY)
    return NextResponse.json(
      { error: "AI recognition needs GEMINI_API_KEY on the server." },
      { status: 503 },
    );
  try {
    const body = (await request.json()) as { image?: string };
    if (
      typeof body.image !== "string" ||
      !body.image.startsWith("data:image/png;base64,") ||
      body.image.length > 1_800_000
    )
      return NextResponse.json({ error: "Invalid stroke image." }, { status: 400 });
    const base64 = body.image.slice(body.image.indexOf(",") + 1);
    const requestBody = JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: instruction },
            { inline_data: { mime_type: "image/png", data: base64 } },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 160,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            latex: {
              type: "STRING",
              description: "The recognized equation in LaTeX.",
            },
            canonicalExpression: {
              type: "STRING",
              description:
                "A concise mathematical expression. Use plain notation when possible; Greek letters and formula notation are allowed.",
            },
            confidence: {
              type: "NUMBER",
              description: "A number from 0 to 1.",
            },
            recommendedMode: { type: "STRING", enum: ["graph", "formula"] },
            classificationConfidence: {
              type: "NUMBER",
              description: "A number from 0 to 1.",
            },
          },
          required: [
            "latex",
            "canonicalExpression",
            "confidence",
            "recommendedMode",
            "classificationConfidence",
          ],
        },
      },
    });
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      "gemini-3.1-flash-lite:generateContent?key=" +
      encodeURIComponent(process.env.GEMINI_API_KEY);
    const MAX_ATTEMPTS = 2;
    let response: Response | null = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: requestBody,
          signal: AbortSignal.timeout(5_000),
        });
        if (response.ok || response.status === 429) break;
        if (attempt === MAX_ATTEMPTS - 1) break;
      } catch (error) {
        if (attempt === MAX_ATTEMPTS - 1) throw error;
        console.error("Gemini recognition attempt failed, retrying", error);
      }
    }
    if (!response) throw new Error("Gemini returned no response");
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      console.error("Gemini API error", response.status, detail);
      if (response.status === 429)
        return NextResponse.json(
          {
            error:
              "Gemini Flash-Lite quota is reached. Wait for the quota window " +
              "or enable billing, then try again.",
          },
          { status: 429 },
        );
      return NextResponse.json(
        { error: "Gemini could not read the equation." },
        { status: 502 },
      );
    }
    const text = extractText(await response.json());
    if (!text) throw new Error("Gemini returned no structured content");
    const parsed = JSON.parse(text) as {
      latex?: unknown;
      canonicalExpression?: unknown;
      confidence?: unknown;
      recommendedMode?: unknown;
      classificationConfidence?: unknown;
    };
    if (
      typeof parsed.latex !== "string" ||
      typeof parsed.canonicalExpression !== "string" ||
      typeof parsed.confidence !== "number" ||
      (parsed.recommendedMode !== "graph" && parsed.recommendedMode !== "formula") ||
      typeof parsed.classificationConfidence !== "number"
    )
      throw new Error("Malformed Gemini response");
    if (!isSafeFormulaTransport(parsed.canonicalExpression.trim()))
      return NextResponse.json(
        { error: "AI returned unreadable formula notation." },
        { status: 422 },
      );
    return NextResponse.json({
      latex: parsed.latex.slice(0, 240),
      canonicalExpression: parsed.canonicalExpression.trim().slice(0, 180),
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      recommendedMode: parsed.recommendedMode,
      classificationConfidence: Math.max(
        0,
        Math.min(1, parsed.classificationConfidence),
      ),
    });
  } catch (error) {
    console.error("Gemini recognition failed", error);
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      {
        error: timedOut
          ? "AI recognition timed out. The offline recognizer is still available."
          : "Gemini returned an unreadable equation. The offline recognizer is still available.",
      },
      { status: timedOut ? 504 : 502 },
    );
  }
}
