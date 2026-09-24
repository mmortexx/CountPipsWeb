"use client";

import { useLang } from "@/lib/i18n";
import type { getCal, SetupResumen } from "@/lib/trading/fixtures";
import { nombreSetup } from "@/lib/trading/setups";
import { fmtInt, fmtMoney, fmtPct, fmtR } from "@/lib/trading/format";

/**
 * FeaturesBento — sección `#features`. Cinco fichas: calendario de P&L
 * (span 7), rendimiento por hora (span 5), playbooks, diario narrativo y
 * multi-cuenta.
 *
 * Cada una es una `.tj-ficha`: barra con el rótulo y su dato, cuerpo, y
 * por dentro filetes en vez de cajas. Antes llevaban un icono en un
 * cuadradito gris, filas en cajas rellenas, estados en chapa de color y
 * se levantaban al pasar el ratón: el vocabulario de una plantilla.
 */
/* R media por hora de la ficha «Rendimiento por hora» (null: sin
   operaciones). Una sola serie para las barras y para el texto: antes las
   barras eran alturas sueltas, resaltaban las 9:00 con la mejor ventana en
   las 10:00 y su barra más alta caía en las 14:00, una hora «a evitar». */
const HORAS_R: (number | null)[] = [
  null, null, null, null, null, null, 0.05, 0.12, 0.2, 0.3, 0.62, 0.48,
  0.1, 0.05, -0.8, 0.22, 0.15, -1.2, 0.08, 0.1, 0.02, -0.4, null, null,
];
const MEJOR_VENTANA = [10, 11];
/* El rótulo y la cifra salen de la serie: decían «10:00 – 11:30» y
   «+27 % sobre media», que no casaban con las barras resaltadas. */
const hora = (h: number) => `${String(h).padStart(2, "0")}:00`;
const VENTANA_ROTULO = `${hora(MEJOR_VENTANA[0])} – ${hora(MEJOR_VENTANA[MEJOR_VENTANA.length - 1] + 1)}`;
const VENTANA_R = MEJOR_VENTANA.reduce((s, h) => s + (HORAS_R[h] ?? 0), 0) / MEJOR_VENTANA.length;
const TOPE_POS = Math.max(...HORAS_R.map((v) => v ?? 0));
const TOPE_NEG = Math.max(...HORAS_R.map((v) => -(v ?? 0)));
const ZONA_POS = (TOPE_POS / (TOPE_POS + TOPE_NEG)) * 100;

/** `enPagina`: bajo un PageHeader que ya titula, la cabecera propia solo queda para lectores de pantalla. */
/** `cal`: el mes de muestra, calculado al construir para no generar las operaciones en el navegador. */
export function FeaturesBento({
  cal,
  setups,
  enPagina = false,
}: {
  cal: ReturnType<typeof getCal>;
  setups: SetupResumen[];
  enPagina?: boolean;
}) {
  const { lang } = useLang();
  const es = lang === "es";

  const rotulo = "text-[11px] font-medium uppercase tracking-[0.1em] text-tertiary tnum";
  const titulo = "m-0 text-[clamp(1.25rem,1.8vw,1.5rem)] leading-[1.25] text-primary [text-wrap:balance]";
  const division = "border-[var(--ficha-division)]";

  return (
    <section id="features" className="section relative overflow-clip">
      <div className="relative tj-container">
        <div className={enPagina ? "sr-only" : "max-w-[760px] mb-12"}>
          <p className="eyebrow m-0 mb-5">{es ? "Características" : "Features"}</p>
          <h2 className="t-h2 m-0 text-primary text-balance">
            {es ? (
              <>
                Todo lo que una mesa profesional espera de un <span className="text-gradient">diario</span>.
              </>
            ) : (
              <>
                Everything a professional desk expects from a <span className="text-gradient">journal</span>.
              </>
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Calendario (span 7) */}
          <article data-entra className="tj-ficha lg:col-span-7 min-w-0 flex flex-col">
            <p className="tj-ficha-barra">
              <span>{es ? "Calendario de P&L" : "P&L calendar"}</span>
              <span>{cal.label[lang]}</span>
            </p>
            <div className="tj-ficha-cuerpo flex-1 flex flex-col">
              {/* Las dos fichas de arriba van a la par: con el alto de dos
                  líneas reservado en el titular, lo de debajo empieza a la
                  misma altura en las dos. */}
              <h3 className={`${titulo} md:min-h-[2.5em]`}>{es ? "Cada día, en un vistazo" : "Every day, at a glance"}</h3>
              <div className="mt-4 grid grid-cols-7 gap-1.5 tnum text-[11px] tracking-[0.06em] text-tertiary" aria-hidden>
                {(es ? ["L", "M", "X", "J", "V", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"]).map((d, i) => (
                  <span key={i} className="text-center">
                    {d}
                  </span>
                ))}
              </div>
              <div className="mt-1.5 grid grid-cols-7 gap-1.5" data-dibuja>
                {cal.cells.map((c, i) => {
                  const diagonal = { "--i": (i % 7) + Math.floor(i / 7) } as React.CSSProperties;
                  const cellStyle = c.style ? { ...parseInlineStyle(c.style), padding: "4px", ...diagonal } : { padding: "4px", ...diagonal };
                  return (
                    <div key={i} className="tj-d-celda" style={cellStyle}>
                      {/* Tinta explícita, no opacidad: atenuado, el día bajaba
                          de 4,5:1 sobre la celda teñida. La jerarquía entre día
                          e importe la llevan el cuerpo y el peso. */}
                      <span className="tnum" style={{ fontSize: 11, color: "var(--ink)" }}>{c.day}</span>
                      <span className="tnum" style={{ fontSize: 11, fontWeight: 600, lineHeight: 1, color: "var(--ink)" }}>{c.val}</span>
                    </div>
                  );
                })}
              </div>
              <div className={`mt-auto pt-5`}>
                <div className={`flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t ${division} pt-4`}>
                <div>
                  <p className={`${rotulo} m-0`}>{es ? "Total del mes" : "Month total"}</p>
                  <p className="tnum m-0 mt-1 text-[22px] font-medium leading-none tracking-[-0.02em]" style={{ color: cal.pnlColor }}>
                    {cal.pnl[lang]}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {[
                    { c: "rgb(var(--pnl-pos) / var(--cal-tint-max))", l: es ? "≥ 60 $" : "≥ $60" },
                    { c: "rgb(var(--pnl-pos) / calc(var(--cal-tint-max) * 0.6))", l: es ? "20–60 $" : "$20–60" },
                    { c: "rgb(var(--pnl-pos) / calc(var(--cal-tint-max) * 0.35))", l: es ? "0–20 $" : "$0–20" },
                    { c: "rgb(var(--pnl-neg) / var(--cal-tint-max))", l: es ? "Negativo" : "Negative" },
                  ].map((g) => (
                    <span key={g.l} className="inline-flex items-center gap-1.5 tnum text-[11px] text-secondary">
                      <span className="inline-block rounded-[2px]" style={{ width: 9, height: 9, background: g.c }} />
                      {g.l}
                    </span>
                  ))}
                </div>
                </div>
              </div>
            </div>
          </article>

          {/* Rendimiento por hora (span 5) */}
          <article data-entra="2" className="tj-ficha lg:col-span-5 min-w-0 flex flex-col">
            <p className="tj-ficha-barra">
              <span>{es ? "Rendimiento por hora" : "Hourly performance"}</span>
              <span>24 h</span>
            </p>
            <div className="tj-ficha-cuerpo flex-1">
              <h3 className={`${titulo} md:min-h-[2.5em]`}>
                {es ? "Cuándo rindes y cuándo conviene parar" : "When you perform, and when to stop"}
              </h3>
              <div className="relative mt-5 flex gap-[3px]" style={{ height: 100 }} aria-hidden data-dibuja>
                <span className="absolute inset-x-0 h-px bg-[var(--ficha-division)]" style={{ top: `${ZONA_POS}%` }} />
                {HORAS_R.map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col">
                    <div className="flex items-end" style={{ height: `${ZONA_POS}%` }}>
                      {v !== null && v > 0 && (
                        <div
                          className="tj-d-sube w-full rounded-t-[1px]"
                          style={{
                            ["--i" as string]: i,
                            height: `${(v / TOPE_POS) * 100}%`,
                            background: MEJOR_VENTANA.includes(i) ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-pos) / 0.38)",
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      {v !== null && v < 0 && (
                        <div
                          className="tj-d-baja w-full rounded-b-[1px]"
                          style={{ ["--i" as string]: i, height: `${(-v / TOPE_NEG) * 100}%`, background: "rgb(var(--pnl-neg) / 0.8)" }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Eje de horas: sin él, 24 barras no dicen a qué hora cae el pico. */}
              <div className="flex items-center justify-between pt-1.5 tnum text-[11px] tracking-[0.06em] text-tertiary" aria-hidden>
                {["00", "06", "12", "18", "23"].map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>
              <p className="m-0 mt-1.5 text-[11px] text-tertiary">
                {es ? "R media de cada hora; sin barra, sin operaciones." : "Average R per hour; no bar, no trades."}
              </p>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <p className={`${rotulo} m-0`}>{es ? "Mejor ventana" : "Best window"}</p>
                  <p className="tnum m-0 mt-1 text-[17px] font-medium text-primary">{VENTANA_ROTULO}</p>
                </div>
                <span className="tnum text-[12px] text-tertiary">{`${fmtR(VENTANA_R, lang, 2)} ${es ? "de media" : "on average"}`}</span>
              </div>
              {/* La otra cara del dato —cuándo NO operar— es la que promete
                  el titular, y equilibra el alto con el calendario. */}
              <p className={`${rotulo} m-0 mt-6`}>{es ? "Ventanas a evitar" : "Windows to avoid"}</p>
              <ul className="m-0 mt-1 p-0 list-none">
                {[
                  { w: "14:00 – 15:00", n: es ? "18 ops" : "18 trades", r: fmtR(HORAS_R[14] ?? 0, lang, 1) },
                  { w: "17:00 – 18:00", n: es ? "11 ops" : "11 trades", r: fmtR(HORAS_R[17] ?? 0, lang, 1) },
                  { w: "21:00 – 22:00", n: es ? "7 ops" : "7 trades", r: fmtR(HORAS_R[21] ?? 0, lang, 1) },
                ].map((row) => (
                  <li key={row.w} className="tj-ficha-fila tnum text-[13px]">
                    <span className="text-secondary">{row.w}</span>
                    <span className="ml-auto text-[12px] text-tertiary">{row.n}</span>
                    <span className="min-w-[44px] text-right font-medium text-[rgb(var(--pnl-neg))]">{row.r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* Playbooks (span 4) */}
          <article data-entra="2" className="tj-ficha lg:col-span-4 min-w-0 flex flex-col">
            <p className="tj-ficha-barra">
              <span>Playbooks</span>
              <span>{fmtInt(setups.length, lang)} setups</span>
            </p>
            <div className="tj-ficha-cuerpo flex-1">
              <h3 className={titulo}>{es ? "Qué setups te dan ventaja y cuáles no" : "Which setups pay and which don’t"}</h3>
              {/* De la misma muestra que el calendario, de mejor a peor R
                  media. Era una maqueta con +2,1R por operación, una cifra
                  que ningún trader se cree. La barra es el acierto. */}
              <ul className="m-0 mt-3 p-0 list-none" data-dibuja>
                {setups.map((s, k) => {
                  const c = s.expectativaR > 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))";
                  return (
                    <li key={s.setup} className={`border-b ${division} py-3 last:border-b-0`}>
                      <div className="flex items-baseline gap-3 tnum text-[13px]">
                        <span className="font-medium text-primary">{nombreSetup(s.setup, lang)}</span>
                        <span className="ml-auto text-[12px] text-tertiary">
                          {fmtInt(s.n, lang)} {es ? "ops" : "trades"}
                        </span>
                        <span className="min-w-[48px] text-right font-medium" style={{ color: c }}>
                          {fmtR(s.expectativaR, lang, 2)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-[3px] flex-1 overflow-hidden rounded-[1px] bg-[var(--ficha-division)]">
                          <div className="tj-d-llena h-full" style={{ ["--i" as string]: k, width: `${Math.round(s.acierto * 100)}%`, background: c }} />
                        </div>
                        <span className="tnum min-w-[34px] text-right text-[12px] text-secondary">{fmtPct(s.acierto, lang, 0)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="m-0 mt-3 text-[11px] text-tertiary">
                {es ? "R media por operación; la barra, el acierto." : "Average R per trade; the bar, the win rate."}
              </p>
            </div>
          </article>

          {/* Diario narrativo (span 4) */}
          <article data-entra="3" className="tj-ficha lg:col-span-4 min-w-0 flex flex-col">
            <p className="tj-ficha-barra">
              <span>{es ? "Diario narrativo" : "Narrative journal"}</span>
              <span className="tnum">2026-07-15</span>
            </p>
            <div className="tj-ficha-cuerpo flex-1 flex flex-col">
              <h3 className={titulo}>{es ? "Lo que pasó, lo que sentiste" : "What happened, what you felt"}</h3>
              {/* Una nota del diario se compone como una cita impresa: en la
                  cursiva de la serif, sin franja de color al lado. `font-cursiva`
                  —y no `font-serif italic`— porque la cursiva es un fichero
                  aparte que solo se descarga aquí; ver la nota en globals.css. */}
              <blockquote className="m-0 mt-4 font-cursiva text-[17px] leading-[1.5] text-secondary">
                {es
                  ? "«Entré en NQ por ruptura del rango NY, pero moví el stop a +1R para “asegurar”. Error: el plan era aguantar a 2R. Terminé saliendo en BE después de que el precio llegó al objetivo sin mí.»"
                  : "“Entered NQ on NY range break, but moved stop to +1R to ‘be safe’. Mistake: the plan was to hold to 2R. I ended up exiting at BE after price hit the target without me.”"}
              </blockquote>
              <p className={`mt-auto mb-0 pt-5 flex items-center gap-2 border-t ${division} text-[12px] text-tertiary`}>
                <span className="tnum">14:42</span>
                <span aria-hidden>·</span>
                <span>{es ? "Nota post-trade" : "Post-trade note"}</span>
              </p>
            </div>
          </article>

          {/* Multi-cuenta (span 4) */}
          <article data-entra="4" className="tj-ficha lg:col-span-4 min-w-0 flex flex-col">
            <p className="tj-ficha-barra">
              <span>{es ? "Multi-cuenta" : "Multi-account"}</span>
              <span>{es ? "3 cuentas" : "3 accounts"}</span>
            </p>
            <div className="tj-ficha-cuerpo flex-1">
              <h3 className={titulo}>{es ? "Una cuenta o diez, en la misma vista" : "One account or ten, in the same view"}</h3>
              {/* El resultado se calcula del saldo y el capital inicial para
                  que no puedan contradecirse: la Topstep «aprobada» tiene
                  que pasar el +6 % de su plantilla. */}
              <ul className="m-0 mt-3 p-0 list-none tnum">
                {[
                  { name: "Apex 150k (#1)", inicial: 150000, saldo: 154820, status: es ? "En curso" : "In progress" },
                  { name: "Topstep 50k (#2)", inicial: 50000, saldo: 53240, status: es ? "Aprobada" : "Passed" },
                  { name: "IBKR Futures Core", inicial: 80000, saldo: 84190, status: es ? "Personal" : "Personal" },
                ].map((acc) => (
                  <li key={acc.name} className={`flex items-start justify-between gap-3 border-b ${division} py-3 last:border-b-0`}>
                    <div className="min-w-0">
                      <p className="m-0 truncate text-[13px] font-medium text-primary">{acc.name}</p>
                      <p className="m-0 mt-0.5 text-[12px] text-tertiary">{fmtMoney(acc.saldo, lang, { decimals: 0 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="m-0 text-[13px] font-medium text-[rgb(var(--pnl-pos))]">
                        {fmtMoney(acc.saldo - acc.inicial, lang, { decimals: 0, sign: true })}
                      </p>
                      <p className="m-0 mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-tertiary">{acc.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-3 text-[11px] text-tertiary">
                {es ? "Saldo y resultado desde la apertura de cada cuenta." : "Balance and result since each account opened."}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/**
 * Parsea un string estilo CSS inline (formato `"prop:val;prop:val"`) a un
 * objeto JS compatible con el `style` prop de React. Solo se usa para
 * los strings generados por `fixtures.ts` (background/borderRadius/
 * aspectRatio/display/etc.). Suficiente para los casos del calendario.
 */
function parseInlineStyle(s: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of s.split(";")) {
    const [k, v] = decl.split(":");
    if (!k || !v) continue;
    const key = k.trim();
    const val = v.trim();
    const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = val;
  }
  return out as React.CSSProperties;
}
