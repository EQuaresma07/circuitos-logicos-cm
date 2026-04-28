import React from 'react';

// ── Ícones inline simples ──
const Icon = {
  trash: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M4 4l1 9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  clear: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 8h12M5 4h6M5 12h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  preset: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  logo: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12h2l1.5-3 1 6 1.5-3h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
};

export default function MenuBar({ onClear, onDelete, onPreset, hasSelection }) {
  return (
    <header className="menubar">
      {/* Linha 1: brand + menus */}
      <div className="menubar-top">
        <div className="brand">
          <span className="brand-icon">{Icon.logo}</span>
          <span className="brand-text">circuitos<span className="brand-accent">.cm</span></span>
        </div>
        <nav className="menu-items">
          <span className="menu-item disabled">Arquivo</span>
          <span className="menu-item disabled">Editar</span>
          <span className="menu-item disabled">Visualizar</span>
          <span className="menu-item disabled">Simular</span>
          <span className="menu-item disabled">Ajuda</span>
        </nav>
        <div className="menubar-spacer" />
        <span className="version-tag">v0.1 · motor preview</span>
      </div>

      {/* Linha 2: toolbar de ações */}
      <div className="toolbar">
        <button
          className="tool-btn danger"
          onClick={onDelete}
          disabled={!hasSelection}
          title="Excluir componente selecionado"
        >
          {Icon.trash}
          <span>Excluir</span>
        </button>
        <button
          className="tool-btn"
          onClick={onClear}
          title="Limpar canvas"
        >
          {Icon.clear}
          <span>Limpar</span>
        </button>

        <div className="toolbar-sep" />

        <span className="toolbar-label">Presets:</span>
        <button
          className="tool-btn preset"
          onClick={() => onPreset('half-adder')}
          title="Carregar Half Adder"
        >
          {Icon.preset}
          <span>Half Adder</span>
        </button>
        <button
          className="tool-btn preset"
          onClick={() => onPreset('sr-latch')}
          title="Carregar SR Latch"
        >
          {Icon.preset}
          <span>SR Latch</span>
        </button>
      </div>
    </header>
  );
}
