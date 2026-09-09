import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CasMasthead } from "@/components/assessment/cas-masthead";

export default async function AssignmentAssessmentPage(
  props: PageProps<"/teacher/assessment/[assignmentId]">,
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
        include: { _count: { select: { learningAchievements: true } } },
      })
    : [];

  return (
    <div className="cas-theme">
      <Breadcrumbs
        items={[
          { label: "Assessment", href: "/teacher/assessment" },
          { label: `${assignment.subject.name} — ${assignment.grade.name} ${assignment.section.name}` },
        ]}
      />
      <CasMasthead
        eyebrow="Continuous Assessment"
        title={`${assignment.subject.name} — ${assignment.grade.name} ${assignment.section.name}`}
        subtitle="Pick a curriculum unit to score students on."
      />

      {!curriculumSubject && (
        <p className="mt-6 text-sm text-amber-600">
          No curriculum has been loaded yet for {assignment.grade.name} — {assignment.subject.name}.
        </p>
      )}
      {curriculumSubject && units.every((unit) => unit._count.learningAchievements === 0) && (
        <p className="mt-6 text-sm text-amber-600">
          This subject has units, but no skill areas / learning achievements have been set up
          for continuous assessment yet.
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {units
          .filter((unit) => unit._count.learningAchievements > 0)
          .map((unit) => (
            <Link
              key={unit.id}
              href={`/teacher/assessment/${assignment.id}/${unit.id}`}
              className="cas-card p-4 hover:border-brand-green"
            >
              <p className="font-medium text-[color:var(--cas-ink)]">{unit.title}</p>
              <p className="cas-label mt-2">
                {unit._count.learningAchievements} skill areas
              </p>
            </Link>
          ))}
      </div>
    </div>
  );
}
