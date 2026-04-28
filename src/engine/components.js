// ════════════════════════════════════════════════════════════
//  ENGINE — Estruturas de Dados
//  (Lógica preservada do motor original, sem alterações)
// ════════════════════════════════════════════════════════════

export class Pin {
  constructor(id, name, direction, owner) {
    this.id = id;
    this.name = name;
    this.direction = direction; // 'input' | 'output'
    this.owner = owner;
    this.value = false;
    this.connections = [];
  }
}

export class Wire {
  constructor(id, fromPin, toPin) {
    this.id = id;
    this.from = fromPin; // Pin (output)
    this.to = toPin;     // Pin (input)
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

export class InputSwitch extends Component {
  constructor(id, label) {
    super(id, 'INPUT', label || 'IN');
    this.outputs.push(new Pin(`${id}_out`, 'OUT', 'output', this));
    this.state = false;
  }
  toggle() {
    this.state = !this.state;
  }
  evaluate() {
    this.outputs[0].value = this.state;
  }
}

export class OutputProbe extends Component {
  constructor(id, label) {
    super(id, 'OUTPUT', label || 'OUT');
    this.inputs.push(new Pin(`${id}_in`, 'IN', 'input', this));
  }
  evaluate() {
    // valor é lido do pino de entrada
  }
  get value() {
    return this.inputs[0].value;
  }
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
  evaluate() {
    this.outputs[0].value = this.state;
  }
}

export const GATE_DEFS = {
  AND:  { inputs: 2, fn: (a, b) => a && b },
  OR:   { inputs: 2, fn: (a, b) => a || b },
  NOT:  { inputs: 1, fn: (a) => !a },
  NAND: { inputs: 2, fn: (a, b) => !(a && b) },
  NOR:  { inputs: 2, fn: (a, b) => !(a || b) },
  XOR:  { inputs: 2, fn: (a, b) => a !== b },
  XNOR: { inputs: 2, fn: (a, b) => a === b },
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
    const vals = this.inputs.map(p => p.value);
    this.outputs[0].value = this.gateFn(...vals);
  }
}

// ── ID counter exportado para o app gerenciar ──
let _idCounter = 0;
export function uid() { return `c${++_idCounter}`; }
export function resetUid() { _idCounter = 0; }
