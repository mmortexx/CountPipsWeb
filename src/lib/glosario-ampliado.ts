/**
 * Lo que cada página de término añade a la definición: un ejemplo con cifras y
 * por qué importa al operar. Vive aparte de `GLOSSARY` porque solo lo leen las
 * páginas de término (servidor): en el diccionario viajaría a todo el sitio.
 * La clave es el `term` en inglés; `tests/glosario-ampliado.test.ts` exige una
 * entrada por término. Cifras en convención de cada idioma (`cifras.mjs`).
 */

import { fmtNum } from "./trading/format";
import { SQN_BUENO } from "./trading/glossary";

type Par = { es: string; en: string };
export type Ampliacion = { ejemplo: Par; importa: Par };

export const AMPLIADO: Record<string, Ampliacion> = {
  Long: {
    ejemplo: {
      es: "Compras 1 lote de EUR/USD a 1,0850 y cierras a 1,0900: has ganado 50 pips. Si el precio hubiera caído a 1,0800, habrías perdido la misma distancia en sentido contrario.",
      en: "You buy 1 lot of EUR/USD at 1.0850 and close at 1.0900: you’ve made 50 pips. Had price fallen to 1.0800, you’d have lost the same distance the other way.",
    },
    importa: {
      es: "Separar tus largos de tus cortos descubre sesgos que el total esconde: muchos traders ganan en una dirección y devuelven el beneficio en la otra sin darse cuenta.",
      en: "Splitting your longs from your shorts reveals biases the total hides: many traders win in one direction and quietly hand the profit back in the other.",
    },
  },
  Short: {
    ejemplo: {
      es: "Vendes un contrato del índice a 18.000 puntos y lo recompras a 17.900: ganas 100 puntos. Si el índice sube a 18.100, pierdes esos mismos 100 puntos.",
      en: "You sell one index contract at 18,000 and buy it back at 17,900: you make 100 points. If the index rises to 18,100, you lose those same 100 points.",
    },
    importa: {
      es: "En corto la pérdida teórica no tiene techo, porque el precio puede subir sin límite. Por eso el stop no es opcional, y medir aparte cómo te va vendiendo evita que una dirección esconda a la otra.",
      en: "On a short the theoretical loss has no ceiling, because price can rise without limit. That is why the stop is not optional, and measuring your shorts separately stops one direction hiding the other.",
    },
  },
  Setup: {
    ejemplo: {
      es: "«Retroceso al 50 % del impulso en tendencia alcista, con vela de rechazo durante la sesión de Londres» es un setup: dice qué buscas, cuándo entras y dónde va el stop.",
      en: "“Pullback to 50% of the impulse in an uptrend, with a rejection candle during the London session” is a setup: it says what you look for, when you get in and where the stop goes.",
    },
    importa: {
      es: "Etiquetar cada operación con su setup permite ver cuál paga y cuál no. Sin esa etiqueta, un setup rentable y otro que pierde se mezclan en una media que no dice nada.",
      en: "Tagging every trade with its setup shows which one pays and which doesn’t. Without the tag, a profitable setup and a losing one blend into an average that says nothing.",
    },
  },
  Breakout: {
    ejemplo: {
      es: "El precio lleva tres días entre 1,2600 y 1,2700. Una vela cierra en 1,2720 con volumen alto: es una ruptura del rango por arriba, y quien opera rupturas compra ahí.",
      en: "Price has spent three days between 1.2600 and 1.2700. A candle closes at 1.2720 on high volume: that is a breakout above the range, and breakout traders buy there.",
    },
    importa: {
      es: "Muchas rupturas fallan y vuelven al rango. Llevar la cuenta de cuántas de las tuyas siguen y cuántas fallan te dice si debes entrar al romper o esperar al retesteo.",
      en: "Many breakouts fail and fall back into the range. Counting how many of yours follow through and how many fail tells you whether to enter on the break or wait for the retest.",
    },
  },
  "Prop firm": {
    ejemplo: {
      es: "Una firma te deja operar una cuenta de 100.000 $ si superas su evaluación: por ejemplo, ganar un 10 % sin perder más de un 5 % en un día ni un 10 % en total. Si la superas, te quedas con buena parte del beneficio.",
      en: "A firm lets you trade a $100,000 account if you pass its evaluation: for example, making 10% without losing more than 5% in a day or 10% overall. Pass it and you keep a large share of the profit.",
    },
    importa: {
      es: "La mayoría de evaluaciones no se pierden por falta de ventaja, sino por romper una regla de pérdida en un mal día. Medir cada operación contra los límites de la firma separa pasar de pagar otro intento.",
      en: "Most evaluations are not lost for lack of edge but by breaking a loss rule on one bad day. Measuring every trade against the firm’s limits separates passing from paying for another attempt.",
    },
  },
  "Track record": {
    ejemplo: {
      es: "Doscientas operaciones registradas durante un año, con fecha, tamaño, entrada, salida y resultado, forman un track record. Tres capturas de pantalla de días buenos, no.",
      en: "Two hundred trades logged over a year, with date, size, entry, exit and result, make a track record. Three screenshots of good days do not.",
    },
    importa: {
      es: "Es la única prueba de que tu ventaja existe, para ti y para quien te financie. Cuantas más operaciones y más tiempo cubre, menos peso tiene la suerte en lo que muestra.",
      en: "It is the only proof your edge exists, to you and to anyone funding you. The more trades and the longer it covers, the less luck weighs in what it shows.",
    },
  },
  Liquidity: {
    ejemplo: {
      es: "En EUR/USD a media sesión de Londres puedes mover varios lotes sin que el precio se inmute. En un par exótico a medianoche, la misma orden puede saltar varios pips.",
      en: "In EUR/USD in the middle of the London session you can move several lots without price flinching. In an exotic pair at midnight, the same order can jump several pips.",
    },
    importa: {
      es: "Con poca liquidez el spread se abre y el deslizamiento crece, y los dos se comen la ventaja en silencio. Comparar tus resultados por hora suele mostrar que las peores horas son las menos líquidas.",
      en: "With thin liquidity the spread widens and slippage grows, and both eat your edge quietly. Comparing your results by hour often shows the worst hours are the least liquid.",
    },
  },
  Volatility: {
    ejemplo: {
      es: "Si un índice se mueve de media 150 puntos al día y hoy recorre 400, la volatilidad se ha más que duplicado: el mismo stop de 50 puntos aguanta mucho menos.",
      en: "If an index moves 150 points a day on average and today it covers 400, volatility has more than doubled: the same 50-point stop survives far less.",
    },
    importa: {
      es: "La volatilidad decide el tamaño del stop, y el stop decide el tamaño de la posición. Operar el mismo lotaje con el doble de volatilidad es arriesgar el doble sin haberlo decidido.",
      en: "Volatility sets the size of the stop, and the stop sets the size of the position. Trading the same lot size at twice the volatility is risking twice as much without having decided to.",
    },
  },
  Pullback: {
    ejemplo: {
      es: "En una tendencia alcista el precio sube de 100 a 120, retrocede a 112 y vuelve a subir. Ese paso atrás hasta 112 es el pullback, y es donde muchos traders buscan entrar.",
      en: "In an uptrend price climbs from 100 to 120, pulls back to 112 and rises again. That step back to 112 is the pullback, and it is where many traders look to get in.",
    },
    importa: {
      es: "Entrar en un retroceso da mejor precio y un stop más corto que perseguir el máximo. El riesgo es confundirlo con el inicio de una reversión: por eso conviene medir cuántos de tus pullbacks continúan.",
      en: "Entering on a pullback gives a better price and a tighter stop than chasing the high. The risk is mistaking it for the start of a reversal, so it pays to measure how many of your pullbacks continue.",
    },
  },
  Reversal: {
    ejemplo: {
      es: "Tras semanas de máximos crecientes, el precio marca un máximo más bajo y rompe el último mínimo relevante: la tendencia alcista ha dado paso a una bajista.",
      en: "After weeks of higher highs, price prints a lower high and breaks the last significant low: the uptrend has given way to a downtrend.",
    },
    importa: {
      es: "Operar reversiones es ir contra la corriente: aciertas menos veces, pero cada acierto suele pagar más. Solo tu historial dice si a ti te compensa.",
      en: "Trading reversals means going against the current: you are right less often, but each win tends to pay more. Only your record says whether it is worth it for you.",
    },
  },
  Trend: {
    ejemplo: {
      es: "Un par que en tres meses pasa de 1,05 a 1,12 marcando máximos y mínimos cada vez más altos está en tendencia alcista, aunque por el camino haya retrocesos.",
      en: "A pair that goes from 1.05 to 1.12 in three months, printing ever higher highs and lows, is in an uptrend, even if there are pullbacks along the way.",
    },
    importa: {
      es: "Las mismas reglas que ganan en tendencia suelen perder en rango, y al revés. Etiquetar el contexto de cada operación te enseña en cuál de los dos está tu ventaja.",
      en: "The same rules that win in a trend tend to lose in a range, and vice versa. Tagging each trade’s context shows you which of the two holds your edge.",
    },
  },
  Range: {
    ejemplo: {
      es: "El oro rebota durante dos semanas entre 2.300 y 2.350 dólares: compra cerca de 2.300, venta cerca de 2.350, y ninguna ruptura se sostiene más de unas horas.",
      en: "Gold bounces for two weeks between $2,300 and $2,350: buying near $2,300, selling near $2,350, and no breakout holds for more than a few hours.",
    },
    importa: {
      es: "En rango ganan las entradas en los extremos y pierden las rupturas. Saber si tus pérdidas se concentran en mercados laterales te dice cuándo conviene operar menos.",
      en: "In a range, entries at the edges win and breakouts lose. Knowing whether your losses cluster in sideways markets tells you when it pays to trade less.",
    },
  },
  Edge: {
    ejemplo: {
      es: "Si tus ganancias medias son 1,5 veces tus pérdidas medias y aciertas el 45 %, cada operación vale de media +0,125R: 0,45 × 1,5 − 0,55 × 1. Esa cifra positiva es tu ventaja.",
      en: "If your average win is 1.5 times your average loss and you win 45% of the time, each trade is worth +0.125R on average: 0.45 × 1.5 − 0.55 × 1. That positive number is your edge.",
    },
    importa: {
      es: "Sin ventaja positiva, ninguna gestión del riesgo te salva a largo plazo; con ella, la gestión decide cuánto aprovechas. Y solo se confirma con suficientes operaciones registradas.",
      en: "Without a positive edge, no risk management saves you in the long run; with one, management decides how much of it you keep. And it is only confirmed with enough logged trades.",
    },
  },
  "Stop loss": {
    ejemplo: {
      es: "Compras a 1,1000 con stop en 1,0980: si el precio cae 20 pips, la orden te saca y la pérdida queda en lo que decidiste antes de entrar.",
      en: "You buy at 1.1000 with a stop at 1.0980: if price drops 20 pips, the order takes you out and the loss stays at what you decided before getting in.",
    },
    importa: {
      es: "El stop convierte una pérdida posible en una pérdida medida, y es la base para calcular el tamaño de posición. Moverlo para no cerrar es la forma más común de que una pérdida pequeña se haga grande.",
      en: "The stop turns a possible loss into a measured one, and it is the basis for sizing the position. Moving it to avoid closing is the most common way a small loss becomes a big one.",
    },
  },
  Drawdown: {
    ejemplo: {
      es: "Tu cuenta sube de 10.000 $ a 12.000 $ y luego baja a 9.600 $: el drawdown desde el máximo es de 2.400 $, un 20 %.",
      en: "Your account rises from $10,000 to $12,000 and then falls to $9,600: the drawdown from the peak is $2,400, or 20%.",
    },
    importa: {
      es: "Las caídas no se recuperan en proporción: tras perder un 20 % necesitas ganar un 25 % para volver al máximo, y tras un 50 %, un 100 %. Por eso limitar el drawdown pesa más que exprimir la ganancia.",
      en: "Drawdowns are not recovered in proportion: after losing 20% you need 25% to get back to the peak, and after 50%, 100%. That is why capping drawdown matters more than squeezing out extra gains.",
    },
  },
  "Risk of ruin": {
    ejemplo: {
      es: "Con un 55 % de acierto y ganancias iguales a las pérdidas, arriesgar un 10 % por operación deja en torno a un 13 % de probabilidad de perder la cuenta entera. Arriesgando un 1 %, la probabilidad es prácticamente nula.",
      en: "With a 55% win rate and wins equal to losses, risking 10% per trade leaves roughly a 13% chance of losing the whole account. Risking 1%, the chance is practically zero.",
    },
    importa: {
      es: "La misma ventaja puede llevarte a la ruina o hacer crecer la cuenta según cuánto arriesgas en cada operación. Es la cifra que justifica arriesgar poco aunque la estrategia sea buena.",
      en: "The same edge can ruin you or grow your account depending on how much you risk per trade. It is the number that justifies risking little even when the strategy is good.",
    },
  },
  "Position sizing": {
    ejemplo: {
      es: "Con 10.000 $ de balance, un 1 % de riesgo y un stop de 25 pips en EUR/USD (10 $ por pip y lote), la posición es de 0,4 lotes: 100 $ de riesgo entre 250 $ por lote.",
      en: "With a $10,000 balance, 1% risk and a 25-pip stop on EUR/USD ($10 per pip per lot), the position is 0.4 lots: $100 of risk divided by $250 per lot.",
    },
    importa: {
      es: "Es lo que mantiene igual el riesgo de cada operación aunque cambie la distancia al stop. Sin calcularlo, el stop más largo arriesga más dinero y las pérdidas dejan de ser comparables.",
      en: "It keeps the risk of every trade the same even when the stop distance changes. Without it, the wider stop risks more money and your losses stop being comparable.",
    },
  },
  "Risk-reward ratio": {
    ejemplo: {
      es: "Entras con el stop a 20 pips y el objetivo a 60: la relación riesgo-beneficio es 1:3. Con ella te basta acertar algo más del 25 % de las veces para no perder dinero, antes de costes.",
      en: "You enter with the stop 20 pips away and the target 60 away: the risk-reward ratio is 1:3. With it, winning just over 25% of the time is enough not to lose money, before costs.",
    },
    importa: {
      es: "La relación y la tasa de acierto van juntas: una sin la otra no dice si ganas. Lo que cuenta es la relación que consigues de verdad al cerrar, no la que planeas al entrar.",
      en: "The ratio and the win rate go together: one without the other does not tell you whether you make money. What counts is the ratio you actually get at the exit, not the one you plan at the entry.",
    },
  },
  "Kelly criterion": {
    ejemplo: {
      es: "Con un 55 % de acierto y ganancias iguales a las pérdidas, Kelly sugiere arriesgar un 10 % por operación: 0,55 − 0,45 / 1. Muchos traders usan la mitad o la cuarta parte de esa cifra.",
      en: "With a 55% win rate and wins equal to losses, Kelly suggests risking 10% per trade: 0.55 − 0.45 / 1. Many traders use half or a quarter of that figure.",
    },
    importa: {
      es: "Marca el máximo que tiene sentido arriesgar: pasar de ahí reduce el crecimiento y dispara las caídas. Como tu tasa de acierto real es incierta, arriesgar el Kelly completo suele ser demasiado.",
      en: "It marks the most it makes sense to risk: going beyond it lowers growth and inflates drawdowns. Because your true win rate is uncertain, betting full Kelly is usually too much.",
    },
  },
  Margin: {
    ejemplo: {
      es: "Para abrir 1 lote de EUR/USD (100.000 €) con apalancamiento 1:30, el bróker te retiene unos 3.333 € de margen. El resto de la cuenta queda libre para otras operaciones.",
      en: "To open 1 lot of EUR/USD (€100,000) at 1:30 leverage, the broker sets aside about €3,333 as margin. The rest of the account stays free for other trades.",
    },
    importa: {
      es: "El margen no es lo que arriesgas, sino la garantía que el bróker retiene mientras la posición está abierta. Confundirlos lleva a abrir posiciones demasiado grandes para el stop que usas.",
      en: "Margin is not what you risk but the collateral the broker holds while the position is open. Confusing the two leads to positions too large for the stop you use.",
    },
  },
  "Max drawdown": {
    ejemplo: {
      es: "En un año tu cuenta tuvo tres caídas desde sus máximos: del 6 %, del 14 % y del 9 %. El drawdown máximo es el 14 %, la peor de las tres.",
      en: "Over a year your account had three dips from its peaks: 6%, 14% and 9%. The max drawdown is 14%, the worst of the three.",
    },
    importa: {
      es: "Es la cifra que dice cuánto dolor arrastra la estrategia, y la que vigilan las prop firms. Si tu peor caída pasada roza el límite de la firma, la próxima puede pasarlo.",
      en: "It tells you how much pain the strategy carries, and it is what prop firms police. If your worst past dip comes close to the firm’s limit, the next one can cross it.",
    },
  },
  FOMO: {
    ejemplo: {
      es: "El precio se dispara sin ti y entras tarde, sin setup y con el stop lejos, solo para no quedarte fuera. Esa entrada es FOMO, aunque a veces salga bien.",
      en: "Price takes off without you and you jump in late, with no setup and a distant stop, just so you are not left out. That entry is FOMO, even when it happens to work.",
    },
    importa: {
      es: "Las entradas por FOMO suelen comprar caro y arriesgar más de lo previsto. Etiquetarlas en el diario muestra cuánto te cuestan en dinero, que es lo que de verdad hace cambiar el hábito.",
      en: "FOMO entries tend to buy high and risk more than planned. Tagging them in the journal shows what they cost you in money, which is what actually changes the habit.",
    },
  },
  "Revenge trading": {
    ejemplo: {
      es: "Pierdes 200 $ por la mañana y abres en seguida otra operación con el doble de tamaño para recuperarlos. Esa segunda operación es revenge trading.",
      en: "You lose $200 in the morning and immediately open another trade at twice the size to win it back. That second trade is revenge trading.",
    },
    importa: {
      es: "Convierte una pérdida normal en un mal día, y un mal día en una cuenta quemada. Un límite de pérdida diaria fijado de antemano es la defensa más simple contra ella.",
      en: "It turns a normal loss into a bad day, and a bad day into a blown account. A daily loss limit set in advance is the simplest defence against it.",
    },
  },
  Tilt: {
    ejemplo: {
      es: "Tras tres pérdidas seguidas empiezas a saltarte el plan: entras sin señal, mueves el stop y subes el tamaño. Estás en tilt, aunque desde dentro no lo parezca.",
      en: "After three losses in a row you start skipping the plan: entering without a signal, moving the stop, raising the size. You are on tilt, even if it doesn’t feel like it from the inside.",
    },
    importa: {
      es: "El tilt se ve en los datos antes que en el espejo: más operaciones, más tamaño y peor resultado tras una racha perdedora. Detectarlo a tiempo es saber cuándo parar.",
      en: "Tilt shows in the data before it shows in the mirror: more trades, bigger size and worse results after a losing streak. Spotting it in time means knowing when to stop.",
    },
  },
  Discipline: {
    ejemplo: {
      es: "Tu plan dice un 1 % de riesgo y como mucho tres operaciones al día. Un día disciplinado es aquel en que cumples las dos cosas, ganes o pierdas.",
      en: "Your plan says 1% risk and at most three trades a day. A disciplined day is one where you keep both, whether you win or lose.",
    },
    importa: {
      es: "Una estrategia con ventaja solo rinde si se ejecuta igual cada vez. Medir cuánto te cuesta en dinero cada regla rota convierte la disciplina de una intención en una cifra.",
      en: "A strategy with an edge only pays if it is executed the same way every time. Measuring what each broken rule costs you in money turns discipline from an intention into a number.",
    },
  },
  Expectancy: {
    ejemplo: {
      es: "Aciertas el 40 % con una ganancia media de 300 $ y una pérdida media de 150 $: 0,40 × 300 − 0,60 × 150 = 30 $ de media por operación.",
      en: "You win 40% of the time with an average win of $300 and an average loss of $150: 0.40 × 300 − 0.60 × 150 = $30 per trade on average.",
    },
    importa: {
      es: "Resume en una cifra si tu sistema gana dinero a la larga. Medida en R en lugar de en dólares, además, permite comparar estrategias con tamaños de posición distintos.",
      en: "It sums up in one number whether your system makes money in the long run. Measured in R rather than dollars, it also lets you compare strategies with different position sizes.",
    },
  },
  "Profit factor": {
    ejemplo: {
      es: "En un mes tus operaciones ganadoras suman 4.500 $ y las perdedoras 3.000 $: el profit factor es 4.500 / 3.000 = 1,5.",
      en: "In a month your winning trades add up to $4,500 and your losing trades to $3,000: the profit factor is 4,500 / 3,000 = 1.5.",
    },
    importa: {
      es: "Por debajo de 1 pierdes dinero; entre 1,5 y 2 suele considerarse sólido. Es fácil de leer, pero conviene mirarlo junto al número de operaciones: con pocas, un solo acierto grande lo infla.",
      en: "Below 1 you lose money; between 1.5 and 2 is usually considered solid. It is easy to read, but look at it alongside the number of trades: with few, one big win inflates it.",
    },
  },
  "Sharpe ratio": {
    ejemplo: {
      es: "Una estrategia que rinde un 20 % anual con una volatilidad del 10 % tiene un Sharpe de 2, sin contar la tasa libre de riesgo. Otra que rinde lo mismo con un 20 % de volatilidad se queda en 1.",
      en: "A strategy returning 20% a year with 10% volatility has a Sharpe of 2, ignoring the risk-free rate. Another returning the same with 20% volatility stays at 1.",
    },
    importa: {
      es: "Dice cuánta rentabilidad obtienes por cada unidad de riesgo, y permite comparar estrategias distintas. Su punto débil es que castiga igual las subidas bruscas que las caídas.",
      en: "It tells you how much return you get per unit of risk, and lets you compare different strategies. Its weak spot is that it penalises sharp gains as much as sharp losses.",
    },
  },
  "Sortino ratio": {
    ejemplo: {
      es: "Dos estrategias rinden lo mismo: una tiene subidas bruscas y caídas suaves, la otra al revés. El Sharpe las puntúa parecido; el Sortino, que solo mira las caídas, prefiere con claridad la primera.",
      en: "Two strategies return the same: one has sharp rises and gentle falls, the other the opposite. Sharpe scores them alike; Sortino, which only looks at the falls, clearly prefers the first.",
    },
    importa: {
      es: "A un trader le preocupa perder, no ganar de golpe. El Sortino mide justo eso, así que suele describir mejor el riesgo de las estrategias con ganancias asimétricas.",
      en: "A trader worries about losing, not about winning suddenly. Sortino measures exactly that, so it tends to describe the risk of strategies with lopsided gains better.",
    },
  },
  "Calmar ratio": {
    ejemplo: {
      es: "Una estrategia gana un 30 % anual y su peor caída fue del 15 %: su ratio de Calmar es 2. Si la caída hubiera sido del 30 %, sería 1.",
      en: "A strategy makes 30% a year and its worst drawdown was 15%: its Calmar ratio is 2. Had the drawdown been 30%, it would be 1.",
    },
    importa: {
      es: "Relaciona lo que ganas con la peor caída que hubo que soportar para ganarlo. Es la métrica más cercana a la pregunta de fondo: ¿compensa el sufrimiento?",
      en: "It relates what you make to the worst drawdown you had to sit through to make it. It is the metric closest to the underlying question: is the pain worth it?",
    },
  },
  "R-multiple": {
    ejemplo: {
      es: "Arriesgas 100 $, que es tu 1R. Si ganas 250 $, la operación vale +2,5R; si pierdes 100 $, −1R; si sales antes y pierdes 50 $, −0,5R.",
      en: "You risk $100, which is your 1R. If you make $250, the trade is worth +2.5R; if you lose $100, −1R; if you exit early and lose $50, −0.5R.",
    },
    importa: {
      es: "Medir en R hace comparables operaciones de tamaños y cuentas distintos. Además, delata en seguida las pérdidas mayores de −1R: señal de que el stop no se respetó.",
      en: "Measuring in R makes trades of different sizes and accounts comparable. It also exposes losses bigger than −1R straight away: a sign the stop was not respected.",
    },
  },
  "Win rate": {
    ejemplo: {
      es: "De 80 operaciones cierras 36 en positivo: tu tasa de acierto es del 45 %. Las otras 44, entre pérdidas y operaciones a cero, forman el resto.",
      en: "Out of 80 trades you close 36 in profit: your win rate is 45%. The other 44, losses and break-even trades together, make up the rest.",
    },
    importa: {
      es: "Sola no dice nada: un 30 % puede ser muy rentable con ganancias grandes, y un 80 % perder dinero si las pérdidas son enormes. Siempre se lee junto al payoff.",
      en: "On its own it says nothing: 30% can be very profitable with big wins, and 80% can lose money if the losses are huge. Always read it alongside the payoff.",
    },
  },
  Payoff: {
    ejemplo: {
      es: "Tu ganancia media es de 180 $ y tu pérdida media de 120 $: el payoff es 180 / 120 = 1,5.",
      en: "Your average win is $180 and your average loss $120: the payoff is 180 / 120 = 1.5.",
    },
    importa: {
      es: "Con un payoff de 1,5 te basta acertar más del 40 % para ganar dinero, antes de costes. Si cortas las ganancias pronto, el payoff baja y necesitas acertar mucho más.",
      en: "With a payoff of 1.5, winning more than 40% of the time is enough to make money, before costs. Cut your winners early and the payoff drops, so you need to be right far more often.",
    },
  },
  "Monte Carlo": {
    ejemplo: {
      es: "Se toman tus 200 operaciones reales y se barajan miles de veces en órdenes distintos. Cada orden da una curva de balance diferente, y juntas muestran el abanico de caídas posibles.",
      en: "Your 200 real trades are reshuffled thousands of times into different orders. Each order gives a different balance curve, and together they show the range of possible drawdowns.",
    },
    importa: {
      es: "Tu historial es solo uno de los muchos caminos que tu ventaja podía haber seguido. La simulación enseña la peor caída razonable que cabe esperar, que suele ser mayor que la que ya viviste.",
      en: "Your record is just one of the many paths your edge could have taken. The simulation shows the worst reasonable drawdown to expect, which is usually larger than the one you have already lived through.",
    },
  },
  Backtesting: {
    ejemplo: {
      es: "Aplicas tus reglas de entrada y salida a cinco años de datos de EUR/USD y obtienes 300 operaciones simuladas, con su tasa de acierto, su payoff y su drawdown.",
      en: "You apply your entry and exit rules to five years of EUR/USD data and get 300 simulated trades, with their win rate, payoff and drawdown.",
    },
    importa: {
      es: "Permite descartar ideas sin arriesgar dinero. Pero un backtest se ajusta al pasado: hay que contrastarlo con operaciones reales antes de fiarse de él.",
      en: "It lets you discard ideas without risking money. But a backtest is fitted to the past, so it has to be checked against real trades before you trust it.",
    },
  },
  "Forward testing": {
    ejemplo: {
      es: "Tras el backtest, operas el sistema tres meses en demo o con el tamaño mínimo y comparas sus cifras con las simuladas: acierto, payoff y caída máxima.",
      en: "After the backtest, you trade the system for three months on demo or at minimum size and compare its numbers with the simulated ones: win rate, payoff and max drawdown.",
    },
    importa: {
      es: "Es la prueba de que la ventaja del backtest sobrevive a la ejecución real: deslizamiento, horarios y tus propias decisiones. Si las cifras se separan mucho, el backtest estaba sobreajustado.",
      en: "It proves the backtest edge survives real execution: slippage, timing and your own decisions. If the numbers drift far apart, the backtest was overfitted.",
    },
  },
  "Curve fitting": {
    ejemplo: {
      es: "Fijas una media móvil de 37 periodos, un stop de 23 pips y solo operas martes y jueves porque así el backtest da su mejor resultado. Eso es curve fitting.",
      en: "You set a 37-period moving average, a 23-pip stop and trade only on Tuesdays and Thursdays because that is where the backtest looks best. That is curve fitting.",
    },
    importa: {
      es: "Un sistema sobreajustado describe el ruido del pasado, no una ventaja, y se rompe en cuanto opera en real. Cuantas menos reglas y parámetros, menos riesgo de caer en él.",
      en: "An overfitted system describes past noise, not an edge, and breaks as soon as it trades live. The fewer rules and parameters, the lower the risk of falling into it.",
    },
  },
  CAGR: {
    ejemplo: {
      es: "Una cuenta pasa de 10.000 $ a 14.400 $ en dos años: su CAGR es del 20 %, porque 10.000 × 1,2 × 1,2 = 14.400.",
      en: "An account grows from $10,000 to $14,400 in two years: its CAGR is 20%, because 10,000 × 1.2 × 1.2 = 14,400.",
    },
    importa: {
      es: "Pone en la misma escala anual rendimientos de periodos distintos. La media simple engaña cuando hay años de pérdidas; el CAGR no, porque tiene en cuenta el interés compuesto.",
      en: "It puts returns from different periods on the same yearly scale. A simple average misleads when there are losing years; CAGR does not, because it accounts for compounding.",
    },
  },
  "Take profit": {
    ejemplo: {
      es: "Compras a 1,1000 con take profit en 1,1060: si el precio llega ahí, la orden cierra la operación y asegura los 60 pips aunque no estés mirando.",
      en: "You buy at 1.1000 with a take profit at 1.1060: if price gets there, the order closes the trade and locks in the 60 pips even if you are not watching.",
    },
    importa: {
      es: "Fijar el objetivo de antemano protege de cerrar demasiado pronto por miedo. Comparar tus objetivos con el MFE de cada operación dice si los pones demasiado cerca o demasiado lejos.",
      en: "Setting the target in advance protects you from closing too early out of fear. Comparing your targets with each trade’s MFE tells you whether you set them too close or too far.",
    },
  },
  "MAE (Maximum Adverse Excursion)": {
    ejemplo: {
      es: "Compras a 1,1000, el precio baja hasta 1,0985 y luego sube, y cierras en 1,1040. La MAE de esa operación es de 15 pips: lo máximo que estuvo en tu contra.",
      en: "You buy at 1.1000, price dips to 1.0985, then rises and you close at 1.1040. That trade’s MAE is 15 pips: the furthest it went against you.",
    },
    importa: {
      es: "Si tus ganadoras casi nunca van más de 12 pips en contra, un stop de 30 pips arriesga más de lo necesario. La MAE es la forma de ajustar el stop con datos y no a ojo.",
      en: "If your winners rarely go more than 12 pips against you, a 30-pip stop risks more than it needs to. MAE is how you set the stop from data rather than by eye.",
    },
  },
  "MFE (Maximum Favorable Excursion)": {
    ejemplo: {
      es: "Compras a 1,1000, el precio llega a 1,1080 y acabas cerrando en 1,1030. El MFE es de 80 pips, pero solo te llevaste 30.",
      en: "You buy at 1.1000, price reaches 1.1080 and you end up closing at 1.1030. The MFE is 80 pips, but you only took 30.",
    },
    importa: {
      es: "Compararlo con lo que de verdad capturas muestra cuánto dinero dejas en la mesa. Si sueles capturar poco del MFE, el problema está en la salida, no en la entrada.",
      en: "Comparing it with what you actually capture shows how much money you leave on the table. If you usually capture little of the MFE, the problem is the exit, not the entry.",
    },
  },
  Spread: {
    ejemplo: {
      es: "EUR/USD cotiza a 1,10000 / 1,10008: el spread es de 0,8 pips, y es lo que pagas nada más abrir, antes de que el precio se mueva.",
      en: "EUR/USD is quoted at 1.10000 / 1.10008: the spread is 0.8 pips, and it is what you pay the moment you open, before price moves at all.",
    },
    importa: {
      es: "Es un coste fijo en cada operación: cuanto más corto es tu objetivo, más parte de la ganancia se lleva. En scalping puede decidir por sí solo si la estrategia es rentable.",
      en: "It is a fixed cost on every trade: the shorter your target, the bigger the share of the profit it takes. In scalping it can decide on its own whether the strategy is profitable.",
    },
  },
  Slippage: {
    ejemplo: {
      es: "Tu stop está en 1,0950, pero una noticia hace saltar el precio y la orden se ejecuta en 1,0942: 8 pips de deslizamiento que no estaban en el plan.",
      en: "Your stop is at 1.0950, but a news release makes price jump and the order fills at 1.0942: 8 pips of slippage that were not in the plan.",
    },
    importa: {
      es: "Hace que tus pérdidas reales sean mayores que las planeadas, sobre todo con noticias y en horas poco líquidas. Medirlo dice qué parte de tus pérdidas por encima de −1R viene del mercado y no de ti.",
      en: "It makes your real losses bigger than planned, especially around news and in thin hours. Measuring it tells you how much of your losses beyond −1R comes from the market rather than from you.",
    },
  },
  "Limit order": {
    ejemplo: {
      es: "EUR/USD está en 1,1020 y colocas una orden limitada de compra en 1,1000: solo se ejecutará si el precio baja hasta ese nivel o a uno mejor.",
      en: "EUR/USD is at 1.1020 and you place a buy limit at 1.1000: it only fills if price comes down to that level or a better one.",
    },
    importa: {
      es: "Te da el precio que quieres y evita el deslizamiento, a cambio de que a veces no se ejecute. Las operaciones que pierdes por no entrar también cuentan, aunque nunca salgan en el balance.",
      en: "It gets you the price you want and avoids slippage, at the cost of sometimes not filling. The trades you miss by not getting in count too, even if they never show in the balance.",
    },
  },
  "Market order": {
    ejemplo: {
      es: "Pulsas comprar con EUR/USD a 1,1020 / 1,1021 y entras al momento a 1,1021, o algo peor si el precio se mueve en ese mismo instante.",
      en: "You hit buy with EUR/USD at 1.1020 / 1.1021 and get in straight away at 1.1021, or slightly worse if price moves in that very instant.",
    },
    importa: {
      es: "Garantiza la entrada pero no el precio. En mercados rápidos, el deslizamiento de las órdenes a mercado puede comerse buena parte de una ventaja pequeña.",
      en: "It guarantees the entry but not the price. In fast markets, the slippage on market orders can eat a large part of a small edge.",
    },
  },
  Leverage: {
    ejemplo: {
      es: "Con 1.000 € y apalancamiento 1:30 puedes abrir posiciones de hasta 30.000 €. Un movimiento del 1 % en contra se convierte en una pérdida del 30 % de tu cuenta.",
      en: "With €1,000 and 1:30 leverage you can open positions of up to €30,000. A 1% move against you becomes a 30% loss on your account.",
    },
    importa: {
      es: "El apalancamiento no cambia tu ventaja, solo amplifica el resultado en los dos sentidos. Lo que decide el riesgo real es el tamaño de posición respecto al stop, no el apalancamiento máximo que ofrece el bróker.",
      en: "Leverage does not change your edge; it only amplifies the outcome both ways. What sets the real risk is the position size relative to the stop, not the maximum leverage the broker offers.",
    },
  },
  "Margin call": {
    ejemplo: {
      es: "Tienes 2.000 € en la cuenta y 1.500 € retenidos como margen. Si las pérdidas abiertas bajan tu patrimonio por debajo del nivel que fija el bróker, recibes un margin call y pueden cerrarte posiciones.",
      en: "You have €2,000 in the account and €1,500 held as margin. If open losses push your equity below the level the broker sets, you get a margin call and positions may be closed for you.",
    },
    importa: {
      es: "Si llegas a un margin call, tus posiciones ya eran demasiado grandes para tu cuenta. Con un stop puesto y un tamaño calculado, no debería ocurrir nunca.",
      en: "If you reach a margin call, your positions were already too big for your account. With a stop in place and a calculated size, it should never happen.",
    },
  },
  "London session": {
    ejemplo: {
      es: "Entre las 8:00 y las 16:30, hora de Londres, transcurre la sesión con más volumen de divisas del día, y los pares con libra y euro suelen moverse más que en el resto de horas.",
      en: "Between 8:00 and 16:30 London time runs the session with the most currency volume of the day, and pound and euro pairs tend to move more than at any other time.",
    },
    importa: {
      es: "Más volumen significa spreads más bajos y movimientos más limpios. Comparar tus resultados por sesión suele mostrar en cuál de ellas está tu ventaja.",
      en: "More volume means tighter spreads and cleaner moves. Comparing your results by session often shows which one holds your edge.",
    },
  },
  "NY session": {
    ejemplo: {
      es: "De 9:30 a 16:00, hora de Nueva York, abren las bolsas estadounidenses. Sus primeras horas se solapan con el final de Londres y suelen ser las más agitadas del día.",
      en: "From 9:30 to 16:00 New York time, the US stock markets are open. Their first hours overlap with the end of London and tend to be the busiest of the day.",
    },
    importa: {
      es: "El solapamiento con Londres concentra volumen y noticias de Estados Unidos, lo que trae oportunidades y deslizamiento a la vez. Saber cómo operas en esa franja evita sorpresas.",
      en: "The overlap with London concentrates volume and US news, which brings opportunity and slippage at once. Knowing how you trade in that window avoids surprises.",
    },
  },
  "Asia session": {
    ejemplo: {
      es: "Mientras Europa duerme operan Tokio y Sídney. El yen y el dólar australiano se mueven más, y los pares europeos suelen quedarse en rango durante 8 o 9 horas.",
      en: "While Europe sleeps, Tokyo and Sydney are trading. The yen and the Australian dollar move most, and European pairs tend to stay in a range for 8 or 9 hours.",
    },
    importa: {
      es: "La menor volatilidad favorece las estrategias de rango y castiga las de ruptura. Si operas en esas horas, tus cifras por sesión te dirán si te conviene.",
      en: "Lower volatility favours range strategies and punishes breakout ones. If you trade those hours, your numbers by session will tell you whether it suits you.",
    },
  },
  "Kill zone": {
    ejemplo: {
      es: "Un trader decide operar solo en la primera hora de Londres y en la primera de Nueva York, 2 horas al día en total, y no abre nada fuera de esas dos ventanas.",
      en: "A trader decides to trade only the first hour of London and the first hour of New York, 2 hours a day in all, and opens nothing outside those two windows.",
    },
    importa: {
      es: "Restringir el horario reduce las operaciones por aburrimiento y concentra la atención donde hay movimiento. Tus resultados por hora confirman si esas ventanas son de verdad las tuyas.",
      en: "Restricting the hours cuts boredom trades and focuses attention where the movement is. Your results by hour confirm whether those windows really are yours.",
    },
  },
  "SQN (System Quality Number)": {
    ejemplo: {
      es: "Con 100 operaciones, una media de +0,3R y una desviación estándar de 1,5R, el SQN es √100 × 0,3 / 1,5 = 2.",
      en: "With 100 trades, an average of +0.3R and a standard deviation of 1.5R, the SQN is √100 × 0.3 / 1.5 = 2.",
    },
    importa: {
      es: `Combina ventaja, regularidad y número de operaciones en una sola nota. A partir de ${fmtNum(SQN_BUENO, "es", 1)} suele considerarse un buen sistema, aunque con pocas operaciones la cifra es poco fiable.`,
      en: `It combines edge, consistency and number of trades into one score. ${fmtNum(SQN_BUENO, "en", 1)} and up is usually considered a good system, though with few trades the figure is unreliable.`,
    },
  },
  "Ulcer index": {
    ejemplo: {
      es: "Dos cuentas terminan el año con el mismo beneficio. Una pasó meses un 15 % por debajo de su máximo; la otra nunca bajó más de un 5 %. La primera tiene un Ulcer index mucho mayor.",
      en: "Two accounts end the year with the same profit. One spent months 15% below its peak; the other never dropped more than 5%. The first has a much higher Ulcer index.",
    },
    importa: {
      es: "A diferencia del drawdown máximo, no mira solo la peor caída, sino cuánto y durante cuánto tiempo estuviste por debajo del máximo. Mide el desgaste que de verdad se sufre.",
      en: "Unlike max drawdown, it looks not just at the worst dip but at how deep and how long you sat below the peak. It measures the wear you actually go through.",
    },
  },
  "Drawdown skewness": {
    ejemplo: {
      es: "Si 9 de cada 10 de tus caídas son pequeñas pero de vez en cuando aparece una enorme, la distribución de tus drawdowns tiene una cola larga hacia las pérdidas.",
      en: "If 9 out of 10 of your drawdowns are small but now and then a huge one appears, their distribution has a long tail towards losses.",
    },
    importa: {
      es: "Una caída media tranquilizadora puede esconder un riesgo de cola serio. La asimetría avisa de que la próxima caída grande puede ser mucho peor que la típica.",
      en: "A reassuring average drawdown can hide serious tail risk. The skew warns that the next big drawdown can be far worse than the typical one.",
    },
  },
  "Gain-to-pain ratio": {
    ejemplo: {
      es: "En un año tus meses positivos suman +18 % y los negativos −8 %. El gain-to-pain es la suma neta entre el dolor: (18 − 8) / 8 = 1,25.",
      en: "Over a year your positive months add up to +18% and your negative months to −8%. The gain-to-pain is the net sum over the pain: (18 − 8) / 8 = 1.25.",
    },
    importa: {
      es: "Mide cuánto rendimiento neto obtienes por cada punto de pérdida mensual sufrida. Por encima de 1 se considera bueno, y es fácil de calcular con tus propios meses.",
      en: "It measures how much net return you get for every point of monthly loss endured. Above 1 is considered good, and it is easy to work out from your own months.",
    },
  },
  "Wald-Wolfowitz runs test": {
    ejemplo: {
      es: "Tus últimas 40 operaciones vienen en rachas: ganas seis seguidas, pierdes cinco, ganas siete. El test cuenta esas rachas y dice si son más largas de lo que daría el azar.",
      en: "Your last 40 trades come in streaks: six wins, five losses, seven wins. The test counts those runs and tells you whether they are longer than chance would produce.",
    },
    importa: {
      es: "Si tus resultados dependen de los anteriores, por ejemplo porque operas peor tras perder, aparecerá aquí. Es la forma de comprobar con números si la racha es tuya o del mercado.",
      en: "If your results depend on the previous ones, say because you trade worse after a loss, it shows up here. It is how you check with numbers whether a streak is yours or the market’s.",
    },
  },
  "Wilson score interval": {
    ejemplo: {
      es: "Ganas 11 de 20 operaciones: un 55 %. El intervalo de Wilson al 95 % va aproximadamente del 34 % al 74 %: con tan pocas operaciones, tu acierto real podría estar en cualquier punto de ese tramo.",
      en: "You win 11 of 20 trades: 55%. The 95% Wilson interval runs from roughly 34% to 74%: with so few trades, your true win rate could be anywhere in that range.",
    },
    importa: {
      es: "Te dice cuántas operaciones necesitas antes de fiarte de tu tasa de acierto. Funciona mejor que la aproximación habitual cuando hay pocas operaciones o el acierto está cerca de los extremos.",
      en: "It tells you how many trades you need before trusting your win rate. It works better than the usual approximation when there are few trades or the win rate is near the extremes.",
    },
  },
};
