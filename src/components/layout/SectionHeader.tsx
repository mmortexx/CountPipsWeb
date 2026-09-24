"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/tj/Reveal";
import { Eyebrow } from "@/components/tj/Eyebrow";

/**
 * SectionHeader — la cabecera de una sección, con variantes de COMPOSICIÓN.
 *
 * ── Por qué existe ────────────────────────────────────────────────────
 * Dieciocho secciones del sitio escribían su cabecera a mano, y las
 * dieciocho salían iguales: etiqueta, titular, párrafo, todo alineado a
 * la izquierda dentro de un `max-w-2xl`, con los mismos retardos de
 * aparición. Ese molde repetido es la razón principal de que la web se
 * lea como una plantilla — no los colores ni la tipografía, que ya
 * estaban resueltos, sino que cada sección se presenta exactamente igual
 * que la anterior durante todo el recorrido.
 *
 * Aquí no se trata de centralizar por centralizar: se trata de que
 * exista un sitio donde la composición sea una DECISIÓN y no una copia.
 *
 * ── Las variantes, y cuándo usar cada una ─────────────────────────────
 * No son estilos intercambiables: cada una dice algo distinto sobre lo
 * que viene debajo.
 *
 *  · `apilada` — el titular y su entradilla en bloque, a la izquierda.
 *    Es la de por defecto y la correcta cuando lo que sigue es una
 *    rejilla: la cabecera se aparta y deja que mande el contenido.
 *
 *  · `partida` — titular a la izquierda, entradilla en una segunda
 *    columna a la derecha. Usa el ancho real de la pantalla en vez de
 *    dejar medio lienzo vacío, y crea la asimetría que rompe la
 *    cadencia. Es la que usan las revistas para abrir un reportaje.
 *    Solo tiene sentido si hay entradilla y es de dos líneas o más.
 *
 *  · `centrada` — para un cierre o un momento de énfasis. Centrar es
 *    una decisión fuerte y por eso se reserva: si se centra todo, deja
 *    de significar nada.
 *
 * ── La regla que hace que esto sirva ──────────────────────────────────
 * La variante NO se elige sección por sección al gusto. Se ALTERNA a lo
 * largo de la página para que el recorrido tenga cadencia: si dos
 * secciones seguidas usan la misma, el lector vuelve a percibir el
 * molde y no habremos arreglado nada.
 */

export type ComposicionSeccion = "apilada" | "partida" | "centrada";

interface Props {
  /** La etiqueta corta de encima del titular. */
  etiqueta?: ReactNode;
  /** El titular. Se pinta como `h2`, que es lo que le corresponde. */
  titulo: ReactNode;
  /** La entradilla. En `partida` es la que ocupa la segunda columna. */
  entradilla?: ReactNode;
  composicion?: ComposicionSeccion;
  /**
   * Nivel del encabezado. Por defecto `h2`, que es lo correcto para una
   * sección dentro de una página que ya tiene su `h1`. Se puede bajar a
   * `h3` cuando la sección va anidada dentro de otra, para no romper el
   * orden del árbol de accesibilidad.
   */
  como?: "h2" | "h3";
  /** Clases extra para el contenedor. */
  className?: string;
  /** Contenido opcional bajo la entradilla (un botón, una nota). */
  children?: ReactNode;
}

export function SectionHeader({
  etiqueta,
  titulo,
  entradilla,
  composicion = "apilada",
  como: Titulo = "h2",
  className = "",
  children,
}: Props) {
  const esPartida = composicion === "partida" && Boolean(entradilla);
  const esCentrada = composicion === "centrada";

  /* La medida se acota en `ch` y no en `em`: `ch` mide en anchos de
     carácter, que es la unidad en la que de verdad se define cuántas
     letras caben en una línea. Un titular admite menos medida que un
     párrafo porque su cuerpo es mucho mayor. */
  const bloqueTitulo = (
    <>
      {etiqueta ? (
        <Reveal>
          <Eyebrow>{etiqueta}</Eyebrow>
        </Reveal>
      ) : null}
      <Reveal delay={etiqueta ? 0.06 : 0}>
        <Titulo className={`${etiqueta ? "mt-5" : ""} t-h2 text-primary max-w-[24ch] ${esCentrada ? "mx-auto" : ""}`}>
          {titulo}
        </Titulo>
      </Reveal>
    </>
  );

  const bloqueEntradilla = entradilla ? (
    <Reveal delay={0.12}>
      <p
        className={[
          "medida text-lg text-secondary leading-relaxed",
          /* En `partida` la entradilla es su propia columna y no lleva
             separación superior: se alinea ópticamente con el titular.
             En las otras dos va debajo, y sí. */
          esPartida ? "" : "mt-4",
          esCentrada ? "mx-auto" : "",
        ].join(" ")}
      >
        {entradilla}
      </p>
    </Reveal>
  ) : null;

  if (esPartida) {
    return (
      <div
        className={[
          /* Dos columnas desde `lg`, con la del titular más estrecha:
             un titular grande necesita menos ancho que un párrafo para
             la misma cantidad de texto. El hueco entre columnas es
             mayor que el de una rejilla normal a propósito — separa dos
             voces distintas, no dos elementos iguales. */
          "grid gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-16 xl:gap-x-24",
          /* La entradilla baja un poco respecto al titular para que sus
             primeras líneas no arranquen a la misma altura: alinearlas
             exactamente hace que las dos columnas se lean como una
             tabla en vez de como una apertura. */
          "lg:items-end",
          className,
        ].join(" ")}
      >
        <div>{bloqueTitulo}</div>
        <div className="lg:pb-1">
          {bloqueEntradilla}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        esCentrada ? "text-center mx-auto max-w-3xl" : "max-w-2xl",
        className,
      ].join(" ")}
    >
      {bloqueTitulo}
      {bloqueEntradilla}
      {children}
    </div>
  );
}
