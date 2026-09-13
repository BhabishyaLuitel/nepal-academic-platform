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
  { min: 60, gpa: "2.5", grade: "B" }, // verified against the physical register photo — not 2.8
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

// computeUnitResult aggregates a flat list of achievement scores regardless of
// which curriculum unit they belong to, so it doubles as the whole-subject
// aggregate (pass every achievement across every unit for that subject) used
// by the report card rollup below.
export const computeSubjectResult = computeUnitResult;

export function computeRubricResult(scores: { level: number | null }[]) {
  const totalPossible = scores.length * 4;
  const sum = scores.reduce((acc, s) => acc + (s.level ?? 0), 0);
  const percentage = totalPossible > 0 ? (sum / totalPossible) * 100 : 0;
  return { sum, totalPossible, percentage, ...percentageToGrade(percentage) };
}

export function gpaToNumber(gpa: string): number {
  const n = Number.parseFloat(gpa);
  return Number.isNaN(n) ? 0 : n;
}

export type SubjectReportRow = {
  subjectId: string;
  subjectName: string;
  creditWeight: number;
  percentage: number;
  gpa: string;
  grade: string;
};

export function computeReportCard(subjects: SubjectReportRow[]) {
  if (subjects.length === 0) {
    return { gpa: 0, wgpa: 0, percentage: 0 };
  }
  const gpaPoints = subjects.map((s) => gpaToNumber(s.gpa));
  const gpa = gpaPoints.reduce((a, b) => a + b, 0) / subjects.length;
  const percentage = subjects.reduce((a, s) => a + s.percentage, 0) / subjects.length;
  const totalWeight = subjects.reduce((a, s) => a + s.creditWeight, 0);
  const wgpa =
    totalWeight > 0
      ? subjects.reduce((a, s, i) => a + gpaPoints[i] * s.creditWeight, 0) / totalWeight
      : gpa;
  return { gpa, wgpa, percentage };
}
