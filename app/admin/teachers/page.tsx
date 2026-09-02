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

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Assignments</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{teacher.name}</td>
                <td className="px-4 py-2 text-slate-500">{teacher.email}</td>
                <td className="px-4 py-2">{teacher._count.teacherAssignments}</td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No teachers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium text-slate-900">Add teacher</h2>
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
          <SubmitButton>Add teacher</SubmitButton>
        </form>
      </div>
    </div>
  );
}
