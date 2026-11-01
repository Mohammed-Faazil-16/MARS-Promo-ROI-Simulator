import StatusBadge from "./StatusBadge";
 
export default function ResultBreakdown({
  result,
  money,
  number,
  roiLabel,
}) {
  const rows = [
    ["Promotional selling price", money(result.promoPrice)],
    ["Normal margin per unit", money(result.normalMargin)],
    ["Promotional margin per unit", money(result.promoMargin)],
    ["Extra units over promotion", number(result.extraUnits)],
    ["Sales uplift", `${result.uplift.toFixed(1)}%`],
    ["Profit without offer", money(result.profitWithout)],
    ["Profit with offer", money(result.profitWith)],
    ["Extra profit", money(result.extraProfit)],
    ["Promotion cost", money(result.promoCost)],
    [
      "Break-even sales / week",
      result.breakEvenPromoUnits === null
        ? "Not achievable at this margin"
        : `${number(result.breakEvenPromoUnits)} units`,
    ],
  ];
 
  return (
    <div className="result-breakdown">
      <div className="result-verdict">
        <div>
          <span className="small-label">
            Return on promotion cost
          </span>
 
          <div
            className={`big-roi ${
              result.roi < 0 ? "roi-negative" : "roi-positive"
            }`}
          >
            {roiLabel(result.roi)}
          </div>
        </div>
 
        <StatusBadge status={result.verdict} />
      </div>
 
      <div className="result-rows">
        {rows.map(([label, value]) => (
          <div
            className={`result-row ${
              label === "Extra profit" ? "result-row-emphasis" : ""
            }`}
            key={label}
          >
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
 
      <p className="form-hint">
        Decision rule: ROI ≥ 20% = Approve; ROI from 0% to
        below 20% = Review; ROI below 0% = Reject.
      </p>
    </div>
  );
}