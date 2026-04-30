import React from 'react';

export default function StatusBar({
  componentCount, wireCount, wiringFrom, selectionCount,
  currentTool, simulationPaused, filename,
}) {
  return (
    <footer className="statusbar">
      <div className="status-group">
        <span className={`status-dot ${simulationPaused ? '' : 'active'}`} />
        <span>{simulationPaused ? 'Paused' : 'Ready'}</span>
      </div>
      <div className="status-sep" />
      <div className="status-group">
        <span className="status-label">Tool:</span>
        <span className="status-value">{currentTool === 'pan' ? 'Pan' : 'Select'}</span>
      </div>
      <div className="status-sep" />
      <div className="status-group">
        <span className="status-label">File:</span>
        <span className="status-value">{filename || 'untitled'}</span>
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
          <span>⚡ Wiring — click destination pin (ESC to cancel)</span>
        </div>
      )}
      {!wiringFrom && (
        <div className="status-group muted">
          <span>{currentTool === 'pan' ? 'Drag canvas to pan' : 'Click pin to wire · drag empty area to multi-select'}</span>
        </div>
      )}
    </footer>
  );
}
