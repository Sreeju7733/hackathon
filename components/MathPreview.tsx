"use client";
import katex from "katex";
import "katex/dist/katex.min.css";
export function MathPreview({ latex }: { latex: string }) {
  let html = "";
  try {
    html = katex.renderToString(String(latex || "").replace(/\?/g, "\\square"), {
      throwOnError: false,
      strict: false,
    });
  } catch {
    html = katex.renderToString("\\square", { throwOnError: false });
  }
  return <span className="math-preview" dangerouslySetInnerHTML={{ __html: html }} />;
}
