import {
  ArrowRight,
  Bookmark,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import PageHeading from "../../components/common/PageHeading";
import StatusBadge from "../../components/common/StatusBadge";

export default function SavedScenarios({
  scenarios,
  totalCount,
  search,
  setSearch,
  verdict,
  setVerdict,
  retailer,
  setRetailer,
  retailerOptions,
  onNew,
  onEdit,
  onDelete,
  calculateScenario,
  roiLabel,
}) {
  const approveCount = scenarios.filter(
    (scenario) => calculateScenario(scenario).verdict === "Approve"
  ).length;

  const reviewCount = scenarios.filter(
    (scenario) => calculateScenario(scenario).verdict === "Review"
  ).length;

  const rejectCount = scenarios.filter(
    (scenario) => calculateScenario(scenario).verdict === "Reject"
  ).length;

  return (
    <>
      <PageHeading
        eyebrow="SCENARIO LIBRARY"
        title="Saved scenarios"
        subtitle="Keep track of your promotion plans, reopen an assumption set, or remove a saved draft from this browser."
        action={
          <button className="primary-button" onClick={onNew}>
            <Plus size={17} />
            New scenario
          </button>
        }
      />

      <section className="analysis-summary saved-summary">
        <div>
          <span className="summary-label">Saved plans</span>
          <strong>{totalCount}</strong>
        </div>

        <div>
          <span className="summary-label">Approve</span>
          <strong>{approveCount}</strong>
        </div>

        <div>
          <span className="summary-label">Review</span>
          <strong>{reviewCount}</strong>
        </div>

        <div>
          <span className="summary-label">Reject</span>
          <strong>{rejectCount}</strong>
        </div>
      </section>

      <section className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Your scenario library</h2>
            <p>
              Only scenarios you have saved are listed here; illustrative
              examples remain in Scenario Analysis.
            </p>
          </div>

          <span className="period-pill">{scenarios.length} shown</span>
        </div>

        <div className="table-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, product, account or ID..."
              aria-label="Search saved scenarios"
            />
          </label>

          <select
            className="filter-select"
            value={verdict}
            onChange={(event) => setVerdict(event.target.value)}
            aria-label="Filter saved scenarios by decision"
          >
            <option>All decisions</option>
            <option>Approve</option>
            <option>Review</option>
            <option>Reject</option>
          </select>

          <select
            className="filter-select"
            value={retailer}
            onChange={(event) => setRetailer(event.target.value)}
            aria-label="Filter saved scenarios by account"
          >
            <option>All accounts</option>
            {retailerOptions.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>

          {(search ||
            verdict !== "All decisions" ||
            retailer !== "All accounts") && (
            <button
              className="text-button"
              onClick={() => {
                setSearch("");
                setVerdict("All decisions");
                setRetailer("All accounts");
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="table-scroll">
          <table className="scenario-table saved-scenarios-table">
            <thead>
              <tr>
                <th>SCENARIO</th>
                <th>PRODUCT / ACCOUNT</th>
                <th>DISCOUNT / DURATION</th>
                <th>ROI</th>
                <th>DECISION</th>
                <th>SAVED ON</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {scenarios.map((scenario) => {
                const result = calculateScenario(scenario);

                return (
                  <tr key={scenario.id}>
                    <td>
                      <div className="scenario-name">{scenario.name}</div>
                      <div className="scenario-id">{scenario.id}</div>
                    </td>

                    <td>
                      {scenario.product}
                      <div className="scenario-id">{scenario.retailer}</div>
                    </td>

                    <td>
                      {scenario.discount}% · {scenario.weeks} week
                      {scenario.weeks === 1 ? "" : "s"}
                    </td>

                    <td>
                      <span
                        className={`roi-value ${
                          result.roi < 0 ? "roi-negative" : "roi-positive"
                        }`}
                      >
                        {roiLabel(result.roi)}
                      </span>
                    </td>

                    <td>
                      <StatusBadge status={result.verdict} />
                    </td>

                    <td className="date-cell">{scenario.created || "—"}</td>

                    <td>
                      <div className="saved-row-actions">
                        <button
                          className="row-action"
                          onClick={() => onEdit(scenario)}
                          title="Open or edit scenario"
                          aria-label={`Open ${scenario.name}`}
                        >
                          <ArrowRight size={15} />
                        </button>

                        <button
                          className="row-action row-delete-action"
                          onClick={() => onDelete(scenario.id)}
                          title="Delete saved scenario"
                          aria-label={`Delete ${scenario.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!scenarios.length && (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <Bookmark size={23} />
                      <strong>
                        {totalCount
                          ? "No saved scenarios match"
                          : "Your saved library is empty"}
                      </strong>
                      <p>
                        {totalCount
                          ? "Try another search or clear the filters."
                          : "Create a scenario in the simulator, then save it to see it here."}
                      </p>

                      {totalCount ? (
                        <button
                          className="secondary-button"
                          onClick={() => {
                            setSearch("");
                            setVerdict("All decisions");
                            setRetailer("All accounts");
                          }}
                        >
                          Clear filters
                        </button>
                      ) : (
                        <button className="primary-button" onClick={onNew}>
                          <Plus size={16} />
                          Create your first scenario
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            {scenarios.length} saved scenario
            {scenarios.length === 1 ? "" : "s"} · Stored in this browser during
            the frontend demo
          </span>
        </div>
      </section>

      <footer className="page-footer">
        <span>Promo ROI Simulator</span>
        <span>
          Saved plans use browser storage until backend persistence is
          connected.
        </span>
      </footer>
    </>
  );
}
