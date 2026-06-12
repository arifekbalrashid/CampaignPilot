"""Customer API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.models.communication import Communication

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("")
async def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Paginated customer list with optional search."""
    query = select(Customer)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            (Customer.name.ilike(search_term))
            | (Customer.email.ilike(search_term))
            | (Customer.city.ilike(search_term))
            | (Customer.phone.ilike(search_term))
        )

    # Get total count
    result = await db.execute(query)
    total = len(result.scalars().all())

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    customers = result.scalars().all()

    return {
        "customers": [
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "phone": c.phone,
                "city": c.city,
                "age": c.age,
                "total_spend": c.total_spend,
                "last_order": c.last_order.isoformat() if c.last_order else "",
                "preferred_channel": c.preferred_channel,
            }
            for c in customers
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{customer_id}")
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get customer profile with order and campaign history."""
    # Get customer
    stmt = select(Customer).where(Customer.id == customer_id)
    result = await db.execute(stmt)
    customer = result.scalar_one_or_none()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Get orders
    stmt = select(Order).where(Order.customer_id == customer_id)
    result = await db.execute(stmt)
    orders = result.scalars().all()

    # Get communications
    stmt = select(Communication).where(Communication.customer_id == customer_id)
    result = await db.execute(stmt)
    communications = result.scalars().all()

    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "city": customer.city,
        "age": customer.age,
        "total_spend": customer.total_spend,
        "last_order": customer.last_order.isoformat() if customer.last_order else "",
        "preferred_channel": customer.preferred_channel,
        "orders": [
            {
                "id": o.id,
                "product": o.product,
                "category": o.category,
                "amount": o.amount,
                "created_at": o.created_at.isoformat() if o.created_at else "",
            }
            for o in orders
        ],
        "campaign_history": [
            {
                "campaign_id": c.campaign_id,
                "channel": c.channel,
                "status": c.status,
            }
            for c in communications
        ],
    }
