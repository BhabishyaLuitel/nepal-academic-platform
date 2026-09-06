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

const ROSTERS: Record<number, string[]> = {
  1: [
    "Akash Tamang", "Alisha Lama", "Arik Khadka", "Arika Khadka", "Reman Kasichhwa",
    "Rupesh Magar", "Saanvi KC", "Saling Lama", "Satvik Rajbhandari", "Sohil Limbu",
    "Sonam Lama", "Unika Gwachha", "Shrigersh Thapaliya",
  ],
  2: [
    "Chhulang Lama", "Choying Tamang", "Dhawa Tamang", "Dipti Thapa Magar", "Ezikel BK",
    "Grisha Manandhar", "Isha Tamang", "Kiara Nagarkoti", "Kiran Basnet", "Kiran Rai",
    "Kushal Sapkota", "Liwan Ale Magar", "Niran Ale Magar", "Pakriti KC", "Revan Khatri",
    "Sajita Magar", "Sangyog Tamang", "Shreejal Tamang", "Shreeyasa Khatri", "Shreya Bhatta",
  ],
  3: [
    "Aashreeya Ranamagar", "Bihan Thapa", "Chhayang Tamang", "Dibyan Shah", "Keman Shrestha",
    "Krimon Tamang", "Mikha Tamang", "Raunak Timalsina", "Rejsy Thapa", "Sachina Manandhar",
    "Sami Tamang", "Sandhya Gupta", "Soin Tamang", "Sonam Tamang",
  ],
  4: [
    "Aisha Tamang", "Bishwajeet Tamang", "Dipson Karmacharya", "Elijah B.K", "Kritika Magar",
    "Manish Yonjan", "Nirjala Tamang", "Pranish Rai", "Pratap Khadka", "Reejan Tamang",
    "Sabikchhya Thapa Magar", "Samrikshya Karki", "Sophiya Lama",
  ],
  5: [
    "Aarush Tamang", "Aashish Magar", "Anik Khadka", "Basanta Moktan", "Bhishan Pakhrin",
    "Daniyal Tamang", "Drowel Shilpakar", "Fursang Tamang", "Isha Tamang", "Karan Basnet",
    "Mercy Chaulagain", "Rija Bhele", "Riya Kasichhwa", "Riyan Prajapati", "Roshani Lama",
    "Shishir Ale Magar", "Shreeshan Shrestha", "Yunik K.C",
  ],
};

async function seedStudents(schoolId: string, sectionByGradeOrder: Record<number, string>) {
  for (const [gradeOrder, names] of Object.entries(ROSTERS)) {
    const sectionId = sectionByGradeOrder[Number(gradeOrder)];
    const existing = await prisma.student.count({ where: { sectionId } });
    if (existing > 0) continue;

    await prisma.student.createMany({
      data: names.map((name, index) => ({
        schoolId,
        sectionId,
        name,
        rollNumber: String(index + 1),
      })),
    });
  }
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

  const otherGrades = await Promise.all(
    [1, 2, 3, 4].map((order) =>
      prisma.grade.upsert({
        where: { schoolId_name: { schoolId: school.id, name: `Grade ${order}` } },
        update: {},
        create: { schoolId: school.id, name: `Grade ${order}`, order },
      }),
    ),
  );
  const otherSections = await Promise.all(
    otherGrades.map((grade) =>
      prisma.section.upsert({
        where: { gradeId_name: { gradeId: grade.id, name: "A" } },
        update: {},
        create: { gradeId: grade.id, name: "A" },
      }),
    ),
  );
  const sectionByGradeOrder: Record<number, string> = { 5: sectionA.id };
  otherGrades.forEach((grade, i) => {
    sectionByGradeOrder[grade.order] = otherSections[i].id;
  });

  await seedStudents(school.id, sectionByGradeOrder);

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
