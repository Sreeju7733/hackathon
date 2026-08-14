import { useEffect, useRef, useState } from "react";
import { IconArrowsMove, IconPlayerPlay, IconRefresh } from "@tabler/icons-react";
import { MathPreview } from "./MathPreview";
import {
  GRAPH_HEIGHT,
  GRAPH_WIDTH,
  graphPoint,
  segmentPath,
  type GraphViewport,
} from "../lib/graph";
import type { Equation } from "../lib/equations";
import { sampleExpression } from "../lib/graph";
import type { ExplanationPlan } from "../lib/explanation";

type GraphPath = {
  key: string;
  color: string;
  trace: Equation["traces"][number];
};

function resample(points: Equation["traces"][number]["points"], count = 160) {
  if (points.length < 2) return points;
  return Array.from(
    { length: count },
    (_, index) =>
      points[
        Math.min(
          points.length - 1,
          Math.round((index / (count - 1)) * (points.length - 1)),
        )
      ],
  );
}

function AnimatedCurve({
  trace,
  color,
  viewport,
}: {
  trace: Equation["traces"][number];
  color: string;
  viewport: GraphViewport;
}) {
  const [points, setPoints] = useState(trace.points);
  const prior = useRef(trace.points);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = resample(prior.current);
    const to = resample(trace.points);
    prior.current = trace.points;
    if (reduce || from.length < 2 || to.length < 2) {
      setPoints(trace.points);
      return;
    }
    let frame = 0;
    const started = performance.now();
    const duration = 780;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setPoints(
        to.map((point, index) => ({
          x: from[index].x + (point.x - from[index].x) * eased,
          y: from[index].y + (point.y - from[index].y) * eased,
        })),
      );
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [trace.points]);
  return (
    <path className="curve" d={segmentPath({ points }, viewport)} stroke={color} />
  );
}

type Props = {
  equations: Equation[];
  paths: GraphPath[];
  interactionMode: "canvas" | "move";
  graphView: GraphViewport;
  onToggleInteractionMode: () => void;
  onResetView: () => void;
  onExplain: () => void;
  explanationLoading: boolean;
  explanationError?: string;
  onRetryExplain?: () => void;
  lesson: { plan: ExplanationPlan; current: number; playing: boolean } | null;
  onLessonPause: () => void;
  onLessonNext: () => void;
  onLessonClose: () => void;
  onGraphPan: (dx: number, dy: number) => void;
  onGraphScale: (factor: number) => void;
};

const gridStep = (span: number) => (span <= 20 ? 1 : span <= 50 ? 2 : 5);
const gridValues = (center: number, span: number) => {
  const step = gridStep(span);
  const start = Math.ceil((center - span / 2) / step) * step;
  const values: number[] = [];
  for (let value = start; value <= center + span / 2; value += step)
    values.push(Number(value.toFixed(6)));
  return values;
};

export function GraphPanel({
  equations,
  paths,
  interactionMode,
  graphView,
  onToggleInteractionMode,
  onResetView,
  onExplain,
  explanationLoading,
  explanationError,
  onRetryExplain,
  lesson,
  onLessonPause,
  onLessonNext,
  onLessonClose,
  onGraphPan,
  onGraphScale,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragPointRef = useRef<{ x: number; y: number } | null>(null);
  const pinchDistanceRef = useRef<number | null>(null);
  const relativePoint = (event: React.PointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((event.clientX - rect.left) / rect.width) * GRAPH_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * GRAPH_HEIGHT,
    };
  };
  const handlePointerDown = (event: React.PointerEvent) => {
    (event.target as Element).setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, relativePoint(event));
    if (pointersRef.current.size >= 2) {
      dragPointRef.current = null;
      const [a, b] = [...pointersRef.current.values()];
      pinchDistanceRef.current = Math.hypot(a.x - b.x, a.y - b.y);
    } else {
      pinchDistanceRef.current = null;
      dragPointRef.current = relativePoint(event);
    }
  };
  const handlePointerMove = (event: React.PointerEvent) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, relativePoint(event));
    if (pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDistanceRef.current) onGraphScale(dist / pinchDistanceRef.current);
      pinchDistanceRef.current = dist;
      return;
    }
    const point = relativePoint(event);
    if (dragPointRef.current)
      onGraphPan(point.x - dragPointRef.current.x, point.y - dragPointRef.current.y);
    dragPointRef.current = point;
  };
  const handlePointerUp = (event: React.PointerEvent) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchDistanceRef.current = null;
    dragPointRef.current =
      pointersRef.current.size === 1 ? [...pointersRef.current.values()][0] : null;
  };
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    onGraphScale(event.deltaY < 0 ? 1.08 : 0.93);
  };
  const origin = graphPoint({ x: 0, y: 0 }, graphView);
  const verticalGrid = gridValues(graphView.centerX, graphView.spanX);
  const horizontalGrid = gridValues(graphView.centerY, graphView.spanY);
  const activeStep = lesson?.plan.steps[lesson.current];
  const lessonExpression =
    activeStep?.graphExpression ||
    activeStep?.actions.find((action) => action.expression)?.expression;
  const lessonPaths = lessonExpression
    ? sampleExpression(lessonExpression).map((trace, index) => ({
        key: `lesson-${index}`,
        color: "#2563eb",
        trace,
      }))
    : [];
  const displayedPaths = lesson ? lessonPaths : paths;
  return (
    <section className="graph-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Interactive graph</p>
          <h2>
            {interactionMode === "move"
              ? "Move graph"
              : equations.length
                ? "Your equations"
                : "Add an equation to begin"}
          </h2>
        </div>
        <div className="graph-controls">
          <button
            className="explain-control"
            onClick={onExplain}
            disabled={!equations.length || explanationLoading}
          >
            <IconPlayerPlay size={16} /> {explanationLoading ? "Preparing…" : "Explain"}
          </button>
          <button className="mode-control" onClick={onResetView}>
            <IconRefresh size={16} /> Reset view
          </button>
          <button className="mode-control" onClick={onToggleInteractionMode}>
            <IconArrowsMove size={16} />
            {interactionMode === "move" ? "Return to canvas" : "Move graph"}
          </button>
        </div>
      </div>
      {explanationError && !lesson && (
        <div className="lesson-error">
          <span>{explanationError}</span>
          {onRetryExplain && <button onClick={onRetryExplain}>Retry explanation</button>}
        </div>
      )}
      <div
        className="graph-wrap"
        ref={wrapRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg className="graph" viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}>
          {verticalGrid.map((value) => {
            const x = graphPoint({ x: value, y: 0 }, graphView).x;
            return (
              <line
                key={`x-${value}`}
                x1={x}
                x2={x}
                y1="0"
                y2={GRAPH_HEIGHT}
                stroke="#e9edf3"
              />
            );
          })}
          {horizontalGrid.map((value) => {
            const y = graphPoint({ x: 0, y: value }, graphView).y;
            return (
              <line
                key={`y-${value}`}
                x1="0"
                x2={GRAPH_WIDTH}
                y1={y}
                y2={y}
                stroke="#e9edf3"
              />
            );
          })}
          <line x1="0" x2={GRAPH_WIDTH} y1={origin.y} y2={origin.y} stroke="#aeb8c8" />
          <line x1={origin.x} x2={origin.x} y1="0" y2={GRAPH_HEIGHT} stroke="#aeb8c8" />
          {displayedPaths.map((path) => (
            <AnimatedCurve
              key={path.key}
              trace={path.trace}
              color={path.color}
              viewport={graphView}
            />
          ))}
        </svg>
        {!equations.length && (
          <div className="graph-empty">
            Draw <MathPreview latex="y=x^2" /> or an implicit equation and add it to the
            graph.
          </div>
        )}
        {lesson && activeStep && (
          <div className="graph-lesson-strip">
            <div>
              <span>
                Step {lesson.current + 1} of {lesson.plan.steps.length} ·{" "}
                {lesson.playing ? "Narrating" : "Paused"}
              </span>
              <strong>{activeStep.narration}</strong>
            </div>
            <div className="graph-lesson-actions">
              <button onClick={onLessonPause}>
                {lesson.playing ? "Pause" : "Start narration"}
              </button>
              <button onClick={onLessonNext}>
                {lesson.current === lesson.plan.steps.length - 1 ? "Finish" : "Next"}
              </button>
              <button aria-label="Close graph explanation" onClick={onLessonClose}>
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
