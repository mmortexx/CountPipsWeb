"use client";

import { useCallback } from "react";

/**
 * Pausa las animaciones de una pieza y su contenido hasta que se ve. Usa el
 * interruptor de los gráficos del sitio (`data-tj-dib`, ver `Aparecer`), que
 * deja fuera la demo a propósito: su ventana tiene scroll propio y cada página
 * se monta entera al cambiar de pestaña. Una vez vista, no vuelve a pararse.
 */
export function useAlVer<T extends Element>() {
  return useCallback((el: T | null) => {
    if (!el) return;
    el.setAttribute("data-tj-dib", "0");
    const io = new IntersectionObserver((entradas) => {
      if (!entradas.some((e) => e.isIntersecting)) return;
      el.setAttribute("data-tj-dib", "1");
      io.disconnect();
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
}
