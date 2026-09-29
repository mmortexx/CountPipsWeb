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
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
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
        style={{ height: 44, "--pct": `${((valor - min) / (max - min)) * 100}%` } as CSSProperties}
      />
    </div>
  );
}
