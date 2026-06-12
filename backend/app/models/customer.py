"""Customer model — represents a coffee chain customer."""

from datetime import date
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(20))
    city: Mapped[str] = mapped_column(String(50))
    age: Mapped[int]
    total_spend: Mapped[float]
    last_order: Mapped[date]
    preferred_channel: Mapped[str] = mapped_column(String(20))

    # Relationships
    orders: Mapped[list["Order"]] = relationship(
        back_populates="customer", lazy="selectin"
    )
    communications: Mapped[list["Communication"]] = relationship( 
        back_populates="customer", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Customer {self.id}: {self.name}>"
