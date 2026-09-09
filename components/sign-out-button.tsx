"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ redirectTo: "/login" })}
      className="flex min-h-11 items-center gap-1.5 rounded-md px-3 py-2 text-base text-slate-500 hover:bg-slate-100 hover:text-slate-800"
    >
      <LogOut size={18} aria-hidden="true" />
      Sign out
    </button>
  );
}
