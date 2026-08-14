# Informe Técnico de Auditoría — CountPips (D1, D7, D9, D13)

**Fecha**: 2026-08-14  
**Auditor**: Technical Survey Explorer  
**Ámbito**: Dimensiones Cuantitativa (D1), Integridad de Tests y Tipado (D7), Seguridad y Privacidad (D9), y Consistencia de Datos y Motor Demo (D13).

---

## Resumen Ejecutivo

Se ha realizado una auditoría estática y empírica exhaustiva del código fuente de CountPips (`countpips-web@0.2.0`), abarcando todos los módulos cuantitativos (`src/lib/trading/`), componentes interactivos (`src/components/marketing/`, `src/components/herramientas/`, `src/components/demo/`), la suite de pruebas unitarias (`tests/`), la configuración de compilación estática (`next.config.ts`, `scripts/postbuild.mjs`), la infraestructura de privacidad (`consent.ts`, `PostHog.tsx`) y el almacén de persistencia local (`demoStore.ts`).

### Indicadores Clave de Estado
- **Exactitud Cuantitativa (D1)**: 100% alineada con especificaciones analíticas institucionales. Todas las fórmulas (Sharpe anualizado por días calendario, Sortino MAR=0, Calmar con base 365.25d, Expectancy R, Criterio de Kelly con clamping $f^* \le 0$, CDF Normal Abramowitz & Stegun 7.1.26, Monte Carlo determinista y proyector Guardian) están implementadas con precisión y manejan adecuadamente los casos límite.
- **Integridad de Tipado y Tests (D7)**: `npm test` pasa 100% (94 tests pasando, 2 tests condicionales omitidos intencionalmente en entorno local sin prefijo de ruta). `npm run typecheck` completa con **0 errores** bajo TypeScript estricto. Cero usos de `any` o `@ts-ignore` en todo `src/`. `npm run build` compila con éxito las **182 páginas estáticas SSG**. Se identificaron 20 warnings/errores de ESLint (variables/imports no utilizados y avisos de memoización de React Compiler) que deben ser saneados.
- **Seguridad y Privacidad (D9)**: Tratamiento 100% local en cliente en todas las calculadoras y almacenes de datos (`localStorage`). PostHog configurado con consentimiento estricto, sin grabación de sesión (`disable_session_recording: true`), enmascaramiento total de texto y atributos, y persistencia exclusiva en `localStorage` (cero cookies). Todo `dangerouslySetInnerHTML` está estrictamente restringido a metadatos estructurados JSON-LD sanitizados.
- **Consistencia de Datos y Motor Demo (D13)**: Motor determinista gobernado por PRNG `mulberry32` con semilla fija (20260716). Fechas e índices de tiempo manejados estrictamente en UTC para prevenir desajustes de hidratación (#418 / #423) validados bajo tres husos horarios (`tests/husos.test.ts`). Persistencia reactiva en `demoStore.ts` mediante `useSyncExternalStore` con síntesis determinista de campos derivados.

---

## 1. Dimensión D1: Exactitud Matemática y Cuantitativa

### 1.1 Fórmulas en `src/lib/trading/data.ts` y Herramientas

| Métrica / Herramienta | Ubicación en Código | Definición Matemática Implementada | Verificación y Casos Límite |
| :--- | :--- | :--- | :--- |
| **Sharpe Ratio** | `data.ts:405` | $\text{Sharpe} = \frac{\mu - R_f}{\sigma} \times \sqrt{\text{trades\_per\_year}}$ con $R_f = 0$, $\text{trades\_per\_year} = \frac{n \times 365.25}{\text{spanDays}}$ | Si $\sigma = 0$ o $n \le 1$, devuelve $0$ de forma segura. Anualización ajustada al tramo real del calendario en días naturales. |
| **Sortino Ratio (MAR = 0)** | `data.ts:406` | $\text{Sortino} = \frac{\mu}{\sigma_{\text{downside}}} \times \sqrt{\text{trades\_per\_year}}$ donde $\sigma_{\text{downside}} = \sqrt{\frac{1}{n}\sum_{r < 0} r^2}$ | Semidesviación calculada contra umbral $T = 0$. Si no hay operaciones perdedoras ($\sigma_{\text{downside}} = 0$), devuelve $0$ sin provocar división por cero ni `Infinity`. |
| **Calmar Ratio** | `data.ts:416` | $\text{Calmar} = \frac{\text{CAGR}}{\|\text{MaxDD}_{\%}\|}$ donde $\text{CAGR} = \left(\frac{\text{Bal}_{\text{final}}}{\text{Bal}_{\text{inicial}}}\right)^{1/\text{years}} - 1$, $\text{years} = \frac{\text{spanDays}}{365.25}$ | Si $\text{MaxDD}_{\%} = 0$ o $\text{Bal} \le 0$, devuelve $0$. Base temporal exacta en años solares medios ($365.25\text{ d}$). |
| **Profit Factor** | `data.ts:459` | $\text{PF} = \frac{\sum \text{Ganancias}}{\sum \|\text{Pérdidas}\|}$ | Fallback seguro: si $\sum \|\text{Pérdidas}\| = 0$, devuelve $\sum \text{Ganancias}$. Coherente con signo de P&L neto. |
| **Expectancy en R** | `data.ts:377`, `EdgeSignificanceChecker:49` | $E(R) = \frac{1}{n}\sum R_i \equiv (\text{WR} \times \bar{W}_R) - ((1-\text{WR}) \times \bar{L}_R)$ | Coincidencia exacta entre el cálculo empírico por operación en el motor y la formulación paramétrica de las calculadoras. |
| **Criterio de Kelly** | `RiskCalculator:80-86` | $f^* = \max\left(0, \frac{p \cdot b - q}{b}\right) \times 100$, Medio Kelly $= \frac{f^*}{2}$, Cuarto Kelly $= \frac{f^*}{4}$ | Clamping estricto: Si $f^* \le 0$ (esperanza negativa o nula), devuelve $0\%$ ("Sin ventaja · No operar"). Si $f^* > 0$, Medio/Cuarto Kelly se acotan a $[0.25\%, 3.0\%]$. |
| **Test Binomial (CDF Normal)** | `EdgeSignificanceChecker:336-347` | $z = \frac{k - n p_0}{\sqrt{n p_0 (1-p_0)}}$, $p = 2(1 - \Phi(\|z\|))$ vía Abramowitz & Stegun 7.1.26 | Guarda $n p_0(1-p_0) \ge 5$ ($N \ge 20$ con $p_0=0.5$). Error de aproximación de $\text{erf}(z) \le 1.5 \times 10^{-7}$. Simetría $\Phi(z) + \Phi(-z) = 1$ validada en tests. |
| **Simulador Monte Carlo** | `RMultipleSimulator:62-126` | 300 caminos de $N$ operaciones, muestreo Bernoulli($\text{WR}$), riesgo compuesto sobre balance | PRNG determinista `mulberry32(seed * 7919 + 1)`. Bandas P10/P50/P90, probabilidad empírica de ruina ($\text{Bal} \le 0$) y de doblar cuenta ($\text{Bal} \ge 2\text{Bal}_0$). |
| **Guardian Recovery Plan** | `DisciplineCost:398-423` | $\text{Gap} = E_{\text{in-plan}} - E_{\text{off-plan}}$, $\text{Fuga} = N_{\text{off-plan}} \times \text{Gap}$, Ahorro $60\%$, Amortización $=\lceil\frac{149}{\text{Ahorro}/30}\rceil\text{ días}$ | Aritmética determinista transparente, vinculando el coste de indisciplina con el retorno de inversión de la licencia. |

### 1.2 Auditoría de Casos Límite
- **Muestra Vacía ($n = 0$)**: `computeMetrics([])` inicializa $n=0$, $\text{netPnl}=0$, $\text{winRate}=0$, $\text{expectancy}=0$, $\text{sharpe}=0$, $\text{sortino}=0$, $\text{calmar}=0$, $\text{equityCurve}=[]$, sin excepciones en tiempo de ejecución.
- **Muestra Unitaria ($n = 1$)**: `spanMs = 1`, `sd = 0` $\rightarrow$ `sharpe = 0`, `sortino = 0`, `calmar = 0`.
- **100% Ganadoras (Cero Pérdidas)**: `grossLoss = 0` $\rightarrow$ `profitFactor = grossWin`, `downside = 0` $\rightarrow$ `sortino = 0` (protegido contra división por cero).
- **100% Perdedoras (Cero Ganancias)**: `grossWin = 0` $\rightarrow$ `profitFactor = 0`, `winRate = 0`, `expectancy` negativo.
- **Drawdown Plano ($\text{maxDdPct} = 0$)**: `calmar = 0`, `recoveryFactor = 0` (protegido contra división por cero).

---

## 2. Dimensión D7: Integridad de Tipado y Suite de Pruebas

### 2.1 Resultados de Ejecución de Comandos Base

```
> vitest run
Test Files  10 passed (10)
     Tests  94 passed | 2 skipped (96)
  Duration  931ms
```

```
> tsc --noEmit
Exit code: 0 (Cero errores)
```

```
> next build && node scripts/postbuild.mjs
✓ Compiled successfully in 5.7s
✓ Generating static pages using 23 workers (182/182) in 4.5s
[postbuild] lang="en" aplicado a 77 de 77 páginas inglesas.
[postbuild] 356 fichero(s) de precarga copiados con el nombre que pide el navegador.
[postbuild] tarjetas sociales: 20 imagen(es) servidas también como .png, 157 página(s) reescritas, 144 que no tenían imagen ya la tienen.
Exit code: 0
```

### 2.2 Inventario de Archivos de Prueba
1. `tests/capturas.test.ts` (6 tests): Integridad de rutas y existencia física de capturas WebP en `public/img/`.
2. `tests/metricas.test.ts` (24 tests): Determinismo del motor, invariantes estadísticas, distribución R-múltiplo, CDF Normal (Abramowitz & Stegun 7.1.26), Sortino MAR=0, Calmar anualizado 365.25d y Criterio de Kelly.
3. `tests/atlas.test.ts` (9 tests): Determinismo SVG del mapa del grabado de fondo (`EngravedAtlas`).
4. `tests/tipografias.test.ts` (6 tests): Carga de fuentes locales/Google y pesos CSS.
5. `tests/css.test.ts` (2 tests): Conformidad de variables CSS `--tj-*`, `--surface-*` y `--text-*`.
6. `tests/grabado.test.ts` (15 tests): Consistencia de renderizado de elementos grabados y contraste.
7. `tests/contratos.test.ts` (18 tests): Paridad de contratos de datos y consistencia de terminología.
8. `tests/vocabulario.test.ts` (4 tests): Ausencia de anglicismos espurios en español y precisión en inglés.
9. `tests/prefijo-despliegue.test.ts` (10 tests, 2 skipped): Gestión de `basePath` y prefijos en enlaces/assets.
10. `tests/husos.test.ts` (2 tests): Idempotencia de métricas, mapa de calor y calendario bajo 3 husos horarios en UTC.

### 2.3 Auditoría de Tipado Estricto (`any` y `@ts-ignore`)
- Búsqueda con expresión regular de `@ts-ignore`, `@ts-expect-error`, `: any`, `as any`: **0 instancias encontradas en `src/`**.
- La base de código respeta tipos TypeScript estrictos (`strict: true`) en todos sus módulos.

### 2.4 Hallazgos de ESLint (20 errores detectados)
Se ejecutó `npm run lint` revelando 20 incidencias a resolver:
1. `src/components/beta/TraderProfilePage.tsx:4`: Import no utilizado `Layers`.
2. `src/components/charts/TradeCandleChart.tsx:3,6,7`: Imports no utilizados `useRef`, `fmtNum`, `Crosshair`.
3. `src/components/demo/TradeCompareModal.tsx:5,8,20,21`: Imports no utilizados `fmtNum`, `pnlTone`, `ArrowRight`, `CheckCircle2`, `AlertTriangle`, `ShieldCheck` y variables `isWinA`, `isWinB`.
4. `src/components/demo/pages/TradesPage.tsx:662,682,705`: Advertencias del compilador de React respecto a preservación de memoización manual en hooks `useMemo`.
5. `src/components/marketing/HeroCockpit.tsx:3,5,32`: Imports no utilizados `useMemo`, `Terminal`, `Lock` y variable `simulatedCount`.
6. `src/components/marketing/RiskCalculator.tsx:19`: Variable auxiliar no utilizada `riskAt`.

### 2.5 Brechas de Testing Identificadas
- Falta test unitario dedicado para las funciones de `demoStore.ts` (guardado, actualización, borrado, reseteo a muestra y síntesis `customTradeToTrade`).
- Falta test unitario específico para el proyector de capital compuesto determinista (`EquityProjector`) y el simulador de ahorro (`SavingsCalculator`).
- Falta test unitario formal para los casos extremos $n=0$, $n=1$, $100\%$ ganancias y $100\%$ pérdidas en `computeMetrics`.

---

## 3. Dimensión D9: Seguridad, Privacidad y Tratamiento Local de Datos

### 3.1 Procesamiento 100% Local en Cliente
- Todas las herramientas interactivas (`RiskCalculator`, `EdgeSignificanceChecker`, `RMultipleSimulator`, `EquityProjector`, `DisciplineCost`, `SavingsCalculator`, `SessionClock`) operan exclusivamente en memoria del navegador del usuario.
- Cero llamadas a APIs externas de telemetría de trading, cero envío de parámetros de balance, riesgo o notas de operativa a servidores de terceros.
- Almacenamiento local del diario de demo mediante la clave `tj-demo-trades` en `localStorage`, garantizando total confidencialidad.

### 3.2 PostHog y Gestión Estricta de Consentimiento (`consent.ts` / `PostHog.tsx`)
- Integración condicionada a `analyticsAllowed()`: Si el usuario no ha otorgado consentimiento explícito (`"accepted"`), la librería PostHog no se carga o ejecuta `opt_out_capturing()`.
- Configuración de privacidad endurecida:
  ```typescript
  posthog?.init?.(POSTHOG_KEY, {
    api_host: "https://eu.i.posthog.com",
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true, // Grabación de sesión APAGADA
    mask_all_text: true,             // Enmascaramiento de todo texto
    mask_all_element_attributes: true,
    persistence: "localStorage",     // Cero cookies
  });
  ```
- Cumplimiento RGPD: La función `reopenConsent()` permite reabrir el selector de privacidad en cualquier momento desde el pie de página para revocar el consentimiento inmediatamente.

### 3.3 Auditoría de `dangerouslySetInnerHTML`
- Se auditaron las 50+ apariciones de `dangerouslySetInnerHTML` en la carpeta `src/app/`.
- El 100% corresponde a etiquetas `<script type="application/ld+json">` con `JSON.stringify(...)` para esquemas de datos estructurados (Schema.org: `Organization`, `WebSite`, `SoftwareApplication`, `Product`, `FAQPage`, `Article`, `DefinedTerm`, `BreadcrumbList`, `Quiz`).
- Cero inyecciones de HTML dinámico o contenido de usuario sin sanitizar.

### 3.4 Gestión de Dependencias
- Gestor de paquetes oficial: `bun@1.3.14` con archivo de bloqueo inmutable `bun.lock`.
- No se detectan dependencias obsoletas con vulnerabilidades críticas en el runtime estático SSG.

---

## 4. Dimensión D13: Consistencia de Datos y Motor Demo

### 4.1 Generador de Datos Determinista (`data.ts`)
- Utiliza el PRNG de 32 bits `mulberry32` con semilla fija `20260716`.
- Genera un catálogo inmutable de 200 operaciones realistas (~1.1 trades/día hábil en 180 días) distribuidas en 9 instrumentos, 5 setups ("Breakout", "Pullback", "Reversal", "Trend", "Range") y 3 sesiones ("London", "NY", "Asia").
- Métricas nominales resultantes: Win Rate 50.5%, Payoff 1.48, Profit Factor 1.51, Expectancy +0.23R (+22.84 $), Max DD 10.0%, Sharpe anualizado 3.34.

### 4.2 Determinismo Temporal e Idempotencia en Zonas Horarias
- Todas las operaciones de demo asignan sus marcas temporales `openedAt` y `closedAt` en **horas UTC estrictas** (`setUTCHours`, `getUTCDay`, `getUTCHours`, `getUTCMonth`).
- Esto elimina desajustes de hidratación (React hydration errors #418 / #423) entre la compilación en servidor UTC y la visualización en el navegador del cliente en cualquier parte del mundo.
- Validado por `tests/husos.test.ts`, asegurando idénticos resultados en Tokyo (UTC+9), Londres (UTC+0) y Nueva York (UTC-5).

### 4.3 Arquitectura de Persistencia y Sincronización (`demoStore.ts`)
- Permite al usuario registrar operaciones adicionales en el navegador (`DEMO_TRADES_KEY = "tj-demo-trades"`).
- Emplea `useSyncExternalStore` con gestión de eventos personalizados (`tj-demo-trades-changed`) y eventos `storage` entre pestañas, con invalidación de caché de instantáneas antes de emitir eventos para evitar desfases de montaje.
- Función de síntesis `customTradeToTrade`: Deduce campos cuantitativos omitidos por el formulario de registro (`riskUsd`, `fees`, `grossPnl`, `plannedRr`, `mae`, `mfe`, `initialStop`, `target`, `durationMin`, `session`) de manera determinista basada en el `id` y `rMultiple`, permitiendo que las operaciones del usuario se integren perfectamente en todos los gráficos (histogramas, scatter MAE/MFE, calendario, curvas de balance) sin provocar valores nulos o gráficos incompletos.

---

## Conclusiones y Próximos Pasos Recomendados

1. **Exactitud Cuantitativa**: El motor matemático y los 7 componentes interactivos son sólidos y cumplen con los estándares institucionales. Se sugiere incorporar tests unitarios formales para los casos límite ($n=0, 1$, $100\%$ wins, $100\%$ losses) y para la síntesis de `demoStore.ts`.
2. **Higiene de Código**: Saneamiento de los 20 warnings/errores de ESLint (eliminación de imports no utilizados en `TraderProfilePage.tsx`, `TradeCandleChart.tsx`, `TradeCompareModal.tsx`, `HeroCockpit.tsx`, `RiskCalculator.tsx` y ajuste de dependencias de `useMemo` en `TradesPage.tsx`).
3. **Seguridad y Privacidad**: Excelente postura de seguridad con procesamiento 100% en cliente, cumplimiento RGPD completo y uso seguro de JSON-LD.
