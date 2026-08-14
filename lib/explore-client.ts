import type { ExplanationPlan, SceneMode } from "./explanation";

export async function generateExplanation(
  input: {
    latex: string;
    canonicalExpression: string;
    mode: SceneMode;
    subject?: string;
  },
  signal?: AbortSignal,
): Promise<ExplanationPlan> {
  const response = await fetch("/api/explore", {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal,
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.plan)
    throw new Error(payload.error || "Could not prepare an explanation.");
  return payload.plan as ExplanationPlan;
}
