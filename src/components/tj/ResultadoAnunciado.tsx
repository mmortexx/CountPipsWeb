"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Anuncia a los lectores de pantalla el resultado de una herramienta que
 * recalcula al teclear. Anuncia una sola frase, no el panel entero, y con
 * retardo: el reloj se reinicia en cada cambio para decir solo el valor que
 * quedó quieto (un `aria-live` directo leería una cifra por pulsación). No
 * dice nada al cargar, porque un `role="status"` que nace con texto se lee al
 * entrar. Se declaran `role="status"` y `aria-live` porque algunos lectores
 * atienden solo a uno.
 */
export function ResultadoAnunciado({
  texto,
  retardo = 700,
}: {
  /** Una frase. Lo que diría alguien al mirar el resultado por encima. */
  texto: string;
  /** Milisegundos que el valor tiene que quedarse quieto antes de decirlo. */
  retardo?: number;
}) {
  const [anunciado, setAnunciado] = useState("");
  const primero = useRef(true);

  useEffect(() => {
    if (primero.current) {
      primero.current = false;
      return;
    }
    const t = setTimeout(() => setAnunciado(texto), retardo);
    return () => clearTimeout(t);
  }, [texto, retardo]);

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {anunciado}
    </p>
  );
}
