from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.retailer import Retailer

# Explicitly local development fixtures based on the frontend's illustrative reference list.
DEVELOPMENT_PRODUCTS = [
    (1, "Snickers", "Chocolate", "Snickers", "60", "100"),
    (2, "Pedigree Adult 1kg", "Pet Food", "Pedigree", "338", "499"),
    (3, "M&M's", "Chocolate", "M&M's", "58", "100"),
]
DEVELOPMENT_RETAILERS = [
    (1, "Reliance Retail", "Pan-India", "A. Sharma (Demo)"),
    (2, "DMart", "Pan-India", "R. Iyer (Demo)"),
    (3, "More Retail", "South", "M. Kulkarni (Demo)"),
]


def seed_local_development_data(session: Session) -> None:
    if session.scalar(select(Product.id).limit(1)) is None:
        session.add_all([
            Product(id=pid, name=name, category=category, brand=brand,
                    unit_cost=Decimal(cost), normal_price=Decimal(price), is_active=True,
                    is_development_seed=True)
            for pid, name, category, brand, cost, price in DEVELOPMENT_PRODUCTS
        ])
    if session.scalar(select(Retailer.id).limit(1)) is None:
        session.add_all([
            Retailer(id=rid, name=name, region=region, account_manager=manager,
                     is_active=True, is_development_seed=True)
            for rid, name, region, manager in DEVELOPMENT_RETAILERS
        ])
    session.commit()
