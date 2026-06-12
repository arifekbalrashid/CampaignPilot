"""Delivery lifecycle simulator.

Simulates the progression of a message through the delivery funnel:
queued → delivered → opened → read → clicked → converted

Each step has a probability of occurring and a randomized delay.
After each event, a callback is sent to the CRM via POST /receipt.
Callbacks include retry logic (3 attempts with exponential backoff).
"""

import asyncio
import logging
import random

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

# Event probabilities — each event only fires if the previous one did
EVENT_PIPELINE = [
    ("queued", 0.98, (0.5, 2.0)),       # (event_type, probability, (min_delay_s, max_delay_s))
    ("delivered", 0.92, (1.0, 5.0)),
    ("opened", 0.55, (3.0, 15.0)),
    ("read", 0.70, (2.0, 8.0)),         # 70% of openers also read
    ("clicked", 0.35, (5.0, 20.0)),     # 35% of readers click
    ("converted", 0.25, (10.0, 30.0)),  # 25% of clickers convert
]

MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 2  # seconds


async def simulate_delivery(communication_id: int) -> None:
    """Simulate the full delivery lifecycle for a single communication.

    Runs as a background task. Each event fires with a probability
    and delay, then sends a callback to the CRM.
    """
    settings = get_settings()

    for event_type, probability, (min_delay, max_delay) in EVENT_PIPELINE:
        # Random delay to simulate real-world timing
        delay = random.uniform(min_delay, max_delay)
        await asyncio.sleep(delay)

        # Probabilistic drop-off
        if random.random() > probability:
            logger.info(
                f"Comm {communication_id}: dropped at {event_type} "
                f"(prob={probability})"
            )
            break

        # Send callback to CRM
        success = await _send_callback(
            settings.crm_callback_url,
            communication_id,
            event_type,
        )

        if success:
            logger.info(f"Comm {communication_id}: {event_type} ✓")
        else:
            logger.error(
                f"Comm {communication_id}: failed to report {event_type} "
                f"after {MAX_RETRIES} retries"
            )
            break  # Stop pipeline if we can't report


async def _send_callback(
    callback_url: str,
    communication_id: int,
    event_type: str,
) -> bool:
    """Send event callback to CRM with retry logic."""
    payload = {
        "communication_id": communication_id,
        "event_type": event_type,
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(callback_url, json=payload)
                response.raise_for_status()
                return True
        except httpx.HTTPError as e:
            logger.warning(
                f"Callback attempt {attempt}/{MAX_RETRIES} failed for "
                f"comm {communication_id} ({event_type}): {e}"
            )
            if attempt < MAX_RETRIES:
                backoff = RETRY_BACKOFF_BASE ** attempt
                await asyncio.sleep(backoff)

    return False
