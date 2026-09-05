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
