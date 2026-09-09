"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { authenticate } from "./actions";

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value="/" />
      <div>
        <label htmlFor="email" className="block text-base font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-base font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>
      {errorMessage && (
        <p className="text-base text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-green px-4 py-2.5 text-base font-medium text-white hover:bg-brand-green-dark disabled:opacity-60"
      >
        {!isPending && <LogIn size={18} aria-hidden="true" />}
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
