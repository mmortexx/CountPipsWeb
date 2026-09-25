/** Nivel, en palabra, de cuánto de la ganancia bruta se va en costes.
 *  `costDragPct` va en escala 0–100 (ya multiplicado, no un ratio 0–1). */
export type NivelFugaComisiones = "alto" | "moderado" | "bajo";

/**
 * El color de «Parte de la ganancia» (rojo / ámbar / verde) no llevaba
 * palabra: quien no distingue el color por daltonismo o porque su lector de
 * pantalla no anuncia el estilo, no se enteraba de si el dato era bueno o
 * malo. Misma frontera que ya pintaba el componente: >30 alto, >15
 * moderado, el resto bajo.
 */
export function clasificaFugaComisiones(costDragPct: number): NivelFugaComisiones {
  if (costDragPct > 30) return "alto";
  if (costDragPct > 15) return "moderado";
  return "bajo";
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
  },
];

/* El objetivo se escribe en puntos o dólares de precio en futuros y en
   pips en forex, donde un pip ES un tick. Todo sale de `tickSize` y
   `tickValue`: con un tercer dato (el valor del punto) el forex llegó a
   multiplicar los pips por el tamaño del lote, 10.000 veces de más. */
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
