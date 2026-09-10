import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeacherHomePage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId },
    include: { subject: true, grade: true, section: true, academicYear: true },
    orderBy: { grade: { order: "asc" } },
  });

  return (
    <div>
      <div className="cas-masthead">
        <p className="cas-eyebrow">Teacher Workspace</p>
        <h1 className="cas-title">My Classes</h1>
        <p className="cas-subtitle">Select a class to plan lessons for its curriculum units.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assignments.map((assignment) => (
          <Link
            key={assignment.id}
            href={`/teacher/planning/${assignment.id}`}
            className="cas-card p-4"
          >
            <p className="font-medium text-[color:var(--cas-ink)]">
              {assignment.grade.name} - {assignment.section.name}
            </p>
            <p className="text-sm text-[color:var(--cas-ink-dim)]">{assignment.subject.name}</p>
            <p className="cas-label mt-2">{assignment.academicYear.name}</p>
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
