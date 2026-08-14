import assert from "node:assert/strict";
import test from "node:test";
import { classifyGesture, GestureStabilizer, type HandPoint } from "../lib/gestures";

function pointPose(): HandPoint[] {
  const landmarks = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  landmarks[9] = { x: 0, y: 1, z: 0 };
  landmarks[5] = { x: 0, y: 1, z: 0 };
  landmarks[6] = { x: 0, y: 1.5, z: 0 };
  landmarks[8] = { x: 0, y: 3, z: 0 };
  landmarks[3] = { x: 1, y: 0, z: 0 };
  landmarks[4] = { x: 2, y: 0, z: 0 };
  for (const [mcp, pip, tip] of [
    [9, 10, 12],
    [13, 14, 16],
    [17, 18, 20],
  ]) {
    landmarks[mcp] = { x: mcp / 20, y: 1, z: 0 };
    landmarks[pip] = { x: mcp / 20, y: 1.2, z: 0 };
    landmarks[tip] = { x: mcp / 20 + 0.1, y: 1, z: 0 };
  }
  return landmarks;
}

function fourFingerPose(): HandPoint[] {
  const landmarks = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  landmarks[9] = { x: 0, y: 1, z: 0 };
  landmarks[3] = { x: 1, y: 0, z: 0 };
  landmarks[4] = { x: 0.5, y: 0, z: 0 };
  for (const [mcp, pip, tip] of [
    [5, 6, 8],
    [9, 10, 12],
    [13, 14, 16],
    [17, 18, 20],
  ]) {
    const x = (mcp - 11) / 16;
    landmarks[mcp] = { x, y: 1, z: 0 };
    landmarks[pip] = { x, y: 1.5, z: 0 };
    landmarks[tip] = { x, y: 3, z: 0 };
  }
  return landmarks;
}

test("3D hand landmarks classify a deliberate index point", () => {
  const landmarks = pointPose();
  assert.equal(classifyGesture(landmarks, landmarks), "point");
});

test("four raised fingers select without an open palm", () => {
  const landmarks = fourFingerPose();
  assert.equal(classifyGesture(landmarks, landmarks), "four-finger");
});

test("gesture stabilization ignores brief pose jitter", () => {
  const stabilizer = new GestureStabilizer();
  assert.equal(stabilizer.update("point", 0), "hover");
  assert.equal(stabilizer.update("hover", 90), "hover");
  assert.equal(stabilizer.update("point", 100), "hover");
  assert.equal(stabilizer.update("point", 281), "point");
});

test("pinch uses hysteresis", () => {
  const stabilizer = new GestureStabilizer();
  assert.equal(stabilizer.updatePinch(0.31), false);
  assert.equal(stabilizer.updatePinch(0.29), true);
  assert.equal(stabilizer.updatePinch(0.4), true);
  assert.equal(stabilizer.updatePinch(0.43), false);
});
