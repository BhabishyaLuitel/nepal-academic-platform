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

export async function saveRubricScores(formData: FormData) {
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

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("rubric_")) continue;
    const rubricCriterionId = key.slice("rubric_".length);
    const text = String(value ?? "").trim();
    if (!text) continue;
    const level = Number(text);
    if (!Number.isInteger(level) || level < 1 || level > 4) continue;

    await prisma.rubricScore.upsert({
      where: { studentId_rubricCriterionId: { studentId, rubricCriterionId } },
      update: { level },
      create: { studentId, rubricCriterionId, level, recordedByTeacherId: teacherId },
    });
  }

  revalidatePath(`/teacher/assessment/${assignmentId}/${unitId}/${studentId}`);
  redirect(`/teacher/assessment/${assignmentId}/${unitId}/${studentId}?saved=1`);
}

export async function createCustomRubric(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }
  const teacherId = session.user.id;

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const unitId = String(formData.get("unitId") ?? "");

  const assignment = await requireOwnedAssignment(assignmentId, teacherId);
  if (!assignment) return;

  const unit = await prisma.curriculumUnit.findUnique({ where: { id: unitId } });
  if (!unit) return;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) return;

  const names = formData.getAll("criterionName").map((v) => String(v).trim());
  const level4s = formData.getAll("criterionLevel4").map((v) => String(v).trim());
  const level3s = formData.getAll("criterionLevel3").map((v) => String(v).trim());
  const level2s = formData.getAll("criterionLevel2").map((v) => String(v).trim());
  const level1s = formData.getAll("criterionLevel1").map((v) => String(v).trim());

  const criteria = names
    .map((name, i) => ({
      name,
      level4: level4s[i] ?? "",
      level3: level3s[i] ?? "",
      level2: level2s[i] ?? "",
      level1: level1s[i] ?? "",
    }))
    .filter((c) => c.name && c.level4 && c.level3 && c.level2 && c.level1);
  if (criteria.length === 0) return;

  const existingCount = await prisma.rubric.count({ where: { curriculumUnitId: unitId } });

  const rubric = await prisma.rubric.create({
    data: {
      curriculumSubjectId: unit.curriculumSubjectId,
      curriculumUnitId: unitId,
      createdByTeacherId: teacherId,
      title,
      description,
      order: existingCount + 1,
      criteria: {
        create: criteria.map((c, i) => ({ ...c, order: i + 1 })),
      },
    },
  });

  revalidatePath(`/teacher/assessment/${assignmentId}/${unitId}/rubrics`);
  redirect(`/teacher/assessment/${assignmentId}/${unitId}/rubrics?created=${rubric.id}`);
}

export async function deleteCustomRubric(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }
  const teacherId = session.user.id;

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const unitId = String(formData.get("unitId") ?? "");
  const rubricId = String(formData.get("rubricId") ?? "");

  const assignment = await requireOwnedAssignment(assignmentId, teacherId);
  if (!assignment) return;

  await prisma.rubric.deleteMany({ where: { id: rubricId, curriculumUnitId: unitId } });

  revalidatePath(`/teacher/assessment/${assignmentId}/${unitId}/rubrics`);
  redirect(`/teacher/assessment/${assignmentId}/${unitId}/rubrics`);
}
