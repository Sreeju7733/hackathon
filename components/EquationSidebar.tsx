import { useState } from "react";
import { IconEye, IconEyeOff, IconTrash } from "@tabler/icons-react";
import { MathPreview } from "./MathPreview";
import type { Equation } from "../lib/equations";

type Props = {
  equations: Equation[];
  lastEquation?: Equation;
  selectedNumberIndex: number;
  selectionActive: boolean;
  onNew: () => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
};

export function EquationSidebar({
  equations,
  lastEquation,
  selectedNumberIndex,
  selectionActive,
  onNew,
  onToggleVisibility,
  onDelete,
}: Props) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const requestDelete = (id: string) => {
    if (deletingIds.has(id)) return;
    setDeletingIds((current) => new Set(current).add(id));
    window.setTimeout(() => onDelete(id), 280);
  };

  return (
    <aside className="equation-sidebar">
      <div className="section-heading">
        <p>Equations</p>
        <button className="text-button" onClick={onNew}>
          New
        </button>
      </div>
      <div className="equation-list">
        {!equations.length && (
          <p className="empty-equations">Confirmed equations appear here.</p>
        )}
        {equations.map((equation) => (
          <EquationRow
            key={equation.id}
            equation={equation}
            isSelected={selectionActive && equation.id === lastEquation?.id}
            selectedNumberIndex={selectedNumberIndex}
            isDeleting={deletingIds.has(equation.id)}
            onToggleVisibility={onToggleVisibility}
            onDelete={requestDelete}
          />
        ))}
      </div>
    </aside>
  );
}

type RowProps = {
  equation: Equation;
  isSelected: boolean;
  selectedNumberIndex: number;
  isDeleting: boolean;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
};

function EquationRow({
  equation,
  isSelected,
  selectedNumberIndex,
  isDeleting,
  onToggleVisibility,
  onDelete,
}: RowProps) {
  return (
    <div
      className={`equation-row ${equation.visible ? "active" : "disabled"} ${
        isDeleting ? "is-deleting" : ""
      }`}
    >
      <span className="equation-swatch" style={{ background: equation.color }} />
      <EquationLabel
        equation={equation}
        isSelected={isSelected}
        selectedNumberIndex={selectedNumberIndex}
      />
      <button
        aria-label={equation.visible ? "Hide equation" : "Show equation"}
        onClick={() => onToggleVisibility(equation.id)}
      >
        {equation.visible ? <IconEye size={16} /> : <IconEyeOff size={16} />}
      </button>
      <button
        aria-label="Delete equation"
        disabled={isDeleting}
        onClick={() => onDelete(equation.id)}
      >
        <IconTrash size={16} />
      </button>
    </div>
  );
}

function EquationLabel({
  equation,
  isSelected,
  selectedNumberIndex,
}: {
  equation: Equation;
  isSelected: boolean;
  selectedNumberIndex: number;
}) {
  if (!isSelected) return <MathPreview latex={equation.latex} />;

  let numberIndex = -1;
  return (
    <span
      className="editable-equation"
      aria-label={`Selected equation ${equation.canonicalExpression}`}
    >
      {equation.canonicalExpression.split(/(\d+(?:\.\d+)?)/g).map((part, index) => {
        if (!/^\d+(?:\.\d+)?$/.test(part)) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        numberIndex += 1;
        return (
          <span
            key={`${part}-${index}`}
            className={numberIndex === selectedNumberIndex ? "selected-token" : ""}
          >
            {part}
          </span>
        );
      })}
    </span>
  );
}
