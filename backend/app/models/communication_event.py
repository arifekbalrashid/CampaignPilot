"""CommunicationEvent model — immutable log of delivery lifecycle events."""

from datetime import datetime
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class CommunicationEvent(Base):
    __tablename__ = "communication_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    communication_id: Mapped[int] = mapped_column(ForeignKey("communications.id"))
    event_type: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    # Relationships
    communication: Mapped["Communication"] = relationship( 
        back_populates="events"
    )

    def __repr__(self) -> str:
        return f"<Event {self.id}: {self.event_type}>"
