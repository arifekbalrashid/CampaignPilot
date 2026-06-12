"""Pydantic schemas for structured AI outputs from Gemini."""

from pydantic import BaseModel, Field


class AudienceFilter(BaseModel):
    """A single filter criterion for audience selection."""
    field: str = Field(description="Customer field to filter on: total_spend, last_order, age, city, preferred_channel")
    operator: str = Field(description="Comparison operator: gte, lte, gt, lt, eq, in, days_ago_gt, days_ago_lte, days_ago_lt")
    value: str = Field(description="Value to compare against. For 'in' operator, comma-separated values.")


class AudienceSelection(BaseModel):
    """AI's structured audience analysis."""
    filters: list[AudienceFilter] = Field(
        description="List of filters to apply to the customer database"
    )
    filters_description: list[str] = Field(
        description="Human-readable description of each filter applied"
    )
    audience_summary: str = Field(
        description="Brief label for this audience segment, e.g., 'Inactive premium customers in metros'"
    )
    limit: int | None = Field(
        default=None,
        description="Maximum number of random customers to select. Set only if objective explicitly asks for a limited or random number of customers."
    )


class CampaignPlan(BaseModel):
    """Complete AI-generated campaign plan."""
    campaign_name: str = Field(
        description="A short, catchy name for the campaign"
    )
    audience: AudienceSelection
    message: str = Field(
        description="The personalized marketing message to send to the audience"
    )
    channel: str = Field(
        description="Recommended communication channel: whatsapp, email, or sms"
    )
    estimated_conversion_rate: float = Field(
        ge=0.0, le=1.0,
        description="Estimated conversion rate between 0.0 and 1.0"
    )
    estimated_revenue_impact: str = Field(
        description="Human-readable estimate of revenue impact, e.g., '₹50,000 - ₹80,000'"
    )


class CampaignSummary(BaseModel):
    """AI-generated post-campaign performance analysis."""
    performance_summary: str = Field(
        description="Overall assessment of campaign performance in 2-3 sentences"
    )
    key_insights: list[str] = Field(
        description="3-5 key insights from the campaign data"
    )
    recommendations: list[str] = Field(
        description="2-3 actionable recommendations for improvement"
    )
    next_campaign_suggestion: str = Field(
        description="A concrete suggestion for the next campaign to run"
    )


class DashboardSuggestion(BaseModel):
    """AI-generated campaign suggestion for dashboard."""
    title: str = Field(description="Short campaign title")
    description: str = Field(description="1-2 sentence description of the campaign idea")
    estimated_audience: int = Field(description="Estimated number of customers to target")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")


class DashboardSuggestions(BaseModel):
    """Container for multiple AI suggestions."""
    suggestions: list[DashboardSuggestion] = Field(
        description="2-3 campaign suggestions based on current customer data"
    )
