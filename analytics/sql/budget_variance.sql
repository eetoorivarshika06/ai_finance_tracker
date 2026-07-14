-- budget_variance.sql
--
-- BUSINESS QUESTION:
--   "Which categories are over or under budget each month?"
--   Variance % = (actual - budgeted) / budgeted * 100
--   Positive = overspend; negative = underspend.

WITH monthly_actual AS (
    SELECT
        strftime('%Y-%m', transaction_date) AS month,
        category,
        ROUND(SUM(amount), 2)               AS actual_spend
    FROM transactions
    WHERE type = 'expense'
    GROUP BY
        strftime('%Y-%m', transaction_date),
        category
),

budget_limits AS (
    SELECT
        category,
        limit_amount AS budgeted_amount
    FROM budgets
)

SELECT
    a.month,
    a.category,
    a.actual_spend,
    b.budgeted_amount,
    ROUND(a.actual_spend - b.budgeted_amount, 2) AS variance_amount,
    CASE
        WHEN b.budgeted_amount = 0 THEN NULL
        ELSE ROUND(
            (a.actual_spend - b.budgeted_amount) / b.budgeted_amount * 100, 2
        )
    END AS variance_pct
FROM monthly_actual a
JOIN budget_limits b ON a.category = b.category
ORDER BY
    a.month,
    variance_pct DESC;
