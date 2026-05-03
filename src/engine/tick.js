// ════════════════════════════════════════════════════════════
//  TICK UNIFICADO — Coordena engines digital e analógica
//
//  Estratégia:
//    1. Propagação digital primeiro (resolve pin.value digitais)
//    2. Para cada fio cross-domain digital→analógico, marca o
//       pino analógico destino como tendo tensão "forçada"
//       (5V se HIGH, 0V se LOW). O solver vai stampar isso
//       como uma fonte de tensão virtual.
//    3. Solver analógico: resolve com as tensões forçadas
//    4. Para cada fio cross-domain analógico→digital, atualiza
//       pin.value boolean baseado na tensão lida
//    5. Re-roda propagação digital se houve cross-domain A→D
//    6. Amostragem do osciloscópio
// ════════════════════════════════════════════════════════════

import { propagate } from './propagation.js';
import { solveAnalog } from './analog_solver.js';
import {
  isAnalogPin,
  voltageToDigital,
  digitalToVoltage,
} from './analog_components.js';

// Identifica e marca fios cross-domain
function classifyCrossDomain(wires) {
  for (const w of wires) {
    const fromAnalog = isAnalogPin(w.from);
    const toAnalog = isAnalogPin(w.to);
    w._crossA2D = fromAnalog && !toAnalog;
    w._crossD2A = !fromAnalog && toAnalog;
  }
}

// Aplica saídas digitais aos pinos analógicos cross-domain
function applyDigitalToAnalogPins(wires) {
  for (const w of wires) {
    if (w._crossD2A) {
      delete w.to._forcedVoltage;
    }
  }
  for (const w of wires) {
    if (w._crossD2A) {
      const v = digitalToVoltage(w.from.value);
      w.to._forcedVoltage = v;
    }
  }
}

// Após o solver, propaga tensões para o domínio digital cross-domain
function applyAnalogToDigitalPins(wires) {
  let changed = false;
  for (const w of wires) {
    if (w._crossA2D) {
      const newVal = voltageToDigital(w.from.voltage);
      if (w.from.value !== newVal) changed = true;
      w.from.value = newVal;
    }
  }
  return changed;
}

export function tick(components, wires, simTime) {
  classifyCrossDomain(wires);
  propagate(components, wires, simTime);
  applyDigitalToAnalogPins(wires);
  solveAnalog(components, wires, simTime);
  const aChanged = applyAnalogToDigitalPins(wires);
  if (aChanged) {
    propagate(components, wires, simTime);
  }
  for (const c of components) {
    if (c.type === 'SCOPE' && typeof c.sample === 'function') {
      c.sample(simTime);
    }
  }
}
