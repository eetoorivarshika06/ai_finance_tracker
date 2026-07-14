-- monthly_spend_by_category.sql
--
-- BUSINESS QUESTION:
--   "How much did we spend in each category, broken down by month?"
--   Useful for spotting category-level spending trends and seasonal patterns.

SELECT
    strftime('%Y-%m', transaction_date) AS month,
    category,
    ROUND(SUM(amount), 2)               AS total_spend,
    COUNT(*)                            AS transaction_count
FROM transactions
WHERE type = 'expense'
GROUP BY
    strftime('%Y-%m', transaction_date),
    category
ORDER BY
    month,
    total_spend DESC;
