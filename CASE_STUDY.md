# Case Study: Analyzing Personal Finance Data to Surface Spending Insights

## Business Question

How can a personal finance tracker surface the most important spending patterns, budget risks, and future expense trends so that a user can make faster, more data-driven decisions?

## Data

The analysis uses a synthetic dataset generated for the project. It contains 253 transactions spanning 2025-07-01 through 2026-06-20 with fields such as date, type, category, amount, and description. The dataset supports both transaction-level analysis and monthly aggregation for reporting.

## Methods

- Pandas aggregation for monthly income/expense trends, category totals, and savings-rate calculations
- IQR-based outlier detection to flag anomalous transactions
- Linear regression forecasting to estimate next-month spending by category
- MongoDB aggregation pipelines and SQL equivalents for reporting and analytics workflows

## Findings

The executed notebooks produced the following verified insights:

- Average monthly income was ₹62,955 versus average monthly expense of ₹78,914, yielding an average monthly surplus of ₹-15,959.
- The average savings rate was -44.8%, and 12 of 12 months were below the 20% recommended threshold.
- The largest spending categories were Groceries (31.5%), Rent (16.5%), and Transport (16.1%) of total expense volume.
- The IQR outlier threshold was ₹10,075, and 19 anomalous transactions were identified.
- In June 2026, 6 categories exceeded budget, led by Dining at 362% over budget.
- The forecasting notebook projected Groceries as the highest-spend category next month at ₹29,326, based on linear regression.

### Charts

![Monthly income vs expense trend](analytics/outputs/monthly_trend.png)

![Category spending breakdown](analytics/outputs/category_breakdown.png)

![Savings rate over time](analytics/outputs/savings_rate.png)

![Month-over-month expense growth](analytics/outputs/expense_growth.png)

![Outlier detection](analytics/outputs/outlier_detection.png)

![Forecast comparison](analytics/outputs/forecast_comparison.png)

## Recommendations

1. Tighten discretionary spend controls immediately, especially in Dining, Shopping, and Entertainment, because those categories showed the largest budget overruns.
2. Rebuild the monthly cash-flow plan around a positive savings target, since the current analysis shows repeated months below the recommended 20% threshold.
3. Use the forecasting output to pre-allocate budget for Groceries, Transport, and Rent before the next month begins.

## Tools Used

- Python
- pandas
- scikit-learn
- matplotlib and seaborn
- MongoDB Aggregation Framework
- SQL
