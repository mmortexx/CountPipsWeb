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
    // Lo que depende de hidratar sólo entra si hidrata pronto: tarde sería un parpadeo.
    if (performance.now() < 1500) document.documentElement.classList.add("tj-mov-pronto");

    // El escalonado se reparte entre lo que asoma a la vez, en orden de
    // lectura (fila y luego columna): cada fila nueva empieza de cero.
    const io = new IntersectionObserver(
      (entradas) => {
        const lote = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => Math.round(a.boundingClientRect.top / 24) - Math.round(b.boundingClientRect.top / 24) || a.boundingClientRect.left - b.boundingClientRect.left);
        lote.forEach((e, i) => {
          const el = e.target as HTMLElement;
          el.dataset.tjPaso = String(Math.min(i, 8));
          el.dataset.tjAp = "1";
          io.unobserve(el);
        });
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

    const marcar = (el: HTMLElement, nivel: 1 | 2) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.9) {
        el.dataset.tjAp = "ya";
        return;
      }
      el.dataset.tjAp = "0";
      el.dataset.tjNivel = String(nivel);
      if (el.matches(".tj-cristal") || el.querySelector(".tj-cristal")) el.dataset.tjSolo = "mueve";
      else if (el.matches(".tj-lamina-marco, figure") || el.querySelector(".tj-lamina-marco")) el.dataset.tjTipo = "lamina";
      io.observe(el);
    };

    const recorrer = () => {
      for (const s of main.querySelectorAll("section")) {
        if (s.id === "top" || s.classList.contains("tj-cabecera") || s.parentElement?.closest("section") || s.closest(".demo-window")) continue;
        const raiz = s.querySelector(":scope > .tj-container") ?? s;
        const bloques = [...raiz.children].filter(valido);
        bloques.forEach((b) => {
          marcar(b, 1);
          const contenedores = [...(b.matches(LISTAS) ? [b] : []), ...b.querySelectorAll<HTMLElement>(LISTAS)].filter(
            (c) => c === b || !c.parentElement?.closest(LISTAS) || !b.contains(c.parentElement.closest(LISTAS)),
          );
          for (const c of contenedores) {
            const hijas = [...c.children].filter(valido);
            if (hijas.length < 3 || hijas.length > 40) continue;
            hijas.forEach((h) => marcar(h, 2));
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
