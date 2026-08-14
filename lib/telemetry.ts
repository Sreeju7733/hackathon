export interface TelemetryMetric {
  id: string;
  type: "recognition" | "inference" | "fps" | "gesture" | "error";
  durationMs?: number;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface TelemetrySummary {
  sampleCount: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  errorCount: number;
}

class TelemetryCollector {
  private buffer: TelemetryMetric[] = [];
  private readonly maxEntries: number;

  constructor(maxEntries = 200) {
    this.maxEntries = maxEntries;
  }

  record(metric: Omit<TelemetryMetric, "id" | "timestamp">): TelemetryMetric {
    const entry: TelemetryMetric = {
      ...metric,
      id: Math.random().toString(36).slice(2, 9),
      timestamp: Date.now(),
    };
    this.buffer.push(entry);
    if (this.buffer.length > this.maxEntries) {
      this.buffer.shift();
    }
    return entry;
  }

  timeAsync<T>(
    type: "recognition" | "inference" | "gesture",
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>,
  ): Promise<T> {
    const start = performance.now();
    return fn()
      .then((res) => {
        const durationMs = performance.now() - start;
        this.record({ type, durationMs, metadata });
        return res;
      })
      .catch((err) => {
        const durationMs = performance.now() - start;
        this.record({
          type: "error",
          durationMs,
          metadata: { ...metadata, error: String(err) },
        });
        throw err;
      });
  }

  getSummary(type: TelemetryMetric["type"] = "recognition"): TelemetrySummary {
    const matched = this.buffer.filter((m) => m.type === type && typeof m.durationMs === "number");
    const errorCount = this.buffer.filter((m) => m.type === "error").length;

    if (!matched.length) {
      return {
        sampleCount: 0,
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        errorCount,
      };
    }

    const durations = matched.map((m) => m.durationMs!).sort((a, b) => a - b);
    const sum = durations.reduce((acc, d) => acc + d, 0);
    const p95Idx = Math.min(durations.length - 1, Math.floor(durations.length * 0.95));

    return {
      sampleCount: durations.length,
      avgLatencyMs: Number((sum / durations.length).toFixed(2)),
      p95LatencyMs: Number(durations[p95Idx].toFixed(2)),
      minLatencyMs: Number(durations[0].toFixed(2)),
      maxLatencyMs: Number(durations[durations.length - 1].toFixed(2)),
      errorCount,
    };
  }

  getRecent(limit = 20): TelemetryMetric[] {
    return [...this.buffer].slice(-limit);
  }

  clear(): void {
    this.buffer = [];
  }
}

export const telemetry = new TelemetryCollector();
