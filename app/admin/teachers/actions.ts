"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createTeacher(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SCHOOL_ADMIN") {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || password.length < 8) return;

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        schoolId: session.user.schoolId,
        name,
        email,
        passwordHash,
        role: "TEACHER",
      },
    });
  } catch {
    // Most likely a duplicate email; nothing else to do in this phase.
    return;
  }

  revalidatePath("/admin/teachers");
}
