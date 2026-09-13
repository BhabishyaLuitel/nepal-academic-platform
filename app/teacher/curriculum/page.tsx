import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CasMasthead } from "@/components/assessment/cas-masthead";

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

  const [units, rubrics] = selectedSubject
    ? await Promise.all([
        prisma.curriculumUnit.findMany({
          where: { curriculumSubjectId: selectedSubject.id },
          orderBy: { order: "asc" },
          include: { _count: { select: { learningAchievements: true, topics: true } } },
        }),
        prisma.rubric.findMany({
          where: { curriculumSubjectId: selectedSubject.id },
          include: { criteria: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        }),
      ])
    : [[], []];
  const selectedUnit = unitId ? units.find((u) => u.id === unitId) : undefined;

  const unitDetail = selectedUnit
    ? await prisma.curriculumUnit.findUnique({
        where: { id: selectedUnit.id },
        include: {
          topics: { orderBy: { order: "asc" } },
          learningOutcomes: true,
          competencies: true,
          learningAchievements: { include: { skillArea: true }, orderBy: { skillArea: { order: "asc" } } },
        },
      })
    : null;

  return (
    <div className="cas-theme">
      <CasMasthead
        eyebrow="Curriculum"
        title="Curriculum"
        subtitle="Browse the official curriculum by grade, subject, and unit."
      />

      <nav className="mt-6 flex flex-wrap gap-2 text-sm">
        {grades.map((grade) => (
          <Link
            key={grade.id}
            href={`/teacher/curriculum?gradeId=${grade.id}`}
            className={`rounded-full px-4 py-1.5 font-medium ${
              selectedGrade?.id === grade.id
                ? "bg-brand-green text-white"
                : "cas-card text-[color:var(--cas-ink-dim)]"
            }`}
          >
            {grade.name}
          </Link>
        ))}
      </nav>

      {selectedGrade && (
        <div className="mt-6">
          <h2 className="cas-label mb-2">Subjects in {selectedGrade.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Link
                key={subject.id}
                href={`/teacher/curriculum?gradeId=${selectedGrade.id}&subjectId=${subject.id}`}
                className={`cas-card p-4 ${
                  selectedSubject?.id === subject.id ? "border-[color:var(--cas-accent)]" : ""
                }`}
              >
                <p className="font-medium text-[color:var(--cas-ink)]">{subject.name}</p>
              </Link>
            ))}
            {subjects.length === 0 && (
              <p className="text-sm text-[color:var(--cas-ink-faint)]">
                No curriculum loaded for {selectedGrade.name} yet.
              </p>
            )}
          </div>
        </div>
      )}

      {selectedSubject && (
        <div className="mt-6">
          <h2 className="cas-label mb-2">Units in {selectedSubject.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => {
              const contentCount = unit._count.learningAchievements || unit._count.topics;
              const contentLabel = unit._count.learningAchievements
                ? `${unit._count.learningAchievements} skill areas`
                : unit._count.topics
                  ? `${unit._count.topics} topics`
                  : "No content yet";
              return (
                <Link
                  key={unit.id}
                  href={`/teacher/curriculum?gradeId=${selectedGrade!.id}&subjectId=${selectedSubject.id}&unitId=${unit.id}`}
                  className={`cas-card p-4 ${
                    selectedUnit?.id === unit.id ? "border-[color:var(--cas-accent)]" : ""
                  }`}
                >
                  <p className="font-medium text-[color:var(--cas-ink)]">{unit.title}</p>
                  <p className={`cas-label mt-2 ${contentCount === 0 ? "text-amber-600" : ""}`}>
                    {contentLabel}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {unitDetail && (
        <div className="cas-card mt-6 p-6">
          <h2 className="text-lg font-semibold text-[color:var(--cas-ink)]">{unitDetail.title}</h2>

          {unitDetail.learningAchievements.length > 0 && (
            <div className="mt-4">
              <h3 className="cas-label mb-2">Continuous assessment skill areas</h3>
              <div className="cas-card overflow-hidden">
                <table className="cas-table w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="px-3 py-2">Skill area</th>
                      <th className="px-3 py-2">Learning achievement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitDetail.learningAchievements.map((achievement) => (
                      <tr key={achievement.id}>
                        <td className="px-3 py-2 font-medium text-[color:var(--cas-ink)]">
                          {achievement.skillArea.name}
                        </td>
                        <td className="px-3 py-2 text-[color:var(--cas-ink-dim)]">
                          {achievement.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {unitDetail.topics.length > 0 && (
            <div className="mt-4">
              <h3 className="cas-label mb-2">Topics</h3>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-[color:var(--cas-ink-dim)]">
                {unitDetail.topics.map((topic) => (
                  <li key={topic.id}>{topic.title}</li>
                ))}
              </ol>
            </div>
          )}

          {unitDetail.learningOutcomes.length > 0 && (
            <div className="mt-4">
              <h3 className="cas-label mb-2">Learning outcomes</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--cas-ink-dim)]">
                {unitDetail.learningOutcomes.map((outcome) => (
                  <li key={outcome.id}>{outcome.description}</li>
                ))}
              </ul>
            </div>
          )}

          {unitDetail.competencies.length > 0 && (
            <div className="mt-4">
              <h3 className="cas-label mb-2">Competencies</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--cas-ink-dim)]">
                {unitDetail.competencies.map((competency) => (
                  <li key={competency.id}>{competency.description}</li>
                ))}
              </ul>
            </div>
          )}

          {unitDetail.learningAchievements.length === 0 &&
            unitDetail.topics.length === 0 &&
            unitDetail.learningOutcomes.length === 0 &&
            unitDetail.competencies.length === 0 && (
              <p className="mt-4 text-sm text-[color:var(--cas-ink-faint)]">
                No content has been loaded for this unit yet.
              </p>
            )}
        </div>
      )}

      {selectedSubject && rubrics.length > 0 && (
        <div className="mt-6">
          <h2 className="cas-label mb-2">
            Example rubrics for {selectedSubject.name}
          </h2>
          <p className="mb-3 text-sm text-[color:var(--cas-ink-dim)]">
            Ready-made rubrics teachers can score directly under a student&apos;s
            Assessment &rarr; Rubrics tab &mdash; shown here as a reference.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {rubrics.map((rubric) => (
              <div key={rubric.id} className="cas-card p-4">
                <p className="font-medium text-[color:var(--cas-ink)]">{rubric.title}</p>
                <p className="mt-1 text-sm text-[color:var(--cas-ink-dim)]">{rubric.description}</p>
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-[color:var(--cas-ink-faint)]">
                  {rubric.criteria.map((criterion) => (
                    <li key={criterion.id}>{criterion.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
