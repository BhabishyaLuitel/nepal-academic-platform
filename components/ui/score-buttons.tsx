import { ACHIEVEMENT_LEVELS } from "@/lib/grading";

const SCORES = [1, 2, 3, 4] as const;

/**
 * A tap-friendly replacement for a <select> when scoring 1-4. Native <select>
 * menus are specifically hard to use for touch users with reduced motor
 * skills (Nielsen Norman Group research on senior/low-literacy users), so
 * this uses native radio inputs (works with plain form submission, no JS
 * required) visually restyled as large buttons.
 */
export function ScoreButtons({
  name,
  defaultValue,
  size = "full",
}: {
  name: string;
  defaultValue: number | null | undefined;
  /** "full" shows the achievement-level label too (detail page); "compact" is
   * just the number, for dense grids (scoring table). */
  size?: "full" | "compact";
}) {
  return (
    <div
      role="radiogroup"
      className={size === "full" ? "flex flex-wrap gap-2" : "flex gap-1.5"}
    >
      {SCORES.map((score) => {
        const level = ACHIEVEMENT_LEVELS[score - 1];
        const id = `${name}-${score}`;
        return (
          <div key={score}>
            <input
              type="radio"
              id={id}
              name={name}
              value={score}
              defaultChecked={defaultValue === score}
              className="peer sr-only"
            />
            <label
              htmlFor={id}
              className={
                size === "full"
                  ? "flex min-h-11 min-w-11 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 peer-checked:border-brand-green peer-checked:bg-brand-green peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-blue peer-focus-visible:ring-offset-2"
                  : "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-slate-300 text-sm font-semibold text-slate-700 peer-checked:border-brand-green peer-checked:bg-brand-green peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-blue peer-focus-visible:ring-offset-1"
              }
            >
              <span className={size === "full" ? "text-base font-semibold" : ""}>{score}</span>
              {size === "full" && <span className="mt-0.5 text-xs">{level.label}</span>}
            </label>
          </div>
        );
      })}
    </div>
  );
}
