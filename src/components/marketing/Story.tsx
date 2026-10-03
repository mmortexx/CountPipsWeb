"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";

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
      title: es ? "Operabas por instinto" : "You traded on instinct",
      desc: es
        ? "Anotabas en Excel. No sabías por qué ganabas ni por qué perdías. Repetías los mismos errores sin ver el patrón."
        : "You took notes in Excel. You didn’t know why you won or why you lost. You repeated the same mistakes without seeing the pattern.",
      tone: "neg",
    },
    {
      tag: es ? "Mes 1" : "Month 1",
      title: es ? "Registras todo" : "You log everything",
      desc: es
        ? "Por primera vez ves tu win rate real, tu expectancy real, tu comisión real. La verdad duele un poco, y eso es bueno."
        : "For the first time you see your real win rate, your real expectancy, your real fees. The truth hurts a bit — and that’s good.",
      tone: "warn",
    },
    {
      tag: es ? "Mes 3" : "Month 3",
      title: es ? "Descubres lo que no sabías" : "You discover what you didn’t know",
      desc: es
        /* Las comillas rectas son de máquina de escribir, y el sitio no
           las usa en ninguna otra parte: el español entrecomilla con
           «…» —así lo hacen las otras cinco del primer nivel— y el
           inglés con “…”, como el aviso de cookies y la cita del diario
           de `/features`. Esta frase era la única que se salía, en los
           dos idiomas a la vez. */
        ? "Tu setup «estrella» apenas tiene expectancy positiva. Tu mejor hora no es la que creías. Tu sesión perdedora es siempre la misma."
        : "Your “star” setup barely has positive expectancy. Your best hour isn’t the one you thought. Your losing session is always the same one.",
      tone: "neutral",
    },
    {
      tag: es ? "Mes 6" : "Month 6",
      title: es ? "Romper el plan cuesta dinero" : "Breaking the plan costs money",
      desc: es
        ? "Ves el coste de indisciplina en una cifra concreta. Cada vez que rompes tu plan, ves cuánto te estás cobrando a ti mismo."
        : "You see the cost of indiscipline as a concrete number. Every time you break your plan, you see how much you’re charging yourself.",
      tone: "accent",
    },
    {
      tag: es ? "Mes 12" : "Month 12",
      title: es ? "Tu operativa tiene forma" : "Your trading has shape",
      desc: es
        ? "Sabes qué setups conservar y cuáles cortar. Tu playbook tiene muestra. Tienes un proceso que puedes revisar, y eso es lo único que se sostiene en el tiempo."
        : "You know which setups to keep and which to cut. Your playbook has a sample. You have a process you can review, and that is the only thing that holds up over time.",
      tone: "pos",
    },
  ];

  // La progresión se cuenta en tinta, no en un arcoíris de cinco colores:
  // las etapas tempranas en terciario y la última, a la que se llega, en
  // tinta plena.
  const toneDot: Record<Phase["tone"], string> = {
    neg: "bg-[var(--ink-3)]",
    warn: "bg-[var(--ink-3)]",
    neutral: "bg-[var(--ink-3)]",
    accent: "bg-[var(--ink-2)]",
    pos: "bg-[var(--ink)]",
  };
  const toneText: Record<Phase["tone"], string> = {
    neg: "text-tertiary",
    warn: "text-tertiary",
    neutral: "text-tertiary",
    accent: "text-secondary",
    pos: "text-primary",
  };

  const quote = es
    ? "Lo que no se mide, no se mejora. Lo que se mide pero no se mira, tampoco."
    : "What isn’t measured doesn’t improve. What is measured but not looked at doesn’t either.";

  return (
    <section id="story" className="section relative scroll-mt-24 overflow-clip">
      <div className="relative z-10 tj-container tj-split grid gap-10 items-start">
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
            <h2 className="t-h2 text-primary">
              {es ? (
                <>
                  El diario que{" "}
                  faltaba.
                </>
              ) : (
                <>
                  The journal that{" "}
                  was missing.
                </>
              )}
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <blockquote className="mt-8 relative pl-6 border-l-2 border-[var(--line-2)]">
              <p className="t-h3 text-primary leading-snug">{quote}</p>
              <footer className="mt-4 text-sm text-tertiary">
                {es ? "—Principio de diseño de CountPips" : "— CountPips design principle"}
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
                ? "Cada app de trading que probamos era o una hoja de cálculo con otro nombre o una suscripción mensual que se quedaba con tus datos si dejabas de pagar. Ninguna te enseñaba lo que tu propio comportamiento te costaba en dinero. Así que construimos una que sí lo hace, y que vive en tu ordenador."
                : "Every trading app we tried was either a glorified spreadsheet, or a monthly subscription that lost your data if you stopped paying. None of them showed what your own behaviour cost you in money. So we built one that does — and that lives on your computer."}
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
                    className={`absolute left-[4px] top-2 h-[7px] w-[7px] ${toneDot[p.tone]}`}
                    aria-hidden="true"
                  />
                  <div
                    data-entra
                    className="relative min-w-0 border-b border-[var(--line)] pb-5"
                  >
                    <span className={`text-[12px] font-semibold tnum ${toneText[p.tone]}`}>
                      {p.tag}
                    </span>
                    <h3 className="mt-2 t-h3 text-primary">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm text-secondary leading-[1.6]">{p.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
