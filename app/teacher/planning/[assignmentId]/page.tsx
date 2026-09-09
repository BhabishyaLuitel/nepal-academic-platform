import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function AssignmentPlanningPage(
  props: PageProps<"/teacher/planning/[assignmentId]">,
) {
  const { assignmentId } = await props.params;
  const session = await auth();
  const teacherId = session!.user.id;

  const assignment = await prisma.teacherAssignment.findFirst({
    where: { id: assignmentId, teacherId },
    include: { subject: true, grade: true, section: true, academicYear: true },
  });
  if (!assignment) notFound();

  const curriculumGrade = await prisma.curriculumGrade.findUnique({
    where: { name: assignment.grade.name },
  });
  const curriculumSubject = curriculumGrade
    ? await prisma.curriculumSubject.findFirst({
        where: { curriculumGradeId: curriculumGrade.id, name: assignment.subject.name },
      })
    : null;

  const units = curriculumSubject
    ? await prisma.curriculumUnit.findMany({
        where: { curriculumSubjectId: curriculumSubject.id },
        orderBy: { order: "asc" },
        include: { _count: { select: { topics: true } } },
      })
    : [];

  const existingPlans = await prisma.academicPlan.findMany({
    where: { sectionId: assignment.sectionId, subjectId: assignment.subjectId },
    select: { curriculumUnitId: true },
  });
  const plannedUnitIds = new Set(existingPlans.map((p) => p.curriculumUnitId));

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "My Classes", href: "/teacher" },
          { label: `${assignment.subject.name} — ${assignment.grade.name} ${assignment.section.name}` },
        ]}
      />
      <h1 className="text-2xl font-semibold text-slate-900">
        {assignment.subject.name} — {assignment.grade.name} {assignment.section.name}
      </h1>
      <p className="mt-1 text-base text-slate-500">
        Pick a curriculum unit to plan lessons for.
      </p>

      {!curriculumSubject && (
        <p className="mt-6 text-sm text-amber-600">
          No curriculum has been loaded yet for {assignment.grade.name} — {assignment.subject.name}.
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {units.map((unit) => (
          <Link
            key={unit.id}
            href={`/teacher/planning/${assignment.id}/${unit.id}`}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-green hover:shadow"
          >
            <p className="font-medium text-slate-900">{unit.title}</p>
            <p className="text-sm text-slate-500">{unit._count.topics} periods</p>
            {plannedUnitIds.has(unit.id) && (
              <span className="mt-2 inline-block rounded-full bg-brand-lime/30 px-2 py-0.5 text-xs font-medium text-brand-green-dark">
                Planned
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
