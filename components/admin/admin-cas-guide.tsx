import { GuidePanel, GuideSection } from "@/components/guide-panel";

export function AdminCasGuide() {
  return (
    <GuidePanel title="How Continuous Assessment Works">
      <GuideSection title="What teachers are doing">
        <p>
          Teachers score each student 1-4 per learning achievement — the same scale
          they already use in the printed record book — under each subject&apos;s{" "}
          <strong>Assessment</strong> section. They can score with regular evaluation
          entries, and re-score after remedial support if a student needs it.
        </p>
      </GuideSection>

      <GuideSection title="Where the numbers come from">
        <p>
          Percentage, GPA, and grade are calculated automatically from those 1-4
          scores — teachers never enter a percentage by hand. The <strong>Report
          Card</strong> section rolls every subject up into each student&apos;s overall
          GPA, WGPA, and Percentage.
        </p>
      </GuideSection>

      <GuideSection title="Rubrics">
        <p>
          Every subject already has 4 ready-made rubrics (Classroom Participation,
          Oral Task, Written Task, Project &amp; Practical Work), matching the
          school&apos;s own rubrics booklet — teachers don&apos;t need to build these
          themselves.
        </p>
      </GuideSection>

      <GuideSection title="Setting up a class">
        <p>
          A subject only shows up under a teacher&apos;s Assessment section once you&apos;ve
          created the <strong>Teacher Assignment</strong> (subject + grade + section +
          academic year) — that&apos;s what connects a teacher to a class here.
        </p>
      </GuideSection>
    </GuidePanel>
  );
}
