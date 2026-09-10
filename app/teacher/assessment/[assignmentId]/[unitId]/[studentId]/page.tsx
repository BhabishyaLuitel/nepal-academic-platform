import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeUnitResult, ACHIEVEMENT_LEVELS, GRADE_SCALE } from "@/lib/grading";
import { PendingButton } from "@/components/ui/pending-button";
import { ScoreSelect } from "@/components/ui/score-select";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SavedBanner } from "@/components/ui/saved-banner";
import { CasMasthead } from "@/components/assessment/cas-masthead";
import { CasTabs } from "@/components/assessment/cas-tabs";
import { saveStudentAssessment } from "../actions";

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

  const school = await prisma.school.findUnique({ where: { id: session!.user.schoolId } });

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
        eyebrow="Student Learning Achievement Assessment"
        title={`${assignment.subject.name} — Learning Achievement Record`}
        subtitle={unit.title}
        identity={[
          { label: "School", value: school?.name ?? "—" },
          { label: "Class", value: assignment.grade.name },
          { label: "Section", value: assignment.section.name },
          { label: "Subject", value: assignment.subject.name },
          { label: "Student Name", value: student.name },
          { label: "Roll No.", value: student.rollNumber },
        ]}
      />
      {saved && (
        <div className="mt-6">
          <SavedBanner message="Assessment saved" />
        </div>
      )}

      <CasTabs
        tabs={[
          {
            label: "Assessment Record",
            content: (
              <form action={saveStudentAssessment}>
                <input type="hidden" name="assignmentId" value={assignmentId} />
                <input type="hidden" name="unitId" value={unitId} />
                <input type="hidden" name="studentId" value={studentId} />

                <div className="cas-card overflow-x-auto">
                  <table className="cas-table w-full text-left text-sm" style={{ minWidth: 820 }}>
                    <thead>
                      <tr>
                        <th className="px-3 py-2">No.</th>
                        <th className="px-3 py-2">Content</th>
                        <th className="px-3 py-2">Learning outcome</th>
                        <th className="px-3 py-2">Regular evaluation</th>
                        <th className="px-3 py-2">Evaluation after support</th>
                        <th className="px-3 py-2">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {achievements.map((a, i) => {
                        const s = scoreByAchievement.get(a.id);
                        // Server Actions patch the page in place rather than remounting it, so
                        // uncontrolled fields (defaultValue) won't pick up a new saved value
                        // unless their key changes. Keying on updatedAt forces a remount when
                        // the row changes.
                        const versionKey = s ? s.updatedAt.getTime() : "new";
                        return (
                          <tr key={a.id}>
                            <td className="px-3 py-2 text-center text-[color:var(--cas-ink-faint)]">{i + 1}</td>
                            <td className="px-3 py-2 font-medium text-[color:var(--cas-ink)]">{a.skillArea.name}</td>
                            <td className="px-3 py-2 text-[color:var(--cas-ink-dim)]">{a.description}</td>
                            <td className="px-2 py-2" key={`regular-${a.id}-${versionKey}`}>
                              <div className="flex flex-col gap-1">
                                <input
                                  type="date"
                                  name={`regularDate_${a.id}`}
                                  defaultValue={toDateInputValue(s?.regularDate ?? null)}
                                  className="cas-date"
                                />
                                <ScoreSelect name={`regular_${a.id}`} defaultValue={s?.regularScore} />
                              </div>
                            </td>
                            <td className="px-2 py-2" key={`remedial-${a.id}-${versionKey}`}>
                              <div className="flex flex-col gap-1">
                                <input
                                  type="date"
                                  name={`remedialDate_${a.id}`}
                                  defaultValue={toDateInputValue(s?.remedialDate ?? null)}
                                  className="cas-date"
                                />
                                <ScoreSelect name={`remedial_${a.id}`} defaultValue={s?.remedialScore} />
                              </div>
                            </td>
                            <td className="px-2 py-2" key={`remark-${a.id}-${versionKey}`}>
                              <input
                                type="text"
                                name={`remark_${a.id}`}
                                defaultValue={s?.remark ?? ""}
                                className="cas-text"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="px-3 py-3 text-right text-[color:var(--cas-ink-dim)]">
                          Sum of scores &middot; Achievement percentage &middot; Grade
                        </td>
                        <td colSpan={3} className="px-3 py-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="cas-readout">
                              {result.sum} / {result.totalPossible}
                            </span>
                            <span className="cas-readout">{result.percentage.toFixed(1)}%</span>
                            <span className="cas-readout grade">
                              {result.grade} (GPA {result.gpa})
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-4">
                  <PendingButton pendingLabel="Saving...">Save</PendingButton>
                </div>
              </form>
            ),
          },
          {
            label: "Rubrics",
            content: (
              <div className="cas-card p-6 text-center text-[color:var(--cas-ink-dim)]">
                Rubric-based grading isn&apos;t set up for {assignment.subject.name} yet — this
                subject only has the achievement scale (1–4) shown in the Assessment Record and
                Grading Scale tabs so far.
              </div>
            ),
          },
          {
            label: "Grading Scale",
            content: (
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="cas-label mb-2">Achievement level (1–4)</h3>
                  <table className="cas-plain">
                    <thead>
                      <tr>
                        <th>Level</th>
                        <th>Rating</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ACHIEVEMENT_LEVELS.slice()
                        .reverse()
                        .map((l) => (
                          <tr key={l.level}>
                            <td>{l.level}</td>
                            <td>{l.label}</td>
                            <td>{l.description}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3 className="cas-label mb-2">Percentage &rarr; Grade conversion</h3>
                  <table className="cas-plain">
                    <thead>
                      <tr>
                        <th>Achievement %</th>
                        <th>GPA</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {GRADE_SCALE.map((row) => (
                        <tr key={row.grade}>
                          <td>{row.min}% and above</td>
                          <td>{row.gpa}</td>
                          <td className="cas-grade-letter">{row.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
