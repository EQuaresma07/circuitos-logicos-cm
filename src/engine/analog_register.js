// ════════════════════════════════════════════════════════════
//  Registro dos tipos analógicos no factory unificado
//  Esse arquivo deve ser importado uma vez ao boot da aplicação
//  (em main.jsx) — depois disso, createComponent() em components.js
//  passa a conhecer os tipos analógicos.
// ════════════════════════════════════════════════════════════

import { registerComponentType } from './components.js';
import {
  DCSource, ACSource, SquareWaveSource,
  Resistor, Voltmeter, Oscilloscope,
} from './analog_components.js';

registerComponentType('DC_SOURCE',     (cid) => new DCSource(cid));
registerComponentType('AC_SOURCE',     (cid) => new ACSource(cid));
registerComponentType('SQUARE_SOURCE', (cid) => new SquareWaveSource(cid));
registerComponentType('RESISTOR',      (cid) => new Resistor(cid));
registerComponentType('VOLTMETER',     (cid) => new Voltmeter(cid));
registerComponentType('SCOPE',         (cid) => new Oscilloscope(cid));

// Re-exporta createComponent para conveniência
export { createComponent } from './components.js';
