"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SCHOOL_ADMIN") {
    redirect("/login");
  }
  return session.user;
}

export async function createStudent(formData: FormData) {
  const user = await requireAdmin();

  const sectionId = String(formData.get("sectionId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const rollNumber = String(formData.get("rollNumber") ?? "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "");
  const guardianName = String(formData.get("guardianName") ?? "").trim();
  const guardianRelation = String(formData.get("guardianRelation") ?? "").trim();
  const guardianPhone = String(formData.get("guardianPhone") ?? "").trim();

  if (!sectionId || !name || !rollNumber) return;

  const section = await prisma.section.findFirst({
    where: { id: sectionId, grade: { schoolId: user.schoolId } },
  });
  if (!section) return;

  try {
    await prisma.student.create({
      data: {
        schoolId: user.schoolId,
        sectionId,
        name,
        rollNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        guardianName: guardianName || null,
        guardianRelation: guardianRelation || null,
        guardianPhone: guardianPhone || null,
      },
    });
  } catch {
    // Most likely a duplicate roll number within the section.
    return;
  }

  revalidatePath("/admin/students");
}
