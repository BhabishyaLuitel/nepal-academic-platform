"use client";

import { useState } from "react";
import { computeRubricResult } from "@/lib/grading";

type Criterion = {
  id: string;
  name: string;
  level4: string;
  level3: string;
  level2: string;
  level1: string;
};

type RubricData = {
  id: string;
  title: string;
  description: string;
  criteria: Criterion[];
};

const LEVEL_HEADS = [
  { level: 4, label: "4 · Excellent" },
  { level: 3, label: "3 · Good" },
  { level: 2, label: "2 · Basic" },
  { level: 1, label: "1 · Needs work" },
] as const;

/**
 * Level cells are click/keyboard-selectable but never contenteditable — a
 * cell that's both lets the browser's native focus-on-mousedown race ahead
 * of any JS click-vs-edit guard, so a real click can't tell "select" from
 * "start editing" apart (confirmed in the reference artifact this mirrors).
 * Editable text, where needed, must live in a separate element.
 */
export function RubricScorer({
  rubrics,
  initialScores,
}: {
  rubrics: RubricData[];
  initialScores: Record<string, number>;
}) {
  const [scores, setScores] = useState<Record<string, number>>(initialScores);

  function selectLevel(criterionId: string, level: number) {
    setScores((prev) => ({ ...prev, [criterionId]: level }));
  }

  return (
    <div className="space-y-6">
      {rubrics.map((rubric) => {
        const result = computeRubricResult(
          rubric.criteria.map((c) => ({ level: scores[c.id] ?? null })),
        );
        const anyScored = rubric.criteria.some((c) => scores[c.id] != null);

        return (
          <div key={rubric.id} className="cas-card overflow-x-auto">
            <div className="cas-card-head px-4 py-3">
              <p className="font-medium text-[color:var(--cas-ink)]">{rubric.title}</p>
              <p className="text-sm text-[color:var(--cas-ink-dim)]">{rubric.description}</p>
            </div>
            <table className="cas-table w-full text-left text-sm" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th className="px-3 py-2">Criterion</th>
                  {LEVEL_HEADS.map((h) => (
                    <th key={h.level} className="px-3 py-2">
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rubric.criteria.map((c) => {
                  const selected = scores[c.id];
                  const levelText: Record<number, string> = {
                    4: c.level4,
                    3: c.level3,
                    2: c.level2,
                    1: c.level1,
                  };
                  return (
                    <tr key={c.id}>
                      <td className="px-3 py-2 align-top font-medium text-[color:var(--cas-ink)]">
                        {c.name}
                      </td>
                      {LEVEL_HEADS.map((h) => {
                        const isSelected = selected === h.level;
                        return (
                          <td
                            key={h.level}
                            tabIndex={0}
                            role="button"
                            aria-pressed={isSelected}
                            onClick={() => selectLevel(c.id, h.level)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                selectLevel(c.id, h.level);
                              }
                            }}
                            className="cursor-pointer select-none px-3 py-2 align-top text-xs outline-none"
                            style={{
                              color: isSelected ? "var(--cas-ink)" : "var(--cas-ink-dim)",
                              background: isSelected
                                ? "color-mix(in srgb, var(--cas-accent) 14%, var(--cas-surface))"
                                : undefined,
                              boxShadow: isSelected ? "inset 0 0 0 2px var(--cas-accent)" : undefined,
                            }}
                          >
                            {levelText[h.level]}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="px-3 py-3 text-right text-[color:var(--cas-ink-dim)]">
                    Sum &middot; Percentage &middot; Grade
                  </td>
                  <td colSpan={3} className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="cas-readout">
                        {result.sum} / {result.totalPossible}
                      </span>
                      <span className="cas-readout">{anyScored ? `${result.percentage.toFixed(1)}%` : "—"}</span>
                      <span className="cas-readout grade">
                        {anyScored ? `${result.grade} (GPA ${result.gpa})` : "—"}
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
            {rubric.criteria.map((c) => (
              <input key={c.id} type="hidden" name={`rubric_${c.id}`} value={scores[c.id] ?? ""} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
