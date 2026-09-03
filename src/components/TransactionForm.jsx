import { useState } from "react";
import { CATEGORIES, createTransactionId, today } from "../utils/finance";
import Modal from "./Modal";

/** Keeps draft validation local while the context owns saved transactions. */
export default function TransactionForm({ onClose, onSave, transaction }) {
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

  const updateField = (field, value) => {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);

    if (form.description.trim().length < 2) return setError("Please add a description of at least 2 characters.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Enter an amount greater than zero.");
    if (!form.date) return setError("Please choose a date.");

    onSave({
      ...form,
      id: form.id || createTransactionId(),
      description: form.description.trim(),
      amount,
      category: form.type === "income" ? "Income" : form.category,
      createdAt: transaction?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <Modal label={isEditing ? "Edit transaction" : "Add transaction"} onClose={onClose}>
      <header className="modal-heading">
        <div>
          <p className="eyebrow">{isEditing ? "UPDATE ENTRY" : "NEW ENTRY"}</p>
          <h2>{isEditing ? "Edit transaction" : "Add transaction"}</h2>
        </div>
        <button className="icon-button close" type="button" onClick={onClose} aria-label="Close dialog">×</button>
      </header>
      <form onSubmit={handleSubmit} noValidate>
        <fieldset className="type-switch">
          <legend className="sr-only">Transaction type</legend>
          {["expense", "income"].map((type) => (
            <label key={type}>
              <input type="radio" name="transaction-type" value={type} checked={form.type === type} onChange={() => updateField("type", type)} />
              <span>{type[0].toUpperCase() + type.slice(1)}</span>
            </label>
          ))}
        </fieldset>
        <div className="form-grid">
          <label className="form-field wide">Description
            <input value={form.description} onChange={(event) => updateField("description", event.target.value)} maxLength="80" placeholder="e.g. Grocery run" autoFocus />
          </label>
          <label className="form-field">Amount (₹)
            <input value={form.amount} onChange={(event) => updateField("amount", event.target.value)} type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" />
          </label>
          <label className="form-field">Date
            <input value={form.date} onChange={(event) => updateField("date", event.target.value)} type="date" />
          </label>
          {form.type === "expense" && (
            <label className="form-field">Category
              <select value={form.category} onChange={(event) => updateField("category", event.target.value)}>
                {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
          )}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <footer className="modal-footer">
          <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="button primary" type="submit">{isEditing ? "Save changes" : "Save transaction"}</button>
        </footer>
      </form>
    </Modal>
  );
}
