 
/**
 * Scenario Service
 *
 * Handles scenario-related business logic.
 * React state management remains inside useScenarios.js.
 */
 
// Generate a unique scenario ID.
export function generateScenarioId() {
  return `SC-${Date.now()}`;
}
 
// Create a new scenario record.
export function createScenarioRecord(payload) {
  return {
    ...payload,
    id: generateScenarioId(),
    created: new Date().toISOString().slice(0, 10),
    isDemo: false,
  };
}
 
// Update an existing scenario record.
export function updateScenarioRecord(
  payload,
  existingScenario
) {
  return {
    ...payload,
    id: existingScenario.id,
    created:
      existingScenario.created ||
      new Date().toISOString().slice(0, 10),
    isDemo: false,
  };
}
 
// Remove a scenario by ID.
export function deleteScenarioRecord(scenarios, id) {
  return scenarios.filter(
    (scenario) => scenario.id !== id
  );
}
 
// Combine saved scenarios with demo scenarios.
export function mergeScenarios(
  savedScenarios,
  seedScenarios
) {
  const saved = savedScenarios.map((scenario) => ({
    ...scenario,
    isDemo: false,
  }));
 
  const savedIds = new Set(
    saved.map((scenario) => scenario.id)
  );
 
  const remainingDemoScenarios = seedScenarios.filter(
    (scenario) => !savedIds.has(scenario.id)
  );
 
  return [...saved, ...remainingDemoScenarios];
}
 