"use client";

import { useLang } from "@/lib/i18n";

/**
 * SelloPrevisto — la forma visual de «esto todavía no existe».
 *
 * ── El hueco que llena ────────────────────────────────────────────────
 * Este producto tiene un activo poco común: dice la verdad sobre su propio
 * estado. La demo es pública y no pide registro, el acceso anticipado es
 * privado y por invitación, y los 149 $ / 249 $ son precios previstos sin
 * nada que comprar detrás. Esa honestidad estaba dicha —en la barra de
 * términos de precios, en el texto de /beta, en el aviso bajo las
 * tarjetas— y no estaba DIBUJADA en ninguna parte.
 *
 * Cuando una cosa se dice sólo con palabras, cada sitio la dice a su
 * manera, y acaban existiendo cinco maneras: un chip con borde discontinuo
 * en el registro de versiones, un icono de reloj en el estado del piloto,
 * un sufijo «/ precio previsto» junto a la cifra, una barra de tres
 * columnas… Cinco dialectos para un solo concepto significa que el
 * visitante tiene que aprenderlos todos, y que ninguno se le queda.
 *
 * ── Por qué un marco de trazos y no un sello inclinado ────────────────
 * La convención ya existe DENTRO de este sitio, dos veces: la lámina
 * `blueprint` de /beta dibuja un despiece con piezas a línea llena y a
 * línea de trazos, que en dibujo técnico significa exactamente «previsto,
 * no ejecutado»; y el registro de versiones marca con `border-dashed` las
 * entregas que aún no han salido. Las dos dicen lo mismo sin saber la una
 * de la otra. Esto las convierte en una sola pieza.
 *
 * Y va RECTO, sin rotación ni color de alerta. Un sello de goma inclinado
 * es un objeto que alguien estampa encima de un papel terminado; aquí no
 * hay nadie estampando nada: es la propia plancha la que dibuja a trazos
 * la parte que todavía no se ha construido. La diferencia importa porque
 * el resto del sitio se ha pasado meses retirando adornos —el cristal, los
 * halos, los barridos de luz— y un tampón rotado los devuelve todos de
 * golpe.
 *
 * ── Lo que NO hace ────────────────────────────────────────────────────
 * No atenúa lo que envuelve. Bajar la opacidad de un bloque para decir que
 * está pendiente lo convierte en algo deshabilitado, y estas cosas no lo
 * están: el precio es real, la función está planificada de verdad. Lo que
 * cambia es CUÁNDO, no si merece leerse.
 */

export function SelloPrevisto({
  es: textoEs,
  en: textoEn,
  /** Una segunda línea, más pequeña, para cuando el «cuándo» importa. */
  detalleEs,
  detalleEn,
  className = "",
}: {
  es?: string;
  en?: string;
  detalleEs?: string;
  detalleEn?: string;
  className?: string;
}) {
  const { lang } = useLang();
  const es = lang === "es";
  const texto = es ? (textoEs ?? "Previsto") : (textoEn ?? "Planned");
  const detalle = es ? detalleEs : detalleEn;

  return (
    <span className={`sello-previsto ${className}`}>
      <span className="sello-previsto-texto">{texto}</span>
      {detalle ? <span className="sello-previsto-detalle">{detalle}</span> : null}
    </span>
  );
}
