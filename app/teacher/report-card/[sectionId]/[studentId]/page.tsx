import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeSubjectResult, computeReportCard, type SubjectReportRow } from "@/lib/grading";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CasMasthead } from "@/components/assessment/cas-masthead";

export default async function ReportCardPage(
  props: PageProps<"/teacher/report-card/[sectionId]/[studentId]">,
) {
  const { sectionId, studentId } = await props.params;
  const session = await auth();
  const teacherId = session!.user.id;
  const schoolId = session!.user.schoolId;

  const assignment = await prisma.teacherAssignment.findFirst({
    where: { sectionId, teacherId },
    include: { grade: true, section: true },
  });
  if (!assignment) notFound();

  const [school, student, activeYear] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId } }),
    prisma.student.findFirst({ where: { id: studentId, sectionId } }),
    prisma.academicYear.findFirst({ where: { schoolId, isActive: true } }),
  ]);
  if (!student) notFound();

  // Every subject taught in this section (across all teachers), for the
  // active academic year, is one row on the report card.
  const sectionAssignments = activeYear
    ? await prisma.teacherAssignment.findMany({
        where: { sectionId, academicYearId: activeYear.id },
        include: { subject: true },
        orderBy: { subject: { name: "asc" } },
      })
    : [];

  const subjectRows: SubjectReportRow[] = [];
  for (const sa of sectionAssignments) {
    const curriculumGrade = await prisma.curriculumGrade.findUnique({
      where: { name: assignment.grade.name },
    });
    const curriculumSubject = curriculumGrade
      ? await prisma.curriculumSubject.findFirst({
          where: { curriculumGradeId: curriculumGrade.id, name: sa.subject.name },
        })
      : null;
    if (!curriculumSubject) continue;

    const achievements = await prisma.learningAchievement.findMany({
      where: { curriculumUnit: { curriculumSubjectId: curriculumSubject.id } },
    });
    if (achievements.length === 0) continue;

    const scores = await prisma.assessmentScore.findMany({
      where: { studentId, learningAchievementId: { in: achievements.map((a) => a.id) } },
    });
    const scoreByAchievement = new Map(scores.map((s) => [s.learningAchievementId, s]));
    const result = computeSubjectResult(
      achievements.map((a) => {
        const s = scoreByAchievement.get(a.id);
        return { regularScore: s?.regularScore ?? null, remedialScore: s?.remedialScore ?? null };
      }),
    );

    subjectRows.push({
      subjectId: sa.subject.id,
      subjectName: sa.subject.name,
      creditWeight: sa.subject.creditWeight,
      percentage: result.percentage,
      gpa: result.gpa,
      grade: result.grade,
    });
  }

  const overall = computeReportCard(subjectRows);
  const className = `${assignment.grade.name} ${assignment.section.name}`;

  return (
    <div className="cas-theme">
      <Breadcrumbs
        items={[
          { label: "Report Card", href: "/teacher/report-card" },
          { label: className, href: `/teacher/report-card/${sectionId}` },
          { label: student.name },
        ]}
      />
      <CasMasthead
        eyebrow="Report Card"
        title={student.name}
        subtitle={activeYear ? activeYear.name : "No active academic year set"}
        identity={[
          { label: "School", value: school?.name ?? "—" },
          { label: "Class", value: assignment.grade.name },
          { label: "Section", value: assignment.section.name },
          { label: "Student Name", value: student.name },
          { label: "Roll No.", value: student.rollNumber },
        ]}
      />

      {subjectRows.length === 0 ? (
        <div className="cas-card mt-6 p-6 text-center text-[color:var(--cas-ink-dim)]">
          No subjects with continuous assessment data are set up for this class yet.
        </div>
      ) : (
        <div className="cas-card mt-6 overflow-x-auto">
          <table className="cas-table w-full text-left text-sm" style={{ minWidth: 520 }}>
            <thead>
              <tr>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Percentage</th>
                <th className="px-3 py-2">GPA</th>
                <th className="px-3 py-2">Grade</th>
              </tr>
            </thead>
            <tbody>
              {subjectRows.map((row) => (
                <tr key={row.subjectId}>
                  <td className="px-3 py-2 font-medium text-[color:var(--cas-ink)]">{row.subjectName}</td>
                  <td className="px-3 py-2 text-[color:var(--cas-ink-dim)]">{row.percentage.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-[color:var(--cas-ink-dim)]">{row.gpa}</td>
                  <td className="px-3 py-2 cas-grade-letter">{row.grade}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="px-3 py-3 text-right text-[color:var(--cas-ink-dim)]">Overall</td>
                <td className="px-3 py-3">
                  <span className="cas-readout">{overall.percentage.toFixed(1)}%</span>
                </td>
                <td className="px-3 py-3">
                  <span className="cas-readout grade">GPA {overall.gpa.toFixed(2)}</span>
                </td>
                <td className="px-3 py-3">
                  <span className="cas-readout">WGPA {overall.wgpa.toFixed(2)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
