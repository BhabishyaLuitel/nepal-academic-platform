"use client";

import { useActionState } from "react";
import { generateLessonPlan } from "./actions";

export function GenerateForm({
  periodId,
  label,
  pendingLabel,
}: {
  periodId: string;
  label: string;
  pendingLabel: string;
}) {
  const [error, formAction, isPending] = useActionState(generateLessonPlan, undefined);

  return (
    <form action={formAction}>
      <input type="hidden" name="periodId" value={periodId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark disabled:opacity-60"
      >
        {isPending ? pendingLabel : label}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
