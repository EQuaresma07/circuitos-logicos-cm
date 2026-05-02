// ════════════════════════════════════════════════════════════
//  ENGINE — Estruturas de Dados
//  Suporta três estados: true (HIGH), false (LOW), null (HIGH-Z)
// ════════════════════════════════════════════════════════════

// Helper: trata HIGH-Z como false em contextos booleanos
export function asBool(v) {
  return v === true;
}

export class Pin {
  constructor(id, name, direction, owner) {
    this.id = id;
    this.name = name;
    this.direction = direction;
    this.owner = owner;
    this.value = false;
    this.connections = [];
  }
}

export class Wire {
  constructor(id, fromPin, toPin) {
    this.id = id;
    this.from = fromPin;
    this.to = toPin;
  }
  get value() {
    return this.from.value;
  }
}

export class Component {
  constructor(id, type, label) {
    this.id = id;
    this.type = type;
    this.label = label || type;
    this.inputs = [];
    this.outputs = [];
    this.x = 0;
    this.y = 0;
    this.rotation = 0; // 0, 90, 180, 270 (graus)
  }
  evaluate() { /* override */ }
}

// ════════════════════════════════════════════════════════════
//  Inputs
// ════════════════════════════════════════════════════════════

export class InputSwitch extends Component {
  constructor(id, label) {
    super(id, 'INPUT', label || 'IN');
    this.outputs.push(new Pin(`${id}_out`, 'OUT', 'output', this));
    this.state = false;
  }
  toggle() { this.state = !this.state; }
  evaluate() { this.outputs[0].value = this.state; }
}

// Push Button: state é controlado externamente (mousedown/up)
export class PushButton extends Component {
  constructor(id, label) {
    super(id, 'BUTTON', label || 'BTN');
    this.outputs.push(new Pin(`${id}_out`, 'OUT', 'output', this));
    this.state = false;
  }
  press() { this.state = true; }
  release() { this.state = false; }
  evaluate() { this.outputs[0].value = this.state; }
}

// Constant rígido: força o valor (vence sobre Pull)
export class HighConstant extends Component {
  constructor(id) {
    super(id, 'HIGH', '1');
    this.outputs.push(new Pin(`${id}_out`, 'OUT', 'output', this));
  }
  evaluate() { this.outputs[0].value = true; }
}

export class LowConstant extends Component {
  constructor(id) {
    super(id, 'LOW', '0');
    this.outputs.push(new Pin(`${id}_out`, 'OUT', 'output', this));
  }
  evaluate() { this.outputs[0].value = false; }
}

// Pull Up/Down: força valor padrão APENAS se nenhum sinal ativo está conectado.
// Marcamos com flag isPull para a propagação tratar de forma especial.
export class PullUp extends Component {
  constructor(id) {
    super(id, 'PULLUP', 'PU');
    this.outputs.push(new Pin(`${id}_out`, 'OUT', 'output', this));
    this.outputs[0].isPull = true;
    this.outputs[0].pullValue = true;
  }
  evaluate() { this.outputs[0].value = true; }
}

export class PullDown extends Component {
  constructor(id) {
    super(id, 'PULLDOWN', 'PD');
    this.outputs.push(new Pin(`${id}_out`, 'OUT', 'output', this));
    this.outputs[0].isPull = true;
    this.outputs[0].pullValue = false;
  }
  evaluate() { this.outputs[0].value = false; }
}

export class Clock extends Component {
  constructor(id, label, periodMs = 1000) {
    super(id, 'CLOCK', label || 'CLK');
    this.outputs.push(new Pin(`${id}_out`, 'OUT', 'output', this));
    this.periodMs = periodMs;
    this.state = false;
  }
  tick(time) {
    this.state = Math.floor(time / this.periodMs) % 2 === 0;
  }
  evaluate() { this.outputs[0].value = this.state; }
}

// ════════════════════════════════════════════════════════════
//  Outputs
// ════════════════════════════════════════════════════════════

export class OutputProbe extends Component {
  constructor(id, label) {
    super(id, 'OUTPUT', label || 'OUT');
    this.inputs.push(new Pin(`${id}_in`, 'IN', 'input', this));
  }
  evaluate() {}
  get value() { return asBool(this.inputs[0].value); }
}

// 4-Bit Digit: 4 entradas D3..D0, exibe hex 0-F
export class FourBitDigit extends Component {
  constructor(id, label) {
    super(id, 'DIGIT4', label || 'HEX');
    // Ordem de criação: D3 (MSB) → D0 (LSB)
    for (let i = 3; i >= 0; i--) {
      this.inputs.push(new Pin(`${id}_in${i}`, `D${i}`, 'input', this));
    }
  }
  evaluate() {}
  get value() {
    // inputs[0] = D3 (MSB), inputs[3] = D0 (LSB)
    const d3 = asBool(this.inputs[0].value) ? 8 : 0;
    const d2 = asBool(this.inputs[1].value) ? 4 : 0;
    const d1 = asBool(this.inputs[2].value) ? 2 : 0;
    const d0 = asBool(this.inputs[3].value) ? 1 : 0;
    return d3 + d2 + d1 + d0;
  }
  get hex() {
    return this.value.toString(16).toUpperCase();
  }
}

// ════════════════════════════════════════════════════════════
//  Logic Gates
// ════════════════════════════════════════════════════════════

export const GATE_DEFS = {
  AND:    { inputs: 2, fn: (vals) => vals.every(v => v) },
  OR:     { inputs: 2, fn: (vals) => vals.some(v => v) },
  NOT:    { inputs: 1, fn: (vals) => !vals[0] },
  NAND:   { inputs: 2, fn: (vals) => !vals.every(v => v) },
  NOR:    { inputs: 2, fn: (vals) => !vals.some(v => v) },
  XOR:    { inputs: 2, fn: (vals) => vals.reduce((a, b) => a !== b, false) },
  XNOR:   { inputs: 2, fn: (vals) => !vals.reduce((a, b) => a !== b, false) },
  BUFFER: { inputs: 1, fn: (vals) => !!vals[0] },
};

// Tipos que suportam expansão de pinos (2..8)
export const EXPANDABLE_GATES = new Set(['AND', 'OR', 'NAND', 'NOR']);

export class Gate extends Component {
  constructor(id, gateType, inputCount) {
    super(id, gateType, gateType);
    const def = GATE_DEFS[gateType];
    let count = def.inputs;
    if (EXPANDABLE_GATES.has(gateType) && inputCount) {
      count = Math.max(2, Math.min(8, inputCount));
    }
    this.inputCount = count;
    for (let i = 0; i < count; i++) {
      this.inputs.push(new Pin(`${id}_in${i}`, String.fromCharCode(65 + i), 'input', this));
    }
    this.outputs.push(new Pin(`${id}_out`, 'Q', 'output', this));
    this.gateFn = def.fn;
  }
  evaluate() {
    const vals = this.inputs.map(p => asBool(p.value));
    this.outputs[0].value = this.gateFn(vals);
  }
  // Reconstrói pinos quando inputCount muda (preserva ID base do componente)
  setInputCount(n) {
    if (!EXPANDABLE_GATES.has(this.type)) return;
    const next = Math.max(2, Math.min(8, n));
    if (next === this.inputCount) return;
    this.inputCount = next;
    this.inputs = [];
    for (let i = 0; i < next; i++) {
      this.inputs.push(new Pin(`${this.id}_in${i}`, String.fromCharCode(65 + i), 'input', this));
    }
  }
}

// Schmitt Trigger Inverter — limpa sinais ruidosos com histerese.
// Como estamos no domínio digital puro, comporta-se como um NOT
// mas com flag que sinaliza "limpa transições" (no analógico real teria thresholds).
export class SchmittTrigger extends Component {
  constructor(id) {
    super(id, 'SCHMITT', '⎍');
    this.inputs.push(new Pin(`${id}_in`, 'A', 'input', this));
    this.outputs.push(new Pin(`${id}_out`, 'Q', 'output', this));
    this._lastOut = false;
  }
  evaluate() {
    const a = asBool(this.inputs[0].value);
    // Inversor com histerese — em digital, idêntico a NOT, mas mantemos lastOut
    // para futura modelagem de hysteresis se necessário.
    const out = !a;
    this._lastOut = out;
    this.outputs[0].value = out;
  }
}

// Tri-State Buffer: 2 inputs (data, enable). Quando enable=0, saída = null (HIGH-Z).
export class TriStateBuffer extends Component {
  constructor(id) {
    super(id, 'TRISTATE', 'TRI');
    this.inputs.push(new Pin(`${id}_in_d`, 'D', 'input', this));
    this.inputs.push(new Pin(`${id}_in_e`, 'E', 'input', this));
    this.outputs.push(new Pin(`${id}_out`, 'Q', 'output', this));
  }
  evaluate() {
    const enable = asBool(this.inputs[1].value);
    if (!enable) {
      this.outputs[0].value = null; // HIGH-Z
    } else {
      this.outputs[0].value = asBool(this.inputs[0].value);
    }
  }
}

// ════════════════════════════════════════════════════════════
//  Flip-Flops (edge-triggered, borda de subida)
// ════════════════════════════════════════════════════════════

class EdgeFlipFlop extends Component {
  constructor(id, type, label) {
    super(id, type, label);
    this._lastClk = false;
    this.q = false;
  }
  // detecta borda de subida no clock
  _risingEdge(clkIdx) {
    const now = asBool(this.inputs[clkIdx].value);
    const rising = now && !this._lastClk;
    this._lastClk = now;
    return rising;
  }
}

// SR Flip-Flop: edge-triggered. Inputs: S, R, CLK. Outputs: Q, Q'.
export class SRFlipFlop extends EdgeFlipFlop {
  constructor(id) {
    super(id, 'SR_FF', 'SR');
    this.inputs.push(new Pin(`${id}_in_s`,  'S',   'input', this));
    this.inputs.push(new Pin(`${id}_in_r`,  'R',   'input', this));
    this.inputs.push(new Pin(`${id}_in_c`,  'CLK', 'input', this));
    this.outputs.push(new Pin(`${id}_out_q`,  'Q',  'output', this));
    this.outputs.push(new Pin(`${id}_out_qb`, 'Q\u0305', 'output', this));
  }
  evaluate() {
    const rising = this._risingEdge(2);
    if (rising) {
      const s = asBool(this.inputs[0].value);
      const r = asBool(this.inputs[1].value);
      if (s && !r) this.q = true;
      else if (r && !s) this.q = false;
      // SR=11 indeterminado: mantém estado anterior
    }
    this.outputs[0].value = this.q;
    this.outputs[1].value = !this.q;
  }
}

// D Flip-Flop: na borda, Q ← D
export class DFlipFlop extends EdgeFlipFlop {
  constructor(id) {
    super(id, 'D_FF', 'D');
    this.inputs.push(new Pin(`${id}_in_d`, 'D',   'input', this));
    this.inputs.push(new Pin(`${id}_in_c`, 'CLK', 'input', this));
    this.outputs.push(new Pin(`${id}_out_q`,  'Q',  'output', this));
    this.outputs.push(new Pin(`${id}_out_qb`, 'Q\u0305', 'output', this));
  }
  evaluate() {
    if (this._risingEdge(1)) {
      this.q = asBool(this.inputs[0].value);
    }
    this.outputs[0].value = this.q;
    this.outputs[1].value = !this.q;
  }
}

// JK Flip-Flop: J=Set, K=Reset, JK=11=Toggle
export class JKFlipFlop extends EdgeFlipFlop {
  constructor(id) {
    super(id, 'JK_FF', 'JK');
    this.inputs.push(new Pin(`${id}_in_j`, 'J',   'input', this));
    this.inputs.push(new Pin(`${id}_in_k`, 'K',   'input', this));
    this.inputs.push(new Pin(`${id}_in_c`, 'CLK', 'input', this));
    this.outputs.push(new Pin(`${id}_out_q`,  'Q',  'output', this));
    this.outputs.push(new Pin(`${id}_out_qb`, 'Q\u0305', 'output', this));
  }
  evaluate() {
    if (this._risingEdge(2)) {
      const j = asBool(this.inputs[0].value);
      const k = asBool(this.inputs[1].value);
      if (j && k) this.q = !this.q;          // toggle
      else if (j) this.q = true;             // set
      else if (k) this.q = false;            // reset
      // 00 = hold
    }
    this.outputs[0].value = this.q;
    this.outputs[1].value = !this.q;
  }
}

// T Flip-Flop: T=1 toggle na borda, T=0 hold
export class TFlipFlop extends EdgeFlipFlop {
  constructor(id) {
    super(id, 'T_FF', 'T');
    this.inputs.push(new Pin(`${id}_in_t`, 'T',   'input', this));
    this.inputs.push(new Pin(`${id}_in_c`, 'CLK', 'input', this));
    this.outputs.push(new Pin(`${id}_out_q`,  'Q',  'output', this));
    this.outputs.push(new Pin(`${id}_out_qb`, 'Q\u0305', 'output', this));
  }
  evaluate() {
    if (this._risingEdge(1)) {
      if (asBool(this.inputs[0].value)) this.q = !this.q;
    }
    this.outputs[0].value = this.q;
    this.outputs[1].value = !this.q;
  }
}

// ════════════════════════════════════════════════════════════
//  Abstraction Components (Mux/Demux/Adder/Register)
// ════════════════════════════════════════════════════════════

// Multiplexador 2:1 — Select=0 → A, Select=1 → B
// Preserva HIGH-Z do canal selecionado para se comportar bem com Pull/TriState.
export class Mux2 extends Component {
  constructor(id) {
    super(id, 'MUX2', 'MUX');
    this.inputs.push(new Pin(`${id}_in_a`, 'A',   'input', this));
    this.inputs.push(new Pin(`${id}_in_b`, 'B',   'input', this));
    this.inputs.push(new Pin(`${id}_in_s`, 'S',   'input', this));
    this.outputs.push(new Pin(`${id}_out`, 'Q', 'output', this));
  }
  evaluate() {
    const s = asBool(this.inputs[2].value);
    const chosen = s ? this.inputs[1].value : this.inputs[0].value;
    // Se o canal escolhido está em HIGH-Z (null/undefined), propaga HIGH-Z
    if (chosen === null || chosen === undefined) {
      this.outputs[0].value = null;
    } else {
      this.outputs[0].value = !!chosen;
    }
  }
}

// Demultiplexador 1:2 — Select=0 → OutA recebe In, OutB=HIGH-Z
//                       Select=1 → OutB recebe In, OutA=HIGH-Z
export class Demux2 extends Component {
  constructor(id) {
    super(id, 'DEMUX2', 'DEMUX');
    this.inputs.push(new Pin(`${id}_in`,    'In',  'input', this));
    this.inputs.push(new Pin(`${id}_in_s`,  'S',   'input', this));
    this.outputs.push(new Pin(`${id}_out_a`, 'A', 'output', this));
    this.outputs.push(new Pin(`${id}_out_b`, 'B', 'output', this));
  }
  evaluate() {
    const s = asBool(this.inputs[1].value);
    const inV = this.inputs[0].value;
    // Se input está em HIGH-Z, propaga para a saída ativa também
    const passthrough = (inV === null || inV === undefined) ? null : !!inV;
    if (s) {
      this.outputs[0].value = null;        // A em HIGH-Z
      this.outputs[1].value = passthrough; // B recebe
    } else {
      this.outputs[0].value = passthrough; // A recebe
      this.outputs[1].value = null;        // B em HIGH-Z
    }
  }
}

// Full Adder — A, B, Cin → Sum, Cout
// Sum  = A XOR B XOR Cin
// Cout = (A AND B) OR (Cin AND (A XOR B))
export class FullAdder extends Component {
  constructor(id) {
    super(id, 'ADDER', 'ADD');
    this.inputs.push(new Pin(`${id}_in_a`,    'A',    'input', this));
    this.inputs.push(new Pin(`${id}_in_b`,    'B',    'input', this));
    this.inputs.push(new Pin(`${id}_in_cin`,  'Cin',  'input', this));
    this.outputs.push(new Pin(`${id}_out_s`,    'S',    'output', this));
    this.outputs.push(new Pin(`${id}_out_cout`, 'Cout', 'output', this));
  }
  evaluate() {
    const a   = asBool(this.inputs[0].value);
    const b   = asBool(this.inputs[1].value);
    const cin = asBool(this.inputs[2].value);
    const aXorB = a !== b;
    const sum  = aXorB !== cin;             // A XOR B XOR Cin
    const cout = (a && b) || (cin && aXorB); // carry
    this.outputs[0].value = sum;
    this.outputs[1].value = cout;
  }
}

// Registrador de 4 bits — agrupa internamente 4 D Flip-Flops
// Inputs:  D0..D3 (4), CLK (1), LOAD (1) — total 6
// Outputs: Q0..Q3 (4)
// Comportamento: na borda de subida do CLK, se LOAD=1 → captura D0..D3
//                Se LOAD=0 → mantém valor anterior (hold)
export class Register4 extends Component {
  constructor(id) {
    super(id, 'REG4', 'REG');
    // Ordem: D0 (LSB) → D3 (MSB) para alinhar com Q0..Q3
    for (let i = 0; i < 4; i++) {
      this.inputs.push(new Pin(`${id}_in_d${i}`, `D${i}`, 'input', this));
    }
    this.inputs.push(new Pin(`${id}_in_clk`,  'CLK',  'input', this));
    this.inputs.push(new Pin(`${id}_in_load`, 'LOAD', 'input', this));

    for (let i = 0; i < 4; i++) {
      this.outputs.push(new Pin(`${id}_out_q${i}`, `Q${i}`, 'output', this));
    }

    // Estado interno: 4 D flip-flops
    this._flops = [false, false, false, false];
    this._lastClk = false;
  }

  evaluate() {
    const clkNow = asBool(this.inputs[4].value);
    const load   = asBool(this.inputs[5].value);
    const rising = clkNow && !this._lastClk;
    this._lastClk = clkNow;

    if (rising && load) {
      for (let i = 0; i < 4; i++) {
        this._flops[i] = asBool(this.inputs[i].value);
      }
    }
    // Caso contrário: hold

    for (let i = 0; i < 4; i++) {
      this.outputs[i].value = this._flops[i];
    }
  }

  // Helper para inspeção (debug/UI)
  get value() {
    return this._flops.reduce((acc, bit, i) => acc + (bit ? (1 << i) : 0), 0);
  }
  get hex() {
    return this.value.toString(16).toUpperCase();
  }
}

// ════════════════════════════════════════════════════════════
//  Arithmetic & Decoding
// ════════════════════════════════════════════════════════════

// Comparador de magnitude 4-bit — Inputs A0..A3, B0..B3 → A>B, A=B, A<B
export class Comparator4 extends Component {
  constructor(id) {
    super(id, 'CMP4', 'CMP');
    for (let i = 0; i < 4; i++) {
      this.inputs.push(new Pin(`${id}_in_a${i}`, `A${i}`, 'input', this));
    }
    for (let i = 0; i < 4; i++) {
      this.inputs.push(new Pin(`${id}_in_b${i}`, `B${i}`, 'input', this));
    }
    this.outputs.push(new Pin(`${id}_out_gt`, 'A>B', 'output', this));
    this.outputs.push(new Pin(`${id}_out_eq`, 'A=B', 'output', this));
    this.outputs.push(new Pin(`${id}_out_lt`, 'A<B', 'output', this));
  }
  evaluate() {
    let a = 0, b = 0;
    for (let i = 0; i < 4; i++) {
      if (asBool(this.inputs[i].value)) a |= (1 << i);
      if (asBool(this.inputs[4 + i].value)) b |= (1 << i);
    }
    this.outputs[0].value = a > b;
    this.outputs[1].value = a === b;
    this.outputs[2].value = a < b;
  }
}

// Tabela BCD → 7 segmentos (segmentos a,b,c,d,e,f,g)
// Cada bit representa um segmento ativo (1 = aceso)
const BCD_TO_7SEG = [
  // a b c d e f g
  [1,1,1,1,1,1,0], // 0
  [0,1,1,0,0,0,0], // 1
  [1,1,0,1,1,0,1], // 2
  [1,1,1,1,0,0,1], // 3
  [0,1,1,0,0,1,1], // 4
  [1,0,1,1,0,1,1], // 5
  [1,0,1,1,1,1,1], // 6
  [1,1,1,0,0,0,0], // 7
  [1,1,1,1,1,1,1], // 8
  [1,1,1,1,0,1,1], // 9
];

// Decoder BCD para 7 segmentos
// Inputs: D0..D3 (LSB→MSB), Outputs: a,b,c,d,e,f,g (todos LOW se valor > 9)
export class BCDDecoder extends Component {
  constructor(id) {
    super(id, 'BCD7', 'BCD→7');
    for (let i = 0; i < 4; i++) {
      this.inputs.push(new Pin(`${id}_in_d${i}`, `D${i}`, 'input', this));
    }
    const segs = ['a','b','c','d','e','f','g'];
    for (const s of segs) {
      this.outputs.push(new Pin(`${id}_out_${s}`, s, 'output', this));
    }
  }
  evaluate() {
    let v = 0;
    for (let i = 0; i < 4; i++) {
      if (asBool(this.inputs[i].value)) v |= (1 << i);
    }
    if (v > 9) {
      for (let s = 0; s < 7; s++) this.outputs[s].value = false;
      return;
    }
    const row = BCD_TO_7SEG[v];
    for (let s = 0; s < 7; s++) this.outputs[s].value = !!row[s];
  }
}

// Display de 7 segmentos — recebe a,b,c,d,e,f,g (e dp opcional) e renderiza
export class SevenSegmentDisplay extends Component {
  constructor(id) {
    super(id, 'SEG7', '7-SEG');
    const segs = ['a','b','c','d','e','f','g'];
    for (const s of segs) {
      this.inputs.push(new Pin(`${id}_in_${s}`, s, 'input', this));
    }
    // sem outputs — é display puro
  }
  evaluate() {
    // Display puro, valor lido a partir dos inputs no render
  }
  // Helper para o render saber quais segmentos estão ligados
  get segments() {
    return this.inputs.map(p => asBool(p.value));
  }
}

// LED Matrix 8×8
// Inputs: X0..X2 (3 bits), Y0..Y2 (3 bits), D (data)
// Quando D=1, acende o LED na coordenada (X,Y). Estado persiste até reset.
// Bordas de subida em D capturam o ponto.
export class LedMatrix8x8 extends Component {
  constructor(id) {
    super(id, 'LEDMAT', 'MAT');
    for (let i = 0; i < 3; i++) {
      this.inputs.push(new Pin(`${id}_in_x${i}`, `X${i}`, 'input', this));
    }
    for (let i = 0; i < 3; i++) {
      this.inputs.push(new Pin(`${id}_in_y${i}`, `Y${i}`, 'input', this));
    }
    this.inputs.push(new Pin(`${id}_in_d`, 'D', 'input', this));
    this.inputs.push(new Pin(`${id}_in_clk`, 'CLK', 'input', this));
    this.inputs.push(new Pin(`${id}_in_clr`, 'CLR', 'input', this));
    // Estado: matriz 8×8 de bits (linha-major)
    this.matrix = new Array(64).fill(false);
    this._lastClk = false;
  }
  evaluate() {
    const clr = asBool(this.inputs[8].value);
    if (clr) {
      this.matrix.fill(false);
      return;
    }
    const clkNow = asBool(this.inputs[7].value);
    const rising = clkNow && !this._lastClk;
    this._lastClk = clkNow;
    if (!rising) return;

    let x = 0, y = 0;
    for (let i = 0; i < 3; i++) {
      if (asBool(this.inputs[i].value)) x |= (1 << i);
      if (asBool(this.inputs[3 + i].value)) y |= (1 << i);
    }
    const d = asBool(this.inputs[6].value);
    this.matrix[y * 8 + x] = d;
  }
}

// ROM 16×8 — endereço de 4 bits → byte de 8 bits
// Os dados podem ser carregados via .loadData(arr) onde arr é Array<number>
export class ROM16x8 extends Component {
  constructor(id) {
    super(id, 'ROM', 'ROM');
    for (let i = 0; i < 4; i++) {
      this.inputs.push(new Pin(`${id}_in_a${i}`, `A${i}`, 'input', this));
    }
    this.inputs.push(new Pin(`${id}_in_oe`, 'OE', 'input', this));
    for (let i = 0; i < 8; i++) {
      this.outputs.push(new Pin(`${id}_out_d${i}`, `D${i}`, 'output', this));
    }
    // Padrão: 16 bytes zerados
    this.data = new Array(16).fill(0);
  }
  loadData(arr) {
    if (!Array.isArray(arr)) throw new Error('ROM data must be an array');
    const next = new Array(16).fill(0);
    for (let i = 0; i < Math.min(16, arr.length); i++) {
      const v = Number(arr[i]) | 0;
      next[i] = v & 0xff;
    }
    this.data = next;
  }
  evaluate() {
    const oe = asBool(this.inputs[4].value);
    if (!oe) {
      // Output disabled — HIGH-Z
      for (let i = 0; i < 8; i++) this.outputs[i].value = null;
      return;
    }
    let addr = 0;
    for (let i = 0; i < 4; i++) {
      if (asBool(this.inputs[i].value)) addr |= (1 << i);
    }
    const byte = this.data[addr] & 0xff;
    for (let i = 0; i < 8; i++) {
      this.outputs[i].value = !!(byte & (1 << i));
    }
  }
}

// ════════════════════════════════════════════════════════════
//  Trace Recorder (Logic Analyzer)
// ════════════════════════════════════════════════════════════

// Buffer circular que armazena os últimos N estados de pinos selecionados.
// Cada amostra é { t, values } onde values é um array alinhado aos pinos rastreados.
export class TraceRecorder {
  constructor(maxSamples = 50) {
    this.maxSamples = maxSamples;
    this.tracedPinIds = []; // até 4
    this.samples = [];      // [{ t, values: [v0, v1, ...] }]
  }

  setTracedPins(pinIds) {
    this.tracedPinIds = pinIds.slice(0, 4);
    this.samples = []; // reseta histórico ao mudar pinos
  }

  // Pega snapshot do estado dos pinos rastreados
  recordSample(components, t) {
    if (this.tracedPinIds.length === 0) return;
    const values = this.tracedPinIds.map(pinId => {
      for (const c of components) {
        for (const p of [...c.inputs, ...c.outputs]) {
          if (p.id === pinId) return p.value;
        }
      }
      return undefined;
    });
    // Só registra se diferente do último (compressão por mudança)
    const last = this.samples[this.samples.length - 1];
    if (last && JSON.stringify(last.values) === JSON.stringify(values)) {
      // mesmo estado — atualiza tempo final
      last.tEnd = t;
      return;
    }
    this.samples.push({ t, tEnd: t, values });
    if (this.samples.length > this.maxSamples) this.samples.shift();
  }

  clear() {
    this.samples = [];
  }
}

// ════════════════════════════════════════════════════════════

// Label: texto livre no canvas. Sem pinos, sem lógica.
export class Label extends Component {
  constructor(id, text = 'Label') {
    super(id, 'LABEL', text);
    this.text = text;
    this.width = 80;
    this.height = 28;
  }
  evaluate() {}
}

// ════════════════════════════════════════════════════════════
//  ID counter
// ════════════════════════════════════════════════════════════

let _idCounter = 0;
export function uid() { return `c${++_idCounter}`; }
export function resetUid() { _idCounter = 0; }

// ════════════════════════════════════════════════════════════
//  Factory: cria componente por type string
// ════════════════════════════════════════════════════════════

export function createComponent(type, id, opts) {
  const cid = id || uid();
  switch (type) {
    case 'INPUT':     return new InputSwitch(cid);
    case 'BUTTON':    return new PushButton(cid);
    case 'HIGH':      return new HighConstant(cid);
    case 'LOW':       return new LowConstant(cid);
    case 'PULLUP':    return new PullUp(cid);
    case 'PULLDOWN':  return new PullDown(cid);
    case 'CLOCK':     return new Clock(cid, 'CLK', 800);
    case 'OUTPUT':    return new OutputProbe(cid);
    case 'DIGIT4':    return new FourBitDigit(cid);
    case 'TRISTATE':  return new TriStateBuffer(cid);
    case 'SR_FF':     return new SRFlipFlop(cid);
    case 'D_FF':      return new DFlipFlop(cid);
    case 'JK_FF':     return new JKFlipFlop(cid);
    case 'T_FF':      return new TFlipFlop(cid);
    case 'MUX2':      return new Mux2(cid);
    case 'DEMUX2':    return new Demux2(cid);
    case 'ADDER':     return new FullAdder(cid);
    case 'REG4':      return new Register4(cid);
    case 'SCHMITT':   return new SchmittTrigger(cid);
    case 'CMP4':      return new Comparator4(cid);
    case 'BCD7':      return new BCDDecoder(cid);
    case 'SEG7':      return new SevenSegmentDisplay(cid);
    case 'LEDMAT':    return new LedMatrix8x8(cid);
    case 'ROM':       return new ROM16x8(cid);
    case 'LABEL':     return new Label(cid);
    case 'AND':
    case 'OR':
    case 'NOT':
    case 'NAND':
    case 'NOR':
    case 'XOR':
    case 'XNOR':
    case 'BUFFER':    return new Gate(cid, type, opts && opts.inputCount);
    default:
      throw new Error(`Unknown component type: ${type}`);
  }
}

// ════════════════════════════════════════════════════════════
//  Serialization (Save/Open)
// ════════════════════════════════════════════════════════════

// Identifica o tipo string a partir de uma instância
function typeOfInstance(c) {
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
  if (c instanceof SchmittTrigger) return 'SCHMITT';
  if (c instanceof Comparator4) return 'CMP4';
  if (c instanceof BCDDecoder) return 'BCD7';
  if (c instanceof SevenSegmentDisplay) return 'SEG7';
  if (c instanceof LedMatrix8x8) return 'LEDMAT';
  if (c instanceof ROM16x8) return 'ROM';
  if (c instanceof Label) return 'LABEL';
  if (c instanceof Gate) return c.type;
  return 'UNKNOWN';
}

export function serializeCircuit(components, wires) {
  return {
    version: 1,
    components: components.map(c => ({
      id: c.id,
      type: typeOfInstance(c),
      label: c.label,
      x: c.x,
      y: c.y,
      rotation: c.rotation || 0,
      // Estado específico
      state: c.state,
      text: c.text,
      width: c.width,
      height: c.height,
      periodMs: c.periodMs,
      inputCount: c.inputCount,
      // ROM
      romData: c instanceof ROM16x8 ? [...c.data] : undefined,
      // LedMatrix
      matrix: c instanceof LedMatrix8x8 ? [...c.matrix] : undefined,
    })),
    wires: wires.map(w => ({
      id: w.id,
      fromCompId: w.from.owner.id,
      fromPinIdx: w.from.owner.outputs.indexOf(w.from),
      toCompId: w.to.owner.id,
      toPinIdx: w.to.owner.inputs.indexOf(w.to),
    })),
  };
}

export function deserializeCircuit(data) {
  if (!data || !data.components) throw new Error('Invalid circuit data');
  const idMap = new Map();
  const newComps = data.components.map(spec => {
    const opts = spec.inputCount ? { inputCount: spec.inputCount } : undefined;
    const comp = createComponent(spec.type, undefined, opts);
    comp.id = spec.id;
    if (spec.label) comp.label = spec.label;
    comp.x = spec.x || 0;
    comp.y = spec.y || 0;
    comp.rotation = spec.rotation || 0;
    if (spec.state !== undefined && comp instanceof InputSwitch) comp.state = !!spec.state;
    if (spec.text !== undefined && comp instanceof Label) comp.text = spec.text;
    if (spec.width !== undefined && comp instanceof Label) comp.width = spec.width;
    if (spec.height !== undefined && comp instanceof Label) comp.height = spec.height;
    if (spec.periodMs && comp instanceof Clock) comp.periodMs = spec.periodMs;
    if (spec.romData && comp instanceof ROM16x8) comp.loadData(spec.romData);
    if (spec.matrix && comp instanceof LedMatrix8x8) comp.matrix = [...spec.matrix];
    idMap.set(spec.id, comp);
    return comp;
  });
  const newWires = (data.wires || []).map(w => {
    const fromComp = idMap.get(w.fromCompId);
    const toComp = idMap.get(w.toCompId);
    if (!fromComp || !toComp) return null;
    const src = fromComp.outputs[w.fromPinIdx];
    const dst = toComp.inputs[w.toPinIdx];
    if (!src || !dst) return null;
    const wire = new Wire(w.id || uid(), src, dst);
    return wire;
  }).filter(Boolean);
  return { components: newComps, wires: newWires };
}

// Reset estado interno (mantém topologia)
export function resetSimulationState(components) {
  for (const c of components) {
    if (c instanceof InputSwitch) c.state = false;
    if (c instanceof PushButton) c.state = false;
    // Flip-flops: zera estado interno
    if (c.q !== undefined) c.q = false;
    if (c._lastClk !== undefined) c._lastClk = false;
    if (c._flops) c._flops = [false, false, false, false];
    // LedMatrix: zera todos os pixels
    if (c instanceof LedMatrix8x8) c.matrix = new Array(64).fill(false);
  }
}
