"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { rutaDeRouter } from "@/lib/asset";

/**
 * Anima el paso entre páginas con `document.startViewTransition` (el
 * `<ViewTransition>` de React no existe en la 19.2 estable). Un oyente de clics
 * en fase de captura cancela las navegaciones internas corrientes y las rehace
 * dentro de una transición. No pinta nada.
 *
 * No intercepta, para no romper la navegación: clics que no sean el botón
 * principal o con Ctrl/Cmd/Shift/Alt, `target` ajeno o `download`, otro origen
 * o protocolo, `[data-sin-transicion]`, saltos a un ancla de la misma página
 * (los gestiona `src/lib/scroll.ts`) y clics ya cancelados.
 *
 * Seguro: durante la transición el navegador congela la pantalla, así que el
 * callback resuelve siempre, por cambio de ruta o por `PLAZO_MS`. Un plazo
 * agotado cuesta una transición fea; no resolver cuelga la página.
 */

/** Plazo máximo que se espera a que la ruta cambie, en milisegundos. */
const PLAZO_MS = 600;

export function TransicionPagina() {
  const router = useRouter();
  const pathname = usePathname();
  // Resolutor de la navegación en curso: lo crea el clic y lo llama el efecto.
  const pendiente = useRef<(() => void) | null>(null);

  // Ruta cambiada: el DOM nuevo está montado y se puede tomar la segunda instantánea.
  useEffect(() => {
    pendiente.current?.();
    pendiente.current = null;
  }, [pathname]);

  useEffect(() => {
    const doc = document;
    if (typeof doc.startViewTransition !== "function") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const alPulsar = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const enlace = (e.target as Element | null)?.closest?.("a");
      if (!enlace) return;
      if (enlace.hasAttribute("download")) return;
      if (enlace.dataset.sinTransicion !== undefined) return;
      const target = enlace.getAttribute("target");
      if (target && target !== "_self") return;

      const href = enlace.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let destino: URL;
      try {
        destino = new URL(enlace.href, location.href);
      } catch {
        return;
      }
      if (destino.origin !== location.origin) return;
      if (destino.protocol !== location.protocol) return;
      // Misma página, otro ancla: nada que animar.
      if (destino.pathname === location.pathname && destino.hash) return;
      if (destino.href === location.href) return;

      e.preventDefault();

      // `rutaDeRouter` es imprescindible: `destino.pathname` lleva el prefijo
      // de GitHub Pages (`/CountPipsWeb/...`) y `router.push()` lo añade por su
      // cuenta, con lo que sin quitarlo la ruta se duplicaría y daría 404. En
      // local el prefijo es vacío y no se nota.
      const ruta = rutaDeRouter(destino.pathname) + destino.search + destino.hash;
      const raiz = doc.documentElement;
      raiz.dataset.transicion = "";
      doc.startViewTransition(
        () =>
          new Promise<void>((resolver) => {
            let hecho = false;
            const acabar = () => {
              if (hecho) return;
              hecho = true;
              clearTimeout(seguro);
              resolver();
            };
            // El seguro se arma antes de navegar: si `router.push` fallara, la pantalla se descongela igual.
            const seguro = setTimeout(acabar, PLAZO_MS);
            pendiente.current = acabar;
            router.push(ruta);
          }),
      ).finished.finally(() => delete raiz.dataset.transicion);
    };

    // En captura, para llegar antes que el manejador de `<Link>`.
    doc.addEventListener("click", alPulsar, { capture: true });
    return () => doc.removeEventListener("click", alPulsar, { capture: true });
  }, [router]);

  return null;
}
