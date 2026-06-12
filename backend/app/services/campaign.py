"""Campaign service — orchestrates AI planning and campaign launch."""

import logging
from datetime import datetime, timedelta
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import httpx

from app.config import get_settings
from app.ai.client import campaign_ai
from app.ai.schemas import AudienceFilter
from app.models.customer import Customer
from app.models.campaign import Campaign
from app.models.communication import Communication
from app.models.communication_event import CommunicationEvent

logger = logging.getLogger(__name__)


class CampaignService:
    """Orchestrates AI planning and campaign launch with direct database queries."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()
        self._pending_audiences = {}

    async def plan_campaign(self, objective: str) -> dict:
        """AI-planned campaign: gather customer stats, get AI plan, select audience, create draft."""
        # 1. Get customer context (aggregated stats)
        customer_context = await self._get_customer_stats()

        # 2. AI generates the plan
        plan = await campaign_ai.plan_campaign(objective, customer_context)

        # 3. Apply AI's audience filters
        customers = await self._apply_filters(plan.audience.filters)

        if not customers:
            logger.warning("AI filters returned 0 customers, broadening search")
            customers = await self._get_by_filters(
                min_spend=customer_context["spend"]["avg"] * 0.5,
            )

        if plan.audience.limit and len(customers) > plan.audience.limit:
            customers = random.sample(customers, plan.audience.limit)

        audience_count = len(customers)
        customer_ids = [c.id for c in customers]

        # 4. Create draft campaign
        campaign = Campaign(
            name=plan.campaign_name,
            objective=objective,
            audience_summary=plan.audience.audience_summary,
            audience_count=audience_count,
            message=plan.message,
            channel=plan.channel,
            ai_reasoning="",
            estimated_conversion=plan.estimated_conversion_rate,
            status="draft",
        )
        self.db.add(campaign)
        await self.db.flush()  # Get the campaign.id without commit

        # Store audience for launch
        self._pending_audiences[campaign.id] = customer_ids

        return {
            "campaign_id": campaign.id,
            "name": plan.campaign_name,
            "objective": objective,
            "audience_summary": plan.audience.audience_summary,
            "audience_count": audience_count,
            "message": plan.message,
            "channel": plan.channel,
            "estimated_conversion": plan.estimated_conversion_rate,
            "estimated_revenue_impact": plan.estimated_revenue_impact,
            "filters_applied": plan.audience.filters_description,
        }

    async def update_campaign(self, campaign_id: int, name: str | None = None, message: str | None = None) -> dict:
        """Update name and/or message of a draft campaign."""
        stmt = select(Campaign).where(Campaign.id == campaign_id)
        result = await self.db.execute(stmt)
        campaign = result.scalar_one_or_none()

        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")
        if campaign.status != "draft":
            raise ValueError("Can only edit campaigns in 'draft' status")

        if name is not None:
            campaign.name = name
        if message is not None:
            campaign.message = message

        self.db.add(campaign)
        await self.db.commit()

        return {"status": "success", "campaign_id": campaign.id}

    async def delete_campaign(self, campaign_id: int) -> dict:
        """Delete a draft campaign."""
        stmt = select(Campaign).where(Campaign.id == campaign_id)
        result = await self.db.execute(stmt)
        campaign = result.scalar_one_or_none()

        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")
        if campaign.status != "draft":
            raise ValueError("Can only delete campaigns in 'draft' status")

        # Also remove from pending audiences
        self._pending_audiences.pop(campaign_id, None)

        await self.db.delete(campaign)
        await self.db.commit()

        return {"status": "success"}

    async def launch_campaign(self, campaign_id: int) -> dict:
        """Launch a draft campaign — create communications and send to channel service."""
        # Validate campaign exists
        stmt = select(Campaign).where(Campaign.id == campaign_id)
        result = await self.db.execute(stmt)
        campaign = result.scalar_one_or_none()

        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")
        if campaign.status != "draft":
            raise ValueError(f"Campaign {campaign_id} is already {campaign.status}")

        # Get pending audience
        customer_ids = self._pending_audiences.get(campaign_id)

        if not customer_ids:
            # Re-fetch if not cached (server restart case)
            customer_context = await self._get_customer_stats()
            customers = await self._get_by_filters(
                min_spend=customer_context["spend"]["avg"] * 0.5,
            )
            customer_ids = [c.id for c in customers[: campaign.audience_count]]

        # Create communications
        comms = [
            Communication(
                campaign_id=campaign_id,
                customer_id=cid,
                channel=campaign.channel or "whatsapp",
                message=campaign.message or "",
                status="pending",
            )
            for cid in customer_ids
        ]
        self.db.add_all(comms)

        # Update campaign status
        campaign.status = "active"
        self.db.add(campaign)

        await self.db.flush()  # Flush without commit yet

        # Send to channel service
        sent_count = 0
        for comm in comms:
            try:
                await self._send_to_channel(comm)
                sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send communication {comm.id}: {e}")
                comm.status = "failed"

        await self.db.commit()

        return {
            "campaign_id": campaign_id,
            "status": "active",
            "communications_sent": sent_count,
        }

    async def _send_to_channel(self, comm: Communication) -> None:
        """Send a single communication to the channel service."""
        payload = {
            "communication_id": comm.id,
            "customer_name": "Customer",
            "channel": comm.channel,
            "message": comm.message,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.settings.channel_service_url}/send",
                    json=payload,
                )
                response.raise_for_status()
        except httpx.HTTPError as e:
            logger.error(f"Channel service error for comm {comm.id}: {e}")
            comm.status = "failed"

    async def _apply_filters(self, filters: list[AudienceFilter]) -> list[Customer]:
        """Convert AI-generated filters into database queries."""
        kwargs = {}

        for f in filters:
            if f.field == "total_spend":
                if f.operator in ("gte", "gt"):
                    kwargs["min_spend"] = float(f.value)
                elif f.operator in ("lte", "lt"):
                    kwargs["max_spend"] = float(f.value)
            elif f.field == "last_order":
                if f.operator == "days_ago_gt":
                    kwargs["inactive_days"] = int(f.value)
                elif f.operator in ("days_ago_lte", "days_ago_lt"):
                    kwargs["active_days"] = int(f.value)
            elif f.field == "age":
                if f.operator in ("gte", "gt"):
                    kwargs["min_age"] = int(f.value)
                elif f.operator in ("lte", "lt"):
                    kwargs["max_age"] = int(f.value)
            elif f.field == "city":
                if f.operator == "in":
                    kwargs["cities"] = [c.strip() for c in f.value.split(",")]
                elif f.operator == "eq":
                    kwargs["cities"] = [f.value.strip()]
            elif f.field == "preferred_channel" and f.operator == "eq":
                kwargs["preferred_channel"] = f.value

        return await self._get_by_filters(**kwargs)

    async def _get_customer_stats(self) -> dict:
        """Get aggregated customer stats (no PII) for AI context."""
        stmt = select(Customer)
        result = await self.db.execute(stmt)
        customers = result.scalars().all()

        if not customers:
            return {
                "total_customers": 0,
                "spend": {"total": 0, "avg": 0, "min": 0, "max": 0},
                "age": {"min": 0, "max": 0, "avg": 0},
                "cities": {},
                "channels": {},
                "activity": {"active_30": 0, "active_90": 0},
            }

        spends = [c.total_spend for c in customers if c.total_spend]
        ages = [c.age for c in customers if c.age]
        today = datetime.utcnow().date()

        active_30 = sum(
            1 for c in customers if (today - c.last_order).days <= 30
        )
        active_90 = sum(
            1 for c in customers if (today - c.last_order).days <= 90
        )

        cities = {}
        channels = {}
        for c in customers:
            cities[c.city] = cities.get(c.city, 0) + 1
            channels[c.preferred_channel] = channels.get(c.preferred_channel, 0) + 1

        return {
            "total_customers": len(customers),
            "spend": {
                "total": sum(spends),
                "avg": sum(spends) / len(spends) if spends else 0,
                "min": min(spends) if spends else 0,
                "max": max(spends) if spends else 0,
            },
            "age": {
                "min": min(ages) if ages else 0,
                "max": max(ages) if ages else 0,
                "avg": sum(ages) / len(ages) if ages else 0,
            },
            "cities": cities,
            "channels": channels,
            "activity": {"active_30": active_30, "active_90": active_90},
        }

    async def _get_by_filters(
        self,
        min_spend: float | None = None,
        max_spend: float | None = None,
        min_age: int | None = None,
        max_age: int | None = None,
        cities: list[str] | None = None,
        inactive_days: int | None = None,
        active_days: int | None = None,
        preferred_channel: str | None = None,
    ) -> list[Customer]:
        """Query customers with multiple filter criteria."""
        query = select(Customer)

        if min_spend is not None:
            query = query.where(Customer.total_spend >= min_spend)
        if max_spend is not None:
            query = query.where(Customer.total_spend <= max_spend)
        if min_age is not None:
            query = query.where(Customer.age >= min_age)
        if max_age is not None:
            query = query.where(Customer.age <= max_age)
        if cities:
            query = query.where(Customer.city.in_(cities))
        if inactive_days is not None:
            cutoff_date = datetime.utcnow().date() - timedelta(days=inactive_days)
            query = query.where(Customer.last_order <= cutoff_date)
        if active_days is not None:
            cutoff_date = datetime.utcnow().date() - timedelta(days=active_days)
            query = query.where(Customer.last_order >= cutoff_date)
        if preferred_channel:
            query = query.where(Customer.preferred_channel == preferred_channel)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_campaign_summary(self, campaign_id: int) -> dict:
        """Get AI-generated performance summary for a campaign."""
        stmt = select(Campaign).where(Campaign.id == campaign_id)
        result = await self.db.execute(stmt)
        campaign = result.scalar_one_or_none()

        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")

        # Get metrics from communications
        stmt = select(Communication).where(Communication.campaign_id == campaign_id)
        result = await self.db.execute(stmt)
        comms = result.scalars().all()

        metrics = {
            "sent": len(comms),
            "delivered": sum(1 for c in comms if c.status == "delivered"),
            "opened": sum(1 for c in comms if any(e.event_type == "opened" for e in c.events)),
            "clicked": sum(1 for c in comms if any(e.event_type == "clicked" for e in c.events)),
            "converted": sum(1 for c in comms if any(e.event_type == "converted" for e in c.events)),
        }

        summary = await campaign_ai.summarize_campaign(
            campaign_name=campaign.name,
            objective=campaign.objective,
            channel=campaign.channel or "unknown",
            audience_count=campaign.audience_count,
            metrics=metrics,
        )

        return summary.model_dump()
