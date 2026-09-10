export function CasMasthead({
  eyebrow,
  title,
  subtitle,
  identity,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** School/Class/Section/Subject/Student/Roll-style fields, shown as a
   * read-only panel below the title — matches the reference ledger's
   * identity block. Values come from real records, so they're display-only
   * rather than editable inputs. */
  identity?: { label: string; value: string }[];
}) {
  return (
    <div className="cas-masthead">
      <p className="cas-eyebrow">{eyebrow}</p>
      <h1 className="cas-title">{title}</h1>
      {subtitle && <p className="cas-subtitle">{subtitle}</p>}
      {identity && identity.length > 0 && (
        <div className="cas-identity">
          {identity.map((f) => (
            <div key={f.label} className="cas-identity-field">
              <label>{f.label}</label>
              <div className="value">{f.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
