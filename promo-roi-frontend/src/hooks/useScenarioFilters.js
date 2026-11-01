import { useMemo } from "react";
import { decisionFor } from "../utils/roiCalculations";
 
/**
* Centralized filtering for Scenario Analysis
* and Saved Scenarios.
*/
 
export function useScenarioFilters({
  scenarios = [],
  search = "",
  statusFilter = "All statuses",
  regionFilter = "All regions",
  retailers = [],
  savedSearch = "",
  savedVerdict = "All decisions",
  savedRetailer = "All accounts",
}) {
  const filteredScenarios = useMemo(() => {
    const query = search.trim().toLowerCase();
 
    return scenarios.filter((scenario) => {
      const retailer =
        retailers.find(
          (item) => item.id === Number(scenario.retailerId)
        ) ||
        retailers.find(
          (item) => item.name === scenario.retailer
        );
 
      const matchesSearch =
        !query ||
        [
          scenario.id,
          scenario.name,
          scenario.product,
          scenario.retailer,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
 
      const matchesStatus =
        statusFilter === "All statuses" ||
        decisionFor(scenario) === statusFilter;
 
      const matchesRegion =
        regionFilter === "All regions" ||
        (retailer?.region || "Other") === regionFilter;
 
      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [scenarios, search, statusFilter, regionFilter, retailers]);
 
  const savedLibraryScenarios = useMemo(() => {
    const query = savedSearch.trim().toLowerCase();
 
    return scenarios
      .filter((scenario) => {
        const matchesSearch =
          !query ||
          [
            scenario.id,
            scenario.name,
            scenario.product,
            scenario.retailer,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
 
        const matchesVerdict =
          savedVerdict === "All decisions" ||
          decisionFor(scenario) === savedVerdict;
 
        const matchesRetailer =
          savedRetailer === "All accounts" ||
          scenario.retailer === savedRetailer;
 
        return matchesSearch && matchesVerdict && matchesRetailer;
      })
      .sort((a, b) =>
        (b.created || "").localeCompare(a.created || "")
      );
  }, [scenarios, savedSearch, savedVerdict, savedRetailer]);
 
  const savedRetailerOptions = useMemo(
    () =>
      [...new Set(
        scenarios
          .map((scenario) => scenario.retailer)
          .filter(Boolean)
      )].sort(),
    [scenarios]
  );
 
  return {
    filteredScenarios,
    savedLibraryScenarios,
    savedRetailerOptions,
  };
}