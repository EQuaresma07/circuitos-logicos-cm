import React, { useState, useEffect, useRef, useCallback } from 'react';
import MenuBar from './components/MenuBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Canvas, { getCompSize } from './components/Canvas.jsx';
import StatusBar from './components/StatusBar.jsx';
import AboutModal from './components/AboutModal.jsx';
import LogicAnalyzer from './components/LogicAnalyzer.jsx';
import {
  InputSwitch, OutputProbe, Clock, Gate, Wire,
  PushButton, HighConstant, LowConstant, PullUp, PullDown,
  FourBitDigit, TriStateBuffer,
  SRFlipFlop, DFlipFlop, JKFlipFlop, TFlipFlop,
  Mux2, Demux2, FullAdder, Register4,
  SchmittTrigger, Comparator4, BCDDecoder, SevenSegmentDisplay,
  LedMatrix8x8, ROM16x8,
  TraceRecorder,
  Label as LabelComp,
  uid, resetUid, createComponent,
  serializeCircuit, deserializeCircuit, resetSimulationState,
} from './engine/components.js';
import { propagate } from './engine/propagation.js';
import { buildHalfAdder, buildSRLatch } from './engine/presets.js';

const GRID = 20;

function findPin(components, pinId) {
  for (const c of components) {
    for (const p of [...c.inputs, ...c.outputs]) {
      if (p.id === pinId) return p;
    }
  }
  return null;
}

function snap(v) { return Math.round(v / GRID) * GRID; }

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
  if (c instanceof Mux2) return 'MUX2';
  if (c instanceof Demux2) return 'DEMUX2';
  if (c instanceof FullAdder) return 'ADDER';
  if (c instanceof Register4) return 'REG4';
  if (c instanceof LabelComp) return 'LABEL';
  if (c instanceof Gate) return c.type;
  return 'UNKNOWN';
}

export default function App() {
  // ── Estado principal ──
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Interação ──
  const [dragging, setDragging] = useState(null);
  const [wiringFrom, setWiringFrom] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [marquee, setMarquee] = useState(null);
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [panState, setPanState] = useState(null);

  // ── UI ──
  const [darkMode, setDarkMode] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [currentTool, setCurrentTool] = useState('select'); // 'select' | 'pan'
  const [objectPickerVisible, setObjectPickerVisible] = useState(true);
  const [snapGrid, setSnapGrid] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // ── View transform (zoom + pan) ──
  // viewBox: x, y, w, h em coordenadas SVG
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1200, h: 700 });

  // ── Simulação ──
  const [simulationPaused, setSimulationPaused] = useState(false);
  const [stepRequested, setStepRequested] = useState(false);
  const [simulationFreq, setSimulationFreq] = useState(60); // Hz, padrão 60

  // ── Histórico (undo/redo) ──
  const historyRef = useRef({ past: [], future: [] });
  const [historyVersion, setHistoryVersion] = useState(0); // força re-render quando history muda

  // ── File ──
  const [currentFilename, setCurrentFilename] = useState('untitled.lcm');
  const fileInputRef = useRef(null);

  // ── Logic Analyzer ──
  const [analyzerVisible, setAnalyzerVisible] = useState(false);
  const [traceSlots, setTraceSlots] = useState([null, null, null, null]); // pinIds
  const [pendingTraceSlot, setPendingTraceSlot] = useState(null); // index 0..3 ou null
  const traceRef = useRef(new TraceRecorder(50));

  const [, setTick] = useState(0);
  const svgRef = useRef(null);
  const clockRef = useRef(0);
  const lastClockTime = useRef(0);
  const clipboardRef = useRef(null);
  const lastSimUpdate = useRef(0);

  // ── Dark mode toggle ──
  useEffect(() => {
    if (darkMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, [darkMode]);

  // ── Loop de animação ──
  useEffect(() => {
    let running = true;
    const start = performance.now();
    const intervalMs = 1000 / Math.max(0.5, simulationFreq);
    function loop(now) {
      if (!running) return;
      const elapsed = now - start;
      if (!simulationPaused) {
        // Throttle por simulationFreq
        if (elapsed - lastSimUpdate.current >= intervalMs) {
          clockRef.current = elapsed;
          lastClockTime.current = elapsed;
          lastSimUpdate.current = elapsed;
        }
      } else if (stepRequested) {
        // Avança apenas um pequeno delta
        clockRef.current = lastClockTime.current + intervalMs;
        lastClockTime.current = clockRef.current;
        setStepRequested(false);
      }
      // Recording (sempre, mesmo pausado faz sentido na timeline)
      if (traceRef.current.tracedPinIds.length > 0) {
        traceRef.current.recordSample(components, clockRef.current);
      }
      setTick(t => t + 1);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return () => { running = false; };
  }, [simulationPaused, stepRequested, simulationFreq, components]);

  // ── Propagação a cada render ──
  useEffect(() => {
    propagate(components, wires, clockRef.current);
  });

  // ── Snapshot pro histórico ──
  const pushHistory = useCallback(() => {
    const snap = serializeCircuit(components, wires);
    historyRef.current.past.push(snap);
    if (historyRef.current.past.length > 50) historyRef.current.past.shift();
    historyRef.current.future = [];
    setHistoryVersion(v => v + 1);
  }, [components, wires]);

  // ── Restaurar de snapshot ──
  const restoreFromSnap = useCallback((snap) => {
    const { components: newComps, wires: newWires } = deserializeCircuit(snap);
    setComponents(newComps);
    setWires(newWires);
    setSelectedIds(new Set());
  }, []);

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

  // ── Mouse move ──
  const handleMouseMove = useCallback((e) => {
    const pos = svgPoint(e);
    setMousePos(pos);

    // Pan (com pan tool ou middle button)
    if (panState) {
      const dx = e.clientX - panState.startX;
      const dy = e.clientY - panState.startY;
      const scaleX = viewBox.w / svgRef.current.clientWidth;
      const scaleY = viewBox.h / svgRef.current.clientHeight;
      setViewBox({
        x: panState.startVx - dx * scaleX,
        y: panState.startVy - dy * scaleY,
        w: viewBox.w,
        h: viewBox.h,
      });
      return;
    }

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
          let nx = offset.x + dx;
          let ny = offset.y + dy;
          if (snapGrid) { nx = snap(nx); ny = snap(ny); }
          c.x = nx;
          c.y = ny;
        }
        return c;
      }));
      setTick(t => t + 1);
    }
  }, [dragging, marquee, panState, snapGrid, viewBox, svgPoint]);

  const handleMouseUp = useCallback(() => {
    if (dragging) pushHistory();
    setDragging(null);
    setPanState(null);
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
  }, [marquee, components, dragging, pushHistory]);

  const handleCanvasMouseDown = useCallback((e) => {
    const isBg = e.target.dataset && e.target.dataset.bg === 'true';
    if (!isBg || e.button !== 0) return;

    if (currentTool === 'pan') {
      setPanState({
        startX: e.clientX, startY: e.clientY,
        startVx: viewBox.x, startVy: viewBox.y,
      });
      return;
    }

    const pos = svgPoint(e);
    setMarquee({ x0: pos.x, y0: pos.y, x1: pos.x, y1: pos.y });
    setSelectedIds(new Set());
    setWiringFrom(null);
    setEditingLabelId(null);
  }, [svgPoint, currentTool, viewBox]);

  const handleCompMouseDown = useCallback((e, compId) => {
    if (e.button !== 0 || currentTool === 'pan') return;
    const pos = svgPoint(e);

    if (e.shiftKey) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(compId)) next.delete(compId); else next.add(compId);
        return next;
      });
      return;
    }

    let activeIds;
    if (selectedIds.has(compId)) activeIds = selectedIds;
    else { activeIds = new Set([compId]); setSelectedIds(activeIds); }

    const offsets = {};
    components.forEach(c => {
      if (activeIds.has(c.id)) offsets[c.id] = { x: c.x, y: c.y };
    });
    setDragging({ startX: pos.x, startY: pos.y, offsets });
  }, [components, selectedIds, svgPoint, currentTool]);

  // ── Wiring ──
  const handlePinClick = useCallback((pinId) => {
    // Modo: selecionando pino para o Logic Analyzer
    if (pendingTraceSlot !== null) {
      setTraceSlots(prev => {
        const next = [...prev];
        next[pendingTraceSlot] = pinId;
        traceRef.current.setTracedPins(next.filter(Boolean));
        return next;
      });
      setPendingTraceSlot(null);
      return;
    }

    if (!wiringFrom) { setWiringFrom(pinId); return; }
    if (wiringFrom === pinId) { setWiringFrom(null); return; }
    const fromPin = findPin(components, wiringFrom);
    const toPin = findPin(components, pinId);
    if (fromPin && toPin && fromPin.direction !== toPin.direction) {
      const src = fromPin.direction === 'output' ? fromPin : toPin;
      const dst = fromPin.direction === 'input' ? fromPin : toPin;
      const exists = wires.some(w => w.from.id === src.id && w.to.id === dst.id);
      if (!exists) {
        pushHistory();
        setWires(prev => [...prev, new Wire(uid(), src, dst)]);
      }
    }
    setWiringFrom(null);
  }, [wiringFrom, components, wires, pushHistory, pendingTraceSlot]);

  const toggleInput = useCallback((compId) => {
    setComponents(prev => {
      const c = prev.find(c => c.id === compId);
      if (c instanceof InputSwitch) c.toggle();
      return [...prev];
    });
  }, []);

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

  const handleLabelEdit = useCallback((compId) => setEditingLabelId(compId), []);

  const handleLabelCommit = useCallback((compId, newText) => {
    pushHistory();
    setComponents(prev => {
      const c = prev.find(c => c.id === compId);
      if (c instanceof LabelComp) c.text = newText || 'Label';
      return [...prev];
    });
    setEditingLabelId(null);
  }, [pushHistory]);

  const handleLabelCancel = useCallback(() => setEditingLabelId(null), []);

  const handleDrop = useCallback((type, x, y) => {
    pushHistory();
    const comp = createComponent(type);
    if (snapGrid) { x = snap(x); y = snap(y); }
    comp.x = x;
    comp.y = y;
    setComponents(prev => [...prev, comp]);
    setSelectedIds(new Set([comp.id]));
  }, [pushHistory, snapGrid]);

  // ── Edit actions ──
  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    pushHistory();
    setWires(prev => prev.filter(w => !selectedIds.has(w.from.owner.id) && !selectedIds.has(w.to.owner.id)));
    setComponents(prev => prev.filter(c => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
  }, [selectedIds, pushHistory]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(components.map(c => c.id)));
  }, [components]);

  const selectNone = useCallback(() => setSelectedIds(new Set()), []);

  // ── Copy / Cut / Paste ──
  const copySelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const selectedComps = components.filter(c => selectedIds.has(c.id));
    const selectedWires = wires.filter(w => selectedIds.has(w.from.owner.id) && selectedIds.has(w.to.owner.id));
    clipboardRef.current = {
      components: selectedComps.map(c => ({
        id: c.id, type: typeOf(c), label: c.label, text: c.text,
        x: c.x, y: c.y, rotation: c.rotation || 0,
        state: c.state, periodMs: c.periodMs,
      })),
      wires: selectedWires.map(w => ({
        fromCompId: w.from.owner.id, fromPinIdx: w.from.owner.outputs.indexOf(w.from),
        toCompId: w.to.owner.id, toPinIdx: w.to.owner.inputs.indexOf(w.to),
      })),
    };
  }, [components, wires, selectedIds]);

  const cutSelected = useCallback(() => { copySelected(); deleteSelected(); }, [copySelected, deleteSelected]);

  const pasteClipboard = useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip || clip.components.length === 0) return;
    pushHistory();
    const idToNewComp = new Map();
    const offsetX = 30, offsetY = 30;
    const newComps = clip.components.map(spec => {
      const comp = createComponent(spec.type);
      if (spec.state !== undefined && comp instanceof InputSwitch) comp.state = spec.state;
      if (spec.text !== undefined && comp instanceof LabelComp) comp.text = spec.text;
      if (spec.label) comp.label = spec.label;
      if (spec.periodMs && comp instanceof Clock) comp.periodMs = spec.periodMs;
      comp.x = spec.x + offsetX;
      comp.y = spec.y + offsetY;
      comp.rotation = spec.rotation || 0;
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
  }, [pushHistory]);

  // ── Undo / Redo ──
  const undo = useCallback(() => {
    const past = historyRef.current.past;
    if (past.length === 0) return;
    const current = serializeCircuit(components, wires);
    const previous = past.pop();
    historyRef.current.future.push(current);
    restoreFromSnap(previous);
    setHistoryVersion(v => v + 1);
  }, [components, wires, restoreFromSnap]);

  const redo = useCallback(() => {
    const future = historyRef.current.future;
    if (future.length === 0) return;
    const current = serializeCircuit(components, wires);
    const next = future.pop();
    historyRef.current.past.push(current);
    restoreFromSnap(next);
    setHistoryVersion(v => v + 1);
  }, [components, wires, restoreFromSnap]);

  // ── File: New / Save / Open ──
  const newCircuit = useCallback(() => {
    if (components.length > 0 && !window.confirm('Discard current circuit?')) return;
    pushHistory();
    setComponents([]);
    setWires([]);
    setSelectedIds(new Set());
    setCurrentFilename('untitled.lcm');
    resetUid();
  }, [components.length, pushHistory]);

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const saveAs = useCallback(() => {
    const name = window.prompt('Save as:', currentFilename) || currentFilename;
    const fname = name.endsWith('.lcm') ? name : `${name}.lcm`;
    setCurrentFilename(fname);
    downloadJSON(serializeCircuit(components, wires), fname);
  }, [components, wires, currentFilename]);

  const save = useCallback(() => {
    downloadJSON(serializeCircuit(components, wires), currentFilename);
  }, [components, wires, currentFilename]);

  const openFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        const { components: newComps, wires: newWires } = deserializeCircuit(data);
        pushHistory();
        setComponents(newComps);
        setWires(newWires);
        setSelectedIds(new Set());
        setCurrentFilename(file.name);
      } catch (err) {
        alert(`Failed to load circuit: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset para permitir abrir mesmo arquivo de novo
  }, [pushHistory]);

  // ── View: Zoom / Pan / Grid ──
  const zoomIn = useCallback(() => {
    setViewBox(v => ({ x: v.x + v.w * 0.1, y: v.y + v.h * 0.1, w: v.w * 0.8, h: v.h * 0.8 }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewBox(v => ({ x: v.x - v.w * 0.125, y: v.y - v.h * 0.125, w: v.w * 1.25, h: v.h * 1.25 }));
  }, []);

  const panToCenter = useCallback(() => {
    if (components.length === 0) {
      setViewBox({ x: 0, y: 0, w: 1200, h: 700 });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of components) {
      const { w, h } = getCompSize(c);
      minX = Math.min(minX, c.x); minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + w); maxY = Math.max(maxY, c.y + h);
    }
    const margin = 80;
    const cw = Math.max(800, maxX - minX + margin * 2);
    const ch = Math.max(500, maxY - minY + margin * 2);
    setViewBox({ x: minX - margin, y: minY - margin, w: cw, h: ch });
  }, [components]);

  // ── Simulation control ──
  const togglePauseSimulation = useCallback(() => setSimulationPaused(p => !p), []);
  const advanceStep = useCallback(() => setStepRequested(true), []);
  const resetSimulation = useCallback(() => {
    pushHistory();
    setComponents(prev => {
      resetSimulationState(prev);
      return [...prev];
    });
  }, [pushHistory]);

  // ── Atalhos ──
  useEffect(() => {
    const onKey = (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        setWiringFrom(null); setSelectedIds(new Set()); setMarquee(null); setEditingLabelId(null);
        setPendingTraceSlot(null);
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault(); togglePauseSimulation(); return;
      }

      if (e.key === 'F10') {
        e.preventDefault(); if (simulationPaused) advanceStep(); return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) { e.preventDefault(); deleteSelected(); }
        return;
      }

      // Tools shortcuts
      if (e.key === 'v' || e.key === 'V') { if (!e.ctrlKey && !e.metaKey) { setCurrentTool('select'); return; } }
      if (e.key === 'h' || e.key === 'H') { if (!e.ctrlKey && !e.metaKey) { setCurrentTool('pan'); return; } }

      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      switch (e.key.toLowerCase()) {
        case 'a': e.preventDefault(); selectAll(); break;
        case 'd': e.preventDefault(); selectNone(); break;
        case 'c': e.preventDefault(); copySelected(); break;
        case 'x': e.preventDefault(); cutSelected(); break;
        case 'v': e.preventDefault(); pasteClipboard(); break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) redo(); else undo();
          break;
        case 'y': e.preventDefault(); redo(); break;
        case 'n': e.preventDefault(); newCircuit(); break;
        case 'o': e.preventDefault(); openFile(); break;
        case 's':
          e.preventDefault();
          if (e.shiftKey) saveAs(); else save();
          break;
        case '+': case '=': e.preventDefault(); zoomIn(); break;
        case '-': e.preventDefault(); zoomOut(); break;
        case '0': e.preventDefault(); panToCenter(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    selectedIds, deleteSelected, selectAll, selectNone, copySelected, cutSelected, pasteClipboard,
    undo, redo, newCircuit, openFile, save, saveAs,
    zoomIn, zoomOut, panToCenter, togglePauseSimulation, advanceStep, simulationPaused,
  ]);

  const loadPreset = useCallback((name) => {
    pushHistory();
    resetUid();
    let data;
    if (name === 'half-adder') data = buildHalfAdder();
    else if (name === 'sr-latch') data = buildSRLatch();
    else return;
    setComponents(data.components);
    setWires(data.wires);
    setSelectedIds(new Set());
  }, [pushHistory]);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  // ── Labels para pinos rastreados ──
  const tracePinLabels = traceSlots.map(pinId => {
    if (!pinId) return '';
    for (const c of components) {
      for (const p of [...c.inputs, ...c.outputs]) {
        if (p.id === pinId) {
          return `${c.label || c.type}.${p.name}`;
        }
      }
    }
    return '?';
  });

  const startPickPin = useCallback((slotIdx) => {
    setPendingTraceSlot(slotIdx);
    setAnalyzerVisible(true);
  }, []);

  const clearTrace = useCallback(() => {
    traceRef.current.clear();
    setTraceSlots([null, null, null, null]);
    traceRef.current.setTracedPins([]);
  }, []);

  const toggleAnalyzer = useCallback(() => setAnalyzerVisible(v => !v), []);

  return (
    <div className={`app-shell ${darkMode ? 'dark' : ''}`}>
      <MenuBar
        // File
        onNew={newCircuit}
        onOpen={openFile}
        onSave={save}
        onSaveAs={saveAs}
        // Edit
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onCut={cutSelected}
        onCopy={copySelected}
        onPaste={pasteClipboard}
        onDelete={deleteSelected}
        onSelectAll={selectAll}
        onSelectNone={selectNone}
        // View
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onPanCenter={panToCenter}
        onToggleSnapGrid={() => setSnapGrid(s => !s)}
        snapGrid={snapGrid}
        onToggleShowGrid={() => setShowGrid(s => !s)}
        showGrid={showGrid}
        // Tools
        onSelectTool={() => setCurrentTool('select')}
        onPanTool={() => setCurrentTool('pan')}
        currentTool={currentTool}
        onToggleObjectPicker={() => setObjectPickerVisible(v => !v)}
        objectPickerVisible={objectPickerVisible}
        // Simulate
        onPauseSimulation={togglePauseSimulation}
        simulationPaused={simulationPaused}
        onAdvanceStep={advanceStep}
        onResetSimulation={resetSimulation}
        // Analyzer
        onToggleAnalyzer={toggleAnalyzer}
        analyzerVisible={analyzerVisible}
        simulationFreq={simulationFreq}
        onChangeFreq={setSimulationFreq}
        // Help
        onShowAbout={() => setShowAbout(true)}
        // Theme
        onToggleDarkMode={() => setDarkMode(d => !d)}
        darkMode={darkMode}
        // Selection
        hasSelection={selectedIds.size > 0}
        selectionCount={selectedIds.size}
      />
      <div className="app-body">
        {objectPickerVisible && <Sidebar onLoadPreset={loadPreset} />}
        <Canvas
          components={components}
          wires={wires}
          selectedIds={selectedIds}
          wiringFrom={wiringFrom}
          mousePos={mousePos}
          marquee={marquee}
          editingLabelId={editingLabelId}
          viewBox={viewBox}
          showGrid={showGrid}
          currentTool={currentTool}
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
        currentTool={currentTool}
        simulationPaused={simulationPaused}
        filename={currentFilename}
      />

      {/* File picker invisível */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".lcm,.json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      <LogicAnalyzer
        visible={analyzerVisible}
        onClose={toggleAnalyzer}
        trace={traceRef.current}
        pinLabels={tracePinLabels}
        components={components}
        onAddPin={startPickPin}
        onClearTrace={clearTrace}
      />

      {/* Hint flutuante quando aguardando pick de pino */}
      {pendingTraceSlot !== null && (
        <div className="trace-pick-hint">
          Click on a pin to trace it (slot {pendingTraceSlot + 1}) · ESC to cancel
        </div>
      )}
    </div>
  );
}
