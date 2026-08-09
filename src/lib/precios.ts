/**
 * Los precios previstos de lanzamiento, en un solo sitio.
 *
 * ── Por qué existe ────────────────────────────────────────────────────
 * Las dos cifras estaban escritas a mano en tres archivos —la tabla de
 * precios, el texto de una calculadora y el folio de la cabecera— y son
 * el número más comprobable de todo el sitio: cualquiera puede abrir dos
 * páginas y compararlas. Tres copias de un precio es la clase de cosa
 * que se desincroniza el día que se retoca una y se olvida otra, y el
 * resultado no es un defecto visual: es una web que dice dos precios
 * distintos por el mismo producto.
 *
 * ── Lo que estas cifras NO son ────────────────────────────────────────
 * Una oferta. No hay compra: son precios PREVISTOS de lanzamiento, y en
 * cada sitio donde aparecen van acompañados del sello que lo dice. Ver
 * `SelloPrevisto`. Si algún día hay pasarela de pago, este archivo deja
 * de ser la fuente y pasa a serlo el catálogo real.
 */

/** Dólares al año, plan Core. */
export const PRECIO_CORE = 149;

/** Dólares al año, plan Pro. */
export const PRECIO_PRO = 249;

/** Moneda en la que están expresados los dos. */
export const MONEDA = "$";
