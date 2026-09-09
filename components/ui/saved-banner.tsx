import { CheckCircle2 } from "lucide-react";

/**
 * Explicit confirmation after a save. Users who are unsure of themselves
 * around technology often worry a tap "didn't work" or that they broke
 * something — the page silently re-rendering isn't enough reassurance
 * (Nielsen's "visibility of system status").
 */
export function SavedBanner({ message = "Saved" }: { message?: string }) {
  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-2 rounded-md border border-brand-green bg-brand-lime/20 px-4 py-3 text-base font-medium text-brand-green-dark"
    >
      <CheckCircle2 size={20} aria-hidden="true" />
      {message}
    </div>
  );
}
