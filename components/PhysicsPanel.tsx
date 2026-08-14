"use client";

import {
  IconChartLine,
  IconPlayerPause,
  IconPlayerPlay,
  IconVolume,
} from "@tabler/icons-react";
import { MathPreview } from "./MathPreview";
import { YouTubeRecommendations } from "./YouTubeRecommendations";
import type { ExplanationPlan } from "../lib/explanation";

export function PhysicsPanel({
  plan,
  activeStep,
  playing,
  status,
  defaultSubject,
  onPlay,
  onNext,
  graphable,
  onPlotGraph,
}: {
  plan: ExplanationPlan | null;
  activeStep: number;
  playing: boolean;
  status: string;
  defaultSubject: string;
  onPlay: () => void;
  onNext: () => void;
  graphable?: boolean;
  onPlotGraph?: () => void;
}) {
  if (!plan)
    return (
      <section className="physics-panel physics-empty">
        <p className="eyebrow">Document</p>
        <h2>Write a formula to begin</h2>
        <p>
          Set a subject in Settings, then its meaning, variables, assumptions, and
          explanation will appear here.
        </p>
      </section>
    );
  const formula = plan.formula;
  const step = plan.steps[activeStep];
  return (
    <section className="physics-panel">
      <header>
        <p className="eyebrow">
          {formula?.subject || defaultSubject} · {formula?.topic || "Formula"}
        </p>
        <h2>{formula?.name || plan.title}</h2>
        <MathPreview
          latex={step.blocks.find((block) => block.type === "latex")?.content || ""}
        />
        {graphable && onPlotGraph && (
          <button className="plot-graph-button" onClick={onPlotGraph}>
            <IconChartLine size={16} /> Plot on graph
          </button>
        )}
      </header>
      {formula && (
        <div className="physics-metadata">
          <p>{formula.identityNote || formula.proofStatus.replaceAll("_", " ")}</p>
          <div className="physics-variables">
            {formula.variables.map((variable) => (
              <div key={variable.symbol}>
                <strong>
                  <MathPreview latex={variable.symbol} />
                </strong>
                <span>{variable.name}</span>
                <small>{variable.unit}</small>
              </div>
            ))}
          </div>
        </div>
      )}
      <article className="physics-step">
        <span>
          Step {activeStep + 1} of {plan.steps.length}
        </span>
        <h3>{step.narration}</h3>
        {step.blocks
          .filter((block) => block.type !== "latex")
          .map((block, index) => (
            <p key={index}>{block.content}</p>
          ))}
      </article>
      <div className="physics-controls">
        <button onClick={onPlay}>
          {playing ? <IconPlayerPause size={17} /> : <IconVolume size={17} />}
          {playing ? "Pause" : "Play narration"}
        </button>
        <button onClick={onNext}>
          <IconPlayerPlay size={17} />{" "}
          {activeStep === plan.steps.length - 1 ? "Restart" : "Next"}
        </button>
      </div>
      <small className="narration-status">{status}</small>

      <YouTubeRecommendations plan={plan} />
    </section>
  );
}
