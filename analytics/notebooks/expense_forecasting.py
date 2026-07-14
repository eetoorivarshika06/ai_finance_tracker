"""
Expense Forecasting: AI Finance Tracker
Forecasts next month's spend per category using moving average and linear 
regression, evaluated with MAE and RMSE.
"""

from pathlib import Path

import pandas as pd
import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error

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

# ── Load and prepare data ─────────────────────────────
df = pd.read_csv(DATA_PATH, parse_dates=["date"])
df["month"] = df["date"].dt.to_period("M")

expenses = df[df["type"] == "expense"]
monthly_category = expenses.groupby(["month", "category"])["amount"].sum().unstack(fill_value=0)
monthly_category.index = monthly_category.index.astype(str)

print(f"Monthly category spend matrix: {monthly_category.shape[0]} months x {monthly_category.shape[1]} categories")
monthly_category.head()

# ── Method 1: Moving average forecast (3-month window) ──
ma_forecast = monthly_category.rolling(window=3, min_periods=1).mean().iloc[-1]

print("Moving Average Forecast (next month, per category):")
print(ma_forecast.round(0).sort_values(ascending=False))

# ── Method 2: Linear regression forecast per category ──
results = {}
forecast_next = {}

for category in monthly_category.columns:
    y = monthly_category[category].values
    X = np.arange(len(y)).reshape(-1, 1)

    if len(y) < 3:
        continue

    # Train on all but last month, test on last month
    X_train, y_train = X[:-1], y[:-1]
    X_test, y_test = X[-1:], y[-1:]

    model = LinearRegression()
    model.fit(X_train, y_train)
    pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, pred)
    rmse = np.sqrt(mean_squared_error(y_test, pred))

    # Forecast next month (one step beyond all available data)
    next_month_pred = model.predict([[len(y)]])[0]

    results[category] = {"MAE": round(mae, 2), "RMSE": round(rmse, 2)}
    forecast_next[category] = round(max(next_month_pred, 0), 2)

results_df = pd.DataFrame(results).T.sort_values("RMSE", ascending=False)
print("\nLinear Regression Model Accuracy (last month held out):")
print(results_df)

print(f"\nAverage MAE across categories: ₹{results_df['MAE'].mean():,.2f}")
print(f"Average RMSE across categories: ₹{results_df['RMSE'].mean():,.2f}")

forecast_df = pd.Series(forecast_next).sort_values(ascending=False)
print("\nLinear Regression Forecast — Next Month Spend by Category:")
print(forecast_df)

# ── Visualize actual vs predicted for top 3 categories ──
top_categories = monthly_category.sum().sort_values(ascending=False).head(3).index

fig, axes = plt.subplots(1, 3, figsize=(16, 4))
for ax, category in zip(axes, top_categories):
    y = monthly_category[category].values
    months = monthly_category.index

    ax.plot(months, y, marker="o", label="Actual")
    ax.axhline(ma_forecast[category], color="orange", linestyle="--", label="MA Forecast")
    ax.axhline(forecast_next[category], color="red", linestyle="--", label="LR Forecast")
    ax.set_title(category)
    ax.tick_params(axis="x", rotation=45)
    ax.legend(fontsize=8)

plt.tight_layout()
plt.savefig(OUTPUT_DIR / "forecast_comparison.png", dpi=120)
plt.show()

# ── Combined forecast summary ─────────────────────────
summary = pd.DataFrame({
    "Moving_Avg_Forecast": ma_forecast.round(0),
    "Linear_Reg_Forecast": forecast_df.round(0),
}).sort_values("Linear_Reg_Forecast", ascending=False)

print("\nForecast Summary — Next Month:")
print(summary)

highest_forecast_cat = summary["Linear_Reg_Forecast"].idxmax()
print(f"\nInsight: {highest_forecast_cat} is forecasted to be the highest expense "
      f"category next month at ₹{summary['Linear_Reg_Forecast'].max():,.0f}, "
      f"based on linear regression trend.")

print("\n✅ Forecasting complete. Chart saved to analytics/outputs/")
