"""ORM models package — import all models here so Base.metadata sees them."""

from app.models.customer import Customer
from app.models.order import Order
from app.models.campaign import Campaign
from app.models.communication import Communication
from app.models.communication_event import CommunicationEvent

__all__ = [
    "Customer",
    "Order",
    "Campaign",
    "Communication",
    "CommunicationEvent",
]
