import React, { useEffect, useRef } from 'react';

function Item({ label, onClick, disabled, danger, divider }) {
  if (divider) return <div className="ctx-divider" />;
  return (
    <button
      className={`ctx-item ${disabled ? 'disabled' : ''} ${danger ? 'danger' : ''}`}
      onClick={(e) => { if (!disabled) { e.stopPropagation(); onClick?.(); } }}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export default function ContextMenu({ x, y, type, targetId, hasSelection, selectionCount, onClose, actions }) {
  const ref = useRef(null);

  // Fechar ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const keyHandler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', handler);
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('mousedown', handler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  // Ajustar posição para não sair da tela
  const menuW = 200, menuH = 260;
  const cx = Math.min(x, window.innerWidth - menuW - 8);
  const cy = Math.min(y, window.innerHeight - menuH - 8);

  const wrap = (fn) => () => { fn?.(); onClose(); };

  return (
    <div ref={ref} className="ctx-menu" style={{ left: cx, top: cy }}
      onContextMenu={(e) => e.preventDefault()}>

      {type === 'comp' && (
        <>
          <Item label="Cut" shortcut="Ctrl+X" onClick={wrap(actions.cut)} disabled={!hasSelection} />
          <Item label="Copy" shortcut="Ctrl+C" onClick={wrap(actions.copy)} disabled={!hasSelection} />
          <Item label="Paste" onClick={wrap(actions.paste)} />
          <Item divider />
          <Item label={`Delete${selectionCount > 1 ? ` (${selectionCount})` : ''}`} onClick={wrap(actions.delete)} disabled={!hasSelection} danger />
          <Item divider />
          <Item label="Select All" shortcut="Ctrl+A" onClick={wrap(actions.selectAll)} />
        </>
      )}

      {type === 'wire' && (
        <>
          <Item label="Delete Connection" onClick={wrap(actions.deleteWire)} danger />
          <Item divider />
          <Item label="Select All" shortcut="Ctrl+A" onClick={wrap(actions.selectAll)} />
        </>
      )}

      {type === 'canvas' && (
        <>
          <Item label="Paste" shortcut="Ctrl+V" onClick={wrap(actions.paste)} />
          <Item divider />
          <Item label="Select All" shortcut="Ctrl+A" onClick={wrap(actions.selectAll)} />
          <Item label="Select None" shortcut="Ctrl+D" onClick={wrap(actions.selectNone)} disabled={!hasSelection} />
          <Item divider />
          <Item label="Zoom In" onClick={wrap(actions.zoomIn)} />
          <Item label="Zoom Out" onClick={wrap(actions.zoomOut)} />
          <Item label="Pan to Center" onClick={wrap(actions.panCenter)} />
        </>
      )}
    </div>
  );
}
