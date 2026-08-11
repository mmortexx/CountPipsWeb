"use client";

import Image from "next/image";

interface FeatureImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Overlay gradient opacity (0-1). Set 0 for real screenshots that
   *  must read whole and crisp (galleries). */
  overlay?: number;
  /** Priority loading (for above-the-fold images). */
  priority?: boolean;
  /** Animation delay for reveal. */
  delay?: number;
  /**
   * Object-fit behaviour. `"cover"` (default, legacy) crops the image to
   * fill the frame — fine for abstract/stock art. `"contain"` shows the
   * WHOLE image letterboxed on a theme-aware surface — use for real app
   * screenshots so the visitor reads every pixel of the app.
   */
  fit?: "cover" | "contain";
  /**
   * `sizes` attribute forwarded to next/image. Defaults to a sensible
   * 1/2/3-column responsive hint. Pass a more specific value when the
   * image lives in a different grid (e.g. a 4-up gallery should pass
   * `(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw`).
   */
  sizes?: string;
  /**
   * Override the contain-mode surface background. By default contain mode
   * paints a theme-aware surface fill (`var(--surface)` at 92% alpha) plus
   * a faint radial vignette so the screenshot reads as centered on a soft
   * halo. In always-dark contexts (e.g. the live demo window, which is
   * intentionally always-dark to match the dark-themed app screenshots),
   * pass a flat dark color like `"#0b0c0d"` to override the theme-aware
   * fill — otherwise the letterbox area turns near-white when the user is
   * in light theme, clashing with the surrounding dark panel.
   */
  surfaceBg?: string;
}

/**
 * Feature image with glass overlay and reveal animation.
 * Uses next/image with unoptimized for static export compatibility.
 * The overlay ensures images blend with the dark glass theme.
 */
export function FeatureImage({
  src,
  alt,
  className = "",
  overlay = 0.4,
  priority = false,
  delay = 0,
  fit = "cover",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  surfaceBg,
}: FeatureImageProps) {
  const isContain = fit === "contain";
  /* LA ENTRADA YA NO NECESITA NI BIBLIOTECA NI HOOK.
     Aquí había un `motion.div` con `initial`/`whileInView` y tres
     variantes calculadas en JavaScript, más un `useReducedMotion()` para
     anularlas. Todo eso lo hace ahora una regla:

       · `data-entra="lamina"` — el zoom de salida de 1,05 a 1 del modo
         `cover`, que es el gesto cinematográfico que tenía;
       · `data-entra` a secas — el modo `contain`, que NO lleva zoom por
         el motivo escrito abajo: un 5 % de escala sobre una captura
         apaisada le recorta el canto durante la entrada;
       · el retardo, traducido a uno de los cinco escalones.

     Y el respeto a «reducir movimiento» ya no se calcula: el bloque
     `@media (prefers-reduced-motion: reduce)` de globals.css anula
     TODOS los `[data-entra]` de golpe, así que no puede quedarse una
     variante sin cubrir — que es justo lo que este hook tenía que
     vigilar a mano. */
  const escalon = delay <= 0.02 ? "" : delay < 0.13 ? "2" : delay < 0.2 ? "3" : delay < 0.28 ? "4" : "5";
  return (
    <div
      data-entra={isContain ? escalon : "lamina"}
      className={`overflow-hidden rounded-[2px] ${className}`}
      style={
        isContain
          ? {
              // Contain-mode background: a theme-aware surface fill (92%
              // alpha so the glass surface beneath reads through subtly) +
              // a faint radial vignette layered ON TOP of the fill but
              // UNDER the screenshot. CSS backgrounds stack first→last so
              // the radial-gradient is painted last (closest to viewer)
              // within the wrapper's own background layer; the <Image
              // fill> then paints on top of ALL backgrounds, so the
              // vignette only colors the letterbox area where the
              // screenshot doesn't cover. The vignette is so subtle
              // (alpha 0.10 → 0) that it just nudges the eye to perceive
              // the screenshot as centered on a soft halo rather than
              // floating on a flat tile — important for screenshots whose
              // own background is near-black and would otherwise blend
              // into the letterbox.
              //
              // `surfaceBg` override: when the caller passes a flat color
              // (e.g. the live demo's always-dark `"#0b0c0d"`), we drop
              // the theme-aware fill + vignette entirely and use the flat
              // color — necessary for always-dark contexts where the
              // theme-aware `var(--surface)` would clash in light theme.
              background: surfaceBg
                ? surfaceBg
                : "radial-gradient(78% 72% at 50% 50%, transparent 58%, rgb(var(--tint) / 0.10) 100%), color-mix(in srgb, var(--surface) 92%, transparent)",
            }
          : undefined
      }
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        unoptimized
        className={isContain ? "object-contain" : "object-cover"}
        sizes={sizes}
      />
      {/* Gradient overlay to blend with the dark theme — only for cover
          mode. In contain mode the screenshot must read whole and crisp,
          so we skip the tint veil entirely (the theme-aware surface bg
          above already provides letterbox contrast). */}
      {!isContain && overlay > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgb(var(--tint) / ${overlay * 0.3}) 0%, rgb(var(--tint) / ${overlay * 0.6}) 60%, rgb(var(--tint) / ${overlay * 0.9}) 100%)`,
          }}
          aria-hidden="true"
        />
      )}
      {/* Accent tint at top — cover mode only (would muddy a screenshot). */}
      {!isContain && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{
            background: `radial-gradient(60% 40% at 80% 0%, rgb(var(--accent-base) / 0.15), transparent 70%)`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
