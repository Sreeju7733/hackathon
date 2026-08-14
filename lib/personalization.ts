import {
  groupStrokes,
  type Candidate,
  type Point,
  type Stroke,
  type Token,
} from "./recognition";

export type HandwritingSample = {
  label: string;
  features: number[];
  strokeCount: number;
  createdAt: number;
};
export type HandwritingProfile = { version: 1; samples: HandwritingSample[] };
export const EMPTY_PROFILE: HandwritingProfile = { version: 1, samples: [] };
const SIZE = 16;

function mark(grid: number[], x: number, y: number) {
  for (let oy = -1; oy <= 1; oy++)
    for (let ox = -1; ox <= 1; ox++) {
      const px = Math.round(x) + ox,
        py = Math.round(y) + oy;
      if (px >= 0 && px < SIZE && py >= 0 && py < SIZE)
        grid[py * SIZE + px] = Math.max(grid[py * SIZE + px], ox || oy ? 0.55 : 1);
    }
}
export function featuresForStrokes(strokes: Stroke[]) {
  const points = strokes.flatMap((s) => s.points);
  if (!points.length) return Array(SIZE * SIZE).fill(0);
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y),
    minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys),
    scale = Math.min(12 / Math.max(1, maxX - minX), 12 / Math.max(1, maxY - minY)),
    offsetX = (SIZE - (maxX - minX) * scale) / 2,
    offsetY = (SIZE - (maxY - minY) * scale) / 2,
    grid = Array(SIZE * SIZE).fill(0);
  const project = (p: Point) => ({
    x: offsetX + (p.x - minX) * scale,
    y: offsetY + (p.y - minY) * scale,
  });
  for (const stroke of strokes) {
    for (let i = 1; i < stroke.points.length; i++) {
      const a = project(stroke.points[i - 1]),
        b = project(stroke.points[i]),
        steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2));
      for (let step = 0; step <= steps; step++)
        mark(
          grid,
          a.x + ((b.x - a.x) * step) / steps,
          a.y + ((b.y - a.y) * step) / steps,
        );
    }
  }
  return grid;
}
const difference = (a: number[], b: number[]) =>
  a.reduce((sum, value, index) => sum + (value - (b[index] || 0)) ** 2, 0) / a.length;
export function personalCandidate(
  strokes: Stroke[],
  profile: HandwritingProfile,
): Candidate | null {
  if (!profile.samples.length) return null;
  const features = featuresForStrokes(strokes);
  let best: HandwritingSample | undefined,
    bestDistance = Infinity;
  for (const sample of profile.samples) {
    if (sample.strokeCount !== strokes.length) continue;
    const d = difference(features, sample.features);
    if (d < bestDistance) {
      best = sample;
      bestDistance = d;
    }
  }
  if (!best || bestDistance > 0.16) return null;
  return {
    value: best.label,
    confidence: Math.max(0.74, 0.98 - bestDistance * 2),
  };
}
export function learnEquation(
  strokes: Stroke[],
  labels: string[],
  profile: HandwritingProfile,
) {
  const groups = groupStrokes(strokes).sort(
    (a, b) =>
      Math.min(...a.map((s) => s.bounds.minX)) -
      Math.min(...b.map((s) => s.bounds.minX)),
  );
  const additions = groups.slice(0, labels.length).map((group, index) => ({
    label: labels[index],
    features: featuresForStrokes(group),
    strokeCount: group.length,
    createdAt: Date.now(),
  }));
  return {
    profile: {
      version: 1 as const,
      samples: [...profile.samples, ...additions].slice(-500),
    },
    saved: additions.length,
  };
}
/**
 * Distil only unambiguous, high-confidence cloud readings into the profile.
 */
export function learnFromGemini(
  strokes: Stroke[],
  canonical: string,
  confidence: number,
  profile: HandwritingProfile,
) {
  const groups = groupStrokes(strokes),
    labels = [...canonical.replace(/\^\([^)]*\)/g, "")].filter((label) =>
      /^[0-9xy=+\-]$/.test(label),
    );
  if (confidence < 0.94 || !labels.length || labels.length !== groups.length)
    return profile;
  return learnEquation(strokes, labels, profile).profile;
}
export function candidateMap(
  strokes: Stroke[],
  tokens: Token[],
  profile: HandwritingProfile,
) {
  const result: Record<string, Candidate> = {};
  for (const token of tokens) {
    const group = strokes.filter((s) => token.strokeIds.includes(s.id)),
      candidate = personalCandidate(group, profile);
    if (candidate) result[token.strokeIds.join("|")] = candidate;
  }
  return result;
}
export function loadProfile() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem("airgraph-handwriting-profile") || "",
    );
    return parsed?.version === 1 && Array.isArray(parsed.samples)
      ? (parsed as HandwritingProfile)
      : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}
export function saveProfile(profile: HandwritingProfile) {
  localStorage.setItem("airgraph-handwriting-profile", JSON.stringify(profile));
}
export const TRAINING_EQUATIONS = [
  "y=x^2",
  "y=2x+1",
  "y=x^3-4",
  "y=5x-6",
  "y=x^2+7",
  "y=8x-9",
  "y=0x+1",
];
export function equationLabels(equation: string) {
  return [...equation.replace(/\s|\^|\{|\}/g, "")].map((value) =>
    value === "*" ? "×" : value === "/" ? "÷" : value,
  );
}
