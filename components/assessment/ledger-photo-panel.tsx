"use client";

import { useActionState } from "react";
import { Camera } from "lucide-react";
import { uploadLedgerPhoto } from "@/app/teacher/assessment/[assignmentId]/[unitId]/actions";

export function LedgerPhotoPanel({
  assignmentId,
  unitId,
  studentId,
  photoDataUrl,
}: {
  assignmentId: string;
  unitId: string;
  studentId: string;
  photoDataUrl: string | null;
}) {
  const [error, formAction, isPending] = useActionState(uploadLedgerPhoto, undefined);

  return (
    <div className="cas-card p-4">
      <p className="cas-label mb-2">Paper ledger photo</p>
      <p className="mb-3 text-xs text-[color:var(--cas-ink-dim)]">
        Photograph the filled-in paper ledger page for this student and unit. Scores read
        from it are filled into the form on the left for you to check and save — nothing
        is saved without your review.
      </p>

      {photoDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- a per-student uploaded photo, not a static asset next/image can optimize
        <img
          src={photoDataUrl}
          alt="Uploaded paper ledger page"
          className="mb-3 w-full rounded-lg border border-[color:var(--cas-border)]"
        />
      )}

      <form action={formAction}>
        <input type="hidden" name="assignmentId" value={assignmentId} />
        <input type="hidden" name="unitId" value={unitId} />
        <input type="hidden" name="studentId" value={studentId} />
        <input type="file" name="photo" accept="image/*" capture="environment" required className="cas-text" />
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-green px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-green-dark disabled:opacity-60"
        >
          <Camera size={16} aria-hidden="true" />
          {isPending ? "Reading photo..." : photoDataUrl ? "Replace & re-scan" : "Upload & auto-fill"}
        </button>
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
