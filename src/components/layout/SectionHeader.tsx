"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/tj/Reveal";
import { Eyebrow } from "@/components/tj/Eyebrow";

/**
 * Cabecera de sección con tres composiciones, que se alternan a lo largo de la
 * página para que las secciones no parezcan un molde repetido.
 *
 *  · `apilada` (por defecto): titular y entradilla en bloque a la izquierda;
 *    la correcta cuando debajo hay una rejilla.
 *  · `partida`: titular a la izquierda y entradilla en una segunda columna.
 *    Solo con entradilla de dos líneas o más.
 *  · `centrada`: para cierres o énfasis; se reserva para que siga significando algo.
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
  /** Nivel del encabezado; `h3` cuando la sección va anidada en otra. */
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

  // Medida en `ch`; el titular admite menos que un párrafo por su cuerpo mayor.
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
          "medida t-entradilla text-secondary",
          // En `partida` es su propia columna y no lleva separación superior.
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
          // Dos columnas desde `lg`, la del titular más estrecha.
          "tj-split grid gap-y-6",
          // La entradilla baja un poco: alineadas, las columnas se leerían como tabla.
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
