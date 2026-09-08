/**
 * Trading glossary — bilingual (ES / EN) definitions.
 *
 * FROZEN GLOSSARY PHILOSOPHY
 * ---------------------------
 * The `term` field is ALWAYS English. Even when the app UI is in Spanish,
 * trading terms stay in English: it is the lingua franca of the markets,
 * every prop firm / charting platform / community uses them, and
 * translating "stop loss" -> "pérdida de parada" only confuses the trader.
 *
 * The *definition* is the only field that changes with the active language.
 *
 * Categories:
 *  - basics      : vocabulary every trader must know
 *  - risk        : protecting capital
 *  - psychology  : the trader's mind
 *  - metrics     : the numbers that decide if you have an edge
 *  - execution   : how you actually get in and out
 */

export type GlossaryCategory =
  | "basics"
  | "risk"
  | "psychology"
  | "metrics"
  | "execution";

export interface GlossaryTerm {
  /** Always English — the frozen term name. */
  term: string;
  /** Spanish definition (1-2 sentences, precise and professional). */
  es: string;
  /** English definition (1-2 sentences, precise and professional). */
  en: string;
  category: GlossaryCategory;
}

export const GLOSSARY: GlossaryTerm[] = [
  // ────────────────────────────── BASICS ──────────────────────────────
  {
    term: "Long",
    es: "Posición comprada: ganas si el precio sube. Se abre comprando el activo con la expectativa de venderlo más caro.",
    en: "A bought position: you profit when price rises. Opened by buying the asset with the expectation of selling it higher.",
    category: "basics",
  },
  {
    term: "Short",
    es: "Posición vendida: ganas si el precio baja. Se abre vendiendo un activo prestado con la expectativa de recomprarlo más barato.",
    en: "A sold position: you profit when price falls. Opened by selling a borrowed asset with the expectation of buying it back cheaper.",
    category: "basics",
  },
  {
    term: "Setup",
    es: "Patrón o combinación de condiciones específicas y reproducibles que justifica entrar en una operación. Un buen setup tiene reglas claras de entrada, salida y gestión.",
    en: "A pattern or combination of specific, repeatable conditions that justifies entering a trade. A good setup has clear entry, exit and management rules.",
    category: "basics",
  },
  {
    term: "Breakout",
    es: "Movimiento de precio que rompe un nivel relevante de soporte o resistencia, suele interpretarse como el inicio de una nueva tendencia.",
    en: "A price movement that breaks a significant support or resistance level, often interpreted as the start of a new trend.",
    category: "basics",
  },
  {
    term: "Prop firm",
    es: "Empresa que aporta capital a traders que superan una evaluación. El trader opera con dinero de la firma y se reparte un porcentaje de los beneficios.",
    en: "A firm that provides capital to traders who pass an evaluation. The trader operates with the firm's money and shares a percentage of the profits.",
    category: "basics",
  },
  {
    term: "Track record",
    es: "Historial auditado de resultados reales de un trader a lo largo del tiempo. Es la única prueba objetiva de una ventaja estadística y la base para conseguir financiación.",
    en: "An audited history of a trader's real results over time. It is the only objective proof of a statistical edge and the basis for securing funding.",
    category: "basics",
  },
  {
    term: "Liquidity",
    es: "Facilidad con la que un activo puede comprarse o venderse sin mover significativamente su precio. Los mercados líquidos tienen spreads estrechos y permiten entrar y salir con tamaño sin deslizamiento relevante.",
    en: "The ease with which an asset can be bought or sold without significantly moving its price. Liquid markets have tight spreads and let you enter and exit with size without meaningful slippage.",
    category: "basics",
  },
  {
    term: "Volatility",
    es: "Magnitud de las variaciones de precio de un activo durante un periodo. Alta volatilidad implica rangos amplios y más riesgo por operación; baja volatilidad, movimientos más contenidos y operaciones menores.",
    en: "The magnitude of an asset's price fluctuations over a period. High volatility means wide ranges and more risk per trade; low volatility means smaller moves and smaller trades.",
    category: "basics",
  },
  {
    term: "Pullback",
    es: "Retroceso temporal del precio contra la tendencia principal antes de reanudar su dirección. Es uno de los setups más fiables: entras a favor de tendencia en un punto donde el precio «descansa» y los stops quedan ajustados.",
    en: "A temporary price retracement against the prevailing trend before it resumes its direction. One of the most reliable setups: you enter with the trend at a point where price «rests» and stops stay tight.",
    category: "basics",
  },
  {
    term: "Reversal",
    es: "Cambio de dirección del precio en el que una tendencia alcista pasa a bajista (o viceversa). Requiere confirmación (vela de cierre, rotura de estructura) para distinguirlo de un simple pullback.",
    en: "A change in price direction where an uptrend flips to downtrend (or vice versa). Requires confirmation (closing candle, structure break) to distinguish it from a mere pullback.",
    category: "basics",
  },
  {
    term: "Trend",
    es: "Dirección dominante del precio en un periodo: alcista (máximos y mínimos crecientes), bajista (decrecientes) o lateral. Operar a favor de la tendencia mejora la probabilidad de acierto.",
    en: "The dominant price direction over a period: up (rising highs and lows), down (falling highs and lows), or sideways. Trading with the trend improves the probability of success.",
    category: "basics",
  },
  {
    term: "Range",
    es: "Zona donde el precio oscila entre un soporte y una resistencia claros sin tendencia definida. Se opera comprando el soporte y vendiendo la resistencia hasta que el rango se rompe.",
    en: "A zone where price oscillates between a clear support and resistance with no defined trend. Traded by buying support and selling resistance until the range breaks.",
    category: "basics",
  },
  {
    term: "Edge",
    es: "Ventaja estadística demostrable: una estrategia con expectancy positiva sostenida en el tiempo y en distintos regímenes de mercado. Sin edge, operar es azar puro; con edge, el resultado a largo plazo es ganador.",
    en: "A demonstrable statistical advantage: a strategy with sustained positive expectancy over time and across market regimes. Without an edge, trading is pure chance; with one, the long-run result is profitable.",
    category: "basics",
  },

  // ────────────────────────────── RISK ────────────────────────────────
  {
    term: "Stop loss",
    es: "Orden que cierra una posición automáticamente cuando el precio alcanza un nivel predeterminado, limitando la pérdida máxima por operación. Es la herramienta principal del control de riesgo.",
    en: "An order that automatically closes a position when price reaches a predetermined level, capping the maximum loss per trade. It is the primary risk-control tool.",
    category: "risk",
  },
  {
    term: "Drawdown",
    es: "Caída del capital desde un máximo histórico hasta el siguiente mínimo. Se mide en valor absoluto o porcentual, y es el indicador clave del riesgo real asumido.",
    en: "The decline in capital from a historical peak to the subsequent trough. Measured in absolute or percentage terms, it is the key indicator of real risk taken.",
    category: "risk",
  },
  {
    term: "Risk of ruin",
    es: "Probabilidad matemática de perder todo el capital de la cuenta asumiendo un tamaño de riesgo fijo por operación. Crece exponencialmente con el riesgo por trade.",
    en: "The mathematical probability of losing the entire account balance assuming a fixed risk size per trade. It grows exponentially with risk per trade.",
    category: "risk",
  },
  {
    term: "Position sizing",
    es: "Regla que determina cuántas unidades o cuánto capital arriesgar en cada operación. Es el motor del control de riesgo: con un sizing correcto nunca te arruinas.",
    en: "The rule that determines how many units or how much capital to risk on each trade. It is the engine of risk control: with correct sizing, you never go bust.",
    category: "risk",
  },
  {
    term: "Risk-reward ratio",
    es: "Relación entre el beneficio objetivo de una operación y la pérdida máxima aceptada (el riesgo). Un ratio 1:3 significa arriesgar 1 para ganar 3; permite ser rentable incluso con un win rate bajo.",
    en: "The relationship between a trade's target profit and the maximum accepted loss (the risk). A 1:3 ratio means risking 1 to make 3; it lets you stay profitable even with a low win rate.",
    category: "risk",
  },
  {
    term: "Kelly criterion",
    es: "Fórmula matemática que calcula la fracción óptima del capital a arriesgar por operación a partir del win rate y el payoff. En la práctica se usa una fracción (medio Kelly o cuarto de Kelly) para reducir la varianza.",
    en: "A mathematical formula that calculates the optimal fraction of capital to risk per trade based on win rate and payoff. In practice a fraction (half Kelly or quarter Kelly) is used to reduce variance.",
    category: "risk",
  },
  {
    term: "Margin",
    es: "Colateral que el broker retiene para cubrir la posición apalancada. Si el capital cae por debajo del margen de mantenimiento, el broker emite un margin call o cierra posiciones automáticamente.",
    en: "Collateral the broker holds to cover a leveraged position. If equity falls below the maintenance margin, the broker issues a margin call or auto-liquidates positions.",
    category: "risk",
  },
  {
    term: "Max drawdown",
    es: "Mayor caída porcentual del capital desde un máximo histórico hasta el mínimo siguiente dentro de un periodo. Es la métrica que mejor mide el sufrimiento real de un trader y la viabilidad psicológica de una estrategia.",
    en: "The largest percentage drop in equity from a historical peak to the subsequent trough within a period. It is the metric that best measures a trader's real suffering and the psychological viability of a strategy.",
    category: "risk",
  },

  // ──────────────────────────── PSYCHOLOGY ────────────────────────────
  {
    term: "FOMO",
    es: "Miedo a perder una oportunidad (Fear Of Missing Out). Empuja a entrar tarde en operaciones que ya se han movido, normalmente justo antes de reversiones.",
    en: "Fear of missing out. It pushes you to enter late into trades that have already moved, usually right before reversals.",
    category: "psychology",
  },
  {
    term: "Revenge trading",
    es: "Operar de forma impulsiva y con tamaño excesivo para recuperar una pérdida reciente. Casi siempre amplifica la pérdida inicial y rompe el plan de riesgo.",
    en: "Trading impulsively and with excessive size to recover a recent loss. It almost always amplifies the initial loss and breaks the risk plan.",
    category: "psychology",
  },
  {
    term: "Tilt",
    es: "Estado emocional tras una pérdida o racha perdedora en el que el juicio se nubla y el trader abandona su plan. Suele llevar a sobreoperar, aumentar tamaño y forzar entradas. La mejor defensa es parar y desconectar.",
    en: "An emotional state after a loss or losing streak where judgement clouds and the trader abandons their plan. Usually leads to overtrading, increased size and forced entries. The best defense is to stop and disconnect.",
    category: "psychology",
  },
  {
    term: "Discipline",
    es: "Capacidad de seguir el plan de trading de forma consistente: entrar solo en setups definidos, respetar el stop y el objetivo, y no operar fuera del horario planificado. Es lo que separa al profesional del aficionado.",
    en: "The ability to follow the trading plan consistently: entering only defined setups, respecting the stop and target, and not trading outside the planned hours. It is what separates the professional from the amateur.",
    category: "psychology",
  },

  // ───────────────────────────── METRICS ──────────────────────────────
  {
    term: "Expectancy",
    es: "Beneficio o pérdida promedio esperado por operación, considerando win rate y payoff. Indica cuánto ganas (o pierdes) por cada dólar arriesgado a largo plazo.",
    en: "The average profit or loss expected per trade, factoring in win rate and payoff. It indicates how much you gain (or lose) per dollar risked over the long run.",
    category: "metrics",
  },
  {
    term: "Profit factor",
    es: "Cociente entre el beneficio bruto de las operaciones ganadoras y la pérdida bruta de las perdedoras. Un valor superior a 1,5 es sólido; por encima de 2 es excelente.",
    en: "The ratio of gross profit from winning trades to gross loss from losing trades. A value above 1.5 is solid; above 2 is excellent.",
    category: "metrics",
  },
  {
    term: "Sharpe ratio",
    es: "Mide el rendimiento ajustado al riesgo: el exceso de rentabilidad sobre el activo libre de riesgo dividido por la volatilidad de los retornos. Penaliza la variabilidad, no la dirección.",
    en: "Measures risk-adjusted return: the excess return over the risk-free asset divided by the volatility of returns. It penalizes variability, not direction.",
    category: "metrics",
  },
  {
    term: "Sortino ratio",
    es: "Variante del Sharpe que solo penaliza la volatilidad a la baja (pérdidas). Refleja mejor cómo un trader gestiona el riesgo real, ignorando las subidas positivas.",
    en: "A Sharpe variant that only penalizes downside volatility (losses). It better reflects how a trader manages real risk, ignoring positive upside.",
    category: "metrics",
  },
  {
    term: "Calmar ratio",
    es: "Cociente entre la rentabilidad anualizada y el drawdown máximo. Resume en un solo número la relación entre lo que ganas y lo que sufres en el peor momento.",
    en: "The ratio of annualized return to maximum drawdown. It summarizes in a single number the relationship between what you earn and what you suffer at the worst moment.",
    category: "metrics",
  },
  {
    term: "R-multiple",
    es: "Resultado de una operación expresado en múltiplos del riesgo inicial (R). +2R significa ganar el doble de lo arriesgado; -1R es perder justo el stop. Permite comparar operaciones de cualquier tamaño.",
    en: "A trade's result expressed as multiples of initial risk (R). +2R means winning twice what was risked; -1R is losing exactly the stop. It lets you compare trades of any size.",
    category: "metrics",
  },
  {
    term: "Win rate",
    es: "Porcentaje de operaciones ganadoras sobre el total. Es engañoso por sí solo: un 70 % de aciertos con payoff 0,5 pierde dinero; un 35 % con payoff 3 gana.",
    en: "The percentage of winning trades out of the total. Misleading on its own: a 70% hit rate with a 0.5 payoff loses money; 35% with a 3 payoff wins.",
    category: "metrics",
  },
  {
    term: "Payoff",
    es: "Cociente entre el beneficio medio de las operaciones ganadoras y la pérdida media de las perdedoras. Indica cuánto ganas cuando aciertas frente a cuánto pierdes cuando fallas.",
    en: "The ratio of the average profit on winning trades to the average loss on losing trades. It indicates how much you win when right versus how much you lose when wrong.",
    category: "metrics",
  },
  {
    term: "Monte Carlo",
    es: "Simulación que reordena aleatoriamente la secuencia histórica de tus operaciones miles de veces para estimar el rango probable de drawdowns y rentabilidades futuras. Revela la cola de riesgo.",
    en: "A simulation that randomly reorders the historical sequence of your trades thousands of times to estimate the probable range of future drawdowns and returns. It reveals the risk tail.",
    category: "metrics",
  },
  {
    term: "Backtesting",
    es: "Probar una estrategia sobre datos históricos para medir su rentabilidad y riesgo antes de arriesgar capital real. Útil solo si se evita el curve fitting y se valida después con forward testing.",
    en: "Testing a strategy on historical data to measure its profitability and risk before risking real capital. Only useful if curve fitting is avoided and it is later validated with forward testing.",
    category: "metrics",
  },
  {
    term: "Forward testing",
    es: "Validación de una estrategia en tiempo real (cuenta demo o tamaño mínimo) durante un periodo significativo. Confirma que el backtest no sobreajustó y que la estrategia sobrevive a condiciones de mercado no vistas.",
    en: "Validating a strategy in real time (demo account or minimum size) over a meaningful period. Confirms the backtest wasn't overfit and that the strategy survives unseen market conditions.",
    category: "metrics",
  },
  {
    term: "Curve fitting",
    es: "Sobreajuste de una estrategia a los datos históricos: tantos parámetros que el backtest parece perfecto pero la estrategia falla en tiempo real. Cuantos más grados de libertad, mayor el riesgo de curve fitting.",
    en: "Overfitting a strategy to historical data: so many parameters that the backtest looks perfect but the strategy fails in real time. The more degrees of freedom, the higher the curve-fitting risk.",
    category: "metrics",
  },
  {
    term: "CAGR",
    es: "Tasa de crecimiento anual compuesta (Compound Annual Growth Rate). Expresa la rentabilidad media anualizada que equivaldría al crecimiento total observado. Permite comparar estrategias con horizontes distintos.",
    en: "Compound Annual Growth Rate. Expresses the annualized average return equivalent to the observed total growth. Lets you compare strategies with different horizons.",
    category: "metrics",
  },

  // ──────────────────────────── EXECUTION ─────────────────────────────
  {
    term: "Take profit",
    es: "Orden que cierra una posición automáticamente cuando se alcanza un objetivo de beneficio prefijado. Permite salir de la operación sin requerir tu atención constante.",
    en: "An order that automatically closes a position when a preset profit target is reached. It lets you exit the trade without requiring constant attention.",
    category: "execution",
  },
  {
    term: "MAE (Maximum Adverse Excursion)",
    es: "Máxima distancia en contra que recorrió el precio antes de cerrar la operación. Útil para auditar si tus stops son demasiado anchos o demasiado estrechos.",
    en: "The maximum adverse distance the price travelled before the trade closed. Useful for auditing whether your stops are too wide or too tight.",
    category: "execution",
  },
  {
    term: "MFE (Maximum Favorable Excursion)",
    es: "Máxima distancia a favor que recorrió el precio antes de cerrar la operación. Útil para auditar si tus objetivos son demasiado conservadores o demasiado ambiciosos.",
    en: "The maximum favorable distance the price travelled before the trade closed. Useful for auditing whether your targets are too conservative or too ambitious.",
    category: "execution",
  },
  {
    term: "Spread",
    es: "Diferencia entre el mejor precio de compra (bid) y el mejor precio de venta (ask) en el libro de órdenes. Es un coste implícito de cada operación: cuanto más estrecho, más barato entrar y salir.",
    en: "The difference between the best bid and the best ask in the order book. It is an implicit cost of every trade: the tighter it is, the cheaper it is to enter and exit.",
    category: "execution",
  },
  {
    term: "Slippage",
    es: "Diferencia entre el precio esperado de una orden y el precio al que realmente se ejecuta. Ocurre en mercados volátiles o ilíquidos y aumenta el coste real de operar más allá del spread.",
    en: "The difference between the expected price of an order and the price at which it actually fills. It occurs in volatile or illiquid markets and raises the real cost of trading beyond the spread.",
    category: "execution",
  },
  {
    term: "Limit order",
    es: "Orden que especifica el precio exacto al que estás dispuesto a comprar o vender. Garantiza el precio pero no la ejecución: si el mercado no llega a tu nivel, la orden queda abierta.",
    en: "An order specifying the exact price at which you're willing to buy or sell. Guarantees the price but not the fill: if the market never reaches your level, the order stays open.",
    category: "execution",
  },
  {
    term: "Market order",
    es: "Orden que se ejecuta inmediatamente al mejor precio disponible. Garantiza la ejecución pero no el precio: en mercados poco líquidos puede sufrir slippage significativo.",
    en: "An order that fills immediately at the best available price. Guarantees the fill but not the price: in illiquid markets it can suffer significant slippage.",
    category: "execution",
  },
  {
    term: "Leverage",
    es: "Relación entre el tamaño de la posición y el capital depositado. Un apalancamiento 10:1 mueve $10 por cada $1 de margen: multiplica ganancias y pérdidas por igual y amplifica el riesgo de ruin.",
    en: "The ratio between position size and deposited capital. 10:1 leverage moves $10 for every $1 of margin: it multiplies gains and losses equally and amplifies the risk of ruin.",
    category: "execution",
  },
  {
    term: "Margin call",
    es: "Aviso del broker cuando el capital de la cuenta cae por debajo del margen de mantenimiento. Si no se depositan más fondos, el broker cierra posiciones automáticamente para limitar su propio riesgo.",
    en: "A broker warning when account equity falls below the maintenance margin. If no additional funds are deposited, the broker auto-liquidates positions to limit its own risk.",
    category: "execution",
  },
  {
    term: "London session",
    es: "Sesión europea: 07:00–16:00 UTC (open Londres). Concentra el mayor volumen institucional junto con NY, especialmente activa en FX y índices europeos (DAX, FTSE).",
    en: "European session: 07:00–16:00 UTC (London open). Concentrates the largest institutional volume alongside NY, especially active in FX and European indices (DAX, FTSE).",
    category: "execution",
  },
  {
    term: "NY session",
    es: "Sesión americana: 13:00–22:00 UTC (open Nueva York). La más líquida del día; coincide con Londres de 13:00 a 16:00 UTC, ventana donde se mueve la mayor parte del rango diario en ES, NQ y EURUSD.",
    en: "American session: 13:00–22:00 UTC (New York open). The most liquid session of the day; overlaps with London from 13:00 to 16:00 UTC, the window where most of the daily range in ES, NQ and EURUSD is printed.",
    category: "execution",
  },
  {
    term: "Asia session",
    es: "Sesión asiática: 23:00–08:00 UTC (open Tokio). Menor volatilidad y volumen que Londres/NY, pero suele definir el rango overnight que Londres rompe a la apertura.",
    en: "Asian session: 23:00–08:00 UTC (Tokyo open). Lower volatility and volume than London/NY, but usually defines the overnight range that London breaks on its open.",
    category: "execution",
  },
  {
    term: "Kill zone",
    es: "Ventana temporal de alta probabilidad dentro de una sesión donde los setups del trader históricamente funcionan mejor (p. ej. kill zone de apertura de Londres 08:00–10:00 UTC, kill zone AM de NY 13:30–15:30 UTC). Filtrar operaciones por kill zone suele elevar la expectancy de forma notable.",
    en: "High-probability time window within a session where the trader's setups historically work best (e.g. London open kill zone 08:00–10:00 UTC, NY AM kill zone 13:30–15:30 UTC). Filtering trades by kill zone usually raises expectancy notably.",
    category: "execution",
  },
  {
    term: "SQN (System Quality Number)",
    es: "Índice de Van Tharp que mide la calidad estadística de un sistema: SQN = √N × (esperanza en R / desviación típica de R). Valores superiores a 2,5 indican un sistema excelente y robusto.",
    en: "Van Tharp metric assessing statistical system quality: SQN = √N × (expectancy in R / standard deviation of R). Values above 2.5 indicate an excellent, robust trading edge.",
    category: "metrics",
  },
  {
    term: "Ulcer index",
    es: "Medida cuadrática de la profundidad y duración del drawdown sobre la curva de capital de Peter Martin. Pondera las caídas prolongadas de forma más severa que la volatilidad ordinaria.",
    en: "Peter Martin's quadratic measure of drawdown depth and duration on the equity curve. Penalizes protracted drawdowns more heavily than ordinary volatility.",
    category: "risk",
  },
  {
    term: "Drawdown skewness",
    es: "Asimetría estadística de la serie de drawdowns. Cuantifica si las caídas tienden a ser simétricas o si existe propensión a colas pesadas de pérdidas agudas.",
    en: "Statistical asymmetry of the drawdown series. Quantifies whether dips are symmetric or prone to fat-tailed acute drawdown events.",
    category: "risk",
  },
  {
    term: "Gain-to-pain ratio",
    es: "Métrica de Jack Schwager que divide la suma de todos los rendimientos netos entre el valor absoluto de la suma de pérdidas. Mide el retorno generado por cada unidad de dolor soportado.",
    en: "Jack Schwager's ratio dividing the sum of all net profits by the absolute sum of all losses. Measures total return generated per unit of downside pain endured.",
    category: "metrics",
  },
  {
    term: "Wald-Wolfowitz runs test",
    es: "Test no paramétrico de rachas que evalúa si la secuencia de operaciones ganadoras y perdedoras es aleatoria e independiente (i.i.d.) o si exhibe clustering o alternancia artificial.",
    en: "Non-parametric runs test evaluating whether the sequence of wins and losses is random and independent (i.i.d.) or exhibits clustering or excessive alternation.",
    category: "metrics",
  },
  {
    term: "Wilson score interval",
    es: "Intervalo de confianza asimétrico para proporciones binomiales (win rate). Proporciona límites superior e inferior robustos con muestras pequeñas sin distorsión cerca de los extremos.",
    en: "Asymmetric confidence interval for binomial proportions (win rate). Yields robust lower and upper bounds on small samples without extreme boundary distortions.",
    category: "metrics",
  },
];

/** Category metadata: id, ES/EN label, accent variant for the chip. */
export const GLOSSARY_CATEGORIES: {
  id: GlossaryCategory | "all";
  es: string;
  en: string;
}[] = [
  { id: "all", es: "Todas", en: "All" },
  { id: "basics", es: "Conceptos", en: "Basics" },
  { id: "risk", es: "Riesgo", en: "Risk" },
  { id: "psychology", es: "Psicología", en: "Psychology" },
  { id: "metrics", es: "Métricas", en: "Metrics" },
  { id: "execution", es: "Ejecución", en: "Execution" },
];
