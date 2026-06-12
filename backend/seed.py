"""Seed script — generates realistic fake data for CampaignPilot.

Generates:
- 1,000 customers (Indian names, cities, realistic spend distributions)
- 5,000 orders (coffee products, varied amounts)
- 20 campaigns (mix of statuses)
- ~3,000 communications (linked to campaigns)
- ~15,000 communication events (realistic funnel drop-off)
"""

import asyncio
import random
import math
from datetime import datetime, date, timedelta

from faker import Faker

from app.database import engine, AsyncSessionLocal, Base
from app.models import Customer, Order, Campaign, Communication, CommunicationEvent

fake = Faker("en_IN")
random.seed(42)

# --- Constants ---

CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
    "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
    "Chandigarh", "Kochi", "Indore", "Nagpur", "Coimbatore",
]

CHANNELS = ["whatsapp", "email", "sms"]

PRODUCTS = {
    "Hot Beverages": [
        "Espresso", "Cappuccino", "Latte", "Americano", "Mocha",
        "Flat White", "Macchiato", "Hot Chocolate",
    ],
    "Cold Beverages": [
        "Iced Latte", "Cold Brew", "Frappe", "Iced Mocha",
        "Mango Smoothie", "Berry Blast",
    ],
    "Food": [
        "Croissant", "Blueberry Muffin", "Panini", "Bagel",
        "Brownie", "Cheesecake Slice",
    ],
    "Merchandise": [
        "Travel Mug", "Coffee Beans 250g", "Coffee Beans 500g",
        "Gift Card",
    ],
}

CAMPAIGN_OBJECTIVES = [
    "Re-engage customers who haven't ordered in 30+ days with a 15% discount",
    "Promote new cold brew line to premium customers",
    "Weekend special: Buy 1 Get 1 on all hot beverages",
    "Loyalty reward for top 100 spenders",
    "Monsoon special campaign for all chai lovers",
    "Birthday month special offer for customers",
    "Launch promotion for Bangalore flagship store",
    "Diwali festive campaign with combo offers",
    "Summer cooler campaign targeting metro cities",
    "Win-back campaign for churned customers (60+ days inactive)",
    "New year resolution campaign — healthy smoothies",
    "Valentine's day couple offer",
    "Refer a friend campaign for active users",
    "Flash sale: 20% off on merchandise",
    "Breakfast combo launch campaign",
    "Student discount campaign for 18-25 age group",
    "Corporate bulk order promotion",
    "Anniversary celebration — flat ₹100 off",
    "Festive season campaign — holiday specials",
    "Premium membership launch announcement",
]

CAMPAIGN_STATUSES = [
    "completed", "completed", "completed", "completed", "completed",
    "completed", "completed", "completed", "completed", "completed",
    "completed", "completed", "completed",
    "active", "active", "active",
    "draft", "draft", "draft", "draft",
]


def log_normal_spend() -> float:
    """Generate spend following log-normal distribution (few big spenders, many moderate)."""
    return round(math.exp(random.gauss(7.5, 1.2)), 2)


async def seed():
    """Main seed function."""
    print("Starting seed...")

    # Drop and recreate tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # --- Customers ---
        print("Creating 1,000 customers...")
        customers = []
        for i in range(1000):
            last_order_days_ago = random.choices(
                [random.randint(1, 15), random.randint(16, 45), random.randint(46, 120), random.randint(121, 365)],
                weights=[40, 25, 20, 15],
            )[0]

            customer = Customer(
                name=fake.name(),
                email=fake.email(),
                phone=fake.phone_number()[:15],
                city=random.choice(CITIES),
                age=random.randint(18, 55),
                total_spend=log_normal_spend(),
                last_order=date.today() - timedelta(days=last_order_days_ago),
                preferred_channel=random.choices(CHANNELS, weights=[50, 30, 20])[0],
            )
            customers.append(customer)
            db.add(customer)

        await db.flush()
        print(f"  {len(customers)} customers created")

        # --- Orders ---
        print("Creating 5,000 orders...")
        orders = []
        for _ in range(5000):
            customer = random.choice(customers)
            category = random.choice(list(PRODUCTS.keys()))
            product = random.choice(PRODUCTS[category])

            # Price ranges by category
            price_ranges = {
                "Hot Beverages": (150, 450),
                "Cold Beverages": (200, 500),
                "Food": (120, 400),
                "Merchandise": (300, 2000),
            }
            min_p, max_p = price_ranges[category]

            # Cluster orders around weekends and mornings
            days_ago = random.randint(1, 365)
            order_date = datetime.now() - timedelta(
                days=days_ago,
                hours=random.choices(
                    [random.randint(7, 10), random.randint(11, 14), random.randint(15, 21)],
                    weights=[45, 30, 25],
                )[0],
                minutes=random.randint(0, 59),
            )

            order = Order(
                customer_id=customer.id,
                product=product,
                category=category,
                amount=round(random.uniform(min_p, max_p), 2),
                created_at=order_date,
            )
            orders.append(order)
            db.add(order)

        await db.flush()
        print(f"  {len(orders)} orders created")

        # --- Campaigns ---
        print("Creating 20 campaigns...")
        campaigns = []
        for i in range(20):
            days_ago = random.randint(1, 180)
            campaign = Campaign(
                name=f"Campaign #{i+1}",
                objective=CAMPAIGN_OBJECTIVES[i],
                audience_summary=f"Targeted segment for campaign #{i+1}",
                audience_count=random.randint(50, 400),
                message=f"Hey! {CAMPAIGN_OBJECTIVES[i]}. Don't miss out! 🎉",
                channel=random.choice(CHANNELS),
                ai_reasoning=f"This audience was selected based on spending patterns and engagement history to maximize campaign #{i+1} effectiveness.",
                estimated_conversion=round(random.uniform(0.03, 0.15), 3),
                status=CAMPAIGN_STATUSES[i],
                created_at=datetime.now() - timedelta(days=days_ago),
            )
            campaigns.append(campaign)
            db.add(campaign)

        await db.flush()
        print(f"  {len(campaigns)} campaigns created")

        # --- Communications & Events ---
        print("Creating communications and events...")
        total_comms = 0
        total_events = 0

        # Only create comms for non-draft campaigns
        active_campaigns = [c for c in campaigns if c.status != "draft"]

        for campaign in active_campaigns:
            # Select random customers for this campaign
            num_comms = campaign.audience_count
            selected_customers = random.sample(
                customers, min(num_comms, len(customers))
            )

            # Vary performance by campaign
            campaign_quality = random.uniform(0.3, 0.95)

            for customer in selected_customers:
                comm = Communication(
                    campaign_id=campaign.id,
                    customer_id=customer.id,
                    channel=campaign.channel or "whatsapp",
                    message=campaign.message or "",
                    status="pending",
                )
                db.add(comm)
                await db.flush()
                total_comms += 1

                # Simulate delivery lifecycle with realistic drop-off
                event_probabilities = [
                    ("queued", 0.98),
                    ("delivered", 0.95 * campaign_quality),
                    ("opened", 0.45 * campaign_quality),
                    ("read", 0.35 * campaign_quality),
                    ("clicked", 0.15 * campaign_quality),
                    ("converted", 0.05 * campaign_quality),
                ]

                base_time = campaign.created_at or datetime.now()
                cumulative_passed = True
                final_status = "pending"

                for event_type, prob in event_probabilities:
                    if not cumulative_passed:
                        break
                    if random.random() < prob:
                        delay_minutes = {
                            "queued": random.randint(0, 2),
                            "delivered": random.randint(1, 30),
                            "opened": random.randint(5, 720),
                            "read": random.randint(10, 1440),
                            "clicked": random.randint(30, 2880),
                            "converted": random.randint(60, 4320),
                        }
                        event = CommunicationEvent(
                            communication_id=comm.id,
                            event_type=event_type,
                            created_at=base_time + timedelta(
                                minutes=delay_minutes[event_type]
                            ),
                        )
                        db.add(event)
                        total_events += 1
                        final_status = event_type
                    else:
                        cumulative_passed = False

                comm.status = final_status

        await db.commit()
        print(f"  {total_comms} communications created")
        print(f"  {total_events} communication events created")

    print("\nSeed complete!")
    print(f"   Customers: 1,000")
    print(f"   Orders: 5,000")
    print(f"   Campaigns: 20")
    print(f"   Communications: {total_comms}")
    print(f"   Events: {total_events}")


if __name__ == "__main__":
    asyncio.run(seed())
