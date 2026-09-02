import { z } from "zod";
import { Type } from "@google/genai";
import { gemini, LESSON_PLAN_MODEL } from "@/lib/gemini";

export const lessonPlanContentSchema = z.object({
  objectives: z.array(z.string()).min(1),
  activities: z.array(z.string()).min(1),
  teachingMethods: z.array(z.string()).min(1),
  materials: z.array(z.string()),
  discussionQuestions: z.array(z.string()),
  practiceActivities: z.array(z.string()),
  homework: z.string(),
  assessmentActivities: z.array(z.string()),
  expectedEvidence: z.array(z.string()),
  rubric: z
    .array(
      z.object({
        criterion: z.string(),
        levels: z.array(
          z.object({ label: z.string(), description: z.string() }),
        ),
      }),
    )
    .min(1),
});

export type LessonPlanContent = z.infer<typeof lessonPlanContentSchema>;

const stringArray = { type: Type.ARRAY, items: { type: Type.STRING } };

const LESSON_PLAN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    objectives: stringArray,
    activities: stringArray,
    teachingMethods: stringArray,
    materials: stringArray,
    discussionQuestions: stringArray,
    practiceActivities: stringArray,
    homework: { type: Type.STRING },
    assessmentActivities: stringArray,
    expectedEvidence: stringArray,
    rubric: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criterion: { type: Type.STRING },
          levels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["label", "description"],
            },
          },
        },
        required: ["criterion", "levels"],
      },
    },
  },
  required: [
    "objectives",
    "activities",
    "teachingMethods",
    "materials",
    "discussionQuestions",
    "practiceActivities",
    "homework",
    "assessmentActivities",
    "expectedEvidence",
    "rubric",
  ],
};

export type LessonPlanGenerationInput = {
  gradeName: string;
  subjectName: string;
  unitTitle: string;
  topicTitle: string;
  periodNumber: number;
  totalPeriods: number;
  learningOutcomes: string[];
  competencies: string[];
  precedingTopics: string[];
};

export async function generateLessonPlanContent(
  input: LessonPlanGenerationInput,
): Promise<{ content: LessonPlanContent; raw: unknown }> {
  const prompt = `You are helping a Nepali school teacher plan a single class period.

Grade: ${input.gradeName}
Subject: ${input.subjectName}
Curriculum unit: ${input.unitTitle}
This period's topic: ${input.topicTitle} (period ${input.periodNumber} of ${input.totalPeriods} in this unit)
${input.precedingTopics.length > 0 ? `Already covered earlier in this unit: ${input.precedingTopics.join(", ")}` : "This is the first period in the unit."}

Learning outcomes for this unit:
${input.learningOutcomes.map((o) => `- ${o}`).join("\n") || "- (none specified)"}

Competencies for this unit:
${input.competencies.map((c) => `- ${c}`).join("\n") || "- (none specified)"}

Produce a single-period lesson plan appropriate for this grade level and topic, building on the periods already covered. Keep activities concrete and doable in a typical 40-45 minute period in a Nepali classroom with limited materials.`;

  const response = await gemini.models.generateContent({
    model: LESSON_PLAN_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: LESSON_PLAN_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Model did not return a structured lesson plan.");
  }

  const content = lessonPlanContentSchema.parse(JSON.parse(text));
  return { content, raw: response };
}
