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
  glosario (cinco familias), 10 herramientas + 1 test de disciplina, 13 FAQs, 4 legales.
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
- **Portada**: Hero centrado con la captura a caballo sobre banda `--surface`
  (`.tj-hero::before`) y fila de plataformas cuyo CSV entra → cifras →
  recorridos → pantallas (`.tj-pestanas`) → métricas → guardián → principios →
  cierre (`.tj-cierre`). Bandas grises con `.tj-banda`. CTA: `.cta`.
- **Sistema de piezas**: etiquetas y cajas de icono con `--chip`/`--chip-line`
  (nunca tintes del acento, que ahora es tinta y ensucia a gris); rótulos en
  mayúsculas a 0,08 em; campos blancos con filete `--line-2`.
- **Una idea por pantalla**: las secciones que viven bajo un `PageHeader`
  reciben `enPagina` y no repiten titular; cada página cierra con una sola
  llamada (`FinalCTANew enDemo` en /demo; cierre propio en los perfiles).
- **Afirmaciones técnicas**: la ficha de almacenamiento de /features/seguridad
  sólo dice lo comprobado en el código del programa (SQLite, `%LOCALAPPDATA%`,
  copias AES-256-GCM con PBKDF2 600.000, DPAPI para credenciales).
- **Pendiente de decidir por el dueño**: las
  capturas sólo existen en español (también las de septiembre de 2026); «0 bytes enviados a la nube», «sin
  servidores» y «cifrado en reposo» chocan con lo que hace el programa
  (datos de mercado, licencias y sincronización opcional; no se encontró
  cifrado de la base viva).

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

### Decimosexta tanda: la web entera con ojos nuevos (2026-09-22)

Catorce rutas y sus gemelas inglesas, a 390, 820 y 1440 px, en claro y en
oscuro: 168 capturas de página entera, miradas una a una. Ninguna página
desborda de lado en ningún ancho. Lo que salió:

- **Una promesa que no existía.** La portada decía que los dos recorridos
  «adaptan la demostración a las decisiones que realmente tomas». Ninguno
  toca la demo: son páginas propias. Ahora dice lo que hay al otro lado.
- **El cierre de `/pricing` ofrecía «Ver precios»**, que recargaba la misma
  página. Ahora la segunda acción es pedir el acceso. `enlaces.mjs` vigila
  desde hoy que ningún `.cta` lleve a la página en la que está (vista en
  rojo sobre la compilación anterior: `/pricing/` y `/en/pricing/`).
- **El glosario se cerraba con el texto de las calculadoras** («La cuenta
  ya te sale. Esto mismo, pero sobre tu historial…») cuando allí no se ha
  hecho ninguna cuenta. Tiene su propia variante.
- **Móvil y tableta: la ficha del Guardián llegaba antes que su titular** y
  se leía como parte de la sección anterior. La columna de texto va primero
  en el documento —también para quien usa lector de pantalla— y en
  escritorio la ficha vuelve a la izquierda con `lg:order-first`.
- **El pie**: en tableta, cinco columnas de ~100 px partían «Operativa
  manual» o «Test de disciplina» en dos renglones; ahora la marca sube a su
  fila y los enlaces van a cuatro columnas. Y el punto separador colgaba al
  final de renglón en móvil y tableta (el mismo defecto que la
  decimocuarta tanda quitó de la tira de confianza): sólo se pinta desde
  `lg`, donde la fila cabe entera.
- **Titulares de cabecera**: una palabra de una o dos letras ya no cierra
  renglón («La app, en / tu navegador.» → «La app, / en tu navegador.»).
- **La fila de plataformas CSV** dejaba «Bybit» sola en un segundo renglón
  a 820 px; va en fila sólo desde `lg`.
- **Inglés**: calcos en la portada («What each trade leaves», «the worst
  fall», «opens in two», «brakes you», «NY break», «before opening sales»,
  «Measuring is not the same as noting»), y una mezcla de variantes: el
  sitio escribe «licence», «judgement» y «travelled», y el pie y los
  legales fechan a la británica, pero había «behavior», «License»,
  «Analyze» y el gráfico de la portada fechaba a la americana («Feb 15»).
  Las fechas del formateador de la casa pasan a en-GB (`LOCALE_FECHA`); las
  cifras siguen en en-US porque en-GB escribe «US$».

#### La trampa de medida de esta tanda

Las capturas de página entera pintan MAL lo que tiene `content-visibility:
auto` fuera de pantalla: en `/pricing` móvil la tabla comparativa salía en
blanco (un «hueco» de 1.100 px) y en `/about` medio titular salía a ~0,64 de
su tamaño con el MISMO estilo calculado. Tres de tres con `.cv-auto`, cero
de tres sin él, y al desplazarse hasta la sección el navegador lo pinta
bien: no es un defecto del sitio. Para mirar capturas de página entera hay
que inyectar `.cv-auto{content-visibility:visible!important}` antes.

#### Rendimiento y fluidez, medidos en producción

Móvil emulado (Pixel 7), CPU ×4, red «Fast 4G» de DevTools (9 Mbps, 165 ms),
carga en frío, tres pasadas por ruta y una carga de calentamiento que no
cuenta — sin ella la primera ruta pagaba DNS y TLS y salía a 3,7 s. Rangos:
FCP 0,74–1,23 s (portada 1,00–1,01), LCP 0,92–2,40 s, CLS 0 en todas, JS
214–243 kB (la demo 310), p95 de fotograma 16,8 ms en casi todo el español.

Repetido al día siguiente sobre lo ya publicado, con el mismo método, salió
más rápido en TODAS las rutas —también en las que esta tanda no tocó
(`/traders/manual`: bloqueo 111–119 → 34–42 ms)—. Es la máquina, no el
código: los cambios son de texto y maquetación, y la diferencia entre días
se traga cualquier efecto suyo. El único cambio atribuible es +1 kB de JS
por los textos del cierre. Para comparar rendimiento, medir antes y después
en la misma sesión, alternando.

**El inglés daba más fotogramas lentos que su gemela española** —portada
9–11 frente a 0–3, glosario 11–12 frente a 3–7—, con el orden de medida
invertido y sin nada más corriendo. No eran `hyphens` ni
`content-visibility`. La traza lo señaló: `html[lang="en"]:has([data-tj-404="es"]) body`,
una regla que sólo servía a la 404 pero vivía en la hoja de todas las
páginas. En las inglesas casaba su primera mitad, y con un `:has()` en la
raíz seguido de un descendiente Chrome daba por sucio el estilo del
documento entero a cada nodo insertado —cada trozo de JavaScript que
llega al desplazarse—: 12 invalidaciones de todo el árbol por recorrido,
1.028 elementos cada una. La regla pasó a una hoja que pinta la propia
404 (`NotFoundClient.tsx`) y se va al pasar a inglés; el comportamiento
de la 404 es el mismo.

Medido sobre lo publicado quitando la regla en pasadas alternas, misma
sesión: portada inglesa 2–7 fotogramas lentos con ella y 0 en las tres
pasadas sin ella; glosario inglés 4–43 (mediana 9) con ella y 0–11
(mediana 1,5) sin ella, ocho pasadas por lado —los rangos se tocan por
una pasada de cada lado—. El español no cambia (0–2).

Ya publicado, tres pasadas: portada 0–4 en inglés frente a 0–2 en español;
glosario 1–13 frente a 1–3, con una sola pasada inglesa alta. La traza del
glosario sale igual en los dos idiomas (recálculo de estilo 3,4–3,8 s
frente a 3,4 s bajo traza), así que lo que queda es ruido, no idioma. Sí
queda a la vista que el glosario, en los dos, recalcula mucho más estilo
al desplazarse que la portada (~3,4 s frente a ~0,65 s bajo traza), con
57 filas de la lista invalidadas por `tj-cifra-cuenta`; en fotogramas no
se nota (0–3 lentos en español). Sin tocar.

Lo vigilan `tests/css.test.ts` (ningún `:has()` de `html`/`:root` baja a
descendientes; visto en rojo con la hoja antigua) y `humo.mjs`, que ahora
comprueba también que bajo `/en/` sin JavaScript la 404 no enseña el
español y aparece sola (visto en rojo quitando el velo y dejándolo sin
salida).

#### Lo que se miró y no se tocó

- La calculadora de riesgo deja a 1440 px unos 440 px vacíos bajo sus
  entradas, junto al panel de resultados, que es más alto. Es la
  composición natural de un formulario de dos columnas desiguales; llenar
  ese hueco con algo sería relleno.
- La captura clara del programa dentro del tema oscuro es deliberada (la
  oscura pierde el contraste al reducirse; está explicado en
  `ProductPlate.tsx`). **Revertido en la tanda 27**: medido, la oscura
  nunca tuvo menos contraste; cada tema enseña ya su captura.

### Decimoséptima tanda: las páginas que nadie había mirado (2026-09-23)

La tanda anterior capturó 14 rutas y sus gemelas. Quedaban fuera siete
herramientas, el test, los cuatro legales y las 57 fichas del glosario.
Mirándolas a 1440 y 390, en claro y oscuro:

- **Campos de cifra en el idioma de la página.** `type="number"` pinta y
  lee el decimal según el idioma del NAVEGADOR: la web española enseñaba
  «$ 1.24» junto a «43.200 $», y en la demo `parseFloat("1,08")` daba 1
  sin avisar. Ahora `CampoCifra` (calculadoras) y `leeCifra` /
  `cifraEditable` (formulario de la demo, en `lib/trading/format.ts`):
  coma en español, punto en inglés, se aceptan las dos al escribir y no
  se enseñan millares, para que un único separador sea siempre el
  decimal. Lo vigila `tests/contratos.test.ts` (ningún `type="number"`;
  visto en rojo con el formulario antiguo) y `tests/campo-cifra.test.ts`.
- **Gráfico del proyector de capital.** Se dibujaba en un lienzo fijo de
  900 escalado a la caja: en móvil las cifras de los ejes medían 3–4 px.
  Ahora se dibuja al ancho real, con marcas redondas (`lib/marcasEje.ts`:
  1 · 2 · 2,5 · 5 por potencia de diez, antes «801 k · 1,8 M · 2,88 M ·
  3,93 M») y sin el resplandor de color en la curva, que las normas
  prohíben.
- **Lo que el Monte Carlo prometía.** «Mil versiones de tu año» y
  «miles de reordenaciones» para un simulador que juega 300 caminos, y
  que no reordena operaciones sino que las genera. El número vive en
  `CAMINOS_MONTE_CARLO` y una prueba exige que el titular lo diga.
- **Colores que contradecían su cifra.** El P5 del Monte Carlo iba en rojo
  aunque ganara un 50 %; ahora el rojo es «por debajo del capital
  inicial».
- **Textos.** Mayúsculas a la inglesa («Riesgo de Sobreajuste», «Swing
  Trader Discrecional»), «futures» sin traducir, «GAP» por «brecha»,
  «dejarías de perder unos +982,08 $» (signo y céntimos en una
  estimación), un «72 %» suelto que no decía de qué, «0 / 100» en el test
  antes de contestar nada, y la primera frase de Términos repetida con el
  subtítulo.
- **Fichas del glosario.** El enlace a la calculadora decía «Hay una
  herramienta para esto» sin decir cuál; ahora la nombra, y el de los
  términos de conducta lleva al test. Una prueba exige que cada destino
  exista: la primera versión de este cambio habría borrado en silencio
  el enlace de cuatro términos, y fue esa prueba la que lo cazó.

### Decimoctava tanda: una herramienta nueva y lo que se copia (2026-09-23)

Escrita con el equipo ocupado (sólo tipos, lint y pruebas a prioridad
mínima) y comprobada después entera: compilación, batería completa en
verde y capturas a 1440, 820 y 390 en los dos temas.

- **Novena herramienta: recuperación de drawdown.** Lo que hay que ganar
  para volver al máximo (20 % pide 25 %, 50 % pide 100 %) y cuántas
  operaciones tarda el camino típico con tu riesgo, acierto y payoff. El
  ritmo es el crecimiento logarítmico esperado —la mediana, no la media—,
  así que con esperanza cero ya no vuelve, y con esperanza positiva pero
  riesgo excesivo tampoco: la herramienta lo dice en vez de dar un número.
  Cálculo en `lib/trading/recuperacion.ts` (nunca NaN ni Infinity; prueba
  vista en rojo cambiando el redondeo). El término `drawdown` del glosario
  lleva ahora aquí; `max-drawdown` sigue en el Monte Carlo.
- **La cifra de herramientas sale del dato.** «Ocho calculadoras» estaba
  escrito a mano en cinco textos de `/herramientas`; ahora lo da
  `herramientasEnLetra()`. Una prueba recorre todo `src/` buscando cifras
  a mano junto a «herramientas / calculadoras / tools»: la primera versión
  no cazaba «Eight free tools» (una palabra en medio) y se amplió tras
  verla pasar en verde con el fallo puesto.
- **La columna «Resultado» del índice** vivía en un mapa aparte por slug:
  una herramienta nueva sin entrada salía con la celda vacía. Ahora es un
  campo obligatorio de cada herramienta y lo exige el compilador.
- **Enlaces a un dominio que no existe.** Los resúmenes que copian el
  proyector y el test llevaban `countpips.com`, sin comprar. Ahora salen de
  `siteUrl()` y en el idioma de la página; una prueba impide el dominio
  fuera de `site.ts` (vista en rojo con los dos ficheros).
- **Comisiones con pérdida.** Con costes por encima de la ganancia, el
  resultado anual salía «+−1.234 $» en verde, y el acierto necesario
  pasaba del 100 %. Ahora va con su signo y en rojo, y «Inalcanzable».
- **Acabado.** Mayúsculas a la inglesa en tablas y resúmenes copiados
  («Start Bal», «PnL Anual», «Time to Double»), «⚠» y «✓» como adorno de
  texto, «Edge fuerte» por «Ventaja sólida», y la campana de Gauss, que
  al estirarse dibujaba el punto ovalado y cambiaba el grosor del trazo.
- **Márgenes que se perdían.** `.tj-matriz` fijaba `margin: 0` fuera de
  capa y ganaba a las utilidades: tres matrices (significancia y Monte
  Carlo) pedían `mb-4`/`mb-5` y quedaban pegadas a lo siguiente. La regla
  pasa a `@layer components`.
- **Entradillas de sección a 88 caracteres.** `SectionHeader` las medía
  con `max-w-[58ch]`, que en esta letra son ~88 caracteres por línea; ahora
  lleva `medida`, como el resto. Lo cazó `medida.mjs` en `/traders/manual`.
- **La herramienta nueva en móvil** ponía el resultado debajo de la
  tabla, lejos de los controles; ahora va entre ambos, también en el orden
  del documento (teclado y lector de pantalla).
- **De la tanda sin publicar anterior:** el proyector arranca en el
  perfil de cuenta fondeada a tres años; el pie falso de la vela de la
  demo enseña comisiones y cumplimiento del plan; el reloj de sesiones va
  en 2 × 2 hasta escritorio; y una ronda de redacción (FAQ «¿Ya se puede
  comprar?», «bróker», «Drawdown máximo», sin «la única app»).

### Decimonovena tanda: la prueba de fondeo y un Monte Carlo legible (2026-09-23)

- **Décima herramienta: simulador de prueba de fondeo.** Qué parte de
  2.000 intentos toca el objetivo antes que el drawdown, estático o
  dinámico (sigue al máximo del saldo hasta el inicial), con el riesgo
  como fracción fija del saldo inicial. No modela la pérdida diaria ni las
  reglas de consistencia, y lo dice. Cálculo en `lib/trading/fondeo.ts`,
  contrastado con la fórmula exacta de la ruina del jugador (vista en rojo
  moviendo el suelo). Arranca con una ventaja pequeña (+0,04 R): con la
  primera elección (+0,35 R) aprobaba el 96 % y parecía prometerlo.
- **Escenario en la dirección.** `?objetivo=6&dd=4&tipo=dinamico&riesgo=0.75`
  abre el simulador con esas reglas (acotadas y ajustadas al paso de cada
  control, `leerEscenario`). La página de prop firms enlaza así con la
  plantilla de la firma elegida. Se lee con `useSyncExternalStore`, vacía
  en el servidor, para no romper la hidratación del HTML estático.
- **El abanico del Monte Carlo** era un lienzo fijo escalado, con el eje en
  0 —la curva ocupaba la mitad de arriba— y sin una sola cifra. Ahora va al
  ancho real, con eje en cifras redondas, rejilla y operaciones abajo.
- **Un solo generador aleatorio** (`lib/trading/azar.ts`): la demo y el
  Monte Carlo llevaban cada uno su copia de mulberry32. La secuencia es la
  misma; lo confirman las pruebas de los datos de la demo.
- **Textos.** «No es un SaaS de Silicon Valley» en los principios de la
  portada; «Drawdown trailing» y «un edge» en las páginas de perfil.

### Vigésima tanda: la muestra de /features, fiel a un calendario (2026-09-23)

- **El calendario de /features** ponía el 1 de julio de 2026 en sábado y
  acababa el mes en el 30: el desfase iba escrito a mano. Ahora sale de
  `Date.UTC` (`fixtures.ts`), con prueba en `calendario-muestra.test.ts`.
- **La muestra operaba con el mercado cerrado.** `buildTrades` repartía los
  cierres por los 180 días sin mirar el día: 58 de 200 caían en fin de
  semana, casi todos índices, oro o divisas. Ahora el sábado pasa al viernes
  y el domingo al lunes salvo en cripto, sin gastar sorteo: el resultado de
  cada operación no cambia (la prueba fija el total, 6.807,72 $). Sí cambian
  las cifras que dependen del orden o del día —rachas, caída máxima, reparto
  por día de la semana—, todas calculadas, ninguna escrita a mano.
- **El gráfico por horas contradecía su texto:** resaltaba las 9:00 y la
  barra más alta era las 14:00, una «ventana a evitar». Ahora son barras
  divergentes de R media por hora (`HORAS_R`), de donde salen también las
  cifras de las ventanas, con la mejor ventana resaltada y una línea de pie.
- **FAQ.** «¿Ya se puede comprar?» empieza por «Todavía no». La pregunta de
  privacidad repetía la de seguridad; ahora es «¿Qué datos pide esta web?»,
  con lo que piden de verdad los dos formularios y la analítica sujeta a
  consentimiento.
- **Fichas que despegaban su texto.** En el índice de /features, cuando la
  ficha vecina ocupaba más líneas, la descripción bajaba 11 px respecto a
  su título: la ficha es una rejilla y repartía el alto sobrante entre sus
  filas. Arreglado con `content-start`, y una guarda nueva,
  `scripts/rejillas.mjs`, recorre todas las páginas compiladas buscando lo
  mismo. Vista en rojo sobre la compilación sin el arreglo.
- **La ficha de playbooks era una maqueta** con +1,8R y +2,1R por
  operación, cifras que ningún trader se cree. Ahora sale de la muestra
  (`getSetups` en `fixtures.ts`): los cinco setups de mejor a peor, de
  +0,37R a −0,09R, con la Ruptura apenas positiva, como cuenta /about.
- **La ficha de multicuenta no cuadraba:** «Apex 150k» con 154.820 $ decía
  +1.420 $, y la Topstep «aprobada» solo llevaba +1.240 $, por debajo del
  +6 % que la propia web da como objetivo. Ahora el resultado se calcula
  del saldo y el capital inicial. Su rótulo, «Multi-cuenta, multi-activo»,
  partía la barra en dos líneas a 1024 y en inglés; queda «Multi-cuenta».
- **«solo» sin tilde en todo el texto visible** (dominaba 34 a 19, y la
  FAQ mezclaba las dos formas). `vocabulario.test.ts` lo vigila, visto en
  rojo sobre la compilación anterior.

### Vigesimoprimera tanda: barrido de detalles, texto y plantillas (2026-09-23)

- **Barrido del texto visible de las 173 páginas** (comillas, raya,
  puntos suspensivos, palabras repetidas, restos del otro idioma):
  - las 57 fichas del glosario en inglés decían `What "X" means`, con
    comillas rectas; ahora “X”;
  - «por trade» y «trades/año» en definiciones españolas pasan a «por
    operación» y «operaciones/año», y «Ratio trades/parámetro» a
    «Operaciones por parámetro»;
  - la proporción R:R iba unas veces «3,00 : 1» y otras «12,0:1»; ahora
    siempre sin espacios.
  «Nota post-trade» se queda: es la etiqueta de la app.
- **La FAQ decía que el formulario de acceso pedía cinco cosas y pide
  siete** (faltaban «qué quieres mejorar primero» y la nota opcional; la
  política de privacidad sí las nombraba). `formulario-declarado.test.ts`
  cuenta los campos del HTML compilado y los compara con la FAQ y la
  política en los dos idiomas; visto en rojo con el texto antiguo.
- **Migas de tres niveles** en glosario, herramientas y las tres
  subpáginas de características: «Inicio / Glosario / Drawdown», con el
  nivel intermedio enlazado (`padre` en `PageHeader`). Antes era un solo
  paso sin enlace, «Glosario · Drawdown», aunque los datos estructurados
  ya declaraban los tres.
- **La mancha de fondo de la demo** (`Escritorio`) iba centrada en la
  sección y caía detrás del titular de la izquierda, no del panel de la
  derecha. Ahora cuelga del panel (`tj-escritorio--tras`).
- **Prop firms:** el límite diario salía en rojo y el drawdown máximo en
  negro, siendo los dos umbrales de pérdida; ahora los dos en rojo. El
  0,75 % de riesgo estaba escrito en cuatro sitios; queda en `RIESGO_PCT`.
- **Textos:** «esto es la curva» → «esta es la curva»; «tu esperanza» →
  «tu esperanza matemática» en la lista de herramientas.
- **Comentarios que mentían:** el sello «Previsto» se describía con un
  marco a trazos que se le quitó en 09544c0; corregidos en el CSS y en
  `SelloPrevisto.tsx`.
- **«Solo lo que ves» no era verdad del todo:** el formulario de acceso
  envía además el idioma, la página y, si el enlace la trae, la campaña
  (UTM), como ya decía la política de privacidad. La FAQ lo cuenta ahora.
  El de contacto sí envía solo lo visible (`forms.ts`).
- **Las capturas de la app están en su interfaz española** (no hay otras
  en `public/img`); las dos galerías en inglés lo dicen y aclaran que la
  app también funciona en inglés (`Strings/en-GB` en el repositorio de
  la app).

### Vigesimosegunda tanda: coherencia de cifras y textos, en paralelo (2026-09-24)

Nueve trabajadores (Sonnet, cada uno en su copia del repositorio y con la
misma lista cerrada de reglas) repasaron calculadoras, demo, portada,
características, precios, glosario y legales; el coordinador revisó cada
diff, fusionó en local y corrigió encima lo que no pasaba la revisión.

- **Millares siempre.** `Intl` en español no agrupa las cifras de cuatro
  dígitos: salían «1234,56 $» en la calculadora de riesgo, «2350,00» junto
  a «18.200,0» en la tabla de la demo y «1000 $» en el proyector. `fmtInt`
  y `fmtPrice` agrupan ya como `fmtNum`/`fmtMoney`, y las calculadoras que
  llevaban su propio `Intl.NumberFormat` usan los de `format.ts`.
  `formatoUsd` desaparece (su propio comentario prometía «1.234 $» y
  daba «1234 $»). Guarda: `formato-millares.test.ts`.
- **La política de cookies declaraba una clave que ya no existe**
  («si ya viste la animación de entrada», `sessionStorage` `tj_intro`,
  retirada en 91c72b9). Fila quitada, fecha legal al 2026-09-24.
  `almacenamiento-declarado.test.ts` cuenta las claves que el código
  escribe en el navegador y las filas de la tabla; visto en rojo con la
  fila antigua.
- **Cifras inventadas que ahora salen de los datos:**
  - «Cumplimiento mensual» del diario: cinco fracciones escritas a mano y,
    bajo «Jul», el cumplimiento de los 180 días. Ahora
    `cumplimientoMensual()` por mes natural UTC.
  - Ficha «Rendimiento por hora» de /features: decía «10:00 – 11:30» y
    «+27 % sobre media» con la ventana resaltada en 10:00–12:00 y una
    media de +0,55R. Rótulo y cifra salen de `HORAS_R`/`MEJOR_VENTANA`.
  - La fila «Suma» de la tabla de operaciones enseñaba la media.
- **El cierre del glosario cita las 200 operaciones sin cargarlas.** Un
  trabajador lo resolvió importando `TRADES` en `FinalCTANew` (componente
  de cliente de decenas de páginas): comprobado compilando que así glosario,
  FAQ y precios descargaban el generador. Queda `OPERACIONES_MUESTRA`
  (`lib/trading/muestra.ts`), la misma que usa el bucle de `data.ts`.
- **Demo:** la ayuda de atajos prometía «1–7» y hay cuatro pestañas; la
  ficha de operación deja el inglés en sesión, lado y cantidad; R, MAE y
  MFE con `fmtR` (menos tipográfico); `NOMBRE_SESION` en `data.ts` en vez
  de dos copias; `10_000` → `INITIAL_BALANCE_CONST`.
- **Calculadoras:** tasa del 8 %, umbral de comisiones, confianza del 99 %
  y banda del 80 % como constantes de las que se deriva el texto; precios
  de la calculadora de ahorro desde `lib/precios`; el reloj escribe
  «UTC+5:30», no «UTC+5.5».
- **Glosario:** la familia «basics» se llamaba «Conceptos» en la ventana y
  «Fundamentos» en las fichas; ahora «Fundamentos».

Informado y no tocado: la tarjeta «Dónde cayó dentro del día» de la ficha
de operación usa marcadores fijos (documentados en el código); la cita de
competidores «según sus webs en julio de 2026» no se puede comprobar desde
el repositorio; `i18n.tsx` interpola cifras crudas en `tradesCount` y
escribe «10.000 $» a mano en `demoAccount` (resuelto en la tanda 23).

### Vigesimotercera tanda: lo que quedó fuera del reparto (2026-09-24)

- **«Dónde cayó dentro del día»** en la ficha de operación era igual para
  las 200: tercera del día, ocho minutos después de otra, −84,60 $ previos
  y aviso de revancha siempre. Ahora `contextoDelDia()` lo calcula del día
  de la operación; la revancha exige mismo instrumento, pérdida previa y
  menos de `ENFRIAMIENTO_MIN` (30 min), y el aviso lo dice.
- **Mapa de calor y minicalendario de la demo:** las celdas de más de mil
  salían «1.2k» también en español (`toFixed`). `fmtCifraCorta` en
  `format.ts`, una para los dos.
- **Diccionario de la demo (`i18n.tsx`):** «DEMO · 10.000 $» sale de
  `SALDO_INICIAL_MUESTRA` (en `muestra.ts`, la misma que usa `data.ts`) y
  los recuentos pasan por `fmtInt`.
- **Revisado a ojo a 820 px** portada, características, precios, demo,
  las diez herramientas, índice del glosario, los cuatro legales y precios
  en inglés: sin desbordes; los «huecos» que marca la captura son el
  respiro entre la tarjeta de la herramienta y el aviso de debajo, igual en
  todas.
- Se dejan los 269 «sólo» con tilde de los comentarios: no se leen en la
  web y tocarlos movería 95 ficheros (hecho en la tanda 24).

### Vigesimocuarta tanda: cerrar todo lo pendiente (2026-09-24)

- **Analítica de la demo tiene pestañas de verdad.** La barra de secciones
  se marcaba y no cambiaba nada (la app sí cambia de sección). Ahora cada
  pestaña enseña sus bloques, con flechas/Inicio/Fin y panel accesible;
  el número tras cada nombre se cuenta de la propia lista. «Comportamiento»
  sale: la demo no tiene esos bloques y la pestaña habría estado vacía.
  Al montarse ya en pantalla, las barras que se revelaban «al entrar en
  vista» (y nacían con ancho cero) se quedaban sin pintar: animan al
  montarse. Comprobado a 1440 claro y 390 oscuro, las cinco pestañas.
- **Ficha de operación:** «Contexto» (temporalidad, mercado, ánimo) era
  «5m · Tendencia · 3/5» para todas; ahora `contextoDeMercado()` lo deduce
  de duración y setup, y el ánimo inventado pasa a «Puntuación del día»,
  que la muestra sí trae. Las horas de las ejecuciones salían en la hora
  de quien mira; van en UTC como el resto de la ficha.
- **Una sola fuente:** tasa del 8 % (`lib/supuestos.ts`), arranque medido
  «0,7 s con 50.000» (`lib/producto.ts`), horarios del reloj desde
  `PLAZAS`, notas de los perfiles del simulador desde sus campos,
  etiquetas de capital del proyector, riesgo por defecto del registro
  rápido, `LOCALE_FECHA` en pie, banda de cifras, precios, legales y
  resumen; la ayuda de atajos cita `PESTANAS_NUMERADAS`. Fuera el texto
  muerto «⌨ 1–6» del diccionario.
- **Comparativa:** comprobado hoy en las webs de TradeZella, TraderSync,
  TradesViz y Tradervue: suscripción mensual o anual (dos con plan
  gratuito limitado, ahora dicho), cuenta obligatoria, ninguna web en
  español (la celda decía «parcial»; ahora «no»); fecha de la nota a
  septiembre de 2026.
- «sólo» → «solo» en 260 comentarios de 93 ficheros (script contado);
  se dejan los de `vocabulario.test.ts` y `cifras.mjs`, que lo usan como
  dato de sus guardas.
- Borradas las nueve copias de trabajo de la tanda 22 y sus ramas, ya
  fusionadas; antes se quitó cada enlace a `node_modules` y se comprobó
  que el original seguía entero (343 entradas).

### Vigesimoquinta tanda: el movimiento, rehecho (2026-09-24)

El juicio fue «animaciones básicas, sin efecto». Visto con tiras de
fotogramas a ×0,1 (Animation.setPlaybackRate): todo entraba igual —un
bloque que sube 56 px y se funde—, el titular no tenía gesto propio y el
gráfico de la portada se dibujaba a la carga, bajo el pliegue, sin que
nadie lo viera. Lenguaje nuevo, «precisión»: se enfoca, se dibuja, se
asienta; nada rebota ni brilla.

- **Titulares h1** (`Palabras.tsx`, portada y `PageHeader`): palabra a
  palabra desde su máscara. La puntuación va en la máscara de su palabra
  y el realce puede cortar a mitad de palabra (`tests/palabras.test.ts`,
  visto en rojo con dos mutaciones). Recorrido 140 %: con 112 % asomaban
  los puntos de las íes por el margen de los descendentes.
- **Escalonado entre hermanas.** `Aparecer` contaba el paso sobre TODO el
  lote del observador: la cabecera de `#producto` heredaba el paso 4 de
  piezas de otra sección — 280 ms de espera muerta, medidos. Ahora cada
  grupo de hermanas empieza en cero.
- **Entradas:** 24 px + escala .985 (antes 56 px); h2 que se enfocan
  desde `blur(10px)`; capturas que se abren como una ventana
  (`clip-path`), con prioridad sobre el cristal —el único que llevan es
  la lupa, oculta en reposo—. El bloque bajo cada cabecera espera al
  titular (salvo si lleva cristal: ahí solo se desplaza, porque una
  opacidad en un ancestro le quita lo que ve detrás).
- **Gráficos que se dibujan al verse:** `data-dibuja` pone en pausa las
  animaciones de dentro hasta que el contenedor asoma. Calendario en
  diagonal, barras por hora, playbooks que se llenan, curva y barras de
  la portada, y el guardián evalúa regla a regla antes del veredicto.
- **Panel de la portada** llega tumbado (rotateX 16°) y se endereza.
- **Subrayado que viaja** en la barra (`.tj-nav-foco`) y en las pestañas
  (`SubrayadoPestanas.tsx`); el cambio de captura se enfoca (0,55 s,
  blur) en vez de fundirse en 220 ms; la llamada principal se levanta.
- **Auditoría `tema`:** mandaba todos los fotogramas grabados a la vez a
  la pestaña lectora; con las entradas nuevas pasan del centenar y la
  pestaña se quedaba sin memoria. Lee por tandas de 25; la medida no
  cambia (0 de 180 fotogramas claros en portada, control 321).

### Vigesimosexta tanda: la demo y el móvil en oscuro (2026-09-24)

- **La demo parpadeaba en blanco al cambiar de pestaña.** Medido fotograma
  a fotograma: al terminar cada entrada, `AnimatePresence` dejaba el panel
  a opacidad 0 durante un fotograma (10 de 10 cambios, a los ≈640 ms). El
  cambio de página pasa a CSS (`.tj-demo-entra`, y `.tj-demo-fondo` para
  abrir una operación, «drill-in»), con la curva de deceleración de WinUI.
  Sin salida animada tampoco hay espera: la página nueva está entera en
  318–345 ms (diez cambios), antes 450 ms más la salida. 10 de 10 sin caída.
- **La barrita de la pestaña activa viaja** (`layoutId`), como en el
  NavigationView de la app: llega centrada al píxel (900/900 a 1440,
  181/181 a 390).
- **El comparador era un `div` con `aria-modal`** que no cerraba con
  Escape ni retenía el foco. Ahora es un `<dialog>` nativo con
  `showModal()`, como el visor de capturas: comprobado abierto, modal,
  con el foco dentro, y cerrado tras Escape. Entra con velo y hoja.
- **Móvil en oscuro, todas las plantillas revisadas.** Arreglado: el
  buscador de la 404 cortaba su texto de ayuda («Una métrica o una
  pregunt»); y las leyendas de Sharpe y Sortino definían «μ» mientras la
  fórmula escribía E[R] — ahora `((μ − Rf) / σ) × √N`, con guarda nueva
  (`tests/formulas-glosario.test.ts`, vista en rojo en esos cuatro casos).
  Descartado con motivo: la captura clara en tema oscuro (decisión escrita
  en ProductPlate; revisada y revertida en la tanda 27, cuyo motivo no
  resistió la medida) y las tablas legales con desplazamiento lateral
  (tienen tres columnas y su aviso de que sigue).

### Vigesimoséptima tanda: las capturas de septiembre (2026-09-24)

- **Catorce capturas nuevas** de la app (commit 12c91fd0 de Agenda Trading),
  archivadas en `assets/capturas-originales/` y recortadas con
  `scripts/capturas.py`. Mismas medidas que las de agosto, así que
  `laminas.ts` no cambia de tamaños.
- **Recortes de móvil medidos otra vez** sobre las nuevas y mirados uno a
  uno en claro y en oscuro: calendario, formulario, riesgo con sus dos
  avisos, cabecera del registro, ganadoras/perdedoras con el veredicto,
  check-in con sus dos «aún no lo sé» y la ficha de reversión entera.
- **Pies reescritos** con lo que se ve: el Guardián enseña dos avisos y no
  tres; el Resumen ya no abre con el parte del día sino con el rendimiento
  de las diez últimas; el Playbook tiene tres fichas con «ventaja
  sugerente» y dos «no concluyente», con curvas grises; el diario enseña
  el rendimiento por franja; Operaciones tiene ocho filtros.
- **Cada tema enseña su captura.** Se dejó de servir la clara en oscuro:
  el motivo escrito («la oscura pierde el contraste») no resistió la
  medida —la desviación de luminancia a tamaño de lámina es igual o mayor
  en la oscura en las siete pantallas, agosto incluido— y la clara era un
  bloque blanco en la página oscura. Las dos van en el HTML, el CSS oculta
  la otra y, perezosa, no se descarga (comprobado: una sola petición por
  tema; el botón de tema pide la otra al momento; el visor sigue al tema).
  Guarda nueva en `humo.mjs`: cada lámina enseña UNA captura y la de su
  tema; vista en rojo con la regla quitada y con las clases cambiadas.
- **Sin carga prioritaria en la lámina de la portada**: empieza a unos
  2340 px y la pedía al cargar.
- **Lo que cuesta el titular palabra a palabra (pendiente de la tanda 25),
  medido** sobre la misma compilación con la animación y anulándola, 10–15
  cargas por caso: el LCP no se mueve (1440: 156–200 ms con, 152–168 sin;
  390: 148–156 con, 144–160 sin). Lo que cambia es cuándo se lee: con
  palabras, cada una a menos del 5 % de su sitio a los 962–989 ms (quieta
  del todo a 1578–1610); sin ellas, 80–90 ms. Es el precio del gesto y se
  deja así.
- **Capas abiertas, repasadas en claro y en oscuro** (menú de producto,
  idioma, ayuda de atajos, aviso de cookies a 1440 y 390, cajón del móvil,
  paleta y ayuda de la demo). Arreglado: la ayuda de atajos de la demo va
  anclada a su barra de estado y con `?` se abría FUERA de la pantalla en
  los cuatro tamaños (a 1440×900, en 994–1200 px); ahora se desplaza lo
  justo para verse. Guarda nueva en `humo.mjs`, vista en rojo en las ocho
  combinaciones de pantalla e idioma antes del arreglo.
- **La guarda del titular de `humo.mjs` estaba ciega desde la tanda 25**:
  medía la opacidad del h1, que ya no se anima (se animan sus palabras), y
  daba «legible» al instante. Ahora espera a las palabras; vista en rojo
  alargando la animación a 8 s (3388–3616 ms frente al presupuesto de
  2500).
- `capturas.py` ya no tapa una barra de desplazamiento que las nuevas no
  traen; ahora comprueba que no la traigan (14 de 14 de agosto la tenían,
  0 de 14 de septiembre) y valida todo antes de escribir nada.
- **Encontrado en la app, no tocado**: en Operaciones, BTCUSDT y ETHUSDT
  salen a precios de unos 100 y con salidas negativas (ETHUSDT 100,48 →
  −111,42). Probable causa, sin verificar: el generador de datos de
  ejemplo pone precio por nombre («BTC/USDT» → 65.000, `_` → 100) y en
  pantalla el símbolo sale sin barra. Se ve en la captura de escritorio; el recorte de
  móvil no llega a esas filas.

### Vigesimoctava tanda: inglés, calculadoras y teclado, con un equipo (2026-09-25)

Tres auditores (inglés, calculadoras, accesibilidad) y después un equipo de
cuatro agentes con nombre que se mandaban mensajes: tres arreglaban, cada uno
en su copia y con ficheros sin solape, y el cuarto revisaba cada rama y
devolvía los cambios directamente. En la app de escritorio no hay «equipo»
de verdad (lista de tareas compartida y apagado ordenado son solo de la
terminal); con agentes con nombre basta, porque un mensaje reactiva al
destinatario aunque haya terminado. Todo lo que trajeron se comprobó otra vez
al integrar, y no todo aguantó (ver la calculadora de riesgo).

- **Inglés británico**: -ise/-our/defence en glosario, FAQ, i18n y textos
  de la demo; «Is my data safe?»; MAE/MFE con «Maximum»; `en_US` → `en_GB`
  en los 43 `openGraph` (43 antes, 0 después). Prueba de catálogos
  (`ortografia-britanica.test.ts`, roja con 12 casos antes del arreglo).
- **Apóstrofo tipográfico**: 106 rectos en 31 ficheros pasados a ’ con el
  analizador de TypeScript (solo cadenas y texto JSX, nunca comentarios;
  recuento exigido antes de escribir, 0 después). Tres más venían escritos
  como `&apos;` en JSX y el script no los veía: los cazó la guarda nueva de
  `cifras.mjs`, que mira la web inglesa compilada (apóstrofo y comillas
  rectas y ortografía americana también dentro de los componentes; roja
  con 77 y 63 casos sobre la compilación anterior).
- **Buscadores**: FAQ, glosario y su ventana comparan con `paraBuscar`
  (`src/lib/busqueda.ts`): sin mayúsculas, sin tildes y con un solo
  apóstrofo. Sin eso, al pasar a ’ «what's» dejaba de encontrar la
  pregunta. La ventana del glosario no ignoraba las tildes; ahora sí.
- **Calculadora de riesgo**: 100/105/110 se daba por un corto con
  199,90 $ de beneficio (visto en la web publicada). `validaPlan` exige el
  objetivo al otro lado de la entrada y avisa. Con el plan inválido seguía
  enseñando «riesgo de ruina 100 %», tamaño 0 y la barra: el encargo lo
  pedía, el agente no lo hizo y el revisor lo aprobó; se vio al mirarla en
  el navegador. Ahora todo lo que depende del plan dice «—» (el VaR se
  queda: solo depende del balance y del %).
- **Proyector de capital**: al máximo pintaba 537.689.208… $ (87 cifras)
  ya a 3 años. `proyectaCapital` marca `fueraDeEscala` por encima de 1e12
  y la herramienta avisa y enseña «—» en balance, CAGR y retorno.
- **Ahorro y comisiones** anuncian su resultado (`ResultadoAnunciado`); el
  porcentaje coloreado de comisiones lleva palabra (alto/moderado/bajo).
  `anuncios.mjs` saca ahora la lista de herramientas de la compilación: la
  escrita se había quedado en siete.
- **Teclado**: la paleta de la demo atrapa el Tab y devuelve el foco; la
  ayuda de la demo se lleva el foco y lo devuelve; el aviso de cookies no
  roba el foco al salir solo y, reabierto desde el pie, lo recibe y lo
  devuelve (y va justo después del salto al contenido); el glosario dice
  su opción activa (`aria-activedescendant`); el megamenú se cierra cuando
  el Tab sale de la navegación; el formulario apunta el error solo al campo
  que falla. Nueve recorridos nuevos en `teclado.mjs`, rojos en los siete
  arreglos con el código anterior.
- **Dos guardas estaban ciegas** en `teclado.mjs`: daban un número fijo de
  tabuladores (20 y 30) y la paleta tiene 15 enfocables con Shift+Tab
  intercalados, así que nunca se llegaba al final. Ahora cuentan los
  enfocables de la capa y recorren más, hacia delante y hacia atrás.
- `humo.mjs` comprueba en pantalla las dos calculadoras (roja la de riesgo
  con la compilación sin el «—», la del proyector contra la web publicada).
- Índice de herramientas en tableta con aire (`sm:py-2.5`) y
  `test-infra.test.ts`: cada prueba con su fila en TEST_INFRA.md.

### Vigesimonovena tanda: fluidez, medida (2026-09-25)

Medido con un script propio de una sola vez (carga, y cada fotograma
mientras se baja la página con la rueda), en escritorio 1440 y en móvil
390 con CPU ×4, 3–6 pasadas por caso. **Ojo con el navegador de
pruebas**: por defecto pinta con SwiftShader (una tarjeta gráfica por
software) y exagera todo lo que es de composición —desenfoques, capas
animadas—. Con `--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist`
usa la tarjeta real (aquí una RTX 4070 Ti, más que cualquier móvil).
Criterio: lo que no cambia el aspecto se arregla con cualquiera de las
dos medidas; lo que cambia el diseño, solo si también falla con la real.

- **El cristal solo desenfoca cuando flota.** Las tarjetas de /pricing
  y el panel de la demo desenfocaban el fondo liso que tienen detrás:
  p95 al deslizar de 33,3 ms (4 de 4 pasadas, por software) a 16,8; en
  captura, a lo sumo 11/255 de diferencia en los dos temas y anchos. Con
  la tarjeta real el tirón era menor (0–1,3 % de fotogramas lentos), así
  que era sobre todo para gráficas modestas. Regla nueva: `tj-cristal`
  no desenfoca; `tj-cristal--denso` y la barra sí. Guarda en `humo.mjs`
  (ningún elemento en el flujo desenfoca), roja contra la web publicada
  con las dos tarjetas y el panel.
- **Las piezas de las listas no se escalonan en una columna** (< 768 px).
  En móvil cada término del glosario entraba solo, con seis a diez
  transiciones a la vez al deslizar: fotogramas de más de 33 ms del
  3,5–9,9 % al 0,9–2,5 % con la tarjeta real (6 pasadas por lado). En
  tableta y escritorio no cambia nada.
- **La primera pantalla se asienta antes**: lo que va bajo la cabecera
  entra a 0,3 s en 0,9 s (era 0,5 + 1,1). La primera página de la demo
  ya no entra animada, porque su esqueleto ya dibuja la silueta (era un
  segundo movimiento encima del de la sección). La ventana de la demo se
  ve al 50 % a los 468–555 ms (antes 685–771) y al 95 % a los 769–855
  (antes 1055–1138), 5 pasadas por lado. El LCP que da Chrome casi no se
  mueve (≈1 s) porque cuenta el final del fundido, no cuándo se ve.
- **Descartado, con la medida**: el JavaScript por página (≈190 KB
  comprimidos) está bien repartido —el glosario solo viaja en su página,
  los polyfills llevan `noModule`, PostHog solo carga con permiso—; lo
  que queda es React con `framer-motion`, ya decidido.
- **Fecha del pie**: «Sitio actualizado» y el año del copyright salen del
  día del commit en su propia zona (`diaDelCommit`); antes, en UTC, un
  commit hecho en España de madrugada salía con el día anterior.

### Trigésima tanda: lo que decían las cifras y los textos (2026-09-25)

Tres revisores en solo lectura (calculadoras, textos en español,
contenido) y revisión visual de las 14 páginas que faltaban (1440
oscuro y 390 claro). Cada hallazgo, reproducido antes de tocarlo, y
cada arreglo con su prueba vista en rojo.

- **La promesa de seguridad decía de más.** «Tus datos no salen de tu
  equipo si tú no lo decides» y «lo que se conecta a internet lo activas
  tú», con la licencia —que se comprueba sola, una vez al día— en la
  tabla de al lado. Ahora hablan de tus **operaciones**, que es lo cierto,
  y nombran la licencia. La tabla, la FAQ y la entradilla salen de
  `src/lib/conexiones.ts`; `tests/conexiones.test.ts` exige que cada
  resumen nombre lo que va solo.
- **Comisiones con EUR/USD, 10.000 veces de más**: multiplicaba los pips
  por el tamaño del lote (100.000) en vez de por su valor (10 $); 15 pips
  con 2 lotes daban 3.000.000 $ por operación. El equilibrio en pips salía
  multiplicado por 0,0001. La tabla de instrumentos vive en
  `fugaComisiones.ts` y todo sale de `tickSize` y `tickValue` (se quitó el
  valor del punto, el dato que permitía la contradicción).
- **Monte Carlo, «ruina 0 %» con la cuenta en céntimos**: con riesgo
  compuesto el saldo nunca toca 0. Ruina es ahora perder
  `UMBRAL_RUINA_PCT` (50 %) del balance, el mismo umbral y la misma
  fórmula que la calculadora de riesgo; los rótulos lo dicen, y el
  glosario ya no define la ruina como «perder todo». La simulación vive
  en `src/lib/trading/montecarlo.ts`.
- **Calculadora de riesgo**: un stop a un céntimo llevaba 10.000 $ a
  comprar 1.000.000 $ en acciones sin aviso. Avisa por encima del tope de
  la ESMA para minoristas de cada mercado (acciones 5:1, divisas 30:1,
  índices 20:1), y el rojo de la cifra usa el mismo tope (antes, 10× para
  todo: rojo en un futuro normal, callado en acciones a 9×).
- **Escenario de coste**: hablaba del «mes 50» con un horizonte de un año
  como si cayera dentro; ahora lo dice fuera. «1 años» → «1 año».
- **Textos**: «expectancy» en vez de «esperanza matemática» (cinco sitios,
  dos en la misma herramienta); «boletines» por «newsletter»; «filtro
  aplicado»; «Materias primas»; los atajos «NQ Futuros» / «ES Futuros»
  de la demo salían en español también en /en/demo. En /about, los hitos
  futuros ya no dicen dos veces lo mismo («Más adelante» + «Previsto»).
- **Descartado, con la medida**: el título de /test salía pequeño en la
  captura de página entera; en ocho combinaciones reales (con y sin
  GPU, con y sin movimiento reducido) sale a su tamaño. Es un defecto de
  la captura, no de la página.

### Trigésima primera tanda: la ruina exacta y el botón de subir (2026-09-25)

- **Riesgo de ruina exacto.** `computeRiskOfRuin` usaba la aproximación
  de difusión e^(−2·E·U/σ²), que falla con pagos asimétricos: con un
  50 % de acierto y ganancias de 1.500 R daba un 87 % de ruina a una
  operación que solo se arruina con 50 pérdidas seguidas. Ahora es z^U,
  con z la raíz de p·z^b + q/z = 1 (la ruina del jugador generalizada,
  exacta con pérdidas de una unidad). Pruebas contra resultados cerrados:
  (q/p)^U con payoff 1 y la raíz de la cúbica con payoff 2, las dos en
  rojo con la fórmula vieja. La función ya no redondea (eso es de la
  pantalla) y el glosario enseña la fórmula que se usa.
- **El botón de subir tapaba el copyright en móvil.** Al final de la
  página subía 104 px fijos, calculados para una barra final de una
  línea; con tres, a 390 y 375 px caía sobre «Todos los derechos
  reservados.» (en inglés, más corto, no llegaba). Ahora mide la barra
  (`[data-pie-final]`) y su propia posición, muesca incluida, y se queda
  8 px por encima. Guarda nueva en `humo.mjs` que mide cada trozo de
  texto del pie contra el botón en tres anchos; roja con la versión
  anterior en los seis casos de móvil.
- Revisadas a ojo las ocho páginas que faltaban (disciplina, seguridad,
  operativa manual, legales, 404, demo) a 1440 oscuro y 390 claro, con
  capturas por pantallas en vez de página entera: sin desbordes ni
  errores de JavaScript.

### Trigésima segunda tanda: el cromo, más callado (2026-09-25)

Sin tocar tipografía ni paleta. Comparado con capturas antes/después de
portada, precios y características a 1440 (claro y oscuro) y 390.

- **Desplegables opacos.** El menú «Producto» usaba el cristal denso al
  0,74: se abre justo encima del h1 del héroe y sus letras se leían como
  un borrón detrás de la lista. Nueva variante `tj-cristal--menu` (0,95
  claro, 0,96 oscuro, sin reflejo especular, sombra más recogida). El de
  idioma llevaba un material propio con una sombra negra al 70 % que en
  claro pesaba más que el menú; ahora usa la misma variante. Guarda en
  `humo.mjs` que mide el fondo de los dos menús en los dos temas (mínimo
  0,9), roja contra la versión publicada.
- **Barra al bajar.** Sombra reducida a un filete y una caída corta, y
  saturación del desenfoque al 125 % (los paneles siguen al 180 %): el
  verde y el rojo del calendario de /features asomaban como manchas
  detrás de «Producto».
- **Sombra de los paneles de cristal en claro**, más corta y más clara: el
  halo gris alrededor de las tarjetas de precios y del panel de cifras
  pesaba más que el propio panel.
- **Cajón móvil.** Iconos sin placa (el tono marca el activo), sin el
  empujón lateral al pasar, la misma flecha en «Ver precios» y «Ver la
  demo», y fuera la marca y el copyright del fondo: la marca ya encabeza
  el cajón y el copyright está en el pie de cada página.
- **Pie.** El icono de GitHub, suelto bajo el lema y con efecto
  magnético, pasa a enlace de texto «Código de la web» en la línea final.
  Fuera ~150 líneas de comentarios que describían un pie que ya no existe
  (pastillas de confianza, indicador de estado, `liquid-glass`, cinco
  redes sociales).

### Trigésima tercera tanda: las secciones, una sola voz (2026-09-25)

Repaso a ojo de diez páginas a 1440 claro y cuatro a 390 oscuro.

- **Estado del producto** (/beta y /pricing): las tres columnas se
  marcaban con un ✓ verde, un reloj y la palabra «Previsto». Ahora las
  tres llevan una palabra en la misma voz —«Disponible», «Por
  invitación», «Previsto»—; la nueva clase `.rotulo-estado` comparte
  regla con `.sello-previsto`.
- **Enlaces de /beta**: «Ver el detalle previsto» y «Abrir la FAQ» iban
  subrayados en negrita, los únicos del sitio; pasan a `cta--secundario`
  (texto con flecha), como el resto.
- **Cierre de página en móvil**: el botón principal medía ~280 de 350 px
  (`justify-items: start`). Ahora va a todo el ancho, como el del héroe.
  Guarda en `humo.mjs` en todas las rutas a 390, que además falla si no
  llega a medir ninguna.
- **Sombra de las fichas en claro**, más corta, a juego con la del
  cristal de la tanda anterior.

## Herramientas de auditoría propias

Antes de dar por terminado un cambio visible, correr lo que aplique:

```bash
npm run build                       # compila a /out
node scripts/humo.mjs --serve out   # contraste, láminas, velo, entradas, menú…
node scripts/legible.mjs --serve out  # contraste de TODO el texto sobre fondo plano (30 rutas)
node scripts/arranque.mjs --serve out --cpu 4  # tiempo hasta titular legible, CPU x4
node scripts/metadatos.mjs out          # título, descripción, canónico, hreflang, lang y ld+json de las 170
node scripts/tinta.mjs --serve out      # texto sobre fondo lleno de P&L, en los dos temas
node scripts/corrobora-menus.mjs --base <url>  # navegación y menús, escritorio + móvil (vale contra `out/` servido sin modo SPA)
node scripts/medida.mjs --serve out     # caracteres por línea (tope 85, textos de 2+ líneas)
node scripts/papel.mjs --serve out      # que lo impreso salga entero, sin huecos por animación
node scripts/cifras.mjs out             # convención de idioma (y apóstrofo, comillas y ortografía británica en /en), y restos de plantilla a la vista
node scripts/copiado.mjs --serve out    # lo mismo, sobre el texto que copian los 7 botones «Copiar»
node scripts/enlaces.mjs out            # ningún enlace roto, ninguno que cambie de idioma, ningún botón a su propia página
node scripts/pesos.mjs --serve out      # nadie pide a la serif un grosor que su eje ya no trae
node scripts/rejillas.mjs --serve out   # ninguna ficha despega su texto para igualar la fila (todas las páginas, 1440 y 390)
node scripts/movimiento.mjs --serve out # con «reducir movimiento» activo no se desplaza nada
node scripts/tema.mjs --serve out       # manda la elección, luego el sistema, y sin fogonazo blanco
node scripts/anuncios.mjs --serve out   # las herramientas que calculan (las saca de out/) dicen su resultado a quien no ve la pantalla
node scripts/teclado.mjs --serve out    # el sitio sin ratón: foco visible, menús, diálogos y capas que devuelven el foco
npx vitest run                          # 39 suites, 415 tests (+2 omitidos)
npx tsc --noEmit && npm run lint        # `npm run lint` es `eslint .` — incluye scripts/, como el CI
```

Cada script explica en su propia cabecera qué mide y por qué existe — son la
fuente de verdad, no este documento.

> **`deep_audit.mjs` se retiró el 2026-09-20.** Su cabecera prometía cuatro
> cosas que su código no hacía: canónicos, `hreflang`, enlaces rotos y texto
> sin traducir. No había ni una comprobación de ninguna de las cuatro. Además
> su única comprobación de idioma llevaba `&& !url.includes("localhost")` y
> este documento la invocaba contra `localhost:3000`, así que **nunca llegaba
> a ejecutarse**; y miraba 64 rutas escritas a mano de las 170 que existen.
> Daba verde sin mirar. Lo que sí hacía quedó repartido donde se comprueba de
> verdad: los metadatos en `metadatos.mjs`, los enlaces rotos en `enlaces.mjs`
> y los restos de plantilla en `cifras.mjs`, los tres contra `out/` y sobre
> todas las páginas. Vuelve con `git checkout <commit> -- scripts/deep_audit.mjs`.
>
> Por eso, las dos menciones de más arriba a que «`deep_audit` pasó limpio»
> (secciones de las tandas anteriores) valen menos de lo que parecen: decían
> que 64 rutas tenían título y descripción, no que los canónicos, el idioma
> ni los enlaces estuvieran bien.

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
