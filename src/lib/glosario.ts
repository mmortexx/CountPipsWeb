import { GLOSSARY, type GlossaryCategory, type GlossaryTerm } from "@/lib/trading/glossary";

/**
 * El glosario, convertido en secciones del sitio.
 *
 * ── Por qué existe este archivo ───────────────────────────────────────
 * Los términos llevaban tiempo escritos, en los dos idiomas y con
 * definiciones de calidad, y solo se veían dentro de una ventana emergente
 * que se abre desde un enlace del pie. Cero direcciones propias, cero
 * posibilidad de que alguien llegue buscando «qué es el drawdown». Era el
 * activo más desaprovechado del proyecto.
 *
 * Aquí no se escribe contenido nuevo: se le da dirección al que ya había.
 *
 * ── Sobre el término en inglés ────────────────────────────────────────
 * El nombre del término NO se traduce, y la dirección tampoco. Es la
 * decisión que ya tomó el glosario original y es la correcta: nadie busca
 * «pérdida de parada», se busca «stop loss» aunque se escriba el resto en
 * español. Lo que cambia con el idioma es la definición.
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
 * El `<title>` de una voz del glosario, sin pasarse de largo.
 *
 * ── El problema ───────────────────────────────────────────────────────
 * El patrón «{término}: qué es y por qué importa — CountPips» cuesta 41
 * caracteres fijos, así que cualquier término de más de 19 se sale del
 * ancho que los buscadores muestran (unos 60). De las 155 páginas del
 * sitio, exactamente cuatro se pasaban, y las cuatro por el mismo motivo:
 * MAE y MFE llevan su expansión dentro del nombre —«MAE (Maximum Adverse
 * Excursion)»— y en inglés la cola es aún más larga. El resultado son
 * títulos de 69 a 76 caracteres que Google corta a mitad de frase, justo
 * donde está la promesa de la página.
 *
 * ── Por qué se calcula y no se escribe a mano ─────────────────────────
 * Un campo `tituloCorto` en los datos es una decisión por término que hay que
 * recordar tomar cada vez que se añade una voz, y nadie las va a tomar.
 * Esto se ajusta solo y en el orden que menos duele:
 *
 *   1. El título entero, si cabe.
 *   2. Sin la expansión entre paréntesis: la sigla es lo que se teclea al
 *      buscar, y la expansión ya está en la descripción y en el h1.
 *   3. Con la cola recortada a «qué es», si aún no cabe.
 *
 * El «qué es» se conserva mientras se pueda porque es literalmente como
 * se busca esto: nadie teclea «Drawdown», se teclea «qué es el drawdown».
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

/**
 * Términos vecinos, para que ninguna página sea un callejón sin salida.
 *
 * Son los de su misma familia, que es la relación que de verdad existe en
 * los datos. No invento parentescos que nadie ha declarado: si un término
 * es de riesgo, sus vecinos son los de riesgo.
 */
export function relacionados(slug: string, cuantos = 4): TerminoGlosario[] {
  const t = terminoPorSlug(slug);
  if (!t) return [];
  const mismos = terminosPorCategoria(t.category).filter((x) => x.slug !== slug);
  const i = mismos.findIndex((x) => x.slug > slug);
  const desde = i < 0 ? 0 : i;
  /* Se empieza por el siguiente alfabético y se da la vuelta al llegar al
     final: así cada término enseña vecinos distintos y no salen siempre
     los cuatro primeros de la familia en las trece páginas. */
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

/**
 * Dónde continúa cada familia dentro del producto.
 *
 * Un glosario que solo define palabras es una enciclopedia. Este además
 * lleva a la parte del programa que mide ese concepto, que es lo que hace
 * que la visita sirva para algo.
 */
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
    es: "El guardián que te frena antes de romper tu propio límite",
    en: "The guardian that stops you before you break your own limit",
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
 * Términos que además tienen una herramienta que los calcula.
 *
 * Sólo los que existen de verdad — se comprueban contra las direcciones
 * de `/herramientas`. Un enlace de más aquí sería un 404 en el glosario.
 */
export const HERRAMIENTA_DE: Record<string, string> = {
  /* Riesgo y dimensionamiento */
  "position-sizing": "/herramientas/calculadora-de-riesgo",
  "stop-loss": "/herramientas/calculadora-de-riesgo",
  "risk-reward-ratio": "/herramientas/calculadora-de-riesgo",
  "kelly-criterion": "/herramientas/calculadora-de-riesgo",

  /* Varianza y supervivencia. `risk-of-ruin` apuntaba a una herramienta
     propia que NO existe: no hay tal componente, y el enlace habría sido
     un 404 servido desde el glosario. El Monte Carlo es donde ese
     concepto se ve de verdad, porque el riesgo de ruina sale justamente
     de simular muchos caminos. */
  "risk-of-ruin": "/herramientas/monte-carlo",
  "monte-carlo": "/herramientas/monte-carlo",
  "r-multiple": "/herramientas/monte-carlo",
  drawdown: "/herramientas/monte-carlo",
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
  /* El término se llama «NY session», no «New York session». Escrito a
     ojo daba una clave que no casaba con ningún término y el enlace
     simplemente no habría aparecido — un fallo silencioso, de los que no
     rompen nada y solo restan. */
  "ny-session": "/herramientas/reloj-de-sesiones",
  "asia-session": "/herramientas/reloj-de-sesiones",
  "kill-zone": "/herramientas/reloj-de-sesiones",

  /* Conducta */
  discipline: "/test",
  tilt: "/test",
  "revenge-trading": "/test",
  fomo: "/test",
};

/**
 * Fórmulas matemáticas institucionales para los términos cuantitativos.
 */
export const FORMULAS_GLOSARIO: Record<string, { formula: string; variablesEs: string; variablesEn: string }> = {
  sharpe: {
    formula: "S = \\frac{E[R - R_f]}{\\sigma} \\times \\sqrt{N}",
    variablesEs: "μ: retorno medio por trade, Rf: tasa libre de riesgo (Rf=0 en operativa intradiaria), σ: desviación estándar, N: trades/año",
    variablesEn: "μ: mean return per trade, Rf: risk-free rate (Rf=0 in intraday trading), σ: standard deviation, N: trades/year",
  },
  "sharpe-ratio": {
    formula: "S = \\frac{E[R - R_f]}{\\sigma} \\times \\sqrt{N}",
    variablesEs: "μ: retorno medio por trade, Rf: tasa libre de riesgo (Rf=0 en operativa intradiaria), σ: desviación estándar, N: trades/año",
    variablesEn: "μ: mean return per trade, Rf: risk-free rate (Rf=0 in intraday trading), σ: standard deviation, N: trades/year",
  },
  sortino: {
    formula: "So = \\frac{E[R - R_f]}{\\sigma_d} \\times \\sqrt{N}",
    variablesEs: "μ: retorno medio, Rf: tasa libre de riesgo (Rf=0 en demo), σd: desviación estándar de retornos negativos, N: trades/año",
    variablesEn: "μ: mean return, Rf: risk-free rate (Rf=0 in demo), σd: downside standard deviation, N: trades/year",
  },
  "sortino-ratio": {
    formula: "So = \\frac{E[R - R_f]}{\\sigma_d} \\times \\sqrt{N}",
    variablesEs: "μ: retorno medio, Rf: tasa libre de riesgo (Rf=0 en demo), σd: desviación estándar de retornos negativos, N: trades/año",
    variablesEn: "μ: mean return, Rf: risk-free rate (Rf=0 in demo), σd: downside standard deviation, N: trades/year",
  },
  "calmar-ratio": {
    formula: "Ca = \\frac{CAGR}{|MaxDD|}",
    variablesEs: "CAGR: tasa de crecimiento anual compuesta, MaxDD: máximo drawdown histórico pico a valle",
    variablesEn: "CAGR: compound annual growth rate, MaxDD: historical peak-to-trough max drawdown",
  },
  "omega-ratio": {
    formula: "\\Omega(L) = \\frac{\\int_L^{+\\infty} (1 - F(r))\\,dr}{\\int_{-\\infty}^L F(r)\\,dr} = \\frac{\\sum \\max(r_i - L, 0)}{\\sum \\max(L - r_i, 0)}",
    variablesEs: "L: umbral objetivo (para L=0 en muestra discreta equivale al Profit Factor; para L>0 evalúa asimetría sobre benchmark), F(r): distribución acumulada",
    variablesEn: "L: threshold target (for L=0 on discrete sample matches Profit Factor; for L>0 evaluates asymmetry over benchmark), F(r): cumulative distribution",
  },
  expectancy: {
    formula: "E(R) = (WR \\times \\bar{W}) - ((1 - WR) \\times \\bar{L})",
    variablesEs: "WR: tasa de acierto, W̄: ganancia media en R, L̄: pérdida media en R",
    variablesEn: "WR: win rate, W̄: average win in R, L̄: average loss in R",
  },
  "profit-factor": {
    formula: "PF = \\frac{\\sum \\text{Ganancias Brutas}}{\\sum |\\text{Pérdidas Brutas}|}",
    variablesEs: "Suma de todos los beneficios cerrados dividida entre la suma de todas las pérdidas",
    variablesEn: "Gross closed profits divided by gross closed losses",
  },
  drawdown: {
    formula: "DD_t = \\frac{\\max_{\\tau \\le t} X_\\tau - X_t}{\\max_{\\tau \\le t} X_\\tau}",
    variablesEs: "X_t: valor actual de la cuenta, max X_τ: pico histórico más alto hasta el momento",
    variablesEn: "X_t: current equity, max X_τ: historical high-water mark",
  },
  "max-drawdown": {
    formula: "MaxDD = \\max_{t} \\left( \\frac{\\max_{\\tau \\le t} X_\\tau - X_t}{\\max_{\\tau \\le t} X_\\tau} \\right)",
    variablesEs: "El mayor retroceso porcentual registrado en toda la serie temporal",
    variablesEn: "Largest peak-to-trough percentage decline recorded across the full series",
  },
  "kelly-criterion": {
    formula: "f^* = \\frac{p \\cdot b - q}{b} = p - \\frac{q}{b}",
    variablesEs: "p: probabilidad de acierto, q = 1 - p: probabilidad de fallo, b: ratio de pago (payoff)",
    variablesEn: "p: win probability, q = 1 - p: loss probability, b: payoff ratio",
  },
  "risk-of-ruin": {
    formula: "P(\\text{Ruina}) = e^{-\\frac{2 \\cdot E \\cdot B}{\\sigma^2}}",
    variablesEs: "E: valor esperado por trade, B: capital antes del nivel de quiebra, σ²: varianza del retorno",
    variablesEn: "E: expected value per trade, B: bankroll buffer before bankruptcy, σ²: variance",
  },
  cagr: {
    formula: "CAGR = \\left( \\frac{V_f}{V_i} \\right)^{\\frac{1}{t}} - 1",
    variablesEs: "Vf: valor final, Vi: valor inicial, t: tiempo transcurrido en años",
    variablesEn: "Vf: final value, Vi: initial value, t: time in years",
  },
  "r-multiple": {
    formula: "R = \\frac{\\text{Pnl}}{\\text{Riesgo Inicial } (1R)}",
    variablesEs: "Beneficio o pérdida normalizado entre la distancia en dólares al stop loss inicial",
    variablesEn: "Profit or loss normalized by the initial dollar risk to the stop loss",
  },
  "position-sizing": {
    formula: "\\text{Tamaño} = \\frac{\\text{Balance} \\times \\text{Riesgo}\\%}{|\\text{Precio Entrada} - \\text{Precio Stop}| \\times \\text{Multiplicador}}",
    variablesEs: "Cálculo matemático para fijar la pérdida máxima exacta al nivel de invalidación",
    variablesEn: "Mathematical sizing to cap maximum dollar risk exactly at the stop level",
  },
  "risk-reward-ratio": {
    formula: "RR = \\frac{|\\text{Objetivo} - \\text{Entrada}|}{|\\text{Entrada} - \\text{Stop}|}",
    variablesEs: "Relación entre el beneficio proyectado en el take profit y el riesgo asumido en el stop loss",
    variablesEn: "Ratio of projected target reward versus stop loss risk",
  },
  "win-rate": {
    formula: "WR = \\frac{\\text{Operaciones Ganadoras}}{N_{\\text{total}}} \\times 100",
    variablesEs: "Porcentaje de operaciones con resultado neto positivo",
    variablesEn: "Percentage of total trades that closed with a positive net return",
  },
  payoff: {
    formula: "\\text{Payoff} = \\frac{\\bar{W}}{\\bar{L}} = \\frac{\\text{Ganancia Media}}{\\text{Pérdida Media}}",
    variablesEs: "Ratio de asimetría entre la ganancia media y la pérdida media",
    variablesEn: "Asymmetry ratio between average winning trade and average losing trade",
  },
};
