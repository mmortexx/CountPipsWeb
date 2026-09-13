"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { Eyebrow } from "@/components/tj/Eyebrow";

/**
 * Story — narrative section explaining why the app exists. Editorial
 * layout: large pull-quote on the left, vertical timeline of a trader's
 * journey (before journal → with journal) on the right.
 */

interface Phase {
  tag: string;
  title: string;
  desc: string;
  tone: "neg" | "warn" | "neutral" | "pos" | "accent";
}

export function Story() {
  const { lang } = useLang();
  const es = lang === "es";

  const phases: Phase[] = [
    {
      tag: es ? "Antes" : "Before",
      title: es ? "Operabas a instinto" : "You traded on instinct",
      desc: es
        ? "Anotabas en Excel. No sabías por qué ganabas ni por qué perdías. Repetías los mismos errores sin ver el patrón."
        : "You took notes in Excel. You didn't know why you won or why you lost. You repeated the same mistakes without seeing the pattern.",
      tone: "neg",
    },
    {
      tag: es ? "Mes 1" : "Month 1",
      title: es ? "Registras todo" : "You log everything",
      desc: es
        ? "Por primera vez ves tu win rate real, tu expectancy real, tu comisión real. La verdad duele un poco — y eso es bueno."
        : "For the first time you see your real win rate, your real expectancy, your real fees. The truth hurts a bit — and that's good.",
      tone: "warn",
    },
    {
      tag: es ? "Mes 3" : "Month 3",
      title: es ? "Descubres lo que no sabías" : "You discover what you didn't know",
      desc: es
        ? "Tu setup 'estrella' apenas tiene expectancy positivo. Tu mejor hora no es la que creías. Tu sesión perdedora es siempre la misma."
        : "Your 'star' setup barely has positive expectancy. Your best hour isn't the one you thought. Your losing session is always the same one.",
      tone: "neutral",
    },
    {
      tag: es ? "Mes 6" : "Month 6",
      title: es ? "Romper el plan cuesta dinero" : "Breaking the plan costs money",
      desc: es
        ? "Ves el coste de indisciplina en una cifra concreta. Cada vez que rompes tu plan, sabes cuánto te estás cobrando a ti mismo."
        : "You see the cost of indiscipline as a concrete number. Every time you break your plan, you know exactly how much you're charging yourself.",
      tone: "accent",
    },
    {
      tag: es ? "Mes 12" : "Month 12",
      title: es ? "Tu operativa tiene forma" : "Your trading has shape",
      desc: es
        ? "Tu curva de equity tiene pendiente. Tu playbook tiene muestra. Tú tienes un proceso — y eso es lo único que se sostiene en el tiempo."
        : "Your equity curve has slope. Your playbook has sample. You have a process — and that's the only thing that holds up over time.",
      tone: "pos",
    },
  ];

  const toneDot: Record<Phase["tone"], string> = {
    neg: "bg-pnl-neg",
    warn: "bg-pnl-warn",
    neutral: "bg-[rgb(var(--divider)/0.40)]",
    pos: "bg-pnl-pos",
    accent: "bg-[rgb(var(--accent-base))]",
  };
  // toneText maps each phase tone to a design-system text token so the tag
  // color shifts correctly when the theme flips to light. `neutral` uses the
  // tertiary text token (gray-400 on dark); `accent` uses primary (white on
  // dark) so the tag sits at the same chroma as the headline. Previously
  // these were raw `text-gray-400` / `text-white` which would not respond
  // to theme changes and read as out-of-system chrome.
  const toneText: Record<Phase["tone"], string> = {
    neg: "text-pnl-neg",
    warn: "text-pnl-warn",
    neutral: "text-tertiary",
    pos: "text-pnl-pos",
    accent: "text-primary",
  };

  // Pull-quote split into words for staggered word-by-word reveal.
  const quote = es
    ? "Lo que no se mide, no se mejora. Lo que se mide pero no se mira, tampoco."
    : "What isn't measured doesn't improve. What is measured but not looked at doesn't either.";
  const quoteWords = quote.split(" ");

  return (
    <section id="story" className="section relative scroll-mt-24 overflow-clip">
      <div className="relative z-10 tj-container grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-20 items-start">
        {/* LEFT — editorial pull quote (sticky + subtle parallax) */}
        {/* Sin `data-entra`, y no por casualidad: esta columna es
            `sticky`, y una entrada atada a `view()` mide la posición del
            elemento en la ventana para calcular su progreso — mientras
            que un `sticky` cambia esa posición al desplazarse. Las dos
            cosas juntas se realimentan. Además era un `motion.div` sin
            props de animación: no había nada que conservar. Sus tres
            bloques ya entran con sus `Reveal`. */}
        <div className="lg:sticky lg:top-24" >
          <Reveal>
            <Eyebrow>{es ? "Por qué existe esto" : "Why this exists"}</Eyebrow>
            <h2
              className="mt-5 t-h2 text-primary"
            >
              {es ? (
                <>
                  El diario que{" "}
                  <span className="text-gradient">faltaba.</span>
                </>
              ) : (
                <>
                  The journal that{" "}
                  <span className="text-gradient">was missing.</span>
                </>
              )}
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <blockquote className="mt-8 relative pl-6 border-l-2 border-[rgb(var(--divider)/0.20)]">
              <span
                className="absolute -left-1 -top-3 text-5xl leading-none text-primary/40 font-serif select-none"
                aria-hidden="true"
              >
                &ldquo;
              </span>
              {/* La cita se escribe sola, palabra a palabra. Era un
                  `staggerChildren: 0.035` de framer-motion; ahora cada
                  palabra lleva su posición en `--i` y la hoja desplaza su
                  rango de entrada 1,5 puntos por posición. Ver
                  `[data-entra="palabra"]` en globals.css. */}
              <p className="t-h3 text-primary leading-snug">
                {quoteWords.map((w, i) => (
                  <span
                    key={i}
                    data-entra="palabra"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    {w}&nbsp;
                  </span>
                ))}
              </p>
              <footer className="mt-4 text-sm text-tertiary">
                — {es ? "filosofía de la app" : "the app's philosophy"}
              </footer>
            </blockquote>
          </Reveal>

          <Reveal delay={0.18}>
            {/* T2h: long-form narrative paragraph — leading-relaxed (1.625)
                → leading-[1.7] per the about-page brief for comfortable
                editorial measure. Added max-w-[44em] so the paragraph keeps
                its rhythm on wide desktop where the left grid column would
                otherwise stretch it too wide. */}
            <p className="mt-8 text-secondary leading-[1.7] max-w-[44em]">
              {es
                ? "Cada app de trading que probamos era o bien una hoja de cálculo glorificada, o bien una suscripción mensual que perdía tus datos si dejabas de pagar. Ninguna te enseñaba lo que TU comportamiento te costaba en dinero. Así que construimos una que sí lo hace — y que vive en tu ordenador."
                : "Every trading app we tried was either a glorified spreadsheet, or a monthly subscription that lost your data if you stopped paying. None of them showed what YOUR behavior cost you in money. So we built one that does — and that lives on your computer."}
            </p>
          </Reveal>
        </div>

        {/* RIGHT — timeline */}
        <div className="relative">
          {/* Vertical track line — symmetric neutral hairline that fades in at
              the top and out at the bottom so it reads as a floating rule
              connecting the dots, not a hard strip clipped to the section.
              Opacity peaks at 0.45 mid-rail; both edges dissolve into the
              backdrop so the first/last dots don't sit on a hard line end. */}
          <span
            className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-[rgb(var(--divider)/0.45)] to-transparent"
            aria-hidden="true"
          />

          <div className="space-y-7">
            {phases.map((p, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="relative pl-9">
                  <span
                    data-entra="sello"
                    className={`absolute left-0 top-2 h-[7px] w-[7px] ${toneDot[p.tone]}`}
                    aria-hidden="true"
                  />
                  <div
                    data-entra
                    className="relative min-w-0 border-b border-[rgb(var(--divider)/0.10)] pb-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`text-[10px] uppercase tracking-[0.14em] font-semibold tnum ${toneText[p.tone]}`}
                      >
                        {p.tag}
                      </span>
                      {/* Phase index — split so the current number reads in
                          secondary (one step above tertiary) and the total
                          stays tertiary. The contrast reinforces "you are
                          here" vs "of N" without adding a new color token.
                          Both keep tnum for tabular alignment. */}
                      <span className="text-[10px] text-tertiary tnum">
                        <span className="text-secondary">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {" / "}
                        {String(phases.length).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-2 t-h3 text-primary">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm text-secondary leading-[1.6]">{p.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Coda */}
          <Reveal delay={0.5}>
            <div className="mt-8 pl-9">
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 8h9M8 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {es ? "Y la curva, por fin, sube." : "And the curve, finally, goes up."}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
