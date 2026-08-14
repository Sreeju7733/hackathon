import type { RecognitionResult, Stroke } from "./recognition";
import { strokesToPng } from "./stroke-image";
import { normalizeCanonicalExpression } from "./canonical-expression";

type GeminiResult = {
  latex: string;
  canonicalExpression: string;
  confidence: number;
  error?: string;
  recommendedMode?: "graph" | "formula";
  classificationConfidence?: number;
};

export async function recognizeWithGemini(
  strokes: Stroke[],
  signal?: AbortSignal,
): Promise<GeminiResult> {
  const image = strokesToPng(strokes);
  if (!image) throw new Error("No strokes to recognize");
  const response = await fetch("/api/recognize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal,
    body: JSON.stringify({ image }),
  });
  const payload = (await response.json().catch(() => ({}))) as GeminiResult;
  if (!response.ok) throw new Error(payload.error || "AI recognition is unavailable");
  if (!payload.latex) throw new Error("AI returned no readable equation");
  if (
    typeof payload.canonicalExpression !== "string" ||
    !payload.canonicalExpression.trim()
  )
    throw new Error("AI returned no readable expression");
  if (typeof payload.confidence !== "number")
    throw new Error("AI returned an invalid confidence score");
  const normalized = normalizeCanonicalExpression(payload.canonicalExpression);
  return {
    ...payload,
    canonicalExpression: (normalized.ok
      ? normalized.value
      : payload.canonicalExpression.trim()
    ).slice(0, 180),
    recommendedMode: normalized.ok
      ? "graph"
      : payload.recommendedMode === "graph"
        ? "graph"
        : "formula",
    classificationConfidence:
      typeof payload.classificationConfidence === "number"
        ? Math.max(0, Math.min(1, payload.classificationConfidence))
        : normalized.ok
          ? 0.99
          : 0.7,
  };
}

export function applyGeminiResult(
  base: RecognitionResult,
  result: GeminiResult,
): RecognitionResult {
  return {
    ...base,
    latex: result.latex,
    canonicalExpression: result.canonicalExpression,
    confidence: Math.round(Math.max(0, Math.min(1, result.confidence)) * 100),
    unresolvedTokenIds: [],
    valid: true,
    error: undefined,
    recommendedMode: result.recommendedMode,
    graphable: normalizeCanonicalExpression(result.canonicalExpression).ok,
    classificationConfidence: result.classificationConfidence,
  };
}
