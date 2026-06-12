"""Receipt webhook — receives delivery events from channel service."""

import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.schemas.communication import ReceiptRequest
from app.database import get_db
from app.models.communication import Communication
from app.models.communication_event import CommunicationEvent
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/receipts", tags=["receipts"])


@router.post("")
async def receive_receipt(
    request: ReceiptRequest,
    db: AsyncSession = Depends(get_db),
):
    """Webhook endpoint — channel service reports delivery events.

    Idempotent: duplicate events are silently ignored.
    """
    # Check if this event already exists
    stmt = select(CommunicationEvent).where(
        (CommunicationEvent.communication_id == request.communication_id)
        & (CommunicationEvent.event_type == request.event_type)
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        logger.debug(
            f"Duplicate receipt: comm={request.communication_id} event={request.event_type}"
        )
        return {"status": "duplicate", "event_type": request.event_type}

    # Create new event
    event = CommunicationEvent(
        communication_id=request.communication_id,
        event_type=request.event_type,
        created_at=datetime.utcnow(),
    )
    db.add(event)

    # Update communication status based on event
    stmt = select(Communication).where(Communication.id == request.communication_id)
    result = await db.execute(stmt)
    comm = result.scalar_one_or_none()

    if comm:
        if request.event_type in ("delivered", "opened", "read", "clicked"):
            comm.status = request.event_type
        elif request.event_type == "converted":
            comm.status = "converted"
        db.add(comm)

    await db.commit()

    logger.info(
        f"Receipt: comm={request.communication_id} event={request.event_type}"
    )
    return {"status": "recorded", "event_type": request.event_type}
