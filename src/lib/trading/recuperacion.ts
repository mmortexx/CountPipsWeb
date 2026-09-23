/**
 * Lo que cuesta volver al máximo después de una caída.
 *
 * Las caídas se expresan en tanto por uno (0,2 = 20 %). Ninguna función
 * devuelve NaN ni Infinity: lo que no tiene respuesta devuelve `null`, y la
 * pantalla decide cómo decirlo.
 */

/** Ganancia necesaria sobre lo que queda para recuperar la caída. */
export function gananciaParaRecuperar(caida: number): number | null {
  if (!Number.isFinite(caida) || caida < 0 || caida >= 1) return null;
  return caida / (1 - caida);
}

/**
 * Crecimiento logarítmico esperado por operación arriesgando `riesgo` del
 * capital, con acierto `acierto` y `payoff` (ganancia media / pérdida
 * media). Es el ritmo del camino típico —la mediana—, no de la media: la
 * media la inflan unos pocos caminos afortunados.
 */
export function crecimientoPorOperacion(riesgo: number, acierto: number, payoff: number): number | null {
  if (![riesgo, acierto, payoff].every(Number.isFinite)) return null;
  if (riesgo <= 0 || riesgo >= 1 || acierto < 0 || acierto > 1 || payoff <= 0) return null;
  return acierto * Math.log1p(riesgo * payoff) + (1 - acierto) * Math.log1p(-riesgo);
}

/** Operaciones que tarda el camino típico en recuperar la caída; `null`
 *  si no la recupera nunca (crecimiento nulo o negativo). */
export function operacionesParaRecuperar(
  caida: number,
  riesgo: number,
  acierto: number,
  payoff: number,
): number | null {
  if (gananciaParaRecuperar(caida) === null) return null;
  const g = crecimientoPorOperacion(riesgo, acierto, payoff);
  if (g === null) return null;
  if (caida === 0) return 0;
  if (g <= 0) return null;
  return Math.ceil(-Math.log1p(-caida) / g);
}
