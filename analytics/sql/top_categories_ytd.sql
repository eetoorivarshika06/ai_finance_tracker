-- top_categories_ytd.sql
--
-- BUSINESS QUESTION:
--   "Which spending categories consume the most budget year-to-date?"
--   Uses RANK() window function to rank categories by total annual spend.
--   Helps prioritise which categories to target for cost reduction.

WITH category_ytd AS (
    SELECT
        category,
        ROUND(SUM(amount), 2) AS ytd_spend,
        COUNT(*)              AS transaction_count
    FROM transactions
    WHERE
        type = 'expense'
        AND strftime('%Y', transaction_date) = (
            SELECT strftime('%Y', MAX(transaction_date)) FROM transactions
        )
    GROUP BY category
)

SELECT
    category,
    ytd_spend,
    transaction_count,
    RANK() OVER (ORDER BY ytd_spend DESC) AS spend_rank,
    ROUND(
        ytd_spend * 100.0 / SUM(ytd_spend) OVER (), 2
    ) AS pct_of_total_spend
FROM category_ytd
ORDER BY spend_rank;
