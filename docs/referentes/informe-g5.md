# Informe grupo 5 — inversión particular y fintech financiera

Objetivo: extraer hallazgos de diseño aplicables a la web de marketing de CountPips (diario de
trading de escritorio, bilingüe ES/EN, modo claro/oscuro, estilo sobrio-institucional, serif grande +
sans, casi sin color, cantos 8–12px, cifras reales, sin registro).

Las 10 webs se capturaron con Playwright (escritorio 1440 claro y con `prefers-color-scheme: dark`
del sistema, móvil 390 claro), página entera, troceada en imágenes `__NN.png`, más `datos.json` con
medidas del DOM. Ninguna de las 10 quedó bloqueada por protección anti-robots — Trading212 respondió
con código HTTP 403 pero el contenido cargó y se ve con normalidad (cookie banner, capturas de la app
reales); se trata como válida y no se sustituyó.

---

## 1. Wealthfront — https://www.wealthfront.com

Evidencia de imagen: `g5-wealthfront/escritorio-claro__00.png`, `__01.png`, `__02.png`,
`escritorio-oscuro__00.png`, `movil-claro__00.png`, `__01.png`. Datos: `g5-wealthfront/datos.json`.

**Primer pliegue.** Titular numérico y financiero: «Earn up to 4.45% APY / Better than a bank»
(datos.json `h1.texto`), con tres bullets de beneficio (cero comisiones, retiro 24/7, FDIC hasta 8M) y
una ilustración de teléfono con tarjeta física flotando. Dos CTA («Get started» sólido blanco y
«Learn more» con borde) sin jerarquía agresiva entre ambos — misma altura, mismo peso visual
(`g5-wealthfront/escritorio-claro__00.png`).

**Tipografía.** H1 a 62px/700 con tracking negativo fuerte (-1.86px), fuente Calibre (sans a medida);
subtítulo en cursiva serif («Better than a bank») que rompe el bloque sans — mezcla serif/sans dentro
de la misma pieza, no solo entre secciones (`datos.json` → `h1`, y visible en `escritorio-claro__00`).
Cuerpo a 14px/400, interlineado generoso (16.1px ≈ 1.15).

**Color y superficies.** Fondo del primer pliegue en degradado morado oscuro sobre blanco/lila en el
resto de la página (`escritorio-claro__00`, `__01`); separan secciones por cambio de fondo (banda
morada → gris muy claro → banda morada oscura de cierre) más que por líneas o sombras. Tarjetas de
producto con esquinas suavemente redondeadas (~6px según botones).

**Modo oscuro.** No lo respeta: `respetaModoOscuro: false` en `datos.json`, y
`escritorio-oscuro__00.png` es visualmente idéntico a `escritorio-claro__00.png` — la web ignora
`prefers-color-scheme` del sistema.

**Ritmo y densidad.** Alto total 7437px en escritorio para bastante contenido (producto, testimonios,
prensa, FAQ) — densidad media, sin tramos muertos.

**Cifras y gráficos.** Usa un móvil-mockup con saldo ficticio («$304,606») y un gráfico de rendimiento
anualizado («9.73% annualized returns») dentro de la tarjeta de producto, no como bloque de datos
aislado (`escritorio-claro__01.png`).

**Confianza y cumplimiento.** Aviso de tasa variable y letra pequeña bajo el CTA principal
(«3.55% Base APY... is provided by program banks and is subject to change», `escritorio-claro__00`);
al pie, bloque largo de disclosures numeradas sobre FDIC, rendimiento pasado y licencias de asesor de
inversión (`escritorio-claro__03.png`, texto ilegible a tamaño normal pero presente y extenso).
Sellos de terceros (Bankrate, NerdWallet) como prueba social visual antes que texto.

**Precios.** No se ve un bloque de precios en el primer tramo capturado; se citan cifras de
rendimiento, no de comisión, como argumento central.

**Navegación y pie.** Nav superior con desplegables (Cash/Invest/Borrow/Learn) y footer de 4 columnas
temáticas con enlaces (`datos.json` → `navLinks`, `escritorio-claro__03.png`).

**Móvil.** Colapsa el nav a menú hamburguesa, apila el mockup de teléfono y el texto; el banner de
cookies ocupa una porción notable de la pantalla en móvil (`movil-claro__00.png`).

**Adaptar a CountPips:**
1. Mezclar un acento serif cursivo dentro de un titular sans para dar calidez sin abandonar la
   tipografía funcional — CountPips podría reservarlo para una palabra clave del titular, no todo el
   bloque.
2. Colocar la letra pequeña de disclaimer pegada al dato principal (no solo al pie), para que el
   contexto de «esto no es garantía» viaje con la cifra que lo necesita.
3. Usar sellos/menciones de prensa como prueba social visual compacta, sin bloque de testimonios largo.

**No imitar:** el degradado morado saturado como fondo del primer pliegue — reñido con el objetivo
«sobrio, casi sin color» de CountPips; y el bloque de disclosures corridos en párrafos densos e
ilegibles al pie, que ninguna comprobación (ni humana ni de accesibilidad) invita a leer.

---

## 2. Betterment — https://www.betterment.com

Evidencia: `g5-betterment/escritorio-claro__00.png` a `__04.png`, `escritorio-oscuro__00.png`,
`__01.png`, `movil-claro__00.png`, `__01.png`. Datos: `g5-betterment/datos.json`.

**Primer pliegue.** Titular «Build wealth with confidence and ease» sobre foto real de una mano
sosteniendo un móvil con la app abierta (saldo «$94,893.90», proyección y barra de progreso) —el
producto real es el protagonista visual, no una ilustración (`escritorio-claro__00.png`). Tres
bullets de beneficio y un único CTA amarillo «Get started»; jerarquía clara, un solo color de acento
para toda acción primaria.

**Tipografía.** H1 serif («Season Mix» / Source Serif 4) a 68px/500, interlineado ajustado 1:1
(`datos.json` → `h1`); cuerpo en sans (GT America/Inter) a 16px. Contraste serif/sans nítido: titulares
en serif clásica, todo lo demás (nav, botones, párrafos) en sans — más marcado que en Wealthfront.

**Color y superficies.** Paleta de tres bloques de color puro por sección: azul cielo (hero), azul
marino intenso (bloque «Get started with an account in minutes»), crema/beige (bloque de productos y
FAQ) y azul marino de cierre con ilustración (`escritorio-claro__00`–`__04`). Separan secciones por
cambio de fondo a toda anchura, sin tarjetas con sombra; las tarjetas de producto sí llevan sombra
suave y fondo degradado azul propio (`escritorio-claro__01.png`).

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`); `escritorio-oscuro__00/01.png` son
idénticas a las de modo claro.

**Ritmo y densidad.** 9959px de alto, contenido denso pero cada sección resuelve una sola idea con
mucho aire alrededor (titular corto + 2–3 columnas + imagen) — equilibrado.

**Cifras y datos.** Cifra grande y sola como bloque visual: «4.00% APY (variable)» ocupa una tarjeta
entera con billetes ilustrados cayendo alrededor (`escritorio-claro__02.png`) — trata una única cifra
como si fuera el producto. Rendimiento histórico compuesto («20.06% over 1 year, 9.32% over 5 years,
10.06% over 10 years») en letra pequeña bajo las tarjetas de producto, nunca en el titular
(`escritorio-claro__01.png`).

**Confianza y cumplimiento.** Insignias de prensa («Best Overall Robo Advisor 2025 — WSJ Buy Side»)
junto a tres bloques de confianza con icono: fiduciario, protección SIPC hasta $500K, «technology
backed by human expertise» (`escritorio-claro__02.png`). Pie con sección «IMPORTANT BETTERMENT
DISCLOSURES» extensísima, separada visualmente del resto del footer por una línea y en tipografía aún
más pequeña (`escritorio-claro__04.png`).

**Precios.** No hay tabla de precios en el flujo principal; el «$10 to get started» aparece como una
cifra más dentro de una fila de estadísticas (junto a «1M+ customers», rating de tiendas de apps),
minimizando la fricción de precio frente al beneficio.

**Navegación y pie.** Nav con tabs de audiencia arriba del todo (INDIVIDUALS/EMPLOYERS/ADVISORS) antes
del logo — segmentación de público explícita desde el primer píxel (`escritorio-claro__00.png`,
`datos.json` → `navLinks`). Footer de 7 columnas.

**Móvil.** El hero se convierte en foto vertical de página completa con el móvil ocupando media
pantalla; las tarjetas de producto pasan de 3 columnas a apiladas verticalmente sin recortar contenido
(`movil-claro__00.png`, `__01.png`).

**Detalle técnico visto en la captura:** las tres tarjetas «Self-directed / Automated / Custom» llevan
un recuadro de vista previa de producto que en la captura queda como un rectángulo gris liso sin
render (`escritorio-claro__01.png`) — probablemente contenido diferido (vídeo/canvas) que no terminó
de cargar en el tiempo de espera del script.

**Adaptar a CountPips:**
1. Reservar un único color de acento para todo CTA primario en toda la web (aquí, amarillo siempre) en
   vez de repartir el acento entre varios botones de tono distinto.
2. Tratar una cifra de rendimiento como pieza gráfica autónoma (número grande + etiqueta corta), útil
   para destacar Sharpe/expectancy de forma memorable en vez de en tabla.
3. Colocar sellos de reconocimiento de terceros justo al lado de las garantías de seguridad/regulación,
   como refuerzo mutuo de confianza.

**No imitar:** los bloques de color sólido a toda anchura sin transición ni filete — en una marca que
ya usa negro/blanco/gris frío, un cambio de fondo tan brusco leería a error de plantilla más que a
intención de diseño.

---

## 3. Public — https://public.com

Evidencia: `g5-public/escritorio-claro__00.png` a `__04.png`, `escritorio-oscuro__00.png`, `__01.png`,
`movil-claro__00.png`, `__01.png`. Datos: `g5-public/datos.json`. Es, de las diez, la referencia
estéticamente más cercana a CountPips (serif grande, negro/blanco, capturas reales de producto).

**Primer pliegue.** Titular serif «Investing for those who take it seriously» en negro sobre blanco
(`escritorio-claro__00.png`), tres iconos-etiqueta de beneficio en línea (multi-asset, AI Agents, APY),
un solo CTA negro «Get started» a la derecha, y debajo una fotografía de producto real: portátil y
móvil mostrando la app con un gráfico de cartera y cifras reales de muestra («$459,480.40»,
posiciones con verde/rojo) sobre fondo fotográfico oscuro con reflejo — capa fotográfica + capa de UI
combinadas, no una captura de pantalla plana.

**Tipografía.** H1 en serif «Denton» (fallback Times New Roman) a 48px/300 (peso ligero, no negrita),
tracking normal; cuerpo en Inter a 14px con color gris-azulado (`rgb(81,104,128)`) en vez de negro
puro — un matiz de color frío en vez de gris neutro. Contraste serif/sans muy marcado: el h1 y los
titulares de sección van en serif fina, el resto (nav, cuerpo, tags) en sans (`datos.json` → `h1`,
`parrafo`).

**Color y superficies.** Alterna bloques blancos, gris muy claro y negro puro a lo largo de la página
(hero blanco → tira de producto negra → sección gris → bloque negro «The new standard. For active
trading.» → cierre negro con foto, `escritorio-claro__00`–`__04`) — usa el negro como color de marca
recurrente, no solo en el pie. Botones en cápsula (`radio: 999px`/`100px` en `datos.json`), sin
sombras duras; las tarjetas de producto llevan sombra sutil y esquinas de 8–12px.

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`), confirmado por `escritorio-oscuro__00` y
`__01` idénticas a las de claro.

**Ritmo y densidad.** 12556px de alto — la más larga de las tres primeras del grupo; encadena muchos
módulos de producto (Agentes IA, Market briefing, Key moments, Generated Assets, Earnings call
summaries, Research assistant, Direct indexing, Queue…) con formato repetido (título + frase + tarjeta
de producto), lo que da ritmo predecible pero acumula bastante scroll antes de llegar a precios o
regulación.

**Cifras, gráficos y conceptos.** Todas las cifras de rendimiento van insertadas dentro de una captura
de producto realista (gráfico de velas/línea con ejes, tabla de posiciones con verde/rojo para
ganancias/pérdidas) en vez de como texto suelto — el dato vive siempre pegado a su gráfico
(`escritorio-claro__01.png`, `__02.png`). Cuando comparan comisiones lo hacen con una tabla directa
frente a competidores nombrados (Public vs Robinhood vs Fidelity vs TD Ameritrade,
`escritorio-claro__02.png`), algo que ninguna otra web del grupo hace tan explícitamente.

**Confianza y cumplimiento.** Sección dedicada «Secure by design. Transparent by choice.» en bloque
negro con 6 tarjetas (regulación FINRA/SIPC, seguridad AES-256/TLS, sede en EEUU, transparencia de
comisiones, uptime 99.994%) antes del footer — la cumplimiento se trata como argumento de venta con
la misma jerarquía visual que las features, no como nota legal aparte (`escritorio-claro__04.png`).
Enlaces «Disclosures» específicos bajo cada bloque de producto con letra pequeña, no un único bloque
al final.

**Precios.** No hay tabla de precios propia visible en el recorrido capturado; comunican coste por
comparación directa con la competencia (rebates de opciones, tipo de margen) en vez de listar tarifa
propia.

**Navegación y pie.** Nav con menús desplegables por categoría de producto (`datos.json` →
`navLinks`, más de 25 enlaces) — mucho más denso que Wealthfront o Betterment. Footer de 4 columnas
simples.

**Móvil.** El h1 se recorta a menos ancho pero conserva tamaño de letra proporcional; las tarjetas de
producto pasan de 2 columnas a apiladas sin recortar información, y las etiquetas de producto en línea
(«Stocks · Bonds · Treasuries…») pasan de una fila a bloques envueltos legibles
(`movil-claro__00.png`, `__01.png`).

**Adaptar a CountPips:**
1. Integrar la cifra de resultado (Sharpe, expectancy, drawdown) siempre dentro de una captura de
   producto real con su gráfico, nunca como número suelto sin contexto visual — ya es parte del estilo
   de CountPips, Public lo ejecuta de forma muy consistente en cada módulo.
2. Usar el negro como bloque de sección recurrente (no solo pie de página) para dar ritmo y separar
   tramos de contenido, coherente con la paleta casi monocroma ya elegida.
3. Convertir el aviso de cumplimiento en una sección con la misma jerarquía visual que las features
   (título + 3–6 tarjetas), en vez de relegarlo a nota pequeña — refuerza sin sonar a letra pequeña.

**No imitar:** encadenar más de ocho módulos casi idénticos en estructura (título + frase + captura)
antes de llegar a precio o cierre — para una web con oferta mucho más simple que un bróker
multi-producto, esa repetición alargaría la página sin necesidad.

---

## 4. Robinhood — https://robinhood.com

**Aviso de duda:** la captura sirvió la versión europea de Robinhood, en español, centrada en Classic
Stock Tokens/cripto/futuros perpetuos y regulada por el Banco de Lituania (visible en
`escritorio-oscuro__01.png`: «Robinhood Europe, UAB... autorizada y regulada por el Banco de
Lituania»), no la home clásica de EEUU de acciones/opciones. Es previsible que el geolocalizado por IP
del entorno de captura haya sido europeo. El sistema de diseño (tipografía, color, estructura) es el
mismo grupo de marca, así que se mantiene como referencia válida, pero el contenido de producto
descrito no es el de la home estadounidense.

Evidencia: `g5-robinhood/escritorio-claro__00.png` a `__03.png`, `escritorio-oscuro__00.png`, `__01.png`,
`movil-claro__00.png`, `__01.png`. Datos: `g5-robinhood/datos.json`.

**Primer pliegue.** Titular serif enorme «Todas tus inversiones realizadas desde una misma
plataforma» en blanco sobre una fotografía de humo/textura oscura granulada (`escritorio-claro__00`).
Un solo CTA en verde lima flúor («Comienza»/«Regístrate»); banner de cookies centrado tapando parte
del hero en la propia captura.

**Tipografía.** H1 en serif «Martina Plantijn» a 80px/400, interlineado 1:1 exacto — el tamaño de h1
más grande de las diez webs (`datos.json` → `h1.tam`). Cuerpo en sans «Capsule Sans Text» a 16px.
Contraste serif/sans muy marcado, igual que Public, pero aquí el peso del h1 es más ligero (400) sobre
fondo oscuro.

**Color y superficies.** Toda la home es de base oscura (negro/gris muy oscuro) con un único acento de
marca: verde lima flúor (`rgb(204,255,0)`) para botones y algún subtítulo — sin variante clara
disponible; no es que respete el modo oscuro del sistema, es que su identidad visual por defecto ES
oscura (`respetaModoOscuro: false`, y `escritorio-oscuro` es idéntica a `escritorio-claro`: ambas
negras). Separan secciones alternando negro puro, un tramo con foto de producto a pantalla completa
(clip metálico sobre fondo gris azulado, `escritorio-claro__01.png`) y un cierre en el mismo verde lima
a toda anchura con textura de rayas (`escritorio-claro__02.png`).

**Modo oscuro.** No aplica en el sentido de «adaptación»: la marca es monotema oscuro, no responde a
`prefers-color-scheme`.

**Ritmo y densidad.** 6153px, la segunda web más corta del grupo tras Addepar; bloques grandes de
fotografía con poco texto — mucho peso de imagen frente a texto, ritmo rápido de scroll.

**Cifras y datos.** Capturas de producto reales insertadas en mockups de teléfono con datos de muestra
(«NVIDIA $154.31 +4.33%», «Long BTCUSD 1.550,00 $», barra de apalancamiento) — igual que Public, la
cifra vive dentro de la UI simulada, nunca suelta (`escritorio-claro__01.png`, `__02.png`).

**Confianza y cumplimiento.** Avisos de riesgo largos en blanco sobre negro, centrados y a ancho de
párrafo completo, insertados entre cada bloque de producto («Los Classic Stock Tokens son contratos
derivados... conllevan un alto nivel de riesgo», `escritorio-claro__01.png`) — más frecuentes y más
visibles tipográficamente que en el resto del grupo, aunque en un tono que compite en atención con el
propio contenido de marketing. El pie incluye identificación legal completa de la entidad regulada
(número de registro, domicilio, regulador) en la franja verde lima final (`escritorio-oscuro__01.png`).

**Precios.** No se muestra tabla de tarifas; se citan condiciones puntuales (rendimiento del 5%,
apalancamiento hasta 10X) dentro de cada módulo de producto.

**Navegación y pie.** Selector de idioma/región visible en la barra superior («ES» con icono de globo,
`escritorio-claro__00.png`) — es la única de las diez webs analizadas con un selector de idioma
explícito en el header. Footer en el mismo verde lima, con columnas por tipo de contenido (Producto,
Criptomonedas, Sociedad matriz, Marco jurídico y normativo).

**Móvil.** El banner de cookies ocupa casi toda la pantalla inicial y hay que cerrarlo para ver el
resto del contenido (`movil-claro__00.png`); las tarjetas de producto pasan a una columna sin perder
las capturas de producto.

**Adaptar a CountPips:**
1. Un selector de idioma explícito y visible en la cabecera (bandera/globo + código) en vez de depender
   solo de la ruta `/en/` — ayuda a que un visitante que aterriza en el idioma equivocado lo note de
   inmediato.
2. Insertar el aviso de riesgo puntual pegado al bloque de producto al que corresponde, en vez de sólo
   al final de la página — coherente con la regla de «rentabilidades pasadas no garantizan resultados
   futuros» que cualquier web de trading debería asumir.
3. Usar un acento de color único y muy saturado, reservado solo para CTA y algún remate de sección,
   manteniendo el resto en monocromo — refuerza la idea de «casi sin color» sin caer en gris plano.

**No imitar:** avisos legales en párrafos largos centrados a ancho completo intercalados entre
secciones de producto — rompen el ritmo de lectura y, por contraste de blanco sobre negro, acaban
pesando visualmente más que los propios titulares de venta.

---

## 5. Mercury — https://mercury.com

Evidencia: `g5-mercury/escritorio-claro__00.png` a `__04.png`, `escritorio-oscuro__00.png`, `__01.png`,
`movil-claro__00.png`, `__01.png`. Datos: `g5-mercury/datos.json`. (Es banca para empresas, no
inversión, pero forma parte de la lista de referencia encargada.)

**Primer pliegue.** Titular «Radically different banking» en blanco sobre una fotografía real de un
despacho al aire libre en la naturaleza (escritorio, silla, portátil sobre una colina) — la única de
las diez que usa fotografía de paisaje/lifestyle sin ningún elemento de producto en el propio hero
(`escritorio-claro__00.png`). Un campo de email + dos CTA («Open account» sólido azul-violeta,
«Launch demo» con fondo translúcido) — invita a «probar antes de registrarse», algo que ninguna otra
web del grupo ofrece tan explícito en el primer pliegue.

**Tipografía.** H1 en fuente propia «arcadiaDisplay» a ~49px/480 (peso medio), tracking normal; cuerpo
en «arcadia» a 14px con tracking positivo leve (0.14px) — es la única web del grupo con tracking
positivo en el cuerpo de texto en vez de neutro o negativo. Sin contraste serif/sans: toda la
tipografía es de la misma familia sans a medida.

**Color y superficies.** Fondo por defecto oscuro (azul-negro casi total, `rgb` muy bajo) en todo el
cuerpo de la página tras el hero fotográfico; los módulos de producto se muestran como tarjetas claras
(blanco/gris muy claro) flotando sobre ese fondo oscuro, invirtiendo el contraste habitual
(tarjeta clara sobre fondo oscuro en vez de al revés, `escritorio-claro__01.png`, `__03.png`). Esquinas
de 8–12px en tarjetas, sin bordes duros.

**Modo oscuro.** No aplica como adaptación: el diseño por defecto ya es oscuro salvo el hero
fotográfico; `respetaModoOscuro: false` y `escritorio-oscuro` es idéntica a `escritorio-claro`.

**Ritmo y densidad.** 11661px de alto; estructura muy repetida de «tarjeta de producto + texto breve al
lado», con testimonios en vídeo/foto intercalados (citas de fundadores de Linear y Supabase,
`escritorio-claro__02.png`) — mucha prueba social de empresas tecnológicas reconocibles como logos en
fila (`escritorio-claro__02.png`).

**Cifras y datos.** Las cifras de cuenta (saldos «$2,023,267», «$226,767») se muestran dentro de un
panel de producto realista con jerarquía de filas por tipo de cuenta (`escritorio-claro__00.png`,
`escritorio-oscuro__00.png`) — igual patrón que Public/Robinhood: número siempre dentro de una UI
simulada.

**Confianza y cumplimiento.** Aviso regulatorio corto y directo justo bajo el hero, en una franja
oscura contrastada: «Mercury is a fintech company, not an FDIC-insured bank. Banking services provided
through Choice Financial Group and Column N.A., Members FDIC» (`escritorio-claro__00.png`) — una sola
frase, sin rodeos, en el lugar de máxima atención en vez de solo en el pie.

**Precios.** No visible en el tramo capturado; hay enlace «Pricing» en el nav pero el contenido de la
home no cita tarifas.

**Navegación y pie.** Nav con desplegables por categoría (Products, Solutions, Resources, About) más
enlace directo a Pricing; footer de 4 columnas temáticas con muchos enlaces de producto y recursos
(`escritorio-oscuro__01.png`).

**Móvil.** El hero fotográfico se recorta en alto pero conserva el campo de email y ambos CTA visibles
sin scroll adicional; las tarjetas de producto pasan a una columna manteniendo el mismo contraste
claro-sobre-oscuro (`movil-claro__00.png`, `__01.png`).

**Adaptar a CountPips:**
1. Ofrecer una demo interactiva («Launch demo») junto al CTA de conversión principal, coherente con un
   producto de escritorio que se puede mostrar sin necesidad de registro.
2. Invertir el contraste puntualmente —tarjeta clara flotando sobre fondo oscuro— como recurso para
   dar foco a un panel de producto concreto (por ejemplo, la captura del diario de trading) sin
   necesidad de cambiar toda la página a modo oscuro.
3. Poner el aviso regulatorio/legal más importante como una frase corta y bien visible bajo el hero, no
   enterrado en el pie — aplicable al aviso de «no es asesoramiento financiero» de CountPips.

**No imitar:** el uso de fotografía de stock genérica de naturaleza/lifestyle en el hero sin ninguna
referencia visual al producto — para una app de escritorio con capturas reales disponibles, sustituir
producto por paisaje diluye la propuesta de valor.

---

## 6. Trading212 — https://www.trading212.com

**Nota técnica:** la carga devolvió código HTTP 403 en las tres pasadas (`datos.json` →
`pasadas.*.estado`), pero el contenido se renderizó con normalidad y de forma completa —banner de
cookies, capturas de producto reales, footer con regulación— por lo que se trata como válida y no se
sustituyó por otra web.

Evidencia: `g5-trading212/escritorio-claro__00.png` a `__04.png`, `escritorio-oscuro__00.png`, `__01.png`,
`movil-claro__00.png`, `__01.png`. Datos: `g5-trading212/datos.json`.

**Primer pliegue.** Titular «Commission-free investing for everyone» en blanco sobre banda negra, con
un único CTA azul «Open account» y una nota de coste bajo el botón («Other fees may apply. See our
terms and fees.») — el aviso de coste va pegado al CTA, no al pie (`escritorio-claro__00.png`). A la
derecha, mockup de móvil con la app real mostrando saldo de ejemplo («€28,354.23») y gráfico de
cartera.

**Tipografía.** H1 en fuente propia «aeonik» a 38.4px/500 —el h1 más pequeño en px de las diez webs
analizadas, aunque con interlineado amplio (56px)—; cuerpo también en aeonik pero a mayor tamaño en
subtítulos (21.6px/300, peso ligero). Sin serif en ningún punto de la página: toda la tipografía es
sans, la única del grupo (junto con Mercury) sin ningún guiño serif.

**Color y superficies.** Alterna banda negra (hero), banda gris clara (métricas de confianza), blanco
(features) y una banda negra final con premios/regulación (`escritorio-claro__00`, `__04`). Acento
único azul cian para CTA y enlaces destacados; ilustraciones en 3D suave (una moneda/reloj estilizado
para «24/5 trading», `escritorio-claro__02.png`) en vez de fotografía.

**Modo oscuro.** No lo respeta: `respetaModoOscuro: false`, y `escritorio-oscuro__00.png` es idéntica a
`escritorio-claro__00.png`.

**Ritmo y densidad.** 8101px de alto; usa mucho espacio en blanco entre bloques de feature (título +
frase + CTA + ilustración a la derecha, con amplio margen vertical antes del siguiente bloque,
`escritorio-claro__01.png`, `__02.png`) — de las diez webs, la que más aire deja entre secciones de
producto individuales, casi excesivo en el tramo de «Invest as little as €1» donde el bloque queda
muy vacío verticalmente.

**Cifras y datos.** Todas las cifras de rendimiento/saldo van dentro de mockups de móvil o tarjetas de
producto con datos de ejemplo realistas (fondos con progreso «ON TRACK/AHEAD/BEHIND» codificado por
color, ganancias en verde/pérdidas en rojo, `escritorio-claro__01.png`) — mismo patrón que Public,
Robinhood y Mercury: la cifra vive dentro de una UI simulada.

**Confianza y cumplimiento.** Sección «Money and Assets protection» con tarjetas separadas para
protección de efectivo e inversiones (`escritorio-claro__02.png`); sección final «Global regulation»
con cuatro tarjetas, una por regulador (FCA, BaFin, CySEC, ASIC), cada una con número de licencia
(`escritorio-claro__03.png`) — es el despliegue de regulación multi-jurisdicción más explícito y mejor
organizado visualmente de las diez webs. El aviso de riesgo estándar («When investing, your capital is
at risk...») se repite arriba del todo, fijo en una franja superior sobre el propio nav
(`escritorio-claro__00.png`, `escritorio-oscuro__00.png`), y de nuevo en texto largo al pie.

**Precios.** No hay tabla de comisiones en el recorrido capturado; se remite a «terms and fees» con un
enlace corto junto al CTA principal.

**Navegación y pie.** Nav simple de 4 categorías (Invest/CFD/Card/Learn) con selector de idioma
(«EN») en la cabecera —segunda de las diez con selector de idioma visible—; selector de país en el pie
(«ROMÂNIA», `escritorio-claro__03.png`) además del de idioma arriba: dos selectores distintos para
idioma y región/entidad legal.

**Móvil.** El hero cambia el CTA a «Get the app» en vez de «Open account» (detección de dispositivo
móvil, `movil-claro__00.png`) — es la única del grupo que cambia el texto del CTA principal según el
dispositivo. El resto del contenido se apila sin recortes.

**Detalles finos.** Reseñas de Trustpilot con nombre, fecha y cita textual como prueba social
(`escritorio-claro__03.png`), y una fila de sellos de premios («Best App», «Best Value for Money»,
etc.) junto a la reseña, no en una sección aparte.

**Adaptar a CountPips:**
1. Fijar el aviso de riesgo/legal más corto y relevante en una franja fija sobre la propia cabecera, en
   vez de solo al pie — visibilidad constante sin interrumpir el diseño del resto de la página.
2. Cambiar el texto de un CTA en función del contexto (aquí, dispositivo) allí donde tenga sentido —
   para CountPips, por ejemplo, distinguir «Descargar para Windows» de un CTA genérico si se detectase
   necesidad.
3. Presentar cada mercado/regulador o cada compatibilidad (bróker, prop firm) como tarjeta individual
   con su identificador concreto, más creíble que una lista de texto corrida.

**No imitar:** el exceso de espacio vertical vacío entre algunos bloques de feature (visible en
`escritorio-claro__01.png`) — alarga el scroll sin aportar información, un balance peor que el de
Betterment o Public para una cantidad de contenido similar.

---

## 7. eToro — https://www.etoro.com

Evidencia: `g5-etoro/escritorio-claro__00.png` a `__03.png`, `escritorio-oscuro__00.png`, `__01.png`,
`movil-claro__00.png`, `__01.png`. Datos: `g5-etoro/datos.json`.

**Primer pliegue.** Titular «A window into what millions of investors are doing. You're welcome.» en
tono desenfadado, sobre foto real de una mesa de mármol con un móvil mostrando la app (cartera con
código de color verde/rojo) — la foto tiene ambiente editorial (café, luz natural), no es un mockup
flotante genérico (`escritorio-claro__00.png`). CTA verde neón «Start investing»; fila de 5 iconos de
confianza justo debajo del hero (Since 2007, Nasdaq listed, 40M+ users, Regulated, Protected).

**Tipografía.** H1 en fuente propia «eToro» a 72px/800 (el peso más alto —extra bold— del grupo) con
tracking negativo fuerte (-2px), color crema (`rgb(236,234,209)`) en vez de blanco puro sobre negro
(`datos.json` → `h1`). Sin serif: toda la web es sans, con mucho peso tipográfico como recurso de
jerarquía en vez de tamaño.

**Color y superficies.** Diseño de base oscura por defecto: negro/verde muy oscuro en casi toda la
página, con el verde neón (`rgb(109,255,138)`) como único acento saturado repetido en CTA, cifras
destacadas («$1», «0%», «From 0.3%») y checks (`escritorio-claro__00`–`__02.png`). Fotografías con
overlay de color (verde oscuro) para integrarlas en la paleta de marca en vez de dejarlas a color
natural.

**Modo oscuro.** No aplica como adaptación (`respetaModoOscuro: false`): el diseño ya es oscuro por
defecto, `escritorio-oscuro` idéntica a `escritorio-claro`.

**Ritmo y densidad.** 6107px de alto, la segunda web más corta del grupo; secciones muy compactas, cada
una resuelve una idea en poco espacio vertical, con testimonios de inversores reales fotografiados
(«Rhys Adams», «Agnieszka Nowak», con rendimiento y nº de copiadores, `escritorio-claro__01.png`) como
pieza central de la sección social.

**Cifras y comisiones.** Comunican coste con cifras enormes en verde y una palabra de contexto debajo
(«$1 / Commission on stocks», «0% / Commission on ETFs», «From 0.3% / Trade more crypto, pay less»,
`escritorio-claro__00.png`) — el patrón de comunicación de precio más directo y visualmente más
grande de las diez webs, sin tabla ni letra pequeña en el mismo bloque.

**Confianza y cumplimiento.** El aviso de riesgo estándar («The value of your investments may go up or
down. Your capital is at risk») va fijo en una franja superior sobre el nav, igual que Trading212
(`escritorio-claro__00.png`). Sección «Trusted by 40M+ users» con 3 tarjetas (entidades reguladas,
dinero separado, protección del inversor hasta importes concretos) y, más abajo, chips con cada
regulador y banco custodio por nombre (FCA, CySEC, ASIC, Barclays, Deutsche, BNY Mellon, FSCS, ICF,
Lloyd's of London — `escritorio-claro__02.png`), más un bloque de patrocinios deportivos («From
podiums to pitches») que mezcla prueba de marca con prueba de solidez. Pie con identificación legal
completa por entidad y jurisdicción (Chipre, Reino Unido, Australia, Seychelles, EAU,
`escritorio-claro__03.png`).

**Precios.** Ver arriba: comisión comunicada como titular visual, no como tabla.

**Navegación y pie.** Selector de idioma explícito en cabecera («EN» + icono de globo,
`escritorio-claro__00.png`) —tercera de las diez con este patrón—; nav con desplegables por categoría y
buscador integrado (icono de lupa). Footer de 6 columnas.

**Móvil.** El banner de cookies se sitúa fijo sobre el contenido y hay que decidir antes de seguir
(`movil-claro__00.png`); en móvil aparece un bloque no visto en escritorio en ese tramo («Powered by
intelligence» / «Set up an Agent Portfolio», `movil-claro__01.png`) — indicio de que el orden o
contenido de módulos varía entre breakpoints, no es solo un reflow del mismo contenido.

**Detalles finos.** Icono de accesibilidad flotante persistente en la esquina (visible en
`escritorio-claro__00.png`), no visto en ninguna otra de las nueve restantes.

**Adaptar a CountPips:**
1. Comunicar una cifra clave (p. ej. expectancy o coste de la licencia) como titular visual grande con
   una palabra de contexto debajo, en vez de en tabla — más memorable para el dato que más importa.
2. Combinar prueba social de personas reales (con resultado y contexto) con prueba de marca/regulación
   en secciones separadas pero contiguas, reforzándose mutuamente sin mezclarse.
3. Un icono de accesibilidad visible y persistente es una señal de cuidado barata de replicar y
   coherente con un producto «serio».

**No imitar:** el overlay de color verde sobre las fotografías de personas reales — para una marca que
ya apuesta por negro/blanco/gris frío, teñir las fotos reduciría el efecto de autenticidad que se busca
con capturas reales de la app.

---

## 8. Indexa Capital — https://indexacapital.com

Evidencia: `g5-indexacapital/escritorio-claro__00.png` a `__04.png`, `escritorio-oscuro__00.png`,
`__01.png`, `movil-claro__00.png`, `__01.png`. Datos: `g5-indexacapital/datos.json`. Referencia de
español financiero bien escrito.

**Primer pliegue.** Titular directo y sin metáfora: «Menos costes, más rentabilidad», con tres líneas
de cuerpo que enumeran el argumento con cifras concretas (comisiones 88% más bajas, 6.150 M€
gestionados, más de 177 mil clientes, `escritorio-claro__00.png`) — el texto vende con datos, no con
eslogan. Un único CTA naranja «Darme de alta»; a la derecha, un gráfico de líneas real (volumen y
aportaciones netas, con ejes y fechas) en vez de una foto o ilustración.

**Tipografía.** H1 en Nunito Sans a 40px/700 (el h1 más pequeño en tamaño de las diez webs junto con
Trading212), tracking ligeramente negativo (-0.4px). Sin serif en ningún punto — sans en toda la
página, coherente con un tono más técnico/informativo que emocional.

**Color y superficies.** Azul corporativo sólido en el hero (degradado azul medio a azul marino),
banda gris-beige para «Cómo funciona», blanco para servicios, verde oscuro para el bloque de FAQ,
gris oscuro casi negro para «Máxima seguridad para tu dinero» (`escritorio-claro__00`–`__02.png`) —
cada sección tiene un color plano distinto y reconocible, more block-based que gradual. Iconografía
lineal dibujada a mano (microscopio, huevos en huevera, apretón de manos) en vez de iconos de sistema
genéricos, con el mismo azul de marca en todos (`escritorio-claro__00.png`).

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`); confirmado por `escritorio-oscuro__00/01`
idénticas a las de claro.

**Ritmo y densidad.** 9340px de alto; estructura clara de venta financiera clásica: cómo funciona (3
pasos) → por qué elegirnos (4 tarjetas) → servicios (6 tarjetas) → transparencia → FAQ → seguridad →
rentabilidad histórica → testimonios con nombre y cargo real → premios → prensa (`escritorio-claro__00`
a `__04.png`) — más largo y más «argumentado paso a paso» que las fintech americanas del grupo.

**Cifras, rentabilidad y conceptos.** Cifra de rentabilidad histórica presentada con gráfico de cartera
vs. benchmark a 10 años y aviso de contexto inmediato en caja de color: «Es importante recordar que
las rentabilidades pasadas no son un indicador fiable de las rentabilidades futuras», pegado justo
debajo del dato («+131,4% de rentabilidad acumulada media en 10 años», `escritorio-claro__03.png`) —
el aviso de rentabilidad pasada viaja con el dato, no solo al pie. Comparan coste propio (0,53% anual)
frente a la banca tradicional (4,32%) como cifra directa, sin ocultar la referencia.

**Confianza y cumplimiento.** Sección extensa «Máxima seguridad para tu dinero» que explica, banco
custodio por banco custodio y producto por producto, dónde está el dinero, qué fondo de garantía aplica
y hasta qué importe (FGD, FOGAIN), citando auditor (Grant Thornton) y supervisor (CNMV) por nombre
(`escritorio-claro__02.png`) — el desglose de seguridad más detallado y mejor argumentado de las diez
webs, con logos de cada entidad al final a modo de sello.

**Precios.** Comisión comunicada como comparación directa de coste total (0,53% vs 4,32% de la banca),
no como tabla de tarifas por tramo — mensaje de ahorro relativo antes que cifra absoluta.

**Navegación y pie.** Nav simple de 6 enlaces; footer con columnas de empresa/servicios/legal y
selector de país al final («Cambiar de país: Indexa Bélgica, Indexa Francia»,
`escritorio-claro__04.png`) — presente pero discreto, en el pie y no en la cabecera.

**Móvil.** El bloque «Cómo funciona» pasa a tener pestañas (Fondos/Pensiones/EPSV) en vez de mostrar
los tres productos en paralelo (`movil-claro__00.png`) — cambio de patrón de interacción, no solo de
maquetación, entre escritorio y móvil.

**Detalles finos y tono.** Testimonios con foto, nombre, profesión y empresa real («Rubén, operador de
cámara, ATM broadcast»), reseñas de Google con puntuación (4,9, 2555 reseñas) y menciones de prensa
española reconocible (El País, Expansión, Cinco Días, `escritorio-claro__03.png`, `__04.png`). El tono
de redacción es sobrio, explicativo y sin superlativos vacíos — coherente con el público financiero
español.

**Adaptar a CountPips:**
1. Explicar la seguridad del dato/producto con el mismo nivel de detalle nombrando a cada tercero
   implicado (para CountPips: dónde se guardan los datos, qué no se envía a servidor) en vez de una
   frase genérica de «tus datos en tu equipo».
2. Pegar el aviso de «rentabilidad pasada no garantiza resultados futuros» justo debajo de la cifra de
   rendimiento que se esté mostrando (Sharpe, expectancy), como aquí con el gráfico a 10 años.
3. Testimonios con profesión y empresa reales, no solo nombre y foto — da más credibilidad al
   perfil de trader/prop firm que CountPips quiere alcanzar.

**No imitar:** siete secciones de color plano distinto en secuencia (azul, beige, blanco, verde, gris
oscuro, blanco, beige) — bien ejecutado aquí por ser información nueva en cada bloque, pero en una
marca casi monocroma como CountPips generaría una sensación de identidad de color inconsistente.

---

## 9. MyInvestor — https://myinvestor.es

Evidencia: `g5-myinvestor/escritorio-claro__00.png` a `__03.png`, `escritorio-oscuro__00.png`, `__01.png`,
`movil-claro__00.png`, `__01.png`. Datos: `g5-myinvestor/datos.json`. Segunda referencia de español
financiero bien escrito del grupo.

**Primer pliegue.** Titular «Tu banco digital experto en inversión» sobre un fondo gris-verdoso
apagado con una ilustración 3D de un reloj de arena con monedas cayendo (`escritorio-claro__00.png`).
Tres bullets con la cifra clave en negrita al principio de cada uno («2,50% TAE», «Invierte desde 1€»,
«Comisiones mínimas») — patrón de lectura en diagonal: negrita + cifra primero, explicación después.
Dos CTA con jerarquía clara: «Hazte cliente» en azul sólido, «Inicia sesión» en blanco con borde.

**Tipografía.** H1 en AvenirNext a 56px/700, interlineado amplio (72px, ratio ~1.28) — el interlineado
relativo más generoso del grupo. Sin serif en ningún punto; color de texto gris oscuro (`rgb(40,40,40)`)
en vez de negro puro, más suave.

**Color y superficies.** Cada bloque de oferta usa un fondo pastel distinto y una ilustración 3D a
juego (cifra «2,5%» en relieve rosa sobre plataforma azul, cifra «3%» rosa sobre fondo gris claro,
`escritorio-claro__00.png`) — convierte el propio porcentaje en una pieza gráfica 3D, no solo en texto.
Tarjetas de producto con borde fino en vez de sombra, esquinas suaves (`escritorio-claro__01.png`).

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`); `escritorio-oscuro__00/01` idénticas a
las de claro.

**Ritmo y densidad.** 6592px de alto, la web española más corta del grupo; secciones breves y muy
directas, con bastante uso de ilustración fotográfica de producto genérico (reloj de arena, hucha,
billetes, regla) para acompañar los «5 principios básicos para hacer crecer tu dinero»
(`escritorio-claro__02.png`).

**Cifras y comisiones.** Ya señalado: el porcentaje de interés/rentabilidad se convierte en objeto 3D
central de la sección, con la letra pequeña de condiciones justo debajo en texto normal (no oculta,
`escritorio-claro__00.png`). Para acciones y ETF citan comisión exacta («0,12% de compraventa y 0,30%
de cambio de divisa. ¡Nada más!») de forma coloquial y cerrada, remarcando qué NO cobran
(«no tendrás que hacer el 720» —referencia fiscal española entendida por su público objetivo,
`escritorio-claro__01.png`).

**Confianza y cumplimiento.** Franja final antes del footer: «MyInvestor Banco, S.A. es una entidad de
crédito supervisada por el Banco de España y la CNMV. Tus ahorros con nosotros están garantizados por
el Fondo de Garantía de Depósitos Español» con un botón «Saber más» (`escritorio-claro__03.png`) —
mensaje regulatorio corto, sin jerga, con posibilidad de ampliar sin saturar la página. Mencionan
accionistas de referencia (Grupo Andbank, El Corte Inglés Seguros, AXA España) como respaldo
institucional en un párrafo centrado antes del footer.

**Precios.** Comunican coste como cifra concreta y cerrada por servicio (0,12% compraventa, 88% menos
que la banca en Indexa-style), nunca en tabla comparativa amplia.

**Navegación y pie.** Nav de 5 categorías de producto; footer de 3 columnas (Sobre MyInvestor,
Información Corporativa, Ayuda y contacto) con teléfono de contacto visible y enlaces a canal de
denuncias — algo no visto en las otras nueve.

**Móvil.** El logo se reduce a monograma («my») y el nav pasa a menú hamburguesa
(`movil-claro__00.png`); las ilustraciones 3D se mantienen a tamaño completo, ocupando gran parte de
la pantalla — en móvil pesan proporcionalmente más que en escritorio.

**Detalles finos y tono.** Redacción coloquial pero precisa («no tendrás que hacer el 720», «Después,
puedes mantener esta remuneración si inviertes mensualmente») — más cercana y menos corporativa que
Indexa, sin perder rigor en las cifras.

**Adaptar a CountPips:**
1. Convertir una cifra de referencia (por ejemplo el precio 149$/249$, o un ratio como el Sharpe medio
   de muestra) en un pequeño objeto gráfico propio en vez de solo texto, para que una cifra clave
   sea memorable a golpe de vista.
2. Explicar qué NO se cobra o qué NO se hace de forma coloquial y concreta (aquí, referencia fiscal
   española) — para CountPips: qué NO se envía a servidor, qué NO requiere registro.
3. Cerrar el bloque de cumplimiento con un botón «Saber más» opcional en vez de forzar todo el texto
   legal visible de entrada — mantiene la página ligera sin ocultar la información.

**No imitar:** el uso de ilustración 3D de stock genérica (reloj de arena, hucha, casa en miniatura)
desconectada del producto real — para una app de escritorio con capturas propias disponibles, la
ilustración genérica compite con la autenticidad que dan las capturas reales que CountPips ya usa.

---

## 10. Addepar — https://addepar.com

Evidencia: `g5-addepar/escritorio-claro__00.png` a `__02.png`, `escritorio-oscuro__00.png`, `__01.png`,
`movil-claro__00.png`, `__01.png`. Datos: `g5-addepar/datos.json`. Es software B2B para gestores de
patrimonio/family offices, no para el inversor particular, pero es la referencia más «institucional» y
serif del grupo, la más cercana en tono a CountPips.

**Primer pliegue.** Titular serif «Transform your business with Addepar» centrado, en tono crema
(`rgb(250,237,227)`) sobre un fondo verde muy oscuro con textura de puntos tipo constelación
(`escritorio-claro__00.png`). Dos CTA del mismo verde pastel («Request a demo», «Explore the Addepar
platform») sin distinguir cuál es la acción primaria — ambos con el mismo peso visual, a diferencia de
la mayoría del resto del grupo.

**Tipografía.** H1 en «Tiempos Headline Light» (serif) a 48px/400 (peso ligero), interlineado 60px;
cuerpo en «Diatype Regular» sans a 18px. Contraste serif/sans clásico y comedido, sin tracking negativo
llamativo —la combinación tipográfica más parecida al estilo «titulares serif grandes + cuerpo sans»
que ya usa CountPips.

**Color y superficies.** Paleta muy contenida: verde botella oscuro, blanco, gris muy claro y verde
pastel de acento — sin fotografía de personas ni ilustración 3D, solo iconografía lineal fina en verde
oscuro para cada categoría de cliente y solución (`escritorio-claro__01.png`). Separación de secciones
por bandas de color plano (verde oscuro → blanco → gris claro → blanco → gris claro → verde oscuro de
cierre), cantos rectos sin redondeo en botones del hero (`radio: 0px` en `datos.json`).

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`); `escritorio-oscuro__00/01` idénticas a las
de claro.

**Ritmo y densidad.** 5578px de alto, la web más corta de las diez; muy poca floritura, casi todo el
espacio se dedica a explicar a quién sirve el producto (bancos, family offices, gestoras de fondos,
asignadores institucionales, gestión patrimonial) y qué resuelve cada pieza de la plataforma (datos,
alternativos, IA) en formato de rejilla de iconos con texto breve, sin apenas imágenes de producto.

**Cifras y datos.** Franja de métricas de compañía en cifras grandes verdes («$9T assets on platform»,
«1.500+ leading firms globally», «100K+ users», `escritorio-claro__00.png`) — cifras de escala del
negocio, no de rendimiento de inversión (coherente con ser una plataforma de datos, no un bróker).

**Confianza y cumplimiento.** No hay avisos de riesgo de inversión (no es un producto de inversión
directa); la confianza se construye con logos de clientes reales con nombre y caso de uso resumido en
una frase («AWM replaces proprietary system with Addepar...», `escritorio-claro__02.png`) en vez de
cifras de regulación.

**Precios.** No se muestra ningún precio ni enlace a tarifa — coherente con ser venta B2B mediante demo
comercial, no autoservicio.

**Navegación y pie.** Nav con megamenús muy extensos por categoría (`datos.json` → `navLinks`, más de
25 entradas solo en Platform+Solutions); footer verde oscuro de 4 columnas (About, Expertise,
Community, Legal and Privacy) con enlace a informe SOC 3 de seguridad — detalle de cumplimiento técnico
no visto en el resto del grupo.

**Móvil.** El menú colapsa a icono de hamburguesa junto al único CTA visible («Connect with us»,
`movil-claro__00.png`); la rejilla de iconos de producto pasa de 3 a 1 columna sin recortar texto
(`movil-claro__01.png`).

**Detalle técnico visto en la captura:** el bloque de vídeo/imagen de producto bajo el hero aparece
como un rectángulo gris liso sin contenido renderizado (`escritorio-claro__00.png`,
`escritorio-oscuro__00.png`) — mismo patrón de contenido diferido no cargado que en Betterment.

**Adaptar a CountPips:**
1. La combinación de titular serif ligero (peso 400, no negrita) sobre fondo oscuro sobrio, sin
   fotografía ni ilustración, es directamente trasladable al tono «institucional» que ya persigue
   CountPips.
2. Sustituir avisos de rendimiento por cifras de escala/confianza cuando el producto no es de
   inversión directa (aquí: activos gestionados, firmas cliente) — CountPips podría usar cifras de uso
   real (operaciones registradas, horas de journaling) de forma análoga si las tiene.
3. Resumir un caso de cliente real en una sola frase con nombre y logo, en vez de un testimonio largo —
   más rápido de escanear y de aportar sin ocupar espacio.

**No imitar:** dar el mismo peso visual a dos CTA con propósitos distintos («Request a demo» vs.
«Explore the platform») — obliga al visitante a decidir sin ninguna señal de cuál es el camino
recomendado, algo que CountPips ya evita mejor con su CTA único de descarga.

---

## Patrones del grupo

1. **Ningún dark mode real.** Las diez webs tienen `respetaModoOscuro: false` (`datos.json` de cada
   una): ninguna responde a `prefers-color-scheme` del sistema. Wealthfront, Betterment, Public,
   Indexa Capital y MyInvestor son de base clara fija; Robinhood, Mercury y eToro son de base oscura
   fija (su «modo oscuro» es la única identidad, no una alternativa); Trading212 y Addepar también
   fijas. Evidencia: comparar `escritorio-claro__00.png` con `escritorio-oscuro__00.png` en cualquiera
   de las diez carpetas — son idénticas en todos los casos.

2. **La cifra vive dentro de una captura de producto simulada, nunca suelta.** Public
   (`g5-public/escritorio-claro__01.png`), Robinhood (`g5-robinhood/escritorio-claro__01.png`),
   Mercury (`g5-mercury/escritorio-claro__00.png`) y Trading212
   (`g5-trading212/escritorio-claro__01.png`) insertan siempre el dato de rendimiento/saldo dentro de
   un mockup de móvil o panel con jerarquía de UI real (colores verde/rojo, iconos, fechas), no como
   número de titular aislado.

3. **Un único color de acento saturado, reservado solo para conversión.** Betterment (amarillo,
   `g5-betterment/escritorio-claro__00.png`), Trading212 (azul cian), eToro (verde neón,
   `g5-etoro/escritorio-claro__00.png`), MyInvestor (azul), Indexa (naranja) y Robinhood (verde lima)
   usan un solo acento de color para todo CTA primario y casi nada más, manteniendo el resto de la
   paleta neutra.

4. **Secciones separadas por bandas de color plano a toda anchura, no por líneas o sombras.**
   Betterment, Public, Robinhood, Indexa, MyInvestor y Addepar alternan fondos sólidos de sección en
   sección (visible recorriendo `escritorio-claro__00.png` a `__04.png` de cada una) en vez de usar
   filetes o separadores finos entre bloques de contenido.

5. **Contraste serif/sans deliberado en el titular.** Betterment (`Season Mix`), Public (`Denton`),
   Robinhood (`Martina Plantijn`) y Addepar (`Tiempos Headline`) usan una serif de peso variable para
   el h1 y sans para todo lo demás (`datos.json` → `h1.familia` de cada una); Wealthfront mezcla un
   acento cursivo serif dentro de un bloque mayoritariamente sans.

6. **El aviso de coste/riesgo más corto va pegado al CTA o al dato, no solo al pie.** Wealthfront
   (`escritorio-claro__00.png`), Mercury (`escritorio-claro__00.png`), Trading212
   (`escritorio-claro__00.png`), Indexa (`escritorio-claro__03.png`) y eToro
   (`escritorio-claro__00.png`) sitúan una frase corta de disclaimer justo junto al elemento que la
   necesita, además del bloque legal extenso habitual al final.

7. **Prueba social con contexto real, no solo cita genérica.** eToro muestra inversores con foto,
   rendimiento a 24 meses y nº de copiadores (`g5-etoro/escritorio-claro__01.png`); Indexa Capital,
   clientes con foto, nombre y profesión (`g5-indexacapital/escritorio-claro__03.png`); Mercury,
   fundadores de empresas tecnológicas reconocibles con cita y cargo
   (`g5-mercury/escritorio-claro__01.png`).

8. **Selector de idioma explícito en la cabecera, no solo una ruta de URL.** Robinhood
   (`g5-robinhood/escritorio-claro__00.png`), Trading212 y eToro muestran un selector «EN»/globo
   visible en el nav superior, además de (en Trading212) un selector de país distinto en el pie.

9. **Regulación desglosada por entidad/jurisdicción con tarjetas individuales.** Trading212
   (`g5-trading212/escritorio-claro__03.png`: FCA, BaFin, CySEC, ASIC con nº de licencia cada una),
   eToro (`g5-etoro/escritorio-claro__02.png`) e Indexa Capital
   (`g5-indexacapital/escritorio-claro__02.png`, banco custodio + fondo de garantía + auditor con
   nombre) tratan el cumplimiento como bloque de contenido con la misma jerarquía visual que las
   features, no como nota legal aparte.

10. **Ancho de contenido limitado y centrado en escritorio.** El contenedor máximo de contenido en
    viewport de 1440px ronda 1300–1400px en Wealthfront (1312), Betterment (1382) y Mercury (1376)
    según `datos.json` → `anchoContenedorMax`, dejando márgenes laterales generosos en vez de ocupar
    todo el ancho.

11. **Banner de cookies que tapa parcialmente el hero en la primera pantalla.** Robinhood, eToro,
    Mercury, Addepar, Indexa Capital y MyInvestor muestran el banner de consentimiento superpuesto al
    contenido principal en la propia captura de la primera pantalla, antes de cualquier interacción
    (`g5-robinhood/escritorio-claro__00.png`, `g5-etoro/escritorio-claro__00.png`, etc.).

12. **Testimonios y menciones de prensa como sello compacto, no bloque largo.** Wealthfront (sellos de
    Bankrate/NerdWallet), Betterment (WSJ Buy Side), Trading212 (premios + Trustpilot) e Indexa Capital
    (El País, Expansión, Cinco Días) reducen la prueba de prensa a logos en fila con enlace «ver más»,
    sin desarrollarla en el cuerpo de la página.

## Errores del grupo (a evitar)

- **CTAs del mismo peso visual sin jerarquía.** Addepar («Request a demo» / «Explore the platform»,
  `g5-addepar/escritorio-claro__00.png`) y, en menor medida, Wealthfront, ofrecen dos botones idénticos
  en tamaño y color sin indicar cuál es la acción recomendada.
- **Avisos legales en párrafos largos que compiten en atención con el contenido de venta.** Robinhood
  intercala avisos de riesgo extensos centrados a ancho completo entre bloques de producto
  (`g5-robinhood/escritorio-claro__01.png`), pesando visualmente tanto como los propios titulares.
- **Encadenar demasiados módulos de estructura idéntica antes de llegar a precio o cierre.** Public
  repite «título + frase + captura de producto» más de ocho veces seguidas
  (`g5-public/escritorio-claro__01.png` a `__04.png`), alargando el scroll sin variar el patrón visual.
- **Huecos verticales injustificados entre bloques de feature.** Trading212 deja tramos casi vacíos
  entre alguna sección de producto y la siguiente (`g5-trading212/escritorio-claro__01.png`), sin que
  el contenido lo requiera.
- **Overlay de color sobre fotografía real de personas.** eToro tiñe de verde sus fotos de usuarios e
  inversores reales (`g5-etoro/escritorio-claro__01.png`), reduciendo el efecto de autenticidad que la
  propia foto aporta.
- **Fotografía de stock desconectada del producto en el primer pliegue.** Mercury usa una foto de
  paisaje/despacho al aire libre sin ningún elemento de producto visible en el hero
  (`g5-mercury/escritorio-claro__00.png`), perdiendo la oportunidad de mostrar la app real desde el
  primer segundo.
- **Bloques de contenido diferido (vídeo/canvas) que no cargan en el recorrido normal de página.**
  Betterment (`g5-betterment/escritorio-claro__01.png`) y Addepar
  (`g5-addepar/escritorio-claro__00.png`) dejan rectángulos grises vacíos donde debería haber una
  demo o vídeo de producto — un recordatorio de comprobar que todo contenido crítico se sirva sin
  depender de una interacción o de una carga diferida silenciosa.

## Duda a resolver

Ninguna quedó pendiente de decidir por el equipo: todas las diez capturas se completaron y se pudieron
analizar visualmente. La única incidencia reseñable es la geolocalización de Robinhood (servida como
Robinhood Europe en español en vez de la home de EEUU) y el código HTTP 403 de Trading212 con
contenido íntegro — ambas quedan documentadas en su sección correspondiente y no impidieron el
análisis.
