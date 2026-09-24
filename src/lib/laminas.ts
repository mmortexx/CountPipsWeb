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
 * septiembre de 2026. Las de agosto enseñaban otra maqueta —tres bandas de
 * aviso, fichas de playbook de colores, el parte del día arriba del
 * resumen— y sus pies ya no describían lo que se ve.
 *
 * ── LAS CIFRAS DE LA APP NO SON LAS DE LA WEB ─────────────────────────
 * La aplicación de las capturas trabaja sobre su propio juego de datos de
 * muestra (200 operaciones, profit factor 1,45) y el motor de la web sobre
 * el suyo. Son muestras distintas, no una contradicción — pero por eso los
 * pies NO repiten cifras: dentro de la captura un número es «lo que este
 * programa calcula», y sacarlo fuera lo convertiría en dos verdades que no
 * cuadran.
 *
 * ── LO QUE ESTAS SIETE PANTALLAS TIENEN EN COMÚN ──────────────────────
 * Al mirarlas seguidas aparece un patrón que es, con diferencia, lo mejor
 * que tiene el producto: la aplicación DICE CUÁNDO NO SABE y OBJETA ANTES
 * DE QUE PULSES. «No concluyente» en dos fichas del playbook —una de ellas
 * con dinero ganado—, «Aún no hay suficientes check-ins», «Todavía no hay
 * días suficientes en los dos lados para comparar», y dos avisos cuando el
 * tamaño de la operación se sale de lo que tú sueles hacer. Un diario que en vez de
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
      "calendario del mes con el resultado de cada día y el total de cada semana. Encima, " +
      "cómo van tus diez últimas operaciones y una pregunta del 1 al 5 sobre cómo te has " +
      "sentido operando hoy, que se apunta en las operaciones del día.",
    notaEn:
      "Below the logging form, the overview screen splits in two: the performance curve with " +
      "its drawdown areas shaded and the balance as a dashed line, and the month calendar " +
      "with each day’s result and each week’s total. Above them, how your last ten trades " +
      "are going and a 1-to-5 question about how trading felt today, which is recorded " +
      "against the day’s trades.",
    altEs:
      "Pantalla de resumen: arriba, el rendimiento rodante de las diez últimas operaciones " +
      "con su win rate, su expectancy y su P&L; debajo, una pregunta para puntuar del 1 al 5 " +
      "cómo te has sentido operando hoy, la curva de rendimiento con las casillas de " +
      "rendimiento y balance, y un calendario mensual con la ganancia o pérdida de cada día, " +
      "el acumulado semanal en el margen y el mejor y el peor día al pie.",
    altEn:
      "Overview screen: at the top, the rolling performance of the last ten trades with " +
      "their win rate, expectancy and P&L; below, a question to rate from 1 to 5 how trading " +
      "felt today, the performance curve with its performance and balance checkboxes, and a " +
      "monthly calendar with each day’s profit or loss, the weekly total in the margin and " +
      "the best and worst day at the foot.",
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
      "El compositor ocupa la pantalla entera a propósito: instrumento, dirección, entrada, " +
      "stop, objetivo y salida, junto a una zona grande donde se arrastran o se pegan las " +
      "capturas del gráfico. Mientras escribes, el riesgo se recalcula en dinero y en " +
      "porcentaje de la cuenta sobre una regla del stop a 1 R, y una nota sitúa tu tamaño " +
      "frente al medio Kelly. Todo lo demás —el resto de esta pantalla y las otras diez— mide " +
      "lo que se rellena aquí.",
    notaEn:
      "The composer takes the whole screen on purpose: instrument, direction, entry, stop, " +
      "target and exit, beside a large area where chart screenshots are dropped or pasted. As " +
      "you type, the risk recalculates in money and as a share of the account on a ruler " +
      "running from stop to 1 R, and a note places your size against half-Kelly. Everything " +
      "else —the rest of this screen and the other ten— measures what gets filled in here.",
    altEs:
      "Formulario de registro bajo la pregunta «¿Qué has operado hoy?»: a la izquierda, una " +
      "zona para arrastrar o pegar capturas del gráfico; a la derecha, el instrumento, el " +
      "selector de Long o Short, entrada, stop, objetivo opcional y salida abierta, el riesgo " +
      "en dólares y en porcentaje de la cuenta sobre una regla de stop, entrada y 1 R, una " +
      "nota que compara el tamaño con el medio Kelly, la cantidad y los botones de añadir " +
      "detalle, calcular tamaño, guardar borrador, «Lo vi y no entré» y registrar la " +
      "operación. Debajo, una fila con las métricas de la cuenta.",
    altEn:
      "Logging form under the question “What did you trade today?”: on the left, an area to " +
      "drop or paste chart screenshots; on the right, the instrument, a Long or Short " +
      "selector, entry, stop, an optional target and an open exit, the risk in dollars and as " +
      "a share of the account on a stop–entry–1 R ruler, a note comparing the size with " +
      "half-Kelly, the quantity and buttons to add detail, calculate size, save a draft, “Saw " +
      "it, didn’t take it” and log the trade. Below, a row with the account metrics.",
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
    tituloEn: "When the size isn’t yours, it says so first",
    notaEs:
      "La misma operación con más cantidad y el stop más lejos: el riesgo se dispara y " +
      "aparecen dos avisos. Uno compara lo que estás arriesgando con lo que arriesgas de " +
      "costumbre sobre doscientas operaciones; el otro sitúa el tamaño frente al Kelly " +
      "completo y recuerda que, por encima de él, más riesgo da menos crecimiento esperado. " +
      "No bloquea el botón: te obliga a pulsarlo habiéndolo leído.",
    notaEn:
      "The same trade with more size and a wider stop: risk shoots up and two notices " +
      "appear. One compares what you’re risking with what you usually risk across two " +
      "hundred trades; the other places the size against full Kelly and points out that " +
      "beyond it, more risk means less expected growth. It doesn’t disable the button: it " +
      "makes you press it having read them.",
    altEs:
      "El mismo formulario con más cantidad y el stop más lejos: el riesgo en dólares y en " +
      "porcentaje de la cuenta crece y, debajo, se apilan dos avisos con un triángulo " +
      "—«Esto no es como tú operas», que compara el riesgo con el habitual, y «Tu tamaño " +
      "frente a Kelly»— antes de los botones de guardar borrador y registrar la operación.",
    altEn:
      "The same form with more size and a wider stop: the risk in dollars and as a share of " +
      "the account grows and two notices with a warning triangle stack below —“This isn’t " +
      "how you usually trade”, which compares the risk with the usual one, and “Your size " +
      "against Kelly”— before the save-draft and log-trade buttons.",
    detalleEs: "el riesgo y sus dos avisos",
    detalleEn: "the risk and its two notices",
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
      "Filtros por instrumento, dirección, resultado, cumplimiento, setup, conducta, " +
      "deslizamiento y sesión. Lo que importa no es la tabla: es la fila de encima, rotulada " +
      "«lo que hay en pantalla», que se recalcula sobre lo que queda tras filtrar. Preguntar " +
      "«¿y si quito los días que no cumplí mi plan?» deja de ser una hipótesis y pasa a ser " +
      "dos clics.",
    notaEn:
      "Filters by instrument, direction, outcome, rule compliance, setup, behaviour, slippage " +
      "and session. The table isn’t the point: the row above it is —labelled “what’s on " +
      "screen”— and it recalculates over whatever survives the filter. Asking “what if I drop " +
      "the days I broke my plan?” stops being a hypothesis and becomes two clicks.",
    altEs:
      "Pantalla de operaciones con doscientos registros: ocho filtros, un buscador, una fila " +
      "con el P&L total, el win rate y la expectancy en R calculados sobre lo filtrado, y una " +
      "tabla sin líneas verticales con casilla de selección, dirección, instrumento, setup, " +
      "sesión, el recorrido de entrada a salida, duración, fecha de cierre, P&L neto, " +
      "múltiplo de R y si la operación cumplió el plan.",
    altEn:
      "Trades screen with two hundred records: eight filters, a search box, a row with total " +
      "P&L, win rate and expectancy in R computed over the filtered set, and a table without " +
      "vertical rules listing a selection box, direction, instrument, setup, session, the " +
      "entry-to-exit path, duration, close date, net P&L, R multiple and whether the trade " +
      "followed the plan.",
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
      "Abajo, el veredicto: si la expectancy se distingue de cero, con su valor p. Y lo dice " +
      "explícitamente — no garantiza el futuro, dice que lo conseguido hasta aquí no parece " +
      "azar.",
    notaEn:
      "A table compares the month, the quarter, the year and the full history by the same " +
      "criteria, and no row appears without the number of trades it is computed on. Below, " +
      "the verdict: whether expectancy is distinguishable from zero, with its p-value. And it " +
      "says so explicitly — it doesn’t guarantee the future, it says what you’ve got so far " +
      "doesn’t look like chance.",
    altEs:
      "Pantalla de analítica: el neto de todo el histórico en grande y una tabla por periodo " +
      "con operaciones, neto, win rate, profit factor y drawdown máximo; el resumen del " +
      "periodo filtrado; el bloque de ganadoras frente a perdedoras con medias, extremos, " +
      "payoff y expectancy en R; un bloque de riesgo y calidad con drawdown, Sharpe, Sortino, " +
      "Calmar, SQN y otros ratios; y el veredicto «Ventaja confirmada» con su valor p.",
    altEn:
      "Analytics screen: the all-time net in large type and a per-period table with trades, " +
      "net, win rate, profit factor and maximum drawdown; the filtered-period summary; the " +
      "winners-versus-losers block with averages, extremes, payoff and expectancy in R; a " +
      "risk-and-quality block with drawdown, Sharpe, Sortino, Calmar, SQN and other ratios; " +
      "and the “confirmed edge” verdict with its p-value.",
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
      "one writes that there still aren’t enough check-ins to cross how you arrive with how " +
      "you trade, and not enough days on both sides to compare. It would rather say nothing " +
      "than say something it can’t yet support.",
    altEs:
      "Pantalla de diario con el check-in del día: horas de sueño con controles de más y " +
      "menos, estado mental y físico como barras de cinco pasos, y un interruptor de «¿tienes " +
      "plan hoy?». Debajo, el aviso de que aún no hay check-ins suficientes para sacar " +
      "conclusiones, el bloque «¿Escribir el diario te compensa?» con los días con y sin plan " +
      "o revisión escritos y la advertencia de que todavía no hay días bastantes para " +
      "comparar, y el rendimiento por franja del día, de la mañana a la noche.",
    altEn:
      "Journal screen with the daily check-in: hours of sleep with plus and minus controls, " +
      "mental and physical state as five-step bars, and a “do you have a plan today?” switch. " +
      "Below, the notice that there aren’t enough check-ins yet to draw conclusions, the " +
      "“does journalling pay off?” block with days with and without a written plan or review " +
      "and the warning that there aren’t enough days yet to compare, and performance by time " +
      "of day, from morning to night.",
    detalleEs: "el check-in del día y sus avisos",
    detalleEn: "the daily check-in and its notices",
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
      "Cinco estrategias con su curva, su muestra, su expectancy, su win rate, su porcentaje " +
      "de cumplimiento y el reparto de R con la mediana y el 50 % central. En esta muestra " +
      "tres salen con «ventaja sugerente» y dos «no concluyente», aunque una de esas dos gana " +
      "dinero: el sello no premia el resultado, mide si la muestra basta para afirmar algo. " +
      "Un playbook donde todo funciona el primer mes no está midiendo, está halagando.",
    notaEn:
      "Five strategies with their curve, sample, expectancy, win rate, compliance rate and R " +
      "spread with its median and central 50 %. In this sample three come out “edge " +
      "suggestive” and two “inconclusive”, even though one of those two makes money: the " +
      "stamp doesn’t reward the result, it measures whether the sample is enough to claim " +
      "anything. A playbook where everything works in the first month isn’t measuring, it’s " +
      "flattering.",
    altEs:
      "Pantalla de playbook con cinco fichas —rango, tendencia, ruptura, reversión y " +
      "pullback—, cada una con su curva en miniatura, P&L total, tamaño de muestra, " +
      "expectancy, win rate, un sello de «ventaja sugerente» o «no concluyente», la mejor " +
      "sesión, el cumplimiento, el reparto de R con su mediana y una barra de ganadoras " +
      "frente a perdedoras.",
    altEn:
      "Playbook screen with five cards —range, trend, breakout, reversal and pullback—, each " +
      "with a miniature curve, total P&L, sample size, expectancy, win rate, an “edge " +
      "suggestive” or “inconclusive” stamp, best session, compliance, the R spread with its " +
      "median and a winners-versus-losers bar.",
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
