"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { curva } from "@/lib/motion";

/**
 * SectionReveal — el RESPALDO de la entrada de sección, para los
 * navegadores sin `animation-timeline: view()`.
 *
 * ── Por qué ya no es el mecanismo principal ───────────────────────────
 * Porque estaba apagando el texto que el visitante ya estaba leyendo.
 *
 * La animación va de opacidad 0 a 1 y la disparaba un
 * IntersectionObserver montado en un efecto: no empieza cuando la
 * sección aparece, sino cuando React ha hidratado. En `/features` eso
 * son más de dos segundos, y durante ese rato la cabecera está pintada
 * y legible. Al arrancar el observador, el primer fotograma la manda a
 * opacidad 0 y la vuelve a subir. Medido: el titular y su párrafo a
 * 0,409 de opacidad acumulada, con el contraste caído de 11:1 a 2,5:1.
 * Lo que se veía no era una entrada elegante; era una página que se
 * apagaba sola.
 *
 * El mecanismo principal es ahora CSS —ver el bloque «ENTRADA DE
 * SECCIÓN» de globals.css—, donde el progreso de la animación ES la
 * posición de la sección en la ventana: lo que ya está en pantalla nace
 * en su estado final, sin nada que esperar.
 *
 * ── Las dos reglas que este respaldo respeta ──────────────────────────
 *  1. No hace nada si el navegador soporta el timeline de scroll. Los
 *     dos mecanismos a la vez animarían la misma opacidad dos veces.
 *  2. **No anima lo que ya está en pantalla.** Es la regla que faltaba,
 *     y la que convertía un adorno en un defecto de legibilidad. Una
 *     entrada sólo tiene sentido para lo que el visitante todavía no ha
 *     visto.
 *
 * Implementación con Web Animations API (`el.animate()`) en lugar de
 * estilos inline: WAAPI no toca los atributos del DOM, así que no
 * provoca mismatches de hidratación con las secciones que llegan en
 * diferido vía next/dynamic. El estado "ya animado" vive en un WeakSet
 * por el mismo motivo.
 */
export function SectionReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Regla 1: si el CSS puede, el CSS manda.
    if (CSS.supports("animation-timeline", "view()")) return;
    const main = document.getElementById("main-content");
    if (!main) return;

    const seen = new WeakSet<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          el.animate(
            [
              { opacity: 0, transform: "translateY(22px)" },
              { opacity: 1, transform: "none" },
            ],
            // `curva()` resuelve el token del CSS: la Web Animations API
            // no admite `var(...)` aquí (ver src/lib/motion.ts).
            { duration: 650, easing: curva("--ease-suave") }
          );
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );

    const scan = () => {
      Array.from(main.querySelectorAll<HTMLElement>("section"))
        .filter(
          (s) =>
            s.id !== "top" &&
            !seen.has(s) &&
            !s.parentElement?.closest("section")
        )
        .forEach((el) => {
          seen.add(el);
          /* Regla 2: lo que ya asoma en la ventana en el momento de
             registrarlo no se anima — se da por entrado. Se marca como
             visto igualmente para que el re-escaneo del MutationObserver
             no lo reconsidere. */
          if (el.getBoundingClientRect().top < window.innerHeight) return;
          io.observe(el);
        });
    };

    scan();
    // Secciones dynamic() que llegan después del primer render.
    const mo = new MutationObserver(() => scan());
    mo.observe(main, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
