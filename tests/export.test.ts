import assert from "node:assert/strict";
import test from "node:test";
import { exportToSvg, exportToLatexBundle, exportToDataJson } from "../lib/export";
import type { Equation } from "../lib/equations";
import { DEFAULT_VIEWPORT } from "../lib/graph";

const mockEquations: Equation[] = [
  {
    id: "eq-1",
    latex: "y = x^2",
    canonicalExpression: "y = x^2",
    color: "#2563eb",
    visible: true,
    traces: [
      {
        points: [
          { x: -2, y: 4 },
          { x: 0, y: 0 },
          { x: 2, y: 4 },
        ],
      },
    ],
  },
  {
    id: "eq-2",
    latex: "y = 2x + 1",
    canonicalExpression: "y = 2*x + 1",
    color: "#e05d35",
    visible: false,
    traces: [],
  },
];

test("exportToSvg creates valid SVG XML containing paths and viewBox", () => {
  const svg = exportToSvg(mockEquations, DEFAULT_VIEWPORT, { width: 800, height: 500 });
  assert.match(svg, /<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(svg, /viewBox="0 0 800 500"/);
  assert.match(svg, /stroke="#2563eb"/);
  assert.match(svg, /y = x\^2/);
});

test("exportToSvg respects dark and light themes", () => {
  const darkSvg = exportToSvg(mockEquations, DEFAULT_VIEWPORT, { theme: "dark" });
  const lightSvg = exportToSvg(mockEquations, DEFAULT_VIEWPORT, { theme: "light" });
  assert.match(darkSvg, /#0f172a/);
  assert.match(lightSvg, /#ffffff/);
});

test("exportToLatexBundle serializes only visible equations", () => {
  const latex = exportToLatexBundle(mockEquations);
  assert.match(latex, /\\begin\{aligned\}/);
  assert.match(latex, /y = x\^2/);
  assert.ok(!latex.includes("y = 2x + 1"));
});

test("exportToDataJson outputs valid JSON bundle with version and viewport", () => {
  const raw = exportToDataJson(mockEquations, DEFAULT_VIEWPORT);
  const parsed = JSON.parse(raw);
  assert.equal(parsed.app, "PlotlyX");
  assert.equal(parsed.version, "1.0");
  assert.equal(parsed.equations.length, 2);
  assert.equal(parsed.equations[0].id, "eq-1");
  assert.equal(parsed.viewport.spanX, 20);
});
