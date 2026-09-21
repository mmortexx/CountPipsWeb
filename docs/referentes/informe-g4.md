# Informe grupo 4 — Prop firms y plataformas de trading

10 webs capturadas y analizadas (escritorio 1440 claro, escritorio 1440 con el sistema en oscuro,
móvil 390; troceadas en `g4-<nombre>/*.png`) más `countpips/` como referencia de la propia web de
CountPips en producción (no cuenta como una de las 10). Ninguna de las 10 estuvo bloqueada por
protección anti-robots; todas devolvieron HTTP 200 con contenido real (verificado en
`datos.json` de cada carpeta, campo `estado`). No hizo falta sustituir ninguna.

Sustitución: ninguna. Las 10 cargaron correctamente.

---

## 1. FTMO — `g4-ftmo/`

**Primer pliegue.** Titular «Grow & Monetize Your Demo Trading», foto de dos traders con overlay de
gráficos y una tarjeta flotante de cuenta («FTMO Account · Balance $219,999.43»). Dos CTA
jerarquizados: «Start FTMO Challenge» (relleno, negro) y un login secundario en texto. Un modal de
cookies grande se renderiza encima del titular y lo tapa casi por completo en la primera pantada.
Evidencia: `g4-ftmo/escritorio-claro__00.png`.

**Tipografía.** H1 en Poppins 600, 96px/96px interlineado, sin tracking (`datos.json`). Párrafo
Poppins 500, 18px/28px. Todo sans, sin contraste serif/sans — cuerpo y titular comparten familia,
solo cambia el peso.

**Color y superficies.** Fondo `rgb(9,9,11)` fijo (negro casi puro) tanto en claro como en oscuro
del sistema — `respetaModoOscuro: false`. Tarjetas con esquinas de 12px, separación por franjas de
color oscuro alternas, sin filetes visibles. El azul de acento (`rgb(7,129,254)`) solo en el botón
secundario «Get Started».

**Modo oscuro.** No respeta el sistema: es oscura siempre (`colorScheme: normal`).

**Ritmo y densidad.** Alto de página 12 394px en escritorio con 14 secciones — denso pero cada
sección tiene un solo mensaje. Tabla de planes (`g4-ftmo/escritorio-claro__01.png`) con 5 columnas de
precio, filas de reglas (Profit Target, Max Daily Loss, Max Loss, Min Trading days...) y `Avg.
Reward` publicado por cuenta — presenta la cifra de recompensa media junto al precio, no por
separado.

**Reglas y cifras.** Tabla comparativa de 5 tamaños de cuenta con las mismas filas de reglas
(`escritorio-claro__01.png`), toggle 1-Step/2-Step arriba. Sin gráficos, solo texto y color
semántico (verde para "100%" del refund).

**Confianza y cumplimiento.** Logos Forbes/EY, «Trusted by Millions of Traders» con 3 cifras
(4.5M+ clientes, $650M+ pagado, 140+ países), tarjetas de testimonio en vídeo con miniatura y
vistas de YouTube (`escritorio-claro__01.png`). FAQ en acordeón al final
(`escritorio-claro__04.png`). Sin aviso de riesgo visible en el primer tramo de página.

**Navegación y pie; móvil.** Nav con mega-menú (CFD, Futures, Trading Objectives, Academy…). En
móvil, la tabla de planes se vuelve vertical, cada cuenta ocupa su propia tarjeta con scroll
horizontal por pestañas de importe (`g4-ftmo/movil-claro__01.png`, `movil-claro__02.png`).

**Detalles finos.** Chat flotante azul, banda de oferta con countdown ($100K Special Offer − 19%),
tono directo pero no agresivo («More Power, Less Risk»).

**Adaptar a CountPips (principio, no diseño):**
1. Mostrar la cifra de recompensa media junto al precio de cada plan, no solo el coste — refuerza el valor antes de pedir el pago.
2. Reglas de evaluación como tabla comparable por columnas (no como párrafo), con las mismas filas para cada variante.
3. Testimonios con una cifra concreta adjunta (payout, país) en vez de solo cita — da peso sin depender del tono.

**No imitar:** el modal de cookies bloqueando literalmente el titular en el primer segundo de carga; en una web ya sobria como CountPips eso rompe la primera impresión que se cuida tanto.

---

## 2. Topstep — `g4-topstep/`

**Primer pliegue.** Titular «Become a Funded Futures Trader», foto cinematográfica de un esquiador
en montaña nevada, un único CTA («Start Trading Now», blanco sobre foto). Debajo, banner de cookies
de ancho completo y franja de 4 cifras (`$1.4B+`, `6,998+`, `15 Years`, `140+`). Evidencia:
`g4-topstep/escritorio-claro__00.png`.

**Tipografía.** H1 en Paralucent 500, 96px/100px, tracking negativo (-1.92px) — condensada y
compacta. Cuerpo en Work Sans 400, 20px/32px. Contraste tipográfico claro entre titular (display,
ajustado) y cuerpo (abierto, legible).

**Color y superficies.** Fondo negro puro fijo (`rgb(0,0,0)`), acento dorado/ámbar en la segunda
línea del titular y en cifras («$1.4B+»). Tarjetas con esquinas de 8px sobre fondo negro, sin
filetes — la separación de sección es solo por cambio de imagen de fondo (foto → negro liso).

**Modo oscuro.** `colorScheme: "light dark"` declarado, pero el fondo es negro sea cual sea el
tema del sistema — no hay variante clara real (`respetaModoOscuro: false`).

**Ritmo y densidad.** Solo 6 secciones y 5150px de alto — la página comercial es corta;
el resto del contenido es un enlace a "TopstepTV" (canal de contenido) y un formulario de
newsletter. Equilibrado, poco denso.

**Reglas y cifras.** No hay tabla de reglas en el primer pliegue capturado — las 4 cifras de
cabecera (pagado, traders, años, países) son el único dato duro visible antes de scrollear a los
productos («Learn. Trade. Earn.» / «Your capital. Your control.»).

**Confianza y cumplimiento.** El pie de página (`g4-topstep/escritorio-claro__02.png`) contiene un
bloque de descargo de riesgo extenso: "Not a Deposit | Not FDIC Insured | May Lose Value",
identificación de entidades reguladas (NFA, SIPC), estadísticas de rendimiento 2025 con
metodología explicada en párrafos largos. El disclaimer es sustancial pero vive solo en el pie,
en gris pequeño.

**Navegación y pie; móvil.** Nav simple (Funded Trading, How It Works, Brokerage, Blog, Support).
En móvil el H1 pasa a 3 líneas cortas y las 4 tarjetas de cifras se apilan verticalmente
(`g4-topstep/movil-claro__00.png`).

**Detalles finos.** Fotografía editorial de alta calidad (no renders 3D ni iconos), tono aspiracional
("Become a Funded Futures Trader") más que urgente — sin countdown ni cupones en el primer pliegue.

**Adaptar a CountPips:**
1. Un único CTA claro en el héroe en vez de varios compitiendo — reduce la fricción de decisión.
2. Fotografía/imagen editorial de calidad como refuerzo emocional del titular, en vez de solo texto o solo captura de producto.
3. Separar el contenido "producto" del contenido "comunidad/blog" en bloques visualmente distintos, para no diluir el mensaje comercial.

**No imitar:** enterrar el descargo de riesgo (con datos de rendimiento reales y metodología) en un muro de texto gris de pie de página — si esos datos importan para la credibilidad, merecen más jerarquía.

---

## 3. Apex Trader Funding — `g4-apex/`

**Primer pliegue.** Barra superior de urgencia con countdown ("ANY SIZE EVALS UP TO 90% OFF... Ends
in 1d 18h 53m"), titular condensado en mayúsculas «WELCOME TO THE ALL NEW APEX!» con lista de
bullets de reglas ("NO Payout Denials", "NO MAE Rule"...) y un modal de cookies grande encima.
Evidencia: `g4-apex/escritorio-claro__00.png`.

**Tipografía.** H1 en "Benton Sans Wide Black" 900, 40px/40px, tracking -2.8px — muy condensada y
pesada para su tamaño. Párrafo en "Guardian Sans" 500, 14px pequeño. Contraste fuerte entre
titular gigante-negro y cuerpo diminuto.

**Color y superficies.** Fondo blanco (`rgb(255,255,255)`), pero con bloques de azul intenso
(`rgb(0,38,255)`) y naranja (`rgb(255,176,0)`) para CTAs y cifras destacadas — paleta muy saturada.
Esquinas muy redondeadas (37.5px, casi píldora) en botones. `scrollHorizontal: true` — hay overflow
horizontal real en escritorio (defecto técnico, no solo densidad visual).

**Modo oscuro.** No existe: `respetaModoOscuro: false`, fondo blanco fijo siempre.

**Ritmo y densidad.** 8227px de alto con solo 4 `section` semánticas pero decenas de bloques de
texto — la página es muy densa: bullets de reglas repetidos varias veces, tarjetas de beneficio
apiladas de tres en tres. Poco aire entre bloques (`g4-apex/escritorio-claro__01.png`).

**Reglas y cifras.** Wizard de 3 pasos (Type → Balance → Vendor) que genera una tabla de reglas de
cuenta en vivo (`g4-apex/escritorio-claro__01.png`, panel derecho: Min. Days To Pass, Max
Contracts, Profit Target, Max Drawdown...). Tabla de instrumentos con tick size y point value
(`g4-apex/escritorio-claro__03.png`).

**Confianza y cumplimiento.** Testimonios con estrellas y foto de perfil, logos de partners
(Wealthcharts, Rithmic, NinjaTrader, Tradovate) y un bloque final de "RISK DISCLOSURE" en texto
gris pequeño explicando que es simulación educativa (`g4-apex/escritorio-claro__04.png`).

**Navegación y pie; móvil.** El modal de cookies y la barra de countdown ocupan gran parte de la
pantalla en móvil antes de llegar a cualquier contenido (`g4-apex/movil-claro__00.png`) — peor
que en escritorio proporcionalmente.

**Detalles finos.** Mascota 3D de un toro plateado como elemento de marca recurrente, cupón de
descuento repetido en varios puntos de la página, tono agresivo/urgente ("LIMITED-TIME OFFER").

**Adaptar a CountPips:**
1. Panel de reglas "en vivo" que cambia según la selección del usuario (tamaño de cuenta, tipo) — aplicable al configurador de reglas del modo prop firm.
2. Tabla de instrumentos con datos concretos (tick size, valor por punto) como prueba de seriedad técnica.
3. Reformular reglas como negación de fricción ("sin recargos ocultos") es efectivo si se hace con moderación — un principio, no la repetición constante que hace Apex.

**No imitar:** apilar countdown + cupón + modal de cookies + overflow horizontal en el primer pliegue; es ruido que compite entre sí y en móvil se come toda la pantalla antes del titular.

---

## 4. The5ers — `g4-5ers/`

**Primer pliegue.** Banner promocional superior ("Boost..."), titular «Turning Your Passion Into A
Trading Career», imagen editorial recortada en formas geométricas (círculo + diagonal) y un solo
CTA "Get Funded". Debajo, sellos "2025" repetidos y un banner de cookies con toggles granulares.
Evidencia: `g4-5ers/escritorio-claro__00.png`.

**Tipografía.** H1 en generalSans 700, 50px/55px, sin tracking. Cuerpo pequeño (15px) en la parte
capturada corresponde al texto del banner de cookies, no al cuerpo real de la página — el párrafo
"real" del hero es más corto y no se detectó por el selector automático.

**Color y superficies.** Fondo negro (`rgb(16,15,15)`), acento verde lima (`rgb(221,253,108)`) muy
saturado en botones tipo píldora (`border-radius` casi circular). Tarjetas oscuras sin filete,
separación por cambio de tono de negro a negro-violeta en franjas.

**Modo oscuro.** No respeta el sistema, siempre oscura (`respetaModoOscuro: false`).

**Ritmo y densidad.** 11 secciones, 11 235px de alto en escritorio — equilibrado; cada bloque de
contenido (stats, payouts, academy, reviews) tiene su propio fondo y aire alrededor.

**Reglas y cifras.** Selector de plan por pestañas (Summer Plan/CFDs/Futures → 1 Step/2 Steps/
Futures) que despliega una tabla de dos columnas (Funded Trader vs. estándar) con filas: Max
Trading Period, Maximum Loss, Maximum Daily Loss, Target, Consistency, Payout Cap, Profit Share,
Leverage, Bonus, Refund, Price (`g4-5ers/escritorio-claro__01.png`). Tabla de spreads en vivo con
símbolo, bid/ask y spread por fila, con botón "Start" (`g4-5ers/escritorio-claro__03.png`) —
refuerza condiciones reales, no solo un claim de marketing.

**Confianza y cumplimiento.** Cifras editoriales grandes (262K funded traders, 10 years, 171
employees) en formato número-grande/etiqueta-al-lado (`g4-5ers/escritorio-claro__02.png`). Reseñas
en carrusel con foto y payout concreto ("Van T. — Payouts of $98,038").

**Navegación y pie; móvil.** En móvil el selector de plan colapsa a un desplegable con flecha (`1
STEP ⌄`) y conserva la tabla de dos columnas legible sin scroll horizontal
(`g4-5ers/movil-claro__01.png`) — de los mejores manejos de tabla en móvil del grupo.

**Detalles finos.** Icono de globo con marcadores de país en verde lima como firma visual, sellos
de premios repetidos (cuatro veces "2025" con distinto texto), tono cercano ("You've Got What It
Takes").

**Adaptar a CountPips:**
1. Tabla de condiciones con datos "en vivo" (spread, bid/ask) para dar sensación de transparencia técnica real, no solo copy de marketing.
2. Colapsar una tabla comparativa ancha a un desplegable + tabla de 2 columnas en móvil, en vez de forzar scroll horizontal.
3. Formato número-grande + etiqueta-al-lado para cifras de marca (en vez de número arriba/etiqueta abajo) como variación editorial del propio estilo de CountPips.

**No imitar:** repetir el mismo sello de premio ("2025") cuatro veces seguidas sin variar el diseño — diluye la credibilidad que se supone que aporta.

---

## 5. FundedNext — `g4-fundednext/`

**Primer pliegue.** Barra de oferta superior ("Stellar Instant 30% Off"), titular «We sponsor your
trading journey» en negro sobre negro puro (`lab(0 0 0)`), fila de mini-iconos con beneficios
(Rewards in 24h, One-time fee, 24/7 support) y dos CTA (Get Started / How It Works). Modal de
cookies discreto en la esquina inferior. Evidencia: `g4-fundednext/escritorio-claro__00.png`.

**Tipografía.** H1 en "Plus Jakarta Sans" 800, 96px/104px, tracking -2px — muy bold y compacto.
Cuerpo en Inter 400, 12px muy pequeño para tratarse del texto principal bajo el titular.

**Color y superficies.** Fondo negro puro, acento violeta/índigo (`rgb(91,...)`≈`lab(47,40,-82)`) en
CTAs y verde (`rgb(13,192,75)`) en badges de cupón. Iconos de plan en 3D glossy (estrellas
metálicas moradas) como elemento decorativo recurrente (`g4-fundednext/escritorio-claro__01.png`).

**Modo oscuro.** Metadato `colorScheme: "light"` en el HTML pero el diseño real es negro siempre —
incoherencia entre lo declarado y lo visual; no hay alternancia real (`respetaModoOscuro: false`).

**Ritmo y densidad.** 20 921px de alto, 11-13 secciones — es la página más larga del grupo en
escritorio, con más badges promocionales simultáneos (5 pills de oferta bajo "What's New") que
cualquier otra web capturada.

**Reglas y cifras.** Selector de reto (Stellar 2-Step/1-Step/Lite/Instant) con tarjetas de tamaño
de cuenta y precio tachado + precio final, y un panel de reglas con pestañas "Challenge Rules" /
"Funded & Reward Rules" que lista Phase Profit Target, Daily Loss Limit, Drawdown Type, Minimum
Trading Days, News Trading, Performance Reward (`g4-fundednext/movil-claro__01.png`) — de las
tablas de reglas mejor resueltas en móvil del grupo.

**Confianza y cumplimiento.** Muro extenso de testimonios tipo captura de pantalla (Trustpilot,
Reddit, Facebook) en grid tipo masonry, docenas de tarjetas simultáneas
(`g4-fundednext/escritorio-oscuro__01.png`) — la prueba social más densa de las 10 webs.

**Navegación y pie; móvil.** Nav con dropdown "More", dos filas de nav duplicadas para CFDs/Futures
en escritorio. En móvil el carrusel de retos usa puntos de paginación y mantiene la tabla de reglas
en pestañas, no en scroll horizontal.

**Detalles finos.** Mascota-chatbot "Ask Fundee", asistente "Help me choose", iconos 3D glossy como
firma visual, tono orientado a ofertas ("Save Up To 50% With Code").

**Adaptar a CountPips:**
1. Pestañas "Reglas del reto" / "Reglas de la cuenta financiada" para separar dos conjuntos de condiciones sin duplicar la tabla — aplicable al modo prop firm de CountPips (evaluación vs. cuenta financiada).
2. Precio tachado + precio final en la propia tarjeta de plan, sin necesitar cupón adicional visible.
3. Un asistente conversacional tipo "ayúdame a elegir" como principio de reducir la parálisis de elección entre Core/Pro — no necesariamente un chatbot, puede ser una guía de 2-3 preguntas.

**No imitar:** el muro de decenas de capturas de testimonios en mosaico simultáneo — es la prueba social más pesada visualmente del grupo y no aporta más confianza que 4-5 reseñas bien elegidas.

---

## 6. NinjaTrader — `g4-ninjatrader/`

**Primer pliegue.** Titular «Built For Exchange-Traded Futures», subtítulo breve, mockup real de
monitor + móvil mostrando la plataforma, franja de confianza (For Spanish Traders, 2.5MM+ Account
Holders, Wire Transfer & SEPA) y banner de cookies de ancho completo. Fondo con patrón decorativo
de puntos de color naranja/azul disperso. Evidencia: `g4-ninjatrader/escritorio-claro__00.png`.

**Tipografía.** H1 en Montserrat 700, 46px/64.4px (interlineado muy generoso respecto al tamaño).
Cuerpo también Montserrat 400, 18px — sin contraste de familia, solo de peso; sans puro de extremo
a extremo.

**Color y superficies.** Fondo blanco, acento naranja (`rgb(255,66,0)`) y azul (`rgb(0,140,255)`)
para CTAs distintos según contexto. Esquinas a 0px en absolutamente todo (botones, tarjetas,
inputs) — la marca más "cuadrada" del grupo. Separación de sección por franjas grises/negras
alternas con el fondo blanco.

**Modo oscuro.** No existe: `respetaModoOscuro: false`, siempre claro.

**Ritmo y densidad.** 9207px de alto, 17 secciones — mucho contenido pero bien troceado en
bloques cortos con su propio icono; usa patrón de puntos decorativo para rellenar el espacio vacío
lateral en vez de dejarlo en blanco puro.

**Reglas y cifras.** Tabla comparativa "Futures Vs Other Leveraged Products" con 4 columnas
(Futures, CFDs, Turbos, OTC Forwards) y filas (Trading venue, Pricing and spreads, Standardization,
Counterparty Structure, Cost structure, Leverage and margin) — la tabla explicativa mejor resuelta
del grupo para comparar instrumentos, no solo planes de precio
(`g4-ninjatrader/escritorio-claro__02.png`, `escritorio-claro__03.png`).

**Confianza y cumplimiento.** Sello "READERS' CHOICE AWARD" fotografiado como objeto físico (no
badge plano), bloque "Recognition" con dos premios con año y fuente. Descargo de riesgo extenso en
el pie, con identificación de entidad regulada por Chipre/CySEC (`g4-ninjatrader/escritorio-
oscuro__01.png`).

**Navegación y pie; móvil.** Nav con selector de idioma explícito (7 idiomas listados). En móvil,
los mockups de dispositivo (monitor+móvil, tablet) se reescalan pero mantienen protagonismo visual;
la tabla comparativa de 4 columnas se mantiene tal cual y se estrecha en vez de convertirse en
acordeón — se lee peor en pantalla pequeña.

**Detalles finos.** Iconos circulares de línea fina (no relleno), pestañas "Mobile Apps / NinjaTrader
Desktop / NinjaTrader Web" para alternar contenido de la misma sección, tono corporativo-técnico
sin urgencia ni cupones.

**Adaptar a CountPips:**
1. Tabla comparativa de instrumentos/conceptos (no solo de planes) para explicar diferencias técnicas — aplicable a "cómo se calcula el Sharpe/Sortino/Omega" o a "manual vs prop firms".
2. Mockup de dispositivo real (monitor) mostrando la app de escritorio tal cual, en vez de solo un recorte de pantalla plano — refuerza que es software nativo instalable.
3. Pestañas para alternar entre "vistas" de un mismo concepto (Desktop/Web/Mobile) en vez de scroll infinito — aplicable a mostrar la demo en distintos contextos.

**No imitar:** dejar una tabla comparativa de 4 columnas sin adaptar en móvil (solo se estrecha) — en pantallas pequeñas se vuelve difícil de leer sin zoom.

---

## 7. Tradovate — `g4-tradovate/`

**Primer pliegue.** Titular en mayúsculas «TRADE MICRO FUTURES FOR AS LOW AS $0.09/CONTRACT» sobre
banda azul sólida, con carrusel de mensajes rotando (puntos de paginación visibles) y mockup de
monitor+móviles con gráficos reales. Banner de cookies de ancho completo fijo abajo. Evidencia:
`g4-tradovate/escritorio-claro__00.png`.

**Tipografía.** H1 en Roboto 600, 52px/52px. Párrafo en Open Sans 400, 16px/26.56px — combinación
sans genérica sin personalidad tipográfica marcada; se nota una web más antigua/funcional que de
marca.

**Color y superficies.** Fondos transparentes/blancos, azul (`rgb(69,148,200)`) y verde
(`rgb(97,188,70)`) para CTAs sin relación aparente entre ambos (dos acentos compitiendo). Esquinas
a 0px, estilo muy plano y años 2015-2018 en su lenguaje visual.

**Modo oscuro.** No existe (`respetaModoOscuro: false`).

**Ritmo y densidad.** Solo 4169px de alto en escritorio (la web comercial más corta del grupo,
`secciones: 0` — no usa `<section>` semántico), con seis bloques de icono+texto en grid 2×3 muy
apretado (`g4-tradovate/escritorio-claro__00.png`).

**Reglas y cifras.** Tabla de precios de 3 columnas (Free/Monthly/Lifetime) con comisión por
contrato desglosada por tipo de futuro (Micros, Standard, Nano) — transparencia de precio por
unidad, no solo una cifra final (`g4-tradovate/escritorio-claro__01.png`).

**Confianza y cumplimiento.** Fila de logos "AS FEATURED IN" (Built In Chicago, Benzinga, Futures
Magazine), logos de exchanges/cámaras de compensación (CME Group, ICE, Coinbase Derivatives) como
sello de seriedad institucional. Pie con descargo regulatorio extenso (CFTC, NFA member ID) en
texto de 10px gris (`g4-tradovate/escritorio-claro__01.png`).

**Navegación y pie; móvil.** Nav con 6 grupos de menú (Platform, Trading, Prop Trading, Pricing,
Knowledge). En móvil el layout de precios pasa a apilado vertical simple, funcional pero sin
adaptación especial.

**Detalles finos.** Widget de accesibilidad flotante (icono azul circular), sin elementos 3D ni
urgencia — la web con la estética más "software B2B clásico" del grupo.

**Adaptar a CountPips:**
1. Precio desglosado por unidad de uso (comisión por contrato/tipo) cuando aplique, en vez de un solo número — transparencia de coste real.
2. Logos de "featured in" / integraciones (CME, ICE) como sello de seriedad técnica cuando existan menciones o integraciones reales que citar.
3. Widget de accesibilidad visible explícitamente — señal de cuidado que pocas de las 10 webs muestran.

**No imitar:** dos colores de acento (azul y verde) usados indistintamente en CTAs sin una regla clara de cuándo usar cada uno — genera ambigüedad sobre cuál es la acción principal.

---

## 8. MetaTrader 5 — `g4-mt5/`

**Primer pliegue.** Titular sobrio «The Industry Standard for Traders and Brokers», mockup de
monitor curvo mostrando la plataforma con gráficos de velas, dos CTA (Download / WebTerminal) y
enlaces de descarga por sistema operativo (macOS, Linux, App Store, Google Play, AppGallery).
Evidencia: `g4-mt5/escritorio-claro__00.png`.

**Tipografía.** H1 en Open Sans 400 (sin negrita), 40px/50px — es la única web del grupo con un H1
en peso regular, no bold; se apoya en el tamaño, no en el peso, para jerarquizar.

**Color y superficies.** Fondo blanco, azul corporativo (`rgb(60,117,210)`) como único acento.
Esquinas a 0px. Densidad de grid muy alta: 8 bloques de producto en mosaico 2×4 con captura de
pantalla pequeña cada uno (MetaTrader Market, Trading Signals, Freelance, Virtual Hosting, Finteza,
MetaTrader.com, MQL5) — funciona como directorio de sub-productos, no como página de venta única.

**Modo oscuro.** No existe (`respetaModoOscuro: false`).

**Ritmo y densidad.** Solo 2939px de alto, pero extremadamente denso para esa altura: `titulos`
lista 11 H2 sin ningún H1 adicional ni respiro entre ellos — cero espacio en blanco entre bloques
de producto (`g4-mt5/escritorio-claro__00.png`).

**Reglas y cifras.** No hay tabla de reglas ni de precios en esta página — MetaTrader 5 es software
gratuito distribuido por brokers, así que el "producto" aquí es la descarga, no un plan.

**Confianza y cumplimiento.** Collage de medallas/trophies pequeños en miniatura ("MetaTrader
Market" ribbon de premios) y dos bloques de "Best Multi-Asset Trading Platform" con años acumulados
2017-2025 (`g4-mt5/escritorio-claro__01.png`) — el sello de premio como imagen de trofeo 3D
renderizado, repetido dos veces con distinto premio.

**Navegación y pie; móvil.** Nav mínima (Trading Platform, Download, For Hedge Funds, For Brokers,
Find Broker, Company). En móvil el grid 2×4 pasa a una columna simple, cada bloque conserva su
captura de pantalla pequeña (`g4-mt5/movil-claro__00.png`).

**Detalles finos.** Iconos de marca de cada sub-producto (Finteza, MQL5) en vez de iconografía
genérica, capturas de pantalla reales de baja resolución usadas directamente como imagen de
marketing sin recorte ni mockup de dispositivo.

**Adaptar a CountPips:**
1. Enlaces de descarga por plataforma agrupados justo bajo el CTA principal (aunque CountPips solo tenga Windows, el patrón de "aquí tienes exactamente lo que necesitas para tu sistema" es válido para Core/Pro).
2. Usar el peso tipográfico (no solo el tamaño) como herramienta de jerarquía adicional en el H1.
3. Directorio de "qué incluye" en mosaico cuando hay varios sub-productos reales que mencionar (glosario, calculadora, plantillas CSV) en vez de forzarlos todos en el héroe.

**No imitar:** usar capturas de pantalla reales sin recortar ni enmarcar como imagen de marketing — se ven pequeñas, de baja resolución percibida y sin jerarquía frente al texto que las rodea.

---

## 9. cTrader (Store) — `g4-ctrader/`

**Primer pliegue.** Titular «Everything you need to trade», barra de filtros por categoría
(Popular indicators/Trending now/Free cBots/Copy) y grid de productos (robots de trading) con
precio, rating y sello "Live stats". Banner de cookies + notificación flotante simultáneos.
Evidencia: `g4-ctrader/escritorio-claro__00.png`.

**Tipografía.** H1 en Arial 700, 48px/54px — la única web del grupo que declara Arial explícito
como fuente principal (sin fuente webfont propia cargada, `fuentesCargadas: ["swiper-icons"]`
únicamente). Tipográficamente es la más genérica del grupo.

**Color y superficies.** Fondo gris muy claro (`rgb(245,248,250)`) en modo claro. Acentos
multicolor por categoría de producto (naranja, morado, verde) en vez de un acento único de marca —
funciona como marketplace, no como landing de producto único.

**Modo oscuro — el mejor del grupo.** Es la única de las 10 webs que **sí respeta** de verdad la
preferencia del sistema: fondo pasa de `rgb(245,248,250)` a `rgb(22,22,22)`, texto de
`rgba(0,0,0,0.9)` a `rgba(255,255,255,0.95)`, y los botones invierten su color (`respetaModoOscuro:
true`, verificado en `datos.json`). Comparar `g4-ctrader/escritorio-claro__00.png` vs.
`g4-ctrader/escritorio-oscuro__00.png`: misma composición exacta, superficies y contraste
correctamente invertidos sin perder legibilidad.

**Ritmo y densidad.** 7598px de alto, `secciones: 0` (sin `<section>` semántico) pero visualmente
organizado por franjas de fondo gris/blanco alternas para separar bloques de producto.

**Reglas y cifras.** No aplica tabla de reglas (es un marketplace de bots/indicadores, no un
programa de evaluación). Sí presenta tarjetas de estrategia de copia con ROI y antigüedad
("iloveyou global — 10915% ROI, 2M") con gráfico de área en verde y aviso legal corto justo debajo
("Copy trading involves significant risk...") — el aviso de riesgo está pegado al dato de
rendimiento, no relegado al pie (`g4-ctrader/escritorio-claro__01.png`).

**Confianza y cumplimiento.** Bloque de cifras (Active products: 2000, Active sellers: 300,
Downloads per day: 500), sello "Sellers verified by Sumsub" y "14-day money-back guarantee with
Nuvei" con logos de los proveedores de verificación/pago, no solo texto.

**Navegación y pie; móvil.** Footer extensísimo con 4 columnas (Products & tags, Business &
sellers, Brokers & props, Support & trust) incluyendo enlaces "List of props" y "Compare prop
firms" — cTrader se posiciona como hub neutral del ecosistema prop-firm. Badges de disponibilidad
por plataforma (Windows, macOS, App Store, Google Play, App Gallery, Amazon, Galaxy Store) en fila
(`g4-ctrader/escritorio-claro__03.png`). En móvil, banner promocional propio ("Live Bot Arena 2.0")
se apila sobre el banner de cookies, doblando la altura de interrupciones antes del contenido
(`g4-ctrader/movil-claro__00.png`).

**Detalles finos.** Notificación con badge numérico (contador "1") en el chat flotante, imágenes de
producto tipo carátula de videojuego para los bots (con nombre e ilustración llamativa) — tono más
"marketplace de apps" que "institución financiera".

**Adaptar a CountPips:**
1. Implementar de verdad `prefers-color-scheme` con inversión de superficie y texto coherente — es el único ejemplo del grupo que lo hace bien y CountPips ya lo hace también, así que sirve como validación cruzada del enfoque actual.
2. Colocar el aviso de riesgo pegado al dato de rendimiento que lo motiva (junto al ROI, no solo en el pie) — aplicable a las cifras de Sharpe/expectancy de la demo de CountPips.
3. Fila de "verificado por X / garantía de Y" con logos de terceros reales como refuerzo de confianza puntual, no como sello genérico.

**No imitar:** apilar un banner promocional propio encima del banner de cookies en móvil — duplica la fricción de cierre antes de ver contenido real.

---

## 10. Sierra Chart — `g4-sierrachart/`

**Primer pliegue.** Logo de montaña, titular «Sierra Chart - High Performance Trading Platform»
sobre banda azul, y de inmediato un muro de texto en bullets bajo "Introduction" explicando qué es
el software — sin imagen de producto, sin CTA visual destacado más allá de un enlace de texto
subrayado. Evidencia: `g4-sierrachart/escritorio-claro__00.png`.

**Tipografía.** H1 en Verdana/Arial 700, 31.46px, interlineado "normal" (no especificado en px) —
tipografía de sistema sin webfont, tamaño modesto para un titular. Cuerpo en sans-serif genérica
13px.

**Color y superficies.** Fondo gris muy claro (`rgb(235,237,236)`), navegación en menús desplegables
estilo aplicación de escritorio (grises con relieve), botones amarillo/verde brillante sin relación
cromática entre sí ni con la marca (azul del logo). Es una tabla HTML clásica con recuadros de
borde azul, no un layout de secciones modernas.

**Modo oscuro.** Tiene un botón manual "Toggle Dark Mode" pero **no** sigue la preferencia del
sistema — el fondo es idéntico en `escritorio-claro` y `escritorio-oscuro` (`respetaModoOscuro:
false`); el toggle es una acción de usuario, no una respuesta automática al sistema operativo.

**Ritmo y densidad.** Solo 2119px de alto pero con `secciones: 0` y toda la información en listas
de viñetas largas sin jerarquía visual real más allá de encabezados de sección en franjas azules —
la web más densa en texto por pixel de todo el grupo, sin apenas espacio en blanco.

**Reglas y cifras.** No hay tabla de precios ni de reglas — es una web informativa de producto de
escritorio con enlaces a documentación externa.

**Confianza y cumplimiento.** No hay testimonios, logos de prensa ni cifras de usuarios. La única
señal de seriedad es un sello "DTC Compatible" y un grid de 12 capturas de pantalla del software en
miniatura sin contexto (`g4-sierrachart/escritorio-claro__00.png`).

**Navegación y pie; móvil.** El "responsive" en móvil es la misma tabla HTML reflowada a una
columna estrecha, sin adaptación de tamaño de fuente ni reorganización real de contenido
(`g4-sierrachart/movil-claro__00.png`, `movil-claro__01.png`) — se lee, pero exige mucho scroll y
zoom mental.

**Detalles finos.** Texto con tono peculiar y poco convencional para una web de producto financiero
("We are not woke or insane", "100% certified AI-free software") — personalidad fuerte pero
alejada del tono institucional/sobrio que busca CountPips.

**Adaptar a CountPips (con matiz — aquí el listón es "qué evitar" más que "qué copiar", pero aun así hay algo rescatable):**
1. El principio de documentar cada característica con precisión técnica (protocolos soportados, tipos de datos) es correcto — pero debe ir en una página de especificaciones, no sustituir la landing comercial.
2. Un enlace corto y directo a "Get Started (Free Trial)" destacado en verde brillante, como único punto de conversión claro entre el ruido — el principio de un CTA inconfundible se salva aunque el resto no.
3. Mostrar capturas reales de la interfaz es correcto (CountPips ya lo hace) — la lección aquí es que deben estar enmarcadas y curadas, no en grid crudo sin contexto.

**No imitar:** el conjunto completo del enfoque — layout de tabla HTML años 2000, muro de viñetas sin jerarquía, tono editorializante fuera de lugar, cero adaptación real a móvil y un botón de modo oscuro manual que no conecta con la preferencia del sistema. Es la referencia más clara de "qué no hacer" de las 10.

---

## Patrones del grupo

1. **El negro puro como base de marca en prop firms "modernas".** FTMO, Topstep, The5ers y
   FundedNext usan fondo negro/casi-negro fijo (no derivado del modo oscuro del sistema, es su
   única identidad). Evidencia: `g4-ftmo/escritorio-claro__00.png`, `g4-topstep/escritorio-
   claro__00.png`, `g4-5ers/escritorio-claro__00.png`, `g4-fundednext/escritorio-claro__00.png`
   (los cuatro con `fondoBody` en negro tanto en `datos.json` claro como oscuro).

2. **Modales de cookies bloqueando literalmente el titular en la primera carga.** FTMO, Apex,
   The5ers, FundedNext, NinjaTrader, Tradovate y MT5 muestran el banner/modal superpuesto al hero
   antes de cualquier interacción. Evidencia: `g4-ftmo/escritorio-claro__00.png`, `g4-apex/
   escritorio-claro__00.png`, `g4-5ers/escritorio-claro__00.png`, `g4-ninjatrader/escritorio-
   claro__00.png`.

3. **Reglas de evaluación presentadas siempre como tabla/tarjeta comparable, nunca como párrafo.**
   FTMO (`escritorio-claro__01.png`), The5ers (`escritorio-claro__01.png`), FundedNext (`movil-
   claro__01.png`), Apex (`escritorio-claro__01.png`) — las cuatro prop firms de challenge usan el
   mismo patrón de filas idénticas por columna de plan.

4. **Cifras de marca en formato "número grande + etiqueta pequeña", casi siempre en franja
   horizontal de 3-4 bloques.** Topstep (`escritorio-claro__00.png`: $1.4B+/6,998+/15 Years/140+),
   The5ers (`escritorio-claro__02.png`: 262K/10/171), FundedNext (`escritorio-claro__02.png`:
   $382.4M+), Apex (`escritorio-claro__00.png`: 28.53M/868.48M/75.96M).

5. **Mockups de dispositivo real (monitor curvo/plano + móvil) para mostrar la plataforma, en vez
   de solo un recorte de pantalla.** NinjaTrader (`escritorio-claro__00.png`), Tradovate
   (`escritorio-claro__00.png`), MetaTrader 5 (`escritorio-claro__00.png`) — las tres plataformas
   de trading (no prop firms) comparten este recurso.

6. **Muros de testimonios/reseñas en grid denso como prueba social principal.** The5ers
   (`escritorio-claro__00.png`, carrusel), FundedNext (`escritorio-oscuro__01.png`, masonry de
   decenas de tarjetas), Apex (`escritorio-claro__01.png`) — todas las prop firms de reto se apoyan
   en volumen de reseñas visibles simultáneamente, no en una selección curada de 3-4.

7. **Descargos de riesgo/regulación relegados a texto gris pequeño en el pie, nunca integrados en
   el flujo principal.** Topstep (`escritorio-claro__02.png`), Apex (`escritorio-claro__04.png`),
   NinjaTrader (`escritorio-oscuro__01.png`), Tradovate (`escritorio-claro__01.png`) — patrón
   consistente en las cuatro.

8. **El modo oscuro real (ligado a `prefers-color-scheme`) es la excepción, no la norma.** De las
   10 webs, solo cTrader lo implementa de verdad (`respetaModoOscuro: true` en su `datos.json`);
   las otras nueve son o bien "siempre oscuras" (FTMO, Topstep, The5ers, FundedNext) o bien
   "siempre claras" (Apex, NinjaTrader, Tradovate, MT5, Sierra Chart) sin variar con el sistema.

9. **Ofertas con countdown y cupón como elemento fijo de cabecera.** Apex ("Ends in 1d 18h 53m"),
   FundedNext ("Stellar Instant 30% Off"), The5ers ("Boost..."). Evidencia: `g4-apex/escritorio-
   claro__00.png`, `g4-fundednext/escritorio-claro__00.png`, `g4-5ers/escritorio-claro__00.png`.

10. **Iconografía 3D/glossy como acento decorativo en prop firms de nueva generación**, frente a
    iconos de línea plana en las plataformas de trading más técnicas (NinjaTrader, Tradovate).
    Evidencia: `g4-fundednext/escritorio-claro__01.png` (estrellas moradas), `g4-apex/escritorio-
    claro__00.png` (toro cromado), vs. `g4-ninjatrader/escritorio-claro__00.png` (círculos de línea
    fina).

11. **Tablas de datos "en vivo" (spreads, ROI de copy-trading) usadas como prueba de transparencia
    técnica**, no solo como claim. The5ers (`escritorio-claro__03.png`, spreads bid/ask reales),
    cTrader (`escritorio-claro__01.png`, ROI y antigüedad de estrategias de copia).

12. **La adaptación de tablas anchas a móvil separa claramente a las webs bien resueltas de las
    mal resueltas.** The5ers y FundedNext convierten la tabla en desplegable + comparación de 2
    columnas (`g4-5ers/movil-claro__01.png`, `g4-fundednext/movil-claro__01.png`); NinjaTrader y
    Sierra Chart simplemente estrechan la misma tabla ancha (`g4-ninjatrader/escritorio-
    claro__02.png` reflowed, `g4-sierrachart/movil-claro__00.png`).

## Errores del grupo (a evitar)

- **Bloquear el titular con el modal de cookies en el primer segundo** (FTMO, Apex) — la primera
  impresión de la marca es literalmente una superposición gris, no el mensaje que se quiso
  comunicar.
- **Apilar countdown + cupón + modal de cookies simultáneamente**, sobre todo en móvil (Apex,
  `g4-apex/movil-claro__00.png`) — la pantalla entera se llena de capas de interrupción antes de
  cualquier contenido.
- **Layout de tabla HTML sin adaptación real a móvil ni al modo oscuro del sistema** (Sierra
  Chart) — funciona, pero exige un esfuerzo de lectura que ninguna otra web del grupo exige.
- **Grid de capturas de pantalla reales sin recorte, enmarcado ni contexto** (MetaTrader 5,
  `escritorio-claro__00.png`) — se perciben como low-effort pese a representar un producto serio.
- **Descargo de riesgo y datos regulatorios relegados por completo al pie en texto mínimo**
  (Topstep, Apex, NinjaTrader, Tradovate) — dado que CountPips ya cuida el tono de cumplimiento
  (modo prop firm, Guardián), integrar el aviso donde vive el dato relevante (como hace cTrader)
  es más coherente con esa posición que copiar el patrón dominante del grupo.
- **Repetir el mismo sello de premio varias veces sin variarlo** (The5ers, cuatro veces "2025") —
  resta más credibilidad de la que suma.

## Dudas / puntos ambiguos

- El `colorScheme: "light"` declarado en el HTML de FundedNext no se corresponde con su diseño
  real (siempre oscuro) — podría ser un descuido de su equipo o un valor heredado que no afecta al
  render; no se pudo confirmar la causa sin inspeccionar su CSS fuente, fuera del alcance de esta
  auditoría visual.
- `www.ctrader.com` redirige/sirve directamente la sección "Store" (marketplace de bots) como
  portada — no está claro si existe una landing de producto cTrader separada de la tienda en ese
  mismo dominio; se analizó lo que efectivamente cargó la URL pedida.
- El geo-targeting detectado en NinjaTrader ("For Spanish Traders", "Explore Popular Futures
  Contracts In Spain") sugiere que el contenido varía por IP/localización del visitante; el
  análisis aquí refleja lo que se vio con la IP de esta sesión, no necesariamente lo que ve un
  visitante en otra región.
