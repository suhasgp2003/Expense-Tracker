import { useState } from "react";
import Modal from "./Modal";

export default function BudgetForm({ monthlyBudget, onClose, onSave }) {
  const [value, setValue] = useState(monthlyBudget || "");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const budget = Number(value);
    if (!Number.isFinite(budget) || budget < 0) return setError("Enter a valid zero or positive amount.");
    onSave(budget);
  };

  return (
    <Modal small label="Set monthly budget" onClose={onClose}>
      <header className="modal-heading">
        <div><p className="eyebrow">PLANNING</p><h2>Set monthly budget</h2></div>
        <button className="icon-button close" type="button" onClick={onClose} aria-label="Close dialog">×</button>
      </header>
      <form onSubmit={handleSubmit} noValidate>
        <label className="form-field">Monthly spending limit (₹)
          <input value={value} onChange={(event) => { setError(""); setValue(event.target.value); }} type="number" min="0" step="1" inputMode="decimal" placeholder="e.g. 30000" autoFocus />
        </label>
        <p className="form-help">This applies to expenses in the current calendar month.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <footer className="modal-footer">
          <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="button primary" type="submit">Save budget</button>
        </footer>
      </form>
    </Modal>
  );
}
