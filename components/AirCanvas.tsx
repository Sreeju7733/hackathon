"use client";
import {
  IconCamera,
  IconCameraOff,
  IconEraser,
  IconLoader2,
  IconPencil,
  IconPointFilled,
  IconTrash,
} from "@tabler/icons-react";
import type { HandLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { classifyGesture, GestureStabilizer, type GesturePose } from "../lib/gestures";
import { getBounds, type Point, type Stroke } from "../lib/recognition";

type AirAction =
  | "add"
  | "select"
  | "previous"
  | "next"
  | "minus10"
  | "minus1"
  | "plus1"
  | "plus10";
export type GestureSettings = {
  draw: boolean;
  erase: boolean;
  select: boolean;
  thumbNavigate: boolean;
  airButtons: boolean;
  modeSwitch: boolean;
  graphMove: boolean;
  twoHandZoom: boolean;
  twoPalmHide: boolean;
};
type Props = {
  clearSignal: number;
  preferredHand: "Left" | "Right";
  eraserRadius?: number;
  interactionMode: "canvas" | "move";
  selectedValue?: number;
  selectionActive: boolean;
  canAdd: boolean;
  disabled?: boolean;
  gestures: GestureSettings;
  onStrokeComplete: (strokes: Stroke[]) => void;
  onStatusChange: (mode: "hover" | "drawing" | "erasing" | "moving") => void;
  onAction: (action: AirAction) => void;
  onInteractionModeChange: (mode: "canvas" | "move") => void;
  onGraphPan: (dx: number, dy: number) => void;
  onGraphScale: (scale: number) => void;
  onHideLastEquation: () => void;
};
const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/" +
  "hand_landmarker/float16/1/hand_landmarker.task";
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const normDistance = (a: NormalizedLandmark, b: NormalizedLandmark) =>
  Math.hypot(a.x - b.x, a.y - b.y);
const pinchRatio = (lm: NormalizedLandmark[]) =>
  normDistance(lm[8], lm[4]) / Math.max(0.0001, normDistance(lm[0], lm[9]));
const strokeTouches = (stroke: Stroke, cursor: Point, radius: number) => {
  const b = stroke.bounds;
  if (
    cursor.x < b.minX - radius ||
    cursor.x > b.maxX + radius ||
    cursor.y < b.minY - radius ||
    cursor.y > b.maxY + radius
  )
    return false;
  return stroke.points.some(
    (point, index) => index % 3 === 0 && distance(point, cursor) <= radius,
  );
};

export function AirCanvas({
  clearSignal,
  preferredHand,
  eraserRadius = 28,
  interactionMode,
  selectedValue,
  selectionActive,
  canAdd,
  disabled,
  gestures,
  onStrokeComplete,
  onStatusChange,
  onAction,
  onInteractionModeChange,
  onGraphPan,
  onGraphScale,
  onHideLastEquation,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null),
    canvasRef = useRef<HTMLCanvasElement>(null),
    cursorCanvasRef = useRef<HTMLCanvasElement>(null),
    rootRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null),
    detectorRef = useRef<HandLandmarker | null>(null),
    cameraEnabledRef = useRef(false),
    frameRef = useRef(0),
    lastVideoTimeRef = useRef(-1),
    lastDetectionAtRef = useRef(0);
  const strokesRef = useRef<Stroke[]>([]),
    activeRef = useRef<Point[]>([]),
    previousRef = useRef<Point | null>(null),
    pinchingRef = useRef(false),
    modeRef = useRef<"hover" | "drawing" | "erasing" | "moving">("hover");
  const historyRef = useRef<Stroke[][]>([]),
    fistSinceRef = useRef<number | null>(null),
    okaySinceRef = useRef<number | null>(null),
    palmsSinceRef = useRef<number | null>(null),
    addSinceRef = useRef<number | null>(null);
  const pinchActionLatchRef = useRef(false),
    selectionLatchRef = useRef(false),
    addLatchRef = useRef(false),
    okayLatchRef = useRef(false),
    hideLatchRef = useRef(false),
    lastThumbAtRef = useRef(0),
    lastPanRef = useRef<Point | null>(null),
    twoPinchDistanceRef = useRef<number | null>(null),
    eraseSnapshotRef = useRef(false),
    eraseChangedRef = useRef(false);
  const gestureStabilizerRef = useRef(new GestureStabilizer()),
    pointSinceRef = useRef<number | null>(null),
    pointOriginRef = useRef<Point | null>(null);
  const callbacksRef = useRef({
    onStrokeComplete,
    onStatusChange,
    onAction,
    onInteractionModeChange,
    onGraphPan,
    onGraphScale,
    onHideLastEquation,
  });
  const stateRef = useRef({
    preferredHand,
    interactionMode,
    selectionActive,
    canAdd,
    disabled: !!disabled,
    gestures,
  });
  const holdKeyRef = useRef("");
  const [cameraState, setCameraState] = useState<
      "idle" | "loading" | "ready" | "error"
    >("idle"),
    [message, setMessage] = useState("Enable your camera to draw in the air."),
    [dwell, setDwell] = useState(0),
    [hold, setHold] = useState<{ label: string; progress: number }>({
      label: "",
      progress: 0,
    });
  const [gesturePose, setGesturePose] = useState<GesturePose>("hover");
  const [inputMode, setInputMode] = useState<"camera" | "whiteboard">("camera");
  const [whiteboardErasing, setWhiteboardErasing] = useState(false);
  const drawingPointerIdRef = useRef<number | null>(null);
  useEffect(() => {
    callbacksRef.current = {
      onStrokeComplete,
      onStatusChange,
      onAction,
      onInteractionModeChange,
      onGraphPan,
      onGraphScale,
      onHideLastEquation,
    };
  }, [
    onStrokeComplete,
    onStatusChange,
    onAction,
    onInteractionModeChange,
    onGraphPan,
    onGraphScale,
    onHideLastEquation,
  ]);
  useEffect(() => {
    stateRef.current = {
      preferredHand,
      interactionMode,
      selectionActive,
      canAdd,
      disabled: !!disabled,
      gestures,
    };
  }, [preferredHand, interactionMode, selectionActive, canAdd, disabled, gestures]);
  const snapshot = () => {
    historyRef.current.push([...strokesRef.current]);
    if (historyRef.current.length > 50) historyRef.current.shift();
  };
  const updateHold = (label: string, progress: number) => {
    const rounded = Math.round(Math.max(0, Math.min(1, progress)) * 20) / 20,
      key = `${label}:${rounded}`;
    if (key !== holdKeyRef.current) {
      holdKeyRef.current = key;
      setHold({ label, progress: rounded });
    }
  };
  const clearHold = () => {
    if (holdKeyRef.current) {
      holdKeyRef.current = "";
      setHold({ label: "", progress: 0 });
    }
  };
  const emit = () =>
    callbacksRef.current.onStrokeComplete(
      strokesRef.current.filter((stroke) => !stroke.erased),
    );
  const setMode = (mode: typeof modeRef.current) => {
    if (mode !== modeRef.current) {
      if (modeRef.current === "erasing" && eraseChangedRef.current) {
        eraseChangedRef.current = false;
        emit();
      }
      if (mode !== "erasing") eraseSnapshotRef.current = false;
      modeRef.current = mode;
      callbacksRef.current.onStatusChange(mode);
    }
  };
  const prepare = useCallback((canvas: HTMLCanvasElement) => {
    const width = canvas.clientWidth,
      height = canvas.clientHeight,
      dpr = Math.min(devicePixelRatio, 2);
    if (
      canvas.width !== Math.floor(width * dpr) ||
      canvas.height !== Math.floor(height * dpr)
    ) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return null;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    return { context, width, height };
  }, []);
  const renderStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ready = prepare(canvas);
    if (!ready) return;
    const { context } = ready;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 4;
    context.strokeStyle = "#fff";
    strokesRef.current
      .filter((stroke) => !stroke.erased)
      .forEach(({ points }) => {
        if (points.length < 2) return;
        context.beginPath();
        points.forEach((point, index) =>
          index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y),
        );
        context.stroke();
      });
  }, [prepare]);
  const drawCursor = useCallback(
    (cursor?: Point, eraser = false, pinch = false, scalePartner?: Point) => {
      const canvas = cursorCanvasRef.current;
      if (!canvas) return;
      const ready = prepare(canvas);
      if (!ready) return;
      const { context } = ready;
      if (activeRef.current.length > 1) {
        context.lineCap = "round";
        context.lineJoin = "round";
        context.lineWidth = 4;
        context.strokeStyle = "#fff";
        context.beginPath();
        activeRef.current.forEach((point, index) =>
          index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y),
        );
        context.stroke();
      }
      if (!cursor) return;
      if (scalePartner) {
        const radius = Math.max(13, Math.min(34, distance(cursor, scalePartner) / 10));
        context.setLineDash([7, 6]);
        context.beginPath();
        context.moveTo(cursor.x, cursor.y);
        context.lineTo(scalePartner.x, scalePartner.y);
        context.lineWidth = 2;
        context.strokeStyle = "#bfdbfe";
        context.stroke();
        context.setLineDash([]);
        for (const point of [cursor, scalePartner]) {
          context.beginPath();
          context.arc(point.x, point.y, radius, 0, Math.PI * 2);
          context.fillStyle = "rgba(37,99,235,.3)";
          context.fill();
          context.lineWidth = 3;
          context.strokeStyle = "#dbeafe";
          context.stroke();
        }
        const center = {
          x: (cursor.x + scalePartner.x) / 2,
          y: (cursor.y + scalePartner.y) / 2,
        };
        context.fillStyle = "#fff";
        context.font = "700 13px system-ui";
        context.textAlign = "center";
        context.fillText("SCALE", center.x, center.y - 10);
        return;
      }
      context.beginPath();
      context.arc(
        cursor.x,
        cursor.y,
        eraser ? eraserRadius : pinch ? 11 : 8,
        0,
        Math.PI * 2,
      );
      context.fillStyle = eraser ? "rgba(239,68,68,.22)" : pinch ? "#2563eb" : "#fff";
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = eraser ? "#ef4444" : "#93c5fd";
      context.stroke();
    },
    [eraserRadius, prepare],
  );
  const finishStroke = () => {
    if (activeRef.current.length > 3) {
      snapshot();
      const points = activeRef.current;
      strokesRef.current.push({
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        raw: [...points],
        points: [...points],
        bounds: getBounds(points),
        erased: false,
      });
      activeRef.current = [];
      renderStrokes();
      emit();
    }
    previousRef.current = null;
    pinchingRef.current = false;
    if (stateRef.current.interactionMode === "canvas") setMode("hover");
  };
  const eraseAt = (cursor: Point) => {
    const hit = strokesRef.current.filter(
      (stroke) => !stroke.erased && strokeTouches(stroke, cursor, eraserRadius),
    );
    if (hit.length) {
      if (!eraseSnapshotRef.current) {
        snapshot();
        eraseSnapshotRef.current = true;
      }
      const ids = new Set(hit.map((stroke) => stroke.id));
      strokesRef.current = strokesRef.current.map((stroke) =>
        ids.has(stroke.id) ? { ...stroke, erased: true } : stroke,
      );
      eraseChangedRef.current = true;
      renderStrokes();
    }
  };
  const clearCanvas = () => {
    snapshot();
    strokesRef.current = [];
    activeRef.current = [];
    renderStrokes();
    drawCursor();
    emit();
  };
  const relativePoint = (event: React.PointerEvent): Point => {
    const root = rootRef.current;
    if (!root) return { x: 0, y: 0 };
    const rect = root.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const handleWhiteboardPointerDown = (event: React.PointerEvent) => {
    if (inputMode !== "whiteboard" || disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingPointerIdRef.current = event.pointerId;
    const point = relativePoint(event);
    if (whiteboardErasing) {
      eraseAt(point);
      drawCursor(point, true);
    } else {
      activeRef.current = [point];
      previousRef.current = point;
      pinchingRef.current = true;
      setMode("drawing");
      drawCursor(point, false, true);
    }
  };
  const handleWhiteboardPointerMove = (event: React.PointerEvent) => {
    if (inputMode !== "whiteboard" || drawingPointerIdRef.current !== event.pointerId)
      return;
    const point = relativePoint(event);
    if (whiteboardErasing) {
      eraseAt(point);
      drawCursor(point, true);
      return;
    }
    if (!pinchingRef.current) return;
    const previous = previousRef.current;
    if (!previous || distance(previous, point) > 2.2) activeRef.current.push(point);
    previousRef.current = point;
    drawCursor(point, false, true);
  };
  const handleWhiteboardPointerUp = (event: React.PointerEvent) => {
    if (inputMode !== "whiteboard" || drawingPointerIdRef.current !== event.pointerId)
      return;
    drawingPointerIdRef.current = null;
    if (whiteboardErasing) {
      eraseSnapshotRef.current = false;
      if (eraseChangedRef.current) {
        eraseChangedRef.current = false;
        emit();
      }
      setMode("hover");
    } else finishStroke();
    drawCursor();
  };
  const selectInputMode = (next: "camera" | "whiteboard") => {
    if (next === inputMode) return;
    if (next === "whiteboard" && cameraEnabledRef.current) turnOffCamera();
    activeRef.current = [];
    previousRef.current = null;
    pinchingRef.current = false;
    drawingPointerIdRef.current = null;
    setMode("hover");
    setInputMode(next);
    drawCursor();
  };
  const actionAt = (cursor: Point): AirAction | null => {
    const root = rootRef.current;
    if (!root) return null;
    const rect = root.getBoundingClientRect();
    const target = document
      .elementFromPoint(rect.left + cursor.x, rect.top + cursor.y)
      ?.closest<HTMLElement>("[data-air-action]");
    return (target?.dataset.airAction as AirAction | undefined) || null;
  };
  const loop = useCallback(() => {
    if (!cameraEnabledRef.current) return;
    const video = videoRef.current,
      detector = detectorRef.current,
      root = rootRef.current;
    if (!video || !detector || !root || video.readyState < 2) {
      frameRef.current = requestAnimationFrame(loop);
      return;
    }
    const now = performance.now();
    if (
      video.currentTime === lastVideoTimeRef.current ||
      now - lastDetectionAtRef.current < 33
    ) {
      frameRef.current = requestAnimationFrame(loop);
      return;
    }
    lastVideoTimeRef.current = video.currentTime;
    lastDetectionAtRef.current = now;
    const state = stateRef.current,
      result = detector.detectForVideo(video, now);
    const selectedIndex = result.handednesses.findIndex(
      (hand) => hand[0]?.categoryName === state.preferredHand,
    );
    const lm = selectedIndex >= 0 ? result.landmarks[selectedIndex] : undefined;
    if (!lm) {
      if (pinchingRef.current) finishStroke();
      gestureStabilizerRef.current.reset();
      setGesturePose((current) => (current === "hover" ? current : "hover"));
      setMode("hover");
      drawCursor();
      frameRef.current = requestAnimationFrame(loop);
      return;
    }
    const rootRect = root.getBoundingClientRect(),
      mediaScale = Math.max(
        rootRect.width / video.videoWidth,
        rootRect.height / video.videoHeight,
      ),
      renderWidth = video.videoWidth * mediaScale,
      renderHeight = video.videoHeight * mediaScale,
      cropX = (rootRect.width - renderWidth) / 2,
      cropY = (rootRect.height - renderHeight) / 2;
    // The camera preview is rendered as a mirrored selfie view, so mirror only
    // the landmark X coordinate to keep the cursor attached to the displayed hand.
    const mapHand = (hand: NormalizedLandmark[], index: number): Point => ({
      x: cropX + (1 - hand[index].x) * renderWidth,
      y: cropY + hand[index].y * renderHeight,
    });
    const map = (index: number): Point => mapHand(lm, index);
    const handScale = normDistance(lm[0], lm[9]);
    if (handScale < 0.07 || handScale > 0.45) {
      drawCursor();
      frameRef.current = requestAnimationFrame(loop);
      return;
    }
    const world = result.worldLandmarks[selectedIndex] || lm;
    const stablePose = gestureStabilizerRef.current.update(
      classifyGesture(lm, world),
      now,
    );
    setGesturePose((current) => (current === stablePose ? current : stablePose));
    const pinch = gestureStabilizerRef.current.updatePinch(pinchRatio(lm));
    const thumbOnly = stablePose === "thumb";
    const folded = stablePose === "fist";
    const closedHandCandidate = stablePose === "fist";
    if (folded) fistSinceRef.current ??= now;
    else fistSinceRef.current = null;
    const erasing = !!fistSinceRef.current && now - fistSinceRef.current > 140,
      cursor = erasing ? map(12) : map(8);
    const allPalms =
      state.gestures.twoPalmHide &&
      result.landmarks.length >= 2 &&
      result.landmarks.every(
        (hand, index) =>
          classifyGesture(hand, result.worldLandmarks[index] || hand) === "open-palm",
      );
    if (allPalms) {
      palmsSinceRef.current ??= now;
      updateHold("Hide active equation", (now - palmsSinceRef.current) / 5000);
    } else {
      palmsSinceRef.current = null;
      hideLatchRef.current = false;
    }
    if (
      palmsSinceRef.current &&
      now - palmsSinceRef.current >= 5000 &&
      !hideLatchRef.current
    ) {
      hideLatchRef.current = true;
      callbacksRef.current.onHideLastEquation();
      setMessage("Active equation hidden. Use its eye button to restore it.");
      clearHold();
    }
    const okay = state.gestures.modeSwitch && stablePose === "three-finger";
    if (okay) {
      okaySinceRef.current ??= now;
      updateHold(
        state.interactionMode === "canvas" ? "Open graph controls" : "Return to canvas",
        (now - okaySinceRef.current) / 1600,
      );
    } else {
      okaySinceRef.current = null;
      okayLatchRef.current = false;
    }
    if (
      okaySinceRef.current &&
      now - okaySinceRef.current > 1600 &&
      !okayLatchRef.current
    ) {
      okayLatchRef.current = true;
      activeRef.current = [];
      previousRef.current = null;
      pinchingRef.current = false;
      const next = state.interactionMode === "canvas" ? "move" : "canvas";
      callbacksRef.current.onInteractionModeChange(next);
      setMessage(next === "move" ? "Move graph mode." : "Canvas mode.");
      clearHold();
    }
    // Claim a fist before pinch processing. A tightly folded hand naturally
    // brings thumb and index close together, but it must never begin a stroke.
    if (
      state.gestures.erase &&
      closedHandCandidate &&
      state.interactionMode === "canvas"
    ) {
      if (pinchingRef.current) finishStroke();
      if (!folded) {
        setMode("hover");
        drawCursor(map(12));
        frameRef.current = requestAnimationFrame(loop);
        return;
      }
      if (!erasing) {
        setMode("hover");
        drawCursor(map(12), true);
        frameRef.current = requestAnimationFrame(loop);
        return;
      }
      setMode("erasing");
      const hit = strokesRef.current.filter(
        (stroke) => !stroke.erased && strokeTouches(stroke, cursor, eraserRadius),
      );
      if (hit.length) {
        if (!eraseSnapshotRef.current) {
          snapshot();
          eraseSnapshotRef.current = true;
        }
        const ids = new Set(hit.map((stroke) => stroke.id));
        strokesRef.current = strokesRef.current.map((stroke) =>
          ids.has(stroke.id) ? { ...stroke, erased: true } : stroke,
        );
        eraseChangedRef.current = true;
        renderStrokes();
      }
      drawCursor(cursor, true);
      frameRef.current = requestAnimationFrame(loop);
      return;
    }
    const indexOnly = stablePose === "point";
    const fourFingers = stablePose === "four-finger";
    const buttonAction = actionAt(cursor);
    if (
      state.gestures.airButtons &&
      indexOnly &&
      buttonAction === "add" &&
      !state.disabled &&
      state.canAdd
    ) {
      addSinceRef.current ??= now;
      const progress = Math.min(1, (now - addSinceRef.current) / 5000);
      setDwell(progress);
      updateHold("Add to graph", progress);
      if (progress >= 1 && !addLatchRef.current) {
        addLatchRef.current = true;
        callbacksRef.current.onAction("add");
        clearHold();
      }
    } else {
      addSinceRef.current = null;
      setDwell(0);
      if (!indexOnly) addLatchRef.current = false;
      if (!allPalms && !okay) clearHold();
    }
    if (state.gestures.select && fourFingers && buttonAction !== "add") {
      pointSinceRef.current ??= now;
      pointOriginRef.current ??= cursor;
      const stablePoint =
        distance(pointOriginRef.current, cursor) <= 24 &&
        now - pointSinceRef.current >= 700;
      if (stablePoint && !selectionLatchRef.current) {
        selectionLatchRef.current = true;
        callbacksRef.current.onAction("select");
        setMessage("Equation selection toggled.");
      }
      if (!stablePoint && distance(pointOriginRef.current, cursor) > 24) {
        pointOriginRef.current = cursor;
        pointSinceRef.current = now;
      }
    } else {
      pointSinceRef.current = null;
      pointOriginRef.current = null;
      selectionLatchRef.current = false;
    }
    if (!pinch) pinchActionLatchRef.current = false;
    if (
      state.gestures.thumbNavigate &&
      thumbOnly &&
      state.selectionActive &&
      now - lastThumbAtRef.current > 700
    ) {
      lastThumbAtRef.current = now;
      callbacksRef.current.onAction(lm[4].x < lm[2].x ? "next" : "previous");
    }
    if (state.interactionMode === "move") {
      setMode("moving");
      const allPinched = result.landmarks.filter((hand) => pinchRatio(hand) < 0.3);
      if (state.gestures.twoHandZoom && allPinched.length >= 2) {
        const gap = normDistance(allPinched[0][8], allPinched[1][8]);
        if (twoPinchDistanceRef.current)
          callbacksRef.current.onGraphScale(
            Math.max(0.94, Math.min(1.06, gap / twoPinchDistanceRef.current)),
          );
        twoPinchDistanceRef.current = gap;
        drawCursor(mapHand(allPinched[0], 8), false, false, mapHand(allPinched[1], 8));
      } else {
        twoPinchDistanceRef.current = null;
        if (state.gestures.graphMove && pinch) {
          if (lastPanRef.current)
            callbacksRef.current.onGraphPan(
              cursor.x - lastPanRef.current.x,
              cursor.y - lastPanRef.current.y,
            );
          lastPanRef.current = cursor;
        } else lastPanRef.current = null;
        drawCursor(cursor, false, pinch);
      }
      frameRef.current = requestAnimationFrame(loop);
      return;
    }
    if (
      state.gestures.airButtons &&
      pinch &&
      buttonAction &&
      !state.disabled &&
      (buttonAction !== "add" || state.canAdd)
    ) {
      if (!pinchActionLatchRef.current) {
        pinchActionLatchRef.current = true;
        callbacksRef.current.onAction(buttonAction);
      }
      drawCursor(cursor, false, true);
      frameRef.current = requestAnimationFrame(loop);
      return;
    }
    if (state.gestures.draw && pinch && !okay && !state.disabled) {
      setMode("drawing");
      const previous = previousRef.current,
        smooth = previous
          ? {
              x: previous.x * 0.65 + cursor.x * 0.35,
              y: previous.y * 0.65 + cursor.y * 0.35,
            }
          : cursor;
      if (!pinchingRef.current) activeRef.current = [smooth];
      else if (!previous || distance(previous, smooth) > 2.2)
        activeRef.current.push(smooth);
      previousRef.current = smooth;
      pinchingRef.current = true;
    } else if (pinchingRef.current) finishStroke();
    else setMode("hover");
    drawCursor(cursor, false, pinch);
    frameRef.current = requestAnimationFrame(loop);
  }, [drawCursor, eraserRadius, renderStrokes]);
  const turnOffCamera = () => {
    cameraEnabledRef.current = false;
    cancelAnimationFrame(frameRef.current);
    if (pinchingRef.current) finishStroke();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    detectorRef.current?.close();
    detectorRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    lastVideoTimeRef.current = -1;
    lastDetectionAtRef.current = 0;
    gestureStabilizerRef.current.reset();
    setGesturePose("hover");
    setCameraState("idle");
    setMessage("Camera is off. Enable it to draw in the air.");
    setDwell(0);
    clearHold();
    drawCursor();
  };
  const enable = async () => {
    try {
      setCameraState("loading");
      setMessage("Loading hand tracking...");
      const vision = await import("@mediapipe/tasks-vision"),
        fileset = await vision.FilesetResolver.forVisionTasks(WASM_ROOT);
      // MediaPipe's WASM runtime logs an informational XNNPACK delegate
      // message via console.info on init; Next.js's dev overlay treats it
      // as an error, so it's muted for the duration of detector creation.
      const originalConsoleInfo = console.info;
      console.info = () => {};
      try {
        detectorRef.current = await vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: HAND_MODEL },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });
      } finally {
        console.info = originalConsoleInfo;
      }
      setMessage("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      cameraEnabledRef.current = true;
      setCameraState("ready");
      setMessage("Pinch to draw. Raise four fingers to select.");
      frameRef.current = requestAnimationFrame(loop);
    } catch (error) {
      console.error(error);
      cameraEnabledRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      detectorRef.current?.close();
      detectorRef.current = null;
      setCameraState("error");
      setMessage("Camera access failed. Allow it in browser settings and retry.");
    }
  };
  useEffect(() => {
    const undo = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        const previous = historyRef.current.pop();
        if (previous) {
          strokesRef.current = previous;
          activeRef.current = [];
          renderStrokes();
          drawCursor();
          emit();
        }
      }
    };
    window.addEventListener("keydown", undo);
    return () => window.removeEventListener("keydown", undo);
  }, [drawCursor, renderStrokes]);
  useEffect(() => {
    clearCanvas();
  }, [clearSignal, drawCursor, renderStrokes]);
  useEffect(
    () => () => {
      cameraEnabledRef.current = false;
      cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      detectorRef.current?.close();
    },
    [],
  );
  const whiteboardReady = inputMode === "whiteboard";
  const surfaceReady = cameraState === "ready" || whiteboardReady;
  return (
    <div
      ref={rootRef}
      className={`air-canvas ${interactionMode === "move" ? "move-active" : ""} ${
        whiteboardReady ? "whiteboard-active" : ""
      }`}
    >
      {inputMode === "camera" && (
        <video ref={videoRef} className="camera-feed" muted playsInline />
      )}
      <canvas ref={canvasRef} className="stroke-layer" />
      <canvas
        ref={cursorCanvasRef}
        className="cursor-layer"
        onPointerDown={handleWhiteboardPointerDown}
        onPointerMove={handleWhiteboardPointerMove}
        onPointerUp={handleWhiteboardPointerUp}
        onPointerCancel={handleWhiteboardPointerUp}
      />
      {inputMode === "camera" && <div className="camera-overlay" />}
      <div className="air-mode-toolbar">
        <div className="air-mode-switch" role="group" aria-label="Drawing input">
          <button
            type="button"
            className={inputMode === "camera" ? "active" : ""}
            aria-pressed={inputMode === "camera"}
            onClick={() => selectInputMode("camera")}
          >
            <IconCamera size={15} /> Camera
          </button>
          <button
            type="button"
            className={whiteboardReady ? "active" : ""}
            aria-pressed={whiteboardReady}
            onClick={() => selectInputMode("whiteboard")}
          >
            <IconPencil size={15} /> Whiteboard
          </button>
        </div>
        <div className="air-mode-actions">
          {whiteboardReady && (
            <button
              type="button"
              className={whiteboardErasing ? "active" : ""}
              aria-pressed={whiteboardErasing}
              title={whiteboardErasing ? "Switch to draw" : "Switch to eraser"}
              onClick={() => setWhiteboardErasing((value) => !value)}
            >
              <IconEraser size={15} />
            </button>
          )}
          <button type="button" title="Clear canvas" onClick={clearCanvas}>
            <IconTrash size={15} />
          </button>
        </div>
      </div>
      {inputMode === "camera" && cameraState !== "ready" && (
        <div className="camera-prompt">
          <div className="camera-symbol">
            {cameraState === "loading" ? (
              <IconLoader2 className="spin" size={24} />
            ) : (
              <IconCamera size={24} />
            )}
          </div>
          <p>{message}</p>
          <button
            className="enable-camera"
            onClick={enable}
            disabled={cameraState === "loading"}
          >
            {cameraState === "loading"
              ? "Preparing"
              : cameraState === "error"
                ? "Try again"
                : "Enable camera"}
          </button>
        </div>
      )}
      {whiteboardReady && (
        <div className="whiteboard-hint">
          <IconPointFilled size={13} />
          <span>
            {whiteboardErasing
              ? "Drag to erase strokes."
              : "Click and drag to draw. Use Add to graph when ready."}
          </span>
        </div>
      )}
      {cameraState === "ready" && inputMode === "camera" && (
        <>
          {hold.label && (
            <div
              className="hold-overlay"
              style={{ "--hold": `${hold.progress * 360}deg` } as React.CSSProperties}
            >
              <span>
                {Math.ceil(
                  (1 - hold.progress) *
                    (hold.label === "Add to graph" ||
                    hold.label === "Hide active equation"
                      ? 5
                      : 1.6),
                ) || "✓"}
              </span>
              <p>{hold.label}</p>
            </div>
          )}
          <div className="camera-instruction">
            <IconPointFilled size={13} />
            <span>
              {message} · {gesturePose.replace("-", " ")}
            </span>
          </div>
          <div className="camera-off-zone">
            <button type="button" className="camera-off-button" onClick={turnOffCamera}>
              <IconCameraOff size={16} /> Turn off camera
            </button>
          </div>
          <button
            type="button"
            data-air-action="add"
            className="air-add-button"
            aria-label="Add to graph"
            title="Add to graph"
            onClick={() => onAction("add")}
            disabled={disabled || !canAdd}
          >
            <span
              className="dwell-ring"
              style={{ "--dwell": `${dwell * 360}deg` } as React.CSSProperties}
            />
            <span aria-hidden="true">+</span>
          </button>
          {selectionActive && (
            <div className="air-edit-toolbar">
              <button data-air-action="minus10" onClick={() => onAction("minus10")}>
                -10
              </button>
              <button data-air-action="minus1" onClick={() => onAction("minus1")}>
                -1
              </button>
              <strong>{selectedValue ?? 0}</strong>
              <button data-air-action="plus1" onClick={() => onAction("plus1")}>
                +1
              </button>
              <button data-air-action="plus10" onClick={() => onAction("plus10")}>
                +10
              </button>
            </div>
          )}
        </>
      )}
      {whiteboardReady && (
        <button
          type="button"
          className="air-add-button"
          aria-label="Add to graph"
          title="Add to graph"
          onClick={() => onAction("add")}
          disabled={disabled || !canAdd}
        >
          <span aria-hidden="true">+</span>
        </button>
      )}
      {surfaceReady && selectionActive && whiteboardReady && (
        <div className="air-edit-toolbar">
          <button onClick={() => onAction("minus10")}>-10</button>
          <button onClick={() => onAction("minus1")}>-1</button>
          <strong>{selectedValue ?? 0}</strong>
          <button onClick={() => onAction("plus1")}>+1</button>
          <button onClick={() => onAction("plus10")}>+10</button>
        </div>
      )}
    </div>
  );
}
