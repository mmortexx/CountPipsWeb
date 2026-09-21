# Informe grupo 3 — Diarios de trading y herramientas de análisis (competencia directa)

Método: captura automatizada (Playwright, escritorio 1440 claro/oscuro y móvil 390) de las 10 webs
pedidas. Ninguna estaba bloqueada por anti-bot ni requirió sustitución. Todas las observaciones
visuales citan el fichero de imagen que las respalda; los datos de tipografía/color citan
`datos.json` de la carpeta correspondiente. CountPips se capturó también (carpeta `countpips/`) solo
como referencia interna, no cuenta como una de las 10.

Carpeta base: `scratchpad/referentes/` — cada web en `g3-<nombre>/`.

---

## 1. TraderSync — tradersync.com

**Primer pliegue.** Fondo negro absoluto (`fondoBody: rgb(0,0,0)`, datos.json). Titular "The Trading
Journal That Tells You How to Win." con foto/capturas de la app desenfocadas de fondo (tickets de
P&L, "Running PnL"). Dos CTA compitiendo: "Start Free Trial" (relleno morado) y "Guide Tour" (texto).
Un modal de cookies se solapa sobre el hero nada más cargar, tapando parte del texto.
Evidencia: `g3-tradersync/escritorio-claro__00.png`.

**Tipografía.** Una sola familia, Manrope, en todo el sitio. H1 50px/700, tracking -2px, interlineado
68px (datos.json). Cuerpo tan pequeño como 12px en algunos bloques. Sans puro, sin contraste serif.

**Color y superficies.** Negro puro + acentos morado/azul eléctrico y gradientes neón verde-morado en
las tarjetas de producto ("Meet Cypher", "Backtest Strategies", "Smart Analytics" —
`escritorio-claro__00.png`). Tarjetas oscuras con bordes muy sutiles, sin cantos redondeados grandes.

**Modo oscuro.** No lo respeta: `fondoBody` es idéntico en pasada clara y oscura (`rgb(0,0,0)`) porque
el sitio nace y se queda siempre oscuro. `respetaModoOscuro: false`.

**Ritmo y densidad.** Alto de página 17.401px, el segundo más largo del grupo. Secciones muy
espaciadas en negro, con imágenes de producto en perspectiva 3D y gradientes de neón
(`escritorio-claro__01.png`, `__02.png`).

**Cómo enseñan el producto.** Mockups en perspectiva del dashboard, del simulador de repetición de
mercado (`escritorio-claro__04.png`) y del coach de IA "Cypher" con un chat conversacional y un
gráfico R-multiple actual vs proyectado (`escritorio-claro__03.png`).

**Precios y oferta.** No visible en el tramo analizado; el CTA principal es prueba gratis de 7 días.

**Prueba social y confianza.** No hay cifras ni testimonios en el primer tramo capturado.

**Navegación/pie.** Products, Analytics, Market Replay Simulator, AI Performance Assistant, Pricing,
Supported Brokers, redes sociales (datos.json `navLinks`).

**Móvil.** Misma paleta negra, tarjetas de producto en carrusel horizontal
(`movil-claro__00.png`, `__01.png`); nada se pierde funcionalmente, solo se apila.

**3 cosas a adaptar (principio, no diseño):**
1. Usar capturas reales del producto en contexto (con leve profundidad/sombra) en vez de íconos
   genéricos, para que cada bloque de función se entienda de un vistazo.
2. Nombrar y personificar la parte de IA/automatización (aquí "Cypher") ayuda a que se recuerde;
   CountPips podría dar nombre propio a su guardián de disciplina.
3. Reducir a un único CTA por pliegue — aquí compiten dos y se diluye la acción principal.

**1 cosa a NO imitar:** el modal de cookies que tapa el titular nada más cargar
(`escritorio-claro__00.png`) — daña la primera impresión real, no la de marketing.

**Diferencia ya existente de CountPips:** CountPips no compite en "negro absoluto + neón", ocupa el
extremo opuesto (blanco/gris frío, serif grande) — evita el look "SaaS de trading agresivo" que
comparten varias de estas webs.

---

## 2. Edgewonk — edgewonk.com

**Primer pliegue.** Fondo blanco verdoso muy pálido. H1 "Automated trading journal that turns your
data into profits" en Roboto 40px/**400** (no negrita: se apoya en el tamaño, no en el peso) con las
palabras clave coloreadas en verde. Bullets de credibilidad en mayúsculas pequeñas ("Weekly product
updates · Automated imports · 8M+ trades journaled · AI-driven analysis"). Un solo CTA sólido verde
"Get Edgewonk →". Debajo, una captura real del dashboard partida en dos mitades, una en tema claro y
otra en tema oscuro, con un banner de cookies GDPR completo (Accept/Decline/Cookie settings) encima.
Evidencia: `g3-edgewonk/escritorio-claro__00.png`.

**Tipografía.** H1 en Roboto 40px/400, cuerpo en Lato 14px azul marino oscuro (`rgb(21,41,90)`,
datos.json). Sans/sans, sin contraste.

**Color y superficies.** Verde bosque + blanco, iconos en círculos de menta suave para las 3 tarjetas
de confianza ("Privacy First", "Highest Security", "Decade of Trust", `escritorio-claro__00.png`).
Secciones separadas por franjas alternas blanco/verde muy pálido, sin sombras duras.

**Modo oscuro.** No lo respeta como preferencia de sistema (`fondoBody` idéntico en ambas pasadas).
Curiosamente el propio dashboard capturado en la imagen de marketing SÍ muestra mitad clara/mitad
oscura — es una foto de que el producto tiene tema oscuro, no que la web lo tenga.

**Ritmo y densidad.** Alto 11.287px, uno de los más compactos del grupo. Cada bloque combina una
imagen de producto REAL (no ilustración) con 2-4 bullets de check verde. Buen equilibrio de vacío.

**Cómo enseñan el producto.** Capturas reales de reportes: rendimiento por instrumento, calendario de
"trading psychology" con emociones etiquetadas, heatmap de aciertos/errores, gráfico de drawdown en
rojo (`escritorio-claro__01.png`, `__02.png`, `__03.png`). Insisten mucho en psicología, no solo en
números.

**Precios y oferta.** "BUY NOW" sugiere pago único o licencia, con oferta temporal ("Buy now & get 4
months free on top — offer ends in:", `datos.json` titulos) — usa urgencia con cuenta atrás.

**Prueba social y confianza.** Tres tarjetas explícitas de confianza (privacidad, seguridad, una
década de trayectoria) situadas muy pronto en el scroll — es el único del grupo que dedica un bloque
entero solo a "por qué confiar", antes incluso de explicar features a fondo.

**Navegación/pie.** Features (submenú con Chart Lab, Edge Finder, Psychology Lab, Feature Overview),
Pricing, Supported Brokers, For Traders, Help, BUY NOW, LOGIN.

**Móvil.** Mismos bloques, misma densidad de imágenes (105 imágenes cargadas, datos.json), el modal
de cookies ocupa buena parte de la pantalla en el primer segundo (`movil-claro__00.png`).

**3 cosas a adaptar:**
1. Dedicar un bloque explícito y temprano a "por qué confiar" (privacidad, seguridad, trayectoria)
   como sección propia, no diluido entre features — encaja con el mensaje "tus datos en tu equipo".
2. Usar el peso normal (400) en un titular grande en vez de negrita: transmite calma/sobriedad, algo
   coherente con el tono institucional que ya persigue CountPips.
3. Apoyar cada afirmación de feature con una captura real de esa pantalla exacta, sin genéricos.

**1 cosa a NO imitar:** el banner de cookies de tres botones que ocupa gran parte del hero visible
(`escritorio-claro__00.png`) — es el más invasivo del grupo en el primer segundo.

**Diferencia ya existente de CountPips:** CountPips ya resuelve "tus datos en tu equipo" de forma más
radical (sin nube en absoluto) que el mensaje de Edgewonk ("no vendemos ni analizamos tus datos", pero
sigue siendo SaaS en la nube) — es un argumento de privacidad más fuerte y debería subrayarse así.

---

## 3. Tradervue — tradervue.com

**Primer pliegue.** Fondo casi blanco (`rgb(252,252,252)`). H1 gigante "The Trading Journal to
Improve Your Trading Performance" en Manrope 70px/**800**, azul marino casi negro. Un único CTA verde
"Sign Up". Debajo, fila de avatares circulares + 5 estrellas + "Join 207,623 traders and see why they
believe Tradervue is the best trading journal" y, inmediatamente, una cuadrícula de 12 tarjetas de
testimonios con foto real, nombre y estrellas — prueba social muy arriba y muy densa.
Evidencia: `g3-tradervue/escritorio-claro__00.png`.

**Tipografía.** Manrope 70px/800 para H1 (el peso más alto de titular del grupo), subcopy 20px/600 en
azul grisáceo. Sans puro.

**Color y superficies.** Azul marino oscuro + verde menta como único acento de botón; capturas de
producto encajadas dentro de mockups de laptop con sombra realista, en vez de a pantalla completa
(`escritorio-claro__01.png`, `__02.png`).

**Modo oscuro.** No lo respeta (`fondoBody` idéntico). Tiene una sección "Choose Your Theme" que
muestra, dentro de un mockup de laptop, que el PRODUCTO admite temas de color — otra vez es una
demostración de una función interna, no del sitio de marketing.

**Ritmo y densidad.** Alto 9.697px, de los más cortos del grupo. Bloques alternos texto/imagen con
mucho aire, todo enmarcado en laptops.

**Cómo enseñan el producto.** "Reports" (velas con marcadores de entrada/salida), "Trading Analysis"
(donuts de winrate), "Trading Journal" con notas por operación (`escritorio-claro__02.png`).

**Precios y oferta.** No visible en el tramo analizado; CTA es "Sign Up" sin fricción visible de
precio.

**Prueba social y confianza.** El punto más fuerte del grupo en este apartado: cifra exacta y no
redondeada (207.623 traders, transmite verificabilidad) + 12 testimonios reales con foto, nombre y
5 estrellas visibles ya en el primer scroll (`escritorio-claro__00.png`).

**Navegación/pie.** Features, Pricing, Supported Brokers, Help, Log In, Sign Up. Pie con comparativas
explícitas ("Tradersync Alternative", "Trademetria Alternative", "Edgewonk Alternative") — SEO
agresivo contra competidores nombrados directamente (`escritorio-claro__04.png`).

**Móvil.** **Hallazgo verificado en `datos.json`:** en la pasada móvil, `h1.texto` llega vacío
(`"h1": {"texto": ""}` en `g3-tradervue/datos.json`, pasada `movil-claro`) — el H1 pierde su
contenido de texto en el DOM en móvil, un riesgo real de SEO/accesibilidad en esa versión responsive
(no es una suposición: es literalmente lo que devuelve `document.querySelector('h1').innerText` en esa
carga).

**3 cosas a adaptar:**
1. Mostrar una cifra de comunidad no redondeada (si CountPips tiene usuarios/descargas reales)
   transmite más confianza que una cifra redonda de marketing.
2. Encajar capturas de producto dentro de un mockup de dispositivo con sombra realista da sensación
   de "producto de escritorio real", coherente con que CountPips es una app nativa de Windows.
3. Comparativa directa y honesta con alternativas puede ser un recurso de SEO y de posicionamiento
   ("por qué pago único y no suscripción") sin necesidad de nombrar competidores de forma agresiva.

**1 cosa a NO imitar:** el ataque frontal a competidores nombrados en el pie ("X Alternative") — no
encaja con el tono "institucional, sobrio" que ya tiene CountPips y puede percibirse como poco
profesional.

**Diferencia ya existente de CountPips:** CountPips no depende de una landing con 12 fotos de
desconocidos para transmitir confianza — usa cifras de la propia demo (Sharpe, drawdown, expectancy)
como prueba, un enfoque más verificable que el testimonio genérico.

---

## 4. TradesViz — tradesviz.com

**Primer pliegue.** Fondo blanco/transparente. H1 extremadamente largo y saturado de palabras clave:
*"AI-Powered Trading Journal that helps you improve performance track every trade reduce mistakes
find trade ideas automate trade tracking practice trading"* (150+ caracteres, ver `datos.json` campo
`h1.texto`) — prioriza el SEO sobre la claridad del mensaje. Dos CTA: "Start Free Trial" y un campo de
email en línea. Badges: "200,000+ Active traders" y 3 sellos "Global Fintech Awards Finalist".
Evidencia: `g3-tradesviz/escritorio-claro__00.png`.

**Tipografía.** Inter en todo, H1 solo 36px/700 pese a su longitud (compensan lo largo con tamaño
moderado). Cuerpo 18px gris.

**Color y superficies.** Azul eléctrico + violeta como acentos, fondo blanco con tarjetas gris
clarísimo; capturas de producto dentro de mockups de navegador con los tres puntos de macOS
(`escritorio-claro__00.png`).

**Modo oscuro.** No lo respeta (`fondoBody` idéntico en ambas pasadas).

**Ritmo y densidad.** El más denso del grupo: 13 secciones, alto 13.577px, y ya en el primer scroll
una cuadrícula de **20 tarjetas de features** distintas (Trading Analytics, Pivot Grid, AI Coach,
Trading Calendar, Options Flow, Risk Simulator, etc., `escritorio-claro__00.png`,
`escritorio-claro__03.png`) — satura al visitante con opciones antes de convencerlo del valor
principal.

**Cómo enseñan el producto.** Comparativa explícita "TradesViz vs. Competitors" con vídeo, integración
con 250+ brokers en grid de logos con "100% Auto Sync" en cada uno (`escritorio-claro__01.png`),
simulador con 15.000+ tickers.

**Precios y oferta.** Tabla de 3 planes visible pronto en el scroll: **FREE / PRO / PLATINUM**, con
mensaje comparativo explícito "5x More Features 1/3rd the Price" (`datos.json` titulos) — compite
directamente en precio contra el resto del mercado.

**Prueba social y confianza.** 200.000+ traders activos, 3 sellos de premios fintech, "100M+ Trades
Analyzed".

**Navegación/pie.** Login, Sign up, Blog, Pricing, Getting Started, Supported Brokers, Glossary,
enlaces por activo (Stock/Futures/Forex/Crypto/Options Trading Journal) — nav muy larga y con fines
de SEO programático.

**Móvil.** **Detalle curioso:** el `<title>` de la pestaña en móvil aparece con un prefijo de contador
de chat: `"💬1 - TradesViz: Feature-filled Free..."` (`datos.json`, pasada `movil-claro`, campo
`titulo`) — un widget de soporte externo contamina el título de la pestaña sin que el sitio lo
controle.

**3 cosas a adaptar:**
1. Poner el precio y el modelo (pago único vs. suscripción) de forma comparativa y temprana, como
   hace aquí con "5x More Features 1/3rd the Price" — CountPips puede hacer lo mismo con "pago único
   vs. suscripción anual de la competencia".
2. Un simulador de práctica con activos reales (aquí 15.000+ tickers) es un gancho de producto fuerte
   si CountPips ya lo tiene o lo desarrolla.
3. Mostrar los brokers/plataformas compatibles en grid con logos reconocibles da sensación de
   ecosistema maduro.

**1 cosa a NO imitar:** el H1 saturado de palabras clave SEO en detrimento de la claridad — es el peor
titular del grupo en términos de legibilidad humana.

**Diferencia ya existente de CountPips:** CountPips no necesita comprimir 20 funciones en el primer
scroll; su titular es una sola frase clara. Frente al "más funciones más barato" de TradesViz, CountPips
puede seguir apostando por "menos ruido, más criterio" como eje de diferenciación.

---

## 5. TradeZella — tradezella.com

**Primer pliegue.** Fondo blanco con gradiente sutil rosa/lila en las esquinas. H1 "Meet Your AI
Trading Partner" en Inter Tight 80px/600, tracking -1.2px. CTA "Get Started" (píldora negra) junto a
"Excellent ★★★★★ 1,032 reviews on Trustpilot". Imagen hero: mockup de dashboard con tarjetas
flotantes superpuestas (P&L +$2.140, "Strategy shared", "Backtesting completed").
Evidencia: `g3-tradezella/escritorio-claro__00.png`.

**Tipografía.** Inter Tight (titulares, tracking negativo agresivo) + Inter (cuerpo). Contraste de
peso claro entre ambos.

**Color y superficies.** Blanco + degradados morado→magenta muy saturados en botones/iconos,
contrastado con secciones enteras en negro carbón (`rgb(10,13,37)`) para presentar "Zella AI"
(`escritorio-claro__01.png`) — el salto de tono es un recurso de diseño por sección, no ligado al
modo oscuro del sistema.

**Modo oscuro.** No lo respeta como preferencia de sistema (`fondoBody` idéntico en ambas pasadas,
`respetaModoOscuro: false`), pese a que la propia página combina bloques claros y oscuros como parte
fija del diseño.

**Ritmo y densidad.** Alto 13.599px, muy producido: 19 vídeos embebidos en escritorio (`datos.json`),
tarjetas con gradiente y sombra de color, iconos redondeados.

**Cómo enseñan el producto.** "Seis productos, un hub" (Automated Journal, Backtesting, Trade Replay,
AI Insights, Community, Prop Firm Sync). Chat de IA con ejemplos reales de conversación ("Why did I
lose money last week?" → respuesta cuantificada con cifras exactas, `escritorio-claro__01.png`).
Franja de métricas: "20.2B Trades journaled · 100K+ Traders trust us · 500+ Brokers connected · 4.8
Trustpilot" con logos de brokers reconocibles debajo (Interactive Brokers, FTMO, TopStep,
`escritorio-claro__00.png`).

**Precios y oferta.** No visible en el tramo analizado.

**Prueba social y confianza.** Cifra de Trustpilot + reviews + logos de brokers reconocibles — de los
más sólidos del grupo en credibilidad de marca.

**Navegación/pie.** Menú con descripciones inline de cada producto (mega-menú informativo), "For
Unprofitable/Developing/Profitable/Prop Firm Traders" como segmentación explícita por perfil de
trader.

**Móvil.** H1 baja a 40px manteniendo el mismo tracking negativo agresivo (-1.9px); mismo esquema de
color.

**3 cosas a adaptar:**
1. Segmentar el mensaje por perfil de trader (principiante/rentable/prop firm) en la navegación ayuda
   a que cada visitante se sienta hablado directamente — CountPips ya apunta a manuales y prop firms,
   podría hacerlo explícito en el menú.
2. Mostrar ejemplos reales y concretos de "pregunta → respuesta con cifra" humaniza cualquier feature
   de análisis/alertas sin necesidad de IA generativa.
3. Usar contraste de sección (bloque negro dentro de página blanca) para dar respiro visual y jerarquía
   entre bloques de distinta importancia, sin depender del modo oscuro del sistema.

**1 cosa a NO imitar:** la saturación de degradados morado/magenta y vídeos por todas partes — choca
con la sobriedad "casi sin color" que define a CountPips y diluye el mensaje institucional.

**Diferencia ya existente de CountPips:** frente al "hub de seis productos" de TradeZella, CountPips
es una sola herramienta enfocada y local — más fácil de explicar y de justificar como pago único.

---

## 6. Myfxbook — myfxbook.com

**No es una landing de producto: es un portal/comunidad en vivo.** El primer pliegue muestra un banner
publicitario de un bróker ("Double Your First Deposit — 50% Cashback") superpuesto a un mapa de
sesiones de mercado, y un modal de cookies GDPR con 3 botones. Debajo, directamente, listas de
"Recent Systems", "Recent Strategies", calendario económico en vivo, noticias, tablas de brokers con
rating, conversor de divisas y mapa de horarios — todo widgets de datos, sin argumentario de venta.
Evidencia: `g3-myfxbook/escritorio-claro__00.png`, `__01.png`, `__02.png`.

**Tipografía.** Roboto en todo. El H1 real está vacío de texto (`"h1": {"texto": ""}`, `datos.json`) —
confirma que no hay mensaje de producto, es un dashboard.

**Color y superficies.** Gris azulado neutro (`rgb(238,241,245)`) como fondo, rojo/verde semánticos
para pérdidas/ganancias, naranja de marca solo en el logo. Cero espacio en blanco: todo son tablas y
widgets pegados unos a otros.

**Modo oscuro.** No lo respeta.

**Ritmo y densidad.** Densidad máxima del grupo — sin jerarquía visual clara, todo compite por
atención al mismo nivel.

**Cómo enseñan el producto.** No lo enseñan como "producto": el propio dashboard de datos en vivo ES
la demostración. Nunca se explica una propuesta de valor en un titular.

**Precios y oferta.** No aplica en el tramo analizado; el modelo de negocio parece ser afiliación con
brókers (banners publicitarios en cada scroll).

**Prueba social y confianza.** Ratings con estrellas de servicios de terceros (VPS, prop firms,
programación de EAs) listados como directorio, no como testimonios de la propia herramienta.

**Navegación/pie.** Selector de 23 idiomas muy visible arriba a la derecha — el único del grupo con
localización tan extensa expuesta en el header.

**Móvil.** Misma estructura de widgets apilados, banner publicitario de bróker sigue presente
(`movil-claro__00.png`).

**3 cosas a adaptar:**
1. Un selector de idioma accesible y visible en el header si CountPips crece a más mercados (ya es
   bilingüe ES/EN; el patrón de exponerlo con bandera/código corto es reutilizable).
2. Mostrar datos "en vivo" como demostración de producto es un principio válido — CountPips ya lo hace
   mejor con su demo de 200 operaciones de muestra, con curva y métricas reales.
3. Nada más de esta web es recomendable como principio de diseño para una landing de marketing.

**1 cosa a NO imitar:** mezclar banners publicitarios de terceros con el contenido propio — diluye
cualquier percepción de marca propia y es lo más alejado del tono "institucional" que persigue
CountPips.

**Diferencia ya existente de CountPips:** la comparación aquí es casi total. CountPips no vende
espacio publicitario ni depende de afiliación con brokers, y presenta una propuesta de producto clara
en el primer segundo — algo que Myfxbook, pese a tener mucho más tráfico probablemente, no ofrece en
absoluto.

---

## 7. Kinfo — kinfo.com

**Primer pliegue.** Fotografía editorial en estudio: un móvil apoyado en ángulo sobre un cubo, con luz
dramática y fondo casi negro. Titular serif "Verified Trading Performance" en Playfair Display 72px,
peso 400, blanco, sobre foto. Subcopy en sans "circular" 18px. Un único CTA "Get Started" (píldora
blanca). Fila de avatares "Trusted by top verified traders". Modal de cookies discreto abajo a la
izquierda. Evidencia: `g3-kinfo/escritorio-claro__00.png`.

**Tipografía.** Mezcla serif (Playfair Display, para H1) + sans "circular" (cuerpo) — es el único del
grupo, junto a CountPips, que usa un serif de display fuerte en vez de sans puro en todo.

**Color y superficies.** Negro + blanco, con un único acento verde neón en el círculo de progreso de
la captura de producto ("7.1x"). Un solo color de acento usado con moderación, no varios como en
TradeZella o TraderSync.

**Modo oscuro.** No lo respeta como preferencia de sistema (`fondoBody` idéntico, aunque codificado en
formatos `lab()`/`oklab()` en vez de `rgb()`, `datos.json`), pero la propia página pasa de negro
fotográfico en el hero a blanco cálido en el resto — alternancia de tono por diseño, igual que
TradeZella.

**Ritmo y densidad.** El más corto de todo el grupo: alto 5.145px. Muy poco texto; cada función se
resuelve en un mockup de iPhone + 2 líneas (`escritorio-claro__00.png`).

**Cómo enseñan el producto.** Mockups de iPhone reales mostrando el diario y el "leaderboard" social.
Para "Take your trading anywhere" usan fotografía de estilo editorial/lifestyle (mano con teléfono
sobre un sofá de cuero, `escritorio-claro__01.png`) — enfoque emocional/aspiracional, no funcional.

**Precios y oferta.** No visible en el tramo analizado (existe enlace "Pricing" en nav).

**Prueba social y confianza.** Su propuesta central es la integridad del dato: "verificado a través de
la integración con brokers, no se puede manipular" — mensaje de confianza distinto al resto del grupo,
centrado en la fiabilidad del dato más que en el volumen de usuarios. Footer con disclaimers legales
visibles (Risk disclosure, Hypothetical performance, Educational disclaimer).

**Navegación/pie.** Minimalista: Features, Brokers, Pricing, Log in, Sign up.

**Móvil.** La misma jerarquía editorial se mantiene, con las fotos a ancho completo
(`movil-claro__00.png`, `__01.png`).

**3 cosas a adaptar:**
1. Un único acento de color usado con moderación (aquí verde neón) permite que ese color signifique
   siempre lo mismo (progreso positivo) — CountPips podría reservar su color de acento (si añade uno)
   solo para el estado "en regla"/positivo del guardián de disciplina.
2. El mensaje "verificado, no se puede manipular" es un ángulo de confianza distinto al genérico
   "muchos usuarios" — CountPips podría explorar un ángulo similar sobre la integridad de sus cálculos
   locales.
3. Disclaimers legales visibles y ordenados en el footer, no escondidos, transmiten seriedad
   regulatoria sin necesidad de un footer sobrecargado.

**1 cosa a NO imitar:** apoyar tanto peso emocional/aspiracional en fotografía de stock-editorial
(mano con móvil en sofá de cuero) en vez de en datos del propio producto — para un producto de
escritorio con métricas reales como CountPips, esto sería un paso atrás respecto a su enfoque actual
basado en cifras verificables.

**Diferencia ya existente de CountPips:** ambos comparten la apuesta serif+sobriedad, pero CountPips
ya lo respalda con cifras de producto reales (Sharpe, drawdown, expectancy) en el propio hero, mientras
Kinfo se apoya en fotografía y solo una cifra de ejemplo (7.1x) sin contexto.

---

## 8. Trademetria — trademetria.com

**Primer pliegue.** Fondo blanco, badge "Trusted by 80,000+ users since 2016" centrado arriba. H1
"Trading Journal for Traders and Investors" en Public Sans 56px/700, tracking -1.68px. Subcopy más
grande de lo habitual (26px) en gris casi negro. Un único CTA "Get started for free" + enlace de texto
"Explore benefits →". Cita en cursiva "Best trading journal in the market" con 5 estrellas ya en el
hero. Imagen: captura real de dashboard con datos de mercado en vivo (Gold, Crude Oil, BTC/USD, S&P
500). Evidencia: `g3-trademetria/escritorio-claro__00.png`.

**Tipografía.** Public Sans en todo (una sola familia sans).

**Color y superficies.** Azul marino + blanco, cuadrícula de fondo con líneas punteadas sutiles detrás
del dashboard (efecto técnico/blueprint).

**Modo oscuro.** No lo respeta.

**Ritmo y densidad.** Alto 13.552px, 16 secciones muy repetitivas en estructura (imagen
izquierda/derecha alternando con texto + checks azules, `escritorio-claro__01.png` a `__03.png`).
**Hallazgo verificado:** `scrollHorizontal: true` en `datos.json` (pasadas escritorio) — el documento
desborda el ancho del viewport, un síntoma de elemento mal contenido en el layout de escritorio.

**Cómo enseñan el producto.** Capturas reales abundantes: KPIs, tabla de operaciones con filtros,
simulador de riesgo, gráfico de precio con marcadores de compra/venta (`escritorio-claro__01.png`,
`__02.png`).

**Precios y oferta.** No visible en el tramo analizado.

**Prueba social y confianza.** "80.000+ happy users since 2016" repetido dos veces en el scroll, cita
en cursiva en el propio hero, logos de "trusted by" al pie del tramo capturado
(`escritorio-claro__04.png`).

**Navegación/pie.** Home, Solutions, Pricing, Help, Blog, Contact, Log in, Start for free.

**Móvil.** **Hallazgo:** el header pierde los botones "Log in"/"Start for free" en el primer pliegue
móvil (`botonesPrimerPliegue: []` en `datos.json`, pasada `movil-claro`) — no hay ningún CTA con fondo
visible en el primer scroll móvil, solo el menú hamburguesa (`movil-claro__00.png`).

**3 cosas a adaptar:**
1. Poner una cita de cliente con estrellas directamente en el hero (no en una sección aparte) refuerza
   el titular sin coste de espacio adicional.
2. El efecto de cuadrícula técnica de fondo tras la captura de producto sugiere precisión/ingeniería;
   encajaría con el tono "mesa institucional" de CountPips si se hace en gris muy sutil.
3. Repetir la cifra de confianza (usuarios/año de fundación) en dos puntos distintos del scroll ayuda a
   quien no lee todo el texto seguido.

**1 cosa a NO imitar:** dejar el primer pliegue móvil sin ningún CTA con fondo visible — es una
fricción de conversión real y verificada, no una opinión de diseño.

**Diferencia ya existente de CountPips:** CountPips no tiene el problema de scroll horizontal ni de
CTA ausente en móvil (a verificar con la misma herramienta sobre la propia web si no se ha hecho
recientemente), y su demo interactiva sin registro es un gancho más fuerte que una captura estática de
mercado en vivo.

---

## 9. Chartlog — chartlog.com

**Primer pliegue.** El sitio más corto y sencillo del grupo (alto 3.243px, solo 15 imágenes, 0 SVGs,
`datos.json`). H1 centrado "#1 Journaling and Analytics Software for Traders" en Montserrat 40px/500,
subcopy corta, un único CTA "Get Started for Free" (no hay segundo CTA). Debajo, una captura real de
velas japonesas con panel de "Details" (estrategia, riesgo/recompensa) a la derecha. Formas
geométricas azules decorativas de fondo. Evidencia: `g3-chartlog/escritorio-claro__00.png`.

**Tipografía.** Montserrat en todo (titulares y cuerpo).

**Color y superficies.** Blanco + azul brillante (`rgb(35,130,242)`) reservado solo para el CTA; franja
azul sólida a todo el ancho antes del pie como segundo llamado a la acción
(`escritorio-claro__01.png`).

**Modo oscuro.** No lo respeta.

**Ritmo y densidad.** El menos denso del grupo: 6 tarjetas de features con iconos simples, 1 solo
testimonio con foto redonda, footer de 4 columnas — sensación de presupuesto de diseño más bajo que el
resto del grupo.

**Cómo enseñan el producto.** Una sola captura de app en el hero; tabla simple de "trade uploads" en
tiempo real (`escritorio-claro__00.png`, `__01.png`).

**Precios y oferta.** No visible en el tramo analizado (enlace "Pricing" aparte).

**Prueba social y confianza.** Un único testimonio, pero de un nombre reconocible en la comunidad
("Andrew Aziz, Founder at BearBullTraders.com", `escritorio-claro__01.png`) — apuesta por calidad del
avalista, no por cantidad de testimonios.

**Navegación/pie.** Product (submenú con Dashboard, Journal, Insights, Strategies, Charts & Market
Data), Integrations, Pricing, Free Course, Log In, Try for free.

**Móvil.** Misma estructura simple, apilada sin sorpresas (`movil-claro__00.png`, `__01.png`).

**3 cosas a adaptar:**
1. Reservar el color de acento (aquí azul) exclusivamente para la acción principal, sin usarlo en
   ningún otro elemento — refuerza qué botón hay que pulsar.
2. Un único testimonio de una figura reconocida del sector puede pesar más que una cuadrícula de
   testimonios anónimos, si CountPips consigue uno así.
3. Una franja de ancho completo con el CTA repetido justo antes del pie es un recordatorio de bajo
   coste que no compite con el hero.

**1 cosa a NO imitar:** la escasez general de contenido y de prueba social (solo 15 imágenes, 1 solo
testimonio) transmite un producto con menos recorrido/inversión — no es el nivel de producción al que
CountPips debería aspirar.

**Diferencia ya existente de CountPips:** CountPips ya tiene bastante más profundidad de contenido y
de prueba (cifras de la demo, glosario, manual, FAQ) que esta web, que se queda en una landing mínima.

---

## 10. StonkJournal — stonkjournal.com

**Primer pliegue.** Fondo carbón oscuro fijo (`rgb(32,34,45)`). H1 enorme en mayúsculas "TRADING
JOURNAL FOR THE *people*." en Archivo Black 115px/400, tracking muy negativo (-8.05px), con la palabra
"people." en cursiva ligera (Instrument Serif) como contraste tipográfico llamativo dentro del mismo
titular. A la derecha, en vez de una captura de producto, una **tabla en vivo de operaciones de
ejemplo** (symbol/entry/P&L/status) con "+$12.504,59" como cifra total y un sparkline verde — el dato
de muestra ES el elemento de diseño del hero. Evidencia: `g3-stonkjournal/escritorio-claro__00.png`.

**Tipografía.** Mezcla arriesgada de tres familias: Archivo Black (display, muy pesada), JetBrains
Mono (textos/etiquetas, estética "terminal de desarrollador") e Instrument Serif en cursiva para
acentos puntuales ("people.", "total clarity", "edge."). Es el sistema tipográfico más distintivo del
grupo.

**Color y superficies.** Fondo carbón fijo, acento azul eléctrico (`rgb(75,158,255)`) para CTAs,
verde/rojo semánticos para ganancias/pérdidas.

**Modo oscuro.** La página nace y se queda siempre oscura (no hay versión clara ni alternancia:
`respetaModoOscuro: false` porque no cambia con el sistema, no porque tenga tema claro ignorado).

**Ritmo y densidad.** Recurso de estilo poco visto: numeración explícita de bloques como si fuera un
índice de wireframe expuesto ("001 // INTRODUCTION", "002 // DASHBOARD", "003 // DASHBOARD/FEATURES",
`escritorio-claro__00.png`, `__01.png`) — da sensación de producto "construido por developers, para
developers/traders técnicos".

**Cómo enseñan el producto.** Métricas cuantificadas reales en el propio hero (Win Rate 64.71%, Profit
Factor 3.38, Max Drawdown -44.82%, `escritorio-claro__01.png`), mini-calendario de P&L en cuadrícula de
color, panel de "coach que conversa" con ejemplos de chat reales y cifras concretas
(`escritorio-claro__02.png`).

**Precios y oferta.** El más simple y transparente del grupo: **FREE ($0/forever) vs. PRO
($10/month)**, con checklist extenso y explícito de qué incluye cada uno, sin letra pequeña
(`escritorio-claro__03.png`). Responde ya en la tabla a "¿esto es realmente gratis?", "¿vendéis mis
datos?" en el FAQ inmediatamente debajo.

**Prueba social y confianza.** Franja bajo el hero: "200,000+ traders · 4.7★ · desde 2021 · No ads ·
No data sold" repetida además en un ticker de texto en movimiento (`escritorio-claro__00.png`).

**Navegación/pie.** Home, Features, Pricing, FAQ, Blog, Log in, Get Started. Pie con "Not financial
advice. Past performance is not indicative of future snacks" — tono desenfadado incluso en el
disclaimer legal.

**Móvil.** Mismo esquema oscuro y misma numeración de bloques, H1 baja a 72px manteniendo el
tracking negativo (`movil-claro__00.png`).

**Nota sin verificar:** en `escritorio-claro__00.png` y `escritorio-claro__01.png` aparece una caja
completamente en blanco bajo el titular "THE DASHBOARD THAT GIVES YOU total clarity ACROSS EVERY
TRADE." tanto en la pasada clara como en la oscura — podría ser un gráfico/iframe que no cargó a
tiempo durante la captura automatizada, o un elemento real del sitio sin contenido. Queda como duda,
no se afirma que sea un fallo del sitio.

**3 cosas a adaptar:**
1. Convertir el propio dato de muestra (tabla de operaciones con P&L real) en el elemento visual del
   hero, no un mockup separado — CountPips ya hace algo parecido con su curva de capital y podría
   llevarlo más al frente todavía.
2. Una tabla de precios con dos planes, sin letra pequeña, y con el FAQ de objeciones justo debajo,
   reduce fricción de decisión — aplicable a la página de precios de CountPips.
3. Un tono de voz distintivo (aquí desenfadado/técnico) ayuda a diferenciar; CountPips puede mantener
   su tono serio/institucional como propia marca de tono, coherente con "mesa institucional".

**1 cosa a NO imitar:** el contraste tipográfico de tres familias a la vez (display+mono+serif
cursiva) es arriesgado y, sin la ejecución cuidada que tiene aquí, fácilmente se vuelve caótico —
CountPips ya tiene un sistema de dos familias (serif+sans) más seguro y debería mantenerlo así.

**Diferencia ya existente de CountPips:** ambos usan cifras de muestra reales como prueba, pero
CountPips las presenta con vocabulario de riesgo institucional (Sharpe, Sortino, Omega, Calmar) en vez
de solo P&L y win rate — un nivel de sofisticación métrica mayor, coherente con su público de traders
de prop firms.

---

## Patrones del grupo (los más repetidos o mejor ejecutados)

1. **H1 grande en sans-serif bold con tracking negativo** como recurso casi universal para titulares
   de impacto — TraderSync (-2px), Tradervue (Manrope 800), TradeZella (-1.2px), Trademetria
   (-1.68px), StonkJournal (-8.05px). Evidencia: `datos.json` de cada carpeta, campo `h1.tracking`.
2. **Capturas de producto encajadas en un mockup de dispositivo con sombra** (laptop, navegador o
   teléfono) en vez de a pantalla completa — Tradervue (`escritorio-claro__01.png`), TradesViz
   (`escritorio-claro__00.png`), Kinfo (`escritorio-claro__00.png`), Chartlog
   (`escritorio-claro__00.png`).
3. **Franja de cifras sociales justo bajo el hero** ("N+ traders / N reviews / N brokers") —
   TradeZella, Trademetria, Tradervue, StonkJournal, TradesViz.
4. **Ninguna de las 10 respeta `prefers-color-scheme` del sistema operativo**: las 10 fuerzan un tema
   fijo (`respetaModoOscuro: false` en los 10 ficheros `datos.json`). Varias simulan contraste
   claro/oscuro **por sección** como recurso de diseño fijo (TradeZella, Kinfo), no como preferencia
   del visitante.
5. **Modal de cookies/GDPR que tapa parte del hero** en la primera captura real (no en mockups de
   marketing) — TraderSync, Edgewonk, Myfxbook, Kinfo, TradesViz. Evidencia:
   `g3-tradersync/escritorio-claro__00.png`, `g3-edgewonk/escritorio-claro__00.png`.
6. **Grid de logos de brokers/integraciones compatibles** como prueba de ecosistema — Edgewonk,
   Tradervue, TradeZella, TradesViz, Trademetria, Chartlog.
7. **Tablas de precios simples (2-3 planes) mostradas pronto en el scroll**, no escondidas en página
   aparte, cuando el sitio decide mostrar precio — TradesViz (FREE/PRO/PLATINUM,
   `escritorio-claro__03.png`), StonkJournal (FREE/PRO, `escritorio-claro__03.png`).
8. **La IA conversacional como eje narrativo central** en los productos más recientes — TraderSync
   ("Cypher"), TradeZella ("Zella AI"), TradesViz ("AI Coach"), StonkJournal ("a coach you talk to").
   4 de 10 centran buena parte del mensaje en esto.
9. **Testimonios con foto real + nombre + empresa o estrellas** como recurso de confianza —
   Tradervue (12 tarjetas), Chartlog (1 testimonio de una figura reconocida), Trademetria (cita en el
   propio hero).
10. **Densidad de página alta en la mayoría** (mediana ≈11.000px de alto en escritorio, de 9 sitios
    entre 8.700 y 17.400px), frente a apuestas cortas y editoriales — Kinfo (5.145px) y Chartlog
    (3.243px) — que demuestran que una landing corta también es viable en esta categoría.
11. **Un único acento de color reservado para la acción principal** cuando el sitio está bien resuelto
    — Chartlog (azul solo en el CTA), Kinfo (verde solo en el indicador positivo) — frente a paletas
    con 3-4 acentos compitiendo (TraderSync, TradeZella).

## Errores del grupo que conviene evitar

- **Modal de cookies mal posicionado que tapa el CTA/titular principal** en el primer segundo real de
  carga: TraderSync, Kinfo, Myfxbook (`g3-tradersync/escritorio-claro__00.png`,
  `g3-myfxbook/escritorio-claro__00.png`).
- **H1 saturado de palabras clave SEO** sacrificando legibilidad humana: TradesViz (`datos.json`,
  campo `h1.texto`, 150+ caracteres).
- **H1 vacío en el DOM en la versión móvil**, verificado en `datos.json`: Tradervue
  (`g3-tradervue/datos.json`, pasada `movil-claro`, `h1.texto: ""`) — riesgo real de SEO/accesibilidad,
  no una suposición visual.
- **Desbordamiento horizontal de layout en escritorio** (`scrollHorizontal: true`): Trademetria
  (`g3-trademetria/datos.json`, pasadas `escritorio-claro` y `escritorio-oscuro`).
- **Botones de conversión ausentes en el primer pliegue móvil**: Trademetria
  (`g3-trademetria/datos.json`, pasada `movil-claro`, `botonesPrimerPliegue: []`).
- **Widgets de terceros contaminando el `<title>` de la pestaña**: TradesViz (prefijo "💬1 -" en el
  título móvil, `g3-tradesviz/datos.json`, pasada `movil-claro`).
- **Mezclar publicidad de terceros con el contenido de producto propio**: Myfxbook, en todo el
  recorrido capturado — diluye cualquier percepción de marca propia.

## Huecos del mercado — lo que ninguna de las 10 comunica bien y CountPips ya podría ocupar

- **Pago único frente a suscripción, como argumento comparativo explícito.** Todas menos StonkJournal
  (que además cobra 10 $/mes en su plan de pago) usan modelo de suscripción mensual/anual; ninguna
  convierte "pagas una vez y es tuyo" en un eje central de su mensaje, algo que CountPips ya tiene
  (Core 149 $ / Pro 249 $, pago único) y podría explotar más frente al resto del grupo.
- **"Cero nube, tus datos nunca salen de tu equipo" como argumento de privacidad de primer nivel.**
  Edgewonk habla de seguridad de sus propios servidores; Kinfo habla de verificación vía broker; pero
  ninguna de las 10 vende "no hay nube en absoluto" como ventaja — es un hueco real que CountPips ya
  ocupa de forma nativa.
- **Traders de prop firms como audiencia primaria del hero**, no secundaria. TradeZella lo menciona
  como una de varias segmentaciones ("For Prop Firm Traders"); ninguna dirige su titular principal a
  ese público. CountPips ya lo tiene como uno de sus públicos declarados y puede ser más frontal.
- **Un posicionamiento visual "institucional, sobrio, casi sin color"** no tiene competencia directa en
  este grupo: el mercado se reparte entre "SaaS azul genérico" (TradesViz, Chartlog, Trademetria) y
  "producto de IA vibrante en morado/neón" (TradeZella, StonkJournal, TraderSync). Solo Kinfo se acerca
  parcialmente (serif + fondo neutro), pero apoyándose en fotografía editorial en vez de en datos
  reales del producto — el hueco que ya ocupa CountPips (serif grande + cifras reales de riesgo tipo
  Sharpe/Sortino/Omega/Calmar) no tiene equivalente directo en las 10 webs analizadas.
- **Demo interactiva navegable sin registro, dentro de la propia landing.** Las 10 muestran capturas
  estáticas o vídeos grabados del producto; ninguna ofrece una demo real explorable sin crear cuenta.
  CountPips ya lo tiene ("Ver la demo interactiva", verificado en `countpips/datos.json`) y es un
  diferencial de producto genuino frente a todo el grupo.

---

## Dudas / puntos sin verificar

- La caja en blanco bajo "THE DASHBOARD THAT GIVES YOU total clarity..." en StonkJournal
  (`g3-stonkjournal/escritorio-claro__00.png` y `__01.png`) puede ser un elemento del sitio sin cargar
  en el momento de la captura automatizada, o un elemento real vacío del sitio — no se pudo confirmar
  cuál de las dos cosas es sin volver a cargar el sitio de forma interactiva.
- No se exploraron las páginas internas de precios de TraderSync, TradeZella, Kinfo, Chartlog,
  Trademetria ni Tradervue (el encargo pedía analizar la landing/primer tramo, no todo el sitio); lo
  dicho sobre "precios no visibles" se refiere solo al tramo capturado en la portada, no a que esas
  webs carezcan de página de precios.
