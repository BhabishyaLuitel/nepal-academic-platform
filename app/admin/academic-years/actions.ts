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

export async function createAcademicYear(formData: FormData) {
  const user = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  if (!name || !startDate || !endDate) return;

  await prisma.academicYear.create({
    data: {
      schoolId: user.schoolId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  revalidatePath("/admin/academic-years");
}

export async function setActiveAcademicYear(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const year = await prisma.academicYear.findFirst({
    where: { id, schoolId: user.schoolId },
  });
  if (!year) return;

  await prisma.$transaction([
    prisma.academicYear.updateMany({
      where: { schoolId: user.schoolId },
      data: { isActive: false },
    }),
    prisma.academicYear.update({ where: { id }, data: { isActive: true } }),
  ]);

  revalidatePath("/admin/academic-years");
}
