"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { rutaDeRouter } from "@/lib/asset";

/**
 * TransicionPagina — el paso de una página a otra, animado.
 *
 * ── Qué problema resuelve ─────────────────────────────────────────────
 * Sin esto, cambiar de página es un corte seco: la que estaba
 * desaparece y la nueva aparece ya montada, en el mismo fotograma. Es
 * de las pocas cosas que se notan sin saber mirar, y es lo que separa
 * un sitio de varias páginas de algo que se siente como una aplicación.
 *
 * ── Por qué se hace a mano ────────────────────────────────────────────
 * El camino corto sería `<ViewTransition>` de React, pero ese componente
 * sólo existe en las compilaciones experimentales: en la 19.2 estable
 * que usa el proyecto no está ni en los tipos ni en el runtime
 * (comprobado). Y la API del navegador —`document.startViewTransition`—
 * sí está, así que se usa directamente.
 *
 * ── Cómo ──────────────────────────────────────────────────────────────
 * Un oyente de clics en fase de CAPTURA, en el documento. Cuando el
 * clic es una navegación interna corriente, se cancela y se rehace
 * dentro de una transición. El navegador toma una instantánea de lo que
 * hay, deja que React monte la página nueva, toma otra, y anima entre
 * las dos según lo que diga el CSS.
 *
 * ── Lo que NO intercepta, y por qué importa ───────────────────────────
 * Un interceptor de clics mal hecho rompe la navegación entera, que es
 * bastante peor que no tener transición. Se deja pasar sin tocar:
 *
 *  · Cualquier clic que no sea el botón principal, o con Ctrl / Cmd /
 *    Shift / Alt — son «abrir en pestaña nueva», «en ventana nueva» y
 *    «descargar», y prevenirlos rompe expectativas del sistema.
 *  · `target` distinto del propio marco, y enlaces con `download`.
 *  · Otro origen, otro protocolo (`mailto:`, `tel:`), o `[data-sin-transicion]`.
 *  · Los saltos a un ancla de la MISMA página: ahí no hay página nueva
 *    que animar, y hay un módulo que ya se ocupa de ese movimiento
 *    (`src/lib/scroll.ts`).
 *  · Un clic que otro manejador ya haya cancelado.
 *
 * ── El seguro ─────────────────────────────────────────────────────────
 * Mientras una transición está en curso, el navegador congela la
 * pantalla sobre una instantánea. Si la navegación no llegara a
 * completarse, esa instantánea se quedaría fija y la web parecería
 * colgada — sin errores en consola y sin forma de saber por qué.
 *
 * Por eso el callback resuelve SIEMPRE: o porque la ruta cambió, o
 * porque se agotó el plazo. Un plazo agotado sólo cuesta una transición
 * fea; no resolver cuesta la página entera.
 *
 * No pinta nada: es sólo efecto.
 */

/** Plazo máximo que se espera a que la ruta cambie, en milisegundos. */
const PLAZO_MS = 600;

export function TransicionPagina() {
  const router = useRouter();
  const pathname = usePathname();
  /* El resolutor de la navegación en curso. Vive en un ref porque lo
     crea el manejador de clic y lo llama el efecto de abajo: dos
     ejecuciones distintas que tienen que verse. */
  const pendiente = useRef<(() => void) | null>(null);

  // La ruta ya ha cambiado: el DOM nuevo está montado y el navegador
  // puede tomar la segunda instantánea.
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
      // Misma página, distinto ancla: no hay nada que transicionar.
      if (destino.pathname === location.pathname && destino.hash) return;
      if (destino.href === location.href) return;

      e.preventDefault();

      /* SIN `rutaDeRouter` aquí, este interceptor rompía la navegación
         ENTERA del sitio publicado, que es justo lo que el comentario de
         arriba se compromete a no hacer.

         `destino.pathname` sale de resolver el `.href` del enlace contra
         la barra de direcciones, así que en GitHub Pages vale
         `/CountPipsWeb/demo/` — CON el prefijo. Pero `router.push()` lo
         añade por su cuenta, así que se publicaba
         `/CountPipsWeb/CountPipsWeb/demo` y caía en el 404. En local no se
         veía porque ahí el prefijo es vacío y quitarlo no cambia nada:
         solo fallaba lo que estaba publicado. */
      const ruta = rutaDeRouter(destino.pathname) + destino.search + destino.hash;
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
            /* El seguro se arma ANTES de navegar: si `router.push`
               fallara de forma síncrona, el plazo sigue corriendo y la
               pantalla se descongela igual. */
            const seguro = setTimeout(acabar, PLAZO_MS);
            pendiente.current = acabar;
            router.push(ruta);
          }),
      );
    };

    // En captura: así se llega antes que el manejador de `<Link>`, que
    // es quien normalmente se queda el clic.
    doc.addEventListener("click", alPulsar, { capture: true });
    return () => doc.removeEventListener("click", alPulsar, { capture: true });
  }, [router]);

  return null;
}
