import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CasMasthead } from "@/components/assessment/cas-masthead";

export default async function AssessmentHomePage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId },
    include: { subject: true, grade: true, section: true, academicYear: true },
    orderBy: { grade: { order: "asc" } },
  });

  return (
    <div className="cas-theme">
      <CasMasthead
        eyebrow="Continuous Assessment"
        title="Assessment"
        subtitle="Select a class to record continuous assessment scores by unit."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assignments.map((assignment) => (
          <Link
            key={assignment.id}
            href={`/teacher/assessment/${assignment.id}`}
            className="cas-card p-4 hover:border-[color:var(--cas-accent)]"
          >
            <p className="font-medium text-[color:var(--cas-ink)]">
              {assignment.grade.name} - {assignment.section.name}
            </p>
            <p className="text-sm text-[color:var(--cas-ink-dim)]">{assignment.subject.name}</p>
            <p className="cas-label mt-3">{assignment.academicYear.name}</p>
          </Link>
        ))}
        {assignments.length === 0 && (
          <p className="text-sm text-[color:var(--cas-ink-faint)]">
            No classes assigned yet. Ask your school admin to assign you a subject and class.
          </p>
        )}
      </div>
    </div>
  );
}
