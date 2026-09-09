export const ACHIEVEMENT_LEVELS = [
  { level: 1, label: "Needs Improvement", description: "The main learning achievement has not been met." },
  { level: 2, label: "Basic", description: "Partially achieved, still needs improvement." },
  { level: 3, label: "Proficient", description: "Most learning achievements have been met." },
  { level: 4, label: "Advanced", description: "Fully achieved, reaching a higher level." },
] as const;

export const GRADE_SCALE = [
  { min: 90, gpa: "4.0", grade: "A+" },
  { min: 80, gpa: "3.6", grade: "A" },
  { min: 70, gpa: "3.2", grade: "B+" },
  { min: 60, gpa: "2.8", grade: "B" },
  { min: 50, gpa: "2.4", grade: "C+" },
  { min: 40, gpa: "2.0", grade: "C" },
  { min: 35, gpa: "1.6", grade: "D" },
  { min: 0, gpa: "—", grade: "NG" },
] as const;

export function percentageToGrade(percentage: number): { gpa: string; grade: string } {
  const band = GRADE_SCALE.find((row) => percentage >= row.min);
  return band ? { gpa: band.gpa, grade: band.grade } : { gpa: "—", grade: "NG" };
}

export function effectiveScore(regularScore: number | null, remedialScore: number | null): number {
  return remedialScore ?? regularScore ?? 0;
}

export function computeUnitResult(scores: { regularScore: number | null; remedialScore: number | null }[]) {
  const totalPossible = scores.length * 4;
  const sum = scores.reduce((acc, s) => acc + effectiveScore(s.regularScore, s.remedialScore), 0);
  const percentage = totalPossible > 0 ? (sum / totalPossible) * 100 : 0;
  return { sum, totalPossible, percentage, ...percentageToGrade(percentage) };
}
