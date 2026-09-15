"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * La página se compone al desplazar: cada bloque de sección, y dentro las
 * piezas de listas y rejillas, sube a su sitio con un escalonado cuando
 * asoma. Por tiempo, no atado al scroll: atado al scroll el gesto terminaba
 * en el borde inferior de la ventana, antes de que la vista llegara.
 *
 * - Lo que ya está en pantalla al montar no se oculta (sin parpadeo).
 * - Sin JavaScript o con movimiento reducido no se marca nada.
 * - Estado en atributos `data-tj-ap`, que React no gestiona ni pisa.
 * - Lo que lleva cristal sólo se desplaza: una opacidad le quitaría el
 *   esmerilado mientras dura.
 */
const LISTAS = "ul, ol, dl, [data-orden], .grid";

export function Aparecer() {
  const pathname = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.getElementById("main-content");
    if (!main || typeof IntersectionObserver === "undefined") return;
    document.documentElement.classList.add("tj-mov");

    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.tjAp = "1";
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    const valido = (el: Element): el is HTMLElement => {
      if (!(el instanceof HTMLElement) || el.dataset.tjAp) return false;
      if (el.getAttribute("aria-hidden") === "true" || el.closest(".demo-window")) return false;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.display === "contents" || cs.position === "absolute" || cs.position === "fixed" || cs.position === "sticky") return false;
      return el.offsetHeight > 0;
    };

    const marcar = (el: HTMLElement, nivel: 1 | 2, paso: number) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.9) {
        el.dataset.tjAp = "ya";
        return;
      }
      el.dataset.tjAp = "0";
      el.dataset.tjNivel = String(nivel);
      el.dataset.tjPaso = String(Math.min(paso, 8));
      if (el.matches(".tj-cristal") || el.querySelector(".tj-cristal")) el.dataset.tjSolo = "mueve";
      io.observe(el);
    };

    const recorrer = () => {
      for (const s of main.querySelectorAll("section")) {
        if (s.id === "top" || s.classList.contains("tj-cabecera") || s.parentElement?.closest("section") || s.closest(".demo-window")) continue;
        const raiz = s.querySelector(":scope > .tj-container") ?? s;
        const bloques = [...raiz.children].filter(valido);
        bloques.forEach((b, i) => {
          marcar(b, 1, i);
          const contenedores = [...(b.matches(LISTAS) ? [b] : []), ...b.querySelectorAll<HTMLElement>(LISTAS)].filter(
            (c) => c === b || !c.parentElement?.closest(LISTAS) || !b.contains(c.parentElement.closest(LISTAS)),
          );
          for (const c of contenedores) {
            const hijas = [...c.children].filter(valido);
            if (hijas.length < 3 || hijas.length > 40) continue;
            hijas.forEach((h, j) => marcar(h, 2, i + j + 1));
          }
        });
      }
    };

    recorrer();
    let pendiente = 0;
    const mo = new MutationObserver(() => {
      if (pendiente) return;
      pendiente = requestAnimationFrame(() => {
        pendiente = 0;
        recorrer();
      });
    });
    mo.observe(main, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      cancelAnimationFrame(pendiente);
    };
  }, [pathname]);

  return null;
}
