import {
  recognizeStrokes,
  type Candidate,
  type RecognitionResult,
  type Stroke,
} from "./recognition";
import {
  EMPTY_PROFILE,
  personalCandidate,
  type HandwritingProfile,
} from "./personalization";
let sessionPromise: Promise<import("onnxruntime-web").InferenceSession | null> | null =
  null;
let labelsPromise: Promise<string[]> | null = null;
export async function loadSymbolModel() {
  if (!sessionPromise)
    sessionPromise = import("onnxruntime-web").then(async (ort) => {
      try {
        ort.env.wasm.numThreads = 1;
        return await ort.InferenceSession.create("/models/math-symbols.onnx", {
          executionProviders: ["wasm"],
        });
      } catch (error) {
        console.warn("Symbol model unavailable; using geometric fallback.", error);
        return null;
      }
    });
  return sessionPromise;
}
export async function classifyRaster(
  pixels: Float32Array,
  labels: string[],
): Promise<Candidate[] | null> {
  const [ort, session] = await Promise.all([
    import("onnxruntime-web"),
    loadSymbolModel(),
  ]);
  if (!session) return null;
  const result = await session.run({
    input: new ort.Tensor("float32", pixels, [1, 1, 64, 64]),
  });
  const logits = Array.from(result.logits.data as Float32Array);
  const max = Math.max(...logits),
    exps = logits.map((v) => Math.exp(v - max)),
    sum = exps.reduce((a, b) => a + b, 0);
  return exps
    .map((v, i) => ({ value: labels[i], confidence: v / sum }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}
const glyph: Record<string, string> = {
  times: "×",
  divide: "÷",
  leq: "≤",
  geq: "≥",
  pm: "±",
  sqrt: "√",
  pi: "π",
};
function raster(strokes: Stroke[]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#000";
  c.fillRect(0, 0, 64, 64);
  const points = strokes.flatMap((s) => s.points),
    xs = points.map((p) => p.x),
    ys = points.map((p) => p.y),
    minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys),
    scale = Math.min(48 / Math.max(1, maxX - minX), 48 / Math.max(1, maxY - minY));
  c.strokeStyle = "#fff";
  c.lineWidth = 4;
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const stroke of strokes) {
    c.beginPath();
    stroke.points.forEach((p, i) => {
      const x = 8 + (p.x - minX) * scale,
        y = 8 + (p.y - minY) * scale;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    });
    c.stroke();
  }
  const data = c.getImageData(0, 0, 64, 64).data,
    out = new Float32Array(4096);
  for (let i = 0; i < 4096; i++) out[i] = data[i * 4] / 255;
  return out;
}
export async function recognizeWithLocalModel(
  strokes: Stroke[],
  corrections: Record<string, string>,
  profile: HandwritingProfile = EMPTY_PROFILE,
): Promise<RecognitionResult> {
  const fallback = recognizeStrokes(strokes, corrections);
  if (!strokes.length) return fallback;
  try {
    labelsPromise ??= fetch("/models/labels.json")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
    const labels = await labelsPromise;
    if (!labels.length || !(await loadSymbolModel())) return fallback;
    const candidates: Record<string, Candidate[]> = {};
    for (const token of fallback.tokens) {
      const group = strokes.filter((s) => token.strokeIds.includes(s.id));
      if (!group.length) continue;
      const model = await classifyRaster(raster(group), labels),
        personal = personalCandidate(group, profile),
        merged = (model || [])
          .filter((c) => typeof c.value === "string")
          .map((c) => ({ ...c, value: glyph[c.value] || c.value }));
      if (personal) {
        const existing = merged.find((c) => c.value === personal.value);
        if (existing)
          existing.confidence = Math.max(existing.confidence, personal.confidence);
        else merged.push(personal);
      }
      if (merged.length)
        candidates[token.strokeIds.join("|")] = merged
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 3);
    }
    return recognizeStrokes(strokes, corrections, candidates);
  } catch (error) {
    console.warn("Recognition failed safely.", error);
    return fallback;
  }
}
