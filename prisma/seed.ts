import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedCurriculum() {
  const grade5 = await prisma.curriculumGrade.upsert({
    where: { name: "Grade 5" },
    update: {},
    create: { name: "Grade 5" },
  });

  const mathematics = await prisma.curriculumSubject.upsert({
    where: { curriculumGradeId_name: { curriculumGradeId: grade5.id, name: "Mathematics" } },
    update: {},
    create: { curriculumGradeId: grade5.id, name: "Mathematics" },
  });

  const fractions = await prisma.curriculumUnit.upsert({
    where: { curriculumSubjectId_order: { curriculumSubjectId: mathematics.id, order: 3 } },
    update: {},
    create: {
      curriculumSubjectId: mathematics.id,
      title: "Fractions",
      order: 3,
    },
  });

  const topics = [
    "Introduction to fractions",
    "Types of fractions",
    "Equivalent fractions",
    "Comparing fractions",
    "Adding fractions",
    "Subtracting fractions",
    "Practice",
    "Assessment",
  ];

  for (const [index, title] of topics.entries()) {
    await prisma.curriculumTopic.upsert({
      where: { curriculumUnitId_order: { curriculumUnitId: fractions.id, order: index + 1 } },
      update: { title },
      create: { curriculumUnitId: fractions.id, title, order: index + 1 },
    });
  }

  const existingOutcomes = await prisma.learningOutcome.count({
    where: { curriculumUnitId: fractions.id },
  });
  if (existingOutcomes === 0) {
    await prisma.learningOutcome.createMany({
      data: [
        "Identify and represent fractions as parts of a whole",
        "Differentiate between proper, improper, and mixed fractions",
        "Find equivalent fractions using multiplication and division",
        "Compare and order fractions with like and unlike denominators",
        "Add and subtract fractions with like and unlike denominators",
      ].map((description) => ({ curriculumUnitId: fractions.id, description })),
    });
  }

  const existingCompetencies = await prisma.competency.count({
    where: { curriculumUnitId: fractions.id },
  });
  if (existingCompetencies === 0) {
    await prisma.competency.createMany({
      data: [
        "Applies fraction concepts to real-life sharing and measurement problems",
        "Uses visual models (fraction bars, number lines) to reason about fraction size",
      ].map((description) => ({ curriculumUnitId: fractions.id, description })),
    });
  }

  return { grade5, mathematics, fractions };
}

async function seedSchool() {
  const school = await prisma.school.upsert({
    where: { id: "springdale-demo" },
    update: {},
    create: {
      id: "springdale-demo",
      name: "Springdale English Boarding School",
      address: "Kathmandu, Nepal",
    },
  });

  const academicYear = await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "2082/83 B.S." } },
    update: {},
    create: {
      schoolId: school.id,
      name: "2082/83 B.S.",
      startDate: new Date("2025-04-14"),
      endDate: new Date("2026-04-13"),
      isActive: true,
    },
  });

  const grade5School = await prisma.grade.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "Grade 5" } },
    update: {},
    create: { schoolId: school.id, name: "Grade 5", order: 5 },
  });

  const sectionA = await prisma.section.upsert({
    where: { gradeId_name: { gradeId: grade5School.id, name: "A" } },
    update: {},
    create: { gradeId: grade5School.id, name: "A" },
  });

  const mathematicsSchool = await prisma.subject.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "Mathematics" } },
    update: {},
    create: { schoolId: school.id, name: "Mathematics", code: "MATH" },
  });

  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@springdale.edu.np" },
    update: {},
    create: {
      schoolId: school.id,
      name: "School Administrator",
      email: "admin@springdale.edu.np",
      passwordHash: adminPasswordHash,
      role: "SCHOOL_ADMIN",
    },
  });

  const teacherPasswordHash = await bcrypt.hash("Teacher@123", 10);
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@springdale.edu.np" },
    update: {},
    create: {
      schoolId: school.id,
      name: "Sita Sharma",
      email: "teacher@springdale.edu.np",
      passwordHash: teacherPasswordHash,
      role: "TEACHER",
    },
  });

  await prisma.section.update({
    where: { id: sectionA.id },
    data: { classTeacherId: teacher.id },
  });

  await prisma.teacherAssignment.upsert({
    where: {
      teacherId_subjectId_gradeId_sectionId_academicYearId: {
        teacherId: teacher.id,
        subjectId: mathematicsSchool.id,
        gradeId: grade5School.id,
        sectionId: sectionA.id,
        academicYearId: academicYear.id,
      },
    },
    update: {},
    create: {
      teacherId: teacher.id,
      subjectId: mathematicsSchool.id,
      gradeId: grade5School.id,
      sectionId: sectionA.id,
      academicYearId: academicYear.id,
    },
  });

  return { school, academicYear, grade5School, sectionA, mathematicsSchool, admin, teacher };
}

async function main() {
  await seedCurriculum();
  await seedSchool();
  console.log("Seed complete.");
  console.log("  Admin login:   admin@springdale.edu.np / Admin@123");
  console.log("  Teacher login: teacher@springdale.edu.np / Teacher@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
