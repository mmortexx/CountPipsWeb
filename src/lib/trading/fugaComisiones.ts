/** Nivel, en palabra, de cuánto de la ganancia bruta se va en costes.
 *  `costDragPct` va en escala 0–100 (ya multiplicado, no un ratio 0–1). */
export type NivelFugaComisiones = "alto" | "moderado" | "bajo";

/** Por encima, la fuga es «alta» en la palabra, el color y el texto del diagnóstico. */
export const UMBRAL_FUGA_ALTA = 30;
const UMBRAL_FUGA_MODERADA = 15;

/** La palabra que acompaña al color de «Se lo llevan los costes», para quien no lo distingue: >30 alto, >15 moderado, el resto bajo. */
export function clasificaFugaComisiones(costDragPct: number): NivelFugaComisiones {
  if (costDragPct > UMBRAL_FUGA_ALTA) return "alto";
  if (costDragPct > UMBRAL_FUGA_MODERADA) return "moderado";
  return "bajo";
}

/** Qué frase cierra la calculadora: la cuenta pierde, la fuga es alta o hay margen. */
export function diagnosticoFuga(netoAnual: number, costDragPct: number): "pierde" | "alto" | "holgado" {
  if (netoAnual < 0) return "pierde";
  if (clasificaFugaComisiones(costDragPct) === "alto") return "alto";
  return "holgado";
}

export interface InstrumentConfig {
  id: string;
  name: string;
  category: "futures" | "micro" | "forex";
  tickSize: number;
  tickValue: number;
  defaultCommissionRT: number; // Round turn por contrato en USD
  unitNameEs: string;
  unitNameEn: string;
  /** Recorrido del objetivo por operación, en las unidades del instrumento (el crudo se mueve en céntimos y el S&P en puntos). */
  objetivo: { min: number; max: number; paso: number; inicial: number };
}

/** La comisión de ida y vuelta que se usa: la que escribió la persona, si la
 *  escribió (también un cero), y si no, la habitual del instrumento. Cambiar de
 *  instrumento no borra la propia. */
export function comisionVigente(propia: number | null, inst: InstrumentConfig): number {
  return propia ?? inst.defaultCommissionRT;
}

export const INSTRUMENT_SPECS: InstrumentConfig[] = [
  {
    id: "NQ",
    name: "NQ · E-mini Nasdaq-100",
    category: "futures",
    tickSize: 0.25,
    tickValue: 5.0,
    defaultCommissionRT: 4.5,
    unitNameEs: "puntos",
    unitNameEn: "points",
    objetivo: { min: 5, max: 100, paso: 0.5, inicial: 20 },
  },
  {
    id: "MNQ",
    name: "MNQ · Micro E-mini Nasdaq",
    category: "micro",
    tickSize: 0.25,
    tickValue: 0.5,
    defaultCommissionRT: 1.24,
    unitNameEs: "puntos",
    unitNameEn: "points",
    objetivo: { min: 5, max: 100, paso: 0.5, inicial: 20 },
  },
  {
    id: "ES",
    name: "ES · E-mini S&P 500",
    category: "futures",
    tickSize: 0.25,
    tickValue: 12.5,
    defaultCommissionRT: 4.5,
    unitNameEs: "puntos",
    unitNameEn: "points",
    objetivo: { min: 2, max: 40, paso: 0.25, inicial: 6 },
  },
  {
    id: "MES",
    name: "MES · Micro E-mini S&P",
    category: "micro",
    tickSize: 0.25,
    tickValue: 1.25,
    defaultCommissionRT: 1.24,
    unitNameEs: "puntos",
    unitNameEn: "points",
    objetivo: { min: 2, max: 40, paso: 0.25, inicial: 6 },
  },
  {
    id: "CL",
    name: "CL · Petróleo Crudo (Crude Oil)",
    category: "futures",
    tickSize: 0.01,
    tickValue: 10.0,
    defaultCommissionRT: 4.5,
    unitNameEs: "dólares",
    unitNameEn: "dollars",
    objetivo: { min: 0.1, max: 5, paso: 0.05, inicial: 0.5 },
  },
  {
    id: "MCL",
    name: "MCL · Micro Crude Oil",
    category: "micro",
    tickSize: 0.01,
    tickValue: 1.0,
    defaultCommissionRT: 1.24,
    unitNameEs: "dólares",
    unitNameEn: "dollars",
    objetivo: { min: 0.1, max: 5, paso: 0.05, inicial: 0.5 },
  },
  {
    id: "GC",
    name: "GC · Oro (Gold Futures)",
    category: "futures",
    tickSize: 0.1,
    tickValue: 10.0,
    defaultCommissionRT: 4.5,
    unitNameEs: "dólares",
    unitNameEn: "dollars",
    objetivo: { min: 1, max: 50, paso: 0.5, inicial: 5 },
  },
  {
    id: "MGC",
    name: "MGC · Micro Gold",
    category: "micro",
    tickSize: 0.1,
    tickValue: 1.0,
    defaultCommissionRT: 1.24,
    unitNameEs: "dólares",
    unitNameEn: "dollars",
    objetivo: { min: 1, max: 50, paso: 0.5, inicial: 5 },
  },
  {
    id: "RTY",
    name: "RTY · E-mini Russell 2000",
    category: "futures",
    tickSize: 0.1,
    tickValue: 5.0,
    defaultCommissionRT: 4.5,
    unitNameEs: "puntos",
    unitNameEn: "points",
    objetivo: { min: 2, max: 50, paso: 0.5, inicial: 10 },
  },
  {
    id: "EURUSD",
    name: "EUR/USD · Forex Estándar (100k)",
    category: "forex",
    tickSize: 0.0001,
    tickValue: 10.0, // 1 pip = $10 en 1 lote estándar
    defaultCommissionRT: 5.0,
    unitNameEs: "pips",
    unitNameEn: "pips",
    objetivo: { min: 5, max: 80, paso: 1, inicial: 15 },
  },
];

// El objetivo va en puntos o dólares de precio en futuros y en pips en forex, donde un pip es un tick.
// Todo sale de `tickSize` y `tickValue`; no hay un tercer dato (valor del punto).
function unidadesPorTick(inst: InstrumentConfig): number {
  return inst.category === "forex" ? 1 : inst.tickSize;
}

/** Lo que vale el objetivo de una operación, en dólares. */
export function resultadoBrutoPorOperacion(inst: InstrumentConfig, unidades: number, contratos: number): number {
  return (unidades / unidadesPorTick(inst)) * inst.tickValue * contratos;
}

/** Ticks pasados a la unidad en la que se escribe el objetivo. */
export function ticksAUnidades(inst: InstrumentConfig, ticks: number): number {
  return ticks * unidadesPorTick(inst);
}
