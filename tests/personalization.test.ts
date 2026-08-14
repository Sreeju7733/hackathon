import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_PROFILE,
  featuresForStrokes,
  personalCandidate,
  type HandwritingProfile,
} from "../lib/personalization";
import type { Stroke } from "../lib/recognition";

const testStroke: Stroke = {
  points: [
    { x: 10, y: 10 },
    { x: 10, y: 50 },
    { x: 50, y: 50 },
  ],
};

test("EMPTY_PROFILE has version 1 and zero samples", () => {
  assert.equal(EMPTY_PROFILE.version, 1);
  assert.equal(EMPTY_PROFILE.samples.length, 0);
});

test("featuresForStrokes returns 256-dimensional normalized grid", () => {
  const emptyFeatures = featuresForStrokes([]);
  assert.equal(emptyFeatures.length, 256);
  assert.ok(emptyFeatures.every((v) => v === 0));

  const strokeFeatures = featuresForStrokes([testStroke]);
  assert.equal(strokeFeatures.length, 256);
  assert.ok(strokeFeatures.some((v) => v > 0));
});

test("personalCandidate matches high-similarity handwriting profiles", () => {
  const features = featuresForStrokes([testStroke]);
  const customProfile: HandwritingProfile = {
    version: 1,
    samples: [
      {
        label: "L",
        features,
        strokeCount: 1,
        createdAt: Date.now(),
      },
    ],
  };

  const candidate = personalCandidate([testStroke], customProfile);
  assert.ok(candidate);
  assert.equal(candidate.value, "L");
  assert.ok(candidate.confidence >= 0.74);
});

test("personalCandidate returns null when profile is empty", () => {
  const candidate = personalCandidate([testStroke], EMPTY_PROFILE);
  assert.equal(candidate, null);
});
