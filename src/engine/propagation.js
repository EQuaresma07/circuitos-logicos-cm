// ════════════════════════════════════════════════════════════
//  ENGINE — Propagação de Sinais
// ════════════════════════════════════════════════════════════

import { InputSwitch, Clock } from './components.js';

// Ordenação topológica para definir ordem de avaliação
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
  // Se houver ciclo, adiciona o restante
  components.forEach(c => { if (!order.includes(c.id)) order.push(c.id); });
  return order;
}

export function propagate(components, wires, clockTime) {
  const compMap = new Map(components.map(c => [c.id, c]));
  const order = topoSort(components, wires);

  // 1. Avalia fontes (inputs e clocks)
  components.forEach(c => {
    if (c instanceof InputSwitch || c instanceof Clock) {
      if (c instanceof Clock) c.tick(clockTime);
      c.evaluate();
    }
  });

  // 2. Propaga em ordem topológica
  for (const id of order) {
    const comp = compMap.get(id);
    if (!comp) continue; // guard: componente pode ter sido deletado
    wires.forEach(w => {
      if (w.to.owner.id === id) {
        w.to.value = w.from.value;
      }
    });
    comp.evaluate();
  }
}
