"""Customer request/response schemas."""

from datetime import date
from pydantic import BaseModel


class CustomerBase(BaseModel):
    name: str
    email: str
    phone: str
    city: str
    age: int
    total_spend: float
    last_order: date
    preferred_channel: str


class CustomerResponse(CustomerBase):
    id: int

    model_config = {"from_attributes": True}


class CustomerDetail(CustomerResponse):
    """Customer with order and campaign history."""
    orders: list["OrderBrief"] = []
    campaign_history: list["CampaignBrief"] = []


class OrderBrief(BaseModel):
    id: int
    product: str
    category: str
    amount: float
    created_at: str

    model_config = {"from_attributes": True}


class CampaignBrief(BaseModel):
    campaign_id: int
    campaign_name: str
    channel: str
    status: str

    model_config = {"from_attributes": True}


class CustomerListResponse(BaseModel):
    customers: list[CustomerResponse]
    total: int
    page: int
    page_size: int
