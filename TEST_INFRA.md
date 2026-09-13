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
| `capturas.test.ts` | Que las 4 variantes de cada captura real (tema × pantalla/detalle) encajen en medida |
| `contratos.test.ts` | Contratos generales de `i18n.tsx` y rutas localizadas |
| `cromo-mesa.test.ts` | Que no vuelva el cromo de ventana antiguo tras pasar a índice de mesa |
| `css.test.ts` | Que `globals.css` compile con `lightningcss` sin reglas huérfanas |
| `grabado.test.ts` | Reglas visuales comprobables por máquina: sin degradados decorativos, fondo limpio, sello de «previsto» |
| `hero-calcs.test.ts` | Las micro-calculadoras del hero (sin deslizadores) |
| `husos.test.ts` | La demo da el mismo resultado en cualquier huso horario |
| `metricas.test.ts` | El motor de métricas y la distribución de R de la portada |
| `prefijo-despliegue.test.ts` | `basePath` de GitHub Pages, probado con y sin valor |
| `tipografias.test.ts` | El build no depende de que Google Fonts responda |
| `vocabulario.test.ts` | El sitio se nombra a sí mismo de una sola forma, por idioma |

## Fuera de Vitest: auditoría manual con el sitio compilado

No son parte de `npm test` — se corren aparte, contra `/out`, y cada uno
explica en su cabecera qué mide. Ver la lista de comandos en
[PROJECT.md](PROJECT.md#herramientas-de-auditoría-propias).

## Umbral de aceptación

- Todo pasa con `npx vitest run`, código de salida 0.
- Cero aserciones dependientes del reloj real (fechas mockeadas o UTC fijo).
- Cero atajos que salten la lógica real del módulo bajo prueba.
