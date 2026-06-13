"""Analytics service — aggregates dashboard and reporting data."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.ai.client import campaign_ai
from app.models.customer import Customer
from app.models.campaign import Campaign
from app.models.communication import Communication
from app.models.communication_event import CommunicationEvent


class AnalyticsService:
    """Aggregates data for dashboard and reporting views."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_stats(self) -> dict:
        """Get key metrics for dashboard."""
        # Count customers
        customer_stmt = select(func.count(Customer.id))
        customer_result = await self.db.execute(customer_stmt)
        total_customers = customer_result.scalar() or 0

        # Count campaigns
        campaign_stmt = select(func.count(Campaign.id))
        campaign_result = await self.db.execute(campaign_stmt)
        total_campaigns = campaign_result.scalar() or 0

        # Count active campaigns
        active_stmt = select(func.count(Campaign.id)).where(Campaign.status == "active")
        active_result = await self.db.execute(active_stmt)
        active_campaigns = active_result.scalar() or 0

        # Calculate conversion rate
        comm_stmt = select(Communication)
        comm_result = await self.db.execute(comm_stmt)
        comms = comm_result.scalars().all()

        converted = sum(
            1 for c in comms
            if any(e.event_type == "converted" for e in c.events)
        )
        total_comms = len(comms) if comms else 1

        return {
            "total_customers": total_customers,
            "total_campaigns": total_campaigns,
            "active_campaigns": active_campaigns,
            "overall_conversion_rate": converted / total_comms if total_comms > 0 else 0,
        }

    async def get_recent_campaigns(self, limit: int = 5) -> list[dict]:
        """Get recent campaigns."""
        stmt = select(Campaign).order_by(Campaign.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        campaigns = result.scalars().all()

        return [
            {
                "id": c.id,
                "name": c.name,
                "status": c.status,
                "audience_count": c.audience_count,
                "channel": c.channel,
                "created_at": c.created_at.isoformat() if c.created_at else "",
            }
            for c in campaigns
        ]

    async def get_performance_data(self, limit: int = 10) -> list[dict]:
        """Get performance metrics for recent campaigns."""
        stmt = select(Campaign).where(Campaign.status != "draft").order_by(Campaign.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        campaigns = result.scalars().all()

        perf_data = []
        for c in campaigns:
            comms_stmt = select(Communication).where(Communication.campaign_id == c.id)
            comms_result = await self.db.execute(comms_stmt)
            comms = comms_result.scalars().all()

            delivered = sum(1 for m in comms if m.status == "delivered")
            opened = sum(1 for m in comms if any(e.event_type == "opened" for e in m.events))
            converted = sum(1 for m in comms if any(e.event_type == "converted" for e in m.events))

            perf_data.append({
                "campaign_id": c.id,
                "campaign_name": c.name,
                "channel": c.channel,
                "sent": len(comms),
                "delivered": delivered,
                "opened": opened,
                "converted": converted,
                "conversion_rate": converted / len(comms) if comms else 0,
            })

        return perf_data

    async def get_suggestion_context(self) -> tuple[dict, list[str]]:
        """Get customer and campaign context for AI suggestions."""
        # Get customer stats
        stmt = select(Customer)
        result = await self.db.execute(stmt)
        customers = result.scalars().all()

        spend_avg = sum(c.total_spend for c in customers) / len(customers) if customers else 0
        cities = {}
        for c in customers:
            cities[c.city] = cities.get(c.city, 0) + 1

        customer_context = {
            "total_customers": len(customers),
            "spend": {"avg": spend_avg},
            "top_cities": sorted(cities.items(), key=lambda x: x[1], reverse=True)[:3],
        }

        # Get recent campaign names
        stmt = select(Campaign).order_by(Campaign.created_at.desc()).limit(5)
        result = await self.db.execute(stmt)
        recent = result.scalars().all()
        recent_names = [c.name for c in recent]

        return customer_context, recent_names
