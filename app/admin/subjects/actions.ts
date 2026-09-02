"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createSubject(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SCHOOL_ADMIN") {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  if (!name) return;

  await prisma.subject.create({
    data: { schoolId: session.user.schoolId, name, code: code || null },
  });

  revalidatePath("/admin/subjects");
}
