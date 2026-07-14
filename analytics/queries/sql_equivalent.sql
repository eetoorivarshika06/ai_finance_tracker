-- SQL Equivalents of MongoDB Aggregation Pipelines
-- Assumes a relational schema: transactions(id, user_id, type, category, amount, date, description)
--                               budgets(id, user_id, category, monthly_limit)

-- 1. Total Spend by Category by Month
SELECT
    DATE_FORMAT(date, '%Y-%m') AS month,
    category,
    SUM(amount) AS total_spend
FROM transactions
WHERE type = 'expense'
GROUP BY month, category
ORDER BY month, total_spend DESC;

-- 2. Top N Spending Categories (all time)
SELECT category, SUM(amount) AS total_spend
FROM transactions
WHERE type = 'expense'
GROUP BY category
ORDER BY total_spend DESC
LIMIT 5;

-- 3. Running Cumulative Balance Over Time
SELECT
    date,
    category,
    amount,
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END)
        OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_balance
FROM transactions
ORDER BY date;

-- 4. Budget Variance (Actual vs Budget per Category)
SELECT
    t.category,
    SUM(t.amount) AS actual_spend,
    b.monthly_limit AS budget_limit,
    SUM(t.amount) - b.monthly_limit AS variance,
    ROUND((SUM(t.amount) - b.monthly_limit) / b.monthly_limit * 100, 1) AS variance_pct
FROM transactions t
JOIN budgets b ON t.category = b.category
WHERE t.type = 'expense'
GROUP BY t.category, b.monthly_limit
ORDER BY variance_pct DESC;

-- 5. Monthly Income vs Expense Summary
SELECT
    DATE_FORMAT(date, '%Y-%m') AS month,
    type,
    SUM(amount) AS total
FROM transactions
GROUP BY month, type
ORDER BY month;

-- 6. Average Transaction Size by Category
SELECT
    category,
    AVG(amount) AS avg_transaction,
    COUNT(*) AS transaction_count
FROM transactions
WHERE type = 'expense'
GROUP BY category
ORDER BY avg_transaction DESC;
