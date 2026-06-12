"""Communication schemas for channel service interaction."""

from pydantic import BaseModel


class SendRequest(BaseModel):
    """Sent to channel service to initiate delivery."""
    communication_id: int
    customer_name: str
    channel: str
    message: str


class ReceiptRequest(BaseModel):
    """Received from channel service as delivery event callback."""
    communication_id: int
    event_type: str


class CommunicationResponse(BaseModel):
    id: int
    campaign_id: int
    customer_id: int
    channel: str
    status: str

    model_config = {"from_attributes": True}