export const summarizeTransactions = (transactions = [], budget = null) => {
  const income = transactions.filter(t => t.type === "income");
  const expenses = transactions.filter(t => t.type === "expense");

  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const savings = totalIncome - totalExpense;

  const monthlyBudget = budget?.monthlyBudget || 0;
  const budgetRemaining = monthlyBudget - totalExpense;

  // Category breakdown
  const categoryMap = {};
  expenses.forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Monthly trend
  const monthlyMap = {};
  transactions.forEach(t => {
    const key = new Date(t.transactionDate).toISOString().slice(0, 7);
    if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 };
    if (t.type === "income") monthlyMap[key].income += t.amount;
    else monthlyMap[key].expense += t.amount;
  });
  const monthlyTrend = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  // Predicted expense
  const expenseMonths = monthlyTrend.map(m => m.expense).filter(e => e > 0);
  const predictedExpense = expenseMonths.length
    ? expenseMonths.reduce((a, b) => a + b, 0) / expenseMonths.length
    : 0;

  // Heuristic insights
  const insights = [];
  if (totalExpense > totalIncome) {
    insights.push("⚠️ You are spending more than you earn. Review your expenses.");
  }
  if (categoryBreakdown[0]) {
    insights.push(`📊 Your highest spending category is ${categoryBreakdown[0].category} (₹${categoryBreakdown[0].amount}).`);
  }
  if (monthlyBudget > 0 && budgetRemaining < 0) {
    insights.push(`🚨 You have exceeded your monthly budget by ₹${Math.abs(budgetRemaining)}.`);
  }
  if (savings > 0) {
    insights.push(`✅ Great job! You have saved ₹${savings} this period.`);
  }
  if (transactions.length === 0) {
    insights.push("👋 Welcome! Start by adding your income and expenses to get insights.");
  }

  return {
    totalIncome,
    totalExpense,
    savings,
    monthlyBudget,
    budgetRemaining,
    categoryBreakdown,
    monthlyTrend,
    predictedExpense,
    insights,
  };
};

// Finance-specific metrics for analytics dashboard
export const calculateFinanceMetrics = (transactions = [], budget = null) => {
  const income = transactions.filter(t => t.type === "income");
  const expenses = transactions.filter(t => t.type === "expense");

  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  // 1. Savings Rate: (income - expenses) / income * 100
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // 2. Burn Rate: Average monthly expense rate
  const monthlyMap = {};
  expenses.forEach(t => {
    const key = new Date(t.transactionDate).toISOString().slice(0, 7);
    if (!monthlyMap[key]) monthlyMap[key] = 0;
    monthlyMap[key] += t.amount;
  });
  const monthlyExpenses = Object.values(monthlyMap);
  const burnRate = monthlyExpenses.length > 0 
    ? monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length 
    : 0;

  // 3. Discretionary vs Essential Spending Ratio
  const essentialCategories = ["Housing", "Groceries", "Utilities", "Healthcare", "Transportation"];
  const discretionaryCategories = ["Dining", "Entertainment", "Shopping"];
  
  let essentialSpend = 0;
  let discretionarySpend = 0;
  
  expenses.forEach(t => {
    if (essentialCategories.includes(t.category)) {
      essentialSpend += t.amount;
    } else if (discretionaryCategories.includes(t.category)) {
      discretionarySpend += t.amount;
    }
  });
  
  const totalClassifiedSpend = essentialSpend + discretionarySpend;
  const discretionaryRatio = totalClassifiedSpend > 0 
    ? (discretionarySpend / totalClassifiedSpend) * 100 
    : 0;
  const essentialRatio = totalClassifiedSpend > 0 
    ? (essentialSpend / totalClassifiedSpend) * 100 
    : 0;

  // 4. Spending Volatility: Standard deviation of monthly category spend
  const categoryMonthlyMap = {};
  expenses.forEach(t => {
    const monthKey = new Date(t.transactionDate).toISOString().slice(0, 7);
    const key = `${t.category}_${monthKey}`;
    if (!categoryMonthlyMap[key]) categoryMonthlyMap[key] = { category: t.category, month: monthKey, amount: 0 };
    categoryMonthlyMap[key].amount += t.amount;
  });
  
  const categoryMonthlyData = Object.values(categoryMonthlyMap);
  const volatilityByCategory = {};
  
  categoryMonthlyData.forEach(d => {
    if (!volatilityByCategory[d.category]) volatilityByCategory[d.category] = [];
    volatilityByCategory[d.category].push(d.amount);
  });
  
  const volatilityScores = {};
  Object.entries(volatilityByCategory).forEach(([category, amounts]) => {
    if (amounts.length > 1) {
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
      volatilityScores[category] = Math.sqrt(variance);
    } else {
      volatilityScores[category] = 0;
    }
  });

  // 5. Budget Variance % per category
  const budgetVariance = [];
  if (budget?.categoryBudgets) {
    const categorySpendMap = {};
    expenses.forEach(t => {
      categorySpendMap[t.category] = (categorySpendMap[t.category] || 0) + t.amount;
    });
    
    budget.categoryBudgets.forEach(b => {
      const actualSpend = categorySpendMap[b.category] || 0;
      const limit = b.limit || 0;
      const varianceAmount = actualSpend - limit;
      const variancePercent = limit > 0 ? (varianceAmount / limit) * 100 : 0;
      
      budgetVariance.push({
        category: b.category,
        budgeted: limit,
        actual: actualSpend,
        varianceAmount,
        variancePercent,
      });
    });
  }

  return {
    savingsRate: Math.round(savingsRate * 100) / 100,
    burnRate: Math.round(burnRate * 100) / 100,
    discretionaryRatio: Math.round(discretionaryRatio * 100) / 100,
    essentialRatio: Math.round(essentialRatio * 100) / 100,
    volatilityScores,
    budgetVariance,
    monthlyExpenses: monthlyExpenses,
  };
};

const normalizeDateKey = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 7);
};

const toPlainTransaction = (transaction = {}) => ({
  ...transaction,
  amount: Number(transaction.amount || 0),
  type: transaction.type,
  category: transaction.category,
  date: transaction.date || transaction.transactionDate,
});

export const calculateSavingsRate = (transactions = []) => {
  const monthMap = {};

  transactions.forEach(transaction => {
    const tx = toPlainTransaction(transaction);
    const month = normalizeDateKey(tx.date);
    if (!month) return;

    if (!monthMap[month]) {
      monthMap[month] = { income: 0, expense: 0 };
    }

    if (tx.type === "income") {
      monthMap[month].income += tx.amount;
    } else if (tx.type === "expense") {
      monthMap[month].expense += tx.amount;
    }
  });

  return Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({
      month,
      savingsRate: values.income > 0 ? ((values.income - values.expense) / values.income) * 100 : 0,
    }));
};

export const calculateBurnRate = (transactions = []) => {
  const monthMap = {};

  transactions.forEach(transaction => {
    const tx = toPlainTransaction(transaction);
    if (tx.type !== "expense") return;

    const month = normalizeDateKey(tx.date);
    if (!month) return;

    monthMap[month] = (monthMap[month] || 0) + tx.amount;
  });

  const months = Object.keys(monthMap);
  const totalExpenses = Object.values(monthMap).reduce((sum, value) => sum + value, 0);

  return months.length > 0 ? totalExpenses / months.length : 0;
};

export const calculateDiscretionaryRatio = (transactions = []) => {
  const essentialCategories = ["Rent", "Utilities", "Groceries", "Healthcare", "Transport", "Transportation"];
  const discretionaryCategories = ["Dining", "Entertainment", "Shopping", "Subscriptions"];

  let essentialTotal = 0;
  let discretionaryTotal = 0;

  transactions.forEach(transaction => {
    const tx = toPlainTransaction(transaction);
    if (tx.type !== "expense") return;

    if (essentialCategories.includes(tx.category)) {
      essentialTotal += tx.amount;
    } else if (discretionaryCategories.includes(tx.category)) {
      discretionaryTotal += tx.amount;
    }
  });

  const totalClassifiedSpend = essentialTotal + discretionaryTotal;
  const discretionaryPct = totalClassifiedSpend > 0 ? (discretionaryTotal / totalClassifiedSpend) * 100 : 0;

  return {
    essentialTotal,
    discretionaryTotal,
    discretionaryPct,
  };
};

export const calculateSpendingVolatility = (transactions = []) => {
  const monthlySpendByCategory = {};

  transactions.forEach(transaction => {
    const tx = toPlainTransaction(transaction);
    if (tx.type !== "expense") return;

    const month = normalizeDateKey(tx.date);
    if (!month) return;

    const key = `${tx.category}:${month}`;
    monthlySpendByCategory[key] = (monthlySpendByCategory[key] || 0) + tx.amount;
  });

  const monthlyValuesByCategory = {};
  Object.entries(monthlySpendByCategory).forEach(([key, amount]) => {
    const [category, month] = key.split(":");
    if (!monthlyValuesByCategory[category]) {
      monthlyValuesByCategory[category] = [];
    }
    monthlyValuesByCategory[category].push(amount);
  });

  return Object.entries(monthlyValuesByCategory)
    .map(([category, amounts]) => {
      if (amounts.length <= 1) {
        return { category, volatility: 0 };
      }

      const mean = amounts.reduce((sum, value) => sum + value, 0) / amounts.length;
      const variance = amounts.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / amounts.length;
      return { category, volatility: Math.sqrt(variance) };
    })
    .sort((a, b) => b.volatility - a.volatility);
};

export const calculateBudgetVariance = (transactions = [], budgets = []) => {
  const latestMonth = transactions
    .map(transaction => normalizeDateKey(transaction.date || transaction.transactionDate))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .pop();

  const actualSpendByCategory = {};
  transactions.forEach(transaction => {
    const tx = toPlainTransaction(transaction);
    if (tx.type !== "expense") return;

    const month = normalizeDateKey(tx.date);
    if (month !== latestMonth) return;

    actualSpendByCategory[tx.category] = (actualSpendByCategory[tx.category] || 0) + tx.amount;
  });

  const normalizedBudgets = budgets.map(budget => ({
    ...budget,
    category: budget.category,
    limit: Number(budget.limit || budget.monthlyLimit || budget.monthly_budget || 0),
  }));

  return normalizedBudgets
    .map(budget => {
      const actual = actualSpendByCategory[budget.category] || 0;
      const budgeted = budget.limit || 0;
      const variance = actual - budgeted;
      const variancePct = budgeted > 0 ? (variance / budgeted) * 100 : 0;

      return {
        category: budget.category,
        budgeted,
        actual,
        variance,
        variancePct,
      };
    })
    .sort((a, b) => b.variancePct - a.variancePct);
};