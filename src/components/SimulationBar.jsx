import React from 'react';

// ─────────────────────────────────────────────────────────────
// Ícones inline — estilo Logic.ly (círculos com ícone monocromático)
// ─────────────────────────────────────────────────────────────
const Icons = {
  // Reset / Restart (⏮)
  reset: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="5" width="2.5" height="14" rx="0.5" fill="currentColor"/>
      <path d="M19 5v14L9 12z" fill="currentColor"/>
    </svg>
  ),
  // Pause (⏸)
  pause: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="5" width="4" height="14" rx="0.5" fill="currentColor"/>
      <rect x="14" y="5" width="4" height="14" rx="0.5" fill="currentColor"/>
    </svg>
  ),
  // Play (▶)
  play: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M7 5v14l12-7z" fill="currentColor"/>
    </svg>
  ),
  // Step / Skip Forward (⏩)
  step: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M5 5v14l8-7z" fill="currentColor"/>
      <path d="M13 5v14l8-7z" fill="currentColor"/>
    </svg>
  ),
  // Lupa pequena (zoom out)
  zoomOut: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="10" r="6" stroke="#d63031" strokeWidth="2.5" fill="none"/>
      <line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#d63031" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="7" y1="10" x2="13" y2="10" stroke="#d63031" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  // Lupa grande (zoom in)
  zoomIn: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="10" r="6" stroke="#d63031" strokeWidth="2.5" fill="none"/>
      <line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#d63031" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="7" y1="10" x2="13" y2="10" stroke="#d63031" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="10" y1="7" x2="10" y2="13" stroke="#d63031" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// SimulationBar (barra inferior de controle)
// ─────────────────────────────────────────────────────────────
export default function SimulationBar({
  simulationPaused,
  onTogglePause,
  onStep,
  onReset,
  zoomSliderValue,
  onZoomSlider,
  onZoomIn,
  onZoomOut,
}) {
  return (
    <div className="sim-bar">
      {/* ─── Controles de simulação (esquerda) ─── */}
      <div className="sim-bar-left">
        <button
          className="sim-circle-btn"
          onClick={onReset}
          title="Reiniciar Simulação"
          aria-label="Reiniciar"
        >
          {Icons.reset}
        </button>

        <button
          className="sim-circle-btn"
          onClick={onTogglePause}
          title={simulationPaused ? 'Retomar Simulação' : 'Pausar Simulação'}
          aria-label={simulationPaused ? 'Retomar' : 'Pausar'}
        >
          {simulationPaused ? Icons.play : Icons.pause}
        </button>

        <button
          className="sim-circle-btn"
          onClick={onStep}
          disabled={!simulationPaused}
          title="Avançar Um Passo"
          aria-label="Avançar"
        >
          {Icons.step}
        </button>
      </div>

      <div className="sim-bar-spacer" />

      {/* ─── Controle de zoom (direita) ─── */}
      <div className="sim-bar-right">
        <button
          className="sim-zoom-icon-btn"
          onClick={onZoomOut}
          title="Diminuir Zoom"
          aria-label="Diminuir Zoom"
        >
          {Icons.zoomOut}
        </button>

        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={zoomSliderValue}
          onChange={(e) => onZoomSlider(parseFloat(e.target.value))}
          className="sim-zoom-slider"
          title={`Zoom: ${Math.round(zoomSliderValue)}%`}
          aria-label="Zoom"
        />

        <button
          className="sim-zoom-icon-btn"
          onClick={onZoomIn}
          title="Aumentar Zoom"
          aria-label="Aumentar Zoom"
        >
          {Icons.zoomIn}
        </button>
      </div>
    </div>
  );
}
