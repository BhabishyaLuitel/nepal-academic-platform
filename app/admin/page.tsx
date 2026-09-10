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
      <div className="cas-masthead">
        <p className="cas-eyebrow">School Administration</p>
        <h1 className="cas-title">Overview</h1>
        <p className="cas-subtitle">
          Set up your school&apos;s academic structure before teachers can start planning lessons.
        </p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="cas-card p-4">
            <p className="text-2xl font-semibold text-[color:var(--cas-ink)]">{stat.value}</p>
            <p className="cas-label mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
