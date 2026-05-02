import React, { useState, useEffect, useRef } from 'react';

const GATE_LABELS = {
  AND: 'AND Gate',
  OR:  'OR Gate',
  NAND: 'NAND Gate',
  NOR:  'NOR Gate',
};

export default function GateConfigPanel({ comp, svgRef, onCommit, onClose }) {
  const [count, setCount] = useState(comp.inputCount || 2);
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // Posiciona o painel próximo ao componente no SVG
  useEffect(() => {
    if (!svgRef?.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = comp.x;
    pt.y = comp.y;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const screen = pt.matrixTransform(ctm);
    const panelW = 220;
    const panelH = 160;
    let x = screen.x + 80;
    let y = screen.y - 10;
    x = Math.min(x, window.innerWidth - panelW - 12);
    y = Math.min(y, window.innerHeight - panelH - 40);
    y = Math.max(y, 70);
    setPos({ x, y });
  }, [comp, svgRef]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    setTimeout(() => window.addEventListener('mousedown', handler), 0);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);

  const apply = (n) => {
    const clamped = Math.max(2, Math.min(8, n));
    setCount(clamped);
    onCommit(clamped);
  };

  return (
    <div
      ref={panelRef}
      className="gate-config-panel"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="gate-config-header">
        <span className="gate-config-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </span>
        <span className="gate-config-title">{GATE_LABELS[comp.type] || comp.type}</span>
        <button className="gate-config-close" onClick={onClose}>×</button>
      </div>

      {/* Body */}
      <div className="gate-config-body">
        <label className="gate-config-label">Input Count</label>

        <div className="gate-config-stepper">
          <button
            className="gate-stepper-btn"
            onClick={() => apply(count - 1)}
            disabled={count <= 2}
            aria-label="Diminuir"
          >
            −
          </button>

          <span className="gate-stepper-value">{count}</span>

          <button
            className="gate-stepper-btn"
            onClick={() => apply(count + 1)}
            disabled={count >= 8}
            aria-label="Aumentar"
          >
            +
          </button>
        </div>

        <p className="gate-config-hint">mín. 2 · máx. 8</p>
      </div>
    </div>
  );
}
