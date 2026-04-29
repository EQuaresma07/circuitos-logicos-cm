import React, { useState } from 'react';
import {
  ANDSymbol, ORSymbol, NOTSymbol, NANDSymbol, NORSymbol,
  XORSymbol, XNORSymbol, BufferSymbol, TriStateSymbol,
  SwitchSymbol, PushButtonSymbol, HighSymbol, LowSymbol,
  PullUpSymbol, PullDownSymbol,
  LampSymbol, FourBitDigitSymbol, ClockSymbol,
  SRFFSymbol, DFFSymbol, JKFFSymbol, TFFSymbol,
  MuxSymbol, DemuxSymbol, AdderSymbol, RegisterSymbol,
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

export default function Sidebar() {
  return (
    <aside className="sidebar">
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
      </Panel>

      <Panel title="Logic Gates">
        <PaletteItem type="BUFFER" label="Buffer">
          <BufferSymbol width={60} height={38} />
        </PaletteItem>
        <PaletteItem type="NOT" label="NOT Gate">
          <NOTSymbol width={60} height={38} />
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
    </aside>
  );
}
