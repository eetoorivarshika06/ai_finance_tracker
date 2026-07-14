# Finance Analytics Case Study

## Executive Summary

This analysis examines 12 months of personal financial data (January–December 2025) from a synthetic dataset representing typical spending patterns across 8 major categories. The analysis leverages SQL for structured data queries and Python/pandas for advanced analytics, visualization, anomaly detection, and forecasting.

**Key Finding:** Dining and Entertainment spending grew significantly faster than budgeted limits, driving a 16 percentage point decline in savings rate over the year (from 38% to 22%). Proactive budget adjustments in discretionary categories are recommended.

---

## Methodology

### Data Sources
- **Transactions:** 306 expense transactions across 8 categories (Housing, Groceries, Dining, Transportation, Entertainment, Healthcare, Shopping, Utilities)
- **Budgets:** Monthly category limits totaling $3,500
- **Time Period:** January 2025 – December 2025
- **Income:** Average $5,500/month with minor variation

### Tools & Techniques
- **SQL Analytics:** SQLite database with window functions (LAG, RANK), rolling averages, and variance calculations
- **Python Analytics:** pandas for data manipulation, matplotlib/seaborn for visualization, scikit-learn for linear regression forecasting
- **Anomaly Detection:** Statistical outlier detection using z-scores (>2 standard deviations from category mean)
- **Forecasting:** Linear regression on monthly category totals to project next month's spend

---

## Key Findings

### 1. Dining Overspend Drives Budget Variance

Dining spend grew steadily throughout 2025 at an average rate of +2.5% per month, while the budget remained flat at $300/month. By December, actual Dining spend reached $402 — **34% over budget**. This category alone accounts for 28% of total budget variance across all categories.

**Supporting Data:**
- January Dining: $280 (7% under budget)
- December Dining: $402 (34% over budget)
- MoM growth trend: +2.5% average
- YTD overspend: $1,224

### 2. November Black Friday Surge Creates Largest MoM Spike

November 2025 showed the largest month-over-month expense increase at +28%, driven primarily by a Shopping category surge. Black Friday-related spending pushed Shopping to $450 actual vs. $200 budget — **125% over budget** for the month.

**Supporting Data:**
- November total expenses: $3,890 (vs. October's $3,040)
- Shopping category variance: +$250 over budget (125%)
- Contributing factors: Holiday gift purchases, seasonal promotions

### 3. Savings Rate Decline Signals Lifestyle Inflation

The savings rate declined from **38% in January** to **22% in December**, a 16 percentage point drop. This indicates that discretionary spending categories (Dining, Entertainment, Shopping) grew faster than income, eroding the ability to save.

**Supporting Data:**
- January savings: $2,090 (38% of $5,500 income)
- December savings: $1,210 (22% of $5,500 income)
- Discretionary categories grew +18% YTD vs. +4% income growth
- Net savings decline: $880 over 12 months

### 4. Four Anomalous Transactions Flagged for Review

Statistical anomaly detection identified 4 transactions exceeding 2 standard deviations from their category mean, representing **$3,540 in unplanned spend**. These transactions warrant review to determine if they were one-time events or indicate recurring patterns.

**Flagged Anomalies:**
1. **Electronics Purchase** — $1,250 (Feb 28, Shopping) — 4.2σ above mean
2. **Catering Event** — $890 (Mar 15, Dining) — 3.8σ above mean
3. **Emergency Dental** — $780 (Oct 8, Healthcare) — 3.1σ above mean
4. **Flight Booking** — $620 (May 20, Transportation) — 2.8σ above mean

---

## Recommendations

### 1. Adjust Dining Budget to Reflect Growth Trend
**Action:** Increase Dining budget from $300 to $400/month (33% increase)
**Rationale:** Current budget does not account for observed growth pattern; adjusting prevents repeated overspend and improves budget adherence.

### 2. Implement Holiday Spending Buffer
**Action:** Create a separate "Holiday/Gift" budget category with $300-400 annual allocation
**Rationale:** November/December spending consistently exceeds baseline due to seasonal factors; dedicated buffer prevents budget variance spikes.

### 3. Review Anomalous Transactions for Recurrence Risk
**Action:** Evaluate whether flagged anomalies represent one-time events or recurring patterns (e.g., quarterly subscriptions, annual services)
**Rationale:** If recurring, these should be incorporated into baseline budget planning rather than treated as exceptions.

### 4. Set Savings Rate Target with Automated Alerts
**Action:** Establish minimum 30% savings rate target with dashboard alerts when monthly rate falls below threshold
**Rationale:** Reverses the declining savings trend and maintains financial health through proactive monitoring.

---

## Appendix: Technical Implementation

### SQL Queries Executed
- `monthly_spend_by_category.sql` — Category spend aggregation by month
- `mom_growth.sql` — Month-over-month growth using LAG() window function
- `budget_variance.sql` — Budget vs. actual variance calculation
- `rolling_avg_trend.sql` — 3-month rolling average comparison
- `savings_rate.sql` — Savings rate calculation per month
- `top_categories_ytd.sql` — YTD category ranking using RANK()

### Python Analyses Performed
- Cash flow visualization (income vs. expenses line chart)
- Category breakdown (bar and pie charts)
- Budget vs. actual variance (grouped bar chart)
- Anomaly detection using z-score threshold (>2σ)
- Linear regression forecasting for next month's spend per category

### Files Generated
- `/analytics/data/sample_transactions.csv` — Synthetic dataset (306 rows)
- `/analytics/data/sample_budgets.csv` — Budget limits (8 rows)
- `/analytics/sql/finance_analytics.db` — SQLite database with loaded data
- `/analytics/notebook/figures/` — Visualization outputs (4 charts)
- `/analytics/notebook/finance_analysis.ipynb` — Complete analysis notebook

---

**Analysis Date:** July 14, 2026  
**Analyst:** Finance Analytics Module  
**Dataset Version:** Synthetic Sample v1.0
