import { type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// Inputs and buttons target a minimum 44px height (WCAG 2.5.5 / Apple / Material
// guidance) and 16px text, since small text and small tap targets are two of the
// most common barriers for less tech-confident and older users.
const fieldClasses =
  "mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-base font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fieldClasses} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={fieldClasses} />;
}

export function SubmitButton({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="submit"
      className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-green px-5 py-2.5 text-base font-medium text-white hover:bg-brand-green-dark"
    >
      {Icon && <Icon size={18} aria-hidden="true" />}
      {children}
    </button>
  );
}
