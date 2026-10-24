/**
 * Rango de cada campo de cifra que se escribe a mano, en un solo sitio. Sin
 * tope superior, una cifra de 30 dígitos pasaba por válida y desbordaba la
 * ficha de resultados; fuera del rango, el campo se marca y dice cuál vale
 * (`mensajeRango`). Son topes de sentido común, no de mercado: lo bastante
 * altos para que ningún caso real los toque.
 */
const TOPE_REGISTRO = 10_000_000;

export const LIMITES = {
  /** Balance de la cuenta, en dólares. */
  balance: { min: 100, max: 1_000_000_000 },
  /** Precio de entrada, stop, objetivo o salida. */
  precio: { min: 0, max: TOPE_REGISTRO },
  /** Cantidad de una operación registrada: acciones, contratos o lotes. Mismo
   *  tope que el precio: el aviso del registro de la demo dice un solo número. */
  cantidad: { min: 0, max: TOPE_REGISTRO },
  /** Resultado (o riesgo) de una operación registrada, en dólares: precio ×
   *  cantidad × multiplicador. Cada cifra suelta cabe en su tope y el producto
   *  no (EURUSD, salida y cantidad en 10 millones: 1e19). El mismo tope que el
   *  balance: ninguna operación mueve más que la cuenta mayor admitida. */
  resultadoRegistro: { min: -1_000_000_000, max: 1_000_000_000 },
  /** Tipo de cambio con el que se pasa un par forex a dólares. */
  tipoCambio: { min: 0.0001, max: 100_000 },
  /** Comisión ida y vuelta por contrato, en dólares. */
  comision: { min: 0, max: 1_000 },
  /** Deslizamiento medio, en ticks. */
  deslizamiento: { min: 0, max: 10 },
  /** Resultado medio de una operación, en dólares. */
  resultadoPorOperacion: { min: -100_000, max: 100_000 },
} as const;
