import React, { useMemo, useState } from 'react';
import { propagate } from '../engine/propagation.js';
import { asBool } from '../engine/components.js';

// ─────────────────────────────────────────────────────────────
// Gera a tabela verdade a partir do estado atual do circuito
// ─────────────────────────────────────────────────────────────
function generateTruthTable(components, wires) {
  // 1. Identificar inputs (InputSwitch) e outputs (OutputProbe)
  const inputs  = components.filter(c => c.type === 'INPUT');
  const outputs = components.filter(c => c.type === 'OUTPUT');

  if (inputs.length === 0)  return { error: 'Nenhuma entrada (Input Switch) encontrada no circuito.' };
  if (outputs.length === 0) return { error: 'Nenhuma saída (Output Probe) encontrada no circuito.' };
  if (inputs.length > 8)    return { error: `Muitas entradas (${inputs.length}). O máximo suportado é 8 para evitar tabelas com mais de 256 linhas.` };

  const n = inputs.length;
  const rows = [];

  // Salvar estado original dos inputs para restaurar depois
  const originalStates = inputs.map(c => c.state);

  // 2. Iterar por todas as 2^n combinações
  for (let mask = 0; mask < (1 << n); mask++) {
    // Definir o estado de cada input conforme o bit correspondente
    inputs.forEach((inp, i) => {
      inp.state = !!(mask & (1 << (n - 1 - i)));
    });

    // Propagar o circuito (clockTime = 0 evita tick de clocks)
    propagate(components, wires, 0);

    // Coletar valores de entrada e saída
    const inputVals  = inputs.map(c => c.outputs[0].value);
    const outputVals = outputs.map(c => asBool(c.inputs[0].value));

    rows.push({ inputVals, outputVals });
  }

  // 3. Restaurar estado original
  inputs.forEach((c, i) => { c.state = originalStates[i]; });
  propagate(components, wires, 0);

  return {
    inputLabels:  inputs.map(c => c.label || c.id),
    outputLabels: outputs.map(c => c.label || c.id),
    rows,
  };
}

// ─────────────────────────────────────────────────────────────
// Exporta como CSV
// ─────────────────────────────────────────────────────────────
function exportCSV(table) {
  const header = [...table.inputLabels, ...table.outputLabels].join(',');
  const body = table.rows.map(r =>
    [...r.inputVals, ...r.outputVals].map(v => v ? '1' : '0').join(',')
  ).join('\n');
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tabela_verdade.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// Modal principal
// ─────────────────────────────────────────────────────────────
export default function TruthTableModal({ components, wires, onClose }) {
  const [highlight, setHighlight] = useState(null); // índice da linha hover

  const table = useMemo(
    () => generateTruthTable(components, wires),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="tt-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="tt-header">
          <div className="tt-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{marginRight:8}}>
              <rect x="3" y="4" width="18" height="16" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none"/>
              <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.4"/>
              <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="1.4"/>
              <line x1="15" y1="4" x2="15" y2="20" stroke="currentColor" strokeWidth="1.4"/>
              <line x1="3" y1="14" x2="21" y2="14" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
            Tabela Verdade
          </div>
          <div className="tt-header-actions">
            {!table.error && (
              <button className="tt-btn-export" onClick={() => exportCSV(table)} title="Exportar como CSV">
                ⬇ Exportar CSV
              </button>
            )}
            <button className="tt-btn-close" onClick={onClose} title="Fechar">✕</button>
          </div>
        </div>

        {/* ── Conteúdo ── */}
        {table.error ? (
          <div className="tt-error">
            <span className="tt-error-icon">⚠️</span>
            <p>{table.error}</p>
          </div>
        ) : (
          <>
            {/* Info rápida */}
            <div className="tt-info">
              <span>{table.inputLabels.length} entrada{table.inputLabels.length !== 1 ? 's' : ''}</span>
              <span className="tt-info-sep">·</span>
              <span>{table.outputLabels.length} saída{table.outputLabels.length !== 1 ? 's' : ''}</span>
              <span className="tt-info-sep">·</span>
              <span>{table.rows.length} linhas</span>
            </div>

            {/* Tabela */}
            <div className="tt-scroll">
              <table className="tt-table">
                <thead>
                  <tr>
                    <th className="tt-th tt-th-row">#</th>
                    {table.inputLabels.map((label, i) => (
                      <th key={`in-${i}`} className="tt-th tt-th-input">{label}</th>
                    ))}
                    <th className="tt-th tt-th-divider" />
                    {table.outputLabels.map((label, i) => (
                      <th key={`out-${i}`} className="tt-th tt-th-output">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, ri) => (
                    <tr
                      key={ri}
                      className={`tt-tr ${highlight === ri ? 'highlight' : ''}`}
                      onMouseEnter={() => setHighlight(ri)}
                      onMouseLeave={() => setHighlight(null)}
                    >
                      <td className="tt-td tt-td-row">{ri}</td>
                      {row.inputVals.map((v, i) => (
                        <td key={`iv-${i}`} className={`tt-td tt-td-bit tt-td-input ${v ? 'bit-hi' : 'bit-lo'}`}>
                          {v ? '1' : '0'}
                        </td>
                      ))}
                      <td className="tt-td tt-td-divider" />
                      {row.outputVals.map((v, i) => (
                        <td key={`ov-${i}`} className={`tt-td tt-td-bit tt-td-output ${v ? 'bit-hi' : 'bit-lo'}`}>
                          {v ? '1' : '0'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
