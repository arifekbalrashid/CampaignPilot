"""Communication model — a single message sent to a customer as part of a campaign."""

from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Communication(Base):
    __tablename__ = "communications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"))
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    channel: Mapped[str] = mapped_column(String(20))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="pending")

    # Relationships
    campaign: Mapped["Campaign"] = relationship(  
        back_populates="communications"
    )
    customer: Mapped["Customer"] = relationship( 
        back_populates="communications"
    )
    events: Mapped[list["CommunicationEvent"]] = relationship( 
        back_populates="communication", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Communication {self.id}: {self.channel} [{self.status}]>"
