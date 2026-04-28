import React, { useState } from 'react';
import {
  ANDSymbol, ORSymbol, NOTSymbol, NANDSymbol, NORSymbol,
  XORSymbol, XNORSymbol, SwitchSymbol, LampSymbol, ClockSymbol,
} from './GateSymbols.jsx';

// ── Item arrastável ──
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
      title={`Arraste para o canvas: ${label}`}
    >
      <div className="palette-item-icon">{children}</div>
      <div className="palette-item-label">{label}</div>
    </div>
  );
}

// ── Painel colapsável — chevron azul estilo Logic.ly ──
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

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Panel title="Controles de entrada">
        <PaletteItem type="INPUT" label="Interruptor de alternância">
          <SwitchSymbol width={56} height={38} />
        </PaletteItem>
        <PaletteItem type="CLOCK" label="Relógio">
          <ClockSymbol width={56} height={38} />
        </PaletteItem>
      </Panel>

      <Panel title="Controles de saída">
        <PaletteItem type="OUTPUT" label="Lâmpada elétrica">
          <LampSymbol width={44} height={50} />
        </PaletteItem>
      </Panel>

      <Panel title="Portas lógicas">
        <PaletteItem type="NOT" label="NÃO Portão">
          <NOTSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="AND" label="E Portão">
          <ANDSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="OR" label="Portão OU">
          <ORSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="NAND" label="Porta NAND">
          <NANDSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="NOR" label="Portão NOR">
          <NORSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="XOR" label="Porta XOR">
          <XORSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="XNOR" label="Portão XNOR">
          <XNORSymbol width={60} height={38} />
        </PaletteItem>
      </Panel>
    </aside>
  );
}
