import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Field, TextInput, Select, SubmitButton } from "@/components/ui/form";
import { createStudent } from "./actions";

type SearchParams = Promise<{ sectionId?: string }>;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { sectionId } = await searchParams;
  const session = await auth();
  const schoolId = session!.user.schoolId;

  const grades = await prisma.grade.findMany({
    where: { schoolId },
    orderBy: { order: "asc" },
    include: { sections: { orderBy: { name: "asc" } } },
  });

  const sections = grades.flatMap((grade) =>
    grade.sections.map((section) => ({
      id: section.id,
      label: `${grade.name} - ${section.name}`,
    })),
  );

  const selectedSection = sectionId ?? sections[0]?.id;

  const students = selectedSection
    ? (
        await prisma.student.findMany({
          where: { sectionId: selectedSection },
        })
      ).sort((a, b) => Number(a.rollNumber) - Number(b.rollNumber))
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Students</h1>

      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={`/admin/students?sectionId=${section.id}`}
            className={`rounded-full px-3 py-1 ${
              selectedSection === section.id
                ? "bg-brand-green text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {section.label}
          </Link>
        ))}
        {sections.length === 0 && (
          <p className="text-sm text-slate-400">
            Add a grade and section first before adding students.
          </p>
        )}
      </nav>

      {selectedSection && (
        <>
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Roll No.</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Guardian</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{student.rollNumber}</td>
                    <td className="px-4 py-2">{student.name}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {student.guardianName
                        ? `${student.guardianName}${student.guardianRelation ? ` (${student.guardianRelation})` : ""}`
                        : "—"}
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                      No students in this section yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-medium text-slate-900">Add student</h2>
            <form action={createStudent} className="mt-4 space-y-4">
              <input type="hidden" name="sectionId" value={selectedSection} />
              <Field label="Full name">
                <TextInput name="name" required />
              </Field>
              <Field label="Roll number">
                <TextInput name="rollNumber" required />
              </Field>
              <Field label="Date of birth (optional)">
                <TextInput type="date" name="dateOfBirth" />
              </Field>
              <Field label="Guardian name (optional)">
                <TextInput name="guardianName" />
              </Field>
              <Field label="Guardian relation (optional)">
                <Select name="guardianRelation" defaultValue="">
                  <option value="">—</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                </Select>
              </Field>
              <Field label="Guardian phone (optional)">
                <TextInput name="guardianPhone" />
              </Field>
              <SubmitButton icon={Plus}>Add student</SubmitButton>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
