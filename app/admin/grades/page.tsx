import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Field, TextInput, SubmitButton } from "@/components/ui/form";
import { createGrade, createSection } from "./actions";

export default async function GradesPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;

  const grades = await prisma.grade.findMany({
    where: { schoolId },
    orderBy: { order: "asc" },
    include: { sections: { orderBy: { name: "asc" } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Grades &amp; Sections</h1>

      <div className="mt-6 space-y-4">
        {grades.map((grade) => (
          <div
            key={grade.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-slate-900">{grade.name}</h2>
              <span className="text-xs text-slate-400">order {grade.order}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {grade.sections.map((section) => (
                <span
                  key={section.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                >
                  Section {section.name}
                </span>
              ))}
              {grade.sections.length === 0 && (
                <span className="text-xs text-slate-400">No sections yet</span>
              )}
            </div>
            <form action={createSection} className="mt-3 flex items-end gap-2">
              <input type="hidden" name="gradeId" value={grade.id} />
              <div className="flex-1 max-w-[160px]">
                <Field label="Add section">
                  <TextInput name="name" placeholder="A" required />
                </Field>
              </div>
              <SubmitButton icon={Plus}>Add</SubmitButton>
            </form>
          </div>
        ))}
        {grades.length === 0 && (
          <p className="text-sm text-slate-400">No grades yet.</p>
        )}
      </div>

      <div className="mt-8 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium text-slate-900">Add grade</h2>
        <form action={createGrade} className="mt-4 space-y-4">
          <Field label="Name">
            <TextInput name="name" placeholder="Grade 6" required />
          </Field>
          <Field label="Order">
            <TextInput type="number" name="order" defaultValue={grades.length + 1} required />
          </Field>
          <SubmitButton icon={Plus}>Add grade</SubmitButton>
        </form>
      </div>
    </div>
  );
}
