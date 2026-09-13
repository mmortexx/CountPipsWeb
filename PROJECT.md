# PROJECT.md — Estado del proyecto

> Foto de dónde está el repositorio ahora mismo, para retomar sin releer todo
> el historial. Los detalles del despliegue viven en [DESPLIEGUE.md](DESPLIEGUE.md),
> las reglas de diseño y voz en [PROMPT_MAESTRO_SESION.md](PROMPT_MAESTRO_SESION.md),
> y la arquitectura de tests en [TEST_INFRA.md](TEST_INFRA.md).

## Qué es esto

CountPips Web: sitio estático de marketing + demo interactiva en el navegador
del diario de trading nativo de Windows (WinUI 3, no incluido en este repo).

- **Framework**: Next.js 16 (App Router, `output: "export"`) + React 19 + TypeScript estricto.
- **Estilos**: Tailwind CSS v4 + tokens de diseño (`--tj-*`, `--surface-*`, `--accent-*`, `--pnl-*`).
- **I18n**: Routing simétrico ES (`/`) / EN (`/en/`). 210 claves `STR`, 57 términos de
  glosario (cinco familias), 8 herramientas + 1 test de disciplina, 13 FAQs, 4 legales.
  Paridad 1:1 obligatoria entre idiomas.
- **Demo**: PRNG determinista (`mulberry32`), 200 operaciones de muestra, 5 vistas
  WinUI 3 (Resumen, Operaciones, Analítica, Diario, TradeDetail), estado reactivo
  desacoplado con `useSyncExternalStore` (`demoStore.ts`).
- **Fondo**: liso (`--bg`). El atlas grabado a puntos, las pausas de lámina, el
  grano y la pantalla de carga se retiraron en el rediseño institucional (2026-09-13).
- **Analítica**: PostHog (UE), sólo tras consentimiento explícito, cero cookies.
- **Backend beta**: Worker de Cloudflare en `services/beta-api/` (D1 + KV + Turnstile);
  ver su propio [README](services/beta-api/README.md).

## Rediseño institucional (2026-09-13, rama `rediseno-institucional`)

Se cambió la piel, no el esqueleto: rutas, textos, demo, idiomas y motor de
métricas siguen igual. Referencias usadas: Linear, Koyfin, Mercury, Stripe,
Robinhood Legend, Two Sigma, Bridgewater.

- **Paleta**: blanco y negro reales con neutro frío; el color queda para el
  dinero (verde/rojo/ámbar) y las sesiones. Botón primario = tinta plena.
  Contrastes medidos en el comentario de los tokens de `globals.css`.
- **Fondo limpio**: fuera `EngravedAtlas`, `BackgroundFX`, `PlateInterlude`,
  `Grabado404`, `IntroSequence` (pantalla de carga), `Ticker`, grano, velos y
  filetes de margen. La caja de contenido es `.tj-container` (1200 px).
- **Tipografía**: Newsreader sólo en h1/h2; h3 y todo lo demás en Instrument
  Sans. Letra mínima 11 px (antes 9,5–10). `.text-gradient` ya no es cursiva:
  es el tramo del titular en tono terciario. Sin numeración «§ 02» ni romanos.
- **Superficies**: `.tj-paper` opaca, `.tj-hoja` con canto de 1 px y radio
  6 px, sin doble filete ni escuadras. Radios: 3/4/6/6/8 px.
- **Portada**: Hero con captura real a tamaño completo → cifras → recorridos →
  pantallas (pestañas segmentadas `.tj-pestanas`) → métricas → guardián →
  principios → cierre en bloque de tinta (`.tj-cierre`). CTA: `.cta`.
- **Pendiente de decidir por el dueño**: el logotipo de puntos se ve borroso a
  tamaño de barra; la captura oscura de «Resumen» no deja ver la curva; las
  capturas sólo existen en español.

## Dónde estaba antes del rediseño (2026-09-10)

El grueso de auditoría cuantitativa y de accesibilidad de las 13 dimensiones
(matemáticas financieras, WCAG AA, paridad bilingüe, SEO, tokens de diseño,
seguridad, atajos, motor de demo) se cerró en agosto y vive verificado en
`tests/e2e/` — ver [TEST_INFRA.md](TEST_INFRA.md). Desde entonces el trabajo ha
sido una pasada continua de pulido visual y de detalle, sección por sección:

- Sustitución del logotipo por la curva de capital en puntos (`generate-brand.py`).
- Reordenación a índice de mesa de la mayoría de listados de la web (herramientas,
  demo, about, traders, legales, pie, 404).
- Legibilidad del fondo grabado: velo detrás de texto sobre el atlas, recorte del
  velo a su sección, suelo de figura medido en tiempo real para que ninguna lámina
  (calendario, distribución, cuadrante de riesgo) quede bajo el pie de foto —
  la medida se adapta sola a pausas de 62 vh y 88 vh, y no toma como referencia
  las pausas cortas de móvil (32-38 vh).
- Portada: los cuatro fotomontajes de "estudio" se sustituyeron por capturas
  reales del programa (mismas que ya usaba `/features`), con las mismas pestañas
  y el mismo componente `ProductPlate`.
- Paleta de comandos (⌘K/Ctrl+K): ahora enfoca su campo de búsqueda al abrir
  (antes lo primero que se tecleaba se perdía). **Ya no aplica**: la paleta
  de la web se retiró después; queda la de la demo.
- Gráfico de velas de la demo: las etiquetas de precio de SL/TP/entrada ya no se
  superponen con las cifras de la rejilla cuando caen cerca.

No hay milestones activos declarados. El criterio para seguir es el barrido de
diseño sección por sección: abrir la ruta en claro y oscuro, escritorio y
móvil, y comparar contra el resto del sitio — no hay una lista cerrada de
pendientes porque el objetivo es "al máximo nivel", no una casilla que marcar.

## La pasada de animaciones (hecha el 2026-09-05)

Se resolvió lo que de verdad se veía mal, que no era la cantidad de
movimiento sino su **cadencia**:

- **La bienvenida del atlas se grababa detrás de la cortina.** El reloj
  arrancaba al montar el lienzo, y el loader de primera visita tapa la
  pantalla más de un segundo. Encima el destino se tomaba como el mayor
  entre el scroll y la intro, y el primer ancla ya declaraba el destino
  entero en scrollY = 0: la lámina se plantaba de un tirón y la curva de
  cinco segundos no gobernaba nada. Ahora la intro espera a que suba la
  cortina (`src/lib/intro.ts`) y su recorrido es la parte por debajo de
  `INTRO_HASTA`, con el scroll añadiendo sólo lo que pida por encima.
- **La curva de fase de las dieciséis láminas** pasa de cúbica a
  cuadrática. Una lámina tiene veinte fases y la cúbica daba veinte
  latigazos escalonados.
- **El cruce entre láminas** mueve la figura con la misma curva con la
  que la funde; era lineal y se cortaba en seco.
- **El cambio de tema se funde** con una transición de vista (una sola
  animación que incluye el canvas del fondo) en vez de cambiar todos los
  píxeles en el mismo fotograma.
- Escalonado de entrada donde faltaba (selector de perfil, tarjetas de
  seguridad, pasos del diagrama de datos), curva de la casa en el botón
  de volver arriba, y fuera el rótulo que flotaba en bucle sobre el
  comparador.

### Lo que se probó y se descartó, con la medida

Se llegó a reescribir el asiento de la trama de puntos (por reloj en vez
de por scroll, con retícula girada 14° y temblor por celda, para que el
marco no se leyera como una perforación). Se ve mejor en detalle, pero el
banco de fluidez lo tumbó: p99 de 29,6 a 37,4 ms contra un presupuesto de
28, en las cuatro medidas. Se probó a acotarlo con un tope de puntos vivos
y con una ventana de asiento adaptativa, y siguió por encima. **Se
revirtió entero.** Si alguien lo retoma, el camino no es acotar el número
de puntos animados: es que el asiento no obligue a recorrer la máscara
completa en cada fotograma.

Queda pendiente, sin urgencia: completar la migración de `framer-motion`
a CSS/WAAPI en la demo interactiva (`AppDemo` y sus cinco páginas), que es
lo único que sigue cargando la biblioteca — y sólo en `/demo`, en diferido,
así que no pesa en las otras 154 páginas.

## La segunda pasada de movimiento (hecha el 2026-09-05)

Dos fallos, los dos del mismo tipo: gestos que estaban escritos, que el
navegador registraba como animaciones en marcha, y que **no ocurrían
nunca a la vista de nadie**. No se ven en una captura suelta; se ven
midiendo.

### 1 · La entrada del hero pasaba detrás del telón

Es el mismo fallo que la sesión anterior corrigió para el grabado del
fondo, sin corregir aquí. `IntroSequence` disparaba el escalonado en el
mismo instante en que el telón empezaba a subir, y el telón iba con
`--ease-entrada-salida` (0.76, 0, 0.24, 1), una curva que **arranca
lento** porque está pensada para algo que sale y vuelve.

Opacidad de cada pieza en el instante en que el telón la destapa
(1,00 = ya había entrado a oscuras), portada a 1440×900:

| | ceja | h1 | subtít. | CTA | CTA | specs |
|---|---|---|---|---|---|---|
| antes | 1,00 | 1,00 | 0,98 | 0,95 | 0,90 | 0,36 |
| ahora | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,12 |

Dos cambios y ninguno cuesta un milisegundo: el telón se va con
`--ease-suave` (ha recorrido el 80 % del camino en 180 ms, y de paso
desaparece el medio segundo de aire muerto en que el contador ya marcaba
100 y el telón no se había movido), y el escalonado va **en la dirección
del telón** —de abajo arriba, en la estela de su canto— en vez de contra
él.

Coste medido, tres pasadas por versión con el freno a ×4 (mediana): el
h1 legible pasa de 1442 a 1530 ms, unos 90 ms contra un presupuesto de
2500. El total de la secuencia no empeora (2327 → 2308 ms). Se paga a
sabiendas; si ese presupuesto se aprieta algún día, esto es lo primero
que mirar.

### 2 · `animation-range: entry` se mide en unidades del propio elemento

Éste es el gordo, y llevaba tiempo ahí. La longitud del rango `entry` es
**la altura del sujeto**. Sobre un check de 8,4 px, `entry 0% → 30%` son
2,5 px de scroll: la animación entera cabe entre dos fotogramas de una
rueda normal. Leído del navegador, el `activeDuration` del sello valía
0,3037 % de una línea de tiempo de 908 px — **2,76 píxeles**.

`cover` no depende del sujeto (mide la ventana más la altura), así que un
mismo porcentaje da el mismo recorrido para un titular de 300 px y para
un check de 8. El sello pasó a 21,998 % — **200 px**, setenta y dos veces
más.

Piezas que nunca llegan a verse a media tinta, bajando con scroll
continuo de rueda, medido sobre el sitio compilado:

| ruta | antes | ahora |
|---|---|---|
| `/pricing` (94 piezas) | 75 | 5 |
| `/features` (37) | 10 | 4 |
| portada (30) | 10 | 0 |

Por familia en `/pricing`: sello 34/34 → 0/34 · trazo 15/16 → 0/16 ·
traza 2/2 → 0/2 · ciclo 8/12 → 0/12. El caso extremo era `.tj-filete`,
la regla que «se traza de izquierda a derecha»: mide 1 px de alto, así
que su rango de `entry 10% → 60%` era **medio píxel**. El gesto estaba
escrito y no ocurría jamás.

La regla de sección se queda en `entry` a propósito: una sección mide
cientos de píxeles y allí el valor ya está afinado.

### Lo que se descartó, y el precio que sí se paga

- **No era `content-visibility: auto`.** La hoja tenía escrito que
  `cv-auto` era «la otra causa de silencio» y que «ahí no hay nada que
  arreglar». Se comprobó desactivándolo por completo: las mismas 75
  piezas de `/pricing` seguían sin animarse. Esa nota estaba equivocada
  y se ha corregido en `globals.css`.
- **El precio de `cover`**: lo que cae en el último tercio de la primera
  pantalla nace a media tinta, porque su recorrido aún no ha terminado
  cuando la página carga. Medido sobre el sitio compilado, pasa de 7 a
  10 piezas; las tres nuevas son de `/about` y están todas por debajo de
  y=650, medio cortadas por el pliegue, y se resuelven al primer scroll.
  Se acepta: 86 entradas recuperadas contra 3 piezas que empiezan
  atenuadas en el canto inferior. Comprobado además que **al fondo de la
  página no queda ninguna atascada** (0 en `/`, `/features`, `/pricing`,
  `/about`, `/faq`, `/traders/manual`).
- **El muelle real (`linear()`) en el sello se queda, pero sin
  entusiasmo.** Se ajustó el sobreimpulso al del bezier que sustituye
  (9 %, dos cruces) a propósito: aquí no se venía a hacer el sello más
  saltarín. En un check de 18 px la diferencia con el bezier es de
  matiz. Lo que sí arregla de verdad es que `opacity` ya no hereda el
  sobreimpulso: son dos animaciones separadas.
- **Coste en fotogramas: ninguno medible.** p99 del banco de fluidez,
  doce medidas pareadas en la misma tanda: media 31,16 → 30,06 ms
  (σ ≈ 2). Nota para la próxima sesión: en esta máquina **`main` ya
  falla el presupuesto de 28 ms** (p99 de 27,7 a 34,2 en la referencia),
  así que la comparación tiene que ser contra la referencia y nunca
  contra el número a secas.

### Trampa del compilador de estilos, que costó una hora

En esta hoja, **un atajo `animation` con lista pierde todo lo que va
después del primer elemento**. Escrito como

```css
animation: tj-estampa cubic-bezier(…) both, tj-estampa-tinta var(--ease-suave) both;
```

Lightning CSS (vía Tailwind v4) sirve sólo `tj-estampa`, sin un error ni
en consola ni en el build. Con las propiedades por separado
(`animation-name`, `-fill-mode`, `-timeline`, `-range`,
`-timing-function`) las dos sobreviven. Vale para cualquier animación
múltiple del fichero.

Y un aviso de método: **el caché de Turbopack no invalida `globals.css`
de forma fiable**. Dos veces se midió una hoja vieja creyendo medir la
nueva. Si un cambio de CSS «no hace nada», comprobar primero con
`curl` la hoja servida antes de dudar de la hipótesis.

### Segunda tanda de la misma pasada

- **El disco de «enviado» se había quedado sin fundido.** Al sacar
  `opacity` de los fotogramas de `tj-estampa` (para que el sobreimpulso
  no arrastrara a la tinta), `.tj-estampa-ya` —que comparte esos
  fotogramas— pasó a nacer opaco y sólo crecer. Ahora lleva las dos
  animaciones. Aquí el muelle sí tiene su línea de tiempo natural, así
  que se lleva también la curva de muelle real.
- **`::view-transition-new(pagina)` llevaba `--ease-suave` copiada a
  mano.** Pasa a usar el token; comprobado con una navegación real que
  resuelve dentro del árbol de la transición. La curva de SALIDA se
  queda literal a propósito: acelera hacia fuera, al revés que todo lo
  demás, y sólo se usa ahí.
- **La portada no revelaba la lámina al cambiar de pestaña** y
  `/features` sí, montando el mismo componente. Medido pulsando la
  segunda pestaña: 2 → 11 valores distintos de opacidad, los mismos que
  `/features`.
- **El verde de los veredictos** (checks, «Sin servidor», el ✓ de la
  hoja de ruta) pasa de `--pnl-pos` a `--sig-green`. **No se ve**: en la
  paleta que el sitio usa de verdad los dos tokens valen lo mismo
  (#3FCE92). Es un cambio de intención, para que el día que alguien
  toque uno de los dos los checks se muevan con el semáforo y no con la
  caja.
- **`prefers-reduced-motion` verificado de verdad**, con la preferencia
  puesta y bajando la página entera: no queda nada apagado, ni movido,
  ni animándose, en `/`, `/features`, `/pricing`, `/about` y `/faq`.
- **Auditoría de entradas ampliada a 15 rutas.** Separando las tres
  causas por las que una pieza puede «saltar» —ya estaba en la primera
  pantalla (correcto), anima por reloj y no por scroll (el muestreo no
  la ve), o entra desde abajo y aun así salta (defecto)— quedan **283
  piezas revisadas y 1 sola en la tercera categoría**, y esa es un caso
  de borde justo en el pliegue. Nada atascado al fondo en ninguna ruta.

### Tercera tanda: foco, toque y reglas de móvil

Tres reglas que el sistema de diseño exige por escrito, medidas en vez
de supuestas, tabulando la página y midiendo cajas a 390×844.

- **Anillo de foco**: 0 fallos. Todo lo tabulable de catorce rutas tiene
  contorno o sombra al recibir el foco. No hacía falta tocar nada.
- **Objetivo de toque de 44 px**: catorce controles por debajo.
  - Los cuatro enlaces de las tarjetas de Valores en la portada, a
    **20 px** — el único control de su tarjeta y el peor del sitio.
  - Las fichas de zona horaria (32), las de setup del perfil de trader
    (36), las siete de firma y tamaño de cuenta (32), el botón de copiar
    informe (32) y las dos etiquetas de consentimiento de `/beta` (36).
  - Dos arreglos distintos: en Valores basta `min-h-[44px]`, el modismo
    de la casa, con el margen bajado de `mt-4` a `mt-1` para que el
    enlace **no se mueva ni un píxel** y sólo crezca la zona que
    responde. En las filas de fichas no vale subirlas en todas las
    anchuras —una ficha de 44 px con texto de 12 es casi todo aire, y
    viven en herramientas densas—, así que se añade `.toque-comodo` bajo
    `@media (pointer: coarse)`: lo que decide si hacen falta 44 px es si
    apunta un dedo o un ratón, no el ancho de la ventana.
- **Letra de 16 px en campos de móvil**: los seis del formulario de alta
  iban a 14. Safari de iOS hace zoom al enfocar por debajo de 16 y deja
  la página desencuadrada. Pasan a `text-base sm:text-sm`, como ya hacía
  `ContactForm`.

De paso, en las mismas catorce rutas: **0 desbordes horizontales** y
**0 jerarquías de titular rotas** (un solo `h1`, sin saltos).

Y dos defectos sueltos en un mismo deslizador, el de «número de
parámetros»: pasaba `height: 36` cuando `.tj-range` declara 44 y los
otros **cinco** deslizadores del sitio pasan 44; y le faltaba `--pct`,
así que la pista caía al respaldo de 0 % y **el tramo recorrido no se
pintaba nunca**.

> Aviso sobre las herramientas de medida: dos de los «fallos» que
> encontraron eran suyos, no del sitio. El `SkipLink` sale como 1×1
> porque es `sr-only` hasta recibir foco, y una casilla envuelta por su
> `<label>` se pulsa por el texto entero, así que su objetivo real es la
> etiqueta y no el cuadrito de 16 px. Las dos exclusiones están escritas
> en el guion; conviene desconfiar de un informe antes de arreglar lo
> que señala.

### Cuarta tanda: el fondo, y lo que el perfil desmiente

El encargo era «que el fondo no vaya a trompicones, lo más fluido
posible, como a 165 fps». Lo primero fue dejar de suponer dónde está el
coste y perfilar la CPU de verdad durante un scroll continuo:

| | |
|---|---|
| ocioso | **72,8 %** |
| interno del navegador | 14,8 % |
| `drawImage` | 5,6 % |
| `arc` | 1,1 % |
| `getImageData` | 0,9 % |

**El regrabado es el 2 %.** El muestreo de la máscara y el bucle de
celdas —que la sesión anterior y ésta dieron por culpables— no son el
cuello de botella; el hilo principal va ocioso tres cuartas partes del
tiempo. Lo más caro identificable es componer los lienzos a pantalla
completa, y eso ya está muy afinado: DPR capado a 1,5, capas cacheadas,
como mucho dos láminas vivas, el fotograma sin cambios descartado y el
bucle durmiéndose de verdad cuando converge.

#### Lo que entra

- **Radio de trama 0,44 → 0,52.** Con paso 6 son 3,12 px sobre una
  separación de 6, así que las zonas de cobertura plena se cierran en vez
  de quedar perforadas. No toca el número de celdas ni de arcos, sólo su
  tamaño. −0,39 ms de p99 (error típico 1,66): gratis.
- **Constante de seguimiento del scroll 6 → 15.** El fondo perseguía al
  scroll con un suavizado que lo dejaba ~170 ms por detrás. Parando en
  seco y contando cuánto sigue cambiando el dibujo: 778/1360/192 ms →
  442/1208/190 ms. Sin coste (3,7 contra 4,0 fotogramas perdidos de 426).

#### Lo que se midió y se tiró

- **Densificar la retícula (paso 6 → 5)**, que es lo que se pide
  siempre: **+3,89 ms de p99 con error típico 1,37 —fuera del ruido— y
  la cola mucho peor** (6 de 16 medidas por encima de 35 ms contra 1 de
  16). Confirma para el paso 5 lo que ya se sabía del paso 4.
- **Afinar la cuantización del revelado (48 → 112 pasos)** con más
  presupuesto de regrabado (1 → 3 ms): los dibujos distintos apenas
  suben (76 → 84 de 243 fotogramas) y los fotogramas perdidos se
  **duplican** (6 → 12). No era la cuantización.

#### La trampa que hay que dejar escrita

`mix-blend-mode: overlay` en la capa de grano parece el sospechoso
obvio de cualquier auditoría de rendimiento: fusión a pantalla completa
por encima del atlas animado. **Quitarlo empeora las cosas 3×**
(6,7 → 20,7 fotogramas perdidos de 426, tres repeticiones por variante),
y quitar el grano entero, lo mismo. Está aplanando la pila en una sola
capa y es lo que hace que vaya rápido. **No se toca.**

#### LO DE LOS TROMPICONES ERA LA CUANTIZACIÓN, Y LA MEDIDA ESTABA CIEGA

Lo anterior de esta sección se escribió midiendo mal. Queda como aviso.

El fondo **no perdía fotogramas: avanzaba a saltos**. Con
`PASOS_TRAZO = 48` el dibujo sólo cambiaba **53 veces por segundo**
mientras la pantalla iba a 165: diez de cada once fotogramas
recomponían exactamente la misma imagen.

Dos errores de método lo taparon, los dos propios:

1. **El banco corre en Chromium sin ventana**, clavado a 60 Hz (aquí ni
   eso, ~43). No puede ver un salto a 165 Hz. Hay que medir **con
   ventana**, que usa el refresco real del monitor.
2. **La sonda de píxeles falseaba la medida.** Leer el lienzo con
   `getImageData` en cada fotograma fuerza una lectura de GPU y hundía
   la cadencia de 769 a 34 Hz. Medía mi propia sonda, no el sitio.

Con ventana y sin sonda, la página va a **714 Hz durante el scroll**
(1,4 ms por fotograma). No había ningún problema de rendimiento.

El barrido de pasos, medido así:

| pasos | avances/s | 1 de cada N fotogramas | peor fotograma |
|---|---|---|---|
| 48 | 53 | 11,0 | ~10 ms |
| **96** | **86** | **5,7** | **11,2 ms** |
| 144 | 101 | 3,7 | 21,9 ms |
| 200 | 106 | 2,7 | ~27 ms |

**96**: +62 % de avances con el peor fotograma igual. Por encima se
compran tirones —22 ms a 165 Hz son cuatro fotogramas perdidos— a cambio
de cada vez menos suavidad. Comprobado alternando con la referencia:
peor fotograma 11,9 ms de media en `main` y 12,0 en la rama.

Subir el presupuesto de regrabado de 1 a 2,6 ms **no cambia nada** (107
avances/s contra 106): el freno no era ése.

#### Cómo medir esto de ahora en adelante

- Con **ventana** (`headless: false`) y `--disable-frame-rate-limit`.
- **Sin leer píxeles** en el bucle. Para saber cuántas veces avanza el
  dibujo, pinchar `getImageData` y CONTAR las llamadas que hace el
  atlas; no llamarla uno mismo.
- Mirar tres cosas distintas y no confundirlas: **cadencia** (Hz reales),
  **peor fotograma** (el tirón que se nota) y **avances por segundo**
  (si el dibujo se mueve o repite).

#### Lo que no se puede medir aquí

El banco corre en Chromium sin ventana, con una cadencia de ~23 ms
(≈43 fps): **no puede decir nada sobre 165 Hz**, y la mediana de 17-19 ms
que sale en `fluidez.mjs` es vsync, no trabajo. Para saber si hay
tirones reales a 165 Hz hay que medir en la máquina del que los ve.
Lo que sí queda comprobado es que esta rama **no añade ninguno**: 4,0
fotogramas perdidos de 426 en `main` y 4,0 en la rama, cuatro pasadas
pareadas.

### Quinta tanda: el trompicón no era lo que parecía

Tres rondas persiguiendo fotogramas perdidos, y no había casi ninguno.

#### El banco mentía dos veces

**Sin ventana.** Chromium headless va clavado a ~43-60 Hz. No puede ver
un tirón a 165 Hz, y todo lo que se rechazó por «más caro» midiéndolo
así hay que volver a mirarlo. Se pasó a Chromium **con ventana**, que
usa el refresco real del monitor.

**Sin vsync.** Con `--disable-frame-rate-limit --disable-gpu-vsync` la
cadencia sale a 1,10 ms (900 Hz). Eso es útil para exagerar picos —un
pico se ve contra 1 ms, no contra 6— pero **no es lo que nadie ve**, y
usarlo para decidir presupuestos lleva a conclusiones falsas: el
guardián de regrabado se calibró contra 1,10 ms y salió estrangulado.
Con vsync la pantalla da **6,10 ms (164 Hz)**, y ahí:

| | fotogramas tardíos de 1450 | avances del dibujo por segundo |
|---|---|---|
| `main` | 2 | 15 |
| esta rama | 2 | 32 |

Dos de mil cuatrocientos cincuenta. **No se pierden fotogramas.** Lo que
se veía como trompicón era otra cosa.

#### Lo que sí era: el dibujo avanzaba a 15 pasos por segundo

Con la pantalla a 164 Hz, el fondo cambiaba **quince veces por
segundo**: cada estado del dibujo duraba once fotogramas. Eso se ve a
saltos por muy puntual que sea la entrega. El defecto no estaba en el
coste de un fotograma sino en **cuántas veces se regraba la lámina**.

El regrabado se pedía a ciegas: si tocaba, se hacía. Ahora se mira lo
que queda de fotograma —contra la cadencia **medida sobre la marcha**,
no contra un 60 Hz supuesto— y lo que suele costar un regrabado, y si
no cabe se deja para el siguiente.

`SUELO_REGRABADO_MS` es el hambre que impide que ese freno congele el
dibujo. **Estuvo en 90 ms y era el defecto, no el remedio**: a 165 Hz el
hueco de un fotograma son 6 ms y un regrabado cuesta 5, así que el
guardián decía que no casi siempre y el hambre acababa marcando el
ritmo —once regrabados por segundo, medido—. Congelaba el dibujo para
ahorrar tirones que con vsync no existían. En **14 ms** el techo queda
en unos setenta por segundo y el guardián vuelve a ser lo que debía: un
freno para el fotograma que YA va tarde, no una norma.

#### La tensión que sigue abierta

`PASOS_TRAZO` cuantiza el revelado. En 48 el dibujo escalona; subirlo a
96 lo suaviza pero multiplicó por cuatro los picos (17-27 de 1450 en
`main`, 85-90 en la rama, medido sin vsync). El guardián resuelve esa
tensión —96 pasos y 2 picos, los mismos que `main`— pero el techo real
sigue siendo el coste del regrabado: **5,2 ms de redibujar el vector de
la lámina** contra un hueco de 6,10 ms. Por eso se queda en 32 avances
por segundo y no en los setenta que permitiría el suelo: el guardián
refusa la mitad de las veces porque de verdad no cabe.

Bajar de ahí exige abaratar el vector de la lámina, no tocar más
umbrales.

#### `fluidez.mjs` no pasa, y no pasaba antes

La puerta pide p99 ≤ 28 ms. Ocho medidas pareadas, misma tanda:

- rama: 27,1 · 28,0 · 30,6 · 35,2 · 30,6 · 26,0 · 26,0 · 33,1 → media **29,6**
- `main`: 32,4 · 27,7 · 26,7 · 24,3 · 26,5 · 30,1 · 33,7 · 32,0 → media **29,2**

Indistinguibles, y **las dos fallan**, en rutas distintas según la
pasada. La puerta es más estrecha que el ruido del banco sin ventana:
o se ensancha el presupuesto o se mide con ventana. No es una regresión
de esta rama.

### Sexta tanda: que nada se salga a NINGÚN ancho

El encargo era «nada sobresaliendo ni defectos visuales de ningún tipo».
Se midió con un barrido de **16 anchos × 14 rutas** (`anchos.mjs` en el
cuaderno de la sesión) que busca tres cosas distintas: la página con
scroll horizontal, un elemento cuyo contenido no cabe en su caja, y un
elemento que se sale de su contenedor.

**73 hallazgos la primera pasada. Cero la última.**

#### El patrón era casi siempre el mismo

Una cifra con cuerpo fijo dentro de una celda de retícula. Y el defecto
no aparecía en el ancho más estrecho: `−10.000,00 US$` se salía 35 px a
**1024 px** y estaba perfecta a 320 y a 1440, porque 1024 es donde esa
retícula pasa a cuatro columnas.

Por eso `clamp()` contra `vw` no sirve: **la ventana no sabe cuánto mide
la celda**. La pregunta correcta es el ancho de la propia caja, y eso son
consultas de contenedor. Se añadieron `.caja-cifra` (declara el
contenedor) y `.cifra-xl` / `.cifra-lg` / `.cifra-sm` (miden en `cqi`).

Dos trampas por el camino:

- **`[&>div]:caja-cifra` no genera regla.** Tailwind no compone una
  clase propia dentro de un variante arbitrario. Se comprobó en la hoja
  construida: `.caja-cifra` aparecía una sola vez, su definición. La
  clase va en cada celda.
- **`notation: "compact"` de Intl EMPEORA el español.** Devuelve
  «121,1 mil», que ocupa más que «121.069». Las abreviaturas se escriben
  a mano con `k` y `M`.

#### Seis deslizadores sin agarradera

Aparte del tamaño, seis `input[type=range]` de las calculadoras no
usaban `.tj-range`: eran `appearance-none` de 6 a 8 px **sin regla de
bolita**, y en WebKit eso deja el control sin nada visible que arrastrar.
Tres tampoco tenían nombre accesible.

#### Lo que se rediseñó, y por qué

- **La factura de indisciplina**: el desglose pasa a retícula de tres
  columnas declaradas —concepto elástico, porcentaje e importe a su
  ancho— y las barras se miden contra el error MAYOR en vez de contra un
  `pct * 2.5` que llenaba la barra en el 40 % y recortaba por encima sin
  avisar.
- **El simulador de Monte Carlo**: los cuatro arquetipos eran fichas
  sueltas en `flex-wrap` que caían en tres filas desiguales; ahora son el
  control segmentado del sitio, con el parámetro en una segunda línea
  atenuada y el nombre reservando dos líneas para que las cuatro notas
  caigan en la misma base. Los cinco percentiles eran cinco cajas con
  borde propio y pasan a una tira reglada con la mediana marcada por un
  filete de acento — son UNA distribución, no cinco datos sueltos. El
  bloque de ruina separa concepto y precisión en dos líneas fijas para
  que las cuatro cifras compartan línea de base.

#### Lo que hubo que retocar en las puertas

- `corrobora-menus.mjs` seguía comprobando la paleta ⌘K retirada: ahora
  verifica que **no** abre nada. Además asume servidor de desarrollo, no
  la exportación estática — contra `serve out` falla por la barra final.
- Dos pruebas fijaban el literal `min-w-[320px]` de la tabla de
  expectancy. Comprueban la intención (que el ancho mínimo exista) y no
  el número, que subió porque a 320 px las propias celdas no cabían.
- `legible.mjs` cazó dos rótulos nuevos a 9 px: el suelo del sitio es
  9,5.

### Séptima tanda: la demo, y dos trampas de medida propias

#### El servidor de pruebas mentía

`npx serve -s out` —la bandera de aplicación de una sola página—
**devuelve la portada para TODAS las rutas**. Medir con eso es medir la
portada dieciséis veces creyendo que son catorce páginas. Se comprobó
por el `<title>` y se corrigió sirviendo sin `-s`.

Cómo se caza: pedir tres rutas y mirar el título. Si los tres son el de
la portada, el banco no está midiendo lo que dice.

#### La sonda de desbordes marcaba de más

De 195 hallazgos en la demo, **192 eran falsos**. Dos motivos, los dos
de la sonda:

- Un **margen horizontal negativo** es la técnica normal para que el
  realce de una fila sangre hasta el canto de su tarjeta (`-mx-2 px-2`).
  Sobresalir del padre inmediato es justo lo que se le pide. Ahora se
  saltan, y la comparación va contra el primer antepasado que de verdad
  contiene: el que tiene relleno o recorta.
- Marcaba como recortado cualquier contenido más ancho que su caja **aun
  con `overflow-x: visible`**, donde el texto se lee entero. Sólo cuenta
  si se recorta de verdad.

Con la sonda arreglada quedaban 96 defectos reales en las cuatro
pestañas. Ahora cero, a diez anchos.

#### Lo que sí estaba roto en la demo

- La cabecera del registro se apila por debajo de `sm`: a 320 px la
  cifra de riesgo a 28 px se llevaba 185 de los 280 útiles.
- **Los campos numéricos**: `w-full` no basta porque el `min-width: auto`
  de un elemento de retícula lo impide, y encima WebKit seguía
  reservando el ancho del botón de flechas pese a `appearance: none`. Se
  retira el botón en globals.css — arregla todos los campos numéricos
  del sitio de una vez.
- El eje del histograma truncaba TODOS sus rótulos a 320 px. Ahora se
  salta uno de cada dos cuando hay muchas barras.
- Las sesiones de la barra de título entraban en `lg` sin caber hasta
  1280: se salían 119 px. Pasan a `xl`.

Un intento fallido, anotado en el código: `container-type: inline-size`
sobre cajas que se dimensionaban por su contenido las dejó sin crecer y
el importe se salió MÁS —de 14 a 92 px—. Esa utilidad sólo sirve cuando
el ancho lo pone el padre.

#### El despliegue se rompió, y fue por commitear el borrador

`FeaturesBento.tsx` y `Wrapped.tsx` se commitearon llamando a
`langDatos(lang)`, un ajuste de compilación del borrador de idiomas que
vive en un `i18n.tsx` **sin commitear**. En local todo pasaba en verde
porque el árbol de trabajo sí tiene el borrador; lo publicado no
compilaba y el despliegue de Pages falló.

**La regla que faltaba:** cuando hay cambios sin commitear que el resto
del código usa, las comprobaciones locales NO dicen si el commit está
sano. Hay que sacar el commit a un lado —`git stash` del borrador, o un
`git worktree` con dependencias— y compilarlo AHÍ.

Para commitear con un borrador ajeno delante: se construye la versión a
publicar en memoria, se mete en el índice con `git hash-object -w` +
`git update-index --cacheinfo`, y se comprueba que `git diff --cached`
no contiene ni rastro del borrador. El árbol de trabajo no se toca.

### Octava tanda: la tinta que no giraba con el tema

El sistema tiene tres familias de color y sólo una declaraba su tinta
por tema. `--accent-ink` existía desde hace tiempo; el P&L no tenía
gemelo, así que ocho sitios escribían la tinta a mano —`text-white`,
`text-black`, `fill="#fff"`, `color: "#000000"`— y **cada uno se
apagaba en un tema distinto**: en oscuro el verde y el rojo son
CLAROS y piden tinta oscura; en claro son OSCUROS y piden tinta clara.
La misma tinta fija no puede servir en los dos.

Medido sobre el sitio compilado, con la paleta viva:

| sitio | tema | antes | ahora |
|---|---|---|---|
| etiqueta SL del gráfico de velas | oscuro | 2,78:1 | 6,82:1 |
| etiqueta TP del gráfico de velas | claro | 2,34:1 | 7,86:1 |
| filtros «Ganadoras» / «100% en Plan» | claro | 2,34:1 | 7,86:1 |
| filtros «Pérdidas» / «Fuera de Plan» | oscuro | 2,78:1 | 6,82:1 |
| botón de cerrar de la demo (hover) | oscuro | 2,78:1 | 6,82:1 |
| botón «Copiado» del proyector | claro | 2,34:1 | 7,86:1 |

`--pnl-ink` se declara en los cuatro bloques de tema. **Un solo token
vale para verde, rojo y ámbar** porque los tres giran a la vez, que es
justo lo que hace que la familia sea una familia.

#### Por qué no lo había cazado ninguna puerta

`legible.mjs` compone el fondo recorriendo los ANTEPASADOS CSS. En un
`<svg>` el fondo de una etiqueta es un `<rect>` **hermano**, no un
antepasado, así que las daba por «sin fondo plano» y las dejaba pasar.
Se añade `scripts/tinta.mjs`, que mide esos casos a mano en los dos
temas —incluidos los que exigen interacción: el filtro pulsado, el
botón en hover, el botón ya copiado— y comprueba de paso la trampa del
servidor que devuelve la portada para todas las rutas.

Dos avisos para quien mida esto:

- **El banner de consentimiento tapa la mitad inferior de la página.**
  Sin retirarlo, un barrido de contraste encuentra la gráfica de la
  demo «sobre un botón azul» y el hover del botón de cerrar no llega a
  ocurrir: se mide el estado en reposo creyendo medir el hover.
- **Un `<g>` no pinta fondo.** Su `fill` es la pintura que HEREDAN sus
  hijos. Una sonda que recorra `elementsFromPoint` y trate cualquier
  elemento SVG como fondo dará 20 falsos «texto sobre negro», porque el
  `fill` por defecto de SVG es negro y `--divider` vale 0 0 0 en claro.

#### Lo que se revisó y NO era un defecto

De los 78 literales de color que quedan en componentes, los que se
tocan son los ocho de arriba. Los demás son legítimos y se quedan:
`opengraph-image` y `twitter-image` se dibujan fuera del navegador, sin
variables CSS; `themeColor` de la metadata tiene que ser un literal; la
máscara del atlas usa `#000` como canal alfa; y `EngravedAtlas` /
`Grabado404` guardan un `#1a1714` de respaldo por si
`getComputedStyle` no resuelve. Las tres sombras `rgba(0,0,0,0.12)` del
proyector son sombras neutras, no color de marca.

Y los tres **controles de ventana decorativos** del proyector de
capital (minimizar, maximizar, cerrar) se quitan: era la misma
afirmación que ya se corrigió al retirar la insignia «WINUI3» de ahí —
la web presentaba una calculadora del sitio como una pantalla del
programa. En `/demo` los controles se quedan, porque allí sí se simula
la aplicación.

### Novena tanda: mirar la web, no sólo medirla

Las siete tandas anteriores midieron. Ésta abre las páginas en claro y
en oscuro, a 1440 y a 390, y **mira**. Tres defectos, y ninguno lo
cazaba puerta alguna porque ninguno es un fallo de contraste de texto,
de desborde ni de animación.

#### El ✓ de la página de precios no existía

`CheckIcon` pintaba el disco con `fill="currentColor"` y la marca encima
con `stroke="currentColor"`. Es el mismo color: **1,00:1** en los dos
planes y en los dos temas. Lo que se veía eran dieciséis discos lisos, y
en el plan Pro —donde el disco es el acento, casi negro en claro— se
leían como botones de radio SIN marcar, justo lo contrario de
«incluido».

| | oscuro | claro |
|---|---|---|
| Core | 1,00 → 9,44:1 | 1,00 → 7,86:1 |
| Pro | 1,00 → 13,22:1 | 1,00 → 14,94:1 |

Se completa el sistema de tintas con `--sig-ink`. Ahora las tres
familias de color declaran la suya: `--accent-ink`, `--pnl-ink`,
`--sig-ink`. `tinta.mjs` pasa a barrer también los sellos, con la puerta
de 3:1 que WCAG pide a un elemento gráfico.

**La comprobación geométrica no es un adorno.** Sin ella el banco
marcaba tres iconos de dos piezas que comparten color a propósito
porque cada una ocupa su sitio y no se solapan. Un `<circle>` y un
`<path>` en el mismo `<svg>` no significan que uno vaya encima del otro.

#### El grabado del fondo pesaba un 40 % menos en papel

La hoja daba por hecho que «una línea oscura sobre fondo claro pesa más
que una clara sobre fondo oscuro» y bajaba por eso la opacidad del atlas
en claro. Medido leyendo el lienzo y componiendo su tinta sobre el fondo
real, con la misma cantidad de píxeles grabados en los dos temas
(2,6 %), el sentido es el contrario:

| | opacidad | peso |
|---|---|---|
| oscuro | 0,84 | **3,92:1** |
| claro (antes) | 0,76 | **2,34:1** |
| claro (ahora) | 0,94 | **3,00:1** |

No manda la opacidad sino el recorrido disponible. De noche la tinta es
casi blanca sobre casi negro y tiene toda la escala; en papel la tinta
ya está al fondo (`#15171a`) pero la chapa es un gris medio (`#d4d9dd`),
no un blanco, así que **el techo del claro con opacidad 1 es 3,25:1** y
no alcanza al oscuro ni apurándolo. Subir la tinta no cabe y densificar
la trama se midió en la cuarta tanda y cuesta fotogramas.

El texto de encima no se resiente: `humo.mjs` deja el peor texto pequeño
sobre el grabado en 5,66:1, el mismo de antes, porque donde hay
contenido manda el velo. La subida sólo se ve donde el atlas está
desnudo, que son las pausas de lámina — es decir, justo donde debe.

#### Los dos botones del hero, dentados en móvil

El canto dentado del par de CTA ya estaba corregido —el comentario del
propio código lo explica— pero sólo para `lg`. Por debajo de `sm`
seguían apilados con ancho natural, que es donde más se nota:

    español  240 / 180  →  240 / 240   (escalón 60 px → 0)
    inglés   254 / 180  →  254 / 254   (escalón 74 px → 0)

Es un aviso de método: **un arreglo escrito con un prefijo de punto de
ruptura arregla ese punto de ruptura y nada más.** Si el motivo del
arreglo vale para todos los anchos, las clases tienen que valer para
todos.

#### Dos cosas que parecían defectos y no lo eran

- **Las tres cifras de la banda de la portada** («40+ / 0 bytes / 8»)
  parecían ir en degradado, cada una más pálida que la anterior. Medido:
  mismo color y opacidad 1 en las tres. Era una ilusión del número de
  glifos —un «8» aislado pesa menos a la vista que un «40+»— y de mirar
  una captura reducida. No se tocó nada.
- **`font-serif` en esa misma banda no se aplica**, y es correcto: la
  hoja declara con `!important` que `.tnum` va en la sans porque «las
  cifras son datos». El componente pide una cosa y la hoja le niega
  otra; gana la hoja, que es la que tiene razón. Lo que sobra es la
  clase del componente.

### Décima tanda: palabras partidas por la mitad

Un barrido nuevo: recorrer cada nodo de texto carácter a carácter con un
`Range` y detectar dónde salta de línea **dentro** de una palabra, sin
guion. Sobre 18 rutas × 2 idiomas × 3 anchos: **7 casos, todos en la
calculadora de riesgo. Ahora 0.**

- Las seis celdas de resultado pasan a `caja-cifra` + `cifra-lg`.
- Los cuatro rótulos cambian `overflow-wrap: anywhere` por
  `hyphens: auto` — «APALANCAMIENT|O» pasa a partirse con guion.
- La rejilla de resultados cuenta sus columnas contra **su propio
  ancho** (`auto-fit` + `minmax(8.25rem,1fr)`), no contra la ventana.

#### Otra vez el punto medio, y dos trampas de la sonda

El fallo no estaba en el ancho más estrecho sino a **1024 px**, donde la
rejilla cae a 324 px y `sm:grid-cols-3` sigue pidiendo tres columnas.
A 1280 y 1440 la misma rejilla mide 432 y va sobrada.

Dos avisos para quien reescriba esa sonda:

- **`hyphens: auto` hay que excluirlo.** El guion que pone el navegador
  es sintético: no está en el nodo de texto, así que una sonda ingenua
  lee «discip|line» como palabra rota cuando en pantalla dice
  «discip-line». Sin ese filtro salían once falsos positivos de párrafos
  en inglés perfectamente compuestos.
- **Y las cajas de menos de 24 px.** Una caja de 11 px con texto de 18
  no es un texto partido: es una cifra a mitad de su animación de
  entrada. Otros diez falsos.
- **Y un error propio:** el informe imprimía el ancho de la caja donde
  decía «ventana», porque el objeto de la medida sobrescribía la clave.
  Con eso se diagnosticó durante un rato el caso equivocado —y se llegó
  a bajar el suelo de `.cifra-lg`, cambio que luego se revirtió porque
  no arreglaba nada. Si una medida no cuadra con lo que se ve, el primer
  sospechoso es el rótulo del informe.

### Undécima tanda: las zonas que nadie había mirado

Las diez tandas anteriores nunca abrieron `/glosario` y sus fichas,
`/beta`, `/test`, `/traders/manual`, `/traders/prop-firms`, los cuatro
legales, el 404 ni el pie. Se barrieron esas diez rutas en claro y en
oscuro a **1440, 1024 y 390 px**, mirando las imágenes. Ocho defectos, y
ninguna puerta cazaba ninguno: `legible`, `fondos`, `tinta` y
`deep_audit` pasaron limpias las cuatro (64 rutas, 2.698 trozos de texto
medidos contra su fondo real).

#### El glosario decía 51 términos teniendo 57

El subtítulo de la portada del glosario llevaba la cifra escrita a mano
y en letra —«Cincuenta y un términos» / «Fifty-one terms»— mientras el
contador de la propia caja de búsqueda, dos palmos más abajo, decía 57.
El margen ya sacaba su folio de `TERMINOS.length` y el comentario que
hay encima explica por qué; el subtítulo de al lado no lo hacía.

Lo mismo en las **tres cabeceras de metadatos de cada idioma**
—`description`, OpenGraph y Twitter—, que es lo que lee un buscador:
seis cadenas anunciando 51 términos. Todas salen ya de la lista.

#### «Psicología» caía sola, y fallaba por seis píxeles

| | suma de las seis fichas | ancho útil | líneas |
|---|---|---|---|
| inglés | 459 px | 542 | 1 |
| español | **548 px** | 542 | **2** |

El ancho de la caja del buscador se había medido contra el inglés. Con
`max-w-2xl` en vez de `max-w-xl` la fila pasa a 638 px y el español
entra en una sola línea a 1440, a 1024 y a 768.

Es el aviso de método de esta tanda: **una caja dimensionada contra un
idioma no está dimensionada.** El español ocupa entre un 15 y un 20 %
más que el inglés en rótulos cortos, y la retícula no lo sabe.

#### «135.0%» en una fila que decía «+13.500,00 US$»

`toFixed()` escribe SIEMPRE el punto decimal inglés. La distancia al
umbral de liquidación de `/traders/prop-firms` lo usaba, así que en
español la cifra y el importe de al lado —separados por un paréntesis—
seguían dos convenciones distintas. Pasa por `fmtPct`, que es el
formateador de la casa y ya resuelve locale, separador y el guardia de
menos-cero. Lo mismo en dos de las tres cifras de la calculadora de
comisiones, cuya tercera cifra, dentro de la misma tarjeta, ya usaba
`fmtNum`.

Y la ortografía del signo en la copia castellana de esa página: «0.75%»
pasa a «0,75 %», con el espacio duro que la casa ya tenía decidido en
`PCT_SEP`. **En las plantillas hay que escribirlo como escape y no como
carácter invisible**, o `no-irregular-whitespace` lo rechaza — la regla
perdona el literal invisible dentro de una cadena normal pero no dentro
de una plantilla.

Queda fuera a propósito el `Ticker` de la portada: es decorativo
(`aria-hidden`), imita una cinta de mercado —donde el punto es la
convención internacional— y no recibe el idioma.

#### Un elogio pintado de rojo

El pie de la tarjeta «Cumplimiento de plan» tenía el color FIJO en
`--pnl-neg` mientras su texto cambia con el setup. En dos de los tres
casos el mensaje dice «Proceso consistente y repetible»: un elogio en
color de pérdida. Ahora el color sigue al mensaje, y va en la familia
del semáforo y no en la del P&L, que es la distinción que el sistema ya
tenía escrita: esto es un veredicto sobre el proceso, no una cifra de
dinero.

#### Alturas escritas a mano que el contenido desborda

Dos casos, el mismo patrón que el deslizador de 36 px de la sexta tanda:

- **Las fichas de firma de prop firm** llevaban `h-8`. A 390 px el
  rótulo «FTMO (Drawdown estático)» envuelve a tres líneas y la tercera
  se salía por debajo del fondo de su propia ficha, encima de la fila de
  importes. Con alto MÍNIMO y la tira a `items-stretch`, la ficha crece
  y las tres comparten la más alta.
- **La tercera columna de «Estado del producto»** de `/beta` ponía un
  sello de 22 px donde sus hermanas ponen un icono de 17. Sin caja de
  alto fijo para la marca, esos cinco píxeles empujaban su titular ocho
  por debajo: medido, 1710 contra 1702. Ahora las tres a 1702.

#### El aviso de «sigue a la derecha» no lo veía nadie

El desvanecido del canto derecho de una tabla se monta con
`position: sticky`, `flex: none` y `align-self: stretch` — una receta
que sólo funciona DENTRO de un contenedor flexible. Las dos filas de
fichas que usan `.tj-fila-sigue` ya traen `flex` de Tailwind. Los dos
envoltorios de TABLA que usan la variante `--sin-reserva` no, así que el
pseudoelemento se maquetaba como un bloque vacío y **resolvía a altura
cero**.

El aviso estaba escrito, el navegador lo aceptaba, y no ocurría jamás.
Misma familia que las animaciones de entrada de la segunda tanda.

Medido a 390 px en `/privacidad` y `/cookies`: 552 px de tabla dentro de
una caja de 358, **186 ocultos** —la columna entera de «A dónde va» y
«Cuánto dura»— y ni un píxel de degradado. La última columna quedaba
partida contra el canto, que no se lee como «hay más a la derecha» sino
como una tabla rota. En un documento de privacidad, lo invisible era
justo dónde van tus datos. Con `display: flex` en la variante, el
pseudoelemento pasa de `auto` (0 px) a 244 px.

#### El 404 flotaba sobre la lámina sin red

El texto de la página 404 cae DIRECTAMENTE sobre la lámina grabada, sin
panel ni velo detrás — el caso exacto para el que existe
`.tj-legible-text`. No estaba puesta, así que el filete vertical del
registro pasaba entre «o» y «nunca» del párrafo y seguía por dentro del
campo de búsqueda.

**La primera hipótesis era falsa y la medida la tumbó.** Parecía que la
lámina pesaba más en claro. Compuesta sobre el fondo real:

| | opacidad | cobertura | pico de tinta |
|---|---|---|---|
| claro | 0,9 | 3,83 % | **4,24:1** |
| oscuro | 0,9 | 3,83 % | **5,31:1** |

Pesa más en OSCURO. El defecto era geométrico, no cromático, y por eso
la solución es la red de legibilidad y no bajar la opacidad, que habría
apagado el dibujo entero para arreglar dos renglones.

#### Tres cosas que parecían defectos y no lo eran

- **Los 17 errores 404 de consola en cada página.** Next 16 exporta las
  cargas de prefetch de segmento como CARPETA al compilar en Windows
  (`/beta/__next.beta/__PAGE__.txt`) y como fichero PLANO al compilar en
  Linux (`/beta/__next.beta.__PAGE__.txt`), que es lo que pide el
  cliente. Comprobado en los dos lados: en el sitio publicado el plano
  devuelve 200 y el anidado 404, o sea exactamente lo contrario que en
  local. `humo.mjs` daba **76 fallos y los 76 eran esto**. Se filtra en
  `RUIDO`, porque una puerta que siempre falla en la máquina donde se
  trabaja deja de leerse. Para volver a distinguir los dos casos:
  `find out -name "__next.*.__PAGE__.txt" | wc -l` — cero significa que
  quien compiló fue Windows.
- **La trama de puntos «encima» del texto.** Dos barridos independientes
  —a 390 y a 1024— la reportaron como adorno mal posicionado sobre
  `/traders/prop-firms` y `/traders/manual`. **Los dos se equivocan**: el
  lienzo del atlas vive dentro de un padre `position: fixed` y el titular
  baja 40 px por cada 40 px de scroll, así que cualquier coincidencia
  dura un fotograma y no es una colisión de maquetación. Se comprobó
  midiendo el titular en tres posiciones de scroll (217 → 177 → 117 px).
  Que dos sondas coincidan no las hace ciertas.
- **La definición cortada a media palabra** en «De la misma familia» de
  una ficha de glosario («permite s…»). Es el comportamiento propio de
  `-webkit-line-clamp`, que corta en el punto de desbordamiento y no en
  la última palabra entera; no hay `overflow-wrap: anywhere` de por
  medio (medido: `normal`). Arreglarlo pide truncar en JavaScript, con
  el riesgo de hidratación que eso trae, para ganar tres letras. **No se
  toca.**

#### Y una puerta que no se podía ejecutar

`eslint` no arrancaba en local: le faltaba `@babel/core`, que `bun`
instala como dependencia de pares de `eslint-plugin-react-hooks` y `npm`
no. Se resuelve con `npm i --no-save @babel/core` — con un aviso caro:
esa orden **PODA todo lo que no esté en `package.json`** (se llevó 463
paquetes por delante; se recupera con `npm install`, y conviene borrar
el `package-lock.json` que deja, que aquí no pinta nada). Con la puerta
en marcha, su primer uso ya cazó cuatro espacios duros mal escritos.

### Duodécima tanda: las fichas, las calculadoras y la demo en móvil

Las tres zonas que quedaban sin mirar. Seis defectos, dos de ellos de los
que se ven desde la otra punta de la habitación.

#### Quince fichas de glosario enseñaban el LaTeX en crudo

La caja «Fórmula Cuantitativa» volcaba la cadena de LaTeX tal cual, sin
ningún renderizador detrás. En pantalla se leía

    MaxDD = \max_{t} \left( \frac{\max_{\tau \le t} X_\tau - X_t}{…

dentro de un sello que decía **LATEX**. Quince fichas, los dos idiomas,
los dos temas, todas las anchuras. Ninguna puerta lo miraba porque no es
un fallo de contraste, ni de desborde, ni de animación: es texto que se
lee perfectamente y no significa nada.

Y siete de esas fórmulas llevaban palabras **castellanas dentro del
propio LaTeX** —Ganancias Brutas, Riesgo Inicial, Tamaño, Objetivo,
Ruina—, así que la página inglesa también las enseñaba en español.

Se pasan a notación Unicode en la monoespaciada que la caja ya usaba, y
hay una fórmula por idioma. La alternativa era cargar KaTeX y sus
fuentes: aquí no hay matrices ni integrales anidadas, y no compensa una
dependencia más un fichero de fuentes por quince fichas de 155 páginas.

Dos decisiones que costaron una vuelta:

- **El índice mudo iba en tau**, y la tau de Geist Mono se lee como una
  T mayúscula justo al lado de la t del tiempo. Se nombra el pico como
  `HWM`, que además es como lo llama el resto del producto.
- **La razón de integrales de Omega** ocupaba ochenta caracteres y a
  390 px se partía en tres renglones por mitad de la expresión. Se queda
  la forma discreta, que es la que calcula el motor, y la integral pasa
  a la línea de variables.

Comprobado: las dieciséis fórmulas vivas se pintan enteras y sin
desbordar a 390 px, en los dos idiomas. De paso se retiran dos claves
duplicadas (`sharpe`, `sortino`) que no corresponden a ningún término.

#### Las cifras de la demo se pintaban en vertical

En la **primera pantalla de la demo**, a 390 px, «+6807,72 US$» y
«50,5 %» salían partidas en un carácter por renglón: una columna de diez
líneas con una letra en cada una. Medido: la caja del valor tenía ancho
**cero** y el `<span>` de dentro, 13 px de ancho por 330 de alto.

Es la trampa que la séptima tanda dejó escrita y que aquí volvió a
morder: `caja-cifra` declara `container-type: inline-size`, y un
contenedor de medida sobre una caja que se dimensiona por su CONTENIDO
colapsa a cero. Ésta lo hacía porque su padre es `flex flex-col
items-center`. Con ancho cero, `11cqi` vale cero y `break-words` parte
la cifra letra a letra.

Dos cosas, no una: `w-full` para que el ancho lo ponga el padre, y
`whitespace-nowrap` en vez de `break-words` — el valor llega con su
propio `text-lg`, que **gana a `cifra-lg`**, así que la consulta de
contenedor no puede encogerlo y a cualquier ancho acabaría partiendo
«US$» por la mitad (comprobado subiendo la celda a 7 rem: pasó a romper
en «U | S$»). La tira ya se desplaza de lado, que es para lo que se le
puso `overflow-x-auto`.

Comprobado a 390, 768 y 1440: las siete celdas comparten altura (55 px),
la tira se desplaza donde no cabe (822 px de contenido en 277 visibles)
y la página no gana barra horizontal en ningún ancho.

#### La cabecera del detalle se pisaba a sí misma

Los tres grupos —volver, símbolo, número y flechas— van en una fila con
`flex-wrap`. El del centro llevaba `flex-1 min-w-0`, pero su `h2` de
24 px monoespaciada **no encoge**, así que a 390 px desbordaba su caja y,
al ir centrado, se derramaba por los DOS lados: «EURUSD» tapaba el botón
de Volver y «Short» pisaba el «#066». El control de volver quedaba
ilegible y a medias pulsable.

Por debajo de `sm` el grupo del símbolo ocupa la línea entera y va el
último, para que la primera línea la compartan los dos grupos de
controles como en escritorio. Medido: **cero solapes** (antes dos) y la
cabecera baja de tres líneas a dos.

#### La copia castellana estaba escrita con números ingleses

Medido sobre el sitio compilado, en las 22 rutas castellanas escritas a
mano:

| | antes | ahora |
|---|---|---|
| decimales con punto inglés | 30 en 10 rutas | **0** |
| signo de % pegado a la cifra | 64 de 224 | **0** |

Las tres calculadoras más grandes —riesgo, significancia y proyector—
**no importaban el formateador de la casa**: componían cada cifra a mano
con `toFixed`, que escribe siempre el punto decimal inglés. Por eso
convivían en la misma tarjeta un «p-valor 0,2579» correcto y un
«95% (z=1.96)» que no lo es, o una lista de marcas que empieza en
«0.25%» y termina en «3,00%».

Cada una recibe el separador que la casa ya tenía decidido en `PCT_SEP`:
espacio DURO antes del signo en español, pegado en inglés. Estaba
escrito pegado en los dos idiomas, y el proyector lo tenía al revés —con
espacio en los dos, o sea mal en inglés—.

**Dos avisos de método:**

- **`no-irregular-whitespace` perdona el espacio duro literal dentro de
  una cadena normal pero NO dentro de una plantilla.** En las plantillas
  hay que escribirlo como escape.
- **`toFixed` no es un formateador**, es una conversión. Cualquier cifra
  que vea un visitante pasa por `fmtNum` / `fmtPct` / `fmtMoney`.

#### Y un fallo de paridad bilingüe

El rótulo «p-valor (H₀: 50%)» del comprobador de significancia no estaba
traducido, así que la página **inglesa** decía «P-VALOR». Ninguna puerta
lo veía: `humo.mjs` revisa palabra a palabra siete páginas inglesas y
ninguna de ellas es una herramienta.

#### La puerta de contraste no miraba las calculadoras

`legible.mjs` tenía doce rutas y entre ellas `/herramientas`, que es el
**índice** — la única de las nueve páginas de esa familia que no lleva
una calculadora dentro. Las ocho herramientas interactivas, que son las
páginas con más texto pequeño sobre fondo de color del sitio, no las
medía nadie. Tampoco los cuatro legales, ni `/beta`, ni `/test`, ni una
ficha de glosario, ni `/traders/prop-firms`.

Pasa de 12 a 28 rutas: **5.474 trozos de texto contra su fondo real, 0
fallos**. No había nada roto, pero hasta ahora nadie lo sabía.

#### Lo que queda medido y sin arreglar

Cinco defectos más de la demo en móvil, vistos y localizados pero no
corregidos en esta tanda. Viven todos en ficheros del borrador de
idiomas, así que exigen el procedimiento de apartar el borrador para
cada uno:

- **Diario · Historial**: la insignia de cumplimiento y el importe se
  dibujan encima del día y la fecha, y la línea de metadatos se parte en
  una palabra por renglón.
- **Analítica · «De un vistazo»** y **Diario · «Desglose por tipo de
  indisciplina»**: la última columna —el importe, que es el dato por el
  que existe la tabla— se corta contra el canto sin degradado que avise
  de que hay más a la derecha. Es la misma familia que el aviso muerto
  de los documentos legales de la undécima tanda.
- **Analítica · «Distribución de P&L»**: las etiquetas del primer y
  último grupo de barras se cortan contra el borde. El histograma de
  R-múltiplos vecino no lo sufre porque ya oculta una etiqueta de cada
  dos, corrección que aquí no llega a aplicarse por tener menos barras.
- **Operaciones**: el rótulo «Operaciones» deja una «s» huérfana y la
  cuarta métrica se corta sin aviso de desplazamiento.

Y los cuatro múltiplos en R de `FeaturesBento` («+1.8R») siguen con
punto decimal inglés en la copia castellana, por el mismo motivo.

#### Tres cosas que parecían defectos y no lo eran

- **La trama de puntos «encima» del texto**, otra vez. Dos barridos
  independientes la reportaron en la undécima tanda y una ficha de
  glosario la volvió a señalar en ésta. El lienzo del atlas vive en un
  padre `position: fixed` y el texto se desplaza sobre él: la
  coincidencia dura un fotograma.
- **El botón de volver arriba rozando un titular.** Es `position:
  fixed`; cualquier texto que pase por esa esquina se solapa un
  instante por diseño.
- **La definición cortada a media palabra** en «De la misma familia»
  («permite s…»). Es el comportamiento propio de `-webkit-line-clamp`,
  que corta en el punto de desbordamiento y no en la última palabra
  entera; no hay `overflow-wrap: anywhere` de por medio (medido:
  `normal`). Arreglarlo pide truncar en JavaScript, con el riesgo de
  hidratación que eso trae, para ganar tres letras. **No se toca.**

### Decimotercera tanda: lo que la demo escondía sin decirlo

Los cinco defectos que la duodécima tanda dejó **medidos y sin arreglar**
por vivir en ficheros del borrador de idiomas. Se resuelven con el
procedimiento de apartar el borrador, y el saldo son diez contenedores
arreglados y tres falsos positivos de la propia sonda.

#### Diez tiras se desplazaban de lado sin decirlo

Medidas las cuatro vistas a 390 px, las tablas y las tiras de fichas de
la demo esconden **entre 67 y 803 px** de contenido a la derecha y
ninguna lo avisaba. En los filtros de Operaciones la barra va además
oculta con `no-scrollbar`: no había absolutamente ningún indicio, y la
última columna quedaba partida contra el canto — que no se lee como «hay
más a la derecha» sino como una tabla rota.

Es exactamente el defecto que la undécima tanda encontró en los
documentos legales, repetido diez veces dentro de la pieza comercial
principal.

Se les pone `tj-fila-sigue`. Los envoltorios de UN solo hijo —las
tablas— llevan además `--sin-reserva`, que es la variante que se hizo
flexible en la tanda anterior para que el desvanecido llegue a existir.
Comprobado uno a uno: los diez pseudoelementos se pintan con altura real
(de 28 a 969 px), y ningún elemento se sale del panel sin un antepasado
que se desplace.

#### La tira de indicadores, y por qué necesitó una variante propia

La del Resumen es `flex` en móvil y **`grid` de siete columnas** por
encima de `md`. El desvanecido se monta como pseudoelemento del
contenedor, y dentro de una rejilla eso es un ITEM MÁS: una octava celda
en una rejilla declarada de siete.

Se añade `--solo-movil`, que apaga el pseudoelemento a partir de 48 rem
— justo donde la fila deja de ser fila, y donde ya no hace falta porque
no se desplaza nada. Comprobado a los dos lados: a 390 px el contenedor
es `flex` y el aviso mide 55 px; a 1440 es `grid` de **siete** columnas y
el pseudoelemento vale `content: none`.

**La regla que queda escrita:** un pseudoelemento posicionado sobre un
contenedor que cambia de `flex` a `grid` en un punto de ruptura no es el
mismo elemento a los dos lados. En `flex` es decoración; en `grid` es una
celda.

#### La tarjeta del historial se ahogaba a sesenta píxeles

La fila del Diario son dos grupos: el de la fecha y la nota, que encoge
(`min-w-0 flex-1`), y el del sello y el importe, que no (`shrink-0`). A
390 px, dentro del panel de la demo, el segundo se llevaba lo suyo y al
primero le quedaban sesenta píxeles: sus rótulos caían a **veintiséis
píxeles de ancho** y «16 jul 2026» salía en tres renglones, uno por
palabra. Siete rótulos así por tarjeta, en todas.

El grupo del sello baja a su propia línea por debajo de `sm`. Medido: de
siete rótulos colapsados a cero.

#### Y los números de la demo, que quedaban fuera

La duodécima tanda dejó la copia castellana limpia de números ingleses
en todo el sitio menos aquí. Ahora también:

| | antes | ahora |
|---|---|---|
| decimales con punto inglés | 13 en 4 vistas | **0** |
| signo de % pegado | 2 | **0** |

«7.0 h» de las horas de sueño, los dos intervalos de confianza de
Analítica («[0.05, 0.41]») y el eje del histograma de R-múltiplos
(«-1.5R») pasan por `fmtNum`; «100%» del filtro de Operaciones y de la
tabla del Diario, y la latencia «0.2ms» de la barra de estado, llevan el
espacio duro. Lo único que queda con punto es `v2.4.1`, que es un número
de versión.

#### Y una puerta que se quedó buscando el rótulo viejo

Al poner el espacio duro en «100 % en Plan», `tinta.mjs` dejó de
encontrarlo: buscaba el literal `100% en Plan` con espacio normal. La
puerta reportaba dos «NO MEDIDO» que no eran del sitio sino suyos.

**Es el precio de tocar la copia:** cualquier guion que localice un
elemento por su texto visible se rompe cuando ese texto cambia, y lo
hace en silencio — no falla como «contraste insuficiente», falla como
«no medido», que es fácil de leer por encima. Ahora busca por el trozo
estable del rótulo.

#### Tres falsos positivos, y los tres de la sonda

- **«Nueva York», «1h 12m» y «16 jul 2026» a tres renglones** en
  Operaciones. El detector contaba renglones dividiendo el alto de la
  caja entre la altura de línea, y en una celda de tabla ese alto es
  sobre todo RELLENO. Medidos de verdad: `white-space: nowrap`, y el
  ancho que necesitan (82, 56 y 80 px) cabe de sobra en el que tienen
  (85, 91 y 98). No se partían.
- **Dos rótulos de ancho cero** en la misma vista: elementos ocultos
  (`sr-only`), no defectos.
- **Los «solapes» de la cabecera**: todos eran la barra de navegación de
  la página, el bloque de datos estructurados y el botón de volver
  arriba — el armazón del sitio, no la demo.

De cuatro hallazgos brutos en Operaciones, cero reales. Van ya tres
tandas en las que más de la mitad de lo que señala un barrido automático
es defecto del barrido.


### Decimocuarta tanda: /features y /pricing, que nadie había mirado

Las nueve rutas de marketing que las trece tandas anteriores no habían
abierto —`/features` y sus tres hijas, `/pricing`, `/about`, `/faq`,
`/herramientas` y la envoltura de `/demo`— barridas en claro y oscuro a
1440, 1024, 768 y 390 px. Siete defectos, y **ninguna puerta cazaba
ninguno**: `humo`, `legible` (5.474 trozos), `fondos`, `tinta` y
`deep_audit` (64 rutas) pasaron limpias antes y después.

#### Las cuatro barras de playbook se pintaban llenas

El defecto más caro de la tanda, y el más fácil de ver una vez visto. El
acierto de cada setup vivía en un solo campo que servía de **rótulo** y
de **ancho de la barra** (`width: s.w`). Con el espacio que pide la
ortografía castellana, «62 %» no es una medida CSS válida: el navegador
la descartaba, la barra se quedaba sin ancho y, siendo un bloque dentro
de su pista, la llenaba entera.

| | antes | ahora |
|---|---|---|
| Breakout 62 % | 197 px de 197 | 122 |
| Pullback 58 % | 197 px de 197 | 114 |
| Reversal 41 % | 197 px de 197 | **81** |
| Trend 55 % | 197 px de 197 | 108 |

La tarjeta que promete «sólo setups que tienen edge» enseñaba el
Reversal —41 % de acierto y su propia insignia «Sin ventaja»— con la
barra roja llena de lado a lado, que dice justo lo contrario que el
número de al lado.

**La regla que queda escrita:** un valor que se pinta Y se mide no puede
ser el mismo dato. El porcentaje pasa a número; el rótulo sale de
`fmtPct` y el ancho de `Math.round(wr * 100)`, y ya no pueden divergir.
(Y `0.58 * 100` es `57.99999999999999`: el redondeo no es cosmético.)

#### La matriz de seguridad se quedó a 480 px en una tarjeta de 1166

Regresión de la undécima tanda, que hizo `display: flex` la variante
`--sin-reserva` para que el aviso de «sigue a la derecha» dejara de
resolver a altura cero. El precio no se midió: el hijo dejó de ser un
bloque —que ocupa el ancho entero— y pasó a ser un **item**, que se
dimensiona por su contenido.

| ancho | caja | tabla |
|---|---|---|
| 1440 | 1166 | 480 |
| 1024 | 950 | 480 |
| 768 | 705 | 480 |

Casi setecientos píxeles de tarjeta vacía a la derecha de una tabla cuyas
franjas se cortan a media caja — que no se lee como «tabla estrecha» sino
como «tabla rota», en la página cuyo argumento central sostiene esa
tabla. Con `flex: 1 1 auto` el hijo vuelve a llenarla y el suelo de
`min-width` sigue mandando a 390.

**La regla:** cada vez que una clase de disposición cambia de `block` a
`flex` hay que volver a medir a sus hijos. Es el mismo tipo de trampa que
la decimotercera tanda encontró con `flex` → `grid`.

#### El punto separador colgaba al final de cada línea

La tira de confianza —portada y `/pricing`— alternaba señal y punto
separador «porque es una sola línea de cinco piezas cortas». Medida, no
lo es a **ningún** ancho: las cinco piezas suman más que los 1008 px
útiles de su caja a 1440, así que siempre baja al menos una, y el punto
que sigue a la última pieza de una línea se queda solo contra el canto,
detrás de nada. Comprobado a 1440, 1280, 1152, 1024 y 768: un huérfano
al final de cada línea.

No hay CSS que distinga «último de la línea» de «último de la lista», y
pintarlos delante sólo mueve el huérfano al principio de la línea
siguiente. Fuera los puntos; separa el hueco, que ya hacía el trabajo.

#### Tres tiras más que se desplazaban sin decirlo

La decimotercera tanda puso el aviso en las diez tiras de la demo. Fuera
de la demo quedaban tres, dos de ellas en las páginas más visitadas:

- **La barra de pantallas de `/features`** esconde 335 px de 725 a 390 y
  80 a 768, con su barra de desplazamiento oculta a propósito para que la
  tira se lea como la barra de una aplicación: ningún indicio de que
  hubiera más pestañas. La misma barra en la portada esconde 30.
- **La tabla comparativa de `/pricing`** pide 680 px y a 390 esconde 330
  — las dos últimas columnas enteras, «Diarios en la nube» y
  «Excel / Sheets»—, con la última partida contra el canto.

La tabla necesitó variante propia. De `lg` para arriba su caja pasa a
`overflow-x: clip` a propósito (para que sus veintisiete filas cuelguen
su `view()` de algo que sí se mueve), y con `clip` no hay puerto de
desplazamiento contra el que anclar un `position: sticky`.
`--hasta-lg` apaga el aviso justo ahí: 733 px de desvanecido a 390,
`content: none` a 1440.

#### La última cifra del eje se cortaba contra el canto

El pendiente que la duodécima tanda dejó **medido y sin verificar**.
Confirmado en la Analítica de la demo a 390 px, donde el panel deja
237: el rótulo va centrado en una columna de 23 px y «431 US$» pide 36,
así que sobra por los dos lados. En las columnas de en medio da igual
—el vecino va oculto—, pero en la última la sobra cae fuera de la
tarjeta, que lleva `overflow-hidden`: **13 px de cifra por fuera**.

Dos cosas, no una:

- `text-align` no basta. Cuando el texto es más ancho que su caja, la
  línea arranca igual en el canto izquierdo y la sobra sigue saliendo
  por la derecha — medidos los mismos 13 px con `text-right` puesto. Los
  dos extremos pasan a caja del tamaño de su contenido, anclada a su
  propio lado.
- «Uno de cada dos» tampoco basta. Con nueve barras en 237 px, cinco
  rótulos de «431 US$» suman 176 y se quedaban a 4 px unos de otros, que
  se lee como un renglón corrido. El salto lo decide ahora el rótulo más
  largo: hasta seis caracteres uno de cada dos —el eje de R sigue con sus
  cinco—, por encima uno de cada cuatro, que en el de P&L deja tres
  cifras separadas por 62 px. El último se pinta siempre: un eje sin su
  extremo derecho no dice dónde acaba.

#### Números y rótulos ingleses en copia castellana

Cuatro de la misma familia, todos en rutas nunca miradas:

- El **titular** de `/features/seguridad` («Tus datos, 100% en tu
  máquina»), el subtítulo de `/features`, la descripción de la portada y
  cinco cabeceras de metadatos llevaban el porcentaje pegado.
- El **proyector de capital** abreviaba «$2,18M» también en castellano
  —la divisa delante, que es la convención inglesa— al lado de un
  «2.182.131 US$» de la casilla vecina que sale de `Intl` y la pone
  detrás. Y «net» y «1000 trades» sin traducir.
- La **calculadora de indisciplina**: «($/trade)» y la columna «TRADES»
  en castellano, ésta seis líneas por debajo de su propio rótulo
  «Operaciones al mes». Y el resumen que copia al portapapeles componía
  sus seis cifras con `toFixed` dentro de un texto cuyo porcentaje ya
  llevaba su espacio duro.
- **`Wrapped`** (la ficha del setup más rentable de
  `/features/metricas`) escribía «54% win»: signo pegado en los dos
  idiomas y un rótulo que no es ninguno de los dos — la casa llama a esto
  «win rate» en ambos, que es lo que dice su propia clave de i18n.

#### Cinco cosas que parecían defectos y no lo eran

- **Las dos últimas filas de `/herramientas` a media tinta.** Era la
  entrada escalonada a medio camino: medida la opacidad de las nueve
  filas, todas a 1. **Los 1800 ms de espera tras el scroll que dejó
  escrita la novena tanda no siempre bastan** — con un escalonado largo
  hacen falta 2500. La misma sombra salía en la tabla de `/pricing`.
- **«2000,00 US$» sin separador de millares** en la calculadora de
  riesgo. Es lo correcto: `es-ES` no agrupa hasta cinco dígitos.
- **La tira de perfiles del proyector cortada a 1024** («Scalping · Alta
  Frecuen…»). Ya lleva su `tj-fila-sigue`; lo que se ve es el
  desvanecido haciendo su trabajo.
- **«29.73» en los dos campos de la calculadora de indisciplina.** Son
  `input[type=number]`: el navegador escribe el valor crudo con punto
  decimal y no hay locale que lo cambie sin convertirlos en campos de
  texto y perder el teclado numérico y los pasos.
- **`tj-interlude` escondiendo 23 px** en nueve rutas a 390. Es
  `overflow-x: clip` sobre una lámina decorativa: no hay nada que
  desplazar ni nada que avisar.

#### Lo que se vio y se deja escrito sin tocar

En la Analítica de la demo conviven dos ejes con dos signos menos
distintos: el de R-múltiplos escribe «-1,5R» con el guion que devuelve
`Intl` para `es-ES`, y el de P&L «−260 US$» con el menos tipográfico que
pone `fmtMoney`. Se decidió no tocarlo: unificar exige o meterle un
reemplazo a mano al eje de R —un apaño— o cambiar el signo que devuelve
el formateador de la casa, que es una decisión de todo el sitio y no de
un gráfico.

#### Lo que sigue sin mirar

Para quien retome. Los overlays, los formularios y la hoja impresa se
miraron en la decimoquinta tanda. Quedan: las 46 fichas de glosario
restantes (se miraron 11, elegidas por ser los extremos de contenido) y
el lado inglés, del que esta tanda barrió `/en/features` y `/en/pricing`
y el resto sigue revisado sólo palabra a palabra.

### Decimoquinta tanda: los overlays, los formularios y la hoja impresa

Las tres zonas que quedaban sin abrir. La primera dio el defecto más
grave que ha salido en quince tandas, y no lo cazaba ninguna puerta
porque **no se ve sin pulsar una tecla**.

#### El glosario oscurecía la página y no enseñaba nada

Ctrl+G montaba el modal, el velo cubría la ventana… y la ficha se
maquetaba **a 9.683 px del borde superior**, al final del documento.
Pedía `position: fixed` y resolvía a `relative`.

La causa no es un empate de especificidad —añadir clases no lo habría
arreglado— sino la CAPA. `.tj-paper`, `.tj-hoja`, `.liquid-glass` y
`.demo-card` declaran su anclaje en reglas que viven **fuera de toda
`@layer`**, y en la cascada lo que no está en una capa gana a lo que sí:
las utilidades de Tailwind viven en `@layer utilities`. Comprobado con la
cascada que devuelve el propio navegador (`CSS.getMatchedStylesForNode`):

| selector | capa | declara |
|---|---|---|
| `.fixed` | `utilities` | `position: fixed` |
| `.tj-paper` | (sin capa) | `position: relative` |

**Cualquier `fixed`, `absolute` o `sticky` puesto sobre un elemento con
uno de los cuatro materiales quedaba anulado en silencio.** Y llevaba
tiempo mordiendo: dos piezas ya se habían parcheado a mano con
`style={{ position: "fixed" }}` —el cajón móvil de la barra y el aviso de
cookies, cada uno con su comentario explicando el apaño— sin buscar la
causa común. Las que no se habían parcheado:

- El **glosario modal**, arriba.
- El **tirador del comparador** de `/features/disciplina`, que pedía
  `absolute left-1/2 top-1/2` y caía en el flujo.
- El **panel de resultados** de la calculadora de comisiones, que pedía
  `sticky top-24` y no se quedaba quieto.

El anclaje sólo existe para que los pseudoelementos decorativos de cada
material tengan contra qué colocarse, y cualquier posición no estática
sirve: declararlo en `@layer components` conserva el comportamiento
donde no hay utilidad y deja de pisarla donde la hay. Comprobado: modal
centrado (672×868 a 1440×900), tirador en el centro de su pista (698 de
337-1103) y panel clavado en `top: 96` tras desplazar 400 px. Barrido de
16 rutas buscando utilidades de posición anuladas: cero.

**La regla que queda escrita:** en Tailwind v4, una clase propia SIN
capa gana a cualquier utilidad. Si una clase de material declara
`position`, `display` o cualquier cosa que una utilidad pueda querer
cambiar, va en `@layer components`.

#### Y con el glosario ya visible, dos defectos suyos

- **El listado medía 1.868 px de ancho dentro de una caja de 670.** Cada
  ficha es item de rejilla, y un item de rejilla arranca con
  `min-width: auto`: no baja de lo que mide su contenido. La definición
  lleva `truncate`, que es `nowrap`, así que su contenido es la frase
  entera. 1.198 px escondidos de lado y la definición cortada a media
  palabra contra el canto en vez de con sus puntos suspensivos. Con
  `min-w-0`, la lista mide exactamente su caja a 1440 y a 390.
- **La ficha no cabía en el móvil.** 900 px de alto dentro de 844: 28
  cortados por arriba —la ceja y el titular— y otros 28 por abajo, y
  como el único que se desplazaba era el listado de dentro, esos 56 px
  no había manera de verlos. Con tope de ventana y el listado quedándose
  con lo que sobra: 812 px a 390×844, 868 a 1440×900.

#### El panel de atajos escondía la mitad de sus atajos

Mismo tipo de fallo, otra pieza. Crecía con su lista de veinte y no
tenía tope: medido a 390×844, **911 px de panel** empezando 127 por
debajo del borde (su `pt-[15vh]`), o sea 194 por debajo del pliegue, y
ningún elemento con desplazamiento. Los diez últimos atajos no se podían
leer ni alcanzar. Ahora 685 px, la lista con su propio desplazamiento y
el pie a la vista.

#### La web anunciaba una paleta Ctrl+K que no existe

Los «Contratos de interfaz (siguen vigentes)» y el inventario del prompt
maestro declaraban un Ctrl+K en `OverlayHost` y un componente
`CommandPalette` de 19 KB. Ninguno existe: el fichero no está en el
árbol, nadie importa `src/components/ui/command.tsx` y, por tanto, nadie
importa `cmdk`. La paleta se retiró hace tandas —está anotado en «Lo que
hubo que retocar en las puertas»— y el panel de atajos, que es lo que ve
el visitante, ya no la ofrecía. Comprobado en el navegador: Ctrl+K y
Cmd+K en la portada no cambian un solo byte del DOM. Corregidos los dos
documentos.

Queda **código muerto sin retirar**, anotado aquí para no volver a
descubrirlo: `src/components/ui/command.tsx` (sin importadores) y la
dependencia `cmdk` que sólo él usa. No se toca en esta tanda porque
sacar una dependencia obliga a rehacer el candado y eso se decide
aparte; no pesa en el sitio publicado, que no la empaqueta.

#### Quien imprimía en tema oscuro se llevaba bandas negras

Las reglas de impresión existían y no las había comprobado nadie.
Emulando `print` con el tema oscuro: el texto y el papel salen bien
—eso se fuerza con `!important` sobre `html`/`body`— pero **trece
degradados decorativos seguían siendo casi negros**, porque interpolan
`--bg` o `--tint` y esas variables nunca se reseteaban. El mayor cubre
2,56 millones de px²; detrás van el velo lateral del hero, el velo de la
cabecera de página (568.000 px² en `/privacidad`, `/features` y
`/pricing`) y los desvanecidos de «sigue a la derecha», que caen encima
de la última columna de la tabla — en un documento de privacidad, lo
tapado era otra vez a dónde van tus datos.

El bloque `@media print` abre con «Force light-theme CSS variables» y no
forzaba ninguna, por dos motivos a la vez:

- **Escribía el formato equivocado.** `--bg` es un COLOR en este sistema
  (`#0c1116`), no una tripleta, y le ponía `255 255 255`.
- **Llegaba antes.** `--bg` se declara CINCO veces en el fichero y la
  última está en la línea ~3.174; el bloque de impresión, en la 2.391.
  Con la misma especificidad gana la última.

Ni un selector nuevo: con los tokens en blanco, cada degradado va de
blanco a transparente y desaparece sobre el papel. Comprobado en seis
rutas y en los dos temas: ni un color oscuro sobrevive.

#### Lo que se miró y estaba bien

- **Los estados de los dos formularios.** `/beta`: anillo de foco de 2 px
  más halo de 4 en los doce controles, `aria-invalid` en los seis campos
  obligatorios al enviar vacío, un mensaje propio por campo enlazado con
  `aria-describedby`, y el foco viajando al primer campo inválido. El
  formulario de contacto de `/faq` usa el otro patrón válido: un resumen
  con `role="alert"` al que apuntan los tres campos. Nada que arreglar.
- **El señuelo anti-robots** de los dos formularios. Parecía enfocable
  —la sonda le sacaba anillo de foco— pero es la sonda: `.focus()` por
  JavaScript se salta `tabIndex={-1}`. Va dentro de un contenedor
  `aria-hidden` fuera de pantalla. Correcto.
- **El cajón móvil**, que ya llevaba su parche de posición inline: 300 px
  fijos a la derecha, sin un solo desbordamiento dentro.

#### Y un conejillo que se durmió por tercera vez

`tests/css.test.ts` rompe `globals.css` a propósito —mete un cierre de
comentario donde no toca— para demostrar que la comprobación de al lado
puede fallar. Mover el anclaje de `.tj-paper` a su capa lo desarmó: con
recuperación de errores, el analizador pasó a descartar la prosa suelta
sin llevarse el bloque por delante, y las dos hojas emiten byte a byte lo
mismo (72.643 en las dos).

Es la tercera vez que ese conejillo se duerme, y las tres por lo mismo:
exigía UN síntoma concreto, y cuál aparece depende de por dónde caiga el
desfase que la prosa provoca — algo que cambia con cada edición de la
hoja. Ahora exige que ocurra alguno de los dos: o el analizador estricto
protesta (comprobado hoy: sigue dando «Invalid empty selector», que es
justo lo que vigila la prueba de al lado) o el compilador de producción
emite otra cosa.

### La decisión sobre `framer-motion`: no se migra

El encargo pedía decidirlo con un motivo. Medido sobre el sitio
compilado:

- El trozo que contiene la biblioteca pesa **336 KB en bruto, 88 KB
  comprimido**, y **ninguna página que no sea `/demo` lo referencia** —
  se carga en diferido, sólo ahí.
- La superficie a reescribir son **89 elementos `motion.*`** repartidos
  en ocho ficheros, más **6 `AnimatePresence`**, 4 `useReducedMotion` y
  4 `MotionConfig`.

No compensa, y el motivo no es la pereza: las migraciones anteriores
quitaron `framer-motion` de sitios donde no estaba justificado —una
página de marketing arrastrando la biblioteca entera para cuatro
checks—. Aquí sí lo está. La demo es una aplicación con transiciones de
montaje y desmontaje, que es exactamente para lo que existe la
biblioteca, y los `AnimatePresence` son la parte más cara de replicar a
mano. Cambiarlo son 89 puntos de reescritura en los cinco ficheros más
grandes del repositorio (47-72 KB cada uno), sin una sola mejora visible
para el visitante y con riesgo real de estropear la demo, que es la
pieza comercial principal. El coste que evitaría ya está confinado a una
ruta de 155 y llega en diferido.

Si algún día se retoma, el orden sensato es al revés del tamaño:
primero `DemoShortcutsHint` y `DemoCommandPalette` (4 y 6 usos), que son
autónomos, y sólo después las cinco páginas.

### Lo que NO se tocó, y por qué

**El filtro del glosario.** El encargo lo proponía como candidato a
transición de estado, y es justo donde no debe ir una: la lista se
recalcula en CADA pulsación de tecla, así que animarla la volvería
perezosa y ruidosa. Un buscador tiene que responder, no coreografiar.

**Las duraciones.** Hay quince valores distintos entre 100 y 600 ms, y
la tentación era imponer una escala de cuatro o cinco pasos como hacen
Linear o Stripe. No se hace: cada uno de esos valores tiene al lado un
comentario que explica por qué es ése (los 120 ms del hundido al tocar,
porque «por encima de 200 el gesto deja de percibirse como respuesta»),
y ya forman casi una rejilla de 20 ms. Reafinarlos en bloque sería
mover quince cosas que funcionan sin una sola medida que diga que están
mal.

**La marca verde de Core frente a la azul de Pro** en la tabla de
precios. Parece una incoherencia —las dos dicen «incluido» y se pintan
distinto— pero es deliberada: la tarjeta Pro lleva el acento en todo
(su píldora, su filete superior, sus fichas), y es su señal de nivel.

La tipografía. El encargo la daba por pendiente, y no lo estaba: `html`
ya lleva `font-optical-sizing: auto`, `font-kerning`, ligaduras
explícitas y `hanging-punctuation`; los titulares llevan `text-wrap:
balance` y los párrafos `pretty`; hay `hyphens` con
`hyphenate-limit-chars` por debajo de 640 px, medida acotada con
`.medida` (68ch) y `tabular-nums` en `th`, `td`, `time`, `output` y
`[data-cifra]`. No había nada que subir ahí.

## Herramientas de auditoría propias

Antes de dar por terminado un cambio visible, correr lo que aplique:

```bash
npm run build                       # compila a /out
node scripts/humo.mjs --serve out   # contraste, láminas, velo, entradas, menú…
node scripts/legible.mjs --serve out  # contraste de TODO el texto sobre fondo plano (28 rutas)
node scripts/fondos.mjs --serve out   # que cada sección dibuje un fondo distinto
node scripts/arranque.mjs --serve out --cpu 4  # tiempo hasta titular legible, CPU x4
node scripts/deep_audit.mjs             # códigos 200, lang, canonical, hreflang
node scripts/tinta.mjs --serve out      # texto sobre fondo lleno de P&L, en los dos temas
node scripts/corrobora-menus.mjs        # navegación y menús, escritorio + móvil
npx vitest run                          # 24 suites, ~284 tests
npx tsc --noEmit && npx eslint .
```

Cada script explica en su propia cabecera qué mide y por qué existe — son la
fuente de verdad, no este documento.

## Contratos de interfaz (siguen vigentes)

### `src/lib/theme.tsx`
- `getTheme()` / `setTheme()` / `getPalette()` / `setPalette()`: nunca lanzan,
  incluso si `localStorage` da `SecurityError` (navegación privada).

### `src/components/tj/OverlayHost.tsx`
- `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g"` → glosario.
- **No hay paleta de comandos en la web.** Se retiró (ver «Lo que hubo que
  retocar en las puertas»), y este contrato siguió anunciando un Ctrl+K que
  no existe: `src/components/tj/CommandPalette.tsx` no está en el árbol y
  nadie importa `src/components/ui/command.tsx` ni, por tanto, `cmdk`. La
  que sí existe es la de la demo (`DemoCommandPalette`), y el panel de
  atajos —lo que ve el visitante— ya no la ofrecía.

### `src/components/marketing/EquityProjector.tsx`
- `cagr`: `startBalance > 0 && finalBalance > 0 && years > 0` →
  `(finalBalance / startBalance) ** (1 / years) - 1`; si no, `-1` o `0`
  deterministas, nunca `NaN`.

### `src/lib/trading/data.ts`
- Todas las métricas (`computeMetrics`, `calcKelly`, `calcSharpe`, `calcSortino`,
  `calcCalmar`, `calcExpectancy`, `runsTest`…) dan números finitos y deterministas
  en los casos límite: n=0, n=1, 100% aciertos, 100% pérdidas, desviación 0.

## Mapa de código

- `src/app/`: rutas del App Router (ES en raíz, EN bajo `/en/`).
- `src/components/ui/`: primitivas (button, input, badge, dialog — base Radix).
- `src/components/tj/`: layout, navegación, overlays, consentimiento y
  capturas de producto real (`ProductPlate.tsx`).
- `src/components/marketing/`: calculadoras, secciones de producto, vitrinas
  (`ProductShowcase.tsx`, `GaleriaPantallas.tsx`), FAQ, héroes.
- `src/components/demo/`: motor de la demo (dashboard, operaciones, calendario,
  analítica, diario, detalle de operación).
- `src/components/glosario/`: índice y ficha de término bilingüe.
- `src/lib/`: `i18n.tsx`, `theme.tsx`, `consent.ts`, `glosario.ts`,
  `herramientas.ts`, `faq.ts`, `laminas.ts` (registro de capturas reales).
- `src/lib/trading/`: motor cuantitativo, métricas, modelos de datos del glosario.
- `scripts/`: herramientas de auditoría manual (ver arriba) + generación de
  marca (`generate-brand.py`) y recorte de capturas (`capturas.py`).
- `tests/`: suites Vitest; `tests/e2e/`: suites por dimensión de calidad.
