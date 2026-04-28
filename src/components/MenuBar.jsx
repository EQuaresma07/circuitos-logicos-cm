import React from 'react';

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
  sun: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="3" x2="4.5" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11.5" y1="11.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="13" x2="4.5" y2="11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11.5" y1="4.5" x2="13" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  moon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3 5.5 5.5 0 1 0 13 9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
};

export default function MenuBar({
  onClear,
  onDelete,
  onPreset,
  onToggleDarkMode,
  darkMode,
  hasSelection,
  selectionCount,
}) {
  return (
    <header className="menubar">
      <div className="menubar-top">
        <div className="brand">
          <span className="brand-icon">{Icon.logo}</span>
          <span className="brand-text">circuitos<span className="brand-accent">.cm</span></span>
        </div>
        <nav className="menu-items">
          <span className="menu-item disabled">File</span>
          <span className="menu-item disabled">Edit</span>
          <span className="menu-item disabled">View</span>
          <span className="menu-item disabled">Simulate</span>
          <span className="menu-item disabled">Help</span>
        </nav>
        <div className="menubar-spacer" />
        <button
          className="theme-toggle"
          onClick={onToggleDarkMode}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle dark mode"
        >
          {darkMode ? Icon.sun : Icon.moon}
        </button>
        <span className="version-tag">v0.2 · engine preview</span>
      </div>

      <div className="toolbar">
        <button
          className="tool-btn danger"
          onClick={onDelete}
          disabled={!hasSelection}
          title={hasSelection ? `Delete ${selectionCount} selected` : 'Delete selected (Del)'}
        >
          {Icon.trash}
          <span>Delete{selectionCount > 1 ? ` (${selectionCount})` : ''}</span>
        </button>
        <button
          className="tool-btn"
          onClick={onClear}
          title="Clear canvas"
        >
          {Icon.clear}
          <span>Clear</span>
        </button>

        <div className="toolbar-sep" />

        <span className="toolbar-label">Presets:</span>
        <button
          className="tool-btn preset"
          onClick={() => onPreset('half-adder')}
          title="Load Half Adder"
        >
          {Icon.preset}
          <span>Half Adder</span>
        </button>
        <button
          className="tool-btn preset"
          onClick={() => onPreset('sr-latch')}
          title="Load SR Latch"
        >
          {Icon.preset}
          <span>SR Latch</span>
        </button>

        <div className="toolbar-spacer" />

        <span className="shortcut-hint">
          <kbd>Ctrl+A</kbd> all · <kbd>Ctrl+C</kbd>/<kbd>X</kbd>/<kbd>V</kbd> copy/cut/paste · <kbd>Del</kbd> delete · <kbd>Esc</kbd> cancel
        </span>
      </div>
    </header>
  );
}
