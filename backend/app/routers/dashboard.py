from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.models.promotion import Promotion

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(period: str = Query("1y", pattern="^(1m|3m|6m|1y|all)$"), db: Session = Depends(get_db)):
    try:
        stmt = select(Promotion)
        if period != "all":
            months = {"1m": 1, "3m": 3, "6m": 6, "1y": 12}[period]
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            # Match the frontend's calendar-month reporting window.
            month_index = (now.month - 1) - months
            year = now.year + month_index // 12
            month = month_index % 12 + 1
            start = now.replace(year=year, month=month)
            stmt = stmt.where(Promotion.created_at >= start, Promotion.created_at <= now)
        records = db.scalars(stmt.order_by(Promotion.created_at)).all()
    except SQLAlchemyError as exc:
        raise HTTPException(503, detail={"code": "database_unavailable", "message": "Dashboard data is unavailable. Check database connectivity and schema compatibility."}) from exc

    roi_values = [record.roi for record in records if record.roi is not None]
    total = len(records)
    decision_counts = {decision: sum(record.verdict.upper() == decision for record in records) for decision in ("APPROVE", "REVIEW", "REJECT")}
    monthly: dict[str, list[Decimal]] = {}
    for record in records:
        if record.roi is not None:
            key = record.created_at.strftime("%Y-%m")
            monthly.setdefault(key, []).append(record.roi)
    trend = [{"month": month, "average_roi": sum(values, Decimal(0)) / len(values), "count": len(values)} for month, values in sorted(monthly.items())]
    average_roi = sum(roi_values, Decimal(0)) / len(roi_values) if roi_values else None
    extra_profit_total = sum((record.extra_profit for record in records), Decimal(0))
    monthly_frontend = [{"month": point["month"], "averageRoi": point["average_roi"], "count": point["count"]} for point in trend]
    return {
        "period": period,
        "total_promotions": total,
        "approve_count": decision_counts["APPROVE"],
        "review_count": decision_counts["REVIEW"],
        "reject_count": decision_counts["REJECT"],
        "average_roi": average_roi,
        "total_extra_profit": extra_profit_total,
        "roi_is_measurable": bool(roi_values),
        "decision_distribution": decision_counts,
        "monthly_average_roi": trend,
        # Metric keys used by the existing App.jsx / Dashboard.jsx contract.
        "total": total,
        "approve": decision_counts["APPROVE"],
        "review": decision_counts["REVIEW"],
        "reject": decision_counts["REJECT"],
        "averageRoi": average_roi,
        "totalExtraProfit": extra_profit_total,
        "decisionDistribution": {"Approve": decision_counts["APPROVE"], "Review": decision_counts["REVIEW"], "Reject": decision_counts["REJECT"]},
        "monthlyAverageRoi": monthly_frontend,
    }
