"""Order model — represents a customer purchase."""

from datetime import datetime
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    product: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(50))
    amount: Mapped[float]
    created_at: Mapped[datetime]

    # Relationships
    customer: Mapped["Customer"] = relationship( 
        back_populates="orders"
    )

    def __repr__(self) -> str:
        return f"<Order {self.id}: {self.product} ₹{self.amount}>"
