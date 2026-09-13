import { GuidePanel, GuideSection } from "@/components/guide-panel";
import { ACHIEVEMENT_LEVELS } from "@/lib/grading";

export function CasGuide() {
  return (
    <GuidePanel title="How Continuous Assessment Works">
      <GuideSection title="The 1-4 achievement scale">
        <p>
          Every learning achievement is scored 1-4, the same as in the printed record
          book:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {ACHIEVEMENT_LEVELS.slice()
            .reverse()
            .map((l) => (
              <li key={l.level}>
                <strong>{l.level}</strong> ({l.label}) — {l.description}
              </li>
            ))}
        </ul>
      </GuideSection>

      <GuideSection title="Regular vs. after-support">
        <p>
          Score a student under <strong>Regular evaluation</strong> first. If they need
          extra help and are re-checked, score that under{" "}
          <strong>Evaluation after support</strong> instead — that score replaces the
          regular one in the final result, exactly like the paper ledger.
        </p>
      </GuideSection>

      <GuideSection title="How Percentage and Grade are calculated">
        <p>The app does this automatically — you never need to calculate it by hand:</p>
        <p className="cas-readout">
          Percentage = (sum of scores) ÷ (4 × number of rows) × 100
        </p>
        <p>
          The Grading Scale tab on each assessment page shows the full percentage →
          GPA → grade table.
        </p>
      </GuideSection>

      <GuideSection title="Using the Rubrics tab">
        <p>
          Each subject has 4 ready-made rubrics (Classroom Participation, Oral Task,
          Written Task, Project &amp; Practical Work) — the same ones from the rubrics
          booklet, already filled in as examples you can score directly.
        </p>
        <p>
          Click a level cell to select it for that criterion — one click chooses the
          level, no typing needed. The total, percentage, and grade update
          automatically as you go, then press Save.
        </p>
      </GuideSection>
    </GuidePanel>
  );
}
