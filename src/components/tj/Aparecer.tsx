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
 * - Lo que lleva cristal solo se desplaza: una opacidad le quitaría el
 *   esmerilado mientras dura.
 */
const LISTAS = "ul, ol, dl, [data-orden], .grid";

export function Aparecer() {
  const pathname = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.getElementById("main-content");
    if (!main || typeof IntersectionObserver === "undefined") return;
    /* En una sola columna las piezas de una lista no asoman a la vez, que es
       para lo que existe el escalonado: cada una entraba sola, y al deslizar
       el glosario había seis o diez transiciones en curso. Medido en móvil
       (CPU ×4, gráfica real, 6 pasadas por lado): fotogramas de más de 33 ms
       del 3,5–9,9 % al 0,9–3,1 %. Por debajo de 768 px llegan con su bloque. */
    const conPiezas = matchMedia("(min-width: 768px)").matches;
    document.documentElement.classList.add("tj-mov");
    // Lo que depende de hidratar solo entra si hidrata pronto: tarde sería un parpadeo.
    if (performance.now() < 1500) document.documentElement.classList.add("tj-mov-pronto");

    // El escalonado se reparte entre HERMANAS que asoman a la vez, en orden
    // de lectura (fila y luego columna). Contado sobre todo el lote, una
    // cabecera de sección heredaba el retardo de piezas de otra sección que
    // entraban en el mismo fotograma: medido, 280 ms de espera muerta.
    const io = new IntersectionObserver(
      (entradas) => {
        const grupos = new Map<Element | null, IntersectionObserverEntry[]>();
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const g = grupos.get(e.target.parentElement) ?? [];
          g.push(e);
          grupos.set(e.target.parentElement, g);
        }
        for (const lote of grupos.values()) {
          lote
            .sort((a, b) => Math.round(a.boundingClientRect.top / 24) - Math.round(b.boundingClientRect.top / 24) || a.boundingClientRect.left - b.boundingClientRect.left)
            .forEach((e, i) => {
              const el = e.target as HTMLElement;
              el.dataset.tjPaso = String(Math.min(i, 6));
              el.dataset.tjAp = "1";
              io.unobserve(el);
            });
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

    const marcar = (el: HTMLElement, nivel: 1 | 2) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.9) {
        el.dataset.tjAp = "ya";
        return;
      }
      el.dataset.tjAp = "0";
      el.dataset.tjNivel = String(nivel);
      // La lámina antes que el cristal: el único cristal que lleva dentro es
      // la lupa, que está oculta hasta pasar el puntero.
      if (el.matches(".tj-lamina-marco, figure") || el.querySelector(".tj-lamina-marco")) el.dataset.tjTipo = "lamina";
      else if (el.matches(".tj-cristal") || el.querySelector(".tj-cristal")) el.dataset.tjSolo = "mueve";
      io.observe(el);
    };

    // Dentro de algo que recorta, el desplazamiento previo puede sacar la
    // pieza entera del recorte: el observador la ve con intersección cero
    // y no aparece nunca. Esas piezas entran con su bloque.
    const recortada = (el: HTMLElement, bloque: HTMLElement) => {
      for (let p = el.parentElement; p && p !== bloque.parentElement; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (cs.overflowX !== "visible" || cs.overflowY !== "visible") return true;
      }
      return false;
    };

    // Los gráficos marcados con `data-dibuja` tienen sus animaciones en pausa
    // hasta que se ven de verdad: dibujados a la carga, bajo el pliegue, nadie
    // los veía dibujarse.
    const ioDib = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          if (e.intersectionRatio < 0.35 && e.intersectionRect.height < innerHeight * 0.3) continue;
          (e.target as HTMLElement).dataset.tjDib = "1";
          ioDib.unobserve(e.target);
        }
      },
      { threshold: [0, 0.35] },
    );
    const recorrer = () => {
      for (const d of main.querySelectorAll<HTMLElement>('[data-dibuja]:not([data-tj-dib="1"])')) {
        if (d.closest(".demo-window")) continue;
        d.dataset.tjDib = "0";
        ioDib.observe(d);
      }
      for (const s of main.querySelectorAll("section")) {
        if (s.id === "top" || s.classList.contains("tj-cabecera") || s.parentElement?.closest("section") || s.closest(".demo-window")) continue;
        const raiz = s.querySelector(":scope > .tj-container") ?? s;
        const bloques = [...raiz.children].filter(valido);
        bloques.forEach((b) => {
          marcar(b, 1);
          if (!conPiezas) return;
          const contenedores = [...(b.matches(LISTAS) ? [b] : []), ...b.querySelectorAll<HTMLElement>(LISTAS)].filter(
            (c) => c === b || !c.parentElement?.closest(LISTAS) || !b.contains(c.parentElement.closest(LISTAS)),
          );
          for (const c of contenedores) {
            const hijas = [...c.children].filter(valido);
            if (hijas.length < 3 || hijas.length > 40) continue;
            hijas.forEach((h) => {
              if (recortada(h, b)) h.dataset.tjAp = "ya";
              else marcar(h, 2);
            });
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
      ioDib.disconnect();
      cancelAnimationFrame(pendiente);
    };
  }, [pathname]);

  return null;
}
