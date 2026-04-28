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

export default function App() {
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [wiringFrom, setWiringFrom] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [, setTick] = useState(0);
  const svgRef = useRef(null);
  const clockRef = useRef(0);

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

  // ── Cancelar wiring com ESC ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setWiringFrom(null);
        setSelectedId(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Evita deletar enquanto está editando texto
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
        deleteSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // ── Conversão de coordenadas tela → SVG ──
  const svgPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: e.clientX, y: e.clientY };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM().inverse();
    return pt.matrixTransform(ctm);
  }, []);

  // ── Mouse move global no canvas ──
  const handleMouseMove = useCallback((e) => {
    const pos = svgPoint(e);
    setMousePos(pos);
    if (dragging) {
      setComponents(prev => prev.map(c =>
        c.id === dragging.id
          ? Object.assign(c, { x: pos.x - dragging.ox, y: pos.y - dragging.oy })
          : c
      ));
      setTick(t => t + 1);
    }
  }, [dragging, svgPoint]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleCanvasClick = useCallback((e) => {
    // Clique em área vazia desseleciona
    if (e.target.tagName === 'rect' || e.target.tagName === 'svg') {
      setSelectedId(null);
    }
  }, []);

  // ── Drag de componente ──
  const handleCompMouseDown = useCallback((e, compId) => {
    const pos = svgPoint(e);
    const comp = components.find(c => c.id === compId);
    if (comp) {
      setDragging({ id: compId, ox: pos.x - comp.x, oy: pos.y - comp.y });
      setSelectedId(compId);
    }
  }, [components, svgPoint]);

  // ── Wiring por clique simples ──
  const handlePinClick = useCallback((pinId) => {
    if (!wiringFrom) {
      // Primeiro clique: define pino de origem
      setWiringFrom(pinId);
      return;
    }
    if (wiringFrom === pinId) {
      // Clicou no mesmo pino: cancela
      setWiringFrom(null);
      return;
    }
    // Segundo clique: tenta criar fio
    const fromPin = findPin(components, wiringFrom);
    const toPin = findPin(components, pinId);
    if (fromPin && toPin && fromPin.direction !== toPin.direction) {
      const src = fromPin.direction === 'output' ? fromPin : toPin;
      const dst = fromPin.direction === 'input' ? fromPin : toPin;
      // Impede destino com mais de uma entrada conectada
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

  // ── Adicionar via drop ──
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
    setSelectedId(id);
  }, []);

  // ── Ações da toolbar ──
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setWires(prev => prev.filter(w =>
      w.from.owner.id !== selectedId && w.to.owner.id !== selectedId
    ));
    setComponents(prev => prev.filter(c => c.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const clearAll = useCallback(() => {
    if (components.length === 0) return;
    if (!window.confirm('Limpar todos os componentes do canvas?')) return;
    setComponents([]);
    setWires([]);
    setSelectedId(null);
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
    setSelectedId(null);
  }, []);

  return (
    <div className="app-shell">
      <MenuBar
        onClear={clearAll}
        onDelete={deleteSelected}
        onPreset={loadPreset}
        hasSelection={!!selectedId}
      />
      <div className="app-body">
        <Sidebar />
        <Canvas
          components={components}
          wires={wires}
          selectedId={selectedId}
          wiringFrom={wiringFrom}
          mousePos={mousePos}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
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
        selectedId={selectedId}
      />
    </div>
  );
}
