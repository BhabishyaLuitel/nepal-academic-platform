import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Save } from "lucide-react";
import { PendingButton } from "@/components/ui/pending-button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SavedBanner } from "@/components/ui/saved-banner";
import { saveLessonPlan } from "./actions";
import { GenerateForm } from "./generate-form";
import { CasMasthead } from "@/components/assessment/cas-masthead";
import type { LessonPlanContent } from "@/lib/lesson-plan";

function TextAreaField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string[];
}) {
  return (
    <label className="block text-base font-medium text-[color:var(--cas-ink-dim)]">
      {label}
      <textarea
        name={name}
        defaultValue={defaultValue.join("\n")}
        rows={Math.min(8, Math.max(3, defaultValue.length))}
        className="cas-text mt-1 block"
      />
      <span className="text-sm font-normal text-[color:var(--cas-ink-faint)]">One item per line.</span>
    </label>
  );
}

export default async function LessonPlanPage(
  props: PageProps<"/teacher/lesson-plans/[periodId]"> & {
    searchParams: Promise<{ saved?: string }>;
  },
) {
  const { periodId } = await props.params;
  const { saved } = await props.searchParams;
  const session = await auth();
  const teacherId = session!.user.id;

  const period = await prisma.planPeriod.findUnique({
    where: { id: periodId },
    include: {
      curriculumTopic: true,
      lessonPlan: true,
      academicPlan: {
        include: { subject: true, grade: true, section: true, teacher: true, curriculumUnit: true },
      },
    },
  });
  if (!period || period.academicPlan.teacherId !== teacherId) notFound();

  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId,
      subjectId: period.academicPlan.subjectId,
      gradeId: period.academicPlan.gradeId,
      sectionId: period.academicPlan.sectionId,
      academicYearId: period.academicPlan.academicYearId,
    },
  });

  const topicTitle = period.curriculumTopic?.title ?? period.customTopic ?? "Untitled period";
  const lessonPlan = period.lessonPlan;
  const rubric = (lessonPlan?.rubric ?? []) as LessonPlanContent["rubric"];
  const className = `${period.academicPlan.subject.name} — ${period.academicPlan.grade.name} ${period.academicPlan.section.name}`;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "My Classes", href: "/teacher" },
          ...(assignment ? [{ label: className, href: `/teacher/planning/${assignment.id}` }] : [{ label: className }]),
          ...(assignment
            ? [{ label: period.academicPlan.curriculumUnit.title, href: `/teacher/planning/${assignment.id}/${period.academicPlan.curriculumUnitId}` }]
            : []),
          { label: `Period ${period.periodNumber}: ${topicTitle}` },
        ]}
      />
      <CasMasthead
        eyebrow="Lesson Planning"
        title={topicTitle}
        subtitle={`${className} · Period ${period.periodNumber}`}
      />
      {saved && (
        <div className="mt-6">
          <SavedBanner message="Lesson plan saved" />
        </div>
      )}

      {!lessonPlan ? (
        <div className="cas-card mt-6 max-w-md p-6">
          <p className="text-base text-[color:var(--cas-ink-dim)]">
            No lesson plan yet for this period. Generate one with AI, then edit it to fit your
            classroom.
          </p>
          <div className="mt-4">
            <GenerateForm periodId={periodId} label="Generate with AI" pendingLabel="Generating..." />
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {!lessonPlan.editedByTeacher && (
            <p className="rounded-md bg-amber-50 px-3 py-2.5 text-base text-amber-700">
              AI-generated — review and edit before teaching.
            </p>
          )}

          <form action={saveLessonPlan} className="cas-card space-y-4 p-6">
            <input type="hidden" name="periodId" value={periodId} />
            <TextAreaField
              label="Learning objectives"
              name="objectives"
              defaultValue={lessonPlan.objectives as string[]}
            />
            <TextAreaField
              label="Teaching activities"
              name="activities"
              defaultValue={lessonPlan.activities as string[]}
            />
            <TextAreaField
              label="Teaching methods"
              name="teachingMethods"
              defaultValue={lessonPlan.teachingMethods as string[]}
            />
            <TextAreaField
              label="Materials needed"
              name="materials"
              defaultValue={lessonPlan.materials as string[]}
            />
            <TextAreaField
              label="Discussion questions"
              name="discussionQuestions"
              defaultValue={lessonPlan.discussionQuestions as string[]}
            />
            <TextAreaField
              label="Practice activities"
              name="practiceActivities"
              defaultValue={lessonPlan.practiceActivities as string[]}
            />
            <label className="block text-base font-medium text-[color:var(--cas-ink-dim)]">
              Homework
              <textarea
                name="homework"
                defaultValue={lessonPlan.homework ?? ""}
                rows={2}
                className="cas-text mt-1 block"
              />
            </label>
            <TextAreaField
              label="Assessment activities"
              name="assessmentActivities"
              defaultValue={lessonPlan.assessmentActivities as string[]}
            />
            <TextAreaField
              label="Expected learning evidence"
              name="expectedEvidence"
              defaultValue={lessonPlan.expectedEvidence as string[]}
            />

            <div className="flex items-center gap-3 pt-2">
              <PendingButton
                pendingLabel="Saving..."
                icon={<Save size={18} aria-hidden="true" />}
              >
                Save changes
              </PendingButton>
            </div>
          </form>

          <div className="cas-card p-6">
            <h2 className="font-medium text-[color:var(--cas-ink)]">Rubric</h2>
            <p className="cas-label mt-1">
              Generated with the lesson plan. Regenerate with AI to change it.
            </p>
            <div className="mt-3 space-y-4">
              {rubric.map((row, index) => (
                <div key={index}>
                  <p className="text-sm font-medium text-[color:var(--cas-ink)]">{row.criterion}</p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-[color:var(--cas-ink-dim)]">
                    {row.levels.map((level, levelIndex) => (
                      <li key={levelIndex}>
                        <span className="font-medium">{level.label}:</span> {level.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <GenerateForm periodId={periodId} label="Regenerate with AI" pendingLabel="Regenerating..." />
        </div>
      )}
    </div>
  );
}
