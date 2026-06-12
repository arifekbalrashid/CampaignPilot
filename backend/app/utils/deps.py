"""Dependency injection helpers for FastAPI."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.campaign import CampaignService
from app.services.analytics import AnalyticsService


async def get_campaign_service(
    db: AsyncSession = Depends(get_db),
) -> CampaignService:
    return CampaignService(db)


async def get_analytics_service(
    db: AsyncSession = Depends(get_db),
) -> AnalyticsService:
    return AnalyticsService(db)
