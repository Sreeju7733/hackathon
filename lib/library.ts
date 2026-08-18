import type { ExplanationPlan } from "./explanation";
import type { Equation } from "./equations";
import type { Stroke } from "./recognition";

export type LibrarySession = {
  id: string;
  createdAt: string;
  kind: "graph" | "formula";
  latex: string;
  canonicalExpression: string;
  strokes: Stroke[];
  equations?: Equation[];
  explanation?: ExplanationPlan;
};

const KEY = "plotlyx-library-v1";

export function loadLibrary(): LibrarySession[] {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveLibrary(sessions: LibrarySession[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, 100)));
  } catch {
    /* Storage can be unavailable or full. */
  }
}
