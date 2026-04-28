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
    // fallback para alguns navegadores
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

// ── Painel colapsável ──
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
        <PaletteItem type="INPUT" label="Interruptor">
          <SwitchSymbol width={48} height={32} />
        </PaletteItem>
        <PaletteItem type="CLOCK" label="Relógio">
          <ClockSymbol width={48} height={32} />
        </PaletteItem>
      </Panel>

      <Panel title="Controles de saída">
        <PaletteItem type="OUTPUT" label="Lâmpada">
          <LampSymbol width={40} height={48} />
        </PaletteItem>
      </Panel>

      <Panel title="Portas lógicas">
        <PaletteItem type="NOT" label="NÃO (NOT)">
          <NOTSymbol width={56} height={32} />
        </PaletteItem>
        <PaletteItem type="AND" label="E (AND)">
          <ANDSymbol width={56} height={32} />
        </PaletteItem>
        <PaletteItem type="OR" label="OU (OR)">
          <ORSymbol width={56} height={32} />
        </PaletteItem>
        <PaletteItem type="NAND" label="NAND">
          <NANDSymbol width={56} height={32} />
        </PaletteItem>
        <PaletteItem type="NOR" label="NOR">
          <NORSymbol width={56} height={32} />
        </PaletteItem>
        <PaletteItem type="XOR" label="XOR">
          <XORSymbol width={56} height={32} />
        </PaletteItem>
        <PaletteItem type="XNOR" label="XNOR">
          <XNORSymbol width={56} height={32} />
        </PaletteItem>
      </Panel>
    </aside>
  );
}
