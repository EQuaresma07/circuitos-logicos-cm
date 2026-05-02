import React, { useState, useRef, useEffect } from 'react';

const Icon = {
  // Logo
  logo: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M8 12h2l1.5-3 1 6 1.5-3h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>,

  // ── Grupo 1: Documento ──
  newDoc: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="#f5d76e" fillOpacity="0.9"/><path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="#e8c14e"/></svg>,
  openDoc: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="#f5d76e" fillOpacity="0.85"/></svg>,
  saveDoc: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="#7fb3e8" fillOpacity="0.85"/><rect x="7" y="13" width="10" height="7" fill="white" stroke="currentColor" strokeWidth="1.2"/><rect x="7" y="3" width="8" height="5" fill="#3a78b5" stroke="currentColor" strokeWidth="1.2"/></svg>,
  printDoc: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9V3h12v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><rect x="3" y="9" width="18" height="9" rx="1" fill="#9aa5b1" stroke="currentColor" strokeWidth="1.6"/><rect x="6" y="14" width="12" height="7" fill="white" stroke="currentColor" strokeWidth="1.6"/></svg>,

  // ── Grupo 2: Undo/Redo ──
  undo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 14l-5-5 5-5" stroke="#4caf50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 9h10a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6h-3" stroke="#4caf50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  redo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 14l5-5-5-5" stroke="#4caf50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 9H10a6 6 0 0 0-6 6v0a6 6 0 0 0 6 6h3" stroke="#4caf50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,

  // ── Grupo 3: Ferramentas ──
  selectTool: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 3l4 16 3-7 7-3L5 3z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  panTool: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3v6M12 21v-6M3 12h6M21 12h-6M12 3l-2 2M12 3l2 2M12 21l-2-2M12 21l2-2M3 12l2-2M3 12l2 2M21 12l-2-2M21 12l-2 2" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,

  // ── Grupo 4: Clipboard ──
  cut: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.6" fill="none"/><circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M9 8l11 11M9 16L20 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  copy: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="8" y="3" width="12" height="14" rx="1" fill="#d4a574" stroke="currentColor" strokeWidth="1.4"/><rect x="4" y="7" width="12" height="14" rx="1" fill="#e8c89a" stroke="currentColor" strokeWidth="1.4"/></svg>,
  paste: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="16" rx="1" fill="#d4a574" stroke="currentColor" strokeWidth="1.4"/><rect x="8" y="3" width="8" height="4" rx="1" fill="#9aa5b1" stroke="currentColor" strokeWidth="1.4"/><rect x="7" y="11" width="10" height="7" fill="white" stroke="currentColor" strokeWidth="1.2"/></svg>,

  // ── Grupo 5: Delete / Rotação / IC ──
  delete: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#d63031" stroke="#a32626" strokeWidth="1.4"/><rect x="6" y="11" width="12" height="2.5" fill="white" rx="0.5"/></svg>,
  rotateCW: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 1 1-3-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/><path d="M21 4v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  rotateCCW: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/><path d="M3 4v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  createIC: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="12" height="12" rx="1" fill="#2c3e50" stroke="currentColor" strokeWidth="1.4"/><path d="M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3" stroke="currentColor" strokeWidth="1.4"/><circle cx="9" cy="9" r="0.8" fill="#f5d76e"/></svg>,

  // ── Grupo 6: Truth Table ──
  truthTable: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="1" stroke="currentColor" strokeWidth="1.4" fill="white"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.4"/><line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="1.4"/><line x1="15" y1="4" x2="15" y2="20" stroke="currentColor" strokeWidth="1.4"/><line x1="3" y1="14" x2="21" y2="14" stroke="currentColor" strokeWidth="1.4"/></svg>,

  // ── Theme ──
  sun: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" /><line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  moon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 9.5A5.5 5.5 0 0 1 6.5 3 5.5 5.5 0 1 0 13 9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M4 4l1 9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
};

// ── Dropdown menu item ──
function MenuItem({ label, onClick, disabled, shortcut, divider, checked, comingSoon }) {
  if (divider) return <div className="dropdown-divider" />;
  const isDisabled = disabled || comingSoon;
  return (
    <button
      className={`dropdown-item ${isDisabled ? 'disabled' : ''} ${checked ? 'checked' : ''} ${comingSoon ? 'coming-soon' : ''}`}
      onClick={(e) => { if (!isDisabled) onClick?.(e); }}
      disabled={isDisabled}
      title={comingSoon ? `${label} (em breve)` : ''}
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
  onSelectAll, onSelectNone,
  onZoomIn, onZoomOut, onPanCenter,
  onToggleSnapGrid, snapGrid,
  onToggleShowGrid, showGrid,
  onSelectTool, onPanTool, currentTool,
  onToggleObjectPicker, objectPickerVisible,
  onPauseSimulation, simulationPaused,
  onAdvanceStep, onResetSimulation,
  onToggleAnalyzer, analyzerVisible,
  simulationFreq, onChangeFreq,
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
          <Dropdown title="Arquivo" isOpen={openMenu === 'file'} onOpen={open('file')} onClose={closeMenu}>
            <MenuItem label="Novo" onClick={wrap(onNew)} shortcut="Ctrl+N" />
            <MenuItem label="Abrir..." onClick={wrap(onOpen)} shortcut="Ctrl+O" />
            <MenuItem label="Salvar" onClick={wrap(onSave)} shortcut="Ctrl+S" />
            <MenuItem label="Salvar Como..." onClick={wrap(onSaveAs)} shortcut="Ctrl+Shift+S" />
            <MenuItem divider />
            <MenuItem label="Importar Biblioteca de CIs..." comingSoon />
            <MenuItem label="Exportar Biblioteca de CIs..." comingSoon />
            <MenuItem divider />
            <MenuItem label="Imprimir..." shortcut="Ctrl+P" comingSoon />
          </Dropdown>

          <Dropdown title="Editar" isOpen={openMenu === 'edit'} onOpen={open('edit')} onClose={closeMenu}>
            <MenuItem label="Desfazer" onClick={wrap(onUndo)} disabled={!canUndo} shortcut="Ctrl+Z" />
            <MenuItem label="Refazer" onClick={wrap(onRedo)} disabled={!canRedo} shortcut="Ctrl+Y" />
            <MenuItem divider />
            <MenuItem label="Recortar" onClick={wrap(onCut)} disabled={!hasSelection} shortcut="Ctrl+X" />
            <MenuItem label="Copiar" onClick={wrap(onCopy)} disabled={!hasSelection} shortcut="Ctrl+C" />
            <MenuItem label="Colar" onClick={wrap(onPaste)} shortcut="Ctrl+V" />
            <MenuItem divider />
            <MenuItem label="Rotacionar Sentido Horário" comingSoon />
            <MenuItem label="Rotacionar Anti-Horário" comingSoon />
            <MenuItem label="Excluir" onClick={wrap(onDelete)} disabled={!hasSelection} shortcut="Del" />
            <MenuItem divider />
            <MenuItem label="Criar Circuito Integrado..." comingSoon />
            <MenuItem label="Tabela Verdade..." comingSoon />
            <MenuItem divider />
            <MenuItem label="Selecionar Tudo" onClick={wrap(onSelectAll)} shortcut="Ctrl+A" />
            <MenuItem label="Limpar Seleção" onClick={wrap(onSelectNone)} shortcut="Ctrl+D" />
            <MenuItem divider />
            <MenuItem label="Configurações do Documento..." comingSoon />
            <MenuItem label="Configurações do Aplicativo..." comingSoon />
          </Dropdown>

          <Dropdown title="Visualizar" isOpen={openMenu === 'view'} onOpen={open('view')} onClose={closeMenu}>
            <MenuItem label="Aumentar Zoom" onClick={wrap(onZoomIn)} shortcut="Ctrl++" />
            <MenuItem label="Diminuir Zoom" onClick={wrap(onZoomOut)} shortcut="Ctrl+-" />
            <MenuItem label="Centralizar" onClick={wrap(onPanCenter)} shortcut="Ctrl+0" />
            <MenuItem divider />
            <MenuItem label="Alinhar à Grade" onClick={wrap(onToggleSnapGrid)} checked={snapGrid} />
            <MenuItem label="Mostrar Grade" onClick={wrap(onToggleShowGrid)} checked={showGrid} />
          </Dropdown>

          <Dropdown title="Ferramentas" isOpen={openMenu === 'tools'} onOpen={open('tools')} onClose={closeMenu}>
            <MenuItem label="Ferramenta de Seleção" onClick={wrap(onSelectTool)} checked={currentTool === 'select'} />
            <MenuItem label="Ferramenta de Pan" onClick={wrap(onPanTool)} checked={currentTool === 'pan'} />
            <MenuItem divider />
            <MenuItem label="Mostrar Seletor de Objetos" onClick={wrap(onToggleObjectPicker)} checked={objectPickerVisible} />
            <MenuItem label="Analisador de Lógica" onClick={wrap(onToggleAnalyzer)} checked={analyzerVisible} />
          </Dropdown>

          <Dropdown title="Simular" isOpen={openMenu === 'simulate'} onOpen={open('simulate')} onClose={closeMenu}>
            <MenuItem label={simulationPaused ? 'Retomar Simulação' : 'Pausar Simulação'} onClick={wrap(onPauseSimulation)} shortcut="Space" />
            <MenuItem label="Avançar Um Passo" onClick={wrap(onAdvanceStep)} disabled={!simulationPaused} shortcut="F10" />
            <MenuItem divider />
            <MenuItem label="Reiniciar Simulação" onClick={wrap(onResetSimulation)} />
          </Dropdown>

          <Dropdown title="Ajuda" isOpen={openMenu === 'help'} onOpen={open('help')} onClose={closeMenu}>
            <MenuItem label="Conteúdo..." comingSoon />
            <MenuItem label="Exemplos..." comingSoon />
            <MenuItem divider />
            <MenuItem label="Reportar um Bug..." comingSoon />
            <MenuItem label="Sobre circuitos.cm..." onClick={wrap(onShowAbout)} />
            <MenuItem divider />
            <MenuItem label="Comprar Logic.ly..." comingSoon />
          </Dropdown>
        </nav>

        <div className="menubar-spacer" />
        <button className="theme-toggle" onClick={onToggleDarkMode} title={darkMode ? 'Light mode' : 'Dark mode'}>
          {darkMode ? Icon.sun : Icon.moon}
        </button>
        <span className="version-tag">v0.3 · engine preview</span>
      </div>

      {/* ─────────────── Toolbar de ícones (estilo Logic.ly) ─────────────── */}
      <div className="toolbar-icons">
        {/* Grupo 1: Documento */}
        <div className="toolbar-group">
          <button className="toolbar-icon-btn" onClick={onNew} title="Novo documento" aria-label="Novo">{Icon.newDoc}</button>
          <button className="toolbar-icon-btn" onClick={onOpen} title="Abrir documento" aria-label="Abrir">{Icon.openDoc}</button>
          <button className="toolbar-icon-btn" onClick={onSave} title="Salvar documento" aria-label="Salvar">{Icon.saveDoc}</button>
          <button className="toolbar-icon-btn coming-soon" title="Imprimir documento (em breve)" disabled aria-label="Imprimir">{Icon.printDoc}</button>
        </div>

        <div className="toolbar-divider" />

        {/* Grupo 2: Undo/Redo */}
        <div className="toolbar-group">
          <button className="toolbar-icon-btn" onClick={onUndo} disabled={!canUndo} title="Desfazer" aria-label="Desfazer">{Icon.undo}</button>
          <button className="toolbar-icon-btn" onClick={onRedo} disabled={!canRedo} title="Refazer" aria-label="Refazer">{Icon.redo}</button>
        </div>

        <div className="toolbar-divider" />

        {/* Grupo 3: Ferramentas */}
        <div className="toolbar-group">
          <button
            className={`toolbar-icon-btn ${currentTool === 'select' ? 'active' : ''}`}
            onClick={onSelectTool}
            title="Ferramenta de Seleção"
            aria-label="Seleção"
          >
            {Icon.selectTool}
          </button>
          <button
            className={`toolbar-icon-btn ${currentTool === 'pan' ? 'active' : ''}`}
            onClick={onPanTool}
            title="Ferramenta de Pan"
            aria-label="Pan"
          >
            {Icon.panTool}
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Grupo 4: Clipboard */}
        <div className="toolbar-group">
          <button className="toolbar-icon-btn" onClick={onCut} disabled={!hasSelection} title="Recortar" aria-label="Recortar">{Icon.cut}</button>
          <button className="toolbar-icon-btn" onClick={onCopy} disabled={!hasSelection} title="Copiar" aria-label="Copiar">{Icon.copy}</button>
          <button className="toolbar-icon-btn" onClick={onPaste} title="Colar" aria-label="Colar">{Icon.paste}</button>
        </div>

        <div className="toolbar-divider" />

        {/* Grupo 5: Delete / Rotação (desativada) / IC */}
        <div className="toolbar-group">
          <button
            className="toolbar-icon-btn danger"
            onClick={onDelete}
            disabled={!hasSelection}
            title={hasSelection ? `Excluir seleção${selectionCount > 1 ? ` (${selectionCount})` : ''}` : 'Excluir seleção'}
            aria-label="Excluir"
          >
            {Icon.delete}
          </button>
          <button className="toolbar-icon-btn coming-soon" title="Rotacionar Anti-Horário (em breve)" disabled aria-label="Rotacionar">{Icon.rotateCCW}</button>
          <button className="toolbar-icon-btn coming-soon" title="Rotacionar Sentido Horário (em breve)" disabled aria-label="Rotacionar">{Icon.rotateCW}</button>
          <button className="toolbar-icon-btn coming-soon" title="Criar Circuito Integrado (em breve)" disabled aria-label="Criar CI">{Icon.createIC}</button>
        </div>

        <div className="toolbar-divider" />

        {/* Grupo 6: Truth Table */}
        <div className="toolbar-group">
          <button className="toolbar-icon-btn coming-soon" title="Tabela Verdade (em breve)" disabled aria-label="Tabela Verdade">{Icon.truthTable}</button>
        </div>

        <div className="toolbar-spacer" />

        {/* Indicador de simulação à direita */}
        {simulationPaused && (
          <span className="sim-indicator paused">⏸ Pausado</span>
        )}
      </div>
    </header>
  );
}
