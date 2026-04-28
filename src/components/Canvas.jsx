import React, { useRef, useCallback } from 'react';
import { InputSwitch, OutputProbe, Clock, Gate } from '../engine/components.js';
import {
  ANDSymbol, ORSymbol, NOTSymbol, NANDSymbol, NORSymbol,
  XORSymbol, XNORSymbol,
} from './GateSymbols.jsx';

// ── Constantes geométricas ──
export const COMP_W = 96;
export const COMP_H = 56;
export const PIN_R = 5;

const GATE_SYMBOL_MAP = {
  AND: ANDSymbol, OR: ORSymbol, NOT: NOTSymbol,
  NAND: NANDSymbol, NOR: NORSymbol, XOR: XORSymbol, XNOR: XNORSymbol,
};

// ── Helpers de geometria ──
export function getPinPos(comp, pin) {
  const idx = comp.inputs.indexOf(pin);
  if (idx >= 0) {
    const step = COMP_H / (comp.inputs.length + 1);
    return { x: comp.x, y: comp.y + step * (idx + 1) };
  }
  const oidx = comp.outputs.indexOf(pin);
  if (oidx >= 0) {
    const step = COMP_H / (comp.outputs.length + 1);
    return { x: comp.x + COMP_W, y: comp.y + step * (oidx + 1) };
  }
  return { x: comp.x, y: comp.y };
}

// ── Renderizador de componente ──
function CompNode({ comp, selected, onMouseDown, onPinClick, onToggle }) {
  const isInput = comp instanceof InputSwitch;
  const isOutput = comp instanceof OutputProbe;
  const isClock = comp instanceof Clock;
  const isGate = comp instanceof Gate;

  const selectedColor = '#0ea5e9';

  return (
    <g
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, comp.id); }}
      style={{ cursor: 'grab' }}
    >
      {/* Fundo do componente */}
      {isInput ? (
        <InputBody comp={comp} selected={selected} onToggle={onToggle} />
      ) : isOutput ? (
        <OutputBody comp={comp} selected={selected} />
      ) : isClock ? (
        <ClockBody comp={comp} selected={selected} />
      ) : (
        <GateBody comp={comp} selected={selected} />
      )}

      {/* Pinos de entrada */}
      {comp.inputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <g key={pin.id}>
            <line
              x1={pos.x}
              y1={pos.y}
              x2={pos.x + 8}
              y2={pos.y}
              stroke="#1f2937"
              strokeWidth="1.5"
            />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={PIN_R + 3}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onClick={(e) => { e.stopPropagation(); onPinClick(pin.id); }}
            />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={PIN_R}
              fill={pin.value ? '#0ea5e9' : '#fff'}
              stroke="#1f2937"
              strokeWidth="1.5"
              style={{ cursor: 'crosshair', transition: 'fill .12s' }}
              onClick={(e) => { e.stopPropagation(); onPinClick(pin.id); }}
            />
          </g>
        );
      })}

      {/* Pinos de saída */}
      {comp.outputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <g key={pin.id}>
            <line
              x1={pos.x}
              y1={pos.y}
              x2={pos.x - 8}
              y2={pos.y}
              stroke="#1f2937"
              strokeWidth="1.5"
            />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={PIN_R + 3}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onClick={(e) => { e.stopPropagation(); onPinClick(pin.id); }}
            />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={PIN_R}
              fill={pin.value ? '#0ea5e9' : '#fff'}
              stroke="#1f2937"
              strokeWidth="1.5"
              style={{ cursor: 'crosshair', transition: 'fill .12s' }}
              onClick={(e) => { e.stopPropagation(); onPinClick(pin.id); }}
            />
          </g>
        );
      })}

      {/* Outline de seleção */}
      {selected && (
        <rect
          x={comp.x - 6}
          y={comp.y - 6}
          width={COMP_W + 12}
          height={COMP_H + 12}
          rx={6}
          fill="none"
          stroke={selectedColor}
          strokeWidth="1.5"
          strokeDasharray="4,3"
          pointerEvents="none"
        />
      )}
    </g>
  );
}

function GateBody({ comp, selected }) {
  const Symbol = GATE_SYMBOL_MAP[comp.type];
  const cx = comp.x + COMP_W / 2;
  const cy = comp.y + COMP_H / 2;
  return (
    <>
      {/* Símbolo gráfico da porta dentro de um foreignObject seria mais simples,
          mas para máxima compatibilidade desenhamos diretamente em SVG via <g> com transform */}
      <g transform={`translate(${comp.x + 8}, ${comp.y + 8})`}>
        {Symbol && <Symbol width={80} height={40} />}
      </g>
      {/* Label do tipo abaixo */}
      <text
        x={cx}
        y={comp.y + COMP_H + 12}
        textAnchor="middle"
        fill="#475569"
        fontSize="10"
        fontWeight="600"
        fontFamily="'JetBrains Mono', monospace"
      >
        {comp.type}
      </text>
    </>
  );
}

function InputBody({ comp, selected, onToggle }) {
  const w = COMP_W;
  const h = COMP_H;
  return (
    <>
      <rect
        x={comp.x}
        y={comp.y}
        width={w}
        height={h}
        rx={4}
        fill="#fafafa"
        stroke="#1f2937"
        strokeWidth="1.5"
      />
      {/* Toggle visual */}
      <rect
        x={comp.x + 14}
        y={comp.y + h / 2 - 12}
        width={44}
        height={24}
        rx={12}
        fill={comp.state ? '#0ea5e9' : '#cbd5e1'}
        style={{ cursor: 'pointer', transition: 'fill .15s' }}
        onClick={(e) => { e.stopPropagation(); onToggle(comp.id); }}
      />
      <circle
        cx={comp.state ? comp.x + 46 : comp.x + 26}
        cy={comp.y + h / 2}
        r={9}
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="1.2"
        style={{ pointerEvents: 'none' }}
      />
      <text
        x={comp.x + 78}
        y={comp.y + h / 2 + 4}
        fill="#1f2937"
        fontSize="11"
        fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        textAnchor="middle"
      >
        {comp.state ? '1' : '0'}
      </text>
      <text
        x={comp.x + w / 2}
        y={comp.y + h + 12}
        textAnchor="middle"
        fill="#475569"
        fontSize="10"
        fontFamily="'JetBrains Mono', monospace"
      >
        {comp.label}
      </text>
    </>
  );
}

function OutputBody({ comp }) {
  const w = COMP_W;
  const h = COMP_H;
  const on = comp.value;
  return (
    <>
      <rect
        x={comp.x}
        y={comp.y}
        width={w}
        height={h}
        rx={4}
        fill="#fafafa"
        stroke="#1f2937"
        strokeWidth="1.5"
      />
      {/* Lâmpada */}
      <g transform={`translate(${comp.x + w / 2 - 18}, ${comp.y + 4})`}>
        <circle
          cx="18"
          cy="20"
          r="14"
          fill={on ? '#fde047' : '#f3f4f6'}
          stroke="#1f2937"
          strokeWidth="1.5"
          style={{ transition: 'fill .15s' }}
        />
        {on && (
          <>
            <line x1="18" y1="0" x2="18" y2="3" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="34" y1="9" x2="32" y2="11" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="2" y1="9" x2="4" y2="11" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
        <line x1="12" y1="35" x2="24" y2="35" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="13" y1="38" x2="23" y2="38" stroke="#1f2937" strokeWidth="1.5" />
      </g>
      <text
        x={comp.x + w / 2}
        y={comp.y + h + 12}
        textAnchor="middle"
        fill="#475569"
        fontSize="10"
        fontFamily="'JetBrains Mono', monospace"
      >
        {comp.label}
      </text>
    </>
  );
}

function ClockBody({ comp }) {
  const w = COMP_W;
  const h = COMP_H;
  return (
    <>
      <rect
        x={comp.x}
        y={comp.y}
        width={w}
        height={h}
        rx={4}
        fill="#fafafa"
        stroke="#1f2937"
        strokeWidth="1.5"
      />
      {/* Onda quadrada */}
      <polyline
        points={
          `${comp.x + 12},${comp.y + h - 14} ` +
          `${comp.x + 22},${comp.y + h - 14} ` +
          `${comp.x + 22},${comp.y + 14} ` +
          `${comp.x + 42},${comp.y + 14} ` +
          `${comp.x + 42},${comp.y + h - 14} ` +
          `${comp.x + 62},${comp.y + h - 14} ` +
          `${comp.x + 62},${comp.y + 14} ` +
          `${comp.x + 82},${comp.y + 14}`
        }
        fill="none"
        stroke={comp.state ? '#0ea5e9' : '#1f2937'}
        strokeWidth="2"
      />
      <text
        x={comp.x + w / 2}
        y={comp.y + h + 12}
        textAnchor="middle"
        fill="#475569"
        fontSize="10"
        fontFamily="'JetBrains Mono', monospace"
      >
        CLK
      </text>
    </>
  );
}

// ── Renderizador de fio ──
function WirePath({ wire }) {
  const fromPos = getPinPos(wire.from.owner, wire.from);
  const toPos = getPinPos(wire.to.owner, wire.to);
  const dx = Math.max(20, (toPos.x - fromPos.x) * 0.5);
  const path = `M${fromPos.x},${fromPos.y} C${fromPos.x + dx},${fromPos.y} ${toPos.x - dx},${toPos.y} ${toPos.x},${toPos.y}`;
  const color = wire.from.value ? '#0ea5e9' : '#475569';
  return (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ transition: 'stroke .15s' }}
    />
  );
}

// ── Canvas principal ──
export default function Canvas({
  components,
  wires,
  selectedId,
  wiringFrom,
  mousePos,
  onMouseMove,
  onMouseUp,
  onClick,
  onCompMouseDown,
  onPinClick,
  onToggle,
  onDrop,
  svgRef,
}) {
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/x-component-type')
              || e.dataTransfer.getData('text/plain');
    if (!type) return;
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM().inverse();
    const p = pt.matrixTransform(ctm);
    onDrop(type, p.x - COMP_W / 2, p.y - COMP_H / 2);
  }, [onDrop, svgRef]);

  // Render preview de wiring
  const wiringPreview = (() => {
    if (!wiringFrom) return null;
    let pin = null;
    for (const c of components) {
      for (const p of [...c.inputs, ...c.outputs]) {
        if (p.id === wiringFrom) { pin = p; break; }
      }
      if (pin) break;
    }
    if (!pin) return null;
    const pos = getPinPos(pin.owner, pin);
    return (
      <line
        x1={pos.x}
        y1={pos.y}
        x2={mousePos.x}
        y2={mousePos.y}
        stroke="#0ea5e9"
        strokeWidth="2"
        strokeDasharray="5,3"
        opacity="0.7"
      />
    );
  })();

  return (
    <div
      className="canvas-wrapper"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <svg
        ref={svgRef}
        className="canvas-svg"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onClick={onClick}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <defs>
          <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.7" fill="#cbd5e1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#f1f5f9" />
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        {/* Wires */}
        {wires.map(w => <WirePath key={w.id} wire={w} />)}

        {/* Wiring preview */}
        {wiringPreview}

        {/* Components */}
        {components.map(c => (
          <CompNode
            key={c.id}
            comp={c}
            selected={c.id === selectedId}
            onMouseDown={onCompMouseDown}
            onPinClick={onPinClick}
            onToggle={onToggle}
          />
        ))}

        {/* Empty hint */}
        {components.length === 0 && (
          <g>
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="14"
              fontFamily="'Inter', sans-serif"
              fontWeight="500"
            >
              Arraste componentes da barra lateral para começar
            </text>
            <text
              x="50%"
              y="53%"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="11"
              fontFamily="'Inter', sans-serif"
            >
              ou carregue um preset na barra de ferramentas
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
