"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  IconArrowsLeftRight,
  IconArrowsMove,
  IconHelpCircle,
  IconClick,
  IconEraser,
  IconHandClick,
  IconHandFinger,
  IconHandStop,
  IconPointer,
  IconSettings,
  IconX,
  IconZoomInArea,
  IconAtom,
  IconMenu2,
  IconMath,
  IconAtom2,
} from "@tabler/icons-react";
import { AirCanvas, type GestureSettings } from "../components/AirCanvas";
import { EquationSidebar } from "../components/EquationSidebar";
import { GraphPanel } from "../components/GraphPanel";
import { MathPreview } from "../components/MathPreview";
import { PhysicsPanel } from "../components/PhysicsPanel";
import { LibraryPanel } from "../components/LibraryPanel";
import { loadLibrary, saveLibrary, type LibrarySession } from "../lib/library";
import { generateExplanation } from "../lib/explore-client";
import {
  isReusablePlan,
  upgradePlan,
  type ExplanationPlan,
  type SceneMode,
} from "../lib/explanation";
import { normalizeCanonicalExpression } from "../lib/canonical-expression";
import { narrator, type NarrationStatus } from "../lib/narration";
import {
  correctionKey,
  recognizeStrokes,
  type RecognitionResult,
  type Stroke,
} from "../lib/recognition";
import { applyGeminiResult, recognizeWithGemini } from "../lib/gemini-recognizer";
import { recognizeWithLocalModel } from "../lib/onnx-recognizer";
import {
  DEFAULT_VIEWPORT,
  fitViewport,
  panViewport,
  sampleExpression,
  zoomViewport,
} from "../lib/graph";
import {
  EQUATION_COLORS,
  getGraphPaths,
  getLastVisibleEquation,
  getNumberSlots,
  toLatex,
  updateEquationNumber,
  type Equation,
} from "../lib/equations";
import {
  EMPTY_PROFILE,
  TRAINING_EQUATIONS,
  equationLabels,
  learnEquation,
  learnFromGemini,
  loadProfile,
  saveProfile,
  type HandwritingProfile,
} from "../lib/personalization";

const empty: RecognitionResult = {
  tokens: [],
  latex: "",
  canonicalExpression: "",
  confidence: 0,
  unresolvedTokenIds: [],
  valid: false,
  error: "Draw an equation",
};
const defaultGestures: GestureSettings = {
  draw: true,
  erase: true,
  select: true,
  thumbNavigate: true,
  airButtons: true,
  modeSwitch: true,
  graphMove: true,
  twoHandZoom: true,
  twoPalmHide: true,
};
const SUBJECT_OPTIONS = [
  "Physics",
  "Statistics",
  "Chemistry",
  "Biology",
  "Mathematics",
  "Other",
] as const;
type SubjectOption = (typeof SUBJECT_OPTIONS)[number];
type WorkspaceMode = "maths" | "others";
type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => { finished: Promise<void> };
};
type AiState =
  | { status: "idle" | "ready"; request: number }
  | {
      status: "loading" | "result" | "error";
      request: number;
      message?: string;
    };

export default function Home() {
  const [mode, setMode] = useState<"hover" | "drawing" | "erasing" | "moving">("hover");
  const [recognition, setRecognition] = useState<RecognitionResult>(empty);
  const [aiState, setAiState] = useState<AiState>({
    status: "idle",
    request: 0,
  });
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [clearSignal, setClearSignal] = useState(0);
  const [preferredHand, setPreferredHand] = useState<"Left" | "Right">("Right");
  const [askUncertain, setAskUncertain] = useState(true);
  const [learn, setLearn] = useState(true);
  const [useAiRecognition, setUseAiRecognition] = useState(true);
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<HandwritingProfile>(EMPTY_PROFILE);
  const [training, setTraining] = useState(false);
  const [trainingIndex, setTrainingIndex] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState("");
  const [equations, setEquations] = useState<Equation[]>([]);
  const [interactionMode, setInteractionMode] = useState<"canvas" | "move">("canvas");
  const [selectionActive, setSelectionActive] = useState(false);
  const [selectedNumberIndex, setSelectedNumberIndex] = useState(0);
  const [graphView, setGraphView] = useState(DEFAULT_VIEWPORT);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [lesson, setLesson] = useState<ExplanationPlan | null>(null);
  const [graphLesson, setGraphLesson] = useState<{
    plan: ExplanationPlan;
    current: number;
    playing: boolean;
  } | null>(null);
  const [lessonStatus, setLessonStatus] = useState<
    "idle" | "generating" | "ready" | "error"
  >("idle");
  const [formulaCandidate, setFormulaCandidate] = useState<RecognitionResult | null>(
    null,
  );
  const [lastExpression, setLastExpression] = useState<RecognitionResult | null>(null);
  const [formulaLessonError, setFormulaLessonError] = useState("");
  const [graphLessonError, setGraphLessonError] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [loadSignal, setLoadSignal] = useState(0);
  const [loadStrokes, setLoadStrokes] = useState<Stroke[]>([]);
  const [airInputMode, setAirInputMode] = useState<"camera" | "whiteboard">("camera");
  const [librarySessions, setLibrarySessions] = useState<LibrarySession[]>([]);
  const [libraryHydrated, setLibraryHydrated] = useState(false);
  const [gestures, setGestures] = useState<GestureSettings>(defaultGestures);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("maths");
  const [subjectOption, setSubjectOption] = useState<SubjectOption>("Physics");
  const [customSubject, setCustomSubject] = useState("");
  const [physicsStep, setPhysicsStep] = useState(0);
  const [physicsPlaying, setPhysicsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [narrationStatus, setNarrationStatus] = useState(
    "Narrator is ready when a browser voice is available.",
  );
  const recognitionRequest = useRef(0);
  const recognitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionAbort = useRef<AbortController | null>(null);
  const lessonRequests = useRef(new Set<string>());
  const recognizing = aiState.status === "loading";

  useEffect(() => {
    try {
      setCorrections(JSON.parse(localStorage.getItem("airgraph-corrections") || "{}"));
      const saved = JSON.parse(localStorage.getItem("airgraph-gestures") || "null");
      if (saved) setGestures({ ...defaultGestures, ...saved });
      const savedMode = localStorage.getItem("sign2graph-workspace-mode");
      if (savedMode === "maths" || savedMode === "others") setWorkspaceMode(savedMode);
      const savedSubject = localStorage.getItem("sign2graph-explanation-subject");
      if (SUBJECT_OPTIONS.includes(savedSubject as SubjectOption)) {
        setSubjectOption(savedSubject as SubjectOption);
      }
      setCustomSubject(localStorage.getItem("sign2graph-custom-subject") || "");
    } catch {}
    setProfile(loadProfile());
    setLibrarySessions(loadLibrary());
    setLibraryHydrated(true);
  }, []);
  useEffect(
    () =>
      narrator.subscribe((status: NarrationStatus, message) =>
        setNarrationStatus(message || status),
      ),
    [],
  );
  useEffect(() => {
    void narrator
      .initialize()
      .then(setVoices)
      .catch((error: Error) => setNarrationStatus(error.message));
  }, []);
  useEffect(
    () => localStorage.setItem("sign2graph-workspace-mode", workspaceMode),
    [workspaceMode],
  );
  useEffect(
    () => localStorage.setItem("sign2graph-explanation-subject", subjectOption),
    [subjectOption],
  );
  useEffect(
    () => localStorage.setItem("sign2graph-custom-subject", customSubject),
    [customSubject],
  );
  useEffect(() => {
    if (libraryHydrated) saveLibrary(librarySessions);
  }, [libraryHydrated, librarySessions]);
  useEffect(
    () => () => {
      if (recognitionTimer.current) clearTimeout(recognitionTimer.current);
      recognitionAbort.current?.abort();
      recognitionRequest.current++;
    },
    [],
  );
  const unresolved = recognition.tokens.find((token) =>
    recognition.unresolvedTokenIds.includes(token.id),
  );
  const lastEquation = getLastVisibleEquation(equations);
  const numberSlots = getNumberSlots(lastEquation);
  const selectedNumber = Number(numberSlots[selectedNumberIndex]?.[0] || 0);
  const selectedSubject =
    subjectOption === "Other" && customSubject.trim()
      ? customSubject.trim().slice(0, 60)
      : subjectOption === "Other"
        ? "Physics"
        : subjectOption;
  const setGesture = (key: keyof GestureSettings, value: boolean) => {
    const next = { ...gestures, [key]: value };
    setGestures(next);
    localStorage.setItem("airgraph-gestures", JSON.stringify(next));
    if (key === "modeSwitch" && !value) setInteractionMode("canvas");
  };

  const handleStrokes = (next: Stroke[]) => {
    const request = ++recognitionRequest.current;
    recognitionAbort.current?.abort();
    setStrokes(next);
    if (recognitionTimer.current) clearTimeout(recognitionTimer.current);
    if (training) {
      if (next.length) setTrainingStatus("");
      return;
    }
    if (!next.length) {
      setAiState({ status: "idle", request });
      setRecognition(empty);
      return;
    }
    setAiState({ status: useAiRecognition ? "ready" : "idle", request });
    setRecognition({
      ...empty,
      error: useAiRecognition
        ? "Gemini will read the complete equation when you add it."
        : "Finish drawing. Local recognition starts after a short pause.",
    });
    recognitionTimer.current = setTimeout(() => {
      if (request !== recognitionRequest.current) return;
      if (useAiRecognition) {
        setAiState({ status: "loading", request });
        setRecognition({ ...empty, error: "Gemini is decoding your air-drawn equation…" });
        const controller = new AbortController();
        recognitionAbort.current = controller;
        const base = recognizeStrokes(next, corrections);
        void recognizeWithGemini(next, controller.signal)
          .then((result) => {
            if (request !== recognitionRequest.current) return;
            const resolved = applyGeminiResult(base, result);
            setRecognition(resolved);
            setLastExpression(resolved);
            setAiState({ status: "result", request });
            if (resolved.graphable) {
              commitEquation(resolved);
            }
          })
          .catch((error: Error) => {
            if (controller.signal.aborted) return;
            if (request !== recognitionRequest.current) return;
            setRecognition({
              ...base,
              error: error.message || "Gemini could not read this equation.",
            });
            setAiState({
              status: "error",
              request,
              message: error.message || "Gemini could not read this equation.",
            });
          });
        return;
      }
      const base = recognizeStrokes(next, corrections);
      setRecognition(base);
      setAiState({ status: "loading", request });
      void recognizeWithLocalModel(next, corrections, profile)
        .then((result) => {
          if (request === recognitionRequest.current) {
            setRecognition(result);
            setAiState({ status: "result", request });
          }
        })
        .catch(() => {
          if (request === recognitionRequest.current)
            setAiState({
              status: "error",
              request,
              message: "Offline recognition failed.",
            });
        });
    }, 1200);
  };

  const correct = (value: string) => {
    if (!unresolved || !value.trim()) return;
    const group = strokes.filter((stroke) => unresolved.strokeIds.includes(stroke.id));
    const next = { ...corrections, [correctionKey(group)]: value.trim() };
    setCorrections(next);
    if (learn) localStorage.setItem("airgraph-corrections", JSON.stringify(next));
    void recognizeWithLocalModel(strokes, next, profile).then(setRecognition);
  };

  const startTraining = () => {
    setTraining(true);
    setTrainingIndex(0);
    setTrainingStatus("");
    setRecognition(empty);
    setClearSignal((value) => value + 1);
  };
  const saveTrainingSample = () => {
    if (!strokes.length) return;
    const result = learnEquation(
      strokes,
      equationLabels(TRAINING_EQUATIONS[trainingIndex]),
      profile,
    );
    setProfile(result.profile);
    saveProfile(result.profile);
    setTrainingStatus("Sample saved. Your handwriting profile is improving.");
    if (trainingIndex === TRAINING_EQUATIONS.length - 1) {
      setTraining(false);
      setTrainingIndex(0);
    } else setTrainingIndex((index) => index + 1);
    setClearSignal((value) => value + 1);
  };
  const prepareLesson = (
    result: RecognitionResult,
    mode: SceneMode,
    openWhenReady: boolean,
  ) => {
    const kind = mode === "graph" ? "graph" : "formula";
    const cached = librarySessions.find(
      (session) =>
        session.kind === kind &&
        session.canonicalExpression === result.canonicalExpression &&
        session.explanation?.mode === mode &&
        (mode === "graph" || session.explanation.formula?.subject === selectedSubject),
    )?.explanation;
    if (cached && isReusablePlan(cached, result.canonicalExpression)) {
      const plan = upgradePlan(cached);
      setLessonStatus("ready");
      setFormulaLessonError("");
      if (plan !== cached) {
        setLibrarySessions((sessions) =>
          sessions.map((session) =>
            session.explanation === cached
              ? { ...session, explanation: plan }
              : session,
          ),
        );
      }
      if (mode === "graph") {
        if (openWhenReady) setGraphLesson({ plan, current: 0, playing: false });
      } else if (openWhenReady) {
        setPhysicsStep(0);
        setLesson(plan);
      }
      return;
    }
    const requestKey = `${mode}:${selectedSubject}:${result.canonicalExpression}`;
    if (lessonRequests.current.has(requestKey)) return;
    lessonRequests.current.add(requestKey);
    void narrator.initialize().catch(() => undefined);
    if (mode === "graph") setGraphLesson(null);
    setLessonStatus("generating");
    setFormulaLessonError("");
    setGraphLessonError("");
    void generateExplanation({
      latex: result.latex,
      canonicalExpression: result.canonicalExpression,
      mode,
      ...(mode === "formula" ? { subject: selectedSubject } : {}),
    })
      .then((plan) => {
        setLessonStatus("ready");
        setLibrarySessions((sessions) => {
          let saved = false;
          const updated = sessions.map((session) => {
            const sameSubject =
              mode === "graph" ||
              session.explanation?.formula?.subject === selectedSubject;
            if (
              session.kind === kind &&
              session.canonicalExpression === result.canonicalExpression &&
              sameSubject
            ) {
              saved = true;
              return { ...session, explanation: plan };
            }
            return session;
          });
          return saved
            ? updated
            : [
                {
                  id: crypto.randomUUID(),
                  createdAt: new Date().toISOString(),
                  kind,
                  latex: result.latex,
                  canonicalExpression: result.canonicalExpression,
                  strokes: [...strokes],
                  explanation: plan,
                },
                ...updated,
              ];
        });
        if (mode === "graph") {
          if (openWhenReady) setGraphLesson({ plan, current: 0, playing: false });
        } else if (openWhenReady) {
          setPhysicsStep(0);
          setLesson(plan);
        }
      })
      .catch((error: Error) => {
        setLessonStatus("error");
        if (mode === "formula")
          setFormulaLessonError(
            error.message || "Formula lesson could not be generated.",
          );
        else
          setGraphLessonError(error.message || "Graph explanation could not be generated.");
      })
      .finally(() => lessonRequests.current.delete(requestKey));
  };
  const commitEquation = (result: RecognitionResult) => {
    const graphInput = normalizeCanonicalExpression(result.canonicalExpression);
    const graphResult = graphInput.ok
      ? { ...result, canonicalExpression: graphInput.value }
      : result;
    const traces = graphInput.ok ? sampleExpression(graphInput.value) : [];
    if (workspaceMode === "others" || !graphInput.ok) {
      setFormulaCandidate(result);
      setLastExpression(result);
      setLibrarySessions((sessions) => [
        {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          kind: "formula",
          latex: result.latex,
          canonicalExpression: result.canonicalExpression,
          strokes: [...strokes],
        },
        ...sessions,
      ]);
      setRecognition({
        ...result,
        error:
          workspaceMode === "others"
            ? "Formula recognized. Preparing the document…"
            : "Formula recognized. Preparing the document in Others…",
      });
      prepareLesson(result, "formula", true);
      return false;
    }
    setEquations((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        latex: graphResult.latex,
        canonicalExpression: graphResult.canonicalExpression,
        color: EQUATION_COLORS[items.length % EQUATION_COLORS.length],
        visible: true,
        traces,
      },
    ]);
    setLastExpression(graphResult);
    setLibrarySessions((sessions) => [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        kind: "graph",
        latex: graphResult.latex,
        canonicalExpression: graphResult.canonicalExpression,
        strokes: [...strokes],
        equations: [
          {
            id: "saved",
            latex: graphResult.latex,
            canonicalExpression: graphResult.canonicalExpression,
            color: EQUATION_COLORS[equations.length % EQUATION_COLORS.length],
            visible: true,
            traces,
          },
        ],
      },
      ...sessions,
    ]);
    setGraphView(
      fitViewport([
        ...equations.filter((item) => item.visible).flatMap((item) => item.traces),
        ...traces,
      ]),
    );
    setSelectionActive(false);
    setSelectedNumberIndex(0);
    if (airInputMode !== "whiteboard") setClearSignal((value) => value + 1);
    setRecognition(empty);
    // Prepare both the graph explanation and the document view in the same
    // shot, so Explain and switching to Others are instant instead of each
    // triggering their own separate generation later.
    prepareLesson(graphResult, "graph", false);
    prepareLesson(graphResult, "formula", false);
    return true;
  };
  const playGraphNarration = () => {
    if (!graphLesson) return;
    if (graphLesson.playing) {
      narrator.pause();
      setGraphLesson((item) => item && { ...item, playing: false });
      return;
    }
    const step = graphLesson.plan.steps[graphLesson.current];
    setGraphLesson((item) => item && { ...item, playing: true });
    void narrator
      .speak(step.narration)
      .then(() => {
        setGraphLesson((item) =>
          !item
            ? null
            : item.current < item.plan.steps.length - 1
              ? { ...item, current: item.current + 1, playing: false }
              : { ...item, playing: false },
        );
      })
      .catch(() => setGraphLesson((item) => item && { ...item, playing: false }));
  };
  const playPhysicsNarration = () => {
    if (!lesson) return;
    if (physicsPlaying) {
      narrator.pause();
      setPhysicsPlaying(false);
      return;
    }
    setPhysicsPlaying(true);
    void narrator
      .speak(lesson.steps[physicsStep].narration)
      .then(() => {
        setPhysicsPlaying(false);
        setPhysicsStep((value) =>
          value < lesson.steps.length - 1 ? value + 1 : value,
        );
      })
      .catch(() => setPhysicsPlaying(false));
  };
  const switchWorkspace = (nextMode: WorkspaceMode) => {
    if (nextMode === workspaceMode) return;
    narrator.cancel();
    setPhysicsPlaying(false);
    setGraphLesson((item) => item && { ...item, playing: false });
    const applyMode = () => {
      if (nextMode === "maths") {
        setLesson(null);
        setFormulaLessonError("");
        setPhysicsStep(0);
      }
      flushSync(() => setWorkspaceMode(nextMode));
    };
    const transitionName = `${workspaceMode}-to-${nextMode}`;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const documentWithTransitions = document as ViewTransitionDocument;
    if (reducedMotion || !documentWithTransitions.startViewTransition) {
      applyMode();
    } else {
      document.documentElement.dataset.workspaceTransition = transitionName;
      const transition = documentWithTransitions.startViewTransition(applyMode);
      void transition.finished.finally(() => {
        delete document.documentElement.dataset.workspaceTransition;
      });
    }
    if (nextMode === "others" && lastExpression) {
      prepareLesson(lastExpression, "formula", true);
    }
  };
  const changeSelectedNumber = (delta: number) => {
    if (!lastEquation || !numberSlots.length) return;
    const slot = numberSlots[Math.min(selectedNumberIndex, numberSlots.length - 1)];
    const canonical = updateEquationNumber(lastEquation, slot, delta);
    if (!canonical) return;
    const traces = sampleExpression(canonical);
    if (!traces.length) return;
    setEquations((items) =>
      items.map((item) =>
        item.id === lastEquation.id
          ? {
              ...item,
              canonicalExpression: canonical,
              latex: toLatex(canonical),
              traces,
            }
          : item,
      ),
    );
  };
  const handleAirAction = (
    action:
      | "add"
      | "select"
      | "previous"
      | "next"
      | "minus10"
      | "minus1"
      | "plus1"
      | "plus10",
  ) => {
    if (action === "add") {
      add();
      return;
    }
    if (!numberSlots.length) return;
    if (action === "select") {
      setSelectionActive((active) => !active);
      return;
    }
    if (!selectionActive) return;
    if (action === "previous") {
      setSelectedNumberIndex((index) =>
        index <= 0 ? Math.min(1, numberSlots.length - 1) : index - 1,
      );
      return;
    }
    if (action === "next") {
      setSelectedNumberIndex((index) =>
        index >= numberSlots.length - 1
          ? Math.max(0, numberSlots.length - 2)
          : index + 1,
      );
      return;
    }
    changeSelectedNumber(
      action === "minus10"
        ? -10
        : action === "minus1"
          ? -1
          : action === "plus10"
            ? 10
            : 1,
    );
  };
  const add = () => {
    if (!strokes.length || recognizing) return;
    if (!useAiRecognition) {
      if (recognition.valid) commitEquation(recognition);
      return;
    }
    const request = ++recognitionRequest.current;
    recognitionAbort.current?.abort();
    setAiState({ status: "loading", request });
    setRecognition({ ...empty, error: "Gemini is reading your equation…" });
    const controller = new AbortController();
    recognitionAbort.current = controller;
    const base = recognizeStrokes(strokes, corrections);
    void recognizeWithGemini(strokes, controller.signal)
      .then((result) => {
        if (request !== recognitionRequest.current) return;
        const resolved = applyGeminiResult(base, result);
        if (learn) {
          const updated = learnFromGemini(
            strokes,
            result.canonicalExpression,
            result.confidence,
            profile,
          );
          if (updated !== profile) {
            setProfile(updated);
            saveProfile(updated);
          }
        }
        commitEquation(resolved);
        setAiState({ status: "result", request });
      })
      .catch((error: Error) => {
        if (controller.signal.aborted) return;
        if (request !== recognitionRequest.current) return;
        setRecognition({
          ...base,
          error: error.message || "Gemini could not read this equation.",
        });
        setAiState({
          status: "error",
          request,
          message: error.message || "Gemini could not read this equation.",
        });
      });
  };
  const graphPaths = useMemo(() => getGraphPaths(equations), [equations]);

  return (
    <main
      className={
        `${interactionMode === "move" ? "move-workspace" : ""} ` +
        `${selectionActive ? "selection-workspace" : ""}`
      }
    >
      <header className="topbar">
        <button
          className="icon-button library-trigger"
          aria-label="Open library"
          onClick={() => setLibraryOpen(true)}
        >
          <IconMenu2 size={20} />
        </button>
        <a className="brand" href="#workspace">
          <span className="brand-mark">
            <span />
          </span>
          PlotlyX
        </a>
        <div
          className="workspace-switch"
          data-mode={workspaceMode}
          aria-label="Workspace mode"
        >
          <span className="workspace-switch-glow" aria-hidden="true" />
          <button
            className={workspaceMode === "maths" ? "active" : ""}
            aria-pressed={workspaceMode === "maths"}
            onClick={() => switchWorkspace("maths")}
          >
            <IconMath size={16} />
            Maths
          </button>
          <button
            className={workspaceMode === "others" ? "active" : ""}
            aria-pressed={workspaceMode === "others"}
            onClick={() => switchWorkspace("others")}
          >
            <IconAtom2 size={16} />
            Others
          </button>
        </div>
        <div className="topbar-actions">
          <button className="header-link" onClick={() => setTutorialOpen(true)}>
            <IconHelpCircle size={18} />
            Help
          </button>
          <button
            className="header-link"
            onClick={() => {
              const result = formulaCandidate || {
                ...empty,
                latex: "F=ma",
                canonicalExpression: "F=m*a",
                valid: true,
              };
              prepareLesson(result, "formula", true);
            }}
          >
            <IconAtom size={17} /> Explore formula
          </button>
          <span className="connection">
            <span className="status-light" />
            {preferredHand} hand
          </span>
          <details className="camera-settings">
            <summary aria-label="Settings">
              <IconSettings size={18} />
            </summary>
            <div>
              <p>Tracking hand</p>
              {(["Right", "Left"] as const).map((hand) => (
                <button
                  key={hand}
                  className={preferredHand === hand ? "chosen" : ""}
                  onClick={() => setPreferredHand(hand)}
                >
                  {hand}
                </button>
              ))}
              <label>
                <input
                  type="checkbox"
                  checked={useAiRecognition}
                  onChange={(event) => setUseAiRecognition(event.target.checked)}
                />
                Gemini Flash-Lite
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={askUncertain}
                  onChange={(event) => setAskUncertain(event.target.checked)}
                />
                Ask when unsure
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={learn}
                  onChange={(event) => setLearn(event.target.checked)}
                />
                Learn AI-verified samples
              </label>
              <details className="settings-advanced">
                <summary>Advanced controls</summary>
                <div className="settings-advanced-body">
                  <p>Gesture controls</p>
                  {(
                    Object.entries({
                      draw: "Pinch drawing",
                      erase: "Fist eraser",
                      select: "Four-finger selection",
                      thumbNavigate: "Thumb navigation",
                      airButtons: "Air buttons",
                      modeSwitch: "Three-finger move mode",
                      graphMove: "Graph panning",
                      twoHandZoom: "Two-hand zoom",
                      twoPalmHide: "Two-palm hide",
                    }) as [keyof GestureSettings, string][]
                  ).map(([key, label]) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        checked={gestures[key]}
                        onChange={(event) => setGesture(key, event.target.checked)}
                      />
                      {label}
                    </label>
                  ))}
                  <p>Handwriting profile</p>
                  <button onClick={startTraining}>Train handwriting</button>
                  <small>{profile.samples.length} saved symbols</small>
                  {profile.samples.length > 0 && (
                    <button
                      onClick={() => {
                        setProfile(EMPTY_PROFILE);
                        saveProfile(EMPTY_PROFILE);
                      }}
                    >
                      Reset training
                    </button>
                  )}
                </div>
              </details>
              <p>Document subject</p>
              <label>
                Subject
                <select
                  value={subjectOption}
                  onChange={(event) =>
                    setSubjectOption(event.target.value as SubjectOption)
                  }
                >
                  {SUBJECT_OPTIONS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </label>
              {subjectOption === "Other" && (
                <label>
                  Custom subject
                  <input
                    value={customSubject}
                    maxLength={60}
                    placeholder="For example, economics"
                    onChange={(event) => setCustomSubject(event.target.value)}
                  />
                </label>
              )}
              <p>Narrator</p>
              <label>
                Voice
                <select
                  value={narrator.preferences.voiceURI}
                  onChange={(event) =>
                    narrator.setPreferences({ voiceURI: event.target.value })
                  }
                >
                  <option value="">System default</option>
                  {voices.map((voice, idx) => (
                    <option
                      key={`${voice.voiceURI || voice.name || "voice"}-${idx}`}
                      value={voice.voiceURI}
                    >
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Rate
                <input
                  type="range"
                  min="0.7"
                  max="1.2"
                  step="0.05"
                  value={narrator.preferences.rate}
                  onChange={(event) =>
                    narrator.setPreferences({ rate: Number(event.target.value) })
                  }
                />
              </label>
              <button
                onClick={() =>
                  void narrator
                    .speak(
                      "This is a Sign2Graph voice test. If you can hear this, narration is ready.",
                    )
                    .then(() => setNarrationStatus("Voice test completed."))
                    .catch(() => undefined)
                }
              >
                Test voice
              </button>
              <small>{narrationStatus}</small>
            </div>
          </details>
        </div>
      </header>
      <section
        className={`workspace ${workspaceMode}-workspace`}
        data-workspace-mode={workspaceMode}
        id="workspace"
      >
        {workspaceMode === "maths" && (
          <EquationSidebar
            equations={equations}
            lastEquation={lastEquation}
            selectedNumberIndex={selectedNumberIndex}
            selectionActive={selectionActive}
            onNew={() => setClearSignal((value) => value + 1)}
            onToggleVisibility={(id) =>
              setEquations((items) =>
                items.map((item) =>
                  item.id === id ? { ...item, visible: !item.visible } : item,
                ),
              )
            }
            onDelete={(id) =>
              setEquations((items) => items.filter((item) => item.id !== id))
            }
          />
        )}
        <section className="creation-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Air canvas</p>
              <h1>{training ? "Train your handwriting" : "Draw an equation"}</h1>
            </div>
            <span className={`mode-indicator ${mode !== "hover" ? "is-drawing" : ""}`}>
              <IconHandFinger size={16} />
              {mode === "moving"
                ? "Moving graph"
                : mode === "erasing"
                  ? "Erasing"
                  : mode === "drawing"
                    ? "Drawing"
                    : recognizing
                      ? "Recognizing"
                      : "Hand ready"}
            </span>
          </div>
          {training && (
            <div className="training-banner">
              <div>
                <p>
                  Sample {trainingIndex + 1} of {TRAINING_EQUATIONS.length}
                </p>
                <strong>
                  <MathPreview latex={TRAINING_EQUATIONS[trainingIndex]} />
                </strong>
                <small>
                  Write it naturally. Every symbol may use one, two, or many strokes.
                </small>
              </div>
              <button
                onClick={() => {
                  setTraining(false);
                  setClearSignal((value) => value + 1);
                }}
              >
                Exit training
              </button>
            </div>
          )}
          <AirCanvas
            clearSignal={clearSignal}
            loadSignal={loadSignal}
            loadStrokes={loadStrokes}
            onInputModeChange={setAirInputMode}
            preferredHand={preferredHand}
            interactionMode={interactionMode}
            selectedValue={selectedNumber}
            selectionActive={selectionActive}
            canAdd={!!strokes.length && !training}
            disabled={recognizing}
            gestures={gestures}
            onStatusChange={setMode}
            onStrokeComplete={handleStrokes}
            onAction={handleAirAction}
            onInteractionModeChange={setInteractionMode}
            onGraphPan={(x, y) => setGraphView((view) => panViewport(view, x, y))}
            onGraphScale={(factor) =>
              setGraphView((view) => zoomViewport(view, factor))
            }
            onHideLastEquation={() =>
              setEquations((items) => {
                const activeId = [...items].reverse().find((item) => item.visible)?.id;
                return activeId
                  ? items.map((item) =>
                      item.id === activeId ? { ...item, visible: false } : item,
                    )
                  : items;
              })
            }
          />
          {training ? (
            <div className="training-actions">
              <div>
                <p>{trainingStatus || "Write the sample, then save it."}</p>
                <small>
                  The target equation provides the labels. No recognition check is
                  required.
                </small>
              </div>
              <button
                className="confirm-button"
                onClick={saveTrainingSample}
                disabled={!strokes.length}
              >
                Save sample
              </button>
            </div>
          ) : (
            <>
              <div className="recognition">
                <div>
                  <p className="eyebrow">Recognition preview</p>
                  <div className="recognized-formula">
                    {recognizing ? (
                      "Gemini is decoding…"
                    ) : recognition.latex ? (
                      <MathPreview latex={recognition.latex} />
                    ) : useAiRecognition && strokes.length ? (
                      "Ready for AI recognition"
                    ) : (
                      "Waiting for input"
                    )}
                  </div>
                  <p
                    className={`confidence ${recognition.valid ? "valid" : "invalid"}`}
                  >
                    {recognizing
                      ? "Sending the ink canvas to Gemini Flash-Lite…"
                      : aiState.status === "error"
                        ? aiState.message
                        : recognition.error ||
                          (useAiRecognition && strokes.length
                            ? "Point at Add to graph in the camera for 5 seconds, or pinch it."
                            : recognition.confidence
                              ? `${recognition.confidence}% · ${
                                  recognition.valid
                                    ? "Ready to graph"
                                    : recognition.error
                                }`
                              : "Draw an equation")}
                  </p>
                </div>
              </div>
              {lastExpression && !recognizing && (
                <div className="mode-switcher">
                  <span>
                    Detected as{" "}
                    <strong>{lastExpression.graphable ? "graph" : "formula"}</strong>
                    {lastExpression.classificationConfidence
                      ? ` · ${Math.round(
                          lastExpression.classificationConfidence * 100,
                        )}% confidence`
                      : ""}
                  </span>
                  <div>
                    <button
                      className={workspaceMode === "maths" ? "selected" : ""}
                      disabled={!lastExpression.graphable && workspaceMode === "maths"}
                      onClick={() => {
                        switchWorkspace("maths");
                        if (lastExpression.graphable) {
                          commitEquation(lastExpression);
                        }
                      }}
                    >
                      Graph
                    </button>
                    <button
                      className={workspaceMode === "others" ? "selected" : ""}
                      onClick={() => {
                        switchWorkspace("others");
                        prepareLesson(lastExpression, "formula", true);
                      }}
                    >
                      Document
                    </button>
                  </div>
                </div>
              )}
              {formulaLessonError && lastExpression && (
                <div className="lesson-error">
                  <span>{formulaLessonError}</span>
                  <button
                    onClick={() => prepareLesson(lastExpression, "formula", true)}
                  >
                    Retry lesson
                  </button>
                </div>
              )}
              {askUncertain && unresolved && !recognizing && !useAiRecognition && (
                <div className="correction-panel">
                  <p>What symbol did you draw?</p>
                  <div>
                    {unresolved.alternatives.slice(0, 3).map((candidate) => (
                      <button
                        key={candidate.value}
                        onClick={() => correct(candidate.value)}
                      >
                        {candidate.value}
                      </button>
                    ))}
                    <input
                      aria-label="Correct symbol"
                      maxLength={3}
                      placeholder="Type symbol"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") correct(event.currentTarget.value);
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </section>
        {workspaceMode === "maths" ? (
          <GraphPanel
            equations={equations}
            paths={graphPaths}
            interactionMode={interactionMode}
            graphView={graphView}
            onResetView={() =>
              setGraphView(fitViewport(graphPaths.map((path) => path.trace)))
            }
            onGraphPan={(x, y) => setGraphView((view) => panViewport(view, x, y))}
            onGraphScale={(factor) =>
              setGraphView((view) => zoomViewport(view, factor))
            }
            onToggleInteractionMode={() =>
              setInteractionMode((current) =>
                current === "canvas" ? "move" : "canvas",
              )
            }
            onExplain={() =>
              lastEquation &&
              prepareLesson(
                {
                  ...empty,
                  latex: lastEquation.latex,
                  canonicalExpression: lastEquation.canonicalExpression,
                  valid: true,
                },
                "graph",
                true,
              )
            }
            explanationLoading={lessonStatus === "generating"}
            explanationError={graphLessonError}
            onRetryExplain={() =>
              lastEquation &&
              prepareLesson(
                {
                  ...empty,
                  latex: lastEquation.latex,
                  canonicalExpression: lastEquation.canonicalExpression,
                  valid: true,
                },
                "graph",
                true,
              )
            }
            lesson={graphLesson}
            onLessonPause={playGraphNarration}
            onLessonNext={() =>
              setGraphLesson(
                (item) =>
                  item &&
                  (item.current < item.plan.steps.length - 1
                    ? { ...item, current: item.current + 1, playing: false }
                    : null),
              )
            }
            onLessonClose={() => setGraphLesson(null)}
          />
        ) : (
          <PhysicsPanel
            plan={lesson}
            activeStep={physicsStep}
            playing={physicsPlaying}
            status={narrationStatus}
            defaultSubject={selectedSubject}
            onPlay={playPhysicsNarration}
            onNext={() => {
              setPhysicsPlaying(false);
              setPhysicsStep((value) =>
                lesson && value >= lesson.steps.length - 1 ? 0 : value + 1,
              );
            }}
          />
        )}
      </section>
      {tutorialOpen && (
        <div
          className="tutorial-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-title"
        >
          <section className="tutorial">
            <button
              className="tutorial-close"
              aria-label="Close tutorial"
              onClick={() => setTutorialOpen(false)}
            >
              <IconX size={20} />
            </button>
            <p className="eyebrow">Gesture tutorial</p>
            <h2 id="tutorial-title">
              Use your selected {preferredHand.toLowerCase()} hand.
            </h2>
            <div className="tutorial-grid">
              <article>
                <IconHandClick />
                <strong>Draw</strong>
                <span>Pinch thumb and index.</span>
              </article>
              <article>
                <IconPointer />
                <strong>Select</strong>
                <span>Raise index, middle, ring, and pinky.</span>
              </article>
              <article>
                <IconClick />
                <strong>Activate</strong>
                <span>Pinch a camera button.</span>
              </article>
              <article>
                <IconArrowsLeftRight />
                <strong>Navigate</strong>
                <span>Point your thumb left or right.</span>
              </article>
              <article>
                <IconEraser />
                <strong>Erase</strong>
                <span>Close your selected hand.</span>
              </article>
              <article>
                <IconArrowsMove />
                <strong>Move mode</strong>
                <span>Raise thumb, index, and middle for 1.6 seconds.</span>
              </article>
              <article>
                <IconZoomInArea />
                <strong>Scale</strong>
                <span>Pinch with two hands.</span>
              </article>
              <article>
                <IconHandStop />
                <strong>Hide</strong>
                <span>Hold two palms for five seconds.</span>
              </article>
            </div>
          </section>
        </div>
      )}
      {libraryOpen && (
        <LibraryPanel
          sessions={librarySessions}
          onClose={() => setLibraryOpen(false)}
          onDelete={(id) =>
            setLibrarySessions((sessions) =>
              sessions.filter((session) => session.id !== id),
            )
          }
          onRestore={(session) => {
            if (session.kind === "graph") {
              setWorkspaceMode("maths");
              if (session.explanation?.mode === "graph") {
                setGraphLesson({
                  plan: session.explanation,
                  current: 0,
                  playing: false,
                });
              }
            } else {
              setWorkspaceMode("maths");
              if (session.explanation) {
                setFormulaLessonError("");
              }
            }
            if (session.strokes?.length) {
              setLoadStrokes(session.strokes);
              setLoadSignal((value) => value + 1);
            }
            setLibraryOpen(false);
          }}
        />
      )}
    </main>
  );
}
