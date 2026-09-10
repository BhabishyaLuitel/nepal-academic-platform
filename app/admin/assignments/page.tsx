import { Check } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Field, Select, SubmitButton } from "@/components/ui/form";
import { createAssignment } from "./actions";

export default async function AssignmentsPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;

  const [assignments, teachers, subjects, grades, academicYears] = await Promise.all([
    prisma.teacherAssignment.findMany({
      where: { teacher: { schoolId } },
      include: { teacher: true, subject: true, grade: true, section: true, academicYear: true },
      orderBy: { grade: { order: "asc" } },
    }),
    prisma.user.findMany({ where: { schoolId, role: "TEACHER" }, orderBy: { name: "asc" } }),
    prisma.subject.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
    prisma.grade.findMany({
      where: { schoolId },
      orderBy: { order: "asc" },
      include: { sections: { orderBy: { name: "asc" } } },
    }),
    prisma.academicYear.findMany({ where: { schoolId }, orderBy: { startDate: "desc" } }),
  ]);

  const classOptions = grades.flatMap((grade) =>
    grade.sections.map((section) => ({
      value: `${grade.id}:${section.id}`,
      label: `${grade.name} - ${section.name}`,
    })),
  );

  const canCreate =
    teachers.length > 0 && subjects.length > 0 && classOptions.length > 0 && academicYears.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Teacher Assignments</h1>

      <div className="cas-card mt-6 overflow-hidden">
        <table className="cas-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2">Teacher</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Class</th>
              <th className="px-4 py-2">Academic Year</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td className="px-4 py-2 text-[color:var(--cas-ink)]">{assignment.teacher.name}</td>
                <td className="px-4 py-2 text-[color:var(--cas-ink)]">{assignment.subject.name}</td>
                <td className="px-4 py-2 text-[color:var(--cas-ink)]">
                  {assignment.grade.name} - {assignment.section.name}
                </td>
                <td className="px-4 py-2 text-[color:var(--cas-ink-dim)]">{assignment.academicYear.name}</td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[color:var(--cas-ink-faint)]">
                  No assignments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cas-card mt-8 max-w-md p-6">
        <h2 className="font-medium text-[color:var(--cas-ink)]">Assign teacher</h2>
        {canCreate ? (
          <form action={createAssignment} className="mt-4 space-y-4">
            <Field label="Teacher">
              <Select name="teacherId" required defaultValue="">
                <option value="" disabled>
                  Select teacher
                </option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Subject">
              <Select name="subjectId" required defaultValue="">
                <option value="" disabled>
                  Select subject
                </option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Class">
              <Select name="classKey" required defaultValue="">
                <option value="" disabled>
                  Select class
                </option>
                {classOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Academic year">
              <Select name="academicYearId" required defaultValue="">
                <option value="" disabled>
                  Select academic year
                </option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </Select>
            </Field>
            <SubmitButton icon={Check}>Assign</SubmitButton>
          </form>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Add at least one academic year, grade with a section, subject, and teacher before
            creating assignments.
          </p>
        )}
      </div>
    </div>
  );
}
