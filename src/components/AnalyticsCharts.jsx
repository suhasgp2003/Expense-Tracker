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
import { CATEGORY_COLORS, money } from "../utils/finance";

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip);

export default function AnalyticsCharts({ categoryEntries, monthlyExpenseTotals, months, theme }) {
  const categoryChart = {
    labels: categoryEntries.map(([category]) => category),
    datasets: [{
      data: categoryEntries.map(([, amount]) => amount),
      backgroundColor: categoryEntries.map(([category]) => CATEGORY_COLORS[category]),
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };
  const monthlyChart = {
    labels: months.map(({ label }) => label),
    datasets: [{
      data: monthlyExpenseTotals,
      backgroundColor: "#2e8b57",
      hoverBackgroundColor: "#1f6f44",
      borderRadius: 5,
      maxBarThickness: 34,
    }],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label ? `${context.label}: ` : "Expenses: "}${money(context.raw)}`,
        },
      },
    },
  };
  const barOptions = {
    ...chartOptions,
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: theme === "dark" ? "#a9c3af" : "#718096", font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: theme === "dark" ? "#365340" : "#dceadf" },
        ticks: {
          color: theme === "dark" ? "#a9c3af" : "#718096",
          font: { size: 10 },
          callback: (value) => `₹${Number(value) / 1000}k`,
        },
      },
    },
  };

  return (
    <section className="content-grid" aria-label="Analytics">
      <article className="panel chart-panel">
        <header className="panel-heading"><div><p className="eyebrow">ANALYTICS</p><h2>Spending by category</h2></div><small>All time</small></header>
        <div className="chart-and-legend">
          <div className="chart-wrap donut">
            {categoryEntries.length ? <Doughnut data={categoryChart} options={{ ...chartOptions, cutout: "69%" }} /> : <p className="chart-empty">Add an expense to see your spending breakdown.</p>}
          </div>
          <ul className="chart-legend">
            {categoryEntries.map(([category, amount]) => (
              <li key={category}><i className="legend-dot" style={{ background: CATEGORY_COLORS[category] }} /><span>{category}</span><b className="legend-amount">{money(amount)}</b></li>
            ))}
          </ul>
        </div>
      </article>
      <article className="panel chart-panel">
        <header className="panel-heading"><div><p className="eyebrow">TRENDS</p><h2>Monthly expenses</h2></div><small>Last 6 months</small></header>
        <div className="chart-wrap bars">
          {monthlyExpenseTotals.some(Boolean) ? <Bar data={monthlyChart} options={barOptions} /> : <p className="chart-empty">Add dated expenses to see monthly trends.</p>}
        </div>
      </article>
    </section>
  );
}
