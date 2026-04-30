import React, { useState, useRef, useEffect } from 'react';

const Icon = {
  trash: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M4 4l1 9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  logo: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M8 12h2l1.5-3 1 6 1.5-3h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>,
  sun: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" /><line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  moon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 9.5A5.5 5.5 0 0 1 6.5 3 5.5 5.5 0 1 0 13 9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
};

// ── Dropdown menu item ──
function MenuItem({ label, onClick, disabled, shortcut, divider, checked }) {
  if (divider) return <div className="dropdown-divider" />;
  return (
    <button
      className={`dropdown-item ${disabled ? 'disabled' : ''} ${checked ? 'checked' : ''}`}
      onClick={(e) => { if (!disabled) onClick?.(e); }}
      disabled={disabled}
    >
      <span className="dropdown-check">{checked ? '✓' : ''}</span>
      <span className="dropdown-label">{label}</span>
      {shortcut && <span className="dropdown-shortcut">{shortcut}</span>}
    </button>
  );
}

// ── Dropdown ──
function Dropdown({ title, isOpen, onOpen, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  return (
    <div className="menu-dropdown" ref={ref}>
      <button
        className={`menu-item ${isOpen ? 'open' : ''}`}
        onMouseDown={(e) => { e.preventDefault(); isOpen ? onClose() : onOpen(); }}
      >
        {title}
      </button>
      {isOpen && (
        <div className="dropdown-panel" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function MenuBar({
  // Actions
  onNew, onOpen, onSave, onSaveAs,
  onUndo, onRedo, canUndo, canRedo,
  onCut, onCopy, onPaste, onDelete,
  onRotateCW, onRotateCCW,
  onSelectAll, onSelectNone,
  onZoomIn, onZoomOut, onPanCenter,
  onToggleSnapGrid, snapGrid,
  onToggleShowGrid, showGrid,
  onSelectTool, onPanTool, currentTool,
  onToggleObjectPicker, objectPickerVisible,
  onPauseSimulation, simulationPaused,
  onAdvanceStep, onResetSimulation,
  onShowAbout,
  // Theme
  onToggleDarkMode, darkMode,
  // Selection state
  hasSelection, selectionCount,
}) {
  const [openMenu, setOpenMenu] = useState(null);

  const closeMenu = () => setOpenMenu(null);
  const open = (name) => () => setOpenMenu(name);

  // Helper: cria handler que executa ação + fecha menu
  const wrap = (fn) => () => { fn?.(); closeMenu(); };

  return (
    <header className="menubar">
      <div className="menubar-top">
        <div className="brand">
          <span className="brand-icon">{Icon.logo}</span>
          <span className="brand-text">circuitos<span className="brand-accent">.cm</span></span>
        </div>

        <nav className="menu-items">
          <Dropdown title="File" isOpen={openMenu === 'file'} onOpen={open('file')} onClose={closeMenu}>
            <MenuItem label="New" onClick={wrap(onNew)} shortcut="Ctrl+N" />
            <MenuItem label="Open..." onClick={wrap(onOpen)} shortcut="Ctrl+O" />
            <MenuItem label="Save" onClick={wrap(onSave)} shortcut="Ctrl+S" />
            <MenuItem label="Save As..." onClick={wrap(onSaveAs)} shortcut="Ctrl+Shift+S" />
            <MenuItem divider />
            <MenuItem label="Import Integrated Circuit Library..." disabled />
            <MenuItem label="Export Integrated Circuit Library..." disabled />
            <MenuItem divider />
            <MenuItem label="Print..." disabled shortcut="Ctrl+P" />
          </Dropdown>

          <Dropdown title="Edit" isOpen={openMenu === 'edit'} onOpen={open('edit')} onClose={closeMenu}>
            <MenuItem label="Undo" onClick={wrap(onUndo)} disabled={!canUndo} shortcut="Ctrl+Z" />
            <MenuItem label="Redo" onClick={wrap(onRedo)} disabled={!canRedo} shortcut="Ctrl+Y" />
            <MenuItem divider />
            <MenuItem label="Cut" onClick={wrap(onCut)} disabled={!hasSelection} shortcut="Ctrl+X" />
            <MenuItem label="Copy" onClick={wrap(onCopy)} disabled={!hasSelection} shortcut="Ctrl+C" />
            <MenuItem label="Paste" onClick={wrap(onPaste)} shortcut="Ctrl+V" />
            <MenuItem divider />
            <MenuItem label="Rotate Clockwise" onClick={wrap(onRotateCW)} disabled={!hasSelection} shortcut="Ctrl+R" />
            <MenuItem label="Rotate Counter-Clockwise" onClick={wrap(onRotateCCW)} disabled={!hasSelection} shortcut="Ctrl+Shift+R" />
            <MenuItem label="Delete" onClick={wrap(onDelete)} disabled={!hasSelection} shortcut="Del" />
            <MenuItem divider />
            <MenuItem label="Create Integrated Circuit..." disabled />
            <MenuItem label="Truth Table..." disabled />
            <MenuItem divider />
            <MenuItem label="Select All" onClick={wrap(onSelectAll)} shortcut="Ctrl+A" />
            <MenuItem label="Select None" onClick={wrap(onSelectNone)} shortcut="Ctrl+D" />
            <MenuItem divider />
            <MenuItem label="Document Settings..." disabled />
            <MenuItem label="Application Settings..." disabled />
          </Dropdown>

          <Dropdown title="View" isOpen={openMenu === 'view'} onOpen={open('view')} onClose={closeMenu}>
            <MenuItem label="Zoom In" onClick={wrap(onZoomIn)} shortcut="Ctrl++" />
            <MenuItem label="Zoom Out" onClick={wrap(onZoomOut)} shortcut="Ctrl+-" />
            <MenuItem label="Pan to Center" onClick={wrap(onPanCenter)} shortcut="Ctrl+0" />
            <MenuItem divider />
            <MenuItem label="Snap to Grid" onClick={wrap(onToggleSnapGrid)} checked={snapGrid} />
            <MenuItem label="Show Grid" onClick={wrap(onToggleShowGrid)} checked={showGrid} />
          </Dropdown>

          <Dropdown title="Tools" isOpen={openMenu === 'tools'} onOpen={open('tools')} onClose={closeMenu}>
            <MenuItem label="Select Tool" onClick={wrap(onSelectTool)} checked={currentTool === 'select'} />
            <MenuItem label="Pan Tool" onClick={wrap(onPanTool)} checked={currentTool === 'pan'} />
            <MenuItem divider />
            <MenuItem label="Show Object Picker" onClick={wrap(onToggleObjectPicker)} checked={objectPickerVisible} />
          </Dropdown>

          <Dropdown title="Simulate" isOpen={openMenu === 'simulate'} onOpen={open('simulate')} onClose={closeMenu}>
            <MenuItem label={simulationPaused ? 'Resume Simulation' : 'Pause Simulation'} onClick={wrap(onPauseSimulation)} shortcut="Space" />
            <MenuItem label="Advance Simulation One Step" onClick={wrap(onAdvanceStep)} disabled={!simulationPaused} shortcut="F10" />
            <MenuItem divider />
            <MenuItem label="Reset Simulation" onClick={wrap(onResetSimulation)} />
          </Dropdown>

          <Dropdown title="Help" isOpen={openMenu === 'help'} onOpen={open('help')} onClose={closeMenu}>
            <MenuItem label="Contents..." disabled />
            <MenuItem label="Samples..." disabled />
            <MenuItem divider />
            <MenuItem label="Report a Bug..." disabled />
            <MenuItem label="About circuitos.cm..." onClick={wrap(onShowAbout)} />
            <MenuItem divider />
            <MenuItem label="Purchase Logic.ly..." disabled />
          </Dropdown>
        </nav>

        <div className="menubar-spacer" />
        <button className="theme-toggle" onClick={onToggleDarkMode} title={darkMode ? 'Light mode' : 'Dark mode'}>
          {darkMode ? Icon.sun : Icon.moon}
        </button>
        <span className="version-tag">v0.3 · engine preview</span>
      </div>

      {/* Toolbar de status compacta */}
      <div className="toolbar">
        <span className="toolbar-label">Tool:</span>
        <button
          className={`tool-btn ${currentTool === 'select' ? 'active' : ''}`}
          onClick={onSelectTool}
          title="Select Tool (V)"
        >
          <span>↖ Select</span>
        </button>
        <button
          className={`tool-btn ${currentTool === 'pan' ? 'active' : ''}`}
          onClick={onPanTool}
          title="Pan Tool (H)"
        >
          <span>✋ Pan</span>
        </button>

        <div className="toolbar-sep" />

        <button
          className={`tool-btn ${simulationPaused ? 'paused' : ''}`}
          onClick={onPauseSimulation}
          title="Pause/Resume (Space)"
        >
          <span>{simulationPaused ? '▶ Resume' : '⏸ Pause'}</span>
        </button>
        {simulationPaused && (
          <button className="tool-btn" onClick={onAdvanceStep} title="Step (F10)">
            <span>⏭ Step</span>
          </button>
        )}

        <div className="toolbar-sep" />

        <button className="tool-btn danger" onClick={onDelete} disabled={!hasSelection}>
          {Icon.trash}<span>Delete{selectionCount > 1 ? ` (${selectionCount})` : ''}</span>
        </button>

        <div className="toolbar-spacer" />

        <span className="shortcut-hint">
          <kbd>Ctrl+Z</kbd>/<kbd>Y</kbd> undo · <kbd>Ctrl+R</kbd> rotate · <kbd>Space</kbd> pause
        </span>
      </div>
    </header>
  );
}
