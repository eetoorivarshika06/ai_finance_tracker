# MongoDB Aggregation Pipelines — Financial Reporting

These aggregation pipelines run against the `transactions` collection 
(fields: userId, type, category, amount, date, description) to power 
reporting and analytics features.

## 1. Total Spend by Category by Month

```javascript
db.transactions.aggregate([
  { $match: { type: "expense" } },
  {
    $group: {
      _id: {
        month: { $dateToString: { format: "%Y-%m", date: "$date" } },
        category: "$category"
      },
      totalSpend: { $sum: "$amount" }
    }
  },
  { $sort: { "_id.month": 1, totalSpend: -1 } }
])
```

## 2. Top N Spending Categories (all time)

```javascript
db.transactions.aggregate([
  { $match: { type: "expense" } },
  { $group: { _id: "$category", totalSpend: { $sum: "$amount" } } },
  { $sort: { totalSpend: -1 } },
  { $limit: 5 }
])
```

## 3. Running Cumulative Balance Over Time

```javascript
db.transactions.aggregate([
  { $sort: { date: 1 } },
  {
    $addFields: {
      signedAmount: {
        $cond: [{ $eq: ["$type", "income"] }, "$amount", { $multiply: ["$amount", -1] }]
      }
    }
  },
  {
    $setWindowFields: {
      sortBy: { date: 1 },
      output: {
        runningBalance: { $sum: "$signedAmount", window: { documents: ["unbounded", "current"] } }
      }
    }
  },
  { $project: { date: 1, category: 1, amount: 1, runningBalance: 1 } }
])
```

## 4. Budget Variance (Actual vs Budget per Category)

```javascript
db.transactions.aggregate([
  { $match: { type: "expense" } },
  {
    $group: {
      _id: "$category",
      actualSpend: { $sum: "$amount" }
    }
  },
  {
    $lookup: {
      from: "budgets",
      localField: "_id",
      foreignField: "category",
      as: "budgetInfo"
    }
  },
  { $unwind: "$budgetInfo" },
  {
    $project: {
      category: "$_id",
      actualSpend: 1,
      budgetLimit: "$budgetInfo.limit",
      variance: { $subtract: ["$actualSpend", "$budgetInfo.limit"] },
      variancePct: {
        $multiply: [
          { $divide: [{ $subtract: ["$actualSpend", "$budgetInfo.limit"] }, "$budgetInfo.limit"] },
          100
        ]
      }
    }
  },
  { $sort: { variancePct: -1 } }
])
```

## 5. Monthly Income vs Expense Summary

```javascript
db.transactions.aggregate([
  {
    $group: {
      _id: {
        month: { $dateToString: { format: "%Y-%m", date: "$date" } },
        type: "$type"
      },
      total: { $sum: "$amount" }
    }
  },
  { $sort: { "_id.month": 1 } }
])
```

## 6. Average Transaction Size by Category

```javascript
db.transactions.aggregate([
  { $match: { type: "expense" } },
  {
    $group: {
      _id: "$category",
      avgTransaction: { $avg: "$amount" },
      count: { $sum: 1 }
    }
  },
  { $sort: { avgTransaction: -1 } }
])
```