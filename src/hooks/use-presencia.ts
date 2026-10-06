"use client";

import { useEffect, useState } from "react";

/**
 * Mantiene un elemento en el árbol el tiempo justo para que se despida: React
 * lo quita en cuanto la condición pasa a falso y lo que no está no se anima.
 *
 * `montado` pasa a true en cuanto `abierto` lo hace y vuelve a false pasados
 * `ms`; `saliendo` marca ese intervalo para ponerle la clase de despedida. El
 * temporizador se cancela si se reabre antes, para no desmontar el overlay
 * recién reabierto.
 *
 * No consulta «reducir movimiento» a propósito: eso no pide menos espera, y el
 * `@media` de la hoja ya ignora la clase de salida. Acortar el plazo aquí sería
 * una segunda fuente de verdad para la misma duración.
 */
export function usePresencia(abierto: boolean, ms = 180) {
  const [montado, setMontado] = useState(abierto);
  const [anterior, setAnterior] = useState(abierto);

  /* El montaje se ajusta durante el render, no en un efecto: con efecto hay un
     render con el panel ausente y se ve un fotograma en blanco al abrir. Es
     además lo que exige `react-hooks/set-state-in-effect`. */
  if (abierto !== anterior) {
    setAnterior(abierto);
    if (abierto) setMontado(true);
  }

  useEffect(() => {
    // El desmontaje espera a que termine la despedida; el `setState` va en el temporizador.
    if (abierto || !montado) return;
    const t = setTimeout(() => setMontado(false), ms);
    return () => clearTimeout(t);
  }, [abierto, montado, ms]);

  return { montado, saliendo: montado && !abierto };
}
