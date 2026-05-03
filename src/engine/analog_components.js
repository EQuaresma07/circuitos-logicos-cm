// ════════════════════════════════════════════════════════════
//  COMPONENTES ANALÓGICOS
//
//  Convenção:
//    - Pinos analógicos têm flag `isAnalog = true` e propriedade
//      `voltage` (em volts) ao invés de `value` (boolean).
//    - Fonte de tensão tem dois pinos: pinPos (+) e pinNeg (−).
//      O pinNeg geralmente é também `groundPin` para servir
//      de referência se for o único conectado a GND.
// ════════════════════════════════════════════════════════════

import { Component, Pin } from './components.js';

// Helper: marca um pino como analógico
export function makeAnalogPin(id, name, direction, owner) {
  const p = new Pin(id, name, direction, owner);
  p.isAnalog = true;
  p.voltage = 0;
  return p;
}

export function isAnalogPin(pin) {
  return pin && pin.isAnalog === true;
}

// Classe base
export class AnalogComponent extends Component {
  constructor(id, type, label) {
    super(id, type, label);
    this.isAnalog = true;
  }
}

// ════════════════════════════════════════════════════════════
//  Fontes de tensão
// ════════════════════════════════════════════════════════════

// Fonte DC — tensão constante
export class DCSource extends AnalogComponent {
  constructor(id) {
    super(id, 'DC_SOURCE', 'DC');
    this.pinPos = makeAnalogPin(`${id}_p`, '+', 'output', this);
    this.pinNeg = makeAnalogPin(`${id}_n`, '-', 'output', this);
    this.outputs.push(this.pinPos, this.pinNeg);
    this.groundPin = this.pinNeg; // referência

    this.voltageSet = 5; // tensão configurada (V)
    this.value = 5;      // tensão atual (igual a voltageSet para DC)
    this.isVoltageSource = true;
    this.lastCurrent = 0;
  }
  updateValue(_simTime) {
    this.value = this.voltageSet;
  }
  evaluate() {} // tensões já foram resolvidas pelo solver
}

// Fonte AC — senoidal: V(t) = amplitude * sin(2π·f·t + phase)
export class ACSource extends AnalogComponent {
  constructor(id) {
    super(id, 'AC_SOURCE', 'AC');
    this.pinPos = makeAnalogPin(`${id}_p`, '+', 'output', this);
    this.pinNeg = makeAnalogPin(`${id}_n`, '-', 'output', this);
    this.outputs.push(this.pinPos, this.pinNeg);
    this.groundPin = this.pinNeg;

    this.amplitude = 5;     // V (pico)
    this.frequency = 1;     // Hz
    this.phase = 0;         // rad
    this.offset = 0;        // V (DC offset)
    this.value = 0;
    this.isVoltageSource = true;
    this.lastCurrent = 0;
  }
  updateValue(simTime) {
    const tSec = simTime / 1000;
    this.value = this.offset + this.amplitude * Math.sin(2 * Math.PI * this.frequency * tSec + this.phase);
  }
  evaluate() {}
}

// Fonte de Onda Quadrada
export class SquareWaveSource extends AnalogComponent {
  constructor(id) {
    super(id, 'SQUARE_SOURCE', 'SQR');
    this.pinPos = makeAnalogPin(`${id}_p`, '+', 'output', this);
    this.pinNeg = makeAnalogPin(`${id}_n`, '-', 'output', this);
    this.outputs.push(this.pinPos, this.pinNeg);
    this.groundPin = this.pinNeg;

    this.amplitude = 5;     // V (alto)
    this.lowLevel  = 0;     // V (baixo)
    this.frequency = 1;     // Hz
    this.duty = 0.5;        // 0..1
    this.value = 0;
    this.isVoltageSource = true;
    this.lastCurrent = 0;
  }
  updateValue(simTime) {
    const tSec = simTime / 1000;
    const period = 1 / this.frequency;
    const phase = (tSec % period) / period;
    this.value = phase < this.duty ? this.amplitude : this.lowLevel;
  }
  evaluate() {}
}

// ════════════════════════════════════════════════════════════
//  Resistor (passivo)
// ════════════════════════════════════════════════════════════

export class Resistor extends AnalogComponent {
  constructor(id) {
    super(id, 'RESISTOR', 'R');
    this.pinA = makeAnalogPin(`${id}_a`, 'A', 'input', this);
    this.pinB = makeAnalogPin(`${id}_b`, 'B', 'input', this);
    this.inputs.push(this.pinA, this.pinB);

    this.resistance = 1000; // Ω
    this.isResistor = true;
  }
  evaluate() {} // condutância já foi stampada no solver
}

// ════════════════════════════════════════════════════════════
//  Instrumentos
// ════════════════════════════════════════════════════════════

// Voltímetro digital — mostra V_pos − V_neg
export class Voltmeter extends AnalogComponent {
  constructor(id) {
    super(id, 'VOLTMETER', 'V');
    this.pinPos = makeAnalogPin(`${id}_p`, '+', 'input', this);
    this.pinNeg = makeAnalogPin(`${id}_n`, '-', 'input', this);
    this.inputs.push(this.pinPos, this.pinNeg);

    this.reading = 0; // V
    this.isMeter = true;
  }
  evaluate() {
    const vp = this.pinPos.voltage || 0;
    const vn = this.pinNeg.voltage || 0;
    this.reading = vp - vn;
  }
}

// Osciloscópio — registra histórico de tensão para plotagem
const SCOPE_BUFFER_SIZE = 600; // ~6s a 100Hz de amostragem

export class Oscilloscope extends AnalogComponent {
  constructor(id) {
    super(id, 'SCOPE', 'OSC');
    this.pinPos = makeAnalogPin(`${id}_p`, 'CH1', 'input', this);
    this.pinNeg = makeAnalogPin(`${id}_n`, 'GND', 'input', this);
    this.inputs.push(this.pinPos, this.pinNeg);

    this.buffer = [];        // { t: ms, v: volts }
    this.timeSpan = 2000;    // ms (eixo X total)
    this.vRange = 10;        // V (eixo Y de -vRange até +vRange)
    this.autoScale = true;
    this.isMeter = true;
  }
  evaluate() {} // amostragem é feita externamente
  sample(simTime) {
    const v = (this.pinPos.voltage || 0) - (this.pinNeg.voltage || 0);
    this.buffer.push({ t: simTime, v });
    // Limpar amostras antigas
    const cutoff = simTime - this.timeSpan;
    while (this.buffer.length > 0 && this.buffer[0].t < cutoff) {
      this.buffer.shift();
    }
    if (this.buffer.length > SCOPE_BUFFER_SIZE) {
      this.buffer = this.buffer.slice(-SCOPE_BUFFER_SIZE);
    }
  }
  clearBuffer() {
    this.buffer = [];
  }
}

// ════════════════════════════════════════════════════════════
//  Adaptadores Digital ↔ Analógico
//
//  Threshold: tensão ≥ 2.5V vira HIGH (true) no domínio digital.
//  Saída digital HIGH vira 5V no analógico, LOW vira 0V.
// ════════════════════════════════════════════════════════════

export const DIGITAL_HIGH_VOLTAGE = 5;
export const DIGITAL_LOW_VOLTAGE = 0;
export const DIGITAL_THRESHOLD = 2.5;

export function digitalToVoltage(value) {
  return value ? DIGITAL_HIGH_VOLTAGE : DIGITAL_LOW_VOLTAGE;
}

export function voltageToDigital(volts) {
  if (volts === null || volts === undefined) return false;
  return volts >= DIGITAL_THRESHOLD;
}
