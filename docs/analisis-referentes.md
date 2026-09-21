# Análisis de 50 webs del sector — qué aprender sin copiar

*21 de septiembre de 2026 · CountPips web*

## Cómo se hizo

- **50 webs en cinco grupos de diez:** gestoras y fondos, mercados y plataformas de datos, diarios de
  trading (la competencia directa), prop firms y plataformas de trading, e inversión para particulares y
  fintech.
- **Cada web se abrió en un navegador real tres veces:** escritorio a 1440 px con el sistema en claro, lo
  mismo con el sistema en oscuro, y móvil a 390 px. Se capturó la página entera y se midió su tipografía,
  sus colores, su alto y su tiempo de carga.
- **Unas 400 capturas miradas una por una** por cinco ayudantes, uno por grupo. Sus informes completos
  están en [`docs/referentes/`](referentes/). Las capturas no se guardan en el proyecto: pesan cientos de
  megas y se regeneran con el mismo script.
- **Tres webs no se dejaron capturar** (CME, Nasdaq y Bloomberg bloquean a los navegadores automáticos) y
  se sustituyeron por Cboe, Morningstar y Deribit.

**Qué está comprobado por mí y qué no.** Todo lo que va en este documento como *comprobado* lo he visto yo
en la captura o lo he medido yo sobre los datos de las 50. Lo que viene sólo del informe de un ayudante va
marcado *sin verificar*. Los informes anexos no están verificados línea a línea.

---

## Las cinco conclusiones

1. **Tu dirección visual está sola en tu mercado.** Los diez diarios de trading se reparten entre
   «software azul genérico» (TradesViz, Chartlog, Trademetria) y «producto de IA en morado y neón»
   (TradeZella, StonkJournal, TraderSync). La serif grande y sobria que usas no la tiene ningún
   competidor directo, pero sí la tienen las marcas financieras más caras de las 50: Citadel, PIMCO,
   Addepar, Betterment, Public, Robinhood. Es la señal correcta; no hay que cambiarla.
   *Comprobado* (familia del titular medida en las 50; capturas de Citadel, Addepar y Kinfo).
2. **Cuanto más institucional es una web, más corta.** Las gestoras tienen una mediana de 4.420 px de
   alto en escritorio; los diarios de trading, 10.492 px. Tu portada mide hoy 6.061 px (antes 6.612),
   entre ambos grupos. Todavía sobra algo, sobre todo en móvil: tu portada mide 8.215 px y la mediana
   de las gestoras es 6.000. *Comprobado* (medido en las 50).
3. **El modo oscuro de verdad es rarísimo.** Sólo 2 de las 50 (QuantConnect y cTrader) cambian a oscuro
   cuando el ordenador del visitante está en oscuro; tu web es la tercera. Las demás tienen un tema fijo.
   Es una ventaja que ya tienes, no algo que tengas que perseguir. *Comprobado* (comparación píxel a
   píxel de las dos capturas de cada web).
4. **Nadie vende lo que tú vendes.** Ninguno de los diez diarios de trading presenta como argumento
   central «pagas una vez», «no hay nube: tus datos no salen de tu equipo» ni «demo navegable sin
   registro». Los diez son suscripción y los diez enseñan capturas o vídeo, no una demo que se pueda
   tocar. *Comprobado en las capturas de portada; las páginas internas de precios de seis de ellos no se
   revisaron.*
5. **La autoridad de una cifra está en su letra pequeña.** Las gestoras más serias no ponen «$58,5 b» a
   secas. Ponen la cifra, una etiqueta y debajo la fuente y la fecha de corte: Point72 escribe «All
   statistics as of July 1, 2026» con llamadas numeradas, y Citadel cita la fuente exacta de su «#1».
   Ese pie es lo que separa un dato de un reclamo publicitario. *Comprobado* (capturas de Point72 y
   Citadel).

---

## Lo que ya haces mejor que la mayoría

Esto no se toca; como mucho, se subraya.

| Qué | Cómo lo hacen los demás | Evidencia |
|---|---|---|
| Modo oscuro que sigue al sistema | 48 de 50 no lo hacen | medido, comparación de capturas |
| Titular real (`h1`) en el código | Bridgewater, Point72, Interactive Brokers y Myfxbook no tienen ninguno; Tradervue lo pierde en móvil | medido |
| Sin desbordamiento lateral | Citadel, Trademetria, Apex, NinjaTrader y Mercury desbordan a 1440 px | medido |
| Aviso de «no es asesoramiento» pegado al resultado de cada calculadora | la mayoría lo relega al pie | comprobado en tu código y en cTrader e Indexa |
| Nota de muestra junto al panel de cifras de la portada | — | comprobado |
| Aviso de cookies como tarjeta pequeña, no como muro | FTMO, Apex, LSEG, Saxo, Koyfin, BlackRock y PIMCO tapan el titular o la página entera | comprobado en FTMO, BlackRock y Addepar |
| Carga del primer contenido | tu portada: 184 ms en la medición de los ayudantes; mediana de las 50 alrededor de 1,3 s | *una sola medición por web: orientativo, no cifra* |

---

## Recomendaciones, por impacto

Cada una dice qué hacer, por qué (con la evidencia) y cómo hacerlo **a tu manera**: el principio, no el
diseño de otro.

### Impacto alto

**1. Poner fuente y fecha de corte a cada cifra que se afirma.**
- *Por qué:* es el recurso que más autoridad da con menos ruido en las gestoras (Point72, Citadel,
  Vanguard y Man Group). *Comprobado.*
- *A tu manera:* la franja «40+ métricas / 0 servidores / 8 herramientas» y las cifras de la página de
  precios ganarían una llamada numerada discreta y una línea final del tipo «Datos de la versión en
  pruebas · septiembre de 2026». Tu panel de cifras ya lo hace («Calculado sobre las 200 operaciones de
  muestra…»); se trata de extender esa misma disciplina al resto.

**2. Convertir «pago único, sin nube, demo sin registro» en una sola idea visible arriba.**
- *Por qué:* es el hueco que ningún competidor ocupa (conclusión 4). Hoy lo dices, pero repartido en
  tres sitios: los tres avisos bajo los botones, los principios y la tabla comparativa de precios.
- *A tu manera:* nada de sellos ni insignias. Una frase de cierre en el primer pliegue, o una fila de
  la tabla comparativa subida a la portada, que ponga las tres diferencias juntas y en voz baja. La
  calculadora de escenario de coste que ya tienes puede enseñar el pago único frente a una suscripción
  mensual cualquiera, sin nombrar a ningún competidor ni inventar sus precios.

**3. Acortar el móvil.**
- *Por qué:* tu portada en móvil mide 8.215 px y la mediana de las gestoras es 6.000 (conclusión 2).
  *Comprobado.*
- *A tu manera:* el panel de cifras de la portada apila en móvil ocho cifras en cuatro filas de dos. La
  lectura institucional sería enseñar cuatro, las que definen el riesgo (Sharpe, drawdown máximo,
  expectancy y win rate), y dejar el resto a un toque de distancia. Es lo mismo que ya hacen las
  capturas en móvil: un detalle en lugar de la pantalla entera.

### Impacto medio

**4. Una ficha de «dónde viven tus datos» con la precisión de un folleto bancario.**
- *Por qué:* Indexa Capital dedica un bloque entero a nombrar cada entidad, cada garantía y cada
  auditor, con enlaces. Trading 212 hace lo mismo con cada regulador y su número de licencia. Tratan
  la seguridad como contenido, no como letra pequeña. *Comprobado en Indexa; Trading 212 sin
  verificar.*
- *A tu manera:* tú no custodias dinero, pero sí datos. Una ficha técnica sobria —en qué carpeta se
  guardan, en qué formato, qué sale de tu equipo (nada salvo la analítica opcional de la web), cómo se
  exporta y cómo se borra— dicha con nombres concretos y no con adjetivos. Parte de ese material ya
  existe en «Qué se guarda y dónde».

**5. La cifra, dentro de su contexto.**
- *Por qué:* Public, Robinhood, Mercury y Trading 212 casi nunca enseñan un número suelto: lo meten
  dentro de una pantalla del producto con su fecha, su color y su unidad. *Sin verificar en detalle
  (informe del grupo 5).*
- *A tu manera:* ya lo haces en el panel de la portada. Donde hoy hay cifras sueltas en una frase de
  venta, conviene que lleven el mismo tratamiento de panel o que se retiren.

**6. El aviso de cookies, que no tape nada en el primer vistazo del móvil.**
- *Por qué:* tapar el primer pliegue con el aviso de cookies es el error más repetido de las 50. El
  tuyo es pequeño, pero en móvil y en la primera pantalla se superpone al panel de cifras. *Comprobado
  en tu propia captura a 390 px.*
- *A tu manera:* a menos de 640 px, una barra fina anclada abajo de dos líneas y dos botones, que
  reserve su hueco en lugar de flotar encima. Es la solución de ICE, la única del grupo de mercados que
  lo resolvió bien.

**7. Probar un peso más ligero en el titular grande.**
- *Por qué:* las serif de las marcas más caras van a 400 o menos en tamaño de portada (Citadel 72 px a
  400; Addepar, Tiempos Headline Light; Robinhood, 80 px a 400; Public, 48 px a 300). La tuya va a 500.
  *Comprobado* (medido).
- *A tu manera:* es una prueba, no una decisión. Un 400 a 84 px se lee más «papel impreso» y menos
  «pantalla». Hay que mirarlo en claro y en oscuro, porque en oscuro la serif fina pierde cuerpo.

### Impacto bajo o a futuro

**8. Testimonios con contexto, cuando existan.** Indexa enseña clientes con nombre y profesión, y eToro
con resultado y plazo. Tú todavía no tienes usuarios reales y no hay que inventarlos. Cuando el piloto
privado dé los primeros, conviene presentarlos así: nombre, qué opera, cuánto tiempo lleva usando la
app y una frase concreta, nunca «¡la mejor app!».

**9. Filete superior en las cifras grandes.** Point72 pone una línea fina ENCIMA de cada cifra y no
separadores verticales entre ellas; se lee más como un informe anual. Es un detalle opcional para tu
franja de cifras. *Comprobado.*

**10. Un selector de región sólo si algún día vendes con impuestos o monedas distintas.** Trading 212
separa idioma y país. Hoy te basta tu selector ES/EN.

---

## Lo que NO hay que imitar

- **Modales que bloquean la portada** —de cookies, de «¿es usted inversor profesional?» o de aviso
  legal (BlackRock, PIMCO, FTMO, Apex)—. Contradicen justo tu «sin registro».
- **Cuentas atrás, cupones y «30 % de descuento»** en la cabecera (Apex, FundedNext, The5ers). Es el
  tono contrario al tuyo.
- **Cifras de rentabilidad desorbitadas como gancho**: cTrader enseña estrategias con un «84.836 % ROI»,
  aunque ponga el aviso de riesgo justo debajo. El aviso no arregla el dato.
- **Titulares rellenos de palabras clave** (TradesViz: más de 150 caracteres).
- **Muros de reseñas** con decenas de tarjetas (FundedNext, Apex): el volumen no es credibilidad.
- **Módulos idénticos encadenados** (Public repite «título + frase + captura» más de ocho veces).
- **Iconos 3D brillantes y acentos neón**: envejecen rápido y te sacarían del terreno sobrio que nadie
  más ocupa.
- **IA como eslogan principal.** Cuatro de los diez diarios de trading la ponen en el centro del mensaje.
  Tu argumento es la medición honesta, y conviene no diluirlo.

---

## Considerado y descartado

- **Colapsar las tablas anchas en pares etiqueta/valor en móvil**, como The5ers. Está bien resuelto,
  pero tus tablas se deslizan de lado a propósito: conservan la comparación en columnas, que es la
  razón de ser de la tabla.
- **Bandas de color a todo el ancho entre secciones** (Betterment, Indexa, Addepar). Funcionan en
  marcas con color. En la tuya, casi monocroma, una banda de color metería justo lo que la dirección
  evita. Tu banda gris degradada cumple el mismo papel.
- **Un único color de acento para los botones** (Vanguard, Betterment, Robinhood). Tu blanco y negro
  ya es un «acento único», y es el más sobrio posible.
- **Fotografía de personas** (Citadel, Point72, Bridgewater). Sin fotos propias sería banco de
  imágenes, y el banco de imágenes es justo lo que resta credibilidad.

---

## Datos medidos de las 50

Titular principal en escritorio a 1440 px. «Oscuro» = cambia con el modo oscuro del sistema. El tiempo
de carga es de una sola pasada: es orientativo, no una cifra.

| Web | Grupo | Alto (px) | Titular: familia · tamaño/peso | Oscuro |
|---|---|---:|---|:--:|
| BlackRock | gestoras | 3.825 | BLK Fort Condensed · 39/700 | no |
| Vanguard | gestoras | 6.619 | FF Mark · 92/800 | no |
| Bridgewater | gestoras | 3.250 | sin titular en el código | no |
| Two Sigma | gestoras | 5.027 | propia (sans) · 94/700 | no |
| AQR | gestoras | 3.319 | Polaris · 37/700 | no |
| PIMCO | gestoras | 4.991 | Juana (serif) · 48/500 | no |
| Man Group | gestoras | 3.897 | Rubik · 64/600 | no |
| Jane Street | gestoras | 2.955 | Alright Sans · 72/800 | no |
| Citadel | gestoras | 5.745 | Signifier (serif) · 72/400 | no |
| Point72 | gestoras | 4.944 | sin titular en el código | no |
| Cboe | mercados | 4.327 | Hanken Grotesk · 109/400 | no |
| Morningstar | mercados | 6.100 | Morningstar Intrinsic · 32/700 | no |
| Interactive Brokers | mercados | 7.663 | sin titular en el código | no |
| TradingView | mercados | 17.209 | Euclid Circular · 56/600 | no |
| Deribit | mercados | 8.425 | Inter · 48/600 | no |
| LSEG | mercados | 4.618 | Proxima Nova · 44/600 | no |
| Koyfin | mercados | 19.042 | Aktiv Grotesk · 88/500 | no |
| ICE | mercados | 9.910 | Suisse Intl · 64/500 | no |
| Saxo | mercados | 6.466 | Inter · 44/400 | no |
| QuantConnect | mercados | 8.269 | Inter · 46/500 | **sí** |
| TraderSync | diarios | 17.401 | Manrope · 50/700 | no |
| Edgewonk | diarios | 11.287 | Roboto · 40/400 | no |
| Tradervue | diarios | 9.697 | Manrope · 70/800 | no |
| TradesViz | diarios | 13.577 | Inter · 36/700 | no |
| TradeZella | diarios | 13.599 | Inter Tight · 80/600 | no |
| Myfxbook | diarios | 5.441 | sin titular en el código | no |
| Kinfo | diarios | 5.145 | Playfair Display (serif) · 72/400 | no |
| Trademetria | diarios | 13.552 | Public Sans · 56/700 | no |
| Chartlog | diarios | 3.243 | Montserrat · 40/500 | no |
| StonkJournal | diarios | 8.773 | Archivo Black · 115/400 | no |
| FTMO | prop/plataformas | 12.394 | Poppins · 96/600 | no |
| Topstep | prop/plataformas | 5.150 | Paralucent · 96/500 | no |
| Apex | prop/plataformas | 8.227 | Benton Sans Wide · 40/900 | no |
| The5ers | prop/plataformas | 11.235 | General Sans · 50/700 | no |
| FundedNext | prop/plataformas | 20.921 | Plus Jakarta Sans · 96/800 | no |
| NinjaTrader | prop/plataformas | 9.207 | Montserrat · 46/700 | no |
| Tradovate | prop/plataformas | 4.169 | Roboto · 52/600 | no |
| MetaTrader 5 | prop/plataformas | 2.939 | Open Sans · 40/400 | no |
| cTrader | prop/plataformas | 7.598 | Arial · 48/700 | **sí** |
| Sierra Chart | prop/plataformas | 2.119 | Verdana · 31/700 | no |
| Wealthfront | fintech | 7.437 | Calibre · 62/700 | no |
| Betterment | fintech | 9.959 | Season Mix (serif) · 68/500 | no |
| Public | fintech | 12.556 | Denton (serif) · 48/300 | no |
| Robinhood (Europa) | fintech | 6.153 | Martina Plantijn (serif) · 80/400 | no |
| Mercury | fintech | 11.661 | Arcadia Display · 49/480 | no |
| Trading 212 | fintech | 8.101 | Aeonik · 38/500 | no |
| eToro | fintech | 6.107 | eToro (propia) · 72/800 | no |
| Indexa Capital | fintech | 9.340 | Nunito Sans · 40/700 | no |
| MyInvestor | fintech | 6.592 | Avenir Next · 56/700 | no |
| Addepar | fintech | 5.578 | Tiempos Headline (serif) · 48/400 | no |
| **CountPips** | — | **6.061** | **Newsreader (serif) · 84/500** | **sí** |

Medianas de alto en escritorio: gestoras 4.420 · mercados 7.966 · diarios 10.492 · prop y plataformas
7.912 · fintech 7.769 · las 50, 7.028.

---

## Anexos

Los cinco informes de los ayudantes, con la ficha completa de cada web: primer pliegue, tipografía,
color, modo oscuro, ritmo, cifras, confianza, navegación, móvil y detalles. **No están verificados
línea a línea**; lo que se ha comprobado está arriba.

- [Grupo 1 · gestoras y fondos](referentes/informe-g1.md)
- [Grupo 2 · mercados y plataformas de datos](referentes/informe-g2.md)
- [Grupo 3 · diarios de trading](referentes/informe-g3.md)
- [Grupo 4 · prop firms y plataformas de trading](referentes/informe-g4.md)
- [Grupo 5 · inversión particular y fintech](referentes/informe-g5.md)

Las rutas de imagen que citan (`g1-aqr/escritorio-claro__01.png`…) se refieren a las capturas de la
sesión de análisis, que no se guardaron en el proyecto.
