import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CasMasthead } from "@/components/assessment/cas-masthead";

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
      <CasMasthead
        eyebrow="Lesson Planning"
        title={`${assignment.subject.name} — ${assignment.grade.name} ${assignment.section.name}`}
        subtitle="Pick a curriculum unit to plan lessons for."
      />

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
            className="cas-card p-4"
          >
            <p className="font-medium text-[color:var(--cas-ink)]">{unit.title}</p>
            <p className="text-sm text-[color:var(--cas-ink-dim)]">{unit._count.topics} periods</p>
            {plannedUnitIds.has(unit.id) && (
              <span className="cas-badge mt-2">Planned</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
