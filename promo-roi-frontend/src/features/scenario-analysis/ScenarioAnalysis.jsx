import { useState } from "react";
import { ArrowRight, FileChartColumn, Plus, Search, X } from "lucide-react";
import PageHeading from "../../components/common/PageHeading";
import StatusBadge from "../../components/common/StatusBadge";
import { money, number, roiLabel } from "../../utils/roiCalculations";

export default function ScenarioAnalysis({
  scenarios, allScenarios, retailers, search, setSearch,
  statusFilter, setStatusFilter, regionFilter, setRegionFilter,
  compareIds, onToggleCompare, onNew, onEdit, calculateScenario,
}) {
  const [showComparison, setShowComparison] = useState(false);
  const selected = allScenarios.filter((s) => compareIds.includes(s.id));
  const regions = [
    "All regions",
    ...new Set(retailers.filter((r) => r.isActive).map((r) => r.region)),
  ];

  return (
    <>
      <PageHeading
        eyebrow="COMMERCIAL DECISIONS"
        title="Scenario analysis"
        subtitle="Search promotion scenarios, filter by decision or region, and compare the financial outcomes."
        action={<button className="primary-button" onClick={onNew}><Plus size={17} />New scenario</button>}
      />

      <section className="analysis-summary">
        {["Approve", "Review", "Reject"].map((decision) => (
          <div key={decision}>
            <span className="summary-label">{decision}</span>
            <strong>{scenarios.filter((s) => calculateScenario(s).verdict === decision).length}</strong>
          </div>
        ))}
        <div><span className="summary-label">Matching scenarios</span><strong>{scenarios.length}</strong></div>
      </section>

      <section className="table-card">
        <div className="table-card-header">
          <div><h2>Scenario register</h2><p>Newly saved scenarios appear here automatically.</p></div>
        </div>

        <div className="table-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scenario, product or account..." aria-label="Search scenarios" />
          </label>
          <select className="filter-select" value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by decision">
            <option>All statuses</option><option>Approve</option><option>Review</option><option>Reject</option>
          </select>
          <select className="filter-select" value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)} aria-label="Filter by retailer region">
            {regions.map((region) => <option key={region}>{region}</option>)}
          </select>
        </div>

        <div className="table-scroll">
          <table className="scenario-table">
            <thead><tr>
              <th>SCENARIO</th><th>PRODUCT / ACCOUNT</th><th>DISCOUNT / DURATION</th>
              <th>ROI</th><th>DECISION</th><th>COMPARE</th><th>ACTIONS</th>
            </tr></thead>
            <tbody>
              {scenarios.map((s) => {
                const r = calculateScenario(s);
                return (
                  <tr key={s.id}>
                    <td><div className="scenario-name">{s.name}</div>
                      <div className="scenario-id">{s.id}{s.isDemo ? " · Illustrative" : ""}</div></td>
                    <td>{s.product}<div className="scenario-id">{s.retailer}</div></td>
                    <td>{s.discount}% · {s.weeks} week{s.weeks === 1 ? "" : "s"}</td>
                    <td><span className={`roi-value ${r.roi < 0 ? "roi-negative" : "roi-positive"}`}>{roiLabel(r.roi)}</span></td>
                    <td><StatusBadge status={r.verdict} /></td>
                    <td><input type="checkbox" className="compare-checkbox"
                      checked={compareIds.includes(s.id)} onChange={() => onToggleCompare(s.id)}
                      aria-label={`Compare ${s.name}`}
                      disabled={!compareIds.includes(s.id) && compareIds.length >= 5} /></td>
                    <td><button className="row-action" onClick={() => onEdit(s)}
                      title="Open or edit scenario" aria-label={`Open ${s.name}`}><ArrowRight size={15} /></button></td>
                  </tr>
                );
              })}
              {!scenarios.length && <tr><td colSpan="7"><div className="empty-state">
                <Search size={22} /><strong>No matching scenarios</strong>
                <p>Change your filters or create a new scenario.</p>
              </div></td></tr>}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>{scenarios.length} matching scenarios · Select up to five to compare</span>
          <button className="primary-button" disabled={!selected.length}
            onClick={() => setShowComparison((old) => !old)}>
            <FileChartColumn size={16} />
            {showComparison ? "Hide comparison" : `Compare selected (${selected.length})`}
          </button>
        </div>
      </section>

      {showComparison && <section className="table-card comparison-card">
        <div className="table-card-header">
          <div><h2>Scenario comparison</h2><p>Selected assumptions and outcomes side by side.</p></div>
          <button className="text-button" onClick={() => setShowComparison(false)}>Close <X size={14} /></button>
        </div>
        <div className="table-scroll">
          <table className="scenario-table">
            <thead><tr>
              <th>SCENARIO</th><th>BASELINE → PROMO / WEEK</th><th>PROFIT WITHOUT</th>
              <th>PROFIT WITH</th><th>EXTRA PROFIT</th><th>PROMO COST</th><th>ROI</th><th>DECISION</th>
            </tr></thead>
            <tbody>{selected.map((s) => {
              const r = calculateScenario(s);
              return <tr key={s.id}>
                <td><div className="scenario-name">{s.name}</div><div className="scenario-id">{s.product} · {s.retailer}</div></td>
                <td>{number(s.baseline)} → {number(s.promo)}</td>
                <td>{money(r.profitWithout)}</td><td>{money(r.profitWith)}</td>
                <td className={r.extraProfit < 0 ? "roi-negative" : "roi-positive"}>{money(r.extraProfit)}</td>
                <td>{money(r.promoCost)}</td>
                <td className={r.roi < 0 ? "roi-negative" : "roi-positive"}>{roiLabel(r.roi)}</td>
                <td><StatusBadge status={r.verdict} /></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </section>}

      <footer className="page-footer">
        <span>Promo ROI Simulator</span>
        <span>50 product and 50 retailer reference records · Synthetic demo data</span>
      </footer>
    </>
  );
}
