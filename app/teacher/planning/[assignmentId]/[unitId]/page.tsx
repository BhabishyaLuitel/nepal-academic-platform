import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/ui/form";
import { createAcademicPlan } from "./actions";

export default async function UnitPlanningPage(
  props: PageProps<"/teacher/planning/[assignmentId]/[unitId]">,
) {
  const { assignmentId, unitId } = await props.params;
  const session = await auth();
  const teacherId = session!.user.id;

  const assignment = await prisma.teacherAssignment.findFirst({
    where: { id: assignmentId, teacherId },
    include: { subject: true, grade: true, section: true },
  });
  if (!assignment) notFound();

  const unit = await prisma.curriculumUnit.findUnique({ where: { id: unitId } });
  if (!unit) notFound();

  const plan = await prisma.academicPlan.findFirst({
    where: {
      sectionId: assignment.sectionId,
      subjectId: assignment.subjectId,
      curriculumUnitId: unitId,
      academicYearId: assignment.academicYearId,
    },
    include: {
      periods: {
        orderBy: { periodNumber: "asc" },
        include: { curriculumTopic: true, lessonPlan: { select: { id: true } } },
      },
    },
  });

  return (
    <div>
      <p className="text-sm text-slate-500">
        {assignment.subject.name} — {assignment.grade.name} {assignment.section.name}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">{unit.title}</h1>

      {!plan ? (
        <div className="mt-6 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            No period plan yet for this unit. Create one to get a default period-by-period
            breakdown you can adjust.
          </p>
          <form action={createAcademicPlan} className="mt-4">
            <input type="hidden" name="assignmentId" value={assignmentId} />
            <input type="hidden" name="unitId" value={unitId} />
            <SubmitButton>Create period plan</SubmitButton>
          </form>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Period</th>
                <th className="px-4 py-2 font-medium">Topic</th>
                <th className="px-4 py-2 font-medium">Lesson plan</th>
              </tr>
            </thead>
            <tbody>
              {plan.periods.map((period) => (
                <tr key={period.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{period.periodNumber}</td>
                  <td className="px-4 py-2">
                    {period.curriculumTopic?.title ?? period.customTopic ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/teacher/lesson-plans/${period.id}`}
                      className="text-brand-green hover:underline"
                    >
                      {period.lessonPlan ? "View plan" : "Generate plan"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
