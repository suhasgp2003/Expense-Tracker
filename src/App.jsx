import { useEffect, useState } from "react";
import { TransactionProvider } from "./context/TransactionContext";
import Dashboard from "./pages/Dashboard";
import { getStoredTheme, persistTheme } from "./utils/localStorage";

export default function App() {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    persistTheme(theme);
  }, [theme]);

  return (
    <TransactionProvider>
      <Dashboard theme={theme} onToggleTheme={() => setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark")} />
    </TransactionProvider>
  );
}
