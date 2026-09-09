import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AssessmentHomePage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId },
    include: { subject: true, grade: true, section: true, academicYear: true },
    orderBy: { grade: { order: "asc" } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Assessment</h1>
      <p className="mt-1 text-sm text-slate-500">
        Select a class to record continuous assessment scores by unit.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assignments.map((assignment) => (
          <Link
            key={assignment.id}
            href={`/teacher/assessment/${assignment.id}`}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-green hover:shadow"
          >
            <p className="font-medium text-slate-900">
              {assignment.grade.name} - {assignment.section.name}
            </p>
            <p className="text-sm text-slate-500">{assignment.subject.name}</p>
            <p className="mt-2 text-xs text-slate-400">{assignment.academicYear.name}</p>
          </Link>
        ))}
        {assignments.length === 0 && (
          <p className="text-sm text-slate-400">
            No classes assigned yet. Ask your school admin to assign you a subject and class.
          </p>
        )}
      </div>
    </div>
  );
}
