"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLessonPlanContent } from "@/lib/lesson-plan";

async function loadOwnedPeriod(periodId: string, teacherId: string) {
  const period = await prisma.planPeriod.findUnique({
    where: { id: periodId },
    include: {
      curriculumTopic: true,
      academicPlan: {
        include: {
          teacher: true,
          subject: true,
          grade: true,
          curriculumUnit: {
            include: {
              topics: { orderBy: { order: "asc" } },
              learningOutcomes: true,
              competencies: true,
            },
          },
        },
      },
    },
  });
  if (!period || period.academicPlan.teacherId !== teacherId) return null;
  return period;
}

export async function generateLessonPlan(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const periodId = String(formData.get("periodId") ?? "");
  const period = await loadOwnedPeriod(periodId, session.user.id);
  if (!period) return "This lesson period could not be found.";

  const unit = period.academicPlan.curriculumUnit;
  const precedingTopics = unit.topics
    .filter((topic) => topic.order < (period.curriculumTopic?.order ?? 0))
    .map((topic) => topic.title);

  let content, raw;
  try {
    ({ content, raw } = await generateLessonPlanContent({
      gradeName: period.academicPlan.grade.name,
      subjectName: period.academicPlan.subject.name,
      unitTitle: unit.title,
      topicTitle: period.curriculumTopic?.title ?? period.customTopic ?? "General practice",
      periodNumber: period.periodNumber,
      totalPeriods: unit.topics.length,
      learningOutcomes: unit.learningOutcomes.map((o) => o.description),
      competencies: unit.competencies.map((c) => c.description),
      precedingTopics,
    }));
  } catch (error) {
    console.error("Lesson plan generation failed", error);
    return "Couldn't generate a lesson plan right now. Check that the AI service is configured and try again.";
  }

  await prisma.lessonPlan.upsert({
    where: { planPeriodId: periodId },
    update: {
      ...content,
      rubric: content.rubric,
      aiRawResponse: JSON.parse(JSON.stringify(raw)),
      editedByTeacher: false,
    },
    create: {
      planPeriodId: periodId,
      ...content,
      rubric: content.rubric,
      aiRawResponse: JSON.parse(JSON.stringify(raw)),
    },
  });

  revalidatePath(`/teacher/lesson-plans/${periodId}`);
  return undefined;
}

function linesToArray(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function saveLessonPlan(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const periodId = String(formData.get("periodId") ?? "");
  const period = await loadOwnedPeriod(periodId, session.user.id);
  if (!period) return;

  await prisma.lessonPlan.update({
    where: { planPeriodId: periodId },
    data: {
      objectives: linesToArray(formData.get("objectives")),
      activities: linesToArray(formData.get("activities")),
      teachingMethods: linesToArray(formData.get("teachingMethods")),
      materials: linesToArray(formData.get("materials")),
      discussionQuestions: linesToArray(formData.get("discussionQuestions")),
      practiceActivities: linesToArray(formData.get("practiceActivities")),
      homework: String(formData.get("homework") ?? ""),
      assessmentActivities: linesToArray(formData.get("assessmentActivities")),
      expectedEvidence: linesToArray(formData.get("expectedEvidence")),
      editedByTeacher: true,
    },
  });

  revalidatePath(`/teacher/lesson-plans/${periodId}`);
}
