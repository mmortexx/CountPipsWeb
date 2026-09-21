# Informe visual — Grupo 2: mercados, brókers institucionales y plataformas de datos

Contexto de referencia para todos los hallazgos: CountPips (web de marketing estática, bilingüe,
sobria, serif grande + sans, casi sin color, cantos 8–12 px, paneles con cifras reales, capturas
reales de la app). Ver `countpips/` como referencia propia (no cuenta como una de las 10).

Sustituciones respecto al encargo original:
- **CME Group** (cmegroup.com) → **bloqueada**: `net::ERR_HTTP2_PROTOCOL_ERROR` en dos intentos
  independientes (protección anti-bot a nivel de protocolo). Sustituida por **Cboe** (cboe.com).
- **Nasdaq** (nasdaq.com) → **bloqueada**: mismo error, confirmado en dos intentos. Sustituida por
  **Morningstar** (morningstar.com).
- **Bloomberg Professional** (bloomberg.com/professional/) → **bloqueada**: HTTP 403, página
  "Bloomberg - Are you a robot?" con captcha de bloqueo. Primer sustituto probado, **FactSet**,
  quedó descartado también (ver «Dudas»). Sustituida finalmente por **Deribit**.

Las 10 webs realmente analizadas: Cboe, Morningstar, Interactive Brokers, TradingView, Deribit,
LSEG, Koyfin, ICE, Saxo, QuantConnect.

---

## 1. Cboe Global Markets (sustituye a CME Group)

**Primer pliegue.** Titular «Meet S&P 500® Predictions» sobre fondo blanco, con una franja superior
de índices en vivo (VIX, SPX) y un carrusel de tarjetas. Dos CTA con jerarquía por color: «Create
Free Account» (verde neón) y «Cboe Predicts» (cian), ambas con forma de píldora. Enseña dato de
mercado antes que producto. Evidencia: `g2-cboe/escritorio-claro__00.png`.

**Tipografía.** H1 en Hanken Grotesk, 109 px/400, sin tracking especial — un display grotesk muy
grande, no serif. Cuerpo con Inter en tamaños pequeños (12 px/700 en las tarjetas del carrusel).
Contraste de peso más que de familia (todo sans). Dato: `g2-cboe/datos.json`.

**Color y superficies.** Fondo blanco puro, pero con acentos muy vivos para ser una bolsa
"institucional": verde neón `rgb(42,216,112)` y cian `rgb(31,238,255)` en botones de forma de
píldora (`border-radius` casi infinito). Separan secciones con bandas de gris muy claro y tarjetas
con sombra suave. Evidencia: `g2-cboe/escritorio-claro__01.png` (tablas de mercado).

**Modo oscuro.** No lo respeta: `fondoBody` es transparente en ambas pasadas y las capturas
`escritorio-claro__00-02` y `escritorio-oscuro__00-01` son visualmente idénticas.

**Ritmo y densidad.** Alto: 4327 px escritorio / 6772 px móvil. Tras el hero llega un bloque muy
denso de tablas numéricas («Market Snapshot»: US Equities, Options, Futures, FX, Canadian/European
Equities) — mucho dato tabular, poco aire. Evidencia: `g2-cboe/escritorio-claro__01.png`.

**Cifras y datos de mercado.** Tablas con cifras alineadas, deltas en color, cabeceras en mayúsculas
pequeñas. Todo en fuente sans, sin tabulares monoespaciadas explícitas.

**Confianza y cumplimiento.** El aviso de cookies es enorme y ocupa media página al final (varios
H2/H3 dedicados a categorías de cookies) — mucho peso dado a compliance de privacidad, poco al
riesgo de trading.

**Navegación y pie.** Nav simple: Markets, Data, Solutions, Insights & Education, About Us, Sign In.

**Móvil.** Mantiene el mismo bloque de índices apilado en tarjetas; el CTA principal pasa a ancho
completo. Evidencia: `g2-cboe/movil-claro__00.png`.

**Detalles finos.** El carrusel de índices con flechas prev/next en gris/verde; iconografía SVG
abundante (120 svgs).

**Para CountPips (adaptar el principio, no el diseño):**
1. Mostrar un dato de mercado o de la app en vivo en el primer pliegue antes que el titular
   (CountPips ya lo hace con el panel de métricas de muestra: reforzar esa idea, no la estética neón).
2. Usar como máximo dos colores de acento con jerarquía clara entre CTA primario/secundario.
3. Separar contenido denso en tablas con cabeceras en mayúscula pequeña y deltas en color, útil para
   la futura sección de métricas.
**No imitar:** el acento en verde/cian neón — rompe con el tono «casi sin color» de CountPips y con
la sobriedad institucional que se busca.

---

## 2. Morningstar (sustituye a Nasdaq)

**Primer pliegue.** No hay "hero" de marketing clásico: la portada empieza directamente con una
barra de índices en vivo (DJIA, S&P 500, NASDAQ, índices propios) en tarjetas blancas con borde de
1 px, seguida de "Market Movers" y titulares editoriales. Es una portada de datos, no un landing de
venta. Evidencia: `g2-morningstar/escritorio-claro__00.png`.

**Tipografía.** H1 (el propio logo "morningstar.com") en fuente propia MorningstarIntrinsic,
32 px/700; cuerpo 16 px/300 — peso muy ligero para párrafos, contraste marcado con los titulares en
negrita. Dato: `g2-morningstar/datos.json`.

**Color y superficies.** Fondo blanco, franja de navegación superior en gris `rgb(236,235,234)`,
tarjetas de índice con fondo blanco y borde sutil. Sin acentos de color fuera de verde/rojo para
deltas.

**Modo oscuro.** No lo respeta (`fondoBody` transparente igual en ambas pasadas; capturas
`escritorio-claro__00-01` y `escritorio-oscuro__00-01` idénticas).

**Ritmo y densidad.** Extremadamente denso: 34 `<section>`, alto de 6100 px en escritorio y 18167 px
(recortado a 14000 en la captura) en móvil. Todo el ancho se usa en columnas de 3-4 tarjetas de
noticias por sección (Funds / Stocks / Bonds). Evidencia: `g2-morningstar/escritorio-claro__01.png`
y `__02.png`.

**Cifras y datos de mercado.** Ticker con precio + variación absoluta + variación % en cada tarjeta,
color rojo/verde para el signo. En móvil las tarjetas se simplifican a solo el % (sin precio
absoluto) — un ajuste de densidad consciente. Evidencia: `g2-morningstar/movil-claro__00.png`.

**Confianza y cumplimiento.** No aparece verificación de riesgo en el primer pliegue (es un medio de
análisis, no un bróker), pero sí un widget de verificación humana embebido en línea a media página
(tipo checkbox anti-bot) sin bloquear el resto del contenido — detalle curioso, no un muro completo.

**Navegación y pie.** Mega-nav con Portfolio/Funds/ETFs/Stocks/Bonds/For Advisors repetido en dos
niveles (barra superior + subnav secundaria).

**Móvil.** Reordena todo a una columna; conserva las tarjetas de índice pero comprimidas.
Evidencia: `g2-morningstar/movil-claro__01.png`.

**Para CountPips:**
1. El patrón de "franja de estado" al principio (aquí índices, en CountPips podría ser el resumen
   Sharpe/drawdown/expectancy) validado como forma de abrir sin depender de una foto de héroe.
2. Tarjetas con borde de 1 px y fondo blanco liso para artículos/casos de uso, coherente con el
   lenguaje de cantos suaves de CountPips.
3. Simplificar cifras en móvil (menos columnas por tarjeta) en vez de encoger todo proporcionalmente.
**No imitar:** la densidad de 34 secciones sin respiro — para una web de producto (no un portal de
noticias) sería excesivo y diluiría el mensaje de CountPips.

---

## 3. Interactive Brokers

**Primer pliegue.** Titular oculto a nivel visual (el `<h1>` real está vacío/decorativo); lo primero
que se lee es una franja tipo "mercado de predicción" en rojo sobre negro/azul oscuro con una
pregunta política en vivo («Will the Republican Party win...», con % Sí/No). Debajo, titulares reales
tipo "Lower Costs. Better Returns." y comparativa de planes IBKR LITE/PRO. Dos CTA: "Log In" y "Open
Account" (rojo, `rgb(217,18,34)`), ambos con esquinas rectas (`border-radius: 0`).
Evidencia: `g2-ibkr/escritorio-claro__00.png`.

**Tipografía.** Familia Proxima Nova en toda la web; texto de la franja de predicción 14 px/600 en
blanco sobre banda oscura. Sin serif en ningún punto observado.

**Color y superficies.** Blanco de fondo, rojo corporativo como único acento, esquinas
completamente rectas (0 px) en botones — el look más "cuadrado" de todo el grupo, coherente con una
marca que se presenta como técnica/profesional más que cálida.

**Modo oscuro.** La página declara `color-scheme: light dark` en CSS pero en la práctica el fondo
sigue siendo blanco puro en ambas pasadas (`fondoBody` idéntico) — es una declaración de soporte que
no se traduce en un tema oscuro real en la home. Evidencia: `g2-ibkr/escritorio-oscuro__00.png`
idéntica a la de claro.

**Ritmo y densidad.** Alto 7663 px. Bloques de confianza muy numéricos: "5 Million clients", "$903
Billion", "50 Years" — grandes cifras sin caja, solo tipografía. Evidencia:
`g2-ibkr/escritorio-claro__03.png`.

**Confianza y cumplimiento.** Sección "Security You Can Trust" con cifras de escala (clientes,
volumen, años) en vez de sellos de regulador; también franja de premios de prensa especializada
("Best Online Broker", etc.) como grid de logos de medios. Evidencia:
`g2-ibkr/escritorio-claro__01.png`.

**Navegación y pie.** Nav mínima (Log In, Open Account, Why IBKR, Products) — no hay megamenú
visible en el primer pliegue.

**Móvil.** Franja de predicción y CTA se apilan verticalmente sin perder jerarquía.
Evidencia: `g2-ibkr/movil-claro__00.png`.

**Para CountPips:**
1. Confianza por cifra desnuda (sin logo, sin caja) — encaja con el estilo "casi sin color" de
   CountPips: un número grande y una etiqueta pequeña debajo.
2. Esquinas completamente rectas como opción de identidad "seria" si se quisiera diferenciar del
   8–12 px actual en alguna sección puntual (no todo el sitio).
3. Un único color de acento (rojo aquí) usado con extrema disciplina en todo el sitio.
**No imitar:** declarar soporte de modo oscuro en el CSS sin implementarlo realmente — genera una
falsa expectativa (el sistema operativo del visitante cambia de tema pero la web no responde).

---

## 4. TradingView

**Primer pliegue.** Titular "Where the world does markets" (56 px/600, EuclidCircularSemibold) sobre
un hero con imagen oscura de fondo (aunque el resto de la página es claro). Debajo del titular, banner
de cookies con dos botones ("Don't allow" / "Accept all"), y justo después arranca un resumen de
mercado con mini-gráficos. Evidencia: `g2-tradingview/escritorio-claro__00.png`.

**Tipografía.** H1 con fuente propia EuclidCircularSemibold; cuerpo con pila de sistema
(`-apple-system, BlinkMacSystemFont...`) a 20 px/400 — mezcla fuente de marca solo en titulares,
sistema en el resto.

**Color y superficies.** `colorScheme: light` forzado en el CSS pese a que el producto real de
TradingView tiene un tema oscuro muy reconocible; la web de marketing es blanca. Bandas de contenido
separadas por color de fondo (blanco / gris muy claro) sin bordes duros.

**Modo oscuro.** No lo respeta en absoluto: capturas `escritorio-claro` y `escritorio-oscuro` son
pixel a pixel iguales (confirmado, `g2-tradingview/escritorio-oscuro__00.png` idéntica a `__00` claro).

**Ritmo y densidad.** La página más "pesada" del grupo: 440 imágenes, 447 SVGs, altura real de
17209 px (recortada a 14000 en captura). Tras el hero se suceden secciones por clase de activo (US
stocks, Crypto, Futuros, Forex, Economía) cada una con 4-6 sub-bloques de datos en vivo (heatmaps,
tablas de ganadores/perdedores, calendarios). Evidencia: `g2-tradingview/escritorio-claro__02.png`
a `__04.png`.

**Cifras y datos de mercado.** Uso intensivo de mini-gráficos de área/línea dentro de tarjetas
pequeñas, tablas con flechas de color y badges de porcentaje — el patrón de "producto real
insertado en la home" más marcado del grupo.

**Confianza y cumplimiento.** No hay avisos de riesgo visibles en el primer pliegue (es una
plataforma de datos/social, no un bróker regulado directamente en esta portada).

**Navegación y pie.** Nav simple (Products, Community, Markets, Brokers, More); el peso informativo
está en el cuerpo, no en el menú.

**Móvil.** Mismo patrón de secciones por activo apiladas, banner de cookies igual de intrusivo.
Evidencia: `g2-tradingview/movil-claro__00.png` y `__01.png`.

**Para CountPips:**
1. Insertar mini-gráficos reales (sparklines) dentro de tarjetas pequeñas como forma de mostrar
   "producto" sin depender de una captura de pantalla completa.
2. Organizar contenido de referencia por categoría (aquí clase de activo) con la misma plantilla de
   sub-bloques repetida — aplicable a organizar funcionalidades de CountPips por tipo de trader.
3. Usar una paleta de sistema para el cuerpo de texto y reservar la fuente de marca solo para
   titulares, para aligerar el peso de carga.
**No imitar:** el volumen de imágenes/SVGs (440/447) y la altura de página (17000+ px) — es
insostenible para una web ligera y estática como la de CountPips.

---

## 5. Deribit (sustituye a Bloomberg Professional)

**Primer pliegue.** Titular "Trade Crypto Derivatives" en blanco sobre un hero degradado azul
oscuro/negro con mockup de móvil a la derecha mostrando la app de trading. CTA único: campo de email
+ botón "Get started" en azul `rgb(0,82,255)`. Antes incluso del nav, una franja superior blanca
identifica al operador legal exacto (Deribit FZE, licencia VARA en Dubái). Evidencia:
`g2-deribit/escritorio-claro__00.png`.

**Tipografía.** Inter en todo el sitio; H1 48 px/600 con tracking negativo (-0.96 px) — titulares
compactos y modernos, sin serif.

**Color y superficies.** Contraste fuerte blanco/negro: hero y secciones de producto en negro
puro, secciones de FAQ y confianza en blanco. Los mockups de producto (siempre oscuros, con verdes y
rojos de trading) se insertan como imagen flotante sobre fondo negro.

**Modo oscuro.** No lo respeta como tal (fondoBody transparente igual en ambas pasadas) pero el
diseño ya alterna bandas negras y blancas por sección — el contraste alto compensa parcialmente la
falta de un tema de sistema real.

**Ritmo y densidad.** Alto 8425 px, con bandas negras muy grandes dedicadas solo a un titular y una
imagen de producto (ej. "The best UI. Our trade secret.") — mucho aire vertical por sección, pocas
palabras por pantalla. Evidencia: `g2-deribit/escritorio-claro__01.png`.

**Confianza y cumplimiento.** El aviso legal/regulatorio aparece antes que cualquier otro contenido
(franja superior con el nombre exacto de la entidad y el regulador), y de nuevo en detalle en el pie
(Risk Disclosure, Registered Partner T&C, Restricted Jurisdictions). Cookie banner clásico de 3
botones. Evidencia: `g2-deribit/escritorio-claro__00.png` y `movil-claro__00.png`.

**Navegación y pie.** Pie muy extenso y organizado en 6 columnas temáticas (Trading Tools, Learn, Dev
Hub, About, Support, Legal) — el pie por sí solo hace de mapa del sitio.

**Móvil.** El aviso legal superior se mantiene como banner de texto pequeño incluso en 390 px,
ocupando bastante alto antes del hero. Evidencia: `g2-deribit/movil-claro__00.png`.

**Para CountPips:**
1. Alternar bandas negras/blancas de ancho completo para dar ritmo a una página sobria sin
   necesitar color — encaja de forma natural con la paleta de CountPips.
2. Mostrar el mockup de producto flotando sobre fondo oscuro con foco propio, en vez de encajarlo en
   una tarjeta con borde.
3. Un pie de página organizado por audiencia/tema como mapa de navegación secundario.
**No imitar:** situar el aviso legal como lo primero que ve cualquier visitante, en una franja de
texto largo — para CountPips (no regulado, sin custodia de fondos) sería un aviso desproporcionado;
basta un pie de página discreto.

---

## 6. LSEG (London Stock Exchange Group)

**Primer pliegue.** Titular "Discover the power of LSEG" (44 px/600, proximanova) sobre foto de
skyline con overlay azul oscuro, con una caja de ticker en vivo arriba a la derecha
("8,354.0 GBX +108.0 (+1.3%)"). Un único CTA: "Discover more about what we do". El resto del primer
pliegue queda tapado por el banner de cookies casi de inmediato. Evidencia:
`g2-lseg/escritorio-claro__01.png`.

**Tipografía.** proximanova en titulares (44 px/600) y cuerpo (16 px/400) — misma familia en todo,
diferencia solo de peso/tamaño, sin contraste serif/sans.

**Color y superficies.** Azul marino corporativo intenso para hero y CTAs, tarjetas blancas con
sombra ligera para "Inside LSEG", fondo gris muy claro para "Our business". Motivo recurrente: fotos
abstractas de líneas de luz azul (fibra óptica) como separador visual entre bloques.
Evidencia: `g2-lseg/escritorio-claro__02.png`.

**Modo oscuro.** No lo respeta (fondoBody transparente idéntico en ambas pasadas).

**Ritmo y densidad.** Alto moderado (4618 px escritorio) para la cantidad de contenido — bien
equilibrado, cada sección un tema y sin amontonar.

**Confianza y cumplimiento.** El aviso de cookies es un modal centrado de tamaño medio (no
pantalla completa) con 3 opciones claras (Accept all/Reject all/Cookie settings) — más comedido que
otros del grupo. Evidencia: `g2-lseg/escritorio-claro__01.png`.

**Navegación y pie.** Pie con 5 columnas (About LSEG, Corporate, Contact Us, Connect With Us,
Language) sobre fondo casi negro; selector de idioma explícito en el pie (English, 日本語, 简体中文).
Evidencia: `g2-lseg/movil-claro__00.png`.

**Móvil.** El modal de cookies ocupa gran parte de la pantalla en 390 px, obligando a interactuar
antes de ver nada más. Evidencia: `g2-lseg/movil-claro__00.png`.

**Para CountPips:**
1. Caja de ticker en vivo superpuesta a la foto de hero como detalle de autenticidad de mercado
   (adaptable a un dato en vivo o casi-en-vivo de la propia demo de CountPips).
2. Motivo visual recurrente y sutil (aquí líneas de luz azul) como separador de secciones en vez de
   solo líneas o espacio en blanco.
3. Selector de idioma visible en el pie, no escondido — relevante porque CountPips ya es bilingüe.
**No imitar:** un modal de cookies que tapa el hero nada más cargar — para una web sin analítica de
terceros pesada, CountPips puede permitirse un aviso de cookies mínimo o inexistente.

---

## 7. Koyfin

**Primer pliegue.** Titular enorme y centrado "A modern investment platform for advisors and
investors." (88 px/500, AktivGrotesk, tracking -1.76 px), subtítulo corto, un único CTA negro "Sign
Up For Free", y debajo una captura real del dashboard de Koyfin enmarcada en un navegador simulado.
Evidencia: `g2-koyfin/escritorio-claro__00.png`.

**Tipografía.** AktivGrotesk para titulares (tamaños grandes, 60-88 px según viewport) con tracking
negativo marcado; cuerpo también sans (aktiv-grotesk) a 14 px/400 en el texto de cookies. Fuerte
contraste de escala titular/cuerpo, no de familia.

**Color y superficies.** Casi todo blanco y negro/gris, sin acentos de color fuera de los iconos
circulares azules de la sección "Built by investors". Muy cercano en espíritu a la paleta de
CountPips.

**Modo oscuro.** No lo respeta (fondoBody blanco idéntico en ambas pasadas,
`g2-koyfin/escritorio-oscuro__00.png` igual a la de claro).

**Ritmo y densidad.** Mucho espacio en blanco entre bloques (p. ej. tarjetas de "Financial
Advisors/Research Teams/Individual Investors" muy separadas verticalmente unas de otras) — roza el
exceso de aire en un tramo del scroll. Evidencia: `g2-koyfin/escritorio-claro__02.png`.

**Cifras y datos de mercado.** El dashboard mostrado en el hero es una captura real de producto con
cifras de mercado auténticas (tablas de sectores, yields, divisas) en una interfaz oscura dentro de
un marco de navegador claro — contraste deliberado producto-oscuro/marketing-claro.

**Confianza y cumplimiento.** Fila de logos de clientes reconocibles (Charles Schwab, BlackRock,
Hightower, Fidelity) en gris sobre banda clara — validación social clásica sin discurso regulatorio
(no son un bróker).

**Detalle destacable.** Sección "Let AI tell you about Koyfin" con tres botones para pedir un
resumen a ChatGPT/Claude/Gemini directamente desde la home — posicionamiento explícito de cara a la
búsqueda por IA. Evidencia: `g2-koyfin/escritorio-claro__01.png`.

**Navegación y pie.** Nav mínima (Product, For Financial Advisors, For Investors, Pricing).

**Móvil.** Anomalía observada: el viewport pedido de 390 px se renderizó con un ancho real de 780 px
(el doble) — ver «Dudas». Aun así el contenido se mantiene legible, apilado en una columna.
Evidencia: `g2-koyfin/movil-claro__00.png`.

**Para CountPips:**
1. Enmarcar la captura de producto real en un navegador simulado bajo un titular muy grande y
   centrado — coherente con el enfoque "cifras reales, capturas reales" ya buscado.
2. Fila de logos de clientes/integraciones en gris discreto como prueba social sin necesitar texto.
3. Explorar una sección corta orientada a que asistentes de IA puedan resumir la propuesta de
   CountPips (dato de interés, sin necesidad de copiar la ejecución literal).
**No imitar:** los huecos verticales tan amplios entre tarjetas de una misma sección — para una web
más corta como la de CountPips penalizaría el ritmo de lectura.

---

## 8. ICE (Intercontinental Exchange)

**Primer pliegue.** Antes que cualquier titular de marketing, una franja de datos en vivo (energía:
Crude, WTI, Midland WTI con precio, variación y hora exacta "As of Monday, September 21 2026
05:08:39 AM ET"). El hero en sí es un vídeo/imagen de fondo con una tarjeta blanca de borde negro
superpuesta: "ICE for Hedge Funds" + botón "DISCOVER MORE". Evidencia:
`g2-ice/escritorio-claro__00.png`.

**Tipografía.** Suisse Intl en todo el sitio; H1 64 px/500 sin serif, cuerpo 19.2 px/400.

**Color y superficies.** Blanco/negro con un azul-teal como único acento (bordes de tarjetas de
foto, iconos sociales). Patrón repetido: foto principal con una segunda tarjeta más pequeña
solapada, ambas con un marco teal fino — se repite igual en tres secciones seguidas ("Transforming
what's possible", "Streamlining the system", "Automating the industry"). Evidencia:
`g2-ice/escritorio-claro__01.png` y `__02.png`.

**Modo oscuro.** No lo respeta (capturas claro/oscuro idénticas, fondoBody blanco en ambas).

**Ritmo y densidad.** Alto considerable (9910 px) pero bien segmentado en bloques de foto+texto
alternos, cada uno con su propio fondo (blanco/gris claro) para marcar la transición.

**Cifras y datos de mercado.** El ticker superior usa cifras tabulares con flechas rojas/verdes y
menú desplegable por categoría (Energy) — foco en time-stamping explícito ("delayed minimum of 15
minutes"), transparencia sobre el retraso del dato.

**Confianza y cumplimiento.** El aviso de cookies es una barra negra fina y persistente en la parte
superior (no un modal centrado) con tres acciones en texto — mucho menos intrusiva visualmente que
la mayoría del grupo, aunque tapa parte del ticker. Evidencia: `g2-ice/escritorio-claro__00.png`.

**Navegación y pie.** Pie con 5 columnas temáticas (Solutions, Tools and Sources, Support, About,
Insights) sobre gris claro, iconos sociales en cuadrados con borde teal.

**Móvil.** El ticker y la barra de cookies compiten por espacio en la parte superior, dejando muy
poco alto visible para el hero antes de tener que hacer scroll. Evidencia:
`g2-ice/movil-claro__00.png`.

**Para CountPips:**
1. El patrón "foto + tarjeta secundaria solapada con marco de color" como forma reutilizable de
   presentar funcionalidades sin depender solo de capturas de pantalla, aplicable con un acento gris
   frío en vez de teal.
2. Transparencia explícita sobre la naturaleza de un dato (aquí "delayed 15 minutes") — aplicable a
   dejar claro que las cifras de muestra de CountPips son de una demo, no de una cuenta real (ya lo
   hacen, reforzar el patrón).
3. Aviso de cookies como barra fina persistente en vez de modal a pantalla completa.
**No imitar:** competir el ticker de datos con la barra de cookies por el mismo espacio en móvil —
resultado confuso en los primeros segundos de carga.

---

## 9. Saxo (home.saxo)

**Primer pliegue.** Titular más discreto del grupo: "Discover a better way to invest" (44 px/400,
peso normal, no negrita) junto a tres bullets de confianza («Broker trusted by 1.5 million»,
«Regulated financial institution», «The Danish Guarantee Fund») y un widget de cotización en vivo de
Apple a la derecha. Dos CTA: "Open account" (azul) y "Check out..." (outline).
Evidencia: `g2-saxo/escritorio-claro__00.png`.

**Tipografía.** Inter en titulares (44 px/400 — el único H1 del grupo en peso "normal", no
seminegrita ni negrita), sans genérica en cuerpo a 15 px/400.

**Color y superficies.** Azul corporativo + un beige/crema cálido poco habitual en el grupo para las
tarjetas de precios ("Stocks EUR 2", "Bonds EUR 20") — rompe la monotonía azul/blanco del resto sin
salirse de un tono sobrio. Evidencia: `g2-saxo/escritorio-claro__01.png`.

**Modo oscuro.** No lo respeta (fondoBody transparente idéntico en ambas pasadas).

**Ritmo y densidad.** Bien equilibrado, 6466 px, con transiciones claras: producto → precios → más
formas de rentabilizar → confianza (foto CEO + acordeón) → aviso destacado → pasos para empezar.

**Cifras y datos de mercado.** Las comisiones se presentan como cifra grande + etiqueta pequeña en
tarjetas beige, sin tabla — más "cartel de precio" que "tabla financiera". Evidencia:
`g2-saxo/escritorio-claro__01.png`.

**Confianza y cumplimiento.** El aviso de riesgo aparece en texto en negrita amarillo/ámbar sobre
fondo casi negro en el pie legal extendido ("All trading and investing comes with risk...") — un
tratamiento visual fuerte y deliberado, no una nota gris diminuta. Evidencia:
`g2-saxo/escritorio-claro__03.png`.

**Detalle fino.** El modal de cookies integra también el selector de país/región ("International"
con bandera) en el mismo componente — combina consentimiento y localización en una sola interacción.
Evidencia: `g2-saxo/escritorio-claro__00.png`.

**Navegación y pie.** Pie oscuro con 4 columnas (Pricing, Account types, About Saxo + datos legales
de la entidad).

**Móvil.** El modal de cookies + selector de país ocupa la mayor parte de la pantalla; el resto del
contenido se apila sin perder las tarjetas de precio. Evidencia: `g2-saxo/movil-claro__00.png` y
`__01.png`.

**Para CountPips:**
1. Tarjetas de precio con cifra grande + etiqueta corta sobre un fondo cálido/neutro distinto del
   resto de la página — aplicable a la sección de precios Core/Pro de CountPips para diferenciarla
   visualmente sin romper la paleta.
2. Tratar el aviso legal relevante (en el caso de CountPips: "no es asesoría financiera", "datos en
   tu equipo") con contraste fuerte y deliberado en un punto del scroll, no solo en el footer gris.
3. Titular en peso normal (no negrita) como forma de transmitir calma/seriedad frente al grito visual
   de otros competidores.
**No imitar:** fusionar el aviso de cookies con el selector de idioma/región en el mismo modal — añade
fricción a una sola interacción que ya es molesta de por sí.

---

## 10. QuantConnect

**Primer pliegue.** Titular "Research, Backtest, and Trade Your Investment Strategies" (46 px/500,
Inter) junto a una captura real y viva del producto: un backtest con equity curve, cifras de
rendimiento (+158.6%, Sharpe implícito) y un treemap de volumen por activo, enmarcado como ventana de
navegador. Dos CTA: "Create Free Account" (naranja) y "Talk to Us" (texto). Evidencia:
`g2-quantconnect/escritorio-claro__00.png`.

**Tipografía.** Inter en todo el sitio, titulares 46 px/500, cuerpo 17 px/400 — sin serif, jerarquía
por tamaño y color de texto (gris medio para cuerpo).

**Color y superficies.** Único sitio del grupo con **modo oscuro real**: el fondo pasa de
`rgb(255,255,255)` a `rgb(19,20,24)` (confirmado en `datos.json` y visualmente idéntico patrón de
color invertido en `g2-quantconnect/escritorio-oscuro__00.png` y `__01.png` frente a las de claro).
El naranja de marca (`~rgb(245,166,35)`) se mantiene como ancla en ambos temas, y las tarjetas pasan
de blanco/gris claro a gris pizarra oscuro con el mismo contenido. Es el único ejemplo verificado del
grupo de una adaptación de tema completa y coherente, no solo declarada.

**Ritmo y densidad.** 8269 px, con una barra de pestañas horizontal (CLOUD RESEARCH / BACKTESTING /
AI ASSISTANCE / OPTIMIZATION / LIVE TRADING) que cambia el screenshot y el texto de al lado sin
alargar el scroll — patrón de "acordeón horizontal" para comprimir muchas features. Evidencia:
`g2-quantconnect/escritorio-claro__01.png`.

**Cifras y datos de mercado.** Fila de cifras desnudas bajo el hero (544K comunidad, 1M+ backtests/
mes, $100B volumen/mes, 375K despliegues en vivo) sin caja ni icono, solo tamaño y color.

**Confianza y cumplimiento.** Logos de prensa (FT, WSJ, Business Insider) en gris, más una sección
de comparación de rendimiento con barras naranja/gris ("LEAN Enterprise vs LEAN") sobre fondo negro —
usa gráficos de barras reales para argumentar una ventaja técnica en vez de solo texto.
Evidencia: `g2-quantconnect/escritorio-claro__03.png`.

**Detalles finos.** Bloque de código Python real en una tarjeta tipo terminal, dirigido explícitamente
al público técnico/cuant. Insignia de GitHub con estrellas reales (21,708) como prueba de comunidad
open-source. Evidencia: `g2-quantconnect/escritorio-claro__02.png` y `escritorio-oscuro__01.png`.

**Navegación y pie.** Pie oscuro con columnas Technology/Company/LEAN y el badge de GitHub.

**Móvil.** El bloque de pestañas se convierte en una lista vertical de tarjetas con captura +
descripción, conservando la lectura del producto real. Evidencia:
`g2-quantconnect/movil-claro__00.png` y `__01.png`.

**Para CountPips:**
1. Es la prueba dentro del propio grupo de que un modo oscuro de marketing bien hecho es posible y
   coherente (fondo, tarjetas y acento de marca todos adaptados) — referencia directa útil ya que
   CountPips también ofrece modo claro/oscuro.
2. Cifras desnudas de comunidad/uso (sin caja) bajo el hero, en la línea de lo que ya hace CountPips
   con sus paneles de métricas.
3. Barra de pestañas horizontal para mostrar varias funcionalidades del producto sin alargar la
   página — aplicable a una futura sección de "funcionalidades" de CountPips.
**No imitar:** el bloque de código Python en pantalla — el público de CountPips (traders manuales y
de prop firms) no es una audiencia de desarrolladores; mostrar código sería ruido, no señal.

---

## Patrones del grupo (los 8–12 más repetidos o mejor ejecutados)

1. **Dato de mercado en vivo antes que el mensaje de marketing.** Morningstar (ticker de índices como
   primer elemento de la portada, `g2-morningstar/escritorio-claro__00.png`), ICE (franja de energía
   antes del hero, `g2-ice/escritorio-claro__00.png`), Cboe (carrusel de índices en el hero,
   `g2-cboe/escritorio-claro__00.png`) y Saxo (widget de cotización de Apple junto al titular,
   `g2-saxo/escritorio-claro__00.png`).
2. **Captura real de producto enmarcada en navegador/dispositivo como hero, no fotografía de stock.**
   Koyfin (`g2-koyfin/escritorio-claro__00.png`), QuantConnect
   (`g2-quantconnect/escritorio-claro__00.png`), Saxo con dos mockups lado a lado
   (`g2-saxo/escritorio-claro__00.png`).
3. **Casi ninguna respeta el modo oscuro del sistema en la web de marketing**, pese a que varios de
   sus productos sí lo tienen: de las 10, solo QuantConnect adapta de verdad el fondo y las tarjetas
   (`g2-quantconnect/datos.json`, `fondoBody` 255,255,255 → 19,20,24). Cboe, Morningstar, IBKR,
   TradingView, LSEG, Koyfin, ICE, Saxo y Deribit muestran capturas claro/oscuro idénticas.
4. **Modales de cookies a pantalla parcial o completa que tapan el primer pliegue** en la primera
   carga: LSEG (`g2-lseg/escritorio-claro__01.png`), Saxo (`g2-saxo/escritorio-claro__00.png`),
   Koyfin (`g2-koyfin/escritorio-claro__00.png`), Deribit (`g2-deribit/escritorio-claro__00.png`).
   ICE es la excepción con una barra fina no bloqueante (`g2-ice/escritorio-claro__00.png`).
5. **Tarjeta de foto principal + tarjeta secundaria solapada con marco de color de acento**, repetido
   como plantilla de sección: ICE tres veces seguidas (`g2-ice/escritorio-claro__01.png`,
   `__02.png`) y Koyfin en sus tarjetas de audiencia (`g2-koyfin/escritorio-claro__02.png`).
6. **Confianza mostrada como cifra desnuda (sin logo ni caja)** en vez de solo sellos: IBKR ("5
   Million clients", `g2-ibkr/escritorio-claro__03.png`), QuantConnect ("544K / 1M+ / $100B",
   `g2-quantconnect/escritorio-claro__00.png`), Saxo ("Over 30 years of experience",
   `g2-saxo/escritorio-claro__01.png`).
7. **Corrección de radio de esquina como señal de posicionamiento**: exchanges/brókers muy
   institucionales usan esquinas rectas (IBKR `radio: 0px`, `g2-ibkr/datos.json`; ICE con tarjetas de
   borde recto, `g2-ice/escritorio-claro__00.png`), mientras que plataformas más orientadas a retail
   usan píldoras muy redondeadas (Cboe `radio: 3.35544e7px`, Deribit y Koyfin con 6-100 px).
8. **Aviso de riesgo/regulación tratado como momento de diseño**, no como nota gris diminuta: Saxo con
   texto ámbar sobre fondo casi negro (`g2-saxo/escritorio-claro__03.png`) y Deribit nombrando al
   regulador exacto en una franja antes del propio nav (`g2-deribit/escritorio-claro__00.png`).
9. **IA como parte del mensaje de producto en el primer o segundo pliegue**, no solo en un blog:
   Koyfin con "Ask ChatGPT/Claude/Gemini" (`g2-koyfin/escritorio-claro__01.png`) y QuantConnect con
   su asistente "Mia" y el research pipeline agentic (`g2-quantconnect/datos.json`,
   sección "Bring Agentic AI to QuantConnect with Mia").
10. **Barra de pestañas horizontal para comprimir varias funcionalidades en una sola sección** sin
    alargar el scroll: QuantConnect (`g2-quantconnect/escritorio-claro__01.png`) y, en formato
    carrusel numerado, Saxo ("01/02", `g2-saxo/escritorio-claro__00.png`) e ICE ("01/03",
    `g2-ice/escritorio-claro__04.png`).
11. **Cifras de mercado con deltas en color y alineación tabular** en tarjetas pequeñas repetidas:
    Morningstar (`g2-morningstar/escritorio-claro__00.png`), TradingView
    (`g2-tradingview/escritorio-claro__02.png`) y Cboe (`g2-cboe/escritorio-claro__01.png`).
12. **Franja legal/identificación del operador antes que cualquier contenido de marketing**, propia
    de las plataformas más reguladas: Deribit identifica la entidad legal exacta en una franja blanca
    superior antes del nav (`g2-deribit/escritorio-claro__00.png`), patrón que no aparece en
    plataformas de datos no reguladas (Koyfin, TradingView, QuantConnect).

## Errores del grupo (a evitar)

- **Modales de cookies que bloquean todo el primer pliegue** nada más cargar (LSEG, Saxo, Koyfin,
  Deribit): la primera impresión de la marca queda subordinada a un trámite legal. Para una web sin
  analítica pesada de terceros como CountPips, conviene un aviso mínimo o inexistente antes que
  replicar este patrón.
- **Declarar soporte de tema oscuro sin implementarlo**: IBKR anuncia `color-scheme: light dark` en
  el CSS pero la home no cambia nada visualmente — genera una expectativa que no se cumple y es peor
  que no declararlo.
- **Competir por el mismo espacio superior entre datos en vivo y avisos de cookies/legales** en
  móvil, como le pasa a ICE: en 390 px de ancho el ticker y la barra de cookies dejan casi sin hueco
  al titular real.
- **Densidad sin jerarquía** en portadas con 30+ secciones (Morningstar) o cientos de imágenes/SVGs
  (TradingView, 440 imágenes) — funciona para un portal de datos que se visita a diario, pero sería
  contraproducente para una web de producto que necesita comunicar una propuesta de valor clara en
  pocos scrolls.
- **Bloqueo total a herramientas de captura/anti-bot en los tres primeros nombres del encargo** (CME
  Group, Nasdaq, Bloomberg Professional): no es un "error de diseño" trasladable, pero confirma que
  estas plataformas priorizan el blindaje anti-scraping por encima de la inspeccionabilidad, algo que
  no aplica ni interesa a una web de marketing pequeña como CountPips.

## Dudas (sin ampliar el alcance, quedan anotadas)

- **CME Group, Nasdaq y Bloomberg Professional**: confirmadas como bloqueadas (`ERR_HTTP2_PROTOCOL_ERROR`
  en las dos primeras, HTTP 403 "Are you a robot?" en la tercera) tras reintentos; no se pudo
  verificar su diseño real más allá de la página de bloqueo.
- **FactSet** (primer sustituto probado para Bloomberg Professional) quedó descartado: su banner de
  cookies fijó el `scrollHeight` del documento a 900 px en las tres pasadas, impidiendo capturar nada
  más allá del primer tramo visible. No se aceptaron las cookies (fuera de los límites del encargo),
  así que se sustituyó por Deribit sin analizar FactSet.
- **Koyfin, pasada móvil**: el viewport pedido era 390 px pero el ancho real capturado fue 780 px
  (`g2-koyfin/datos.json`, campo del viewport de la pasada móvil). No se investigó la causa exacta
  (podría ser un mínimo de layout de la propia página); las capturas móviles de Koyfin deben leerse
  con esa salvedad.
- **Señal binaria de "modo oscuro"**: el script solo compara el color de fondo del `<body>`. En
  varias webs (Cboe, IBKR, LSEG, Morningstar, Saxo) el `<body>` es transparente y el color real viene
  de imágenes o gradientes; se verificó visualmente en cada una que, aun así, las capturas claro/
  oscuro eran idénticas, por lo que la conclusión de "no respeta modo oscuro" se sostiene con
  evidencia visual, no solo con el dato del JSON.
