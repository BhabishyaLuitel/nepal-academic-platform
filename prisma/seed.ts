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
// Computer-subject rubrics (Classroom & Lab Participation, Oral Task, Written
// Task, Project & Practical Work) — adapted from the school's physical
// rubrics booklet to a computer-lab context. First draft for the school to
// review, same as the CAS unit content above.
// ---------------------------------------------------------------------------

type RubricDef = {
  title: string;
  description: string;
  criteria: { name: string; level4: string; level3: string; level2: string; level1: string }[];
};

const COMPUTER_RUBRICS: RubricDef[] = [
  {
    title: "Classroom & Lab Participation Rubric",
    description: "How the student takes part in computer lessons and lab sessions.",
    criteria: [
      {
        name: "Discussion & Q&A",
        level4: "Actively joins discussions and asks thoughtful questions every lesson.",
        level3: "Joins discussions and asks questions most lessons.",
        level2: "Joins discussions only when prompted by the teacher.",
        level1: "Rarely joins discussions or asks questions.",
      },
      {
        name: "Lab readiness",
        level4: "Always arrives with materials ready and starts tasks promptly.",
        level3: "Usually arrives ready and starts with little delay.",
        level2: "Needs reminders to get ready for lab work.",
        level1: "Frequently unprepared for lab sessions.",
      },
      {
        name: "Listening & turn-taking",
        level4: "Listens attentively and always waits for their turn to speak.",
        level3: "Listens well and mostly waits for their turn.",
        level2: "Sometimes interrupts or loses focus.",
        level1: "Rarely listens or waits for their turn.",
      },
      {
        name: "Pair & group work",
        level4: "Works cooperatively and helps peers complete tasks.",
        level3: "Works cooperatively with peers most of the time.",
        level2: "Works with peers only with teacher support.",
        level1: "Struggles to work cooperatively with peers.",
      },
    ],
  },
  {
    title: "Oral Task Rubric",
    description: "How the student explains computer concepts and tasks aloud.",
    criteria: [
      {
        name: "Subject knowledge",
        level4: "Explains concepts accurately and in detail.",
        level3: "Explains concepts accurately with minor gaps.",
        level2: "Shows partial understanding of concepts.",
        level1: "Shows little understanding of concepts.",
      },
      {
        name: "Explaining steps",
        level4: "Describes steps clearly and in the correct order.",
        level3: "Describes steps clearly with minor ordering errors.",
        level2: "Describes steps with some confusion.",
        level1: "Cannot describe the steps involved.",
      },
      {
        name: "Confidence & body language",
        level4: "Speaks confidently with clear voice and posture.",
        level3: "Speaks fairly confidently most of the time.",
        level2: "Speaks hesitantly, needs encouragement.",
        level1: "Very hesitant or unwilling to speak.",
      },
      {
        name: "Listening & responding",
        level4: "Responds accurately to questions asked.",
        level3: "Responds appropriately to most questions.",
        level2: "Responds with some prompting.",
        level1: "Struggles to respond to questions.",
      },
    ],
  },
  {
    title: "Written Task Rubric",
    description: "How the student completes written computer-subject work.",
    criteria: [
      {
        name: "Content accuracy",
        level4: "All information given is accurate and complete.",
        level3: "Most information given is accurate.",
        level2: "Some information given is accurate.",
        level1: "Little of the information given is accurate.",
      },
      {
        name: "Terminology use",
        level4: "Uses correct computer terms consistently.",
        level3: "Uses correct computer terms most of the time.",
        level2: "Uses some correct computer terms.",
        level1: "Rarely uses correct computer terms.",
      },
      {
        name: "Presentation",
        level4: "Work is neat, organized, and easy to follow.",
        level3: "Work is mostly neat and organized.",
        level2: "Work is somewhat neat and organized.",
        level1: "Work is untidy and hard to follow.",
      },
      {
        name: "Timeliness",
        level4: "Always completes and submits work on time.",
        level3: "Usually completes and submits work on time.",
        level2: "Sometimes submits work late.",
        level1: "Rarely submits work on time.",
      },
    ],
  },
  {
    title: "Project & Practical Work Rubric",
    description: "How the student plans and carries out hands-on computer projects.",
    criteria: [
      {
        name: "Planning",
        level4: "Plans the project clearly before starting work.",
        level3: "Plans the project with minor gaps.",
        level2: "Starts with only a basic plan.",
        level1: "Starts without any clear plan.",
      },
      {
        name: "Execution on computer",
        level4: "Operates the computer accurately and independently.",
        level3: "Operates the computer accurately with occasional help.",
        level2: "Operates the computer with regular help.",
        level1: "Needs constant help to operate the computer.",
      },
      {
        name: "Output quality",
        level4: "Finished output meets all task requirements.",
        level3: "Finished output meets most task requirements.",
        level2: "Finished output meets some task requirements.",
        level1: "Finished output meets few task requirements.",
      },
      {
        name: "Timeliness",
        level4: "Completes the project within the given time.",
        level3: "Completes the project with a small extension.",
        level2: "Completes the project with a large extension.",
        level1: "Does not complete the project.",
      },
    ],
  },
];

// The 4 core rubrics as they actually appear in the school's rubrics booklet
// (not customized to any one subject) - "Possible Methods and Tools for
// Student Assessment". Transcribed directly from the photographed pages, then
// translated: English for every subject except Nepali/Social Studies/Hamro
// Serofero, which get the Devanagari original verbatim. Computer keeps its
// own already-tailored (computer-lab-context) rubrics from COMPUTER_RUBRICS
// above rather than these generic ones - that was a specific earlier
// direction, not something to overwrite.
const GENERIC_RUBRICS_EN: RubricDef[] = [
  {
    title: "Classroom Participation Rubric",
    description: "How the student takes part in lessons.",
    criteria: [
      {
        name: "Discussion & Q&A",
        level4: "Always raises hand, asks meaningful questions, and adds new ideas to discussions.",
        level3: "Participates in discussion most of the time and answers questions correctly.",
        level2: "Speaks only when called on or asked; not self-motivated to participate.",
        level1: "Shows no interest in discussion and stays silent even when asked.",
      },
      {
        name: "Listening & Respect",
        level4: "Listens attentively to peers and the teacher and respects everyone's views.",
        level3: "Stays quiet while others speak and speaks only during their own turn.",
        level2: "Sometimes interrupts others or loses attention while others are speaking.",
        level1: "Does not listen to others at all and disrupts the class with noise.",
      },
      {
        name: "Preparedness & Materials",
        level4: "Always comes prepared with the required textbook, copy, and pen, and completes prior work.",
        level3: "Usually comes prepared with the required materials.",
        level2: "Sometimes forgets learning materials or comes to class unprepared.",
        level1: "Comes to class without materials and shows no interest in learning tasks.",
      },
      {
        name: "Group Work & Cooperation",
        level4: "Takes leadership in the group, helps peers, and works hard toward the group's shared goal.",
        level3: "Completes their own group responsibility honestly and is cooperative.",
        level2: "Stays in the group but passes their responsibility to others or remains passive.",
        level1: "Refuses to work in the group, is uncooperative, or disrupts the group's environment.",
      },
    ],
  },
  {
    title: "Oral Task Rubric",
    description: "How the student explains and discusses the subject aloud.",
    criteria: [
      {
        name: "Subject Knowledge",
        level4: "Shows deep understanding of the question asked and gives an accurate, complete answer.",
        level3: "Understands the main points of the topic and gives mostly correct answers.",
        level2: "Has only general knowledge of the topic and needs a lot of prompting for answers.",
        level1: "Does not understand the topic or gives incorrect answers to the questions asked.",
      },
      {
        name: "Fluency & Clarity",
        level4: "Speaks clearly without hesitation and expresses ideas fluently.",
        level3: "Speaks with a clear voice and successfully conveys ideas.",
        level2: "Hesitates while speaking, pauses often, and voice is somewhat unclear.",
        level1: "Unable to express ideas, or speaks in a very unclear and low voice.",
      },
      {
        name: "Confidence & Body Language",
        level4: "Speaks with strong eye contact, high confidence, and appropriate body language.",
        level3: "Speaks with confidence and appears comfortable in class.",
        level2: "Shows a lack of confidence and seems nervous while speaking.",
        level1: "Very nervous, sits with head down, and hesitates to respond.",
      },
      {
        name: "Listening & Responding",
        level4: "Listens attentively to questions and gives a logical, relevant answer immediately.",
        level3: "Understands the question, gives correct answers, and stays actively engaged.",
        level2: "Searches for an answer without understanding the question, or needs the question repeated.",
        level1: "Pays no attention to the question or shows no interest in answering.",
      },
    ],
  },
  {
    title: "Written Task Rubric",
    description: "How the student completes written work.",
    criteria: [
      {
        name: "Content",
        level4: "Fully understands the intent of the question; writes an original, detailed answer.",
        level3: "Covers the main points and writes a relevant answer.",
        level2: "Answers are shallow or short, and some important information is missing.",
        level1: "Answer does not match the topic or is extremely unclear.",
      },
      {
        name: "Language, Grammar & Spelling",
        level4: "Grammar and spelling are completely correct; sentence construction is excellent.",
        level3: "Most words are correctly spelled, with only minor errors.",
        level2: "Many grammar and spelling errors that make the writing hard to understand.",
        level1: "Writing is very messy and lacks any organized format.",
      },
      {
        name: "Presentation & Cleanliness",
        level4: "Handwriting is neat and legible; headings and points are well organized.",
        level3: "Handwriting is legible with few corrections/overwrites.",
        level2: "Handwriting is unclear or has many corrections/overwrites.",
        level1: "Writing is very messy and lacks any organized format.",
      },
      {
        name: "Timeliness",
        level4: "Submits within, or before, the given time.",
        level3: "Submits work right on time.",
        level2: "Submits work somewhat late, or only after repeated reminders.",
        level1: "Leaves work incomplete or submits it very late.",
      },
    ],
  },
  {
    title: "Project & Practical Work Rubric",
    description: "How the student plans and carries out a project or practical task.",
    criteria: [
      {
        name: "Planning",
        level4: "Task objective is clear, needed materials are gathered, and work proceeds in a planned way.",
        level3: "Gathers most materials and understands the task's objective.",
        level2: "Gathers materials only with the teacher's help; planning appears confused.",
        level1: "Does no preparation and the task's objective is not even clear.",
      },
      {
        name: "Execution",
        level4: "Follows the practical method completely; work shows correct skill and originality.",
        level3: "Works following the method, and answers oral questions about it correctly.",
        level2: "Carries out the task but with many errors in method, needing help.",
        level1: "Starts the task but doesn't follow the method and gets lost midway.",
      },
      {
        name: "Data Collection & Recording",
        level4: "Records observations with complete accuracy, clarity, and supporting tables/diagrams.",
        level3: "Notes the main observations and prepares an understandable report.",
        level2: "Misses many things while recording, or has many corrections.",
        level1: "Keeps no record, or the data is incorrect.",
      },
      {
        name: "Conclusion & Presentation",
        level4: "Correctly analyzes the results obtained from the task and presents them confidently.",
        level3: "Gives a general explanation of the results and answers questions asked.",
        level2: "Finds it difficult to draw a conclusion; presentation is unclear.",
        level1: "Unable to draw any conclusion and gives no response.",
      },
    ],
  },
];

const GENERIC_RUBRICS_NP: RubricDef[] = [
  {
    title: "कक्षाकोठा सहभागिता मूल्याङ्कन रुब्रिक्स",
    description: "विद्यार्थीले पाठमा कसरी सहभागिता जनाउँछ।",
    criteria: [
      {
        name: "छलफलमा सक्रियता",
        level4: "सधैं हात उठाउने, अर्थपूर्ण प्रश्न सोध्ने र छलफलमा नयाँ विचारहरू थप्ने ।",
        level3: "धेरैजसो समय छलफलमा भाग लिने र सोधिएका प्रश्नको सही उत्तर दिने ।",
        level2: "शिक्षकले बोलाउँदा वा सोध्दा मात्र बोल्ने, आफैं सक्रिय नहुने ।",
        level1: "छलफलमा कुनै चासो नदिने र प्रश्न सोध्दा पनि चुप बस्ने ।",
      },
      {
        name: "सुन्ने र आदर गर्ने शैली",
        level4: "अरू साथीहरू र शिक्षकको कुरा ध्यान दिएर सुन्ने र सबैको विचारको सम्मान गर्ने ।",
        level3: "अरूले बोलेको बेला शान्त रहने र आफ्नो पालो मात्र बोल्ने ।",
        level2: "कहिलेकाहीं अरूको कुरा काट्ने वा अरू बोलिरहँदा ध्यान नदिने ।",
        level1: "अरूको कुरा पटक्कै नसुन्ने र कक्षामा हल्ला गरेर बाधा पुर्‍याउने ।",
      },
      {
        name: "तयारी र सामग्री व्यवस्थापन",
        level4: "सधैं आवश्यक पाठ्यपुस्तक, कापी र कलमका साथ तयार रहने र पूर्व-कार्य पूरा गर्ने ।",
        level3: "धेरैजसो समय आवश्यक सामग्रीका साथ तयार रहने ।",
        level2: "कहिलेकाहीं शैक्षिक सामग्रीहरू बिर्सने वा तयारी बिना कक्षामा आउने ।",
        level1: "सामग्री बिना कक्षामा आउने र सिकाइ कार्यमा रुचि नदेखाउने ।",
      },
      {
        name: "समूह कार्य र सहयोग",
        level4: "समूहमा नेतृत्व लिने, साथीहरूलाई मद्दत गर्ने र सामूहिक लक्ष्य प्राप्त गर्न खट्ने ।",
        level3: "आफ्नो समूहको जिम्मेवारी इमानदारीका साथ पूरा गर्ने र सहयोगी बन्ने ।",
        level2: "समूहमा बस्ने तर आफ्नो जिम्मेवारी अरूलाई सुम्पिने वा निष्क्रिय रहने ।",
        level1: "समूहमा काम गर्न अस्वीकार गर्ने वा साथीहरूसँग असहयोग वा समूहको वातावरण बिगार्ने ।",
      },
    ],
  },
  {
    title: "मौखिक कार्य मूल्याङ्कन रुब्रिक्स",
    description: "विद्यार्थीले विषयवस्तु कसरी मौखिक रूपमा व्यक्त गर्छ।",
    criteria: [
      {
        name: "विषयवस्तुको ज्ञान",
        level4: "सोधिएको प्रश्नको गहिरो बुझाइ भएको र सटीक तथा पूर्ण उत्तर दिएको ।",
        level3: "विषयवस्तुको मुख्य कुरा बुझेको र धेरैजसो सही उत्तर दिएको ।",
        level2: "विषयवस्तुको सामान्य ज्ञान मात्र भएको र उत्तरका लागि धेरै सङ्केत चाहिने ।",
        level1: "विषयवस्तु नबुझेको वा सोधिएको प्रश्नको गलत उत्तर दिएको ।",
      },
      {
        name: "प्रवाह र स्पष्टता",
        level4: "बिना कुनै हिच्किचाहट स्पष्ट आवाजमा बोलेको र प्रवाहपूर्ण रूपमा आफ्ना विचारहरू व्यक्त गरेको ।",
        level3: "स्पष्ट आवाजमा बोलेको र विचारहरू बुझाउन सफल भएको ।",
        level2: "बोल्दा अकमकिने, धेरैपटक रोकिने र आवाज अलि अस्पष्ट भएको ।",
        level1: "विचार व्यक्त गर्न नसक्ने वा अति नै अस्पष्ट र सानो स्वरमा बोल्ने ।",
      },
      {
        name: "आत्मविश्वास र हाउभाउ",
        level4: "आँखामा आँखा जुधाएर उच्च आत्मविश्वास र उचित हाउभाउका साथ बोलेको ।",
        level3: "आत्मविश्वासका साथ बोलेको र कक्षामा सहज देखिएको ।",
        level2: "आत्मविश्वासको कमी देखिने र बोल्दा डराएको जस्तो महसुस हुने ।",
        level1: "निकै डराउने, टाउको निहुराएर बस्ने र प्रतिक्रिया दिन हिच्किचाउने ।",
      },
      {
        name: "सुन्ने र जवाफ दिने",
        level4: "प्रश्नलाई ध्यान दिएर सुन्ने र तर्कपूर्ण तथा सान्दर्भिक जवाफ तुरुन्तै दिने ।",
        level3: "प्रश्न बुझेर सही जवाफ दिने र सहभागितामा सक्रिय रहने ।",
        level2: "प्रश्न नबुझी उत्तर खोज्ने वा उत्तर दोहोर्‍याइराख्नु पर्ने ।",
        level1: "प्रश्नमा ध्यान नदिने वा उत्तर दिन कुनै रुचि नदेखाउने ।",
      },
    ],
  },
  {
    title: "लिखित कार्य मूल्याङ्कन रुब्रिक्स",
    description: "विद्यार्थीले लिखित कार्य कसरी सम्पन्न गर्छ।",
    criteria: [
      {
        name: "विषयवस्तुको सान्दर्भिकता",
        level4: "प्रश्नको आशय पूर्ण रूपमा बुझेको, मौलिक र विस्तृत उत्तर लेखिएको ।",
        level3: "मुख्य बुँदाहरू समेटिएको र सान्दर्भिक उत्तर लेखिएको ।",
        level2: "उत्तरहरू सतही वा छोटो भएको र केही महत्त्वपूर्ण जानकारी छुटेको ।",
        level1: "विषयवस्तुसँग मेल नखाने वा अति नै अस्पष्ट उत्तर लेखिएको ।",
      },
      {
        name: "भाषा, व्याकरण र हिज्जे",
        level4: "व्याकरण र हिज्जे पूर्ण रूपमा शुद्ध भएको, वाक्य गठन उत्कृष्ट रहेको ।",
        level3: "धेरैजसो शब्दहरू शुद्ध भएको र सामान्य साना त्रुटि मात्र रहेको ।",
        level2: "व्याकरण र हिज्जेमा धेरै गल्तीहरू भएको, जसले गर्दा बुझ्न गाह्रो हुने ।",
        level1: "लेखाइ निकै फोहोर भएको र प्रस्तुतीकरणको ढाँचा नमिलेको ।",
      },
      {
        name: "प्रस्तुतीकरण र सफाइ",
        level4: "अक्षर सफा र बुझिने भएको, शीर्षक र बुँदाहरू मिलाएर लेखिएको ।",
        level3: "अक्षर बुझिने भएको र धेरै केरमेट नभएको ।",
        level2: "अक्षरहरू अस्पष्ट वा धेरै केरमेट भएको ।",
        level1: "लेखाइ निकै फोहोर भएको र प्रस्तुतीकरणको ढाँचा नमिलेको ।",
      },
      {
        name: "समय पालना",
        level4: "तोकिएको समयभित्र वा अगाडि नै सम्पन्न गरी बुझाएको ।",
        level3: "ठिक समयमा कार्य सम्पन्न गरी बुझाएको ।",
        level2: "केही समय ढिलो गरी वा धेरै पटकको ताकेता पछि सम्पन्न गरी बुझाएको ।",
        level1: "कार्य अधुरो छोडेको वा निकै ढिलो गरी बुझाएको ।",
      },
    ],
  },
  {
    title: "परियोजना तथा प्रयोगात्मक कार्य मूल्याङ्कन रुब्रिक्स",
    description: "विद्यार्थीले परियोजना वा प्रयोगात्मक कार्य कसरी योजना र सम्पादन गर्छ।",
    criteria: [
      {
        name: "योजना र पूर्वतयारी",
        level4: "कार्यको उद्देश्य स्पष्ट भएको, आवश्यक सामग्री सङ्कलन गरेको र योजनाबद्ध रूपमा अघि बढेको ।",
        level3: "धेरैजसो सामग्री सङ्कलन गरेको र कार्यको उद्देश्य बुझेको ।",
        level2: "शिक्षकको सहयोगमा मात्र सामग्री जुटाएको र योजनामा अन्योल देखिएको ।",
        level1: "कुनै पूर्वतयारी नगरेको र कार्यको उद्देश्य नै स्पष्ट नभएको ।",
      },
      {
        name: "कार्यसम्पादन",
        level4: "प्रयोगात्मक विधि पूर्ण पालना गरेको, सिपको सही र नवीनता देखाएको काम गरेको ।",
        level3: "विधिअनुसार कार्य गरेको र सोधिएको मौखिक प्रश्नको सही उत्तर दिएको ।",
        level2: "कार्य त गरेको तर विधिमा धेरै गल्तीहरू भएको र मद्दत चाहिने ।",
        level1: "कार्य सुरु गरे पनि विधि नमिलेको र बिचैमा अलमलिएको ।",
      },
      {
        name: "तथ्य सङ्कलन र अभिलेख",
        level4: "अवलोकन गरिएका कुराहरू एकदमै शुद्ध, स्पष्ट र तालिका/चित्रसहित अभिलेख राखेको ।",
        level3: "अवलोकनका मुख्य कुराहरू टिपेको र बुझिने गरी प्रतिवेदन तयार पारेको ।",
        level2: "अभिलेख राख्दा धेरै कुराहरू छुटाएको वा केरमेट धेरै भएको ।",
        level1: "कुनै अभिलेख नराखेको वा तथ्याङ्कहरू गलत भएको ।",
      },
      {
        name: "निष्कर्ष र प्रस्तुतीकरण",
        level4: "कार्यबाट प्राप्त नतिजाको सही विश्लेषण गरेको र आत्मविश्वासका साथ प्रस्तुत गरेको ।",
        level3: "नतिजाको सामान्य व्याख्या गरेको र सोधिएको कुरालाई जवाफ दिएको ।",
        level2: "निष्कर्ष निकाल्न गाह्रो मानेको र प्रस्तुतीकरण अस्पष्ट रहेको ।",
        level1: "कुनै निष्कर्ष निकाल्न नसकेको र कुनै प्रतिक्रिया नदिएको ।",
      },
    ],
  },
];

async function seedRubricsForSubject(
  subjectName: string,
  gradeOrders: number[],
  rubricDefs: RubricDef[],
) {
  for (const gradeOrder of gradeOrders) {
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

    for (const [rubricIndex, rubricDef] of rubricDefs.entries()) {
      // Prisma's compound-unique upsert `where` can't take `null` for the
      // nullable curriculumUnitId component, so these generic (unit-less)
      // rubrics are upserted by manual find-then-write instead.
      const existingRubric = await prisma.rubric.findFirst({
        where: { curriculumSubjectId: curriculumSubject.id, curriculumUnitId: null, order: rubricIndex + 1 },
      });
      const rubric = existingRubric
        ? await prisma.rubric.update({
            where: { id: existingRubric.id },
            data: { title: rubricDef.title, description: rubricDef.description },
          })
        : await prisma.rubric.create({
            data: {
              curriculumSubjectId: curriculumSubject.id,
              title: rubricDef.title,
              description: rubricDef.description,
              order: rubricIndex + 1,
            },
          });

      for (const [criterionIndex, criterion] of rubricDef.criteria.entries()) {
        await prisma.rubricCriterion.upsert({
          where: { rubricId_order: { rubricId: rubric.id, order: criterionIndex + 1 } },
          update: criterion,
          create: { rubricId: rubric.id, order: criterionIndex + 1, ...criterion },
        });
      }
    }
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
const HPE_SKILLS = [
  "Understanding",
  "Physical & Motor Skill",
  "Creative Expression",
  "Vocabulary",
  "Health & Safety Habits",
];

// Nepali and Social Studies / Hamro Serofero are taught in Nepali medium, so
// their skill-area names and CAS content are in Devanagari — every other
// subject stays in English. Grade 5's Nepali "Poetry" unit below reproduces
// the school's own photographed CAS register example verbatim; the rest is a
// first draft in the same register, same as the English-language content.
const NEPALI_LANGUAGE_SKILLS = ["सुनाइ", "बोलाइ", "पढाइ", "लेखाइ", "शब्दभण्डार", "भाषिक संरचना"];
const SOCIAL_SKILLS_NP = [
  "बुझाइ",
  "खोज तथा अनुसन्धान",
  "सामाजिक तथा नागरिक सिप",
  "शब्दभण्डार",
  "मूल्य र जिम्मेवार नागरिकता",
];
const SEROFERO_SKILLS_NP = [
  "बुझाइ",
  "अवलोकन तथा अन्वेषण",
  "व्यावहारिक तथा सिर्जनात्मक सिप",
  "शब्दभण्डार",
  "मूल्य र जिम्मेवार व्यवहार",
];

const NEPALI_UNITS: Record<number, SubjectUnitDef[]> = {
  1: [
    { title: "म र मेरो परिवार", achievements: [
      "छोटो कथा वा गीत सुनी सरल प्रश्नको जवाफ दिन",
      "आफ्नो नाम र परिवारका सदस्यको नाम भन्न",
      "चित्रसहितको सरल शब्द चिनी पढ्न",
      "आफ्नो नाम र सरल वर्ण लेख्न",
      "परिवारका सदस्यसँग सम्बन्धित शब्द चिन्न",
      "सरल स्वर र व्यञ्जन वर्ण चिन्न",
    ]},
    { title: "रङ र आकार", achievements: [
      "रङ र आकारसम्बन्धी गीत सुनी दोहोर्याउन",
      "वरपरका वस्तुको रङ र आकार भन्न",
      "रङ र आकार जनाउने शब्द चिनी पढ्न",
      "सिकेका सरल शब्द नक्कल गरी लेख्न",
      "रङ र आकारसँग सम्बन्धित शब्द चिन्न",
      "एकवचन नाम शब्द चिन्न",
    ]},
    { title: "हाम्रो विद्यालय", achievements: [
      "विद्यालयसम्बन्धी छोटो कथा सुनी चित्र देखाउन",
      "कक्षाकोठा र विद्यालयका वस्तु भन्न",
      "विद्यालयसँग सम्बन्धित सरल शब्द चिनी पढ्न",
      "मार्गदर्शनमा सरल वाक्य नक्कल गरी लेख्न",
      "विद्यालयसँग सम्बन्धित शब्द चिन्न",
      "\"छ/छैन\" जस्ता सरल वाक्य संरचना चिन्न",
    ]},
    { title: "जनावर र चराचुरुङ्गी", achievements: [
      "जनावर र चराको आवाजसम्बन्धी गीत सुनी चिन्न",
      "मनपर्ने जनावर वा चराको नाम भन्न",
      "जनावर र चराका सरल शब्द चिनी पढ्न",
      "सिकेका शब्द नक्कल गरी लेख्न",
      "जनावर र चराचुरुङ्गीसँग सम्बन्धित शब्द चिन्न",
      "आवाज जनाउने सरल शब्द चिन्न",
    ]},
  ],
  2: [
    { title: "हाम्रो घर र छिमेक", achievements: [
      "घर वा छिमेकसम्बन्धी छोटो कथा सुनी प्रश्नको जवाफ दिन",
      "आफ्नो घरको बारेमा २-३ वाक्यमा कुरा गर्न",
      "छोटो र सरल वाक्य पढी बुझ्न",
      "निर्देशित रूपमा सरल वाक्य लेख्न",
      "घर र छिमेकसँग सम्बन्धित शब्द चिनी प्रयोग गर्न",
      "नाम शब्दको बहुवचन चिन्न",
    ]},
    { title: "जीवजन्तु र बिरुवा", achievements: [
      "जनावर वा बिरुवासम्बन्धी छोटो वर्णन सुनी चिन्न",
      "मनपर्ने जनावर वा बिरुवाको बारेमा कुरा गर्न",
      "जनावर र बिरुवासम्बन्धी सरल अनुच्छेद पढ्न",
      "सिकेका शब्द प्रयोग गरी सरल वाक्य लेख्न",
      "जनावर र बिरुवासँग सम्बन्धित शब्द चिन्न",
      "क्रियापदको सरल प्रयोग गर्न",
    ]},
    { title: "मेरो दिनचर्या", achievements: [
      "दिनचर्यासम्बन्धी कथा सुनी क्रम मिलाउन",
      "आफ्नो दैनिक दिनचर्या क्रमैसँग भन्न",
      "दिनचर्यासम्बन्धी सरल वाक्य पढ्न",
      "आफ्नो दिनचर्याको बारेमा २-३ वाक्य लेख्न",
      "समय र दिनचर्यासँग सम्बन्धित शब्द चिन्न",
      "समय जनाउने शब्द (बिहान, दिउँसो, साँझ) चिन्न",
    ]},
    { title: "चाडपर्व र उत्सव", achievements: [
      "चाडसम्बन्धी छोटो कथा सुनी मुख्य कुरा भन्न",
      "आफ्नो परिवारले मनाउने चाडको बारेमा कुरा गर्न",
      "चाडपर्वसम्बन्धी सरल अनुच्छेद पढ्न",
      "मनपर्ने चाडको बारेमा ३-४ वाक्य लेख्न",
      "चाडपर्वसँग सम्बन्धित शब्द चिन्न",
      "विशेषण शब्दको सरल प्रयोग गर्न",
    ]},
  ],
  3: [
    { title: "परिवार र विद्यालय", achievements: [
      "परिवार र विद्यालयसम्बन्धी कथा सुनी प्रश्नको जवाफ दिन",
      "आफ्नो परिवार र विद्यालयको बारेमा साधारण वाक्यमा वर्णन गर्न",
      "परिवार र विद्यालयसम्बन्धी छोटो अनुच्छेद पढी बुझ्न",
      "आफ्नो परिवारको बारेमा ३-४ वाक्य लेख्न",
      "परिवार र विद्यालयसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "एकवचन र बहुवचन नामको पहिचान र प्रयोग गर्न",
    ]},
    { title: "हाम्रा चाडपर्वहरू", achievements: [
      "कुनै चाडको वर्णन सुनी प्रश्नको जवाफ दिन",
      "आफ्नो परिवारले चाड कसरी मनाउँछ भनी कुरा गर्न",
      "दशैं वा तिहारसम्बन्धी छोटो पाठ पढी बुझ्न",
      "मनपर्ने चाडको बारेमा केही हरफ लेख्न",
      "चाडपर्वसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "साधारण वाक्यमा क्रियापद चिनी प्रयोग गर्न",
    ]},
    { title: "प्रकृति र जनावरहरू", achievements: [
      "कुनै जनावरको वर्णन सुनी त्यसलाई चिन्न",
      "कुनै जनावरको रूप र बानीबेहोरा वर्णन गर्न",
      "प्रकृति र जनावरसम्बन्धी छोटो अनुच्छेद पढी प्रश्नको जवाफ दिन",
      "मनपर्ने जनावरको बारेमा साधारण वाक्य लेख्न",
      "प्रकृति र जनावरसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "आकार र रङ जनाउने विशेषण चिनी प्रयोग गर्न",
    ]},
    { title: "स्वास्थ्य र सरसफाइ", achievements: [
      "स्वास्थ्य र सरसफाइसम्बन्धी कथा सुनी प्रश्नको जवाफ दिन",
      "दैनिक सरसफाइ बानीको बारेमा कुरा गर्न",
      "सरसफाइसम्बन्धी छोटो अनुच्छेद पढी बुझ्न",
      "आफ्नो सरसफाइ बानीको बारेमा ३-४ वाक्य लेख्न",
      "स्वास्थ्य र सरसफाइसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "आज्ञार्थक वाक्य (गर्नुहोस्/नगर्नुहोस्) चिनी प्रयोग गर्न",
    ]},
  ],
  4: [
    { title: "हाम्रो समुदाय र देश", achievements: [
      "समुदायको कुनै घटनाको वर्णन सुनी सारांश दिन",
      "आफ्नो छिमेक र समुदायको बारेमा कुरा गर्न",
      "नेपालसम्बन्धी अनुच्छेद पढी प्रश्नको जवाफ दिन",
      "आफ्नो समुदायको बारेमा छोटो अनुच्छेद लेख्न",
      "समुदाय र देशसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "सर्वनामको सही प्रयोग गर्न",
    ]},
    { title: "चाडपर्व र संस्कृति", achievements: [
      "सांस्कृतिक परम्परासम्बन्धी कथा सुनी मुख्य भाव भन्न",
      "कुनै सांस्कृतिक परम्परा वा चलन वर्णन गर्न",
      "नेपाली संस्कृतिसम्बन्धी पाठ पढी मुख्य बुँदा पहिचान गर्न",
      "कुनै सांस्कृतिक चलनको छोटो वर्णन लेख्न",
      "संस्कृति र परम्परासँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "वर्णनात्मक वाक्यमा विशेषण चिनी प्रयोग गर्न",
    ]},
    { title: "स्वास्थ्य र असल बानी", achievements: [
      "स्वस्थ बानीसम्बन्धी सल्लाह सुनी मुख्य बुँदा टिप्न",
      "कुनै असल स्वास्थ्य बानी आफ्नै शब्दमा बताउन",
      "सरसफाइसम्बन्धी पाठ पढी प्रश्नको जवाफ दिन",
      "दैनिक स्वस्थ दिनचर्याको बारेमा छोटो अनुच्छेद लेख्न",
      "स्वास्थ्य र सरसफाइसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "साधारण वर्तमान कालको सही प्रयोग गर्न",
    ]},
    { title: "यातायात र सञ्चार", achievements: [
      "यातायात र सञ्चारसम्बन्धी वर्णन सुनी मुख्य बुँदा टिप्न",
      "प्रयोग गरेको यातायातको साधनको बारेमा कुरा गर्न",
      "यातायातसम्बन्धी अनुच्छेद पढी प्रश्नको जवाफ दिन",
      "यातायात वा सञ्चारको साधनको बारेमा छोटो अनुच्छेद लेख्न",
      "यातायात र सञ्चारसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "तुलनात्मक विशेषण (ठूलो/सानो, छिटो/ढिलो) चिनी प्रयोग गर्न",
    ]},
  ],
  5: [
    { title: "कविता (गीति/देशप्रेम)", achievements: [
      "सुनाइ पाठका आधारमा प्रतिक्रिया दिन",
      "पाठको विषयवस्तुमा आधारित खोज तथा प्रस्तुति दिन",
      "पाठ पढी बोध गर्न",
      "पाठका आधारमा अनुलेखन गर्न",
      "लय मिल्ने शब्द पहिचान र प्रयोग गर्न",
      "नाम र सर्वनामको पहिचान र प्रयोग गर्न",
    ]},
    { title: "कथा (सामाजिक)", achievements: [
      "पाठ सुनेको आधारमा छलफल गर्न",
      "प्रसङ्गअनुसार समयपालनासम्बन्धी विचार अभिव्यक्ति दिन",
      "पाठ पढी त्यसको संरचना र विषयवस्तु पहिचान गर्न",
      "पाठका आधारमा समानान्तर कथा लेख्न",
      "अनुकरणात्मक (ध्वन्यात्मक) शब्द पहिचान र प्रयोग गर्न",
      "विशेषण शब्दको पहिचान र प्रयोग गर्न",
    ]},
    { title: "निबन्ध र पत्र लेखन", achievements: [
      "नमुना निबन्ध वा पत्र सुनी त्यसको संरचना पहिचान गर्न",
      "छनोट गरिएको विषयमा छोटो संरचित प्रस्तुति दिन",
      "नमुना निबन्ध वा पत्र पढी उद्देश्य बुझ्न",
      "छोटो निबन्ध वा साधारण पत्र लेख्न",
      "औपचारिक लेखनसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "वाक्य जोड्ने संयोजक (conjunction) चिनी प्रयोग गर्न",
    ]},
    { title: "वातावरण संरक्षण", achievements: [
      "वातावरण संरक्षणसम्बन्धी वार्ता सुनी मुख्य कुरा टिप्न",
      "वातावरण जोगाउने उपायबारे विचार व्यक्त गर्न",
      "वातावरणसम्बन्धी लेख पढी मुख्य भाव बुझ्न",
      "वातावरण संरक्षणका उपायबारे अनुच्छेद लेख्न",
      "वातावरण र संरक्षणसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "कारण जनाउने वाक्य संरचना (किनभने) चिनी प्रयोग गर्न",
    ]},
  ],
};

const ENGLISH_UNITS: Record<number, SubjectUnitDef[]> = {
  1: [
    { title: "Myself and My Family", achievements: [
      "To listen to simple words/rhymes and point to the correct picture",
      "To say one's own name and the names of family members",
      "To recognize and read simple picture words",
      "To trace and copy one's own name and simple letters",
      "To recognize words related to family members",
      "To recognize simple greeting words (hello, bye)",
    ]},
    { title: "Colours and Numbers", achievements: [
      "To listen to a colour/number rhyme and respond by pointing",
      "To name colours and count objects up to 10",
      "To recognize colour and number words",
      "To trace and copy colour and number words",
      "To recognize words for common colours and numbers",
      "To recognize simple singular naming words",
    ]},
    { title: "My School", achievements: [
      "To listen to a short story about school and point to pictures",
      "To name classroom objects and school areas",
      "To recognize simple school-related words",
      "To trace and copy simple school-related words",
      "To recognize words related to school",
      "To recognize simple \"This is a ___\" sentences",
    ]},
    { title: "Animals and Birds", achievements: [
      "To listen to animal/bird sounds and match them to pictures",
      "To name a favourite animal or bird",
      "To recognize simple animal and bird words",
      "To trace and copy animal and bird words",
      "To recognize words for common animals and birds",
      "To recognize simple sound words (moo, tweet)",
    ]},
  ],
  2: [
    { title: "My Home and Neighbourhood", achievements: [
      "To listen to a short story about home and answer simple questions",
      "To talk about one's home in 2-3 simple sentences",
      "To read short, simple sentences and understand them",
      "To write simple sentences with guidance",
      "To recognize and use words related to home and neighbourhood",
      "To recognize and use plural naming words",
    ]},
    { title: "Animals and Plants", achievements: [
      "To listen to a short description of an animal or plant and identify it",
      "To talk about a favourite animal or plant",
      "To read a simple paragraph about animals and plants",
      "To write simple sentences using learnt words",
      "To recognize and use words related to animals and plants",
      "To use simple action words (verbs) correctly",
    ]},
    { title: "My Daily Routine", achievements: [
      "To listen to a story about a daily routine and sequence it",
      "To describe one's own daily routine in order",
      "To read simple sentences about a daily routine",
      "To write 2-3 sentences about one's own daily routine",
      "To recognize words related to time and daily routine",
      "To recognize time words (morning, afternoon, evening)",
    ]},
    { title: "Festivals and Celebrations", achievements: [
      "To listen to a short story about a festival and answer simple questions",
      "To talk about how one's family celebrates a festival",
      "To read short sentences about a festival",
      "To write 2-3 sentences about a favourite festival",
      "To recognize and use festival-related words",
      "To recognize simple describing words (happy, colourful)",
    ]},
  ],
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
    { title: "Health and Hygiene", achievements: [
      "To listen to advice about hygiene and list the main points",
      "To talk about a healthy daily habit",
      "To read a short passage about hygiene and answer questions",
      "To write 3-4 sentences about staying healthy",
      "To recognize and use health- and hygiene-related words",
      "To use simple imperative sentences (Wash your hands.) correctly",
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
    { title: "Transport and Communication", achievements: [
      "To listen to a talk about ways of travelling and list them",
      "To talk about how one travels to school",
      "To read a passage about transport or communication and answer questions",
      "To write a short paragraph comparing two means of transport",
      "To recognize and use transport- and communication-related words",
      "To use comparative adjectives (faster, slower) correctly",
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
    { title: "Environment and Conservation", achievements: [
      "To listen to a talk about protecting the environment and list the main points",
      "To discuss simple ways to protect the environment",
      "To read a passage about the environment and answer questions",
      "To write a short paragraph on conserving the environment",
      "To recognize and use environment-related words",
      "To use \"because\" to give reasons in sentences",
    ]},
  ],
};

const MATH_UNITS: Record<number, SubjectUnitDef[]> = {
  1: [
    { title: "Numbers up to 20", achievements: [
      "To understand counting and number order up to 20",
      "To add and subtract numbers up to 10",
      "To solve simple picture-based addition/subtraction problems",
      "To read and write numbers up to 20",
      "To count everyday objects up to 20",
    ]},
    { title: "Shapes and Patterns", achievements: [
      "To recognize basic shapes (circle, square, triangle, rectangle)",
      "To sort objects by shape and size",
      "To continue a simple repeating pattern",
      "To name basic shapes correctly",
      "To identify shapes in everyday objects",
    ]},
    { title: "Measurement and Time", achievements: [
      "To compare objects by length, weight, and size (bigger/smaller, longer/shorter)",
      "To order 3-4 objects by size",
      "To solve simple comparison problems using pictures",
      "To use comparison words correctly (bigger, smaller, longer, shorter)",
      "To tell whether it is day or night from a picture",
    ]},
    { title: "Simple Addition and Subtraction Stories", achievements: [
      "To understand addition and subtraction as combining and taking away",
      "To add and subtract single-digit numbers fluently",
      "To solve a simple word problem told as a short story",
      "To explain in words how a problem was solved",
      "To use addition and subtraction in everyday classroom situations",
    ]},
  ],
  2: [
    { title: "Numbers up to 100", achievements: [
      "To understand place value (tens and ones) up to 100",
      "To add and subtract two-digit numbers without carrying",
      "To solve simple word problems involving addition and subtraction",
      "To read and write numbers up to 100",
      "To use numbers up to 100 in everyday counting situations",
    ]},
    { title: "Money and Measurement", achievements: [
      "To recognize Nepali currency notes and coins",
      "To add small amounts of money together",
      "To solve simple problems involving buying and giving change",
      "To express amounts of money correctly",
      "To use money concepts in simple shopping situations",
    ]},
    { title: "Time and Calendar", achievements: [
      "To read time to the hour on a clock",
      "To identify days of the week and months of the year in order",
      "To solve simple problems involving time (before/after)",
      "To express time and dates correctly",
      "To use a calendar to find a given date",
    ]},
    { title: "Introduction to Multiplication", achievements: [
      "To understand multiplication as repeated addition",
      "To recall multiplication facts for 2, 5, and 10",
      "To solve simple word problems using multiplication",
      "To write a multiplication fact as a repeated addition sentence",
      "To use multiplication to count groups of everyday objects",
    ]},
  ],
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
    { title: "Fractions — Basic Ideas", achievements: [
      "To understand a fraction as a part of a whole",
      "To identify and write simple fractions (halves, thirds, quarters)",
      "To solve simple problems comparing two fractions",
      "To represent a fraction using a picture or diagram",
      "To identify fractions in everyday situations (half a roti, quarter of an hour)",
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
    { title: "Area of Simple Shapes", achievements: [
      "To understand area as the space covered by a shape",
      "To calculate the area of squares and rectangles",
      "To solve simple problems involving area",
      "To explain the difference between perimeter and area",
      "To estimate the area of a real surface (a room, a field)",
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
    { title: "Percentage — Basic Ideas", achievements: [
      "To understand percentage as a fraction out of 100",
      "To convert simple fractions and decimals to percentages",
      "To solve simple problems involving percentage",
      "To explain what a given percentage represents",
      "To recognize percentages used in everyday life (discounts, marks)",
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
    { title: "Forces and Simple Machines", achievements: [
      "To understand push and pull as forces that move objects",
      "To observe how simple machines (lever, wheel, pulley) make work easier",
      "To test how a simple machine changes the effort needed to move an object",
      "To recognize and use words like force, push, pull, machine",
      "To use simple machines and tools safely",
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
    { title: "Our Environment and Natural Resources", achievements: [
      "To understand what natural resources are and why they matter",
      "To observe local examples of air, water, soil, and forest resources",
      "To carry out a simple activity to test water or soil quality",
      "To recognize and use words like resource, pollution, conservation",
      "To practise responsible use and conservation of resources",
    ]},
  ],
};

const SOCIAL_UNITS: Record<number, SubjectUnitDef[]> = {
  4: [
    { title: "मेरो परिवार र छिमेक", achievements: [
      "परिवारका सदस्य र छिमेकीहरूको भूमिका बुझ्न",
      "आफ्नो छिमेकको बारेमा साधारण जानकारी सङ्कलन गर्न",
      "छिमेकीसँग सम्मानपूर्वक व्यवहार गर्न",
      "परिवार र समुदायसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "छिमेकीप्रति सम्मान र सहकार्य देखाउन",
    ]},
    { title: "हाम्रो स्थानीय सरकार", achievements: [
      "स्थानीय सरकार (वडा/नगरपालिका) को आधारभूत भूमिका बुझ्न",
      "स्थानीय सरकारका सेवासम्बन्धी साधारण जानकारी पत्ता लगाउन",
      "स्थानीय सरकारी कार्यालयबाट सहयोग लिने तरिका वर्णन गर्न",
      "स्थानीय सरकारसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "समुदायको सदस्यको रूपमा आफ्नो कर्तव्य बुझ्न",
    ]},
    { title: "असल बानी र नागरिकता", achievements: [
      "असल नागरिक भनेको के हो बुझ्न",
      "दैनिक जीवनमा असल नागरिकताका उदाहरण पहिचान गर्न",
      "इमानदारी र सहकार्यजस्ता असल बानी अभ्यास गर्न",
      "नागरिकता र मूल्यसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "विद्यालय र समुदायमा जिम्मेवारीपूर्वक व्यवहार गर्न",
    ]},
    { title: "हाम्रो सांस्कृतिक सम्पदा", achievements: [
      "आफ्नो क्षेत्रको सांस्कृतिक सम्पदा भनेको के हो बुझ्न",
      "नजिकैको ऐतिहासिक वा सांस्कृतिक स्थलको बारेमा जानकारी खोज्न",
      "आफ्नो क्षेत्रको सम्पदाको बारेमा अरूलाई वर्णन गर्न",
      "सांस्कृतिक सम्पदासँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "सांस्कृतिक सम्पदा संरक्षणमा जिम्मेवारी देखाउन",
    ]},
  ],
  5: [
    { title: "म, मेरो परिवार र छिमेकीहरू", achievements: [
      "छिमेकीहरूको पेसा र भूमिका बुझ्न",
      "आफ्नो परिवारले छिमेकीसँग कसरी व्यवहार गर्छ भनी पत्ता लगाउन",
      "समुदायलाई सहयोग गर्न र सबैलाई समान व्यवहार गर्न",
      "छिमेकी र समुदायसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "अरूप्रति बुझाइ र सम्मान देखाउन",
    ]},
    { title: "हाम्रा परम्परा, सामाजिक मूल्य र मान्यता", achievements: [
      "स्थानीय परम्परा, भाषा र पोशाक बुझ्न",
      "आफ्नो जिल्लाका चाडपर्व र प्रसिद्ध व्यक्तित्वको बारेमा पत्ता लगाउन",
      "आफ्नो परम्परा र चलन अरूलाई वर्णन गर्न",
      "परम्परा र संस्कृतिसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "आफ्नो देश र परम्पराप्रति गर्व गर्न",
    ]},
    { title: "सामाजिक समस्या र समाधान", achievements: [
      "चोरी र अन्धानुकरणजस्ता सामान्य सामाजिक समस्या बुझ्न",
      "स्थानीय सामाजिक संस्था र तिनको भूमिका पहिचान गर्न",
      "समुदायमा सहकार्य र सुरक्षा अभ्यास गर्न",
      "सामाजिक समस्या र समाधानसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "खराब बानीबाट टाढा रही सामुदायिक समाधानलाई सहयोग गर्न",
    ]},
    { title: "प्राकृतिक स्रोत र संरक्षण", achievements: [
      "आफ्नो क्षेत्रका प्राकृतिक स्रोतहरू (वन, पानी, माटो) बुझ्न",
      "स्थानीय प्राकृतिक स्रोतको प्रयोगबारे जानकारी सङ्कलन गर्न",
      "प्राकृतिक स्रोत संरक्षणका उपाय अरूलाई वर्णन गर्न",
      "प्राकृतिक स्रोत र संरक्षणसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "प्राकृतिक स्रोतको जिम्मेवारीपूर्ण प्रयोग अभ्यास गर्न",
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
    { title: "Nutrition and Balanced Diet", achievements: [
      "To understand what makes a balanced diet",
      "To sort common foods into food groups",
      "To plan a simple balanced meal for a day",
      "To recognize and use words related to nutrition and food groups",
      "To practice healthy eating habits",
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
    { title: "Community Health and Sanitation", achievements: [
      "To understand the link between sanitation and community health",
      "To observe and describe sanitation practices at school",
      "To demonstrate proper handwashing and toilet-use practices",
      "To recognize and use words related to sanitation and hygiene",
      "To promote good sanitation habits among peers",
    ]},
  ],
};

const SEROFERO_UNITS: Record<number, SubjectUnitDef[]> = {
  1: [
    { title: "म र मेरो शरीर", achievements: [
      "शरीरका मुख्य अङ्गहरू चिन्न",
      "आफ्नो शरीरका अङ्ग छोई देखाउन",
      "आफ्नो शरीरको चित्र बनाउन",
      "शरीरका अङ्गसँग सम्बन्धित शब्द चिन्न",
      "शरीरको सरसफाइ राख्ने बानी अभ्यास गर्न",
    ]},
    { title: "हाम्रो वरपरको वातावरण", achievements: [
      "घर र विद्यालय वरपरका वस्तु चिन्न",
      "वरपरका बिरुवा र जनावर अवलोकन गर्न",
      "अवलोकन गरेको वस्तुको चित्र बनाउन",
      "वरपरको वातावरणसँग सम्बन्धित शब्द चिन्न",
      "वरपरको सरसफाइ राख्ने बानी देखाउन",
    ]},
    { title: "मौसम र ऋतु", achievements: [
      "मौसमका सरल परिवर्तन (घाम, वर्षा, जाडो) चिन्न",
      "दैनिक मौसम अवलोकन गरी भन्न",
      "मनपर्ने मौसमको चित्र बनाउन",
      "मौसमसँग सम्बन्धित शब्द चिन्न",
      "मौसमअनुसार उपयुक्त पोशाक लगाउने बानी अभ्यास गर्न",
    ]},
    { title: "जनावर र चराचुरुङ्गी", achievements: [
      "आसपासका सामान्य जनावर र चराहरू चिन्न",
      "जनावर र चराहरूको आवाज तथा बानीबेहोरा अवलोकन गर्न",
      "मनपर्ने जनावर वा चराको चित्र बनाउन",
      "जनावर र चराचुरुङ्गीसँग सम्बन्धित शब्द चिन्न",
      "जनावर र चराचुरुङ्गीप्रति दया र हेरचाह देखाउन",
    ]},
  ],
  2: [
    { title: "स्वास्थ्य र सरसफाइ", achievements: [
      "व्यक्तिगत सरसफाइको महत्त्व बुझ्न",
      "दैनिक सरसफाइ अभ्यास अवलोकन गरी वर्णन गर्न",
      "सरसफाइसम्बन्धी सरल पोस्टर वा चित्र बनाउन",
      "स्वास्थ्य र सरसफाइसँग सम्बन्धित शब्द चिन्न",
      "दैनिक रूपमा सरसफाइ अभ्यास गर्न",
    ]},
    { title: "हाम्रो खाना", achievements: [
      "पोषिलो खानाका प्रकार चिन्न",
      "दैनिक खाइने खानेकुरा अवलोकन गरी सूचीकरण गर्न",
      "सन्तुलित खानाको चित्र बनाउन",
      "खानासँग सम्बन्धित शब्द चिन्न",
      "खाना खानुअघि हात धुने बानी अभ्यास गर्न",
    ]},
    { title: "हाम्रो सुरक्षा", achievements: [
      "घर र विद्यालयमा हुने सुरक्षित/असुरक्षित परिस्थिति बुझ्न",
      "वरपरका सुरक्षा चिन्ह वा नियम अवलोकन गर्न",
      "सुरक्षा नियमसम्बन्धी सरल चित्र बनाउन",
      "सुरक्षासँग सम्बन्धित शब्द चिन्न",
      "सुरक्षा नियम पालना गर्ने बानी देखाउन",
    ]},
    { title: "यातायातका साधन", achievements: [
      "सामान्य यातायातका साधनहरू चिन्न",
      "आफूले प्रयोग गरेको यातायातको साधन अवलोकन गरी वर्णन गर्न",
      "मनपर्ने यातायातको साधनको चित्र बनाउन",
      "यातायातसँग सम्बन्धित शब्द चिन्न",
      "यातायात प्रयोग गर्दा अपनाउनुपर्ने सुरक्षा बानी देखाउन",
    ]},
  ],
  3: [
    { title: "मेरो परिवार र समुदाय", achievements: [
      "परिवारका सदस्य र सामुदायिक सहयोगीहरूको भूमिका बुझ्न",
      "आफ्नो समुदायको दैनिक जीवन अवलोकन गरी वर्णन गर्न",
      "परिवार/समुदायको कुनै दृश्य नाटकीकरण वा चित्रण गर्न",
      "परिवार र समुदायसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "परिवार र समुदायका सदस्यप्रति सम्मान र सहकार्य देखाउन",
    ]},
    { title: "हाम्रो वातावरण र प्रकृति", achievements: [
      "स्थानीय वातावरणका आधारभूत विशेषता बुझ्न",
      "विद्यालय वरपरका बिरुवा, जनावर र मौसम अवलोकन गर्न",
      "प्रकृतिमा अवलोकन गरेको कुनै वस्तु चित्रण वा नमूना बनाउन",
      "वातावरण र प्रकृतिसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "बिरुवा, जनावर र वातावरणको हेरचाह गर्न",
    ]},
    { title: "स्वास्थ्य, सुरक्षा र सिर्जनशीलता", achievements: [
      "आधारभूत स्वास्थ्य र सुरक्षा अभ्यास बुझ्न",
      "घर र विद्यालयमा हुने सुरक्षित/असुरक्षित परिस्थिति पहिचान गर्न",
      "स्वास्थ्य/सुरक्षा विषयमा साधारण कला वा शिल्प सामग्री बनाउन",
      "स्वास्थ्य र सुरक्षासँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "दैनिक रूपमा सुरक्षित र स्वस्थ व्यवहार अभ्यास गर्न",
    ]},
    { title: "चाडपर्व र संस्कृति", achievements: [
      "आफ्नो समुदायका मुख्य चाडपर्वहरू चिन्न",
      "कुनै चाडमा गरिने चलन अवलोकन गरी वर्णन गर्न",
      "चाडसँग सम्बन्धित चित्र वा शिल्प सामग्री बनाउन",
      "चाडपर्व र संस्कृतिसँग सम्बन्धित शब्दहरू चिनी प्रयोग गर्न",
      "आफ्नो संस्कृतिप्रति सम्मान देखाउन",
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
    "Nepali", "NEP", NEPALI_LANGUAGE_SKILLS, NEPALI_UNITS,
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
    "Social Studies", "SOC", SOCIAL_SKILLS_NP, SOCIAL_UNITS,
    gradeByOrder, sectionByGradeOrder,
  );
  await seedSubjectCas(
    schoolId, academicYearId, teacherId,
    "Health, Physical and Creative Arts", "HPE", HPE_SKILLS, HPE_UNITS,
    gradeByOrder, sectionByGradeOrder,
  );
  await seedSubjectCas(
    schoolId, academicYearId, teacherId,
    "Hamro Serofero", "SERO", SEROFERO_SKILLS_NP, SEROFERO_UNITS,
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
  await seedRubricsForSubject("Computer", [3, 4, 5], COMPUTER_RUBRICS);
  await seedRubricsForSubject("Nepali", [1, 2, 3, 4, 5], GENERIC_RUBRICS_NP);
  await seedRubricsForSubject("English", [1, 2, 3, 4, 5], GENERIC_RUBRICS_EN);
  await seedRubricsForSubject("Mathematics", [1, 2, 3, 4, 5], GENERIC_RUBRICS_EN);
  await seedRubricsForSubject("Science and Technology", [4, 5], GENERIC_RUBRICS_EN);
  await seedRubricsForSubject("Social Studies", [4, 5], GENERIC_RUBRICS_NP);
  await seedRubricsForSubject("Health, Physical and Creative Arts", [4, 5], GENERIC_RUBRICS_EN);
  await seedRubricsForSubject("Hamro Serofero", [1, 2, 3], GENERIC_RUBRICS_NP);
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
