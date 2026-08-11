"use client";

import { useEffect, useRef } from "react";

/**
 * Ticker — infinite horizontal marquee band showing instrument symbols
 * with their P&L %. Duplicated for a seamless loop. Colorized pos/neg.
 * Honors `prefers-reduced-motion` (static fallback — no scroll).
 *
 * Institutional polish (R2-c):
 *  - Banda de cristal con filete `border-y` atado a `--divider` arriba
 *    top + bottom edges — reads as a precision-machined ticker tape
 *    floating over the dark page background.
 *  - Slow, dignified base speed: full track (two rows) in 50 s — about
 *    35 px/s on a typical viewport. Never feels frantic.
 *  - Scroll-velocity responsive multiplier (1× → 2.4×) wrapped in
 *    `useSpring` so the speed-up eases in/out smoothly instead of
 *    snapping frame-to-frame as raw scroll velocity fluctuates.
 *  - Symbol in `text-secondary` (theme-adaptive, was raw gray-400);
 *    P&L% in `text-pnl-pos`/`text-pnl-neg` with `tnum` tabular-nums +
 *    slashed zeros so the digits never jitter as the marquee scrolls.
 *  - Dot separators in `bg-[rgb(var(--txt-tertiary)/0.5)]` — uses the
 *    design-system tertiary text token (gray-400 on dark, gray-500 on
 *    light) at 50% opacity so the dots read as a soft machined-rivet
 *    rather than a raw white speck (was `bg-white/15`). The token tie
 *    means the dots shift hue correctly if the theme flips to light.
 *  - Soft black-tinted gradient fades on both left + right edges so
 *    items ease in/out without a hard clip. Floats over the liquid-glass
 *    band's translucent dark surface.
 *  - `prefers-reduced-motion`: the animation loop is skipped entirely;
 *    the track stays at x=0 so the first Row remains statically visible.
 */

interface TickerItem {
  sym: string;
  chg: number;
}

const TICKER_ITEMS: TickerItem[] = [
  { sym: "ES35", chg: 0.84 },
  { sym: "NQ", chg: 1.12 },
  { sym: "SPX", chg: -0.31 },
  { sym: "EURUSD", chg: 0.22 },
  { sym: "BTC", chg: -2.04 },
  { sym: "DAX", chg: 0.57 },
  { sym: "GOLD", chg: 0.41 },
  { sym: "CL", chg: -1.18 },
];

function Row() {
  return (
    /* El relleno a la derecha es la costura del bucle, y tiene que medir
       lo mismo que el hueco entre símbolos para que no se note. Ver el
       comentario de `.tj-cinta` en globals.css: si esa separación se
       pusiera con `gap` en la pista, el desplazamiento del 50 % dejaría
       medio hueco de menos en cada vuelta. */
    <div
      className="flex items-center shrink-0 gap-8 sm:gap-12 pe-8 sm:pe-12"
      aria-hidden="true"
    >
      {/* T2c — `fontSize` 12.5 → 13.5 px (≥13 legible a escala móvil);
          `gap` entre símbolos 7/11 → 8/12 para que cada ticker respire. */}
      {TICKER_ITEMS.map((it) => {
        const pos = it.chg >= 0;
        return (
          <span key={it.sym} className="tnum flex items-center" style={{ fontSize: 13.5, color: "var(--ink-2)" }}>
            {it.sym}{" "}
            <span
              className="tnum"
              style={{ color: pos ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))", marginLeft: 6 }}
            >
              {pos ? "+" : "−"}
              {Math.abs(it.chg).toFixed(2)}%
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Multiplicador máximo de velocidad cuando se hace scroll a fondo. */
const FACTOR_MAX = 2.4;
/** Velocidad de scroll (px/s) a la que se alcanza ese máximo. */
const VELOCIDAD_TOPE = 4000;

export function Ticker() {
  const pistaRef = useRef<HTMLDivElement>(null);

  /* ── LA CINTA CORRE SOLA; ESTO SÓLO LA ACELERA ────────────────────
     El desplazamiento es una animación CSS (`.tj-cinta`), así que se
     mueve sin JavaScript y sin ocupar el hilo principal. Lo único que
     queda aquí es el detalle que no se puede declarar: que la cinta se
     acelere mientras el visitante hace scroll.

     SE MODULA `playbackRate` Y NO `animation-duration`. Cambiar la
     duración a mitad de animación conserva el TIEMPO transcurrido pero
     no el progreso —el progreso es tiempo partido por duración—, así
     que cada ajuste daría un salto de fase visible. `playbackRate` de la
     API de animaciones del navegador cambia la velocidad conservando el
     punto exacto en el que va, que es justo lo que hace falta.

     Antes esto eran cinco hooks de framer-motion (`useScroll`,
     `useVelocity`, `useTransform`, `useSpring`, `useAnimationFrame`) más
     un `ResizeObserver` para medir la pista, y era lo único por lo que
     la portada descargaba la biblioteca: 36 KB comprimidos para
     acelerar una cinta.

     El suavizado es una media exponencial: sin ella, la velocidad
     instantánea del scroll fluctúa fotograma a fotograma y la cinta
     tiembla — que es exactamente el motivo por el que la versión
     anterior envolvía el factor en un muelle. */
  useEffect(() => {
    const pista = pistaRef.current;
    if (!pista) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ultimaY = window.scrollY;
    let ultimoT = performance.now();
    let factor = 1;
    let objetivo = 1;
    let pendiente = 0;
    let vivo = true;

    const paso = () => {
      if (!vivo) return;
      const ahora = performance.now();
      const dt = Math.max(1, ahora - ultimoT);
      ultimoT = ahora;

      const y = window.scrollY;
      const velocidad = (Math.abs(y - ultimaY) / dt) * 1000;
      ultimaY = y;
      objetivo = 1 + (Math.min(velocidad, VELOCIDAD_TOPE) / VELOCIDAD_TOPE) * (FACTOR_MAX - 1);

      // Media exponencial: se acerca al objetivo un 12 % por fotograma.
      factor += (objetivo - factor) * 0.12;
      for (const a of pista.getAnimations()) a.playbackRate = factor;

      // Se para cuando la cinta ya va a velocidad de crucero: seguir
      // llamando a `requestAnimationFrame` con la página quieta es
      // trabajo por hora en lugar de por resultado.
      if (Math.abs(factor - 1) < 0.005 && objetivo === 1) {
        factor = 1;
        for (const a of pista.getAnimations()) a.playbackRate = 1;
        pendiente = 0;
        return;
      }
      pendiente = requestAnimationFrame(paso);
    };

    const alDesplazar = () => {
      ultimaY = window.scrollY;
      if (!pendiente) {
        ultimoT = performance.now();
        pendiente = requestAnimationFrame(paso);
      }
    };
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => {
      vivo = false;
      window.removeEventListener("scroll", alDesplazar);
      if (pendiente) cancelAnimationFrame(pendiente);
    };
  }, []);

  return (
    <div
      role="marquee"
      aria-label="Market ticker"
      /* T2c — `py-3` (12 px) → `py-4` (16 px): la cinta tenía solo 12 px
         de respiro vertical y el VLM la leía como banda pegada al borde.
         16 px la separa visualmente de las secciones vecinas sin
         engordarla. Resto sin cambios: `border-y`, `liquid-glass`,
         `glass-band` (solo la luz superior), `overflow-hidden`,
         `select-none`. */
      /* SE QUEDA EN `liquid-glass`, y no es un descuido. Esta cinta es una
         BANDA a ancho completo, no una tarjeta: el papel lleva grano y
         sombra proyectada, y una hoja que cruza la pantalla de lado a lado
         no se sostiene sobre nada — se leería como un error, no como
         material. Además `glass-band` cuelga del selector
         `.liquid-glass.glass-band`, así que cambiar la clase apagaría de
         paso la luz del canto superior, que es lo que separa la banda del
         contenido. Mismo caso que el pie. */
      className="tj-cinta-caja relative border-y border-[rgb(var(--divider)/0.14)] py-4 liquid-glass glass-band overflow-hidden select-none"
    >
      {/* Left edge gradient fade — R27-1b: switched from hardcoded
          `rgba(0, 0, 0, ...)` to `color-mix(in srgb, var(--bg) ...,
          transparent)` so the fade matches the band's surface tone in
          BOTH themes. The band's `liquid-glass` material is
          `rgba(0,0,0,0.92)` in dark / `rgba(255,255,255,0.94)` in
          light — so a black fade was correct in dark but read as dark
          smudges at the edges of a white band in light theme. `var(--bg)`
          tracks `#0B0C0E` (dark) / `#f3f2ec` (light), close enough to
          the band's near-opaque surface that the fade reads as "items
          dissolving into the band" instead of "dark patches at the
          edges". The 92 % → 50 % → transparent ramp is preserved.
          R21-3a — narrowed on mobile (w-14 ≈ 56px) so less of the visible
          375px viewport is faded out; widens back to w-20 on sm and w-32
          on md+ where there's plenty of width to spare for the fade. */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 w-14 sm:w-20 md:w-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, color-mix(in srgb, var(--bg) 92%, transparent) 0%, color-mix(in srgb, var(--bg) 50%, transparent) 55%, transparent 100%)",
        }}
      />
      {/* Right edge gradient fade — mirror of the left. */}
      <div
        className="absolute right-0 top-0 bottom-0 z-10 w-14 sm:w-20 md:w-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to left, color-mix(in srgb, var(--bg) 92%, transparent) 0%, color-mix(in srgb, var(--bg) 50%, transparent) 55%, transparent 100%)",
        }}
      />

      {/* La pista lleva dos filas idénticas: al desplazarse la mitad
          exacta del recorrido, el fotograma final es indistinguible del
          inicial y el bucle no se ve. La separación entre las dos no va
          aquí con `gap` sino como relleno de cada fila — el porqué está
          en `<Row />` y en `.tj-cinta` (globals.css).

          `will-change: transform` lo declara la clase: sin él, algunos
          navegadores vuelven a rasterizar la pista en cada fotograma y
          las cifras tabulares tiemblan por debajo del píxel. */}
      <div ref={pistaRef} className="tj-cinta flex w-max">
        <Row />
        <Row />
      </div>
    </div>
  );
}
