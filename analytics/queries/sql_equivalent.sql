-- SQL Equivalent Queries for Financial Reporting
-- This file demonstrates the same financial analytics queries from mongo_aggregations.md
-- written as standard SQL against an equivalent relational schema.
--
-- Relational Schema:
--   transactions (id, user_id, type, title, amount, category, payment_method, description, transaction_date, created_at, updated_at)
--   budgets (id, user_id, monthly_budget, category, limit_amount, updated_at)

-- =================================================================================================
-- 1. Total Spend by Category by Month
-- Business Question: How much was spent in each category per month?
-- =================================================================================================

SELECT 
    DATE_FORMAT(transaction_date, '%Y-%m') AS month,
    category,
    SUM(amount) AS total_spend,
    COUNT(*) AS transaction_count
FROM transactions
WHERE type = 'expense'
    AND transaction_date BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY DATE_FORMAT(transaction_date, '%Y-%m'), category
ORDER BY month ASC, total_spend DESC;

-- Business Insight: Reveals seasonal patterns and category-specific spending trends
-- (e.g., Shopping spikes in November for Black Friday)

-- =================================================================================================
-- 2. Top N Spending Categories (Year-to-Date)
-- Business Question: Which categories account for the largest share of total spending?
-- =================================================================================================

SELECT 
    category,
    SUM(amount) AS ytd_spend,
    COUNT(*) AS transaction_count
FROM transactions
WHERE type = 'expense'
    AND transaction_date BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY category
ORDER BY ytd_spend DESC
LIMIT 10;

-- Business Insight: Identifies top spending categories (Housing, Groceries, Dining)
-- that warrant the most attention for budget optimization

-- =================================================================================================
-- 3. Running Cumulative Balance
-- Business Question: What is the cumulative cash flow balance over time?
-- =================================================================================================

WITH daily_flows AS (
    SELECT 
        DATE(transaction_date) AS date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS daily_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS daily_expense
    FROM transactions
    WHERE transaction_date BETWEEN '2025-01-01' AND '2025-12-31'
    GROUP BY DATE(transaction_date)
),
cumulative_balance AS (
    SELECT 
        date,
        daily_income,
        daily_expense,
        SUM(daily_income - daily_expense) OVER (ORDER BY date) AS cumulative_balance
    FROM daily_flows
)
SELECT * FROM cumulative_balance
ORDER BY date;

-- Business Insight: Shows trajectory of savings/deficit accumulation over time,
-- helping identify turning points in spending behavior

-- =================================================================================================
-- 4. Budget Variance by Category
-- Business Question: How does actual spending compare to budgeted limits per category?
-- =================================================================================================

SELECT 
    t.category,
    SUM(t.amount) AS actual_spend,
    b.limit_amount AS budgeted_amount,
    SUM(t.amount) - b.limit_amount AS variance_amount,
    ((SUM(t.amount) - b.limit_amount) / b.limit_amount) * 100 AS variance_percent
FROM transactions t
JOIN budgets b ON t.category = b.category
WHERE t.type = 'expense'
    AND t.transaction_date BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY t.category, b.limit_amount
ORDER BY variance_percent DESC;

-- Business Insight: Highlights categories with largest budget variance
-- (positive = overspend, negative = underspend)

-- =================================================================================================
-- 5. Month-over-Month Growth Rate
-- Business Question: What is the percentage change in total spending from month to month?
-- =================================================================================================

WITH monthly_totals AS (
    SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m') AS month,
        SUM(amount) AS total_spend
    FROM transactions
    WHERE type = 'expense'
        AND transaction_date BETWEEN '2025-01-01' AND '2025-12-31'
    GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
),
monthly_growth AS (
    SELECT 
        month,
        total_spend,
        LAG(total_spend) OVER (ORDER BY month) AS prev_month_spend,
        ((total_spend - LAG(total_spend) OVER (ORDER BY month)) / 
         LAG(total_spend) OVER (ORDER BY month)) * 100 AS mom_growth_percent
    FROM monthly_totals
)
SELECT 
    month,
    total_spend,
    prev_month_spend,
    ROUND(mom_growth_percent, 2) AS mom_growth_percent
FROM monthly_growth
ORDER BY month;

-- Business Insight: Identifies months with unusual spending spikes or declines
-- (e.g., +28% in November for holiday shopping)

-- =================================================================================================
-- 6. Discretionary vs Essential Spending Ratio
-- Business Question: What proportion of spending is discretionary vs essential?
-- =================================================================================================

WITH categorized_spending AS (
    SELECT 
        amount,
        CASE 
            WHEN category IN ('Housing', 'Groceries', 'Utilities', 'Healthcare', 'Transportation') 
                THEN 'essential'
            WHEN category IN ('Dining', 'Entertainment', 'Shopping') 
                THEN 'discretionary'
            ELSE 'other'
        END AS spending_type
    FROM transactions
    WHERE type = 'expense'
        AND transaction_date BETWEEN '2025-01-01' AND '2025-12-31'
),
spending_totals AS (
    SELECT 
        SUM(CASE WHEN spending_type = 'essential' THEN amount ELSE 0 END) AS essential_spend,
        SUM(CASE WHEN spending_type = 'discretionary' THEN amount ELSE 0 END) AS discretionary_spend,
        SUM(amount) AS total_expense
    FROM categorized_spending
)
SELECT 
    essential_spend,
    discretionary_spend,
    total_expense,
    ROUND((discretionary_spend / total_expense) * 100, 2) AS discretionary_ratio,
    ROUND((essential_spend / total_expense) * 100, 2) AS essential_ratio
FROM spending_totals;

-- Business Insight: Reveals spending flexibility — high discretionary ratio (>40%)
-- indicates room for budget cuts, while high essential ratio (>70%) suggests limited flexibility

-- =================================================================================================
-- Additional: Window Functions for Advanced Analytics
-- =================================================================================================

-- 7. 3-Month Rolling Average Spend by Category
SELECT 
    category,
    DATE_FORMAT(transaction_date, '%Y-%m') AS month,
    SUM(amount) AS monthly_spend,
    AVG(SUM(amount)) OVER (
        PARTITION BY category 
        ORDER BY DATE_FORMAT(transaction_date, '%Y-%m')
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS rolling_3mo_avg
FROM transactions
WHERE type = 'expense'
    AND transaction_date BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY category, DATE_FORMAT(transaction_date, '%Y-%m')
ORDER BY category, month;

-- 8. Ranked Categories by Spend (with ties handled)
SELECT 
    category,
    SUM(amount) AS ytd_spend,
    RANK() OVER (ORDER BY SUM(amount) DESC) AS spend_rank,
    ROUND((SUM(amount) / (SELECT SUM(amount) FROM transactions WHERE type = 'expense')) * 100, 2) AS pct_of_total
FROM transactions
WHERE type = 'expense'
    AND transaction_date BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY category
ORDER BY spend_rank;

-- =================================================================================================
-- Notes
-- =================================================================================================
-- - DATE_FORMAT standardizes date formatting for grouping (MySQL syntax)
-- - Window functions (LAG, AVG OVER, RANK) enable advanced analytics without subqueries
-- - CASE statements enable conditional logic for spending classification
-- - CTEs (WITH clauses) improve readability for complex multi-step queries
-- - JOIN syntax connects transactions with budgets for variance analysis
