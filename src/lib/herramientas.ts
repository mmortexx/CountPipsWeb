/**
 * Las herramientas del sitio, con dirección propia.
 *
 * ── Por qué ──────────────────────────────────────────────────────────
 * Había seis calculadoras interactivas, todas funcionando y calculando de
 * verdad, metidas dentro de otras páginas: la de riesgo a media página de
 * métricas, el Monte Carlo al final de disciplina, la de ahorro dentro de
 * precios. Nadie puede enlazar «la calculadora de tamaño de posición de
 * CountPips» porque no existe tal dirección, y son justo el tipo de pieza
 * que la gente enlaza y comparte.
 *
 * Aquí no se escribe una calculadora nueva: se reutilizan exactamente los
 * mismos componentes, que siguen apareciendo donde ya aparecían.
 *
 * ── Sobre el orden ───────────────────────────────────────────────────
 * De más buscado a menos. La de tamaño de posición es, de largo, la
 * consulta más frecuente de quien empieza a gestionar riesgo.
 */

export type Herramienta = {
  slug: string;
  /** Componente que la dibuja. Se resuelve en la página con `dynamic`. */
  componente:
    | "RiskCalculator"
    | "RMultipleSimulator"
    | "EdgeSignificanceChecker"
    | "EquityProjector"
    | "SavingsCalculator"
    | "SessionClock"
    | "DisciplineCost"
    | "CommissionDragCalculator";
  tituloEs: string;
  tituloEn: string;
  /** Titular de la cabecera. Corto: se anima carácter a carácter. */
  h1Es: string;
  h1En: string;
  /** Parte del titular que va resaltada. */
  resaltaEs: string;
  resaltaEn: string;
  subtituloEs: string;
  subtituloEn: string;
  /** Para el índice y para la ficha del buscador. */
  resumenEs: string;
  resumenEn: string;
  descripcionEs: string;
  descripcionEn: string;
};

export const HERRAMIENTAS: Herramienta[] = [
  {
    slug: "calculadora-de-riesgo",
    componente: "RiskCalculator",
    tituloEs: "Calculadora de tamaño de posición",
    tituloEn: "Position size calculator",
    h1Es: "Cuánto puedes arriesgar.",
    h1En: "How much you can risk.",
    resaltaEs: "arriesgar.",
    resaltaEn: "risk.",
    subtituloEs:
      "Dime tu capital, el porcentaje que arriesgas y la distancia a tu stop, y te digo el tamaño exacto de la posición. Sin registro y sin que nada de lo que escribas salga de tu navegador.",
    subtituloEn:
      "Tell me your capital, the percentage you risk and the distance to your stop, and I will tell you the exact position size. No sign-up, and nothing you type leaves your browser.",
    resumenEs: "El tamaño exacto de la posición a partir de tu riesgo y tu stop.",
    resumenEn: "The exact position size from your risk and your stop.",
    descripcionEs:
      "Calcula el tamaño de posición a partir de tu capital, el porcentaje de riesgo por operación y la distancia al stop. Gratis, sin registro y sin enviar datos.",
    descripcionEn:
      "Work out position size from your capital, your risk per trade and the distance to your stop. Free, no sign-up, no data sent.",
  },
  {
    slug: "significancia-estadistica",
    componente: "EdgeSignificanceChecker",
    tituloEs: "¿Tu ventaja es real o es suerte?",
    tituloEn: "Is your edge real, or luck?",
    h1Es: "¿Ventaja real o buena racha?",
    h1En: "Real edge, or a good run?",
    resaltaEs: "o buena racha?",
    resaltaEn: "or a good run?",
    subtituloEs:
      "Con veinte operaciones detrás, un buen resultado no significa nada: cabe de sobra dentro de lo que produce el azar. Mete tus números y mira si tu muestra ya dice algo o todavía no.",
    subtituloEn:
      "With twenty trades behind it, a good result means nothing: it fits comfortably inside what chance alone produces. Enter your numbers and see whether your sample says anything yet.",
    resumenEs: "Si tu muestra ya distingue una ventaja del azar, o aún no.",
    resumenEn: "Whether your sample can tell an edge from chance yet.",
    descripcionEs:
      "Comprueba si tus resultados de trading distinguen una ventaja real del azar, a partir del número de operaciones, el porcentaje de aciertos y el payoff.",
    descripcionEn:
      "Check whether your trading results tell a real edge from chance, using number of trades, win rate and payoff.",
  },
  {
    slug: "monte-carlo",
    componente: "RMultipleSimulator",
    tituloEs: "Simulador de Monte Carlo",
    tituloEn: "Monte Carlo simulator",
    h1Es: "Mil versiones de tu año.",
    h1En: "A thousand versions of your year.",
    resaltaEs: "de tu año.",
    resaltaEn: "of your year.",
    subtituloEs:
      "La misma ventaja, repetida muchas veces, da resultados muy distintos. Esto reordena tus operaciones al azar una y otra vez para enseñarte el abanico completo: no lo que salió, sino lo que podía haber salido.",
    subtituloEn:
      "The same edge, repeated many times, produces very different outcomes. This reshuffles your trades over and over to show you the whole fan: not what happened, but what could have.",
    resumenEs: "El abanico de caminos posibles con tu ventaja, y el peor de ellos.",
    resumenEn: "The fan of possible paths for your edge — and the worst of them.",
    descripcionEs:
      "Simula miles de reordenaciones de tus operaciones para ver el abanico de curvas posibles, la peor racha y el riesgo de arruinar la cuenta.",
    descripcionEn:
      "Simulate thousands of reorderings of your trades to see the fan of possible curves, the worst run and the risk of ruining the account.",
  },
  {
    slug: "proyector-de-capital",
    componente: "EquityProjector",
    tituloEs: "Proyector de capital",
    tituloEn: "Equity projector",
    h1Es: "A dónde lleva tu ventaja.",
    h1En: "Where your edge leads.",
    resaltaEs: "tu ventaja.",
    resaltaEn: "your edge.",
    subtituloEs:
      "Si mantienes tu esperanza matemática y tu ritmo de operaciones, esto es la curva que sale a varios años. Es aritmética, no una promesa: sirve para ver el efecto del interés compuesto, no para contar con él.",
    subtituloEn:
      "If you hold your expectancy and your trade frequency, this is the curve over several years. It is arithmetic, not a promise: it shows what compounding does, it does not guarantee it.",
    resumenEs: "La curva a varios años si mantienes tu esperanza y tu ritmo.",
    resumenEn: "The multi-year curve if you hold your expectancy and pace.",
    descripcionEs:
      "Proyecta tu curva de capital a varios años a partir de tu esperanza matemática por operación y de cuántas haces al mes.",
    descripcionEn:
      "Project your equity curve over several years from your expectancy per trade and how many trades you take per month.",
  },
  {
    slug: "coste-de-indisciplina",
    componente: "DisciplineCost",
    tituloEs: "Calculadora de coste de indisciplina",
    tituloEn: "Cost of indiscipline calculator",
    h1Es: "La factura de tus errores.",
    h1En: "The invoice for your mistakes.",
    resaltaEs: "tus errores.",
    resaltaEn: "your mistakes.",
    subtituloEs:
      "¿Cuánto dinero dejas en la mesa cuando rompes tus reglas? Calcula la brecha exacta entre tu operativa en plan y fuera de plan, y descubre tu fuga de capital anual.",
    subtituloEn:
      "How much money do you leave on the table when breaking your rules? Work out the exact gap between your in-plan and off-plan trades, and discover your annual capital leak.",
    resumenEs: "La brecha real de dinero entre operar en plan o romper tus reglas.",
    resumenEn: "The real cash gap between trading your plan or breaking your rules.",
    descripcionEs:
      "Calcula la factura exacta de tus errores operativos y la diferencia de expectancy entre tus operaciones disciplinadas y fuera de plan.",
    descripcionEn:
      "Calculate the exact invoice of your operational mistakes and the expectancy gap between disciplined and off-plan trades.",
  },
  {
    slug: "reloj-de-sesiones",
    componente: "SessionClock",
    tituloEs: "Reloj de sesiones de mercado",
    tituloEn: "Market session clock",
    h1Es: "Qué mercado está abierto.",
    h1En: "Which market is open.",
    resaltaEs: "está abierto.",
    resaltaEn: "is open.",
    subtituloEs:
      "Asia, Londres y Nueva York en una misma banda de veinticuatro horas, en hora real. Lo que importa no es cuándo abre cada plaza, sino dónde se solapan: ahí hay dos mercados despiertos a la vez.",
    subtituloEn:
      "Asia, London and New York on a single twenty-four-hour band, in real time. What matters is not when each opens, but where they overlap: that is when two markets are awake at once.",
    resumenEs: "Asia, Londres y Nueva York en hora real, con sus solapes.",
    resumenEn: "Asia, London and New York in real time, with their overlaps.",
    descripcionEs:
      "Qué sesión de mercado está abierta ahora mismo y dónde se solapan Asia, Londres y Nueva York, que es cuando el precio más se mueve.",
    descripcionEn:
      "Which market session is open right now and where Asia, London and New York overlap, which is when price moves most.",
  },
  {
    slug: "ahorro-vs-suscripcion",
    componente: "SavingsCalculator",
    tituloEs: "Escenario de coste de lanzamiento",
    tituloEn: "Launch cost scenario",
    h1Es: "Una referencia, no una oferta.",
    h1En: "A reference, not an offer.",
    resaltaEs: "no una oferta.",
    resaltaEn: "not an offer.",
    subtituloEs:
      "Core $149 y Pro $249 son precios previstos de lanzamiento. Introduce una alternativa mensual para comparar escenarios, sin que el resultado sea una oferta de compra.",
    subtituloEn:
      "Core $149 and Pro $249 are planned launch prices. Enter a monthly alternative to compare scenarios; the result is not a purchase offer.",
    resumenEs: "Cómo cambia un escenario mensual frente a una referencia futura.",
    resumenEn: "How a monthly scenario compares with a future reference.",
    descripcionEs:
      "Compara un coste mensual con las referencias de lanzamiento de CountPips, sin convertir el resultado en una promesa de compra.",
    descripcionEn:
      "Compare a monthly cost with CountPips launch references; the result is not a purchase offer.",
  },
  {
    slug: "impacto-de-comisiones",
    componente: "CommissionDragCalculator",
    tituloEs: "Calculadora de comisiones y deslizamiento",
    tituloEn: "Commission and slippage calculator",
    h1Es: "La factura oculta de tu bróker.",
    h1En: "The hidden bill from your broker.",
    resaltaEs: "de tu bróker.",
    resaltaEn: "your broker.",
    subtituloEs:
      "En futuros CME y Forex, las comisiones y el deslizamiento pueden comerse hasta el 40 % de tus ganancias. Introduce tus contratos y calcula el umbral de rentabilidad real por trade.",
    subtituloEn:
      "In CME futures and Forex, commissions and slippage can absorb up to 40% of gross profits. Enter your contracts and calculate the exact break-even threshold per trade.",
    resumenEs: "El impacto real de las tarifas CME, spread y deslizamiento en tu cuenta.",
    resumenEn: "The real bottom-line impact of CME fees, spread and slippage on your trading.",
    descripcionEs:
      "Calcula el drag de comisiones, el coste por deslizamiento y el umbral de break-even por trade en futuros (NQ, ES, MES, MNQ) y Forex.",
    descripcionEn:
      "Calculate commission drag, slippage friction and the exact break-even threshold per trade in futures (NQ, ES, MES, MNQ) and Forex.",
  },
];

export function herramientaPorSlug(slug: string): Herramienta | undefined {
  return HERRAMIENTAS.find((h) => h.slug === slug);
}
