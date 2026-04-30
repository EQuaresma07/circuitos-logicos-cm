import React from 'react';

export default function AboutModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">circuitos<span className="brand-accent">.cm</span></h2>
        <p className="modal-version">Version 0.3 · Engine Preview</p>
        <p className="modal-text">
          A logic circuit simulator built with React + Vite, inspired by Logic.ly.
        </p>
        <ul className="modal-list">
          <li>21 component types: gates, flip-flops, MUX/DEMUX, full adder, 4-bit register</li>
          <li>Three-state propagation (HIGH / LOW / HIGH-Z)</li>
          <li>Pull Up/Down with priority resolution</li>
          <li>Edge-triggered flip-flops</li>
          <li>Multi-selection, copy/paste, undo/redo, rotation</li>
        </ul>
        <p className="modal-footer">Open source · Educational use</p>
      </div>
    </div>
  );
}
