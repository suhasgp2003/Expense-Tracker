import Modal from "./Modal";

export default function InsightsModal({ insights, onClose }) {
  return (
    <Modal small label="Your AI insights" onClose={onClose}>
      <header className="modal-heading">
        <div><p className="eyebrow">SMART SUMMARY</p><h2>Your AI insights</h2></div>
        <button className="icon-button close" type="button" onClick={onClose} aria-label="Close dialog">×</button>
      </header>
      <p className="insights-intro">A transparent, on-device analysis of the transactions saved in this browser.</p>
      <div className="insight-list">
        {insights.map((insight) => (
          <article className="insight-item" key={insight.title}>
            <i>{insight.icon}</i>
            <div><strong>{insight.title}</strong><p>{insight.text}</p></div>
          </article>
        ))}
      </div>
      <footer className="modal-footer"><button className="button primary" type="button" onClick={onClose}>Got it</button></footer>
    </Modal>
  );
}
