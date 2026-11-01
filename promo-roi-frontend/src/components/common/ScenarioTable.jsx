import StatusBadge from "./StatusBadge";
 
export default function ScenarioTable({
  scenarios,
  onOpen,
  calculateScenario,
  roiLabel,
}) {
  if (!scenarios.length) {
    return (
      <div className="empty-state">
        <strong>No scenarios yet</strong>
        <p>
          Create a scenario to start analysing promotion economics.
        </p>
      </div>
    );
  }
 
  return (
    <div className="table-scroll">
      <table className="scenario-table">
        <thead>
          <tr>
            <th>SCENARIO</th>
            <th>PRODUCT</th>
            <th>RETAILER / ACCOUNT</th>
            <th>ROI</th>
            <th>DECISION</th>
            <th>UPDATED</th>
            <th />
          </tr>
        </thead>
 
        <tbody>
          {scenarios.map((s) => {
            const r = calculateScenario(s);
 
            return (
              <tr key={s.id}>
                <td>
                  <div className="scenario-name">{s.name}</div>
                  <div className="scenario-id">
                    {s.id}{s.isDemo ? " · Demo" : ""}
                  </div>
                </td>
 
                <td>{s.product}</td>
                <td>{s.retailer}</td>
 
                <td>
                  <span
                    className={`roi-value ${
                      r.roi < 0 ? "roi-negative" : "roi-positive"
                    }`}
                  >
                    {roiLabel(r.roi)}
                  </span>
                </td>
 
                <td>
                  <StatusBadge status={r.verdict} />
                </td>
 
                <td className="date-cell">{s.created}</td>
 
                <td>
                  <button
                    className="row-action"
                    aria-label={`Open ${s.name}`}
                    onClick={() => onOpen(s)}
                  >
                    <span aria-hidden="true">→</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
