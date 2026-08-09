import type { LaminaProducto } from "@/components/tj/ProductPlate";

/**
 * Las láminas del producto: qué captura se enseña, con qué número y qué
 * dice su pie.
 *
 * ── REGLA: SOLO SE DESCRIBE LO QUE SE HA MIRADO ───────────────────────
 * Cada entrada de aquí la escribió alguien después de abrir el `.webp` y
 * leer lo que había dentro. No se deduce del nombre del fichero. Un pie
 * que describe una pantalla que no es la que se ve es peor que no poner
 * pie, porque el visitante SÍ ve la captura y detecta el desajuste.
 *
 * En `public/img/` hay ocho capturas. Aquí están las que se han
 * verificado una por una; las demás se irán añadiendo según se revisen:
 *
 *   verificadas → app-resumen.webp, app-analitica.webp
 *   pendientes  → app-curva, app-operaciones, app-diario, app-detalle,
 *                 app-nueva, app-playbook
 *
 * ── LAS CIFRAS DE LA APP NO SON LAS DE LA WEB ─────────────────────────
 * La aplicación de las capturas trabaja sobre su propio juego de datos de
 * muestra (200 operaciones, profit factor 1,56, Sharpe 3,34) y el motor
 * de la web sobre el suyo (profit factor 1,55, Sharpe 3,27). Son muestras
 * distintas, no una contradicción — pero por eso los pies NO repiten
 * cifras: dentro de la captura un número es «lo que este programa
 * calcula», y sacarlo fuera lo convertiría en dos verdades que no cuadran.
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
  },
};
