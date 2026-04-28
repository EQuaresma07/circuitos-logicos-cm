import React from 'react';

export default function StatusBar({ componentCount, wireCount, wiringFrom, selectedId }) {
  return (
    <footer className="statusbar">
      <div className="status-group">
        <span className="status-dot active" />
        <span>Pronto</span>
      </div>
      <div className="status-sep" />
      <div className="status-group">
        <span className="status-label">Componentes:</span>
        <span className="status-value">{componentCount}</span>
      </div>
      <div className="status-sep" />
      <div className="status-group">
        <span className="status-label">Conexões:</span>
        <span className="status-value">{wireCount}</span>
      </div>

      <div className="statusbar-spacer" />

      {wiringFrom && (
        <div className="status-group highlight">
          <span>⚡ Conectando — clique no pino de destino (ESC para cancelar)</span>
        </div>
      )}
      {!wiringFrom && selectedId && (
        <div className="status-group">
          <span>Selecionado: {selectedId}</span>
        </div>
      )}
      {!wiringFrom && !selectedId && (
        <div className="status-group muted">
          <span>Dica: clique em um pino de saída e arraste até um pino de entrada para conectar</span>
        </div>
      )}
    </footer>
  );
}
