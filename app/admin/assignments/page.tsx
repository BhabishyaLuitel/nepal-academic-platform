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

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Teacher</th>
              <th className="px-4 py-2 font-medium">Subject</th>
              <th className="px-4 py-2 font-medium">Class</th>
              <th className="px-4 py-2 font-medium">Academic Year</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{assignment.teacher.name}</td>
                <td className="px-4 py-2">{assignment.subject.name}</td>
                <td className="px-4 py-2">
                  {assignment.grade.name} - {assignment.section.name}
                </td>
                <td className="px-4 py-2 text-slate-500">{assignment.academicYear.name}</td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No assignments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium text-slate-900">Assign teacher</h2>
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
