 
export const DASHBOARD_PERIODS = [
  { label: "Last 1 month", value: "1m", months: 1 },
  { label: "Last 3 months", value: "3m", months: 3 },
  { label: "Last 6 months", value: "6m", months: 6 },
  { label: "Last 1 year", value: "1y", months: 12 },
  { label: "All time", value: "all", months: null },
];
 
export function filterScenariosByPeriod(scenarios, period) {
  if (!Array.isArray(scenarios)) return [];
 
  if (period === "all") return scenarios;
 
  const selectedPeriod = DASHBOARD_PERIODS.find(
    (item) => item.value === period
  );
 
  if (!selectedPeriod) return scenarios;
 
  const today = new Date();
  const startDate = new Date(today);
 
  startDate.setMonth(
    startDate.getMonth() - selectedPeriod.months
  );
 
  return scenarios.filter((scenario) => {
    const scenarioDate = new Date(scenario.created);
 
    return (
      !Number.isNaN(scenarioDate.getTime()) &&
      scenarioDate >= startDate &&
      scenarioDate <= today
    );
  });
}
 