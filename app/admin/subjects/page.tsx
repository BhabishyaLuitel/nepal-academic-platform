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

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Code</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{subject.name}</td>
                <td className="px-4 py-2 text-slate-500">{subject.code ?? "—"}</td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-slate-400">
                  No subjects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium text-slate-900">Add subject</h2>
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
