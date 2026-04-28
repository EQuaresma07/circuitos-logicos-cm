// ════════════════════════════════════════════════════════════
//  Símbolos SVG das portas lógicas (estilo IEEE/ANSI)
//  Cada função desenha o corpo da porta dentro de um viewBox
//  fornecido. Usado tanto na sidebar quanto no canvas.
// ════════════════════════════════════════════════════════════

import React from 'react';

// Helpers: cores recebidas como props para reutilização
const stroke = '#1f2937';
const fill = '#fafafa';

// Cada componente recebe { width, height, color? }
// Desenha em viewBox 80x40 e escala via SVG

export function ANDSymbol({ width = 80, height = 40, color = stroke, fillColor = fill }) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 40" style={{ overflow: 'visible' }}>
      <path
        d="M 5 5 L 35 5 A 20 20 0 0 1 35 35 L 5 35 Z"
        fill={fillColor}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ORSymbol({ width = 80, height = 40, color = stroke, fillColor = fill }) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 40" style={{ overflow: 'visible' }}>
      <path
        d="M 5 5 Q 25 20 5 35 Q 35 35 55 20 Q 35 5 5 5 Z"
        fill={fillColor}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NOTSymbol({ width = 80, height = 40, color = stroke, fillColor = fill }) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 40" style={{ overflow: 'visible' }}>
      <path
        d="M 5 5 L 5 35 L 45 20 Z"
        fill={fillColor}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="20" r="4" fill={fillColor} stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function NANDSymbol({ width = 80, height = 40, color = stroke, fillColor = fill }) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 40" style={{ overflow: 'visible' }}>
      <path
        d="M 5 5 L 35 5 A 20 20 0 0 1 35 35 L 5 35 Z"
        fill={fillColor}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="20" r="4" fill={fillColor} stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function NORSymbol({ width = 80, height = 40, color = stroke, fillColor = fill }) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 40" style={{ overflow: 'visible' }}>
      <path
        d="M 5 5 Q 25 20 5 35 Q 35 35 55 20 Q 35 5 5 5 Z"
        fill={fillColor}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="20" r="4" fill={fillColor} stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function XORSymbol({ width = 80, height = 40, color = stroke, fillColor = fill }) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 40" style={{ overflow: 'visible' }}>
      <path
        d="M 0 5 Q 20 20 0 35"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M 8 5 Q 28 20 8 35 Q 38 35 58 20 Q 38 5 8 5 Z"
        fill={fillColor}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function XNORSymbol({ width = 80, height = 40, color = stroke, fillColor = fill }) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 40" style={{ overflow: 'visible' }}>
      <path
        d="M 0 5 Q 20 20 0 35"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M 8 5 Q 28 20 8 35 Q 38 35 58 20 Q 38 5 8 5 Z"
        fill={fillColor}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="63" cy="20" r="4" fill={fillColor} stroke={color} strokeWidth="2" />
    </svg>
  );
}

// ── Símbolos de I/O ──

export function SwitchSymbol({ width = 60, height = 40, on = false, color = stroke, fillColor = fill }) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 40">
      <circle cx="15" cy="20" r="6" fill={fillColor} stroke={color} strokeWidth="2" />
      <circle cx="45" cy="20" r="6" fill={fillColor} stroke={color} strokeWidth="2" />
      <line
        x1="15"
        y1="20"
        x2={on ? 45 : 38}
        y2={on ? 20 : 8}
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}

export function LampSymbol({ width = 60, height = 60, on = false, color = stroke, fillColor = fill }) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 60">
      <circle
        cx="30"
        cy="25"
        r="15"
        fill={on ? '#fde047' : fillColor}
        stroke={color}
        strokeWidth="2"
      />
      {on && (
        <>
          <line x1="30" y1="3" x2="30" y2="8" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="13" x2="46" y2="16" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
          <line x1="14" y1="16" x2="10" y2="13" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      <line x1="22" y1="40" x2="22" y2="48" stroke={color} strokeWidth="2" />
      <line x1="38" y1="40" x2="38" y2="48" stroke={color} strokeWidth="2" />
      <line x1="22" y1="44" x2="38" y2="44" stroke={color} strokeWidth="2" />
      <line x1="22" y1="48" x2="38" y2="48" stroke={color} strokeWidth="2" />
      <path d="M 25 50 L 35 50 L 33 55 L 27 55 Z" fill={color} stroke={color} strokeWidth="1" />
    </svg>
  );
}

export function ClockSymbol({ width = 60, height = 40, color = stroke, fillColor = fill }) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 40">
      <rect x="5" y="5" width="50" height="30" fill={fillColor} stroke={color} strokeWidth="2" rx="2" />
      <polyline
        points="10,28 15,28 15,15 25,15 25,28 35,28 35,15 45,15 45,28 50,28"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}

// Mapa para uso fácil
export const GATE_SYMBOLS = {
  AND: ANDSymbol,
  OR: ORSymbol,
  NOT: NOTSymbol,
  NAND: NANDSymbol,
  NOR: NORSymbol,
  XOR: XORSymbol,
  XNOR: XNORSymbol,
};
