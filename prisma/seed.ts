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

// ---------------------------------------------------------------------------
// Generic CAS seeding for every other subject. Grade 3 in Nepal's current
// curriculum uses one integrated subject (Hamro Serofero) instead of separate
// Science/Social Studies/Health subjects, so each subject below only lists
// the grades it actually applies to. Subject list and general topic areas are
// sourced from Nepal's CDC/CEHRD curriculum; specific units and the exact
// learning-achievement sentences are a first draft for the school to review,
// same as the Computer subject content. Two Grade 5 Nepali units (Poetry,
// Story) reproduce the real example from the school's own CAS booklet.
// ---------------------------------------------------------------------------

type SubjectUnitDef = { title: string; achievements: string[] };

async function seedSubjectCas(
  schoolId: string,
  academicYearId: string,
  teacherId: string,
  subjectName: string,
  subjectCode: string,
  skillAreaNames: string[],
  gradeUnits: Record<number, SubjectUnitDef[]>,
  gradeByOrder: Record<number, { id: string; name: string }>,
  sectionByGradeOrder: Record<number, string>,
  orderOffset = 0,
) {
  const schoolSubject = await prisma.subject.upsert({
    where: { schoolId_name: { schoolId, name: subjectName } },
    update: {},
    create: { schoolId, name: subjectName, code: subjectCode },
  });

  for (const gradeOrder of Object.keys(gradeUnits).map(Number)) {
    const curriculumGrade = await prisma.curriculumGrade.upsert({
      where: { name: `Grade ${gradeOrder}` },
      update: {},
      create: { name: `Grade ${gradeOrder}` },
    });

    const curriculumSubject = await prisma.curriculumSubject.upsert({
      where: { curriculumGradeId_name: { curriculumGradeId: curriculumGrade.id, name: subjectName } },
      update: {},
      create: { curriculumGradeId: curriculumGrade.id, name: subjectName },
    });

    const skillAreas = await Promise.all(
      skillAreaNames.map((name, index) =>
        prisma.skillArea.upsert({
          where: { curriculumSubjectId_order: { curriculumSubjectId: curriculumSubject.id, order: index + 1 } },
          update: { name },
          create: { curriculumSubjectId: curriculumSubject.id, name, order: index + 1 },
        }),
      ),
    );

    const units = gradeUnits[gradeOrder];
    for (const [unitIndex, unit] of units.entries()) {
      const order = orderOffset + unitIndex + 1;
      const curriculumUnit = await prisma.curriculumUnit.upsert({
        where: { curriculumSubjectId_order: { curriculumSubjectId: curriculumSubject.id, order } },
        update: { title: unit.title },
        create: { curriculumSubjectId: curriculumSubject.id, title: unit.title, order },
      });

      for (const [skillIndex, skillArea] of skillAreas.entries()) {
        await prisma.learningAchievement.upsert({
          where: { curriculumUnitId_skillAreaId: { curriculumUnitId: curriculumUnit.id, skillAreaId: skillArea.id } },
          update: { description: unit.achievements[skillIndex] },
          create: {
            curriculumUnitId: curriculumUnit.id,
            skillAreaId: skillArea.id,
            description: unit.achievements[skillIndex],
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
          subjectId: schoolSubject.id,
          gradeId: grade.id,
          sectionId,
          academicYearId,
        },
      },
      update: {},
      create: { teacherId, subjectId: schoolSubject.id, gradeId: grade.id, sectionId, academicYearId },
    });
  }
}

const LANGUAGE_SKILLS = ["Listening", "Speaking", "Reading", "Writing", "Vocabulary", "Language Structure"];
const MATH_SKILLS = [
  "Conceptual Understanding",
  "Computation Skill",
  "Problem Solving",
  "Mathematical Communication",
  "Real-life Application",
];
const SCIENCE_SKILLS = [
  "Understanding",
  "Observation & Inquiry",
  "Practical Skill",
  "Scientific Vocabulary",
  "Application & Safety",
];
const SOCIAL_SKILLS = [
  "Understanding",
  "Inquiry & Research",
  "Social & Civic Skill",
  "Vocabulary",
  "Values & Responsible Citizenship",
];
const HPE_SKILLS = [
  "Understanding",
  "Physical & Motor Skill",
  "Creative Expression",
  "Vocabulary",
  "Health & Safety Habits",
];
const SEROFERO_SKILLS = [
  "Understanding",
  "Observation & Exploration",
  "Practical & Creative Skill",
  "Vocabulary",
  "Values & Responsible Behaviour",
];

const NEPALI_UNITS: Record<number, SubjectUnitDef[]> = {
  3: [
    { title: "My Family and School", achievements: [
      "To respond to questions after listening to a story about family and school",
      "To describe one's family members and school in simple sentences",
      "To read a short passage about family and school and understand its meaning",
      "To write 3-4 sentences about one's own family",
      "To recognize and use words related to family and school",
      "To identify and use singular and plural nouns",
    ]},
    { title: "Our Festivals", achievements: [
      "To listen to a description of a festival and answer questions",
      "To talk about how one's family celebrates a festival",
      "To read a short text about Dashain or Tihar and understand it",
      "To write a few lines describing a favourite festival",
      "To recognize and use festival-related words",
      "To identify and use action words (verbs) in simple sentences",
    ]},
    { title: "Nature and Animals", achievements: [
      "To listen to a description of an animal and identify it",
      "To describe an animal's appearance and habits",
      "To read a short passage about nature and animals and answer questions",
      "To write simple sentences describing a favourite animal",
      "To recognize and use words related to nature and animals",
      "To identify and use adjectives describing size and colour",
    ]},
  ],
  4: [
    { title: "My Community and Country", achievements: [
      "To listen to a description of a community event and summarize it",
      "To talk about one's neighbourhood and community",
      "To read a passage about Nepal and answer comprehension questions",
      "To write a short paragraph about one's community",
      "To recognize and use words related to community and country",
      "To identify and use pronouns correctly",
    ]},
    { title: "Festivals and Culture", achievements: [
      "To listen to a story about a cultural tradition and retell its main idea",
      "To describe a cultural tradition or custom",
      "To read a passage about Nepali culture and identify key details",
      "To write a short description of a cultural practice",
      "To recognize and use words related to culture and tradition",
      "To identify and use adjectives in descriptive sentences",
    ]},
    { title: "Health and Good Habits", achievements: [
      "To listen to advice about healthy habits and list the main points",
      "To explain a good health habit in one's own words",
      "To read a passage about hygiene and answer questions",
      "To write a short paragraph about a healthy daily routine",
      "To recognize and use words related to health and hygiene",
      "To identify and use simple present tense correctly",
    ]},
  ],
  5: [
    { title: "Poetry (Lyric / Patriotism)", achievements: [
      "To respond based on listening to the lesson",
      "To give a short talk or presentation based on the lesson's content",
      "To read the lesson and comprehend it",
      "To do transcription (copy-writing) based on the lesson",
      "To identify and use rhyming words",
      "To identify and use nouns and pronouns",
    ]},
    { title: "Story (Social)", achievements: [
      "To discuss based on listening to the lesson",
      "To express views about punctuality based on the context",
      "To read the lesson and identify its structure and topic",
      "To write a parallel story based on the lesson",
      "To identify and use onomatopoeic (sound-imitating) words",
      "To identify and use adjective words",
    ]},
    { title: "Essay and Letter Writing", achievements: [
      "To listen to a model essay/letter and identify its structure",
      "To speak about a chosen topic in a short structured talk",
      "To read a sample essay or letter and understand its purpose",
      "To write a short essay or a simple letter",
      "To recognize and use words related to formal writing",
      "To identify and use conjunctions to join sentences",
    ]},
  ],
};

const ENGLISH_UNITS: Record<number, SubjectUnitDef[]> = {
  3: [
    { title: "All About Me and My Family", achievements: [
      "To listen to a short talk about family and answer simple questions",
      "To introduce oneself and one's family members",
      "To read a short passage about a family and understand it",
      "To write 3-4 simple sentences about one's own family",
      "To recognize and use family-related words",
      "To use is/am/are correctly in simple sentences",
    ]},
    { title: "Animals and Nature", achievements: [
      "To listen to a description of an animal and identify it",
      "To describe an animal using simple sentences",
      "To read a short passage about nature and answer questions",
      "To write simple sentences describing a favourite animal",
      "To recognize and use words related to animals and nature",
      "To use plural nouns correctly",
    ]},
    { title: "Simple Stories and Rhymes", achievements: [
      "To listen to a short story or rhyme and answer questions",
      "To retell a short story in one's own words",
      "To read a simple story and understand the sequence of events",
      "To write a short rhyme or sentence continuing a story",
      "To recognize and use story-related words",
      "To use simple present tense verbs correctly",
    ]},
  ],
  4: [
    { title: "My School and Community", achievements: [
      "To listen to a talk about school life and answer questions",
      "To talk about one's school and daily routine",
      "To read a passage about a community and identify key details",
      "To write a short paragraph about one's school",
      "To recognize and use school- and community-related words",
      "To use simple past tense verbs correctly",
    ]},
    { title: "Festivals and Food", achievements: [
      "To listen to a description of a festival meal and list the items",
      "To describe a favourite festival and food",
      "To read a passage about festivals and answer questions",
      "To write a short paragraph describing a festival",
      "To recognize and use words related to festivals and food",
      "To use adjectives to describe food and festivals",
    ]},
    { title: "Adventure Stories", achievements: [
      "To listen to an adventure story and sequence the events",
      "To narrate a simple adventure in one's own words",
      "To read an adventure story and answer comprehension questions",
      "To write a short paragraph continuing a story",
      "To recognize and use adventure-related words",
      "To use conjunctions (and, but, because) correctly",
    ]},
  ],
  5: [
    { title: "People and Places", achievements: [
      "To listen to a description of a place and identify its features",
      "To describe a place or a famous person",
      "To read a passage about a place and answer questions",
      "To write a short paragraph describing a place",
      "To recognize and use words related to places and directions",
      "To use prepositions of place correctly",
    ]},
    { title: "Science and Nature Stories", achievements: [
      "To listen to a short science story and identify the main idea",
      "To explain a simple science fact in one's own words",
      "To read a short science-themed story and answer questions",
      "To write a short paragraph about a nature topic",
      "To recognize and use simple science-related words",
      "To use comparative adjectives correctly",
    ]},
    { title: "Letters and Diary Writing", achievements: [
      "To listen to a sample letter/diary entry and identify its parts",
      "To talk about daily events as if narrating a diary entry",
      "To read a sample letter and understand its format",
      "To write a short informal letter or diary entry",
      "To recognize and use words related to daily life and feelings",
      "To use past tense verbs correctly in a diary entry",
    ]},
  ],
};

const MATH_UNITS: Record<number, SubjectUnitDef[]> = {
  3: [
    { title: "Whole Numbers", achievements: [
      "To understand place value of numbers up to 4 digits",
      "To read, write, and compare 4-digit numbers",
      "To solve simple problems involving ordering numbers",
      "To explain the value of a digit in a number",
      "To use numbers to count and record everyday quantities",
    ]},
    { title: "Addition and Subtraction", achievements: [
      "To understand addition and subtraction with regrouping",
      "To add and subtract numbers up to 4 digits accurately",
      "To solve simple word problems involving addition and subtraction",
      "To explain the steps used to solve a problem",
      "To apply addition and subtraction in daily shopping/counting situations",
    ]},
    { title: "Shapes and Measurement", achievements: [
      "To identify basic 2D shapes and their properties",
      "To measure length and weight using standard units",
      "To solve simple problems involving measurement",
      "To describe a shape using its properties",
      "To use measurement skills in everyday situations",
    ]},
  ],
  4: [
    { title: "Multiplication and Division", achievements: [
      "To understand multiplication as repeated addition and division as equal sharing",
      "To multiply and divide numbers accurately",
      "To solve word problems involving multiplication and division",
      "To explain the method used to solve a problem",
      "To apply multiplication and division in daily life situations",
    ]},
    { title: "Introduction to Fractions and Decimals", achievements: [
      "To understand a fraction as a part of a whole",
      "To identify and write simple fractions and decimals",
      "To solve simple problems comparing fractions",
      "To explain what a fraction represents using a diagram",
      "To use fractions to describe parts of everyday objects",
    ]},
    { title: "Geometry and Measurement", achievements: [
      "To understand perimeter and area of simple shapes",
      "To calculate the perimeter of squares and rectangles",
      "To solve simple problems involving perimeter",
      "To explain how perimeter is calculated",
      "To apply measurement skills to real objects and spaces",
    ]},
  ],
  5: [
    { title: "Decimals", achievements: [
      "To understand decimal place value",
      "To add and subtract decimal numbers accurately",
      "To solve word problems involving decimals",
      "To explain the relationship between fractions and decimals",
      "To use decimals in situations involving money and measurement",
    ]},
    { title: "Geometry: Angles and Shapes", achievements: [
      "To understand and classify angles and shapes",
      "To measure angles using a protractor",
      "To solve simple problems involving angles and shapes",
      "To describe a shape using its angles and sides",
      "To identify angles and shapes in everyday objects",
    ]},
    { title: "Data Handling and Measurement", achievements: [
      "To understand how to organize data in tables and simple graphs",
      "To read and interpret a bar graph",
      "To solve problems using data from a graph or table",
      "To explain what a graph shows",
      "To collect and represent simple real-life data",
    ]},
  ],
};

const SCIENCE_UNITS: Record<number, SubjectUnitDef[]> = {
  4: [
    { title: "Scientific Learning and Measurement", achievements: [
      "To understand what science is and why measurement is important",
      "To make simple observations and record them",
      "To measure length, weight and time using simple tools",
      "To recognize and use words like observe, measure, predict",
      "To follow basic safety rules while doing simple experiments",
    ]},
    { title: "Living Things and Their Needs", achievements: [
      "To understand the basic needs of living things",
      "To observe and compare plants and animals",
      "To classify living things into simple groups",
      "To recognize and use words like organism, habitat, nutrition",
      "To care responsibly for plants and animals",
    ]},
    { title: "Matter and Materials", achievements: [
      "To understand that matter exists as solid, liquid, and gas",
      "To observe changes in materials when heated or cooled",
      "To sort materials by their properties",
      "To recognize and use words like solid, liquid, gas, material",
      "To handle materials safely during simple activities",
    ]},
  ],
  5: [
    { title: "Scientific Learning and Information Technology", achievements: [
      "To understand scientific learning skills and sources of information",
      "To use measurement tools to make accurate observations",
      "To use simple software (e.g. Paint, word processor) as a learning tool",
      "To recognize and use words like data, source, technology",
      "To use information sources and technology responsibly",
    ]},
    { title: "Classification of Living Beings", achievements: [
      "To understand how living beings are classified (e.g. vertebrates, plants)",
      "To observe and compare features of different living beings",
      "To identify the parts of a flowering plant and their function",
      "To recognize and use words like vertebrate, classification, function",
      "To handle plants and animals carefully during observation",
    ]},
    { title: "Matter and Energy", achievements: [
      "To understand states of matter and forms of energy such as light, sound, and electricity",
      "To observe the effect of heat on matter",
      "To conduct a simple safe experiment involving light, sound, or electricity",
      "To recognize and use words like energy, electricity, mixture",
      "To follow safety precautions when working with heat or electricity",
    ]},
  ],
};

const SOCIAL_UNITS: Record<number, SubjectUnitDef[]> = {
  4: [
    { title: "My Family and Neighbourhood", achievements: [
      "To understand the roles of family members and neighbours",
      "To gather simple information about one's neighbourhood",
      "To interact respectfully with neighbours",
      "To recognize and use words related to family and community",
      "To show respect and cooperation towards neighbours",
    ]},
    { title: "Our Local Government", achievements: [
      "To understand the basic role of the local government (ward/municipality)",
      "To find simple information about local government services",
      "To describe how to seek help from a local government office",
      "To recognize and use words related to local government",
      "To understand one's duties as a community member",
    ]},
    { title: "Good Habits and Citizenship", achievements: [
      "To understand what makes a good citizen",
      "To identify examples of good citizenship in daily life",
      "To practice good habits such as honesty and cooperation",
      "To recognize and use words related to citizenship and values",
      "To behave responsibly in school and community settings",
    ]},
  ],
  5: [
    { title: "Me, My Family and Neighbours", achievements: [
      "To understand the occupations and roles of neighbours",
      "To find out about how one's family deals with neighbours",
      "To help the community and treat others equally",
      "To recognize and use words related to neighbours and community",
      "To show understanding and respect towards others",
    ]},
    { title: "Our Traditions, Social Norms and Values", achievements: [
      "To understand local traditions, languages, and costumes",
      "To find out about festivals and notable people of one's district",
      "To describe one's traditions and customs to others",
      "To recognize and use words related to tradition and culture",
      "To take pride in one's country and traditions",
    ]},
    { title: "Social Problems and Their Solutions", achievements: [
      "To understand common social problems such as theft and blind imitation",
      "To identify local social organizations and their roles",
      "To practice cooperation and protection within the community",
      "To recognize and use words related to social problems and solutions",
      "To avoid bad habits and support community solutions",
    ]},
  ],
};

const HPE_UNITS: Record<number, SubjectUnitDef[]> = {
  4: [
    { title: "Personal Health and Hygiene", achievements: [
      "To understand the importance of personal hygiene",
      "To demonstrate correct handwashing and grooming steps",
      "To draw or role-play a healthy daily routine",
      "To recognize and use words related to hygiene and health",
      "To practice daily hygiene habits consistently",
    ]},
    { title: "Physical Fitness and Games", achievements: [
      "To understand the benefits of physical exercise",
      "To perform basic locomotor movements (running, jumping, skipping)",
      "To create a simple movement sequence or game",
      "To recognize and use words related to physical activity and games",
      "To follow safety rules during games and physical activity",
    ]},
    { title: "Creative Arts and Craft", achievements: [
      "To understand basic elements of drawing, colour, and craft",
      "To use simple tools (crayons, scissors, paper) with control",
      "To create a simple drawing or craft piece",
      "To recognize and use words related to art and craft",
      "To use art and craft tools safely",
    ]},
  ],
  5: [
    { title: "Health and Safety", achievements: [
      "To understand a balanced diet and common diseases",
      "To demonstrate simple first-aid steps",
      "To create a poster promoting a health message",
      "To recognize and use words related to diet, disease, and first aid",
      "To practice safety habits and avoid harmful substances",
    ]},
    { title: "Sports and Physical Training", achievements: [
      "To understand rules of simple local and minor games",
      "To perform physical training exercises and drills",
      "To lead or design a simple creative game for peers",
      "To recognize and use words related to sports and physical training",
      "To warm up properly and avoid injury during sports",
    ]},
    { title: "Music, Art and Craft", achievements: [
      "To understand basic elements of music, art, and craft",
      "To perform a simple song, dance step, or craft technique",
      "To create an original piece of art, music, or craft",
      "To recognize and use words related to music and art",
      "To use art and music tools/instruments responsibly",
    ]},
  ],
};

const SEROFERO_UNITS: Record<number, SubjectUnitDef[]> = {
  3: [
    { title: "My Family and Community", achievements: [
      "To understand the roles of family members and community helpers",
      "To observe and describe daily life in one's community",
      "To role-play or draw a scene from family/community life",
      "To recognize and use words related to family and community",
      "To show respect and cooperation towards family and community members",
    ]},
    { title: "Our Environment and Nature", achievements: [
      "To understand the basic features of the local environment",
      "To observe plants, animals, and weather around the school",
      "To draw or model something observed in nature",
      "To recognize and use words related to environment and nature",
      "To care for plants, animals, and the environment",
    ]},
    { title: "Health, Safety and Creativity", achievements: [
      "To understand basic health and safety practices",
      "To explore simple safe and unsafe situations at home and school",
      "To create a simple piece of art or craft on a health/safety theme",
      "To recognize and use words related to health and safety",
      "To practice safe and healthy behaviour daily",
    ]},
  ],
};

async function seedAllSubjectsCas(
  schoolId: string,
  academicYearId: string,
  teacherId: string,
  gradeByOrder: Record<number, { id: string; name: string }>,
  sectionByGradeOrder: Record<number, string>,
) {
  await seedSubjectCas(
    schoolId, academicYearId, teacherId,
    "Nepali", "NEP", LANGUAGE_SKILLS, NEPALI_UNITS,
    gradeByOrder, sectionByGradeOrder,
  );
  await seedSubjectCas(
    schoolId, academicYearId, teacherId,
    "English", "ENG", LANGUAGE_SKILLS, ENGLISH_UNITS,
    gradeByOrder, sectionByGradeOrder,
  );
  await seedSubjectCas(
    schoolId, academicYearId, teacherId,
    // Grade 5 Mathematics already has a "Fractions" unit (order 3) seeded for
    // lesson planning; offset these CAS units so they don't collide with it.
    "Mathematics", "MATH", MATH_SKILLS, MATH_UNITS,
    gradeByOrder, sectionByGradeOrder, 10,
  );
  await seedSubjectCas(
    schoolId, academicYearId, teacherId,
    "Science and Technology", "SCI", SCIENCE_SKILLS, SCIENCE_UNITS,
    gradeByOrder, sectionByGradeOrder,
  );
  await seedSubjectCas(
    schoolId, academicYearId, teacherId,
    "Social Studies", "SOC", SOCIAL_SKILLS, SOCIAL_UNITS,
    gradeByOrder, sectionByGradeOrder,
  );
  await seedSubjectCas(
    schoolId, academicYearId, teacherId,
    "Health, Physical and Creative Arts", "HPE", HPE_SKILLS, HPE_UNITS,
    gradeByOrder, sectionByGradeOrder,
  );
  await seedSubjectCas(
    schoolId, academicYearId, teacherId,
    "Hamro Serofero", "SERO", SEROFERO_SKILLS, SEROFERO_UNITS,
    gradeByOrder, sectionByGradeOrder,
  );
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
  await seedAllSubjectsCas(school.id, academicYear.id, teacher.id, gradeByOrder, sectionByGradeOrder);
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
