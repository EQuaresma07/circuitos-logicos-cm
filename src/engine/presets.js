// ════════════════════════════════════════════════════════════
//  PRESETS — Circuitos pré-montados
// ════════════════════════════════════════════════════════════

import { InputSwitch, OutputProbe, Gate, Wire, uid } from './components.js';

export function buildHalfAdder() {
  const a = new InputSwitch(uid(), 'A');
  const b = new InputSwitch(uid(), 'B');
  const xorG = new Gate(uid(), 'XOR');
  const andG = new Gate(uid(), 'AND');
  const sumOut = new OutputProbe(uid(), 'Sum');
  const carryOut = new OutputProbe(uid(), 'Carry');

  a.x = 60; a.y = 80;
  b.x = 60; b.y = 200;
  xorG.x = 320; xorG.y = 70;
  andG.x = 320; andG.y = 200;
  sumOut.x = 580; sumOut.y = 70;
  carryOut.x = 580; carryOut.y = 200;

  const comps = [a, b, xorG, andG, sumOut, carryOut];
  const wires = [
    new Wire(uid(), a.outputs[0], xorG.inputs[0]),
    new Wire(uid(), b.outputs[0], xorG.inputs[1]),
    new Wire(uid(), a.outputs[0], andG.inputs[0]),
    new Wire(uid(), b.outputs[0], andG.inputs[1]),
    new Wire(uid(), xorG.outputs[0], sumOut.inputs[0]),
    new Wire(uid(), andG.outputs[0], carryOut.inputs[0]),
  ];

  return { components: comps, wires };
}

export function buildSRLatch() {
  const s = new InputSwitch(uid(), 'S');
  const r = new InputSwitch(uid(), 'R');
  const nor1 = new Gate(uid(), 'NOR');
  const nor2 = new Gate(uid(), 'NOR');
  const qOut = new OutputProbe(uid(), 'Q');
  const qBarOut = new OutputProbe(uid(), 'Q\u0305');

  s.x = 60; s.y = 80;
  r.x = 60; r.y = 240;
  nor1.x = 320; nor1.y = 70;
  nor2.x = 320; nor2.y = 230;
  qOut.x = 580; qOut.y = 70;
  qBarOut.x = 580; qBarOut.y = 230;

  const comps = [s, r, nor1, nor2, qOut, qBarOut];
  const wires = [
    new Wire(uid(), s.outputs[0], nor1.inputs[0]),
    new Wire(uid(), nor2.outputs[0], nor1.inputs[1]),
    new Wire(uid(), r.outputs[0], nor2.inputs[1]),
    new Wire(uid(), nor1.outputs[0], nor2.inputs[0]),
    new Wire(uid(), nor1.outputs[0], qOut.inputs[0]),
    new Wire(uid(), nor2.outputs[0], qBarOut.inputs[0]),
  ];

  return { components: comps, wires };
}
