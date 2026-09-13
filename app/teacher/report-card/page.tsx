import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CasMasthead } from "@/components/assessment/cas-masthead";

export default async function ReportCardHomePage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId },
    include: { grade: true, section: true },
    orderBy: { grade: { order: "asc" } },
  });

  const sectionsById = new Map<string, { id: string; gradeName: string; sectionName: string }>();
  for (const a of assignments) {
    sectionsById.set(a.sectionId, {
      id: a.sectionId,
      gradeName: a.grade.name,
      sectionName: a.section.name,
    });
  }
  const sections = [...sectionsById.values()];

  return (
    <div className="cas-theme">
      <CasMasthead
        eyebrow="Report Cards"
        title="Report Card"
        subtitle="Select a class to view auto-calculated GPA, WGPA, and Percentage per student."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={`/teacher/report-card/${section.id}`}
            className="cas-card p-4 hover:border-[color:var(--cas-accent)]"
          >
            <p className="font-medium text-[color:var(--cas-ink)]">
              {section.gradeName} - {section.sectionName}
            </p>
          </Link>
        ))}
        {sections.length === 0 && (
          <p className="text-sm text-[color:var(--cas-ink-faint)]">
            No classes assigned yet. Ask your school admin to assign you a subject and class.
          </p>
        )}
      </div>
    </div>
  );
}
