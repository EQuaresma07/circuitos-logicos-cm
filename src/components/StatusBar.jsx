import React from 'react';

export default function StatusBar({ componentCount, wireCount, wiringFrom, selectionCount }) {
  return (
    <footer className="statusbar">
      <div className="status-group">
        <span className="status-dot active" />
        <span>Ready</span>
      </div>
      <div className="status-sep" />
      <div className="status-group">
        <span className="status-label">Components:</span>
        <span className="status-value">{componentCount}</span>
      </div>
      <div className="status-sep" />
      <div className="status-group">
        <span className="status-label">Wires:</span>
        <span className="status-value">{wireCount}</span>
      </div>
      {selectionCount > 0 && (
        <>
          <div className="status-sep" />
          <div className="status-group">
            <span className="status-label">Selected:</span>
            <span className="status-value">{selectionCount}</span>
          </div>
        </>
      )}

      <div className="statusbar-spacer" />

      {wiringFrom && (
        <div className="status-group highlight">
          <span>⚡ Wiring — click on destination pin (ESC to cancel)</span>
        </div>
      )}
      {!wiringFrom && (
        <div className="status-group muted">
          <span>Click pin to start wire · drag empty area to multi-select</span>
        </div>
      )}
    </footer>
  );
}
