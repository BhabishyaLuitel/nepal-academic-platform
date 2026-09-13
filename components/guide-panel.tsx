"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

/**
 * A toggleable side panel with usage guidance, matching the request for a
 * "side div" explaining how the CAS system and rubrics work — so a
 * non-technical teacher/admin never has to guess or be re-trained. Content is
 * passed as children so teacher and admin pages can show different guidance
 * from the same shell.
 */
export function GuidePanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cas-card inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[color:var(--cas-accent)]"
      >
        <HelpCircle size={16} aria-hidden="true" />
        Guide
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close guide"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-[color:var(--cas-surface)] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--cas-ink)]">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1 text-[color:var(--cas-ink-faint)] hover:text-[color:var(--cas-ink)]"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 space-y-5 text-sm text-[color:var(--cas-ink-dim)]">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}

export function GuideSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="cas-label mb-2">{title}</h3>
      <div className="space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}
