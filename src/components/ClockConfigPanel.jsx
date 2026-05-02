import React, { useState, useEffect, useRef } from 'react';

export default function ClockConfigPanel({ comp, svgRef, onCommit, onClose }) {
  const [periodMs, setPeriodMs] = useState(comp.periodMs || 1000);
  const panelRef = useRef(null);

  const freqHz = periodMs > 0 ? (1000 / periodMs) : 0;

  // Posiciona o painel próximo ao componente no SVG
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!svgRef?.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = comp.x;
    pt.y = comp.y;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const screen = pt.matrixTransform(ctm);
    const panelW = 280;
    const panelH = 220;
    let x = screen.x + 110;
    let y = screen.y - 20;
    // Clamp to viewport
    x = Math.min(x, window.innerWidth - panelW - 12);
    y = Math.min(y, window.innerHeight - panelH - 40);
    y = Math.max(y, 70);
    setPos({ x, y });
  }, [comp, svgRef]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onCommit(periodMs);
        onClose();
      }
    };
    setTimeout(() => window.addEventListener('mousedown', handler), 0);
    return () => window.removeEventListener('mousedown', handler);
  }, [periodMs, onCommit, onClose]);

  const apply = (ms) => {
    const clamped = Math.max(50, Math.min(60000, ms));
    setPeriodMs(clamped);
    onCommit(clamped);
  };

  return (
    <div
      ref={panelRef}
      className="clock-panel"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="clock-panel-header">
        <span className="clock-panel-icon">◷</span>
        <span className="clock-panel-title">Clock</span>
        <button className="clock-panel-close" onClick={() => { onCommit(periodMs); onClose(); }}>×</button>
      </div>

      <div className="clock-panel-body">
        <label className="clock-panel-label">Duração do sinal (ms)</label>
        <div className="clock-panel-row">
          <button className="clock-stepper" onClick={() => apply(periodMs + 100)}>−</button>
          <input
            className="clock-panel-input"
            type="number"
            min={50}
            max={60000}
            step={50}
            value={periodMs}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v)) { setPeriodMs(v); onCommit(v); }
            }}
          />
          <button className="clock-stepper" onClick={() => apply(Math.max(50, periodMs - 100))}>+</button>
        </div>

        <div className="clock-panel-freq">
          ≈ {freqHz < 1 ? freqHz.toFixed(2) : freqHz < 10 ? freqHz.toFixed(1) : Math.round(freqHz)} Hz
        </div>

        <label className="clock-panel-label" style={{ marginTop: 14 }}>Presets</label>
        <div className="clock-panel-presets">
          {[
            { label: '0.5 Hz', ms: 2000 },
            { label: '1 Hz',   ms: 1000 },
            { label: '2 Hz',   ms: 500  },
            { label: '5 Hz',   ms: 200  },
            { label: '10 Hz',  ms: 100  },
            { label: '20 Hz',  ms: 50   },
          ].map(({ label, ms }) => (
            <button
              key={ms}
              className={`clock-preset-btn ${periodMs === ms ? 'active' : ''}`}
              onClick={() => apply(ms)}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="clock-panel-label" style={{ marginTop: 14 }}>
          Sinal após reinicialização
        </label>
        <div className="clock-panel-reset-state">
          <span className="clock-panel-tag">Baixo (Falso)</span>
        </div>
      </div>
    </div>
  );
}
