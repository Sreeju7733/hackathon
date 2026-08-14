import assert from "node:assert/strict";
import test from "node:test";
import { formulaFallback, graphFallback, isReusablePlan } from "../lib/explanation";

test("provides a verified lesson for buoyant force notation", () => {
  const plan = formulaFallback({
    latex: "F=\\rho gV",
    canonicalExpression: "F=ρgV",
    subject: "Physics",
  });
  assert.equal(plan?.formula?.name, "Archimedes’ principle — buoyant force");
  assert.equal(plan?.formula?.variables.length, 4);
  assert.equal(plan?.steps.length, 3);
});

test("provides a verified lesson for Newton's second law", () => {
  const plan = formulaFallback({
    latex: "F=ma",
    canonicalExpression: "F=ma",
    subject: "Physics",
  });
  assert.equal(plan?.formula?.name, "Newton’s second law of motion");
  assert.equal(plan?.formula?.variables.length, 3);
  assert.equal(plan?.steps.length, 3);
});

test("provides a verified lesson for Ohm's law", () => {
  const plan = formulaFallback({
    latex: "V=IR",
    canonicalExpression: "V=I*R",
    subject: "Physics",
  });
  assert.equal(plan?.formula?.name, "Ohm’s law");
  assert.equal(plan?.source, "verified-local");
});

test("builds a translated parabola from its parent function", () => {
  const plan = graphFallback({
    latex: "y=(x-2)^2-4",
    canonicalExpression: "y=(x-2)^2-4",
  });
  assert.equal(plan.steps.length, 4);
  assert.equal(plan.steps[1].graphExpression, "y=x^2");
  assert.equal(plan.steps[2].graphExpression, "y=(x-2)^2");
  assert.equal(plan.steps[3].graphExpression, "y=(x-2)^2-4");
  assert.match(plan.steps[2].narration, /right/);
  assert.match(plan.steps[3].narration, /downward/);
});

test("does not reuse the old one-step graph lesson", () => {
  const stale = {
    mode: "graph" as const,
    title: "Building your graph",
    approach: "concept_explanation" as const,
    steps: [
      {
        id: "final",
        narration: "Here is the graph of your equation.",
        blocks: [{ type: "latex" as const, content: "y=x^2" }],
        actions: [],
        graphExpression: "y=x^2",
      },
    ],
  };
  assert.equal(isReusablePlan(stale, "y=x^2"), false);
  assert.equal(
    isReusablePlan(
      graphFallback({
        latex: "y=(x-2)^2-4",
        canonicalExpression: "y=(x-2)^2-4",
      }),
      "y=(x-2)^2-4",
    ),
    true,
  );
});
