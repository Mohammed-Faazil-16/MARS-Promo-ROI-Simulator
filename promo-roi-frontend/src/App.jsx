import { useMemo, useState } from "react";
import PageHeading from "./components/common/PageHeading";
import StatusBadge from "./components/common/StatusBadge";
import KpiCard from "./components/common/KpiCard";
import ScenarioTable from "./components/common/ScenarioTable";
import Dashboard from "./features/dashboard/Dashboard";
import Simulator from "./features/simulator/Simulator";
import ScenarioAnalysis from "./features/scenario-analysis/ScenarioAnalysis";
import SavedScenarios from "./features/scenario-analysis/SavedScenarios";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./components/layout/LoginPage";
import {
  PRODUCTS,
  RETAILERS,
  SEED_SCENARIOS,
  STORAGE_KEY,
  EMPTY_FORM,
} from "./data";
import { useScenarios } from "./hooks/useScenarios";
import { useScenarioFilters } from "./hooks/useScenarioFilters";
import { calculateScenario, roiLabel } from "./utils/roiCalculations";
import { validateScenario } from "./utils/scenarioValidation";
import {
  DASHBOARD_PERIODS,
  filterScenariosByPeriod,
} from "./utils/dashboardDateFilter";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileChartColumn,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  TrendingUp,
  X,
  Save,
  RotateCcw,
  Store,
  Percent,
  Wallet,
  Trash2,
} from "lucide-react";
import "./App.css";
import ROIChart from "./components/charts/roiChart";

const NOTIFICATIONS_STORAGE_KEY = "promo_roi_notifications";

/*
 * Promo ROI Simulator — React frontend prototype
 * Product and retailer reference records below come from the supplied reference workbook.
 * Values and demo account assignments are illustrative synthetic data, not actual company data.
 * In the production build, FastAPI should own the authoritative calculations and SQL Server persistence.
 */

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  // Temporary frontend login session.
  // Only the user's name and User ID are stored; the password is never stored.
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("promo_roi_user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  // Notifications are stored separately from scenarios and the login session.
  const [notifications, setNotifications] = useState(() => {
    try {
      const storedNotifications = localStorage.getItem(
        NOTIFICATIONS_STORAGE_KEY
      );
      const parsed = storedNotifications ? JSON.parse(storedNotifications) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportingPeriod, setReportingPeriod] = useState("1y");
  const [draftReportingPeriod, setDraftReportingPeriod] = useState("1y");
  const [isReportingFilterOpen, setIsReportingFilterOpen] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);

  const [preview, setPreview] = useState(null);

  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All statuses");

  const [regionFilter, setRegionFilter] = useState("All regions");

  const [savedSearch, setSavedSearch] = useState("");

  const [savedVerdict, setSavedVerdict] = useState("All decisions");

  const [savedRetailer, setSavedRetailer] = useState("All accounts");

  const {
    savedScenarios,
    scenarios,
    compareIds,
    persistScenario,
    removeScenario,
    toggleCompare,
  } = useScenarios({
    storageKey: STORAGE_KEY,
    seedScenarios: SEED_SCENARIOS,
  });

  const {
    filteredScenarios,
    savedLibraryScenarios,
    savedRetailerOptions,
  } = useScenarioFilters({
    scenarios,
    search,
    statusFilter,
    regionFilter,
    retailers: RETAILERS,
    savedSearch,
    savedVerdict,
    savedRetailer,
  });

  const reportingScenarios = useMemo(
    () => filterScenariosByPeriod(scenarios, reportingPeriod),
    [scenarios, reportingPeriod]
  );

  const metrics = useMemo(() => {
    const computed = reportingScenarios.map((scenario) => ({
      ...scenario,
      ...calculateScenario(scenario),
    }));

    const count = (verdict) =>
      computed.filter((scenario) => scenario.verdict === verdict).length;

    const measurableRois = computed
      .map((scenario) => scenario.roi)
      .filter((value) => Number.isFinite(value));

    return {
      total: computed.length,
      approve: count("Approve"),
      review: count("Review"),
      reject: count("Reject"),
      averageRoi: measurableRois.length
        ? measurableRois.reduce((sum, value) => sum + value, 0) /
          measurableRois.length
        : null,
      totalExtraProfit: computed.reduce(
        (sum, scenario) => sum + scenario.extraProfit,
        0
      ),
    };
  }, [reportingScenarios]);

  const reportingPeriodLabel =
    DASHBOARD_PERIODS.find((period) => period.value === reportingPeriod)?.label ||
    "Last 1 year";

  function openReportingFilters() {
    setDraftReportingPeriod(reportingPeriod);
    setIsReportingFilterOpen(true);
  }

  function applyReportingPeriod() {
    setReportingPeriod(draftReportingPeriod);
    setIsReportingFilterOpen(false);
  }

  function closeReportingFilters() {
    setDraftReportingPeriod(reportingPeriod);
    setIsReportingFilterOpen(false);
  }

  function navigate(page) {
    setActivePage(page);
    setMobileMenuOpen(false);
    setNotice("");
  }

  function handleLogin(userDetails) {
    const loggedInUser = {
      name: userDetails.name,
      userId: userDetails.userId,
    };

    localStorage.setItem(
      "promo_roi_user",
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);
    setActivePage("Dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("promo_roi_user");
    setUser(null);
    setActivePage("Dashboard");
  }

  function addScenarioNotification(record, result) {
    const notification = {
      id: `${record.id}-${Date.now()}`,
      scenarioId: record.id,
      scenarioName: record.name || "Untitled scenario",
      verdict: result.verdict,
      roi: result.roi,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setNotifications((current) => {
      const updated = [notification, ...current];
      localStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(updated)
      );
      return updated;
    });
  }

  function markNotificationRead(notificationId) {
    setNotifications((current) => {
      const updated = current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      localStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(updated)
      );
      return updated;
    });
  }

  function markAllNotificationsRead() {
    setNotifications((current) => {
      const updated = current.map((notification) => ({
        ...notification,
        read: true,
      }));
      localStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(updated)
      );
      return updated;
    });
  }

  function openNotification(notification) {
    markNotificationRead(notification.id);

    const matchingScenario = scenarios.find(
      (scenario) => String(scenario.id) === String(notification.scenarioId)
    );

    if (matchingScenario) {
      editScenario(matchingScenario);
    } else {
      setNotice("This scenario is no longer available in your saved scenarios.");
    }
  }

  function startNewScenario() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setPreview(null);
    setNotice("");
    navigate("Scenario Simulator");
  }

  function selectProduct(id) {
    const product = PRODUCTS.find((p) => p.id === Number(id));
    if (!product) {
      setForm((old) => ({ ...old, productId: "", product: "" }));
      setPreview(null);
      return;
    }

    setForm((old) => ({
      ...old,
      productId: String(product.id),
      product: product.name,
    }));
    setPreview(null);
    setNotice(
      `${product.name} selected. Enter the retailer-specific selling price and unit cost; reference values are displayed for guidance only.`
    );
  }

  function selectRetailer(id) {
    const retailer = RETAILERS.find((r) => r.id === Number(id));

    setForm((old) => ({
      ...old,
      retailerId: retailer ? String(retailer.id) : "",
      retailer: retailer?.name || "",
    }));
  }

  function editScenario(s) {
    const product = PRODUCTS.find((p) => p.name === s.product);
    const retailer = RETAILERS.find((r) => r.name === s.retailer);

    setForm({
      name: s.name,
      productId: product ? String(product.id) : "",
      product: s.product,
      retailerId: retailer ? String(retailer.id) : "",
      retailer: s.retailer,
      price: String(s.price),
      cost: String(s.cost),
      discount: String(s.discount),
      weeks: String(s.weeks),
      baseline: String(s.baseline),
      promo: String(s.promo),
    });

    setEditingId(s.isDemo ? null : s.id);
    setPreview(calculateScenario(s));
    setNotice(
      s.isDemo
        ? "Demo examples are read-only. A copy will be created as a new scenario."
        : ""
    );

    if (s.isDemo) {
      setForm((old) => ({ ...old, name: `${s.name} — Copy` }));
    }

    navigate("Scenario Simulator");
  }

  function calculatePreview(payload) {
    const validation = validateScenario(payload);
    if (!validation.isValid) {
      setNotice(Object.values(validation.errors).join(" "));
      return;
    }

    setPreview(calculateScenario(payload));
    setNotice(
      validation.warnings.length
        ? `Preview calculated. Commercial review: ${validation.warnings.join(" ")}`
        : "Preview calculated. Review the result before saving the scenario."
    );
  }

  function saveScenario(payload) {
    const validation = validateScenario(payload);
    if (!validation.isValid) {
      setNotice(Object.values(validation.errors).join(" "));
      return;
    }

    const record = persistScenario(payload, editingId);
    const result = calculateScenario(record);
    setPreview(result);

    // Create a notification for a new scenario, not when an existing one is edited.
    if (!editingId) {
      addScenarioNotification(record, result);
    }

    setNotice(
      "Scenario saved. It is available in Saved Scenarios and Scenario Analysis."
    );
    setEditingId(record.id);
  }

  function deleteScenario(id) {
    const item = savedScenarios.find((s) => s.id === id);

    if (!item) return;

    const confirmed = window.confirm(
      `Delete “${item.name}” from your saved scenarios? This cannot be undone in this browser.`
    );

    if (!confirmed) return;

    removeScenario(id);
    setNotice("Saved scenario deleted from this browser.");
  }

  // Show the login page until a temporary frontend session exists.
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AppLayout
      user={user}
      onLogout={handleLogout}
      notifications={notifications}
      onNotificationRead={markNotificationRead}
      onMarkAllNotificationsRead={markAllNotificationsRead}
      onOpenNotification={openNotification}
      activePage={activePage}
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
      navigate={navigate}
      setNotice={setNotice}
      isReportingFilterOpen={isReportingFilterOpen}
      reportingPeriod={reportingPeriod}
      draftReportingPeriod={draftReportingPeriod}
      onOpenReportingFilters={openReportingFilters}
      onChangeReportingPeriod={setDraftReportingPeriod}
      onApplyReportingPeriod={applyReportingPeriod}
      onCloseReportingFilters={closeReportingFilters}
    >
      <>
        {notice && (
          <div
            className={`notice-banner ${
              /must|cannot|error|between|above|below|exceed|select/i.test(notice)
                ? "notice-warning"
                : ""
            }`}
            role="status"
          >
            {notice}
            <button
              className="clear-search"
              aria-label="Dismiss message"
              onClick={() => setNotice("")}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {activePage === "Dashboard" && (
          <Dashboard
            scenarios={reportingScenarios}
            metrics={metrics}
            reportingPeriod={reportingPeriod}
            reportingPeriodLabel={reportingPeriodLabel}
            onNew={startNewScenario}
            onNavigate={navigate}
            onOpen={editScenario}
            user={user}
          />
        )}

        {activePage === "Scenario Simulator" && (
          <Simulator
            form={form}
            setForm={setForm}
            preview={preview}
            products={PRODUCTS}
            retailers={RETAILERS}
            onProductChange={selectProduct}
            onRetailerChange={selectRetailer}
            onCalculate={calculatePreview}
            onSave={saveScenario}
            onClear={startNewScenario}
            onCancel={() => navigate("Scenario Analysis")}
            editing={Boolean(editingId)}
          />
        )}

        {activePage === "Scenario Analysis" && (
          <ScenarioAnalysis
            scenarios={filteredScenarios}
            allScenarios={scenarios}
            retailers={RETAILERS}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            regionFilter={regionFilter}
            setRegionFilter={setRegionFilter}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
            onNew={startNewScenario}
            onEdit={editScenario}
            calculateScenario={calculateScenario}
          />
        )}

        {activePage === "Saved Scenarios" && (
          <SavedScenarios
            scenarios={savedLibraryScenarios}
            totalCount={savedScenarios.length}
            search={savedSearch}
            setSearch={setSavedSearch}
            verdict={savedVerdict}
            setVerdict={setSavedVerdict}
            retailer={savedRetailer}
            setRetailer={setSavedRetailer}
            retailerOptions={savedRetailerOptions}
            onNew={startNewScenario}
            onEdit={editScenario}
            onDelete={deleteScenario}
            calculateScenario={calculateScenario}
            roiLabel={roiLabel}
          />
        )}
      </>
    </AppLayout>
  );
}
