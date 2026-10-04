import { INSTRUMENT_SPECS } from "./fugaComisiones";
import { excedeApalancamiento, validaPlan, type MercadoPlan, type MotivoPlanInvalido } from "./validaPlan";

/**
 * El tamaño de una operación a partir del riesgo, en los tres mercados de
 * la calculadora de riesgo. Función pura para poder probarla: dentro del
 * componente tomaba la distancia al stop como dólares por unidad en todos
 * los pares (USD/JPY salía a 0,0033 lotes en vez de 0,50), devolvía
 * fracciones de contrato y prometía un tick de deslizamiento que no sumaba.
 */

export interface ContratoFuturo {
  id: string;
  simbolo: string;
  nombre: string;
  /** Dólares por punto de precio. */
  mult: number;
  tickSize: number;
  /** Comisión de ida y vuelta por contrato, en dólares. */
  comision: number;
  /** El micro del mismo subyacente, si existe. */
  micro: string | null;
}

/* Las especificaciones salen del mismo registro que la calculadora de
   comisiones: había dos listas con los mismos contratos. */
const sinRuidoDecimal = (x: number) => Math.round(x * 1e6) / 1e6;
export const FUTURES_CONTRACTS: ContratoFuturo[] = INSTRUMENT_SPECS.filter((s) => s.category !== "forex").map((s) => ({
  id: s.id.toLowerCase(),
  simbolo: s.id,
  nombre: s.name,
  mult: sinRuidoDecimal(s.tickValue / s.tickSize),
  tickSize: s.tickSize,
  comision: s.defaultCommissionRT,
  micro: INSTRUMENT_SPECS.some((m) => m.id === `M${s.id}`) ? `m${s.id.toLowerCase()}` : null,
}));

/** Precios de ejemplo al elegir un contrato: el micro usa los de su subyacente. */
const PRECIOS_FUTURO: Record<string, [number, number, number]> = {
  es: [5800, 5780, 5840],
  nq: [20500, 20400, 20700],
  rty: [2200, 2185, 2230],
  gc: [2650, 2635, 2680],
  cl: [75, 74.2, 76.6],
};
export function preciosDeFuturo(id: string): [number, number, number] {
  return PRECIOS_FUTURO[id.replace(/^m(?=es|nq|gc|cl)/, "")] ?? PRECIOS_FUTURO.es;
}

export interface ParForex {
  id: string;
  /** Tamaño del pip: 0,01 en los pares con yen. */
  pip: number;
  precios: [number, number, number];
  /** En los cruces, el par con dólar que convierte la divisa cotizada. */
  referencia: { id: string; invierte: boolean; defecto: number } | null;
}

export const PARES_FOREX: ParForex[] = [
  { id: "EUR/USD", pip: 0.0001, precios: [1.085, 1.082, 1.091], referencia: null },
  { id: "GBP/USD", pip: 0.0001, precios: [1.27, 1.267, 1.276], referencia: null },
  { id: "AUD/USD", pip: 0.0001, precios: [0.66, 0.658, 0.664], referencia: null },
  { id: "USD/JPY", pip: 0.01, precios: [150.2, 149.9, 150.8], referencia: null },
  { id: "USD/CHF", pip: 0.0001, precios: [0.88, 0.877, 0.886], referencia: null },
  { id: "USD/CAD", pip: 0.0001, precios: [1.36, 1.357, 1.366], referencia: null },
  { id: "EUR/GBP", pip: 0.0001, precios: [0.855, 0.853, 0.859], referencia: { id: "GBP/USD", invierte: false, defecto: 1.27 } },
  { id: "EUR/JPY", pip: 0.01, precios: [163, 162.6, 163.8], referencia: { id: "USD/JPY", invierte: true, defecto: 150 } },
  { id: "GBP/JPY", pip: 0.01, precios: [190.5, 190.1, 191.3], referencia: { id: "USD/JPY", invierte: true, defecto: 150 } },
];

/** Dólares que vale una unidad de la divisa cotizada del par. */
export function cotizadaEnDolares(par: ParForex, entrada: number, tipoReferencia: number | null): number {
  if (par.id.endsWith("/USD")) return 1;
  if (par.id.startsWith("USD/")) return entrada > 0 ? 1 / entrada : 0;
  const ref = par.referencia;
  if (!ref) return 0;
  const tipo = tipoReferencia !== null && tipoReferencia > 0 ? tipoReferencia : ref.defecto;
  return ref.invierte ? 1 / tipo : tipo;
}

export type TipoLote = "standard" | "mini" | "micro";
export const UNIDADES_LOTE: Record<TipoLote, number> = { standard: 100000, mini: 10000, micro: 1000 };
/** El escalón más pequeño que admite un broker: el micro lote. */
const ESCALON_FOREX = 1000;
/** Comisión de ida y vuelta por lote estándar, en dólares. */
const COMISION_FOREX_LOTE = 5;
/** Comisión por unidad en acciones o cripto, y su tick: un céntimo. */
const COMISION_ACCION = 0.005;
const TICK_ACCION = 0.01;

export interface EntradaPlan {
  mercado: MercadoPlan;
  balance: number;
  riesgoPct: number;
  entrada: number;
  stop: number;
  objetivo: number;
  friccion: boolean;
  futuro: ContratoFuturo;
  lote: TipoLote;
  par: ParForex;
  /** En los cruces, el tipo del par de referencia; null usa el de ejemplo. */
  tipoReferencia: number | null;
}

export interface ResultadoPlan {
  valido: boolean;
  motivoInvalido: MotivoPlanInvalido | null;
  rr: number;
  riesgoNominal: number;
  /** Lo que se arriesga con el tamaño redondeado al escalón del mercado. */
  riesgoReal: number;
  friccion: number;
  riesgoTotal: number;
  /** En unidades, lotes del tipo elegido o contratos. */
  tamano: number;
  decimalesTamano: number;
  /** El tamaño redondeado hacia abajo no llega a un escalón. */
  noCabe: boolean;
  /** Lo que arriesga un solo escalón (un contrato, un micro lote). */
  riesgoDeUno: number;
  valorPip: number;
  nocional: number;
  beneficioBruto: number;
  beneficioNeto: number;
  direccion: "long" | "short";
  apalancamiento: number;
  apalancamientoExcesivo: boolean;
}

export function calculaPlan(e: EntradaPlan): ResultadoPlan {
  const { valido, motivo } = validaPlan(e.entrada, e.stop, e.objetivo);
  const riesgoNominal = e.balance > 0 ? (e.balance * e.riesgoPct) / 100 : 0;
  const distStop = Math.abs(e.entrada - e.stop);
  const distObjetivo = Math.abs(e.objetivo - e.entrada);
  const direccion = e.stop > e.entrada ? "short" : "long";

  /* Dólares por unidad de precio y por unidad de tamaño, el escalón
     mínimo, y el coste de ida y vuelta y de un tick por unidad. */
  let dolaresPorUnidad = 1;
  let escalon = 0;
  let comisionPorUnidad = COMISION_ACCION;
  let tick = TICK_ACCION;
  let unidadesPorTamano = 1;
  let decimalesTamano = 2;
  if (e.mercado === "forex") {
    dolaresPorUnidad = cotizadaEnDolares(e.par, e.entrada, e.tipoReferencia);
    escalon = ESCALON_FOREX;
    comisionPorUnidad = COMISION_FOREX_LOTE / UNIDADES_LOTE.standard;
    tick = e.par.pip;
    unidadesPorTamano = UNIDADES_LOTE[e.lote];
    decimalesTamano = e.lote === "standard" ? 2 : e.lote === "mini" ? 1 : 0;
  } else if (e.mercado === "futures") {
    dolaresPorUnidad = e.futuro.mult;
    escalon = 1;
    comisionPorUnidad = e.futuro.comision;
    tick = e.futuro.tickSize;
    decimalesTamano = 0;
  }

  const riesgoPorUnidad = distStop * dolaresPorUnidad;
  const vacio: ResultadoPlan = {
    valido,
    motivoInvalido: motivo,
    rr: 0,
    riesgoNominal,
    riesgoReal: 0,
    friccion: 0,
    riesgoTotal: 0,
    tamano: 0,
    decimalesTamano,
    noCabe: false,
    riesgoDeUno: 0,
    valorPip: 0,
    nocional: 0,
    beneficioBruto: 0,
    beneficioNeto: 0,
    direccion,
    apalancamiento: 0,
    apalancamientoExcesivo: false,
  };
  if (!valido || !(riesgoPorUnidad > 0) || !(riesgoNominal > 0)) return vacio;

  const exactas = riesgoNominal / riesgoPorUnidad;
  /* Hacia abajo y con una tolerancia de coma flotante: 100 $ entre 100 $
     por contrato es un contrato, no 0,9999999. */
  const unidades = escalon > 0 ? Math.floor(exactas / escalon + 1e-9) * escalon : exactas;
  const riesgoReal = unidades * riesgoPorUnidad;
  const friccion = e.friccion ? unidades * (comisionPorUnidad + tick * dolaresPorUnidad) : 0;
  const beneficioBruto = unidades * distObjetivo * dolaresPorUnidad;
  const nocional = unidades * e.entrada * dolaresPorUnidad;
  const apalancamiento = e.balance > 0 ? nocional / e.balance : 0;

  return {
    ...vacio,
    rr: distObjetivo / distStop,
    riesgoReal,
    friccion,
    riesgoTotal: riesgoReal + friccion,
    tamano: unidades / unidadesPorTamano,
    noCabe: escalon > 0 && unidades === 0,
    riesgoDeUno: escalon * riesgoPorUnidad,
    valorPip: unidades * tick * dolaresPorUnidad,
    nocional,
    beneficioBruto,
    beneficioNeto: beneficioBruto - friccion,
    apalancamiento,
    apalancamientoExcesivo: excedeApalancamiento(e.mercado, apalancamiento),
  };
}

/**
 * Kelly completo, medio y cuarto, en %: f* = (p·b − q) / b, sin topes. El
 * tope de la calculadora es cosa del control de riesgo, no de Kelly: antes
 * se topaban las fracciones y «Medio Kelly» y «Cuarto de Kelly» salían
 * los dos a 3 % con un Kelly completo del 40 %.
 */
export function fraccionesKelly(aciertoPct: number, rr: number): { completo: number; medio: number; cuarto: number } {
  if (!(rr > 0)) return { completo: 0, medio: 0, cuarto: 0 };
  const p = aciertoPct / 100;
  const completo = Math.max(0, ((p * rr - (1 - p)) / rr) * 100);
  return { completo, medio: completo / 2, cuarto: completo / 4 };
}
