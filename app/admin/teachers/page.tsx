import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Field, TextInput, SubmitButton } from "@/components/ui/form";
import { createTeacher } from "./actions";

export default async function TeachersPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;

  const teachers = await prisma.user.findMany({
    where: { schoolId, role: "TEACHER" },
    orderBy: { name: "asc" },
    include: { _count: { select: { teacherAssignments: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Teachers</h1>

      <div className="cas-card mt-6 overflow-hidden">
        <table className="cas-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Assignments</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td className="px-4 py-2 text-[color:var(--cas-ink)]">{teacher.name}</td>
                <td className="px-4 py-2 text-[color:var(--cas-ink-dim)]">{teacher.email}</td>
                <td className="px-4 py-2 text-[color:var(--cas-ink)]">{teacher._count.teacherAssignments}</td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-[color:var(--cas-ink-faint)]">
                  No teachers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cas-card mt-8 max-w-md p-6">
        <h2 className="font-medium text-[color:var(--cas-ink)]">Add teacher</h2>
        <form action={createTeacher} className="mt-4 space-y-4">
          <Field label="Full name">
            <TextInput name="name" required />
          </Field>
          <Field label="Email">
            <TextInput type="email" name="email" required />
          </Field>
          <Field label="Temporary password">
            <TextInput type="password" name="password" minLength={8} required />
          </Field>
          <SubmitButton icon={Plus}>Add teacher</SubmitButton>
        </form>
      </div>
    </div>
  );
}
