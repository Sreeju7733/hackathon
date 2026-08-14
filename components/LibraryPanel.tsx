"use client";

import { useMemo, useState } from "react";
import { IconBook2, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import type { LibrarySession } from "../lib/library";

export function LibraryPanel({
  sessions,
  onClose,
  onRestore,
  onDelete,
}: {
  sessions: LibrarySession[];
  onClose: () => void;
  onRestore: (session: LibrarySession) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [closing, setClosing] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const close = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 190);
  };
  const requestDelete = (id: string) => {
    if (deletingIds.has(id)) return;
    setDeletingIds((current) => new Set(current).add(id));
    window.setTimeout(() => onDelete(id), 300);
  };
  const found = useMemo(
    () =>
      sessions.filter((session) =>
        `${session.latex} ${session.canonicalExpression} ${session.explanation?.title || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, sessions],
  );
  return (
    <div
      className={`library-backdrop ${closing ? "is-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="library-title"
      onMouseDown={close}
    >
      <aside className="library-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <p>Local library</p>
            <h2 id="library-title">Your sessions</h2>
          </div>
          <button aria-label="Close library" onClick={close}>
            <IconX size={21} />
          </button>
        </header>
        <label className="library-search">
          <IconSearch size={17} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search equations and lessons"
          />
        </label>
        <p className="library-count">{found.length} saved locally on this device</p>
        <div className="library-list">
          {found.length ? (
            found.map((session) => (
              <article
                className={`library-item ${deletingIds.has(session.id) ? "is-deleting" : ""}`}
                key={session.id}
              >
                <button
                  className="library-item-content"
                  disabled={deletingIds.has(session.id)}
                  onClick={() => {
                    setClosing(true);
                    window.setTimeout(() => onRestore(session), 190);
                  }}
                >
                  <span className={`library-kind ${session.kind}`}>
                    {session.kind === "graph" ? "Graph" : "Formula"}
                  </span>
                  <strong className="library-expression">
                    {session.canonicalExpression || session.latex}
                  </strong>
                  <small>
                    {session.explanation?.title || "Saved expression"} ·{" "}
                    {new Date(session.createdAt).toLocaleDateString()}
                  </small>
                </button>
                <button
                  className="library-delete"
                  aria-label={`Delete ${session.kind} history item`}
                  disabled={deletingIds.has(session.id)}
                  onClick={() => requestDelete(session.id)}
                >
                  <IconTrash size={16} />
                </button>
              </article>
            ))
          ) : (
            <div className="library-empty">
              <IconBook2 size={24} />
              <strong>No matching sessions</strong>
              <span>Draw an expression to save it here.</span>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
