"""Dashboard API routes."""

from fastapi import APIRouter, Depends

from app.services.analytics import AnalyticsService
from app.utils.deps import get_analytics_service

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
async def get_suggestions(
    analytics: AnalyticsService = Depends(get_analytics_service),
):
    """Get AI-generated campaign suggestions."""
    return await analytics.get_suggestions()
