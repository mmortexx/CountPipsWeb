"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

/**
 * GlossaryLauncher — el enlace al glosario, sin el glosario detrás.
 *
 * ── El problema ───────────────────────────────────────────────────────
 * El pie de página lleva un enlace «Glosario», y el pie sale en las nueve
 * rutas del sitio. Como ese enlace era el disparador del propio
 * `GlossaryModal`, montarlo obligaba a cargar el diálogo entero: el
 * listado completo de términos con sus definiciones en dos idiomas, el
 * buscador, los filtros por categoría, la navegación por teclado y el
 * historial de términos vistos. Unos 80 KB que viajaban a todas partes
 * para pintar una palabra subrayada.
 *
 * ── La separación ─────────────────────────────────────────────────────
 * Un enlace no necesita saber qué hay al otro lado hasta que lo pulsan.
 * Este componente pinta el disparador —y solo el disparador— y trae el
 * diálogo con `import()` en el mismo gesto del clic. Es el mismo criterio
 * que sigue `OverlayHost` con la ayuda de atajos.
 *
 * ── Por qué el disparador queda FUERA del diálogo ──────────────────────
 * `GlossaryModal` sabe pintar su propio disparador, pero eso aquí no
 * sirve: el disparador tiene que existir ANTES de que el diálogo se haya
 * descargado, que es justo lo contrario. Así que se pinta aquí y el
 * diálogo se monta en modo controlado con `trigger={false}`.
 *
 * El foco se devuelve a mano al cerrar. Radix lo restituye solo cuando él
 * mismo posee el disparador; como aquí no es el caso, hay que hacerlo, o
 * quien navegue con teclado cerraría el glosario y aparecería al
 * principio del documento en vez de en el enlace que acababa de pulsar.
 */

const GlossaryModal = dynamic(
  () => import("@/components/tj/GlossaryModal").then((m) => m.GlossaryModal),
  { ssr: false }
);

export function GlossaryLauncher({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const onActivate = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    /* El disparador real es el hijo (un <button> con su foco y su rol);
       este envoltorio solo recoge el clic que burbujea desde él. */
    setAnchor(e.currentTarget.querySelector("button"));
    setMounted(true);
    setOpen(true);
  }, []);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) anchor?.focus();
    },
    [anchor]
  );

  return (
    <>
      {/* `display: contents` — el envoltorio recoge el clic sin meter una
          caja de más en el flujo, así que la maquetación del pie no
          cambia ni un píxel respecto a tener el botón suelto. */}
      <span className="contents" onClick={onActivate}>
        {children}
      </span>
      {mounted && (
        <GlossaryModal trigger={false} open={open} onOpenChange={onOpenChange} />
      )}
    </>
  );
}
