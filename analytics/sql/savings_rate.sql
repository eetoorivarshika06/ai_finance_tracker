-- savings_rate.sql
--
-- BUSINESS QUESTION:
--   "What percentage of income are we saving each month?"
--   Savings rate = (income - expenses) / income * 100
--   A declining rate over time is an early warning of lifestyle inflation.

WITH monthly_flows AS (
    SELECT
        strftime('%Y-%m', transaction_date) AS month,
        ROUND(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 2) AS total_income,
        ROUND(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 2) AS total_expenses
    FROM transactions
    GROUP BY strftime('%Y-%m', transaction_date)
)

SELECT
    month,
    total_income,
    total_expenses,
    ROUND(total_income - total_expenses, 2) AS net_savings,
    CASE
        WHEN total_income = 0 THEN NULL
        ELSE ROUND(
            (total_income - total_expenses) / total_income * 100, 2
        )
    END AS savings_rate_pct
FROM monthly_flows
ORDER BY month;
