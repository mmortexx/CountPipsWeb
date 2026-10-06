"use client";

import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Nombre, en este teclado, de la tecla que abre la paleta de comandos: `⌘` en
 * Apple y `Ctrl` en el resto (el atajo escucha `metaKey || ctrlKey`). CountPips
 * es una app de Windows, así que `⌘` fijo enseñaba un atajo que no existe.
 *
 * La plataforma solo se conoce en el navegador y las páginas se sirven
 * compiladas: escribir el valor real en el primer render daría HTML distinto al
 * hidratar (error #418 de React). Por eso el servidor y el primer render del
 * cliente dicen `Ctrl` y solo tras hidratar se cambia a `⌘` en Apple.
 *
 * Lee `userAgentData.platform` y, de respaldo, `navigator.platform` (Firefox y
 * Safari aún no traen la primera).
 */
export function useTeclaMando(): string {
  const hidratado = useHydrated();
  if (!hidratado) return "Ctrl";
  return esApple() ? "⌘" : "Ctrl";
}

function esApple(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const plataforma = nav.userAgentData?.platform ?? nav.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(plataforma);
}
