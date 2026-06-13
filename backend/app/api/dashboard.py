"""Dashboard API routes."""

from fastapi import APIRouter, Depends

from app.services.analytics import AnalyticsService
from app.utils.deps import get_analytics_service
from app.database import AsyncSessionLocal
from app.ai.client import campaign_ai

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats(
    analytics: AnalyticsService = Depends(get_analytics_service),
):
    """Get dashboard overview statistics."""
    return await analytics.get_dashboard_stats()


@router.get("/recent-campaigns")
async def get_recent_campaigns(
    analytics: AnalyticsService = Depends(get_analytics_service),
):
    """Get the most recent campaigns."""
    return await analytics.get_recent_campaigns()


@router.get("/performance")
async def get_performance(
    analytics: AnalyticsService = Depends(get_analytics_service),
):
    """Get campaign performance data for charts."""
    return await analytics.get_performance_data()


@router.get("/suggestions")
async def get_suggestions():
    """Get AI-generated campaign suggestions."""
    async with AsyncSessionLocal() as db:
        analytics = AnalyticsService(db)
        customer_context, recent_names = await analytics.get_suggestion_context()
        
    # The database connection is now safely returned to the pool
    result = await campaign_ai.suggest_campaigns(customer_context, recent_names)
    return [s.model_dump() for s in result.suggestions]
