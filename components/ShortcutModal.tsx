"use client";

import React from "react";
import { SHORTCUT_REGISTRY } from "../lib/shortcuts";
import {
  IconX,
  IconKeyboard,
  IconHandFinger,
  IconSparkles,
} from "@tabler/icons-react";

interface ShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GESTURE_GUIDE = [
  {
    gesture: "Index Pointing",
    action: "Air Drawing",
    desc: "Extend only index finger to trace mathematical curves and symbols",
  },
  {
    gesture: "Index + Thumb Pinch",
    action: "Stroke Anchor",
    desc: "Pinch to initiate a distinct stroke or tap interactive UI buttons",
  },
  {
    gesture: "Open Palm (5 Fingers)",
    action: "Hover / Navigation",
    desc: "Move cursor freely across viewport without adding ink strokes",
  },
  {
    gesture: "Closed Fist",
    action: "Stroke Erase / Reset",
    desc: "Hold closed fist for 1.2s to trigger gesture quick-clear",
  },
];

export function ShortcutModal({ isOpen, onClose }: ShortcutModalProps) {
  if (!isOpen) return null;

  const categories = ["Canvas", "Navigation", "Audio", "General"] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900/95 p-6 shadow-2xl text-slate-100 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <IconKeyboard className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-semibold tracking-wide">
              Shortcuts & Gesture Reference
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-300">
            <IconHandFinger className="h-4 w-4 text-emerald-400" />
            <span>Air Canvas Gestures (Webcam)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {GESTURE_GUIDE.map((item) => (
              <div
                key={item.gesture}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-emerald-400">{item.gesture}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    {item.action}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-300">
            <IconSparkles className="h-4 w-4 text-indigo-400" />
            <span>Keyboard Hotkeys</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SHORTCUT_REGISTRY.map((shortcut) => (
              <div
                key={shortcut.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-200">{shortcut.label}</span>
                  <span className="text-[11px] text-slate-400">{shortcut.description}</span>
                </div>
                <kbd className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-indigo-300 font-semibold shadow-inner">
                  {shortcut.displayKey}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
