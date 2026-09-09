import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeUnitResult, ACHIEVEMENT_LEVELS } from "@/lib/grading";
import { PendingButton } from "@/components/ui/pending-button";
import { ScoreButtons } from "@/components/ui/score-buttons";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SavedBanner } from "@/components/ui/saved-banner";
import { CasMasthead } from "@/components/assessment/cas-masthead";
import { saveStudentAssessment } from "../actions";

const dateFieldClasses =
  "mt-1 block min-h-11 w-full rounded-md border border-[color:var(--cas-border-strong)] px-3 py-2.5 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue";

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function StudentAssessmentPage(
  props: PageProps<"/teacher/assessment/[assignmentId]/[unitId]/[studentId]"> & {
    searchParams: Promise<{ saved?: string }>;
  },
) {
  const { assignmentId, unitId, studentId } = await props.params;
  const { saved } = await props.searchParams;
  const session = await auth();
  const teacherId = session!.user.id;

  const assignment = await prisma.teacherAssignment.findFirst({
    where: { id: assignmentId, teacherId },
    include: { subject: true, grade: true, section: true },
  });
  if (!assignment) notFound();

  const [unit, student] = await Promise.all([
    prisma.curriculumUnit.findUnique({ where: { id: unitId } }),
    prisma.student.findFirst({ where: { id: studentId, sectionId: assignment.sectionId } }),
  ]);
  if (!unit || !student) notFound();

  const achievements = await prisma.learningAchievement.findMany({
    where: { curriculumUnitId: unitId },
    include: { skillArea: true },
    orderBy: { skillArea: { order: "asc" } },
  });

  const scores = await prisma.assessmentScore.findMany({
    where: { studentId, learningAchievementId: { in: achievements.map((a) => a.id) } },
  });
  const scoreByAchievement = new Map(scores.map((s) => [s.learningAchievementId, s]));

  const result = computeUnitResult(
    achievements.map((a) => {
      const s = scoreByAchievement.get(a.id);
      return { regularScore: s?.regularScore ?? null, remedialScore: s?.remedialScore ?? null };
    }),
  );

  const className = `${assignment.grade.name} ${assignment.section.name}`;

  return (
    <div className="cas-theme">
      <Breadcrumbs
        items={[
          { label: "Assessment", href: "/teacher/assessment" },
          {
            label: `${assignment.subject.name} — ${className}`,
            href: `/teacher/assessment/${assignmentId}`,
          },
          { label: unit.title, href: `/teacher/assessment/${assignmentId}/${unitId}` },
          { label: student.name },
        ]}
      />
      <CasMasthead
        eyebrow="Continuous Assessment"
        title={
          <>
            {student.name} <span className="font-normal text-[#C7CEF7]">Roll {student.rollNumber}</span>
          </>
        }
        subtitle={`Result: ${result.sum}/${result.totalPossible} · ${result.percentage.toFixed(1)}% · GPA ${result.gpa} · Grade ${result.grade}`}
      />
      {saved && (
        <div className="mt-6">
          <SavedBanner message="Assessment saved" />
        </div>
      )}

      <form action={saveStudentAssessment} className="mt-6 space-y-6">
        <input type="hidden" name="assignmentId" value={assignmentId} />
        <input type="hidden" name="unitId" value={unitId} />
        <input type="hidden" name="studentId" value={studentId} />

        {achievements.map((a) => {
          const s = scoreByAchievement.get(a.id);
          // Server Actions patch the page in place rather than remounting it, so
          // uncontrolled fields (defaultValue) won't pick up a new saved value unless
          // their key changes. Keying on updatedAt forces a remount when the row changes.
          const versionKey = s ? s.updatedAt.getTime() : "new";
          return (
            <div key={a.id} className="cas-card p-4">
              <p className="font-medium text-[color:var(--cas-ink)]">{a.skillArea.name}</p>
              <p className="text-base text-[color:var(--cas-ink-dim)]">{a.description}</p>

              <div className="mt-3">
                <p className="cas-label">Regular score</p>
                <div className="mt-1" key={`regular-${a.id}-${versionKey}`}>
                  <ScoreButtons name={`regular_${a.id}`} defaultValue={s?.regularScore} size="full" />
                </div>
              </div>

              <label className="mt-3 block text-sm font-medium text-[color:var(--cas-ink-dim)]">
                Regular date
                <input
                  key={`regularDate-${a.id}-${versionKey}`}
                  type="date"
                  name={`regularDate_${a.id}`}
                  defaultValue={toDateInputValue(s?.regularDate ?? null)}
                  className={`${dateFieldClasses} max-w-xs`}
                />
              </label>

              <div className="mt-4">
                <p className="cas-label">Remedial score</p>
                <div className="mt-1" key={`remedial-${a.id}-${versionKey}`}>
                  <ScoreButtons name={`remedial_${a.id}`} defaultValue={s?.remedialScore} size="full" />
                </div>
              </div>

              <label className="mt-3 block text-sm font-medium text-[color:var(--cas-ink-dim)]">
                Remedial date
                <input
                  key={`remedialDate-${a.id}-${versionKey}`}
                  type="date"
                  name={`remedialDate_${a.id}`}
                  defaultValue={toDateInputValue(s?.remedialDate ?? null)}
                  className={`${dateFieldClasses} max-w-xs`}
                />
              </label>

              <label className="mt-3 block text-sm font-medium text-[color:var(--cas-ink-dim)]">
                Remark
                <input
                  key={`remark-${a.id}-${versionKey}`}
                  type="text"
                  name={`remark_${a.id}`}
                  defaultValue={s?.remark ?? ""}
                  className={dateFieldClasses}
                />
              </label>
            </div>
          );
        })}

        <PendingButton pendingLabel="Saving...">Save</PendingButton>
      </form>

      <div className="cas-card mt-8 p-4">
        <h2 className="font-medium text-[color:var(--cas-ink)]">Achievement scale</h2>
        <ul className="mt-2 space-y-1 text-base text-[color:var(--cas-ink-dim)]">
          {ACHIEVEMENT_LEVELS.map((l) => (
            <li key={l.level}>
              <span className="font-medium text-[color:var(--cas-ink)]">{l.level} — {l.label}:</span> {l.description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
