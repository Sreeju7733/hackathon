"use client";

import React, { useState } from "react";
import type { Equation } from "../lib/equations";
import type { GraphViewport } from "../lib/graph";
import {
  exportToSvg,
  exportToLatexBundle,
  exportToDataJson,
  downloadBlob,
  copyToClipboard,
} from "../lib/export";
import {
  IconX,
  IconDownload,
  IconCopy,
  IconCheck,
  IconCode,
  IconPhoto,
  IconFileText,
  IconBraces,
} from "@tabler/icons-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  equations: Equation[];
  viewport: GraphViewport;
}

export function ExportModal({ isOpen, onClose, equations, viewport }: ExportModalProps) {
  const [tab, setTab] = useState<"svg" | "latex" | "json">("svg");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const svgContent = exportToSvg(equations, viewport);
  const latexContent = exportToLatexBundle(equations);
  const jsonContent = exportToDataJson(equations, viewport);

  const activeContent =
    tab === "svg" ? svgContent : tab === "latex" ? latexContent : jsonContent;

  const handleCopy = async () => {
    const success = await copyToClipboard(activeContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (tab === "svg") {
      downloadBlob(svgContent, "plotlyx-export.svg", "image/svg+xml");
    } else if (tab === "latex") {
      downloadBlob(latexContent, "equations.tex", "text/plain");
    } else {
      downloadBlob(jsonContent, "plotlyx-session.json", "application/json");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900/95 p-6 shadow-2xl text-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <IconDownload className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold tracking-wide">Export Graph & Formulas</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setTab("svg")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === "svg" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            <IconPhoto className="h-4 w-4" /> SVG Vector
          </button>
          <button
            onClick={() => setTab("latex")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === "latex" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            <IconFileText className="h-4 w-4" /> LaTeX Document
          </button>
          <button
            onClick={() => setTab("json")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === "json" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            <IconBraces className="h-4 w-4" /> JSON Session
          </button>
        </div>

        <div className="relative">
          <pre className="max-h-60 overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 border border-slate-800 leading-relaxed">
            {activeContent}
          </pre>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            {equations.filter((e) => e.visible).length} active curve(s) in current viewport
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700"
            >
              {copied ? (
                <>
                  <IconCheck className="h-4 w-4 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <IconCopy className="h-4 w-4" /> Copy to Clipboard
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-500/20 transition-colors"
            >
              <IconDownload className="h-4 w-4" /> Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
