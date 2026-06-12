"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_tables
from app.api import dashboard, campaigns, customers, receipts, imports, auth

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
    logger.info("Starting CampaignPilot CRM...")
    await create_tables()
    logger.info("Database tables ready.")
    yield
    logger.info("Shutting down CampaignPilot CRM.")


app = FastAPI(
    title="CampaignPilot AI — CRM",
    description="AI-powered campaign planning and execution platform",
    version="1.0.0",
    lifespan=lifespan,
)

from app.config import get_settings

settings = get_settings()

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(dashboard.router)
app.include_router(auth.router)
app.include_router(campaigns.router)
app.include_router(customers.router)
app.include_router(receipts.router)
app.include_router(imports.router)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "crm"}
