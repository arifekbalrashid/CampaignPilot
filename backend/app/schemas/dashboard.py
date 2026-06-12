"""Dashboard response schemas."""

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_customers: int
    total_campaigns: int
    active_campaigns: int
    overall_conversion_rate: float


class RecentCampaign(BaseModel):
    id: int
    name: str
    status: str
    audience_count: int
    channel: str | None
    created_at: str


class PerformanceData(BaseModel):
    """Aggregated campaign performance for charts."""
    campaign_id: int
    campaign_name: str
    sent: int
    delivered: int
    opened: int
    clicked: int
    converted: int


class AISuggestion(BaseModel):
    """AI-generated campaign suggestion."""
    title: str
    description: str
    estimated_audience: int
    confidence: float


class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_campaigns: list[RecentCampaign]
    performance: list[PerformanceData]
    suggestions: list[AISuggestion]
