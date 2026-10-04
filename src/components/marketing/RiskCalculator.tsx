"use client";

import { useState, useMemo, useCallback, type CSSProperties } from "react";
import { useLang } from "@/lib/i18n";
import { computeRiskOfRuin, computeParametricVaR, tramosRiesgoBeneficio, UMBRAL_RUINA_PCT } from "@/lib/trading/estadistica";
import { TOPE_APALANCAMIENTO, type MercadoPlan } from "@/lib/trading/validaPlan";
import {
  FUTURES_CONTRACTS,
  PARES_FOREX,
  UNIDADES_LOTE,
  calculaPlan,
  fraccionesKelly,
  preciosDeFuturo,
  type TipoLote,
} from "@/lib/trading/plan";
import { fmtPct, fmtMoney, fmtNum as fmtNumBase, fmtPrecio, pctSep } from "@/lib/trading/format";
import { ResultadoAnunciado } from "@/components/tj/ResultadoAnunciado";
import { CampoCifra } from "@/components/tj/CampoCifra";
import { BotonCopiar } from "@/components/tj/BotonCopiar";
import { componerInforme } from "@/lib/informe";

/**
 * RiskCalculator — calculadora de tamaño de posición institucional y multi-activo.
 *
 * Admite:
 *  - Acciones / Cripto (unidades o monedas)
 *  - Forex (Lotes estándar, mini y micro)
 *  - Futuros (Contratos con multiplicador por punto como ES, NQ, MES, MNQ, GC, CL)
 */

const RISK_MIN = 0.25;
const RISK_MAX = 3;
const RISK_STEP = 0.05;
const RISK_MARKS = [0.25, 1, 2, 3];

type AssetMode = MercadoPlan;

/* Una sola lista para el conmutador y para el plan copiado, que escribía
   el identificador interno («EQUITIES»). */
const MODOS_ACTIVO: { id: AssetMode; labelEs: string; labelEn: string }[] = [
  { id: "equities", labelEs: "Acciones / cripto", labelEn: "Stocks / Crypto" },
  { id: "forex", labelEs: "Forex (lotes)", labelEn: "Forex (Lots)" },
  { id: "futures", labelEs: "Futuros (contratos)", labelEn: "Futures (Contracts)" },
];

const LOTES: { id: TipoLote; labelEs: string; labelEn: string }[] = [
  { id: "standard", labelEs: "Estándar (100k)", labelEn: "Standard (100k)" },
  { id: "mini", labelEs: "Mini (10k)", labelEn: "Mini (10k)" },
  { id: "micro", labelEs: "Micro (1k)", labelEn: "Micro (1k)" },
];

export function RiskCalculator() {
  const { lang } = useLang();
  /* El espacio duro antes del signo en espanol, pegado en ingles, es
     `PCT_SEP` de lib/trading/format.ts: aqui se llama a traves de
     `pctSep(lang)`, sin repetirlo. */
  const PCT = pctSep(lang);
  const es = lang === "es";

  const presets = [
    { label: es ? "Conservador" : "Conservative", pct: 0.5 },
    { label: es ? "Estándar" : "Standard", pct: 1.0 },
    { label: es ? "Agresivo" : "Aggressive", pct: 2.0 },
  ];
  const balances = [
    { label: es ? "10\u00a0k $" : "$10k", v: 10000 },
    { label: es ? "25\u00a0k $" : "$25k", v: 25000 },
    { label: es ? "50\u00a0k $" : "$50k", v: 50000 },
    { label: es ? "100\u00a0k $" : "$100k", v: 100000 },
  ];

  // ── Estado editable: la operación del usuario ─────────────────────
  const [assetMode, setAssetMode] = useState<AssetMode>("equities");
  const [futuresContractId, setFuturesContractId] = useState("es");
  const [forexLotType, setForexLotType] = useState<TipoLote>("standard");
  const [parForexId, setParForexId] = useState("EUR/USD");
  const [tipoReferencia, setTipoReferencia] = useState<number | null>(null);
  const [riskPct, setRiskPct] = useState(1.0);
  const [balance, setBalance] = useState(10000);
  const [entry, setEntry] = useState(100);
  const [stop, setStop] = useState(95);
  const [target, setTarget] = useState(115);
  const [includeFriction, setIncludeFriction] = useState(true);
  const [showKelly, setShowKelly] = useState(false);
  const [kellyWinRate, setKellyWinRate] = useState(55); // %

  const selectedFutures = useMemo(
    () => FUTURES_CONTRACTS.find((f) => f.id === futuresContractId) ?? FUTURES_CONTRACTS[0],
    [futuresContractId]
  );

  const parForex = useMemo(() => PARES_FOREX.find((p) => p.id === parForexId) ?? PARES_FOREX[0], [parForexId]);

  // ── Cálculo en vivo adaptado al activo ───────────────────────────
  const c = useMemo(() => {
    const plan = calculaPlan({
      mercado: assetMode,
      balance,
      riesgoPct: riskPct,
      entrada: entry,
      stop,
      objetivo: target,
      friccion: includeFriction,
      futuro: selectedFutures,
      lote: forexLotType,
      par: parForex,
      tipoReferencia,
    });
    const kelly = fraccionesKelly(kellyWinRate, plan.rr);
    /* «1 contrato», no «1 contratos»: el singular solo con un entero. */
    const uno = plan.decimalesTamano === 0 && plan.tamano === 1;
    const sizeLabel =
      assetMode === "futures"
        ? es ? (uno ? "contrato" : "contratos") : uno ? "contract" : "contracts"
        : assetMode === "forex"
          ? forexLotType === "micro"
            ? es ? (uno ? "micro lote (1k)" : "micro lotes (1k)") : uno ? "micro lot (1k)" : "micro lots (1k)"
            : forexLotType === "mini"
              ? (es ? "mini lotes (10k)" : "mini lots (10k)")
              : (es ? "lotes estándar (100k)" : "standard lots (100k)")
          : (es ? "unidades" : "units");
    return {
      ...plan,
      valid: plan.valido,
      sizeLabel,
      profitPct: balance > 0 ? (plan.beneficioNeto / balance) * 100 : 0,
      kelly,
      riskOfRuin: computeRiskOfRuin(kellyWinRate, plan.rr, riskPct, UMBRAL_RUINA_PCT),
      var95: computeParametricVaR(balance, riskPct, 95),
    };
  }, [entry, stop, target, balance, riskPct, assetMode, selectedFutures, forexLotType, parForex, tipoReferencia, includeFriction, kellyWinRate, es]);

  /* Los helpers de format.ts, no un `Intl.NumberFormat` propio: el propio
     agrupaba sin millares «1234,56 $» en español y ponía «-» en vez de «−»,
     distinto del resto de la web. */
  const fmtUsd = useCallback((n: number) => fmtMoney(n, lang), [lang]);

  const fmtNum = useCallback(
    (n: number, dec = 2) => fmtNumBase(n, lang, dec),
    [lang],
  );

  const tramos = c.valid ? tramosRiesgoBeneficio(c.riesgoReal, Math.max(0, c.beneficioNeto)) : { riesgo: 0, beneficio: 0 };
  /* Sin un plan válido, lo que depende de él no se enseña: un tamaño de 0
     junto a «riesgo de ruina 100 %» se lee como un resultado, no como un
     hueco. El VaR sí se enseña, porque solo depende del balance y del %. */
  const siPlan = (s: string) => (c.valid ? s : "—");
  /* El mismo número en la tarjeta, en el anuncio y en el plan copiado:
     la tarjeta decía «0,0 contratos» y la copia «0,03». */
  const tamanoTxt = `${fmtNum(c.tamano, c.decimalesTamano)} ${c.sizeLabel}`;
  /* Medio Kelly ajustado al paso y a los extremos del control de riesgo. */
  const kellyAplicable =
    c.kelly.medio > 0 ? Math.min(RISK_MAX, Math.max(RISK_MIN, Number((Math.round(c.kelly.medio / RISK_STEP) * RISK_STEP).toFixed(2)))) : 0;
  const kellyTopado = c.kelly.medio > 0 && Math.abs(kellyAplicable - c.kelly.medio) > RISK_STEP / 2;
  const friccionTxt = !includeFriction
    ? (es ? "Desactivada" : "Off")
    : c.friccion > 0
      ? `−${fmtUsd(c.friccion)}`
      : fmtUsd(0);

  const ponPrecios = useCallback(([e, s, t]: [number, number, number]) => {
    setEntry(e);
    setStop(s);
    setTarget(t);
  }, []);

  /* Al volver a un mercado, los precios de ejemplo son los del contrato o
     el par que sigue elegido: volvía a Futuros con CL marcado y precios
     de ES, y salía «0,0 contratos». */
  const handleAssetChange = useCallback(
    (mode: AssetMode) => {
      setAssetMode(mode);
      if (mode === "futures") ponPrecios(preciosDeFuturo(futuresContractId));
      else if (mode === "forex") ponPrecios(parForex.precios);
      else ponPrecios([100, 95, 115]);
    },
    [futuresContractId, parForex, ponPrecios],
  );

  const handleFuturesChange = useCallback(
    (id: string) => {
      setFuturesContractId(id);
      ponPrecios(preciosDeFuturo(id));
    },
    [ponPrecios],
  );

  const handleParChange = useCallback(
    (id: string) => {
      const par = PARES_FOREX.find((p) => p.id === id) ?? PARES_FOREX[0];
      setParForexId(par.id);
      setTipoReferencia(null);
      ponPrecios(par.precios);
    },
    [ponPrecios],
  );

  const microSugerido = selectedFutures.micro ? FUTURES_CONTRACTS.find((f) => f.id === selectedFutures.micro) : undefined;
  const avisoNoCabe = !c.valid || !c.noCabe
    ? null
    : assetMode === "futures"
      ? es
        ? `Con ${fmtUsd(c.riesgoNominal)} de riesgo no cabe ni un contrato de ${selectedFutures.simbolo}: uno solo arriesga ${fmtUsd(c.riesgoDeUno)} con este stop.${microSugerido ? ` Prueba el micro (${microSugerido.simbolo}).` : " Acerca el stop o sube el riesgo."}`
        : `With ${fmtUsd(c.riesgoNominal)} at risk not even one ${selectedFutures.simbolo} contract fits: a single one risks ${fmtUsd(c.riesgoDeUno)} with this stop.${microSugerido ? ` Try the micro (${microSugerido.simbolo}).` : " Tighten the stop or raise the risk."}`
      : es
        ? `Con ${fmtUsd(c.riesgoNominal)} de riesgo no cabe ni un micro lote (${fmtNum(UNIDADES_LOTE.micro, 0)} unidades): uno solo arriesga ${fmtUsd(c.riesgoDeUno)} con este stop.`
        : `With ${fmtUsd(c.riesgoNominal)} at risk not even one micro lot (${fmtNum(UNIDADES_LOTE.micro, 0)} units) fits: a single one risks ${fmtUsd(c.riesgoDeUno)} with this stop.`;

  const rotuloFriccion =
    assetMode === "futures"
      ? es
        ? `Comisión de ${fmtUsd(selectedFutures.comision)} por contrato y un tick de deslizamiento (${fmtUsd(selectedFutures.tickSize * selectedFutures.mult)} en ${selectedFutures.simbolo})`
        : `${fmtUsd(selectedFutures.comision)} commission per contract and one tick of slippage (${fmtUsd(selectedFutures.tickSize * selectedFutures.mult)} on ${selectedFutures.simbolo})`
      : assetMode === "forex"
        ? es
          ? `Comisión de ${fmtUsd(5)} por lote estándar y un pip de deslizamiento`
          : `${fmtUsd(5)} commission per standard lot and one pip of slippage`
        : es
          ? `Comisión de ${fmtMoney(0.005, lang, { decimals: 3 })} por unidad y un céntimo de deslizamiento`
          : `${fmtMoney(0.005, lang, { decimals: 3 })} commission per unit and one cent of slippage`;

  /* Aqui vivia `chipStyle`, que vestia a mano cada opcion de los tres
     grupos de esta calculadora. Ya no hace falta: los grupos son
     conmutadores segmentados y el estilo del elegido lo pone
     `.tj-segmentado` a partir de `aria-pressed`, que es ademas lo que
     un lector de pantalla necesita para anunciarlo. */

  const numInput = (label: string, value: number, onChange: (n: number) => void, ariaLabel: string) => (
    <label className="block min-w-0">
      <span className="tnum block text-[12px] text-tertiary mb-1">
        {label}
      </span>
      <CampoCifra
        min={0}
        valor={value}
        onValor={onChange}
        aria-label={ariaLabel}
        className="tj-campo tnum w-full min-h-[44px] px-3 text-base font-medium text-primary"
      />
    </label>
  );

  const informePlan = () => {
    const modo = MODOS_ACTIVO.find((m) => m.id === assetMode);
    return componerInforme(
      es ? "Plan de operación" : "Trade plan",
      [
        {
          lineas: [
            modo && `${es ? "Activo" : "Asset"}: ${es ? modo.labelEs : modo.labelEn}`,
            assetMode === "futures" && `${es ? "Contrato" : "Contract"}: ${selectedFutures.nombre}`,
            assetMode === "forex" && `${es ? "Par" : "Pair"}: ${parForex.id}`,
            `${es ? "Dirección" : "Direction"}: ${c.direccion === "short" ? (es ? "corto" : "short") : (es ? "largo" : "long")}`,
            `${es ? "Entrada" : "Entry"}: ${fmtPrecio(entry, lang)}`,
            `Stop: ${fmtPrecio(stop, lang)}`,
            `${es ? "Objetivo" : "Target"}: ${fmtPrecio(target, lang)}`,
          ],
        },
        {
          rotulo: es ? "Riesgo" : "Risk",
          lineas: [
            `${es ? "Balance de cuenta" : "Account balance"}: ${fmtUsd(balance)}`,
            `${es ? "Riesgo nominal" : "Nominal risk"}: ${fmtNum(riskPct)}${pctSep(lang)} (${fmtUsd(c.riesgoNominal)})`,
            `${es ? "Riesgo con el tamaño redondeado" : "Risk at the rounded size"}: ${fmtUsd(c.riesgoReal)}`,
            `${es ? "Fricción estimada" : "Est. friction"}: ${friccionTxt}`,
            `${es ? "Riesgo total" : "Total risk"}: ${fmtUsd(c.riesgoTotal)}`,
          ],
        },
        {
          rotulo: es ? "Resultado" : "Result",
          lineas: [
            `${es ? "Tamaño de posición" : "Position size"}: ${tamanoTxt}`,
            `${es ? "Valor del pip / punto" : "Pip / point value"}: ${fmtUsd(c.valorPip)}`,
            `R:R: ${fmtNum(c.rr, 2)}:1`,
            `${es ? "Beneficio neto" : "Net profit"}: ${fmtUsd(c.beneficioNeto)} (${fmtPct(c.profitPct / 100, lang, 1)})`,
            `${es ? "Valor nocional" : "Notional value"}: ${fmtUsd(c.nocional)}`,
          ],
        },
      ],
      `${es ? "" : "/en"}/herramientas/calculadora-de-riesgo/`,
    );
  };

  return (
    <section className="section-tight">
      <div className="tj-container grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div>
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="eyebrow" data-titular-herramienta>
              {es ? "Calculadora de riesgo" : "Risk calculator"}
            </span>
          </div>

          <h2 data-titular-herramienta className="t-h2 m-0 text-primary max-w-[24ch]">
            {es ? (
              <>
                Calcula tu riesgo antes de operar.
              </>
            ) : (
              <>
                Calculate your risk before you trade.
              </>
            )}
          </h2>

          <p className="t-entradilla mt-5 mb-7 text-secondary max-w-[34em]">
            {es
              ? "Introduce tu capital y la distancia a tu stop. Calculamos el tamaño exacto en unidades, lotes o contratos según el mercado que operes."
              : "Enter your balance and stop distance. We work out the exact sizing in units, lots or contracts tailored to your market."}
          </p>

          {/* Selector de clase de activo */}
          <div className="mb-5">
            <div className="tj-deslizador-etiqueta mb-2">
              {es ? "Mercado / Instrumento" : "Market / Instrument"}
            </div>
            {/* Conmutador, no tres botones sueltos: con `flex-wrap` el
                tercero se quedaba solo en una segunda fila y con otro
                ancho, y tres opciones que son lo mismo se veian como dos
                cosas y una suelta. Ver `.tj-segmentado`. */}
            <div className="tj-segmentado tj-segmentado-apila" role="group">
              {MODOS_ACTIVO.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={assetMode === m.id}
                  onClick={() => handleAssetChange(m.id)}
                >
                  {es ? m.labelEs : m.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Subselector para futuros */}
          {assetMode === "futures" && (
            <div className="mb-5 border-y border-[var(--ficha-division)] py-3">
              <span id="riesgo-contrato" className="block text-[12px] text-tertiary mb-2">
                {es ? "Contrato de futuros" : "Futures contract"}
              </span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="riesgo-contrato">
                {FUTURES_CONTRACTS.map((fc) => (
                  <button
                    key={fc.id}
                    type="button"
                    aria-pressed={futuresContractId === fc.id}
                    title={fc.nombre}
                    onClick={() => handleFuturesChange(fc.id)}
                    className={`h-7 px-2.5 rounded-[4px] text-xs tnum transition-all ${
                      futuresContractId === fc.id
                        ? "bg-[color-mix(in_srgb,var(--ink)_9%,transparent)] text-primary font-semibold shadow-[inset_0_0_0_1px_var(--line-2)]"
                        : "text-secondary shadow-[inset_0_0_0_1px_var(--ficha-filo)] hover:text-primary hover:bg-[color-mix(in_srgb,var(--ink)_3.5%,transparent)]"
                    }`}
                  >
                    {fc.simbolo} · {fmtMoney(fc.mult, lang, { decimals: 0 })}/pt
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subselector para Forex: el par fija el tamaño del pip y la
              divisa en que se cobra; sin él, USD/JPY salía a 0,0033 lotes. */}
          {assetMode === "forex" && (
            <div className="mb-5 border-y border-[var(--ficha-division)] py-3 space-y-3">
              <div>
                <span id="riesgo-par" className="block text-[12px] text-tertiary mb-2">
                  {es ? "Par de divisas" : "Currency pair"}
                </span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="riesgo-par">
                  {PARES_FOREX.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={parForex.id === p.id}
                      onClick={() => handleParChange(p.id)}
                      className={`h-7 px-2.5 rounded-[4px] text-xs tnum transition-all ${
                        parForex.id === p.id
                          ? "bg-[color-mix(in_srgb,var(--ink)_9%,transparent)] text-primary font-semibold shadow-[inset_0_0_0_1px_var(--line-2)]"
                          : "text-secondary shadow-[inset_0_0_0_1px_var(--ficha-filo)] hover:text-primary hover:bg-[color-mix(in_srgb,var(--ink)_3.5%,transparent)]"
                      }`}
                    >
                      {p.id}
                    </button>
                  ))}
                </div>
              </div>
              {parForex.referencia && (
                <label className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-tertiary">
                    {es
                      ? `Tipo ${parForex.referencia.id} para pasar a dólares`
                      : `${parForex.referencia.id} rate to convert to dollars`}
                  </span>
                  <CampoCifra
                    min={0.0001}
                    valor={tipoReferencia ?? parForex.referencia.defecto}
                    onValor={setTipoReferencia}
                    className="tj-campo tnum w-28 min-h-[44px] px-3 text-base font-medium text-primary"
                  />
                </label>
              )}
              <div>
                <span id="riesgo-lote" className="block text-[12px] text-tertiary mb-2">
                  {es ? "Tipo de lote" : "Lot size"}
                </span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="riesgo-lote">
                  {LOTES.map((lot) => (
                    <button
                      key={lot.id}
                      type="button"
                      aria-pressed={forexLotType === lot.id}
                      onClick={() => setForexLotType(lot.id)}
                      className={`h-7 px-2.5 rounded-[4px] text-xs tnum transition-all ${
                        forexLotType === lot.id
                          ? "bg-[color-mix(in_srgb,var(--ink)_9%,transparent)] text-primary font-semibold shadow-[inset_0_0_0_1px_var(--line-2)]"
                          : "text-secondary shadow-[inset_0_0_0_1px_var(--ficha-filo)] hover:text-primary hover:bg-[color-mix(in_srgb,var(--ink)_3.5%,transparent)]"
                      }`}
                    >
                      {es ? lot.labelEs : lot.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Control de Fricción de Ejecución */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <span className="block text-[14px] font-medium text-primary">
                {es ? "Deducir fricción de ejecución" : "Deduct execution friction"}
              </span>
              <span className="block text-[12px] text-tertiary">
                {rotuloFriccion}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIncludeFriction((v) => !v)}
              role="switch"
              aria-checked={includeFriction}
              aria-label={es ? "Deducir fricción de ejecución" : "Deduct execution friction"}
              className={`toque-halo relative h-6 w-10 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] ${
                includeFriction ? "bg-[var(--ink)]" : "bg-[color-mix(in_srgb,var(--ink)_14%,transparent)]"
              }`}
            >
              <span
                aria-hidden
                className={`absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-[var(--raised)] shadow-sm transition-transform duration-200 ${
                  includeFriction ? "translate-x-4" : ""
                }`}
              />
            </button>
          </div>

          {/* Chips de plantilla */}
          <div className="mb-4">
            <div id="riesgo-plantilla" className="tj-deslizador-etiqueta mb-2">
              {es ? "Plantilla de riesgo" : "Risk preset"}
            </div>
            <div className="tj-segmentado tj-segmentado-apila" role="group" aria-labelledby="riesgo-plantilla">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setRiskPct(p.pct)}
                  aria-pressed={riskPct === p.pct}
                >
                  {p.label} · {fmtNum(p.pct)}{pctSep(lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Balance: se escribe; los cuatro importes son atajos. Solo con
              los atajos, quien tuviera 5.000 $ o 250.000 $ no podía
              calcular su caso. */}
          <div>
            <label className="flex items-center justify-between gap-3 mb-2">
              <span id="riesgo-balance" className="tj-deslizador-etiqueta">
                {es ? "Balance de cuenta ($)" : "Account balance ($)"}
              </span>
              <CampoCifra
                min={100}
                valor={balance}
                onValor={setBalance}
                className="tj-campo tnum w-36 min-h-[44px] px-3 text-base font-medium text-primary text-right"
              />
            </label>
            {/* Aqui no hace falta apilar: son cuatro etiquetas de cuatro
                caracteres y caben en fila hasta en 390 px. */}
            <div className="tj-segmentado" role="group" aria-labelledby="riesgo-balance">
              {balances.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => setBalance(b.v)}
                  aria-pressed={balance === b.v}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Riesgo y precios van con el resto de lo que se escribe: estaban
              dentro de la tarjeta de resultados y la columna de la izquierda
              acababa a media altura. Tres precios en fila también en móvil:
              en dos columnas «Objetivo» quedaba solo. */}
          {/* Slider de riesgo */}
          <div className="mb-5 mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="tj-deslizador-etiqueta">
                {es ? "Riesgo por operación" : "Risk per trade"}
              </span>
              <span className="tj-deslizador-valor">
                {fmtNum(riskPct)}
                {pctSep(lang)}
              </span>
            </div>
            <input
              type="range"
              min={RISK_MIN}
              max={RISK_MAX}
              step={RISK_STEP}
              value={riskPct}
              onChange={(e) => setRiskPct(parseFloat(e.target.value))}
              aria-label={es ? "Porcentaje de riesgo por operación" : "Risk percentage per trade"}
              /* `.tj-range`, como los otros deslizadores del sitio. Era
                 `appearance-none` con 8 px de alto y sin regla de bolita:
                 en WebKit eso deja el control sin agarradera visible, y
                 8 px no se cogen con el dedo. */
              className="tj-range w-full"
              style={
                {
                  "--pct": `${((riskPct - RISK_MIN) / (RISK_MAX - RISK_MIN)) * 100}%`,
                } as CSSProperties
              }
            />
            <div className="flex justify-between mt-1 text-[12px] text-tertiary tnum">
              {/* `0.25%` con punto ingles, en una lista donde la cifra de al
                  lado dice `3,00%`. La marca salia del numero crudo de
                  JavaScript, que siempre lleva punto decimal. */}
              {RISK_MARKS.map((m) => (
                <span key={m}>{fmtPct(m / 100, lang, m < 1 ? 2 : 0)}</span>
              ))}
            </div>
          </div>

          {/* Entrada / Stop / Target */}
          <div
            className="grid grid-cols-3 gap-2.5"
          >
            {numInput(es ? "Entrada" : "Entry", entry, setEntry, es ? "Precio de entrada" : "Entry price")}
            {numInput(es ? "Stop" : "Stop", stop, setStop, es ? "Precio de stop loss" : "Stop loss price")}
            {numInput(es ? "Objetivo" : "Target", target, setTarget, es ? "Precio objetivo take profit" : "Take profit target price")}
          </div>
        </div>

        {/* Tarjeta calculadora */}
        <div className="tj-ficha relative">
          {/* La dirección se dice con palabras, no con color. */}
          <p className="tj-ficha-barra">
            <span>
              {!c.valid
                ? (es ? "Plan sin calcular" : "Plan not calculated")
                : c.direccion === "short"
                  ? (es ? "Plan en corto" : "Short plan")
                  : (es ? "Plan en largo" : "Long plan")}
            </span>
            <span>
              {fmtNum(riskPct)}{PCT} {es ? "de" : "of"} {fmtMoney(balance, lang, { decimals: 0 })}
            </span>
          </p>
          <div className="tj-ficha-cuerpo">
          {/* Lo que se ha venido a saber, en una frase, para quien no ve
              la pantalla: el panel son doce líneas y leerlas todas en
              cada tecla sería ruido. Cuando la entrada no es válida no
              se dice nada — de eso ya avisa el `role="alert"` de abajo,
              y dos anuncios a la vez se pisan. */}
          <ResultadoAnunciado
            texto={
              !c.valid
                ? ""
                : es
                  ? avisoNoCabe ?? `Tamaño: ${tamanoTxt}. Riesgo: ${fmtUsd(c.riesgoTotal)}. Beneficio en el objetivo: ${fmtUsd(c.beneficioNeto)}. Ratio ${fmtNum(c.rr, 1)} a 1.`
                  : avisoNoCabe ?? `Size: ${tamanoTxt}. Risk: ${fmtUsd(c.riesgoTotal)}. Profit at target: ${fmtUsd(c.beneficioNeto)}. Ratio ${fmtNum(c.rr, 1)} to 1.`
            }
          />

          {!c.valid ? (
            <div
              className="mb-4 border-y border-[var(--ficha-division)] py-2.5 text-[13px] leading-[1.5]"
              style={{ color: "rgb(var(--pnl-neg))" }}
              role="alert"
            >
              {c.motivoInvalido === "lado"
                ? es
                  ? "El objetivo tiene que quedar al otro lado de la entrada que el stop."
                  : "The target must be on the opposite side of entry from the stop."
                : es
                  ? "Entrada, stop y objetivo deben ser distintos y positivos para calcular el tamaño."
                  : "Entry, stop and target must be distinct and positive to calculate size."}
            </div>
          ) : null}
          {/* Sin `role`: el anuncio de arriba ya lo lee, y dos anuncios a
              la vez se pisan. */}
          {avisoNoCabe ? (
            <p
              className="mb-4 border-y border-[var(--ficha-division)] py-2.5 text-[13px] leading-[1.5]"
              style={{ color: "rgb(var(--pnl-neg))" }}
            >
              {avisoNoCabe}
            </p>
          ) : null}
          {c.apalancamientoExcesivo ? (
            <p
              className="mb-4 border-y border-[var(--ficha-division)] py-2.5 text-[13px] leading-[1.5]"
              style={{ color: "rgb(var(--pnl-neg))" }}
              role="status"
            >
              {es
                ? `La posición equivale a ${fmtNum(c.apalancamiento, 1)} veces tu balance, por encima del ${TOPE_APALANCAMIENTO[assetMode]}:1 que se suele permitir en este mercado. Con el stop tan cerca de la entrada el tamaño se dispara: revisa la distancia.`
                : `The position is ${fmtNum(c.apalancamiento, 1)} times your balance, above the ${TOPE_APALANCAMIENTO[assetMode]}:1 usually allowed in this market. With the stop this close to entry the size balloons: check the distance.`}
            </p>
          ) : null}

          {/* Resultados — la rejilla cuenta sus columnas contra SU ancho,
              no contra el de la ventana. Con `sm:grid-cols-3` pedia tres
              columnas siempre que la ventana pasara de 640, y en
              /features/metricas esta calculadora vive en una columna
              estrecha: a 1024 px de ventana la rejilla medía 324 px, la
              celda 100 y el hueco de la cifra 66, mientras «100,10 US$»
              pedia 84 — se partia en dos lineas. A 1280 y a 1440 la misma
              rejilla mide 432 y va sobrada, que es por lo que no se veia
              mirando solo los extremos.

              `auto-fit` + `minmax(8.25rem, 1fr)` deja que sea el ancho
              real quien lo decida. Medido, da el mismo reparto de siempre
              donde ya estaba bien —3 columnas a 1280, 1440 y en la
              herramienta a 768; 2 en movil— y baja a 2 solo en el caso
              que se rompia. */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(8.25rem,1fr))] gap-x-4 mb-2">
            <Result label={es ? "Riesgo total" : "Total risk"} value={siPlan(fmtUsd(c.riesgoTotal))} color={c.valid && c.riesgoTotal > 0 ? "rgb(var(--pnl-neg))" : "var(--ink-2)"} />
            <Result label={es ? "Beneficio neto" : "Net profit"} value={siPlan(fmtUsd(c.beneficioNeto))} color={!c.valid || c.beneficioNeto === 0 ? "var(--ink-2)" : c.beneficioNeto > 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))"} />
            <Result label={es ? "Tamaño de posición" : "Position size"} value={siPlan(tamanoTxt)} color={c.noCabe ? "rgb(var(--pnl-neg))" : "var(--ink)"} />
            <Result label="R:R" value={siPlan(`${fmtNum(c.rr, 2)}:1`)} color="var(--ink)" />
            <Result label={es ? "Valor del pip / punto" : "Pip / point value"} value={siPlan(fmtUsd(c.valorPip))} color="var(--ink)" />
            <Result label={es ? "Fricción estimada" : "Est. friction"} value={siPlan(friccionTxt)} color="var(--ink-2)" />
          </div>

          {/* Stats adicionales: valor posición, apalancamiento, VaR 95% y riesgo de ruina */}
          <div
            /* La clase va en CADA celda y no como variante `[&>div]:`:
               Tailwind no compone una clase propia dentro de un variante
               arbitrario y ahi no llegaba a generar regla ninguna —
               comprobado en la hoja construida. */
            className="mb-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[var(--line)] pt-4 sm:grid-cols-4"
          >
            <div className="caja-cifra flex flex-col">
              <div className="tnum text-[12px] leading-[1.3] text-tertiary [hyphens:auto] break-words">
                {es ? "Valor nocional" : "Notional value"}
              </div>
              <div className="tnum text-sm mt-auto pt-0.5 whitespace-nowrap font-semibold text-primary">
                {siPlan(fmtUsd(c.nocional))}
              </div>
            </div>
            <div className="caja-cifra flex flex-col">
              <div className="tnum text-[12px] leading-[1.3] text-tertiary [hyphens:auto] break-words">
                {es ? "Apalancamiento" : "Leverage"}
              </div>
              <div
                className="tnum text-sm font-semibold mt-auto pt-0.5"
                style={{
                  color: c.apalancamientoExcesivo ? "rgb(var(--pnl-neg))" : "var(--ink)",
                }}
              >
                {c.valid ? <>{fmtNum(c.apalancamiento, 1)}{"\u00a0×"}</> : "—"}
              </div>
            </div>
            <div className="caja-cifra flex flex-col">
              <div className="tnum text-[12px] leading-[1.3] text-tertiary [hyphens:auto] break-words">
                {es ? "VaR 95 %" : "95% VaR"}
              </div>
              <div className="tnum text-sm mt-auto pt-0.5 whitespace-nowrap font-semibold text-primary">
                {fmtUsd(c.var95)}
              </div>
            </div>
            <div className="caja-cifra flex flex-col">
              <div className="tnum text-[12px] leading-[1.3] text-tertiary [hyphens:auto] break-words">
                {es ? `Riesgo de ruina (−${UMBRAL_RUINA_PCT}\u00a0%)` : `Risk of ruin (−${UMBRAL_RUINA_PCT}%)`}
              </div>
              <div
                className="tnum text-sm font-semibold mt-auto pt-0.5"
                style={{
                  color: !c.valid ? "var(--ink-2)" : c.riskOfRuin > 1 ? "rgb(var(--pnl-neg))" : "rgb(var(--pnl-pos))",
                }}
              >
                {siPlan(`${fmtNum(c.riskOfRuin, 2)}${PCT}`)}
              </div>
            </div>
          </div>

          {/* Barra Riesgo ↔ Beneficio */}
          <div>
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="tnum inline-flex items-center gap-1.5 text-tertiary">
                <span aria-hidden className="w-1.5 h-1.5 rounded-[1px] bg-[rgb(var(--pnl-neg))]" />
                {es ? "Riesgo" : "Risk"}
              </span>
              <span className="tnum font-semibold text-[rgb(var(--accent-base))]">
                {siPlan(`${fmtNum(c.rr, 2)}:1`)} R:R
              </span>
              <span className="tnum inline-flex items-center gap-1.5 text-tertiary">
                {es ? "Beneficio" : "Profit"}
                <span aria-hidden className="w-1.5 h-1.5 rounded-[1px] bg-[rgb(var(--pnl-pos))]" />
              </span>
            </div>
            <div className="relative h-2 rounded-[2px] overflow-hidden bg-[rgb(var(--divider)/0.13)]">
              {/* Los dos tramos crecen desde el centro, cada uno hacia su
                  lado, y por eso miden la mitad: anclados a los bordes, el
                  mayor de los dos se iba al 100 % del carril y tapaba al
                  otro entero —con 3:1 la parte roja desaparecía—. */}
              <div
                className="absolute top-0 h-full bg-[rgb(var(--pnl-neg))]"
                style={{ right: "50%", width: `${tramos.riesgo}%` }}
              />
              <div
                className="absolute top-0 h-full bg-[rgb(var(--pnl-pos))]"
                style={{ left: "50%", width: `${tramos.beneficio}%` }}
              />
              <span
                aria-hidden
                className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-white/40"
              />
            </div>
            <div className="mt-2 flex items-center justify-between tnum text-[12px] text-secondary">
              <span>{siPlan(fmtUsd(c.riesgoReal))}</span>
              <span className="text-tertiary">{siPlan(fmtPct(c.profitPct / 100, lang, 1))} {es ? "del balance" : "of balance"}</span>
              <span>{siPlan(fmtUsd(c.beneficioNeto))}</span>
            </div>
          </div>

          {/* Criterio de Kelly (Medio Kelly institucional), plegado al final. */}
          <div className="mt-6 border-t border-[var(--ficha-division)] pt-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowKelly((v) => !v)}
                aria-expanded={showKelly}
                className="toque-comodo text-[13px] text-secondary hover:text-primary flex items-center gap-2 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className={`transition-transform duration-150 ${showKelly ? "rotate-90" : ""}`}>
                  <path d="M3.5 2l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{es ? "Criterio de Kelly" : "Kelly criterion"}</span>
              </button>
              <span className="text-[12px] tnum text-tertiary">
                {es ? "Medio Kelly: " : "Half-Kelly: "}
                <strong className="text-primary font-semibold">{siPlan(`${fmtNum(c.kelly.medio)}${PCT}`)}</strong>
              </span>
            </div>

            {showKelly && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-tertiary">{es ? "Win rate histórico estimado:" : "Estimated historical win rate:"}</span>
                  <span className="tnum font-semibold text-primary">{fmtNum(kellyWinRate, 0)}{PCT}</span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={75}
                  step={1}
                  value={kellyWinRate}
                  onChange={(e) => setKellyWinRate(parseInt(e.target.value, 10))}
                  aria-label={es ? "Win rate para Kelly" : "Win rate for Kelly"}
                  /* `.tj-range` como el resto: con `appearance-none` y sin
                     regla de bolita, en WebKit no se veía la agarradera. */
                  className="tj-range w-full"
                  style={{ "--pct": `${((kellyWinRate - 35) / 40) * 100}%` } as CSSProperties}
                />
                <div className="grid grid-cols-3 gap-2 text-center text-[12px] tnum">
                  <div className="py-1">
                    <div className="text-tertiary">{es ? "Kelly completo" : "Full Kelly"}</div>
                    <div className="font-semibold text-primary mt-0.5">{siPlan(`${fmtNum(c.kelly.completo)}${PCT}`)}</div>
                  </div>
                  <div className="py-1">
                    <div className="text-[rgb(var(--accent-base))] font-semibold">{es ? "Medio Kelly" : "Half Kelly"}</div>
                    <div className="font-semibold text-[rgb(var(--accent-base))] mt-0.5">{siPlan(`${fmtNum(c.kelly.medio)}${PCT}`)}</div>
                  </div>
                  <div className="py-1">
                    <div className="text-tertiary">{es ? "Cuarto de Kelly" : "Quarter Kelly"}</div>
                    <div className="font-semibold text-primary mt-0.5">{siPlan(`${fmtNum(c.kelly.cuarto)}${PCT}`)}</div>
                  </div>
                </div>
                {kellyTopado && (
                  <p className="m-0 text-[12px] leading-[1.5] text-tertiary">
                    {es
                      ? `El control de riesgo va del ${fmtNum(RISK_MIN)}${PCT} al ${fmtNum(RISK_MAX)}${PCT}. Kelly da por exacta una ventaja que solo es una estimación: por encima del tope, arriesgar más no compensa el error de esa estimación.`
                      : `The risk control runs from ${fmtNum(RISK_MIN)}% to ${fmtNum(RISK_MAX)}%. Kelly treats an estimated edge as exact: above the cap, risking more does not make up for the error in that estimate.`}
                  </p>
                )}
                <button
                  type="button"
                  disabled={kellyAplicable <= 0}
                  onClick={() => kellyAplicable > 0 && setRiskPct(kellyAplicable)}
                  className="toque-comodo w-full py-2 text-[13px] tnum font-medium tj-campo text-primary hover:text-[rgb(var(--accent-base))] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {kellyAplicable <= 0
                    ? (es ? `Sin ventaja (Kelly = 0${PCT} · No operar)` : "No edge (Kelly = 0% · Do not trade)")
                    : kellyTopado
                      ? (es ? `Usar medio Kelly con el tope del control (${fmtNum(kellyAplicable)}${PCT} de riesgo)` : `Apply Half-Kelly at the control’s limit (${fmtNum(kellyAplicable)}% risk)`)
                      : (es ? `Usar medio Kelly (${fmtNum(kellyAplicable)}${PCT} de riesgo)` : `Apply Half-Kelly (${fmtNum(kellyAplicable)}% risk)`)}
                </button>
              </div>
            )}
          </div>

          </div>
          <div className="tj-ficha-barra tj-ficha-barra--pie">
          <BotonCopiar
            texto={informePlan}
            disabled={!c.valid}
            rotulo={es ? "Copiar plan de operación" : "Copy trade plan"}
            hecho={es ? "Plan copiado" : "Plan copied"}
          />
            <span className="text-tertiary">{es ? "Privado en tu navegador" : "Private in your browser"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Result({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    /* `caja-cifra` + `cifra-lg`: la cifra se mide contra el ancho de SU
       celda y encoge de 18 a 13,8 px antes que partirse. Con cuerpo fijo
       se partia por la mitad —«0,20 US|$», «$100.1|0», «20,00 accion|es»—
       en cuanto la celda bajaba de unos 100 px, que es lo que pasa cuando
       esta calculadora vive en la columna estrecha de /features/metricas.
       Una cifra rota en dos lineas deja de leerse como un dato. */
    <div
      className="caja-cifra relative flex min-w-0 flex-col border-t border-[var(--line)] py-3.5"
    >
      <div
        className="tnum text-[12px] text-tertiary"
      >
        {label}
      </div>
      <div
        className="tnum cifra-lg min-w-0 break-words font-semibold mt-auto pt-1"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}
