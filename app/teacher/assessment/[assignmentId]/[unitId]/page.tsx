import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeUnitResult } from "@/lib/grading";
import { PendingButton } from "@/components/ui/pending-button";
import { saveRegularScores } from "./actions";

export default async function UnitAssessmentPage(
  props: PageProps<"/teacher/assessment/[assignmentId]/[unitId]">,
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

  return (
    <div>
      <p className="text-sm text-slate-500">
        {assignment.subject.name} — {assignment.grade.name} {assignment.section.name}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">{unit.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Score each student on the regular pass. Open a student for remedial scores and remarks.
      </p>

      <form action={saveRegularScores}>
        <input type="hidden" name="assignmentId" value={assignmentId} />
        <input type="hidden" name="unitId" value={unitId} />

        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Roll</th>
                <th className="px-3 py-2 font-medium">Name</th>
                {achievements.map((a) => (
                  <th key={a.id} className="px-3 py-2 font-medium" title={a.description}>
                    {a.skillArea.name}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium">Result</th>
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
                  <tr key={student.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-500">{student.rollNumber}</td>
                    <td className="px-3 py-2 text-slate-900">{student.name}</td>
                    {achievements.map((a, i) => {
                      const existing = studentScores[i];
                      return (
                        <td key={a.id} className="px-3 py-2">
                          <select
                            key={existing ? existing.updatedAt.getTime() : "new"}
                            name={`score_${student.id}__${a.id}`}
                            defaultValue={existing?.regularScore ?? ""}
                            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                          >
                            <option value="">—</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                          </select>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-slate-700">
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
                  <td colSpan={achievements.length + 4} className="px-3 py-6 text-center text-slate-400">
                    No students in this class yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
