const SCORES = [1, 2, 3, 4] as const;

/**
 * Editable-table score cell — a plain native <select>, matching the
 * ledger-style assessment record the user asked to match exactly (dropdown
 * cells in a table, not tap-target buttons).
 */
export function ScoreSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: number | null | undefined;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      className="cas-select"
    >
      <option value="">–</option>
      {SCORES.map((score) => (
        <option key={score} value={score}>
          {score}
        </option>
      ))}
    </select>
  );
}
