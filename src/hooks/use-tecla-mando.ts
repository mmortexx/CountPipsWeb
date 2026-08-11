"use client";

import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Cómo se llama en ESTE teclado la tecla que abre la paleta de comandos.
 *
 * ── El problema ───────────────────────────────────────────────────────
 * El atajo se escucha con `metaKey || ctrlKey`, así que funciona en los
 * dos sistemas. Pero la etiqueta estaba escrita a mano como `⌘` en todos
 * los sitios donde aparece: el disparador de la barra, la ayuda de
 * atajos, la pista dentro de la demo y el distintivo del botón de
 * registrar operación.
 *
 * `⌘` es la tecla Comando de un Mac. CountPips es una aplicación NATIVA
 * DE WINDOWS —lo dice el rótulo del titular de la portada— y su web
 * enseña a sus visitantes un atajo que en su teclado no existe. No es
 * sólo una instrucción equivocada: es la clase de detalle por la que se
 * nota que una página se hizo mirando otra.
 *
 * ── Por qué no basta con leer `navigator` y ya ─────────────────────────
 * La plataforma sólo se conoce en el navegador, y estas páginas se
 * sirven compiladas. Escribir el valor real durante el primer render
 * daría un texto en el HTML y otro al hidratar: `Minified React error
 * #418`, el mismo que ya costó cerrar en las fechas de la muestra.
 *
 * Así que el valor del servidor —y el del primer render del cliente— es
 * `Ctrl`, y sólo después de hidratar se cambia a `⌘` si el teclado es de
 * Apple. Eso deja SIN NINGÚN CAMBIO al visitante de Windows, que es el
 * público entero de este producto, y hace un único reemplazo silencioso
 * en el Mac de quien viene a mirar.
 *
 * `userAgentData.platform` es lo que hoy recomienda la plataforma;
 * `navigator.platform` sigue de respaldo porque Firefox y Safari aún no
 * traen la primera.
 */
export function useTeclaMando(): string {
  const hidratado = useHydrated();
  if (!hidratado) return "Ctrl";
  return esApple() ? "⌘" : "Ctrl";
}

/** El atajo completo, listo para un `aria-label` o un `title`. */
export function useAtajoPaleta(): string {
  return `${useTeclaMando()}+K`;
}

function esApple(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const plataforma = nav.userAgentData?.platform ?? nav.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(plataforma);
}
