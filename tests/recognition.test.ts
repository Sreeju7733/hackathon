import assert from "node:assert/strict";
import test from "node:test";
import {
  getBounds,
  groupStrokes,
  correctionKey,
  type Point,
  type Stroke,
} from "../lib/recognition";

function createStroke(id: string, points: Point[]): Stroke {
  const bounds = getBounds(points);
  return {
    id,
    createdAt: Date.now(),
    raw: points,
    points,
    bounds,
    erased: false,
  };
}

test("getBounds accurately calculates bounding box dimensions", () => {
  const points: Point[] = [
    { x: 10, y: 20 },
    { x: 50, y: 80 },
    { x: 30, y: 40 },
  ];
  const bounds = getBounds(points);
  assert.equal(bounds.minX, 10);
  assert.equal(bounds.maxX, 50);
  assert.equal(bounds.minY, 20);
  assert.equal(bounds.maxY, 80);
  assert.equal(bounds.width, 40);
  assert.equal(bounds.height, 60);
});

test("correctionKey generates deterministic hash string from stroke geometry", () => {
  const points: Point[] = [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
    { x: 20, y: 20 },
  ];
  const stroke = createStroke("s1", points);
  const key1 = correctionKey([stroke]);
  const key2 = correctionKey([stroke]);

  assert.equal(typeof key1, "string");
  assert.equal(key1, key2);
  assert.ok(key1.startsWith("1:"));
});

test("groupStrokes filters erased strokes and clusters nearby strokes", () => {
  const stroke1 = createStroke("s1", [
    { x: 10, y: 10 },
    { x: 15, y: 15 },
  ]);
  const stroke2 = createStroke("s2", [
    { x: 12, y: 12 },
    { x: 18, y: 18 },
  ]);
  const erasedStroke = {
    ...createStroke("s3", [{ x: 50, y: 50 }]),
    erased: true,
  };

  const groups = groupStrokes([stroke1, stroke2, erasedStroke]);
  assert.ok(groups.length > 0);
  assert.ok(groups.every((group) => group.every((s) => !s.erased)));
});
