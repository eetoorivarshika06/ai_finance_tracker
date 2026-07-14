"""
run_analysis.py — Generates all charts for the financial_analysis notebook.
Run from repo root: python analytics/notebook/run_analysis.py
Saves figures to analytics/notebook/figures/
"""

import warnings
warnings.filterwarnings("ignore")

from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LinearRegression

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
FIG_DIR  = Path(__file__).resolve().parent / "figures"
FIG_DIR.mkdir(exist_ok=True)

sns.set_theme(style="whitegrid", palette="muted")
plt.rcParams.update({"figure.figsize": (10, 5), "font.size": 11})

# ─── Load data ────────────────────────────────────────────────────────────────
tx = pd.read_csv(DATA_DIR / "sample_transactions.csv", parse_dates=["transaction_date"])
budgets = pd.read_csv(DATA_DIR / "sample_budgets.csv")

tx["month"] = tx["transaction_date"].dt.to_period("M").astype(str)
expenses = tx[tx["type"] == "expense"].copy()
income   = tx[tx["type"] == "income"].copy()

# ─── Chart 1: Cash flow over time ─────────────────────────────────────────────
monthly = tx.groupby(["month", "type"])["amount"].sum().unstack(fill_value=0)
monthly.columns = ["expense", "income"] if "expense" in monthly.columns else monthly.columns
if "income" not in monthly.columns:
    monthly["income"] = 0
if "expense" not in monthly.columns:
    monthly["expense"] = 0
monthly = monthly[["income", "expense"]].sort_index()

fig, ax = plt.subplots(figsize=(11, 5))
ax.plot(monthly.index, monthly["income"],  marker="o", label="Income",  color="#2ecc71", linewidth=2)
ax.plot(monthly.index, monthly["expense"], marker="o", label="Expenses", color="#e74c3c", linewidth=2)
ax.fill_between(monthly.index, monthly["income"], monthly["expense"],
                where=monthly["income"] >= monthly["expense"], alpha=0.15, color="#2ecc71", label="Surplus")
ax.set_title("Monthly Cash Flow — Income vs. Expenses", fontsize=14, fontweight="bold")
ax.set_xlabel("Month")
ax.set_ylabel("Amount ($)")
ax.legend()
plt.xticks(rotation=45)
plt.tight_layout()
fig.savefig(FIG_DIR / "cash_flow.png", dpi=150)
plt.close()
print("  ✓ cash_flow.png")

# ─── Chart 2: Category breakdown ──────────────────────────────────────────────
cat_totals = expenses.groupby("category")["amount"].sum().sort_values(ascending=False)

fig, axes = plt.subplots(1, 2, figsize=(13, 5))

colors = sns.color_palette("muted", len(cat_totals))
axes[0].barh(cat_totals.index, cat_totals.values, color=colors)
axes[0].set_title("Total Spend by Category (Bar)", fontweight="bold")
axes[0].set_xlabel("Amount ($)")
axes[0].invert_yaxis()

axes[1].pie(cat_totals.values, labels=cat_totals.index, autopct="%1.1f%%",
            colors=colors, startangle=140)
axes[1].set_title("Category Share of Total Spend (Pie)", fontweight="bold")

plt.tight_layout()
fig.savefig(FIG_DIR / "category_breakdown.png", dpi=150)
plt.close()
print("  ✓ category_breakdown.png")

# ─── Chart 3: Budget vs. Actual variance ─────────────────────────────────────
monthly_cat = expenses.groupby(["month", "category"])["amount"].sum().reset_index()
budget_map = budgets.set_index("category")["limit_amount"].to_dict()
monthly_cat["budget"] = monthly_cat["category"].map(budget_map)
monthly_cat["variance_pct"] = (
    (monthly_cat["amount"] - monthly_cat["budget"]) / monthly_cat["budget"] * 100
)

# Aggregate variance by category (mean across months)
var_by_cat = monthly_cat.groupby("category").agg(
    actual=("amount", "mean"),
    budget=("budget", "first"),
).reset_index()
var_by_cat = var_by_cat.sort_values("actual", ascending=False)

x = np.arange(len(var_by_cat))
width = 0.35
fig, ax = plt.subplots(figsize=(11, 5))
ax.bar(x - width/2, var_by_cat["actual"], width, label="Avg Monthly Actual", color="#e74c3c")
ax.bar(x + width/2, var_by_cat["budget"],  width, label="Monthly Budget",     color="#3498db")
ax.set_xticks(x)
ax.set_xticklabels(var_by_cat["category"], rotation=30, ha="right")
ax.set_title("Budget vs. Actual — Average Monthly Spend by Category", fontsize=14, fontweight="bold")
ax.set_ylabel("Amount ($)")
ax.legend()
plt.tight_layout()
fig.savefig(FIG_DIR / "budget_variance.png", dpi=150)
plt.close()
print("  ✓ budget_variance.png")

# ─── Chart 4: Forecast vs. Actual (Dining category example) ──────────────────
dining_monthly = (
    expenses[expenses["category"] == "Dining"]
    .groupby("month")["amount"].sum()
    .reset_index()
    .sort_values("month")
)
dining_monthly["month_num"] = range(len(dining_monthly))

X = dining_monthly["month_num"].values.reshape(-1, 1)
y = dining_monthly["amount"].values
model = LinearRegression().fit(X, y)

next_month_num = len(dining_monthly)
forecast_amount = model.predict([[next_month_num]])[0]

fig, ax = plt.subplots(figsize=(10, 5))
ax.bar(dining_monthly["month"], dining_monthly["amount"], color="#9b59b6", label="Actual")
ax.axhline(forecast_amount, color="#e67e22", linestyle="--", linewidth=2,
           label=f"Forecast (next month): ${forecast_amount:,.0f}")
ax.set_title("Dining Spend — Linear Regression Forecast", fontsize=14, fontweight="bold")
ax.set_xlabel("Month")
ax.set_ylabel("Amount ($)")
ax.legend()
plt.xticks(rotation=45)
plt.tight_layout()
fig.savefig(FIG_DIR / "forecast_dining.png", dpi=150)
plt.close()
print("  ✓ forecast_dining.png")

print(f"\nAll figures saved to {FIG_DIR}")
