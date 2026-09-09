"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
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
        className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-green px-5 py-2.5 text-base font-medium text-white hover:bg-brand-green-dark disabled:opacity-60"
      >
        {!isPending && <Sparkles size={18} aria-hidden="true" />}
        {isPending ? pendingLabel : label}
      </button>
      {error && (
        <p className="mt-2 text-base text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
