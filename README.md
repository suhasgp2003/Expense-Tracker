# Ledgerly — Personal Finance Dashboard

Ledgerly is a local-first personal finance app built with React and Vite. It upgrades the original beginner expense tracker into an interview-ready product with component-based UI state, while retaining a lightweight browser-only data model.

## Features

- Persistent transaction data in `localStorage`, including a one-time migration of the original app’s signed amount format
- Create, edit, and delete transactions with date, type, and category validation
- Expense categories: Food, Travel, Shopping, Bills, Health, Entertainment, and Other
- Search by description, filter by category or date range, and sort by newest, oldest, highest, or lowest amount
- Dashboard totals for income, expenses, balance, monthly budget, and remaining budget
- Budget progress indicator and an explicit over-budget warning
- Chart.js category-spending doughnut chart and six-month expense bar chart
- Saved light/dark theme and responsive card-based layout
- CSV export for raw data and jsPDF export for a readable report
- Private, explainable “AI Insights” generated locally from category, budget, and monthly trend calculations

## Run it

Install packages, then launch the Vite development server:

```powershell
npm install
npm run dev
```

Create a production build with `npm run build`. Chart.js and jsPDF are installed npm dependencies; core tracking and persistence work entirely in the browser.

## Architecture

```text
User event → React handler → state update → localStorage persistence
                                  ↓
                              React re-render
                              ├─ summary + budget status
                              ├─ filtered transaction list
                              └─ charts + category legend
```

The React application separates responsibilities into small reusable modules:

- `src/pages/Dashboard.jsx` coordinates dashboard-only UI state such as filters, dialogs, exports, and notifications.
- `src/context/TransactionContext.jsx` is the single source of truth for persistent transactions and budgets.
- `src/hooks/useTransactions.js` exposes derived summaries, analytics, filters, and transaction actions.
- `src/components/` contains focused, reusable presentation and form components.
- `src/utils/` contains browser storage, financial calculations, and export logic with no JSX.

Each transaction has a backend-friendly shape:

```js
{
  id: "uuid",
  description: "Grocery run",
  amount: 1240,
  type: "expense",
  category: "Food",
  date: "2026-08-29",
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp"
}
```

## Project structure

```text
Expense Tracker/
├── src/
│   ├── assets/                  # Static assets
│   ├── components/              # Reusable UI and form components
│   │   ├── Navbar.jsx
│   │   ├── SummaryCards.jsx
│   │   ├── TransactionForm.jsx
│   │   ├── TransactionList.jsx
│   │   └── TransactionItem.jsx
│   ├── context/
│   │   └── TransactionContext.jsx
│   ├── hooks/
│   │   └── useTransactions.js
│   ├── pages/
│   │   └── Dashboard.jsx
│   ├── styles/
│   │   └── index.css
│   ├── utils/
│   │   ├── localStorage.js
│   │   ├── finance.js
│   │   └── exports.js
│   ├── App.jsx                  # Application composition and theme state
│   └── main.jsx                 # React application entry point
├── index.html           # Vite document shell
├── package.json         # React, Vite, Chart.js, and jsPDF dependencies
└── README.md            # Architecture and development guide
```

## Implementation guide

1. **Model data consistently.** Store a positive `amount` and explicit `type`; signed numbers make validation and reporting needlessly fragile.
2. **Keep persistence at one boundary.** State loads at startup, saves after every mutation, then `renderApp()` derives all UI from that state.
3. **Derive rather than duplicate totals.** Dashboard values and budget status are calculated from transaction data, avoiding stale summaries.
4. **Treat discoverability as a feature.** Search, category/date filtering, and sort controls sit beside the transaction list and reset cleanly.
5. **Make analytics reactive.** Every state mutation recreates the Chart.js datasets, keeping charts accurate without manual refreshes.
6. **Use budget status proactively.** Progress appears before overspending; the warning state appears as soon as monthly expenses exceed the saved limit.
7. **Design for real usage.** Responsive breakpoints, dialogs, visible focus states, empty states, saved theme choice, and feedback toasts make the app feel intentional.
8. **Export user-owned data.** CSV makes data portable; the PDF provides a readable financial snapshot.
9. **Keep insights honest and private.** The insight cards use deterministic spending calculations locally, so no financial information is sent to a third party.

## Interview value

| Area | What it demonstrates |
| --- | --- |
| Normalized data model | Data modelling and migration thinking |
| Single render coordinator | Predictable state management without a framework |
| Search/filter/sort | Collection handling and real user workflows |
| Budget warning | Conditional UI and product judgement |
| Chart.js analytics | Translating transaction data into decisions |
| CSV/PDF exports | End-to-end feature ownership and interoperability |
| Local insights | Privacy-aware, explainable product design |
| Responsive dark mode | Accessibility and front-end polish |

## Next step for a full-stack version

Replace `load` and `save` with an authenticated API repository. The UI and calculation functions can remain unchanged. Account management, recurring transactions, import validation, automated tests, and cloud sync are logical next additions.
