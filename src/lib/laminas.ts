import type { LaminaProducto } from "@/components/tj/ProductPlate";

/**
 * Láminas del producto: qué captura se enseña, con qué número, qué dice su
 * pie y qué detalle se enseña cuando la pantalla es estrecha.
 *
 * Cada pie y cada `alt` describe solo lo que se ve en el `.png` original, no
 * lo que sugiere el nombre del fichero: un pie que no casa con la captura
 * es peor que no tenerlo. Hay que revisarlos al regenerar las capturas.
 * Los pies no repiten cifras: la app de las capturas usa su propio juego de
 * datos de muestra y el motor de la web otro, y dos cifras darían dos verdades.
 */
export const LAMINAS_PRODUCTO: Record<string, LaminaProducto> = {
  resumen: {
    archivo: "app-resumen.webp",
    ancho: 1576,
    alto: 836,
    anchoMovil: 706,
    altoMovil: 432,
    roman: "I",
    pestanaEs: "Resumen",
    pestanaEn: "Overview",
    tituloEs: "La curva y el mes, uno al lado del otro",
    tituloEn: "The curve and the month, side by side",
    tituloPt: "A curva e o mês, lado a lado",
    tituloFr: "La courbe et le mois, côte à côte",
    tituloDe: "Die Kurve und der Monat, Seite an Seite",
    tituloIt: "La curva e il mese, uno accanto all'altro",
    notaEs:
      "Debajo del formulario de registro, la pantalla de resumen abre en dos: la curva de " +
      "rendimiento con las zonas de caída sombreadas y el balance en trazo discontinuo, y el " +
      "calendario del mes con el resultado de cada día y el total de cada semana. Encima, " +
      "el parte de hoy —\u2060lo que tu histórico dice del día antes de operar\u2060—, los avisos " +
      "de conducta y una pregunta sobre cómo te has sentido operando hoy, que se apunta en " +
      "las operaciones del día.",
    notaEn:
      "Below the logging form, the overview screen splits in two: the performance curve with " +
      "its drawdown areas shaded and the balance as a dashed line, and the month calendar " +
      "with each day’s result and each week’s total. Above them, today’s briefing (what " +
      "your history says about the day before you trade), the behaviour notices and a " +
      "question about how trading felt today, which is recorded against the day’s trades.",
    notaPt:
      "Abaixo do formulário de registro, a tela de visão geral se divide em duas: a curva de " +
      "desempenho com as áreas de drawdown sombreadas e o saldo em linha pontilhada, e o " +
      "calendário do mês com o resultado de cada dia e o total de cada semana. Acima, o " +
      "briefing de hoje — o que seu histórico diz antes de operar —, os avisos de comportamento " +
      "e uma pergunta sobre como você se sentiu operando hoje, registrada nas operações do dia.",
    notaFr:
      "Sous le formulaire de saisie, l’écran de vue d’ensemble se divise en deux : la courbe de " +
      "performance avec ses zones de drawdown grisées et le solde en pointillés, et le " +
      "calendrier du mois avec le résultat de chaque jour et le total de chaque semaine. Au-dessus, " +
      "le briefing du jour — ce que votre historique dit de la séance avant de trader —, les " +
      "alertes de comportement et une question sur votre ressenti de trading aujourd’hui, " +
      "enregistrée avec les opérations du jour.",
    notaDe:
      "Unter dem Erfassungsformular teilt sich die Übersicht in zwei Bereiche: die Performancekurve " +
      "mit schattierten Drawdown-Zonen und gepunkteter Kontostandslinie sowie der Monatskalender " +
      "mit dem Tagesergebnis und dem Wochentotal. Darüber das heutige Briefing — was Ihre Historie " +
      "vor dem Handeln über den Tag sagt —, Verhaltenshinweise und eine Frage zum heutigen Befinden, " +
      "die bei den Tages-Trades erfasst wird.",
    notaIt:
      "Sotto il modulo di registrazione, la schermata di riepilogo si divide in due: la curva di " +
      "rendimento con le aree di drawdown ombreggiate e il saldo a linea tratteggiata, e il " +
      "calendario del mese con il risultato di ciascun giorno e il totale settimanale. Sopra, il " +
      "briefing di oggi — ciò che lo storico dice della giornata prima di operare —, gli avvisi " +
      "di condotta e una domanda su come ti sei sentito operando oggi, registrata nei trade del giorno.",
    altEs:
      "Pantalla de resumen: arriba, el final del parte de hoy, con lo que el histórico dice " +
      "del día y una pregunta para puntuar de «muy mal» a «muy bien» cómo te has sentido " +
      "operando hoy, junto a los avisos de conducta; debajo, la curva de rendimiento con las " +
      "casillas de rendimiento y balance, y un calendario mensual con la ganancia o pérdida " +
      "de cada día, el acumulado semanal en el margen y el mejor y el peor día al pie.",
    altEn:
      "Overview screen: at the top, the end of today’s briefing, with what the history says " +
      "about the day and a question to rate from “very bad” to “very good” how trading felt " +
      "today, beside the behaviour notices; below, the performance curve with its performance " +
      "and balance checkboxes, and a monthly calendar with each day’s profit or loss, the " +
      "weekly total in the margin and the best and worst day at the foot.",
    altPt:
      "Tela de visão geral: no topo, o resumo de hoje com o que o histórico indica sobre o " +
      "dia e uma pergunta para classificar de «muito mal» a «muito bem» como foi operar hoje, " +
      "ao lado dos avisos de comportamento; abaixo, a curva de desempenho com as caixas de " +
      "desempenho e saldo, e um calendário mensal com o lucro ou prejuízo de cada dia, o " +
      "acumulado semanal na margem e o melhor e pior dia no rodapé.",
    altFr:
      "Écran de vue d’ensemble : en haut, la fin du briefing du jour avec les indications de " +
      "l’historique et une question pour évaluer de « très mal » à « très bien » le ressenti de " +
      "la séance, aux côtés des alertes de comportement ; en bas, la courbe de performance avec " +
      "les cases de performance et de solde, et un calendrier mensuel avec les gains ou pertes " +
      "de chaque jour, le total hebdomadaire dans la marge et le meilleur et pire jour au bas.",
    altDe:
      "Übersichtsbildschirm: oben das Tages-Briefing mit Hinweisen aus der Historie und einer " +
      "Bewertungsskala von «sehr schlecht» bis «sehr gut» zum Befinden beim Trading neben den " +
      "Verhaltenshinweisen; darunter die Performancekurve mit Kontrollkästchen für Performance " +
      "und Kontostand sowie ein Monatskalender mit Gewinn oder Verlust jedes Tages, Wochensummen " +
      "am Rand und bestem sowie schlechtestem Tag am Fuß.",
    altIt:
      "Schermata di riepilogo: in alto, la fine del briefing odierno con ciò che lo storico dice " +
      "della giornata e una domanda per valutare da «molto male» a «molto bene» come ti sei " +
      "sentito operando oggi, accanto agli avvisi di condotta; sotto, la curva di rendimento con " +
      "le caselle di prestazione e saldo, e un calendario mensile con profitti o perdite " +
      "giornalieri, il totale settimanale a margine e il giorno migliore e peggiore a piè di pagina.",
    detalleEs: "el calendario del mes",
    detalleEn: "the month calendar",
    detallePt: "o calendário do mês",
    detalleFr: "le calendrier du mois",
    detalleDe: "der Monatskalender",
    detalleIt: "il calendario del mese",
  },

  registro: {
    archivo: "app-registro.webp",
    ancho: 1576,
    alto: 836,
    anchoMovil: 720,
    altoMovil: 255,
    roman: "II",
    pestanaEs: "Registro",
    pestanaEn: "Logging",
    tituloEs: "Anotar la operación es lo primero que se ve",
    tituloEn: "Logging the trade is the first thing you see",
    tituloPt: "Registrar a operação é a primeira coisa que você vê",
    tituloFr: "Saisir l’opération est la première chose visible",
    tituloDe: "Den Trade erfassen ist das Erste, was Sie sehen",
    tituloIt: "Registrare l'operazione è la prima cosa che vedi",
    notaEs:
      "El compositor ocupa la pantalla entera a propósito: instrumento, dirección, entrada, " +
      "stop, objetivo y salida, junto a una zona grande donde se arrastran o se pegan las " +
      "capturas del gráfico. Mientras escribes, el riesgo se recalcula en dinero y en " +
      "porcentaje de la cuenta sobre una regla del stop a 1 R, y una nota sitúa tu tamaño " +
      "frente al medio Kelly. Todo lo demás —\u2060el resto de esta pantalla y las otras diez\u2060— mide " +
      "lo que se rellena aquí.",
    notaEn:
      "The composer takes the whole screen on purpose: instrument, direction, entry, stop, " +
      "target and exit, beside a large area where chart screenshots are dropped or pasted. As " +
      "you type, the risk recalculates in money and as a share of the account on a ruler " +
      "running from stop to 1 R, and a note places your size against half-Kelly. Everything " +
      "else —\u2060the rest of this screen and the other ten\u2060— measures what gets filled in here.",
    notaPt:
      "O formulário ocupa a tela inteira de propósito: ativo, direção, entrada, stop, alvo e " +
      "saída, ao lado de uma área ampla onde você arrasta ou cola capturas do gráfico. Enquanto " +
      "você digita, o risco é recalculado em dinheiro e em porcentagem da conta em uma régua de " +
      "stop a 1 R, e uma nota compara seu lote com o meio-Kelly. Todo o resto — o restante desta " +
      "tela e as outras dez — mede o que é preenchido aqui.",
    notaFr:
      "Le formulaire occupe tout l’écran à dessein : instrument, sens, entrée, stop, objectif " +
      "et sortie, à côté d’un espace généreux pour glisser ou coller les captures de graphiques. " +
      "À mesure que vous écrivez, le risque est recalculé en devise et en pourcentage du compte " +
      "sur une règle allant du stop à 1 R, et une note compare votre taille au demi-Kelly. Tout le " +
      "reste — le reste de cet écran et les dix autres — mesure ce qui est saisi ici.",
    notaDe:
      "Die Erfassungsmaske nimmt bewusst den gesamten Bildschirm ein: Instrument, Richtung, " +
      "Einstieg, Stop, Ziel und Ausstieg neben einem großen Bereich zum Ablegen oder Einfügen " +
      "von Chart-Screenshots. Während Sie tippen, berechnet sich das Risiko in Geld und als " +
      "Kontoprozentsatz auf einer Leiste von Stop bis 1 R neu, und ein Hinweis vergleicht Ihre " +
      "Positionsgröße mit Halb-Kelly. Alles andere misst genau das, was hier erfasst wird.",
    notaIt:
      "Il modulo occupa l'intero schermo di proposito: strumento, direzione, ingresso, stop, " +
      "target e uscita, accanto a un'ampia area in cui trascinare o incollare le catture del " +
      "grafico. Mentre scrivi, il rischio viene ricalcolato in denaro e in percentuale del conto " +
      "su un righello dallo stop a 1 R, e una nota posiziona la tua taglia rispetto al mezzo Kelly. " +
      "Tutto il resto — il resto di questa schermata e le altre dieci — misura ciò che viene inserito qui.",
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
    altPt:
      "Formulário de registro sob a pergunta «O que você operou hoje?»: à esquerda, área para " +
      "arrastar ou colar capturas do gráfico; à direita, o ativo, seletor de Long ou Short, " +
      "entrada, stop, alvo opcional e saída aberta, o risco em dólares e em porcentagem da conta " +
      "em uma régua de stop, entrada e 1 R, nota comparando a posição com o meio-Kelly, tamanho " +
      "e botões para adicionar detalhes, calcular lote, salvar rascunho, «Vi e não entrei» e " +
      "registrar a operação. Abaixo, linha com as métricas da conta.",
    altFr:
      "Formulaire de saisie sous la question « Qu’avez-vous tradé aujourd’hui ? » : à gauche, " +
      "zone pour glisser ou coller des graphiques ; à droite, instrument, sélecteur Long ou " +
      "Short, entrée, stop, objectif facultatif et sortie ouverte, le risque en dollars et en " +
      "pourcentage du compte sur une règle stop–entrée–1 R, note comparant la position au demi-Kelly, " +
      "quantité et boutons pour ajouter des détails, calculer la taille, sauvegarder un brouillon, " +
      "« Vu sans entrer » et enregistrer le trade. En bas, une ligne avec les métriques du compte.",
    altDe:
      "Erfassungsformular unter der Frage «Was haben Sie heute gehandelt?»: links ein Bereich " +
      "zum Ablegen oder Einfügen von Chart-Screenshots; rechts Instrument, Long/Short-Wahl, " +
      "Einstieg, Stop, optionales Kursziel und offener Ausstieg, Risiko in Dollar und Prozent auf " +
      "einer Stop-Einstieg-1 R-Leiste, Hinweis zum Vergleich mit Halb-Kelly, Stückzahl sowie " +
      "Schaltflächen für Details, Positionsgrößenrechner, Entwurf speichern, «Gesehen, nicht eingestiegen» " +
      "und Trade speichern. Darunter Kennzahlen des Kontos.",
    altIt:
      "Modulo di registrazione sotto la domanda «Cosa hai operato oggi?»: a sinistra, area per " +
      "trascinare o incollare schermate del grafico; a destra, strumento, selettore Long o Short, " +
      "ingresso, stop, target facoltativo e uscita aperta, rischio in dollari e in percentuale " +
      "del conto su un righello stop–ingresso–1 R, nota che confronta la taglia con il mezzo Kelly, " +
      "quantità e pulsanti per aggiungere dettagli, calcolare la taglia, salvare bozza, «Visto e non entrato» " +
      "e registrare l'operazione. Sotto, riga con le metriche del conto.",
    detalleEs: "los campos de la operación",
    detalleEn: "the trade fields",
    detallePt: "os campos da operação",
    detalleFr: "les champs de l’opération",
    detalleDe: "die Trade-Felder",
    detalleIt: "i campi dell'operazione",
  },

  guardian: {
    archivo: "app-guardian.webp",
    ancho: 1576,
    alto: 836,
    anchoMovil: 720,
    altoMovil: 232,
    roman: "III",
    pestanaEs: "Guardián",
    pestanaEn: "Guardian",
    tituloEs: "Cuando el tamaño no es el tuyo, lo dice antes",
    tituloEn: "When the size isn’t yours, it says so first",
    notaEs:
      "La misma operación con más cantidad y el stop más lejos: el riesgo se dispara y " +
      "aparecen tres avisos. El primero recuerda que vienes de una racha de pérdidas y que " +
      "este riesgo multiplica el de tus últimas operaciones; el segundo lo compara con lo " +
      "que arriesgas de costumbre sobre doscientas operaciones; el tercero sitúa el tamaño " +
      "frente al Kelly completo y recuerda que, por encima de él, más riesgo da menos " +
      "crecimiento esperado. " +
      "No bloquea el botón: te obliga a pulsarlo habiéndolo leído.",
    notaEn:
      "The same trade with more size and a wider stop: risk shoots up and three notices " +
      "appear. The first points out that you’re coming off a losing streak and that this " +
      "risk is a multiple of your recent trades’; the second compares it with what you " +
      "usually risk across two hundred trades; the third places the size against full Kelly " +
      "and points out that beyond it, more risk means less expected growth. It doesn’t " +
      "disable the button: it makes you press it having read them.",
    altEs:
      "El mismo formulario con más cantidad y el stop más lejos: el riesgo en dólares y en " +
      "porcentaje de la cuenta crece y, debajo, se apilan tres avisos con un triángulo " +
      "—\u2060«Aviso de tilt», por la racha de pérdidas; «Esto no es como tú operas», que compara " +
      "el riesgo con el habitual, y «Tu tamaño frente a Kelly»\u2060— antes de la cantidad y de " +
      "los botones de guardar borrador y registrar la operación.",
    altEn:
      "The same form with more size and a wider stop: the risk in dollars and as a share of " +
      "the account grows and three notices with a warning triangle stack below —“Tilt " +
      "warning”, for the losing streak; “This isn’t how you usually trade”, which compares " +
      "the risk with the usual one, and “Your size against Kelly”— before the quantity and " +
      "the save-draft and log-trade buttons.",
    detalleEs: "el riesgo y sus tres avisos",
    detalleEn: "the risk and its three notices",
  },

  operaciones: {
    archivo: "app-operaciones.webp",
    ancho: 1576,
    alto: 836,
    anchoMovil: 830,
    altoMovil: 345,
    roman: "IV",
    pestanaEs: "Operaciones",
    pestanaEn: "Trades",
    tituloEs: "El registro entero, y las métricas de lo que filtras",
    tituloEn: "The whole log, and the metrics of whatever you filter",
    tituloPt: "O histórico completo e as métricas do que você filtra",
    tituloFr: "Le journal complet et les métriques de votre sélection",
    tituloDe: "Das gesamte Journal und die Kennzahlen Ihrer Filter",
    tituloIt: "L'intero registro e le metriche di ciò che filtri",
    notaEs:
      "Filtros por instrumento, dirección, resultado, cumplimiento, setup, conducta, " +
      "comisión y sesión. Lo que importa no es la tabla: es la fila de encima, rotulada " +
      "«lo que hay en pantalla», que se recalcula sobre lo que queda tras filtrar. Preguntar " +
      "«¿y si quito los días que no cumplí mi plan?» deja de ser una hipótesis y pasa a ser " +
      "dos clics.",
    notaEn:
      "Filters by instrument, direction, outcome, rule compliance, setup, behaviour, fees " +
      "and session. The table isn’t the point: the row above it is —\u2060labelled “what’s on " +
      "screen”\u2060— and it recalculates over whatever survives the filter. Asking “what if I drop " +
      "the days I broke my plan?” stops being a hypothesis and becomes two clicks.",
    notaPt:
      "Filtros por ativo, direção, resultado, cumprimento do plano, setup, comportamento, " +
      "comissões e sessão. O importante não é a tabela: é a linha acima dela, rotulada como " +
      "«o que está na tela», recalculada sobre o que sobra após a filtragem. Perguntar «e se eu " +
      "remover os dias em que quebrei meu plano?» deixa de ser uma hipótese e passa a ser dois cliques.",
    notaFr:
      "Filtres par instrument, sens, résultat, respect du plan, setup, comportement, frais " +
      "et session. L’essentiel n’est pas le tableau : c’est la ligne au-dessus, intitulée " +
      "« ce qui est à l’écran », recalculée sur les opérations filtrées. Se demander « et si " +
      "j’enlevais les jours où j’ai enfreint mon plan ? » cesse d’être une hypothèse pour devenir deux clics.",
    notaDe:
      "Filter nach Instrument, Richtung, Ergebnis, Einhaltung der Regeln, Setup, Verhalten, " +
      "Gebühren und Handelssitzung. Entscheidend ist nicht die Tabelle: es ist die Zeile darüber " +
      "mit der Aufschrift «was auf dem Bildschirm zu sehen ist», die sich über die gefilterte " +
      "Auswahl neu berechnet. Die Frage «Was wäre, wenn ich die Tage ohne Planeinhaltung streiche?» " +
      "ist keine Spekulation mehr, sondern zwei Klicks.",
    notaIt:
      "Filtri per strumento, direzione, esito, rispetto del piano, setup, condotta, " +
      "commissioni e sessione. Ciò che conta non è la tabella: è la riga soprastante, " +
      "etichettata «ciò che c'è a schermo», che si ricalcola su quanto rimane dopo il filtro. " +
      "Chiedersi «e se togliessi i giorni in cui ho violato il mio piano?» smette di essere un'ipotesi e diventa questione di due clic.",
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
    altPt:
      "Tela de operações com duzentos registros: oito filtros, busca, linha com P&L total, " +
      "win rate e expectativa em R calculados sobre o conjunto filtrado, e tabela sem linhas " +
      "verticais com seleção, direção, ativo, setup, sessão, percurso da entrada à saída, " +
      "duração, data de fechamento, P&L líquido, múltiplo de R e indicação de cumprimento do plano.",
    altFr:
      "Écran des opérations avec deux cents enregistrements : huit filtres, barre de recherche, " +
      "ligne affichant le P&L total, le win rate et l’espérance en R calculés sur la sélection, " +
      "et tableau épuré listant sélection, sens, instrument, setup, session, parcours entrée-sortie, " +
      "durée, date de clôture, P&L net, multiple de R et respect du plan.",
    altDe:
      "Trades-Ansicht mit zweihundert Einträgen: acht Filter, Suchfeld, Zeile mit Gesamt-P&L, " +
      "Win Rate und Expectancy in R auf Basis der gefilterten Daten sowie eine übersichtliche " +
      "Tabelle mit Auswahlkästchen, Richtung, Instrument, Setup, Sitzung, Kursverlauf vom Einstieg " +
      "zum Ausstieg, Haltedauer, Schlusstag, Netto-P&L, R-Multiple und Regeltreue.",
    altIt:
      "Schermata delle operazioni con duecento registrazioni: otto filtri, casella di ricerca, " +
      "riga con P&L totale, win rate ed expectancy in R calcolati sui dati filtrati, e una tabella " +
      "senza linee verticali con casella di selezione, direzione, strumento, setup, sessione, percorso " +
      "da ingresso a uscita, durata, data di chiusura, P&L netto, multiplo di R e conformità al piano.",
    detalleEs: "la cabecera del registro",
    detalleEn: "the top of the log",
    detallePt: "o cabeçalho do registro",
    detalleFr: "l’en-tête du journal",
    detalleDe: "der Kopfbereich des Journals",
    detalleIt: "l'intestazione del registro",
  },

  analitica: {
    archivo: "app-analitica.webp",
    ancho: 1576,
    alto: 836,
    anchoMovil: 706,
    altoMovil: 268,
    roman: "V",
    pestanaEs: "Analítica",
    pestanaEn: "Analytics",
    tituloEs: "Donde se comprueba si la ventaja existe",
    tituloEn: "Where you check whether the edge is real",
    tituloPt: "Onde se comprova se a vantagem estatística existe",
    tituloFr: "Là où l’on vérifie si l’avantage statistique existe",
    tituloDe: "Wo überprüft wird, ob der statistische Vorteil real ist",
    tituloIt: "Dove si verifica se il vantaggio statistico esiste",
    notaEs:
      "Una tabla compara el mes, el trimestre, el año y todo el histórico con el mismo " +
      "criterio, y ninguna fila aparece sin el número de operaciones sobre el que se calcula. " +
      "Abajo, el veredicto: si la expectancy se distingue de cero, con su valor p. Y lo dice " +
      "explícitamente: no garantiza el futuro, dice que lo conseguido hasta aquí no parece " +
      "azar.",
    notaEn:
      "A table compares the month, the quarter, the year and the full history by the same " +
      "criteria, and no row appears without the number of trades it is computed on. Below, " +
      "the verdict: whether expectancy is distinguishable from zero, with its p-value. And it " +
      "says so explicitly — it doesn’t guarantee the future, it says what you’ve got so far " +
      "doesn’t look like chance.",
    notaPt:
      "Uma tabela compara o mês, o trimestre, o ano e todo o histórico sob os mesmos critérios, " +
      "e nenhuma linha surge sem o número de operações em que se baseia. Abaixo, o veredito: se a " +
      "expectativa se distingue de zero, com seu valor-p. E afirma isso expressamente: não garante " +
      "o futuro, apenas atesta que os resultados até aqui não parecem obra do acaso.",
    notaFr:
      "Un tableau compare le mois, le trimestre, l’année et tout l’historique selon les mêmes " +
      "critères, sans jamais omettre le nombre de trades sur lequel repose chaque ligne. En bas, " +
      "le verdict : si l’espérance se distingue de zéro, avec sa p-valeur. Et il le précise nettement : " +
      "il ne garantit pas l’avenir, il indique que ce qui a été réalisé jusqu’ici ne relève pas du hasard.",
    notaDe:
      "Eine Tabelle vergleicht Monat, Quartal, Jahr und die gesamte Historie nach denselben Maßstäben, " +
      "und keine Zeile erscheint ohne die zugrundeliegende Anzahl an Trades. Unten das Urteil: ob sich " +
      "die Expectancy mit ihrem p-Wert signifikant von null unterscheidet. Und das Programm sagt es " +
      "ausdrücklich: Es garantiert nicht die Zukunft, sondern belegt, dass die bisherigen Ergebnisse " +
      "nicht nach Zufall aussehen.",
    notaIt:
      "Una tabella confronta mese, trimestre, anno e l'intero storico con gli stessi criteri, " +
      "e nessuna riga compare senza il numero di operazioni su cui viene calcolata. In basso, il " +
      "verdetto: se l'expectancy si distingue da zero, con il relativo valore p. E lo dichiara " +
      "esplicitamente: non garantisce il futuro, dimostra che quanto ottenuto finora non sembra dovuto al caso.",
    altEs:
      "Pantalla de analítica: el neto de todo el histórico en grande y una tabla por periodo " +
      "con operaciones, neto, win rate, profit factor y peor caída; el resumen del periodo " +
      "filtrado; un bloque de riesgo y calidad con la mayor caída, Sharpe, Sortino, Calmar, " +
      "SQN y otros ratios; y el veredicto «Ventaja confirmada» con su valor p y el intervalo " +
      "de confianza de cada cifra.",
    altEn:
      "Analytics screen: the all-time net in large type and a per-period table with trades, " +
      "net, win rate, profit factor and worst drawdown; the filtered-period summary; a " +
      "risk-and-quality block with the largest drawdown, Sharpe, Sortino, Calmar, SQN and " +
      "other ratios; and the “confirmed edge” verdict with its p-value and the confidence " +
      "interval of each figure.",
    altPt:
      "Tela de análise: o resultado líquido histórico em destaque e tabela por período com " +
      "operações, líquido, win rate, profit factor e pior drawdown; resumo do período filtrado; " +
      "bloco de risco e qualidade com drawdown máximo, Sharpe, Sortino, Calmar, SQN e outros índices; " +
      "e o veredito «Vantagem confirmada» com valor-p e intervalo de confiança de cada métrica.",
    altFr:
      "Écran d’analyse : le net historique global en grand et un tableau par période avec opérations, " +
      "net, win rate, profit factor et pire drawdown ; résumé de la période filtrée ; bloc de risque " +
      "et qualité avec drawdown maximal, Sharpe, Sortino, Calmar, SQN et autres ratios ; et le " +
      "verdict « Avantage confirmé » avec sa p-valeur et l’intervalle de confiance de chaque chiffre.",
    altDe:
      "Analysebildschirm: historischer Gesamtertrag in großer Schrift und Periodentabelle mit " +
      "Trades, Nettoertrag, Win Rate, Profit Factor und maximalem Drawdown; Zusammenfassung der " +
      "gefilterten Spanne; Risiko- und Qualitätsblock mit größtem Drawdown, Sharpe, Sortino, Calmar, " +
      "SQN und weiteren Kennzahlen; sowie das Urteil «Bestätigter Edge» mit p-Wert und Konfidenzintervall jeder Zahl.",
    altIt:
      "Schermata analitica: il netto complessivo in grande e tabella periodica con operazioni, " +
      "netto, win rate, profit factor e peggior drawdown; riepilogo del periodo filtrato; riquadro " +
      "rischio e qualità con drawdown massimo, Sharpe, Sortino, Calmar, SQN e altri indici; e il " +
      "verdetto «Vantaggio confermato» con valore p e intervallo di confidenza di ciascuna cifra.",
    detalleEs: "el veredicto y su valor p",
    detalleEn: "the verdict and its p-value",
    detallePt: "o veredito e seu valor-p",
    detalleFr: "le verdict et sa p-valeur",
    detalleDe: "das Urteil und sein p-Wert",
    detalleIt: "il verdetto e il suo valore p",
  },

  diario: {
    archivo: "app-diario.webp",
    ancho: 1576,
    alto: 836,
    anchoMovil: 880,
    altoMovil: 372,
    roman: "VI",
    pestanaEs: "Diario",
    pestanaEn: "Journal",
    tituloEs: "Veinte segundos antes de operar",
    tituloEn: "Twenty seconds before trading",
    notaEs:
      "Horas de sueño, estado mental, estado físico y si hoy traes plan. Se guarda solo, sin " +
      "botón. Y donde otro programa pondría una conclusión, este escribe que aún no hay " +
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
    anchoMovil: 483,
    altoMovil: 398,
    roman: "VII",
    pestanaEs: "Playbook",
    pestanaEn: "Playbook",
    tituloEs: "Cada setup, juzgado por separado",
    tituloEn: "Each setup, judged on its own",
    notaEs:
      "Cinco estrategias con su curva, su muestra, su expectancy, su win rate, su porcentaje " +
      "de cumplimiento y el reparto de R con la mediana y el 50\u00a0% central. En esta muestra " +
      "una sale con «ventaja confirmada» y cuatro «no concluyente», aunque las cuatro ganan " +
      "dinero: el sello no premia el resultado, mide si la muestra basta para afirmar algo. " +
      "Un playbook donde todo funciona el primer mes no está midiendo, está halagando.",
    notaEn:
      "Five strategies with their curve, sample, expectancy, win rate, compliance rate and R " +
      "spread with its median and central 50%. In this sample one comes out “edge " +
      "confirmed” and four “inconclusive”, even though all four make money: the " +
      "stamp doesn’t reward the result, it measures whether the sample is enough to claim " +
      "anything. A playbook where everything works in the first month isn’t measuring, it’s " +
      "flattering.",
    altEs:
      "Pantalla de playbook con cinco fichas —\u2060ruptura, pullback, reversión, rango y " +
      "tendencia\u2060—, cada una con su curva en miniatura, P&L total, tamaño de muestra, " +
      "expectancy, win rate, un sello de «ventaja confirmada» o «no concluyente», la mejor " +
      "sesión, el cumplimiento, el reparto de R con su mediana y una barra de ganadoras " +
      "frente a perdedoras.",
    altEn:
      "Playbook screen with five cards —\u2060breakout, pullback, reversal, range and trend\u2060—, each " +
      "with a miniature curve, total P&L, sample size, expectancy, win rate, an “edge " +
      "confirmed” or “inconclusive” stamp, best session, compliance, the R spread with its " +
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
