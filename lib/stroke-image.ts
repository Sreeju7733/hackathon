import type { Stroke } from "./recognition";

type PointBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

/** Creates the compact, high-contrast image sent to cloud recognition. */
export function strokesToPng(strokes: Stroke[], size = 512): string | null {
  const visible = strokes.filter(
    (stroke) => !stroke.erased && stroke.points.length > 1,
  );
  const points = visible.flatMap((stroke) => stroke.points);
  if (!points.length) return null;

  const padding = 38;
  const bounds = getPointBounds(points);
  const scale = getCanvasScale(bounds, size, padding);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return null;
  configureCanvas(context, size);

  for (const stroke of visible) {
    drawStroke(context, stroke, bounds, scale, padding);
  }

  return canvas.toDataURL("image/png");
}

function getPointBounds(points: Stroke["points"]): PointBounds {
  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

function getCanvasScale(bounds: PointBounds, size: number, padding: number): number {
  const availableSize = size - padding * 2;
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);

  return Math.min(availableSize / width, availableSize / height);
}

function configureCanvas(context: CanvasRenderingContext2D, size: number) {
  context.fillStyle = "#000";
  context.fillRect(0, 0, size, size);
  context.strokeStyle = "#fff";
  context.lineWidth = Math.max(5, Math.min(11, size / 62));
  context.lineCap = "round";
  context.lineJoin = "round";
}

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: Stroke,
  bounds: PointBounds,
  scale: number,
  padding: number,
) {
  context.beginPath();

  stroke.points.forEach((point, index) => {
    const x = padding + (point.x - bounds.minX) * scale;
    const y = padding + (point.y - bounds.minY) * scale;

    if (index) context.lineTo(x, y);
    else context.moveTo(x, y);
  });

  context.stroke();
}
