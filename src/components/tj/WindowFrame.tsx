"use client";

import { type ReactNode } from "react";
import { asset } from "@/lib/asset";

/**
 * WindowFrame — mockup de ventana WinUI que envuelve una captura de la
 * app nativa para que se lea ENTERA y nítida (object-contain) dentro de
 * un marco elegante, sin recortes.
 *
 * Composición:
 *  - Barra de título (32 px) al estilo Windows 11: caption en mono pegada
 *    a la izquierda y los tres botones de ventana (minimizar, maximizar,
 *    cerrar) a la derecha, decorativos. La barra usa `--surface-2`
 *    (theme-aware) para leerse bien en oscuro Y claro.
 *  - Cuerpo: fondo `--surface` (theme-aware) sobre el que la captura se
 *    muestra con `object-contain` (letterbox), de modo que la pantalla
 *    completa de la app es visible sin recorte.
 *  - Marco hairline `rgb(var(--divider)/0.13)`, inset highlight superior,
 *    sombra suave. `rounded-xl` + `overflow-hidden`.
 *
 * El componente NO impone aspect ratio fijo: el cuerpo se adapta al
 * aspect natural de la captura. El valor por defecto tiene que coincidir
 * EXACTAMENTE con el de las capturas servidas para que la imagen llene el
 * cuerpo del marco de borde a borde, sin franjas. Sobreescribible con
 * `bodyClassName` para otros usos (p. ej. un marco con contenido que no
 * es una captura).
 *
 * ── POR QUÉ ES 1500×788 Y NO 1500×856 ─────────────────────────────────
 * 856 es el alto del ORIGINAL, y aquí ponía eso —y el comentario juraba
 * que era «la resolución real de las capturas»—. Dejó de serlo cuando
 * `scripts/capturas.py` empezó a recortar el cromo de ventana en el
 * fichero: la barra de título con el nombre viejo (46 px) y la de estado
 * con el sello de desarrollo (22 px). 856 − 46 − 22 = 788.
 *
 * El resultado era una imagen con 68 px de franja repartidos arriba y
 * abajo dentro de un marco que dice enseñar la app «entera y nítida», y
 * que además desalineaba el marco con la columna de texto de al lado en
 * `OverviewApp`. Un comentario que afirma un número deja de ser
 * documentación en cuanto el número cambia en otro fichero: por eso ahora
 * lo mide `tests/capturas.test.ts` leyendo la cabecera de los propios
 * ficheros servidos, y no hay que fiarse de esta frase.
 *
 * Props:
 *  - `caption`: texto mono centrado en la barra de título (p.ej. "Resumen
 *    — CountPips"). Si se omite, se usa el nombre de la app.
 *  - `children`: el contenido del cuerpo (normalmente un <Image> o
 *    <FeatureImage fit="contain">).
 *  - `bodyClassName`: clases extra para el cuerpo (p.ej. aspect ratio).
 *  - `className`: clases extra para el contenedor exterior.
 *  - `live`: muestra un punto verde "EN VIVO" a la derecha de la barra.
 */
/**
 * La proporción de las capturas servidas en `public/img/app-*.webp`.
 *
 * Se exporta para que `tests/capturas.test.ts` la compare contra la
 * cabecera real de los ficheros: si `scripts/capturas.py` vuelve a
 * cambiar el recorte, la prueba se pone roja en vez de aparecer una
 * franja en la página que sólo se ve mirándola.
 */
export const ASPECTO_CAPTURA = "aspect-[1500/788]";

interface WindowFrameProps {
  caption?: string;
  children: ReactNode;
  bodyClassName?: string;
  className?: string;
  live?: boolean;
}

export function WindowFrame({
  caption = "CountPips",
  children,
  bodyClassName = "",
  className = "",
  live = false,
}: WindowFrameProps) {
  return (
    <div
      data-tj-window-frame=""
      className={`relative rounded-xl overflow-hidden border ${className}`}
      style={{
        borderColor: "rgb(var(--divider) / 0.13)",
        background: "color-mix(in srgb, var(--surface) 70%, transparent)",
        // Two-layer frame shadow: a tight 1px top inset highlight (the
        // machined key-light edge that catches where light hits a real
        // window frame) + a soft ambient drop shadow underneath. The drop
        // shadow stays subtle in dark theme (where the canvas is already
        // near-black) and is overridden stronger in light theme via the
        // [data-tj-window-frame] rule in globals.css so a near-black
        // 0.35-alpha shadow doesn't vanish against the bright canvas.
        boxShadow:
          "inset 0 1px 0 rgb(var(--divider) / 0.14), 0 8px 28px -12px rgb(0 0 0 / 0.35)",
      }}
    >
      {/* Title bar — surface-2 fill at 80% with a 1px bottom hairline +
          a subtle 1px top inset highlight that reads as the machined top
          edge of a real WinUI/Acrylic title bar (matches the .liquid-glass
          ::after inset highlight convention used across the site). */}
      <div
        className="flex items-stretch h-8 select-none border-b relative"
        style={{
          background: "color-mix(in srgb, var(--surface-2) 80%, transparent)",
          // 0.12 (up from 0.08) — a clearer hairline between the title
          // bar and the screenshot body in both themes. At 0.08 the rule
          // was nearly invisible in light theme (where --divider is
          // black at low alpha on a near-white surface-2), so the title
          // bar read as floating rather than framing the body.
          borderColor: "rgb(var(--divider) / 0.12)",
          boxShadow: "inset 0 1px 0 rgb(var(--divider) / 0.10)",
        }}
      >
        {/* Título a la IZQUIERDA — CountPips es una app nativa de
            Windows, y en Windows el título va pegado al borde izquierdo,
            no centrado. Antes esta barra llevaba los tres semáforos de
            macOS y una caption centrada: vendía la app como si fuera de
            Mac, justo lo contrario de lo que promete la página. */}
        <span
          className="tnum flex-1 min-w-0 self-center pl-3 text-[11px] truncate"
          style={{
            // `--txt-tertiary` y no `--ink-3`. Medido: el título salía a
            // 4,17:1 contra la barra, por debajo del 4,5:1 que pide WCAG AA
            // para texto de 11 px. El motivo es que `--ink-3` está calibrado
            // contra el fondo de la página, y esta barra es una superficie
            // MÁS CLARA (--surface-2): el mismo gris que allí sobra, aquí se
            // queda corto. `--txt-tertiary` es justo el token pensado para
            // texto pequeño y apagado que aun así tiene que leerse sobre las
            // capas de cristal — sube a 6,3:1 sin dejar de ser una leyenda.
            color: "rgb(var(--txt-tertiary))",
            letterSpacing: "0.02em",
          }}
        >
          {caption}
        </span>

        {/* Indicador en vivo (opcional), antes de los botones. */}
        {live && (
          <span
            className="inline-flex items-center gap-1 px-3 tnum text-[10px] font-semibold"
            style={{ color: "rgb(var(--pnl-pos))", letterSpacing: "0.1em" }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "rgb(var(--pnl-pos))" }}
            />
            LIVE
          </span>
        )}

        {/* Botones de ventana de Windows 11 — minimizar, maximizar, cerrar,
            a la derecha y a alto completo, con el mismo lenguaje que el
            chrome real de la demo (WindowChrome.tsx). Son decorativos: van
            como <span aria-hidden>, no como <button>, porque este marco
            envuelve una captura estática y unos botones que no hacen nada
            no deben aparecer en el árbol de accesibilidad ni recibir foco. */}
        <span className="flex items-stretch shrink-0" aria-hidden="true">
          <span
            className="w-[34px] flex items-center justify-center"
            style={{ color: "var(--ink-3)" }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="0.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </span>
          <span
            className="w-[34px] flex items-center justify-center"
            style={{ color: "var(--ink-3)" }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </span>
          <span
            className="w-[34px] flex items-center justify-center"
            style={{ color: "var(--ink-3)" }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </span>
        </span>
      </div>
      {/* El cuerpo: aquí vive la captura, entera y nítida. La proporción
          por defecto es la de los ficheros servidos —`ASPECTO_CAPTURA`—,
          para que `object-contain` la ajuste sin dejar franjas. */}
      <div className={`relative w-full ${bodyClassName || ASPECTO_CAPTURA}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * Helper: build a captioned window frame around an image src, ready to
 * drop into a gallery cell. Returns the full WindowFrame + FeatureImage
 * composition so galleries stay declarative.
 */
export function windowShot({
  src,
  alt,
  caption,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  caption?: string;
  sizes?: string;
  priority?: boolean;
}) {
  // Re-exported as a function rather than a component so galleries can
  // wrap it in their own <Reveal>/<motion.figure> without an extra DOM
  // layer. Imported lazily inside the function to avoid a circular dep
  // (FeatureImage imports nothing from here).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { FeatureImage } = require("@/components/tj/FeatureImage");
  return (
    <WindowFrame caption={caption}>
      <FeatureImage
        src={asset(src)}
        alt={alt}
        fit="contain"
        className="absolute inset-0 h-full w-full"
        overlay={0}
        priority={priority}
        sizes={sizes}
      />
    </WindowFrame>
  );
}
