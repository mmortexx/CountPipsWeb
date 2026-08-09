import type { LaminaProducto } from "@/components/tj/ProductPlate";

/**
 * Las láminas del producto: qué captura se enseña, con qué número, qué dice
 * su pie y qué detalle se enseña en su lugar cuando la pantalla es estrecha.
 *
 * ── REGLA: SOLO SE DESCRIBE LO QUE SE HA MIRADO ───────────────────────
 * Cada entrada de aquí la escribió alguien después de abrir el `.webp` y
 * leer lo que había dentro. No se deduce del nombre del fichero. Un pie que
 * describe una pantalla que no es la que se ve es peor que no poner pie,
 * porque el visitante SÍ ve la captura y detecta el desajuste.
 *
 * Las ocho están abiertas y miradas. Antes eran dos, y de las otras seis
 * cuatro no se referenciaban desde ningún sitio del código: existían en
 * `public/img/` sin que nada las enseñara.
 *
 * ── LAS CIFRAS DE LA APP NO SON LAS DE LA WEB ─────────────────────────
 * La aplicación de las capturas trabaja sobre su propio juego de datos de
 * muestra (200 operaciones, profit factor 1,56, Sharpe 3,34) y el motor de
 * la web sobre el suyo (profit factor 1,55, Sharpe 3,27). Son muestras
 * distintas, no una contradicción — pero por eso los pies NO repiten
 * cifras: dentro de la captura un número es «lo que este programa calcula»,
 * y sacarlo fuera lo convertiría en dos verdades que no cuadran.
 *
 * ── LO QUE ESTAS OCHO PANTALLAS TIENEN EN COMÚN ───────────────────────
 * Al mirarlas seguidas aparece un patrón que no estaba escrito en ninguna
 * parte y que es, con diferencia, lo mejor que tiene el producto: la
 * aplicación DICE CUÁNDO NO SABE. «Muestra corta», «No concluyente»,
 * «Todavía no hay días suficientes en los dos lados para comparar», «Sin
 * capturas para esta operación». Un journal que en vez de rellenar el hueco
 * con una cifra te dice que aún no la tiene. Los pies de estas láminas
 * están escritos para que eso se note, porque es lo que separa a este
 * producto de los que prometen una ventaja el primer día.
 */
export const LAMINAS_PRODUCTO: Record<string, LaminaProducto> = {
  resumen: {
    archivo: "app-resumen.webp",
    roman: "I",
    tituloEs: "La pantalla con la que se abre el día",
    tituloEn: "The screen the day opens with",
    notaEs:
      "El parte de hoy en lenguaje llano, la fila de métricas, la curva de rendimiento y el " +
      "calendario del mes con el resultado de cada día. Cuando la muestra no da para afirmar " +
      "nada, la propia aplicación lo dice en vez de rellenar el hueco con una cifra.",
    notaEn:
      "Today's briefing in plain language, the metrics row, the performance curve and the " +
      "month calendar with each day's result. When the sample isn't large enough to claim " +
      "anything, the application says so instead of filling the gap with a number.",
    altEs:
      "Pantalla de resumen de la aplicación: parte del día, fila con P&L total, win rate, " +
      "expectancy, profit factor, drawdown actual, racha y disciplina; debajo, la curva de " +
      "rendimiento y un calendario mensual con la ganancia o pérdida de cada día.",
    altEn:
      "Application overview screen: daily briefing, a row with total P&L, win rate, " +
      "expectancy, profit factor, current drawdown, streak and discipline; below, the " +
      "performance curve and a monthly calendar with each day's profit or loss.",
    detalleEs: "el calendario del mes",
    detalleEn: "the month calendar",
  },

  analitica: {
    archivo: "app-analitica.webp",
    roman: "II",
    tituloEs: "Donde se comprueba si la ventaja existe",
    tituloEn: "Where you check whether the edge is real",
    notaEs:
      "Seis grupos de análisis, filtros por instrumento, setup, dirección y cumplimiento, y " +
      "una tabla que compara el mes, el trimestre, el año y todo el histórico con el mismo " +
      "criterio. Ninguna cifra aparece sin el número de operaciones sobre el que se calcula.",
    notaEn:
      "Six analysis groups, filters by instrument, setup, direction and rule compliance, and " +
      "a table comparing the month, the quarter, the year and the full history by the same " +
      "criteria. No figure appears without the number of trades it is computed on.",
    altEs:
      "Pantalla de analítica: pestañas de resumen, riesgo, distribuciones, tiempo y cadencia, " +
      "atribución y comportamiento; filtros; tabla comparativa por periodo con operaciones, " +
      "neto, win rate, profit factor y máxima caída; y bloques de ganadoras frente a " +
      "perdedoras y de riesgo y calidad.",
    altEn:
      "Analytics screen: tabs for summary, risk, distributions, timing, attribution and " +
      "behaviour; filters; a per-period comparison table with trades, net, win rate, profit " +
      "factor and max drawdown; and blocks for winners versus losers and for risk and quality.",
    detalleEs: "ganadoras frente a perdedoras",
    detalleEn: "winners versus losers",
  },

  curva: {
    archivo: "app-curva.webp",
    roman: "III",
    tituloEs: "La curva, y la que habrías tenido siguiendo el plan",
    tituloEn: "The curve, and the one you'd have had sticking to the plan",
    notaEs:
      "Dos trazos sobre el mismo eje: lo que hiciste y lo que habrías acumulado tomando solo " +
      "las operaciones que respetaron tu plan. La distancia entre ambos es lo que te ha " +
      "costado saltártelo, en dinero y a la vista. Encima, el veredicto sobre si la ventaja " +
      "se distingue del azar, con su valor p y sus intervalos de confianza.",
    notaEn:
      "Two lines on the same axis: what you did, and what you'd have accumulated taking only " +
      "the trades that followed your plan. The gap between them is what breaking it has cost " +
      "you, in money and in plain sight. Above, the verdict on whether the edge is " +
      "distinguishable from chance, with its p-value and confidence intervals.",
    altEs:
      "Pantalla de analítica con la curva de rendimiento filtrada: una línea continua para el " +
      "resultado real y otra discontinua para el resultado siguiendo el plan, con las zonas " +
      "de caída sombreadas. Encima, el bloque «¿Ventaja real o suerte?» con win rate, " +
      "expectancy, profit factor y sus intervalos de confianza al 95 %; al lado, la calidad " +
      "de la curva con linealidad, K-Ratio y pendiente por operación.",
    altEn:
      "Analytics screen with the filtered performance curve: a solid line for the actual " +
      "result and a dashed one for the result following the plan, with drawdown areas shaded. " +
      "Above, the «Real edge or luck?» block with win rate, expectancy, profit factor and " +
      "their 95 % confidence intervals; beside it, curve quality with linearity, K-Ratio and " +
      "slope per trade.",
    detalleEs: "la curva y su línea de trazos",
    detalleEn: "the curve and its dashed line",
  },

  operaciones: {
    archivo: "app-operaciones.webp",
    roman: "IV",
    tituloEs: "El registro entero, y las métricas de lo que filtras",
    tituloEn: "The whole log, and the metrics of whatever you filter",
    notaEs:
      "Filtros por instrumento, dirección, cumplimiento, resultado y setup. Lo que importa no " +
      "es la tabla: es la fila de métricas de encima, que se recalcula sobre lo que queda en " +
      "pantalla. Preguntar «¿y si quito los días que no cumplí mi plan?» deja de ser una " +
      "hipótesis y pasa a ser dos clics.",
    notaEn:
      "Filters by instrument, direction, rule compliance, outcome and setup. The table isn't " +
      "the point: the metrics row above it is, and it recalculates over whatever is left on " +
      "screen. Asking «what if I drop the days I broke my plan?» stops being a hypothesis and " +
      "becomes two clicks.",
    altEs:
      "Pantalla de operaciones con 200 registros: filas de filtros, una fila con P&L total, " +
      "win rate, número de operaciones y expectancy calculada sobre lo filtrado, y una tabla " +
      "sin líneas verticales con instrumento, setup, sesión, entrada y salida, duración, " +
      "cierre, P&L neto, R y si la operación cumplió el plan.",
    altEn:
      "Trades screen with 200 records: filter rows, a row with total P&L, win rate, trade " +
      "count and expectancy computed over the filtered set, and a table without vertical " +
      "rules listing instrument, setup, session, entry and exit, duration, close, net P&L, R " +
      "and whether the trade followed the plan.",
    detalleEs: "la cabecera del registro",
    detalleEn: "the top of the log",
  },

  detalle: {
    archivo: "app-detalle.webp",
    roman: "V",
    tituloEs: "Una operación, con todo lo que se puede saber de ella",
    tituloEn: "One trade, with everything that can be known about it",
    notaEs:
      "El recorrido completo: hasta dónde fue en contra antes de salir y hasta dónde llegó a " +
      "favor, medidos en múltiplos de riesgo. Debajo, algo que casi ningún journal registra: " +
      "cuánto tiempo pasó desde que cerraste la anterior. Es el dato que delata la operación " +
      "que abriste por no quedarte quieto.",
    notaEn:
      "The full excursion: how far it went against you before you got out, and how far it " +
      "went in your favour, measured in risk multiples. Below, something almost no journal " +
      "records: how long it had been since you closed the previous one. That's the number " +
      "that gives away the trade you opened just to be doing something.",
    altEs:
      "Detalle de una operación corta en BTC/USDT: P&L neto, múltiplo de R, riesgo en dólares " +
      "y porcentaje de la cuenta, y RR planeado. Una barra muestra el recorrido con la " +
      "excursión adversa máxima y la favorable máxima en los extremos; otra, la proporción " +
      "entre riesgo y recompensa. Debajo, la ejecución, el plan, el hueco desde la operación " +
      "anterior y los campos de revisión.",
    altEn:
      "Detail of a short BTC/USDT trade: net P&L, R multiple, risk in dollars and as a share " +
      "of the account, and planned RR. One bar shows the excursion with maximum adverse and " +
      "maximum favourable at its ends; another, the risk-to-reward proportion. Below, the " +
      "execution, the plan, the gap since the previous trade and the review fields.",
    detalleEs: "el recorrido de la operación",
    detalleEn: "the trade's excursion",
  },

  diario: {
    archivo: "app-diario.webp",
    roman: "VI",
    tituloEs: "Veinte segundos antes de operar",
    tituloEn: "Twenty seconds before trading",
    notaEs:
      "Horas de sueño, estado mental, estado físico y si hoy traes plan. Se guarda solo. Y " +
      "cuando aún no hay días suficientes a los dos lados para comparar, la aplicación " +
      "escribe «muestra corta» y no enseña un número: prefiere no decir nada a decir algo que " +
      "todavía no sostiene.",
    notaEn:
      "Hours of sleep, mental state, physical state, and whether you have a plan today. It " +
      "saves itself. And when there still aren't enough days on both sides to compare, the " +
      "application writes «short sample» and shows no number: it would rather say nothing " +
      "than say something it can't yet support.",
    altEs:
      "Pantalla de diario con el check-in del día: horas de sueño, estado mental y físico como " +
      "barras de cinco pasos, y un interruptor de «¿tienes plan hoy?». Debajo, comparativas " +
      "marcadas como muestra corta, el bloque «¿escribir el diario te compensa?» y una tira " +
      "con la constancia del check-in de los últimos treinta días.",
    altEn:
      "Journal screen with the daily check-in: hours of sleep, mental and physical state as " +
      "five-step bars, and a «do you have a plan today?» switch. Below, comparisons flagged " +
      "as short samples, the «does journalling pay off?» block and a strip showing check-in " +
      "consistency over the last thirty days.",
    detalleEs: "el check-in del día",
    detalleEn: "the daily check-in",
  },

  playbook: {
    archivo: "app-playbook.webp",
    roman: "VII",
    tituloEs: "Cada setup, juzgado por separado",
    tituloEn: "Each setup, judged on its own",
    notaEs:
      "Cinco estrategias con su muestra, su expectancy, su reparto de R y su porcentaje de " +
      "cumplimiento. Dos salen «ventaja confirmada» y dos, «no concluyente» — y ese segundo " +
      "sello es el que hace creíble al primero: un playbook donde todo funciona no está " +
      "midiendo nada.",
    notaEn:
      "Five strategies with their sample, expectancy, R spread and compliance rate. Two come " +
      "out as «confirmed edge» and two as «inconclusive» — and that second verdict is what " +
      "makes the first believable: a playbook where everything works isn't measuring " +
      "anything.",
    altEs:
      "Pantalla de playbook con cinco tarjetas —ruptura, reversión, pullback, rango y " +
      "tendencia—, cada una con su curva en miniatura, tamaño de muestra, expectancy, " +
      "porcentaje de aciertos, P&L total, un sello de ventaja confirmada o no concluyente, la " +
      "mejor sesión, el cumplimiento y el reparto de R con su mediana.",
    altEn:
      "Playbook screen with five cards —breakout, reversal, pullback, range and trend—, each " +
      "with a miniature curve, sample size, expectancy, hit rate, total P&L, a confirmed-edge " +
      "or inconclusive stamp, best session, compliance and the R spread with its median.",
    detalleEs: "una de las cinco fichas",
    detalleEn: "one of the five cards",
  },

  nueva: {
    archivo: "app-nueva.webp",
    roman: "VIII",
    tituloEs: "Anotar la operación recién cerrada",
    tituloEn: "Logging the trade you just closed",
    notaEs:
      "Dirección, instrumento, entrada, salida, stop y objetivo, con la calculadora de tamaño " +
      "al lado y el riesgo de la operación actualizándose mientras escribes. Las capturas del " +
      "gráfico se arrastran o se pegan con Ctrl+V. Todo lo que se rellena aquí es lo que " +
      "luego pueden medir las otras siete pantallas.",
    notaEn:
      "Direction, instrument, entry, exit, stop and target, with the size calculator beside " +
      "them and the trade's risk updating as you type. Chart screenshots are dropped in or " +
      "pasted with Ctrl+V. Everything filled in here is what the other seven screens can " +
      "later measure.",
    altEs:
      "Formulario de nueva operación: zona para arrastrar capturas del gráfico, selector de " +
      "largo o corto, campos de instrumento, entrada, salida, cantidad con calculadora de " +
      "tamaño, stop, objetivo, setup y nota, un interruptor de modo avanzado para varias " +
      "entradas o salidas, y el riesgo de la operación en dólares, RR objetivo y porcentaje " +
      "de la cuenta.",
    altEn:
      "New trade form: a drop area for chart screenshots, a long or short selector, fields " +
      "for instrument, entry, exit, quantity with a size calculator, stop, target, setup and " +
      "note, an advanced-mode switch for multiple entries or exits, and the trade's risk in " +
      "dollars, target RR and share of the account.",
    detalleEs: "los campos de la operación",
    detalleEn: "the trade fields",
  },
};

/** El orden en que las láminas se numeran y se enseñan. */
export const ORDEN_LAMINAS = [
  "resumen",
  "analitica",
  "curva",
  "operaciones",
  "detalle",
  "diario",
  "playbook",
  "nueva",
] as const;
