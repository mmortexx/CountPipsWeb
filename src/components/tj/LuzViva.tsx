"use client";

import { useEffect } from "react";

/**
 * LuzViva — el único oyente de puntero de todo el sitio.
 *
 * ── Qué alimenta ──────────────────────────────────────────────────────
 * Dos cosas, con el mismo gesto del ratón:
 *
 *  · `--luz-x` / `--luz-y` en el `<html>` — el foco ambiental del fondo
 *    (`.tj-luz`). Se interpola hacia el puntero en vez de seguirlo al
 *    píxel: una luz que va exactamente donde está el cursor se lee como
 *    un puntero láser; una que llega con retardo se lee como luz.
 *
 *  · `--mx` / `--my` en la superficie que hay bajo el cursor — el
 *    reflejo local de `.tj-realce`. En coordenadas de la propia
 *    superficie, para que el degradado no dependa de dónde esté la
 *    tarjeta en la página.
 *
 * ── Por qué uno solo y no uno por tarjeta ─────────────────────────────
 * Una página de este sitio llega a tener cuarenta superficies con
 * realce. Cuarenta componentes con su `onPointerMove` son cuarenta
 * funciones de React ejecutándose por cada píxel que recorre el ratón, y
 * cada una programando su propio render. Aquí hay un oyente pasivo en el
 * documento, una lectura de `closest()` y dos escrituras de variable CSS
 * dentro de un `requestAnimationFrame`: el trabajo no crece con el
 * número de tarjetas, y no pasa por React ni una sola vez.
 *
 * ── Y por qué no hace nada más ────────────────────────────────────────
 * Ni deriva de scroll ni revelados: eso lo resuelve el CSS con
 * `animation-timeline`, que corre en el compositor. Aquí sólo está lo
 * que el CSS no puede saber por su cuenta, que es dónde está el ratón.
 *
 * No pinta nada: es sólo efecto.
 */
export function LuzViva() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Sin puntero fino no hay nada que seguir: en táctil el oyente sólo
    // dispararía en cada toque para mover una luz que nadie ve moverse.
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const raiz = document.documentElement;
    /* Destino (dónde está el ratón) y actual (dónde está la luz). La
       distancia entre ambos es el retardo, y el retardo es lo que
       distingue una luz de un cursor. */
    let destinoX = 50;
    let destinoY = 28;
    let x = 50;
    let y = 28;
    let raf = 0;
    let vivo = false;

    /* La superficie bajo el cursor. Se guarda para no volver a
       consultarla en cada fotograma y para poder limpiar sus variables
       al salir, que si no se quedan con el último valor y el reflejo
       reaparece donde estuvo la última vez. */
    let superficie: HTMLElement | null = null;

    const paso = () => {
      // 0,08 por fotograma: a 60 Hz la luz cubre el 99 % de la distancia
      // en algo menos de un segundo. Bastante lento para leerse como
      // inercia, bastante rápido para no parecer que se ha quedado
      // atrás.
      x += (destinoX - x) * 0.08;
      y += (destinoY - y) * 0.08;
      raiz.style.setProperty("--luz-x", `${x.toFixed(2)}%`);
      raiz.style.setProperty("--luz-y", `${y.toFixed(2)}%`);
      // Se para sola al llegar. Un rAF eterno mantiene despierta la
      // pestaña y gasta batería dibujando el mismo fotograma.
      if (Math.abs(destinoX - x) > 0.05 || Math.abs(destinoY - y) > 0.05) {
        raf = requestAnimationFrame(paso);
      } else {
        vivo = false;
      }
    };

    const mover = (e: PointerEvent) => {
      destinoX = (e.clientX / window.innerWidth) * 100;
      destinoY = (e.clientY / window.innerHeight) * 100;

      /* Toda superficie de papel lleva reflejo, salvo las densas —barra,
         cajón, paletas—, que están siempre delante y donde una luz
         siguiendo al ratón sería un distractor permanente. `.tj-realce`
         entra para los pocos casos que quieren reflejo sin ser papel. */
      const bajo =
        (e.target as Element | null)?.closest?.<HTMLElement>(
          ".tj-paper:not(.tj-paper-dense), .demo-card, .tj-realce",
        ) ?? null;
      if (bajo !== superficie) {
        superficie?.style.removeProperty("--mx");
        superficie?.style.removeProperty("--my");
        superficie = bajo;
      }
      if (superficie) {
        const r = superficie.getBoundingClientRect();
        superficie.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        superficie.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      }

      if (!vivo) {
        vivo = true;
        raf = requestAnimationFrame(paso);
      }
    };

    /* Al salir de la ventana la luz vuelve a su sitio de reposo. Sin
       esto se queda clavada en el último borde que tocó el ratón, que es
       justo donde peor queda: pegada a un canto. */
    const salir = () => {
      destinoX = 50;
      destinoY = 28;
      superficie?.style.removeProperty("--mx");
      superficie?.style.removeProperty("--my");
      superficie = null;
      if (!vivo) {
        vivo = true;
        raf = requestAnimationFrame(paso);
      }
    };

    window.addEventListener("pointermove", mover, { passive: true });
    document.addEventListener("pointerleave", salir);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerleave", salir);
      raiz.style.removeProperty("--luz-x");
      raiz.style.removeProperty("--luz-y");
      superficie?.style.removeProperty("--mx");
      superficie?.style.removeProperty("--my");
    };
  }, []);

  return null;
}
