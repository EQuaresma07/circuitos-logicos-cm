// ════════════════════════════════════════════════════════════
//  Símbolos SVG das portas lógicas — estilo Logic.ly / IEEE
//  Exports idênticos ao original: canvas não é afetado.
// ════════════════════════════════════════════════════════════

import React from 'react';

const S = '#374151'; // stroke
const F = '#ffffff'; // fill

// ── AND ──
export function ANDSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="14" x2="18" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="30" x2="18" y2="30" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M 18 8 L 36 8 A 14 14 0 0 1 36 36 L 18 36 Z"
        fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round"
      />
    </svg>
  );
}

// ── OR ──
export function ORSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="15" x2="19" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="29" x2="19" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="52" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M 16 8 Q 26 22 16 36 Q 34 36 50 22 Q 34 8 16 8 Z"
        fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round"
      />
    </svg>
  );
}

// ── NOT ──
export function NOTSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="22" x2="16" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="57" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M 16 7 L 16 37 L 49 22 Z"
        fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round"
      />
      <circle cx="53" cy="22" r="4" fill={fillColor} stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

// ── NAND ──
export function NANDSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="14" x2="18" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="30" x2="18" y2="30" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="55" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M 18 8 L 36 8 A 14 14 0 0 1 36 36 L 18 36 Z"
        fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round"
      />
      <circle cx="51" cy="22" r="4" fill={fillColor} stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

// ── NOR ──
export function NORSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="15" x2="19" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="29" x2="19" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="55" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M 16 8 Q 26 22 16 36 Q 34 36 50 22 Q 34 8 16 8 Z"
        fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round"
      />
      <circle cx="54" cy="22" r="4" fill={fillColor} stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

// ── XOR ──
export function XORSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="15" x2="20" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="29" x2="20" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="52" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 13 8 Q 23 22 13 36" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M 18 8 Q 28 22 18 36 Q 36 36 52 22 Q 36 8 18 8 Z"
        fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round"
      />
    </svg>
  );
}

// ── XNOR ──
export function XNORSymbol({ width = 70, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 44">
      <line x1="6" y1="15" x2="20" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="29" x2="20" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="55" y1="22" x2="64" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 13 8 Q 23 22 13 36" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M 18 8 Q 28 22 18 36 Q 36 36 50 22 Q 36 8 18 8 Z"
        fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round"
      />
      <circle cx="54" cy="22" r="4" fill={fillColor} stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

// ════════════════════════════════════════════════════════════
//  I/O Symbols — estilo Logic.ly
// ════════════════════════════════════════════════════════════

export function SwitchSymbol({ width = 64, height = 44, on = false, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 64 44">
      <line x1="4" y1="22" x2="14" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="22" x2="60" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="22" r="3" fill={fillColor} stroke={color} strokeWidth="1.5" />
      <circle cx="50" cy="22" r="3" fill={fillColor} stroke={color} strokeWidth="1.5" />
      <line
        x1="14" y1="22"
        x2={on ? 50 : 44} y2={on ? 22 : 13}
        stroke={color} strokeWidth="2" strokeLinecap="round"
      />
      <circle cx="14" cy="22" r="2" fill={color} />
    </svg>
  );
}

export function LampSymbol({ width = 52, height = 58, on = false, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 52 58">
      <line x1="4" y1="20" x2="12" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="20" r="2.5" fill={fillColor} stroke={color} strokeWidth="1.5" />
      <circle
        cx="26" cy="20" r="14"
        fill={on ? '#fde047' : fillColor}
        stroke={color} strokeWidth="1.8"
      />
      <line x1="20" y1="14" x2="32" y2="26" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <line x1="32" y1="14" x2="20" y2="26" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <rect x="19" y="34" width="14" height="4" rx="1" fill={fillColor} stroke={color} strokeWidth="1.5" />
      <rect x="19" y="38" width="14" height="4" rx="1" fill={fillColor} stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function ClockSymbol({ width = 64, height = 44, color = S, fillColor = F }) {
  return (
    <svg width={width} height={height} viewBox="0 0 64 44">
      <line x1="4" y1="22" x2="12" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="52" y1="22" x2="60" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="12" y="8" width="40" height="28" rx="2" fill={fillColor} stroke={color} strokeWidth="1.8" />
      <polyline
        points="16,30 21,30 21,18 27,18 27,30 33,30 33,18 39,18 39,30 48,30"
        fill="none" stroke={color} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export const GATE_SYMBOLS = {
  AND: ANDSymbol,
  OR: ORSymbol,
  NOT: NOTSymbol,
  NAND: NANDSymbol,
  NOR: NORSymbol,
  XOR: XORSymbol,
  XNOR: XNORSymbol,
};
