import React, { useState, useEffect, useRef, useCallback } from 'react';
import MenuBar from './components/MenuBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Canvas, { COMP_W, COMP_H } from './components/Canvas.jsx';
import StatusBar from './components/StatusBar.jsx';
import {
  InputSwitch, OutputProbe, Clock, Gate, Wire,
  uid, resetUid,
} from './engine/components.js';
import { propagate } from './engine/propagation.js';
import { buildHalfAdder, buildSRLatch } from './engine/presets.js';

function findPin(components, pinId) {
  for (const c of components) {
    for (const p of [...c.inputs, ...c.outputs]) {
      if (p.id === pinId) return p;
    }
  }
  return null;
}

// ── Clonar um componente (para copy/paste) ──
function cloneComponent(orig, idMap) {
  let clone;
  const newId = uid();
  if (orig instanceof InputSwitch) {
    clone = new InputSwitch(newId, orig.label);
    clone.state = orig.state;
  } else if (orig instanceof OutputProbe) {
    clone = new OutputProbe(newId, orig.label);
  } else if (orig instanceof Clock) {
    clone = new Clock(newId, orig.label, orig.periodMs);
  } else if (orig instanceof Gate) {
    clone = new Gate(newId, orig.type);
  }
  clone.x = orig.x;
  clone.y = orig.y;
  // Mapeia pinos antigos -> novos por índice
  idMap.set(orig.id, clone.id);
  orig.inputs.forEach((p, i) => idMap.set(p.id, clone.inputs[i].id));
  orig.outputs.forEach((p, i) => idMap.set(p.id, clone.outputs[i].id));
  return clone;
}

export default function App() {
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dragging, setDragging] = useState(null);
  const [wiringFrom, setWiringFrom] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [marquee, setMarquee] = useState(null); // { x0, y0, x1, y1 }
  const [darkMode, setDarkMode] = useState(false);
  const [, setTick] = useState(0);
  const svgRef = useRef(null);
  const clockRef = useRef(0);
  const clipboardRef = useRef(null); // { components: [...], wires: [...] }

  // ── Aplica classe dark no body ──
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // ── Loop de animação para clocks e re-render ──
  useEffect(() => {
    let running = true;
    const start = performance.now();
    function loop(now) {
      if (!running) return;
      clockRef.current = now - start;
      setTick(t => t + 1);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return () => { running = false; };
  }, []);

  // ── Propagação a cada render ──
  useEffect(() => {
    propagate(components, wires, clockRef.current);
  });

  // ── Conversão de coordenadas ──
  const svgPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: e.clientX, y: e.clientY };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM().inverse();
    return pt.matrixTransform(ctm);
  }, []);

  // ── Mouse move global ──
  const handleMouseMove = useCallback((e) => {
    const pos = svgPoint(e);
    setMousePos(pos);

    // Atualizar retângulo de seleção (marquee)
    if (marquee) {
      setMarquee(m => m && { ...m, x1: pos.x, y1: pos.y });
      return;
    }

    // Drag de componentes (potencialmente múltiplos)
    if (dragging) {
      const dx = pos.x - dragging.startX;
      const dy = pos.y - dragging.startY;
      setComponents(prev => prev.map(c => {
        const offset = dragging.offsets[c.id];
        if (offset) {
          c.x = offset.x + dx;
          c.y = offset.y + dy;
        }
        return c;
      }));
      setTick(t => t + 1);
    }
  }, [dragging, marquee, svgPoint]);

  // ── Mouse up: finaliza drag ou marquee ──
  const handleMouseUp = useCallback(() => {
    setDragging(null);
    if (marquee) {
      // Calcular componentes dentro do retângulo
      const x0 = Math.min(marquee.x0, marquee.x1);
      const y0 = Math.min(marquee.y0, marquee.y1);
      const x1 = Math.max(marquee.x0, marquee.x1);
      const y1 = Math.max(marquee.y0, marquee.y1);
      const inside = new Set();
      components.forEach(c => {
        const cx0 = c.x;
        const cy0 = c.y;
        const cx1 = c.x + COMP_W;
        const cy1 = c.y + COMP_H;
        // Intersecção de retângulos
        if (cx1 >= x0 && cx0 <= x1 && cy1 >= y0 && cy0 <= y1) {
          inside.add(c.id);
        }
      });
      setSelectedIds(inside);
      setMarquee(null);
    }
  }, [marquee, components]);

  // ── Mouse down em área vazia: inicia marquee ──
  const handleCanvasMouseDown = useCallback((e) => {
    // Só inicia marquee se for clique direto no SVG/grid (não em componentes)
    const isBg = e.target.dataset && e.target.dataset.bg === 'true';
    if (isBg && e.button === 0) {
      const pos = svgPoint(e);
      setMarquee({ x0: pos.x, y0: pos.y, x1: pos.x, y1: pos.y });
      setSelectedIds(new Set());
      setWiringFrom(null);
    }
  }, [svgPoint]);

  // ── Drag de componente ──
  const handleCompMouseDown = useCallback((e, compId) => {
    if (e.button !== 0) return;
    const pos = svgPoint(e);

    // Se shift está pressionado, alterna seleção
    if (e.shiftKey) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(compId)) next.delete(compId);
        else next.add(compId);
        return next;
      });
      return;
    }

    // Se o componente clicado não está na seleção, seleciona só ele
    let activeIds;
    if (selectedIds.has(compId)) {
      activeIds = selectedIds;
    } else {
      activeIds = new Set([compId]);
      setSelectedIds(activeIds);
    }

    // Captura posições iniciais de todos os selecionados
    const offsets = {};
    components.forEach(c => {
      if (activeIds.has(c.id)) {
        offsets[c.id] = { x: c.x, y: c.y };
      }
    });
    setDragging({ startX: pos.x, startY: pos.y, offsets });
  }, [components, selectedIds, svgPoint]);

  // ── Wiring por clique ──
  const handlePinClick = useCallback((pinId) => {
    if (!wiringFrom) {
      setWiringFrom(pinId);
      return;
    }
    if (wiringFrom === pinId) {
      setWiringFrom(null);
      return;
    }
    const fromPin = findPin(components, wiringFrom);
    const toPin = findPin(components, pinId);
    if (fromPin && toPin && fromPin.direction !== toPin.direction) {
      const src = fromPin.direction === 'output' ? fromPin : toPin;
      const dst = fromPin.direction === 'input' ? fromPin : toPin;
      const alreadyConnected = wires.some(w => w.to.id === dst.id);
      const exists = wires.some(w => w.from.id === src.id && w.to.id === dst.id);
      if (!exists && !alreadyConnected) {
        setWires(prev => [...prev, new Wire(uid(), src, dst)]);
      }
    }
    setWiringFrom(null);
  }, [wiringFrom, components, wires]);

  // ── Toggle de input ──
  const toggleInput = useCallback((compId) => {
    setComponents(prev => {
      const c = prev.find(c => c.id === compId);
      if (c && c instanceof InputSwitch) c.toggle();
      return [...prev];
    });
  }, []);

  // ── Drop de novo componente ──
  const handleDrop = useCallback((type, x, y) => {
    let comp;
    const id = uid();
    if (type === 'INPUT') comp = new InputSwitch(id);
    else if (type === 'OUTPUT') comp = new OutputProbe(id);
    else if (type === 'CLOCK') comp = new Clock(id, 'CLK', 800);
    else comp = new Gate(id, type);
    comp.x = x;
    comp.y = y;
    setComponents(prev => [...prev, comp]);
    setSelectedIds(new Set([id]));
  }, []);

  // ── Deletar selecionados ──
  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setWires(prev => prev.filter(w =>
      !selectedIds.has(w.from.owner.id) && !selectedIds.has(w.to.owner.id)
    ));
    setComponents(prev => prev.filter(c => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  // ── Selecionar todos ──
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(components.map(c => c.id)));
  }, [components]);

  // ── Copiar selecionados (snapshot serializado em memória) ──
  const copySelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const selectedComps = components.filter(c => selectedIds.has(c.id));
    // Fios apenas entre componentes selecionados
    const selectedWires = wires.filter(w =>
      selectedIds.has(w.from.owner.id) && selectedIds.has(w.to.owner.id)
    );
    // Serializar como descrição leve (sem instâncias React-influenciadas)
    clipboardRef.current = {
      components: selectedComps.map(c => ({
        id: c.id,
        type: c instanceof Gate ? c.type : (c instanceof InputSwitch ? 'INPUT' : c instanceof OutputProbe ? 'OUTPUT' : 'CLOCK'),
        label: c.label,
        x: c.x,
        y: c.y,
        state: c.state,
        periodMs: c.periodMs,
      })),
      wires: selectedWires.map(w => ({
        fromCompId: w.from.owner.id,
        fromPinIdx: w.from.owner.outputs.indexOf(w.from),
        toCompId: w.to.owner.id,
        toPinIdx: w.to.owner.inputs.indexOf(w.to),
      })),
    };
  }, [components, wires, selectedIds]);

  // ── Recortar ──
  const cutSelected = useCallback(() => {
    copySelected();
    deleteSelected();
  }, [copySelected, deleteSelected]);

  // ── Colar ──
  const pasteClipboard = useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip || clip.components.length === 0) return;

    // Mapeia ID antigo -> novo componente
    const idToNewComp = new Map();
    const offsetX = 30;
    const offsetY = 30;

    const newComps = clip.components.map(spec => {
      const newId = uid();
      let comp;
      if (spec.type === 'INPUT') {
        comp = new InputSwitch(newId, spec.label);
        comp.state = spec.state || false;
      } else if (spec.type === 'OUTPUT') {
        comp = new OutputProbe(newId, spec.label);
      } else if (spec.type === 'CLOCK') {
        comp = new Clock(newId, spec.label, spec.periodMs || 800);
      } else {
        comp = new Gate(newId, spec.type);
      }
      comp.x = spec.x + offsetX;
      comp.y = spec.y + offsetY;
      idToNewComp.set(spec.id, comp);
      return comp;
    });

    const newWires = clip.wires.map(w => {
      const fromComp = idToNewComp.get(w.fromCompId);
      const toComp = idToNewComp.get(w.toCompId);
      if (!fromComp || !toComp) return null;
      return new Wire(uid(), fromComp.outputs[w.fromPinIdx], toComp.inputs[w.toPinIdx]);
    }).filter(Boolean);

    setComponents(prev => [...prev, ...newComps]);
    setWires(prev => [...prev, ...newWires]);
    setSelectedIds(new Set(newComps.map(c => c.id)));
  }, []);

  // ── Atalhos de teclado ──
  useEffect(() => {
    const onKey = (e) => {
      // Ignorar quando digitando em inputs reais
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        setWiringFrom(null);
        setSelectedIds(new Set());
        setMarquee(null);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          deleteSelected();
        }
        return;
      }

      // Ctrl/Cmd combos
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      switch (e.key.toLowerCase()) {
        case 'a':
          e.preventDefault();
          selectAll();
          break;
        case 'c':
          e.preventDefault();
          copySelected();
          break;
        case 'x':
          e.preventDefault();
          cutSelected();
          break;
        case 'v':
          e.preventDefault();
          pasteClipboard();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds, deleteSelected, selectAll, copySelected, cutSelected, pasteClipboard]);

  const clearAll = useCallback(() => {
    if (components.length === 0) return;
    if (!window.confirm('Clear all components from canvas?')) return;
    setComponents([]);
    setWires([]);
    setSelectedIds(new Set());
    resetUid();
  }, [components.length]);

  const loadPreset = useCallback((name) => {
    resetUid();
    let data;
    if (name === 'half-adder') data = buildHalfAdder();
    else if (name === 'sr-latch') data = buildSRLatch();
    else return;
    setComponents(data.components);
    setWires(data.wires);
    setSelectedIds(new Set());
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(d => !d);
  }, []);

  return (
    <div className={`app-shell ${darkMode ? 'dark' : ''}`}>
      <MenuBar
        onClear={clearAll}
        onDelete={deleteSelected}
        onPreset={loadPreset}
        onToggleDarkMode={toggleDarkMode}
        darkMode={darkMode}
        hasSelection={selectedIds.size > 0}
        selectionCount={selectedIds.size}
      />
      <div className="app-body">
        <Sidebar />
        <Canvas
          components={components}
          wires={wires}
          selectedIds={selectedIds}
          wiringFrom={wiringFrom}
          mousePos={mousePos}
          marquee={marquee}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseDown={handleCanvasMouseDown}
          onCompMouseDown={handleCompMouseDown}
          onPinClick={handlePinClick}
          onToggle={toggleInput}
          onDrop={handleDrop}
          svgRef={svgRef}
        />
      </div>
      <StatusBar
        componentCount={components.length}
        wireCount={wires.length}
        wiringFrom={wiringFrom}
        selectionCount={selectedIds.size}
      />
    </div>
  );
}
