export type ShortcutAction =
  | "undo"
  | "redo"
  | "clear_canvas"
  | "toggle_draw"
  | "open_export"
  | "open_shortcuts"
  | "toggle_narration"
  | "reset_view"
  | "fit_graph";

export interface ShortcutDefinition {
  id: ShortcutAction;
  label: string;
  keys: string[];
  displayKey: string;
  category: "Canvas" | "Navigation" | "Audio" | "General";
  description: string;
}

export const SHORTCUT_REGISTRY: ShortcutDefinition[] = [
  {
    id: "undo",
    label: "Undo Stroke",
    keys: ["ctrl+z", "meta+z"],
    displayKey: "Ctrl + Z",
    category: "Canvas",
    description: "Remove the most recently drawn stroke",
  },
  {
    id: "redo",
    label: "Redo Stroke",
    keys: ["ctrl+y", "meta+y", "ctrl+shift+z", "meta+shift+z"],
    displayKey: "Ctrl + Y",
    category: "Canvas",
    description: "Restore previously undone stroke",
  },
  {
    id: "clear_canvas",
    label: "Clear Air Canvas",
    keys: ["ctrl+k", "meta+k"],
    displayKey: "Ctrl + K",
    category: "Canvas",
    description: "Erase all current strokes on air canvas",
  },
  {
    id: "toggle_draw",
    label: "Toggle Air Drawing",
    keys: [" "],
    displayKey: "Space",
    category: "Canvas",
    description: "Toggle between air drawing and navigation mode",
  },
  {
    id: "open_export",
    label: "Export Graph",
    keys: ["ctrl+e", "meta+e"],
    displayKey: "Ctrl + E",
    category: "General",
    description: "Open SVG, PNG, and LaTeX export dialog",
  },
  {
    id: "open_shortcuts",
    label: "Shortcut Reference",
    keys: ["?", "ctrl+/", "meta+/"],
    displayKey: "? or Ctrl + /",
    category: "General",
    description: "Display list of hotkeys and gestures",
  },
  {
    id: "toggle_narration",
    label: "Toggle Speech Audio",
    keys: ["m"],
    displayKey: "M",
    category: "Audio",
    description: "Mute or unmute equation speech synthesis",
  },
  {
    id: "reset_view",
    label: "Reset Viewport",
    keys: ["r"],
    displayKey: "R",
    category: "Navigation",
    description: "Reset graph zoom and center coordinates",
  },
  {
    id: "fit_graph",
    label: "Auto-Fit Curves",
    keys: ["f"],
    displayKey: "F",
    category: "Navigation",
    description: "Automatically scale viewport to fit all active equations",
  },
];

export function isTargetEditable(target: EventTarget | null): boolean {
  if (!target) return false;
  const element = target as unknown as Record<string, unknown>;
  const tagName = typeof element.tagName === "string" ? element.tagName.toLowerCase() : "";
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    Boolean(element.isContentEditable)
  );
}

export function matchKeyboardEvent(
  event: KeyboardEvent,
  registry: ShortcutDefinition[] = SHORTCUT_REGISTRY,
): ShortcutAction | null {
  if (isTargetEditable(event.target)) return null;

  const isCtrl = event.ctrlKey || event.metaKey;
  const isShift = event.shiftKey;
  const key = event.key.toLowerCase();

  for (const item of registry) {
    for (const pattern of item.keys) {
      const parts = pattern.toLowerCase().split("+");
      const needsCtrl = parts.includes("ctrl") || parts.includes("meta");
      const needsShift = parts.includes("shift");
      const targetKey = parts.filter((p) => p !== "ctrl" && p !== "meta" && p !== "shift")[0];

      if (
        needsCtrl === isCtrl &&
        needsShift === isShift &&
        (targetKey === key || (targetKey === " " && key === " "))
      ) {
        return item.id;
      }
    }
  }
  return null;
}

export function setupKeyboardShortcuts(
  handlers: Partial<Record<ShortcutAction, () => void>>,
): () => void {
  if (typeof window === "undefined") return () => {};

  const listener = (event: KeyboardEvent) => {
    const action = matchKeyboardEvent(event);
    if (action && handlers[action]) {
      event.preventDefault();
      handlers[action]!();
    }
  };

  window.addEventListener("keydown", listener);
  return () => window.removeEventListener("keydown", listener);
}
