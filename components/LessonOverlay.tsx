"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconArrowLeft,
  IconPlayerPause,
  IconPlayerPlay,
  IconVolume,
  IconX,
} from "@tabler/icons-react";
import { MathPreview } from "./MathPreview";
import { YouTubeRecommendations } from "./YouTubeRecommendations";
import { GRAPH_HEIGHT, GRAPH_WIDTH, DEFAULT_VIEWPORT, segmentPath } from "../lib/graph";
import { sampleExpression } from "../lib/graph";
import type { ExplanationPlan, LessonStep } from "../lib/explanation";
import { narrator } from "../lib/narration";

type Props = { plan: ExplanationPlan; onClose: () => void };

function getStepDescription(plan: ExplanationPlan, step: LessonStep): string {
  if (plan.mode === "formula") {
    const formulaName = plan.formula?.name || "Formula";
    const proofStatus =
      plan.formula?.proofStatus.replaceAll("_", " ") || "concept explanation";

    return `${formulaName}: ${proofStatus}.`;
  }

  const actionNames = step.actions
    .map((action) => action.type.replaceAll("_", " ").toLowerCase())
    .join(", ");

  return `Visual actions: ${actionNames}.`;
}

function GraphVisual({ expression, step }: { expression?: string; step: LessonStep }) {
  const traces = useMemo(
    () => (expression ? sampleExpression(expression) : []),
    [expression],
  );
  return (
    <div className="lesson-visual graph-lesson-visual">
      <svg
        className="lesson-live-graph"
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        aria-label="Graph changing with this lesson step"
      >
        {Array.from({ length: 17 }, (_, index) => index * 40).map((value) => (
          <line key={`v${value}`} x1={value} x2={value} y1="0" y2={GRAPH_HEIGHT} />
        ))}
        {Array.from({ length: 11 }, (_, index) => index * 40).map((value) => (
          <line key={`h${value}`} x1="0" x2={GRAPH_WIDTH} y1={value} y2={value} />
        ))}
        <line
          className="axis"
          x1="0"
          x2={GRAPH_WIDTH}
          y1={GRAPH_HEIGHT / 2}
          y2={GRAPH_HEIGHT / 2}
        />
        <line
          className="axis"
          x1={GRAPH_WIDTH / 2}
          x2={GRAPH_WIDTH / 2}
          y1="0"
          y2={GRAPH_HEIGHT}
        />
        {traces.map((trace, index) => (
          <path
            key={index}
            className="lesson-curve"
            d={segmentPath(trace, DEFAULT_VIEWPORT)}
          />
        ))}
      </svg>
      <div className="lesson-formula">
        <MathPreview
          latex={
            step.blocks.find((block) => block.type === "latex")?.content ||
            expression ||
            ""
          }
        />
      </div>
    </div>
  );
}

function FormulaVisual({
  step,
  plan,
  index,
}: {
  step: LessonStep;
  plan: ExplanationPlan;
  index: number;
}) {
  return (
    <section className="formula-document">
      <p className="formula-document-kicker">
        {plan.formula?.subject} · {plan.formula?.topic}
      </p>
      {step.blocks.map((block, blockIndex) =>
        block.type === "latex" ? (
          <div
            key={`${block.type}-${blockIndex}`}
            className="formula-document-equation"
          >
            <MathPreview latex={block.content} />
          </div>
        ) : block.type === "visual" ? (
          <p key={`${block.type}-${blockIndex}`} className="formula-document-kicker">
            {block.content}
          </p>
        ) : (
          <p key={`${block.type}-${blockIndex}`} className="formula-document-text">
            {block.content}
          </p>
        ),
      )}
      {plan.formula && (
        <>
          {step.id === plan.steps[0].id && (
            <p className="formula-identity">
              {plan.formula.identityNote ||
                `${plan.formula.name} · ${plan.formula.proofStatus.replaceAll("_", " ")}`}
            </p>
          )}
          {step.id === plan.steps[0].id && plan.formula.variables.length > 0 && (
            <div className="formula-variable-table">
              {plan.formula.variables.map((variable) => (
                <div key={variable.symbol}>
                  <strong>
                    <MathPreview latex={variable.symbol} />
                  </strong>
                  <span>
                    {variable.name} — {variable.meaning}
                  </span>
                  <small>
                    {variable.unit}
                    {variable.unitNote ? ` · ${variable.unitNote}` : ""}
                  </small>
                </div>
              ))}
            </div>
          )}
          {index === plan.steps.length - 1 && (
            <div className="formula-notes">
              <p>
                <strong>Assumptions</strong>
                {plan.formula.assumptions.join(" · ")}
              </p>
              <p>
                <strong>Limits</strong>
                {plan.formula.limitations.join(" · ")}
              </p>
            </div>
          )}
        </>
      )}

      {index === plan.steps.length - 1 && (
        <YouTubeRecommendations plan={plan} />
      )}
    </section>
  );
}

export function LessonOverlay({ plan, onClose }: Props) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [closing, setClosing] = useState(false);
  const step = plan.steps[current];
  const graphExpression =
    step.graphExpression ||
    step.actions.find((action) => action.expression)?.expression;
  const progress = ((current + 1) / plan.steps.length) * 100;

  useEffect(() => {
    if (!playing) return;
    const next = () => {
      if (current < plan.steps.length - 1) setCurrent((value) => value + 1);
      else setPlaying(false);
    };
    void narrator
      .speak(step.narration)
      .then(next)
      .catch(() => setPlaying(false));
    return () => narrator.cancel();
  }, [current, plan.steps.length, playing, step.narration]);

  const select = (index: number) => {
    setPlaying(false);
    setCurrent(index);
  };
  const toggle = () => setPlaying((value) => !value);
  const close = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 190);
  };
  return (
    <div
      className={`lesson-backdrop ${closing ? "is-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-title"
    >
      <section className="lesson-shell">
        <header className="lesson-header">
          <button className="lesson-back" onClick={close}>
            <IconArrowLeft size={18} /> Return to workspace
          </button>
          <p>{plan.approach.replaceAll("_", " ")}</p>
          <button className="lesson-close" aria-label="Close lesson" onClick={close}>
            <IconX size={20} />
          </button>
        </header>
        <div className="lesson-body">
          <main className="lesson-canvas">
            <p className="step-count">
              Step {current + 1} of {plan.steps.length} ·{" "}
              {playing ? "Narrating" : "Paused"}
            </p>
            <div key={step.id} className="lesson-animated">
              {plan.mode === "graph" ? (
                <GraphVisual expression={graphExpression} step={step} />
              ) : (
                <FormulaVisual step={step} plan={plan} index={current} />
              )}
            </div>
            <article className="lesson-copy">
              <h1>{step.narration}</h1>
              <p>{getStepDescription(plan, step)}</p>
            </article>
            <footer className="lesson-controls">
              <button className="speak-button" onClick={toggle}>
                {playing ? <IconPlayerPause size={18} /> : <IconVolume size={18} />}
                {playing ? "Pause narration" : "Continue narration"}
              </button>
              <button
                className="next-step"
                onClick={() => {
                  setPlaying(false);
                  current < plan.steps.length - 1
                    ? setCurrent((value) => value + 1)
                    : close();
                }}
              >
                {current === plan.steps.length - 1 ? (
                  "Finish lesson"
                ) : (
                  <>
                    <IconPlayerPlay size={17} /> Next step
                  </>
                )}
              </button>
            </footer>
          </main>
        </div>
      </section>
    </div>
  );
}
