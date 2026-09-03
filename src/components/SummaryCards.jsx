import { money } from "../utils/finance";

const periodFormatter = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });

function getGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

export default function SummaryCards({
  balance,
  budgetUsage,
  currentMonthSummary,
  headingActions,
  monthlyBudget,
  onEditBudget,
  remainingBudget,
  summary,
}) {
  const netThisMonth = currentMonthSummary.income - currentMonthSummary.expenses;
  const isOverBudget = monthlyBudget > 0 && currentMonthSummary.expenses > monthlyBudget;
  const progressColor = budgetUsage > 100
    ? "var(--red)"
    : budgetUsage > 80 ? "var(--orange)" : "var(--purple)";

  return (
    <>
      <section className="page-heading" id="dashboard">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Good {getGreeting()}, there.</h1>
          <p className="muted">Here is a clear view of your money this month.</p>
        </div>
        <div className="heading-actions">{headingActions}</div>
      </section>

      <section className="hero-card" aria-label="Current financial balance">
        <div className="hero-content">
          <p className="hero-label">TOTAL BALANCE</p>
          <p className="hero-balance">{money(balance)}</p>
          <div className="hero-meta">
            <span>
              <b>{netThisMonth >= 0 ? "↗" : "↘"}</b>
              <strong>{netThisMonth >= 0 ? "+" : ""}{money(netThisMonth)}</strong> net this month
            </span>
            <span>{periodFormatter.format(new Date())}</span>
          </div>
        </div>
        <i className="hero-orb one" />
        <i className="hero-orb two" />
      </section>

      <section className="stat-grid" aria-label="Financial summary">
        <article className="stat-card income">
          <span className="stat-icon">↓</span>
          <p className="stat-label">TOTAL INCOME</p>
          <p className="stat-value">{money(summary.income)}</p>
          <p className="stat-detail positive">
            {currentMonthSummary.income ? `${money(currentMonthSummary.income)} this month` : "No income this month"}
          </p>
        </article>
        <article className="stat-card expense">
          <span className="stat-icon">↑</span>
          <p className="stat-label">TOTAL EXPENSES</p>
          <p className="stat-value">{money(summary.expenses)}</p>
          <p className="stat-detail negative">
            {currentMonthSummary.expenses ? `${money(currentMonthSummary.expenses)} this month` : "No expenses this month"}
          </p>
        </article>
        <article className="stat-card budget">
          <span className="stat-icon">◎</span>
          <div className="label-row">
            <p className="stat-label">MONTHLY BUDGET</p>
            <button className="text-button" type="button" onClick={onEditBudget}>Edit</button>
          </div>
          <p className="stat-value">{monthlyBudget ? money(monthlyBudget) : "Not set"}</p>
          <div className="progress"><i style={{ width: `${Math.min(budgetUsage, 100)}%`, background: progressColor }} /></div>
          <p className="stat-detail">
            {monthlyBudget ? `${budgetUsage.toFixed(0)}% used this month` : "Set a budget to track progress"}
          </p>
        </article>
        <article className="stat-card remaining">
          <span className="stat-icon">◔</span>
          <p className="stat-label">REMAINING BUDGET</p>
          <p className={`stat-value${isOverBudget ? " over-budget" : ""}`}>{monthlyBudget ? money(remainingBudget) : "—"}</p>
          <p className="stat-detail">
            {monthlyBudget
              ? isOverBudget ? `${money(Math.abs(remainingBudget))} over budget` : `${Math.max(0, 100 - budgetUsage).toFixed(0)}% still available`
              : "Waiting for a budget"}
          </p>
        </article>
      </section>

      {isOverBudget && (
        <section className="budget-alert" role="alert">
          <span>!</span>
          <p><strong>Budget exceeded.</strong> You are {money(currentMonthSummary.expenses - monthlyBudget)} above your limit.</p>
          <button className="text-button" type="button" onClick={onEditBudget}>Adjust budget</button>
        </section>
      )}
    </>
  );
}
