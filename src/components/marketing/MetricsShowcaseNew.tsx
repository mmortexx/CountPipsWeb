"use client";

import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { Lang } from "@/lib/i18n";
import { useLang } from "@/lib/i18n";
import { Escritorio } from "@/components/tj/Escritorio";
import type { CifrasMuestra } from "@/lib/trading/cifras-muestra";
import { fmtDate, fmtDiaMes, fmtMoney, fmtNum, fmtPct, fmtR } from "@/lib/trading/format";

/* Toda cifra sale de `cifrasMuestra()`, calculada al construir sobre las
   mismas operaciones deterministas de /demo. Nada escrito a mano. */

const W = 1000;
const H = 300;

function preparar(c: CifrasMuestra) {
  const BINS = c.bins;
  const TOTAL_BINS = Math.max(1, BINS.reduce((s, b) => s + b.count, 0));
  const MAX_BIN = Math.max(1, ...BINS.map((b) => b.count));
  const MODA = BINS.findIndex((b) => b.count === MAX_BIN);
  const R_LO = BINS[0]?.from ?? 0;
  const R_HI = BINS[BINS.length - 1]?.to ?? 1;
  const enR = (r: number) => Math.min(100, Math.max(0, ((r - R_LO) / (R_HI - R_LO || 1)) * 100));

  const INICIAL = c.inicial;
  const SALDOS = c.saldos;
  const TECHOS = c.techos;
  const FECHAS = c.fechas.map((t) => (t === null ? null : new Date(t)));
  const N = SALDOS.length;
  /* El eje X es de fechas, como en la app: el punto inicial toma la fecha de la primera operación. */
  const T = c.fechas.map((t, i) => t ?? c.fechas.find((x, j) => j > i && x !== null) ?? 0);
  const REND = SALDOS.map((v) => v - INICIAL);
  const TECHO_REND = TECHOS.map((v) => v - INICIAL);

  let VALLE = 0;
  let peor = 0;
  for (let i = 0; i < N; i++) {
    if (TECHOS[i] - SALDOS[i] > peor) {
      peor = TECHOS[i] - SALDOS[i];
      VALLE = i;
    }
  }
  let CIMA = VALLE;
  while (CIMA > 0 && SALDOS[CIMA] < TECHOS[VALLE] - 1e-6) CIMA--;

  return { BINS, TOTAL_BINS, MAX_BIN, MODA, R_LO, enR, INICIAL, SALDOS, TECHOS, FECHAS, N, T, REND, TECHO_REND, VALLE, CIMA, METRICS: c.m };
}

type Grafico = ReturnType<typeof preparar>;

type Vista = "curva" | "dist";
type Enfoque = "maxDd" | "expectancy" | "winRate" | null;

const acotar = (v: number, max: number) => Math.min(max, Math.max(0, v));

/** Flechas, Inicio/Fin y Mayús para saltar de diez en diez. */
function teclado(e: KeyboardEvent, actual: number | null, max: number, fijar: (v: number | null) => void) {
  const paso = e.shiftKey ? 10 : 1;
  const base = actual ?? max;
  const mapa: Record<string, number> = {
    ArrowLeft: base - paso,
    ArrowDown: base - paso,
    ArrowRight: base + paso,
    ArrowUp: base + paso,
    Home: 0,
    End: max,
  };
  if (e.key === "Escape") return fijar(null);
  if (!(e.key in mapa)) return;
  e.preventDefault();
  fijar(acotar(mapa[e.key], max));
}

function Lectura({ rotulo, cifra, detalle, tono }: { rotulo: string; cifra: string; detalle: string; tono?: string }) {
  return (
    <div className="tj-metricas-lectura" aria-live="polite">
      <span className="block truncate text-[12px] text-tertiary">{rotulo}</span>
      <span className="tnum mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="text-[clamp(1.5rem,2.6vw,2rem)] font-medium leading-none tracking-[-0.03em] text-primary">{cifra}</span>
        <span className="text-[13px] leading-tight" style={{ color: tono ?? "var(--ink-3)" }}>
          {detalle}
        </span>
      </span>
    </div>
  );
}

/** Marcas «redondas» del eje de dinero: pasos de 1, 2, 2,5 o 5 por potencia de diez. */
function marcasDinero(lo: number, hi: number, objetivo = 4) {
  const bruto = (hi - lo) / objetivo || 1;
  const mag = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((x) => x >= bruto) ?? bruto;
  const out: number[] = [];
  for (let v = Math.ceil(lo / paso) * paso; v <= hi + paso * 1e-6; v += paso) out.push(Math.round(v * 100) / 100);
  return out;
}

/** Día 1 y 15 de cada mes, como el eje de la app; si no caben, solo el día 1. */
function marcasFecha(t0: number, t1: number) {
  const out: number[] = [];
  const d = new Date(t0);
  for (let y = d.getUTCFullYear(), m = d.getUTCMonth(); Date.UTC(y, m, 1) <= t1; m++) {
    for (const dia of [1, 15]) {
      const t = Date.UTC(y, m, dia);
      if (t >= t0 && t <= t1) out.push(t);
    }
  }
  return out.length > 14 ? out.filter((t) => new Date(t).getUTCDate() === 1) : out;
}

type Series = { rend: boolean; balance: boolean };

/**
 * La curva del Resumen de la app: rendimiento acumulado desde 0 con halo y
 * punto final, balance en azul discontinuo, la caída sombreada en rojo, ejes
 * en «L» con dinero y fechas, rejilla solo horizontal y una casilla por serie.
 */
function Curva({ g, lang, es, enfoque }: { g: Grafico; lang: Lang; es: boolean; enfoque: Enfoque }) {
  const { INICIAL, SALDOS, TECHOS, FECHAS, N, T, REND, TECHO_REND, VALLE, CIMA, METRICS } = g;
  const [i, setI] = useState<number | null>(null);
  const [series, setSeries] = useState<Series>({ rend: true, balance: true });
  const k = i ?? N - 1;
  const saldo = SALDOS[k];
  const pnl = saldo - INICIAL;
  const dd = TECHOS[k] > 0 ? (TECHOS[k] - saldo) / TECHOS[k] : 0;
  const fecha = FECHAS[k];

  const geo = useMemo(() => {
    const visibles = [...(series.rend ? REND : []), ...(series.balance ? SALDOS : [])];
    const lo = Math.min(...visibles);
    const hi = Math.max(...visibles);
    const margen = (hi - lo || 1) * 0.06;
    const yMin = lo - margen;
    const yMax = hi + margen;
    const t0 = T[0];
    const t1 = T[N - 1];
    const px = (j: number) => (t1 > t0 ? ((T[j] - t0) / (t1 - t0)) * W : (j / Math.max(1, N - 1)) * W);
    const py = (v: number) => (1 - (v - yMin) / (yMax - yMin)) * H;
    const traza = (serie: number[]) => serie.map((v, j) => `${px(j).toFixed(1)},${py(v).toFixed(1)}`);
    return {
      px,
      py,
      rend: `M${traza(REND).join("L")}`,
      balance: `M${traza(SALDOS).join("L")}`,
      caida: `M${traza(TECHO_REND).join("L")}L${traza(REND).reverse().join("L")}Z`,
      marcasY: marcasDinero(yMin, yMax).filter((v) => v >= yMin && v <= yMax),
      marcasX: marcasFecha(t0, t1)
        .map((t) => ({ t, x: t1 > t0 ? ((t - t0) / (t1 - t0)) * 100 : 0 }))
        .filter(({ x }) => x <= 97),
    };
  }, [series, REND, SALDOS, TECHO_REND, T, N]);

  const alternar = (clave: keyof Series) =>
    setSeries((s) => {
      const siguiente = { ...s, [clave]: !s[clave] };
      return siguiente.rend || siguiente.balance ? siguiente : s;
    });

  const rotulo =
    i === null
      ? es
        ? `Saldo tras ${N - 1} operaciones`
        : `Balance after ${N - 1} trades`
      : k === 0
        ? es
          ? "Saldo inicial"
          : "Starting balance"
        : `${es ? "Operación" : "Trade"} ${k} ${es ? "de" : "of"} ${N - 1}${fecha ? ` · ${fmtDate(fecha, lang)}` : ""}`;

  const detalle =
    k === 0
      ? es
        ? "Punto de partida"
        : "Starting point"
      : `${es ? "Rendimiento" : "Performance"} ${fmtMoney(pnl, lang, { sign: true, compact: true })} · ${pnl >= 0 ? "+" : ""}${fmtPct(pnl / INICIAL, lang, 1)}${
          dd > 0.0005 ? ` · DD −${fmtPct(dd, lang, 1)}` : es ? " · en máximos" : " · at highs"
        }`;

  const mover = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = acotar((e.clientX - r.left) / r.width, 1) * W;
    let mejor = 0;
    for (let j = 1; j < N; j++) if (Math.abs(geo.px(j) - x) < Math.abs(geo.px(mejor) - x)) mejor = j;
    setI(mejor);
  };

  const verDd = enfoque === "maxDd";
  const xPct = (j: number) => `${(geo.px(j) / W) * 100}%`;
  const yPct = (v: number) => `${(geo.py(v) / H) * 100}%`;
  const leyenda: { clave: keyof Series; l: string }[] = [
    { clave: "rend", l: es ? "Rendimiento" : "Performance" },
    { clave: "balance", l: "Balance" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <Lectura rotulo={rotulo} cifra={fmtMoney(saldo, lang, { compact: true })} detalle={detalle} tono={pnl < 0 ? "rgb(var(--pnl-neg))" : undefined} />
        <div className="tj-curva-leyenda" role="group" aria-label={es ? "Series del gráfico" : "Chart series"}>
          {leyenda.map(({ clave, l }) => (
            <label key={clave} data-serie={clave}>
              <input type="checkbox" checked={series[clave]} onChange={() => alternar(clave)} />
              <span className="tj-curva-muestra" aria-hidden />
              {l}
            </label>
          ))}
        </div>
      </div>
      <div className="tj-curva">
        <div aria-hidden className="tj-curva-eje-y tnum">
          {geo.marcasY.map((v) => (
            <span key={v} style={{ top: yPct(v) }}>
              {fmtMoney(v, lang, { decimals: 0 })}
            </span>
          ))}
        </div>
        <div
          className="tj-metricas-lienzo tj-curva-lienzo"
          tabIndex={0}
          role="group"
          aria-label={
            es
              ? `Curva de rendimiento y balance de ${N - 1} operaciones de muestra: de ${fmtMoney(INICIAL, lang, { compact: true })} a ${fmtMoney(SALDOS[N - 1], lang, { compact: true })}, drawdown máximo −${fmtPct(METRICS.maxDrawdownPct, lang, 1)}. Usa las flechas para recorrerla.`
              : `Performance and balance curve of ${N - 1} sample trades: from ${fmtMoney(INICIAL, lang, { compact: true })} to ${fmtMoney(SALDOS[N - 1], lang, { compact: true })}, max drawdown −${fmtPct(METRICS.maxDrawdownPct, lang, 1)}. Use the arrow keys to explore.`
          }
          data-activo={i !== null ? "true" : undefined}
          onPointerMove={mover}
          onPointerDown={mover}
          onPointerLeave={() => setI(null)}
          onKeyDown={(e) => teclado(e, i, N - 1, setI)}
          onBlur={() => setI(null)}
        >
          {geo.marcasY.map((v) => (
            <span key={v} aria-hidden className="tj-curva-rejilla" style={{ top: yPct(v) }} />
          ))}
          <div
            aria-hidden
            className="tj-metricas-banda"
            data-visible={verDd && series.rend ? "true" : undefined}
            style={{ left: xPct(CIMA), width: `${((geo.px(VALLE) - geo.px(CIMA)) / W) * 100}%` }}
          >
            <span className="tnum">
              {es ? "Drawdown máx." : "Max drawdown"} −{fmtPct(METRICS.maxDrawdownPct, lang, 1)}
            </span>
          </div>
          <svg aria-hidden className="tj-metricas-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            {series.rend && (
              <>
                <path d={geo.caida} className="tj-metricas-agua" data-visible={verDd ? "true" : undefined} />
                <path d={geo.rend} className="tj-curva-halo" vectorEffect="non-scaling-stroke" />
                <path d={geo.rend} className="tj-metricas-linea" vectorEffect="non-scaling-stroke" />
              </>
            )}
            {series.balance && <path d={geo.balance} className="tj-curva-balance" vectorEffect="non-scaling-stroke" />}
          </svg>
          <span aria-hidden className="tj-metricas-guia" style={{ left: xPct(k) }} data-visible={i !== null ? "true" : undefined} />
          {series.rend && <span aria-hidden className="tj-metricas-punto" style={{ left: xPct(k), top: yPct(REND[k]) }} />}
          {series.balance && (i !== null || !series.rend) && (
            <span aria-hidden className="tj-metricas-punto tj-curva-punto-balance" style={{ left: xPct(k), top: yPct(SALDOS[k]) }} />
          )}
        </div>
        <div aria-hidden className="tj-curva-eje-x tnum">
          {geo.marcasX.map(({ t, x }) => (
            <span key={t} style={{ left: `${x}%` }}>
              {fmtDiaMes(new Date(t), lang)}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

function Distribucion({ g, lang, es, enfoque }: { g: Grafico; lang: Lang; es: boolean; enfoque: Enfoque }) {
  const { BINS, TOTAL_BINS, MAX_BIN, MODA, R_LO, enR, METRICS } = g;
  const [i, setI] = useState<number | null>(null);
  const b = i === null ? null : BINS[i];
  const acumulado = i === null ? 0 : BINS.slice(0, i + 1).reduce((s, x) => s + x.count, 0);
  const rango = (x: (typeof BINS)[number], y = es ? "a" : "to") => `${fmtR(x.from, lang, 1)} ${y} ${fmtR(x.to, lang, 1)}`;
  const ops = (n: number) => (es ? `${n} ${n === 1 ? "operación" : "operaciones"}` : `${n} ${n === 1 ? "trade" : "trades"}`);

  const lectura = b
    ? {
        rotulo: `${es ? "Resultado entre" : "Result between"} ${rango(b, es ? "y" : "and")}`,
        cifra: ops(b.count),
        detalle: `${fmtPct(b.count / TOTAL_BINS, lang, 1)} ${es ? "de la muestra" : "of the sample"} · ${fmtPct(acumulado / TOTAL_BINS, lang, 0)} ${es ? "acumulado" : "cumulative"}`,
        tono: undefined,
      }
    : {
        rotulo: es ? "Esperanza por operación" : "Expectancy per trade",
        cifra: fmtR(METRICS.expectancyR, lang, 2),
        detalle: `${es ? "Moda de" : "Mode"} ${MODA >= 0 ? rango(BINS[MODA]) : "—"} · ${ops(TOTAL_BINS)}`,
        tono: undefined,
      };

  const verE = enfoque === "expectancy" || i === null;

  return (
    <>
      <Lectura {...lectura} />
      <div
        className="tj-metricas-lienzo"
        tabIndex={0}
        role="group"
        aria-label={
          (es
            ? `Distribución de R-múltiplo de ${TOTAL_BINS} operaciones de muestra: `
            : `R-multiple distribution of ${TOTAL_BINS} sample trades: `) +
          BINS.map((x) => `${rango(x)}, ${ops(x.count)}`).join("; ") +
          (es ? ". Usa las flechas para recorrerla." : ". Use the arrow keys to explore.")
        }
        data-activo={i !== null ? "true" : undefined}
        onPointerLeave={() => setI(null)}
        onKeyDown={(e) => teclado(e, i, BINS.length - 1, setI)}
        onBlur={() => setI(null)}
      >
        <span aria-hidden className="tj-metricas-cero" style={{ left: `${enR(0)}%` }} />
        <span
          aria-hidden
          className="tj-metricas-esperanza"
          data-visible={verE ? "true" : undefined}
          data-enfoque={enfoque === "expectancy" ? "true" : undefined}
          style={{ left: `${enR(METRICS.expectancyR)}%` }}
        >
          <span className="tnum">E(R)</span>
        </span>
        <div aria-hidden className="tj-metricas-barras" style={{ gridTemplateColumns: `repeat(${BINS.length}, minmax(0, 1fr))` }}>
          {BINS.map((x, j) => {
            const atenuada = (i !== null && i !== j) || (enfoque === "winRate" && x.losing);
            return (
              <div key={x.from} className="tj-metricas-columna" onPointerEnter={() => setI(j)} onPointerDown={() => setI(j)}>
                <span
                  className="tj-metricas-barra"
                  data-signo={x.losing ? "neg" : "pos"}
                  data-activa={i === j ? "true" : undefined}
                  data-atenuada={atenuada ? "true" : undefined}
                  style={{ height: x.count ? `${Math.max(2, (x.count / MAX_BIN) * 88)}%` : "2px", ["--j" as string]: j }}
                >
                  <span className="tj-metricas-cuenta tnum" data-visible={i === j || (i === null && j === MODA) ? "true" : undefined}>
                    {i === j ? x.count : es ? "Moda" : "Mode"}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div aria-hidden className="tj-metricas-eje tj-metricas-eje--bordes tnum">
        {[R_LO, ...BINS.map((x) => x.to)].map((r, j) => (
          <span key={r} style={{ left: `${enR(r)}%` }} data-activa={i !== null && (j === i || j === i + 1) ? "true" : undefined}>
            {fmtR(r, lang, 1)}
          </span>
        ))}
      </div>
    </>
  );
}

/**
 * Las cifras de la operativa de muestra en un panel de cristal: curva de
 * capital y distribución de R recorribles con el ratón, el dedo o el
 * teclado, y los ratios debajo. Al pasar por Max DD, E(R) o Ganadoras el
 * gráfico señala de dónde sale la cifra.
 *
 * `enPortada`: va dentro del hero, sin sección propia.
 * `enPagina`: bajo un PageHeader que ya titula, el título queda para lectores de pantalla.
 */
export function MetricsShowcaseNew({ cifras, enPagina = false, enPortada = false }: { cifras: CifrasMuestra; enPagina?: boolean; enPortada?: boolean }) {
  const g = useMemo(() => preparar(cifras), [cifras]);
  const { METRICS } = g;
  const { lang } = useLang();
  const es = lang === "es";
  const [vista, setVista] = useState<Vista>("curva");
  const [enfoque, setEnfoque] = useState<Enfoque>(null);
  const id = useId();

  const vistas: { id: Vista; l: string }[] = [
    { id: "curva", l: es ? "Curva de capital" : "Equity curve" },
    { id: "dist", l: es ? "Distribución de R" : "R distribution" },
  ];

  const ratios: { id: string; l: string; v: string; f: string; d: string; c?: string; enlaza?: Enfoque }[] = [
    { id: "sharpe", l: "Sharpe", v: fmtNum(METRICS.sharpe, lang, 2), f: "μ / σ", d: es ? "Retorno por unidad de volatilidad." : "Return per unit of volatility." },
    { id: "sortino", l: "Sortino", v: fmtNum(METRICS.sortino, lang, 2), f: "μ / σ↓", d: es ? "Sólo penaliza la volatilidad bajista." : "Penalizes downside volatility only." },
    { id: "omega", l: "Omega", v: fmtNum(METRICS.omega, lang, 2), f: es ? "Σ ganancias / Σ pérdidas" : "Σ gains / Σ losses", d: es ? "Pondera la distribución entera." : "Weighs the whole distribution." },
    { id: "calmar", l: "Calmar", v: fmtNum(METRICS.calmar, lang, 2), f: "CAGR / MaxDD", d: es ? "Rendimiento anual frente a la peor caída." : "Annual return against the worst fall." },
    {
      id: "expectancy",
      l: es ? "Esperanza" : "Expectancy",
      v: fmtR(METRICS.expectancyR, lang, 2),
      f: "WR·W̄ − (1−WR)·L̄",
      d: es ? "Lo que deja cada operación, en R." : "What each trade leaves, in R.",
      c: METRICS.expectancyR >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
      enlaza: "expectancy",
    },
    {
      id: "maxDd",
      l: "Max drawdown",
      v: `−${fmtPct(METRICS.maxDrawdownPct, lang, 1)}`,
      f: es ? "(pico − valle) / pico" : "(peak − trough) / peak",
      d: es ? "La peor caída de pico a valle." : "The worst peak-to-trough fall.",
      c: "rgb(var(--pnl-neg))",
      enlaza: "maxDd",
    },
    { id: "winRate", l: es ? "Ganadoras" : "Win rate", v: fmtPct(METRICS.winRate, lang, 1), f: es ? "G / N" : "W / N", d: es ? "Operaciones cerradas en beneficio." : "Trades closed in profit.", enlaza: "winRate" },
    { id: "payoff", l: "Payoff", v: fmtNum(METRICS.payoff, lang, 2), f: "W̄ / L̄", d: es ? "Ganancia media frente a pérdida media." : "Average win against average loss." },
  ];

  const pista: Record<Exclude<Enfoque, null>, Vista> = { maxDd: "curva", expectancy: "dist", winRate: "dist" };

  /* 32 px y no `t-h2` (48): esto titula un panel dentro de la portada, no una
     sección, y al tamaño de sección competiría con el titular del hero. Es la
     única excepción a la escala en toda la web de marketing. */
  const titulo = (
    <h2
      className={enPagina ? "sr-only" : "m-0 font-serif text-[clamp(1.5rem,2.4vw,2rem)] font-normal leading-[1.12] tracking-[-0.02em] text-primary text-balance"}
    >
      {es ? "Las cifras que usan los que viven de esto." : "The numbers used by people who trade for a living."}
    </h2>
  );

  const contenido = (
    <div className="relative">
      <Escritorio className="tj-escritorio--ancho" />
      <div className="tj-cristal tj-metricas relative">
        <p className="tj-ficha-barra">
          <span>{es ? "Operativa de muestra" : "Sample track record"}</span>
          <span className="tnum">
            {es ? `${METRICS.closedCount} operaciones · USD` : `${METRICS.closedCount} trades · USD`}
          </span>
        </p>
        <div className="tj-ficha-cuerpo">
        <div className={`flex flex-col gap-5 md:flex-row md:justify-between ${enPagina ? "md:items-center" : "md:items-end"}`}>
          <div className={enPagina ? "" : "max-w-[46rem]"}>
            {titulo}
            {enPagina && (
              <p className="m-0 text-[13px] font-medium text-tertiary">
                {es ? "Muestra de la demo · curva, reparto de R y ratios" : "Demo sample · curve, R distribution and ratios"}
              </p>
            )}
            {!enPagina && (
              <p className="m-0 mt-2 text-[14px] leading-[1.55] text-secondary">
                {es ? "Ratios con su muestra, no gráficos bonitos. " : "Ratios with their sample, not pretty charts. "}
                <span className="[@media(hover:none)]:hidden">
                  {es ? "Pasa el ratón por la curva, las barras o las cifras." : "Hover the curve, the bars or the figures."}
                </span>
                <span className="hidden [@media(hover:none)]:inline">
                  {es ? "Desliza el dedo por la curva o toca las barras." : "Slide a finger along the curve or tap the bars."}
                </span>
              </p>
            )}
          </div>
          <div role="tablist" aria-label={es ? "Vista del gráfico" : "Chart view"} className="tj-pestanas flex-none">
            {vistas.map((v) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                id={`${id}-${v.id}`}
                aria-selected={vista === v.id}
                aria-controls={`${id}-panel`}
                tabIndex={vista === v.id ? 0 : -1}
                onClick={() => setVista(v.id)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                    e.preventDefault();
                    const otra = vista === "curva" ? "dist" : "curva";
                    setVista(otra);
                    document.getElementById(`${id}-${otra}`)?.focus();
                  }
                }}
              >
                {v.l}
              </button>
            ))}
          </div>
        </div>

        <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${vista}`} className="tj-metricas-vista" key={vista}>
          {vista === "curva" ? <Curva g={g} lang={lang} es={es} enfoque={enfoque} /> : <Distribucion g={g} lang={lang} es={es} enfoque={enfoque} />}
        </div>
        </div>

        <ul className="tj-metricas-ratios tj-matriz">
          {ratios.map((m) => {
            const activa = m.enlaza && enfoque === m.enlaza && pista[m.enlaza] === vista;
            return (
              <li
                key={m.id}
                className="tj-metricas-ratio"
                data-enfoque={activa ? "true" : undefined}
                tabIndex={m.enlaza ? 0 : undefined}
                onPointerEnter={() => m.enlaza && setEnfoque(m.enlaza)}
                onPointerLeave={() => m.enlaza && setEnfoque(null)}
                onFocus={() => m.enlaza && setEnfoque(m.enlaza)}
                onBlur={() => m.enlaza && setEnfoque(null)}
              >
                <span className="block truncate text-[11px] uppercase tracking-[0.08em] text-tertiary">{m.l}</span>
                <span className="tnum mt-1.5 block text-[clamp(1.25rem,1.9vw,1.5rem)] font-medium leading-none tracking-[-0.02em]" style={{ color: m.c ?? "var(--ink)" }}>
                  {m.v}
                </span>
                <span className="tj-metricas-pie mt-1.5 text-[12px] leading-snug text-tertiary">
                  <span>{m.d}</span>
                  <span className="tj-metricas-formula font-mono text-[11px]" aria-hidden>
                    {m.f}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="tj-ficha-barra tj-ficha-barra--pie">
          {es
            ? `Calculado sobre las ${METRICS.closedCount} operaciones de muestra de la demo, no sobre cuentas reales. Sharpe anualizado.`
            : `Computed over the demo's ${METRICS.closedCount} sample trades, not live accounts. Sharpe is annualized.`}
        </p>
      </div>
    </div>
  );

  if (enPortada) {
    return (
      <div id="metrics" className="scroll-mt-24">
        {contenido}
      </div>
    );
  }

  return (
    <section id="metrics" className="section relative scroll-mt-24">
      <div className="tj-container">{contenido}</div>
    </section>
  );
}
