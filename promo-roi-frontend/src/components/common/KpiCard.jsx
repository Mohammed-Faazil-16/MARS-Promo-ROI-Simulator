export default function KpiCard({ icon: Icon, label, value, note, tone }) {
  return (
    <article className="kpi-card">
      <div className="kpi-card-top">
        <span className={`kpi-icon kpi-${tone}`}>
          <Icon size={19} />
        </span>
 
        <span className="kpi-context">Overview</span>
      </div>
 
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-note">{note}</div>
    </article>
  );
}