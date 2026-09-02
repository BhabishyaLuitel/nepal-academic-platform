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

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Start</th>
              <th className="px-4 py-2 font-medium">End</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{year.name}</td>
                <td className="px-4 py-2">{year.startDate.toLocaleDateString()}</td>
                <td className="px-4 py-2">{year.endDate.toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  {year.isActive ? (
                    <span className="rounded-full bg-brand-lime/30 px-2 py-0.5 text-xs font-medium text-brand-green-dark">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  {!year.isActive && (
                    <form action={setActiveAcademicYear}>
                      <input type="hidden" name="id" value={year.id} />
                      <button
                        type="submit"
                        className="text-sm text-brand-green hover:underline"
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
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No academic years yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium text-slate-900">Add academic year</h2>
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
          <SubmitButton>Add academic year</SubmitButton>
        </form>
      </div>
    </div>
  );
}
