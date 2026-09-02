import Link from "next/link";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  gradeId?: string;
  subjectId?: string;
  unitId?: string;
}>;

export default async function CurriculumBrowserPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { gradeId, subjectId, unitId } = await searchParams;

  const grades = await prisma.curriculumGrade.findMany({ orderBy: { name: "asc" } });
  const selectedGrade = gradeId ? grades.find((g) => g.id === gradeId) : undefined;

  const subjects = selectedGrade
    ? await prisma.curriculumSubject.findMany({
        where: { curriculumGradeId: selectedGrade.id },
        orderBy: { name: "asc" },
      })
    : [];
  const selectedSubject = subjectId ? subjects.find((s) => s.id === subjectId) : undefined;

  const units = selectedSubject
    ? await prisma.curriculumUnit.findMany({
        where: { curriculumSubjectId: selectedSubject.id },
        orderBy: { order: "asc" },
      })
    : [];
  const selectedUnit = unitId ? units.find((u) => u.id === unitId) : undefined;

  const unitDetail = selectedUnit
    ? await prisma.curriculumUnit.findUnique({
        where: { id: selectedUnit.id },
        include: {
          topics: { orderBy: { order: "asc" } },
          learningOutcomes: true,
          competencies: true,
        },
      })
    : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Curriculum</h1>
      <p className="mt-1 text-sm text-slate-500">
        Browse the official curriculum by grade, subject, and unit.
      </p>

      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {grades.map((grade) => (
          <Link
            key={grade.id}
            href={`/teacher/curriculum?gradeId=${grade.id}`}
            className={`rounded-full px-3 py-1 ${
              selectedGrade?.id === grade.id
                ? "bg-brand-green text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {grade.name}
          </Link>
        ))}
      </nav>

      {selectedGrade && (
        <nav className="mt-3 flex flex-wrap gap-2 text-sm">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/teacher/curriculum?gradeId=${selectedGrade.id}&subjectId=${subject.id}`}
              className={`rounded-full px-3 py-1 ${
                selectedSubject?.id === subject.id
                  ? "bg-brand-green text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {subject.name}
            </Link>
          ))}
        </nav>
      )}

      {selectedSubject && (
        <nav className="mt-3 flex flex-wrap gap-2 text-sm">
          {units.map((unit) => (
            <Link
              key={unit.id}
              href={`/teacher/curriculum?gradeId=${selectedGrade!.id}&subjectId=${selectedSubject.id}&unitId=${unit.id}`}
              className={`rounded-full px-3 py-1 ${
                selectedUnit?.id === unit.id
                  ? "bg-brand-green text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {unit.title}
            </Link>
          ))}
        </nav>
      )}

      {unitDetail && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{unitDetail.title}</h2>

          <h3 className="mt-4 text-sm font-medium text-slate-700">Topics</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
            {unitDetail.topics.map((topic) => (
              <li key={topic.id}>{topic.title}</li>
            ))}
          </ol>

          <h3 className="mt-4 text-sm font-medium text-slate-700">Learning outcomes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {unitDetail.learningOutcomes.map((outcome) => (
              <li key={outcome.id}>{outcome.description}</li>
            ))}
          </ul>

          <h3 className="mt-4 text-sm font-medium text-slate-700">Competencies</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {unitDetail.competencies.map((competency) => (
              <li key={competency.id}>{competency.description}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
