"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ redirectTo: "/login" })}
      className="text-sm text-slate-500 hover:text-slate-800"
    >
      Sign out
    </button>
  );
}
