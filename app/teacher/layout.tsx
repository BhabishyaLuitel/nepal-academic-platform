import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutGrid, BookOpen, ClipboardCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/teacher", label: "My Classes", icon: LayoutGrid },
  { href: "/teacher/curriculum", label: "Curriculum", icon: BookOpen },
  { href: "/teacher/assessment", label: "Assessment", icon: ClipboardCheck },
];

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-1.5 bg-brand-navy" />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">Teacher</p>
            <p className="text-lg font-semibold text-slate-900">{session.user.name}</p>
          </div>
          <SignOutButton />
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center gap-2 rounded-t-md px-3 py-2 text-base text-slate-600 hover:bg-slate-100 hover:text-brand-green"
            >
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
