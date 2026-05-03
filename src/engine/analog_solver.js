// ════════════════════════════════════════════════════════════
//  ENGINE ANALÓGICA — Modified Nodal Analysis (MNA)
//
//  Resolve circuitos resistivos lineares com fontes de tensão.
//  Cada nó tem uma tensão (V), cada fonte de tensão adiciona
//  uma incógnita extra (corrente que flui por ela).
//
//  Algoritmo:
//    1. Identifica todos os nós elétricos (grupos de pinos
//       analógicos conectados por fios) → nodeId
//    2. Define o nó GROUND (0V) — qualquer fonte com terminal
//       a "−" conectado → vira referência. Se não houver, escolhe
//       o primeiro nó como GND.
//    3. Monta sistema A·x = z onde x = [V_n1, V_n2, ..., I_v1, I_v2, ...]
//    4. Resolve por eliminação gaussiana
//    5. Distribui as tensões resultantes em cada pino analógico
// ════════════════════════════════════════════════════════════

import { AnalogComponent, isAnalogPin } from './analog_components.js';

// Resolve A·x = z por eliminação gaussiana com pivoteamento parcial.
// A é matriz quadrada NxN, z é vetor N. Retorna x ou null se singular.
function gaussSolve(A, z) {
  const n = A.length;
  // Cópia para não destruir originais
  const M = A.map(row => row.slice());
  const b = z.slice();

  for (let i = 0; i < n; i++) {
    // Pivot parcial
    let maxAbs = Math.abs(M[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxAbs) {
        maxAbs = Math.abs(M[k][i]);
        maxRow = k;
      }
    }
    if (maxAbs < 1e-12) return null; // singular
    if (maxRow !== i) {
      [M[i], M[maxRow]] = [M[maxRow], M[i]];
      [b[i], b[maxRow]] = [b[maxRow], b[i]];
    }

    // Eliminação
    for (let k = i + 1; k < n; k++) {
      const factor = M[k][i] / M[i][i];
      for (let j = i; j < n; j++) M[k][j] -= factor * M[i][j];
      b[k] -= factor * b[i];
    }
  }

  // Substituição reversa
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = b[i];
    for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
    x[i] = sum / M[i][i];
  }
  return x;
}

// Identifica nós elétricos: agrupa pinos analógicos por conectividade.
// Retorna { pinToNode: Map<pinId, nodeIdx>, nodeCount: int, nodeToPins: Map<idx, Pin[]> }
function findNodes(components, wires) {
  const parent = new Map(); // pinId -> pinId (union-find)

  // Coleta apenas pinos analógicos
  const analogPins = [];
  for (const comp of components) {
    for (const pin of [...comp.inputs, ...comp.outputs]) {
      if (isAnalogPin(pin)) {
        parent.set(pin.id, pin.id);
        analogPins.push(pin);
      }
    }
  }

  function find(x) {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)));
      x = parent.get(x);
    }
    return x;
  }

  function union(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  // Une pinos conectados por fio (ambos analógicos)
  for (const w of wires) {
    if (isAnalogPin(w.from) && isAnalogPin(w.to)) {
      union(w.from.id, w.to.id);
    }
  }

  // Atribui índice de nó a cada raiz
  const rootToIdx = new Map();
  let nextIdx = 0;
  const pinToNode = new Map();
  const nodeToPins = new Map();

  for (const pin of analogPins) {
    const root = find(pin.id);
    if (!rootToIdx.has(root)) {
      rootToIdx.set(root, nextIdx);
      nodeToPins.set(nextIdx, []);
      nextIdx++;
    }
    const idx = rootToIdx.get(root);
    pinToNode.set(pin.id, idx);
    nodeToPins.get(idx).push(pin);
  }

  return { pinToNode, nodeCount: nextIdx, nodeToPins };
}

// Encontra o nó GND (referência 0V).
// Heurística: usa groundPin de algum componente; se não houver, usa um
// pino com _forcedVoltage = 0 (cross-domain LOW); senão, primeiro nó.
function findGroundNode(components, pinToNode, nodeToPins) {
  for (const comp of components) {
    if (comp.groundPin && pinToNode.has(comp.groundPin.id)) {
      return pinToNode.get(comp.groundPin.id);
    }
  }
  // Procura pinos forçados a 0V
  for (const [nodeIdx, pins] of nodeToPins.entries()) {
    for (const p of pins) {
      if (p._forcedVoltage === 0) return nodeIdx;
    }
  }
  return 0;
}

// ════════════════════════════════════════════════════════════
//  Solver MNA principal
// ════════════════════════════════════════════════════════════

export function solveAnalog(components, wires, simTime) {
  // 1. Identificar nós analógicos
  const { pinToNode, nodeCount, nodeToPins } = findNodes(components, wires);

  if (nodeCount === 0) return; // sem componentes analógicos

  // 2. Identificar nó GND
  const gndIdx = findGroundNode(components, pinToNode, nodeToPins);

  // 3. Coletar componentes analógicos (que contribuem para a matriz)
  const analogComps = components.filter(c => c instanceof AnalogComponent);

  // Identificar fontes de tensão (precisam de variável extra de corrente)
  const voltageSources = [];
  for (const c of analogComps) {
    if (c.isVoltageSource) {
      // Atualizar valor da fonte conforme o tempo
      c.updateValue?.(simTime);
      voltageSources.push(c);
    }
  }

  // 4. Mapeamento de índices: nós (excluindo GND) + correntes de fontes
  // Reordenar: nós não-GND ocupam índices 0 .. (n-2), e fontes ocupam (n-1) .. (n-2+m)
  const nonGndNodes = [];
  for (let i = 0; i < nodeCount; i++) {
    if (i !== gndIdx) nonGndNodes.push(i);
  }
  const nodeToMatrixIdx = new Map();
  nonGndNodes.forEach((nodeIdx, mIdx) => nodeToMatrixIdx.set(nodeIdx, mIdx));
  // Adicionar GND mapeado para -1 (sentinela)
  nodeToMatrixIdx.set(gndIdx, -1);

  const N = nonGndNodes.length;
  const M = voltageSources.length;
  const size = N + M;

  if (size === 0) {
    // Só GND — todas as tensões são 0
    for (const pin of [...nodeToPins.values()].flat()) {
      pin.voltage = 0;
    }
    return;
  }

  // 5. Construir matriz A (size x size) e vetor z (size)
  const A = Array.from({ length: size }, () => new Array(size).fill(0));
  const z = new Array(size).fill(0);

  // Helper: stamp condutância G entre nós a e b
  function stampG(a, b, G) {
    const ai = nodeToMatrixIdx.get(a);
    const bi = nodeToMatrixIdx.get(b);
    if (ai >= 0) A[ai][ai] += G;
    if (bi >= 0) A[bi][bi] += G;
    if (ai >= 0 && bi >= 0) {
      A[ai][bi] -= G;
      A[bi][ai] -= G;
    }
  }

  // Helper: stamp fonte de tensão V entre nós a (+) e b (-), com índice k
  function stampV(a, b, V, k) {
    const ai = nodeToMatrixIdx.get(a);
    const bi = nodeToMatrixIdx.get(b);
    const ki = N + k;
    if (ai >= 0) {
      A[ai][ki] += 1;
      A[ki][ai] += 1;
    }
    if (bi >= 0) {
      A[bi][ki] -= 1;
      A[ki][bi] -= 1;
    }
    z[ki] = V;
  }

  // Helper: stamp fonte de corrente I de a para b (positivo se sai de b e entra em a)
  function stampI(a, b, I) {
    const ai = nodeToMatrixIdx.get(a);
    const bi = nodeToMatrixIdx.get(b);
    if (ai >= 0) z[ai] += I;
    if (bi >= 0) z[bi] -= I;
  }

  // 6. Stampar cada componente analógico
  let vsIdx = 0;
  for (const comp of analogComps) {
    if (comp.isVoltageSource) {
      // Fonte de tensão: pinPos (+) e pinNeg (−)
      const np = pinToNode.get(comp.pinPos.id);
      const nn = pinToNode.get(comp.pinNeg.id);
      if (np !== undefined && nn !== undefined) {
        stampV(np, nn, comp.value, vsIdx);
      }
      vsIdx++;
    } else if (comp.isResistor) {
      // Resistor: condutância 1/R entre os dois pinos
      const na = pinToNode.get(comp.pinA.id);
      const nb = pinToNode.get(comp.pinB.id);
      if (na !== undefined && nb !== undefined) {
        const G = 1 / Math.max(0.001, comp.resistance);
        stampG(na, nb, G);
      }
    } else if (comp.isCurrentSource) {
      const np = pinToNode.get(comp.pinPos.id);
      const nn = pinToNode.get(comp.pinNeg.id);
      if (np !== undefined && nn !== undefined) {
        stampI(np, nn, comp.current);
      }
    } else if (comp.isMeter) {
      // Voltímetro: alta impedância (1MΩ) para não perturbar o circuito
      const np = pinToNode.get(comp.pinPos.id);
      const nn = pinToNode.get(comp.pinNeg.id);
      if (np !== undefined && nn !== undefined) {
        stampG(np, nn, 1e-6); // 1MΩ
      }
    }
  }

  // 6b. Stampar pinos analógicos com tensão forçada (cross-domain digital→analog)
  // Cada pino com _forcedVoltage definido vira uma fonte de tensão virtual
  // contra GND, com a corrente dela tratada como mais uma incógnita.
  // Para evitar realocar matriz, usamos uma técnica simples: stampamos uma
  // condutância grande para GND e uma corrente equivalente (modelo de Norton).
  //   I_norton = V_forced / R_pequeno; G_pequeno = 1/R_pequeno
  // Isso "puxa" o nó para a tensão forçada com força.
  const FORCED_R = 1; // 1Ω — bem pequeno para "fixar" o nó
  const G_FORCED = 1 / FORCED_R;
  for (const [nodeIdx, pins] of nodeToPins.entries()) {
    if (nodeIdx === gndIdx) continue;
    for (const pin of pins) {
      if (pin._forcedVoltage !== undefined) {
        const mIdx = nodeToMatrixIdx.get(nodeIdx);
        if (mIdx >= 0) {
          A[mIdx][mIdx] += G_FORCED;
          z[mIdx] += pin._forcedVoltage * G_FORCED;
        }
        break; // basta um pino forçado por nó
      }
    }
  }

  // Estabilidade numérica: adiciona pequena condutância de cada nó para GND
  // (evita matriz singular quando há nós flutuantes)
  for (let i = 0; i < N; i++) {
    A[i][i] += 1e-9;
  }

  // 7. Resolver
  const x = gaussSolve(A, z);
  if (!x) {
    // Falha numérica — zera tudo
    for (const pin of [...nodeToPins.values()].flat()) {
      pin.voltage = 0;
    }
    return;
  }

  // 8. Distribuir tensões nos pinos
  for (const [nodeIdx, pins] of nodeToPins.entries()) {
    let V;
    if (nodeIdx === gndIdx) V = 0;
    else V = x[nodeToMatrixIdx.get(nodeIdx)] || 0;
    for (const pin of pins) pin.voltage = V;
  }

  // 9. Atualizar correntes nas fontes de tensão
  vsIdx = 0;
  for (const comp of analogComps) {
    if (comp.isVoltageSource) {
      comp.lastCurrent = x[N + vsIdx] || 0;
      vsIdx++;
    }
  }

  // 10. Avaliar cada componente (ex: voltímetro lê V_pos − V_neg)
  for (const comp of analogComps) {
    comp.evaluate?.();
  }
}
