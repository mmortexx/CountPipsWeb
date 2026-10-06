"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { curva } from "@/lib/motion";

/**
 * Respaldo de la entrada de sección para navegadores sin
 * `animation-timeline: view()` (el mecanismo principal es CSS, en globals.css).
 * Reglas: no hace nada si el CSS puede, y no anima lo que ya está en pantalla
 * (animarlo apagaría texto que se está leyendo). Usa Web Animations API y un
 * WeakSet porque no tocan el DOM y no desajustan la hidratación de las
 * secciones diferidas.
 */
export function SectionReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Si el CSS puede, el CSS manda.
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
            // `curva()` resuelve el token: WAAPI no admite `var(...)` (src/lib/motion.ts).
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
          // Lo que ya asoma no se anima, pero se marca visto para el re-escaneo.
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
