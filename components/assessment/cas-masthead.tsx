export function CasMasthead({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="cas-masthead">
      <p className="cas-eyebrow">{eyebrow}</p>
      <h1 className="cas-title">{title}</h1>
      {subtitle && <p className="cas-subtitle">{subtitle}</p>}
    </div>
  );
}
