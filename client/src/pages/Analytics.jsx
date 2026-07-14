import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Flame, Gauge, RefreshCw, Scale, TrendingUp } from "lucide-react";
import { fetchTransactions } from "../redux/transactionSlice";
import { fetchBudget } from "../redux/budgetSlice";
import { formatCurrency } from "../utils/formatCurrency";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import StatCard from "../components/ui/StatCard";
import { ChartSkeleton, StatCardSkeleton } from "../components/ui/Skeleton";
import ChartTooltip from "../components/charts/ChartTooltip";

const POSITIVE_BAR = "#10b981";
const NEGATIVE_BAR = "#f43f5e";

const getMonthKey = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toISOString().slice(0, 7);
};

const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
};

const formatPercent = (value = 0, withSign = false) => {
  const amount = Number(value) || 0;
  const prefix = withSign && amount > 0 ? "+" : "";
  return `${prefix}${amount.toFixed(1)}%`;
};

const average = (values = []) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

function Analytics() {
  const dispatch = useDispatch();
  const { items: transactions, loading: transactionsLoading, error: transactionsError } = useSelector(
    (state) => state.transactions
  );
  const { data: budget, loading: budgetLoading, error: budgetError, fetched: budgetFetched } =
    useSelector((state) => state.budget);

  useEffect(() => {
    dispatch(fetchTransactions());
    if (!budgetFetched) {
      dispatch(fetchBudget());
    }
  }, [dispatch, budgetFetched]);

  const analytics = useMemo(() => {
    const transactionList = Array.isArray(transactions) ? transactions : [];
    const budgetData = budget || { monthlyBudget: 0, categoryBudgets: [] };
    const income = transactionList.filter((item) => item.type === "income");
    const expenses = transactionList.filter((item) => item.type === "expense");

    const totalIncome = income.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalExpense = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    const monthlyMap = {};
    transactionList.forEach((item) => {
      const monthKey = getMonthKey(item.transactionDate);
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { income: 0, expense: 0 };
      }

      const amount = Number(item.amount) || 0;
      if (item.type === "income") {
        monthlyMap[monthKey].income += amount;
      } else {
        monthlyMap[monthKey].expense += amount;
      }
    });

    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([month, values]) => {
        const monthlySavingsRate =
          values.income > 0 ? ((values.income - values.expense) / values.income) * 100 : 0;

        return {
          month,
          monthLabel: formatMonthLabel(month),
          income: Math.round(values.income * 100) / 100,
          expense: Math.round(values.expense * 100) / 100,
          savingsRate: Math.round(monthlySavingsRate * 100) / 100,
        };
      });

    const burnRate = average(monthlyTrend.map((item) => item.expense));

    const categoryMonthTotals = {};
    expenses.forEach((item) => {
      const category = item.category || "Other";
      const key = `${category}_${getMonthKey(item.transactionDate)}`;
      if (!categoryMonthTotals[key]) {
        categoryMonthTotals[key] = { category, amount: 0 };
      }
      categoryMonthTotals[key].amount += Number(item.amount) || 0;
    });

    const volatilityLookup = {};
    Object.values(categoryMonthTotals).forEach(({ category, amount }) => {
      if (!volatilityLookup[category]) {
        volatilityLookup[category] = [];
      }
      volatilityLookup[category].push(amount);
    });

    const volatilityData = Object.entries(volatilityLookup)
      .map(([category, amounts]) => {
        const mean = average(amounts);
        const variance = average(amounts.map((value) => (value - mean) ** 2));
        return {
          category,
          volatility: Math.round(Math.sqrt(variance) * 100) / 100,
        };
      })
      .sort((left, right) => right.volatility - left.volatility);

    const spendByCategory = {};
    expenses.forEach((item) => {
      const category = item.category || "Other";
      spendByCategory[category] = (spendByCategory[category] || 0) + (Number(item.amount) || 0);
    });

    const budgetVarianceData = (budgetData.categoryBudgets || [])
      .map((item) => {
        const actual = spendByCategory[item.category] || 0;
        const budgeted = Number(item.limit) || 0;
        const varianceAmount = actual - budgeted;
        const variancePercent = budgeted > 0 ? (varianceAmount / budgeted) * 100 : 0;

        return {
          category: item.category,
          actual: Math.round(actual * 100) / 100,
          budgeted,
          varianceAmount: Math.round(varianceAmount * 100) / 100,
          variancePercent: Math.round(variancePercent * 100) / 100,
        };
      })
      .sort((left, right) => Math.abs(right.variancePercent) - Math.abs(left.variancePercent));

    const topVolatility = volatilityData[0] || null;
    const topVariance = budgetVarianceData[0] || null;
    const highestExpenseMonth = [...monthlyTrend].sort((left, right) => right.expense - left.expense)[0] || null;

    return {
      totalIncome,
      totalExpense,
      savings,
      savingsRate: Math.round(savingsRate * 100) / 100,
      burnRate: Math.round(burnRate * 100) / 100,
      monthlyTrend,
      volatilityData,
      budgetVarianceData,
      topVolatility,
      topVariance,
      highestExpenseMonth,
    };
  }, [transactions, budget]);

  const loading = transactionsLoading || budgetLoading;
  const hasTransactions = analytics.monthlyTrend.length > 0;
  const errorMessages = [transactionsError, budgetError].filter(Boolean);

  if (loading && !hasTransactions) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <StatCardSkeleton key={item} />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
          <p className="text-sm text-slate-400">
            Savings efficiency, burn trend, category volatility, and budget variance
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            dispatch(fetchTransactions());
            dispatch(fetchBudget());
          }}
          disabled={loading}
          className="border-slate-700/50 bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 hover:border-slate-600"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {errorMessages.length > 0 && (
        <div className="space-y-3">
          {errorMessages.map((message, index) => (
            <Alert key={`${message}-${index}`}>{message}</Alert>
          ))}
        </div>
      )}

      {!hasTransactions ? (
        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl py-16 text-center">
          <Activity className="mx-auto mb-4 h-12 w-12 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-100">No analytics yet</h2>
          <p className="mt-2 text-sm text-slate-400">
            Add transactions and a monthly budget to unlock savings, burn, volatility, and variance trends.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Savings Rate"
              value={formatPercent(analytics.savingsRate)}
              subtitle={`${formatCurrency(analytics.savings)} net from ${formatCurrency(analytics.totalIncome)} income`}
              icon={TrendingUp}
              accent="success"
            />
            <StatCard
              title="Burn Rate"
              value={formatCurrency(analytics.burnRate)}
              subtitle="Average monthly expense run rate"
              icon={Flame}
              accent="danger"
            />
            <StatCard
              title="Spending Volatility"
              value={formatCurrency(analytics.topVolatility?.volatility || 0)}
              subtitle={
                analytics.topVolatility
                  ? `${analytics.topVolatility.category} shows the largest month-to-month swing`
                  : "Need multiple months of category activity"
              }
              icon={Gauge}
              accent="secondary"
            />
            <StatCard
              title="Budget Variance"
              value={formatPercent(analytics.topVariance?.variancePercent || 0, true)}
              subtitle={
                analytics.topVariance
                  ? `${analytics.topVariance.category}: ${formatCurrency(analytics.topVariance.varianceAmount)} vs plan`
                  : "Set category budgets to compare plan vs actual"
              }
              icon={Scale}
              accent="primary"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">Savings Rate Trend</h2>
                <span className="text-xs text-slate-400">Monthly net savings as a share of income</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.monthlyTrend}>
                  <defs>
                    <linearGradient id="savingsRateFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                  <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<ChartTooltip formatter={(value) => formatPercent(value)} />} />
                  <Area
                    type="monotone"
                    dataKey="savingsRate"
                    name="Savings rate"
                    stroke="#818cf8"
                    strokeWidth={3}
                    fill="url(#savingsRateFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">Expense Burn Trend</h2>
                <span className="text-xs text-slate-400">Monthly spend compared with average burn rate</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                  <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(value)} />} />
                  <ReferenceLine
                    y={analytics.burnRate}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: "Avg burn", fill: "#f59e0b", fontSize: 12, position: "insideTopRight" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#38bdf8" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">Category Volatility</h2>
                <span className="text-xs text-slate-400">Standard deviation of monthly spending by category</span>
              </div>
              {analytics.volatilityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={analytics.volatilityData.slice(0, 6)} layout="vertical" margin={{ left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={92}
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(value)} />} />
                    <Bar dataKey="volatility" name="Volatility" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
                  Add activity across multiple months to measure volatility.
                </div>
              )}
            </Card>

            <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">Budget Variance by Category</h2>
                <span className="text-xs text-slate-400">Positive values indicate spend over budget</span>
              </div>
              {analytics.budgetVarianceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={analytics.budgetVarianceData.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<ChartTooltip formatter={(value) => formatPercent(value, true)} />} />
                    <Bar dataKey="variancePercent" name="Variance">
                      {analytics.budgetVarianceData.slice(0, 6).map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={entry.variancePercent >= 0 ? NEGATIVE_BAR : POSITIVE_BAR}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
                  Create category budgets to compare planned vs actual spending.
                </div>
              )}
            </Card>
          </div>

          <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
            <h2 className="mb-6 text-lg font-semibold text-slate-100">Quick Takeaways</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Savings signal</p>
                <p className="mt-2 text-sm text-slate-300">
                  {analytics.savingsRate >= 20
                    ? `Savings are healthy at ${formatPercent(analytics.savingsRate)}, leaving room for reinvestment or reserve building.`
                    : `Savings are running at ${formatPercent(analytics.savingsRate)}. Tightening discretionary spend could improve cushion.`}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Burn signal</p>
                <p className="mt-2 text-sm text-slate-300">
                  {analytics.highestExpenseMonth
                    ? `${analytics.highestExpenseMonth.monthLabel} recorded the heaviest burn at ${formatCurrency(
                        analytics.highestExpenseMonth.expense
                      )}.`
                    : "More monthly history will surface the strongest burn period."}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Variance signal</p>
                <p className="mt-2 text-sm text-slate-300">
                  {analytics.topVariance
                    ? `${analytics.topVariance.category} is the biggest deviation from plan at ${formatPercent(
                        analytics.topVariance.variancePercent,
                        true
                      )}.`
                    : "Set category-level budgets to unlock variance analysis."}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </motion.div>
  );
}

export default Analytics;
