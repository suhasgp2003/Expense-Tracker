import { CATEGORIES } from "../utils/finance";
import TransactionItem from "./TransactionItem";

export default function TransactionList({
  filters,
  hasFilters,
  onAddTransaction,
  onDeleteTransaction,
  onEditTransaction,
  onFiltersChange,
  onResetFilters,
  transactions,
  visibleTransactions,
}) {
  const updateFilter = (field, value) => onFiltersChange((current) => ({ ...current, [field]: value }));

  return (
    <section className="panel transactions-panel" id="transactions">
      <header className="panel-heading">
        <div><p className="eyebrow">ACTIVITY</p><h2>Transactions</h2></div>
        <button className="button secondary small-button" type="button" onClick={onAddTransaction}>+ Add new</button>
      </header>

      <div className="filter-bar" aria-label="Filter transactions">
        <label className="search">
          <span>⌕</span>
          <input type="search" placeholder="Search transactions" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
        </label>
        <label className="select"><span className="sr-only">Category</span>
          <select value={filters.category} onChange={(event) => updateFilter("category", event.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label className="date"><span className="sr-only">Start date</span>
          <input type="date" value={filters.start} onChange={(event) => updateFilter("start", event.target.value)} />
        </label>
        <span className="to">to</span>
        <label className="date"><span className="sr-only">End date</span>
          <input type="date" value={filters.end} onChange={(event) => updateFilter("end", event.target.value)} />
        </label>
        <label className="select sort"><span className="sr-only">Sort transactions</span>
          <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest amount</option>
            <option value="lowest">Lowest amount</option>
          </select>
        </label>
        {hasFilters && <button className="filter-reset" type="button" onClick={onResetFilters}>Clear filters</button>}
      </div>

      <div className="table-wrap">
        {transactions.length > 0 && visibleTransactions.length > 0 && (
          <table>
            <thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th className="amount-head">Amount</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {visibleTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} onEdit={onEditTransaction} onDelete={onDeleteTransaction} />
              ))}
            </tbody>
          </table>
        )}
        {!transactions.length && (
          <div className="empty-state">
            <i>↗</i><h3>No transactions yet</h3>
            <p>Add income or an expense to start building your financial picture.</p>
            <button className="button primary" type="button" onClick={onAddTransaction}>Add your first transaction</button>
          </div>
        )}
        {transactions.length > 0 && !visibleTransactions.length && (
          <div className="empty-state">
            <i>⌕</i><h3>No matching transactions</h3>
            <p>Try changing or clearing the current filters.</p>
            <button className="button secondary" type="button" onClick={onResetFilters}>Clear filters</button>
          </div>
        )}
      </div>
      {transactions.length > 0 && (
        <p className="transaction-count">Showing {visibleTransactions.length} of {transactions.length} transaction{transactions.length === 1 ? "" : "s"}</p>
      )}
    </section>
  );
}
