import assert from "node:assert/strict";
import test from "node:test";
import { narrator } from "../lib/narration";

test("narrator instantiates with default speech preferences", () => {
  assert.ok(narrator);
  assert.equal(typeof narrator.preferences.rate, "number");
  assert.equal(typeof narrator.preferences.volume, "number");
  assert.ok(narrator.preferences.rate > 0 && narrator.preferences.rate <= 2);
  assert.ok(narrator.preferences.volume >= 0 && narrator.preferences.volume <= 1);
});

test("narrator allows subscription to status changes", () => {
  let callCount = 0;
  const unsubscribe = narrator.subscribe((status, msg) => {
    callCount++;
  });

  assert.equal(typeof unsubscribe, "function");
  unsubscribe();
});

test("narrator handles setPreferences updates cleanly", () => {
  const initialRate = narrator.preferences.rate;
  narrator.setPreferences({ rate: 1.1 });
  assert.equal(narrator.preferences.rate, 1.1);

  // Restore
  narrator.setPreferences({ rate: initialRate });
});
