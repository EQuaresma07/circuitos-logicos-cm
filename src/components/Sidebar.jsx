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
      title={`Drag to canvas: ${label}`}
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
      <Panel title="Input Controls">
        <PaletteItem type="INPUT" label="Toggle Switch">
          <SwitchSymbol width={56} height={38} />
        </PaletteItem>
        <PaletteItem type="CLOCK" label="Clock">
          <ClockSymbol width={56} height={38} />
        </PaletteItem>
      </Panel>

      <Panel title="Output Controls">
        <PaletteItem type="OUTPUT" label="Light Bulb">
          <LampSymbol width={44} height={50} />
        </PaletteItem>
      </Panel>

      <Panel title="Logic Gates">
        <PaletteItem type="NOT" label="NOT Gate">
          <NOTSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="AND" label="AND Gate">
          <ANDSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="OR" label="OR Gate">
          <ORSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="NAND" label="NAND Gate">
          <NANDSymbol width={60} height={38} />
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
      </Panel>
    </aside>
  );
}
