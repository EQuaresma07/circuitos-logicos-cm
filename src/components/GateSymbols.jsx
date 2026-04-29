// ════════════════════════════════════════════════════════════
//  Símbolos SVG — estilo Logic.ly / IEEE
// ════════════════════════════════════════════════════════════

import React from 'react';

const S = '#374151';
const F = '#ffffff';

// ──────────────────────────────────────────────
//  Logic Gates
// ──────────────────────────────────────────────

export function ANDSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="14" x2="18" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="30" x2="18" y2="30" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 18 8 L 36 8 A 14 14 0 0 1 36 36 L 18 36 Z" fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function ORSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="15" x2="19" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="29" x2="19" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="52" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 16 8 Q 26 22 16 36 Q 34 36 50 22 Q 34 8 16 8 Z" fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function NOTSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="22" x2="16" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="57" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 16 7 L 16 37 L 49 22 Z" fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="53" cy="22" r="4" fill={fillColor} stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function NANDSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="14" x2="18" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="30" x2="18" y2="30" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="55" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 18 8 L 36 8 A 14 14 0 0 1 36 36 L 18 36 Z" fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="51" cy="22" r="4" fill={fillColor} stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function NORSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="15" x2="19" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="29" x2="19" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="55" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 16 8 Q 26 22 16 36 Q 34 36 50 22 Q 34 8 16 8 Z" fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="54" cy="22" r="4" fill={fillColor} stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function XORSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="15" x2="20" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="29" x2="20" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="52" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 13 8 Q 23 22 13 36" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 18 8 Q 28 22 18 36 Q 36 36 52 22 Q 36 8 18 8 Z" fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function XNORSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="15" x2="20" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="29" x2="20" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="55" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 13 8 Q 23 22 13 36" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 18 8 Q 28 22 18 36 Q 36 36 50 22 Q 36 8 18 8 Z" fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="54" cy="22" r="4" fill={fillColor} stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

// Buffer: triângulo simples sem bolinha
export function BufferSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="22" x2="16" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 16 7 L 16 37 L 50 22 Z" fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

// Tri-State Buffer: triângulo com pino de enable em cima
export function TriStateSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      {/* Data input */}
      <line x1="6" y1="26" x2="16" y2="26" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Output */}
      <line x1="50" y1="26" x2="64" y2="26" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Enable input (top) */}
      <line x1="33" y1="2" x2="33" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Triangle */}
      <path d="M 16 11 L 16 41 L 50 26 Z" fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

// ──────────────────────────────────────────────
//  Inputs
// ──────────────────────────────────────────────

export function SwitchSymbol({ width = 64, height = 44, on = false, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 64 44">
      <line x1="4" y1="22" x2="14" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="22" x2="60" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="22" r="3" fill={fillColor} stroke={color} strokeWidth="1.5" />
      <circle cx="50" cy="22" r="3" fill={fillColor} stroke={color} strokeWidth="1.5" />
      <line x1="14" y1="22" x2={on ? 50 : 44} y2={on ? 22 : 13} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="22" r="2" fill={color} />
    </svg>
  );
}

// Push Button
export function PushButtonSymbol({ width = 64, height = 44, pressed = false, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 64 44">
      <line x1="4" y1="22" x2="14" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="22" x2="60" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Botão circular (estilo Logic.ly) */}
      <circle cx="32" cy="22" r="11" fill={pressed ? '#0ea5e9' : fillColor} stroke={color} strokeWidth="1.8" />
      <circle cx="32" cy="22" r="6" fill={fillColor} stroke={color} strokeWidth="1.2" />
      {/* Linha de fluxo passando por trás */}
      <line x1="14" y1="22" x2="20" y2="22" stroke={color} strokeWidth="1.5" />
      <line x1="44" y1="22" x2="50" y2="22" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// High Constant: caixa com "1"
export function HighSymbol({ width = 56, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 56 44">
      <line x1="42" y1="22" x2="52" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="8" y="10" width="34" height="24" rx="2" fill={fillColor} stroke={color} strokeWidth="1.8" />
      <text x="25" y="29" textAnchor="middle" fill={color} fontSize="16" fontWeight="700" fontFamily="'JetBrains Mono', monospace">1</text>
    </svg>
  );
}

// Low Constant: caixa com "0"
export function LowSymbol({ width = 56, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 56 44">
      <line x1="42" y1="22" x2="52" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="8" y="10" width="34" height="24" rx="2" fill={fillColor} stroke={color} strokeWidth="1.8" />
      <text x="25" y="29" textAnchor="middle" fill={color} fontSize="16" fontWeight="700" fontFamily="'JetBrains Mono', monospace">0</text>
    </svg>
  );
}

// Pull Up: resistor zigzag conectado a "+"
export function PullUpSymbol({ width = 50, height = 56, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 50 56">
      <line x1="25" y1="2" x2="25" y2="10" stroke={color} strokeWidth="1.5" />
      <line x1="20" y1="4" x2="30" y2="4" stroke={color} strokeWidth="1.5" />
      <line x1="22" y1="1" x2="28" y2="1" stroke={color} strokeWidth="1.5" />
      {/* Resistor zigzag */}
      <polyline points="25,10 20,14 30,18 20,22 30,26 25,30" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Output stub */}
      <line x1="25" y1="30" x2="25" y2="44" stroke={color} strokeWidth="1.5" />
      <line x1="25" y1="44" x2="44" y2="44" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Pull Down: resistor para terra
export function PullDownSymbol({ width = 50, height = 56, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 50 56">
      <line x1="25" y1="12" x2="44" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="25" y1="12" x2="25" y2="26" stroke={color} strokeWidth="1.5" />
      {/* Resistor zigzag */}
      <polyline points="25,26 20,30 30,34 20,38 30,42 25,46" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Ground symbol */}
      <line x1="18" y1="48" x2="32" y2="48" stroke={color} strokeWidth="2" />
      <line x1="21" y1="51" x2="29" y2="51" stroke={color} strokeWidth="2" />
      <line x1="24" y1="54" x2="26" y2="54" stroke={color} strokeWidth="2" />
    </svg>
  );
}

// ──────────────────────────────────────────────
//  Outputs
// ──────────────────────────────────────────────

export function LampSymbol({ width = 52, height = 58, on = false, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 52 58">
      <line x1="4" y1="20" x2="12" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="20" r="2.5" fill={fillColor} stroke={color} strokeWidth="1.5" />
      <circle cx="26" cy="20" r="14" fill={on ? '#fde047' : fillColor} stroke={color} strokeWidth="1.8" />
      <line x1="20" y1="14" x2="32" y2="26" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <line x1="32" y1="14" x2="20" y2="26" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <rect x="19" y="34" width="14" height="4" rx="1" fill={fillColor} stroke={color} strokeWidth="1.5" />
      <rect x="19" y="38" width="14" height="4" rx="1" fill={fillColor} stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// 4-Bit Digit display
export function FourBitDigitSymbol({ width = 64, height = 56, value = 'F', color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 64 56">
      {/* 4 input stubs */}
      <line x1="4" y1="12" x2="12" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="22" x2="12" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="34" x2="12" y2="34" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="44" x2="12" y2="44" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Pin dots */}
      <circle cx="12" cy="12" r="1.8" fill={color} />
      <circle cx="12" cy="22" r="1.8" fill={color} />
      <circle cx="12" cy="34" r="1.8" fill={color} />
      <circle cx="12" cy="44" r="1.8" fill={color} />
      {/* Display body */}
      <rect x="16" y="6" width="44" height="44" rx="3" fill={fillColor} stroke={color} strokeWidth="1.8" />
      {/* Hex digit */}
      <text x="38" y="36" textAnchor="middle" fill={color} fontSize="22" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{value}</text>
    </svg>
  );
}

// ──────────────────────────────────────────────
//  Clock
// ──────────────────────────────────────────────

export function ClockSymbol({ width = 64, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 64 44">
      <line x1="4" y1="22" x2="12" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="52" y1="22" x2="60" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="12" y="8" width="40" height="28" rx="2" fill={fillColor} stroke={color} strokeWidth="1.8" />
      <polyline points="16,30 21,30 21,18 27,18 27,30 33,30 33,18 39,18 39,30 48,30" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ──────────────────────────────────────────────
//  Flip-Flops
// ──────────────────────────────────────────────

// Genérico: caixa com pinos rotulados
function FlipFlopBox({ width, height, leftLabels, rightLabels = ['Q', 'Q\u0305'], hasClock, color, fillColor, title }) {
  const w = width;
  const h = height;
  const bodyX = 14;
  const bodyW = w - 28;
  const stubLen = 10;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Body */}
      <rect x={bodyX} y="6" width={bodyW} height={h - 12} rx="2" fill={fillColor} stroke={color} strokeWidth="1.8" />

      {/* Title */}
      {title && (
        <text x={w / 2} y="16" textAnchor="middle" fill={color} fontSize="7" fontWeight="700" fontFamily="'JetBrains Mono', monospace">
          {title}
        </text>
      )}

      {/* Left pins */}
      {leftLabels.map((lab, i) => {
        const y = 22 + i * 12;
        return (
          <g key={`l${i}`}>
            <line x1={bodyX - stubLen} y1={y} x2={bodyX} y2={y} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx={bodyX - stubLen} cy={y} r="1.5" fill={color} />
            <text x={bodyX + 3} y={y + 2} fill={color} fontSize="6" fontFamily="'JetBrains Mono', monospace">{lab}</text>
          </g>
        );
      })}

      {/* Right pins */}
      {rightLabels.map((lab, i) => {
        const y = 22 + i * 14;
        return (
          <g key={`r${i}`}>
            <line x1={bodyX + bodyW} y1={y} x2={bodyX + bodyW + stubLen} y2={y} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx={bodyX + bodyW + stubLen} cy={y} r="1.5" fill={color} />
            <text x={bodyX + bodyW - 3} y={y + 2} textAnchor="end" fill={color} fontSize="6" fontFamily="'JetBrains Mono', monospace">{lab}</text>
          </g>
        );
      })}

      {/* Clock triangle (se hasClock) */}
      {hasClock && (
        <path
          d={`M ${bodyX} ${h - 18} L ${bodyX + 5} ${h - 14} L ${bodyX} ${h - 10}`}
          fill="none" stroke={color} strokeWidth="1.4"
        />
      )}
    </svg>
  );
}

export function SRFFSymbol({ width = 64, height = 56, color = S, fillColor = F }) {
  return <FlipFlopBox width={width} height={height} leftLabels={['S', 'R']} hasClock color={color} fillColor={fillColor} />;
}

export function DFFSymbol({ width = 64, height = 56, color = S, fillColor = F }) {
  return <FlipFlopBox width={width} height={height} leftLabels={['D']} hasClock color={color} fillColor={fillColor} />;
}

export function JKFFSymbol({ width = 64, height = 56, color = S, fillColor = F }) {
  return <FlipFlopBox width={width} height={height} leftLabels={['J', 'K']} hasClock color={color} fillColor={fillColor} />;
}

export function TFFSymbol({ width = 64, height = 56, color = S, fillColor = F }) {
  return <FlipFlopBox width={width} height={height} leftLabels={['T']} hasClock color={color} fillColor={fillColor} />;
}

// ──────────────────────────────────────────────
//  Other
// ──────────────────────────────────────────────

export function LabelSymbol({ width = 60, height = 40, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 40">
      <rect x="6" y="10" width="22" height="20" rx="2" fill="#1f2937" />
      <text x="17" y="24" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="600" fontFamily="'Inter', sans-serif">Text</text>
    </svg>
  );
}

// ──────────────────────────────────────────────
//  Map
// ──────────────────────────────────────────────

export const GATE_SYMBOLS = {
  AND: ANDSymbol,
  OR: ORSymbol,
  NOT: NOTSymbol,
  NAND: NANDSymbol,
  NOR: NORSymbol,
  XOR: XORSymbol,
  XNOR: XNORSymbol,
  BUFFER: BufferSymbol,
};
