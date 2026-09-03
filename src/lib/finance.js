export const STORAGE = Object.freeze({
  transactions: "ledgerly:transactions:v1",
  settings: "ledgerly:settings:v1",
  theme: "ledgerly:theme:v1",
});

export const CATEGORIES = Object.freeze([
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Other",
]);

export const CATEGORY_COLORS = Object.freeze({
  Food: "#2e8b57",
  Travel: "#3cb371",
  Shopping: "#6b8e23",
  Bills: "#dc2626",
  Health: "#059669",
  Entertainment: "#a8d5ba",
  Other: "#718096",
});

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const monthFormatter = new Intl.DateTimeFormat("en-IN", { month: "short" });

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(value = new Date()) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function money(value) {
  return currencyFormatter.format(value || 0);
}

export function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Converts signed starter-project records into the typed React application model. */
export function normalizeTransaction(raw) {
  const rawAmount = Number(raw.amount);
  const type = raw.type ?? (rawAmount >= 0 ? "income" : "expense");

  return {
    id: String(raw.id || createId()),
    description: String(raw.description || "Untitled transaction").trim(),
    amount: Math.abs(rawAmount) || 0,
    type: type === "income" ? "income" : "expense",
    category: type === "income" ? "Income" : (CATEGORIES.includes(raw.category) ? raw.category : "Other"),
    date: /^\d{4}-\d{2}-\d{2}$/.test(raw.date || "") ? raw.date : today(),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadLedger() {
  const savedTransactions = readJson(STORAGE.transactions, null);
  const legacyTransactions = savedTransactions === null ? readJson("transactions", []) : savedTransactions;
  const transactions = Array.isArray(legacyTransactions)
    ? legacyTransactions.map(normalizeTransaction).filter((item) => item.amount > 0)
    : [];
  const savedSettings = readJson(STORAGE.settings, {});

  return {
    transactions,
    monthlyBudget: Math.max(0, Number(savedSettings.monthlyBudget) || 0),
  };
}

export function persistLedger(transactions, monthlyBudget) {
  localStorage.setItem(STORAGE.transactions, JSON.stringify(transactions));
  localStorage.setItem(STORAGE.settings, JSON.stringify({ monthlyBudget }));
}

export function calculateSummary(transactions) {
  return transactions.reduce(
    (summary, transaction) => {
      summary[transaction.type === "income" ? "income" : "expenses"] += transaction.amount;
      return summary;
    },
    { income: 0, expenses: 0 },
  );
}

export function categoryTotals(transactions) {
  return transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((totals, transaction) => {
      totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
      return totals;
    }, {});
}

export function getLastSixMonths() {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    return { key: monthKey(date), label: monthFormatter.format(date) };
  });
}

export function getInsights(transactions, monthlyBudget) {
  const expenses = transactions.filter((transaction) => transaction.type === "expense");
  const currentExpenses = expenses.filter((transaction) => transaction.date.startsWith(monthKey()));
  const currentSpent = currentExpenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totals = categoryTotals(transactions);
  const [topCategory, topAmount] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0] ?? [];
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousSpent = expenses
    .filter((transaction) => transaction.date.startsWith(monthKey(previousMonth)))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const insights = [];

  if (!expenses.length) {
    insights.push({
      icon: "✦",
      title: "Start with one expense",
      text: "Add a few expenses and Ledgerly will identify spending patterns and budget opportunities.",
    });
  }

  if (topCategory) {
    const totalSpending = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
    insights.push({
      icon: "◌",
      title: `${topCategory} is your largest category`,
      text: `You have spent ${money(topAmount)} on ${topCategory}, ${Math.round((topAmount / totalSpending) * 100)}% of all recorded spending.`,
    });
  }

  if (monthlyBudget) {
    insights.push({
      icon: "◎",
      title: currentSpent > monthlyBudget ? "Your budget needs attention" : "You are tracking within budget",
      text: currentSpent > monthlyBudget
        ? `Current spending is ${money(currentSpent - monthlyBudget)} above your ${money(monthlyBudget)} monthly target.`
        : `You have ${money(monthlyBudget - currentSpent)} left from your ${money(monthlyBudget)} budget this month.`,
    });
  } else {
    insights.push({
      icon: "◎",
      title: "Set a spending guardrail",
      text: "A monthly budget turns your spending history into a clear remaining amount and an early warning.",
    });
  }

  if (previousSpent && currentSpent) {
    const change = ((currentSpent - previousSpent) / previousSpent) * 100;
    insights.push({
      icon: change > 0 ? "↗" : "↘",
      title: change > 0 ? "Spending is trending up" : "Spending is trending down",
      text: `This month is ${Math.abs(change).toFixed(0)}% ${change > 0 ? "higher" : "lower"} than last month so far.`,
    });
  } else if (currentSpent) {
    insights.push({
      icon: "↗",
      title: "Build a comparison baseline",
      text: "Keep recording expenses next month to unlock a meaningful month-over-month trend.",
    });
  }

  return insights;
}
