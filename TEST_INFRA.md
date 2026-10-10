# Infraestructura de tests: CountPips

## Filosofía

- **Caja opaca y dirigida por requisitos**: `tests/e2e/` verifica las 13+1
  dimensiones de calidad del producto (matemáticas, accesibilidad, i18n, SEO,
  rendimiento, tokens, seguridad, atajos, motor de demo, métricas institucionales).
- **Contratos de diseño**: `tests/` (raíz) verifica invariantes concretos del
  sitio en construcción — cosas que un cambio de CSS o de copy podría romper
  sin que ningún tipo se queje.
- **Runner**: Vitest (`npm test` / `npx vitest run`). Sin mocks que sustituyan
  lógica real, sin fechas no deterministas.

## `tests/e2e/` — por dimensión de calidad

| Fichero | Dimensión | Qué verifica |
|---|---|---|
| `d1_math_accuracy.test.ts` | D1 | Sharpe, Sortino, Calmar, Kelly, CDF normal, Monte Carlo, Guardian |
| `d2_d3_accessibility_viewport.test.ts` | D2 + D3 | WCAG AA (contraste, touch targets, ARIA) y viewport 390×844 |
| `d4_bilingual_parity.test.ts` | D4 | Paridad 1:1 de `STR`, glosario, herramientas, FAQ, legales |
| `d5_seo_metadata.test.ts` | D5 | Títulos únicos, descripciones ≤160, canonical, hreflang, JSON-LD |
| `d6_performance_hydration.test.ts` | D6 | Determinismo SSR/SSG, fechas de publicación, sin hidratación no determinista |
| `d7_d13_demo_engine.test.ts` | D7 + D13 | PRNG `mulberry32` determinista, fechas UTC, sincronía entre vistas |
| `d8_design_tokens.test.ts` | D8 | Pureza de tokens, sin hex sueltos, mapeo de paletas claro/oscuro |
| `d9_d10_security_editorial.test.ts` | D9 + D10 | Privacidad cliente, consentimiento de PostHog, tono institucional |
| `d11_d12_shortcuts_resilience.test.ts` | D11 + D12 | Ctrl+K / Ctrl+G, `try/catch` de storage, validación de entradas |
| `d14_institutional_suite.test.ts` | D14 | Multiplicadores de instrumento, SQN, índice de úlcera, asimetría de drawdown |
| `tier3_pairwise_combinations.test.ts` | — | Combinaciones de features por pares |
| `tier4_real_world_scenarios.test.ts` | — | Recorridos de usuario completos |

## `tests/` (raíz) — contratos del sitio

| Fichero | Qué vigila |
|---|---|
| `adversarial_stress.test.ts` | Casos límite adversariales del motor de métricas y contratos de futuros |
| `campo-cifra.test.ts` | Las cifras de los campos editables: coma o punto según idioma, sin millares, ida y vuelta exacta |
| `capturas.test.ts` | Que las 4 variantes de cada captura real (tema × pantalla/detalle) encajen en medida, y que el recorte móvil declare las suyas: tiene otra proporción, y sin ellas la página saltaba al llegar la imagen |
| `contratos.test.ts` | Contratos generales de `i18n.tsx` y rutas localizadas; titular del Monte Carlo frente a sus caminos; destinos del glosario; ningún `type="number"`; ninguna cifra de herramientas escrita a mano; ningún enlace a `countpips.com` fuera de `site.ts`; PostHog sin grabación de sesión y guardando en `localStorage`, no en cookies |
| `cromo-mesa.test.ts` | Que no vuelva el cromo de ventana antiguo tras pasar a índice de mesa |
| `css.test.ts` | Que `globals.css` compile con `lightningcss` sin reglas huérfanas |
| `destino-beta.test.ts` | A dónde va la solicitud de acceso anticipado según el entorno de compilación (pasando por `next.config.ts`): solo con el Apps Script va a él aunque la variable del Worker llegue vacía; con los dos, al Worker; sin ninguno, a Web3Forms con todos los datos; sin clave tampoco, no sale y se avisa |
| `grabado.test.ts` | Reglas visuales comprobables por máquina: sin degradados decorativos, fondo limpio, sello de «previsto» |
| `hero-calcs.test.ts` | Las micro-calculadoras del hero (sin deslizadores) |
| `husos.test.ts` | La demo da el mismo resultado en cualquier huso horario |
| `marcas-eje.test.ts` | Marcas de eje en cifras redondas (1 · 2 · 2,5 · 5), dentro del rango y sin reventar con rangos imposibles |
| `metricas.test.ts` | El motor de métricas y la distribución de R de la portada; el coste de indisciplina y el semáforo de disciplina con el criterio y los cortes de la app |
| `comprobacion-pr.test.ts` | `.github/workflows/comprobar.yml` corre en cada PR los mismos comandos de comprobación, la misma versión de Bun y el mismo prefijo que `deploy.yml` antes de publicar, sin secretos ni permiso de escritura: una barrera nueva solo en el despliegue volvería a dejar ver el fallo al publicar y no antes de fusionar |
| `comparacion.test.ts` | «Esta selección frente al resto» de la demo: gana solo quien tiene intervalos disjuntos, solaparse no es empatar, por debajo de 20 operaciones no hay veredicto, y el resto es el complemento exacto |
| `fondeo.test.ts` | Prueba de fondeo: coincide con la ruina del jugador, el dinámico nunca aprueba más que el estático, escenario leído de la dirección acotado y ajustado al paso |
| `formulario-declarado.test.ts` | Lo que la FAQ y la política de privacidad dicen que pide el formulario de acceso es lo que pide: cuenta los campos del HTML compilado (se salta sin `out/`) |
| `calendario-muestra.test.ts` | Muestra de /features: el calendario de julio de 2026 empieza en su día y tiene 31; ningún cierre en fin de semana salvo cripto, sin cambiar el resultado total; los setups de la ficha de playbooks cubren la muestra, de mejor a peor, con alguno sin ventaja; `OPERACIONES_MUESTRA` es el tamaño real de la muestra; el cumplimiento mensual del diario son los seis meses naturales con el criterio de las métricas; el contexto del día de la ficha (orden, tiempo desde el último cierre, resultado previo, revancha en el límite del enfriamiento) sale de las operaciones de ese día; la temporalidad y el régimen de la tarjeta «Contexto» salen de duración y setup |
| `dia-del-commit.test.ts` | La fecha «Sitio actualizado el …» y el año del copyright son los del commit en su propia zona horaria: uno hecho en España a la 01:40 no sale con el día anterior, ni el 1 de enero con el año anterior |
| `busqueda.test.ts` | Los buscadores (FAQ, glosario, ventana del glosario) comparan sin mayúsculas, sin tildes y con un solo apóstrofo: «what's» del teclado encuentra «What’s», y cada pregunta inglesa de la FAQ se encuentra tecleándola |
| `barra-riesgo.test.ts` | La barra riesgo/beneficio de la calculadora: los dos tramos crecen desde el centro, ninguno pasa del 50 %, los dos se ven si valen algo y su proporción es la del R:R |
| `saltos-teclado.test.ts` | Cada atajo «g + letra» lleva a una página que existe, sin teclas repetidas, y el teclado global lee la misma tabla que la ayuda |
| `sesiones.test.ts` | Las plazas del reloj de sesiones abren y cierran en su hora local: cambio de hora de Londres, las 09:30 de Nueva York, fin de semana según el día local, ventana del día en UTC |
| `test-infra.test.ts` | Este índice nombra todos los ficheros de `tests/` y `tests/e2e/`: una prueba sin fila es una guarda que nadie sabe que existe |
| `variables.test.ts` | Toda `var(--nombre)` que se lee sin valor de reserva está declarada en alguna hoja o estilo: una sin declarar deja el fondo transparente sin que nada falle |
| `almacenamiento-declarado.test.ts` | La tabla de la política de cookies tiene una fila por clave que el código escribe en `localStorage`/`sessionStorage` (más PostHog), y las de «hasta que cierres la pestaña» existen como almacenamiento de sesión |
| `formulas-glosario.test.ts` | Cada símbolo que explica la leyenda de una fórmula del glosario («σ: desviación…») aparece en la propia fórmula, en los dos idiomas |
| `ortografia-britanica.test.ts` | Ninguna raíz americana de una lista cerrada (-ize, defense, color, behavior, favor, center, catalog…) aparece en los campos ingleses del glosario, sus fórmulas, la FAQ, las láminas del producto ni `i18n.tsx`, salvo los nombres propios de términos técnicos («Maximum Favorable/Adverse Excursion») |
| `palabras.test.ts` | El titular palabra a palabra conserva el texto exacto, no deja la puntuación en su propia máscara, realza exactamente su tramo aunque corte una palabra y, solo en español, pega las palabras de una o dos letras a la siguiente con espacio duro (en inglés no pega nada) |
| `formato-millares.test.ts` | `fmtInt`, `fmtPrice`, `fmtNum` y `fmtMoney` agrupan millares también con cuatro dígitos, en los dos idiomas; `fmtCifraCorta` escribe «+1,2k» en español; `fmtOperaciones` concuerda en número («1 operación», «0 operaciones», «1 trade»); `fmtNum`, `fmtInt` y `fmtPct` escriben el negativo con el menos tipográfico y el cero redondeado sin signo |
| `plan.test.ts` | `calculaPlan` de la calculadora de riesgo: cada par de forex con su pip y su divisa cotizada (USD/JPY sale a 0,50 lotes, no a 0,0033; EUR/GBP nunca arriesga más de lo pedido); futuros en contratos enteros con el riesgo real por debajo del nominal y el micro sugerido cuando no cabe uno; la fricción suma comisión y un tick; Kelly medio y cuarto son la mitad y la cuarta parte del completo; `fmtPrecio` conserva los decimales del precio |
| `significancia.test.ts` | `contrasteVentaja`: la hipótesis nula es el acierto de equilibrio que fija el payoff, no el 50 %; un acierto por debajo nunca es «ventaja» (35 % a 1 R : 1 R, 75 % a 0,5 R : 3 R); el empate exacto tampoco; si la muestra alcanza la necesaria al 95 %, el veredicto es significativo; un 52 % frente a un 50 % pide miles de operaciones |
| `plurales.test.ts` | Ningún recuento de operaciones se escribe a mano en `src/` («${n} operaciones», «${n} trades» o el par `"operaciones" : "trades"`): todos pasan por `fmtOperaciones`, que no escribe «1 operaciones» |
| `glosario-descripciones.test.ts` | La descripción de cada ficha del glosario (buscador y tarjeta al compartir) es una frase entera de 70 a 155 caracteres, sin «…» ni paréntesis abiertos; el recorte por frases no confunde «p. ej.» ni un decimal con un final; las descripciones a mano solo existen donde el recorte no basta |
| `recuperacion.test.ts` | Recuperación de drawdown: la asimetría, la operación exacta en que se vuelve al máximo, sin ventaja no vuelve, nunca NaN ni Infinity |
| `prefijo-despliegue.test.ts` | `basePath` de GitHub Pages, probado con y sin valor |
| `hover-anulado.test.ts` | Ningún botón o enlace se queda mudo al pasar el ratón: ni un `style={{ background }}` en línea que gane a su propio `hover:bg-…` (así estaba «Ver la demo» de la barra), ni un `hover:text-[rgb(var(--accent-base))]` sobre `text-primary`, que con la paleta en blanco y negro es la misma tinta. El detector se prueba primero contra el caso real |
| `sin-framer.test.ts` | Ningún fichero de `src/` importa `framer-motion` y la dependencia no está en `package.json`: volver a traerla devolvería unos 40 KB comprimidos a /demo sin que nada se viera distinto |
| `radios.test.ts` | Que el comentario que documenta la escala de radios diga los radios que hay |
| `tipografias.test.ts` | El build no depende de que Google Fonts responda |
| `vocabulario.test.ts` | El sitio se nombra a sí mismo de una sola forma, por idioma, y en español el dinero de la cuenta es «balance», nunca «saldo» ni «capital» (el inglés lo vigila `cifras.mjs`) |
| `informe.test.ts` | `componerInforme`: el texto que copian las herramientas lleva «CountPips · Título», bloques separados por una línea en blanco, salta líneas y bloques vacíos y cierra con la dirección. Y solo `BotonCopiar` toca el portapapeles: una herramienta que vuelva a escribirlo por su cuenta se salta el formato y el aviso de fallo |
| `paleta-trampa-tab.test.ts` | `destinoTrampaTab` (trampa de foco de `DemoCommandPalette`): a qué extremo salta Tab/Shift+Tab desde cada posición, incluida la de un único elemento enfocable |
| `flechas.test.ts` | `destinoConFlechas`, el teclado común de los grupos de opción y las pestañas (test de disciplina, nota del día, dirección, analítica, revisión, barra de la demo): las flechas dan la vuelta en los extremos, Inicio y Fin saltan a ellos, en las pestañas ↑ y ↓ no mueven, y ninguna otra tecla mueve |
| `glosario-activedescendant.test.ts` | `idOpcionGlosario` (`aria-activedescendant` del listbox de `GlossaryModal`): id legible, normaliza acentos/símbolos, nunca vacío, único para cada término real de `GLOSSARY` |
| `valida-plan.test.ts` | `validaPlan`: RiskCalculator ya no da por válido un objetivo que cae al mismo lado de la entrada que el stop; campos no positivos, no finitos o repetidos se rechazan antes de mirar el lado. `excedeApalancamiento`: un stop a un céntimo en acciones (100×) avisa; el tope depende del mercado |
| `proyeccion-capital.test.ts` | `proyectaCapital`: con expectancy, riesgo y frecuencia altos a 10 años el balance en bruto no está acotado (no se recorta en silencio) y la función marca `fueraDeEscala` cuando deja de ser una cifra creíble; con parámetros razonables no la marca. La tasa anual se pondera por tiempo (aportar dinero con expectancy cero no da rentabilidad); el tiempo para duplicar cuadra con el mes en que la curva cruza el doble, en compuesto y en riesgo fijo; un empate con ruido de coma flotante no es ventaja; el «primer año» es el año 1 de la tabla |
| `fuga-comisiones.test.ts` | `clasificaFugaComisiones`: mismas fronteras que ya pintaba CommissionDragCalculator (>30 alto, >15 moderado, resto bajo), ahora en palabra. Valor del objetivo por instrumento con cifras de mercado a mano: 15 pips de EUR/USD con 2 lotes son 300 $, no 3.000.000 $. El objetivo de cada instrumento arranca dentro de su deslizador y sobre su paso, con un recorrido de entre 8 y 500 ticks (el crudo arrancaba en 0,5 $ con un deslizador de 5 a 100) |
| `montecarlo.test.ts` | Ruina del simulador de Monte Carlo = perder `UMBRAL_RUINA_PCT` del balance: la peor combinación es 100 % en simulación y por fórmula; todo camino que acaba bajo el umbral cuenta; la fórmula es la de la calculadora de riesgo. La semilla da la vuelta de 50 a 1; con los deslizadores al máximo favorable el resultado se marca `fueraDeEscala` |
| `amortizacion.test.ts` | El escenario de coste no habla de un mes de amortización fuera del horizonte elegido como si cayera dentro |
| `conexiones.test.ts` | Cada texto que resume lo que se conecta a internet (FAQ, entradilla de seguridad) nombra lo que va solo —la licencia—; cada fila de la lista dice en su redacción si depende de ti |
| `resultado-anunciado-cobertura.test.ts` | Las nueve calculadoras de marketing/ envuelven su resultado principal con `ResultadoAnunciado` |
| `glosario-familias.test.ts` | La ventana del glosario (`GLOSSARY_CATEGORIES`) y la página del glosario (`ORDEN_CATEGORIAS`) enseñan las mismas familias en el mismo orden |
| `rayas-catalogos.test.ts` | En el texto español de `STR`, el glosario, las dos FAQ y las láminas del producto, la raya de inciso va pegada a su palabra con unión invisible (`⁠`): ni « — » con espacios ni una raya por la que el navegador pueda partir la línea |

## Fuera de Vitest: auditoría manual con el sitio compilado

No son parte de `npm test` — se corren aparte, contra `/out`, y cada uno
explica en su cabecera qué mide. Ver la lista de comandos en
[PROJECT.md](PROJECT.md#herramientas-de-auditoría-propias).

## Umbral de aceptación

- Todo pasa con `npx vitest run`, código de salida 0.
- Cero aserciones dependientes del reloj real (fechas mockeadas o UTC fijo).
- Cero atajos que salten la lógica real del módulo bajo prueba.
