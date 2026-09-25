/** Por qué un plan de entrada/stop/objetivo no es válido. */
export type MotivoPlanInvalido = "campos" | "lado";

export interface ResultadoValidaPlan {
  valido: boolean;
  motivo: MotivoPlanInvalido | null;
}

/**
 * Valida un plan de operación (entrada, stop, objetivo).
 *
 * Válido solo si los tres son positivos y distintos entre sí, Y el objetivo
 * queda al lado CONTRARIO de la entrada que el stop: si el stop está por
 * encima de la entrada (corto), el objetivo tiene que quedar por debajo; si
 * el stop está por debajo (largo), el objetivo tiene que quedar por encima.
 *
 * Antes de este arreglo, RiskCalculator solo comprobaba que el riesgo por
 * unidad y el beneficio por unidad fueran positivos: con entrada 100, stop
 * 105 y objetivo 110 los dos daban positivo aunque objetivo y stop caían en
 * el MISMO lado de la entrada — un "corto" cuyo objetivo está por encima de
 * un stop que también está por encima, que no es una operación posible.
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

  // El objetivo debe quedar al lado CONTRARIO de la entrada que el stop:
  // stop arriba (corto) exige objetivo abajo, y viceversa.
  const stopArriba = stop > entrada;
  const objetivoArriba = objetivo > entrada;
  if (stopArriba === objetivoArriba) return { valido: false, motivo: "lado" };

  return { valido: true, motivo: null };
}

export type MercadoPlan = "equities" | "forex" | "futures";

/* Topes de apalancamiento de la ESMA para clientes minoristas: acciones
   5:1, divisas principales 30:1 e índices 20:1 (el margen de un futuro de
   índice anda por ahí). Un stop a un céntimo de la entrada llevaba una
   cuenta de 10.000 $ a comprar 1.000.000 $ en acciones sin decir nada. */
export const TOPE_APALANCAMIENTO: Record<MercadoPlan, number> = {
  equities: 5,
  forex: 30,
  futures: 20,
};

export function excedeApalancamiento(mercado: MercadoPlan, apalancamiento: number): boolean {
  return Number.isFinite(apalancamiento) && apalancamiento > TOPE_APALANCAMIENTO[mercado];
}
