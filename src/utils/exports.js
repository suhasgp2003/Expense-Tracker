import { jsPDF } from "jspdf";
import { dateFormatter, money, today } from "./finance";

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

export function exportTransactionsToCsv(transactions) {
  const escapeCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [
    ["Description", "Type", "Category", "Amount (INR)", "Date"],
    ...transactions
      .slice()
      .sort((first, second) => first.date.localeCompare(second.date))
      .map((transaction) => [
        transaction.description,
        transaction.type,
        transaction.category,
        transaction.type === "expense" ? -transaction.amount : transaction.amount,
        transaction.date,
      ]),
  ];

  downloadBlob(
    new Blob([rows.map((row) => row.map(escapeCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }),
    `ledgerly-transactions-${today()}.csv`,
  );
}

export function exportFinancialReport({ balance, currentMonthSummary, monthlyBudget, summary, transactions }) {
  const report = new jsPDF();
  report.setFillColor(46, 139, 87);
  report.rect(0, 0, 210, 42, "F");
  report.setTextColor(255, 255, 255);
  report.setFontSize(22);
  report.text("Ledgerly financial report", 15, 21);
  report.setFontSize(10);
  report.text(`Generated ${dateFormatter.format(new Date())}`, 15, 29);
  report.setTextColor(26, 32, 44);
  report.setFontSize(14);
  report.text("Financial snapshot", 15, 57);
  report.setFontSize(10);

  [
    `Total income: ${money(summary.income)}`,
    `Total expenses: ${money(summary.expenses)}`,
    `Total balance: ${money(balance)}`,
    `This month's expenses: ${money(currentMonthSummary.expenses)}`,
    `Monthly budget: ${monthlyBudget ? money(monthlyBudget) : "Not set"}`,
  ].forEach((line, index) => report.text(line, 15, 67 + index * 7));

  report.setFontSize(14);
  report.text("Transactions", 15, 109);
  report.setFontSize(8);
  let y = 118;
  transactions
    .slice()
    .sort((first, second) => second.date.localeCompare(first.date))
    .forEach((transaction) => {
      if (y > 280) {
        report.addPage();
        y = 18;
      }
      report.text(`${transaction.date}   ${transaction.description.slice(0, 36)}`, 15, y);
      report.text(transaction.category, 109, y);
      report.text(`${transaction.type === "expense" ? "−" : "+"}${money(transaction.amount)}`, 158, y, { align: "right" });
      y += 8;
    });
  report.save(`ledgerly-report-${today()}.pdf`);
}
