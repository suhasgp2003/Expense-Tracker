import { useEffect, useRef, useState } from "react";
import AnalyticsCharts from "../components/AnalyticsCharts";
import BudgetForm from "../components/BudgetForm";
import ExportMenu from "../components/ExportMenu";
import InsightsModal from "../components/InsightsModal";
import Navbar from "../components/Navbar";
import SummaryCards from "../components/SummaryCards";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import { DEFAULT_FILTERS, useTransactions } from "../hooks/useTransactions";
import { exportFinancialReport, exportTransactionsToCsv } from "../utils/exports";

/** Coordinates dashboard-only UI state; persistent financial data lives in TransactionContext. */
export default function Dashboard({ onToggleTheme, theme }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeModal, setActiveModal] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef();
  const ledger = useTransactions(filters);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const notify = (message) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 3200);
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingTransaction(null);
  };
  const openTransactionForm = (transaction = null) => {
    setEditingTransaction(transaction);
    setActiveModal("transaction");
  };
  const saveTransaction = (transaction) => {
    ledger.saveTransaction(transaction);
    const message = editingTransaction ? "Transaction updated." : "Transaction added.";
    closeModal();
    notify(message);
  };
  const removeTransaction = (transaction) => {
    if (!window.confirm(`Delete “${transaction.description}”? This cannot be undone.`)) return;
    ledger.deleteTransaction(transaction.id);
    notify("Transaction deleted.");
  };
  const saveBudget = (amount) => {
    ledger.saveMonthlyBudget(amount);
    closeModal();
    notify("Monthly budget saved.");
  };
  const handleCsvExport = () => {
    if (!ledger.transactions.length) return notify("Add a transaction before exporting.");
    exportTransactionsToCsv(ledger.transactions);
    setIsExportOpen(false);
    notify("CSV export downloaded.");
  };
  const handlePdfExport = () => {
    if (!ledger.transactions.length) return notify("Add a transaction before exporting.");
    exportFinancialReport(ledger);
    setIsExportOpen(false);
    notify("PDF report downloaded.");
  };
  const hasFilters = filters.search || filters.category !== "all" || filters.start || filters.end || filters.sort !== "newest";

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="app-shell">
        <Navbar theme={theme} onToggleTheme={onToggleTheme} onAddTransaction={() => openTransactionForm()} />
        <main id="main-content">
          <SummaryCards
            balance={ledger.balance}
            budgetUsage={ledger.budgetUsage}
            currentMonthSummary={ledger.currentMonthSummary}
            headingActions={(
              <>
                <button className="button secondary" type="button" onClick={() => setActiveModal("insights")}>✦ AI insights</button>
                <ExportMenu isOpen={isExportOpen} onToggle={() => setIsExportOpen((isOpen) => !isOpen)} onExportCsv={handleCsvExport} onExportPdf={handlePdfExport} />
              </>
            )}
            monthlyBudget={ledger.monthlyBudget}
            onEditBudget={() => setActiveModal("budget")}
            remainingBudget={ledger.remainingBudget}
            summary={ledger.summary}
          />
          <AnalyticsCharts
            categoryEntries={ledger.categoryEntries}
            monthlyExpenseTotals={ledger.monthlyExpenseTotals}
            months={ledger.months}
            theme={theme}
          />
          <TransactionList
            filters={filters}
            hasFilters={Boolean(hasFilters)}
            onAddTransaction={() => openTransactionForm()}
            onDeleteTransaction={removeTransaction}
            onEditTransaction={openTransactionForm}
            onFiltersChange={setFilters}
            onResetFilters={() => setFilters(DEFAULT_FILTERS)}
            transactions={ledger.transactions}
            visibleTransactions={ledger.filteredTransactions}
          />
        </main>
      </div>

      {activeModal === "transaction" && <TransactionForm transaction={editingTransaction} onClose={closeModal} onSave={saveTransaction} />}
      {activeModal === "budget" && <BudgetForm monthlyBudget={ledger.monthlyBudget} onClose={closeModal} onSave={saveBudget} />}
      {activeModal === "insights" && <InsightsModal insights={ledger.insights} onClose={closeModal} />}
      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </>
  );
}
