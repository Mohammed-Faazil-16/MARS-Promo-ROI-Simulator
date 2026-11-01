/**
* Shared Scenario Simulator validation.
* Prototype guardrails; production limits will come from backend.
*/
 
export const SCENARIO_LIMITS = {
  nameLength: 150,
  price: { min: 5, max: 2000 },
  cost: { min: 0.01, max: 1800 },
  discount: { min: 0, max: 60 },
  weeks: { min: 1, max: 52 },
  baseline: { min: 1, max: 50000 },
  promo: { min: 0, max: 100000 },
  warningUpliftPercent: 100,
  maxPromoToBaselineRatio: 10,
};
 
const numericValue = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return NaN;
  }
 
  return Number(value);
};
 
export function validateScenario(scenario = {}) {
  const errors = {};
  const warnings = [];
 
  const values = {
    price: numericValue(scenario.price),
    cost: numericValue(scenario.cost),
    discount: numericValue(scenario.discount),
    weeks: numericValue(scenario.weeks),
    baseline: numericValue(scenario.baseline),
    promo: numericValue(scenario.promo),
  };
 
  if (!String(scenario.name ?? "").trim()) {
    errors.name = "Enter a scenario name.";
  } else if (
    String(scenario.name).trim().length > SCENARIO_LIMITS.nameLength
  ) {
    errors.name = `Scenario name must be ${SCENARIO_LIMITS.nameLength} characters or fewer.`;
  }
 
  if (!scenario.productId || !String(scenario.product ?? "").trim()) {
    errors.productId = "Select a product from the reference list.";
  }
 
  if (!scenario.retailerId || !String(scenario.retailer ?? "").trim()) {
    errors.retailerId = "Select a retailer/account from the reference list.";
  }
 
  const rangeChecks = [
    ["price", "Normal selling price", false],
    ["cost", "Unit cost", false],
    ["discount", "Discount", false],
    ["weeks", "Promotion duration", true],
    ["baseline", "Baseline sales", true],
    ["promo", "Promotional sales", true],
  ];
 
  for (const [key, label, wholeNumber] of rangeChecks) {
    const value = values[key];
    const { min, max } = SCENARIO_LIMITS[key];
 
    if (!Number.isFinite(value)) {
      errors[key] = `Enter a valid ${label.toLowerCase()}.`;
      continue;
    }
 
    if (value < min || value > max) {
      errors[key] =
        `${label} must be between ${min.toLocaleString("en-IN")} and ${max.toLocaleString("en-IN")}` +
        `${key === "price" || key === "cost" ? " (₹)" : key === "discount" ? "%" : ""}.`;
      continue;
    }
 
    if (wholeNumber && !Number.isInteger(value)) {
      errors[key] = `${label} must be a whole number.`;
    }
  }
 
  if (Number.isFinite(values.price) && Number.isFinite(values.cost)) {
    if (values.cost >= values.price) {
      errors.cost = "Unit cost must be lower than the normal selling price.";
    }
  }
 
  let promoPrice = null;
 
  if (
    Number.isFinite(values.price) &&
    Number.isFinite(values.discount)
  ) {
    promoPrice = values.price * (1 - values.discount / 100);
 
    if (values.discount > 100) {
      errors.discount = "Discount cannot exceed 100%.";
    }
 
    if (
      Number.isFinite(values.cost) &&
      promoPrice <= values.cost
    ) {
      errors.discount =
        "This discount makes the promotional selling price equal to or lower than unit cost.";
    }
  }
 
  let upliftPercent = null;
 
  if (
    Number.isFinite(values.baseline) &&
    values.baseline > 0 &&
    Number.isFinite(values.promo)
  ) {
    upliftPercent =
      ((values.promo - values.baseline) / values.baseline) * 100;
 
    if (
      values.promo >
      values.baseline * SCENARIO_LIMITS.maxPromoToBaselineRatio
    ) {
      errors.promo =
        `Forecast exceeds ${SCENARIO_LIMITS.maxPromoToBaselineRatio} times baseline sales. Review the weekly units assumption.`;
    } else if (
      upliftPercent > SCENARIO_LIMITS.warningUpliftPercent
    ) {
      warnings.push(
        `Forecast uplift is ${upliftPercent.toFixed(1)}%, above the ${SCENARIO_LIMITS.warningUpliftPercent}% review threshold. Check this against historical product and retailer performance.`
      );
    }
 
    if (values.promo < values.baseline) {
      warnings.push(
        `Promotional sales are ${Math.abs(upliftPercent).toFixed(1)}% below baseline. This downside scenario is allowed, but review the forecast.`
      );
    }
  }
 
  if (Number.isFinite(values.discount) && values.discount > 40) {
    warnings.push(
      "High discount: review promotional margin and commercial approval requirements."
    );
  }
 
  if (Number.isFinite(values.weeks) && values.weeks > 26) {
    warnings.push(
      "Long promotion duration: confirm that this duration is commercially appropriate."
    );
  }
 
  return {
    errors,
    warnings,
    values,
    promoPrice,
    upliftPercent,
    isValid: Object.keys(errors).length === 0,
  };
}
 
export function hasScenarioValidationErrors(scenario) {
  return !validateScenario(scenario).isValid;
}