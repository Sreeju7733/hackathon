import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCanonicalExpression } from "../lib/canonical-expression";

test("normalizes graphable Gemini output", () => {
  assert.deepEqual(normalizeCanonicalExpression(" y = −2X(x + 1) "), {
    ok: true,
    value: "y=-2*x*(x+1)",
  });
  assert.deepEqual(normalizeCanonicalExpression("y=1,5x"), {
    ok: true,
    value: "y=1.5*x",
  });
  assert.deepEqual(
    normalizeCanonicalExpression(" (X^2 + Y^2 − 1)^3 = (X)^2 × (Y)^3 "),
    { ok: true, value: "(x^2+y^2-1)^3=(x)^2*(y)^3" },
  );
  assert.deepEqual(normalizeCanonicalExpression("y=cos(x^2)"), {
    ok: true,
    value: "y=cos(x^2)",
  });
  assert.deepEqual(normalizeCanonicalExpression("y=sqrt(abs(x))"), {
    ok: true,
    value: "y=sqrt(abs(x))",
  });
  assert.deepEqual(normalizeCanonicalExpression("3(x^2 + 7y^4)^4 = 7x^4y^8"), {
    ok: true,
    value: "3*(x^2+7*y^4)^4=7*x^4*y^8",
  });
});

test("rejects unsupported and malformed expressions", () => {
  assert.deepEqual(normalizeCanonicalExpression("x^2"), {
    ok: true,
    value: "y=x^2",
  });
  assert.equal(normalizeCanonicalExpression("y=unknown(x)").ok, false);
  assert.equal(normalizeCanonicalExpression("x=y=1").ok, false);
  assert.equal(normalizeCanonicalExpression("x=(y+1").ok, false);
  assert.equal(normalizeCanonicalExpression("1=1").ok, false);
  assert.equal(normalizeCanonicalExpression("unknown+variable").ok, false);
  assert.equal(normalizeCanonicalExpression(null).ok, false);
});
