"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireOwnedAssignment(assignmentId: string, teacherId: string) {
  return prisma.teacherAssignment.findFirst({
    where: { id: assignmentId, teacherId },
  });
}

function parseScore(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const n = Number(text);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;
  return n;
}

/**
 * The scoring grid submits each cell under two field names (the desktop table's
 * and the mobile card's — see the page component for why). Only one of the two
 * layouts is ever visible to the user, so whichever value differs from what was
 * already stored is the one they actually changed; if neither differs, the
 * value is unchanged either way.
 */
function resolveScore(
  desktopRaw: FormDataEntryValue | null,
  mobileRaw: FormDataEntryValue | null,
  previousScore: number | null,
): number | null {
  const desktop = parseScore(desktopRaw);
  const mobile = parseScore(mobileRaw);
  if (desktop === mobile) return desktop;
  if (desktop !== previousScore) return desktop;
  return mobile;
}

export async function saveRegularScores(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }
  const teacherId = session.user.id;

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const unitId = String(formData.get("unitId") ?? "");

  const assignment = await requireOwnedAssignment(assignmentId, teacherId);
  if (!assignment) return;

  const [students, achievements] = await Promise.all([
    prisma.student.findMany({ where: { sectionId: assignment.sectionId } }),
    prisma.learningAchievement.findMany({ where: { curriculumUnitId: unitId } }),
  ]);

  const existingScores = await prisma.assessmentScore.findMany({
    where: {
      studentId: { in: students.map((s) => s.id) },
      learningAchievementId: { in: achievements.map((a) => a.id) },
    },
  });
  const previousByKey = new Map(
    existingScores.map((s) => [`${s.studentId}__${s.learningAchievementId}`, s.regularScore]),
  );

  const today = new Date();

  for (const student of students) {
    for (const achievement of achievements) {
      const key = `${student.id}__${achievement.id}`;
      const desktopRaw = formData.get(`score_${key}`);
      const mobileRaw = formData.get(`score_${key}__m`);
      if (desktopRaw === null && mobileRaw === null) continue;
      const score = resolveScore(desktopRaw, mobileRaw, previousByKey.get(key) ?? null);
      if (score === null) continue;

      await prisma.assessmentScore.upsert({
        where: {
          studentId_learningAchievementId: {
            studentId: student.id,
            learningAchievementId: achievement.id,
          },
        },
        update: { regularScore: score, regularDate: today },
        create: {
          studentId: student.id,
          learningAchievementId: achievement.id,
          regularScore: score,
          regularDate: today,
          recordedByTeacherId: teacherId,
        },
      });
    }
  }

  revalidatePath(`/teacher/assessment/${assignmentId}/${unitId}`);
  redirect(`/teacher/assessment/${assignmentId}/${unitId}?saved=1`);
}

export async function saveStudentAssessment(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }
  const teacherId = session.user.id;

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const unitId = String(formData.get("unitId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");

  const assignment = await requireOwnedAssignment(assignmentId, teacherId);
  if (!assignment) return;

  const student = await prisma.student.findFirst({
    where: { id: studentId, sectionId: assignment.sectionId },
  });
  if (!student) return;

  const achievements = await prisma.learningAchievement.findMany({
    where: { curriculumUnitId: unitId },
  });

  for (const achievement of achievements) {
    const regularScore = parseScore(formData.get(`regular_${achievement.id}`));
    const regularDateRaw = String(formData.get(`regularDate_${achievement.id}`) ?? "");
    const remedialScore = parseScore(formData.get(`remedial_${achievement.id}`));
    const remedialDateRaw = String(formData.get(`remedialDate_${achievement.id}`) ?? "");
    const remark = String(formData.get(`remark_${achievement.id}`) ?? "").trim();

    await prisma.assessmentScore.upsert({
      where: {
        studentId_learningAchievementId: {
          studentId,
          learningAchievementId: achievement.id,
        },
      },
      update: {
        regularScore,
        regularDate: regularDateRaw ? new Date(regularDateRaw) : null,
        remedialScore,
        remedialDate: remedialDateRaw ? new Date(remedialDateRaw) : null,
        remark: remark || null,
      },
      create: {
        studentId,
        learningAchievementId: achievement.id,
        regularScore,
        regularDate: regularDateRaw ? new Date(regularDateRaw) : null,
        remedialScore,
        remedialDate: remedialDateRaw ? new Date(remedialDateRaw) : null,
        remark: remark || null,
        recordedByTeacherId: teacherId,
      },
    });
  }

  revalidatePath(`/teacher/assessment/${assignmentId}/${unitId}/${studentId}`);
  revalidatePath(`/teacher/assessment/${assignmentId}/${unitId}`);
  redirect(`/teacher/assessment/${assignmentId}/${unitId}/${studentId}?saved=1`);
}
