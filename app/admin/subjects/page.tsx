import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Field, TextInput, SubmitButton } from "@/components/ui/form";
import { createSubject } from "./actions";

export default async function SubjectsPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;

  const subjects = await prisma.subject.findMany({
    where: { schoolId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Subjects</h1>

      <div className="cas-card mt-6 overflow-hidden">
        <table className="cas-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Code</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td className="px-4 py-2 text-[color:var(--cas-ink)]">{subject.name}</td>
                <td className="px-4 py-2 text-[color:var(--cas-ink-dim)]">{subject.code ?? "—"}</td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-[color:var(--cas-ink-faint)]">
                  No subjects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cas-card mt-8 max-w-md p-6">
        <h2 className="font-medium text-[color:var(--cas-ink)]">Add subject</h2>
        <form action={createSubject} className="mt-4 space-y-4">
          <Field label="Name">
            <TextInput name="name" placeholder="Mathematics" required />
          </Field>
          <Field label="Code (optional)">
            <TextInput name="code" placeholder="MATH" />
          </Field>
          <SubmitButton icon={Plus}>Add subject</SubmitButton>
        </form>
      </div>
    </div>
  );
}
