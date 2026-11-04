import type { Direction } from "@/lib/trading/data";
import type { Lang } from "@/lib/locale";
import { fmtInt } from "@/lib/trading/format";
import { LIMITES } from "@/lib/trading/limites";

/** Por qué un plan de entrada/stop/objetivo no es válido. */
export type MotivoPlanInvalido = "campos" | "lado";

export interface ResultadoValidaPlan {
  valido: boolean;
  motivo: MotivoPlanInvalido | null;
}

/**
 * Valida un plan de operación (entrada, stop, objetivo).
 *
 * Válido solo si los tres son positivos y distintos entre sí y el objetivo
 * queda en el lado contrario de la entrada al del stop: stop por encima
 * (corto), objetivo por debajo; stop por debajo (largo), objetivo por encima.
 * Con ambos en el mismo lado el riesgo y el beneficio por unidad salen
 * positivos, pero no es una operación posible.
 */
export function validaPlan(entrada: number, stop: number, objetivo: number): ResultadoValidaPlan {
  const camposOk =
    Number.isFinite(entrada) &&
    Number.isFinite(stop) &&
    Number.isFinite(objetivo) &&
    entrada > 0 &&
    stop > 0 &&
    objetivo > 0 &&
    entrada !== stop &&
    entrada !== objetivo &&
    stop !== objetivo;

  if (!camposOk) return { valido: false, motivo: "campos" };

  const stopArriba = stop > entrada;
  const objetivoArriba = objetivo > entrada;
  if (stopArriba === objetivoArriba) return { valido: false, motivo: "lado" };

  return { valido: true, motivo: null };
}

export type MercadoPlan = "equities" | "crypto" | "forex" | "futures";

// Topes de apalancamiento de la ESMA para minoristas: acciones 5:1, cripto 2:1,
// divisas principales 30:1 e índices 20:1 (el margen de un futuro de índice anda por ahí).
export const TOPE_APALANCAMIENTO: Record<MercadoPlan, number> = {
  equities: 5,
  crypto: 2,
  forex: 30,
  futures: 20,
};

export function excedeApalancamiento(mercado: MercadoPlan, apalancamiento: number): boolean {
  return Number.isFinite(apalancamiento) && apalancamiento > TOPE_APALANCAMIENTO[mercado];
}

/**
 * R:R planificado con signo: lo que el objetivo gana (o pierde, si queda del
 * lado contrario al favorable de la dirección) por cada unidad de riesgo hasta
 * el stop. 0 sin objetivo positivo o sin distancia al stop.
 */
export function rrPlanificado(direccion: Direction, entrada: number, stop: number, objetivo: number): number {
  const riesgo = Math.abs(entrada - stop);
  if (!(riesgo > 0) || !(objetivo > 0)) return 0;
  return (direccion === "long" ? objetivo - entrada : entrada - objetivo) / riesgo;
}

export interface Registro {
  entrada: number;
  stop: number;
  salida: number;
  cantidad: number;
  /** Opcional: vacío o ilegible (`NaN`) es «sin objetivo». */
  objetivo?: number;
}

export type CampoRegistro = "entrada" | "stop" | "objetivo" | "salida" | "cantidad";

/** Por qué falla un campo: sin cifra legible, no positiva, sobre su tope, igual a
 *  la entrada, del lado equivocado de la entrada o con un resultado sobre el tope. */
export type MotivoRegistro = "numero" | "positivo" | "maximo" | "igual" | "lado" | "resultado";

export interface FalloRegistro {
  campo: CampoRegistro;
  motivo: MotivoRegistro;
}

export type RevisionRegistro =
  | { registro: Registro; fallo: null }
  | { registro: null; fallo: FalloRegistro };

/**
 * Lo que admite el registro rápido de la demo, y si no lo admite, el primer
 * campo que falla y por qué (en el orden entrada, stop, objetivo, salida,
 * cantidad). Sin salida (vacía o ilegible) se cierra en la entrada, con P&L 0.
 * Precios y cantidad, mayores que cero y sin pasar de `LIMITES`: nada se
 * corrige en silencio. Con el `multiplicador` del instrumento, tampoco el
 * resultado ni el riesgo en dólares pueden pasar de `LIMITES.resultadoRegistro`
 * (se achaca a la cantidad): cada cifra suelta cabe en su tope y el producto no.
 * El stop va del lado de la dirección que pierde (debajo en largo, encima en
 * corto) y el objetivo, si lo hay, del contrario (`validaPlan`).
 */
export function revisaRegistro({
  direccion,
  entrada,
  stop,
  salida,
  cantidad,
  objetivo,
  multiplicador = 1,
}: Registro & { direccion: Direction; multiplicador?: number }): RevisionRegistro {
  const falla = (campo: CampoRegistro, motivo: MotivoRegistro): RevisionRegistro => ({ registro: null, fallo: { campo, motivo } });
  const fallaPrecio = (campo: CampoRegistro, p: number) =>
    !Number.isFinite(p) ? falla(campo, "numero") : p <= 0 ? falla(campo, "positivo") : p > LIMITES.precio.max ? falla(campo, "maximo") : null;

  const deEntrada = fallaPrecio("entrada", entrada);
  if (deEntrada) return deEntrada;
  const deStop = fallaPrecio("stop", stop);
  if (deStop) return deStop;
  if (entrada === stop) return falla("stop", "igual");
  if (direccion === "long" ? stop > entrada : stop < entrada) return falla("stop", "lado");

  const hayObjetivo = typeof objetivo === "number" && Number.isFinite(objetivo);
  if (hayObjetivo) {
    const deObjetivo = fallaPrecio("objetivo", objetivo);
    if (deObjetivo) return deObjetivo;
    if (objetivo === entrada) return falla("objetivo", "igual");
    if (!validaPlan(entrada, stop, objetivo).valido) return falla("objetivo", "lado");
  }

  if (Number.isFinite(salida)) {
    const deSalida = fallaPrecio("salida", salida);
    if (deSalida) return deSalida;
  }

  if (!Number.isFinite(cantidad)) return falla("cantidad", "numero");
  if (cantidad <= 0) return falla("cantidad", "positivo");
  if (cantidad > LIMITES.cantidad.max) return falla("cantidad", "maximo");

  const cierre = Number.isFinite(salida) ? salida : entrada;
  const recorrido = Math.max(Math.abs(cierre - entrada), Math.abs(entrada - stop));
  if (!(recorrido * cantidad * multiplicador <= LIMITES.resultadoRegistro.max)) return falla("cantidad", "resultado");
  return { registro: { entrada, stop, salida: cierre, cantidad, objetivo: hayObjetivo ? objetivo : undefined }, fallo: null };
}

/** Lo que admite el registro rápido, o `null` si hay que avisar (`revisaRegistro` dice qué falla). */
export function validaRegistro(registro: Registro & { direccion: Direction; multiplicador?: number }): Registro | null {
  return revisaRegistro(registro).registro;
}

const ETIQUETA_CAMPO: Record<CampoRegistro, { es: string; en: string }> = {
  entrada: { es: "Entrada", en: "Entry" },
  stop: { es: "Stop", en: "Stop" },
  objetivo: { es: "Objetivo", en: "Target" },
  salida: { es: "Salida", en: "Exit" },
  cantidad: { es: "Cantidad", en: "Quantity" },
};

/** El nombre visible del campo del registro: su etiqueta y el aviso que lo nombra salen de aquí. */
export function etiquetaCampoRegistro(campo: CampoRegistro, lang: Lang): string {
  return ETIQUETA_CAMPO[campo][lang === "es" ? "es" : "en"];
}

/** El título del aviso de un fallo del registro: nombra el campo, como su etiqueta. */
export function tituloFalloRegistro(campo: CampoRegistro, lang: Lang): string {
  const etiqueta = etiquetaCampoRegistro(campo, lang);
  return lang === "es" ? `Revisa el campo «${etiqueta}»` : `Check the “${etiqueta}” field`;
}

/** La frase de un fallo del registro, sin el nombre del campo (va bajo él y en la descripción del aviso). */
export function mensajeFalloRegistro({ campo, motivo }: FalloRegistro, direccion: Direction, lang: Lang): string {
  const es = lang === "es";
  const tope = campo === "cantidad" ? LIMITES.cantidad.max : LIMITES.precio.max;
  const largo = direccion === "long";
  switch (motivo) {
    case "numero":
      return es ? "Escribe un número." : "Enter a number.";
    case "positivo":
      return es ? "Debe ser mayor que cero." : "Must be above zero.";
    case "maximo":
      return es ? `No puede pasar de ${fmtInt(tope, "es")}.` : `Can’t be above ${fmtInt(tope, "en")}.`;
    case "igual":
      return es ? "No puede ser igual a la entrada." : "Can’t be the same as the entry.";
    case "lado": {
      // El stop pierde y el objetivo gana: van a lados contrarios de la entrada.
      const debajo = campo === "stop" ? largo : !largo;
      if (es) return `${largo ? "En largo" : "En corto"} va por ${debajo ? "debajo" : "encima"} de la entrada.`;
      return `For a ${largo ? "long" : "short"} it goes ${debajo ? "below" : "above"} the entry.`;
    }
    case "resultado":
      return es
        ? `Con esta cantidad, el resultado o el riesgo pasarían de ${fmtInt(LIMITES.resultadoRegistro.max, "es")} $.`
        : `With this quantity, the result or the risk would exceed $${fmtInt(LIMITES.resultadoRegistro.max, "en")}.`;
  }
}
