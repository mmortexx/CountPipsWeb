import { GLOSSARY, type GlossaryCategory, type GlossaryTerm } from "@/lib/trading/glossary";
import { herramientaPorSlug } from "@/lib/herramientas";

/**
 * El glosario como secciones del sitio: cada término tiene su dirección.
 * El nombre del término y su dirección no se traducen (se busca «stop loss»,
 * no «pérdida de parada»); lo que cambia con el idioma es la definición.
 */

export type TerminoGlosario = GlossaryTerm & { slug: string };

/** «Risk-reward ratio» → «risk-reward-ratio». */
export function slugTermino(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Los términos con su dirección ya calculada. */
export const TERMINOS: TerminoGlosario[] = GLOSSARY.map((t) => ({
  ...t,
  slug: slugTermino(t.term),
}));

export function terminoPorSlug(slug: string): TerminoGlosario | undefined {
  return TERMINOS.find((t) => t.slug === slug);
}

/**
 * El `<title>` de una voz del glosario, sin pasar del ancho que muestran los
 * buscadores. Se calcula para no depender de recordar un campo por término.
 * Orden: título entero; sin la expansión entre paréntesis (la sigla es lo que
 * se teclea); con la cola recortada a «qué es».
 */
export const LARGO_MAXIMO_TITULO = 60;

export function tituloDeTermino(term: string, lang: "es" | "en"): string {
  const marca = " — CountPips";
  const cola = lang === "es" ? ": qué es y por qué importa" : ": what it is and why it matters";
  const colaCorta = lang === "es" ? ": qué es" : ": what it is";
  const cabe = (s: string) => (s + marca).length <= LARGO_MAXIMO_TITULO;

  const completo = term + cola;
  if (cabe(completo)) return completo;

  const sigla = term.replace(/\s*\([^)]*\)/g, "").trim();
  if (sigla !== term && cabe(sigla + cola)) return sigla + cola;
  if (cabe(sigla + colaCorta)) return sigla + colaCorta;
  return sigla;
}

/**
 * Descripción de la ficha de un término (meta description, og y twitter): la
 * definición recortada por frases enteras, entre 70 y 155 caracteres. Si
 * ninguna frase cierra en ese tramo, el término lleva su descripción en
 * `DESCRIPCION_A_MANO`; `tests/glosario-descripciones.test.ts` falla si un
 * término nuevo la necesita y no la tiene.
 */
export const LARGO_MINIMO_DESCRIPCION = 70;
export const LARGO_MAXIMO_DESCRIPCION = 155;

export function cortePorFrases(definicion: string): string | null {
  const texto = definicion.trim();
  if (texto.length <= LARGO_MAXIMO_DESCRIPCION) return texto;
  // Fin de frase: punto seguido de mayúscula o signo, o del final; o punto y
  // coma, que se cierra con punto. «p. ej.» o «0.4» no cuentan.
  let corte = -1;
  for (const m of texto.matchAll(/[.!?](?=\s+[A-ZÁÉÍÓÚÑ¿¡«+−]|$)|;(?=\s)/g)) {
    const fin = (m.index ?? 0) + 1;
    if (fin > LARGO_MAXIMO_DESCRIPCION) break;
    corte = fin;
  }
  if (corte < LARGO_MINIMO_DESCRIPCION) return null;
  return texto.slice(0, corte).replace(/;$/, ".");
}

export const DESCRIPCION_A_MANO: Record<string, { es?: string; en?: string }> = {
  "track-record": {
    en: "A trader’s real results over time, trade by trade. The longer and more verifiable the record, the more it counts as evidence of an edge.",
  },
  "risk-of-ruin": {
    es: "Probabilidad de que las pérdidas lleven la cuenta al nivel que das por quiebra. Crece exponencialmente con el riesgo por operación.",
    en: "The probability that losses take the account down to the level you count as ruin. It grows exponentially with risk per trade.",
  },
  margin: {
    es: "Colateral que el broker retiene para cubrir una posición apalancada. Por debajo del margen de mantenimiento llega el margin call o el cierre forzoso.",
    en: "Collateral the broker holds to cover a leveraged position. Below the maintenance margin comes a margin call or forced liquidation.",
  },
  discipline: {
    es: "Capacidad de seguir el plan de trading de forma consistente. Sin ella, las métricas miden impulsos y no la estrategia.",
    en: "The ability to follow the trading plan consistently. Without it, the metrics measure impulses, not the strategy.",
  },
  "calmar-ratio": {
    en: "The ratio of annualised return to maximum drawdown: in one number, what you earn against what you suffer at the worst moment.",
  },
  "monte-carlo": {
    es: "Simulación que reordena al azar tus operaciones miles de veces para estimar el rango probable de drawdowns y rentabilidades. Revela la cola de riesgo.",
    en: "A simulation that reshuffles your trades thousands of times to estimate the probable range of drawdowns and returns. It reveals the risk tail.",
  },
  "market-order": {
    es: "Orden que se ejecuta al instante al mejor precio disponible. Garantiza la ejecución, no el precio: en mercados poco líquidos puede haber slippage.",
  },
  leverage: {
    es: "Relación entre el tamaño de la posición y el capital depositado. Multiplica ganancias y pérdidas por igual y amplifica el riesgo de ruina.",
    en: "The ratio between position size and deposited capital. It multiplies gains and losses equally and amplifies the risk of ruin.",
  },
  "london-session": {
    es: "Sesión europea: de 08:00 a 16:30, hora de Londres. Concentra, junto con Nueva York, buena parte del volumen de divisas.",
    en: "European session: 08:00 to 16:30, London time. Together with New York it carries much of the FX volume.",
  },
  "ny-session": {
    es: "Sesión americana: de 09:30 a 16:00, hora de Nueva York. Su solape con Londres suele concentrar el movimiento del día en ES, NQ y EURUSD.",
    en: "American session: 09:30 to 16:00, New York time. Its overlap with London often carries the day’s movement in ES, NQ and EURUSD.",
  },
  "kill-zone": {
    es: "Ventana de una sesión en la que tus setups han funcionado mejor, como la apertura de Londres o la de Nueva York. Se comprueba con tus operaciones.",
    en: "A window within a session where your setups have worked best, such as the London or New York open. It is checked against your own trades.",
  },
  "drawdown-skewness": {
    es: "Asimetría estadística de la serie de drawdowns: mide si las caídas son simétricas o tienden a colas pesadas de pérdidas agudas.",
  },
  "wald-wolfowitz-runs-test": {
    es: "Test no paramétrico de rachas: evalúa si la secuencia de ganadoras y perdedoras es aleatoria o muestra agrupamiento o alternancia artificial.",
    en: "Non-parametric runs test: it checks whether the sequence of wins and losses is random or shows clustering or excessive alternation.",
  },
  "wilson-score-interval": {
    en: "Asymmetric confidence interval for binomial proportions such as win rate. It gives robust bounds on small samples, even near 0% or 100%.",
  },
};

export function descripcionDeTermino(t: TerminoGlosario, lang: "es" | "en"): string {
  const definicion = lang === "es" ? t.es : t.en;
  return (
    DESCRIPCION_A_MANO[t.slug]?.[lang] ??
    cortePorFrases(definicion) ??
    `${definicion.slice(0, LARGO_MAXIMO_DESCRIPCION - 1).replace(/\s+\S*$/, "")}…`
  );
}

/** Nombre visible de cada familia, en los dos idiomas. */
export const CATEGORIAS: Record<
  GlossaryCategory,
  { es: string; en: string; descEs: string; descEn: string }
> = {
  basics: {
    es: "Fundamentos",
    en: "Basics",
    descEs: "El vocabulario mínimo para leer cualquier análisis sin perderse.",
    descEn: "The minimum vocabulary to read any analysis without getting lost.",
  },
  risk: {
    es: "Riesgo",
    en: "Risk",
    descEs: "Lo que decide si una cuenta sobrevive a una mala racha.",
    descEn: "What decides whether an account survives a bad run.",
  },
  psychology: {
    es: "Psicología",
    en: "Psychology",
    descEs: "Los errores que no salen en el gráfico y se pagan igual.",
    descEn: "The mistakes that never show on the chart and cost the same.",
  },
  metrics: {
    es: "Métricas",
    en: "Metrics",
    descEs: "Los números que distinguen una ventaja real de una buena racha.",
    descEn: "The numbers that tell a real edge from a good run.",
  },
  execution: {
    es: "Ejecución",
    en: "Execution",
    descEs: "Cómo se entra y se sale de verdad, con sus costes.",
    descEn: "How you actually get in and out, and what it costs.",
  },
};

/** Orden de presentación: de lo general a lo específico. */
export const ORDEN_CATEGORIAS: GlossaryCategory[] = [
  "basics",
  "risk",
  "metrics",
  "execution",
  "psychology",
];

export function terminosPorCategoria(cat: GlossaryCategory): TerminoGlosario[] {
  return TERMINOS.filter((t) => t.category === cat);
}

/** Términos vecinos de su misma familia, para que ninguna página sea un callejón sin salida. */
export function relacionados(slug: string, cuantos = 4): TerminoGlosario[] {
  const t = terminoPorSlug(slug);
  if (!t) return [];
  const mismos = terminosPorCategoria(t.category).filter((x) => x.slug !== slug);
  const i = mismos.findIndex((x) => x.slug > slug);
  const desde = i < 0 ? 0 : i;
  // Se empieza por el siguiente alfabético y se da la vuelta, para que cada
  // término enseñe vecinos distintos.
  return [...mismos.slice(desde), ...mismos.slice(0, desde)].slice(0, cuantos);
}

/** Anterior y siguiente en el recorrido completo, para poder hojearlo. */
export function vecinos(slug: string): {
  anterior?: TerminoGlosario;
  siguiente?: TerminoGlosario;
} {
  const i = TERMINOS.findIndex((t) => t.slug === slug);
  if (i < 0) return {};
  return {
    anterior: i > 0 ? TERMINOS[i - 1] : undefined,
    siguiente: i < TERMINOS.length - 1 ? TERMINOS[i + 1] : undefined,
  };
}

/** Dónde continúa cada familia dentro del producto. */
export const SEGUIR_LEYENDO: Record<
  GlossaryCategory,
  { href: string; es: string; en: string }
> = {
  basics: {
    href: "/features",
    es: "Todo lo que el diario registra de cada operación",
    en: "Everything the journal records about each trade",
  },
  risk: {
    href: "/features/disciplina",
    es: "El guardián que mide cada operación contra tu propio límite",
    en: "The guardian that measures every trade against your own limit",
  },
  metrics: {
    href: "/features/metricas",
    es: "Las métricas que separan una ventaja real de una racha",
    en: "The metrics that tell a real edge from a run",
  },
  execution: {
    href: "/features/metricas",
    es: "Rendimiento por hora, por día y por setup",
    en: "Performance by hour, by day and by setup",
  },
  psychology: {
    href: "/features/disciplina",
    es: "Cuánto cuesta en dinero saltarse el plan",
    en: "What breaking the plan costs in money",
  },
};

/**
 * Términos que además tienen una herramienta que los calcula. Solo
 * direcciones que existen en `/herramientas`: una de más sería un 404.
 */
export const HERRAMIENTA_DE: Record<string, string> = {
  /* Riesgo y dimensionamiento */
  "position-sizing": "/herramientas/calculadora-de-riesgo",
  "stop-loss": "/herramientas/calculadora-de-riesgo",
  "risk-reward-ratio": "/herramientas/calculadora-de-riesgo",
  "kelly-criterion": "/herramientas/calculadora-de-riesgo",

  /* Varianza y supervivencia: el riesgo de ruina se ve en el Monte Carlo. */
  "risk-of-ruin": "/herramientas/monte-carlo",
  "monte-carlo": "/herramientas/monte-carlo",
  "r-multiple": "/herramientas/monte-carlo",
  /* El drawdown lleva a lo que cuesta salir de él; el máximo, al Monte Carlo. */
  drawdown: "/herramientas/recuperacion-de-drawdown",
  "max-drawdown": "/herramientas/monte-carlo",

  /* ¿Ventaja o azar? */
  expectancy: "/herramientas/significancia-estadistica",
  "win-rate": "/herramientas/significancia-estadistica",
  edge: "/herramientas/significancia-estadistica",
  payoff: "/herramientas/significancia-estadistica",
  backtesting: "/herramientas/significancia-estadistica",
  "curve-fitting": "/herramientas/significancia-estadistica",

  /* Interés compuesto */
  cagr: "/herramientas/proyector-de-capital",

  /* Horarios */
  "london-session": "/herramientas/reloj-de-sesiones",
  /* La clave sale del término «NY session»; una que no case no da error y el enlace no aparece. */
  "ny-session": "/herramientas/reloj-de-sesiones",
  "asia-session": "/herramientas/reloj-de-sesiones",
  "kill-zone": "/herramientas/reloj-de-sesiones",

  /* Pruebas de fondeo */
  "prop-firm": "/herramientas/prueba-de-fondeo",

  /* Conducta */
  discipline: "/test",
  tilt: "/test",
  "revenge-trading": "/test",
  fomo: "/test",
};

/**
 * Fórmulas de los términos cuantitativos, en notación Unicode (no LaTeX, que
 * no tiene renderizador) y una por idioma.
 */
export const FORMULAS_GLOSARIO: Record<
  string,
  { formulaEs: string; formulaEn: string; variablesEs: string; variablesEn: string }
> = {
  "sharpe-ratio": {
    formulaEs: "S = ((μ − Rf) / σ) × √N",
    formulaEn: "S = ((μ − Rf) / σ) × √N",
    variablesEs: "μ: retorno medio por operación, Rf: tasa libre de riesgo (Rf=0 en operativa intradiaria), σ: desviación estándar, N: operaciones/año",
    variablesEn: "μ: mean return per trade, Rf: risk-free rate (Rf=0 in intraday trading), σ: standard deviation, N: trades/year",
  },
  "sortino-ratio": {
    formulaEs: "So = ((μ − Rf) / σd) × √N",
    formulaEn: "So = ((μ − Rf) / σd) × √N",
    variablesEs: "μ: retorno medio, Rf: tasa libre de riesgo (Rf=0 en demo), σd: desviación estándar de retornos negativos, N: operaciones/año",
    variablesEn: "μ: mean return, Rf: risk-free rate (Rf=0 in demo), σd: downside standard deviation, N: trades/year",
  },
  "calmar-ratio": {
    formulaEs: "Ca = CAGR / |MaxDD|",
    formulaEn: "Ca = CAGR / |MaxDD|",
    variablesEs: "CAGR: tasa de crecimiento anual compuesta, MaxDD: máximo drawdown histórico pico a valle",
    variablesEn: "CAGR: compound annual growth rate, MaxDD: historical peak-to-trough max drawdown",
  },
  /* Aún no hay término «Omega» en el glosario: la fórmula espera su ficha
     (el motor ya calcula el ratio con `calcOmega`). */
  "omega-ratio": {
    /* Solo la forma discreta: la razón de integrales no cabe a 390 px y vive en las variables. */
    formulaEs: "Ω(L) = Σ máx(rᵢ − L, 0) / Σ máx(L − rᵢ, 0)",
    formulaEn: "Ω(L) = Σ max(rᵢ − L, 0) / Σ max(L − rᵢ, 0)",
    variablesEs: "Forma discreta de ∫(L,∞)(1−F(r))dr / ∫(−∞,L)F(r)dr. L: umbral objetivo (para L=0 equivale al Profit Factor; para L>0 evalúa asimetría sobre benchmark), rᵢ: retorno de cada operación, F(r): distribución acumulada",
    variablesEn: "Discrete form of ∫(L,∞)(1−F(r))dr / ∫(−∞,L)F(r)dr. L: threshold target (for L=0 matches Profit Factor; for L>0 evaluates asymmetry over benchmark), rᵢ: return of each trade, F(r): cumulative distribution",
  },
  expectancy: {
    formulaEs: "E(R) = (WR × W̄) − ((1 − WR) × L̄)",
    formulaEn: "E(R) = (WR × W̄) − ((1 − WR) × L̄)",
    variablesEs: "WR: tasa de acierto, W̄: ganancia media en R, L̄: pérdida media en R",
    variablesEn: "WR: win rate, W̄: average win in R, L̄: average loss in R",
  },
  "profit-factor": {
    formulaEs: "PF = Σ Ganancias brutas / Σ |Pérdidas brutas|",
    formulaEn: "PF = Σ Gross profits / Σ |Gross losses|",
    variablesEs: "Suma de todos los beneficios cerrados dividida entre la suma de todas las pérdidas",
    variablesEn: "Gross closed profits divided by gross closed losses",
  },
  drawdown: {
    /* El pico se llama HWM, como en el resto del producto; el índice en tau
       se confunde con una T al lado de la t. */
    formulaEs: "DDₜ = (HWMₜ − Xₜ) / HWMₜ",
    formulaEn: "DDₜ = (HWMₜ − Xₜ) / HWMₜ",
    variablesEs: "Xₜ: valor de la cuenta en el momento t, HWMₜ: pico histórico más alto alcanzado hasta t (high-water mark)",
    variablesEn: "Xₜ: equity at time t, HWMₜ: highest historical peak reached up to t (high-water mark)",
  },
  "max-drawdown": {
    formulaEs: "MaxDD = máx [ (HWMₜ − Xₜ) / HWMₜ ]  para todo t",
    formulaEn: "MaxDD = max [ (HWMₜ − Xₜ) / HWMₜ ]  over all t",
    variablesEs: "El mayor retroceso porcentual registrado en toda la serie. HWMₜ: pico histórico más alto hasta t",
    variablesEn: "Largest peak-to-trough percentage decline across the full series. HWMₜ: highest historical peak up to t",
  },
  "kelly-criterion": {
    formulaEs: "f* = (p · b − q) / b = p − q / b",
    formulaEn: "f* = (p · b − q) / b = p − q / b",
    variablesEs: "p: probabilidad de acierto, q = 1 − p: probabilidad de fallo, b: ratio de pago (payoff)",
    variablesEn: "p: win probability, q = 1 − p: loss probability, b: payoff ratio",
  },
  "risk-of-ruin": {
    formulaEs: "P(Ruina) = z^U, con p · z^b + q / z = 1",
    formulaEn: "P(Ruin) = z^U, where p · z^b + q / z = 1",
    variablesEs: "p: probabilidad de acierto, q: 1 − p, b: payoff (ganancia entre pérdida), U: umbral de ruina entre riesgo por operación, z: la raíz entre q y 1",
    variablesEn: "p: win probability, q: 1 − p, b: payoff (win over loss), U: ruin threshold over risk per trade, z: the root between q and 1",
  },
  cagr: {
    formulaEs: "CAGR = (Vf / Vi)^(1 / t) − 1",
    formulaEn: "CAGR = (Vf / Vi)^(1 / t) − 1",
    variablesEs: "Vf: valor final, Vi: valor inicial, t: tiempo transcurrido en años",
    variablesEn: "Vf: final value, Vi: initial value, t: time in years",
  },
  "r-multiple": {
    formulaEs: "R = P&L / Riesgo inicial (1R)",
    formulaEn: "R = P&L / Initial risk (1R)",
    variablesEs: "Beneficio o pérdida normalizado entre la distancia en dólares al stop loss inicial",
    variablesEn: "Profit or loss normalised by the initial dollar risk to the stop loss",
  },
  "position-sizing": {
    formulaEs: "Tamaño = (Balance × Riesgo %) / (|Precio entrada − Precio stop| × Multiplicador)",
    formulaEn: "Size = (Balance × Risk %) / (|Entry price − Stop price| × Multiplier)",
    variablesEs: "Cálculo matemático para fijar la pérdida máxima exacta al nivel de invalidación",
    variablesEn: "Mathematical sizing to cap maximum dollar risk exactly at the stop level",
  },
  "risk-reward-ratio": {
    formulaEs: "RR = |Objetivo − Entrada| / |Entrada − Stop|",
    formulaEn: "RR = |Target − Entry| / |Entry − Stop|",
    variablesEs: "Relación entre el beneficio proyectado en el take profit y el riesgo asumido en el stop loss",
    variablesEn: "Ratio of projected target reward versus stop loss risk",
  },
  "win-rate": {
    formulaEs: "WR = (Operaciones ganadoras / N) × 100",
    formulaEn: "WR = (Winning trades / N) × 100",
    variablesEs: "Porcentaje de operaciones con resultado neto positivo",
    variablesEn: "Percentage of total trades that closed with a positive net return",
  },
  payoff: {
    formulaEs: "Payoff = W̄ / L̄ = Ganancia media / Pérdida media",
    formulaEn: "Payoff = W̄ / L̄ = Average win / Average loss",
    variablesEs: "Ratio de asimetría entre la ganancia media y la pérdida media",
    variablesEn: "Asymmetry ratio between average winning trade and average losing trade",
  },
  /* Las cuatro siguientes reflejan lo que calcula el motor (computeSqn,
     computeUlcerIndex, computeGainToPain y computeWilsonCI en trading/data.ts). */
  "sqn-system-quality-number": {
    formulaEs: "SQN = √N × R̄ / σR",
    formulaEn: "SQN = √N × R̄ / σR",
    variablesEs: "N: número de operaciones, R̄: R-múltiplo medio, σR: desviación estándar de los R-múltiplos",
    variablesEn: "N: number of trades, R̄: mean R-multiple, σR: standard deviation of the R-multiples",
  },
  "ulcer-index": {
    formulaEs: "UI = √(Σ DDᵢ² / N)",
    formulaEn: "UI = √(Σ DDᵢ² / N)",
    variablesEs: "DDᵢ: caída en % de la curva de capital desde su máximo tras la operación i, N: número de operaciones",
    variablesEn: "DDᵢ: equity curve decline in % from its peak after trade i, N: number of trades",
  },
  "gain-to-pain-ratio": {
    formulaEs: "GPR = Σ Resultado neto / |Σ Pérdidas|",
    formulaEn: "GPR = Σ Net result / |Σ Losses|",
    variablesEs: "Resultado neto de todas las operaciones dividido entre el valor absoluto de la suma de las perdedoras",
    variablesEn: "Net result of all trades divided by the absolute sum of the losing ones",
  },
  "wilson-score-interval": {
    formulaEs: "IC = (p̂ + z²/2N ± z√(p̂(1 − p̂)/N + z²/4N²)) / (1 + z²/N)",
    formulaEn: "CI = (p̂ + z²/2N ± z√(p̂(1 − p̂)/N + z²/4N²)) / (1 + z²/N)",
    variablesEs: "p̂: tasa de acierto observada, N: número de operaciones, z: 1,96 para un 95\u00a0% de confianza",
    variablesEn: "p̂: observed win rate, N: number of trades, z: 1.96 for 95% confidence",
  },
};

/**
 * Lo que enseña la ficha de un término, resuelto en el servidor: si la vista
 * (de cliente) llamara a `relacionados` o `vecinos`, llevaría al navegador
 * todos los términos para pintar seis enlaces.
 */
export type FichaTermino = {
  termino: TerminoGlosario;
  familia: (typeof CATEGORIAS)[GlossaryCategory];
  seguir: (typeof SEGUIR_LEYENDO)[GlossaryCategory];
  herramienta?: { href: string; esTest: boolean; tituloEs: string; tituloEn: string };
  formula?: (typeof FORMULAS_GLOSARIO)[string];
  cercanos: TerminoGlosario[];
  anterior?: TerminoGlosario;
  siguiente?: TerminoGlosario;
};

export function fichaDeTermino(t: TerminoGlosario): FichaTermino {
  const href = HERRAMIENTA_DE[t.slug];
  const esTest = href === "/test";
  const ficha = href && !esTest ? herramientaPorSlug(href.split("/").pop() ?? "") : undefined;
  const { anterior, siguiente } = vecinos(t.slug);
  return {
    termino: t,
    familia: CATEGORIAS[t.category],
    seguir: SEGUIR_LEYENDO[t.category],
    herramienta: href && (esTest || ficha) ? { href, esTest, tituloEs: ficha?.tituloEs ?? "", tituloEn: ficha?.tituloEn ?? "" } : undefined,
    formula: FORMULAS_GLOSARIO[t.slug],
    cercanos: relacionados(t.slug),
    anterior,
    siguiente,
  };
}
