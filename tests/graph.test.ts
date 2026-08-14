import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_VIEWPORT,
  fitViewport,
  graphPoint,
  panViewport,
  sampleExpression,
  zoomViewport,
} from "../lib/graph";

test("negative equations map below the x axis", () => {
  const traces = sampleExpression("y=-x^2");
  assert.ok(traces.length > 0);
  const point = traces[0].points.at(-1)!;
  assert.ok(graphPoint(point, DEFAULT_VIEWPORT).y > 235);
  assert.ok(fitViewport(traces).spanY >= 20);
});

test("viewport pan and zoom remain bounded", () => {
  const moved = panViewport(DEFAULT_VIEWPORT, 100_000, -100_000);
  assert.equal(moved.centerX, -40);
  assert.equal(moved.centerY, -220);
  assert.equal(zoomViewport(DEFAULT_VIEWPORT, 100).spanX, 14.285714285714286);
});

test("discontinuous functions produce separate traces", () => {
  assert.ok(sampleExpression("y=1/x").length >= 2);
});

test("implicit equations produce a contour that fits the viewport", () => {
  const traces = sampleExpression("(x^2+y^2-1)^3=x^2*y^3");
  const points = traces.flatMap((trace) => trace.points);
  assert.ok(traces.length > 0);
  assert.ok(points.length > 80);
  assert.ok(
    points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)),
  );
  assert.ok(Math.min(...points.map((point) => point.x)) < -0.9);
  assert.ok(Math.max(...points.map((point) => point.x)) > 0.9);
  assert.ok(Math.max(...points.map((point) => point.y)) > 1);
  const viewport = fitViewport(traces);
  assert.ok(viewport.spanX < DEFAULT_VIEWPORT.spanX);
  assert.ok(viewport.spanY < DEFAULT_VIEWPORT.spanY);
});

test("implicit equations with non-finite regions do not produce traces", () => {
  assert.deepEqual(sampleExpression("x=1/0"), []);
});
