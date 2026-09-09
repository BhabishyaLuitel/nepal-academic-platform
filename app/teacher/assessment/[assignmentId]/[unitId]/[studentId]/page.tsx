import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeUnitResult, ACHIEVEMENT_LEVELS } from "@/lib/grading";
import { PendingButton } from "@/components/ui/pending-button";
import { saveStudentAssessment } from "../actions";

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function StudentAssessmentPage(
  props: PageProps<"/teacher/assessment/[assignmentId]/[unitId]/[studentId]">,
) {
  const { assignmentId, unitId, studentId } = await props.params;
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

  return (
    <div>
      <p className="text-sm text-slate-500">
        {assignment.subject.name} — {assignment.grade.name} {assignment.section.name} · {unit.title}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">
        {student.name} <span className="text-slate-400 font-normal">Roll {student.rollNumber}</span>
      </h1>
      <p className="mt-1 text-sm text-slate-700">
        Result: {result.sum}/{result.totalPossible} · {result.percentage.toFixed(1)}% · GPA {result.gpa} · Grade {result.grade}
      </p>

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
            <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-medium text-slate-900">{a.skillArea.name}</p>
              <p className="text-sm text-slate-500">{a.description}</p>

              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <label className="text-sm text-slate-700">
                  Regular score
                  <select
                    key={`regular-${a.id}-${versionKey}`}
                    name={`regular_${a.id}`}
                    defaultValue={s?.regularScore ?? ""}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">—</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </label>
                <label className="text-sm text-slate-700">
                  Regular date
                  <input
                    key={`regularDate-${a.id}-${versionKey}`}
                    type="date"
                    name={`regularDate_${a.id}`}
                    defaultValue={toDateInputValue(s?.regularDate ?? null)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Remedial score
                  <select
                    key={`remedial-${a.id}-${versionKey}`}
                    name={`remedial_${a.id}`}
                    defaultValue={s?.remedialScore ?? ""}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">—</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </label>
                <label className="text-sm text-slate-700">
                  Remedial date
                  <input
                    key={`remedialDate-${a.id}-${versionKey}`}
                    type="date"
                    name={`remedialDate_${a.id}`}
                    defaultValue={toDateInputValue(s?.remedialDate ?? null)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
              </div>

              <label className="mt-3 block text-sm text-slate-700">
                Remark
                <input
                  key={`remark-${a.id}-${versionKey}`}
                  type="text"
                  name={`remark_${a.id}`}
                  defaultValue={s?.remark ?? ""}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
              </label>
            </div>
          );
        })}

        <PendingButton pendingLabel="Saving...">Save</PendingButton>
      </form>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-medium text-slate-900">Achievement scale</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          {ACHIEVEMENT_LEVELS.map((l) => (
            <li key={l.level}>
              <span className="font-medium">{l.level} — {l.label}:</span> {l.description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
