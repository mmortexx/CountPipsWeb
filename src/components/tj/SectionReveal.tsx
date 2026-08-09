"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * SectionReveal — puerto del `_reveal()` del HTML de referencia: cada
 * <section> de nivel superior (excepto el hero #top) entra con un rise
 * de 22 px + fade (0.65 s, var(--ease-suave)) cuando asoma en
 * viewport (threshold 10 %, rootMargin -8 % inferior).
 *
 * La duración y el desplazamiento están afinados al mismo presupuesto
 * que Reveal (0.55 s, 16 px): aquí las secciones son más grandes y
 * toleran un poco más de recorrido (22 px) sin verse tropicales, pero
 * la familia de movimiento es la misma en toda la página.
 *
 * Implementación con Web Animations API (`el.animate()`) en lugar de
 * estilos inline: WAAPI no toca los atributos del DOM, así que no
 * provoca mismatches de hidratación con las secciones que llegan en
 * diferido vía next/dynamic (React hidrata sus atributos mientras
 * nosotros solo reproducimos una animación por encima). Antes de entrar
 * en viewport la sección está fuera de pantalla, con lo que no necesita
 * pre-ocultarse. El estado "ya animado" vive en un WeakSet, no en
 * data-attributes, por el mismo motivo.
 *
 * Se excluyen secciones anidadas (p. ej. dentro del demo interactivo) y
 * un MutationObserver sobre <main> re-escanea cuando los chunks
 * dynamic() montan secciones nuevas.
 */
export function SectionReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
            { duration: 650, easing: "var(--ease-suave)" }
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
