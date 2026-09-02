import { GoogleGenAI } from "@google/genai";

export const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Free tier via Google AI Studio (aistudio.google.com) as of writing.
export const LESSON_PLAN_MODEL = "gemini-2.5-flash";
