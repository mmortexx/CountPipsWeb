import { mulberry32 } from "./azar.ts";

/**
 * Simulación de una prueba de fondeo: se aprueba al tocar el objetivo y se
 * suspende al tocar el suelo del drawdown, lo que llegue antes.
 *
 * El riesgo es una fracción FIJA del saldo inicial, como lo cuenta quien
 * hace una prueba («arriesgo 500 $ de una cuenta de 50.000»), y todo va en
 * tanto por uno del saldo inicial. No modela el límite de pérdida diaria ni
 * las reglas de consistencia: cada firma los define a su manera.
 */

export type TipoDrawdown = "estatico" | "dinamico";

export interface ParametrosFondeo {
  /** Beneficio para aprobar (0,08 = 8 %). */
  objetivo: number;
  /** Pérdida máxima permitida (0,10 = 10 %). */
  ddMaximo: number;
  /** Estático: el suelo no se mueve. Dinámico: sube con el máximo del saldo
   *  hasta llegar al saldo inicial, y ahí se queda. */
  drawdown: TipoDrawdown;
  riesgo: number;
  acierto: number;
  payoff: number;
  maxOperaciones: number;
  caminos?: number;
  semilla?: number;
}

export interface ResultadoFondeo {
  /** Fracciones de caminos; suman 1. */
  aprueba: number;
  suspende: number;
  sinResolver: number;
  /** Mediana de operaciones hasta aprobar o suspender; null si ninguno. */
  medianaAprobar: number | null;
  medianaSuspender: number | null;
  caminos: number;
}

const TOLERANCIA = 1e-9;

/** Controles del simulador, en las unidades que ve el visitante (8 = 8 %). */
export interface EscenarioFondeo {
  tipo: TipoDrawdown;
  objetivo: number;
  dd: number;
  riesgo: number;
  acierto: number;
  payoff: number;
  ops: number;
}

/** Recorrido de cada control: [mínimo, máximo, paso]. */
export const RANGOS_FONDEO: Record<Exclude<keyof EscenarioFondeo, "tipo">, [number, number, number]> = {
  objetivo: [3, 15, 0.5],
  dd: [3, 12, 0.5],
  riesgo: [0.25, 3, 0.25],
  acierto: [25, 75, 1],
  payoff: [0.5, 4, 0.1],
  ops: [20, 500, 10],
};

/**
 * Lee de la dirección un escenario compartido («?objetivo=6&dd=4&tipo=dinamico»).
 * Lo que no es un número, o no está, se ignora; lo que se sale del recorrido
 * se lleva al extremo y al paso más cercano, como haría el propio deslizador.
 */
export function leerEscenario(search: string): Partial<EscenarioFondeo> {
  const q = new URLSearchParams(search);
  const out: Partial<EscenarioFondeo> = {};
  const tipo = q.get("tipo");
  if (tipo === "estatico" || tipo === "dinamico") out.tipo = tipo;
  for (const clave of Object.keys(RANGOS_FONDEO) as (keyof typeof RANGOS_FONDEO)[]) {
    const bruto = q.get(clave);
    if (bruto === null || bruto.trim() === "") continue;
    const n = Number(bruto);
    if (!Number.isFinite(n)) continue;
    const [min, max, paso] = RANGOS_FONDEO[clave];
    const ajustado = Math.round((Math.min(max, Math.max(min, n)) - min) / paso) * paso + min;
    out[clave] = Number(ajustado.toFixed(4));
  }
  return out;
}

function mediana(xs: number[]): number | null {
  if (!xs.length) return null;
  const o = [...xs].sort((a, b) => a - b);
  return o[Math.floor((o.length - 1) / 2)];
}

export function simularFondeo(p: ParametrosFondeo): ResultadoFondeo | null {
  const { objetivo, ddMaximo, drawdown, riesgo, acierto, payoff } = p;
  const valores = [objetivo, ddMaximo, riesgo, acierto, payoff, p.maxOperaciones];
  if (!valores.every(Number.isFinite)) return null;
  if (objetivo <= 0 || ddMaximo <= 0 || ddMaximo >= 1 || riesgo <= 0 || riesgo >= 1) return null;
  if (acierto < 0 || acierto > 1 || payoff <= 0 || p.maxOperaciones < 1) return null;

  const maxOps = Math.min(5000, Math.floor(p.maxOperaciones));
  const caminos = Math.min(20000, Math.max(1, Math.floor(p.caminos ?? 2000)));
  const azar = mulberry32(p.semilla ?? 1);
  const meta = 1 + objetivo;
  const ganancia = riesgo * payoff;

  let aprueba = 0;
  let suspende = 0;
  const hastaAprobar: number[] = [];
  const hastaSuspender: number[] = [];

  for (let c = 0; c < caminos; c++) {
    let saldo = 1;
    let pico = 1;
    for (let k = 1; k <= maxOps; k++) {
      saldo += azar() < acierto ? ganancia : -riesgo;
      if (saldo > pico) pico = saldo;
      const suelo = drawdown === "estatico" ? 1 - ddMaximo : Math.min(pico - ddMaximo, 1);
      if (saldo <= suelo + TOLERANCIA) {
        suspende++;
        hastaSuspender.push(k);
        break;
      }
      if (saldo >= meta - TOLERANCIA) {
        aprueba++;
        hastaAprobar.push(k);
        break;
      }
    }
  }

  return {
    aprueba: aprueba / caminos,
    suspende: suspende / caminos,
    sinResolver: (caminos - aprueba - suspende) / caminos,
    medianaAprobar: mediana(hastaAprobar),
    medianaSuspender: mediana(hastaSuspender),
    caminos,
  };
}
