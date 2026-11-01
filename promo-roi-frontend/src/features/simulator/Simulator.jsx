import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileChartColumn,
  Info,
  Package,
  RotateCcw,
  Save,
  Store,
} from "lucide-react";

import PageHeading from "../../components/common/PageHeading";
import ResultBreakdown from "../../components/common/ResultBreakdown";
import { money, number, roiLabel } from "../../utils/roiCalculations";
import { SCENARIO_LIMITS, validateScenario } from "../../utils/scenarioValidation";
import { getActiveProducts, getProductById } from "../../services/productService";

const FIELD_RULES = [
  { key: "price", label: "Normal selling price (₹)", hint: "Customer-entered regular selling price per unit.", min: SCENARIO_LIMITS.price.min, max: SCENARIO_LIMITS.price.max, step: 0.01 },
  { key: "cost", label: "Unit cost (₹)", hint: "Customer-entered cost per unit to the company.", min: SCENARIO_LIMITS.cost.min, max: SCENARIO_LIMITS.cost.max, step: 0.01 },
  { key: "discount", label: "Discount (%)", hint: "Discount offered to the shopper.", min: SCENARIO_LIMITS.discount.min, max: SCENARIO_LIMITS.discount.max, step: 0.5 },
  { key: "weeks", label: "Duration (weeks)", hint: "Whole weeks.", min: SCENARIO_LIMITS.weeks.min, max: SCENARIO_LIMITS.weeks.max, step: 1 },
  { key: "baseline", label: "Baseline sales (units / week)", hint: "Expected weekly units without the offer.", min: SCENARIO_LIMITS.baseline.min, max: SCENARIO_LIMITS.baseline.max, step: 1 },
  { key: "promo", label: "Promo sales (units / week)", hint: "Expected weekly units during the offer; zero is allowed.", min: SCENARIO_LIMITS.promo.min, max: SCENARIO_LIMITS.promo.max, step: 1 },
];

export default function Simulator({
  form,
  setForm,
  preview,
  retailers,
  onProductChange,
  onRetailerChange,
  onCalculate,
  onSave,
  onClear,
  onCancel,
  editing,
}) {
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const update = (key, value) => {
    setForm((old) => ({ ...old, [key]: value }));
  };

  const activeProducts = getActiveProducts();
  const selectedProduct = getProductById(form.productId);
  const activeRetailers = retailers.filter((retailer) => retailer.isActive);
  const selectedRetailer = retailers.find(
    (retailer) => retailer.id === Number(form.retailerId),
  );

  const validation = useMemo(() => validateScenario(form), [form]);
  const showIssues = attemptedSubmit;

  const buildPayload = () => ({
    name: form.name.trim(),
    product: form.product,
    productId: form.productId || null,
    retailer: form.retailer,
    retailerId: form.retailerId || null,
    price: validation.values.price,
    cost: validation.values.cost,
    discount: validation.values.discount,
    weeks: validation.values.weeks,
    baseline: validation.values.baseline,
    promo: validation.values.promo,
  });

  const submit = (event) => {
    event?.preventDefault();
    setAttemptedSubmit(true);
    if (!validation.isValid) return;
    onCalculate(buildPayload());
  };

  const save = () => {
    setAttemptedSubmit(true);
    if (!validation.isValid) return;
    onSave(buildPayload());
  };

  const clear = () => {
    setAttemptedSubmit(false);
    onClear();
  };

  return (
    <>
      <PageHeading
        eyebrow="COMMERCIAL INPUTS"
        title={editing ? "Edit promotion scenario" : "Scenario simulator"}
        subtitle="Enter account-specific assumptions, validate the commercial inputs and review the estimated promotion economics."
        action={
          <button className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
        }
      />

      <div className="simulator-grid">
        <section className="table-card form-card">
          <div className="table-card-header">
            <div>
              <h2>Scenario inputs</h2>
              <p>Required inputs · reference dataset linked</p>
            </div>
            <span className="period-pill">Step 1 of 2</span>
          </div>

          <form onSubmit={submit} noValidate>
            <div className="form-section">
              <h3>Scenario details</h3>
              <label className="form-field">
                <span>Scenario name *</span>
                <input
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  maxLength={150}
                  placeholder="Give this promotion a descriptive name"
                  required
                />
                {showIssues && validation.errors.name && <small className="field-error">{validation.errors.name}</small>}
              </label>

              <label className="form-field">
                <span>Product *</span>
                <select
                  value={form.productId}
                  onChange={(event) => onProductChange(event.target.value)}
                  required
                >
                  <option value="">Select an active product</option>
                  {activeProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · {product.category}
                    </option>
                  ))}
                </select>
                {showIssues && validation.errors.productId && <small className="field-error">{validation.errors.productId}</small>}
              </label>

              {selectedProduct && (
                <div className="reference-strip">
                  <span><Package size={14} />{selectedProduct.brand}</span>
                  <span>Dataset reference price <b>{money(selectedProduct.normalPrice)}</b></span>
                  <span>Dataset reference cost <b>{money(selectedProduct.unitCost)}</b></span>
                </div>
              )}

              <label className="form-field">
                <span>Retailer / account *</span>
                <select
                  value={form.retailerId}
                  onChange={(event) => onRetailerChange(event.target.value)}
                  required
                >
                  <option value="">Select an active retailer/account</option>
                  {activeRetailers.map((retailer) => (
                    <option key={retailer.id} value={retailer.id}>
                      {retailer.name} · {retailer.region}
                    </option>
                  ))}
                </select>
                {showIssues && validation.errors.retailerId && <small className="field-error">{validation.errors.retailerId}</small>}
              </label>

              {form.retailerId && selectedRetailer && (
                <div className="reference-strip">
                  <span><Store size={14} />{selectedRetailer.region}</span>
                  <span>Account manager <b>{selectedRetailer.accountManager}</b></span>
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Commercial inputs</h3>
              <p className="form-hint">
                Enter the actual selling price and unit cost agreed for this retailer/account. Reference dataset values are shown above for guidance only and are not copied into these fields. Forecast uplift above 100% is flagged for commercial review; forecasts above 10× baseline are blocked in this prototype.
              </p>

              <div className="field-grid">
                {FIELD_RULES.map((field) => (
                  <label className="form-field" key={field.key}>
                    <span>{field.label} *</span>
                    <input
                      type="number"
                      value={form[field.key]}
                      onChange={(event) => update(field.key, event.target.value)}
                      placeholder="Enter value"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      required
                      aria-invalid={Boolean(showIssues && validation.errors[field.key])}
                      className={showIssues && validation.errors[field.key] ? "field-input-invalid" : ""}
                    />
                    <small>{field.hint} Allowed: {field.min.toLocaleString("en-IN")}–{field.max.toLocaleString("en-IN")}.</small>
                    {showIssues && validation.errors[field.key] && (
                      <small className="field-error">{validation.errors[field.key]}</small>
                    )}
                  </label>
                ))}
              </div>

              {validation.warnings.length > 0 && (
                <div className="validation-notice warning-notice">
                  <AlertTriangle size={17} />
                  <div>
                    <strong>Commercial assumption warning</strong>
                    {validation.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                  </div>
                </div>
              )}

              {showIssues && validation.isValid && (
                <div className="validation-notice valid-notice">
                  <CheckCircle2 size={17} />
                  <span>Input checks passed. Review any commercial warnings before saving.</span>
                </div>
              )}

              {showIssues && !validation.isValid && (
                <div className="validation-notice error-notice">
                  <Info size={17} />
                  <span>Correct the highlighted fields before calculating or saving this scenario.</span>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button className="secondary-button" type="submit">
                <FileChartColumn size={16} />Calculate preview
              </button>
              <button className="primary-button" type="button" onClick={save}>
                <Save size={16} />Save scenario
              </button>
              <button className="text-button" type="button" onClick={clear}>
                <RotateCcw size={15} />Clear form
              </button>
            </div>
          </form>
        </section>

        <section className="table-card result-card">
          <div className="table-card-header">
            <div>
              <h2>Calculation preview</h2>
              <p>Review the estimated financial impact before saving.</p>
            </div>
            <span className="period-pill">Step 2 of 2</span>
          </div>

          {preview ? (
            <ResultBreakdown result={preview} money={money} number={number} roiLabel={roiLabel} />
          ) : (
            <div className="empty-state">
              <FileChartColumn size={25} />
              <strong>Ready to calculate</strong>
              <p>Complete the inputs and select Calculate preview. Your results will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
