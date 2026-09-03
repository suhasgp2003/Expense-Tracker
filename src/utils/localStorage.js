import { normalizeTransaction } from "./finance";

export const STORAGE_KEYS = Object.freeze({
  transactions: "ledgerly:transactions:v1",
  settings: "ledgerly:settings:v1",
  theme: "ledgerly:theme:v1",
});

function readJson(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Loads the current model and migrates the original project's storage format once. */
export function loadLedger() {
  const savedTransactions = readJson(STORAGE_KEYS.transactions, null);
  const legacyTransactions = savedTransactions === null ? readJson("transactions", []) : savedTransactions;
  const transactions = Array.isArray(legacyTransactions)
    ? legacyTransactions.map(normalizeTransaction).filter((transaction) => transaction.amount > 0)
    : [];
  const settings = readJson(STORAGE_KEYS.settings, {});

  return {
    transactions,
    monthlyBudget: Math.max(0, Number(settings.monthlyBudget) || 0),
  };
}

export function persistLedger(transactions, monthlyBudget) {
  window.localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({ monthlyBudget }));
}

export function getStoredTheme() {
  const savedTheme = window.localStorage.getItem(STORAGE_KEYS.theme);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function persistTheme(theme) {
  window.localStorage.setItem(STORAGE_KEYS.theme, theme);
}
