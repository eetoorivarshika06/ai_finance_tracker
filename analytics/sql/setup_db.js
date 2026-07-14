/**
 * setup_db.js
 *
 * Creates a SQLite database from the sample CSV files and runs all
 * analytics SQL queries to verify they execute without errors.
 *
 * Usage (from repo root):
 *   node analytics/sql/setup_db.js
 */

import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.resolve(__dirname, "../data");
const DB_PATH   = path.resolve(__dirname, "finance_analytics.db");

const openDb = () =>
  new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => (err ? reject(err) : resolve(db)));
  });

const run = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const exec = (db, sql) =>
  new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });

const all = (db, sql) =>
  new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

const loadCsv = async (db, table, csvPath) => {
  const content = fs.readFileSync(csvPath, "utf8").trim();
  const [headerLine, ...dataLines] = content.split("\n");
  const headers = headerLine.split(",");

  for (const line of dataLines) {
    const values = line.split(",");
    const cols = headers.join(", ");
    const placeholders = headers.map(() => "?").join(", ");
    await run(db, `INSERT OR REPLACE INTO ${table} (${cols}) VALUES (${placeholders})`, values);
  }
};

const main = async () => {
  console.log("═══════════════════════════════════════════");
  console.log("  SQLite Analytics DB Setup");
  console.log("═══════════════════════════════════════════\n");

  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const db = await openDb();

  // Apply schema (exec handles multiple statements)
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await exec(db, schema);
  console.log("  ✓ Schema applied");

  // Load sample CSVs
  await loadCsv(db, "transactions", path.join(DATA_DIR, "sample_transactions.csv"));
  console.log("  ✓ sample_transactions.csv loaded");

  await loadCsv(db, "budgets", path.join(DATA_DIR, "sample_budgets.csv"));
  console.log("  ✓ sample_budgets.csv loaded");

  // Run each analytics query
  const queries = [
    "monthly_spend_by_category.sql",
    "mom_growth.sql",
    "budget_variance.sql",
    "rolling_avg_trend.sql",
    "savings_rate.sql",
    "top_categories_ytd.sql",
  ];

  console.log("\n── Query verification ──\n");
  for (const file of queries) {
    const sql = fs.readFileSync(path.join(__dirname, file), "utf8");
    const rows = await all(db, sql);
    console.log(`  ✓ ${file} → ${rows.length} rows`);
  }

  db.close();
  console.log(`\n✅ Database ready: ${DB_PATH}\n`);
};

main().catch((err) => {
  console.error("❌ Setup failed:", err.message);
  process.exit(1);
});
