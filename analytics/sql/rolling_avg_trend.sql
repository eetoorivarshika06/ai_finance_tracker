-- rolling_avg_trend.sql
--
-- BUSINESS QUESTION:
--   "Is this month's spend in line with the recent 3-month trend per category?"
--   Compares current month spend against a 3-month rolling average.
--   A large positive gap signals an unusual spike worth investigating.

WITH monthly_category AS (
    SELECT
        strftime('%Y-%m', transaction_date) AS month,
        category,
        ROUND(SUM(amount), 2)               AS monthly_spend
    FROM transactions
    WHERE type = 'expense'
    GROUP BY
        strftime('%Y-%m', transaction_date),
        category
),

rolling AS (
    SELECT
        month,
        category,
        monthly_spend,
        ROUND(
            AVG(monthly_spend) OVER (
                PARTITION BY category
                ORDER BY month
                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ), 2
        ) AS rolling_3mo_avg
    FROM monthly_category
)

SELECT
    month,
    category,
    monthly_spend,
    rolling_3mo_avg,
    ROUND(monthly_spend - rolling_3mo_avg, 2) AS gap_from_trend,
    CASE
        WHEN rolling_3mo_avg = 0 THEN NULL
        ELSE ROUND(
            (monthly_spend - rolling_3mo_avg) / rolling_3mo_avg * 100, 2
        )
    END AS gap_pct
FROM rolling
ORDER BY
    month,
    category;
