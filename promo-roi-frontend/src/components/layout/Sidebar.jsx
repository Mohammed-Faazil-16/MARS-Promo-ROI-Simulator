 
import {
  ArrowRight,
  Bookmark,
  CircleHelp,
  FileChartColumn,
  LayoutDashboard,
  Package,
  SlidersHorizontal,
  TrendingUp,
  X,
} from "lucide-react";
 
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Scenario Simulator", icon: SlidersHorizontal },
  { label: "Scenario Analysis", icon: FileChartColumn },
  { label: "Saved Scenarios", icon: Bookmark },
];
 
const reportingPeriods = [
  { label: "Last 1 month", value: "1m" },
  { label: "Last 3 months", value: "3m" },
  { label: "Last 6 months", value: "6m" },
  { label: "Last 1 year", value: "1y" },
  { label: "All time", value: "all" },
];
 
export default function Sidebar({
  activePage,
  mobileMenuOpen,
  setMobileMenuOpen,
  navigate,
  setNotice,
  isReportingFilterOpen,
  reportingPeriod,
  draftReportingPeriod,
  onOpenReportingFilters,
  onChangeReportingPeriod,
  onApplyReportingPeriod,
  onCloseReportingFilters,
  user,
}) {
  const closeSidebar = () => setMobileMenuOpen(false);
 
  // Generate initials from the logged-in user's name.
  const initials = (user?.name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
 
  return (
    <>
      {mobileMenuOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}
 
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Package size={22} strokeWidth={1.9} />
            <span className="brand-trend">
              <TrendingUp size={10} />
            </span>
          </div>
 
          <div className="brand-copy">
            <strong>Promo ROI</strong>
            <span>Simulator</span>
          </div>
 
          <button
            className="icon-button sidebar-close"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
 
        <div className="workspace-label">WORKSPACE</div>
 
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${
                activePage === label ? "nav-active" : ""
              }`}
              onClick={() => navigate(label)}
              aria-current={activePage === label ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {activePage === label && (
                <span className="active-indicator" />
              )}
            </button>
          ))}
        </nav>
 
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <CircleHelp size={18} />
            </div>
 
            <strong>Need a hand?</strong>
 
            <p>
              Compare the world without the offer with the world during the
              promotion.
            </p>
 
            <button
              className="help-link"
              onClick={() =>
                setNotice(
                  "Decision rule: ROI ≥ 20% = Approve; 0% to below 20% = Review; below 0% = Reject."
                )
              }
            >
              View decision rules <ArrowRight size={14} />
            </button>
          </div>
 
          <div className="sidebar-footer">
            <div className="avatar">{initials}</div>
 
            <div className="user-copy">
              <strong>{user?.name || "Workspace User"}</strong>
              <span>{user?.userId || "User ID"}</span>
            </div>
 
            <button
              className="icon-button"
              aria-label="Reporting filters"
              title="Reporting filters"
              aria-expanded={isReportingFilterOpen}
              onClick={onOpenReportingFilters}
            >
              <SlidersHorizontal size={17} />
            </button>
          </div>
        </div>
 
        {isReportingFilterOpen && (
          <section
            className="reporting-filter-panel"
            aria-label="Dashboard reporting period"
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              bottom: 82,
              zIndex: 60,
              padding: 16,
              border: "1px solid #e9e3e8",
              borderRadius: 12,
              background: "#ffffff",
              boxShadow: "0 12px 32px rgba(25, 32, 44, 0.16)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <strong style={{ color: "#272932", fontSize: 13 }}>
                Reporting period
              </strong>
 
              <button
                type="button"
                className="icon-button"
                aria-label="Close reporting filters"
                onClick={onCloseReportingFilters}
              >
                <X size={16} />
              </button>
            </div>
 
            <p
              style={{
                margin: "0 0 10px",
                color: "#777985",
                fontSize: 11,
              }}
            >
              Choose the date range for Dashboard insights.
            </p>
 
            <div style={{ display: "grid", gap: 7 }}>
              {reportingPeriods.map((period) => (
                <label
                  key={period.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "6px 2px",
                    color: "#272932",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="dashboard-reporting-period"
                    value={period.value}
                    checked={draftReportingPeriod === period.value}
                    onChange={() => onChangeReportingPeriod(period.value)}
                  />
 
                  {period.label}
 
                  {reportingPeriod === period.value && (
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "#008b75",
                        fontSize: 10,
                      }}
                    >
                      Applied
                    </span>
                  )}
                </label>
              ))}
            </div>
 
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 12,
                paddingTop: 10,
                borderTop: "1px solid #eeeeF2",
              }}
            >
              <button
                type="button"
                onClick={onCloseReportingFilters}
                style={{
                  border: "1px solid #d9d9e2",
                  borderRadius: 7,
                  padding: "7px 10px",
                  background: "#ffffff",
                  color: "#444653",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
 
              <button
                type="button"
                onClick={onApplyReportingPeriod}
                style={{
                  border: "1px solid #0000a0",
                  borderRadius: 7,
                  padding: "7px 11px",
                  background: "#0000a0",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Apply filter
              </button>
            </div>
          </section>
        )}
      </aside>
    </>
  );
}
 