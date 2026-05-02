import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  InputSwitch, OutputProbe, Clock, Gate,
  PushButton, HighConstant, LowConstant, PullUp, PullDown,
  FourBitDigit, TriStateBuffer,
  SRFlipFlop, DFlipFlop, JKFlipFlop, TFlipFlop,
  Mux2, Demux2, FullAdder, Register4,
  SchmittTrigger, Comparator4, BCDDecoder, SevenSegmentDisplay,
  LedMatrix8x8, ROM16x8,
  Label as LabelComp,
  asBool, EXPANDABLE_GATES,
} from '../engine/components.js';
import {
  ANDSymbol, ORSymbol, NOTSymbol, NANDSymbol, NORSymbol,
  XORSymbol, XNORSymbol, BufferSymbol,
} from './GateSymbols.jsx';

// ── Dimensões padrão e por tipo ──
export const COMP_W = 96;
export const COMP_H = 56;
export const PIN_R = 5;

// Retorna { w, h } do componente
// Para Gates expansíveis: cada input precisa de ~14px de altura para ficar legível.
// O símbolo ocupa altura fixa (44px) centrado verticalmente; os pinos extras
// "esticam" o componente na vertical, com stubs horizontais visíveis.
export const GATE_PIN_SPACING = 14;
export const GATE_BASE_H = 56;
export const GATE_SYMBOL_H = 44;

export function getCompSize(comp) {
  if (comp instanceof FourBitDigit) return { w: 88, h: 88 };
  if (comp instanceof Register4) return { w: 120, h: 144 };
  if (comp instanceof FullAdder) return { w: 110, h: 88 };
  if (comp instanceof Mux2) return { w: 96, h: 88 };
  if (comp instanceof Demux2) return { w: 96, h: 88 };
  if (comp instanceof SRFlipFlop || comp instanceof JKFlipFlop) return { w: 88, h: 76 };
  if (comp instanceof DFlipFlop || comp instanceof TFlipFlop) return { w: 88, h: 64 };
  if (comp instanceof TriStateBuffer) return { w: 96, h: 64 };
  if (comp instanceof PullUp || comp instanceof PullDown) return { w: 56, h: 76 };
  if (comp instanceof HighConstant || comp instanceof LowConstant) return { w: 72, h: 44 };
  // V9
  if (comp instanceof SchmittTrigger) return { w: 72, h: 48 };
  if (comp instanceof Comparator4) return { w: 120, h: 168 };
  if (comp instanceof BCDDecoder) return { w: 110, h: 168 };
  if (comp instanceof SevenSegmentDisplay) return { w: 90, h: 130 };
  if (comp instanceof LedMatrix8x8) return { w: 200, h: 200 };
  if (comp instanceof ROM16x8) return { w: 130, h: 168 };
  if (comp instanceof LabelComp) return { w: comp.width, h: comp.height };
  // Gate expansível: altura proporcional ao inputCount
  if (comp instanceof Gate && EXPANDABLE_GATES.has(comp.type) && comp.inputCount > 2) {
    const minH = GATE_BASE_H;
    const computed = comp.inputCount * GATE_PIN_SPACING + 16;
    return { w: COMP_W, h: Math.max(minH, computed) };
  }
  return { w: COMP_W, h: COMP_H };
}

const GATE_SYMBOL_MAP = {
  AND: ANDSymbol, OR: ORSymbol, NOT: NOTSymbol,
  NAND: NANDSymbol, NOR: NORSymbol, XOR: XORSymbol, XNOR: XNORSymbol,
  BUFFER: BufferSymbol,
};

// ── Posição de pinos ──
export function getPinPos(comp, pin) {
  const { w, h } = getCompSize(comp);

  // Tri-state: data à esquerda, enable em cima, output à direita
  if (comp instanceof TriStateBuffer) {
    if (pin === comp.inputs[0]) return { x: comp.x, y: comp.y + h / 2 };
    if (pin === comp.inputs[1]) return { x: comp.x + w / 2, y: comp.y };
    return { x: comp.x + w, y: comp.y + h / 2 };
  }

  // MUX 2:1 — A em cima-esquerda, B embaixo-esquerda, S embaixo-meio, Q direita-meio
  if (comp instanceof Mux2) {
    if (pin === comp.inputs[0]) return { x: comp.x, y: comp.y + h * 0.30 };
    if (pin === comp.inputs[1]) return { x: comp.x, y: comp.y + h * 0.62 };
    if (pin === comp.inputs[2]) return { x: comp.x + w / 2, y: comp.y + h };
    return { x: comp.x + w, y: comp.y + h / 2 };
  }

  // DEMUX 1:2
  if (comp instanceof Demux2) {
    if (pin === comp.inputs[0]) return { x: comp.x, y: comp.y + h / 2 };
    if (pin === comp.inputs[1]) return { x: comp.x + w / 2, y: comp.y + h };
    if (pin === comp.outputs[0]) return { x: comp.x + w, y: comp.y + h * 0.30 };
    return { x: comp.x + w, y: comp.y + h * 0.62 };
  }

  // LED Matrix: X0..X2 esquerda-topo, Y0..Y2 esquerda-meio, D/CLK/CLR esquerda-fundo
  if (comp instanceof LedMatrix8x8) {
    const idx = comp.inputs.indexOf(pin);
    if (idx < 0) return { x: comp.x, y: comp.y };
    // 9 inputs total: 3 X + 3 Y + D + CLK + CLR
    const step = h / 10;
    return { x: comp.x, y: comp.y + step * (idx + 1) };
  }

  // Default: inputs à esquerda, outputs à direita, espaçados verticalmente
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
  onPress, onRelease, onLabelEdit, onClockConfig, onContextMenu, onGearClick,
}) {
  const { w, h } = getCompSize(comp);

  return (
    <g
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, comp.id); }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu?.('comp', comp.id, e); }}
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
        : comp instanceof Clock ? <ClockBody comp={comp} onClockConfig={onClockConfig} />
        : comp instanceof OutputProbe ? <OutputBody comp={comp} />
        : comp instanceof FourBitDigit ? <DigitBody comp={comp} />
        : comp instanceof TriStateBuffer ? <TriStateBody comp={comp} />
        : comp instanceof SRFlipFlop ? <FFBody comp={comp} title="SR" leftLabels={['S','R']} />
        : comp instanceof DFlipFlop ? <FFBody comp={comp} title="D" leftLabels={['D']} />
        : comp instanceof JKFlipFlop ? <FFBody comp={comp} title="JK" leftLabels={['J','K']} />
        : comp instanceof TFlipFlop ? <FFBody comp={comp} title="T" leftLabels={['T']} />
        : comp instanceof Mux2 ? <MuxBody comp={comp} />
        : comp instanceof Demux2 ? <DemuxBody comp={comp} />
        : comp instanceof FullAdder ? <AdderBody comp={comp} />
        : comp instanceof Register4 ? <RegisterBody comp={comp} />
        : comp instanceof SchmittTrigger ? <SchmittBody comp={comp} />
        : comp instanceof Comparator4 ? <ComparatorBody comp={comp} />
        : comp instanceof BCDDecoder ? <BCDBody comp={comp} />
        : comp instanceof SevenSegmentDisplay ? <SevenSegBody comp={comp} />
        : comp instanceof LedMatrix8x8 ? <LedMatrixBody comp={comp} />
        : comp instanceof ROM16x8 ? <ROMBody comp={comp} />
        : comp instanceof LabelComp ? <LabelBody comp={comp} onEdit={onLabelEdit} selected={selected} />
        : comp instanceof Gate ? <GateBody comp={comp} onGearClick={onGearClick} />
        : null
      }

      {/* Pinos */}
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
  const { w } = getCompSize(comp);

  // Determinar direção do stub baseado em onde o pino está
  let dx = 0, dy = 0;
  if (Math.abs(pos.x - comp.x) < 2) { dx = 8; }              // pino à esquerda
  else if (Math.abs(pos.x - (comp.x + w)) < 2) { dx = -8; }  // pino à direita
  else if (pos.y < comp.y + 4) { dy = 8; }                   // pino em cima
  else { dy = -8; }                                          // pino embaixo

  // Para Gates expandidas (3+ entradas), o stub das entradas já é desenhado pela
  // barra vertical do GateBody — então não desenhamos um stub duplicado aqui.
  const isGateExpandedInput =
    comp instanceof Gate &&
    EXPANDABLE_GATES.has(comp.type) &&
    comp.inputCount > 2 &&
    side === 'in';

  let fill;
  if (pin.value === null || pin.value === undefined) fill = '#a78bfa';
  else if (pin.value) fill = 'var(--accent)';
  else fill = 'var(--comp-fill)';

  return (
    <g>
      {!isGateExpandedInput && (
        <line x1={pos.x} y1={pos.y} x2={pos.x + dx} y2={pos.y + dy} stroke="var(--comp-stroke)" strokeWidth="1.5" />
      )}
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

function GateBody({ comp, onGearClick }) {
  const Sym = GATE_SYMBOL_MAP[comp.type];
  const { w, h } = getCompSize(comp);
  const cx = comp.x + w / 2;
  const isExpandable = EXPANDABLE_GATES.has(comp.type);
  const isExpanded = isExpandable && comp.inputCount > 2;

  // Para Gates expandidas: símbolo fica centralizado verticalmente (h fixo de 44),
  // e os pinos ficam distribuídos ao longo de toda a altura da "barra de entrada".
  const symbolH = 44;
  const symbolW = 80;
  const symbolX = comp.x + 8;
  const symbolY = comp.y + (h - symbolH) / 2;

  return (
    <>
      {isExpanded ? (
        <>
          {/* Barra vertical à esquerda que une todos os pinos (estilo Logic.ly) */}
          {(() => {
            const n = comp.inputCount;
            const step = h / (n + 1);
            const firstY = comp.y + step;
            const lastY  = comp.y + step * n;
            const barX   = symbolX + 6; // posição do "encosto" dos stubs no símbolo
            return (
              <>
                {/* Stubs horizontais saindo de cada pino até a barra */}
                {Array.from({ length: n }).map((_, i) => {
                  const py = comp.y + step * (i + 1);
                  return (
                    <line
                      key={`stub-${i}`}
                      x1={comp.x} y1={py}
                      x2={barX}   y2={py}
                      stroke="var(--comp-stroke)"
                      strokeWidth="1.5"
                    />
                  );
                })}
                {/* Barra vertical conectando todos os stubs */}
                <line
                  x1={barX} y1={firstY}
                  x2={barX} y2={lastY}
                  stroke="var(--comp-stroke)"
                  strokeWidth="1.5"
                />
                {/* Stub horizontal central conectando a barra ao símbolo */}
                <line
                  x1={barX}            y1={comp.y + h / 2}
                  x2={symbolX + 12}    y2={comp.y + h / 2}
                  stroke="var(--comp-stroke)"
                  strokeWidth="1.5"
                />
              </>
            );
          })()}

          {/* Símbolo da porta centralizado verticalmente */}
          <g transform={`translate(${symbolX}, ${symbolY})`}>
            {Sym && <Sym width={symbolW} height={symbolH} />}
          </g>
        </>
      ) : (
        // Renderização original (2 inputs ou portas não-expansíveis)
        <g transform={`translate(${comp.x + 8}, ${comp.y + 6})`}>
          {Sym && <Sym width={80} height={44} />}
        </g>
      )}

      <text x={cx} y={comp.y + h + 12} textAnchor="middle"
        fill="var(--canvas-text-dim)" fontSize="10" fontWeight="600"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        {comp.type}{isExpandable && comp.inputCount > 2 ? `(${comp.inputCount})` : ''}
      </text>

      {/* Engrenagem de configuração — só para portas expansíveis */}
      {isExpandable && (
        <g
          transform={`translate(${comp.x + w - 4}, ${comp.y - 4})`}
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); onGearClick?.(comp.id); }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Configurar entradas"
        >
          {/* Fundo circular clicável */}
          <circle r={9} fill="#1e2228" stroke="#4a5568" strokeWidth="1" opacity="0.92" />
          {/* Ícone de engrenagem */}
          <g transform="scale(0.55)" fill="#94a3b8">
            <circle cx="0" cy="0" r="4.5" fill="#94a3b8"/>
            {[0,45,90,135,180,225,270,315].map((deg) => (
              <rect
                key={deg}
                x="-2" y="-9.5"
                width="4" height="4"
                rx="0.8"
                transform={`rotate(${deg})`}
                fill="#94a3b8"
              />
            ))}
            <circle cx="0" cy="0" r="3" fill="#1e2228"/>
          </g>
        </g>
      )}
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

function ClockBody({ comp, onClockConfig }) {
  const { w, h } = getCompSize(comp);
  const periodMs = comp.periodMs || 1000;
  const freqHz = 1000 / periodMs;
  const freqLabel = freqHz < 1
    ? `${freqHz.toFixed(2)} Hz`
    : freqHz < 10
      ? `${freqHz.toFixed(1)} Hz`
      : `${Math.round(freqHz)} Hz`;

  return (
    <>
      {/* Fundo clicável */}
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="var(--comp-fill)" stroke={comp.state ? 'var(--accent)' : 'var(--comp-stroke)'}
        strokeWidth={comp.state ? '2' : '1.5'}
        style={{ cursor: 'pointer', transition: 'stroke .1s' }}
        onClick={(e) => { e.stopPropagation(); onClockConfig?.(comp.id); }} />

      {/* Forma de onda */}
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

      {/* Ícone de settings (canto superior direito) */}
      <text x={comp.x + w - 6} y={comp.y + 11}
        textAnchor="end" fill="var(--canvas-text-mute)" fontSize="10"
        style={{ pointerEvents: 'none' }}>⚙</text>

      {/* Frequência atual */}
      <text x={comp.x + w / 2} y={comp.y + h + 12}
        textAnchor="middle" fill="var(--canvas-text-dim)" fontSize="10"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        CLK {freqLabel}
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

function MuxBody({ comp }) {
  const { w, h } = getCompSize(comp);
  // Trapézio que estreita para a direita
  const top = comp.y + 8;
  const bot = comp.y + h - 14; // deixa espaço pro pino S embaixo
  const taperTop = comp.y + h * 0.22;
  const taperBot = comp.y + h * 0.70;
  return (
    <>
      <path
        d={`M ${comp.x + 4} ${top}
            L ${comp.x + w - 4} ${taperTop}
            L ${comp.x + w - 4} ${taperBot}
            L ${comp.x + 4} ${bot} Z`}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.8" strokeLinejoin="round"
      />
      <text x={comp.x + w / 2 - 6} y={comp.y + h * 0.45 + 4}
        textAnchor="middle" fill="var(--canvas-text)"
        fontSize="11" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        MUX
      </text>
      {/* Labels dos pinos de input */}
      <text x={getPinPos(comp, comp.inputs[0]).x + 10} y={getPinPos(comp, comp.inputs[0]).y + 3}
        fill="var(--canvas-text-dim)" fontSize="9" fontWeight="600"
        fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: 'none' }}>A</text>
      <text x={getPinPos(comp, comp.inputs[1]).x + 10} y={getPinPos(comp, comp.inputs[1]).y + 3}
        fill="var(--canvas-text-dim)" fontSize="9" fontWeight="600"
        fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: 'none' }}>B</text>
      <text x={getPinPos(comp, comp.inputs[2]).x + 4} y={getPinPos(comp, comp.inputs[2]).y - 10}
        fill="var(--canvas-text-dim)" fontSize="9" fontWeight="600"
        fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: 'none' }}>S</text>
      <text x={comp.x + w / 2} y={comp.y + h + 12}
        textAnchor="middle" fill="var(--canvas-text-dim)" fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        MUX 2:1
      </text>
    </>
  );
}

function DemuxBody({ comp }) {
  const { w, h } = getCompSize(comp);
  // Trapézio invertido: estreito à esquerda, largo à direita
  const top = comp.y + h * 0.22;
  const bot = comp.y + h * 0.70;
  const wideTop = comp.y + 8;
  const wideBot = comp.y + h - 14;
  return (
    <>
      <path
        d={`M ${comp.x + 4} ${top}
            L ${comp.x + w - 4} ${wideTop}
            L ${comp.x + w - 4} ${wideBot}
            L ${comp.x + 4} ${bot} Z`}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.8" strokeLinejoin="round"
      />
      <text x={comp.x + w / 2 - 6} y={comp.y + h * 0.45 + 4}
        textAnchor="middle" fill="var(--canvas-text)"
        fontSize="10" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        DMX
      </text>
      <text x={getPinPos(comp, comp.inputs[0]).x + 10} y={getPinPos(comp, comp.inputs[0]).y + 3}
        fill="var(--canvas-text-dim)" fontSize="8" fontWeight="600"
        fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: 'none' }}>In</text>
      <text x={getPinPos(comp, comp.inputs[1]).x + 4} y={getPinPos(comp, comp.inputs[1]).y - 10}
        fill="var(--canvas-text-dim)" fontSize="9" fontWeight="600"
        fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: 'none' }}>S</text>
      <text x={getPinPos(comp, comp.outputs[0]).x - 10} y={getPinPos(comp, comp.outputs[0]).y + 3}
        textAnchor="end" fill="var(--canvas-text-dim)" fontSize="9" fontWeight="600"
        fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: 'none' }}>A</text>
      <text x={getPinPos(comp, comp.outputs[1]).x - 10} y={getPinPos(comp, comp.outputs[1]).y + 3}
        textAnchor="end" fill="var(--canvas-text-dim)" fontSize="9" fontWeight="600"
        fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: 'none' }}>B</text>
      <text x={comp.x + w / 2} y={comp.y + h + 12}
        textAnchor="middle" fill="var(--canvas-text-dim)" fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        DEMUX 1:2
      </text>
    </>
  );
}

function AdderBody({ comp }) {
  const { w, h } = getCompSize(comp);
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.8" />
      {/* Símbolo Σ */}
      <text x={comp.x + w / 2} y={comp.y + h / 2 + 10}
        textAnchor="middle" fill="var(--canvas-text)"
        fontSize="32" fontWeight="700"
        fontFamily="serif"
        style={{ pointerEvents: 'none' }}>
        Σ
      </text>
      {/* Labels */}
      {comp.inputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x + 10} y={pos.y + 3}
            fill="var(--canvas-text-dim)" fontSize="9" fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>
            {pin.name}
          </text>
        );
      })}
      {comp.outputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x - 10} y={pos.y + 3}
            textAnchor="end" fill="var(--canvas-text-dim)" fontSize="9" fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>
            {pin.name}
          </text>
        );
      })}
      <text x={comp.x + w / 2} y={comp.y + h + 12}
        textAnchor="middle" fill="var(--canvas-text-dim)" fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        FULL ADDER
      </text>
    </>
  );
}

function RegisterBody({ comp }) {
  const { w, h } = getCompSize(comp);
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.8" />
      {/* Header */}
      <rect x={comp.x} y={comp.y} width={w} height={20} rx={4}
        fill="var(--accent-bg)"
        style={{ pointerEvents: 'none' }} />
      <text x={comp.x + w / 2} y={comp.y + 14}
        textAnchor="middle" fill="var(--canvas-text)"
        fontSize="11" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        REG 4-bit
      </text>
      {/* Display do valor atual em hex no centro */}
      <rect
        x={comp.x + w / 2 - 18} y={comp.y + 36}
        width={36} height={32} rx={3}
        fill="#0f172a" stroke="var(--comp-stroke)" strokeWidth="1"
        style={{ pointerEvents: 'none' }}
      />
      <text x={comp.x + w / 2} y={comp.y + 60}
        textAnchor="middle" fill="#fde047"
        fontSize="22" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        {comp.hex}
      </text>
      {/* Labels dos pinos de entrada (4 dados + CLK + LOAD) */}
      {comp.inputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x + 10} y={pos.y + 3}
            fill="var(--canvas-text-dim)" fontSize="8" fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>
            {pin.name}
          </text>
        );
      })}
      {/* Labels dos pinos de saída */}
      {comp.outputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x - 10} y={pos.y + 3}
            textAnchor="end" fill="var(--canvas-text-dim)" fontSize="8" fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>
            {pin.name}
          </text>
        );
      })}
      {/* Triângulo de clock no pino CLK (índice 4) */}
      {(() => {
        const clkPin = comp.inputs[4];
        const pos = getPinPos(comp, clkPin);
        return (
          <path
            d={`M ${pos.x + 6} ${pos.y - 4} L ${pos.x + 12} ${pos.y} L ${pos.x + 6} ${pos.y + 4}`}
            fill="none" stroke="var(--comp-stroke)" strokeWidth="1.4"
            style={{ pointerEvents: 'none' }}
          />
        );
      })()}
    </>
  );
}

// ── V9 Bodies ──

function SchmittBody({ comp }) {
  const { w, h } = getCompSize(comp);
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.5" />
      {/* Triângulo + bola (NOT) */}
      <path d={`M ${comp.x + 14} ${comp.y + 8} L ${comp.x + w - 18} ${comp.y + h / 2} L ${comp.x + 14} ${comp.y + h - 8} Z`}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={comp.x + w - 12} cy={comp.y + h / 2} r="3" fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.4" />
      {/* Símbolo de histerese */}
      <path d={`M ${comp.x + 22} ${comp.y + h / 2 + 4} L ${comp.x + 26} ${comp.y + h / 2 + 4} L ${comp.x + 26} ${comp.y + h / 2 - 4} L ${comp.x + 32} ${comp.y + h / 2 - 4} L ${comp.x + 32} ${comp.y + h / 2}`}
        fill="none" stroke="var(--comp-stroke)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <text x={comp.x + w / 2} y={comp.y + h + 12} textAnchor="middle"
        fill="var(--canvas-text-dim)" fontSize="9" fontWeight="600"
        fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: 'none' }}>
        SCHMITT
      </text>
    </>
  );
}

function ComparatorBody({ comp }) {
  const { w, h } = getCompSize(comp);
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.8" />
      <rect x={comp.x} y={comp.y} width={w} height={22} rx={4}
        fill="var(--accent-bg)" style={{ pointerEvents: 'none' }} />
      <text x={comp.x + w / 2} y={comp.y + 15} textAnchor="middle"
        fill="var(--canvas-text)" fontSize="11" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: 'none' }}>
        CMP 4-bit
      </text>
      {/* Labels dos pinos de entrada */}
      {comp.inputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x + 10} y={pos.y + 3}
            fill="var(--canvas-text-dim)" fontSize="8" fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>
            {pin.name}
          </text>
        );
      })}
      {/* Labels dos outputs */}
      {comp.outputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x - 10} y={pos.y + 3}
            textAnchor="end" fill="var(--canvas-text-dim)" fontSize="8" fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>
            {pin.name}
          </text>
        );
      })}
      {/* Indicadores visuais com base em output */}
      <text x={comp.x + w / 2} y={comp.y + h * 0.45} textAnchor="middle"
        fill={asBool(comp.outputs[0].value) ? '#10b981' : 'var(--canvas-text-mute)'}
        fontSize="14" fontWeight="700" fontFamily="serif"
        style={{ pointerEvents: 'none' }}>A &gt; B</text>
      <text x={comp.x + w / 2} y={comp.y + h * 0.62} textAnchor="middle"
        fill={asBool(comp.outputs[1].value) ? '#10b981' : 'var(--canvas-text-mute)'}
        fontSize="14" fontWeight="700" fontFamily="serif"
        style={{ pointerEvents: 'none' }}>A = B</text>
      <text x={comp.x + w / 2} y={comp.y + h * 0.79} textAnchor="middle"
        fill={asBool(comp.outputs[2].value) ? '#10b981' : 'var(--canvas-text-mute)'}
        fontSize="14" fontWeight="700" fontFamily="serif"
        style={{ pointerEvents: 'none' }}>A &lt; B</text>
    </>
  );
}

function BCDBody({ comp }) {
  const { w, h } = getCompSize(comp);
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.8" />
      <rect x={comp.x} y={comp.y} width={w} height={22} rx={4}
        fill="var(--accent-bg)" style={{ pointerEvents: 'none' }} />
      <text x={comp.x + w / 2} y={comp.y + 15} textAnchor="middle"
        fill="var(--canvas-text)" fontSize="11" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: 'none' }}>
        BCD→7-SEG
      </text>
      {/* Labels */}
      {comp.inputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x + 10} y={pos.y + 3}
            fill="var(--canvas-text-dim)" fontSize="9" fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>{pin.name}</text>
        );
      })}
      {comp.outputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x - 10} y={pos.y + 3}
            textAnchor="end" fill="var(--canvas-text-dim)" fontSize="9" fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>{pin.name}</text>
        );
      })}
      {/* Mostra valor decimal atual */}
      {(() => {
        let v = 0;
        for (let i = 0; i < 4; i++) if (asBool(comp.inputs[i].value)) v |= (1 << i);
        return (
          <text x={comp.x + w / 2} y={comp.y + h / 2 + 12} textAnchor="middle"
            fill={v > 9 ? 'var(--danger)' : '#fde047'}
            fontSize="32" fontWeight="700"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>
            {v > 9 ? '?' : v}
          </text>
        );
      })()}
    </>
  );
}

function SevenSegBody({ comp }) {
  const { w, h } = getCompSize(comp);
  // Pinos a..g em ordem (inputs[0..6])
  const segs = comp.inputs.map(p => asBool(p.value));
  // Geometria do display: 7 segmentos no centro
  const dispX = comp.x + 18;
  const dispY = comp.y + 24;
  const dispW = 40;
  const dispH = 70;
  const t = 5; // espessura
  const segOn = '#ef4444';
  const segOff = 'rgba(239, 68, 68, 0.15)';
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="#1f2937" stroke="var(--comp-stroke)" strokeWidth="1.5" />
      <rect x={dispX - 2} y={dispY - 2} width={dispW + 4} height={dispH + 4} rx={3}
        fill="#0f172a" />
      {/* Segmento a (topo) */}
      <polygon points={`${dispX+t},${dispY} ${dispX+dispW-t},${dispY} ${dispX+dispW-t-3},${dispY+t} ${dispX+t+3},${dispY+t}`}
        fill={segs[0] ? segOn : segOff} />
      {/* b (direita-cima) */}
      <polygon points={`${dispX+dispW},${dispY+t} ${dispX+dispW},${dispY+dispH/2-2} ${dispX+dispW-t},${dispY+dispH/2-3} ${dispX+dispW-t},${dispY+t+3}`}
        fill={segs[1] ? segOn : segOff} />
      {/* c (direita-baixo) */}
      <polygon points={`${dispX+dispW},${dispY+dispH/2+2} ${dispX+dispW},${dispY+dispH-t} ${dispX+dispW-t},${dispY+dispH-t-3} ${dispX+dispW-t},${dispY+dispH/2+3}`}
        fill={segs[2] ? segOn : segOff} />
      {/* d (fundo) */}
      <polygon points={`${dispX+t},${dispY+dispH} ${dispX+dispW-t},${dispY+dispH} ${dispX+dispW-t-3},${dispY+dispH-t} ${dispX+t+3},${dispY+dispH-t}`}
        fill={segs[3] ? segOn : segOff} />
      {/* e (esquerda-baixo) */}
      <polygon points={`${dispX},${dispY+dispH/2+2} ${dispX},${dispY+dispH-t} ${dispX+t},${dispY+dispH-t-3} ${dispX+t},${dispY+dispH/2+3}`}
        fill={segs[4] ? segOn : segOff} />
      {/* f (esquerda-cima) */}
      <polygon points={`${dispX},${dispY+t} ${dispX},${dispY+dispH/2-2} ${dispX+t},${dispY+dispH/2-3} ${dispX+t},${dispY+t+3}`}
        fill={segs[5] ? segOn : segOff} />
      {/* g (meio) */}
      <polygon points={`${dispX+t},${dispY+dispH/2} ${dispX+t+3},${dispY+dispH/2-3} ${dispX+dispW-t-3},${dispY+dispH/2-3} ${dispX+dispW-t},${dispY+dispH/2} ${dispX+dispW-t-3},${dispY+dispH/2+3} ${dispX+t+3},${dispY+dispH/2+3}`}
        fill={segs[6] ? segOn : segOff} />
      {/* Pin labels */}
      {comp.inputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x + 10} y={pos.y + 3}
            fill="rgba(255,255,255,0.6)" fontSize="8" fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>{pin.name}</text>
        );
      })}
      <text x={comp.x + w / 2} y={comp.y + h + 12} textAnchor="middle"
        fill="var(--canvas-text-dim)" fontSize="9" fontWeight="600"
        fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: 'none' }}>
        7-SEGMENT
      </text>
    </>
  );
}

function LedMatrixBody({ comp }) {
  const { w, h } = getCompSize(comp);
  // Header de 26px, depois matrix
  const headerH = 26;
  const matrixSize = h - headerH - 8;
  const cellSize = matrixSize / 8;
  const matrixX = comp.x + (w - matrixSize) / 2;
  const matrixY = comp.y + headerH;
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="#0f172a" stroke="var(--comp-stroke)" strokeWidth="1.8" />
      <rect x={comp.x} y={comp.y} width={w} height={headerH} rx={4}
        fill="var(--accent-bg)" style={{ pointerEvents: 'none' }} />
      <text x={comp.x + w / 2} y={comp.y + 17} textAnchor="middle"
        fill="var(--canvas-text)" fontSize="11" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: 'none' }}>
        LED MATRIX 8×8
      </text>
      {/* Grid */}
      {Array.from({ length: 8 }, (_, y) =>
        Array.from({ length: 8 }, (_, x) => {
          const lit = comp.matrix && comp.matrix[y * 8 + x];
          return (
            <circle
              key={`${x}-${y}`}
              cx={matrixX + cellSize * x + cellSize / 2}
              cy={matrixY + cellSize * y + cellSize / 2}
              r={cellSize * 0.32}
              fill={lit ? '#ef4444' : 'rgba(239,68,68,0.1)'}
              stroke={lit ? '#fca5a5' : 'rgba(239,68,68,0.2)'}
              strokeWidth="0.5"
              style={{ pointerEvents: 'none', filter: lit ? 'drop-shadow(0 0 2px #ef4444)' : 'none' }}
            />
          );
        })
      )}
      {/* Pin labels (dentro, esquerda) */}
      {comp.inputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x + 10} y={pos.y + 3}
            fill="rgba(255,255,255,0.55)" fontSize="8" fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>{pin.name}</text>
        );
      })}
    </>
  );
}

function ROMBody({ comp }) {
  const { w, h } = getCompSize(comp);
  // Endereço atual
  let addr = 0;
  for (let i = 0; i < 4; i++) {
    if (asBool(comp.inputs[i].value)) addr |= (1 << i);
  }
  const oe = asBool(comp.inputs[4].value);
  const byte = comp.data ? comp.data[addr] : 0;
  return (
    <>
      <rect x={comp.x} y={comp.y} width={w} height={h} rx={4}
        fill="var(--comp-fill)" stroke="var(--comp-stroke)" strokeWidth="1.8" />
      <rect x={comp.x} y={comp.y} width={w} height={22} rx={4}
        fill="var(--accent-bg)" style={{ pointerEvents: 'none' }} />
      <text x={comp.x + w / 2} y={comp.y + 15} textAnchor="middle"
        fill="var(--canvas-text)" fontSize="11" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: 'none' }}>
        ROM 16×8
      </text>
      {/* Display do dado atual */}
      <rect x={comp.x + w / 2 - 28} y={comp.y + h / 2 - 18}
        width={56} height={36} rx={3}
        fill="#0f172a" stroke="var(--comp-stroke)" strokeWidth="1"
        style={{ pointerEvents: 'none' }}
      />
      <text x={comp.x + w / 2} y={comp.y + h / 2 - 4}
        textAnchor="middle" fill="var(--canvas-text-mute)" fontSize="8"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        {oe ? `addr ${addr.toString(16).toUpperCase()}` : 'OE=0'}
      </text>
      <text x={comp.x + w / 2} y={comp.y + h / 2 + 12}
        textAnchor="middle" fill={oe ? '#fde047' : 'var(--canvas-text-mute)'}
        fontSize="14" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none' }}>
        {oe ? `0x${byte.toString(16).padStart(2, '0').toUpperCase()}` : 'HiZ'}
      </text>
      {/* Pin labels */}
      {comp.inputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x + 10} y={pos.y + 3}
            fill="var(--canvas-text-dim)" fontSize="8" fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>{pin.name}</text>
        );
      })}
      {comp.outputs.map((pin) => {
        const pos = getPinPos(comp, pin);
        return (
          <text key={pin.id} x={pos.x - 10} y={pos.y + 3}
            textAnchor="end" fill="var(--canvas-text-dim)" fontSize="8" fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none' }}>{pin.name}</text>
        );
      })}
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

function WirePath({ wire, selected, onWireClick, onWireContextMenu }) {
  const [hovered, setHovered] = useState(false);
  const fromPos = getPinPos(wire.from.owner, wire.from);
  const toPos = getPinPos(wire.to.owner, wire.to);
  const dx = Math.max(20, (toPos.x - fromPos.x) * 0.5);
  const path = `M${fromPos.x},${fromPos.y} C${fromPos.x + dx},${fromPos.y} ${toPos.x - dx},${toPos.y} ${toPos.x},${toPos.y}`;
  const v = wire.from.value;
  let color;
  if (selected) color = '#f59e0b'; // âmbar quando selecionado
  else if (hovered) color = '#38bdf8';
  else if (v === null || v === undefined) color = '#a78bfa'; // HIGH-Z
  else if (v) color = 'var(--accent)';
  else color = 'var(--wire-off)';

  return (
    <g>
      {/* Hitbox invisível mais larga para facilitar clique */}
      <path d={path} fill="none" stroke="transparent" strokeWidth="12"
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onWireClick?.(wire.id, e); }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onWireContextMenu?.(wire.id, e); }}
      />
      {/* Fio visual */}
      <path d={path} fill="none" stroke={color} strokeWidth={selected || hovered ? 3 : 2.5}
        strokeLinecap="round"
        strokeDasharray={v === null ? '5,3' : ''}
        style={{ transition: 'stroke .1s, stroke-width .1s', pointerEvents: 'none' }}
      />
      {/* Ponto de seleção no meio */}
      {selected && (() => {
        const mx = (fromPos.x + toPos.x) / 2;
        const my = (fromPos.y + toPos.y) / 2;
        return <circle cx={mx} cy={my} r={5} fill="#f59e0b" stroke="#fff" strokeWidth="1.5" style={{ pointerEvents: 'none' }} />;
      })()}
    </g>
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
  components, wires, selectedIds, selectedWireIds, wiringFrom, mousePos, marquee,
  editingLabelId,
  viewBox, showGrid, currentTool,
  onMouseMove, onMouseUp, onMouseDown,
  onCompMouseDown, onPinClick, onToggle,
  onPress, onRelease,
  onLabelEdit, onLabelCommit, onLabelCancel,
  onDrop, svgRef, onClockConfig,
  onWireClick, onWireContextMenu,
  onContextMenu, onGearClick, onWheelZoom,
}) {
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Listener nativo de wheel (não-passive) para permitir preventDefault() e zoom centrado
  useEffect(() => {
    const svg = svgRef?.current;
    if (!svg || !onWheelZoom) return;
    const handler = (e) => {
      e.preventDefault();
      // Converter posição do cursor em coords do SVG
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const p = pt.matrixTransform(ctm.inverse());
      onWheelZoom(e.deltaY, p.x, p.y);
    };
    svg.addEventListener('wheel', handler, { passive: false });
    return () => svg.removeEventListener('wheel', handler);
  }, [svgRef, onWheelZoom]);

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

  const vb = viewBox || { x: 0, y: 0, w: 1200, h: 700 };
  const vbStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
  const cursorClass = currentTool === 'pan' ? 'pan-cursor' : '';

  return (
    <div className={`canvas-wrapper ${cursorClass}`} onDragOver={handleDragOver} onDrop={handleDrop}>
      <svg
        ref={svgRef}
        className="canvas-svg"
        viewBox={vbStr}
        preserveAspectRatio="xMidYMid meet"
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
        {/* Background cobrindo área muito maior que o viewBox para suportar pan */}
        <rect data-bg="true"
          x={vb.x - 5000} y={vb.y - 5000}
          width={vb.w + 10000} height={vb.h + 10000}
          fill="var(--canvas-bg)"
          onContextMenu={(e) => { e.preventDefault(); onContextMenu?.('canvas', null, e); }}
        />
        {showGrid && (
          <rect data-bg="true"
            x={vb.x - 5000} y={vb.y - 5000}
            width={vb.w + 10000} height={vb.h + 10000}
            fill="url(#grid-pattern)"
            onContextMenu={(e) => { e.preventDefault(); onContextMenu?.('canvas', null, e); }}
          />
        )}

        {wires.map(w => (
          <WirePath key={w.id} wire={w}
            selected={selectedWireIds?.has(w.id)}
            onWireClick={onWireClick}
            onWireContextMenu={onWireContextMenu}
          />
        ))}
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
            onClockConfig={onClockConfig}
            onContextMenu={onContextMenu}
            onGearClick={onGearClick}
          />
        ))}

        {marqueeRect}

        {components.length === 0 && (
          <g style={{ pointerEvents: 'none' }}>
            <text x={vb.x + vb.w / 2} y={vb.y + vb.h * 0.48} textAnchor="middle"
              fill="var(--canvas-text-dim)" fontSize="14"
              fontFamily="'Inter', sans-serif" fontWeight="500">
              Drag components from the sidebar to start
            </text>
            <text x={vb.x + vb.w / 2} y={vb.y + vb.h * 0.53} textAnchor="middle"
              fill="var(--canvas-text-mute)" fontSize="11"
              fontFamily="'Inter', sans-serif">
              or open a saved circuit (Ctrl+O)
            </text>
          </g>
        )}
      </svg>

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
