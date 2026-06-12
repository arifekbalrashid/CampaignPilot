"""Campaign API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.schemas.campaign import CampaignPlanRequest, CampaignUpdateRequest
from app.services.campaign import CampaignService
from app.database import get_db
from app.models.campaign import Campaign
from app.models.communication import Communication
from app.utils.deps import get_campaign_service

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.post("/plan")
async def plan_campaign(
    request: CampaignPlanRequest,
    service: CampaignService = Depends(get_campaign_service),
):
    """Send a natural language objective → get an AI campaign plan."""
    try:
        plan = await service.plan_campaign(request.objective)
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{campaign_id}/launch")
async def launch_campaign(
    campaign_id: int,
    service: CampaignService = Depends(get_campaign_service),
):
    """Launch a planned campaign — sends communications to channel service."""
    try:
        result = await service.launch_campaign(campaign_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{campaign_id}")
async def update_campaign(
    campaign_id: int,
    request: CampaignUpdateRequest,
    service: CampaignService = Depends(get_campaign_service),
):
    """Update name or message for a draft campaign."""
    try:
        result = await service.update_campaign(
            campaign_id, name=request.name, message=request.message
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    service: CampaignService = Depends(get_campaign_service),
):
    """Delete a draft campaign."""
    try:
        result = await service.delete_campaign(campaign_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
):
    """List all campaigns."""
    stmt = select(Campaign)
    result = await db.execute(stmt)
    campaigns = result.scalars().all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "objective": c.objective,
            "status": c.status,
            "audience_count": c.audience_count,
            "channel": c.channel,
            "created_at": c.created_at.isoformat() if c.created_at else "",
        }
        for c in campaigns
    ]


@router.get("/{campaign_id}")
async def get_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get campaign details with metrics."""
    stmt = select(Campaign).where(Campaign.id == campaign_id)
    result = await db.execute(stmt)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Get communications for metrics
    stmt = select(Communication).where(Communication.campaign_id == campaign_id)
    result = await db.execute(stmt)
    comms = result.scalars().all()

    delivered = sum(1 for c in comms if c.status == "delivered")
    opened = sum(1 for c in comms if any(e.event_type == "opened" for e in c.events))
    clicked = sum(1 for c in comms if any(e.event_type == "clicked" for e in c.events))
    converted = sum(1 for c in comms if any(e.event_type == "converted" for e in c.events))

    metrics = {
        "sent": len(comms),
        "delivered": delivered,
        "opened": opened,
        "clicked": clicked,
        "converted": converted,
    }

    return {
        "id": campaign.id,
        "name": campaign.name,
        "objective": campaign.objective,
        "audience_summary": campaign.audience_summary,
        "audience_count": campaign.audience_count,
        "message": campaign.message,
        "channel": campaign.channel,
        "ai_reasoning": campaign.ai_reasoning,
        "estimated_conversion": campaign.estimated_conversion,
        "status": campaign.status,
        "created_at": campaign.created_at.isoformat() if campaign.created_at else "",
        "metrics": metrics,
    }


@router.get("/{campaign_id}/timeline")
async def get_campaign_timeline(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get chronological event timeline for a campaign."""
    stmt = select(Campaign).where(Campaign.id == campaign_id)
    result = await db.execute(stmt)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Get all communications and their events
    stmt = select(Communication).where(Communication.campaign_id == campaign_id)
    result = await db.execute(stmt)
    comms = result.scalars().all()

    timeline = []
    for comm in comms:
        for event in comm.events:
            timeline.append({
                "event_type": event.event_type,
                "created_at": event.created_at.isoformat() if event.created_at else "",
            })

    return sorted(timeline, key=lambda x: x["created_at"], reverse=True)


@router.get("/{campaign_id}/summary")
async def get_campaign_summary(
    campaign_id: int,
    service: CampaignService = Depends(get_campaign_service),
):
    """Get AI-generated performance summary."""
    try:
        summary = await service.get_campaign_summary(campaign_id)
        return summary
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
