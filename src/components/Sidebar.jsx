import React, { useState } from 'react';
import {
  ANDSymbol, ORSymbol, NOTSymbol, NANDSymbol, NORSymbol,
  XORSymbol, XNORSymbol, BufferSymbol, TriStateSymbol,
  SwitchSymbol, PushButtonSymbol, HighSymbol, LowSymbol,
  PullUpSymbol, PullDownSymbol,
  LampSymbol, FourBitDigitSymbol, ClockSymbol,
  SRFFSymbol, DFFSymbol, JKFFSymbol, TFFSymbol,
  MuxSymbol, DemuxSymbol, AdderSymbol, RegisterSymbol,
  SchmittSymbol, ComparatorSymbol, BCDSymbol, SevenSegSymbol,
  LedMatrixSymbol, ROMSymbol,
  LabelSymbol,
} from './GateSymbols.jsx';

function PaletteItem({ type, label, children }) {
  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/x-component-type', type);
    e.dataTransfer.setData('text/plain', type);
  };
  return (
    <div
      className="palette-item"
      draggable
      onDragStart={handleDragStart}
      title={`Drag to canvas: ${label}`}
    >
      <div className="palette-item-icon">{children}</div>
      <div className="palette-item-label">{label}</div>
    </div>
  );
}

function Panel({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sidebar-panel">
      <button
        className="sidebar-panel-header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className={`chevron ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && <div className="sidebar-panel-body">{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Símbolos analógicos inline (SVG simples, mesmo estilo do canvas)
// ─────────────────────────────────────────────────────────────

function DCSourceSymbol({ width = 56, height = 38 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 40">
      <circle cx="30" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="22" y1="16" x2="38" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="25" y1="22" x2="35" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="26" x2="38" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function ACSourceSymbol({ width = 56, height = 38 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 40">
      <circle cx="30" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20,20 Q24,12 28,20 T36,20 T40,20"
        stroke="#f5d76e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function SquareWaveSymbol({ width = 56, height = 38 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 40">
      <circle cx="30" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20,26 L20,14 L30,14 L30,26 L40,26 L40,14"
        stroke="#f5d76e" strokeWidth="1.8" fill="none" strokeLinejoin="miter" />
    </svg>
  );
}

function ResistorSymbol({ width = 60, height = 32 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 32">
      <line x1="2" y1="16" x2="14" y2="16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14,16 L18,9 L22,23 L26,9 L30,23 L34,9 L38,23 L42,9 L46,16"
        stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
      <line x1="46" y1="16" x2="58" y2="16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function VoltmeterSymbol({ width = 56, height = 38 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 40">
      <rect x="8" y="6" width="44" height="28" rx="3" fill="#0f172a" stroke="currentColor" strokeWidth="1.4" />
      <rect x="12" y="10" width="36" height="16" rx="1.5" fill="#000" stroke="#1e293b" />
      <text x="30" y="22" textAnchor="middle" fill="#4caf50" fontSize="10" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace">0.00</text>
    </svg>
  );
}

function ScopeSymbol({ width = 60, height = 38 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 40">
      <rect x="6" y="6" width="48" height="28" rx="3" fill="#0f172a" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="10" width="40" height="20" fill="#000" stroke="#1e293b" />
      <path d="M12,20 Q17,14 22,20 T32,20 T42,20 T48,20"
        stroke="#22d3ee" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <line x1="10" y1="20" x2="50" y2="20" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Conteúdos das abas
// ─────────────────────────────────────────────────────────────

function DigitalTab() {
  return (
    <>
      <Panel title="Input Controls">
        <PaletteItem type="INPUT" label="Toggle Switch">
          <SwitchSymbol width={56} height={38} />
        </PaletteItem>
        <PaletteItem type="BUTTON" label="Push Button">
          <PushButtonSymbol width={56} height={38} />
        </PaletteItem>
        <PaletteItem type="CLOCK" label="Clock">
          <ClockSymbol width={56} height={38} />
        </PaletteItem>
        <PaletteItem type="HIGH" label="High Constant">
          <HighSymbol width={50} height={38} />
        </PaletteItem>
        <PaletteItem type="LOW" label="Low Constant">
          <LowSymbol width={50} height={38} />
        </PaletteItem>
      </Panel>

      <Panel title="Output Controls">
        <PaletteItem type="OUTPUT" label="Light Bulb">
          <LampSymbol width={44} height={50} />
        </PaletteItem>
        <PaletteItem type="DIGIT4" label="4-Bit Digit">
          <FourBitDigitSymbol width={56} height={48} />
        </PaletteItem>
        <PaletteItem type="SEG7" label="7-Segment">
          <SevenSegSymbol width={50} height={50} />
        </PaletteItem>
        <PaletteItem type="LEDMAT" label="LED Matrix 8×8">
          <LedMatrixSymbol width={50} height={50} />
        </PaletteItem>
      </Panel>

      <Panel title="Logic Gates">
        <PaletteItem type="BUFFER" label="Buffer">
          <BufferSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="NOT" label="NOT Gate">
          <NOTSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="SCHMITT" label="Schmitt Trigger">
          <SchmittSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="AND" label="AND Gate">
          <ANDSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="NAND" label="NAND Gate">
          <NANDSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="OR" label="OR Gate">
          <ORSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="NOR" label="NOR Gate">
          <NORSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="XOR" label="XOR Gate">
          <XORSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="XNOR" label="XNOR Gate">
          <XNORSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="TRISTATE" label="Tri-State">
          <TriStateSymbol width={60} height={42} />
        </PaletteItem>
      </Panel>

      <Panel title="Flip-Flops">
        <PaletteItem type="SR_FF" label="SR Flip-Flop">
          <SRFFSymbol width={56} height={48} />
        </PaletteItem>
        <PaletteItem type="D_FF" label="D Flip-Flop">
          <DFFSymbol width={56} height={48} />
        </PaletteItem>
        <PaletteItem type="JK_FF" label="JK Flip-Flop">
          <JKFFSymbol width={56} height={48} />
        </PaletteItem>
        <PaletteItem type="T_FF" label="T Flip-Flop">
          <TFFSymbol width={56} height={48} />
        </PaletteItem>
      </Panel>

      <Panel title="Abstraction">
        <PaletteItem type="MUX2" label="MUX 2:1">
          <MuxSymbol width={56} height={46} />
        </PaletteItem>
        <PaletteItem type="DEMUX2" label="DEMUX 1:2">
          <DemuxSymbol width={56} height={46} />
        </PaletteItem>
        <PaletteItem type="ADDER" label="Full Adder">
          <AdderSymbol width={56} height={46} />
        </PaletteItem>
        <PaletteItem type="REG4" label="Register 4-bit">
          <RegisterSymbol width={60} height={52} />
        </PaletteItem>
      </Panel>

      <Panel title="Arithmetic & Decoding">
        <PaletteItem type="CMP4" label="Comparator 4-bit">
          <ComparatorSymbol width={56} height={46} />
        </PaletteItem>
        <PaletteItem type="BCD7" label="BCD → 7-Seg">
          <BCDSymbol width={56} height={46} />
        </PaletteItem>
      </Panel>

      <Panel title="Memory">
        <PaletteItem type="ROM" label="ROM 16×8">
          <ROMSymbol width={56} height={46} />
        </PaletteItem>
      </Panel>

      <Panel title="Other">
        <PaletteItem type="LABEL" label="Label">
          <LabelSymbol width={50} height={36} />
        </PaletteItem>
        <PaletteItem type="PULLUP" label="Pull Up">
          <PullUpSymbol width={36} height={48} />
        </PaletteItem>
        <PaletteItem type="PULLDOWN" label="Pull Down">
          <PullDownSymbol width={36} height={48} />
        </PaletteItem>
      </Panel>
    </>
  );
}

function AnalogTab() {
  return (
    <>
      <Panel title="Fontes de Tensão">
        <PaletteItem type="DC_SOURCE" label="Fonte DC">
          <DCSourceSymbol width={56} height={38} />
        </PaletteItem>
        <PaletteItem type="AC_SOURCE" label="Fonte AC">
          <ACSourceSymbol width={56} height={38} />
        </PaletteItem>
        <PaletteItem type="SQUARE_SOURCE" label="Onda Quadrada">
          <SquareWaveSymbol width={56} height={38} />
        </PaletteItem>
      </Panel>

      <Panel title="Componentes Lineares">
        <PaletteItem type="RESISTOR" label="Resistor">
          <ResistorSymbol width={60} height={32} />
        </PaletteItem>
      </Panel>

      <Panel title="Instrumentos">
        <PaletteItem type="VOLTMETER" label="Voltímetro">
          <VoltmeterSymbol width={56} height={38} />
        </PaletteItem>
        <PaletteItem type="SCOPE" label="Osciloscópio">
          <ScopeSymbol width={60} height={38} />
        </PaletteItem>
      </Panel>

      <div className="sidebar-info-box">
        <strong>💡 Dica</strong>
        <span>
          Conecte uma fonte a um resistor + voltímetro para medir tensões.
          Pinos analógicos são <b style={{ color: '#f5a742' }}>laranja</b>;
          digitais são azuis.
        </span>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar com abas
// ─────────────────────────────────────────────────────────────

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState('digital');

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === 'digital' ? 'active' : ''}`}
          onClick={() => setActiveTab('digital')}
        >
          <span className="sidebar-tab-icon">⚡</span>
          Digital
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'analog' ? 'active' : ''}`}
          onClick={() => setActiveTab('analog')}
        >
          <span className="sidebar-tab-icon">∿</span>
          Analógico
        </button>
      </div>
      <div className="sidebar-content">
        {activeTab === 'digital' ? <DigitalTab /> : <AnalogTab />}
      </div>
    </aside>
  );
}
