import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  InputSwitch, OutputProbe, Clock, Gate,
  PushButton, HighConstant, LowConstant, PullUp, PullDown,
  FourBitDigit, TriStateBuffer,
  SRFlipFlop, DFlipFlop, JKFlipFlop, TFlipFlop,
  Label as LabelComp,
  asBool,
} from '../engine/components.js';
import {
  ANDSymbol, ORSymbol, NOTSymbol, NANDSymbol, NORSymbol,
  XORSymbol, XNORSymbol, BufferSymbol,
} from './GateSymbols.jsx';

// ── Dimensões padrão e por tipo ──
export const COMP_W = 96;
export const COMP_H = 56;
export const PIN_R = 5;

// Retorna { w, h } de acordo com o tipo do componente
export function getCompSize(comp) {
  if (comp instanceof FourBitDigit) return { w: 88, h: 88 };
  if (comp instanceof SRFlipFlop || comp instanceof JKFlipFlop) return { w: 88, h: 76 };
  if (comp instanceof DFlipFlop || comp instanceof TFlipFlop) return { w: 88, h: 64 };
  if (comp instanceof TriStateBuffer) return { w: 96, h: 64 };
  if (comp instanceof PullUp || comp instanceof PullDown) return { w: 56, h: 76 };
  if (comp instanceof HighConstant || comp instanceof LowConstant) return { w: 72, h: 44 };
  if (comp instanceof LabelComp) return { w: comp.width, h: comp.height };
  return { w: COMP_W, h: COMP_H };
}

const GATE_SYMBOL_MAP = {
  AND: ANDSymbol, OR: ORSymbol, NOT: NOTSymbol,
  NAND: NANDSymbol, NOR: NORSymbol, XOR: XORSymbol, XNOR: XNORSymbol,
  BUFFER: BufferSymbol,
};

// ── Posição de pinos ──
// Posições especiais para componentes com layout não-padrão.
export function getPinPos(comp, pin) {
  const { w, h } = getCompSize(comp);

  // Tri-state: data à esquerda, enable em cima, output à direita
  if (comp instanceof TriStateBuffer) {
    if (pin === comp.inputs[0]) return { x: comp.x, y: comp.y + h / 2 };
    if (pin === comp.inputs[1]) return { x: comp.x + w / 2, y: comp.y };
    return { x: comp.x + w, y: comp.y + h / 2 };
  }

  // Default
  const idx = comp.inputs.indexOf(pin);
  if (idx >= 0) {
    const step = h / (comp.inputs.length + 1);
    return { x: comp.x, y: comp.y + step * (idx + 1) };
  }
  const oidx = comp.outputs.indexOf(pin);
  if (oidx >= 0) {
    const step = h / (comp.outputs.length + 1);
    return { x: comp.x + w, y: comp.y + step * (oidx + 1) };
  }
  return { x: comp.x, y: comp.y };
}

// ════════════════════════════════════════════════════════════
//  CompNode: roteia para o body certo + desenha pinos
// ════════════════════════════════════════════════════════════

function CompNode({
  comp, selected, onMouseDown, onPinClick, onToggle,
  onPress, onRelease, onLabelEdit,
}) {
  const { w, h } = getCompSize(comp);

  return (
    <g
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, comp.id); }}
      style={{ cursor: comp instanceof LabelComp ? 'move' : 'grab' }}
      data-comp="true"
    >
      {/* Body por tipo */}
      {comp instanceof InputSwitch ? <InputBody comp={comp} onToggle={onToggle} />
        : comp instanceof PushButton ? <PushButtonBody comp={comp} onPress={onPress} onRelease={onRelease} />
        : comp instanceof HighConstant ? <ConstantBody comp={comp} value="1" />
        : comp instanceof LowConstant ? <ConstantBody comp={comp} value="0" />
        : comp instanceof PullUp ? <PullBody comp={comp} kind="up" />
        : comp instanceof PullDown ? <PullBody comp={comp} kind="down" />
        : comp instanceof Clock ? <ClockBody comp={comp} />
        : comp instanceof OutputProbe ? <OutputBody comp={comp} />
        : comp instanceof FourBitDigit ? <DigitBody comp={comp} />
        : comp instanceof TriStateBuffer ? <TriStateBody comp={comp} />
        : comp instanceof SRFlipFlop ? <FFBody comp={comp} title="SR" leftLabels={['S','R']} />
        : comp instanceof DFlipFlop ? <FFBody comp={comp} title="D" leftLabels={['D']} />
        : comp instanceof JKFlipFlop ? <FFBody comp={comp} title="JK" leftLabels={['J','K']} />
        : comp instanceof TFlipFlop ? <FFBody comp={comp} title="T" leftLabels={['T']} />
        : comp instanceof LabelComp ? <LabelBody comp={comp} onEdit={onLabelEdit} selected={selected} />
        : comp instanceof Gate ? <GateBody comp={comp} />
        : null
      }

      {/* Pinos genéricos (Label não tem) */}
      {!(comp instanceof LabelComp) && (
        <>
          {comp.inputs.map((pin) => <PinDot key={pin.id} pin={pin} comp={comp} side="in" onPinClick={onPinClick} />)}
          {comp.outputs.map((pin) => <PinDot key={pin.id} pin={pin} comp={comp} side="out" onPinClick={onPinClick} />)}
        </>
      )}

      {/* Outline de seleção */}
      {selected && (
        <rect
          x={comp.x - 6} y={comp.y - 6}
          width={w + 12} height={h + 12}
          rx={6}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="4,3"
          pointerEvents="none"
        />
      )}
    </g>
  );
}

// ── Pino genérico ──
function PinDot({ pin, comp, side, onPinClick }) {
  const pos = getPinPos(comp, pin);
  const isInput = side === 'in';

  // Determinar direção do stub baseado em onde o pino está
  const { w } = getCompSize(comp);
  let dx = 0, dy = 0;
  if (Math.abs(pos.x - comp.x) < 2) { dx = 8; }              // pino à esquerda
  else if (Math.abs(pos.x - (comp.x + w)) < 2) { dx = -8; }  // pino à direita
  else if (pos.y < comp.y + 4) { dy = 8; }                   // pino em cima
  else { dy = -8; }                                          // pino embaixo

  // Cor: HIGH-Z = roxo claro, true = accent, false = comp-fill
  let fill;
  if (pin.value === null || pin.value === undefined) {
    fill = '#a78bfa'; // HIGH-Z
  } else if (pin.value) {
    fill = 'var(--accent)';
  } else {
    fill = 'var(--comp-fill)';
  }

  return (
    <g>
      <line x1={pos.x} y1={pos.y} x2={pos.x + dx} y2={pos.y + dy} stroke="var(--comp-stroke)" strokeWidth="1.5" />
      <circle
        cx={pos.x} cy={pos.y} r={PIN_R + 3}
        fill="transparent"
        style={{ cursor: 'crosshair' }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onPinClick(pin.id); }}
      />
      <circle
        cx={pos.x} cy={pos.y} r={PIN_R}
        fill={fill}
        stroke="var(--comp-stroke)" strokeWidth="1.5"
        style={{ cursor: 'crosshair', transition: 'fill .12s' }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onPinClick(pin.id); }}
      />
    </g>
  );
}

// ════════════════════════════════════════════════════════════
//  Bodies (um por tipo de componente)
// ════════════════════════════════════════════════════════════

function GateBody({ comp }) {
  const Sym = GATE_SYMBOL_MAP[comp.type];
  const { w, h } = getCompSize(comp);
  const cx = comp.x + w / 2;
  return (
    <>
      <g transform={`translate(${comp.x + 8}, ${comp.y + 6})`}>
        {Sym && <Sym width={80} height={44} />}
      </g>
      <text x={cx} y={comp.y + h + 12} textAnchor="middle"
        fill="var(--canvas-text-dim)" fontSize="10" fontWeight="600"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        {comp.type}
      </text>
    </>
  );
}

function InputBody({ comp, onToggle }) {
  const { w, h } = getCompSize(comp);
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.5" />
      <rect
        x={comp.x + 14} y={comp.y + h / 2 - 12}
        width={44} height={24} rx={12}
        fill={comp.state ? 'var(--accent)' : 'var(--comp-toggle-off)'}
        style={{ cursor: 'pointer', transition: 'fill .15s' }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onToggle(comp.id); }}
      />
      <circle cx={comp.state ? comp.x + 46 : comp.x + 26} cy={comp.y + h / 2}
        r={9} fill="#fff" stroke="var(--comp-stroke)" strokeWidth="1.2"
        style={{ pointerEvents: 'none' }} />
      <text x={comp.x + 78} y={comp.y + h / 2 + 4}
        fill="var(--canvas-text)" fontSize="11" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace" textAnchor="middle"
        style={{ pointerEvents: 'none' }}>
        {comp.state ? '1' : '0'}
      </text>
    </>
  );
}

function PushButtonBody({ comp, onPress, onRelease }) {
  const { w, h } = getCompSize(comp);
  const cx = comp.x + w / 2;
  const cy = comp.y + h / 2;
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.5" />
      <circle
        cx={cx} cy={cy} r="14"
        fill={comp.state ? 'var(--accent)' : '#dc2626'}
        stroke="var(--comp-stroke)" strokeWidth="1.8"
        style={{ cursor: 'pointer', transition: 'fill .1s' }}
        onMouseDown={(e) => { e.stopPropagation(); onPress(comp.id); }}
        onMouseUp={(e) => { e.stopPropagation(); onRelease(comp.id); }}
        onMouseLeave={(e) => { onRelease(comp.id); }}
      />
      <circle cx={cx} cy={cy} r="7"
        fill={comp.state ? '#fff' : '#fca5a5'}
        stroke="var(--comp-stroke)" strokeWidth="1"
        style={{ pointerEvents: 'none' }} />
      <text x={comp.x + w / 2} y={comp.y + h + 12}
        textAnchor="middle" fill="var(--canvas-text-dim)" fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        BUTTON
      </text>
    </>
  );
}

function ConstantBody({ comp, value }) {
  const { w, h } = getCompSize(comp);
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w - 12} height={h} rx={3}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.8" />
      <text x={comp.x + (w - 12) / 2} y={comp.y + h / 2 + 6}
        textAnchor="middle" fill="var(--canvas-text)"
        fontSize="22" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        {value}
      </text>
    </>
  );
}

function PullBody({ comp, kind }) {
  const { w, h } = getCompSize(comp);
  const cx = comp.x + w / 2;
  const isUp = kind === 'up';
  return (
    <>
      {isUp ? (
        <>
          {/* Símbolo "+" ou Vcc no topo */}
          <line x1={cx - 5} y1={comp.y + 4} x2={cx + 5} y2={comp.y + 4} stroke="var(--comp-stroke)" strokeWidth="1.8" />
          <line x1={cx - 7} y1={comp.y + 8} x2={cx + 7} y2={comp.y + 8} stroke="var(--comp-stroke)" strokeWidth="1.8" />
          <line x1={cx} y1={comp.y + 8} x2={cx} y2={comp.y + 18} stroke="var(--comp-stroke)" strokeWidth="1.5" />
          {/* Resistor zigzag */}
          <polyline
            points={`${cx},${comp.y + 18} ${cx - 6},${comp.y + 22} ${cx + 6},${comp.y + 28} ${cx - 6},${comp.y + 34} ${cx + 6},${comp.y + 40} ${cx},${comp.y + 44}`}
            fill="none" stroke="var(--comp-stroke)" strokeWidth="1.5" strokeLinejoin="round"
          />
          <line x1={cx} y1={comp.y + 44} x2={cx} y2={comp.y + h / 2 + 12} stroke="var(--comp-stroke)" strokeWidth="1.5" />
        </>
      ) : (
        <>
          <line x1={cx} y1={comp.y + h / 2 - 12} x2={cx} y2={comp.y + 18} stroke="var(--comp-stroke)" strokeWidth="1.5" />
          <polyline
            points={`${cx},${comp.y + 18} ${cx - 6},${comp.y + 22} ${cx + 6},${comp.y + 28} ${cx - 6},${comp.y + 34} ${cx + 6},${comp.y + 40} ${cx},${comp.y + 44}`}
            fill="none" stroke="var(--comp-stroke)" strokeWidth="1.5" strokeLinejoin="round"
          />
          <line x1={cx} y1={comp.y + 44} x2={cx} y2={comp.y + 50} stroke="var(--comp-stroke)" strokeWidth="1.5" />
          {/* GND symbol */}
          <line x1={cx - 8} y1={comp.y + 50} x2={cx + 8} y2={comp.y + 50} stroke="var(--comp-stroke)" strokeWidth="2" />
          <line x1={cx - 5} y1={comp.y + 54} x2={cx + 5} y2={comp.y + 54} stroke="var(--comp-stroke)" strokeWidth="2" />
          <line x1={cx - 2} y1={comp.y + 58} x2={cx + 2} y2={comp.y + 58} stroke="var(--comp-stroke)" strokeWidth="2" />
        </>
      )}
      <text x={cx} y={comp.y + h + 12}
        textAnchor="middle" fill="var(--canvas-text-dim)"
        fontSize="9" fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        {isUp ? 'PULL UP' : 'PULL DN'}
      </text>
    </>
  );
}

function ClockBody({ comp }) {
  const { w, h } = getCompSize(comp);
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.5" />
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
        fill="none" stroke={comp.state ? 'var(--accent)' : 'var(--comp-stroke)'}
        strokeWidth="2" style={{ pointerEvents: 'none' }} />
      <text x={comp.x + w / 2} y={comp.y + h + 12}
        textAnchor="middle" fill="var(--canvas-text-dim)" fontSize="10"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        CLK
      </text>
    </>
  );
}

function OutputBody({ comp }) {
  const { w, h } = getCompSize(comp);
  const on = comp.value;
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.5" />
      <g transform={`translate(${comp.x + w / 2 - 18}, ${comp.y + 4})`} style={{ pointerEvents: 'none' }}>
        <circle cx="18" cy="20" r="14"
          fill={on ? '#fde047' : 'var(--comp-fill)'}
          stroke="var(--comp-stroke)" strokeWidth="1.5"
          style={{ transition: 'fill .15s' }} />
        {on && (
          <>
            <line x1="18" y1="0" x2="18" y2="3" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="34" y1="9" x2="32" y2="11" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="2" y1="9" x2="4" y2="11" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
        <line x1="12" y1="35" x2="24" y2="35" stroke="var(--comp-stroke)" strokeWidth="1.5" />
        <line x1="13" y1="38" x2="23" y2="38" stroke="var(--comp-stroke)" strokeWidth="1.5" />
      </g>
    </>
  );
}

function DigitBody({ comp }) {
  const { w, h } = getCompSize(comp);
  const hex = comp.hex;
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.5" />
      {/* Display interno preto */}
      <rect x={comp.x + 14} y={comp.y + 12} width={w - 28} height={h - 24} rx={3}
        fill="#0f172a" stroke="var(--comp-stroke)" strokeWidth="1" />
      <text x={comp.x + w / 2} y={comp.y + h / 2 + 12}
        textAnchor="middle" fill="#fde047"
        fontSize="32" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        {hex}
      </text>
      {/* Labels D3..D0 ao lado dos pinos */}
      {comp.inputs.map((pin, i) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x + 12} y={pos.y + 3}
            fill="var(--canvas-text-dim)" fontSize="8"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>
            {pin.name}
          </text>
        );
      })}
    </>
  );
}

function TriStateBody({ comp }) {
  const { w, h } = getCompSize(comp);
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.5" />
      {/* Triângulo */}
      <path
        d={`M ${comp.x + 14} ${comp.y + 14} L ${comp.x + 14} ${comp.y + h - 14} L ${comp.x + w - 14} ${comp.y + h / 2} Z`}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.8" strokeLinejoin="round"
      />
      {/* Linha do enable até o triângulo */}
      <line x1={comp.x + w / 2} y1={comp.y} x2={comp.x + w / 2} y2={comp.y + 18}
        stroke="var(--comp-stroke)" strokeWidth="1.5" />
      <text x={comp.x + w / 2 + 3} y={comp.y + 12}
        fill="var(--canvas-text-dim)" fontSize="8"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        E
      </text>
      <text x={comp.x + w / 2} y={comp.y + h + 12}
        textAnchor="middle" fill="var(--canvas-text-dim)" fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        TRI-STATE
      </text>
    </>
  );
}

function FFBody({ comp, title, leftLabels }) {
  const { w, h } = getCompSize(comp);
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={3}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.8" />
      {/* Title */}
      <text x={comp.x + w / 2} y={comp.y + 14}
        textAnchor="middle" fill="var(--canvas-text)"
        fontSize="11" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        {title} FF
      </text>
      {/* Labels dos pinos de entrada */}
      {comp.inputs.map((pin, i) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x + 10} y={pos.y + 3}
            fill="var(--canvas-text-dim)" fontSize="9"
            fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>
            {pin.name}
          </text>
        );
      })}
      {/* Labels dos outputs */}
      {comp.outputs.map((pin, i) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x - 10} y={pos.y + 3}
            textAnchor="end" fill="var(--canvas-text-dim)" fontSize="9"
            fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>
            {pin.name}
          </text>
        );
      })}
      {/* Triângulo de clock no último input */}
      {(() => {
        const clkPin = comp.inputs[comp.inputs.length - 1];
        if (clkPin && clkPin.name === 'CLK') {
          const pos = getPinPos(comp, clkPin);
          return (
            <path
              d={`M ${pos.x + 6} ${pos.y - 4} L ${pos.x + 12} ${pos.y} L ${pos.x + 6} ${pos.y + 4}`}
              fill="none" stroke="var(--comp-stroke)" strokeWidth="1.4"
              style={{ pointerEvents: 'none' }}
            />
          );
        }
        return null;
      })()}
    </>
  );
}

function LabelBody({ comp, onEdit, selected }) {
  const { w, h } = getCompSize(comp);
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={3}
        fill="var(--comp-fill)"
        stroke={selected ? 'var(--accent)' : 'transparent'}
        strokeWidth={selected ? '1.5' : '0'}
        strokeDasharray={selected ? '3,2' : ''}
      />
      <text
        x={comp.x + w / 2} y={comp.y + h / 2 + 5}
        textAnchor="middle" fill="var(--canvas-text)"
        fontSize="13" fontWeight="500"
        fontFamily="'Inter', sans-serif"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
        onDoubleClick={(e) => { e.stopPropagation(); onEdit(comp.id); }}
      >
        {comp.text}
      </text>
      {/* Hot zone para duplo clique */}
      <rect
        x={comp.x} y={comp.y} width={w} height={h}
        fill="transparent"
        onDoubleClick={(e) => { e.stopPropagation(); onEdit(comp.id); }}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════
//  Wire (com cor diferente para HIGH-Z)
// ════════════════════════════════════════════════════════════

function WirePath({ wire }) {
  const fromPos = getPinPos(wire.from.owner, wire.from);
  const toPos = getPinPos(wire.to.owner, wire.to);
  const dx = Math.max(20, (toPos.x - fromPos.x) * 0.5);
  const path = `M${fromPos.x},${fromPos.y} C${fromPos.x + dx},${fromPos.y} ${toPos.x - dx},${toPos.y} ${toPos.x},${toPos.y}`;
  const v = wire.from.value;
  let color;
  if (v === null || v === undefined) color = '#a78bfa'; // HIGH-Z
  else if (v) color = 'var(--accent)';
  else color = 'var(--wire-off)';
  return (
    <path d={path} fill="none" stroke={color} strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray={v === null ? '5,3' : ''}
      style={{ transition: 'stroke .15s' }} />
  );
}

// ════════════════════════════════════════════════════════════
//  Editor de Label (HTML overlay)
// ════════════════════════════════════════════════════════════

function LabelEditor({ comp, svgRef, onCommit, onCancel }) {
  const [text, setText] = useState(comp.text);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Calcula posição em pixels da tela a partir das coordenadas SVG
  const svg = svgRef.current;
  if (!svg) return null;
  const ctm = svg.getScreenCTM();
  const wrapperRect = svg.parentElement.getBoundingClientRect();

  const { w, h } = getCompSize(comp);
  const pt = svg.createSVGPoint();
  pt.x = comp.x;
  pt.y = comp.y;
  const screenPt = pt.matrixTransform(ctm);

  // Calcular escala
  const ptR = svg.createSVGPoint();
  ptR.x = comp.x + w;
  ptR.y = comp.y + h;
  const screenPtR = ptR.matrixTransform(ctm);
  const screenW = screenPtR.x - screenPt.x;
  const screenH = screenPtR.y - screenPt.y;

  const left = screenPt.x - wrapperRect.left;
  const top = screenPt.y - wrapperRect.top;

  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') onCommit(comp.id, text);
        else if (e.key === 'Escape') onCancel();
      }}
      onBlur={() => onCommit(comp.id, text)}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${Math.max(80, screenW)}px`,
        height: `${Math.max(28, screenH)}px`,
        fontSize: '13px',
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        textAlign: 'center',
        border: '1.5px solid var(--accent)',
        borderRadius: '3px',
        background: 'var(--comp-fill)',
        color: 'var(--canvas-text)',
        outline: 'none',
        padding: '2px 6px',
        zIndex: 10,
      }}
    />
  );
}

// ════════════════════════════════════════════════════════════
//  Canvas principal
// ════════════════════════════════════════════════════════════

export default function Canvas({
  components, wires, selectedIds, wiringFrom, mousePos, marquee,
  editingLabelId,
  onMouseMove, onMouseUp, onMouseDown,
  onCompMouseDown, onPinClick, onToggle,
  onPress, onRelease,
  onLabelEdit, onLabelCommit, onLabelCancel,
  onDrop, svgRef,
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
    onDrop(type, p.x - 48, p.y - 28);
  }, [onDrop, svgRef]);

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
      <line x1={pos.x} y1={pos.y} x2={mousePos.x} y2={mousePos.y}
        stroke="var(--accent)" strokeWidth="2"
        strokeDasharray="5,3" opacity="0.7" />
    );
  })();

  const marqueeRect = (() => {
    if (!marquee) return null;
    const x = Math.min(marquee.x0, marquee.x1);
    const y = Math.min(marquee.y0, marquee.y1);
    const w = Math.abs(marquee.x1 - marquee.x0);
    const h = Math.abs(marquee.y1 - marquee.y0);
    return (
      <rect x={x} y={y} width={w} height={h}
        fill="var(--accent)" fillOpacity="0.1"
        stroke="var(--accent)" strokeWidth="1"
        strokeDasharray="4,3" pointerEvents="none" />
    );
  })();

  const editingComp = editingLabelId ? components.find(c => c.id === editingLabelId) : null;

  return (
    <div className="canvas-wrapper" onDragOver={handleDragOver} onDrop={handleDrop}>
      <svg
        ref={svgRef}
        className="canvas-svg"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseDown={onMouseDown}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <defs>
          <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.7" fill="var(--grid-dot)" />
          </pattern>
        </defs>
        <rect data-bg="true" width="100%" height="100%" fill="var(--canvas-bg)" />
        <rect data-bg="true" width="100%" height="100%" fill="url(#grid-pattern)" />

        {wires.map(w => <WirePath key={w.id} wire={w} />)}
        {wiringPreview}

        {components.map(c => (
          <CompNode
            key={c.id}
            comp={c}
            selected={selectedIds.has(c.id)}
            onMouseDown={onCompMouseDown}
            onPinClick={onPinClick}
            onToggle={onToggle}
            onPress={onPress}
            onRelease={onRelease}
            onLabelEdit={onLabelEdit}
          />
        ))}

        {marqueeRect}

        {components.length === 0 && (
          <g style={{ pointerEvents: 'none' }}>
            <text x="50%" y="48%" textAnchor="middle"
              fill="var(--canvas-text-dim)" fontSize="14"
              fontFamily="'Inter', sans-serif" fontWeight="500">
              Drag components from the sidebar to start
            </text>
            <text x="50%" y="53%" textAnchor="middle"
              fill="var(--canvas-text-mute)" fontSize="11"
              fontFamily="'Inter', sans-serif">
              or load a preset from the toolbar
            </text>
          </g>
        )}
      </svg>

      {/* Editor de Label flutuante */}
      {editingComp && (
        <LabelEditor
          comp={editingComp}
          svgRef={svgRef}
          onCommit={onLabelCommit}
          onCancel={onLabelCancel}
        />
      )}
    </div>
  );
}
