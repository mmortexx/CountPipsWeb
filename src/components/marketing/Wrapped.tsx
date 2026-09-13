"use client";

import type { ReactNode } from "react";
import { useLang } from "@/lib/i18n";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Money } from "@/components/tj/Money";
import { METRICS, TRADES, nombreSetup, rankByExpectancy, weekdayBreakdown } from "@/lib/trading/data";
import { fmtNum, fmtPct } from "@/lib/trading/format";

/** Lo que el diario destapa: seis lecturas que el programa calcula de las operaciones de muestra. */
export function Wrapped() {
  const { lang } = useLang();
  const es = lang === "es";

  const topSetup = rankByExpectancy(TRADES, (t) => t.setup)[0];
  const topInstrument = rankByExpectancy(TRADES, (t) => t.instrument)[0];
  const bestDay = [...weekdayBreakdown(TRADES)].sort((a, b) => b.pnl - a.pnl)[0];

  const dias: Record<string, [string, string]> = {
    Lun: ["Lunes", "Monday"],
    Mar: ["Martes", "Tuesday"],
    Mié: ["Miércoles", "Wednesday"],
    Jue: ["Jueves", "Thursday"],
    Vie: ["Viernes", "Friday"],
    Sáb: ["Sábado", "Saturday"],
    Dom: ["Domingo", "Sunday"],
  };
  const dia = dias[bestDay.day]?.[es ? 0 : 1] ?? bestDay.day;
  const ops = (n: number) => (es ? `${n} operaciones` : `${n} trades`);

  const lecturas: { key: string; label: string; value: ReactNode; detalle: ReactNode; sub: string }[] = [
    {
      key: "setup",
      label: es ? "Setup con mejor expectancy" : "Setup with the best expectancy",
      value: nombreSetup(topSetup.name, lang),
      detalle: (
        <>
          <Money value={topSetup.totalPnl} sign compact colorizeSign className="font-medium" />
          {` · ${ops(topSetup.count)} · ${fmtPct(topSetup.winRate, lang, 0)} win rate`}
        </>
      ),
      sub: es
        ? "Con su muestra al lado, para saber si es ventaja o todavía anécdota."
        : "With its sample size next to it, so you know if it is an edge or still an anecdote.",
    },
    {
      key: "instrument",
      label: es ? "Instrumento que mejor te funciona" : "Instrument that works best for you",
      value: topInstrument.name,
      detalle: (
        <>
          <Money value={topInstrument.totalPnl} sign compact colorizeSign className="font-medium" />
          {` · ${ops(topInstrument.count)}`}
        </>
      ),
      sub: es ? "Y los que te restan, en la misma tabla." : "And the ones that cost you, in the same table.",
    },
    {
      key: "day",
      label: es ? "Mejor día de la semana" : "Best day of the week",
      value: dia,
      detalle: <Money value={bestDay.pnl} sign compact colorizeSign className="font-medium" />,
      sub: es ? "¿Patrón repetible o casualidad? La muestra lo dice." : "A repeatable pattern or chance? The sample tells.",
    },
    {
      key: "discipline",
      label: es ? "Operaciones fuera de plan" : "Off-plan trades",
      value: fmtPct(1 - METRICS.compliancePct, lang, 0),
      detalle: es ? "de todas las registradas" : "of all logged trades",
      sub: es
        ? "Separa lo que cumple tu plan de lo que no y te dice cuánto deja cada grupo."
        : "It splits what follows your plan from what does not and tells you what each group makes.",
    },
    {
      key: "pf",
      label: "Profit factor",
      value: fmtNum(METRICS.profitFactor, lang, 2),
      detalle: es ? "ganancia bruta entre pérdida bruta" : "gross profit over gross loss",
      sub: es ? "Por encima de 1, el sistema gana más de lo que pierde." : "Above 1, the system makes more than it loses.",
    },
    {
      key: "streak",
      label: es ? "Mejor racha" : "Best streak",
      value: fmtNum(METRICS.maxWinStreak, lang, 0),
      detalle: es ? "ganadoras seguidas" : "winners in a row",
      sub: es
        ? "El programa contrasta tus rachas con el azar antes de que te las creas."
        : "The app tests your streaks against chance before you believe them.",
    },
  ];

  return (
    <section className="section relative">
      <div className="tj-container">
        <SectionHeader
          composicion="partida"
          etiqueta={es ? "Lo que destapa el diario" : "What the journal uncovers"}
          titulo={
            es ? (
              <>
                Tus hábitos, <span className="text-gradient">en cifras.</span>
              </>
            ) : (
              <>
                Your habits, <span className="text-gradient">in numbers.</span>
              </>
            )
          }
          entradilla={
            es
              ? "No solo cuenta operaciones: cruza setup, instrumento, día y disciplina para enseñarte dónde ganas y dónde se te escapa el dinero."
              : "It does not just count trades: it crosses setup, instrument, day and discipline to show where you win and where money slips away."
          }
        />

        <dl className="mt-12 grid border-t border-[var(--line-2)] sm:grid-cols-2 lg:grid-cols-3">
          {lecturas.map((l) => (
            <div
              data-entra="ciclo"
              key={l.key}
              className="flex min-w-0 flex-col border-b border-[var(--line)] py-7 sm:px-6 sm:[&:nth-child(2n+1)]:pl-0 lg:[&:nth-child(2n+1)]:pl-6 lg:[&:nth-child(3n+1)]:pl-0"
            >
              <dt className="text-[13px] font-medium text-tertiary">{l.label}</dt>
              <dd className="m-0 mt-3 t-h2 tnum text-primary break-words leading-tight">{l.value}</dd>
              <dd className="m-0 mt-2 text-[14px] tnum text-secondary">{l.detalle}</dd>
              <dd className="m-0 mt-4 text-[14px] leading-[1.6] text-tertiary">{l.sub}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-[13px] text-tertiary">
          {es
            ? "Cifras calculadas sobre las operaciones de muestra de la demo; en tu diario salen las tuyas."
            : "Figures computed from the demo's sample trades; your journal shows your own."}
        </p>
      </div>
    </section>
  );
}
