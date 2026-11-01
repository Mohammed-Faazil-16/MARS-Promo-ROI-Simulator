export default function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}) {
  return (
    <section className="welcome-row">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
 
      {action}
    </section>
  );
}
 