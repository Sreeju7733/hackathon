import type { Stroke } from "./recognition";

export interface HistoryState {
  past: Stroke[][];
  present: Stroke[];
  future: Stroke[][];
  maxDepth: number;
}

export class HistoryManager {
  private past: Stroke[][] = [];
  private present: Stroke[] = [];
  private future: Stroke[][] = [];
  private readonly maxDepth: number;

  constructor(initialStrokes: Stroke[] = [], maxDepth = 50) {
    this.present = this.cloneStrokes(initialStrokes);
    this.maxDepth = maxDepth;
  }

  private cloneStrokes(strokes: Stroke[]): Stroke[] {
    return strokes.map((s) => ({
      ...s,
      raw: s.raw ? s.raw.map((p) => ({ ...p })) : [],
      points: s.points ? s.points.map((p) => ({ ...p })) : [],
      bounds: s.bounds ? { ...s.bounds } : { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 },
    }));
  }

  get current(): Stroke[] {
    return this.cloneStrokes(this.present);
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  get depth(): { past: number; future: number } {
    return {
      past: this.past.length,
      future: this.future.length,
    };
  }

  push(nextStrokes: Stroke[]): void {
    this.past.push(this.cloneStrokes(this.present));
    if (this.past.length > this.maxDepth) {
      this.past.shift();
    }
    this.present = this.cloneStrokes(nextStrokes);
    this.future = [];
  }

  undo(): Stroke[] | null {
    if (!this.canUndo) return null;
    const previous = this.past.pop()!;
    this.future.unshift(this.cloneStrokes(this.present));
    this.present = previous;
    return this.current;
  }

  redo(): Stroke[] | null {
    if (!this.canRedo) return null;
    const next = this.future.shift()!;
    this.past.push(this.cloneStrokes(this.present));
    this.present = next;
    return this.current;
  }

  clear(): void {
    if (this.present.length > 0) {
      this.past.push(this.cloneStrokes(this.present));
      if (this.past.length > this.maxDepth) {
        this.past.shift();
      }
    }
    this.present = [];
    this.future = [];
  }

  reset(strokes: Stroke[] = []): void {
    this.past = [];
    this.present = this.cloneStrokes(strokes);
    this.future = [];
  }

  getState(): HistoryState {
    return {
      past: this.past.map(this.cloneStrokes),
      present: this.cloneStrokes(this.present),
      future: this.future.map(this.cloneStrokes),
      maxDepth: this.maxDepth,
    };
  }
}
