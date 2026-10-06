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

export type MercadoPlan = "equities" | "forex" | "futures";

// Topes de apalancamiento de la ESMA para minoristas: acciones 5:1, divisas
// principales 30:1 e índices 20:1 (el margen de un futuro de índice anda por ahí).
export const TOPE_APALANCAMIENTO: Record<MercadoPlan, number> = {
  equities: 5,
  forex: 30,
  futures: 20,
};

export function excedeApalancamiento(mercado: MercadoPlan, apalancamiento: number): boolean {
  return Number.isFinite(apalancamiento) && apalancamiento > TOPE_APALANCAMIENTO[mercado];
}
