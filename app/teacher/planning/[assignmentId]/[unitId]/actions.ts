"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createAcademicPlan(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }
  const teacherId = session.user.id;

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const unitId = String(formData.get("unitId") ?? "");

  const assignment = await prisma.teacherAssignment.findFirst({
    where: { id: assignmentId, teacherId },
  });
  if (!assignment) return;

  const topics = await prisma.curriculumTopic.findMany({
    where: { curriculumUnitId: unitId },
    orderBy: { order: "asc" },
  });
  if (topics.length === 0) return;

  const existing = await prisma.academicPlan.findFirst({
    where: {
      sectionId: assignment.sectionId,
      subjectId: assignment.subjectId,
      curriculumUnitId: unitId,
      academicYearId: assignment.academicYearId,
    },
  });
  if (existing) {
    revalidatePath(`/teacher/planning/${assignmentId}/${unitId}`);
    return;
  }

  await prisma.academicPlan.create({
    data: {
      schoolId: session.user.schoolId,
      academicYearId: assignment.academicYearId,
      gradeId: assignment.gradeId,
      sectionId: assignment.sectionId,
      subjectId: assignment.subjectId,
      curriculumUnitId: unitId,
      teacherId,
      periods: {
        create: topics.map((topic, index) => ({
          periodNumber: index + 1,
          curriculumTopicId: topic.id,
        })),
      },
    },
  });

  revalidatePath(`/teacher/planning/${assignmentId}/${unitId}`);
}
