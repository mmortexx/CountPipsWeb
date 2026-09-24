"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * El subrayado de las pestañas (`.tj-pestanas`) viaja de la que deja de estar
 * seleccionada a la nueva, en vez de apagarse en una y encenderse en otra.
 *
 * Sin JavaScript o con movimiento reducido no se marca nada y queda el
 * subrayado propio de cada pestaña. Con él, la lista lleva `data-desliza` y
 * un solo trazo (`::after`) que se coloca con variables; al cambiar de
 * pestaña se anima, al cambiar de tamaño se recoloca sin viaje.
 */
export function SubrayadoPestanas() {
  const pathname = usePathname();
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.getElementById("main-content");
    if (!main) return;

    const coloca = (lista: HTMLElement, viaja: boolean) => {
      const sel = lista.querySelector<HTMLElement>(':scope > [role="tab"][aria-selected="true"]');
      if (!sel) return;
      lista.dataset.desliza = viaja && lista.dataset.desliza ? "viaja" : "quieto";
      lista.style.setProperty("--tab-x", `${sel.offsetLeft}px`);
      lista.style.setProperty("--tab-y", `${sel.offsetTop + sel.offsetHeight}px`);
      lista.style.setProperty("--tab-w", String(sel.offsetWidth));
    };

    const ro = new ResizeObserver((entradas) => {
      for (const e of entradas) coloca(e.target as HTMLElement, false);
    });
    const vistas = new WeakSet<HTMLElement>();
    const recorrer = () => {
      for (const lista of main.querySelectorAll<HTMLElement>(".tj-pestanas")) {
        if (vistas.has(lista)) continue;
        vistas.add(lista);
        coloca(lista, false);
        ro.observe(lista);
      }
    };
    recorrer();

    const mo = new MutationObserver((cambios) => {
      let nuevas = false;
      for (const c of cambios) {
        if (c.type === "childList") nuevas = true;
        else if (c.target instanceof HTMLElement && c.target.getAttribute("aria-selected") === "true") {
          const lista = c.target.parentElement;
          if (lista?.classList.contains("tj-pestanas")) coloca(lista, true);
        }
      }
      if (nuevas) recorrer();
    });
    mo.observe(main, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-selected"] });
    return () => {
      mo.disconnect();
      ro.disconnect();
    };
  }, [pathname]);
  return null;
}
