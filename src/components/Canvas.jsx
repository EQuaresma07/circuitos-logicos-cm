import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  InputSwitch, OutputProbe, Clock, Gate,
  PushButton, HighConstant, LowConstant, PullUp, PullDown,
  FourBitDigit, TriStateBuffer,
  SRFlipFlop, DFlipFlop, JKFlipFlop, TFlipFlop,
  Mux2, Demux2, FullAdder, Register4,
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

// Retorna { w, h } sem rotação
function getCompSizeRaw(comp) {
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
  if (comp instanceof LabelComp) return { w: comp.width, h: comp.height };
  return { w: COMP_W, h: COMP_H };
}

// Retorna { w, h } considerando rotação (90/270 trocam w/h)
export function getCompSize(comp) {
  const raw = getCompSizeRaw(comp);
  const r = comp.rotation || 0;
  if (r === 90 || r === 270) return { w: raw.h, h: raw.w };
  return raw;
}

// Aplica rotação a um ponto local (relativo a 0,0 do componente não rotacionado)
// Retorna ponto local relativo ao bounding box rotacionado
function rotateLocal(px, py, w, h, rotation) {
  switch (rotation) {
    case 90:  return { x: h - py, y: px };       // sentido horário 90°
    case 180: return { x: w - px, y: h - py };
    case 270: return { x: py,     y: w - px };
    default:  return { x: px,     y: py };
  }
}

const GATE_SYMBOL_MAP = {
  AND: ANDSymbol, OR: ORSymbol, NOT: NOTSymbol,
  NAND: NANDSymbol, NOR: NORSymbol, XOR: XORSymbol, XNOR: XNORSymbol,
  BUFFER: BufferSymbol,
};

// Retorna posição local do pino (relativa ao componente, sem rotação)
function getPinPosLocal(comp, pin) {
  const { w, h } = getCompSizeRaw(comp);

  if (comp instanceof TriStateBuffer) {
    if (pin === comp.inputs[0]) return { x: 0, y: h / 2 };
    if (pin === comp.inputs[1]) return { x: w / 2, y: 0 };
    return { x: w, y: h / 2 };
  }

  if (comp instanceof Mux2) {
    if (pin === comp.inputs[0]) return { x: 0, y: h * 0.30 };
    if (pin === comp.inputs[1]) return { x: 0, y: h * 0.62 };
    if (pin === comp.inputs[2]) return { x: w / 2, y: h };
    return { x: w, y: h / 2 };
  }

  if (comp instanceof Demux2) {
    if (pin === comp.inputs[0]) return { x: 0, y: h / 2 };
    if (pin === comp.inputs[1]) return { x: w / 2, y: h };
    if (pin === comp.outputs[0]) return { x: w, y: h * 0.30 };
    return { x: w, y: h * 0.62 };
  }

  const idx = comp.inputs.indexOf(pin);
  if (idx >= 0) {
    const step = h / (comp.inputs.length + 1);
    return { x: 0, y: step * (idx + 1) };
  }
  const oidx = comp.outputs.indexOf(pin);
  if (oidx >= 0) {
    const step = h / (comp.outputs.length + 1);
    return { x: w, y: step * (oidx + 1) };
  }
  return { x: 0, y: 0 };
}

// ── Posição global de pinos (com rotação aplicada) ──
export function getPinPos(comp, pin) {
  const local = getPinPosLocal(comp, pin);
  const raw = getCompSizeRaw(comp);
  const rot = comp.rotation || 0;
  const rotated = rotateLocal(local.x, local.y, raw.w, raw.h, rot);
  return { x: comp.x + rotated.x, y: comp.y + rotated.y };
}

// Determina a "direção" do pino após rotação
function getPinSide(comp, pin) {
  const local = getPinPosLocal(comp, pin);
  const raw = getCompSizeRaw(comp);
  let side;
  if (Math.abs(local.x) < 1) side = 'left';
  else if (Math.abs(local.x - raw.w) < 1) side = 'right';
  else if (Math.abs(local.y) < 1) side = 'top';
  else side = 'bottom';
  const rot = comp.rotation || 0;
  if (rot === 0) return side;
  const cw = { left: 'top', top: 'right', right: 'bottom', bottom: 'left' };
  let result = side;
  for (let i = 0; i < rot / 90; i++) result = cw[result];
  return result;
}

// ════════════════════════════════════════════════════════════
//  CompNode: roteia para o body certo + desenha pinos
// ════════════════════════════════════════════════════════════

function CompNode({
  comp, selected, onMouseDown, onPinClick, onToggle,
  onPress, onRelease, onLabelEdit,
}) {
  const { w, h } = getCompSize(comp);
  const raw = getCompSizeRaw(comp);
  const rot = comp.rotation || 0;

  // O body sempre é desenhado em coordenadas "não rotacionadas" relativas a (0,0)
  // depois aplicamos transform de rotação em torno do CENTRO, seguido de translação para posição final.
  //
  // Transform CORRETO para SVG (aplicado da direita para esquerda):
  //   translate(-raw.w/2, -raw.h/2)       — move o center para a origem
  //   rotate(rot)                         — rotaciona em torno da origem
  //   translate(comp.x + w/2, comp.y + h/2) — move o center para a posição final
  const bodyTransform = rot === 0
    ? `translate(${comp.x}, ${comp.y})`
    : `translate(${comp.x + w / 2}, ${comp.y + h / 2}) rotate(${rot}) translate(${-raw.w / 2}, ${-raw.h / 2})`;

  return (
    <g
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, comp.id); }}
      style={{ cursor: comp instanceof LabelComp ? 'move' : 'grab' }}
      data-comp="true"
    >
      {/* Body rotacionado: desenhado como se comp estivesse em (0,0) e sem rotação */}
      <g transform={bodyTransform}>
        <RotatedBody comp={comp} onToggle={onToggle} onPress={onPress} onRelease={onRelease} onLabelEdit={onLabelEdit} selected={selected} />
      </g>

      {/* Pinos: posições GLOBAIS já calculadas com rotação */}
      {!(comp instanceof LabelComp) && (
        <>
          {comp.inputs.map((pin) => <PinDot key={pin.id} pin={pin} comp={comp} side="in" onPinClick={onPinClick} />)}
          {comp.outputs.map((pin) => <PinDot key={pin.id} pin={pin} comp={comp} side="out" onPinClick={onPinClick} />)}
        </>
      )}

      {/* Outline de seleção (em torno do bbox rotacionado) */}
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

// Wrapper que renderiza o body certo. Os bodies usam coordenadas relativas
// onde o componente está em (0,0) e tem dimensões raw (não rotacionadas).
function RotatedBody({ comp, onToggle, onPress, onRelease, onLabelEdit, selected }) {
  // Cria uma versão "fake" do componente com x=0, y=0 para os bodies usarem
  // Cuidado: NÃO mutar comp original. Usamos um proxy somente para leitura.
  const localComp = Object.create(comp);
  localComp.x = 0;
  localComp.y = 0;

  return (
    <>
      {comp instanceof InputSwitch ? <InputBody comp={localComp} onToggle={() => onToggle(comp.id)} />
        : comp instanceof PushButton ? <PushButtonBody comp={localComp} onPress={() => onPress(comp.id)} onRelease={() => onRelease(comp.id)} />
        : comp instanceof HighConstant ? <ConstantBody comp={localComp} value="1" />
        : comp instanceof LowConstant ? <ConstantBody comp={localComp} value="0" />
        : comp instanceof PullUp ? <PullBody comp={localComp} kind="up" />
        : comp instanceof PullDown ? <PullBody comp={localComp} kind="down" />
        : comp instanceof Clock ? <ClockBody comp={localComp} />
        : comp instanceof OutputProbe ? <OutputBody comp={localComp} />
        : comp instanceof FourBitDigit ? <DigitBody comp={localComp} />
        : comp instanceof TriStateBuffer ? <TriStateBody comp={localComp} />
        : comp instanceof SRFlipFlop ? <FFBody comp={localComp} title="SR" leftLabels={['S','R']} />
        : comp instanceof DFlipFlop ? <FFBody comp={localComp} title="D" leftLabels={['D']} />
        : comp instanceof JKFlipFlop ? <FFBody comp={localComp} title="JK" leftLabels={['J','K']} />
        : comp instanceof TFlipFlop ? <FFBody comp={localComp} title="T" leftLabels={['T']} />
        : comp instanceof Mux2 ? <MuxBody comp={localComp} />
        : comp instanceof Demux2 ? <DemuxBody comp={localComp} />
        : comp instanceof FullAdder ? <AdderBody comp={localComp} />
        : comp instanceof Register4 ? <RegisterBody comp={localComp} />
        : comp instanceof LabelComp ? <LabelBody comp={localComp} onEdit={() => onLabelEdit(comp.id)} selected={selected} />
        : comp instanceof Gate ? <GateBody comp={localComp} />
        : null
      }
    </>
  );
}

// ── Pino genérico ──
function PinDot({ pin, comp, side, onPinClick }) {
  const pos = getPinPos(comp, pin);
  // Determina direção do stub de acordo com o lado lógico (após rotação)
  const pinSide = getPinSide(comp, pin);
  let dx = 0, dy = 0;
  switch (pinSide) {
    case 'left':   dx = 8;  break;
    case 'right':  dx = -8; break;
    case 'top':    dy = 8;  break;
    case 'bottom': dy = -8; break;
  }

  let fill;
  if (pin.value === null || pin.value === undefined) fill = '#a78bfa';
  else if (pin.value) fill = 'var(--accent)';
  else fill = 'var(--comp-fill)';

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
  viewBox, showGrid, currentTool,
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
          fill="var(--canvas-bg)" />
        {showGrid && (
          <rect data-bg="true"
            x={vb.x - 5000} y={vb.y - 5000}
            width={vb.w + 10000} height={vb.h + 10000}
            fill="url(#grid-pattern)" />
        )}

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
