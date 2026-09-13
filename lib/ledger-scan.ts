import { z } from "zod";
import { Type } from "@google/genai";
import { gemini, LESSON_PLAN_MODEL } from "@/lib/gemini";

export const ledgerScanResultSchema = z.object({
  rows: z.array(
    z.object({
      skillArea: z.string(),
      regularScore: z.number().int().min(1).max(4).nullable(),
      afterSupportScore: z.number().int().min(1).max(4).nullable(),
    }),
  ),
});

export type LedgerScanResult = z.infer<typeof ledgerScanResultSchema>;

const LEDGER_SCAN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    rows: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skillArea: { type: Type.STRING },
          regularScore: { type: Type.INTEGER, nullable: true },
          afterSupportScore: { type: Type.INTEGER, nullable: true },
        },
        required: ["skillArea", "regularScore", "afterSupportScore"],
      },
    },
  },
  required: ["rows"],
};

/**
 * Reads a photographed page of the physical CAS ledger (one student, one
 * unit) and extracts the handwritten 1-4 scores per skill-area row. The
 * photo itself stays the source of truth - a teacher always reviews the
 * extracted values against it before saving, so this errs toward returning
 * null on anything unclear rather than guessing.
 */
export async function scanLedgerPhoto(input: {
  imageBase64: string;
  mimeType: string;
  skillAreas: string[];
}): Promise<LedgerScanResult> {
  const prompt = `This is a photo of one page from a Nepali school's handwritten Continuous Assessment ledger book for a single student and a single subject unit.

The page is a table with one row per skill area, in this exact order:
${input.skillAreas.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Each row has two score columns, each holding a single handwritten digit from 1 to 4 (it may be left blank):
- "Regular evaluation" score
- "Evaluation after support" score (a second, later attempt - often blank if the student didn't need remedial help)

Read the handwritten digits carefully. If a cell is blank, illegible, or you are not confident about the digit, return null for that cell rather than guessing - a teacher will review every value against the photo before it's saved, so a missed read is far better than a wrong one.

Return exactly one row per skill area listed above, in that same order, with "skillArea" matching the given name exactly.`;

  const response = await gemini.models.generateContent({
    model: LESSON_PLAN_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }, { inlineData: { mimeType: input.mimeType, data: input.imageBase64 } }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: LEDGER_SCAN_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Model did not return ledger scan results.");
  }

  return ledgerScanResultSchema.parse(JSON.parse(text));
}
