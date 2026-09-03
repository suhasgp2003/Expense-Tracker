import { dateFormatter, money } from "../utils/finance";

export default function TransactionItem({ onDelete, onEdit, transaction }) {
  const isIncome = transaction.type === "income";

  return (
    <tr>
      <td>
        <span className="transaction-name">
          <i className={`transaction-avatar ${transaction.type}`}>{isIncome ? "↓" : "↑"}</i>
          <span>{transaction.description}</span>
        </span>
      </td>
      <td><span className="category-pill">{transaction.category}</span></td>
      <td>{dateFormatter.format(new Date(`${transaction.date}T12:00:00`))}</td>
      <td className={`amount ${transaction.type}`}>{isIncome ? "+" : "−"}{money(transaction.amount)}</td>
      <td className="row-actions">
        <button className="row-action" type="button" onClick={() => onEdit(transaction)} aria-label={`Edit ${transaction.description}`}>✎</button>
        <button className="row-action delete" type="button" onClick={() => onDelete(transaction)} aria-label={`Delete ${transaction.description}`}>×</button>
      </td>
    </tr>
  );
}
