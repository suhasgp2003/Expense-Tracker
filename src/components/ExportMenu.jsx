export default function ExportMenu({ isOpen, onExportCsv, onExportPdf, onToggle }) {
  return (
    <div className="export-wrap">
      <button className="button secondary" type="button" onClick={onToggle} aria-expanded={isOpen}>Export&nbsp;⌄</button>
      {isOpen && (
        <div className="export-menu">
          <button type="button" onClick={onExportCsv}>Download CSV</button>
          <button type="button" onClick={onExportPdf}>Download PDF report</button>
        </div>
      )}
    </div>
  );
}
