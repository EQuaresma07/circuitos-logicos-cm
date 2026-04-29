import React, { useState, useEffect, useRef, useCallback } from 'react';
import MenuBar from './components/MenuBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Canvas, { getCompSize } from './components/Canvas.jsx';
import StatusBar from './components/StatusBar.jsx';
import {
  InputSwitch, OutputProbe, Clock, Gate, Wire,
  PushButton, HighConstant, LowConstant, PullUp, PullDown,
  FourBitDigit, TriStateBuffer,
  SRFlipFlop, DFlipFlop, JKFlipFlop, TFlipFlop,
  Label as LabelComp,
  uid, resetUid, createComponent,
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

// Identifica tipo string a partir de instância
function typeOf(c) {
  if (c instanceof InputSwitch) return 'INPUT';
  if (c instanceof PushButton) return 'BUTTON';
  if (c instanceof HighConstant) return 'HIGH';
  if (c instanceof LowConstant) return 'LOW';
  if (c instanceof PullUp) return 'PULLUP';
  if (c instanceof PullDown) return 'PULLDOWN';
  if (c instanceof Clock) return 'CLOCK';
  if (c instanceof OutputProbe) return 'OUTPUT';
  if (c instanceof FourBitDigit) return 'DIGIT4';
  if (c instanceof TriStateBuffer) return 'TRISTATE';
  if (c instanceof SRFlipFlop) return 'SR_FF';
  if (c instanceof DFlipFlop) return 'D_FF';
  if (c instanceof JKFlipFlop) return 'JK_FF';
  if (c instanceof TFlipFlop) return 'T_FF';
  if (c instanceof LabelComp) return 'LABEL';
  if (c instanceof Gate) return c.type;
  return 'UNKNOWN';
}

export default function App() {
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dragging, setDragging] = useState(null);
  const [wiringFrom, setWiringFrom] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [marquee, setMarquee] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [, setTick] = useState(0);
  const svgRef = useRef(null);
  const clockRef = useRef(0);
  const clipboardRef = useRef(null);

  useEffect(() => {
    if (darkMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, [darkMode]);

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

  useEffect(() => {
    propagate(components, wires, clockRef.current);
  });

  const svgPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: e.clientX, y: e.clientY };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM().inverse();
    return pt.matrixTransform(ctm);
  }, []);

  const handleMouseMove = useCallback((e) => {
    const pos = svgPoint(e);
    setMousePos(pos);

    if (marquee) {
      setMarquee(m => m && { ...m, x1: pos.x, y1: pos.y });
      return;
    }

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

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    if (marquee) {
      const x0 = Math.min(marquee.x0, marquee.x1);
      const y0 = Math.min(marquee.y0, marquee.y1);
      const x1 = Math.max(marquee.x0, marquee.x1);
      const y1 = Math.max(marquee.y0, marquee.y1);
      const inside = new Set();
      components.forEach(c => {
        const { w, h } = getCompSize(c);
        if (c.x + w >= x0 && c.x <= x1 && c.y + h >= y0 && c.y <= y1) {
          inside.add(c.id);
        }
      });
      setSelectedIds(inside);
      setMarquee(null);
    }
  }, [marquee, components]);

  const handleCanvasMouseDown = useCallback((e) => {
    const isBg = e.target.dataset && e.target.dataset.bg === 'true';
    if (isBg && e.button === 0) {
      const pos = svgPoint(e);
      setMarquee({ x0: pos.x, y0: pos.y, x1: pos.x, y1: pos.y });
      setSelectedIds(new Set());
      setWiringFrom(null);
      setEditingLabelId(null);
    }
  }, [svgPoint]);

  const handleCompMouseDown = useCallback((e, compId) => {
    if (e.button !== 0) return;
    const pos = svgPoint(e);

    if (e.shiftKey) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(compId)) next.delete(compId);
        else next.add(compId);
        return next;
      });
      return;
    }

    let activeIds;
    if (selectedIds.has(compId)) {
      activeIds = selectedIds;
    } else {
      activeIds = new Set([compId]);
      setSelectedIds(activeIds);
    }

    const offsets = {};
    components.forEach(c => {
      if (activeIds.has(c.id)) {
        offsets[c.id] = { x: c.x, y: c.y };
      }
    });
    setDragging({ startX: pos.x, startY: pos.y, offsets });
  }, [components, selectedIds, svgPoint]);

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
      const exists = wires.some(w => w.from.id === src.id && w.to.id === dst.id);
      // Permitimos múltiplos drivers (necessário para Pull + TriState)
      // mas não duplicamos a mesma conexão
      if (!exists) {
        setWires(prev => [...prev, new Wire(uid(), src, dst)]);
      }
    }
    setWiringFrom(null);
  }, [wiringFrom, components, wires]);

  const toggleInput = useCallback((compId) => {
    setComponents(prev => {
      const c = prev.find(c => c.id === compId);
      if (c instanceof InputSwitch) c.toggle();
      return [...prev];
    });
  }, []);

  // Push button handlers
  const handlePress = useCallback((compId) => {
    setComponents(prev => {
      const c = prev.find(c => c.id === compId);
      if (c instanceof PushButton) c.press();
      return [...prev];
    });
  }, []);

  const handleRelease = useCallback((compId) => {
    setComponents(prev => {
      const c = prev.find(c => c.id === compId);
      if (c instanceof PushButton) c.release();
      return [...prev];
    });
  }, []);

  // Label handlers
  const handleLabelEdit = useCallback((compId) => {
    setEditingLabelId(compId);
  }, []);

  const handleLabelCommit = useCallback((compId, newText) => {
    setComponents(prev => {
      const c = prev.find(c => c.id === compId);
      if (c instanceof LabelComp) {
        c.text = newText || 'Label';
      }
      return [...prev];
    });
    setEditingLabelId(null);
  }, []);

  const handleLabelCancel = useCallback(() => {
    setEditingLabelId(null);
  }, []);

  const handleDrop = useCallback((type, x, y) => {
    const comp = createComponent(type);
    comp.x = x;
    comp.y = y;
    setComponents(prev => [...prev, comp]);
    setSelectedIds(new Set([comp.id]));
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setWires(prev => prev.filter(w =>
      !selectedIds.has(w.from.owner.id) && !selectedIds.has(w.to.owner.id)
    ));
    setComponents(prev => prev.filter(c => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(components.map(c => c.id)));
  }, [components]);

  const copySelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const selectedComps = components.filter(c => selectedIds.has(c.id));
    const selectedWires = wires.filter(w =>
      selectedIds.has(w.from.owner.id) && selectedIds.has(w.to.owner.id)
    );
    clipboardRef.current = {
      components: selectedComps.map(c => ({
        id: c.id,
        type: typeOf(c),
        label: c.label,
        text: c.text, // for Label
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

  const cutSelected = useCallback(() => {
    copySelected();
    deleteSelected();
  }, [copySelected, deleteSelected]);

  const pasteClipboard = useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip || clip.components.length === 0) return;

    const idToNewComp = new Map();
    const offsetX = 30;
    const offsetY = 30;

    const newComps = clip.components.map(spec => {
      const comp = createComponent(spec.type);
      if (spec.state !== undefined && comp instanceof InputSwitch) comp.state = spec.state;
      if (spec.text !== undefined && comp instanceof LabelComp) comp.text = spec.text;
      if (spec.label) comp.label = spec.label;
      if (spec.periodMs && comp instanceof Clock) comp.periodMs = spec.periodMs;
      comp.x = spec.x + offsetX;
      comp.y = spec.y + offsetY;
      idToNewComp.set(spec.id, comp);
      return comp;
    });

    const newWires = clip.wires.map(w => {
      const fromComp = idToNewComp.get(w.fromCompId);
      const toComp = idToNewComp.get(w.toCompId);
      if (!fromComp || !toComp) return null;
      const srcPin = fromComp.outputs[w.fromPinIdx];
      const dstPin = toComp.inputs[w.toPinIdx];
      if (!srcPin || !dstPin) return null;
      return new Wire(uid(), srcPin, dstPin);
    }).filter(Boolean);

    setComponents(prev => [...prev, ...newComps]);
    setWires(prev => [...prev, ...newWires]);
    setSelectedIds(new Set(newComps.map(c => c.id)));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      // Ignorar quando digitando em input/textarea (incluindo o editor de Label)
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        setWiringFrom(null);
        setSelectedIds(new Set());
        setMarquee(null);
        setEditingLabelId(null);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          deleteSelected();
        }
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      switch (e.key.toLowerCase()) {
        case 'a': e.preventDefault(); selectAll(); break;
        case 'c': e.preventDefault(); copySelected(); break;
        case 'x': e.preventDefault(); cutSelected(); break;
        case 'v': e.preventDefault(); pasteClipboard(); break;
        default: break;
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

  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), []);

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
          editingLabelId={editingLabelId}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseDown={handleCanvasMouseDown}
          onCompMouseDown={handleCompMouseDown}
          onPinClick={handlePinClick}
          onToggle={toggleInput}
          onPress={handlePress}
          onRelease={handleRelease}
          onLabelEdit={handleLabelEdit}
          onLabelCommit={handleLabelCommit}
          onLabelCancel={handleLabelCancel}
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
