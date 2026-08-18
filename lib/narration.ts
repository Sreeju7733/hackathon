export type NarrationPreferences = { voiceURI: string; rate: number; volume: number };
export type NarrationStatus =
  | "idle"
  | "loading-voices"
  | "speaking"
  | "paused"
  | "error";

const KEY = "plotlyx-narrator-v1";
const defaults: NarrationPreferences = { voiceURI: "", rate: 0.93, volume: 1 };

class Narrator {
  private utterance: SpeechSynthesisUtterance | null = null;
  private stopActive: (() => void) | null = null;
  private listeners = new Set<(status: NarrationStatus, message: string) => void>();
  preferences: NarrationPreferences = defaults;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.preferences = {
          ...defaults,
          ...JSON.parse(localStorage.getItem(KEY) || "{}"),
        };
      } catch {}
    }
  }
  subscribe(listener: (status: NarrationStatus, message: string) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private emit(status: NarrationStatus, message = "") {
    this.listeners.forEach((listener) => listener(status, message));
  }
  setPreferences(next: Partial<NarrationPreferences>) {
    this.preferences = { ...this.preferences, ...next };
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(KEY, JSON.stringify(this.preferences));
      }
    } catch {}
  }
  async voices(): Promise<SpeechSynthesisVoice[]> {
    if (!("speechSynthesis" in window))
      throw new Error("This browser does not provide speech synthesis.");
    const initial = speechSynthesis.getVoices();
    if (initial.length) return initial;
    this.emit("loading-voices", "Loading system voices…");
    return new Promise((resolve, reject) => {
      const finish = () => {
        const loaded = speechSynthesis.getVoices();
        if (!loaded.length) return;
        window.clearTimeout(timer);
        speechSynthesis.removeEventListener?.("voiceschanged", finish);
        resolve(loaded);
      };
      const timer = window.setTimeout(() => {
        speechSynthesis.removeEventListener?.("voiceschanged", finish);
        reject(new Error("No browser voices are available on this device."));
      }, 3000);
      speechSynthesis.addEventListener?.("voiceschanged", finish);
      finish();
    });
  }
  async initialize() {
    const voices = await this.voices();
    this.emit(
      "idle",
      `${voices.length} voice${voices.length === 1 ? "" : "s"} available`,
    );
    return voices;
  }
  cancel() {
    const hadActiveUtterance = Boolean(this.utterance);
    this.stopActive?.();
    this.stopActive = null;
    if (
      hadActiveUtterance &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      speechSynthesis.cancel();
      speechSynthesis.resume();
    }
    this.utterance = null;
    this.emit("idle");
  }
  pause() {
    speechSynthesis.pause();
    this.emit("paused", "Narration paused");
  }
  resume() {
    speechSynthesis.resume();
    this.emit("speaking", "Narrating");
  }
  async speak(text: string): Promise<void> {
    const availableNow = speechSynthesis.getVoices();
    const voices = availableNow.length ? availableNow : await this.initialize();
    const voice =
      voices.find((item) => item.voiceURI === this.preferences.voiceURI) ||
      voices.find((item) => item.localService) ||
      voices[0];
    return new Promise((resolve, reject) => {
      const replacingActiveUtterance = Boolean(this.stopActive);
      this.stopActive?.();
      if (replacingActiveUtterance) speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      this.utterance = utterance;
      utterance.voice = voice;
      utterance.rate = this.preferences.rate;
      utterance.volume = this.preferences.volume;
      let started = false;
      let settled = false;
      const finish = (outcome: "resolved" | "rejected", error?: Error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(watchdog);
        if (this.utterance === utterance) this.utterance = null;
        if (this.stopActive === stop) this.stopActive = null;
        if (outcome === "resolved") resolve();
        else reject(error || new Error("Browser narration failed."));
      };
      const stop = () => finish("resolved");
      const watchdog = window.setTimeout(() => {
        if (!started) {
          this.emit(
            "error",
            "Narration was blocked before it started. Click Play narration or Test voice directly, then try again.",
          );
          finish("rejected", new Error("Narration did not start."));
        }
      }, 3500);
      this.stopActive = stop;
      utterance.onstart = () => {
        started = true;
        window.clearTimeout(watchdog);
        this.emit("speaking", `Narrating with ${voice.name}`);
      };
      utterance.onend = () => {
        if (!started) {
          this.emit(
            "error",
            "The browser finished narration without starting audio. Try Test voice after choosing a local system voice.",
          );
          finish("rejected", new Error("Narration ended without audio."));
          return;
        }
        this.emit("idle");
        finish("resolved");
      };
      utterance.onerror = (event) => {
        if (event.error === "canceled" || event.error === "interrupted") {
          this.emit("idle");
          finish("resolved");
          return;
        }
        const reason = event.error ? ` (${event.error})` : "";
        this.emit(
          "error",
          `Browser narration failed${reason}. Your browser or device may not expose a usable speech voice.`,
        );
        finish("rejected", new Error("Browser narration failed."));
      };
      speechSynthesis.resume();
      speechSynthesis.speak(utterance);
    });
  }
}

export const narrator = new Narrator();
