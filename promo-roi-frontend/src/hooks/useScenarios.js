import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
 
import {
  readStorage,
  writeStorage,
} from "../services/storageService";
 
import {
  createScenarioRecord,
  updateScenarioRecord,
  deleteScenarioRecord,
  mergeScenarios,
} from "../services/scenarioService";
 
// Load saved scenarios from browser storage.
function loadScenarios(storageKey) {
  const storedScenarios = readStorage(storageKey, []);
 
  return Array.isArray(storedScenarios)
    ? storedScenarios
    : [];
}
 
export function useScenarios({
  storageKey,
  seedScenarios = [],
}) {
  const [savedScenarios, setSavedScenarios] = useState(
    () => loadScenarios(storageKey)
  );
 
  const [compareIds, setCompareIds] = useState([]);
 
  // Persist scenario changes in localStorage.
  useEffect(() => {
    writeStorage(storageKey, savedScenarios);
  }, [storageKey, savedScenarios]);
 
  // Combine saved scenarios with demo scenarios.
  const scenarios = useMemo(
    () => mergeScenarios(savedScenarios, seedScenarios),
    [savedScenarios, seedScenarios]
  );
 
  // Create or update a scenario.
  const persistScenario = useCallback(
    (payload, editingId = null) => {
      const record = editingId
        ? updateScenarioRecord(payload, {
            id: editingId,
          })
        : createScenarioRecord(payload);
 
      setSavedScenarios((current) => {
        if (editingId) {
          return current.map((scenario) =>
            scenario.id === editingId
              ? {
                  ...record,
                  created: scenario.created || record.created,
                }
              : scenario
          );
        }
 
        return [record, ...current];
      });
 
      // Automatically select saved scenario for comparison.
      setCompareIds((current) =>
        current.includes(record.id)
          ? current
          : [...current, record.id].slice(-5)
      );
 
      return record;
    },
    []
  );
 
  // Delete a saved scenario.
  const removeScenario = useCallback((id) => {
    setSavedScenarios((current) =>
      deleteScenarioRecord(current, id)
    );
 
    setCompareIds((current) =>
      current.filter((selectedId) => selectedId !== id)
    );
  }, []);
 
  // Select or unselect a scenario for comparison.
  const toggleCompare = useCallback((id) => {
    setCompareIds((current) => {
      if (current.includes(id)) {
        return current.filter(
          (selectedId) => selectedId !== id
        );
      }
 
      if (current.length >= 5) {
        return current;
      }
 
      return [...current, id];
    });
  }, []);
 
  return {
    savedScenarios,
    scenarios,
    compareIds,
    persistScenario,
    removeScenario,
    toggleCompare,
  };
}