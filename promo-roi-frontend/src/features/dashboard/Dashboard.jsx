import { useMemo, useState } from "react";

import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  Plus,
  ShieldAlert,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import PageHeading from "../../components/common/PageHeading";
import KpiCard from "../../components/common/KpiCard";
import ScenarioTable from "../../components/common/ScenarioTable";
import ROIChart from "../../components/charts/roiChart";
import {
  calculateScenario,
  money,
  roiLabel,
} from "../../utils/roiCalculations";

/**
 * Compact donut chart showing the distribution of scenario decisions.
 * Counts are supplied by App.jsx and use the currently selected period.
 */
function DecisionDonut({ decisions, total }) {
  const [activeDecision, setActiveDecision] = useState(null);
  const colors = {
    Approve: 'url(#marsApproveGradient)',
    Review: 'url(#marsReviewGradient)',
    Reject: 'url(#marsRejectGradient)',
  };
  const selected = activeDecision
    ? decisions.find((item) => item.label === activeDecision)
    : null;

  let cumulative = 0;
  const segments = decisions.map((decision) => {
    const percentage = total > 0 ? (decision.count / total) * 100 : 0;
    const segment = { ...decision, percentage, offset: cumulative };
    cumulative += percentage;
    return segment;
  });

  return (
    <div className="mars-donut-layout">
      <div className="mars-donut-visual">
        <div className="mars-donut-chart-wrap">
          <svg
            className="mars-donut-svg"
            viewBox="0 0 120 120"
            role="img"
            aria-label={`Decision breakdown: ${total} scenarios`}
          >
            <defs>
              <linearGradient id="marsApproveGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00D7B9"/><stop offset="100%" stopColor="#008F83"/></linearGradient>
              <linearGradient id="marsReviewGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFDC00"/><stop offset="100%" stopColor="#E8A900"/></linearGradient>
              <linearGradient id="marsRejectGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FF6B55"/><stop offset="100%" stopColor="#FF3C14"/></linearGradient>
            </defs>
            <circle cx="60" cy="60" r="43" fill="none" stroke="#EEEAF2" strokeWidth="13" />
            {total <= 0 && (
              <text x="60" y="64" textAnchor="middle" fontSize="8" fill="#858895">
                NO DATA
              </text>
            )}
            {segments.map((decision, index) => {
              if (decision.percentage <= 0) return null;
              const active = activeDecision === decision.label;
              return (
                <circle
                  key={decision.label}
                  className={`mars-donut-segment ${active ? 'is-active' : ''}`}
                  cx="60"
                  cy="60"
                  r="43"
                  pathLength="100"
                  fill="none"
                  stroke={colors[decision.label]}
                  strokeWidth={active ? 17 : 13}
                  strokeDasharray={`${decision.percentage} 100`}
                  strokeDashoffset={-decision.offset}
                  strokeLinecap="butt"
                  transform="rotate(-90 60 60)"
                  style={{
                    opacity: activeDecision && !active ? 0.45 : 1,
                    animation: `marsDonutReveal 1s cubic-bezier(.22,.8,.25,1) ${index * 0.16}s both`,
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${decision.label}: ${decision.count} scenarios, ${Math.round(decision.percentage)} percent`}
                  onMouseEnter={() => setActiveDecision(decision.label)}
                  onMouseLeave={() => setActiveDecision(null)}
                  onFocus={() => setActiveDecision(decision.label)}
                  onBlur={() => setActiveDecision(null)}
                  onClick={() => setActiveDecision((current) => current === decision.label ? null : decision.label)}
                >
                  <animate
                    attributeName="stroke-dasharray"
                    from="0 100"
                    to={`${decision.percentage} 100`}
                    dur="1s"
                    begin={`${index * 0.16}s`}
                    fill="freeze"
                  />
                  <title>{`${decision.label}: ${decision.count} scenarios (${Math.round(decision.percentage)}%)`}</title>
                </circle>
              );
            })}
            <circle cx="60" cy="60" r="32" fill="#FFFFFF" />
            <text x="60" y="56" textAnchor="middle" className="mars-donut-total">
              {selected ? selected.count : total}
            </text>
            <text x="60" y="73" textAnchor="middle" className="mars-donut-label">
              {selected ? selected.label.toUpperCase() : 'SCENARIOS'}
            </text>
          </svg>
        </div>
        <span className="mars-chart-hint">Hover or tap a segment to inspect decisions</span>
      </div>

      <div className="mars-donut-legend">
        {segments.map((decision) => {
          const percentage = total ? Math.round(decision.percentage) : 0;
          const active = activeDecision === decision.label;
          return (
            <button
              type="button"
              key={decision.label}
              className={`mars-decision-item ${active ? 'is-active' : ''}`}
              style={{ '--decision-color': decision.label === 'Approve' ? '#00BFA5' : decision.label === 'Review' ? '#E8B900' : '#FF3C14' }}
              onMouseEnter={() => setActiveDecision(decision.label)}
              onMouseLeave={() => setActiveDecision(null)}
              onFocus={() => setActiveDecision(decision.label)}
              onBlur={() => setActiveDecision(null)}
              onClick={() => setActiveDecision((current) => current === decision.label ? null : decision.label)}
            >
              <span className="mars-decision-name"><i />{decision.label}</span>
              <strong>{decision.count}</strong>
              <small>{percentage}% of scenarios</small>
              <span className="mars-decision-track">
                <i style={{ width: `${percentage}%` }} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mars-decision-detail" aria-live="polite">
        {selected
          ? `${selected.label}: ${selected.count} scenarios (${total ? Math.round(selected.percentage) : 0}% of the selected period).`
          : 'Choose a decision category to see its share of the selected period.'}
      </div>
    </div>
  );
}

/**
 * Monthly average ROI based on scenario creation dates.
 * Hover, focus or tap a point to inspect the month and average ROI.
 */
function PerformanceTrend({ scenarios }) {
  const [activeKey, setActiveKey] = useState(null);

  const points = useMemo(() => {
    const monthlyData = {};
    scenarios.forEach((scenario) => {
      if (!scenario.created) return;
      const date = new Date(`${scenario.created}T00:00:00`);
      if (Number.isNaN(date.getTime())) return;
      const result = calculateScenario(scenario);
      if (!Number.isFinite(result?.roi)) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[key]) monthlyData[key] = { total: 0, count: 0, date };
      monthlyData[key].total += result.roi;
      monthlyData[key].count += 1;
    });
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        key,
        label: value.date.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        roi: value.total / value.count,
        count: value.count,
      }));
  }, [scenarios]);

  if (!points.length) {
    return <div style={{ padding: "26px 10px", textAlign: "center", color: "#777", fontSize: 13 }}>No valid monthly ROI data in this reporting period.</div>;
  }

  const left = 34;
  const right = 460;
  const top = 20;
  const bottom = 174;
  const values = points.map((point) => point.roi);
  let minValue = Math.min(0, ...values);
  let maxValue = Math.max(0, ...values);
  if (minValue === maxValue) { minValue -= 1; maxValue += 1; }
  const padding = (maxValue - minValue) * 0.12;
  minValue -= padding;
  maxValue += padding;
  const range = maxValue - minValue;
  const coordinates = points.map((point, index) => ({
    ...point,
    x: points.length === 1 ? (left + right) / 2 : left + (index / (points.length - 1)) * (right - left),
    y: bottom - ((point.roi - minValue) / range) * (bottom - top),
  }));
  const active = coordinates.find((point) => point.key === activeKey) || coordinates[coordinates.length - 1];
  const linePoints = coordinates.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, margin: "2px 2px 8px" }}>
        <div style={{ fontSize: 12, color: "#777" }}>Monthly average promotion ROI</div>
        <div style={{ borderRadius: 8, background: "#F1F2FA", color: "#0000A0", padding: "7px 10px", fontSize: 12, fontWeight: 700 }} aria-live="polite">
          {active.label}: {active.roi >= 0 ? "+" : ""}{active.roi.toFixed(1)}%
          <span style={{ display: "block", color: "#777", fontSize: 10, fontWeight: 400 }}>{active.count} scenario{active.count === 1 ? "" : "s"}</span>
        </div>
      </div>
      <svg viewBox="0 0 490 215" width="100%" role="img" aria-label="Interactive monthly average ROI trend" style={{ display: "block", overflow: "visible" }}>
        {[0, 1, 2, 3].map((index) => {
          const y = top + (index / 3) * (bottom - top);
          const value = maxValue - (index / 3) * range;
          return (
            <g key={index}>
              <line x1={left} y1={y} x2={right} y2={y} stroke="#E9E7E1" strokeDasharray="4 5" />
              <text x="27" y={y + 4} textAnchor="end" fontSize="10" fill="#858585">{value.toFixed(0)}%</text>
            </g>
          );
        })}
        {coordinates.length > 1 && <polyline points={linePoints} fill="none" stroke="#0000A0" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
        {coordinates.map((point, index) => (
          <g key={point.key} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={`${point.label}: ${point.roi.toFixed(1)} percent average ROI across ${point.count} scenarios`} onMouseEnter={() => setActiveKey(point.key)} onMouseLeave={() => setActiveKey(null)} onFocus={() => setActiveKey(point.key)} onBlur={() => setActiveKey(null)} onClick={() => setActiveKey((current) => current === point.key ? null : point.key)}>
            <circle cx={point.x} cy={point.y} r="12" fill="transparent" />
            <circle cx={point.x} cy={point.y} r={activeKey === point.key ? 7 : 5} fill="#FF32A0" stroke="#0000A0" strokeWidth="2.5" />
            <title>{`${point.label}: ${point.roi.toFixed(1)}% average ROI (${point.count} scenarios)`}</title>
            {(index === 0 || index === coordinates.length - 1 || coordinates.length <= 7) && (
              <text x={point.x} y="198" textAnchor="middle" fontSize="10" fill="#777">{point.label}</text>
            )}
          </g>
        ))}
      </svg>
      <div style={{ fontSize: 11, color: "#777", textAlign: "center", marginTop: 2 }}>Hover, focus or tap a point to view monthly details.</div>
    </div>
  );
}

/**
 * Dashboard presentation only.
 * App.jsx owns the applied reporting-period state, filters the scenario list,
 * and calculates the corresponding metrics. This component must not maintain
 * a second reporting-period state or filter the scenarios a second time.
 */
export default function Dashboard({
  scenarios = [],
  metrics,
  reportingPeriodLabel = "Last 1 year",
  onNew,
  onNavigate,
  onOpen,
  user,
}) {
  const visibleScenarios = Array.isArray(scenarios) ? scenarios : [];
  const dashboardMetrics = metrics || {
    total: 0,
    approve: 0,
    review: 0,
    reject: 0,
    averageRoi: null,
    totalExtraProfit: 0,
  };

  // Sort all scenarios matching the selected reporting period.
  const sortedScenarios = [...visibleScenarios].sort((a, b) =>
    String(b.created || "").localeCompare(String(a.created || ""))
  );

  // Keep only the five latest for the Recent Scenarios table.
  const recent = sortedScenarios.slice(0, 5);

  const decisionCounts = [
    { label: "Approve", count: dashboardMetrics.approve, color: "green" },
    { label: "Review", count: dashboardMetrics.review, color: "amber" },
    { label: "Reject", count: dashboardMetrics.reject, color: "red" },
  ];

  return (
    <>
      <style>{`
        .mars-dashboard-analytics {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(320px, .85fr);
          gap: 18px;
          align-items: start;
          margin: 0 0 20px;
        }
        .mars-roi-column, .mars-insights-column {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
        }
        .mars-insight-card {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: 18px;
          overflow: hidden;
        }
        .mars-insight-card .table-card-header { margin-bottom: 8px; }
        .mars-donut-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          justify-items: stretch;
          align-items: center;
          gap: 14px;
          width: 100%;
          min-width: 0;
          padding: 12px 0 8px;
          box-sizing: border-box;
        }
        .mars-donut-visual {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          min-width: 0;
        }
        .mars-donut-chart-wrap {
          display: grid;
          place-items: center;
          width: 184px;
          height: 184px;
          max-width: 100%;
          flex: 0 0 auto;
        }
        .mars-donut-svg {
          display: block;
          width: 184px;
          height: 184px;
          max-width: 100%;
          overflow: hidden;
        }
        .mars-donut-total {
          font-size: 21px;
          font-weight: 800;
          fill: #292936;
          dominant-baseline: middle;
        }
        .mars-donut-label {
          font-size: 7px;
          font-weight: 700;
          letter-spacing: .55px;
          fill: #777985;
          dominant-baseline: middle;
        }
        .mars-donut-segment {
          cursor: pointer;
          transition: stroke-width .18s ease, opacity .18s ease;
          outline: none;
        }
        @keyframes marsDonutReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .mars-donut-segment:hover,
        .mars-donut-segment:focus,
        .mars-donut-segment.is-active {
          stroke-width: 17px;
          opacity: .92;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,.18));
        }
        .mars-chart-hint { color: #858895; font-size: 10px; text-align: center; }
        .mars-donut-legend {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          width: 100%;
          min-width: 0;
        }
        .mars-decision-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 5px;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
          padding: 10px 9px;
          text-align: left;
          border: 1px solid #eee8ef;
          border-radius: 9px;
          background: #fff;
          cursor: pointer;
          color: #30313b;
          transition: border-color .18s ease, background .18s ease, transform .18s ease;
        }
        .mars-decision-item:hover,
        .mars-decision-item.is-active {
          border-color: var(--decision-color);
          background: color-mix(in srgb, var(--decision-color) 9%, white);
          transform: translateY(-1px);
        }
        .mars-decision-name {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
        }
        .mars-decision-name i {
          display: inline-block;
          width: 7px;
          height: 7px;
          flex: 0 0 7px;
          border-radius: 50%;
          background: var(--decision-color);
        }
        .mars-decision-item strong { font-size: 17px; line-height: 1.1; font-variant-numeric: tabular-nums; }
        .mars-decision-item small { color: #777985; font-size: 9px; }
        .mars-decision-track { height: 5px; display: block; overflow: hidden; width: 100%; border-radius: 20px; background: #f0eef2; }
        .mars-decision-track i { height: 100%; display: block; border-radius: inherit; background: var(--decision-color); transition: width .45s ease; }
        .mars-decision-detail {
          min-height: 34px;
          display: flex;
          align-items: center;
          width: 100%;
          box-sizing: border-box;
          padding: 9px 11px;
          border-radius: 8px;
          background: #f5f3fb;
          color: #68616b;
          font-size: 10px;
          line-height: 1.45;
        }
        .mars-insight-card .decision-rule {
          display: flex;
          gap: 7px;
          align-items: flex-start;
          margin-top: 5px;
          padding: 10px;
          border-radius: 8px;
          background: #f7f6fa;
          font-size: 10px;
          line-height: 1.45;
        }
        .mars-trend-card { align-self: start; }
        .mars-trend-card svg { max-width: 100%; }
        .mars-view-all-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          align-self: flex-start;
          padding: 9px 12px;
          color: #0000a0;
          background: #eeeeff;
          border: 1px solid #dcdcff;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }
        .mars-view-all-link:hover { background: #e5e5ff; }
        @media (max-width: 1100px) {
          .mars-dashboard-analytics { grid-template-columns: minmax(0, 1fr); }
          .mars-insights-column { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
        }
        @media (max-width: 680px) {
          .mars-insights-column { display: flex; }
          .mars-donut-legend { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .mars-donut-chart-wrap, .mars-donut-svg { width: 164px; height: 164px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mars-donut-segment { transition: none; animation: none !important; }
          .mars-donut-segment animate { display: none; }
        }
      `}</style>
      <div className="dashboard-welcome">
        <span>WELCOME BACK</span>
        <h2>
          {user?.name?.trim()?.split(/\\s+/)[0] || user?.userId || "there"}
        </h2>
      </div>

      <PageHeading
        eyebrow="PROMOTION PERFORMANCE"
        title="Make every promotion count."
        subtitle="Understand incremental profit, promotion cost and ROI before committing to an offer."
        action={
          <button className="primary-button" onClick={onNew}>
            <Plus size={17} />
            New scenario
          </button>
        }
      />

      <section className="insight-banner">
        <div className="insight-icon">
          <Target size={21} />
        </div>
        <div className="insight-copy">
          <strong>Sales uplift is not the whole story.</strong>
          <p>
            Compare profit without the offer against profit with the offer to
            assess the true financial impact.
          </p>
        </div>
        <button className="banner-link" onClick={onNew}>
          Run a simulation
          <ArrowRight size={15} />
        </button>
      </section>

      <section className="section-heading">
        <div>
          <h2>Performance overview</h2>
          <p>
            Showing {dashboardMetrics.total} scenarios for {reportingPeriodLabel.toLowerCase()}.
          </p>
        </div>
        <span className="period-pill">
          <Clock3 size={13} />
          {reportingPeriodLabel}
        </span>
      </section>

      <section className="kpi-grid">
        <KpiCard
          icon={Boxes}
          label="Total scenarios"
          value={dashboardMetrics.total}
          note={`Created in ${reportingPeriodLabel.toLowerCase()}`}
          tone="blue"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Approve"
          value={dashboardMetrics.approve}
          note="ROI ≥ 20%"
          tone="green"
        />
        <KpiCard
          icon={TrendingUp}
          label="Average ROI"
          value={roiLabel(dashboardMetrics.averageRoi)}
          note="Across selected scenarios"
          tone="purple"
        />
        <KpiCard
          icon={Wallet}
          label="Total extra profit"
          value={money(dashboardMetrics.totalExtraProfit)}
          note="Combined incremental profit"
          tone={dashboardMetrics.totalExtraProfit >= 0 ? "green" : "amber"}
        />
      </section>

      <section className="mars-dashboard-analytics">
        <div className="mars-roi-column">
          <ROIChart
            scenarios={sortedScenarios}
            title="ROI by scenario"
            description={`Top 8 of ${visibleScenarios.length} scenarios for ${reportingPeriodLabel.toLowerCase()}.`}
            maxItems={8}
          />
          <button
            type="button"
            className="mars-view-all-link"
            onClick={() => onNavigate("Scenario Analysis")}
          >
            Explore all scenarios in Scenario Analysis <ArrowRight size={15} />
          </button>
        </div>

        <div className="mars-insights-column">
          <section className="table-card mars-insight-card">
            <div className="table-card-header">
              <div>
                <h2>Decision breakdown</h2>
                <p>How scenarios performed against the ROI threshold</p>
              </div>
            </div>
            <DecisionDonut decisions={decisionCounts} total={dashboardMetrics.total} />
            <div className="decision-rule">
              <ShieldAlert size={15} />
              <span>Approve ≥ 20% · Review 0–19.9% · Reject below 0%</span>
            </div>
          </section>

          <section className="table-card mars-insight-card mars-trend-card">
            <div className="table-card-header">
              <div>
                <h2>Performance trend</h2>
                <p>Monthly average promotion ROI</p>
              </div>
              <TrendingUp size={19} color="#0000A0" />
            </div>
            <PerformanceTrend scenarios={visibleScenarios} />
          </section>
        </div>
      </section>

      <section className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Recent scenarios</h2>
            <p>Latest scenarios within the selected reporting period.</p>
          </div>
          <button
            className="text-button"
            onClick={() => onNavigate("Scenario Analysis")}
          >
            View all
            <ArrowRight size={15} />
          </button>
        </div>

        {recent.length > 0 ? (
          <ScenarioTable
            scenarios={recent}
            onOpen={onOpen}
            calculateScenario={calculateScenario}
            roiLabel={roiLabel}
          />
        ) : (
          <p className="empty-state">
            No scenarios were created during {reportingPeriodLabel.toLowerCase()}.
            Try a wider reporting period or create a new scenario.
          </p>
        )}

        <div className="table-footer">
          <span>
            Showing {recent.length} of {visibleScenarios.length} scenarios
          </span>
          <button
            className="text-button"
            onClick={() => onNavigate("Scenario Analysis")}
          >
            Open scenario analysis
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      <footer className="page-footer">
        <span>Promo ROI Simulator</span>
        <span>Reference values are illustrative synthetic data.</span>
      </footer>
    </>
  );
}
