import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { jsPDF } from "jspdf";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  STORAGE,
  calculateSummary,
  categoryTotals,
  createId,
  dateFormatter,
  getInsights,
  getLastSixMonths,
  loadLedger,
  money,
  monthKey,
  persistLedger,
  today,
} from "./lib/finance";

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip);

const EMPTY_FILTERS = { search: "", category: "all", start: "", end: "", sort: "newest" };

function getGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Modal({ children, onClose, small = false, label }) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal${small ? " modal-small" : ""}`} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </section>
    </div>
  );
}

function TransactionModal({ transaction, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    id: transaction?.id ?? "",
    description: transaction?.description ?? "",
    amount: transaction?.amount ?? "",
    type: transaction?.type ?? "expense",
    category: transaction?.category ?? "Food",
    date: transaction?.date ?? today(),
  }));
  const [error, setError] = useState("");
  const isEditing = Boolean(transaction);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (form.description.trim().length < 2) return setError("Please add a description of at least 2 characters.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Enter an amount greater than zero.");
    if (!form.date) return setError("Please choose a date.");

    onSave({
      id: form.id || createId(),
      description: form.description.trim(),
      amount,
      type: form.type,
      category: form.type === "income" ? "Income" : form.category,
      date: form.date,
      createdAt: transaction?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Modal label={isEditing ? "Edit transaction" : "Add transaction"} onClose={onClose}>
      <header className="modal-heading">
        <div><p className="eyebrow">{isEditing ? "UPDATE ENTRY" : "NEW ENTRY"}</p><h2>{isEditing ? "Edit transaction" : "Add transaction"}</h2></div>
        <button className="icon-button close" type="button" onClick={onClose} aria-label="Close dialog">×</button>
      </header>
      <form onSubmit={submit} noValidate>
        <fieldset className="type-switch"><legend className="sr-only">Transaction type</legend>
          {['expense', 'income'].map((type) => <label key={type}><input type="radio" name="transaction-type" value={type} checked={form.type === type} onChange={() => update("type", type)} /><span>{type[0].toUpperCase() + type.slice(1)}</span></label>)}
        </fieldset>
        <div className="form-grid">
          <label className="form-field wide">Description<input value={form.description} onChange={(event) => update("description", event.target.value)} maxLength="80" placeholder="e.g. Grocery run" autoFocus /></label>
          <label className="form-field">Amount (₹)<input value={form.amount} onChange={(event) => update("amount", event.target.value)} type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" /></label>
          <label className="form-field">Date<input value={form.date} onChange={(event) => update("date", event.target.value)} type="date" /></label>
          {form.type === "expense" && <label className="form-field">Category<select value={form.category} onChange={(event) => update("category", event.target.value)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <footer className="modal-footer"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit">{isEditing ? "Save changes" : "Save transaction"}</button></footer>
      </form>
    </Modal>
  );
}

function BudgetModal({ monthlyBudget, onClose, onSave }) {
  const [value, setValue] = useState(monthlyBudget || "");
  const [error, setError] = useState("");
  const submit = (event) => {
    event.preventDefault();
    const budget = Number(value);
    if (!Number.isFinite(budget) || budget < 0) return setError("Enter a valid zero or positive amount.");
    onSave(budget);
  };

  return (
    <Modal small label="Set monthly budget" onClose={onClose}>
      <header className="modal-heading"><div><p className="eyebrow">PLANNING</p><h2>Set monthly budget</h2></div><button className="icon-button close" type="button" onClick={onClose} aria-label="Close dialog">×</button></header>
      <form onSubmit={submit} noValidate>
        <label className="form-field">Monthly spending limit (₹)<input value={value} onChange={(event) => setValue(event.target.value)} type="number" min="0" step="1" inputMode="decimal" placeholder="e.g. 30000" autoFocus /></label>
        <p className="form-help">This applies to expenses in the current calendar month.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <footer className="modal-footer"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit">Save budget</button></footer>
      </form>
    </Modal>
  );
}

function InsightsModal({ insights, onClose }) {
  return (
    <Modal small label="Your AI insights" onClose={onClose}>
      <header className="modal-heading"><div><p className="eyebrow">SMART SUMMARY</p><h2>Your AI insights</h2></div><button className="icon-button close" type="button" onClick={onClose} aria-label="Close dialog">×</button></header>
      <p className="insights-intro">A transparent, on-device analysis of the transactions saved in this browser.</p>
      <div className="insight-list">{insights.map((insight) => <article className="insight-item" key={insight.title}><i>{insight.icon}</i><div><strong>{insight.title}</strong><p>{insight.text}</p></div></article>)}</div>
      <footer className="modal-footer"><button className="button primary" type="button" onClick={onClose}>Got it</button></footer>
    </Modal>
  );
}

function App() {
  const initialLedger = useMemo(loadLedger, []);
  const [transactions, setTransactions] = useState(initialLedger.transactions);
  const [monthlyBudget, setMonthlyBudget] = useState(initialLedger.monthlyBudget);
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE.theme) || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [modal, setModal] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef();

  useEffect(() => persistLedger(transactions, monthlyBudget), [transactions, monthlyBudget]);
  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE.theme, theme);
  }, [theme]);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const notify = (message) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 3200);
  };

  const currentMonthTransactions = useMemo(() => transactions.filter((item) => item.date.startsWith(monthKey())), [transactions]);
  const allSummary = useMemo(() => calculateSummary(transactions), [transactions]);
  const currentSummary = useMemo(() => calculateSummary(currentMonthTransactions), [currentMonthTransactions]);
  const balance = allSummary.income - allSummary.expenses;
  const remaining = monthlyBudget - currentSummary.expenses;
  const budgetUsed = monthlyBudget ? (currentSummary.expenses / monthlyBudget) * 100 : 0;
  const categoryData = useMemo(() => categoryTotals(transactions), [transactions]);
  const insights = useMemo(() => getInsights(transactions, monthlyBudget), [transactions, monthlyBudget]);
  const monthlyData = useMemo(() => {
    const months = getLastSixMonths();
    return { months, totals: months.map(({ key }) => transactions.filter((item) => item.type === "expense" && item.date.startsWith(key)).reduce((sum, item) => sum + item.amount, 0)) };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const comparators = {
      newest: (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
      oldest: (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
      highest: (a, b) => b.amount - a.amount,
      lowest: (a, b) => a.amount - b.amount,
    };
    return transactions
      .filter((item) => !filters.search || item.description.toLowerCase().includes(filters.search.toLowerCase()))
      .filter((item) => filters.category === "all" || item.category === filters.category)
      .filter((item) => !filters.start || item.date >= filters.start)
      .filter((item) => !filters.end || item.date <= filters.end)
      .sort(comparators[filters.sort]);
  }, [filters, transactions]);

  const hasFilters = filters.search || filters.category !== "all" || filters.start || filters.end || filters.sort !== "newest";
  const categoryEntries = Object.entries(categoryData).filter(([, amount]) => amount > 0).sort((a, b) => b[1] - a[1]);
  const categoryChart = { labels: categoryEntries.map(([category]) => category), datasets: [{ data: categoryEntries.map(([, amount]) => amount), backgroundColor: categoryEntries.map(([category]) => CATEGORY_COLORS[category]), borderWidth: 0, hoverOffset: 4 }] };
  const barChart = { labels: monthlyData.months.map(({ label }) => label), datasets: [{ data: monthlyData.totals, backgroundColor: "#2e8b57", hoverBackgroundColor: "#1f6f44", borderRadius: 5, maxBarThickness: 34 }] };
  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => `${context.label ? `${context.label}: ` : "Expenses: "}${money(context.raw)}` } } } };
  const barOptions = { ...chartOptions, scales: { x: { border: { display: false }, grid: { display: false }, ticks: { color: theme === "dark" ? "#a9c3af" : "#718096", font: { size: 10 } } }, y: { beginAtZero: true, border: { display: false }, grid: { color: theme === "dark" ? "#365340" : "#dceadf" }, ticks: { color: theme === "dark" ? "#a9c3af" : "#718096", font: { size: 10 }, callback: (value) => `₹${Number(value) / 1000}k` } } } };

  const openTransaction = (transaction = null) => { setEditingTransaction(transaction); setModal("transaction"); };
  const saveTransaction = (transaction) => {
    setTransactions((current) => current.some((item) => item.id === transaction.id) ? current.map((item) => item.id === transaction.id ? transaction : item) : [...current, transaction]);
    setModal(null);
    notify(editingTransaction ? "Transaction updated." : "Transaction added.");
  };
  const deleteTransaction = (transaction) => {
    if (!window.confirm(`Delete “${transaction.description}”? This cannot be undone.`)) return;
    setTransactions((current) => current.filter((item) => item.id !== transaction.id));
    notify("Transaction deleted.");
  };
  const saveBudget = (value) => { setMonthlyBudget(value); setModal(null); notify("Monthly budget saved."); };
  const exportCSV = () => {
    if (!transactions.length) return notify("Add a transaction before exporting.");
    const escapeCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [["Description", "Type", "Category", "Amount (INR)", "Date"], ...transactions.slice().sort((a, b) => a.date.localeCompare(b.date)).map((item) => [item.description, item.type, item.category, item.type === "expense" ? -item.amount : item.amount, item.date])];
    downloadBlob(new Blob([rows.map((row) => row.map(escapeCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }), `ledgerly-transactions-${today()}.csv`);
    setExportOpen(false); notify("CSV export downloaded.");
  };
  const exportPDF = () => {
    if (!transactions.length) return notify("Add a transaction before exporting.");
    const report = new jsPDF();
    report.setFillColor(46, 139, 87); report.rect(0, 0, 210, 42, "F"); report.setTextColor(255, 255, 255); report.setFontSize(22); report.text("Ledgerly financial report", 15, 21); report.setFontSize(10); report.text(`Generated ${dateFormatter.format(new Date())}`, 15, 29);
    report.setTextColor(26, 32, 44); report.setFontSize(14); report.text("Financial snapshot", 15, 57); report.setFontSize(10);
    [`Total income: ${money(allSummary.income)}`, `Total expenses: ${money(allSummary.expenses)}`, `Total balance: ${money(balance)}`, `This month's expenses: ${money(currentSummary.expenses)}`, `Monthly budget: ${monthlyBudget ? money(monthlyBudget) : "Not set"}`].forEach((line, index) => report.text(line, 15, 67 + index * 7));
    report.setFontSize(14); report.text("Transactions", 15, 109); report.setFontSize(8); let y = 118;
    transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).forEach((item) => { if (y > 280) { report.addPage(); y = 18; } report.text(`${item.date}   ${item.description.slice(0, 36)}`, 15, y); report.text(item.category, 109, y); report.text(`${item.type === "expense" ? "−" : "+"}${money(item.amount)}`, 158, y, { align: "right" }); y += 8; });
    report.save(`ledgerly-report-${today()}.pdf`); setExportOpen(false); notify("PDF report downloaded.");
  };

  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="app-shell">
      <header className="topbar"><a className="brand" href="#dashboard" aria-label="Ledgerly dashboard"><span className="brand-mark">L</span><span>ledgerly</span></a><div className="topbar-actions"><span className="privacy-note"><i /> Private &amp; local</span><button className="icon-button" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? "☀" : "☾"}</button><button className="button primary add-button" type="button" onClick={() => openTransaction()}><b>+</b> Add transaction</button></div></header>
      <main id="main-content">
        <section className="page-heading" id="dashboard"><div><p className="eyebrow">OVERVIEW</p><h1>Good {getGreeting()}, there.</h1><p className="muted">Here is a clear view of your money this month.</p></div><div className="heading-actions"><button className="button secondary" type="button" onClick={() => setModal("insights")}>✦ AI insights</button><div className="export-wrap"><button className="button secondary" type="button" onClick={() => setExportOpen((open) => !open)} aria-expanded={exportOpen}>Export&nbsp;⌄</button>{exportOpen && <div className="export-menu"><button type="button" onClick={exportCSV}>Download CSV</button><button type="button" onClick={exportPDF}>Download PDF report</button></div>}</div></div></section>
        <section className="hero-card" aria-label="Current financial balance"><div className="hero-content"><p className="hero-label">TOTAL BALANCE</p><p className="hero-balance">{money(balance)}</p><div className="hero-meta"><span><b>{currentSummary.income >= currentSummary.expenses ? "↗" : "↘"}</b> <strong>{currentSummary.income >= currentSummary.expenses ? "+" : ""}{money(currentSummary.income - currentSummary.expenses)}</strong> net this month</span><span>{new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date())}</span></div></div><i className="hero-orb one" /><i className="hero-orb two" /></section>
        <section className="stat-grid" aria-label="Financial summary"><article className="stat-card income"><span className="stat-icon">↓</span><p className="stat-label">TOTAL INCOME</p><p className="stat-value">{money(allSummary.income)}</p><p className="stat-detail positive">{currentSummary.income ? `${money(currentSummary.income)} this month` : "No income this month"}</p></article><article className="stat-card expense"><span className="stat-icon">↑</span><p className="stat-label">TOTAL EXPENSES</p><p className="stat-value">{money(allSummary.expenses)}</p><p className="stat-detail negative">{currentSummary.expenses ? `${money(currentSummary.expenses)} this month` : "No expenses this month"}</p></article><article className="stat-card budget"><span className="stat-icon">◎</span><div className="label-row"><p className="stat-label">MONTHLY BUDGET</p><button className="text-button" type="button" onClick={() => setModal("budget")}>Edit</button></div><p className="stat-value">{monthlyBudget ? money(monthlyBudget) : "Not set"}</p><div className="progress"><i style={{ width: `${Math.min(budgetUsed, 100)}%`, background: budgetUsed > 100 ? "var(--red)" : budgetUsed > 80 ? "var(--orange)" : "var(--purple)" }} /></div><p className="stat-detail">{monthlyBudget ? `${budgetUsed.toFixed(0)}% used this month` : "Set a budget to track progress"}</p></article><article className="stat-card remaining"><span className="stat-icon">◔</span><p className="stat-label">REMAINING BUDGET</p><p className={`stat-value${monthlyBudget && remaining < 0 ? " over-budget" : ""}`}>{monthlyBudget ? money(remaining) : "—"}</p><p className="stat-detail">{monthlyBudget ? remaining < 0 ? `${money(Math.abs(remaining))} over budget` : `${Math.max(0, 100 - budgetUsed).toFixed(0)}% still available` : "Waiting for a budget"}</p></article></section>
        {monthlyBudget > 0 && currentSummary.expenses > monthlyBudget && <section className="budget-alert" role="alert"><span>!</span><p><strong>Budget exceeded.</strong> You are {money(currentSummary.expenses - monthlyBudget)} above your limit.</p><button className="text-button" type="button" onClick={() => setModal("budget")}>Adjust budget</button></section>}
        <section className="content-grid" aria-label="Analytics"><article className="panel chart-panel"><header className="panel-heading"><div><p className="eyebrow">ANALYTICS</p><h2>Spending by category</h2></div><small>All time</small></header><div className="chart-and-legend"><div className="chart-wrap donut">{categoryEntries.length ? <Doughnut data={categoryChart} options={{ ...chartOptions, cutout: "69%" }} /> : <p className="chart-empty">Add an expense to see your spending breakdown.</p>}</div><ul className="chart-legend">{categoryEntries.map(([category, amount]) => <li key={category}><i className="legend-dot" style={{ background: CATEGORY_COLORS[category] }} /><span>{category}</span><b className="legend-amount">{money(amount)}</b></li>)}</ul></div></article><article className="panel chart-panel"><header className="panel-heading"><div><p className="eyebrow">TRENDS</p><h2>Monthly expenses</h2></div><small>Last 6 months</small></header><div className="chart-wrap bars">{monthlyData.totals.some(Boolean) ? <Bar data={barChart} options={barOptions} /> : <p className="chart-empty">Add dated expenses to see monthly trends.</p>}</div></article></section>
        <section className="panel transactions-panel" id="transactions"><header className="panel-heading"><div><p className="eyebrow">ACTIVITY</p><h2>Transactions</h2></div><button className="button secondary small-button" type="button" onClick={() => openTransaction()}>+ Add new</button></header><div className="filter-bar" aria-label="Filter transactions"><label className="search"><span>⌕</span><input type="search" placeholder="Search transactions" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label><label className="select"><span className="sr-only">Category</span><select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option value="all">All categories</option>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label><label className="date"><span className="sr-only">Start date</span><input type="date" value={filters.start} onChange={(event) => setFilters({ ...filters, start: event.target.value })} /></label><span className="to">to</span><label className="date"><span className="sr-only">End date</span><input type="date" value={filters.end} onChange={(event) => setFilters({ ...filters, end: event.target.value })} /></label><label className="select sort"><span className="sr-only">Sort transactions</span><select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option><option value="lowest">Lowest amount</option></select></label>{hasFilters && <button className="filter-reset" type="button" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button>}</div><div className="table-wrap">{transactions.length > 0 && filteredTransactions.length > 0 && <table><thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th className="amount-head">Amount</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredTransactions.map((transaction) => <tr key={transaction.id}><td><span className="transaction-name"><i className={`transaction-avatar ${transaction.type}`}>{transaction.type === "income" ? "↓" : "↑"}</i><span>{transaction.description}</span></span></td><td><span className="category-pill">{transaction.category}</span></td><td>{dateFormatter.format(new Date(`${transaction.date}T12:00:00`))}</td><td className={`amount ${transaction.type}`}>{transaction.type === "income" ? "+" : "−"}{money(transaction.amount)}</td><td className="row-actions"><button className="row-action" type="button" onClick={() => openTransaction(transaction)} aria-label={`Edit ${transaction.description}`}>✎</button><button className="row-action delete" type="button" onClick={() => deleteTransaction(transaction)} aria-label={`Delete ${transaction.description}`}>×</button></td></tr>)}</tbody></table>}{!transactions.length && <div className="empty-state"><i>↗</i><h3>No transactions yet</h3><p>Add income or an expense to start building your financial picture.</p><button className="button primary" type="button" onClick={() => openTransaction()}>Add your first transaction</button></div>}{transactions.length > 0 && !filteredTransactions.length && <div className="empty-state"><i>⌕</i><h3>No matching transactions</h3><p>Try changing or clearing the current filters.</p><button className="button secondary" type="button" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button></div>}</div>{transactions.length > 0 && <p className="transaction-count">Showing {filteredTransactions.length} of {transactions.length} transaction{transactions.length === 1 ? "" : "s"}</p>}</section>
      </main>
    </div>
    {modal === "transaction" && <TransactionModal transaction={editingTransaction} onClose={() => setModal(null)} onSave={saveTransaction} />}
    {modal === "budget" && <BudgetModal monthlyBudget={monthlyBudget} onClose={() => setModal(null)} onSave={saveBudget} />}
    {modal === "insights" && <InsightsModal insights={insights} onClose={() => setModal(null)} />}
    {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
  </>;
}

export default App;
