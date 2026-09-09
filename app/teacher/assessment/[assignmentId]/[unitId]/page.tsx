import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeUnitResult } from "@/lib/grading";
import { PendingButton } from "@/components/ui/pending-button";
import { ScoreButtons } from "@/components/ui/score-buttons";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SavedBanner } from "@/components/ui/saved-banner";
import { CasMasthead } from "@/components/assessment/cas-masthead";
import { saveRegularScores } from "./actions";

export default async function UnitAssessmentPage(
  props: PageProps<"/teacher/assessment/[assignmentId]/[unitId]"> & {
    searchParams: Promise<{ saved?: string }>;
  },
) {
  const { assignmentId, unitId } = await props.params;
  const { saved } = await props.searchParams;
  const session = await auth();
  const teacherId = session!.user.id;

  const assignment = await prisma.teacherAssignment.findFirst({
    where: { id: assignmentId, teacherId },
    include: { subject: true, grade: true, section: true },
  });
  if (!assignment) notFound();

  const unit = await prisma.curriculumUnit.findUnique({ where: { id: unitId } });
  if (!unit) notFound();

  const [studentsRaw, achievements] = await Promise.all([
    prisma.student.findMany({
      where: { sectionId: assignment.sectionId },
    }),
    prisma.learningAchievement.findMany({
      where: { curriculumUnitId: unitId },
      include: { skillArea: true },
      orderBy: { skillArea: { order: "asc" } },
    }),
  ]);
  const students = studentsRaw.sort((a, b) => Number(a.rollNumber) - Number(b.rollNumber));

  const scores = await prisma.assessmentScore.findMany({
    where: {
      studentId: { in: students.map((s) => s.id) },
      learningAchievementId: { in: achievements.map((a) => a.id) },
    },
  });
  const scoreByKey = new Map(scores.map((s) => [`${s.studentId}__${s.learningAchievementId}`, s]));

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
          { label: unit.title },
        ]}
      />
      <CasMasthead
        eyebrow="Continuous Assessment"
        title={unit.title}
        subtitle={`${assignment.subject.name} — ${className}. Tap a number to score each student. Open a student for remedial scores and remarks.`}
      />
      {saved && (
        <div className="mt-6">
          <SavedBanner message="Scores saved" />
        </div>
      )}

      <form action={saveRegularScores}>
        <input type="hidden" name="assignmentId" value={assignmentId} />
        <input type="hidden" name="unitId" value={unitId} />

        {/* Table layout: comfortable on tablet/desktop where there's room for columns. */}
        <div className="cas-card mt-6 hidden overflow-x-auto md:block">
          <table className="cas-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2">Roll</th>
                <th className="px-3 py-2">Name</th>
                {achievements.map((a) => (
                  <th key={a.id} className="px-3 py-2" title={a.description}>
                    {a.skillArea.name}
                  </th>
                ))}
                <th className="px-3 py-2">Result</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const studentScores = achievements.map(
                  (a) => scoreByKey.get(`${student.id}__${a.id}`) ?? null,
                );
                const result = computeUnitResult(
                  studentScores.map((s) => ({
                    regularScore: s?.regularScore ?? null,
                    remedialScore: s?.remedialScore ?? null,
                  })),
                );
                const hasAnyScore = studentScores.some((s) => s?.regularScore != null);

                return (
                  <tr key={student.id}>
                    <td className="px-3 py-2 text-[color:var(--cas-ink-faint)]">{student.rollNumber}</td>
                    <td className="px-3 py-2 text-[color:var(--cas-ink)]">{student.name}</td>
                    {achievements.map((a, i) => {
                      const existing = studentScores[i];
                      return (
                        <td key={a.id} className="px-3 py-2">
                          <ScoreButtons
                            name={`score_${student.id}__${a.id}`}
                            defaultValue={existing?.regularScore}
                            size="compact"
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-[color:var(--cas-ink-dim)]">
                      {hasAnyScore ? `${result.percentage.toFixed(0)}% (${result.grade})` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/teacher/assessment/${assignmentId}/${unitId}/${student.id}`}
                        className="text-brand-green hover:underline"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td
                    colSpan={achievements.length + 4}
                    className="px-3 py-6 text-center text-[color:var(--cas-ink-faint)]"
                  >
                    No students in this class yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card layout: one student at a time, skill areas stacked — no horizontal
            scrolling, which is easy to miss on a phone if you don't already know
            a table can scroll sideways. */}
        <div className="mt-6 space-y-4 md:hidden">
          {students.map((student) => {
            const studentScores = achievements.map(
              (a) => scoreByKey.get(`${student.id}__${a.id}`) ?? null,
            );
            const result = computeUnitResult(
              studentScores.map((s) => ({
                regularScore: s?.regularScore ?? null,
                remedialScore: s?.remedialScore ?? null,
              })),
            );
            const hasAnyScore = studentScores.some((s) => s?.regularScore != null);

            return (
              <div key={student.id} className="cas-card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[color:var(--cas-ink)]">
                    {student.rollNumber}. {student.name}
                  </p>
                  <Link
                    href={`/teacher/assessment/${assignmentId}/${unitId}/${student.id}`}
                    className="text-sm text-brand-green hover:underline"
                  >
                    Details
                  </Link>
                </div>
                <p className="mt-1 text-sm text-[color:var(--cas-ink-dim)]">
                  Result: {hasAnyScore ? `${result.percentage.toFixed(0)}% (${result.grade})` : "Not scored yet"}
                </p>
                <div className="mt-3 space-y-3">
                  {achievements.map((a, i) => {
                    const existing = studentScores[i];
                    return (
                      <div key={a.id}>
                        <p className="cas-label">{a.skillArea.name}</p>
                        <div className="mt-1">
                          {/* Distinct name from the desktop table's version of this same
                              cell below md: — both render in the DOM at once (CSS only
                              toggles visibility), and browsers treat same-name radios as
                              one group regardless of display, so sharing a name here would
                              silently steal the "checked" state from whichever renders
                              first. saveRegularScores() reconciles the two field names. */}
                          <ScoreButtons
                            name={`score_${student.id}__${a.id}__m`}
                            defaultValue={existing?.regularScore}
                            size="compact"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {students.length === 0 && (
            <p className="cas-card p-6 text-center text-[color:var(--cas-ink-faint)]">
              No students in this class yet.
            </p>
          )}
        </div>

        {students.length > 0 && (
          <div className="mt-4">
            <PendingButton pendingLabel="Saving...">Save scores</PendingButton>
          </div>
        )}
      </form>
    </div>
  );
}
