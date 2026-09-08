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
/* Notacion Unicode, no LaTeX.
 *
 * El valor era una cadena de LaTeX que se volcaba TAL CUAL en la pagina:
 * dieciocho fichas ensenaban \max, \frac y \tau en crudo, dentro de una
 * caja rotulada "LATEX", sin ningun renderizador detras.
 *
 * Y siete de esas formulas llevaban palabras CASTELLANAS dentro del propio
 * LaTeX (Ganancias Brutas, Riesgo Inicial, Tamano, Objetivo), asi que la
 * pagina inglesa tambien las ensenaba en espanol. Por eso ahora hay una
 * formula por idioma.
 *
 * Se escriben con los simbolos de verdad —sigma, raiz, sumatorio, integral,
 * subindices— en la monoespaciada que la caja ya usaba. La alternativa era
 * cargar KaTeX y sus fuentes para dieciocho fichas de las 155 paginas del
 * sitio, que no compensa: aqui no hay matrices ni integrales anidadas, y la
 * casa no mete dependencias nuevas sin un motivo que no sea la comodidad. */
export const FORMULAS_GLOSARIO: Record<
  string,
  { formulaEs: string; formulaEn: string; variablesEs: string; variablesEn: string }
> = {
  "sharpe-ratio": {
    formulaEs: "S = (E[R − Rf] / σ) × √N",
    formulaEn: "S = (E[R − Rf] / σ) × √N",
    variablesEs: "μ: retorno medio por trade, Rf: tasa libre de riesgo (Rf=0 en operativa intradiaria), σ: desviación estándar, N: trades/año",
    variablesEn: "μ: mean return per trade, Rf: risk-free rate (Rf=0 in intraday trading), σ: standard deviation, N: trades/year",
  },
  "sortino-ratio": {
    formulaEs: "So = (E[R − Rf] / σd) × √N",
    formulaEn: "So = (E[R − Rf] / σd) × √N",
    variablesEs: "μ: retorno medio, Rf: tasa libre de riesgo (Rf=0 en demo), σd: desviación estándar de retornos negativos, N: trades/año",
    variablesEn: "μ: mean return, Rf: risk-free rate (Rf=0 in demo), σd: downside standard deviation, N: trades/year",
  },
  "calmar-ratio": {
    formulaEs: "Ca = CAGR / |MaxDD|",
    formulaEn: "Ca = CAGR / |MaxDD|",
    variablesEs: "CAGR: tasa de crecimiento anual compuesta, MaxDD: máximo drawdown histórico pico a valle",
    variablesEn: "CAGR: compound annual growth rate, MaxDD: historical peak-to-trough max drawdown",
  },
  /* No hay ningun termino "Omega" en el glosario todavia, asi que esta
     formula no la ve nadie. Se conserva porque el motor SI calcula el
     ratio (`calcOmega` en trading/data.ts) y el dia que entre la ficha
     ya esta escrita. */
  "omega-ratio": {
    /* Solo la forma discreta, que es la que calcula el motor. La razon de
       integrales entera ocupaba ochenta caracteres y a 390 px se partia en
       tres renglones por mitad de la expresion; vive en las variables. */
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
    /* El indice mudo iba en tau, y la tau de la monoespaciada se lee como
       una T mayuscula al lado de la t del tiempo. Se nombra el pico como
       HWM, que ademas es como lo llama el resto del producto. */
    formulaEs: "DDₜ = (HWMₜ − Xₜ) / HWMₜ",
    formulaEn: "DDₜ = (HWMₜ − Xₜ) / HWMₜ",
    variablesEs: "Xₜ: valor de la cuenta en el momento t, HWMₜ: pico histórico mas alto alcanzado hasta t (high-water mark)",
    variablesEn: "Xₜ: equity at time t, HWMₜ: highest historical peak reached up to t (high-water mark)",
  },
  "max-drawdown": {
    formulaEs: "MaxDD = máx [ (HWMₜ − Xₜ) / HWMₜ ]  para todo t",
    formulaEn: "MaxDD = max [ (HWMₜ − Xₜ) / HWMₜ ]  over all t",
    variablesEs: "El mayor retroceso porcentual registrado en toda la serie. HWMₜ: pico historico mas alto hasta t",
    variablesEn: "Largest peak-to-trough percentage decline across the full series. HWMₜ: highest historical peak up to t",
  },
  "kelly-criterion": {
    formulaEs: "f* = (p · b − q) / b = p − q / b",
    formulaEn: "f* = (p · b − q) / b = p − q / b",
    variablesEs: "p: probabilidad de acierto, q = 1 − p: probabilidad de fallo, b: ratio de pago (payoff)",
    variablesEn: "p: win probability, q = 1 − p: loss probability, b: payoff ratio",
  },
  "risk-of-ruin": {
    formulaEs: "P(Ruina) = e^(−2 · E · B / σ²)",
    formulaEn: "P(Ruin) = e^(−2 · E · B / σ²)",
    variablesEs: "E: valor esperado por trade, B: capital antes del nivel de quiebra, σ²: varianza del retorno",
    variablesEn: "E: expected value per trade, B: bankroll buffer before bankruptcy, σ²: variance",
  },
  cagr: {
    formulaEs: "CAGR = (Vf / Vi)^(1 / t) − 1",
    formulaEn: "CAGR = (Vf / Vi)^(1 / t) − 1",
    variablesEs: "Vf: valor final, Vi: valor inicial, t: tiempo transcurrido en años",
    variablesEn: "Vf: final value, Vi: initial value, t: time in years",
  },
  "r-multiple": {
    formulaEs: "R = PnL / Riesgo inicial (1R)",
    formulaEn: "R = PnL / Initial risk (1R)",
    variablesEs: "Beneficio o pérdida normalizado entre la distancia en dólares al stop loss inicial",
    variablesEn: "Profit or loss normalized by the initial dollar risk to the stop loss",
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
};
