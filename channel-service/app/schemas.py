"""Channel service request/response schemas."""

from pydantic import BaseModel


class SendRequest(BaseModel):
    """Incoming request from CRM to deliver a message."""
    communication_id: int
    customer_name: str
    channel: str
    message: str


class SendResponse(BaseModel):
    """Acknowledgement that delivery simulation has started."""
    communication_id: int
    status: str
