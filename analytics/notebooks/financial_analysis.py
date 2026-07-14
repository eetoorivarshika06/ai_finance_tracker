"""
Financial Analysis: AI Finance Tracker
Analyzes personal finance transaction data to surface spending trends,
category breakdowns, savings behavior, and anomalies.
"""

from pathlib import Path

import pandas as pd
import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_style("whitegrid")
plt.rcParams["figure.figsize"] = (10, 5)

if "__file__" in globals():
    base_candidates = [Path(__file__).resolve().parent.parent]
else:
    cwd = Path.cwd()
    base_candidates = [cwd, cwd / "analytics", cwd.parent, cwd.parent / "analytics"]

BASE_DIR = None
for candidate in base_candidates:
    if (candidate / "data" / "sample_transactions.csv").exists():
        BASE_DIR = candidate
        break

if BASE_DIR is None:
    BASE_DIR = Path.cwd()

DATA_PATH = BASE_DIR / "data" / "sample_transactions.csv"
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Load data ─────────────────────────────────────────
df = pd.read_csv(DATA_PATH, parse_dates=["date"])
df["month"] = df["date"].dt.to_period("M")

print(f"Loaded {len(df)} transactions from {df['date'].min().date()} to {df['date'].max().date()}")
df.head()

# ── 1. Monthly income vs expense trend ───────────────
monthly = df.groupby(["month", "type"])["amount"].sum().unstack(fill_value=0)
monthly.index = monthly.index.astype(str)

ax = monthly.plot(kind="line", marker="o", figsize=(10, 5))
ax.set_title("Monthly Income vs Expense Trend")
ax.set_ylabel("Amount (₹)")
ax.set_xlabel("Month")
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "monthly_trend.png", dpi=120)
plt.show()

avg_income = monthly["income"].mean()
avg_expense = monthly["expense"].mean()
print(f"Insight: Average monthly income ₹{avg_income:,.0f} vs average expense ₹{avg_expense:,.0f} "
      f"→ average monthly surplus of ₹{avg_income - avg_expense:,.0f}")

# ── 2. Category-wise spending breakdown ──────────────
category_spend = df[df["type"] == "expense"].groupby("category")["amount"].sum().sort_values(ascending=False)
category_pct = (category_spend / category_spend.sum() * 100).round(1)

ax = category_spend.plot(kind="bar", color=sns.color_palette("Blues_r", len(category_spend)))
ax.set_title("Total Spending by Category")
ax.set_ylabel("Amount (₹)")
plt.xticks(rotation=45, ha="right")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "category_breakdown.png", dpi=120)
plt.show()

print("Top 3 spending categories:")
print(category_pct.head(3))

# ── 3. Savings rate over time ────────────────────────
monthly["savings"] = monthly["income"] - monthly["expense"]
monthly["savings_rate_%"] = (monthly["savings"] / monthly["income"] * 100).round(1)

ax = monthly["savings_rate_%"].plot(kind="line", marker="o", color="green")
ax.set_title("Savings Rate Over Time")
ax.set_ylabel("Savings Rate (%)")
ax.axhline(20, color="red", linestyle="--", label="Recommended 20% threshold")
plt.legend()
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "savings_rate.png", dpi=120)
plt.show()

print(f"Insight: Average savings rate is {monthly['savings_rate_%'].mean():.1f}%. "
      f"Months below 20%: {(monthly['savings_rate_%'] < 20).sum()} of {len(monthly)}")

# ── 4. Month-over-month expense growth rate ──────────
monthly["expense_growth_%"] = monthly["expense"].pct_change().round(3) * 100

ax = monthly["expense_growth_%"].plot(kind="bar", color=monthly["expense_growth_%"].apply(lambda x: "red" if x > 0 else "green"))
ax.set_title("Month-over-Month Expense Growth Rate")
ax.set_ylabel("Growth (%)")
ax.axhline(0, color="black", linewidth=0.8)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "expense_growth.png", dpi=120)
plt.show()

# ── 5. Anomaly / outlier detection (IQR method) ──────
expenses = df[df["type"] == "expense"].copy()
Q1 = expenses["amount"].quantile(0.25)
Q3 = expenses["amount"].quantile(0.75)
IQR = Q3 - Q1
upper_bound = Q3 + 1.5 * IQR

outliers = expenses[expenses["amount"] > upper_bound].sort_values("amount", ascending=False)

print(f"Outlier threshold (IQR method): ₹{upper_bound:,.0f}")
print(f"Found {len(outliers)} anomalous transactions:")
print(outliers[["date", "category", "amount", "description"]].to_string(index=False))

plt.figure(figsize=(10, 5))
sns.boxplot(data=expenses, x="category", y="amount")
plt.xticks(rotation=45, ha="right")
plt.title("Expense Distribution by Category (Outlier Detection)")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "outlier_detection.png", dpi=120)
plt.show()

# ── 6. Budget vs actual variance (assumed budgets) ───
assumed_budgets = {
    "Rent": 12000, "Groceries": 6000, "Dining": 2500, "Transport": 2500,
    "Utilities": 2500, "Entertainment": 1500, "Shopping": 3000,
    "Healthcare": 2000, "Investments": 6000, "Subscriptions": 800,
}

latest_month = df["month"].max()
latest_spend = df[(df["type"] == "expense") & (df["month"] == latest_month)].groupby("category")["amount"].sum()

variance_df = pd.DataFrame({
    "Budget": pd.Series(assumed_budgets),
    "Actual": latest_spend
}).fillna(0)
variance_df["Variance"] = variance_df["Actual"] - variance_df["Budget"]
variance_df["Variance_%"] = (variance_df["Variance"] / variance_df["Budget"] * 100).round(1)
variance_df = variance_df.sort_values("Variance_%", ascending=False)

print(f"\nBudget vs Actual — {latest_month}:")
print(variance_df.to_string())

over_budget = variance_df[variance_df["Variance"] > 0]
print(f"\nInsight: {len(over_budget)} categories exceeded budget in {latest_month}, "
      f"led by {over_budget.index[0]} at {over_budget['Variance_%'].iloc[0]:.0f}% over.")

print("\n✅ Analysis complete. Charts saved to analytics/outputs/")
