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
  const schoolId = session.user.schoolId;

  const teacherId = String(formData.get("teacherId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const classKey = String(formData.get("classKey") ?? "");
  const academicYearId = String(formData.get("academicYearId") ?? "");
  const [gradeId, sectionId] = classKey.split(":");

  if (!teacherId || !subjectId || !gradeId || !sectionId || !academicYearId) return;

  // Every id below comes straight from form fields, which are populated from
  // <select> options the UI only ever fills with this admin's own school's
  // records — but a crafted request could submit any id. Re-verify server
  // side that each one actually belongs to this school before linking them,
  // so an assignment can never be created spanning two different schools.
  const [teacher, subject, grade, section, academicYear] = await Promise.all([
    prisma.user.findFirst({ where: { id: teacherId, schoolId, role: "TEACHER" } }),
    prisma.subject.findFirst({ where: { id: subjectId, schoolId } }),
    prisma.grade.findFirst({ where: { id: gradeId, schoolId } }),
    prisma.section.findFirst({ where: { id: sectionId, gradeId } }),
    prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId } }),
  ]);
  if (!teacher || !subject || !grade || !section || !academicYear) return;

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
