"""Data import API — handles CSV and Excel file uploads for customers and orders."""

import csv
import io
import logging
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/import", tags=["import"])


def parse_date(value: str) -> date | None:
    """Try common date formats."""
    if not value or not value.strip():
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%m-%d-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(value.strip(), fmt).date()
        except ValueError:
            continue
    return None


def parse_datetime(value: str) -> datetime | None:
    """Try common datetime formats."""
    if not value or not value.strip():
        return None
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y",
        "%m/%d/%Y",
    ):
        try:
            return datetime.strptime(value.strip(), fmt)
        except ValueError:
            continue
    return None


def parse_float(value) -> float:
    """Safely parse a float value."""
    if value is None:
        return 0.0
    try:
        return float(str(value).strip().replace(",", ""))
    except (ValueError, TypeError):
        return 0.0


def parse_int(value) -> int:
    """Safely parse an int value."""
    if value is None:
        return 0
    try:
        return int(float(str(value).strip()))
    except (ValueError, TypeError):
        return 0


def normalize_header(header: str) -> str:
    """Normalize column header for flexible matching."""
    return header.strip().lower().replace(" ", "_").replace("-", "_")


# ── Customers Import ────────────────────────────────────────────

CUSTOMER_FIELD_MAP = {
    "name": "name",
    "customer_name": "name",
    "full_name": "name",
    "email": "email",
    "email_address": "email",
    "phone": "phone",
    "phone_number": "phone",
    "mobile": "phone",
    "city": "city",
    "location": "city",
    "age": "age",
    "total_spend": "total_spend",
    "spend": "total_spend",
    "total_spending": "total_spend",
    "last_order": "last_order",
    "last_order_date": "last_order",
    "last_purchase": "last_order",
    "preferred_channel": "preferred_channel",
    "channel": "preferred_channel",
}

CUSTOMER_REQUIRED = {"name", "email"}


def map_customer_row(row: dict) -> dict | None:
    """Map a raw CSV/Excel row to customer fields."""
    mapped = {}
    for raw_key, value in row.items():
        norm = normalize_header(raw_key)
        if norm in CUSTOMER_FIELD_MAP:
            mapped[CUSTOMER_FIELD_MAP[norm]] = value

    # Validate required
    if not mapped.get("name") or not mapped.get("email"):
        return None

    return {
        "name": str(mapped["name"]).strip(),
        "email": str(mapped["email"]).strip(),
        "phone": str(mapped.get("phone", "")).strip(),
        "city": str(mapped.get("city", "")).strip(),
        "age": parse_int(mapped.get("age", 0)),
        "total_spend": parse_float(mapped.get("total_spend", 0)),
        "last_order": parse_date(str(mapped.get("last_order", ""))),
        "preferred_channel": str(mapped.get("preferred_channel", "email")).strip().lower(),
    }


# ── Orders Import ───────────────────────────────────────────────

ORDER_FIELD_MAP = {
    "customer_email": "customer_email",
    "email": "customer_email",
    "product": "product",
    "product_name": "product",
    "item": "product",
    "category": "category",
    "product_category": "category",
    "amount": "amount",
    "price": "amount",
    "total": "amount",
    "order_amount": "amount",
    "created_at": "created_at",
    "order_date": "created_at",
    "date": "created_at",
    "purchase_date": "created_at",
}

ORDER_REQUIRED = {"customer_email", "product", "amount"}


def map_order_row(row: dict) -> dict | None:
    """Map a raw CSV/Excel row to order fields."""
    mapped = {}
    for raw_key, value in row.items():
        norm = normalize_header(raw_key)
        if norm in ORDER_FIELD_MAP:
            mapped[ORDER_FIELD_MAP[norm]] = value

    if not mapped.get("customer_email") or not mapped.get("product") or mapped.get("amount") is None:
        return None

    return {
        "customer_email": str(mapped["customer_email"]).strip(),
        "product": str(mapped["product"]).strip(),
        "category": str(mapped.get("category", "General")).strip(),
        "amount": parse_float(mapped["amount"]),
        "created_at": parse_datetime(str(mapped.get("created_at", ""))) or datetime.now(),
    }


# ── File Parsing ────────────────────────────────────────────────

async def parse_file(file: UploadFile) -> list[dict]:
    """Parse CSV or Excel file into list of dicts."""
    filename = file.filename or ""
    content = await file.read()

    if filename.endswith((".xlsx", ".xls")):
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
        ws = wb.active
        rows_iter = ws.iter_rows(values_only=True)
        headers = [str(h or "").strip() for h in next(rows_iter)]
        records = []
        for row_values in rows_iter:
            row_dict = {headers[i]: (str(v).strip() if v is not None else "") for i, v in enumerate(row_values) if i < len(headers)}
            records.append(row_dict)
        wb.close()
        return records
    else:
        # CSV
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        return list(reader)


# ── Endpoints ───────────────────────────────────────────────────

@router.post("/customers")
async def import_customers(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Import customers from a CSV or Excel file.

    Expected columns: name, email, phone, city, age, total_spend, last_order, preferred_channel
    """
    if not file.filename:
        raise HTTPException(400, "No file uploaded")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(400, "Only CSV and Excel files are supported")

    try:
        rows = await parse_file(file)
    except Exception as e:
        logger.error(f"File parsing error: {e}")
        raise HTTPException(400, f"Could not parse file: {str(e)}")

    if not rows:
        raise HTTPException(400, "File is empty or has no data rows")

    imported = 0
    skipped = 0
    errors = []

    mapped_rows = []
    emails_to_fetch = set()

    for idx, row in enumerate(rows, start=2):
        mapped = map_customer_row(row)
        if not mapped:
            skipped += 1
            errors.append(f"Row {idx}: Missing required fields (name, email)")
            continue
        mapped_rows.append(mapped)
        emails_to_fetch.add(mapped["email"])

    # Pre-fetch existing customers to avoid N+1 queries
    existing_customers = {}
    if emails_to_fetch:
        emails_list = list(emails_to_fetch)
        chunk_size = 1000
        for i in range(0, len(emails_list), chunk_size):
            chunk = emails_list[i:i + chunk_size]
            stmt = select(Customer).where(Customer.email.in_(chunk))
            result = await db.execute(stmt)
            for customer in result.scalars().all():
                existing_customers[customer.email] = customer

    for mapped in mapped_rows:
        existing = existing_customers.get(mapped["email"])
        if existing:
            # Update existing customer
            for key, value in mapped.items():
                if value is not None and value != "" and value != 0:
                    setattr(existing, key, value)
            imported += 1
        else:
            # Handle missing last_order
            if mapped["last_order"] is None:
                mapped["last_order"] = date.today()
            customer = Customer(**mapped)
            db.add(customer)
            imported += 1

    await db.commit()

    return {
        "status": "success",
        "imported": imported,
        "skipped": skipped,
        "total_rows": len(rows),
        "errors": errors[:10],  # Return first 10 errors
    }


@router.post("/orders")
async def import_orders(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Import orders from a CSV or Excel file.

    Expected columns: customer_email (or email), product, category, amount, created_at (or order_date)
    """
    if not file.filename:
        raise HTTPException(400, "No file uploaded")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(400, "Only CSV and Excel files are supported")

    try:
        rows = await parse_file(file)
    except Exception as e:
        logger.error(f"File parsing error: {e}")
        raise HTTPException(400, f"Could not parse file: {str(e)}")

    if not rows:
        raise HTTPException(400, "File is empty or has no data rows")

    mapped_orders = []
    emails_to_fetch = set()
    skipped = 0
    errors = []

    for idx, row in enumerate(rows, start=2):
        mapped = map_order_row(row)
        if not mapped:
            skipped += 1
            errors.append(f"Row {idx}: Missing required fields (customer_email, product, amount)")
            continue
        mapped_orders.append((idx, mapped))
        emails_to_fetch.add(mapped["customer_email"])

    # Build email → customer_id map only for required emails
    email_map = {}
    if emails_to_fetch:
        emails_list = list(emails_to_fetch)
        chunk_size = 1000
        for i in range(0, len(emails_list), chunk_size):
            chunk = emails_list[i:i + chunk_size]
            stmt = select(Customer.id, Customer.email).where(Customer.email.in_(chunk))
            result = await db.execute(stmt)
            for cid, email in result.all():
                email_map[email] = cid

    imported = 0

    for idx, mapped in mapped_orders:
        customer_id = email_map.get(mapped["customer_email"])
        if not customer_id:
            skipped += 1
            errors.append(f"Row {idx}: Customer not found for email '{mapped['customer_email']}'")
            continue

        order = Order(
            customer_id=customer_id,
            product=mapped["product"],
            category=mapped["category"],
            amount=mapped["amount"],
            created_at=mapped["created_at"],
        )
        db.add(order)
        imported += 1

    await db.commit()

    return {
        "status": "success",
        "imported": imported,
        "skipped": skipped,
        "total_rows": len(rows),
        "errors": errors[:10],
    }


@router.get("/template")
async def get_templates():
    """Return expected column formats for import templates."""
    return {
        "customers": {
            "columns": ["name", "email", "phone", "city", "age", "total_spend", "last_order", "preferred_channel"],
            "example_row": {
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+919876543210",
                "city": "Mumbai",
                "age": "28",
                "total_spend": "1500.50",
                "last_order": "2026-01-15",
                "preferred_channel": "email",
            },
        },
        "orders": {
            "columns": ["customer_email", "product", "category", "amount", "order_date"],
            "example_row": {
                "customer_email": "john@example.com",
                "product": "Cappuccino",
                "category": "Hot Beverages",
                "amount": "250.00",
                "order_date": "2026-06-01",
            },
        },
    }
