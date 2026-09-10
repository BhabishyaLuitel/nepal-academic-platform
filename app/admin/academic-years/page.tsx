import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Field, TextInput, SubmitButton } from "@/components/ui/form";
import { createAcademicYear, setActiveAcademicYear } from "./actions";

export default async function AcademicYearsPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;

  const years = await prisma.academicYear.findMany({
    where: { schoolId },
    orderBy: { startDate: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Academic Years</h1>

      <div className="cas-card mt-6 overflow-hidden">
        <table className="cas-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Start</th>
              <th className="px-4 py-2">End</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year.id}>
                <td className="px-4 py-2 text-[color:var(--cas-ink)]">{year.name}</td>
                <td className="px-4 py-2 text-[color:var(--cas-ink-dim)]">{year.startDate.toLocaleDateString()}</td>
                <td className="px-4 py-2 text-[color:var(--cas-ink-dim)]">{year.endDate.toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  {year.isActive ? (
                    <span className="cas-badge">Active</span>
                  ) : (
                    <span className="text-xs text-[color:var(--cas-ink-faint)]">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  {!year.isActive && (
                    <form action={setActiveAcademicYear}>
                      <input type="hidden" name="id" value={year.id} />
                      <button
                        type="submit"
                        className="text-sm text-[color:var(--cas-accent)] hover:underline"
                      >
                        Set active
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {years.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[color:var(--cas-ink-faint)]">
                  No academic years yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cas-card mt-8 max-w-md p-6">
        <h2 className="font-medium text-[color:var(--cas-ink)]">Add academic year</h2>
        <form action={createAcademicYear} className="mt-4 space-y-4">
          <Field label="Name">
            <TextInput name="name" placeholder="2082/83 B.S." required />
          </Field>
          <Field label="Start date">
            <TextInput type="date" name="startDate" required />
          </Field>
          <Field label="End date">
            <TextInput type="date" name="endDate" required />
          </Field>
          <SubmitButton icon={Plus}>Add academic year</SubmitButton>
        </form>
      </div>
    </div>
  );
}
