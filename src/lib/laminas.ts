import type { LaminaProducto } from "@/components/tj/ProductPlate";

/**
 * Las láminas del producto: qué captura se enseña, con qué número, qué dice
 * su pie y qué detalle se enseña en su lugar cuando la pantalla es estrecha.
 *
 * ── REGLA: SOLO SE DESCRIBE LO QUE SE HA MIRADO ───────────────────────
 * Cada entrada de aquí la escribió alguien después de abrir el `.png`
 * original y leer lo que había dentro. No se deduce del nombre del fichero.
 * Un pie que describe una pantalla que no es la que se ve es peor que no
 * poner pie, porque el visitante SÍ ve la captura y detecta el desajuste.
 *
 * Las siete están abiertas y miradas, una por una, sobre las capturas de
 * agosto de 2026. Las anteriores describían el diseño dorado, con pantallas
 * que ya no existen —«nueva operación», «detalle de operación», «la curva
 * frente al plan»— y con cifras que ya no salen en ninguna parte.
 *
 * ── LAS CIFRAS DE LA APP NO SON LAS DE LA WEB ─────────────────────────
 * La aplicación de las capturas trabaja sobre su propio juego de datos de
 * muestra (200 operaciones, profit factor 1,67) y el motor de la web sobre
 * el suyo. Son muestras distintas, no una contradicción — pero por eso los
 * pies NO repiten cifras: dentro de la captura un número es «lo que este
 * programa calcula», y sacarlo fuera lo convertiría en dos verdades que no
 * cuadran.
 *
 * ── LO QUE ESTAS SIETE PANTALLAS TIENEN EN COMÚN ──────────────────────
 * Al mirarlas seguidas aparece un patrón que es, con diferencia, lo mejor
 * que tiene el producto: la aplicación DICE CUÁNDO NO SABE y OBJETA ANTES
 * DE QUE PULSES. «No concluyente» en las cinco fichas del playbook, «Aún no
 * hay suficientes check-ins», «Todavía no hay días suficientes en los dos
 * lados para comparar», y tres bandas de aviso cuando el tamaño de la
 * operación se sale de lo que tú sueles hacer. Un journal que en vez de
 * rellenar el hueco con una cifra te dice que aún no la tiene. Los pies
 * están escritos para que eso se note, porque es lo que separa a este
 * producto de los que prometen una ventaja el primer día.
 */
export const LAMINAS_PRODUCTO: Record<string, LaminaProducto> = {
  resumen: {
    archivo: "app-resumen.webp",
    ancho: 1576,
    alto: 836,
    roman: "I",
    pestanaEs: "Resumen",
    pestanaEn: "Overview",
    tituloEs: "La curva y el mes, uno al lado del otro",
    tituloEn: "The curve and the month, side by side",
    notaEs:
      "Debajo del formulario de registro, la pantalla de resumen abre en dos: la curva de " +
      "rendimiento con las zonas de caída sombreadas y el balance en trazo discontinuo, y el " +
      "calendario del mes con el resultado de cada día y el total de cada semana. Encima, el " +
      "parte de hoy en lenguaje llano, que avisa cuando llevas más operaciones abiertas de " +
      "las que sueles aguantar.",
    notaEn:
      "Below the logging form, the overview screen opens in two: the performance curve with " +
      "its drawdown areas shaded and the balance as a dashed line, and the month calendar " +
      "with each day's result and each week's total. Above them, today's briefing in plain " +
      "language, which speaks up when you have more trades on than you usually handle.",
    altEs:
      "Pantalla de resumen: el parte del día advierte de que se está entrando en zona de " +
      "sobreoperativa y sitúa la caída actual frente a la habitual; debajo, un selector del 1 " +
      "al 5 para puntuar cómo te sientes, la curva de rendimiento con las casillas de " +
      "rendimiento y balance, y un calendario mensual con la ganancia o pérdida de cada día y " +
      "el acumulado semanal en el margen.",
    altEn:
      "Overview screen: the daily briefing warns that you are entering your own overtrading " +
      "zone and places the current drawdown against the usual one; below, a 1-to-5 selector " +
      "to rate how you feel, the performance curve with its performance and balance " +
      "checkboxes, and a monthly calendar with each day's profit or loss and the weekly total " +
      "in the margin.",
    detalleEs: "el calendario del mes",
    detalleEn: "the month calendar",
  },

  registro: {
    archivo: "app-registro.webp",
    ancho: 1576,
    alto: 836,
    roman: "II",
    pestanaEs: "Registro",
    pestanaEn: "Logging",
    tituloEs: "Anotar la operación es lo primero que se ve",
    tituloEn: "Logging the trade is the first thing you see",
    notaEs:
      "El compositor ocupa la pantalla entera a propósito: dirección, instrumento, entrada, " +
      "salida, cantidad y stop, con la calculadora de tamaño al lado y una zona donde se " +
      "arrastran o se pegan las capturas del gráfico. Mientras escribes, la fila de riesgo de " +
      "abajo se recalcula en dinero y en porcentaje de la cuenta. Todo lo demás —el resto de " +
      "esta pantalla y las otras diez— mide lo que se rellena aquí.",
    notaEn:
      "The composer takes the whole screen on purpose: direction, instrument, entry, exit, " +
      "quantity and stop, with the position-size calculator beside them and an area where " +
      "chart screenshots are dropped or pasted. As you type, the risk row below recalculates " +
      "in money and as a share of the account. Everything else —the rest of this screen and " +
      "the other ten— measures what gets filled in here.",
    altEs:
      "Formulario de registro de una operación: zona para arrastrar capturas del gráfico, " +
      "selector de Long o Short, campos de instrumento, entrada, salida, cantidad con botón " +
      "de calcular tamaño y stop; debajo, el riesgo de la operación en dólares, el RR " +
      "objetivo y el porcentaje de cuenta, dos avisos sobre la franja horaria y el tamaño " +
      "frente a Kelly, y una fila final con las métricas de la cuenta.",
    altEn:
      "Trade logging form: an area to drop chart screenshots, a Long or Short selector, " +
      "fields for instrument, entry, exit, quantity with a size-calculator button and stop; " +
      "below, the trade's risk in dollars, the target RR and the share of the account, two " +
      "notices about the time slot and about size against Kelly, and a final row with the " +
      "account metrics.",
    detalleEs: "los campos de la operación",
    detalleEn: "the trade fields",
  },

  guardian: {
    archivo: "app-guardian.webp",
    ancho: 1576,
    alto: 836,
    roman: "III",
    pestanaEs: "Guardián",
    pestanaEn: "Guardian",
    tituloEs: "Cuando el tamaño no es el tuyo, lo dice antes",
    tituloEn: "When the size isn't yours, it says so first",
    notaEs:
      "La misma operación con la cantidad subida: el riesgo salta a la cuarta parte de la " +
      "cuenta y aparecen tres bandas. Una recuerda que esa franja horaria históricamente no " +
      "te renta; otra compara lo que estás arriesgando con lo que arriesgas de costumbre " +
      "sobre doscientas operaciones; la tercera sitúa el tamaño frente a un medio Kelly. No " +
      "bloquea el botón: te obliga a pulsarlo habiéndolo leído.",
    notaEn:
      "The same trade with the quantity raised: risk jumps to a quarter of the account and " +
      "three bands appear. One recalls that this time slot historically doesn't pay you; " +
      "another compares what you're risking with what you usually risk across two hundred " +
      "trades; the third places the size against a half-Kelly. It doesn't disable the button: " +
      "it makes you press it having read them.",
    altEs:
      "El mismo formulario con una cantidad alta: el importe de la operación encabeza la " +
      "pantalla, el riesgo marca el 25 % de la cuenta y debajo se apilan tres avisos —franja " +
      "horaria poco rentable, tamaño muy fuera de lo habitual y comparación con el medio " +
      "Kelly— antes de los botones de guardar borrador y registrar la operación.",
    altEn:
      "The same form with a large quantity: the trade amount heads the screen, risk reads " +
      "25 % of the account and three notices stack below —an unprofitable time slot, a size " +
      "far outside the usual one and a comparison against half-Kelly— before the save-draft " +
      "and log-trade buttons.",
    detalleEs: "el riesgo y sus tres avisos",
    detalleEn: "the risk and its three notices",
  },

  operaciones: {
    archivo: "app-operaciones.webp",
    ancho: 1576,
    alto: 836,
    roman: "IV",
    pestanaEs: "Operaciones",
    pestanaEn: "Trades",
    tituloEs: "El registro entero, y las métricas de lo que filtras",
    tituloEn: "The whole log, and the metrics of whatever you filter",
    notaEs:
      "Filtros por instrumento, dirección, resultado, cumplimiento, setup y conducta. Lo que " +
      "importa no es la tabla: es la fila de encima, rotulada «lo que hay en pantalla», que " +
      "se recalcula sobre lo que queda tras filtrar. Preguntar «¿y si quito los días que no " +
      "cumplí mi plan?» deja de ser una hipótesis y pasa a ser dos clics.",
    notaEn:
      "Filters by instrument, direction, outcome, rule compliance, setup and behaviour. The " +
      "table isn't the point: the row above it is —labelled «what's on screen»— and it " +
      "recalculates over whatever survives the filter. Asking «what if I drop the days I " +
      "broke my plan?» stops being a hypothesis and becomes two clicks.",
    altEs:
      "Pantalla de operaciones con doscientos registros: seis filtros, un buscador, una fila " +
      "con P&L total, win rate, número de operaciones y expectancy en R calculada sobre lo " +
      "filtrado, y una tabla sin líneas verticales con instrumento, setup, sesión, el " +
      "recorrido de entrada a salida, duración, fecha de cierre, P&L neto, múltiplo de R y si " +
      "la operación cumplió el plan.",
    altEn:
      "Trades screen with two hundred records: six filters, a search box, a row with total " +
      "P&L, win rate, trade count and expectancy in R computed over the filtered set, and a " +
      "table without vertical rules listing instrument, setup, session, the entry-to-exit " +
      "path, duration, close date, net P&L, R multiple and whether the trade followed the " +
      "plan.",
    detalleEs: "la cabecera del registro",
    detalleEn: "the top of the log",
  },

  analitica: {
    archivo: "app-analitica.webp",
    ancho: 1576,
    alto: 836,
    roman: "V",
    pestanaEs: "Analítica",
    pestanaEn: "Analytics",
    tituloEs: "Donde se comprueba si la ventaja existe",
    tituloEn: "Where you check whether the edge is real",
    notaEs:
      "Una tabla compara el mes, el trimestre, el año y todo el histórico con el mismo " +
      "criterio, y ninguna fila aparece sin el número de operaciones sobre el que se calcula. " +
      "A la derecha, el veredicto: si la expectancy se distingue de cero, con su valor p y el " +
      "intervalo de confianza al 95 % de cada cifra. Y lo dice explícitamente — no garantiza " +
      "el futuro, dice que lo conseguido hasta aquí no parece azar.",
    notaEn:
      "A table compares the month, the quarter, the year and the full history by the same " +
      "criteria, and no row appears without the number of trades it is computed on. On the " +
      "right, the verdict: whether expectancy is distinguishable from zero, with its p-value " +
      "and each figure's 95 % confidence interval. And it says so explicitly — it doesn't " +
      "guarantee the future, it says what you've got so far doesn't look like chance.",
    altEs:
      "Pantalla de analítica: tabla comparativa por periodo con operaciones, neto, win rate, " +
      "profit factor y máxima caída; el resumen del periodo filtrado; el bloque de ganadoras " +
      "frente a perdedoras con medias, extremos y payoff; un bloque de riesgo y calidad con " +
      "drawdown, Sharpe, Sortino, Calmar y otros ratios; y el veredicto «ventaja confirmada» " +
      "con su valor p y sus intervalos de confianza.",
    altEn:
      "Analytics screen: a per-period comparison table with trades, net, win rate, profit " +
      "factor and max drawdown; the filtered-period summary; the winners-versus-losers block " +
      "with averages, extremes and payoff; a risk-and-quality block with drawdown, Sharpe, " +
      "Sortino, Calmar and other ratios; and the «confirmed edge» verdict with its p-value " +
      "and confidence intervals.",
    detalleEs: "ganadoras frente a perdedoras y su veredicto",
    detalleEn: "winners versus losers and their verdict",
  },

  diario: {
    archivo: "app-diario.webp",
    ancho: 1576,
    alto: 836,
    roman: "VI",
    pestanaEs: "Diario",
    pestanaEn: "Journal",
    tituloEs: "Veinte segundos antes de operar",
    tituloEn: "Twenty seconds before trading",
    notaEs:
      "Horas de sueño, estado mental, estado físico y si hoy traes plan. Se guarda solo, sin " +
      "botón. Y donde otro programa pondría una conclusión, éste escribe que aún no hay " +
      "suficientes check-ins para cruzar cómo llegas con cómo operas, y que todavía no hay " +
      "días bastantes en los dos lados para comparar. Prefiere no decir nada a decir algo que " +
      "todavía no sostiene.",
    notaEn:
      "Hours of sleep, mental state, physical state, and whether you have a plan today. It " +
      "saves itself, with no button. And where another program would put a conclusion, this " +
      "one writes that there still aren't enough check-ins to cross how you arrive with how " +
      "you trade, and not enough days on both sides to compare. It would rather say nothing " +
      "than say something it can't yet support.",
    altEs:
      "Pantalla de diario con el check-in del día: horas de sueño con controles de más y " +
      "menos, estado mental y físico como barras de cinco pasos, y un interruptor de «¿tienes " +
      "plan hoy?». Debajo, dos comparativas marcadas como muestra insuficiente, el bloque " +
      "«¿escribir el diario te compensa?» con los días con y sin, y los apartados de nota " +
      "frente a resultado y de lo que falta por rellenar.",
    altEn:
      "Journal screen with the daily check-in: hours of sleep with plus and minus controls, " +
      "mental and physical state as five-step bars, and a «do you have a plan today?» switch. " +
      "Below, two comparisons flagged as insufficient samples, the «does journalling pay " +
      "off?» block with days with and without, and the sections for grade versus result and " +
      "for what's left to fill in.",
    detalleEs: "el check-in del día",
    detalleEn: "the daily check-in",
  },

  playbook: {
    archivo: "app-playbook.webp",
    ancho: 1576,
    alto: 924,
    roman: "VII",
    pestanaEs: "Playbook",
    pestanaEn: "Playbook",
    tituloEs: "Cada setup, juzgado por separado",
    tituloEn: "Each setup, judged on its own",
    notaEs:
      "Cinco estrategias con su curva, su muestra, su expectancy, su porcentaje de " +
      "cumplimiento y el reparto de R con la mediana y el 50 % central. En esta muestra las " +
      "cinco salen «no concluyente», y ese sello es la razón para creerse el contrario: un " +
      "playbook donde todo funciona el primer mes no está midiendo, está halagando.",
    notaEn:
      "Five strategies with their curve, sample, expectancy, compliance rate and R spread " +
      "with its median and central 50 %. In this sample all five come out «inconclusive», and " +
      "that stamp is the reason to believe the opposite one: a playbook where everything " +
      "works in the first month isn't measuring, it's flattering.",
    altEs:
      "Pantalla de playbook con cinco fichas —rango, reversión, ruptura, tendencia y " +
      "pullback—, cada una con su curva en miniatura de un color, tamaño de muestra, " +
      "expectancy, porcentaje de aciertos, P&L total, un sello de «no concluyente», la mejor " +
      "sesión, el cumplimiento, el reparto de R con su mediana y una barra de ganadoras " +
      "frente a perdedoras.",
    altEn:
      "Playbook screen with five cards —range, reversal, breakout, trend and pullback—, each " +
      "with a colour-coded miniature curve, sample size, expectancy, hit rate, total P&L, an " +
      "«inconclusive» stamp, best session, compliance, the R spread with its median and a " +
      "winners-versus-losers bar.",
    detalleEs: "una de las cinco fichas",
    detalleEn: "one of the five cards",
  },
};

/** El orden en que las láminas se numeran y se enseñan. */
export const ORDEN_LAMINAS = [
  "resumen",
  "registro",
  "guardian",
  "operaciones",
  "analitica",
  "diario",
  "playbook",
] as const;
