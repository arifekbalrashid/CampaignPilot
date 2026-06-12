"""Campaign model — represents a marketing campaign planned by AI."""

from datetime import datetime
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), default="Untitled Campaign")
    objective: Mapped[str] = mapped_column(Text)
    audience_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    audience_count: Mapped[int] = mapped_column(default=0)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    channel: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ai_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    estimated_conversion: Mapped[float | None] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    # Relationships
    communications: Mapped[list["Communication"]] = relationship(
        back_populates="campaign", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Campaign {self.id}: {self.name} [{self.status}]>"
