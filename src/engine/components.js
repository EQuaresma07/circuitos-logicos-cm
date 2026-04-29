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
  AND:    { inputs: 2, fn: (a, b) => a && b },
  OR:     { inputs: 2, fn: (a, b) => a || b },
  NOT:    { inputs: 1, fn: (a) => !a },
  NAND:   { inputs: 2, fn: (a, b) => !(a && b) },
  NOR:    { inputs: 2, fn: (a, b) => !(a || b) },
  XOR:    { inputs: 2, fn: (a, b) => a !== b },
  XNOR:   { inputs: 2, fn: (a, b) => a === b },
  BUFFER: { inputs: 1, fn: (a) => !!a },
};

export class Gate extends Component {
  constructor(id, gateType) {
    super(id, gateType, gateType);
    const def = GATE_DEFS[gateType];
    for (let i = 0; i < def.inputs; i++) {
      this.inputs.push(new Pin(`${id}_in${i}`, String.fromCharCode(65 + i), 'input', this));
    }
    this.outputs.push(new Pin(`${id}_out`, 'Q', 'output', this));
    this.gateFn = def.fn;
  }
  evaluate() {
    const vals = this.inputs.map(p => asBool(p.value));
    this.outputs[0].value = this.gateFn(...vals);
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
//  Other
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

export function createComponent(type, id) {
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
    case 'LABEL':     return new Label(cid);
    // Logic gates (incluindo Buffer)
    case 'AND':
    case 'OR':
    case 'NOT':
    case 'NAND':
    case 'NOR':
    case 'XOR':
    case 'XNOR':
    case 'BUFFER':    return new Gate(cid, type);
    default:
      throw new Error(`Unknown component type: ${type}`);
  }
}
