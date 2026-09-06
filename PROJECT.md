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
- **Fondo grabado**: `EngravedAtlas.tsx` dibuja figuras a puntos (curva, calendario,
  distribución de R, cuadrante de riesgo…) en un `<canvas>` fijo a pantalla completa,
  sincronizado con el scroll a través de pausas (`PlateInterlude`, `data-plate`).
- **Analítica**: PostHog (UE), sólo tras consentimiento explícito, cero cookies.
- **Backend beta**: Worker de Cloudflare en `services/beta-api/` (D1 + KV + Turnstile);
  ver su propio [README](services/beta-api/README.md).

## Dónde está ahora (2026-09-05)

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
  (antes lo primero que se tecleaba se perdía).
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
node scripts/legible.mjs --serve out  # contraste de TODO el texto sobre fondo plano
node scripts/fondos.mjs --serve out   # que cada sección dibuje un fondo distinto
node scripts/fluidez.mjs --serve out  # presupuesto de fotogramas del atlas (28 ms)
node scripts/arranque.mjs --serve out --cpu 4  # tiempo hasta titular legible, CPU x4
node scripts/deep_audit.mjs             # códigos 200, lang, canonical, hreflang
node scripts/corrobora-menus.mjs        # navegación y menús, escritorio + móvil
npx vitest run                          # 26 suites, ~305 tests
npx tsc --noEmit && npx eslint .
```

Cada script explica en su propia cabecera qué mide y por qué existe — son la
fuente de verdad, no este documento.

## Contratos de interfaz (siguen vigentes)

### `src/lib/theme.tsx`
- `getTheme()` / `setTheme()` / `getPalette()` / `setPalette()`: nunca lanzan,
  incluso si `localStorage` da `SecurityError` (navegación privada).

### `src/components/tj/OverlayHost.tsx`
- `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"` → paleta de comandos.
- `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g"` → glosario.

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
- `src/components/tj/`: layout, navegación, overlays, consentimiento, el atlas
  grabado (`EngravedAtlas.tsx`, `BackgroundFX.tsx`), láminas de producto real
  (`ProductPlate.tsx`).
- `src/components/marketing/`: calculadoras, secciones de producto, vitrinas
  (`ProductShowcase.tsx`, `GaleriaPantallas.tsx`), FAQ, héroes.
- `src/components/demo/`: motor de la demo (dashboard, operaciones, calendario,
  analítica, diario, detalle de operación).
- `src/components/glosario/`: índice y ficha de término bilingüe.
- `src/lib/`: `i18n.tsx`, `theme.tsx`, `consent.ts`, `glosario.ts`,
  `herramientas.ts`, `faq.ts`, `laminas.ts` (registro de capturas reales),
  `atlas.ts` (qué lámina dibuja cada ruta).
- `src/lib/trading/`: motor cuantitativo, métricas, modelos de datos del glosario.
- `scripts/`: herramientas de auditoría manual (ver arriba) + generación de
  marca (`generate-brand.py`) y recorte de capturas (`capturas.py`).
- `tests/`: suites Vitest; `tests/e2e/`: suites por dimensión de calidad.
