"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLang } from "@/lib/i18n";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";

/**
 * ComparisonSlider — "Antes vs Después" con arrastre intuitivo.
 *
 * ── Hacia dónde se arrastra, y por qué ────────────────────────────────
 * Este bloque llevaba escrito que arrastrar a la DERECHA revelaba más
 * del después, y el texto de la página lo repetía. Es imposible con esta
 * disposición, y se notaba usándolo: el "antes" ocupa el lado izquierdo
 * a sangre y el "después" es el recorte de la derecha, cuyo borde
 * izquierdo va pegado al tirador. Si el tirador avanza hacia la derecha,
 * el recorte se estrecha — o sea, aparece MÁS "antes", justo lo
 * contrario de lo prometido.
 *
 * No es un fallo de la mecánica sino del rótulo: en cualquier comparador
 * con el antes a la izquierda, lo nuevo se descubre tirando HACIA LA
 * IZQUIERDA. Eso es lo que dice ahora la página.
 *
 *   · tirador a la derecha   → se ve casi todo ANTES (rojo)
 *   · tirador al centro      → mitad y mitad
 *   · tirador a la izquierda → se ve casi todo DESPUÉS (verde)
 *   · arrastrar a la izquierda → CRECE el después
 *
 * ── Animación de bienvenida ───────────────────────────────────────────
 * Al entrar en viewport, el tirador viaja 50 → 12 → 50 % en ~1,55 s. El
 * visitante ve el efecto sin tocar nada. Con `prefers-reduced-motion` se
 * queda en 50/50, y el primer arrastre la cancela.
 *
 * ── Fluidez ───────────────────────────────────────────────────────────
 *  · Una propiedad personalizada (`--tj-cmp`) mueve el recorte y el
 *    tirador sin un solo render por fotograma. Ver el comentario del
 *    cuerpo y `@property --tj-cmp` en globals.css.
 *  · `will-change: clip-path` en el overlay; `translateZ(0)` en el grip.
 *
 * ── Accesibilidad ─────────────────────────────────────────────────────
 *  · `role="slider"`, `aria-orientation`, `aria-valuenow/text`.
 *  · Teclado: ←/↓ −8 %, →/↑ +8 %, Home/End a los extremos.
 *  · Touch: `touch-action: none` en el contenedor para no scrollear la
 *    página al arrastrar.
 */

const MIN_PCT = 4;
const MAX_PCT = 96;
const KEYBOARD_STEP = 8;

export function ComparisonSlider() {
  const { lang } = useLang();
  const es = lang === "es";

  const before = es
    ? [
        "Operas por instinto",
        "No recuerdas por qué entraste",
        "Repites los mismos errores",
        "No sabes tu win rate real",
      ]
    : [
        "You trade on instinct",
        "You don't remember why you entered",
        "You repeat the same mistakes",
        "You don't know your real win rate",
      ];

  const after = es
    ? [
        "Cada operación tiene un plan",
        "Sabes qué funcionó y qué no",
        "Mejoras cada semana, medido",
        "Conoces tu expectancy",
      ]
    : [
        "Every trade has a plan",
        "You know what worked and what didn't",
        "You improve every week, measured",
        "You know your expectancy",
      ];

  /* ── UNA SOLA CIFRA, ESCRITA EN CSS ────────────────────────────────
     La posición del tirador (0–100) vive en la propiedad personalizada
     `--tj-cmp` del contenedor. De ahí salen, con `calc()`, el recorte
     del panel «después» y el `left` del propio tirador — las dos
     derivadas que antes eran `useTransform` de framer-motion.

     Escribir una propiedad personalizada NO provoca render, igual que un
     valor de movimiento de la biblioteca, y ésa era la única razón por
     la que estaba aquí. El porqué de declararla con `@property` —para
     que se pueda ANIMAR, y la bienvenida no salte de 50 a 12 de golpe—
     está en globals.css.

     `posRef` guarda el mismo número para poder leerlo sin tocar el DOM:
     los saltos de teclado necesitan saber de dónde parten. */
  const posRef = useRef(50);

  // El DESPUÉS es el overlay recortado: su borde izquierdo sigue al
  // tirador. `inset(0 0 0 v%)` oculta desde la izquierda hasta v% y deja
  // visible de v% a 100%. Así que cuanto MAYOR es v, MENOS después se ve:
  //   v=4  → el después ocupa casi todo
  //   v=50 → mitad y mitad
  //   v=96 → apenas una franja: se ve casi todo el antes
  // El comentario anterior decía justo lo contrario y de ahí salió el
  // rótulo equivocado de la página.
  const [ariaPct, setAriaPct] = useState(50);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const autoPlayedRef = useRef(false);
  /** Marca la bienvenida como en curso, para cancelarla al primer toque. */
  const [saludando, setSaludando] = useState(false);

  /** Único punto por el que se escribe la posición. Acota y devuelve. */
  const fijar = useCallback((v: number) => {
    const c = Math.min(MAX_PCT, Math.max(MIN_PCT, v));
    posRef.current = c;
    containerRef.current?.style.setProperty("--tj-cmp", String(c));
    return c;
  }, []);

  // ── Auto-animación de bienvenida ─────────────────────────────────
  // Al entrar en viewport por primera vez, viaja 50 → 88 → 50 % para
  // enseñar el efecto. Se cancela si el usuario empieza a arrastrar.
  useEffect(() => {
    if (autoPlayedRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !autoPlayedRef.current) {
            autoPlayedRef.current = true;
            /* La bienvenida es ahora una clase: la coreografía
               50 → 12 → 50 vive en `tj-cmp-bienvenida` (globals.css),
               que también decide sola no reproducirse cuando el visitante
               pide menos movimiento. Antes eran dos llamadas a `animate()`
               encadenadas con un `setTimeout` de 820 ms y un
               `useReducedMotion()` para saltárselas — tres piezas que
               tenían que estar de acuerdo entre sí.

               Va hacia la IZQUIERDA porque es el lado que descubre el
               después: la bienvenida tiene que enseñar lo que se gana, no
               lo que ya se sufre. */
            setSaludando(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ── Arrastre por puntero ─────────────────────────────────────────
  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pct = ((e.clientX - r.left) / r.width) * 100;
      fijar(pct);
    },
    [fijar],
  );

  useEffect(() => {
    const stop = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setAriaPct(Math.round(posRef.current));
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [onPointerMove]);

  const startDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    /* El primer toque cancela la bienvenida. Sin esto, la animación
       seguiría escribiendo `--tj-cmp` por encima del dedo hasta acabar:
       el tirador se iría solo mientras el visitante lo arrastra. */
    setSaludando(false);
    draggingRef.current = true;
    const el = containerRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const pct = ((e.clientX - r.left) / r.width) * 100;
      fijar(pct);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    let next = posRef.current;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        next = next - KEYBOARD_STEP;
        break;
      case "ArrowRight":
      case "ArrowUp":
        next = next + KEYBOARD_STEP;
        break;
      case "Home":
        next = MIN_PCT;
        break;
      case "End":
        next = MAX_PCT;
        break;
      default:
        return;
    }
    e.preventDefault();
    setAriaPct(Math.round(fijar(next)));
  };

  return (
    <section className="section bg-veil">
      <div className="tj-container">
        <Reveal className="text-center max-w-2xl mx-auto">
          <Eyebrow className="justify-center">
            {es ? "Arrastra y compara" : "Drag and compare"}
          </Eyebrow>
          <h2 className="mt-5 t-h2 text-primary">
            {es ? (
              <>
                Mueve la barra. <span className="text-gradient">Mira tu reflejo.</span>
              </>
            ) : (
              <>
                Move the bar. <span className="text-gradient">See your reflection.</span>
              </>
            )}
          </h2>
          <p className="mt-4 text-secondary leading-[1.6]">
            {es
              ? "Arrastra la barra hacia la izquierda para descubrir lo que cambia con CountPips. La transformación no es magia: es disciplina medida."
              : "Drag the bar to the left to uncover what changes with CountPips. The transformation isn't magic: it's measured discipline."}
          </p>
        </Reveal>

        <Reveal delay={0.1} y={28}>
          <div
            ref={containerRef}
            /* `--tj-cmp` se declara aquí y la heredan las dos capas que
               dependen de ella. La clase de bienvenida se retira en cuanto
               el visitante toca el tirador: ver `startDrag`. */
            className={`tj-paper rounded-[2px] overflow-hidden h-[320px] sm:h-[300px] relative select-none mt-10 max-w-3xl mx-auto border border-[rgb(var(--divider)/0.16)] transition-[background-color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-suave)] ${
              saludando ? "tj-cmp-saluda" : ""
            }`}
            style={{ touchAction: "none", "--tj-cmp": 50 } as React.CSSProperties}
          >
            {/* ─────────── BEFORE (base layer, full width) ─────────── */}
            {/* El "antes" es la base a sangre: siempre pintado, con tinte
                rojo apagado y contenido en la mitad izquierda. Cuando el
                overlay del después se repliega, lo que queda visible es
                este lado. */}
            <div className="absolute inset-0">
              {/* Surface muted rojo */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, rgb(var(--pnl-neg))), color-mix(in srgb, var(--surface) 88%, rgb(var(--pnl-neg))))",
                }}
              />
              {/* Soft red wash */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(120% 80% at 0% 0%, rgb(var(--pnl-neg) / 0.16), transparent 60%)",
                }}
              />
              {/* Chip ANTES (top-left) */}
              <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pnl-neg/12 border border-pnl-neg/28 shadow-[0_4px_12px_-4px_rgb(var(--pnl-neg)/0.30)]">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pnl-neg/18 text-pnl-neg">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-pnl-neg">
                  {es ? "Antes" : "Before"}
                </span>
              </div>
              {/* Lista ANTES — mitad izquierda */}
              <ul className="absolute inset-y-0 left-0 w-1/2 flex flex-col justify-center gap-4 px-6 md:px-8">
                {before.map((line, i) => (
                  <li
                    key={i}
                    data-entra="ciclo"
                    className="flex items-start gap-3"
                  >
                    <span className="inline-flex shrink-0 w-5 h-5 rounded-full bg-pnl-neg/15 ring-1 ring-pnl-neg/35 items-center justify-center mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M3 3l6 6M9 3l-6 6" stroke="rgb(var(--pnl-neg))" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="text-[13px] sm:text-[14px] text-secondary">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ─────────── AFTER (clipped overlay, right side) ─────────── */}
            {/* El "después" es el recorte de la derecha: su borde izquierdo va
                pegado al tirador, así que arrastrar hacia la IZQUIERDA lo
                hace crecer. Ver la nota de cabecera. */}
            <div
              className="absolute inset-0"
              /* El recorte se deriva de la MISMA variable que la posición del
                 tirador, así que no pueden desincronizarse. `inset(0 0 0 v%)`
                 oculta desde la izquierda hasta v%: cuanto MAYOR es v, menos
                 «después» se ve. */
              style={{
                clipPath: "inset(0 0 0 calc(var(--tj-cmp) * 1%) round 8px)",
                willChange: "clip-path",
              }}
              >
              {/* Surface vibrante verde/champagne */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, rgb(var(--pnl-pos))), color-mix(in srgb, var(--surface) 84%, rgb(var(--pnl-pos))))",
                }}
              />
              {/* Accent wash */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(120% 80% at 100% 0%, rgb(var(--accent-base) / 0.18), transparent 60%)",
                }}
              />
              {/* Accent top-line */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px opacity-70"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgb(var(--accent-base)), transparent)",
                }}
              />
              {/* Chip DESPUÉS (top-right) */}
              <div className="absolute top-3 right-3 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgb(var(--accent-base)/0.12)] border border-[rgb(var(--accent-base)/0.32)] shadow-[0_4px_12px_-4px_rgb(var(--accent-base)/0.30)]">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pnl-pos/15 text-pnl-pos">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[rgb(var(--accent-base))]">
                  {es ? "Con CountPips" : "With CountPips"}
                </span>
              </div>
              {/* Lista DESPUÉS — mitad derecha */}
              <ul className="absolute inset-y-0 right-0 w-1/2 flex flex-col justify-center gap-4 px-6 md:px-8">
                {after.map((line, i) => (
                  <li
                    key={i}
                    data-entra="ciclo"
                    className="flex items-start gap-3"
                  >
                    <span className="inline-flex shrink-0 w-5 h-5 rounded-full bg-pnl-pos/15 ring-1 ring-pnl-pos/40 items-center justify-center mt-0.5">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2 6.5l2.5 2.5L10 3.5" stroke="rgb(var(--pnl-pos))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-[13px] sm:text-[14px] text-primary font-medium">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ─────────── DRAG HANDLE ─────────── */}
            {/* Hit area ancha (48px) para touch; línea visible de 2px. */}
            <button
              type="button"
              role="slider"
              aria-label={es ? "Arrastra para comparar antes y después" : "Drag to compare before and after"}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={ariaPct}
              aria-valuetext={es ? `${ariaPct}% después visible` : `${ariaPct}% after shown`}
              aria-orientation="horizontal"
              onPointerDown={startDrag}
              onKeyDown={onKeyDown}
              style={{ left: "calc(var(--tj-cmp) * 1%)", touchAction: "none" }}
              className="group/handle absolute top-0 bottom-0 z-30 -translate-x-1/2 w-12 cursor-ew-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.60)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {/* Glow filament */}
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 blur-[3px] bg-[rgb(var(--accent-base)/0.40)] opacity-70 group-hover/handle:opacity-100 transition-opacity duration-200"
              />
              {/* Visible line — 2px gold gradient */}
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 transition-[background-color] duration-200"
                style={{
                  background:
                    "linear-gradient(180deg, rgb(var(--accent-base) / 0.5) 0%, rgb(var(--divider) / 0.75) 22%, rgb(var(--divider) / 0.75) 78%, rgb(var(--accent-base) / 0.5) 100%)",
                }}
              />
              {/* Circular grip — 44px tap target, paper material */}
              <span
                className="tj-paper absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center w-11 h-11 rounded-full text-primary border border-[rgb(var(--divider)/0.28)] ring-1 ring-[rgb(var(--accent-base)/0.45)] group-hover/handle:ring-[rgb(var(--accent-base)/0.70)] shadow-[0_8px_24px_-6px_rgb(var(--accent-base)/0.55)] group-hover/handle:shadow-[0_10px_28px_-6px_rgb(var(--accent-base)/0.70)] transition-[transform,box-shadow] duration-200 ease-[var(--ease-suave)] group-hover/handle:scale-105"
                style={{ transform: "translateZ(0) translate(-50%, -50%)" }}
                aria-hidden="true"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M5 5L2.5 8L5 11M11 5L13.5 8L11 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {/* Pista de arrastre, arriba al centro.
                Se renderiza siempre. Antes se ocultaba con `!reduce`, y
                eso mezclaba dos cosas distintas: quien pide menos
                movimiento no pide menos INSTRUCCIONES — se quedaba sin
                saber que el bloque se puede arrastrar. Lo que sobra es su
                balanceo, y de eso se ocupa la regla global de
                `prefers-reduced-motion` de globals.css, que le pone
                `animation-iteration-count: 1` y una duración de 0,01 ms a
                todo lo que se mueva en el sitio. */}
            {(
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
                style={{ animation: "tj-float 2.4s ease-in-out infinite" }}
              >
                <span className="text-[10px] uppercase tracking-[0.18em] text-tertiary font-semibold">
                  {es ? "← Arrastra" : "← Drag"}
                </span>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.18}>
          <p className="mt-6 text-xs text-tertiary text-center max-w-2xl mx-auto">
            {es
              ? "El mismo trader, dos resultados. La diferencia no es talento: es mirarte con honestidad."
              : "The same trader, two outcomes. The difference isn't talent: it's looking at yourself honestly."}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
