import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { normalizeTransaction } from "../utils/finance";
import { loadLedger, persistLedger } from "../utils/localStorage";

export const TransactionContext = createContext(null);

/** Owns the persistent ledger state so every page and component uses one source of truth. */
export function TransactionProvider({ children }) {
  const initialLedger = useMemo(loadLedger, []);
  const [transactions, setTransactions] = useState(initialLedger.transactions);
  const [monthlyBudget, setMonthlyBudget] = useState(initialLedger.monthlyBudget);

  useEffect(() => {
    persistLedger(transactions, monthlyBudget);
  }, [transactions, monthlyBudget]);

  const saveTransaction = useCallback((transaction) => {
    const nextTransaction = normalizeTransaction({
      ...transaction,
      updatedAt: new Date().toISOString(),
    });

    setTransactions((currentTransactions) => {
      const exists = currentTransactions.some((item) => item.id === nextTransaction.id);
      return exists
        ? currentTransactions.map((item) => (item.id === nextTransaction.id ? nextTransaction : item))
        : [...currentTransactions, nextTransaction];
    });
  }, []);

  const deleteTransaction = useCallback((transactionId) => {
    setTransactions((currentTransactions) => currentTransactions.filter((item) => item.id !== transactionId));
  }, []);

  const saveMonthlyBudget = useCallback((amount) => {
    setMonthlyBudget(Math.max(0, Number(amount) || 0));
  }, []);

  const value = useMemo(() => ({
    transactions,
    monthlyBudget,
    saveTransaction,
    deleteTransaction,
    saveMonthlyBudget,
  }), [deleteTransaction, monthlyBudget, saveMonthlyBudget, saveTransaction, transactions]);

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}
