-- mom_growth.sql
--
-- BUSINESS QUESTION:
--   "How fast is total spending growing month-over-month?"
--   A positive MoM % signals accelerating spend; negative means contraction.
--   Uses LAG() window function to compare each month against the prior one.

WITH monthly_totals AS (
    SELECT
        strftime('%Y-%m', transaction_date) AS month,
        ROUND(SUM(amount), 2)               AS total_spend
    FROM transactions
    WHERE type = 'expense'
    GROUP BY strftime('%Y-%m', transaction_date)
),

mom AS (
    SELECT
        month,
        total_spend,
        LAG(total_spend) OVER (ORDER BY month) AS prev_month_spend
    FROM monthly_totals
)

SELECT
    month,
    total_spend,
    prev_month_spend,
    CASE
        WHEN prev_month_spend IS NULL OR prev_month_spend = 0 THEN NULL
        ELSE ROUND(
            (total_spend - prev_month_spend) / prev_month_spend * 100, 2
        )
    END AS mom_growth_pct
FROM mom
ORDER BY month;
