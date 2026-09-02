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

export async function createGrade(formData: FormData) {
  const user = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const order = Number(formData.get("order") ?? 0);
  if (!name) return;

  await prisma.grade.create({
    data: { schoolId: user.schoolId, name, order },
  });

  revalidatePath("/admin/grades");
}

export async function createSection(formData: FormData) {
  await requireAdmin();
  const gradeId = String(formData.get("gradeId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!gradeId || !name) return;

  await prisma.section.create({ data: { gradeId, name } });

  revalidatePath("/admin/grades");
}
