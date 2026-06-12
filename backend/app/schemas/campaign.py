"""Campaign request/response schemas."""

from datetime import datetime
from pydantic import BaseModel


class CampaignPlanRequest(BaseModel):
    """User's natural language campaign objective."""
    objective: str


class CampaignUpdateRequest(BaseModel):
    """Update name and message for a draft campaign."""
    name: str | None = None
    message: str | None = None


class CampaignPlanResponse(BaseModel):
    """AI-generated campaign plan returned to the frontend."""
    campaign_id: int
    name: str
    objective: str
    audience_summary: str
    audience_count: int
    message: str
    channel: str
    channel_reasoning: str
    ai_reasoning: str
    estimated_conversion: float
    estimated_revenue_impact: str


class CampaignLaunchResponse(BaseModel):
    """Response after launching a campaign."""
    campaign_id: int
    status: str
    communications_sent: int


class CampaignListItem(BaseModel):
    id: int
    name: str
    objective: str
    status: str
    audience_count: int
    channel: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CampaignDetailResponse(BaseModel):
    id: int
    name: str
    objective: str
    audience_summary: str | None
    audience_count: int
    message: str | None
    channel: str | None
    ai_reasoning: str | None
    estimated_conversion: float | None
    status: str
    created_at: datetime
    metrics: "CampaignMetrics"

    model_config = {"from_attributes": True}


class CampaignMetrics(BaseModel):
    """Funnel metrics for a campaign."""
    total: int = 0
    sent: int = 0
    delivered: int = 0
    opened: int = 0
    read: int = 0
    clicked: int = 0
    converted: int = 0


class TimelineEvent(BaseModel):
    """Single event in campaign timeline."""
    communication_id: int
    customer_name: str
    event_type: str
    created_at: datetime


class CampaignSummaryResponse(BaseModel):
    """AI-generated campaign performance summary."""
    performance_summary: str
    key_insights: list[str]
    recommendations: list[str]
    next_campaign_suggestion: str