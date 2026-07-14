-- schema.sql
-- SQLite schema for the Finance Tracker analytics layer.
-- Loaded from CSV exports in /analytics/data/

PRAGMA foreign_keys = ON;

-- ─── Transactions ────────────────────────────────────────────────────────────
-- Mirrors the Mongoose Transaction model (flattened for analytics).
CREATE TABLE IF NOT EXISTS transactions (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    title           TEXT,
    amount          REAL NOT NULL,
    category        TEXT,
    payment_method  TEXT,
    description     TEXT,
    transaction_date DATE NOT NULL,
    created_at      TEXT,
    updated_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_tx_user       ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_tx_type       ON transactions (type);
CREATE INDEX IF NOT EXISTS idx_tx_category   ON transactions (category);
CREATE INDEX IF NOT EXISTS idx_tx_date       ON transactions (transaction_date);

-- ─── Budgets ─────────────────────────────────────────────────────────────────
-- Flattened from Budget.categoryBudgets[] — one row per user per category.
-- limit_amount is the recurring monthly cap for that category.
CREATE TABLE IF NOT EXISTS budgets (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    monthly_budget  REAL DEFAULT 0,   -- overall monthly cap
    category        TEXT NOT NULL,
    limit_amount    REAL NOT NULL,    -- per-category monthly limit
    updated_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_budget_user     ON budgets (user_id);
CREATE INDEX IF NOT EXISTS idx_budget_category ON budgets (category);
