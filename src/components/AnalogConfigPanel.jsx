import React, { useState, useEffect, useRef } from 'react';

const TITLES = {
  DC_SOURCE: 'Fonte DC',
  AC_SOURCE: 'Fonte AC',
  SQUARE_SOURCE: 'Onda Quadrada',
  RESISTOR: 'Resistor',
};

// Slider numérico com label, min/max e step
function NumberField({ label, value, onChange, min, max, step, suffix, hint }) {
  const handle = (v) => {
    const num = parseFloat(v);
    if (isNaN(num)) return;
    const clamped = Math.min(max, Math.max(min, num));
    onChange(clamped);
  };
  return (
    <div className="ac-field">
      <div className="ac-field-row">
        <label className="ac-field-label">{label}</label>
        <div className="ac-field-input-wrap">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => handle(e.target.value)}
            className="ac-field-input"
          />
          {suffix && <span className="ac-field-suffix">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handle(e.target.value)}
        className="ac-field-slider"
      />
      {hint && <div className="ac-field-hint">{hint}</div>}
    </div>
  );
}

export default function AnalogConfigPanel({ comp, svgRef, onChange, onClose }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // Posicionar próximo ao componente
  useEffect(() => {
    if (!svgRef?.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = comp.x + 60;
    pt.y = comp.y;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const screen = pt.matrixTransform(ctm);
    const panelW = 280;
    const panelH = 320;
    let x = screen.x + 20;
    let y = screen.y - 10;
    x = Math.min(x, window.innerWidth - panelW - 12);
    y = Math.min(y, window.innerHeight - panelH - 40);
    y = Math.max(y, 70);
    x = Math.max(x, 12);
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

  // Helper genérico para atualizar uma propriedade
  const update = (prop, val) => {
    comp[prop] = val;
    onChange();
  };

  return (
    <div
      ref={panelRef}
      className="analog-config-panel"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="ac-header">
        <span className="ac-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <span className="ac-title">{TITLES[comp.type] || comp.type}</span>
        <button className="ac-close" onClick={onClose}>×</button>
      </div>

      <div className="ac-body">
        {comp.type === 'DC_SOURCE' && (
          <NumberField
            label="Tensão"
            value={comp.voltageSet}
            onChange={(v) => update('voltageSet', v)}
            min={-24}
            max={24}
            step={0.1}
            suffix="V"
            hint="Tensão constante entre os terminais (+) e (−)"
          />
        )}

        {comp.type === 'AC_SOURCE' && (
          <>
            <NumberField
              label="Amplitude"
              value={comp.amplitude}
              onChange={(v) => update('amplitude', v)}
              min={0.1}
              max={24}
              step={0.1}
              suffix="V"
              hint="Tensão de pico"
            />
            <NumberField
              label="Frequência"
              value={comp.frequency}
              onChange={(v) => update('frequency', v)}
              min={0.1}
              max={100}
              step={0.1}
              suffix="Hz"
            />
            <NumberField
              label="Offset DC"
              value={comp.offset}
              onChange={(v) => update('offset', v)}
              min={-12}
              max={12}
              step={0.1}
              suffix="V"
            />
          </>
        )}

        {comp.type === 'SQUARE_SOURCE' && (
          <>
            <NumberField
              label="Amplitude"
              value={comp.amplitude}
              onChange={(v) => update('amplitude', v)}
              min={0}
              max={24}
              step={0.1}
              suffix="V"
              hint="Tensão no nível alto"
            />
            <NumberField
              label="Frequência"
              value={comp.frequency}
              onChange={(v) => update('frequency', v)}
              min={0.1}
              max={100}
              step={0.1}
              suffix="Hz"
            />
            <NumberField
              label="Duty Cycle"
              value={Math.round(comp.duty * 100)}
              onChange={(v) => update('duty', v / 100)}
              min={5}
              max={95}
              step={1}
              suffix="%"
              hint="Tempo no nível alto vs período total"
            />
          </>
        )}

        {comp.type === 'RESISTOR' && (
          <>
            <NumberField
              label="Resistência"
              value={comp.resistance}
              onChange={(v) => update('resistance', v)}
              min={1}
              max={10000000}
              step={1}
              suffix="Ω"
              hint="Valores típicos: 100, 1000, 10000, 1000000"
            />
            <div className="ac-quick-presets">
              {[100, 1000, 10000, 100000, 1000000].map(r => (
                <button
                  key={r}
                  className={`ac-preset-btn ${comp.resistance === r ? 'active' : ''}`}
                  onClick={() => update('resistance', r)}
                >
                  {r >= 1e6 ? `${r / 1e6}MΩ` : r >= 1e3 ? `${r / 1e3}kΩ` : `${r}Ω`}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
