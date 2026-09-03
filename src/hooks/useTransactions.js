import { useContext, useMemo } from "react";
import { TransactionContext } from "../context/TransactionContext";
import {
  calculateSummary,
  categoryTotals,
  filterTransactions,
  getInsights,
  getLastSixMonths,
  getMonthlyExpenseTotals,
  monthKey,
} from "../utils/finance";

export const DEFAULT_FILTERS = Object.freeze({
  search: "",
  category: "all",
  start: "",
  end: "",
  sort: "newest",
});

/** Exposes transaction actions plus the derived view data needed by the dashboard. */
export function useTransactions(filters = DEFAULT_FILTERS) {
  const context = useContext(TransactionContext);
  if (!context) throw new Error("useTransactions must be used inside TransactionProvider.");

  const { transactions, monthlyBudget, ...actions } = context;
  const currentMonthTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.date.startsWith(monthKey())),
    [transactions],
  );
  const summary = useMemo(() => calculateSummary(transactions), [transactions]);
  const currentMonthSummary = useMemo(
    () => calculateSummary(currentMonthTransactions),
    [currentMonthTransactions],
  );
  const categoryEntries = useMemo(
    () => Object.entries(categoryTotals(transactions))
      .filter(([, amount]) => amount > 0)
      .sort(([, firstAmount], [, secondAmount]) => secondAmount - firstAmount),
    [transactions],
  );
  const months = useMemo(getLastSixMonths, []);
  const monthlyExpenseTotals = useMemo(
    () => getMonthlyExpenseTotals(transactions, months),
    [months, transactions],
  );
  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters),
    [filters, transactions],
  );
  const insights = useMemo(
    () => getInsights(transactions, monthlyBudget),
    [monthlyBudget, transactions],
  );
  const balance = summary.income - summary.expenses;
  const remainingBudget = monthlyBudget - currentMonthSummary.expenses;
  const budgetUsage = monthlyBudget ? (currentMonthSummary.expenses / monthlyBudget) * 100 : 0;

  return {
    ...actions,
    transactions,
    monthlyBudget,
    summary,
    currentMonthSummary,
    filteredTransactions,
    categoryEntries,
    months,
    monthlyExpenseTotals,
    insights,
    balance,
    remainingBudget,
    budgetUsage,
  };
}
