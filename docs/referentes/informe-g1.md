# Informe visual — Grupo 1: gestoras y fondos de inversión

Capturas con Playwright (escritorio 1440 claro y oscuro-del-sistema, móvil 390 claro), troceadas para
mirarlas trozo a trozo. Ninguna de las 10 webs objetivo estuvo bloqueada: las 10 cargaron con código
HTTP 200 en las tres pasadas, sin captcha ni interstitial anti-bot, así que no hizo falta sustituir
ninguna. No se aceptó ningún banner de cookies ni se rellenó ningún formulario.

Nota sobre tiempos de carga: el script mide `cargaMs` en una sola pasada por sitio. Una medición no es
una medición fiable (regla de la casa), así que los tiempos de carga capturados en `datos.json` no se
usan aquí para comparar ni concluir nada — quedan sin verificar y fuera del informe.

---

## 1. BlackRock — https://www.blackrock.com/corporate

**Primer pliegue.** La home real queda tapada por un modal legal a pantalla completa: "Welcome to
BlackRock Corporate site", un muro de texto de condiciones y dos botones (Decline / Accept). Detrás,
en gris atenuado, se adivina un titular editorial y una franja de color. No hay forma de ver el
titular real sin aceptar el aviso legal — algo que las instrucciones prohíben hacer.
Evidencia: `g1-blackrock/escritorio-claro__00.png`.

**Tipografía.** H1 real (medido en DOM aunque tapado): familia `"BLK Fort Condensed"/"BLK Fort"`,
39px, peso 700, interlineado 46px, tracking -1px. Párrafo: BLK Fort, 16px/24px, peso 400. Fuentes
propias cargadas: `BLK Fort`, `BLK Fort Condensed` (sans institucional, sin serif).

**Color y superficies.** Negro/blanco/beige-crema como color de banda, un amarillo de marca puntual
(`rgb(255,206,0)`) en un botón de selector de país. Secciones separadas por bloques de color sólido
(negro, crema) sin sombras ni bordes redondeados (`radio: 0–5px`).
Evidencia: `g1-blackrock/escritorio-claro__01.png`.

**Modo oscuro.** No lo respeta: `escritorio-oscuro__00.png` es visualmente idéntico a
`escritorio-claro__00.png`, mismo fondo blanco. `datos.json` confirma `respetaModoOscuro: false` y
`colorScheme: normal` (no declara la propiedad CSS).

**Ritmo y densidad.** Página corta para el género (alto 3825px). Bloques de contenido pegados unos a
otros, poco aire entre secciones; la franja negra de "Growing with your country" ocupa el ancho
completo sin margen lateral.

**Cifras y datos.** No hay cifras de rendimiento en portada (es la web corporativa, no la de producto);
solo texto editorial y enlaces a "Read Larry Fink's letter".

**Confianza y cumplimiento.** El elemento más marcado de las 10 webs: un pie legal de cientos de
palabras con avisos país por país (UE, Italia, Suiza, Israel, Sudáfrica, DIFC, Arabia Saudí, EE. UU./
Canadá, Latinoamérica, Singapur, Hong Kong, Corea del Sur, Taiwán, Australia, China), cada uno con su
propio párrafo regulatorio. Evidencia: `g1-blackrock/escritorio-claro__01.png`.

**Navegación y pie.** Menú superior simple (About Us, Newsroom, Insights, Investor Relations,
Corporate Sustainability, Careers) más un selector "Local websites". Pie a tres columnas (Corporate /
Legal / descripción de la firma) sobre fondo negro, con enlace directo a "Manage Cookies".

**Móvil.** El modal legal ocupa toda la pantalla en vertical, obligando a hacer scroll dentro del propio
modal para leer las condiciones antes de decidir. El resto del contenido se apila en una sola columna
sin sorpresas. Evidencia: `g1-blackrock/movil-claro__00.png`.

**Detalles finos.** Sin vídeo en el primer pliegue (solo foto de directivo). Iconografía mínima.

**Para CountPips:**
1. Adaptar: un único gate de consentimiento compacto (como ya hace CountPips) es mejor experiencia
   que un modal legal de pantalla completa — mantenerlo así.
2. Adaptar: reservar en el pie un bloque breve y honesto de límites/avisos (p. ej. "resultados de
   muestra, no rendimiento real") en vez de omitirlo, sin llegar al muro de texto de BlackRock.
3. Adaptar: separar secciones con bloques de color sólido a ancho completo da sensación de firma
   seria sin necesitar sombras ni gradientes.
4. Evitar: el modal de bienvenida a pantalla completa que bloquea toda interacción — en un producto
   de escritorio sin registro, no tiene sentido y solo genera fricción.

---

## 2. Vanguard — https://investor.vanguard.com

**Primer pliegue.** Carrusel de imagen a ancho completo en rojo de marca con foto de persona real,
titular editorial rotando ("Earn 8x the APY…" / "You deserve investing advice…"), CTA superpuesto.
Debajo, una segunda franja con el verdadero titular de marca "Investing for everything it's worth" y
dos CTAs (Log in / Open an account). Tres llamadas a la acción visibles en el primer pliegue: dos en
el carrusel y dos más justo debajo. Evidencia: `g1-vanguard/escritorio-claro__00.png`.

**Tipografía.** H1 "Investing for everything it's worth": `"FF Mark"`, 92px, peso 800, interlineado
96px, tracking -2px — el H1 más grande de las 10 webs. Párrafo: FF Mark 17px/24px. Una sola familia
sans para todo (sin serif).

**Color y superficies.** Rojo de marca (`rgb(194,0,41)`) muy presente en CTAs y en la franja
"You're in good company" (granate). Botones con `border-radius: 80px` (píldora total). Tarjetas con
fondo blanco y borde fino, sin sombra.

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`); `escritorio-oscuro__00.png` es idéntico a
claro salvo el frame del carrusel, que avanzó una posición por el paso del tiempo.

**Ritmo y densidad.** Página larga (alto 6619px) con buen uso del ancho: tarjetas a 4 columnas, franjas
de color a ancho completo. Sección final con gráfico sparkline en vivo "S&P 500 Index" que se
actualiza (según el texto) cada 15 minutos. Evidencia: `g1-vanguard/escritorio-claro__02.png`.

**Cifras y datos.** Franja granate con cifras grandes: "50M+ investors" y "77% of Vanguard mutual fund
and ETFs outperformed their peer-group averages" con nota al pie numerada (¹) que se explica en un
bloque de texto gris al final de la página, justo antes del pie. Incluye enlace "FINRA's BrokerCheck".
Evidencia: `g1-vanguard/escritorio-claro__01.png` y `__02.png`.

**Confianza y cumplimiento.** Bloque de disclaimers en gris/cursiva antes del pie: "All investing is
subject to risk, including the possible loss of the money you invest", identificación de las entidades
reguladas (Vanguard Advisers Inc., Vanguard National Trust Company) y enlace a FINRA BrokerCheck.
Mucho más breve que el de BlackRock.

**Navegación y pie.** Menú superior con desplegables (Products & services, Why we're different,
Resources & education) — posible megamenú no capturado al no interactuar. `datos.json` no detectó
enlaces en `header a, nav a` (`navLinks: []`): la navegación no usa marcado `<nav>`/`<header>`
estándar, un déficit de accesibilidad. Pie sobrio a 4 columnas sobre gris muy claro.

**Móvil.** Bug real: el carrusel del hero desborda el viewport — el texto "Earn 8x the APY…" queda
cortado por ambos lados de la pantalla en vez de ajustarse al ancho de 390px.
Evidencia: `g1-vanguard/movil-claro__00.png`.

**Detalles finos.** Vídeo con transcripción accesible ("Open transcript") junto al vídeo — buena
práctica de accesibilidad poco vista en el resto del grupo.

**Para CountPips:**
1. Adaptar: mostrar una cifra de confianza a gran tamaño con su nota al pie discreta (el patrón
   "77%¹ ... nota abajo") comunica solidez sin prometer de más.
2. Adaptar: acompañar cualquier vídeo/demo con transcripción o texto alternativo.
3. Adaptar: usar un solo color de acento con fuerza (aquí el rojo) en vez de repartir varios, para que
   los CTA se noten sin recurrir a más contraste del necesario.
4. Evitar: el desbordamiento horizontal de contenido en móvil — cualquier carrusel o banda ancha debe
   probarse a 390px antes de publicar.

---

## 3. Bridgewater — https://www.bridgewater.com

**Primer pliegue.** Tarjeta editorial + vídeo destacado con foto de la co-CIO Karen Karniol-Tambour
hablando a cámara, controles de carrusel (flechas). No hay ningún H1 en la página — el `datos.json`
no registra ningún encabezado H1 en todo el documento, solo H2/H3. Evidencia:
`g1-bridgewater/escritorio-claro__00.png`.

**Tipografía.** El párrafo principal usa `"Mercury Display A/B", Times New Roman, serif` a 24px/34px —
serif editorial, no sans. Es la única de las 10 con tipografía de cuerpo en serif desde el arranque.
Fuentes cargadas: Mercury Display (display serif) + Whitney (sans para UI).

**Color y superficies.** Fondo blanco, acento granate oscuro (`rgb(128,36,30)`) en un único botón
("Clients"). Tarjetas blancas sobre fondo gris muy claro, sin sombra, cantos rectos (0px).

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`); captura oscura idéntica a la clara.

**Ritmo y densidad.** Página corta (alto 3250px). Sección "What We Do" centrada, en serif, con "+ READ
MORE" para expandir — economía de texto en el primer scroll.

**Cifras y datos.** Ninguna cifra de rendimiento en portada; contenido 100% editorial (noticias,
podcasts, artículos de los co-CIO).

**Confianza y cumplimiento.** Pie con enlaces a "SFDR Disclosures", "Quebec Complaint Policy",
"Phishing and Fraud Awareness Notice" — cumplimiento tratado como enlaces discretos en vez de muro de
texto. Evidencia: `g1-bridgewater/escritorio-claro__01.png`.

**Navegación y pie.** Menú superior en mayúsculas pequeñas (RESEARCH & INSIGHTS, AIA LABS, CULTURE,
PEOPLE, WORKING AT BRIDGEWATER, OUR FOUNDER). Pie con foto de paisaje, dirección física, teléfono e
iconos sociales — el único de las 10 gestoras/fondos "clásicas" que humaniza tanto el pie.

**Móvil.** El banner de cookies (barra fija oscura) se solapa sobre el texto de "What We Do", tapando
parte de la frase en curso — error de superposición real, visible en la captura.
Evidencia: `g1-bridgewater/movil-claro__00.png`.

**Detalles finos.** Marca gráfica: un trazo curvo rojo sobre el logotipo, distintivo y sobrio.

**Para CountPips:**
1. Adaptar: el patrón "+ READ MORE" para expandir un bloque de texto largo sin alargar la página
   antes del primer scroll.
2. Adaptar: llevar el cumplimiento a enlaces con nombre propio (política concreta) en vez de un
   párrafo genérico, cuando la naturaleza del producto lo permita.
3. Adaptar: un pie con un toque humano (fotografía real, contacto directo) sin perder seriedad.
4. Evitar: el banner fijo que se superpone al contenido en móvil — cualquier banner debe empujar el
   contenido, no flotar encima de él.

---

## 4. Two Sigma — https://www.twosigma.com

**Primer pliegue.** Titular centrado "It starts with a hypothesis" sobre un fondo degradado abstracto
turquesa→añil con líneas de rejilla sutiles de fondo, flecha de scroll animada debajo. Una sola CTA
clara en el primer pliegue ("Explore open opportunities", dentro de la banda morada de reclutamiento).
Evidencia: `g1-twosigma/escritorio-claro__00.png`.

**Tipografía.** H1 en `ttc, sans-serif`, 94px, peso 700 — el más grande en número de px del grupo junto
a Vanguard. Párrafo 26px, peso 300 (ligero), buen contraste de peso entre titular y cuerpo.

**Color y superficies.** Única del grupo en usar una paleta de color viva (turquesa, morado, azul) de
forma sistemática, no solo como acento puntual. Tarjetas con esquinas rectas, degradados en fotos de
equipo mezclados con bloques de color sólido a modo de mosaico.

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`).

**Ritmo y densidad.** Alto medio (5027px), buen uso del ancho completo en las franjas de color; las
tarjetas de 3 columnas dejan aire generoso entre ellas.

**Cifras y datos.** Fila de 4 cifras grandes con separadores finos: "$80B+ in assets under management",
"~1,700 people across 3 continents", "25 years using AI in investing", "~640 petabytes of data
processed". Evidencia: `g1-twosigma/escritorio-claro__01.png`.

**Confianza y cumplimiento.** No hay avisos de riesgo visibles en el primer tramo de la home (es más
una web de marca/talento que de producto financiero directo al público).

**Navegación y pie.** Menú con "Businesses" desplegable (Investment Management, Securities, Real
Estate, Sightway Capital) y "Insights" (Data Science, Engineering, Markets & Economy). Estructura por
disciplina, no por producto.

**Móvil.** El banner de cookies se muestra como tarjeta fija con botón de cierre (X) y dos CTAs
(Reject All / Accept All Cookies) bien diferenciados, sin tapar contenido crítico. Las tarjetas de
"Sophisticated technology platform" pasan a carrusel horizontal con puntos indicadores.
Evidencia: `g1-twosigma/movil-claro__00.png`.

**Detalles finos.** Foto de equipo tratada como mosaico con bloques de color intercalados —
convierte una galería de personas en un elemento gráfico de marca.

**Para CountPips:**
1. Adaptar: usar 3–4 cifras de la propia app (no solo Sharpe/drawdown) en una fila con separadores
   finos, como refuerzo de autoridad — CountPips ya lo hace parcialmente, el patrón está validado aquí.
2. Adaptar: fondo degradado abstracto y sutil como identidad visual del hero, si se quisiera introducir
   algo de color sin romper la seriedad.
3. Adaptar: contraste de peso tipográfico fuerte entre H1 (700) y cuerpo (300) para dar jerarquía sin
   depender del tamaño.
4. Evitar: mezclar tantas paletas de color (turquesa + morado + azul + verde) — funciona en una marca
   "tech/talento", pero diluiría el posicionamiento institucional que persigue CountPips.

---

## 5. AQR — https://www.aqr.com

**Primer pliegue.** Franja gris superior de aviso de seguridad ("Fraudulent Schemes Impersonating AQR
Capital Management…") antes incluso del logotipo — link a más información. Debajo, hero con fondo
foto/ilustración de espirales abstractas azul-verde y titular "Investment Innovation at the
Intersection of Technology, Data, and Behavioral Finance". Evidencia:
`g1-aqr/escritorio-claro__00.png`.

**Tipografía.** H1 en `Polaris-Bold`, 37px — el H1 más pequeño en px de todo el grupo, compensado por
ocupar 3 líneas. Cuerpo en `Polaris-Roman`, 16px/25px, tracking +0.4px. Tipografías propietarias (no
de sistema), sans en ambos casos.

**Color y superficies.** Azul institucional (`#009FDF` en botones) y fondo alterno claro/oscuro por
sección (banda "Our Approach" gris-azulada muy pálida, banda "Cliff's Perspectives" azul marino).
Fotografía en blanco y negro para el fundador (Cliff Asness), color solo en UI.

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`).

**Ritmo y densidad.** Página corta (3319px), bandas de color bien delimitadas, sin exceso de aire.

**Cifras y datos.** No hay cifras de rendimiento en el primer pliegue; la web pone el foco en artículos
de investigación ("Featured Insights") y en la voz personal del fundador.

**Confianza y cumplimiento.** Justo antes del pie: "Investors should conduct their own analysis...
Diversification does not eliminate the risk... Past performance is not a guarantee of future results"
— tres frases, discretas, en gris pequeño. Evidencia: `g1-aqr/escritorio-claro__01.png`.
El aviso antifraude en la cabecera es el único de las 10 webs con ese tipo de alerta permanente.

**Navegación y pie.** Pie oscuro a 4 columnas (Education / What We Do / Our Firm / MyAQR) con marca
circular centrada al final, y una barra legal final con Form CRS, Equal Opportunity Employer.

**Móvil.** El banner de cookies (con 3 botones apilados: Manage Preferences / Accept All / Reject
Non-Essential) tapa parte del texto "Featured Insights" mientras no se decide, igual que en Bridgewater
y Jane Street. Evidencia: `g1-aqr/movil-claro__00.png`.

**Detalles finos.** Contenido personalizado en torno a una persona real (Cliff Asness) como forma de
generar confianza — "voz" en vez de solo institución.

**Para CountPips:**
1. Adaptar: tres frases de riesgo/limitación breves y en gris, justo antes del pie, en vez de un
   párrafo largo o de omitirlas — encaja con el tono sobrio que ya tiene CountPips.
2. Adaptar: si en algún momento hay contenido de opinión/fundador, tratarlo como sección con nombre y
   cara reconocibles en vez de texto anónimo institucional.
3. Adaptar: alternar el fondo de sección (blanco / gris muy pálido / azul oscuro) para marcar cambio
   de tema sin usar líneas divisorias.
4. Evitar: los banners de cookies como barra fija de altura completa que tapa el titular en móvil —
   patrón repetido y siempre negativo en las tres webs donde aparece así.

---

## 6. PIMCO — https://www.pimco.com

**Primer pliegue (bloqueado por diseño, no por anti-bot).** Antes de mostrar nada, PIMCO obliga a
elegir un segmento de visitante: "Inversor profesional" o "Inversor minorista", dentro de un modal
con gestor de cookies granular encima. El sitio se sirvió en español ("PIMCO España") pese a pedir
`en-US` — geolocalización por IP. Evidencia: `g1-pimco/escritorio-claro__00.png`.

**Tipografía.** H1 (el de la pieza destacada del carrusel) en `Juana, serif`, 48px, peso 500 — la web
del grupo con más peso serif en el propio titular de producto (no solo en editorial). Cuerpo en
`Roboto, sans-serif` 16px/32px, interlineado muy generoso.

**Color y superficies.** Azul marino (`rgb(0,36,60)`) como color de marca dominante, un cian vivo
(`rgb(0,246,255)`) como acento de CTA — combinación fría de alto contraste. Cantos totalmente rectos
(`radio: 0px` en casi todos los botones).

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`).

**Ritmo y densidad.** Página larga (4991px desktop, 9061px en móvil): mucho contenido editorial
apilado (carrusel de "Perspectivas destacadas", bloque de ayuda, bloque legal).

**Cifras y datos.** No hay cifras de rendimiento propias en el primer pliegue (es contenido editorial:
"Warsh enfatiza la estabilidad de precios…"), coherente con ser gestora de renta fija que reparte el
dato por producto, no en la portada corporativa.

**Confianza y cumplimiento.** El bloque más extenso del grupo: una sección completa "Avisos Legales"
en fondo azul marino con subtítulos en negrita (Capital en riesgo, Instrumentos derivados, Bonos de
titulización hipotecaria, Morningstar Ratings, Índice de referencia, Correlación) — varios cientos de
palabras antes del pie. Evidencia: `g1-pimco/escritorio-claro__01.png`.

**Navegación y pie.** Pie oscuro con columnas "Inversiones" / "Sobre nosotros", foto de fachada de
oficina con palmeras (sede en Newport Beach) como elemento de marca en el pie.

**Móvil.** La segmentación profesional/minorista se mantiene como modal a pantalla completa también en
390px. Una vez pasado, el contenido editorial se reorganiza como lista compacta con una barra de color
vertical a la izquierda de cada titular (paleta por categoría: verde agua, azul). Evidencia:
`g1-pimco/movil-claro__00.png`.

**Detalles finos.** Distintivo de reproducción de vídeo en cian sobre una miniatura editorial —
único uso de ese color fuera de los CTA.

**Para CountPips:**
1. Adaptar: usar una barra de color vertical junto al titular como forma económica de categorizar
   contenido en listas (recursos, novedades) sin depender de iconos.
2. Adaptar: si se necesita distinguir "trader manual" de "prop firm" (como ya hace CountPips), el
   patrón de dos tarjetas simples con icono es más ligero que el modal a pantalla completa de PIMCO.
3. Adaptar: agrupar los avisos legales bajo un único título expandible/localizado en vez de dispersarlos,
   para no perder la sobriedad visual aunque el contenido sea extenso.
4. Evitar: bloquear el acceso a la home con un formulario de segmentación de dos opciones antes de
   dejar ver nada — en un producto sin registro como CountPips no aporta nada y sí fricción.

---

## 7. Man Group — https://www.man.com

**Primer pliegue.** Selector explícito de país/audiencia/idioma en la barra superior ("España · Public
· Español"), gráfico geométrico abstracto en azul (bloques y líneas tipo "cristal roto") de fondo del
hero, tapado de inmediato por un gestor de cookies Cookiebot con 4 interruptores independientes
(Necessary / Preferences / Statistics / Targeting) — el control de cookies más granular visto en el
grupo. Evidencia: `g1-man/escritorio-claro__00.png`.

**Tipografía.** H1 "Inversiones en Man" en `Rubik, sans-serif`, 64px, peso 600, color azul de marca
(no negro) — el único H1 del grupo que no es negro/blanco puro.

**Color y superficies.** Sistema de color por categoría de activo: cada una de las 4 tarjetas
("Alternativos", "Crédito", "Renta variable", "Multiactivos") lleva un icono en un color distinto
(azul marino, cian, magenta, verde menta) — codificación cromática consistente, único caso así en el
grupo. Evidencia: `g1-man/escritorio-claro__01.png`.

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`).

**Ritmo y densidad.** Alto medio (3897px), buena separación de secciones con fondo blanco/gris muy
claro alternado, franja final en verde de textura "ondas" para "Perspectivas y análisis".

**Cifras y datos.** Fila de 4 cifras grandes con nota al pie datada ("Nota: Activos gestionados y
plantilla totales a 30 de junio de 2026"): "253.600 millones", "Más de 30 años", "Más de 600
especialistas", "Más de 160 estrategias".

**Confianza y cumplimiento.** Frase de responsabilidad regulatoria en el pie ("Los servicios de gestión
de inversiones se ofrecen a través de las filiales reguladas de Man Group plc…") y una fila de enlaces
legales que incluye, de forma inusual, "Esclavitud moderna" y "Glosario". Evidencia:
`g1-man/escritorio-claro__01.png`.

**Navegación y pie.** Menú por función (Buscador de fondos, Capacidades, Perspectivas, Tecnología,
Quiénes somos) más selector de perfil (Inversores institucionales / Profesionales financieros) a modo
de segmentación suave (no bloqueante, solo enlaces).

**Móvil.** El gestor de cookies Cookiebot ocupa la pantalla completa con los 4 interruptores apilados
verticalmente — en 390px es más alto que el propio contenido visible, obligando a un scroll extra solo
para decidir sobre cookies. Evidencia: `g1-man/movil-claro__00.png`.

**Detalles finos.** Iconografía lineal simple (banco, apretón de manos) para las dos audiencias
(institucional / profesional).

**Para CountPips:**
1. Adaptar: codificar con color un pequeño set de categorías (p. ej. tipos de métrica o de recurso)
   de forma consistente en toda la web, no solo en un lugar puntual.
2. Adaptar: acompañar cifras agregadas con una nota de fecha de corte explícita ("a 30 de junio de
   2026"), práctica que refuerza la sensación de dato real y no decorativo.
3. Adaptar: segmentar audiencias (trader manual / prop firm) mediante enlaces suaves dentro del
   contenido, nunca mediante un modal bloqueante.
4. Evitar: un gestor de consentimiento tan largo que en móvil ocupe más alto que la propia portada —
   simplificar a "aceptar / solo necesarias" (como hace ya CountPips) es más rápido de resolver.

---

## 8. Jane Street — https://www.janestreet.com

**Primer pliegue.** Titular condensado en mayúsculas "SOLVING THE PUZZLE OF GLOBAL MARKETS" sobre un
patrón de hexágonos que enmarca una foto real de una persona trabajando — el patrón geométrico
literaliza la metáfora del "puzzle" del propio naming. Una sola CTA principal ("Join us"). Evidencia:
`g1-janestreet/escritorio-claro__00.png`.

**Tipografía.** H1 en `"Alright Sans LT"`, 72px, peso 800, mayúsculas, sin tracking añadido. Cuerpo
16px, peso 300 — el peso 300 es el mismo patrón "titular pesado / cuerpo ligero" que Two Sigma.

**Color y superficies.** Blanco y negro casi puro, con azul de marca (`rgb(11,65,158)`) solo en el CTA
principal. Superficie visual distintiva: el patrón de hexágonos en contorno fino, repetido como fondo
en varias secciones (marca de agua geométrica).

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`).

**Ritmo y densidad.** Página muy corta para el grupo (2955px desktop): la home actúa casi como landing
de reclutamiento, con pocas secciones pero bien resueltas.

**Cifras y datos.** No hay cifras de rendimiento ni AUM en la portada — foco total en cultura y
contratación (internships, eventos, programas).

**Confianza y cumplimiento.** Pie compacto con una sola línea de texto legal (regulador SEC/FINRA,
entidades por país) y un enlace directo "Fraud and Impersonation Warnings" — mismo patrón de alerta
antifraude que AQR pero integrado en el pie en vez de en cabecera. Evidencia:
`g1-janestreet/escritorio-claro__01.png`.

**Navegación y pie.** Menú por audiencia (Who We Are, What We Do, The Latest, Culture, Join Jane
Street), selector de idioma (简体中文) en el pie, declaración de igualdad de oportunidades.

**Móvil.** El banner de cookies (fijo, oscuro) tapa parte del cuerpo del titular ("...reach, ... help
Islands." se lee cortado bajo el banner) — mismo error de superposición que Bridgewater y AQR.
Evidencia: `g1-janestreet/movil-claro__00.png`.

**Detalles finos.** Un podcast propio con identidad gráfica ilustrada ("Signals & Threads", logo con
una curva de mercado dibujada a mano) y un widget 3D animado de "superficie de datos" tipo mapa de
calor topográfico para ilustrar machine learning — el elemento más lúdico/técnico visto en el grupo.
Evidencia: `g1-janestreet/escritorio-claro__00.png` y `escritorio-claro__01.png`.

**Para CountPips:**
1. Adaptar: que el propio patrón visual (aquí, el hexágono) refuerce literalmente el naming/concepto
   de marca, en vez de ser decoración genérica.
2. Adaptar: contraste tipográfico titular-pesado/cuerpo-ligero (800 vs 300) para dar jerarquía fuerte
   sin recurrir a más de un tamaño de fuente por bloque.
3. Adaptar: un pie compacto de una sola línea legal cuando el negocio no exige más — no todo producto
   necesita el aparato regulatorio de una gestora minorista.
4. Evitar: repetir el error del banner de cookies fijo que tapa texto en móvil — tercera vez que
   aparece en el grupo (con Bridgewater y AQR), es el fallo más repetido de todos.

---

## 9. Citadel — https://www.citadel.com

**Primer pliegue.** Vídeo de fondo con desenfoque de movimiento (personas caminando en oficina) y
titular serif superpuesto "Together, We Turn Ambition Into Action", seguido de inmediato por un
banner de cookies azul a todo lo ancho que tapa buena parte del texto de apoyo. Evidencia:
`g1-citadel/escritorio-claro__00.png`.

**Tipografía.** H1 en `Signifier` (serif), 72px, peso 400 (no negrita) — el único H1 del grupo en
serif de peso regular en vez de bold. Cuerpo en `"TT Commons"`, 20px/28px.

**Color y superficies.** Azul marino de marca (`rgb(20,74,165)` / `rgb(0,47,108)`) sobre blanco.
Nota técnica: en escritorio se detectó `scrollHorizontal: true` y un ancho de viewport efectivo de
1477/1474px en vez de los 1440px solicitados — posible barra de desplazamiento horizontal o elemento
que desborda el ancho; **sin verificar la causa exacta**, queda como duda para revisión aparte.

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`).

**Ritmo y densidad.** Página larga (5745px), con fotografía editorial de gran formato entre bloques de
texto — mucho peso visual a la fotografía de personas trabajando.

**Cifras y datos.** Patrón muy cuidado: cifra grande + una línea de contexto + nota de fuente en gris
pequeño justo debajo, cifra por cifra: "1990 — Year founded by CEO Ken Griffin", "$76B — Investment
capital as of September 1, 2026" (con párrafo explicando qué incluye ese capital), "#1 — Most
profitable hedge fund manager of all time" con cita a "LCH Investments NV estimates… Awarded January
18, 2026". Es la web del grupo que más cuidado pone en sostener cada cifra con su fuente exacta.
Evidencia: `g1-citadel/escritorio-claro__00.png` y `__01.png`.

**Confianza y cumplimiento.** No hay bloque de riesgo/regulación visible en el tramo capturado (más
orientada a talento/marca que a producto regulado al público).

**Navegación y pie.** Menú muy reducido (Who We Are, What We Do, News, Careers, Client Login) —
el más minimalista del grupo en número de enlaces.

**Móvil.** El banner de cookies ocupa una porción considerable de la pantalla justo bajo el hero de
vídeo, pero no llega a tapar texto (a diferencia de Bridgewater/AQR/Jane Street): empuja el contenido
hacia abajo en vez de superponerse. Evidencia: `g1-citadel/movil-claro__00.png`.

**Detalles finos.** Números tipográficos grandes en serif con superíndices de unidad ("$" y "#" en
tamaño menor, pegados al número) — un tratamiento tipográfico específico para cifras, distinto del
resto de la web.

**Para CountPips:**
1. Adaptar: el patrón "cifra grande + contexto + fuente exacta y fecha" para las métricas de la demo
   (Sharpe, drawdown…) — ya se cita "sobre 200 operaciones de muestra", reforzar con fecha de cálculo.
2. Adaptar: un tratamiento tipográfico propio para números grandes (símbolo de unidad en tamaño menor)
   como refuerzo de jerarquía visual sin necesitar color.
3. Adaptar: que el banner de cookies empuje el contenido en vez de superponerse, incluso en vídeo de
   fondo — patrón correcto que evita el error más repetido del grupo.
4. Evitar: el desbordamiento de ancho detectado en escritorio (scroll horizontal) — cualquier layout a
   ancho fijo debe verificarse contra el viewport real, no solo contra el diseño.

---

## 10. Point72 — https://point72.com

**Primer pliegue.** Fotografía cinematográfica de gran formato (personas trabajando, luz natural) con
un titular enorme y translúcido superpuesto, "Build it here." en serif ligera blanca — tratamiento
casi de cartel de cine. Barra de aviso de cookies de una sola línea, discreta, arriba del todo (no
bloquea nada). Evidencia: `g1-point72/escritorio-claro__00.png`.

**Tipografía.** El H1 real no lleva ese título ("Build it here." está fuera del H1 según el DOM, que
registra `h1` vacío); título editorial en serif ligera de gran tamaño y titulares de sección también en
serif (p. ej. "Multiple Strategies. Infinite Opportunities. One Firm."). Cuerpo en `Aptos, sans-serif`,
14–20px según sección.

**Color y superficies.** Fondo casi negro (`rgb(24,24,26)`) en varias secciones, con un dorado/marrón
cálido (`rgb(176,135,37)`) como único acento de color — la única gestora del grupo que usa un acento
cálido en vez de azul. Tarjetas sobre fondo crema muy pálido, sin sombra, con una etiqueta de categoría
en el mismo dorado (DEVELOPMENT, CULTURE, COLLEGIALITY). Evidencia:
`g1-point72/escritorio-claro__00.png` y `__01.png`.

**Modo oscuro.** No lo respeta (`respetaModoOscuro: false`).

**Ritmo y densidad.** Página larga (4944px desktop, 7413px móvil), alternando fondo crema y negro por
sección con buen contraste editorial.

**Cifras y datos.** Fila de 3 cifras grandes con línea fina encima, superíndices de nota y una única
leyenda de fecha compartida abajo: "$58.5b — APPROXIMATE AUM¹", "3,300+ — EMPLOYEES GLOBALLY²",
"200+ — INVESTING TEAMS", y debajo "All statistics as of July 1, 2026" en cursiva pequeña — evita
repetir la fecha en cada cifra. Evidencia: `g1-point72/escritorio-claro__01.png`.

**Confianza y cumplimiento.** Aviso de cookies de una sola línea en la parte superior ("Point72, L.P.
and its affiliates and our third-party partners use cookies…") sin bloquear nada; no se ve bloque de
riesgo regulatorio en el tramo capturado (marca/talento, no producto minorista).

**Navegación y pie.** Menú reducido (About Us, Careers, Perspectives) con desplegables "+", CTA
diferenciado "Browse Open Roles" en la esquina.

**Móvil.** El único de los 10 con un aviso de cookies de una sola línea también en móvil, sin tapar
nada del hero — mejor comportamiento del grupo en este punto junto con Man/Two Sigma/PIMCO/Citadel.
Evidencia: `g1-point72/movil-claro__00.png`.

**Detalles finos.** Icono de marca hecho de puntos tipo circuito/huella digital, distintivo y sutil;
icono de "play con sonido" en las fotos con vídeo de fondo.

**Para CountPips:**
1. Adaptar: agrupar la fecha de corte de varias cifras en una única leyenda al final de la fila, en
   vez de repetirla cifra a cifra — más limpio visualmente.
2. Adaptar: un acento de color cálido y poco habitual en el sector (aquí dorado) puede diferenciar sin
   perder seriedad, si se aplica con la misma disciplina de un solo acento que aquí.
3. Adaptar: el aviso de cookies de una sola línea sin bloquear contenido — el patrón menos invasivo de
   todo el grupo.
4. Evitar: dejar el H1 real vacío de texto en el marcado (usar imagen/overlay como titular visual sin
   un H1 semántico equivalente) — perjudica SEO y accesibilidad, y aquí se repite en dos de las diez
   webs (Point72 y Bridgewater).

---

## Patrones del grupo

Los 8–12 patrones más repetidos o mejor resueltos, con qué webs lo hacen y su evidencia:

1. **Ninguna de las 10 respeta el modo oscuro del sistema.** Las 10 sirven la misma hoja de estilos
   pase lo que pase en `prefers-color-scheme`; en las 10, `escritorio-oscuro__00.png` es
   pixel-a-pixel casi idéntico a `escritorio-claro__00.png` y `datos.json` confirma
   `respetaModoOscuro: false` en las 10. Contraste directo: CountPips sí lo respeta
   (`countpips/escritorio-oscuro__00.png` vs `countpips/escritorio-claro__00.png`).
2. **Cifra grande + nota de fuente/fecha pequeña justo debajo**, para dar autoridad sin parecer
   publicidad: Vanguard (`escritorio-claro__01.png`, "77%¹"), Citadel (`escritorio-claro__00.png`,
   "#1" con cita a LCH Investments), Point72 (`escritorio-claro__01.png`, "All statistics as of July
   1, 2026"), Man Group (`escritorio-claro__00.png`, nota de fecha de corte).
3. **El banner de cookies fijo tapando texto es el error de móvil más repetido**: Bridgewater
   (`movil-claro__00.png`), AQR (`movil-claro__00.png`) y Jane Street (`movil-claro__00.png`) muestran
   el mismo fallo — un banner en posición fija se superpone al titular o al cuerpo de texto en
   viewport de 390px.
4. **Segmentación de audiencia con modal bloqueante antes de mostrar nada**: PIMCO obliga a elegir
   Inversor profesional/minorista (`g1-pimco/escritorio-claro__00.png`); BlackRock obliga a aceptar
   condiciones legales (`g1-blackrock/escritorio-claro__00.png`). Man Group, en cambio, resuelve la
   misma necesidad con enlaces suaves, no bloqueantes (`g1-man/escritorio-claro__00.png`).
5. **Contraste de peso tipográfico titular-pesado/cuerpo-ligero** (700–800 en el H1, 300 en el
   cuerpo) para dar jerarquía sin más tamaños: Two Sigma (94px/700 vs 26px/300) y Jane Street
   (72px/800 vs 16px/300), ambas en `datos.json` → `pasadas.escritorio-claro.h1` y `.parrafo`.
6. **Un único color de acento de marca aplicado con disciplina**, en vez de repartir varios: Vanguard
   (rojo), Jane Street (azul), Point72 (dorado) — todas usan un solo color no-neutro en CTAs y
   detalles, dejando el resto en negro/blanco/gris.
7. **Gestores de cookies con más de dos opciones (granulares) en las gestoras minoristas** (PIMCO,
   Man Group, AQR, Two Sigma, Citadel muestran Accept/Reject/Manage Preferences con 3–4 categorías),
   frente a un cookies de una sola línea sin fricción en las firmas de trading/hedge fund orientadas a
   talento (Jane Street footer, Point72 `escritorio-claro__00.png`).
8. **Codificación de color por categoría de producto**: solo Man Group asigna un color distinto a cada
   clase de activo (Alternativos/Crédito/Renta variable/Multiactivos) de forma sistemática
   (`g1-man/escritorio-claro__01.png`).
9. **Fotografía real de personas trabajando como refuerzo de confianza**, no solo stock genérico:
   Bridgewater (co-CIO hablando a cámara), Citadel (persona en mesa de trading con monitores),
   Point72 (oficina real), AQR (fundador en b/n) — las cinco firmas "de trading puro" del grupo
   (Bridgewater, Two Sigma, AQR, Jane Street, Citadel, Point72) usan más fotografía de personas reales
   que las gestoras minoristas tradicionales (BlackRock, Vanguard, PIMCO, Man), que tiran más de
   fotografía de stock genérica de clientes.
10. **Pies de página proporcionales al grado de regulación minorista**: BlackRock y PIMCO (venden
    fondos directamente al público minorista) tienen los pies legales más largos del grupo
    (`g1-blackrock/escritorio-claro__01.png`, `g1-pimco/escritorio-claro__01.png`); Jane Street y
    Citadel (institucional/talento, sin producto minorista) tienen los pies más cortos.

## Errores del grupo (a evitar)

- **Banner de cookies fijo que tapa contenido en móvil** (Bridgewater, AQR, Jane Street): cualquier
  aviso debe reservar su propio espacio en el flujo del documento, nunca flotar encima del texto.
- **H1 vacío o inexistente en el marcado** (Bridgewater no tiene ningún `<h1>` en la home; Point72
  tampoco): perjudica SEO y lectores de pantalla aunque el titular visual exista como imagen/overlay.
- **Navegación principal fuera de `<nav>`/`<header>` semánticos** (Vanguard y AQR: `datos.json` no
  encontró ningún enlace bajo esos selectores): dificulta la navegación por landmarks a usuarios de
  lector de pantalla — **hallazgo de estructura DOM, no confirmado visualmente por captura**, se
  marca como pendiente de revisar con un inspector de accesibilidad real antes de generalizar.
- **Modal de bienvenida o segmentación que bloquea toda la home** (BlackRock, PIMCO): añade un paso
  obligatorio antes de dejar ver nada, justo lo contrario de la promesa "sin registro" que ya usa
  CountPips como ventaja competitiva.
- **Gestor de cookies tan largo que en móvil ocupa más alto que el propio contenido** (Man Group,
  Cookiebot con 4 interruptores apilados): cuesta más decidir sobre cookies que ver la portada.
- **Posible desbordamiento de ancho en escritorio** (Citadel: `scrollHorizontal: true` y viewport
  efectivo de 1477px en vez de 1440px) — anomalía puntual, señalada como duda sin diagnosticar la
  causa exacta.

## Dudas / puntos sin verificar

- La causa exacta del `scrollHorizontal: true` y el ancho de viewport distinto (1477/1474px vs los
  1440px pedidos) en Citadel no se ha diagnosticado — solo se deja constancia del síntoma.
- La ausencia de enlaces detectados en `header a, nav a` para Vanguard y AQR podría deberse a que su
  navegación principal usa otro contenedor semántico (no necesariamente un fallo de accesibilidad
  real); no se ha inspeccionado el DOM completo para confirmarlo, solo el resultado del selector usado
  por el script.
- Los megamenús desplegables de Vanguard, Man Group y AQR (marcados con flecha "▾" en el nav) no se
  han abierto ni capturado, porque el script no interactúa con hover/click — su contenido queda fuera
  de este informe.

---

## Sustituciones y bloqueos

Ninguna de las 10 webs objetivo estuvo bloqueada ni requirió sustitución: las 10 cargaron con código
HTTP 200 en las tres pasadas (escritorio claro, escritorio oscuro, móvil claro), sin captcha ni
interstitial anti-robots. Las cuatro alternativas propuestas en el encargo (Schroders, GSAM, J.P.
Morgan AM, D.E. Shaw) no se usaron.
