import type { TraceSegment } from "./graph";

export type Equation = {
  id: string;
  latex: string;
  canonicalExpression: string;
  color: string;
  visible: boolean;
  traces: TraceSegment[];
};

export const EQUATION_COLORS = ["#2563eb", "#e05d35", "#15803d", "#9333ea", "#0891b2"];

export function toLatex(canonical: string): string {
  return canonical
    .replace(/\^\(([^()]+)\)/g, "^{$1}")
    .replace(/\^(\d+)/g, "^{$1}")
    .replace(/\*/g, "\\cdot ");
}

export function getLastVisibleEquation(equations: Equation[]): Equation | undefined {
  return (
    [...equations].reverse().find((equation) => equation.visible) ?? equations.at(-1)
  );
}

export function getNumberSlots(equation?: Equation): RegExpMatchArray[] {
  return equation ? [...equation.canonicalExpression.matchAll(/\d+(?:\.\d+)?/g)] : [];
}

export function updateEquationNumber(
  equation: Equation,
  slot: RegExpMatchArray,
  delta: number,
): string | null {
  if (slot.index === undefined) return null;

  const nextValue = Number(slot[0]) + delta;
  return (
    `${equation.canonicalExpression.slice(0, slot.index)}${nextValue}` +
    equation.canonicalExpression.slice(slot.index + slot[0].length)
  );
}

export function getGraphPaths(equations: Equation[]) {
  return equations
    .filter((equation) => equation.visible)
    .flatMap((equation) =>
      equation.traces.map((trace, index) => ({
        key: `${equation.id}-${index}`,
        color: equation.color,
        trace,
      })),
    );
}
