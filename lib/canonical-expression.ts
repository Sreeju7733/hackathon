const FUNCTIONS = [
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "sqrt",
  "abs",
  "exp",
  "log",
  "ln",
] as const;
const CONSTANTS = new Set(["pi", "e"]);

export type CanonicalExpressionResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/** Normalizes Gemini output into the small mathjs subset the graph supports. */
export function normalizeCanonicalExpression(
  input: unknown,
): CanonicalExpressionResult {
  if (typeof input !== "string")
    return { ok: false, error: "The AI did not return an equation." };

  let value = input
    .trim()
    .replace(/[−–—]/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/,/g, ".")
    .replace(/\s+/g, "")
    .replace(/[XY]/g, (variable) => variable.toLowerCase())
    .toLowerCase();

  let sides = value.split("=");
  if (sides.length === 1) {
    if (value.includes("x") && !value.includes("y")) {
      value = `y=${value}`;
      sides = ["y", sides[0]];
    } else if (value.includes("x") && value.includes("y")) {
      value = `y=-(${value.replace(/\+?y/g, "")})`;
      sides = value.split("=");
      if (sides.length !== 2) {
        value = `${value}=0`;
        sides = [value.slice(0, -2), "0"];
      }
    } else if (value.includes("y") && !value.includes("x")) {
      value = `${value}=0`;
      sides = [value.slice(0, -2), "0"];
    }
  }

  if (sides.length !== 2 || !sides[0] || !sides[1])
    return {
      ok: false,
      error: "The equation must contain one complete equality.",
    };

  if (!sides.every(isSafeGraphSide))
    return {
      ok: false,
      error: "Only supported math functions of x and y are graphable.",
    };

  if (!/[xy]/.test(value))
    return { ok: false, error: "The equation must contain x or y." };

  if (!sides.every(hasBalancedParentheses))
    return { ok: false, error: "The equation has unbalanced parentheses." };

  value = sides.map(normalizeMultiplication).join("=");

  return { ok: true, value };
}

function normalizeMultiplication(expression: string): string {
  const functions = FUNCTIONS.join("|");
  return expression
    .replace(/\bln\b/g, "log")
    .replace(new RegExp(`(\\d|x|y|pi|e|\\))(?=(${functions})\\()`, "g"), "$1*")
    .replace(/(\d|x|y|pi|e|\))(?=\()/g, "$1*")
    .replace(/(\d|x|y|pi|e|\))(?=[xy])/g, "$1*")
    .replace(/(x|y|pi|e|\))(?=\d)/g, "$1*");
}

function isSafeGraphSide(side: string) {
  if (!/^[0-9a-z+\-*/^().]+$/.test(side)) return false;
  const identifiers = side.match(/[a-z]+/g) || [];
  return identifiers.every(
    (identifier) =>
      identifier === "x" ||
      identifier === "y" ||
      CONSTANTS.has(identifier) ||
      FUNCTIONS.includes(identifier as (typeof FUNCTIONS)[number]),
  );
}

function hasBalancedParentheses(expression: string): boolean {
  let depth = 0;
  for (const character of expression) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}
