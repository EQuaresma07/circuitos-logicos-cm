import React from 'react';

export default function StatusBar({
  componentCount, wireCount, wiringFrom, selectionCount, selectedWireCount,
  currentTool, simulationPaused, filename,
}) {
  const totalSelected = (selectionCount || 0) + (selectedWireCount || 0);
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
      {totalSelected > 0 && (
        <>
          <div className="status-sep" />
          <div className="status-group">
            <span className="status-label">Selected:</span>
            <span className="status-value">
              {selectionCount > 0 && `${selectionCount} comp`}
              {selectionCount > 0 && selectedWireCount > 0 && ' + '}
              {selectedWireCount > 0 && `${selectedWireCount} wire`}
            </span>
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
          <span>
            {currentTool === 'pan'
              ? 'Drag canvas to pan'
              : totalSelected > 0
                ? 'Del to delete · arrows to move · right-click for options'
                : 'Click component or wire · right-click for options'}
          </span>
        </div>
      )}
    </footer>
  );
}
