// ════════════════════════════════════════════════════════════
//  ENGINE — Propagação de Sinais
//  Suporta três estados (true / false / null=HIGH-Z)
//  e resolução de conflitos para Pull Up/Down + Tri-State.
//
//  Regra de prioridade:
//    Sinal ativo (true/false) > Pull (Up/Down) > High-Z (null)
//
//  Quando múltiplas fontes alimentam o mesmo pino de entrada:
//    1. Se houver pelo menos 1 fonte com valor não-null e não-Pull → vence (a primeira)
//    2. Senão, se houver Pull → assume valor do Pull
//    3. Senão → null (alta impedância)
// ════════════════════════════════════════════════════════════

import { InputSwitch, PushButton, Clock, HighConstant, LowConstant, PullUp, PullDown } from './components.js';

function topoSort(components, wires) {
  const adj = new Map();
  const indeg = new Map();
  components.forEach(c => { adj.set(c.id, []); indeg.set(c.id, 0); });

  wires.forEach(w => {
    const from = w.from.owner.id;
    const to = w.to.owner.id;
    if (from !== to) {
      adj.get(from).push(to);
      indeg.set(to, (indeg.get(to) || 0) + 1);
    }
  });

  const queue = [];
  indeg.forEach((deg, id) => { if (deg === 0) queue.push(id); });
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    (adj.get(id) || []).forEach(nid => {
      indeg.set(nid, indeg.get(nid) - 1);
      if (indeg.get(nid) === 0) queue.push(nid);
    });
  }
  components.forEach(c => { if (!order.includes(c.id)) order.push(c.id); });
  return order;
}

// Resolve o valor que chega num pino de entrada considerando todos os fios
// que terminam nele (mesmo que conceitualmente só permitamos 1, a regra
// de prioridade Pull/HighZ/Active vale para 1 fio também).
function resolvePinValue(pin, wires) {
  const incoming = wires.filter(w => w.to.id === pin.id);
  if (incoming.length === 0) return null; // desconectado

  let activeValue = undefined;
  let pullValue = undefined;

  for (const w of incoming) {
    const src = w.from;
    const v = src.value;
    if (src.isPull) {
      if (pullValue === undefined) pullValue = src.pullValue;
    } else if (v === null || v === undefined) {
      // HIGH-Z, não contribui
    } else {
      if (activeValue === undefined) activeValue = !!v;
    }
  }

  if (activeValue !== undefined) return activeValue;
  if (pullValue !== undefined) return pullValue;
  return null; // tudo HIGH-Z
}

export function propagate(components, wires, clockTime) {
  const compMap = new Map(components.map(c => [c.id, c]));
  const order = topoSort(components, wires);

  // 1. Avalia fontes (inputs + clocks + constants + pulls)
  components.forEach(c => {
    if (c instanceof InputSwitch ||
        c instanceof PushButton ||
        c instanceof Clock ||
        c instanceof HighConstant ||
        c instanceof LowConstant ||
        c instanceof PullUp ||
        c instanceof PullDown) {
      if (c instanceof Clock) c.tick(clockTime);
      c.evaluate();
    }
  });

  // 2. Propaga em ordem topológica
  for (const id of order) {
    const comp = compMap.get(id);
    if (!comp) continue;

    // Resolve valor de cada pino de entrada considerando Pull/HighZ
    for (const pin of comp.inputs) {
      const resolved = resolvePinValue(pin, wires);
      // Para entradas regulares: HIGH-Z é tratado como false (asBool faz isso)
      pin.value = resolved;
    }
    comp.evaluate();
  }
}
