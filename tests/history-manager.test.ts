import assert from "node:assert/strict";
import test from "node:test";
import { HistoryManager } from "../lib/history-manager";
import type { Stroke } from "../lib/recognition";

const strokeA: Stroke = { points: [{ x: 10, y: 10, t: 100 }] };
const strokeB: Stroke = { points: [{ x: 20, y: 20, t: 200 }] };
const strokeC: Stroke = { points: [{ x: 30, y: 30, t: 300 }] };

test("HistoryManager initializes with empty state or given strokes", () => {
  const manager = new HistoryManager();
  assert.equal(manager.current.length, 0);
  assert.equal(manager.canUndo, false);
  assert.equal(manager.canRedo, false);

  const managerWithInit = new HistoryManager([strokeA]);
  assert.equal(managerWithInit.current.length, 1);
  assert.equal(managerWithInit.canUndo, false);
});

test("HistoryManager supports basic push and undo cycle", () => {
  const manager = new HistoryManager();
  manager.push([strokeA]);
  manager.push([strokeA, strokeB]);

  assert.equal(manager.current.length, 2);
  assert.equal(manager.canUndo, true);

  const undone = manager.undo();
  assert.ok(undone);
  assert.equal(undone.length, 1);
  assert.equal(manager.canRedo, true);

  const redone = manager.redo();
  assert.ok(redone);
  assert.equal(redone.length, 2);
});

test("HistoryManager clears future branch when pushing new state after undo", () => {
  const manager = new HistoryManager();
  manager.push([strokeA]);
  manager.push([strokeA, strokeB]);
  manager.undo();

  assert.equal(manager.canRedo, true);
  manager.push([strokeA, strokeC]);
  assert.equal(manager.canRedo, false);
  assert.equal(manager.current.length, 2);
});

test("HistoryManager respects maxDepth limit", () => {
  const manager = new HistoryManager([], 3);
  manager.push([strokeA]);
  manager.push([strokeA, strokeB]);
  manager.push([strokeB]);
  manager.push([strokeC]);

  assert.equal(manager.depth.past, 3);
});
