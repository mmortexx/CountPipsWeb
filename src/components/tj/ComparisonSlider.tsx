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
 * ComparisonSlider — «Antes vs Después», con la barra que de verdad
 * transforma lo que hay debajo.
 *
 * ── Lo que estaba mal, y no era el rótulo ─────────────────────────────
 * Esto era un comparador de cortinilla HORIZONTAL con el «antes» en la
 * mitad izquierda y el «después» en la derecha. Dos defectos de fondo:
 *
 *  1. Las dos listas ocupaban MITADES DISTINTAS, así que la barra no
 *     comparaba nada: en el punto medio se veían dos listas diferentes
 *     una al lado de otra, y arrastrar sólo barría un color por encima.
 *     Un antes/después significa algo cuando los dos estados ocupan EL
 *     MISMO SITIO y uno sustituye al otro.
 *  2. Para descubrir la mejora había que arrastrar hacia la IZQUIERDA
 *     —hacia atrás—. La ronda anterior lo «arregló» cambiando el texto
 *     de la página en vez de la mecánica, y quedó un gesto que va al
 *     revés de lo que promete.
 *
 * ── Cómo funciona ahora ───────────────────────────────────────────────
 * Cuatro hábitos, uno por fila, a todo el ancho. Las dos capas tienen la
 * MISMA retícula, así que cada fila del «antes» cae exactamente sobre su
 * pareja del «después». Una barra horizontal baja por encima: lo que
 * queda por encima de la barra ya está convertido, lo de debajo todavía
 * no.
 *
 *   · barra arriba del todo → los cuatro hábitos en rojo
 *   · barra abajo del todo  → los cuatro en verde
 *   · bajar la barra        → se convierte un hábito más
 *
 * ── Por qué la cortinilla SALTA de fila en fila ───────────────────────
 * Con texto, una cortinilla continua es ilegible: el corte cae a mitad
 * de una palabra y se lee media frase de cada estado a la vez. Al saltar
 * a los bordes de fila, cada hábito está siempre entero en uno de los
 * dos estados. Además el gesto gana sentido —se convierten hábitos, no
 * píxeles— y el tirador da un tope suave en cada uno.
 *
 * El eje vertical resuelve de paso la discusión de la dirección: no hay
 * «izquierda» ni «derecha», hay avanzar hacia abajo por la lista.
 *
 * ── Fluidez ───────────────────────────────────────────────────────────
 * Una sola propiedad personalizada (`--tj-cmp`, 0–100) mueve el recorte
 * y el tirador sin un render por fotograma. Está declarada con
 * `@property` en globals.css para que se pueda ANIMAR, que es lo que
 * hace la bienvenida.
 *
 * ── Accesibilidad ─────────────────────────────────────────────────────
 *  · `role="slider"` con `aria-orientation="vertical"`, y `aria-valuenow`
 *    en HÁBITOS convertidos (0–4), no en porcentaje: es lo que significa.
 *  · Teclado: ↑/↓ y ←/→ un hábito, Home/End a los extremos.
 *  · `touch-action: none` para no scrollear la página al arrastrar.
 *  · Las dos listas están SIEMPRE en el árbol y ninguna se oculta a la
 *    tecnología asistiva: quien no ve la cortinilla lee los cuatro pares
 *    completos, que es la información de la sección.
 */

/** Un hábito y en qué se convierte. El orden es el de la lista. */
type Par = { antes: string; despues: string };

const KEYBOARD_STEP = 1;

export function ComparisonSlider() {
  const { lang } = useLang();
  const es = lang === "es";

  const pares: Par[] = es
    ? [
        { antes: "Operas por instinto", despues: "Cada operación tiene un plan" },
        { antes: "No recuerdas por qué entraste", despues: "Sabes qué funcionó y qué no" },
        { antes: "Repites los mismos errores", despues: "Mejoras cada semana, medido" },
        { antes: "No sabes tu win rate real", despues: "Conoces tu expectancy" },
      ]
    : [
        { antes: "You trade on instinct", despues: "Every trade has a plan" },
        { antes: "You don't remember why you entered", despues: "You know what worked and what didn't" },
        { antes: "You repeat the same mistakes", despues: "You improve every week, measured" },
        { antes: "You don't know your real win rate", despues: "You know your expectancy" },
      ];

  const FILAS = pares.length;

  /* La cifra viva (0–100) y su equivalente en hábitos convertidos. `pos`
     se escribe en el DOM sin pasar por React; `hechos` sí es estado
     porque lo leen el rótulo y `aria-valuenow`. */
  const posRef = useRef(50);
  const [hechos, setHechos] = useState(2);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const autoPlayedRef = useRef(false);
  const [saludando, setSaludando] = useState(false);

  /** Único punto por el que se escribe la posición. Salta a la fila más
   *  cercana y devuelve cuántos hábitos quedan convertidos. */
  const fijar = useCallback(
    (pct: number) => {
      const filas = Math.round((Math.min(100, Math.max(0, pct)) / 100) * FILAS);
      const ajustado = (filas / FILAS) * 100;
      posRef.current = ajustado;
      containerRef.current?.style.setProperty("--tj-cmp", String(ajustado));
      return filas;
    },
    [FILAS],
  );

  /* ── Bienvenida ────────────────────────────────────────────────────
     Al entrar en pantalla la barra baja sola y vuelve, para enseñar que
     se arrastra. Va HACIA ABAJO porque abajo es donde está la mejora: la
     bienvenida tiene que enseñar lo que se gana. Vive en una clase de
     globals.css, que también decide sola no reproducirse cuando alguien
     pide menos movimiento. */
  /* Ref de CALLBACK y no `useEffect` sobre `containerRef`: la caja vive
     dentro de un `<Reveal>`, así que en el momento en que corría el
     efecto el nodo todavía no existía, el efecto salía por el `return`
     temprano y la bienvenida no se reproducía nunca. Con el callback, el
     observador se monta EXACTAMENTE cuando aparece el nodo. */
  const observerRef = useRef<IntersectionObserver | null>(null);
  const montarCaja = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el || autoPlayedRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !autoPlayedRef.current) {
            autoPlayedRef.current = true;
            setSaludando(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    observerRef.current = io;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const desdeEvento = useCallback(
    (clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setHechos(fijar(((clientY - r.top) / r.height) * 100));
    },
    [fijar],
  );

  useEffect(() => {
    const mover = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      desdeEvento(e.clientY);
    };
    const soltar = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointermove", mover);
    return () => {
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointermove", mover);
    };
  }, [desdeEvento]);

  const startDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    /* El primer toque cancela la bienvenida: sin esto seguiría
       escribiendo `--tj-cmp` por encima del dedo hasta acabar. */
    setSaludando(false);
    draggingRef.current = true;
    desdeEvento(e.clientY);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const actual = Math.round((posRef.current / 100) * FILAS);
    let next = actual;
    switch (e.key) {
      case "ArrowUp":
      case "ArrowLeft":
        next = actual - KEYBOARD_STEP;
        break;
      case "ArrowDown":
      case "ArrowRight":
        next = actual + KEYBOARD_STEP;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = FILAS;
        break;
      default:
        return;
    }
    e.preventDefault();
    setSaludando(false);
    setHechos(fijar((Math.min(FILAS, Math.max(0, next)) / FILAS) * 100));
  };

  /* Una fila, en el estado que toque. Las dos capas la pintan con la
     MISMA caja para que el salto de una a otra sea exacto. */
  const Fila = ({ texto, bueno }: { texto: string; bueno: boolean }) => (
    <li className="flex items-center gap-3 px-5 sm:px-8">
      <span
        className={`inline-flex shrink-0 w-5 h-5 items-center justify-center rounded-[2px] ring-1 ${
          bueno
            ? "bg-pnl-pos/15 ring-pnl-pos/40"
            : "bg-pnl-neg/15 ring-pnl-neg/35"
        }`}
      >
        {bueno ? (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6.5l2.5 2.5L10 3.5" stroke="rgb(var(--pnl-pos))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 3l6 6M9 3l-6 6" stroke="rgb(var(--pnl-neg))" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </span>
      {/* `min-w-0` + equilibrado: a 320 px estas frases ocupan dos
          líneas, y sin esto la más larga empujaba la caja. */}
      <span
        className={`min-w-0 text-pretty text-[14px] leading-[1.35] sm:text-[15px] ${
          bueno ? "font-medium text-primary" : "text-secondary"
        }`}
      >
        {texto}
      </span>
    </li>
  );

  return (
    <section className="section">
      <div className="tj-container">
        <Reveal className="text-center max-w-2xl mx-auto">
          <Eyebrow className="justify-center">
            {es ? "Arrastra y compara" : "Drag and compare"}
          </Eyebrow>
          <h2 className="mt-5 t-h2 text-primary">
            {es ? (
              <>
                Baja la barra. <span className="text-gradient">Mira tu reflejo.</span>
              </>
            ) : (
              <>
                Pull the bar down. <span className="text-gradient">See your reflection.</span>
              </>
            )}
          </h2>
          <p className="mt-4 text-secondary leading-[1.6]">
            {es
              ? "Cada hábito que dejas atrás se convierte en el de abajo. Baja la barra y mira en qué se transforma tu operativa: no es magia, es disciplina medida."
              : "Each habit you leave behind turns into the one below. Pull the bar down and watch your trading change: it isn't magic, it's measured discipline."}
          </p>
        </Reveal>

        <Reveal delay={0.1} y={28}>
          <div className="mt-10 max-w-3xl mx-auto">
            {/* Leyenda fuera de la caja: dentro chocaría con las filas y
                obligaría a descuadrar una de las dos capas. */}
            <div className="tnum mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em]">
              <span className="text-pnl-pos">
                {es ? "Convertidos" : "Converted"} · {hechos}/{FILAS}
              </span>
              <span className="text-tertiary">
                {es ? "Arrastra ↓" : "Drag ↓"}
              </span>
            </div>

            <div
              ref={montarCaja}
              className={`tj-paper relative select-none overflow-clip rounded-[2px] border border-[rgb(var(--divider)/0.16)] ${
                saludando ? "tj-cmp-saluda" : ""
              }`}
              style={
                {
                  touchAction: "none",
                  "--tj-cmp": 50,
                  /* Alto derivado del número de filas y no fijo: con un
                     `h-[320px]` cerrado, a 320 px de ancho las frases
                     pasan a dos líneas y se salían de su fila. */
                  minHeight: `calc(${FILAS} * 4.75rem)`,
                } as React.CSSProperties
              }
            >
              {/* ── ANTES — la base, siempre pintada ─────────────── */}
              <div className="absolute inset-0">
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, rgb(var(--pnl-neg))), color-mix(in srgb, var(--surface) 88%, rgb(var(--pnl-neg))))",
                  }}
                />
              </div>
              <ul
                className="absolute inset-0 grid"
                style={{ gridTemplateRows: `repeat(${FILAS}, minmax(0, 1fr))` }}
              >
                {pares.map((p) => (
                  <Fila key={p.antes} texto={p.antes} bueno={false} />
                ))}
              </ul>

              {/* ── DESPUÉS — recortado desde ABAJO ──────────────── */}
              {/* `inset(0 0 (100−v)% 0)` deja ver de arriba hasta v%:
                  cuanto MÁS baja la barra, más convertido hay. La misma
                  variable gobierna el recorte y el tirador, así que no
                  pueden desincronizarse. */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  clipPath:
                    "inset(0 0 calc((100 - var(--tj-cmp)) * 1%) 0 round 2px)",
                  willChange: "clip-path",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, rgb(var(--pnl-pos))), color-mix(in srgb, var(--surface) 84%, rgb(var(--pnl-pos))))",
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(120% 80% at 100% 0%, rgb(var(--accent-base) / 0.16), transparent 60%)",
                  }}
                />
                <ul
                  className="absolute inset-0 grid"
                  style={{ gridTemplateRows: `repeat(${FILAS}, minmax(0, 1fr))` }}
                >
                  {pares.map((p) => (
                    <Fila key={p.despues} texto={p.despues} bueno />
                  ))}
                </ul>
              </div>

              {/* ── TIRADOR ──────────────────────────────────────── */}
              <button
                type="button"
                role="slider"
                aria-label={
                  es
                    ? "Baja la barra para convertir hábitos"
                    : "Pull the bar down to convert habits"
                }
                aria-orientation="vertical"
                aria-valuemin={0}
                aria-valuemax={FILAS}
                aria-valuenow={hechos}
                aria-valuetext={
                  es
                    ? `${hechos} de ${FILAS} hábitos convertidos`
                    : `${hechos} of ${FILAS} habits converted`
                }
                onPointerDown={startDrag}
                onKeyDown={onKeyDown}
                style={{ top: "calc(var(--tj-cmp) * 1%)", touchAction: "none" }}
                /* 48 px de alto para el dedo, sobre una línea de 2 px. */
                className="absolute inset-x-0 z-30 h-12 -translate-y-1/2 cursor-ns-resize outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)]"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2"
                  style={{
                    background:
                      "linear-gradient(90deg, rgb(var(--accent-base) / 0.5) 0%, rgb(var(--divider) / 0.75) 22%, rgb(var(--divider) / 0.75) 78%, rgb(var(--accent-base) / 0.5) 100%)",
                  }}
                />
                <span
                  aria-hidden="true"
                  className="tj-paper absolute left-1/2 top-1/2 inline-flex h-11 w-11 items-center justify-center rounded-[2px] border border-[rgb(var(--divider)/0.28)] text-primary"
                  style={{ transform: "translateZ(0) translate(-50%, -50%)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M5 5L8 2.5L11 5M5 11L8 13.5L11 11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </div>
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
