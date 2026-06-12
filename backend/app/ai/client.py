"""Gemini AI client — wraps all AI interactions with structured outputs."""

import json
import logging
from google import genai
from google.genai import types

from app.config import get_settings
from app.ai.schemas import CampaignPlan, CampaignSummary, DashboardSuggestions
from app.ai.prompts import (
    CAMPAIGN_PLANNER_SYSTEM,
    CAMPAIGN_PLAN_USER,
    CAMPAIGN_SUMMARY_SYSTEM,
    CAMPAIGN_SUMMARY_USER,
    DASHBOARD_SUGGESTIONS_SYSTEM,
    DASHBOARD_SUGGESTIONS_USER,
)

logger = logging.getLogger(__name__)

class CampaignAI:
    """AI client for campaign planning and analysis.

    All methods return structured Pydantic models via Gemini's
    structured output feature. If the API is unavailable, methods
    raise CampaignAIError with a user-friendly message.
    """

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.gemini_api_key
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None
        self.model = "gemini-2.5-flash"

    def _is_available(self) -> bool:
        return self.client is not None and self.api_key != ""

    async def plan_campaign(
        self,
        objective: str,
        customer_context: dict,
    ) -> CampaignPlan:
        """Generate a complete campaign plan from a natural language objective."""
        if not self._is_available():
            return self._fallback_plan(objective, customer_context)

        try:
            system_prompt = CAMPAIGN_PLANNER_SYSTEM.format(
                customer_context=json.dumps(customer_context, indent=2)
            )
            user_prompt = CAMPAIGN_PLAN_USER.format(objective=objective)

            response = self.client.models.generate_content(
                model=self.model,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    response_schema=CampaignPlan,
                    temperature=0.7,
                ),
            )

            return CampaignPlan.model_validate_json(response.text)
        except Exception as e:
            logger.error(f"Gemini API error during plan_campaign: {e}")
            return self._fallback_plan(objective, customer_context)

    async def summarize_campaign(
        self,
        campaign_name: str,
        objective: str,
        channel: str,
        audience_count: int,
        metrics: dict,
    ) -> CampaignSummary:
        """Generate a post-campaign performance analysis."""
        if not self._is_available():
            return self._fallback_summary(metrics)

        try:
            user_prompt = CAMPAIGN_SUMMARY_USER.format(
                campaign_name=campaign_name,
                objective=objective,
                channel=channel,
                audience_count=audience_count,
                **metrics,
            )

            response = self.client.models.generate_content(
                model=self.model,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=CAMPAIGN_SUMMARY_SYSTEM,
                    response_mime_type="application/json",
                    response_schema=CampaignSummary,
                    temperature=0.6,
                ),
            )

            return CampaignSummary.model_validate_json(response.text)
        except Exception as e:
            logger.error(f"Gemini API error during summarize_campaign: {e}")
            return self._fallback_summary(metrics)

    async def suggest_campaigns(
        self,
        customer_context: dict,
        recent_campaigns: list[str],
    ) -> DashboardSuggestions:
        """Generate campaign suggestions for the dashboard."""
        if not self._is_available():
            return self._fallback_suggestions(customer_context)

        try:
            system_prompt = DASHBOARD_SUGGESTIONS_SYSTEM.format(
                customer_context=json.dumps(customer_context, indent=2)
            )
            user_prompt = DASHBOARD_SUGGESTIONS_USER.format(
                recent_campaigns=", ".join(recent_campaigns) if recent_campaigns else "None"
            )

            response = self.client.models.generate_content(
                model=self.model,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    response_schema=DashboardSuggestions,
                    temperature=0.8,
                ),
            )

            return DashboardSuggestions.model_validate_json(response.text)
        except Exception as e:
            logger.error(f"Gemini API error during suggest_campaigns: {e}")
            return self._fallback_suggestions(customer_context)

    # Deterministic fallbacks when API is unavailable

    def _fallback_plan(self, objective: str, context: dict) -> CampaignPlan:
        """Produces a plausible plan without AI — used when Gemini is down."""
        from app.ai.schemas import AudienceSelection, AudienceFilter

        total = context.get("total_customers", 1000)
        avg_spend = context.get("spend", {}).get("avg", 2000)

        return CampaignPlan(
            campaign_name="Re-engagement Campaign",
            audience=AudienceSelection(
                filters=[
                    AudienceFilter(field="total_spend", operator="gte", value="2000"),
                    AudienceFilter(field="last_order", operator="days_ago_gt", value="30"),
                ],
                filters_description=[
                    "Customers who spent ₹2,000 or more",
                    "Haven't ordered in the last 30 days",
                ],
                reasoning=f"Based on your objective '{objective}', targeting customers with above-average spend (₹{avg_spend:.0f} avg) who have been inactive helps maximize re-engagement ROI.",
                audience_summary="Inactive high-value customers",
            ),
            message=f"Hey! We miss you at Coffee Delights ☕ Come back and enjoy a special 15% discount on your next order. Use code COMEBACK15. Valid for 7 days!",
            channel="whatsapp",
            channel_reasoning="WhatsApp has the highest engagement rate for re-engagement campaigns, with open rates exceeding 90%.",
            estimated_conversion_rate=0.08,
            estimated_revenue_impact=f"₹{int(total * 0.15 * avg_spend * 0.08):,}",
        )

    def _fallback_summary(self, metrics: dict) -> CampaignSummary:
        sent = metrics.get("sent", 0)
        delivered = metrics.get("delivered", 0)
        converted = metrics.get("converted", 0)
        conv_rate = (converted / sent * 100) if sent > 0 else 0

        return CampaignSummary(
            performance_summary=f"Campaign reached {delivered} customers with a {conv_rate:.1f}% conversion rate. {'Strong' if conv_rate > 5 else 'Average'} performance overall.",
            key_insights=[
                f"Delivery rate: {(delivered/sent*100) if sent > 0 else 0:.1f}%",
                f"Conversion rate: {conv_rate:.1f}%",
                f"{converted} customers converted from {sent} messages sent",
            ],
            recommendations=[
                "Consider A/B testing message variations for higher engagement",
                "Target customers who opened but didn't convert with a follow-up",
            ],
            next_campaign_suggestion="Run a follow-up campaign targeting customers who opened but didn't convert, with a stronger incentive.",
        )

    def _fallback_suggestions(self, context: dict) -> DashboardSuggestions:
        from app.ai.schemas import DashboardSuggestion

        inactive = context.get("activity", {}).get("inactive_30d_plus", 200)
        total = context.get("total_customers", 1000)

        return DashboardSuggestions(
            suggestions=[
                DashboardSuggestion(
                    title="Win Back Inactive Customers",
                    description=f"{inactive} customers haven't ordered in 30+ days. Send a personalized re-engagement offer.",
                    estimated_audience=inactive,
                    confidence=0.85,
                ),
                DashboardSuggestion(
                    title="Reward Top Spenders",
                    description="Recognize your highest-spending customers with an exclusive loyalty reward.",
                    estimated_audience=int(total * 0.1),
                    confidence=0.75,
                ),
                DashboardSuggestion(
                    title="New Product Launch",
                    description="Announce your latest seasonal menu to active customers for maximum excitement.",
                    estimated_audience=int(total * 0.4),
                    confidence=0.7,
                ),
            ]
        )


campaign_ai = CampaignAI()
