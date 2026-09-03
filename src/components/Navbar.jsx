export default function Navbar({ onAddTransaction, onToggleTheme, theme }) {
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header className="topbar">
      <a className="brand" href="#dashboard" aria-label="Ledgerly dashboard">
        <span className="brand-mark">L</span>
        <span>ledgerly</span>
      </a>
      <div className="topbar-actions">
        <span className="privacy-note"><i /> Private &amp; local</span>
        <button className="icon-button" type="button" onClick={onToggleTheme} aria-label={`Switch to ${nextTheme} mode`}>
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <button className="button primary add-button" type="button" onClick={onAddTransaction}>
          <b>+</b> Add transaction
        </button>
      </div>
    </header>
  );
}
