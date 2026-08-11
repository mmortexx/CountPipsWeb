"use client";

import { useEffect, useState } from "react";

/**
 * Mantiene un elemento en el árbol el tiempo justo para que se despida.
 *
 * ── EL PROBLEMA QUE RESUELVE ──────────────────────────────────────────
 * Una animación de ENTRADA no necesita nada: la clase ya está puesta
 * cuando el elemento nace. Una de SALIDA sí, porque React quita el
 * elemento del árbol en el mismo instante en que la condición pasa a
 * falso, y lo que no está no se puede animar.
 *
 * Eso es lo único que hacía `AnimatePresence` de framer-motion en los
 * overlays de este sitio, y era la razón por la que la paleta de
 * comandos y la ayuda de atajos arrastraban la biblioteca entera.
 *
 * ── CÓMO ──────────────────────────────────────────────────────────────
 * `montado` se pone a true en cuanto `abierto` lo hace, y sólo vuelve a
 * false cuando ha pasado `ms`. `saliendo` marca ese intervalo, para que
 * el componente pueda ponerle la clase de despedida.
 *
 * El temporizador se cancela si el elemento vuelve a abrirse antes de
 * tiempo: sin eso, abrir y cerrar rápido dejaba un temporizador vivo que
 * desmontaba el overlay recién reabierto.
 *
 * ── «REDUCIR MOVIMIENTO» ──────────────────────────────────────────────
 * No se consulta aquí a propósito. Quien pide menos movimiento no pide
 * menos ESPERA: si se acortara el plazo, la clase de salida seguiría
 * puesta y el navegador la ignoraría igualmente por el `@media` de la
 * hoja. El coste de mantener 180 ms un elemento que ya no se ve es
 * ninguno; el de tener dos fuentes de verdad para la misma duración, sí.
 */
export function usePresencia(abierto: boolean, ms = 180) {
  const [montado, setMontado] = useState(abierto);
  const [anterior, setAnterior] = useState(abierto);

  /* EL MONTAJE SE AJUSTA DURANTE EL RENDER, NO EN UN EFECTO.
     Hacerlo en un efecto significa un render con el panel aún ausente y
     otro con él dentro: el visitante ve un fotograma en blanco entre que
     pulsa ⌘K y aparece la paleta. React admite ajustar estado durante el
     render comparándolo con el valor anterior —vuelve a renderizar antes
     de pintar nada—, y es además lo que pide la regla
     `react-hooks/set-state-in-effect`, que marcaba la primera versión de
     este hook. */
  if (abierto !== anterior) {
    setAnterior(abierto);
    if (abierto) setMontado(true);
  }

  useEffect(() => {
    // El desmontaje sí es diferido por naturaleza: hay que esperar a que
    // la despedida termine. El `setState` va dentro del temporizador, no
    // en el cuerpo del efecto.
    if (abierto || !montado) return;
    const t = setTimeout(() => setMontado(false), ms);
    // Si vuelve a abrirse antes de tiempo, el temporizador se cancela:
    // sin esto, abrir y cerrar rápido dejaba uno vivo que desmontaba el
    // overlay recién reabierto.
    return () => clearTimeout(t);
  }, [abierto, montado, ms]);

  return { montado, saliendo: montado && !abierto };
}
