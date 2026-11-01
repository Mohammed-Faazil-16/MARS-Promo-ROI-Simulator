/**
* Promo ROI calculation utilities.
*
* Formulas follow the MARS Promo ROI Simulator brief
* and the reference workbook.
*/
 
export const APPROVE_ROI_THRESHOLD = 20;
export const REVIEW_ROI_THRESHOLD = 0;
 
const REQUIRED_NUMERIC_FIELDS = [
  "price",
  "cost",
  "discount",
  "weeks",
  "baseline",
  "promo",
];
 
function toNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return Number.NaN;
  }
 
  return Number(value);
}
 
function invalidCalculationResult() {
  return {
    promoPrice: null,
    normalMargin: null,
    promoMargin: null,
    extraUnitsPerWeek: null,
    extraUnits: null,
    uplift: null,
    profitWithout: null,
    profitWith: null,
    extraProfit: null,
    promoCost: null,
    roi: null,
    roiIsMeasurable: false,
    roiReason: "Enter all six numeric inputs before calculating ROI.",
    breakEvenPromoUnits: null,
    verdict: "Review",
    verdictReason: "The scenario has incomplete or non-numeric inputs.",
    isCalculable: false,
  };
}
 
/**
* Calculates the commercial impact of a promotion.
*
* ROI = (Profit with offer - Profit without offer)
*       / Promotion cost * 100
*
* ROI is undefined when promotion cost is zero.
*/
 
export function calculateScenario(scenario = {}) {
  const values = Object.fromEntries(
    REQUIRED_NUMERIC_FIELDS.map((field) => [
      field,
      toNumber(scenario[field]),
    ]),
  );
 
  const hasFiniteInputs = Object.values(values).every(Number.isFinite);
 
  if (!hasFiniteInputs || values.weeks <= 0) {
    return invalidCalculationResult();
  }
 
  const {
    price,
    cost,
    discount,
    weeks,
    baseline,
    promo,
  } = values;
 
  // Promotional selling price.
  const promoPrice = price * (1 - discount / 100);
 
  // Contribution margin per unit.
  const normalMargin = price - cost;
  const promoMargin = promoPrice - cost;
 
  // Extra sales and uplift.
  const extraUnitsPerWeek = promo - baseline;
  const extraUnits = extraUnitsPerWeek * weeks;
 
  const uplift =
    baseline > 0
      ? (extraUnitsPerWeek / baseline) * 100
      : null;
 
  // Profit without promotion.
  const profitWithout =
    baseline * weeks * normalMargin;
 
  // Profit with promotion.
  const profitWith =
    promo * weeks * promoMargin;
 
  // Incremental profit.
  const extraProfit =
    profitWith - profitWithout;
 
  // Total discount investment.
  const discountPerUnit =
    price - promoPrice;
 
  const promoCost =
    discountPerUnit * promo * weeks;
 
  // ROI: do not invent a percentage when spend is zero.
  const roi =
    promoCost > 0
      ? (extraProfit / promoCost) * 100
      : null;
 
  const roiIsMeasurable =
    roi !== null && Number.isFinite(roi);
 
  // Break-even promotional sales per week.
  const breakEvenPromoUnits =
    promoMargin > 0
      ? profitWithout / promoMargin / weeks
      : null;
 
  // Decision based on the configured ROI thresholds.
  let verdict;
  let verdictReason;
 
  if (roiIsMeasurable) {
    if (roi >= APPROVE_ROI_THRESHOLD) {
      verdict = "Approve";
      verdictReason =
        `ROI meets the ${APPROVE_ROI_THRESHOLD}% approval threshold.`;
    } else if (roi >= REVIEW_ROI_THRESHOLD) {
      verdict = "Review";
      verdictReason =
        `ROI is positive but below the ${APPROVE_ROI_THRESHOLD}% approval threshold.`;
    } else {
      verdict = "Reject";
      verdictReason =
        "The promotion produces less profit than the no-offer scenario.";
    }
  } else if (extraProfit < 0) {
    verdict = "Reject";
    verdictReason =
      "Extra profit is negative; ROI cannot be measured because promotion cost is zero.";
  } else {
    verdict = "Review";
    verdictReason =
      "ROI cannot be measured because promotion cost is zero.";
  }
 
  return {
    promoPrice,
    normalMargin,
    promoMargin,
    extraUnitsPerWeek,
    extraUnits,
    uplift,
    profitWithout,
    profitWith,
    extraProfit,
    promoCost,
    roi,
    roiIsMeasurable,
 
    roiReason: roiIsMeasurable
      ? null
      : "ROI is not measurable because total promotion discount cost is zero.",
 
    breakEvenPromoUnits,
    verdict,
    verdictReason,
    isCalculable: true,
  };
}
 
export function money(value) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }
 
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}
 
export function number(value) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }
 
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(Number(value));
}
 
export function roiLabel(value) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "N/A";
  }
 
  const numericValue = Number(value);
 
  return `${numericValue > 0 ? "+" : ""}${numericValue.toFixed(1)}%`;
}
 
export function decisionFor(scenario) {
  return calculateScenario(scenario).verdict;
}