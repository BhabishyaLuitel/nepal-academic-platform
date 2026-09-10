import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/ui/form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
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
      <Breadcrumbs
        items={[
          { label: "My Classes", href: "/teacher" },
          {
            label: `${assignment.subject.name} — ${assignment.grade.name} ${assignment.section.name}`,
            href: `/teacher/planning/${assignmentId}`,
          },
          { label: unit.title },
        ]}
      />
      <h1 className="text-2xl font-semibold text-[color:var(--cas-ink)]">{unit.title}</h1>

      {!plan ? (
        <div className="cas-card mt-6 max-w-md p-6">
          <p className="text-sm text-[color:var(--cas-ink-dim)]">
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
        <div className="cas-card mt-6 overflow-hidden">
          <table className="cas-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2">Period</th>
                <th className="px-4 py-2">Topic</th>
                <th className="px-4 py-2">Lesson plan</th>
              </tr>
            </thead>
            <tbody>
              {plan.periods.map((period) => (
                <tr key={period.id}>
                  <td className="px-4 py-2 text-[color:var(--cas-ink)]">{period.periodNumber}</td>
                  <td className="px-4 py-2 text-[color:var(--cas-ink)]">
                    {period.curriculumTopic?.title ?? period.customTopic ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/teacher/lesson-plans/${period.id}`}
                      className="text-[color:var(--cas-accent)] hover:underline"
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
