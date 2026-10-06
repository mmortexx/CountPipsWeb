"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Viajero } from "../Viajero";
import { useLang } from "@/lib/i18n";
import {
  TRADES,
  METRICS,
  INSTRUMENTS,
  SETUP_NAMES,
  nombreSetup,
  INITIAL_BALANCE_CONST,
  getInstrumentMultiplier,
  nivelDisciplina,
  type Direction,
  type Metrics,
} from "@/lib/trading/data";
import { addTrade, useAllTrades } from "@/lib/trading/demoStore";
import { useToast } from "@/hooks/use-toast";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTeclaMando } from "@/hooks/use-tecla-mando";
import { cifraEditable, fmtInt, fmtNum, fmtOperaciones, fmtPct, fmtR, leeCifra, LOCALE_FECHA } from "@/lib/trading/format";
import { Reveal } from "@/components/tj/Reveal";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Money } from "@/components/tj/Money";
import { EquityCurve } from "@/components/charts/EquityCurve";
import { MiniCalendar } from "@/components/charts/MiniCalendar";
import { AssetMark } from "@/components/demo/AssetMark";
import { useDemo } from "@/components/demo/DemoContext";
import { moverConFlechas } from "@/lib/flechas";

// Ventanas de la curva de capital: últimos N días. La muestra cubre ~180, así que «6M» equivale a todo.
type Timeframe = "1M" | "3M" | "6M";
const TIMEFRAMES: Timeframe[] = ["1M", "3M", "6M"];
const TF_DAYS: Record<Timeframe, number> = { "1M": 30, "3M": 90, "6M": 180 };

// Una sola fuente para el `slice` y para el rótulo «Últimas N operaciones».
const RECENT_TRADES_COUNT = 6;

/** Riesgo de partida del registro rápido: el que se supone sin stop ni
 *  cantidad, el que usa «Calcular tamaño» y el umbral del aviso ámbar. */
const RIESGO_POR_DEFECTO = 0.01;

/** Recorta las métricas a los últimos N días manteniendo sincronizados
 *  equityCurve y drawdownCeiling. Devuelve el mismo objeto si el recorte
 *  quedaría vacío o abarcaría todo. */
function sliceMetricsByDays(m: Metrics, days: number): Metrics {
  if (!m.equityCurve.length) return m;
  const last = m.equityCurve[m.equityCurve.length - 1].date.getTime();
  const cutoff = last - days * 86_400_000;
  let startIdx = 0;
  for (let i = 0; i < m.equityCurve.length; i++) {
    if (m.equityCurve[i].date.getTime() >= cutoff) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === 0) return m;
  const equityCurve = m.equityCurve.slice(startIdx);
  const drawdownCeiling = m.drawdownCeiling.slice(startIdx);
  return { ...m, equityCurve, drawdownCeiling };
}

const inputCls =
  /* `min-w-0` aquí vale para todos los campos: un `<input>` trae ancho
     intrínseco y, como hijo de rejilla, su `min-width:auto` impide
     encoger la celda (a 320 px se salía 14 px). */
  "w-full min-w-0 bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-[2px] h-9 px-3 text-sm text-primary tnum placeholder:text-tertiary focus:border-[rgb(var(--divider)/0.2)] focus:bg-[rgb(var(--divider)/0.08)] transition-colors appearance-none";
const labelCls =
  "block text-[11px] uppercase tracking-[0.15em] text-tertiary mb-1.5";

/**
 * Página «Resumen» de la demo, reflejo de DashboardPage.xaml de la app.
 * Arriba el registro de operación (captura a la izquierda, datos a la
 * derecha); debajo el rendimiento: parte de hoy, KPI, aviso de realidad,
 * curva de capital y calendario.
 */
export function DashboardPage() {
  const { t, lang } = useLang();
  const { toast } = useToast();
  const { goDetail, setPage } = useDemo();
  const es = lang === "es";
  const mando = useTeclaMando();

  const [tfSel, setTfSel] = useState<Timeframe>("6M");
  const slicedMetrics = useMemo(
    () => sliceMetricsByDays(METRICS, TF_DAYS[tfSel]),
    [tfSel]
  );

  // useAllTrades se suscribe a localStorage: lo registrado arriba aparece aquí al instante.
  const allTrades = useAllTrades(TRADES);
  const recentTrades = useMemo(
    () => allTrades.slice(0, RECENT_TRADES_COUNT),
    [allTrades]
  );

  const [direction, setDirection] = useState<Direction>("long");
  const [instrumentSymbol, setInstrumentSymbol] = useState(INSTRUMENTS[0].symbol);
  const [setupName, setSetupName] = useState<string>(SETUP_NAMES[1]);
  /* Los precios se escriben y leen en el idioma de la página («21500,00»).
     Con `toFixed`/`parseFloat` salía el punto inglés y «1,08» se leía como 1. */
  const precio = (n: number, dec: number) => cifraEditable(n, lang, dec, dec);
  const num = (s: string) => leeCifra(s) ?? Number.NaN;
  const [entry, setEntry] = useState<string>(
    precio(INSTRUMENTS[0].basePrice, INSTRUMENTS[0].decimals)
  );
  const [stop, setStop] = useState<string>(
    precio(INSTRUMENTS[0].basePrice * 0.992, INSTRUMENTS[0].decimals)
  );
  const [exitPrice, setExitPrice] = useState<string>(
    precio(INSTRUMENTS[0].basePrice * 1.018, INSTRUMENTS[0].decimals)
  );
  const [target, setTarget] = useState<string>(
    precio(INSTRUMENTS[0].basePrice * 1.024, INSTRUMENTS[0].decimals)
  );
  const [quantity, setQuantity] = useState<string>("1");
  const [note, setNote] = useState<string>("");
  const [advanced, setAdvanced] = useState(false);

  const inst =
    INSTRUMENTS.find((i) => i.symbol === instrumentSymbol) ?? INSTRUMENTS[0];

  const entryNum = num(entry) || 0;
  const stopNum = num(stop) || 0;
  const targetNum = num(target) || 0;
  const qtyNum = num(quantity) || 0;

  const stopDist = Math.abs(entryNum - stopNum);
  // R:R planificado = |objetivo − entrada| / |entrada − stop|.
  const plannedRr = stopDist > 0 ? Math.abs(targetNum - entryNum) / stopDist : 0;

  // Riesgo en $: distancia al stop × cantidad × multiplicador; sin stop o
  // cantidad válidos, el riesgo por defecto sobre el saldo inicial.
  const riskUsdLive = useMemo(() => {
    if (stopDist > 0 && qtyNum > 0) {
      const multiplier = getInstrumentMultiplier(instrumentSymbol, inst.assetClass);
      return stopDist * qtyNum * multiplier;
    }
    return INITIAL_BALANCE_CONST * RIESGO_POR_DEFECTO;
  }, [stopDist, qtyNum, instrumentSymbol, inst.assetClass]);

  const riskPct = INITIAL_BALANCE_CONST > 0 ? riskUsdLive / INITIAL_BALANCE_CONST : 0;

  function handleRegister() {
    const entryN = num(entry);
    const stopN = num(stop);
    const exitParsed = num(exitPrice);
    // Sin salida se usa la entrada: queda una operación en tablas (P&L = 0, R = 0), no NaN.
    const exitN = Number.isFinite(exitParsed) ? exitParsed : entryN;
    const qtyN = num(quantity);

    if (
      !Number.isFinite(entryN) ||
      entryN <= 0 ||
      !Number.isFinite(stopN) ||
      stopN <= 0 ||
      entryN === stopN
    ) {
      toast({
        title: t("tradeRegisterError"),
        description: t("tradeRegisterErrorDesc"),
        variant: "destructive",
      });
      return;
    }

    // priceDiff lleva signo: positivo si el movimiento gana.
    const stopDistLocal = Math.abs(entryN - stopN);
    const priceDiff =
      direction === "long" ? exitN - entryN : entryN - exitN;
    const rMultiple = stopDistLocal > 0 ? +(priceDiff / stopDistLocal).toFixed(2) : 0;

    // Mismo multiplicador por clase de activo que demoStore.ts.
    const multiplier = getInstrumentMultiplier(instrumentSymbol, inst.assetClass);
    const safeQty = Number.isFinite(qtyN) && qtyN > 0 ? qtyN : 1;
    const netPnl = +(priceDiff * safeQty * multiplier).toFixed(2);

    addTrade({
      instrument: instrumentSymbol,
      setup: setupName as (typeof SETUP_NAMES)[number],
      direction,
      entry: +entryN.toFixed(inst.decimals),
      exit: +exitN.toFixed(inst.decimals),
      qty: +safeQty.toFixed(inst.assetClass === "forex" ? 2 : 3),
      netPnl,
      rMultiple,
      // Con stop definido se da por seguido el plan.
      compliance: "yes",
      closedAt: new Date().toISOString(),
      note: note.trim(),
    });

    setNote("");

    toast({
      title: t("tradeRegistered"),
      description: t("tradeRegisteredDesc"),
    });
  }

  function selectInstrument(sym: string) {
    const next = INSTRUMENTS.find((i) => i.symbol === sym);
    if (!next) return;
    setInstrumentSymbol(sym);
    setEntry(precio(next.basePrice, next.decimals));
    setStop(precio(next.basePrice * 0.992, next.decimals));
    setExitPrice(precio(next.basePrice * 1.018, next.decimals));
    setTarget(precio(next.basePrice * 1.024, next.decimals));
  }

  // Operaciones registradas en esta sesión (las que no son de la muestra).
  const sessionCount = allTrades.length - TRADES.length;

  return (
    <div className="p-5 md:p-6 space-y-8 relative">
      <section className="relative">
        {/* Por debajo de `sm` titular y cifra se apilan: en fila, a 320 px la
            cifra de 28 px deja 100 px al titular y «operado» se salía 35 px.
            La lectura queda debajo como tira de rótulo e importe con filete. */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <Reveal delay={0}>
              <Eyebrow>{t("captureEyebrow")}</Eyebrow>
            </Reveal>
            <Reveal delay={0.04}>
              {/* h2 y no h1: es una pantalla simulada dentro de la página de la
                  demo, cuyo h1 es el del documento; dos h1 rompen la jerarquía. */}
              <h2 className="mt-2 font-medium tracking-[-0.02em] text-primary text-2xl md:text-[28px] leading-tight">
                {t("captureHeadline")}
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.08}>
            {/* La región viva es el contenedor, que no cambia: la cifra se
                remonta en cada valor (por su `key`) y una región que nace
                ya rellena no la anuncian los lectores de pantalla. */}
            <div
              aria-live="polite"
              aria-atomic="true"
              className="flex items-baseline justify-between gap-3 border-t border-[rgb(var(--divider)/0.12)] pt-2.5 sm:block sm:shrink-0 sm:border-0 sm:pt-0 sm:text-right"
            >
              <div className="text-[11px] uppercase tracking-[0.15em] text-tertiary">
                {t("riskUsd")}
              </div>
              <div
                key={`risk-${riskUsdLive.toFixed(2)}`}
                /* En la tira apilada: 22 px y sin margen, comparte línea con el rótulo. */
                className="tj-dm-entra text-[22px] font-semibold leading-none tnum text-primary sm:mt-1 sm:text-[28px]"
                style={{ "--dm-o": 0.55, "--dm-y": "3px", "--dm-dur": "0.35s" } as CSSProperties}
              >
                <Money value={riskUsdLive} />
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div
            className="demo-card p-5 md:p-6 relative overflow-hidden"
          >
            <div className="relative z-10">
              {/* <form> real: Enter envía desde cualquier campo, se expone como
                  landmark y el autocompletado tiene contexto. Los demás botones
                  llevan type="button"; solo Registrar es submit. */}
              <form
                className="contents"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegister();
                }}
              >
              {/* `min-w-0` y `minmax(0,1fr)` no son cosméticos: un hijo de rejilla
                  trae `min-width:auto` y no encoge bajo su contenido. A 390 px la
                  tarjeta (`overflow:hidden`) cortaba 39 px de la columna derecha
                  sin que consola ni tests lo notaran. Lo vigila `humo.mjs`. */}
              <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="flex flex-col min-w-0">
                  {/* Zona de captura de altura fija, independiente del formulario.
                      La demo no pega imágenes: solo muestra el flujo. */}
                  <button
                    type="button"
                    aria-label={t("dropScreens")}
                    // Altura: 104 px en móvil (con 260 el primer control del
                    // formulario quedaba fuera de la vista), 320 en sm y 380 en
                    // md+, como en la app.
                    className="w-full border border-dashed border-[rgb(var(--divider)/0.15)] rounded-[2px] flex flex-col items-center justify-center gap-2 text-tertiary hover:text-secondary hover:border-[rgb(var(--divider)/0.3)] hover:bg-[rgb(var(--divider)/0.05)] transition-colors group h-[104px] sm:h-[320px] md:h-[380px]"
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span className="text-sm font-medium text-secondary text-center px-6">
                      {t("dropScreens")}
                    </span>
                    {/* La pista de Ctrl+V solo donde el atajo existe: un teléfono no
                        tiene Ctrl ni arrastrar ficheros. */}
                    <span className="hidden sm:block text-[11px] text-tertiary text-center px-6">
                      {es
                        ? "Pega con Ctrl+V o arrastra una imagen del gráfico"
                        : "Paste with Ctrl+V or drag a chart image"}
                    </span>
                  </button>

                  <div className="mt-4 pt-4 border-t border-[rgb(var(--divider)/0.1)]">
                    <div className="text-[11px] uppercase tracking-[0.15em] text-tertiary mb-3">
                      {es ? "Riesgo de esta operación" : "Trade risk"}
                    </div>
                    {/* `minmax(0,1fr)` y no `1fr`, que no encoge bajo su contenido: a
                        390 px el «5,20 %» se salía de la tarjeta. El gap baja a 8 px en
                        móvil porque cuatro huecos de 16 se comían 64 de 224 px. */}
                    <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)] gap-x-2 sm:gap-x-4 items-stretch">
                      <div className="flex flex-col items-center justify-center gap-1 text-center py-1 rounded-[2px] transition-colors hover:bg-[rgb(var(--divider)/0.03)]">
                        <div className="text-[10px] uppercase tracking-[0.12em] text-tertiary">
                          {t("riskUsd")}
                        </div>
                        <Money
                          value={riskUsdLive}
                          className="text-lg font-semibold text-primary"
                        />
                      </div>
                      <div
                        className="self-stretch w-px bg-[rgb(var(--divider)/0.12)]"
                        aria-hidden="true"
                      />
                      <div className="flex flex-col items-center justify-center gap-1 text-center py-1 rounded-[2px] transition-colors hover:bg-[rgb(var(--divider)/0.03)]">
                        <div className="text-[10px] uppercase tracking-[0.12em] text-tertiary">
                          {t("rr")}
                        </div>
                        <span
                          className={`text-lg font-semibold tnum ${
                            plannedRr >= 2
                              ? "text-pnl-pos"
                              : plannedRr >= 1
                              ? "text-pnl-warn"
                              : "text-pnl-neg"
                          }`}
                        >
                          {fmtNum(plannedRr, lang, 2)}&nbsp;R
                        </span>
                      </div>
                      <div
                        className="self-stretch w-px bg-[rgb(var(--divider)/0.12)]"
                        aria-hidden="true"
                      />
                      <div className="flex flex-col items-center justify-center gap-1 text-center py-1 rounded-[2px] transition-colors hover:bg-[rgb(var(--divider)/0.03)]">
                        <div className="text-[10px] uppercase tracking-[0.12em] text-tertiary">
                          {es ? "% cuenta" : "% acct"}
                        </div>
                        <span
                          className={`text-lg font-semibold tnum ${
                            riskPct > 0.02
                              ? "text-pnl-neg"
                              : riskPct > RIESGO_POR_DEFECTO
                              ? "text-pnl-warn"
                              : "text-pnl-pos"
                          }`}
                        >
                          {fmtPct(riskPct, lang, 2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-0">
                  <div>
                    <span className={labelCls}>
                      {es ? "Dirección" : "Direction"}
                    </span>
                    <div
                      className="grid grid-cols-2 gap-2"
                      role="radiogroup"
                      aria-label={es ? "Dirección" : "Direction"}
                    >
                      {(["long", "short"] as Direction[]).map((d, i, dirs) => {
                        const active = direction === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            tabIndex={active ? 0 : -1}
                            onClick={() => setDirection(d)}
                            onKeyDown={(e) => moverConFlechas(e, i, (j) => setDirection(dirs[j]))}
                            className={`relative h-11 rounded-[2px] border text-sm font-medium transition-colors ${
                              active
                                ? d === "long"
                                  ? "bg-pnl-pos/15 border-pnl-pos/40 text-primary"
                                  : "bg-pnl-neg/15 border-pnl-neg/40 text-primary"
                                : "bg-[rgb(var(--divider)/0.05)] border-[rgb(var(--divider)/0.1)] text-tertiary hover:text-secondary hover:border-[rgb(var(--divider)/0.2)]"
                            }`}
                          >
                            {active && (
                              <Viajero
                                clave="dir-pill"
                                className={`absolute inset-0 rounded-[2px] ${
                                  d === "long"
                                    ? "bg-pnl-pos/15 border border-pnl-pos/40"
                                    : "bg-pnl-neg/15 border border-pnl-neg/40"
                                }`}
                              />
                            )}
                            <span className="relative flex items-center justify-center gap-2">
                              <span
                                style={{
                                  transform: active ? "scale(1.15)" : "none",
                                  boxShadow: active
                                    ? d === "long"
                                      ? "0 0 8px 1px rgb(var(--pnl-pos) / 0.6)"
                                      : "0 0 8px 1px rgb(var(--pnl-neg) / 0.6)"
                                    // Transparente desde --sombra, no negro puro: algunos
                                    // navegadores tiñen de gris el degradado.
                                    : "0 0 0px 0px rgb(var(--sombra) / 0)",
                                }}
                                className={`inline-block w-2 h-2 rounded-[1px] motion-safe:transition-[transform,box-shadow] motion-safe:duration-[250ms] ${
                                  d === "long" ? "bg-pnl-pos" : "bg-pnl-neg"
                                }`}
                                aria-hidden="true"
                              />
                              {t(d)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="d-inst" className={labelCls}>
                      {t("instrument")}
                    </label>
                    <div className="relative">
                      <select
                        id="d-inst"
                        value={instrumentSymbol}
                        onChange={(e) => selectInstrument(e.target.value)}
                        className={`${inputCls} pr-8 cursor-pointer`}
                      >
                        {INSTRUMENTS.map((i) => (
                          <option key={i.symbol} value={i.symbol}>
                            {i.symbol}
                          </option>
                        ))}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>

                  {/* `minmax(0,1fr)` y no `1fr`: un `<input>` no baja de su ancho
                      intrínseco aunque lleve `w-full` (a 320 px se salía 14 px). */}
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
                    <div>
                      <label htmlFor="d-entry" className={labelCls}>
                        {es ? "Entrada" : "Entry"}
                      </label>
                      <input
                        id="d-entry"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={entry}
                        onChange={(e) => setEntry(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="d-exit" className={labelCls}>
                        {t("exit")}
                      </label>
                      <input
                        id="d-exit"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={exitPrice}
                        onChange={(e) => setExitPrice(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <div>
                      <label htmlFor="d-qty" className={labelCls}>
                        {t("quantity")}
                      </label>
                      <input
                        id="d-qty"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    {/* «Calcular tamaño» junto a Cantidad, como en la app
                        (DashboardPage.xaml L466). En la app abre un diálogo; aquí
                        deja directamente la cifra que ya calcula el composer. */}
                    <div>
                      <span className={labelCls} aria-hidden="true">
                        &nbsp;
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (stopDist > 0) {
                            // 1 % de la cuenta entre la distancia al stop:
                            // el tamaño que arriesga exactamente ese 1 %.
                            const mult = getInstrumentMultiplier(instrumentSymbol, inst.assetClass);
                            const q =
                              (INITIAL_BALANCE_CONST * RIESGO_POR_DEFECTO) / (stopDist * mult);
                            setQuantity(q < 1 ? precio(q, 3) : precio(q, 2));
                          }
                        }}
                        className="h-9 px-3 inline-flex items-center gap-1.5 rounded-[2px] border border-[rgb(var(--divider)/0.12)] text-[12px] text-secondary hover:text-primary hover:bg-[rgb(var(--divider)/0.06)] transition-colors whitespace-nowrap"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          aria-hidden="true"
                        >
                          <rect x="5" y="3" width="14" height="18" rx="2" />
                          <path d="M8 7h8M8 11h2M12 11h2M16 11h.01M8 15h2M12 15h2M16 15h.01" />
                        </svg>
                        {es ? "Calcular tamaño" : "Size calculator"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
                    <div>
                      <label htmlFor="d-stop" className={labelCls}>
                        {es ? "Stop" : "Stop"}
                      </label>
                      <input
                        id="d-stop"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={stop}
                        onChange={(e) => setStop(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="d-target" className={labelCls}>
                        {es ? "Objetivo" : "Target"}
                      </label>
                      <input
                        id="d-target"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="d-setup" className={labelCls}>
                      {t("setup")}
                    </label>
                    <div className="relative">
                      <select
                        id="d-setup"
                        value={setupName}
                        onChange={(e) => setSetupName(e.target.value)}
                        className={`${inputCls} pr-8 cursor-pointer`}
                      >
                        {SETUP_NAMES.map((s) => (
                          <option key={s} value={s}>
                            {nombreSetup(s, lang)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label htmlFor="d-note" className={labelCls}>
                      {es ? "Nota" : "Note"}
                    </label>
                    <textarea
                      id="d-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t("notePlaceholder")}
                      rows={3}
                      className="w-full bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-[2px] px-3 py-2 text-sm text-primary placeholder:text-tertiary focus:border-[rgb(var(--divider)/0.2)] focus:bg-[rgb(var(--divider)/0.08)] transition-colors resize-none min-h-[88px] flex-1"
                      aria-label={t("notePlaceholder")}
                    />
                  </div>

                  {/* Modo avanzado (Capture_AdvancedModeLabel en la app): registro por
                      tramos, con varias entradas o salidas. Aquí solo declara la
                      capacidad; el desglose está en la tabla «Anatomía» del detalle. */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={advanced}
                      onChange={(e) => setAdvanced(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`relative w-9 h-5 rounded-[2px] transition-colors shrink-0 ${
                        advanced
                          ? "bg-[rgb(var(--accent-base))]"
                          : "bg-[rgb(var(--divider)/0.15)]"
                      } peer-focus-visible:ring-2 peer-focus-visible:ring-[rgb(var(--accent-base)/0.5)]`}
                    >
                      <span
                        className={`absolute top-[3px] w-3.5 h-3.5 rounded-[2px] transition-[left] ${
                          advanced ? "left-[19px] bg-[rgb(var(--accent-ink))]" : "left-[3px] bg-[rgb(var(--txt-secondary))]"
                        }`}
                      />
                    </span>
                    <span className="text-[12px] text-secondary">
                      {es
                        ? "Modo avanzado (varias entradas o salidas)"
                        : "Advanced mode (multiple entries or exits)"}
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[rgb(var(--divider)/0.1)] flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-sm font-semibold tnum text-primary">
                    {fmtInt(sessionCount, lang)}
                  </span>
                  <span className="text-tertiary uppercase tracking-[0.1em]">
                    {es ? "en la sesión" : "this session"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="tj-dm-alza tj-dm-pulsa h-11 px-4 rounded-[2px] bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] text-secondary font-medium text-sm flex items-center gap-2 hover:bg-[rgb(var(--divider)/0.08)] hover:text-primary transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 3h8l3 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" />
                      <path d="M5 3v3h5V3M5 11h6V8H5z" />
                    </svg>
                    {t("saveDraft")}
                  </button>
                  <button
                    type="submit"
                    title={`${mando}+Enter`}
                    className="tj-dm-alza tj-dm-pulsa group h-11 min-w-[200px] px-4 rounded-[2px] bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[rgb(var(--accent-hover))] transition-colors shadow-[0_2px_8px_rgb(var(--sombra)/0.18)]"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 8h10M8 3v10" />
                    </svg>
                    {t("registerTrade")}
                    {/* Distintivo con la misma tecla de mando que el `title` del
                        botón. Ver `useTeclaMando`. */}
                    <kbd
                      className="hidden sm:inline-flex items-center gap-0.5 h-5 px-1.5 rounded-[2px] bg-[rgb(var(--accent-ink)/0.12)] text-[10px] font-semibold text-[rgb(var(--accent-ink)/0.75)] tabular-nums group-hover:bg-[rgb(var(--accent-ink)/0.18)] transition-colors"
                      aria-hidden="true"
                    >
                      <span>{mando}</span>
                      <span>↵</span>
                    </kbd>
                  </button>
                </div>
              </div>
              </form>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="space-y-5">
        <div>
          <Reveal delay={0}>
            <Eyebrow>{t("performance")}</Eyebrow>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="mt-2 font-medium tracking-[-0.02em] text-primary text-xl md:text-2xl leading-tight">
              {t("performanceTitle")}
            </h2>
          </Reveal>
        </div>

        <Reveal delay={0.06}>
          <TodayBriefing />
        </Reveal>

        <Reveal delay={0.08}>
          {/* Móvil: tira con scroll horizontal y celdas de ancho mínimo (los 7 KPI
              no caben a ~25 px). Escritorio: rejilla de 7 columnas, sin scroll. */}
          <div className="tj-fila-sigue tj-fila-sigue--solo-movil flex md:grid md:grid-cols-[repeat(7,minmax(5.5rem,1fr))] gap-x-4 px-1 py-2 overflow-x-auto custom-scroll">
            <KpiCell
              label={t("pnlTotal")}
              value={
                <Money
                  value={METRICS.netPnl}
                  sign
                  colorizeSign
                  className="text-lg font-semibold"
                />
              }
            />
            <KpiDivider />
            <KpiCell
              label={t("winRate")}
              value={
                <span className="text-lg font-semibold tnum text-primary">
                  {fmtPct(METRICS.winRate, lang, 1)}
                </span>
              }
            />
            <KpiDivider />
            <KpiCell
              label={t("expectancy")}
              value={
                <Money
                  value={METRICS.expectancy}
                  sign
                  colorizeSign
                  className="text-lg font-semibold"
                />
              }
            />
            <KpiDivider />
            <KpiCell
              label={t("profitFactor")}
              value={
                <span
                  className={`text-lg font-semibold tnum ${
                    METRICS.profitFactor >= 1 ? "text-pnl-pos" : "text-pnl-neg"
                  }`}
                >
                  {fmtNum(METRICS.profitFactor, lang, 2)}
                </span>
              }
            />
            <KpiDivider />
            <KpiCell
              label={t("currentDd")}
              value={
                <span className="text-lg font-semibold tnum text-pnl-neg">
                  {fmtPct(METRICS.currentDrawdown, lang, 1)}
                </span>
              }
            />
            <KpiDivider />
            <KpiCell
              label={t("streak")}
              value={
                <span
                  className={`text-lg font-semibold tnum ${
                    METRICS.currentStreak.kind === "win"
                      ? "text-pnl-pos"
                      : METRICS.currentStreak.kind === "loss"
                      ? "text-pnl-neg"
                      : "text-tertiary"
                  }`}
                >
                  {METRICS.currentStreak.count > 0
                    ? `${fmtInt(METRICS.currentStreak.count, lang)}${
                        METRICS.currentStreak.kind === "win"
                          ? es
                            ? "G"
                            : "W"
                          : es
                          ? "P"
                          : "L"
                      }`
                    : "—"}
                </span>
              }
            />
            <KpiDivider />
            <KpiCell
              label={t("discipline")}
              value={
                <span
                  className={`text-lg font-semibold tnum ${
                    { alta: "text-pnl-pos", media: "text-pnl-warn", baja: "text-pnl-neg" }[
                      nivelDisciplina(METRICS.compliancePct)
                    ]
                  }`}
                >
                  {fmtPct(METRICS.compliancePct, lang, 0)}
                </span>
              }
            />
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <RealityCheck />
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-4 md:gap-5">
          <Reveal delay={0.1}>
            {/* Sin halo decorativo: la app no ilumina las esquinas de sus tarjetas. */}
            <div className="demo-card p-5 relative overflow-hidden h-full">
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.15em] text-tertiary">
                      {es ? "Curva de capital" : "Equity curve"}
                    </div>
                    <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                      <Money
                        value={METRICS.finalBalance}
                        compact
                        className="text-2xl font-semibold text-primary"
                      />
                      <span
                        className={`text-xs tnum ${
                          METRICS.roiPct >= 0 ? "text-pnl-pos" : "text-pnl-neg"
                        }`}
                      >
                        {fmtPct(METRICS.roiPct, lang, 1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-[2px] p-0.5">
                    {TIMEFRAMES.map((mode) => {
                      const active = tfSel === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setTfSel(mode)}
                          aria-pressed={active}
                          className={`relative px-2.5 h-6 rounded text-[11px] font-medium tnum transition-colors ${
                            active
                              ? "text-primary"
                              : "text-tertiary hover:text-secondary"
                          }`}
                        >
                          {active && (
                            <Viajero
                              clave="tf-pill"
                              className="absolute inset-0 rounded bg-[rgb(var(--divider)/0.1)] border border-[rgb(var(--divider)/0.15)]"
                            />
                          )}
                          <span className="relative">{mode}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <EquityCurve metrics={slicedMetrics} height={260} />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <MiniCalendar trades={TRADES} className="h-full" />
          </Reveal>
        </div>
      </section>

      {/* No está en el Resumen de la app (vive en Diario / Operaciones): aquí
          hace visible al instante lo registrado. */}
      <Reveal delay={0.1}>
        <div className="demo-card p-5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-baseline justify-between mb-4 gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-tertiary">
                  {es ? "Operaciones recientes" : "Recent trades"}
                </div>
                <div className="mt-1 text-primary font-medium text-base">
                  {es
                    ? `Últimas ${fmtOperaciones(RECENT_TRADES_COUNT, lang)}`
                    : `Last ${fmtOperaciones(RECENT_TRADES_COUNT, lang)}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPage("trades")}
                className="text-xs text-tertiary hover:text-primary transition-colors flex items-center gap-1"
              >
                {es ? "Ver todas" : "See all"}
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="divide-y divide-[rgb(var(--divider)/0.07)]">
              {recentTrades.map((tr, i) => {
                const trInst = INSTRUMENTS.find((x) => x.symbol === tr.instrument);
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => goDetail(tr.id)}
                    style={{ "--dm-y": "4px", "--dm-dur": "0.3s", "--dm-retardo": `${Math.min(i * 0.04, 0.24)}s` } as CSSProperties}
                    /* `flex-wrap` en móvil: las cinco celdas son `shrink-0` y a 390 px
                       sumaban 319 en 207 útiles, con el P&L cortado. Envolver no
                       pierde datos (truncar devolvía «XAU/U…»); en sm+ vuelve a una
                       sola línea. */
                    className="tj-dm-entra group w-full flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 py-2.5 hover:bg-[rgb(var(--divider)/0.05)] -mx-2 px-2 rounded-[2px] transition-colors text-left"
                  >
                    {/* 100 px: «BTC/USDT» mide 79 px solo de texto, más icono y hueco;
                        con 80 se cortaba en «XAU/U…». */}
                    <div className="flex items-center gap-2 min-w-0 w-[100px] sm:w-[110px] shrink-0">
                      <AssetMark assetClass={trInst?.assetClass} />
                      <span className="font-medium text-primary truncate min-w-0">
                        {tr.instrument}
                      </span>
                    </div>
                    <div className="shrink-0">
                      <DirectionChip direction={tr.direction} t={t} />
                    </div>
                    <div className="hidden md:block text-xs text-tertiary truncate flex-1 min-w-0">
                      {nombreSetup(tr.setup, lang)}
                    </div>
                    <div
                      className={`text-xs tnum font-medium shrink-0 w-14 text-right ${
                        tr.rMultiple > 0
                          ? "text-pnl-pos"
                          : tr.rMultiple < 0
                          ? "text-pnl-neg"
                          : "text-tertiary"
                      }`}
                    >
                      {fmtR(tr.rMultiple, lang, 2)}
                    </div>
                    {/* `ml-auto` solo en móvil: manda el resultado al canto derecho
                        de la segunda línea. En sm+ reparte el hueco el setup (`flex-1`). */}
                    <div className="shrink-0 w-20 sm:w-24 text-right ml-auto sm:ml-0">
                      <Money
                        value={tr.netPnl}
                        sign
                        colorizeSign
                        className="text-sm font-medium"
                      />
                    </div>
                    <svg
                      className="hidden md:block text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-[opacity,transform] shrink-0"
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/** Celda de KPI: rótulo y valor tabular, sin tarjeta. */
function KpiCell({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center min-w-[5.5rem] shrink-0 px-1 py-1 rounded-[2px] transition-colors hover:bg-[rgb(var(--divider)/0.03)]">
      <div className="text-[10px] uppercase tracking-[0.12em] text-tertiary truncate max-w-full">
        {label}
      </div>
      {/* `tnum` y semibold en el contenedor: las 7 celdas comparten tipografía
          numérica sea cual sea el valor. `caja-cifra` es contenedor de medida
          propio (a 768 px «+6807,72 US$» se salía 15 px). `w-full` es
          imprescindible: un contenedor de medida cuyo ancho depende de su
          contenido colapsa a cero y `break-words` partía la cifra letra a letra.
          `whitespace-nowrap` porque el `text-lg` del valor gana a `cifra-lg` y
          partiría «US$»; la tira ya hace scroll lateral. */}
      <div className="caja-cifra w-full min-w-0 whitespace-nowrap [&>*]:cifra-lg [&>*]:font-semibold [&>span]:tnum">{value}</div>
    </div>
  );
}

/**
 * «El parte de hoy» (DashboardPage.xaml L637-670): lo que el histórico dice
 * del día de la semana actual y de la racha, con las cadenas de la app
 * (Summary_Briefing*, Resources.resw L608-617). Con muestra corta o
 * resultados a ambos lados del cero declara que no hay ventaja que afirmar.
 *
 * El día se calcula tras montar: la fecha del servidor y la del visitante no
 * coinciden y romperían la hidratación.
 */
function TodayBriefing() {
  const { lang } = useLang();
  const es = lang === "es";
  // `useHydrated` y no estado + efecto (regla react-hooks/set-state-in-effect).
  const hydrated = useHydrated();
  const weekday = hydrated
    ? new Date().toLocaleDateString(LOCALE_FECHA[lang], { weekday: "long" })
    : null;

  // Operaciones de la muestra en el mismo día de la semana: con ella la app decide si afirma algo.
  const sameWeekdayCount = useMemo(() => {
    if (!weekday) return 0;
    const target = new Date().getDay();
    /* La operación se fecha en UTC (ver `data.ts`) y «hoy» es el día local
       del visitante: cada lado se lee en su huso a propósito. */
    return TRADES.filter((tr) => tr.closedAt.getUTCDay() === target).length;
  }, [weekday]);

  const streak = METRICS.currentStreak;

  return (
    <div className="demo-card p-5">
      <div className="text-[11px] uppercase tracking-[0.15em] text-tertiary">
        {es ? "El parte de hoy" : "Today’s briefing"}
      </div>
      <p className="mt-2 text-[12px] text-tertiary leading-relaxed max-w-3xl">
        {es
          ? "Lo que tu histórico dice de hoy, antes de operar; no una predicción. Cuando la muestra no da para afirmar nada, lo dice."
          : "What your history says about today, before you trade — not a prediction. When the sample cannot support a claim, it says so."}
      </p>
      <div className="mt-4 space-y-2 text-[13px] text-secondary leading-relaxed max-w-3xl">
        {/* En la muestra, cualquier día cae a ambos lados del cero: variante «ruidosa». */}
        <p>
          {weekday
            ? es
              ? `Es ${weekday}. Con ${fmtOperaciones(sameWeekdayCount, lang)}, tus resultados de ese día van de un lado a otro del cero: no hay ventaja ni desventaja que afirmar.`
              : `It is ${weekday}. Across ${fmtOperaciones(sameWeekdayCount, lang)}, your results that day fall on both sides of zero: there is no edge or disadvantage to claim.`
            : " "}
        </p>
        <p>
          {es
            ? "Todavía no has cerrado ninguna operación hoy."
            : "You have not closed any trade today."}
        </p>
        {/* Con una sola operación no hay racha que anunciar. */}
        {streak.kind !== "none" && streak.count > 1 && (
          <p>
            {es
              ? `Llegas con ${fmtInt(streak.count, lang)} ${
                  streak.kind === "win" ? "ganadoras" : "pérdidas"
                } seguidas.`
              : `You arrive on a run of ${fmtInt(streak.count, lang)} ${
                  streak.kind === "win" ? "winners" : "losers"
                }.`}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Aviso de realidad bajo los KPI (Summary_RealityStreakNormal /
 * Summary_RealityDrawdownNormal): compara racha y caída actuales con lo que
 * produce el azar con ese acierto, para que tres pérdidas seguidas no se lean
 * como «algo va mal».
 *
 * Umbrales de la estadística de rachas, con n operaciones y probabilidad de
 * fallo q: racha esperada log(n)/log(1/q); racha que el azar solo supera 1 de
 * cada 20 veces log(n / ln(1/0,95))/log(1/q). Con los 200 trades y el 50 % de
 * la muestra dan 7 y 11, como en la app. La caída típica es la racha esperada
 * de pérdidas medias sobre el balance inicial.
 */
function RealityCheck() {
  const { lang } = useLang();
  const es = lang === "es";

  const streak = METRICS.currentStreak;
  const n = METRICS.closedCount;
  const q = 1 - METRICS.winRate; // probabilidad de perder

  if (n < 20 || q <= 0 || q >= 1) return null;

  const expectedStreak = Math.round(Math.log(n) / Math.log(1 / q));
  const rareStreak = Math.round(
    Math.log(n / Math.log(1 / 0.95)) / Math.log(1 / q)
  );

  const typicalDd =
    (expectedStreak * Math.abs(METRICS.avgLoss)) / INITIAL_BALANCE_CONST;
  const rareDd = (rareStreak * Math.abs(METRICS.avgLoss)) / INITIAL_BALANCE_CONST;

  /* Las dos frases son independientes, como en LoadRealityCheck
     (PerformanceViewModel.cs L396-432): la racha solo se menciona si es
     perdedora y la caída solo si hay una vigente. */
  const parts: string[] = [];

  if (streak.kind === "loss" && streak.count > 0) {
    parts.push(
      es
        ? `Llevas ${fmtInt(streak.count, lang)} pérdidas seguidas: con tu porcentaje de acierto lo normal es llegar a ${fmtInt(expectedStreak, lang)}, y ${fmtInt(rareStreak, lang)} tampoco sería raro.`
        : `You are on a run of ${fmtInt(streak.count, lang)} losses: with your win rate, reaching ${fmtInt(expectedStreak, lang)} is normal, and ${fmtInt(rareStreak, lang)} would not be unusual either.`
    );
  }

  if (METRICS.currentDrawdown > 0) {
    parts.push(
      es
        ? `Caída actual ${fmtPct(METRICS.currentDrawdown, lang, 1)}: la típica operando así es ${fmtPct(typicalDd, lang, 1)}, y ${fmtPct(rareDd, lang, 1)} sigue estando dentro de lo esperable.`
        : `Current drawdown ${fmtPct(METRICS.currentDrawdown, lang, 1)}: trading like this the typical one is ${fmtPct(typicalDd, lang, 1)}, and ${fmtPct(rareDd, lang, 1)} is still within what to expect.`
    );
  }

  if (parts.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-[2px] border border-[rgb(var(--divider)/0.10)] bg-[rgb(var(--divider)/0.02)] px-4 py-3">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="text-tertiary shrink-0 mt-[2px]"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 7.5v.01" />
      </svg>
      <p className="text-[12px] text-secondary leading-relaxed">
        {parts.join(" ")}
      </p>
    </div>
  );
}

/** Filete vertical entre celdas de KPI. */
function KpiDivider() {
  return (
    <div
      // `md:hidden`: en md+ el padre es una rejilla de 7 columnas y los
      // separadores serían hijos extra (la tira pasaría a dos filas).
      className="self-stretch w-px shrink-0 justify-self-center bg-[rgb(var(--divider)/0.12)] md:hidden"
      aria-hidden="true"
    />
  );
}

/** Chip de dirección long/short, en línea para no depender de `Chip`. */
function DirectionChip({
  direction,
  t,
}: {
  direction: Direction;
  t: (k: "long" | "short") => string;
}) {
  const isLong = direction === "long";
  return (
    <span
      /* El rojo usa `--pnl-neg-on-tint`: sobre su propio tinte el token normal
         daba 4,03:1 a 10 px (hacen falta 4,5:1). Ver globals.css. */
      className={`inline-flex items-center gap-1 px-1.5 h-5 rounded text-[10px] font-medium uppercase tracking-wider ${
        isLong
          ? "bg-pnl-pos/15 text-pnl-pos"
          : "bg-pnl-neg/15 text-[rgb(var(--pnl-neg-on-tint))]"
      }`}
    >
      <span
        className={`inline-block w-1 h-1 rounded-[1px] ${
          isLong ? "bg-pnl-pos" : "bg-pnl-neg"
        }`}
        aria-hidden="true"
      />
      {t(direction)}
    </span>
  );
}

/** Chevron superpuesto al select, que con `appearance-none` pierde el suyo. */
function ChevronDown() {
  return (
    <span
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary"
      aria-hidden="true"
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
