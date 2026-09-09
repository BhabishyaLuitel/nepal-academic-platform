"use client";

import { useFormStatus } from "react-dom";

export function PendingButton({
  children,
  pendingLabel,
  icon,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  icon?: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-green px-5 py-2.5 text-base font-medium text-white hover:bg-brand-green-dark disabled:opacity-60"
    >
      {icon && !pending && icon}
      {pending ? pendingLabel : children}
    </button>
  );
}
