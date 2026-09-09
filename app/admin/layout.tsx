import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  School,
  Users,
  BookMarked,
  UserRound,
  ClipboardList,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/academic-years", label: "Academic Years", icon: CalendarRange },
  { href: "/admin/grades", label: "Grades & Sections", icon: School },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/subjects", label: "Subjects", icon: BookMarked },
  { href: "/admin/teachers", label: "Teachers", icon: UserRound },
  { href: "/admin/assignments", label: "Assignments", icon: ClipboardList },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SCHOOL_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-1.5 bg-brand-navy" />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">School Admin</p>
            <p className="text-lg font-semibold text-slate-900">{session.user.name}</p>
          </div>
          <SignOutButton />
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 px-6">
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
