/**
 * exportToSql.js
 *
 * Exports Transaction and Budget documents from MongoDB to CSV files
 * in /analytics/data/, and generates a synthetic sample dataset for
 * offline analytics demos (no live DB required).
 *
 * Usage:
 *   node server/scripts/exportToSql.js           # export live data + regenerate sample
 *   node server/scripts/exportToSql.js --sample  # sample dataset only
 *   node server/scripts/exportToSql.js --mongo   # live MongoDB export only
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../analytics/data");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ─── CSV helpers ─────────────────────────────────────────────────────────────

const escapeCsv = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const writeCsv = (filePath, headers, rows) => {
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(",")),
  ];
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
  console.log(`  ✓ ${filePath} (${rows.length} rows)`);
};

// ─── MongoDB export ──────────────────────────────────────────────────────────

const exportFromMongo = async () => {
  console.log("\n📦 Exporting live data from MongoDB...");

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

  const transactions = await Transaction.find().lean();
  const budgets = await Budget.find().lean();

  const txRows = transactions.map((t) => ({
    id: t._id.toString(),
    user_id: t.userId?.toString() || "",
    type: t.type || "",
    title: t.title || "",
    amount: t.amount ?? 0,
    category: t.category || "",
    payment_method: t.paymentMethod || "",
    description: t.description || "",
    transaction_date: t.transactionDate ? new Date(t.transactionDate).toISOString().slice(0, 10) : "",
    created_at: t.createdAt ? new Date(t.createdAt).toISOString() : "",
    updated_at: t.updatedAt ? new Date(t.updatedAt).toISOString() : "",
  }));

  const txHeaders = [
    "id", "user_id", "type", "title", "amount", "category",
    "payment_method", "description", "transaction_date", "created_at", "updated_at",
  ];

  writeCsv(path.join(DATA_DIR, "transactions.csv"), txHeaders, txRows);

  // Flatten categoryBudgets into one row per category per user
  const budgetRows = [];
  for (const b of budgets) {
    if (b.categoryBudgets?.length) {
      for (const cb of b.categoryBudgets) {
        budgetRows.push({
          id: `${b._id}_${cb.category}`,
          user_id: b.userId?.toString() || "",
          monthly_budget: b.monthlyBudget ?? 0,
          category: cb.category || "",
          limit_amount: cb.limit ?? 0,
          updated_at: b.updatedAt ? new Date(b.updatedAt).toISOString() : "",
        });
      }
    } else {
      budgetRows.push({
        id: b._id.toString(),
        user_id: b.userId?.toString() || "",
        monthly_budget: b.monthlyBudget ?? 0,
        category: "",
        limit_amount: 0,
        updated_at: b.updatedAt ? new Date(b.updatedAt).toISOString() : "",
      });
    }
  }

  const budgetHeaders = ["id", "user_id", "monthly_budget", "category", "limit_amount", "updated_at"];
  writeCsv(path.join(DATA_DIR, "budgets.csv"), budgetHeaders, budgetRows);

  await mongoose.disconnect();
  console.log("  MongoDB export complete.\n");
};

// ─── Synthetic dataset ───────────────────────────────────────────────────────

const CATEGORIES = {
  Housing:        { base: 1200, budget: 1300 },
  Groceries:      { base: 450,  budget: 500  },
  Dining:         { base: 280,  budget: 300  },
  Transportation: { base: 200,  budget: 250  },
  Entertainment:  { base: 150,  budget: 200  },
  Healthcare:     { base: 120,  budget: 150  },
  Shopping:       { base: 180,  budget: 200  },
  Utilities:      { base: 160,  budget: 175  },
};

const MONTHLY_INCOME = 5500;

/** Returns a pseudo-random value with seasonal modulation */
const seasonalAmount = (base, month, category) => {
  let amount = base;

  // Seasonal patterns
  if (category === "Entertainment") {
    if (month === 11) amount *= 2.2;  // Dec holiday spike
    if (month === 6)  amount *= 1.8;  // Jul summer spike
  }
  if (category === "Shopping") {
    if (month === 10) amount *= 2.5;  // Nov Black Friday
  }
  if (category === "Dining") {
    amount *= 1 + month * 0.025;      // gradual growth over the year
  }
  if (category === "Transportation") {
    if (month === 4 || month === 5) amount *= 1.3; // spring travel
  }

  // Small random noise (±15%)
  amount *= 0.85 + Math.random() * 0.3;
  return Math.round(amount * 100) / 100;
};

const generateSyntheticData = () => {
  console.log("\n🧪 Generating synthetic sample dataset (12 months)...");

  const txRows = [];
  const budgetRows = [];
  const userId = "sample_user_001";
  let txId = 1;

  // Budget rows — same limits apply every month (recurring monthly caps)
  for (const [category, { budget }] of Object.entries(CATEGORIES)) {
    budgetRows.push({
      id: `budget_${category}`,
      user_id: userId,
      monthly_budget: 3500,
      category,
      limit_amount: budget,
      updated_at: new Date().toISOString(),
    });
  }

  // 12 months: Jan 2025 – Dec 2025
  for (let month = 0; month < 12; month++) {
    const year = 2025;
    const monthStr = String(month + 1).padStart(2, "0");
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Monthly income (slight variation)
    const incomeAmount = MONTHLY_INCOME + Math.round((Math.random() - 0.5) * 200);
    txRows.push({
      id: `tx_${txId++}`,
      user_id: userId,
      type: "income",
      title: "Monthly Salary",
      amount: incomeAmount,
      category: "Salary",
      payment_method: "Direct Deposit",
      description: `Salary for ${year}-${monthStr}`,
      transaction_date: `${year}-${monthStr}-01`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Expense transactions per category (5-8 per category per month for richer dataset)
    for (const [category, { base }] of Object.entries(CATEGORIES)) {
      const numTx = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < numTx; i++) {
        const day = Math.min(1 + Math.floor(Math.random() * daysInMonth), daysInMonth);
        let amount = seasonalAmount(base / numTx, month, category);

        txRows.push({
          id: `tx_${txId++}`,
          user_id: userId,
          type: "expense",
          title: `${category} expense`,
          amount,
          category,
          payment_method: ["Credit Card", "Debit Card", "Cash"][Math.floor(Math.random() * 3)],
          description: `${category} spending`,
          transaction_date: `${year}-${monthStr}-${String(day).padStart(2, "0")}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  // ── Intentional anomalies (>2σ from category mean) ──────────────────────────
  const anomalies = [
    { month: "03", day: "15", category: "Dining",         amount: 890.00,  title: "Catering Event" },
    { month: "02", day: "28", category: "Shopping",       amount: 1250.00, title: "Electronics Purchase" },
    { month: "10", day: "08", category: "Healthcare",     amount: 780.00,  title: "Emergency Dental" },
    { month: "05", day: "20", category: "Transportation", amount: 620.00,  title: "Flight Booking" },
  ];

  for (const a of anomalies) {
    txRows.push({
      id: `tx_${txId++}`,
      user_id: userId,
      type: "expense",
      title: a.title,
      amount: a.amount,
      category: a.category,
      payment_method: "Credit Card",
      description: `ANOMALY: unusually high ${a.category} charge`,
      transaction_date: `2025-${a.month}-${a.day}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const txHeaders = [
    "id", "user_id", "type", "title", "amount", "category",
    "payment_method", "description", "transaction_date", "created_at", "updated_at",
  ];
  const budgetHeaders = ["id", "user_id", "monthly_budget", "category", "limit_amount", "updated_at"];

  writeCsv(path.join(DATA_DIR, "sample_transactions.csv"), txHeaders, txRows);
  writeCsv(path.join(DATA_DIR, "sample_budgets.csv"), budgetHeaders, budgetRows);

  console.log(`  Sample dataset: ${txRows.length} transactions, ${budgetRows.length} budget rows`);
  console.log(`  Anomalies injected: ${anomalies.length}\n`);
};

// ─── Main ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const sampleOnly = args.includes("--sample");
const mongoOnly  = args.includes("--mongo");

const main = async () => {
  console.log("═══════════════════════════════════════════");
  console.log("  Finance Tracker — Data Export Pipeline");
  console.log("═══════════════════════════════════════════");

  try {
    if (!sampleOnly) {
      if (!process.env.MONGODB_URI) {
        console.warn("  ⚠ MONGODB_URI not set — skipping live export.");
      } else {
        await exportFromMongo();
      }
    }

    if (!mongoOnly) {
      generateSyntheticData();
    }

    console.log("✅ Export pipeline finished. Files in analytics/data/\n");
  } catch (err) {
    console.error("❌ Export failed:", err.message);
    process.exit(1);
  }
};

main();
