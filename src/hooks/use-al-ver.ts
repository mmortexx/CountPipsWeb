"use client";

import { useCallback } from "react";

/**
 * Para las animaciones de una pieza (y de lo que lleva dentro) hasta que
 * se ve. Usa el mismo interruptor que los gráficos del resto del sitio
 * (`data-tj-dib`, ver `Aparecer`), que deja fuera la demo a propósito: su
 * ventana tiene desplazamiento propio y cada página se monta entera al
 * cambiar de pestaña. Una vez vista, la pieza no vuelve a pararse.
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
