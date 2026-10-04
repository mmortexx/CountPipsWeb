"use client";

import type { CSSProperties } from "react";

/** Deslizador de las herramientas: etiqueta y valor encima, la barra debajo
 *  (44 px de alto para el dedo). `texto` es el valor ya formateado; también
 *  es lo que anuncia el lector de pantalla. */
export function Deslizador({
  etiqueta,
  texto,
  valor,
  min,
  max,
  paso,
  onValor,
}: {
  etiqueta: string;
  texto: string;
  valor: number;
  min: number;
  max: number;
  paso: number;
  onValor: (n: number) => void;
}) {
  /* La fila de la etiqueta crece y la barra baja al fondo de la celda: si
     una etiqueta parte en dos líneas, la barra de al lado no se queda más
     arriba que la suya. */
  return (
    <div className="flex flex-col">
      <div className="mb-2 flex flex-1 items-start justify-between gap-4">
        <span className="tj-deslizador-etiqueta">{etiqueta}</span>
        <span className="tj-deslizador-valor">{texto}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onValor(Number(e.target.value))}
        aria-label={etiqueta}
        aria-valuetext={texto}
        className="tj-range w-full"
        style={{ height: 44, "--f": ((valor - min) / (max - min)) } as CSSProperties}
      />
    </div>
  );
}
