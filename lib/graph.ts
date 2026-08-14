import { compile } from "mathjs";

export type TracePoint = { x: number; y: number };
export type TraceSegment = { points: TracePoint[] };
export type GraphViewport = {
  centerX: number;
  centerY: number;
  spanX: number;
  spanY: number;
};

export const GRAPH_WIDTH = 760;
export const GRAPH_HEIGHT = 470;
export const DEFAULT_VIEWPORT: GraphViewport = {
  centerX: 0,
  centerY: 0,
  spanX: 20,
  spanY: 20,
};
const SAMPLE_COUNT = 800;
const MAX_SAMPLE_MAGNITUDE = 1_000;
const IMPLICIT_GRID_SIZE = 180;
const IMPLICIT_DOMAIN = 10;

type Evaluator = (scope: { x: number; y?: number }) => unknown;
type LineSegment = { start: TracePoint; end: TracePoint };

function evaluatorFor(canonical: string): Evaluator | null {
  const [left, right] = canonical.split("=");
  if (left !== "y" || !right) return null;
  try {
    return compile(right).evaluate as Evaluator;
  } catch {
    return null;
  }
}

function finish(segments: TraceSegment[], segment: TraceSegment): TraceSegment {
  if (segment.points.length > 1) segments.push(segment);
  return { points: [] };
}

export function sampleExpression(canonical: string): TraceSegment[] {
  const evaluate = evaluatorFor(canonical);
  if (!evaluate) return sampleImplicitExpression(canonical);
  const segments: TraceSegment[] = [];
  let current: TraceSegment = { points: [] };
  let priorY: number | undefined;

  for (let index = 0; index <= SAMPLE_COUNT; index++) {
    const x = -10 + (20 * index) / SAMPLE_COUNT;
    let y: number;
    try {
      y = Number(evaluate({ x }));
    } catch {
      y = Number.NaN;
    }
    if (!Number.isFinite(y) || Math.abs(y) > MAX_SAMPLE_MAGNITUDE) {
      current = finish(segments, current);
      priorY = undefined;
      continue;
    }
    if (priorY !== undefined && Math.abs(y - priorY) > 80)
      current = finish(segments, current);
    current.points.push({ x, y });
    priorY = y;
  }
  finish(segments, current);
  return segments;
}

function sampleImplicitExpression(canonical: string): TraceSegment[] {
  const sides = canonical.split("=");
  if (sides.length !== 2 || !sides[0] || !sides[1]) return [];

  let left: Evaluator;
  let right: Evaluator;
  try {
    left = compile(sides[0]).evaluate as Evaluator;
    right = compile(sides[1]).evaluate as Evaluator;
  } catch {
    return [];
  }

  const step = (IMPLICIT_DOMAIN * 2) / IMPLICIT_GRID_SIZE;
  const values = Array.from({ length: IMPLICIT_GRID_SIZE + 1 }, (_, yIndex) =>
    Array.from({ length: IMPLICIT_GRID_SIZE + 1 }, (_, xIndex) =>
      evaluateDifference(
        left,
        right,
        -IMPLICIT_DOMAIN + xIndex * step,
        -IMPLICIT_DOMAIN + yIndex * step,
      ),
    ),
  );
  const lines: LineSegment[] = [];

  for (let yIndex = 0; yIndex < IMPLICIT_GRID_SIZE; yIndex++) {
    for (let xIndex = 0; xIndex < IMPLICIT_GRID_SIZE; xIndex++) {
      const x = -IMPLICIT_DOMAIN + xIndex * step;
      const y = -IMPLICIT_DOMAIN + yIndex * step;
      const corners = [
        values[yIndex][xIndex],
        values[yIndex][xIndex + 1],
        values[yIndex + 1][xIndex + 1],
        values[yIndex + 1][xIndex],
      ];
      if (!corners.every(Number.isFinite)) continue;

      const mask = corners.reduce(
        (result, value, index) => result | (value >= 0 ? 1 << index : 0),
        0,
      );
      const pairs = contourPairs(
        mask,
        evaluateDifference(left, right, x + step / 2, y + step / 2),
      );
      if (!pairs.length) continue;
      const edges = contourEdges(corners, x, y, step);
      for (const [start, end] of pairs) {
        if (samePoint(edges[start], edges[end])) continue;
        lines.push({ start: edges[start], end: edges[end] });
      }
    }
  }

  return stitchLines(lines);
}

function evaluateDifference(
  left: Evaluator,
  right: Evaluator,
  x: number,
  y: number,
): number {
  try {
    const value = Number(left({ x, y })) - Number(right({ x, y }));
    // Implicit relations can legitimately have very large values away from
    // their contour. Keeping finite values preserves their sign for marching
    // squares instead of misclassifying a narrow but valid curve as a formula.
    return Number.isFinite(value) ? value : Number.NaN;
  } catch {
    return Number.NaN;
  }
}

function contourPairs(mask: number, center: number): Array<[number, number]> {
  const pairs: Record<number, Array<[number, number]>> = {
    0: [],
    1: [[3, 0]],
    2: [[0, 1]],
    3: [[3, 1]],
    4: [[1, 2]],
    6: [[0, 2]],
    7: [[3, 2]],
    8: [[2, 3]],
    9: [[0, 2]],
    11: [[1, 2]],
    12: [[1, 3]],
    13: [[0, 1]],
    14: [[3, 0]],
    15: [],
  };
  if (mask === 5)
    return center >= 0
      ? [
          [0, 1],
          [2, 3],
        ]
      : [
          [3, 0],
          [1, 2],
        ];
  if (mask === 10)
    return center >= 0
      ? [
          [3, 0],
          [1, 2],
        ]
      : [
          [0, 1],
          [2, 3],
        ];
  return pairs[mask] || [];
}

function contourEdges(
  corners: number[],
  x: number,
  y: number,
  step: number,
): TracePoint[] {
  const points = [
    [
      { x, y },
      { x: x + step, y },
    ],
    [
      { x: x + step, y },
      { x: x + step, y: y + step },
    ],
    [
      { x: x + step, y: y + step },
      { x, y: y + step },
    ],
    [
      { x, y: y + step },
      { x, y },
    ],
  ] as const;
  return points.map(([start, end], index) =>
    interpolate(start, end, corners[index], corners[(index + 1) % 4]),
  );
}

function interpolate(
  start: TracePoint,
  end: TracePoint,
  from: number,
  to: number,
): TracePoint {
  const ratio = from === to ? 0.5 : Math.max(0, Math.min(1, from / (from - to)));
  return {
    x: start.x + (end.x - start.x) * ratio,
    y: start.y + (end.y - start.y) * ratio,
  };
}

function samePoint(first: TracePoint, second: TracePoint): boolean {
  return (
    Math.abs(first.x - second.x) < 0.0000005 && Math.abs(first.y - second.y) < 0.0000005
  );
}

function stitchLines(lines: LineSegment[]): TraceSegment[] {
  const byPoint = new Map<string, number[]>();
  const key = (point: TracePoint) => {
    const coordinate = (value: number) =>
      (Math.abs(value) < 0.0000005 ? 0 : value).toFixed(6);
    return `${coordinate(point.x)},${coordinate(point.y)}`;
  };
  lines.forEach((line, index) => {
    for (const point of [line.start, line.end]) {
      const pointKey = key(point);
      byPoint.set(pointKey, [...(byPoint.get(pointKey) || []), index]);
    }
  });
  const used = new Set<number>();
  const traces: TraceSegment[] = [];

  for (let index = 0; index < lines.length; index++) {
    if (used.has(index)) continue;
    used.add(index);
    const points = [lines[index].start, lines[index].end];
    extend(points, true);
    extend(points, false);
    if (points.length > 1) traces.push({ points });
  }
  return traces;

  function extend(points: TracePoint[], forward: boolean) {
    while (true) {
      const endpoint = forward ? points.at(-1)! : points[0];
      const nextIndex = (byPoint.get(key(endpoint)) || []).find(
        (candidate) => !used.has(candidate),
      );
      if (nextIndex === undefined) return;
      used.add(nextIndex);
      const line = lines[nextIndex];
      const next = key(line.start) === key(endpoint) ? line.end : line.start;
      if (forward) points.push(next);
      else points.unshift(next);
    }
  }
}

export function fitViewport(segments: TraceSegment[]): GraphViewport {
  const points = segments
    .flatMap((segment) => segment.points)
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!points.length) return DEFAULT_VIEWPORT;
  const bounds = {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
  const span = (min: number, max: number, minimum: number, maximum: number) =>
    Math.max(minimum, Math.min(maximum, (max - min) * 1.2));
  return {
    centerX: (bounds.minX + bounds.maxX) / 2,
    centerY: (bounds.minY + bounds.maxY) / 2,
    spanX: span(bounds.minX, bounds.maxX, 4, 80),
    spanY: span(bounds.minY, bounds.maxY, 4, 220),
  };
}

export function panViewport(
  viewport: GraphViewport,
  dx: number,
  dy: number,
  width = GRAPH_WIDTH,
  height = GRAPH_HEIGHT,
): GraphViewport {
  return {
    ...viewport,
    centerX: Math.max(
      -40,
      Math.min(40, viewport.centerX - (dx * viewport.spanX) / width),
    ),
    centerY: Math.max(
      -220,
      Math.min(220, viewport.centerY + (dy * viewport.spanY) / height),
    ),
  };
}

export function zoomViewport(viewport: GraphViewport, factor: number): GraphViewport {
  const safeFactor = Math.max(0.7, Math.min(1.4, factor));
  return {
    ...viewport,
    spanX: Math.max(2, Math.min(80, viewport.spanX / safeFactor)),
    spanY: Math.max(2, Math.min(440, viewport.spanY / safeFactor)),
  };
}

export function graphPoint(point: TracePoint, viewport: GraphViewport) {
  return {
    x: ((point.x - viewport.centerX) / viewport.spanX + 0.5) * GRAPH_WIDTH,
    y: (0.5 - (point.y - viewport.centerY) / viewport.spanY) * GRAPH_HEIGHT,
  };
}

export function segmentPath(segment: TraceSegment, viewport: GraphViewport) {
  const points = segment.points.map((point) => graphPoint(point, viewport));
  if (points.length < 3)
    return points
      .map(
        (point, index) =>
          `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`,
      )
      .join(" ");
  // Midpoint quadratic spline: smooth at the renderer edge while preserving
  // the sampled contour and discontinuity boundaries from the evaluator.
  let path = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let index = 1; index < points.length - 1; index++) {
    const point = points[index];
    const next = points[index + 1];
    const midX = (point.x + next.x) / 2;
    const midY = (point.y + next.y) / 2;
    path += ` Q${point.x.toFixed(1)},${point.y.toFixed(1)} ${midX.toFixed(1)},${midY.toFixed(1)}`;
  }
  const last = points.at(-1)!;
  return `${path} L${last.x.toFixed(1)},${last.y.toFixed(1)}`;
}
