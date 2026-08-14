export type Point = { x: number; y: number };
export type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
};
export type Stroke = {
  id: string;
  createdAt: number;
  raw: Point[];
  points: Point[];
  bounds: Bounds;
  erased: boolean;
};
export type Candidate = { value: string; confidence: number };
export type Token = {
  id: string;
  value: string;
  bounds: Bounds;
  strokeIds: string[];
  confidence: number;
  alternatives: Candidate[];
  role: "baseline" | "superscript" | "numerator" | "denominator" | "fraction-bar";
};
export type RecognitionResult = {
  tokens: Token[];
  latex: string;
  canonicalExpression: string;
  confidence: number;
  unresolvedTokenIds: string[];
  valid: boolean;
  error?: string;
  recommendedMode?: "graph" | "formula";
  graphable?: boolean;
  classificationConfidence?: number;
};

export const getBounds = (points: Point[]): Bounds => {
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
};
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export function correctionKey(strokes: Stroke[]) {
  const pts = strokes.flatMap((s) => s.points),
    b = getBounds(pts),
    sample = pts
      .filter((_, i) => i % Math.max(1, Math.floor(pts.length / 18)) === 0)
      .slice(0, 18);
  return (
    `${strokes.length}:` +
    sample
      .map((p) => {
        const normalizedX = Math.round(((p.x - b.minX) / Math.max(1, b.width)) * 8);
        const normalizedY = Math.round(((p.y - b.minY) / Math.max(1, b.height)) * 8);

        return `${normalizedX}${normalizedY}`;
      })
      .join("")
  );
}
const horizontal = (b: Bounds) => b.width > Math.max(16, b.height * 2.6);
const vertical = (b: Bounds) => b.height > Math.max(18, b.width * 2.5);
const union = (items: Bounds[]): Bounds => ({
  minX: Math.min(...items.map((b) => b.minX)),
  maxX: Math.max(...items.map((b) => b.maxX)),
  minY: Math.min(...items.map((b) => b.minY)),
  maxY: Math.max(...items.map((b) => b.maxY)),
  get width() {
    return this.maxX - this.minX;
  },
  get height() {
    return this.maxY - this.minY;
  },
});

function classify(group: Stroke[]): Candidate[] {
  const box = union(group.map((s) => s.bounds)),
    first = group[0],
    p = first.points,
    start = p[0],
    end = p[p.length - 1];
  const closed = dist(start, end) < Math.max(box.width, box.height) * 0.25;
  const tailDown = end.y > box.minY + box.height * 0.78;
  const upperHalf =
    p.filter((q) => q.y < box.minY + box.height * 0.45).length / p.length;
  let result: Candidate[];
  if (group.length === 2 && group.every((s) => horizontal(s.bounds)))
    result = [
      { value: "=", confidence: 0.97 },
      { value: "-", confidence: 0.02 },
    ];
  else if (
    group.length === 2 &&
    group.some((s) => horizontal(s.bounds)) &&
    group.some((s) => vertical(s.bounds))
  )
    result = [
      { value: "+", confidence: 0.92 },
      { value: "4", confidence: 0.06 },
    ];
  else if (group.length === 2)
    result = [
      { value: "x", confidence: 0.91 },
      { value: "×", confidence: 0.07 },
    ];
  else if (horizontal(box))
    result = [
      { value: "-", confidence: 0.98 },
      { value: "=", confidence: 0.01 },
    ];
  else if (closed && box.height > box.width * 1.25 && tailDown)
    result = [
      { value: "y", confidence: 0.9 },
      { value: "9", confidence: 0.06 },
    ];
  else if (closed)
    result = [
      { value: "0", confidence: 0.8 },
      { value: "6", confidence: 0.1 },
      { value: "9", confidence: 0.08 },
    ];
  else if (tailDown && box.height > box.width * 1.35 && upperHalf > 0.28)
    result = [
      { value: "y", confidence: 0.78 },
      { value: "1", confidence: 0.12 },
      { value: "9", confidence: 0.07 },
    ];
  else if (vertical(box))
    result = [
      { value: "1", confidence: 0.82 },
      { value: "y", confidence: 0.1 },
    ];
  else if (box.width > box.height * 0.72)
    result = [
      { value: "2", confidence: 0.7 },
      { value: "z", confidence: 0.15 },
      { value: "x", confidence: 0.08 },
    ];
  else
    result = [
      { value: "y", confidence: 0.56 },
      { value: "1", confidence: 0.22 },
      { value: "2", confidence: 0.12 },
    ];
  return result;
}

export function groupStrokes(strokes: Stroke[]): Stroke[][] {
  const active = strokes.filter((s) => !s.erased),
    used = new Set<string>(),
    pairs: { a: Stroke; b: Stroke; score: number }[] = [];
  for (let i = 0; i < active.length; i++)
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i],
        b = active[j],
        xOverlap = Math.max(
          0,
          Math.min(a.bounds.maxX, b.bounds.maxX) -
            Math.max(a.bounds.minX, b.bounds.minX),
        ),
        yOverlap = Math.max(
          0,
          Math.min(a.bounds.maxY, b.bounds.maxY) -
            Math.max(a.bounds.minY, b.bounds.minY),
        );
      const xRatio = xOverlap / Math.max(1, Math.min(a.bounds.width, b.bounds.width)),
        yRatio = yOverlap / Math.max(1, Math.min(a.bounds.height, b.bounds.height));
      const centerX = Math.abs(
          (a.bounds.minX + a.bounds.maxX - b.bounds.minX - b.bounds.maxX) / 2,
        ),
        centerY = Math.abs(
          (a.bounds.minY + a.bounds.maxY - b.bounds.minY - b.bounds.maxY) / 2,
        );
      const widthRatio =
        Math.min(a.bounds.width, b.bounds.width) /
        Math.max(a.bounds.width, b.bounds.width);
      const equals =
        horizontal(a.bounds) &&
        horizontal(b.bounds) &&
        xRatio > 0.6 &&
        widthRatio > 0.45 &&
        centerY > Math.max(3, Math.min(a.bounds.height, b.bounds.height) * 0.4) &&
        centerY < Math.max(a.bounds.width, b.bounds.width) * 0.42;
      const plus =
        ((horizontal(a.bounds) && vertical(b.bounds)) ||
          (vertical(a.bounds) && horizontal(b.bounds))) &&
        xOverlap > 0 &&
        yOverlap > 0 &&
        centerX < Math.max(a.bounds.width, b.bounds.width) * 0.55;
      const crossed =
        !horizontal(a.bounds) &&
        !horizontal(b.bounds) &&
        xRatio > 0.45 &&
        yRatio > 0.45;
      const joined =
        Math.min(
          dist(a.points[0], b.points[0]),
          dist(a.points[0], b.points.at(-1)!),
          dist(a.points.at(-1)!, b.points[0]),
          dist(a.points.at(-1)!, b.points.at(-1)!),
        ) < Math.max(14, Math.min(a.bounds.height, b.bounds.height) * 0.3);
      if (equals || plus || crossed || joined)
        pairs.push({
          a,
          b,
          score:
            (equals ? 4 : 0) +
            (plus ? 3 : 0) +
            (crossed ? 2 : 0) +
            (joined ? 1 : 0) +
            xRatio +
            yRatio,
        });
    }
  const groups: Stroke[][] = [];
  for (const pair of pairs.sort((a, b) => b.score - a.score)) {
    if (!used.has(pair.a.id) && !used.has(pair.b.id)) {
      groups.push([pair.a, pair.b]);
      used.add(pair.a.id);
      used.add(pair.b.id);
    }
  }
  for (const stroke of active) if (!used.has(stroke.id)) groups.push([stroke]);
  return groups.sort(
    (a, b) => union(a.map((s) => s.bounds)).minX - union(b.map((s) => s.bounds)).minX,
  );
}

export function recognizeStrokes(
  strokes: Stroke[],
  corrections: Record<string, string> = {},
  modelCandidates: Record<string, Candidate[]> = {},
): RecognitionResult {
  const tokens: Token[] = groupStrokes(strokes).map((group, i) => {
    const idKey = group.map((s) => s.id).join("|"),
      key = correctionKey(group);
    let alternatives =
      modelCandidates[idKey]?.filter(
        (c) => typeof c.value === "string" && Number.isFinite(c.confidence),
      ) || [];
    if (!alternatives.length) alternatives = classify(group);
    const corrected = typeof corrections[key] === "string" ? corrections[key] : "";
    const best = alternatives[0] || { value: "?", confidence: 0 };
    return {
      id: `token-${i}`,
      value: corrected || best.value || "?",
      bounds: union(group.map((s) => s.bounds)),
      strokeIds: group.map((s) => s.id),
      confidence: corrected ? 1 : best.confidence,
      alternatives,
      role: "baseline",
    };
  });
  const medianHeight =
    [...tokens].sort((a, b) => a.bounds.height - b.bounds.height)[
      Math.floor(tokens.length / 2)
    ]?.bounds.height || 1;
  const bars = tokens.filter(
    (t) => t.value === "-" && t.bounds.width > medianHeight * 1.15,
  );
  for (const bar of bars) {
    const above = tokens.filter(
      (t) =>
        t !== bar &&
        t.bounds.maxY < bar.bounds.minY + 4 &&
        t.bounds.maxX > bar.bounds.minX &&
        t.bounds.minX < bar.bounds.maxX,
    );
    const below = tokens.filter(
      (t) =>
        t !== bar &&
        t.bounds.minY > bar.bounds.maxY - 4 &&
        t.bounds.maxX > bar.bounds.minX &&
        t.bounds.minX < bar.bounds.maxX,
    );
    if (above.length && below.length) {
      bar.role = "fraction-bar";
      above.forEach((t) => (t.role = "numerator"));
      below.forEach((t) => (t.role = "denominator"));
    }
  }
  const baseline = tokens
    .filter((t) => t.role === "baseline")
    .sort((a, b) => a.bounds.minX - b.bounds.minX);
  for (const token of tokens) {
    const previous = baseline
      .filter((t) => t.bounds.maxX <= token.bounds.minX + 6)
      .at(-1);
    if (
      token.role === "baseline" &&
      previous &&
      token.bounds.maxY < previous.bounds.minY + previous.bounds.height * 0.58 &&
      token.bounds.height < previous.bounds.height * 0.82
    )
      token.role = "superscript";
  }
  const render = (list: Token[]) =>
    list
      .sort((a, b) => a.bounds.minX - b.bounds.minX)
      .map((t) => t.value)
      .join("");
  const fraction = bars.find((b) => b.role === "fraction-bar");
  let latex: string;
  if (fraction) {
    const n = tokens.filter((t) => t.role === "numerator"),
      d = tokens.filter((t) => t.role === "denominator");
    const rest = tokens.filter(
      (t) => !["numerator", "denominator", "fraction-bar"].includes(t.role),
    );
    latex = `${render(rest)}\\frac{${render(n)}}{${render(d)}}`;
  } else {
    latex = baseline
      .filter((t) => t.role === "baseline")
      .map((t) => {
        const supers = tokens.filter(
          (s) =>
            s.role === "superscript" &&
            s.bounds.minX >= t.bounds.maxX - 4 &&
            s.bounds.minX < t.bounds.maxX + t.bounds.width,
        );
        return `${t.value}${supers.length ? `^{${render(supers)}}` : ""}`;
      })
      .join("");
  }
  const unresolved = tokens
    .filter(
      (t) =>
        t.confidence < 0.72 ||
        (t.alternatives[1] &&
          t.alternatives[0].confidence - t.alternatives[1].confidence < 0.18),
    )
    .map((t) => t.id);
  const canonical = latex
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "(($1)/($2))")
    .replace(/\^\{([^}]+)\}/g, "^($1)")
    .replace(/×/g, "*")
    .replace(/÷/g, "/");
  const valid = /^y=/.test(canonical) && !unresolved.length;
  return {
    tokens,
    latex: latex || "",
    canonicalExpression: canonical,
    confidence: tokens.length
      ? Math.round((tokens.reduce((s, t) => s + t.confidence, 0) / tokens.length) * 100)
      : 0,
    unresolvedTokenIds: unresolved,
    valid,
    error: !tokens.length
      ? "Draw an equation"
      : unresolved.length
        ? "Correct the highlighted symbol before adding"
        : "Start with y =",
  };
}
