import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;

  const [academicYears, grades, subjects, teachers, assignments] = await Promise.all([
    prisma.academicYear.count({ where: { schoolId } }),
    prisma.grade.count({ where: { schoolId } }),
    prisma.subject.count({ where: { schoolId } }),
    prisma.user.count({ where: { schoolId, role: "TEACHER" } }),
    prisma.teacherAssignment.count({ where: { teacher: { schoolId } } }),
  ]);

  const stats = [
    { label: "Academic Years", value: academicYears },
    { label: "Grades", value: grades },
    { label: "Subjects", value: subjects },
    { label: "Teachers", value: teachers },
    { label: "Teacher Assignments", value: assignments },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
      <p className="mt-1 text-sm text-slate-500">
        Set up your school&apos;s academic structure before teachers can start planning lessons.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
