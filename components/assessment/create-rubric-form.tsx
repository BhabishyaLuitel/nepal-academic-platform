"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PendingButton } from "@/components/ui/pending-button";

type CriterionDraft = { key: number; name: string; level4: string; level3: string; level2: string; level1: string };

let nextKey = 0;
function emptyCriterion(): CriterionDraft {
  nextKey += 1;
  return { key: nextKey, name: "", level4: "", level3: "", level2: "", level1: "" };
}

export function CreateRubricForm({
  action,
  hiddenFields,
}: {
  action: (formData: FormData) => void;
  hiddenFields: Record<string, string>;
}) {
  const [criteria, setCriteria] = useState<CriterionDraft[]>(() => [
    emptyCriterion(),
    emptyCriterion(),
  ]);

  function updateCriterion(key: number, field: keyof CriterionDraft, value: string) {
    setCriteria((prev) => prev.map((c) => (c.key === key ? { ...c, [field]: value } : c)));
  }

  return (
    <form action={action} className="cas-card space-y-5 p-6">
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div>
        <label className="cas-label mb-1 block">Rubric title</label>
        <input name="title" required className="cas-text" placeholder="e.g. Local Heritage Exploration" />
      </div>
      <div>
        <label className="cas-label mb-1 block">Description</label>
        <input
          name="description"
          required
          className="cas-text"
          placeholder="What this rubric is assessing"
        />
      </div>

      <div className="space-y-4">
        <p className="cas-label">Criteria (each scored 4 · Excellent down to 1 · Needs work)</p>
        {criteria.map((c, i) => (
          <div key={c.key} className="cas-card space-y-2 p-4">
            <div className="flex items-center gap-2">
              <input
                name="criterionName"
                required
                value={c.name}
                onChange={(e) => updateCriterion(c.key, "name", e.target.value)}
                className="cas-text flex-1"
                placeholder={`Criterion ${i + 1} name`}
              />
              {criteria.length > 1 && (
                <button
                  type="button"
                  onClick={() => setCriteria((prev) => prev.filter((x) => x.key !== c.key))}
                  className="p-1.5 text-[color:var(--cas-ink-faint)] hover:text-red-600"
                  aria-label="Remove criterion"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="criterionLevel4"
                required
                value={c.level4}
                onChange={(e) => updateCriterion(c.key, "level4", e.target.value)}
                className="cas-text"
                placeholder="4 · Excellent description"
              />
              <input
                name="criterionLevel3"
                required
                value={c.level3}
                onChange={(e) => updateCriterion(c.key, "level3", e.target.value)}
                className="cas-text"
                placeholder="3 · Good description"
              />
              <input
                name="criterionLevel2"
                required
                value={c.level2}
                onChange={(e) => updateCriterion(c.key, "level2", e.target.value)}
                className="cas-text"
                placeholder="2 · Basic description"
              />
              <input
                name="criterionLevel1"
                required
                value={c.level1}
                onChange={(e) => updateCriterion(c.key, "level1", e.target.value)}
                className="cas-text"
                placeholder="1 · Needs work description"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setCriteria((prev) => [...prev, emptyCriterion()])}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--cas-accent)]"
        >
          <Plus size={16} aria-hidden="true" />
          Add criterion
        </button>
      </div>

      <PendingButton pendingLabel="Creating...">Create rubric</PendingButton>
    </form>
  );
}
