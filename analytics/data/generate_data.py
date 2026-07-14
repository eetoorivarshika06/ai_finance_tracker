import random
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd


SEED = 42
random.seed(SEED)
np.random.seed(SEED)

START_DATE = datetime(2025, 7, 1)
MONTHS = 12
OUTPUT_PATH = Path(__file__).resolve().parent / "sample_transactions.csv"


CATEGORIES = [
    {
        "category": "Salary",
        "type": "income",
        "frequency": "monthly",
        "base_range": (45000, 55000),
        "descriptions": ["Monthly salary", "Payroll deposit", "Salary credit"],
    },
    {
        "category": "Freelance",
        "type": "income",
        "frequency": "sparse",
        "base_range": (2000, 15000),
        "descriptions": ["Freelance project", "Design work", "Consulting invoice"],
    },
    {
        "category": "Rent",
        "type": "expense",
        "frequency": "monthly",
        "base_range": (12000, 12000),
        "descriptions": ["Monthly rent", "Apartment rent", "Housing payment"],
    },
    {
        "category": "Groceries",
        "type": "expense",
        "frequency": "weekly",
        "base_range": (3000, 8000),
        "descriptions": ["Supermarket run", "Grocery delivery", "Local market"],
    },
    {
        "category": "Dining",
        "type": "expense",
        "frequency": "weekly",
        "base_range": (500, 4000),
        "descriptions": ["Restaurant meal", "Coffee and snacks", "Food delivery"],
    },
    {
        "category": "Transport",
        "type": "expense",
        "frequency": "weekly",
        "base_range": (1000, 3500),
        "descriptions": ["Metro pass", "Fuel refill", "Ride share"],
    },
    {
        "category": "Utilities",
        "type": "expense",
        "frequency": "monthly",
        "base_range": (1500, 3000),
        "descriptions": ["Electricity bill", "Water bill", "Internet payment"],
    },
    {
        "category": "Entertainment",
        "type": "expense",
        "frequency": "sparse",
        "base_range": (500, 3000),
        "descriptions": ["Movie night", "Streaming subscription", "Event ticket"],
    },
    {
        "category": "Shopping",
        "type": "expense",
        "frequency": "sparse",
        "base_range": (500, 6000),
        "descriptions": ["Online shopping", "Retail purchase", "Household item"],
    },
    {
        "category": "Healthcare",
        "type": "expense",
        "frequency": "sparse",
        "base_range": (500, 5000),
        "descriptions": ["Medical appointment", "Pharmacy purchase", "Emergency visit"],
    },
    {
        "category": "Investments",
        "type": "expense",
        "frequency": "monthly",
        "base_range": (2000, 10000),
        "descriptions": ["Mutual fund SIP", "Investment transfer", "Portfolio contribution"],
    },
    {
        "category": "Subscriptions",
        "type": "expense",
        "frequency": "monthly",
        "base_range": (200, 1500),
        "descriptions": ["App subscription", "Software renewal", "Membership fee"],
    },
]


def random_amount(base_range, month_index):
    low, high = base_range
    base = random.uniform(low, high)
    drift = 1.015 ** month_index
    amount = base * drift
    return round(amount, 2)


def maybe_outlier(amount, is_expense):
    if is_expense and random.random() < 0.02:
        return round(amount * random.uniform(3.0, 6.0), 2)
    return amount


def generate_transactions():
    rows = []
    month_start = START_DATE

    for month_idx in range(MONTHS):
        month_date = month_start + timedelta(days=30 * month_idx)
        month_label = month_date.strftime("%Y-%m")

        for category_cfg in CATEGORIES:
            category = category_cfg["category"]
            tx_type = category_cfg["type"]
            frequency = category_cfg["frequency"]
            base_range = category_cfg["base_range"]
            descriptions = category_cfg["descriptions"]

            if frequency == "monthly":
                occurrence_dates = [month_date.replace(day=1)]
            elif frequency == "weekly":
                occurrence_dates = [month_date + timedelta(days=7 * week) for week in range(4)]
            else:
                occurrence_dates = []
                for _ in range(2):
                    if random.random() < 0.6:
                        occurrence_dates.append(month_date + timedelta(days=random.randint(0, 27)))

            if frequency == "sparse" and not occurrence_dates:
                continue

            for tx_date in occurrence_dates:
                amount = random_amount(base_range, month_idx)
                amount = maybe_outlier(amount, tx_type == "expense")
                description = random.choice(descriptions)
                rows.append(
                    {
                        "transaction_id": f"TXN-{len(rows) + 1:05d}",
                        "date": tx_date.date().isoformat(),
                        "type": tx_type,
                        "category": category,
                        "amount": amount,
                        "description": description,
                    }
                )

    df = pd.DataFrame(rows, columns=["transaction_id", "date", "type", "category", "amount", "description"])
    df = df.sort_values("date").reset_index(drop=True)
    df.to_csv(OUTPUT_PATH, index=False)
    return df


if __name__ == "__main__":
    df = generate_transactions()
    print(f"Generated {len(df)} transactions")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"Total income: ₹{df.loc[df['type'] == 'income', 'amount'].sum():,.2f}")
    print(f"Total expense: ₹{df.loc[df['type'] == 'expense', 'amount'].sum():,.2f}")
