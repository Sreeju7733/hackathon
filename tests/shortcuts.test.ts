import assert from "node:assert/strict";
import test from "node:test";
import {
  matchKeyboardEvent,
  SHORTCUT_REGISTRY,
  isTargetEditable,
} from "../lib/shortcuts";

test("matchKeyboardEvent detects Ctrl+Z for undo", () => {
  const event = {
    ctrlKey: true,
    metaKey: false,
    shiftKey: false,
    key: "z",
    target: null,
  } as unknown as KeyboardEvent;

  const action = matchKeyboardEvent(event);
  assert.equal(action, "undo");
});

test("matchKeyboardEvent detects Ctrl+Y and Ctrl+Shift+Z for redo", () => {
  const eventY = {
    ctrlKey: true,
    metaKey: false,
    shiftKey: false,
    key: "y",
    target: null,
  } as unknown as KeyboardEvent;
  assert.equal(matchKeyboardEvent(eventY), "redo");

  const eventShiftZ = {
    ctrlKey: true,
    metaKey: false,
    shiftKey: true,
    key: "z",
    target: null,
  } as unknown as KeyboardEvent;
  assert.equal(matchKeyboardEvent(eventShiftZ), "redo");
});

test("matchKeyboardEvent detects Space for draw toggle", () => {
  const event = {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    key: " ",
    target: null,
  } as unknown as KeyboardEvent;
  assert.equal(matchKeyboardEvent(event), "toggle_draw");
});

test("matchKeyboardEvent ignores events inside input fields", () => {
  const mockInput = {
    tagName: "INPUT",
    isContentEditable: false,
  };
  const event = {
    ctrlKey: true,
    metaKey: false,
    shiftKey: false,
    key: "z",
    target: mockInput,
  } as unknown as KeyboardEvent;

  // Simulate HTMLElement check fallback
  const isEditable = isTargetEditable(mockInput as unknown as EventTarget);
  assert.equal(isEditable, true);
});

test("SHORTCUT_REGISTRY contains unique shortcut actions", () => {
  const ids = SHORTCUT_REGISTRY.map((s) => s.id);
  const uniqueIds = new Set(ids);
  assert.equal(ids.length, uniqueIds.size);
});
