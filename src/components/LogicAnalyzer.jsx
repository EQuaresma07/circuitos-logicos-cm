import React, { useMemo } from 'react';

// Timing diagram para até 4 sinais traçados.
// Recebe samples do TraceRecorder e renderiza ondas quadradas.
export default function LogicAnalyzer({
  visible, onClose,
  trace,        // TraceRecorder
  pinLabels,    // string[] com label de cada pino traçado
  components,
  onAddPin,     // callback (pinId) — abre seletor
  onClearTrace,
}) {
  if (!visible) return null;

  const samples = trace ? trace.samples : [];
  const tracedCount = trace ? trace.tracedPinIds.length : 0;

  // Calcula range de tempo
  const { tMin, tMax } = useMemo(() => {
    if (samples.length === 0) return { tMin: 0, tMax: 1000 };
    return {
      tMin: samples[0].t,
      tMax: Math.max(samples[samples.length - 1].tEnd, samples[0].t + 100),
    };
  }, [samples]);

  const W = 760;          // largura útil do gráfico
  const labelCol = 70;
  const rowH = 36;
  const padTop = 8;
  const padBot = 8;

  const tRange = Math.max(1, tMax - tMin);
  const xOf = (t) => labelCol + ((t - tMin) / tRange) * W;

  return (
    <div className="logic-analyzer">
      <div className="la-header">
        <span className="la-title">Logic Analyzer</span>
        <span className="la-info">
          {tracedCount === 0
            ? 'No pins traced — click an empty slot then click a pin on the canvas'
            : `${tracedCount}/4 pins · ${samples.length} samples`}
        </span>
        <div className="la-actions">
          <button className="la-btn" onClick={onClearTrace}>Clear</button>
          <button className="la-btn" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="la-body">
        <svg width={labelCol + W + 8} height={padTop + 4 * rowH + padBot}>
          {/* 4 lanes (uma por pino) */}
          {[0, 1, 2, 3].map(i => {
            const yTop = padTop + i * rowH;
            const yMid = yTop + rowH / 2;
            const yHi = yTop + 6;
            const yLo = yTop + rowH - 6;
            const pinId = trace?.tracedPinIds[i];
            const label = pinLabels[i] || (pinId ? '...' : 'add pin');

            // Constrói path da onda
            let pathD = '';
            if (samples.length > 0 && pinId) {
              for (let s = 0; s < samples.length; s++) {
                const sample = samples[s];
                const v = sample.values[i];
                const isHi = v === true;
                const isHiZ = v === null || v === undefined;
                const x0 = xOf(sample.t);
                const x1 = xOf(sample.tEnd);
                const y = isHi ? yHi : yLo;
                if (s === 0) pathD += `M ${x0} ${y}`;
                else pathD += ` L ${x0} ${y}`;
                pathD += ` L ${x1} ${y}`;
                // Stroke especial em HIGH-Z?
                // Para simplicidade renderizamos linha normal, com cor diferente caso HiZ.
              }
            }

            return (
              <g key={i}>
                {/* Linha base (low) */}
                <line x1={labelCol} y1={yLo} x2={labelCol + W} y2={yLo}
                  stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="2,3" />
                {/* Linha topo (high) */}
                <line x1={labelCol} y1={yHi} x2={labelCol + W} y2={yHi}
                  stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="2,3" />
                {/* Label */}
                <text x={labelCol - 8} y={yMid + 4} textAnchor="end"
                  fill={pinId ? 'var(--text-chrome)' : 'var(--text-chrome-mute)'}
                  fontSize="10" fontFamily="'JetBrains Mono', monospace" fontWeight="600"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onAddPin(i)}>
                  {label}
                </text>
                {/* Onda */}
                {pathD && (
                  <path d={pathD} fill="none"
                    stroke={pinId ? '#0ea5e9' : 'transparent'}
                    strokeWidth="1.6" strokeLinejoin="miter" />
                )}
                {/* Separador entre lanes */}
                <line x1={0} y1={yTop + rowH - 1} x2={labelCol + W + 8} y2={yTop + rowH - 1}
                  stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="la-footer">
        <span className="la-time">
          t: {tMin.toFixed(0)}ms → {tMax.toFixed(0)}ms ({tRange.toFixed(0)}ms span)
        </span>
      </div>
    </div>
  );
}
