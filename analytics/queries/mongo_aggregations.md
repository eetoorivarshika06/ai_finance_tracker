# MongoDB Aggregation Pipelines for Financial Reporting

This document demonstrates MongoDB aggregation pipelines used for financial analytics in the AI Finance Tracker. Each pipeline includes a description, the aggregation code, and the business insight it provides.

---

## 1. Total Spend by Category by Month

**Business Question:** How much was spent in each category per month? This helps identify seasonal patterns and category-specific spending trends.

```javascript
db.transactions.aggregate([
  {
    $match: {
      type: "expense",
      transactionDate: { $gte: new Date("2025-01-01"), $lte: new Date("2025-12-31") }
    }
  },
  {
    $group: {
      _id: {
        month: { $dateToString: { format: "%Y-%m", date: "$transactionDate" } },
        category: "$category"
      },
      totalSpend: { $sum: "$amount" },
      transactionCount: { $sum: 1 }
    }
  },
  {
    $sort: { "_id.month": 1, "totalSpend": -1 }
  },
  {
    $project: {
      month: "$_id.month",
      category: "$_id.category",
      totalSpend: 1,
      transactionCount: 1,
      _id: 0
    }
  }
]);
```

**Business Insight:** Reveals which categories drive spending in specific months (e.g., Shopping spikes in November for Black Friday, Entertainment increases in December for holidays).

---

## 2. Top N Spending Categories (Year-to-Date)

**Business Question:** Which categories account for the largest share of total spending? This helps prioritize budget adjustments and identify major expense drivers.

```javascript
db.transactions.aggregate([
  {
    $match: {
      type: "expense",
      transactionDate: { $gte: new Date("2025-01-01"), $lte: new Date("2025-12-31") }
    }
  },
  {
    $group: {
      _id: "$category",
      ytdSpend: { $sum: "$amount" },
      transactionCount: { $sum: 1 }
    }
  },
  {
    $sort: { ytdSpend: -1 }
  },
  {
    $limit: 10
  },
  {
    $project: {
      category: "$_id",
      ytdSpend: 1,
      transactionCount: 1,
      _id: 0
    }
  }
]);
```

**Business Insight:** Identifies the top spending categories (typically Housing, Groceries, Dining) that warrant the most attention for budget optimization.

---

## 3. Running Cumulative Balance

**Business Question:** What is the cumulative cash flow balance over time? This shows the trajectory of savings/deficit accumulation.

```javascript
db.transactions.aggregate([
  {
    $match: {
      transactionDate: { $gte: new Date("2025-01-01"), $lte: new Date("2025-12-31") }
    }
  },
  {
    $sort: { transactionDate: 1 }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" } },
      dailyIncome: {
        $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] }
      },
      dailyExpense: {
        $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] }
      }
    }
  },
  {
    $sort: { _id: 1 }
  },
  {
    $setWindowFields: {
      sortBy: { _id: 1 },
      output: {
        cumulativeBalance: {
          $sum: { $subtract: ["$dailyIncome", "$dailyExpense"] }
        }
      }
    }
  }
]);
```

**Business Insight:** Shows the trajectory of financial health over time — whether savings are accumulating or deficits are growing, helping identify turning points in spending behavior.

---

## 4. Budget Variance by Category

**Business Question:** How does actual spending compare to budgeted limits per category? This identifies overspending and underspending areas.

```javascript
db.transactions.aggregate([
  {
    $match: {
      type: "expense",
      transactionDate: { $gte: new Date("2025-01-01"), $lte: new Date("2025-12-31") }
    }
  },
  {
    $group: {
      _id: "$category",
      actualSpend: { $sum: "$amount" }
    }
  },
  {
    $lookup: {
      from: "budgets",
      let: { category: "$_id" },
      pipeline: [
        { $unwind: "$categoryBudgets" },
        { $match: { $expr: { $eq: ["$categoryBudgets.category", "$$category"] } } },
        { $project: { limit: "$categoryBudgets.limit", _id: 0 } }
      ],
      as: "budget"
    }
  },
  {
    $unwind: "$budget"
  },
  {
    $project: {
      category: "$_id",
      actualSpend: 1,
      budgetedAmount: "$budget.limit",
      varianceAmount: { $subtract: ["$actualSpend", "$budget.limit"] },
      variancePercent: {
        $multiply: [
          { $divide: [{ $subtract: ["$actualSpend", "$budget.limit"] }, "$budget.limit"] },
          100
        ]
      },
      _id: 0
    }
  },
  {
    $sort: { variancePercent: -1 }
  }
]);
```

**Business Insight:** Highlights categories with the largest budget variance (positive = overspend, negative = underspend), enabling targeted budget adjustments.

---

## 5. Month-over-Month Growth Rate

**Business Question:** What is the percentage change in total spending from month to month? This identifies spending acceleration or deceleration trends.

```javascript
db.transactions.aggregate([
  {
    $match: {
      type: "expense",
      transactionDate: { $gte: new Date("2025-01-01"), $lte: new Date("2025-12-31") }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m", date: "$transactionDate" } },
      totalSpend: { $sum: "$amount" }
    }
  },
  {
    $sort: { _id: 1 }
  },
  {
    $setWindowFields: {
      sortBy: { _id: 1 },
      output: {
        prevMonthSpend: {
          $shift: { output: "$totalSpend", by: -1 }
        }
      }
    }
  },
  {
    $project: {
      month: "$_id",
      totalSpend: 1,
      prevMonthSpend: 1,
      momGrowthPercent: {
        $cond: [
          { $ne: ["$prevMonthSpend", null] },
          {
            $multiply: [
              { $divide: [{ $subtract: ["$totalSpend", "$prevMonthSpend"] }, "$prevMonthSpend"] },
              100
            ]
          },
          null
        ]
      },
      _id: 0
    }
  }
]);
```

**Business Insight:** Identifies months with unusual spending spikes (e.g., +28% in November for holiday shopping) or declines, helping explain budget variance patterns.

---

## 6. Discretionary vs Essential Spending Ratio

**Business Question:** What proportion of spending is discretionary (optional) vs essential (required)? This helps assess spending flexibility and potential for cost reduction.

```javascript
db.transactions.aggregate([
  {
    $match: {
      type: "expense",
      transactionDate: { $gte: new Date("2025-01-01"), $lte: new Date("2025-12-31") }
    }
  },
  {
    $addFields: {
      spendingType: {
        $switch: {
          branches: [
            { case: { $in: ["$category", ["Housing", "Groceries", "Utilities", "Healthcare", "Transportation"]] }, then: "essential" },
            { case: { $in: ["$category", ["Dining", "Entertainment", "Shopping"]] }, then: "discretionary" }
          ],
          default: "other"
        }
      }
    }
  },
  {
    $group: {
      _id: "$spendingType",
      totalSpend: { $sum: "$amount" },
      transactionCount: { $sum: 1 }
    }
  },
  {
    $group: {
      _id: null,
      essentialSpend: { $sum: { $cond: [{ $eq: ["$_id", "essential"] }, "$totalSpend", 0] } },
      discretionarySpend: { $sum: { $cond: [{ $eq: ["$_id", "discretionary"] }, "$totalSpend", 0] } },
      totalExpense: { $sum: "$totalSpend" }
    }
  },
  {
    $project: {
      essentialSpend: 1,
      discretionarySpend: 1,
      totalExpense: 1,
      discretionaryRatio: {
        $multiply: [{ $divide: ["$discretionarySpend", "$totalExpense"] }, 100]
      },
      essentialRatio: {
        $multiply: [{ $divide: ["$essentialSpend", "$totalExpense"] }, 100]
      },
      _id: 0
    }
  }
]);
```

**Business Insight:** Reveals spending flexibility — a high discretionary ratio (>40%) indicates room for budget cuts, while a high essential ratio (>70%) suggests limited flexibility and potential financial vulnerability.

---

## Notes

- All aggregations use `$match` to filter by date range for performance
- `$dateToString` standardizes date formatting for grouping
- `$setWindowFields` (MongoDB 5.0+) enables window functions like LAG for MoM calculations
- `$lookup` joins transactions with budgets for variance analysis
- `$cond` and `$switch` enable conditional logic for spending classification
