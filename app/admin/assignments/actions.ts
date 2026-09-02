"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createAssignment(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SCHOOL_ADMIN") {
    redirect("/login");
  }

  const teacherId = String(formData.get("teacherId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const classKey = String(formData.get("classKey") ?? "");
  const academicYearId = String(formData.get("academicYearId") ?? "");
  const [gradeId, sectionId] = classKey.split(":");

  if (!teacherId || !subjectId || !gradeId || !sectionId || !academicYearId) return;

  try {
    await prisma.teacherAssignment.create({
      data: { teacherId, subjectId, gradeId, sectionId, academicYearId },
    });
  } catch {
    // Likely a duplicate assignment; nothing else to do in this phase.
    return;
  }

  revalidatePath("/admin/assignments");
}
