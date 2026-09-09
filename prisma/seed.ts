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

const SKILL_AREAS = [
  "Understanding",
  "Listening & Following Instructions",
  "Practical Skill",
  "Vocabulary",
  "Safety & Responsible Use",
];

const COMPUTER_UNITS: Record<number, { title: string; rows: string[][] }[]> = {
  3: [
    {
      title: "Getting to Know the Computer",
      rows: [
        ["To identify what a computer is and its uses"],
        ["To turn the computer on/off following the teacher's spoken instruction"],
        ["To hold and use the mouse and keyboard normally"],
        ["To recognize and use words like monitor, CPU, mouse, keyboard"],
        ["To follow basic precautions while using the computer"],
      ],
    },
    {
      title: "Parts of the Computer",
      rows: [
        ["To identify the main parts of a computer and their functions"],
        ["To point out the parts named by the teacher after listening"],
        ["To touch and show the parts on a real computer"],
        ["To use words like hardware, software, screen"],
        ["To use the parts carefully without damaging them"],
      ],
    },
    {
      title: "Keyboard and Typing",
      rows: [
        ["To understand the layout of letters, numbers, and symbols on the keyboard"],
        ["To type a word after listening to it being spoken"],
        ["To type one's own name and simple words"],
        ["To recognize words like spacebar, enter, shift, backspace"],
        ["To use the keyboard gently with clean hands"],
      ],
    },
    {
      title: "Paint — Colours and Drawing",
      rows: [
        ["To open the Paint program and recognize its tools"],
        ["To choose shapes and colours as instructed"],
        ["To draw a simple picture and fill it with colour using the mouse"],
        ["To use words like brush, eraser, fill, canvas"],
        ["To safely save the picture one has made"],
      ],
    },
    {
      title: "Caring for the Computer",
      rows: [
        ["To understand why the computer needs to be cared for"],
        ["To listen to and follow computer lab rules"],
        ["To keep the computer and its surroundings clean"],
        ["To use words like lab, rules, maintenance"],
        ["To use the computer carefully, keeping water and food away"],
      ],
    },
  ],
  4: [
    {
      title: "Types of Computers",
      rows: [
        ["To identify types of computers such as desktop and laptop"],
        ["To identify the correct type of computer after listening to a description"],
        ["To sort different devices into groups"],
        ["To use words like laptop, tablet, smartphone"],
        ["To handle devices carefully, not as toys"],
      ],
    },
    {
      title: "Windows, Files & Folders",
      rows: [
        ["To understand the meaning of desktop, icon, file, and folder"],
        ["To create a new folder as instructed"],
        ["To open, close, and move a file from one place to another"],
        ["To use words like folder, file, icon, desktop"],
        ["To not delete others' files without permission"],
      ],
    },
    {
      title: "MS Paint Tools in Detail",
      rows: [
        ["To understand the use of various Paint tools"],
        ["To add shapes, lines, and text as instructed"],
        ["To create a creative picture using the tools appropriately"],
        ["To use words like select, copy, paste, undo"],
        ["To save the file with a proper name once work is complete"],
      ],
    },
    {
      title: "Introduction to MS Word",
      rows: [
        ["To understand what the Word program is used for"],
        ["To type a sentence after listening to it"],
        ["To format text by making it bigger, bold, or coloured"],
        ["To use words like font, bold, italic"],
        ["To develop the habit of saving typed work regularly"],
      ],
    },
    {
      title: "What is the Internet?",
      rows: [
        ["To understand what the Internet is and what it does"],
        ["To open a specified website with the teacher's help"],
        ["To open a browser and perform a simple search"],
        ["To use words like website, browser, Internet"],
        ["To use the Internet only in the presence of a teacher or guardian"],
      ],
    },
  ],
  5: [
    {
      title: "Computer & Internet in Daily Life",
      rows: [
        ["To identify where computers and the Internet are used in daily life"],
        ["To distinguish correct/incorrect use after hearing examples"],
        ["To connect learned tools and programs with everyday examples"],
        ["To use words like online, offline, digital"],
        ["To use the computer/Internet only within a set time schedule"],
      ],
    },
    {
      title: "Working in MS Word",
      rows: [
        ["To understand how to arrange paragraphs and pages"],
        ["To add a title and subtitle as instructed"],
        ["To type and format a short paragraph and save it"],
        ["To use words like page setup, alignment, save as"],
        ["To safely store one's work under a correct name and location"],
      ],
    },
    {
      title: "Introduction to MS PowerPoint",
      rows: [
        ["To understand what a presentation is"],
        ["To add a new slide as instructed"],
        ["To create a simple slide with text and a picture"],
        ["To use words like slide, template, transition"],
        ["To develop the habit of giving credit when using a classmate's work"],
      ],
    },
    {
      title: "Email and Communication",
      rows: [
        ["To understand what email is and why it is used"],
        ["To read a sample email with the teacher's help"],
        ["To practice writing a simple email with the teacher's help"],
        ["To use words like inbox, send, attachment"],
        ["To understand not to open emails from unknown addresses"],
      ],
    },
    {
      title: "Digital Safety & Ethics",
      rows: [
        ["To understand why personal information should be kept safe"],
        ["To distinguish safe/unsafe behaviour after hearing examples"],
        ["To immediately inform a teacher or guardian if a problem occurs"],
        ["To use words like password, privacy, cyber"],
        ["To become a responsible digital citizen by behaving well towards others"],
      ],
    },
  ],
};

async function seedComputerCas(
  schoolId: string,
  academicYearId: string,
  teacherId: string,
  gradeByOrder: Record<number, { id: string; name: string }>,
  sectionByGradeOrder: Record<number, string>,
) {
  const computerSchoolSubject = await prisma.subject.upsert({
    where: { schoolId_name: { schoolId, name: "Computer" } },
    update: {},
    create: { schoolId, name: "Computer", code: "COMP" },
  });

  for (const gradeOrder of [3, 4, 5]) {
    const curriculumGrade = await prisma.curriculumGrade.upsert({
      where: { name: `Grade ${gradeOrder}` },
      update: {},
      create: { name: `Grade ${gradeOrder}` },
    });

    const curriculumSubject = await prisma.curriculumSubject.upsert({
      where: { curriculumGradeId_name: { curriculumGradeId: curriculumGrade.id, name: "Computer" } },
      update: {},
      create: { curriculumGradeId: curriculumGrade.id, name: "Computer" },
    });

    const skillAreas = await Promise.all(
      SKILL_AREAS.map((name, index) =>
        prisma.skillArea.upsert({
          where: { curriculumSubjectId_order: { curriculumSubjectId: curriculumSubject.id, order: index + 1 } },
          update: { name },
          create: { curriculumSubjectId: curriculumSubject.id, name, order: index + 1 },
        }),
      ),
    );

    const units = COMPUTER_UNITS[gradeOrder];
    for (const [unitIndex, unit] of units.entries()) {
      const curriculumUnit = await prisma.curriculumUnit.upsert({
        where: { curriculumSubjectId_order: { curriculumSubjectId: curriculumSubject.id, order: unitIndex + 1 } },
        update: { title: unit.title },
        create: { curriculumSubjectId: curriculumSubject.id, title: unit.title, order: unitIndex + 1 },
      });

      for (const [skillIndex, skillArea] of skillAreas.entries()) {
        await prisma.learningAchievement.upsert({
          where: { curriculumUnitId_skillAreaId: { curriculumUnitId: curriculumUnit.id, skillAreaId: skillArea.id } },
          update: { description: unit.rows[skillIndex][0] },
          create: {
            curriculumUnitId: curriculumUnit.id,
            skillAreaId: skillArea.id,
            description: unit.rows[skillIndex][0],
          },
        });
      }
    }

    const grade = gradeByOrder[gradeOrder];
    const sectionId = sectionByGradeOrder[gradeOrder];
    await prisma.teacherAssignment.upsert({
      where: {
        teacherId_subjectId_gradeId_sectionId_academicYearId: {
          teacherId,
          subjectId: computerSchoolSubject.id,
          gradeId: grade.id,
          sectionId,
          academicYearId,
        },
      },
      update: {},
      create: {
        teacherId,
        subjectId: computerSchoolSubject.id,
        gradeId: grade.id,
        sectionId,
        academicYearId,
      },
    });
  }
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
  const gradeByOrder: Record<number, { id: string; name: string }> = { 5: grade5School };
  otherGrades.forEach((grade, i) => {
    sectionByGradeOrder[grade.order] = otherSections[i].id;
    gradeByOrder[grade.order] = grade;
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

  return {
    school,
    academicYear,
    grade5School,
    sectionA,
    mathematicsSchool,
    admin,
    teacher,
    gradeByOrder,
    sectionByGradeOrder,
  };
}

async function main() {
  await seedCurriculum();
  const { school, academicYear, teacher, gradeByOrder, sectionByGradeOrder } = await seedSchool();
  await seedComputerCas(school.id, academicYear.id, teacher.id, gradeByOrder, sectionByGradeOrder);
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
