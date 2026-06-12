"""Channel Service — simulates message delivery lifecycle.

This is a separate FastAPI service from the CRM.
It receives communications via POST /send, simulates the delivery
pipeline (queued → delivered → opened → read → clicked → converted),
and reports each event back to the CRM via POST /receipt callbacks.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, BackgroundTasks

from app.schemas import SendRequest, SendResponse
from app.simulator import simulate_delivery

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Channel Service started.")
    yield
    logger.info("Channel Service stopped.")


app = FastAPI(
    title="CampaignPilot — Channel Service",
    description="Simulates message delivery lifecycle with callbacks",
    version="1.0.0",
    lifespan=lifespan,
)


@app.post("/send", response_model=SendResponse)
async def send_message(
    request: SendRequest,
    background_tasks: BackgroundTasks,
):
    """Receive a communication and start simulating its delivery.

    The actual simulation runs as a background task — this endpoint
    returns immediately with an acknowledgement.
    """
    logger.info(
        f"Received comm {request.communication_id} "
        f"for {request.customer_name} via {request.channel}"
    )

    background_tasks.add_task(simulate_delivery, request.communication_id)

    return SendResponse(
        communication_id=request.communication_id,
        status="accepted",
    )


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "channel"}
