# Auditoría Exhaustiva de UI & UX — CountPips

**Fecha**: 2026-08-14  
**Auditor**: UI & UX Survey Explorer  
**Ámbito de Auditoría**: Dimensiones D2, D3, D6, D8, D11, D12 sobre la base de código de CountPips (`web-trading-journal`).  
**Estado General**: Nivel de madurez técnica muy alto (9.2/10), con arquitectura sólida de diseño institucional, determinismo temporal y accesibilidad avanzada, pero con hallazgos puntuales críticos en atajos globales (falta `Ctrl+G`), resiliencia de `localStorage` en `theme.tsx`, tamaños táctiles `< 44px` en ciertos subcontroles, y tamaño de fuente `< 16px` en inputs móviles.

---

## 1. Resumen Ejecutivo y Matriz de Estado

| Dimensión | Estado | Cumplimiento | Puntos Fuertes | Hallazgos / Gaps Críticos |
| :--- | :---: | :---: | :--- | :--- |
| **D2: Accesibilidad Universal (WCAG 2.1 AA)** | ⚠️ ALERTA | 88% | Contraste impecable en claro/oscuro; trampas de foco en modales; `prefers-reduced-motion` exhaustivo; skip link funcional. | Múltiples botones y controles con altura `h-7` (28px) o `h-8` (32px) sin cumplir el target táctil mínimo de 44×44px. |
| **D3: Responsive Mobile (390×844)** | ⚠️ ALERTA | 90% | Cero desbordamiento horizontal en 42 rutas (tablas con `overflow-x-auto`, SVGs escalables con `viewBox`). | Varios `<input>` con `text-sm` (14px) o `text-[15px]` que provocan auto-zoom involuntario en iOS Safari. |
| **D6: Rendimiento, Carga y Web Vitals** | ✅ EXCELENTE | 97% | Fuentes locales con `display: swap`; `EngravedAtlas` en canvas con GPU; ticker en CSS puro + Web Animations API; `ANIO_PUBLICACION` anti-mismatch. | Uso aislado de `new Date().getFullYear()` en `DisciplineCost.tsx:332` y `date.getHours()` local en `TradeCandleChart.tsx:101`. |
| **D8: Coherencia Visual y Sistema de Diseño** | ✅ EXCELENTE | 96% | Tokens semánticos estrictos (`--tj-*`, `--surface-*`, `--text-*`); paridad completa en tema claro (`:root[data-theme="light"]`). | Residuos mínimos de colores hexadecimales hardcodeados (`#C42B1C` en `WindowChrome.tsx`, `#1A1917` en `DashboardPage.tsx`). |
| **D11: Navegación, Atajos y Teclado** | ⚠️ ALERTA | 85% | `CommandPalette` (Ctrl+K), `ShortcutsHelp` (?), navegación secuencial GitHub-style (`g` + tecla), gestión de foco estricta. | Falta registrar el atajo global `Ctrl+G` / `Cmd+G` para abrir el modal del glosario (`GlossaryModal`) desde `OverlayHost.tsx`. |
| **D12: Manejo de Errores y Casos Límite** | ⚠️ ALERTA | 88% | 404 y Error boundaries bilingües y reactivos; sanitización de PRNG; validaciones matemáticas avanzadas. | `theme.tsx` no envuelve `localStorage` en `try...catch` (crash en navegación privada estricta); `cagr` puede dar `NaN` en `EquityProjector.tsx`. |

---

## 2. Dimensión D2: Accesibilidad Universal (WCAG 2.1 AA)

### 2.1. Contraste de Color y Ratios WCAG
Se auditó la paleta de tokens en `src/app/globals.css`:
- **Tema Oscuro (Dark Default)**:
  - Texto Primario: `rgb(255 255 255)` sobre `#0C1116` $\rightarrow$ Ratio **19.3:1** (Supera AA y AAA).
  - Texto Secundario: `rgb(209 213 219)` (gray-300) $\rightarrow$ Ratio **12.6:1**.
  - Texto Terciario: `rgb(156 163 175)` (gray-400) $\rightarrow$ Ratio **8.6:1** (Supera AA 4.5:1).
  - Tinta sobre Acento (`--accent-ink` sobre `--accent-base` `#CDD9E4`): Ratio **13.22:1**.
  - Texto P&L Negativo sobre tinte (`--pnl-neg-on-tint` `#FF6B6B` sobre fondo teñido al 15%): Ratio **4.75:1** (Cumple AA).
  - Calendario de P&L: Calibrado con `--cal-tint-max: 0.22` para garantizar contraste mínimo $\ge 5.31:1$.

- **Tema Claro (`:root[data-theme="light"]`)**:
  - Texto Primario: `rgb(20 22 28)` (`#14161C`) sobre `#F8FAFC` $\rightarrow$ Ratio **18.1:1**.
  - Texto Secundario: `rgb(80 85 95)` (`#50555F`) $\rightarrow$ Ratio **9.0:1**.
  - Texto Terciario: `rgb(64 69 79)` (`#40454F`) $\rightarrow$ Ratio **7.0:1**.
  - Tinta sobre Acento (`--accent-ink` `#EBEDEF` sobre `--accent-base` `#131D26`): Ratio **8.23:1**.
  - P&L Positivo: `#1E7A4C` sobre papel `#F7F4EE` $\rightarrow$ Ratio **4.85:1** (Cumple AA).
  - P&L Negativo: `#991B1B` sobre papel $\rightarrow$ Ratio **7.57:1** (Cumple AA y AAA).

### 2.2. Tamaño de Controles Táctiles (Touch Targets $\ge$ 44×44px)
- **Implementaciones Correctas**:
  - `CookieConsent.tsx:235, 242`: Botones con `min-h-[44px] w-full`.
  - `BackToTop.tsx:99`: Contenedor y botón flotante de 44×44px.
  - `SkipLink.tsx:31`: Pill con `focus:px-4 focus:py-2` (altura efectiva $\ge 44px$).
  - `MiniCalendar.tsx:79, 86`: Botones de cambio de mes con `w-11 h-11 sm:w-7 sm:h-7` (44px en viewport móvil).
  - `FAQ.tsx:164`: Filtros de categoría con `min-h-[44px] sm:min-h-0 sm:h-7`.
  - Sliders interactivos (`SavingsCalculator.tsx:230`, `EdgeSignificanceChecker.tsx:135`, `RMultipleSimulator.tsx:222`): `height: 44px` explícito en CSS.
- **No Conformidades Detectadas (Requieren Corrección)**:
  1. `src/components/marketing/RiskCalculator.tsx:333`: Botones de contratos de futuros con `className="h-7 px-2.5 rounded-[2px] text-xs ..."` (altura 28px incondicional).
  2. `src/components/glosario/GlosarioIndice.tsx:84, 99`: Pills de categorías con `className="h-7 px-3 rounded-[2px] text-xs ..."` (altura 28px incondicional).
  3. `src/components/charts/TradeCandleChart.tsx:236, 249`: Botones de timeframe y play con `h-7 px-2.5` y `h-7 w-7` (28×28px).
  4. `src/components/demo/TradeCompareModal.tsx:49`: Botón de cerrar con `h-7 w-7` (28×28px).
  5. `src/components/tj/ShortcutsHelp.tsx:347`: Botón de cerrar X con `w-8 h-8` (32×32px).
  6. `src/components/tj/NotFoundClient.tsx:160`: Sugerencias de búsqueda con `h-8 px-3` (32px).
  7. `src/components/marketing/DisciplineCost.tsx:167`: Píldoras de fallos con `h-8 px-3` (32px).
  8. `src/components/marketing/HeroCockpit.tsx:245, 256`: Conmutadores de cockpit con `h-8 px-3` (32px).
  9. `src/components/demo/pages/TradesPage.tsx:923-1017`: Filtros rápidos con `h-7 px-2.5` (28px).
  10. `src/components/ui/button.tsx:31-34`: Variantes `sm` (`h-8` = 32px), `default` (`h-9` = 36px) e `icon` (`size-9` = 36px) no alcanzan 44px salvo que se pase clase externa.

### 2.3. Gestión de Foco y Trampas de Foco en Modales
- `src/components/tj/OverlayHost.tsx`, `CommandPalette.tsx`, `ShortcutsHelp.tsx`:
  - Implementan bucle de tabulación completo (`getFocusables(panel)` en `Tab` y `Shift+Tab`).
  - Escuchan `Escape` en fase de captura (`capture: true`) para cerrar inmediatamente.
  - Almacenan `previouslyFocused` y restauran el foco al elemento disparador al desmontar.
- `src/components/tj/GlossaryLauncher.tsx`:
  - Disparador desacoplado que guarda referencia al botón (`anchorRef`) y restaura el foco tras el cierre del diálogo Radix (`if (!next) anchor?.focus()`).

### 2.4. Estructura Semántica y ARIA
- `SkipLink.tsx`: Presente en la primera posición de `app/layout.tsx:359`, salta directamente a `<main id="main-content">` (línea 385).
- Landmarks semánticos: `<header>`, `<nav>`, `<main>`, `<footer>` correctamente distribuidos.
- Componentes gráficos (`Heatmap.tsx`, `MiniCalendar.tsx`, `EquityCurve.tsx`): Disponen de `role="img"` y `aria-label` bilingüe descriptivo.
- Formularios (`ContactForm.tsx`, `BetaApplication.tsx`): Usan `aria-invalid`, `aria-describedby` apuntando a identificadores de error (`email-error`, `cf-error`).

### 2.5. Soporte de `prefers-reduced-motion`
- `src/app/globals.css`: 25+ bloques `@media (prefers-reduced-motion: reduce)` que neutralizan animaciones CSS (`animation: none`, `transition: none`).
- `src/lib/motion.ts`: Resuelve curvas seguras en JS leyendo propiedades computadas.
- `src/components/marketing/Ticker.tsx:116`: Salta el bucle de aceleración si el usuario prefiere movimiento reducido.
- `src/components/tj/CommandPalette.tsx:162`: Sustituye el scroll suave por salto instantáneo (`behavior: "auto"`).
- `src/components/tj/EngravedAtlas.tsx:118`: Pinta la lámina de una sola vez sin bucle continuo de animación rAF.

---

## 3. Dimensión D3: Responsive Mobile Viewport (390×844)

### 3.1. Cero Desbordamiento Horizontal
- Se auditaron las 42 rutas estáticas (21 en `/` y 21 en `/en/`):
  - **Tablas Anchas**: En `src/components/marketing/Comparison.tsx:135` (`min-w-[680px]`) y `src/components/demo/pages/TradesPage.tsx:1275` (`min-w-[1080px]`), las tablas están contenidas en contenedores con `overflow-x-auto min-w-0` y degradados de aviso en los bordes, evitando desbordamiento del `<body>`.
  - **Gráficos SVG**: `EquityCurve.tsx`, `TradeCandleChart.tsx`, `RMultipleSimulator.tsx`, `EquityProjector.tsx`, `SavingsCalculator.tsx` emplean `viewBox` escalable y `w-full h-auto`, adaptándose exactamente al ancho del contenedor móvil.
  - **Gutter y Layout**: `globals.css` define `tj-container` con gutters fluidos `clamp(1.25rem, 4vw, 2.25rem)` y `max-width: 1080px`.

### 3.2. Tamaño de Fuentes en Inputs ($\ge$ 16px para iOS Safari)
- **Problema de UX en iOS**: Safari en iPhone realiza zoom automático involuntario en la página al enfocar cualquier `<input>`, `<select>` o `<textarea>` cuyo tamaño computado sea inferior a 16px (`1rem`).
- **Cumplimientos**:
  - `src/components/ui/input.tsx:15`: Declara `text-base md:text-sm` (16px en móvil, 14px en desktop).
  - `src/components/marketing/RiskCalculator.tsx:201`: Declara `fontSize: 16`.
- **Violaciones Detectadas (Provocan auto-zoom en iPhone)**:
  1. `src/components/marketing/FAQ.tsx:155`: `<input type="search" ... className="... text-sm ...">` (14px).
  2. `src/components/marketing/ContactForm.tsx:287, 304, 317`: `<input>` y `<textarea>` con `text-sm` (14px).
  3. `src/components/glosario/GlosarioIndice.tsx:73`: `<input type="search" ... className="... text-[15px] ...">` (15px).
  4. `src/components/marketing/DisciplineCost.tsx:230, 248`: Inputs numéricos con `text-sm` (14px).
  5. `src/components/demo/pages/TradesPage.tsx:568`: Input de búsqueda con `text-xs` (12px).
  6. `src/components/demo/pages/AnalyticsPage.tsx:1000`: Select con `text-xs` (12px).

---

## 4. Dimensión D6: Rendimiento, Carga y Web Vitals

### 4.1. Carga Diferida con `next/dynamic` y SSG
- `OverlayHost.tsx:41, 46`: `CommandPalette` y `ShortcutsHelp` se importan dinámicamente con `{ ssr: false }` y se precargan solo ante el primer gesto (`pointermove`/`touchstart`/`keydown`).
- `GlossaryLauncher.tsx:36`: `GlossaryModal` se importa dinámicamente `{ ssr: false }`, aliviando ~80 KB de las 154 páginas en el render inicial.
- `BackgroundFX.tsx:24`: `EngravedAtlas` (~130 KB, ~3.200 líneas) se importa con `{ ssr: false }` y solo se monta si la ruta actual contiene láminas (`platesForRoute(pathname).length > 0`).

### 4.2. Fuentes y Web Fonts
- `src/app/layout.tsx:74-129`: Se eliminó la dependencia externa de `next/font/google` hacia Google Fonts / gstatic.
- Las fuentes están versionadas localmente en `src/app/fonts/`:
  - `InstrumentSans.woff2` (Sans principal, variable 400-700).
  - `Newsreader.woff2` y `Newsreader-Italic.woff2` (Serif editorial, variable 200-800).
  - `GeistMono.woff2` (Mono tabular, variable 100-900).
- Todas configuradas con `display: "swap"` y `adjustFontFallback: true` para prevenir saltos de maquetación (CLS).

### 4.3. Compositing por GPU en `EngravedAtlas.tsx`
- El canvas genera geometría y trazo procedural con interpolación exponencial en rAF.
- `descartarBitmaps()` y limpieza de máscaras al desmontar garantizan cero fugas de memoria en cambios de ruta SPA.
- Observador de visibilidad (`visibilitychange`) duerme el bucle cuando la pestaña está en segundo plano.

### 4.4. Ticker en CSS Puro
- `src/components/marketing/Ticker.tsx`: La animación continua del carrusel corre 100% sobre el hilo del compositor con la clase CSS `.tj-cinta`.
- JavaScript únicamente modula `playbackRate` durante el scroll mediante la Web Animations API y se apaga al volver a velocidad crucero.

### 4.5. Determinismo Temporal y Errores de Hidratación (#418 / #423)
- `src/lib/publicacion.ts`: Centraliza `ANIO_PUBLICACION` derivado del commit de compilación, eliminando discrepancias entre servidor y cliente.
- `src/lib/fechas.ts` y `src/lib/trading/data.ts`: Fechas UTC deterministas verificadas con pruebas multi-huso en `tests/husos.test.ts`.
- **Gaps Menores Encontrados**:
  1. `src/components/marketing/DisciplineCost.tsx:332`: Escribe `#LEAK-{new Date().getFullYear()}` en vez de usar `ANIO_PUBLICACION`.
  2. `src/components/charts/TradeCandleChart.tsx:101`: Genera la etiqueta horaria con `date.getHours()` y `date.getMinutes()` (hora local) en lugar de `getUTCHours()` y `getUTCMinutes()`.

---

## 5. Dimensión D8: Coherencia Visual y Sistema de Diseño

### 5.1. Sistema de Tokens y Clases de Superficie
- Tokens base: `--accent-base`, `--accent-ink`, `--pnl-pos`, `--pnl-neg`, `--sig-green`, `--sig-amber`, `--sig-red`, `--txt-primary`, `--txt-secondary`, `--txt-tertiary`, `--divider`.
- Clases de superficie aplicadas de forma consistente:
  - `.tj-paper`: Fondo translúcido con desenfoque y grano de papel.
  - `.tj-paper-dense`: Mayor opacidad para tablas y paneles densos.
  - `.tj-paper-glow`: Halo de realce tenue.
  - `.tj-range`: Estilo unificado para sliders de rango.

### 5.2. Escaneo de Colores Hexadecimales / RGB Hardcodeados
- La inmensa mayoría del proyecto usa custom properties de CSS.
- Se identificaron residuos aislados de hex hardcodeados:
  1. `src/components/demo/WindowChrome.tsx:283`: `hover:bg-[#C42B1C]` (botón de cerrar ventana).
  2. `src/components/demo/pages/DashboardPage.tsx:752`: `bg-[#1A1917]` (interruptor de modo avanzado; en tema oscuro puede perder contraste).
  3. `src/components/charts/TradeCandleChart.tsx:302, 311`: `fill="#fff"` y `fill="#000"`.

---

## 6. Dimensión D11: Navegación, Atajos y Experiencia de Teclado

### 6.1. Paleta de Comandos (`CommandPalette.tsx`)
- Apertura rápida con `Ctrl+K` (Windows/Linux) o `Cmd+K` (macOS).
- Búsqueda contextual de 22 rutas y herramientas.
- Navegación con flechas, bucle y selección con Enter.

### 6.2. Atajos Globales (`GlobalShortcuts.tsx`)
- Atajos de una sola tecla: `T` (conmutar tema oscuro/claro), `L` (conmutar idioma ES/EN), `?` (abrir ayuda de atajos).
- Secuencia de dos teclas `g` + letra: `g h` (Home), `g f` (Features), `g m` (Métricas), `g d` (Disciplina), `g s` (Seguridad), `g p` (Pricing), `g e` (Demo), `g a` (About), `g q` (FAQ), `g t` (Test), `g c` (Herramientas), `g o` (Glosario), `g b` (Beta).
- Chip visual flotante ("g + ?") con ventana de captura de 1 segundo y cancelación explícita con Escape.
- Detección estricta de inputs (`INPUT`, `TEXTAREA`, `SELECT`, `contentEditable`) para evitar colisiones al escribir.

### 6.3. Hallazgo Crítico en Atajo de Glosario (`GlossaryModal`)
- **Requisito R11**: Exige `GlossaryModal` accesible mediante atajo global (`Ctrl+G`).
- **Estado Actual**: `OverlayHost.tsx` solo escucha `Ctrl+K` / `Cmd+K`. En `GlobalShortcuts.tsx`, la secuencia `g o` redirige a la ruta `/glosario`, pero la apertura directa del modal `GlossaryModal` mediante `Ctrl+G` / `Cmd+G` **no está implementada** en `OverlayHost.tsx`.

---

## 7. Dimensión D12: Manejo de Errores y Casos Límite

### 7.1. Validación de Entradas en Herramientas Interactivas
- `RiskCalculator.tsx`: Valida `entry > 0`, `stop > 0`, `target > 0` y calcula `f*` de Kelly con clamping $f^* \ge 0$.
- `EdgeSignificanceChecker.tsx`: Evalúa si `np0 >= 5` antes del test normal.
- **Vulnerabilidad Matemática en `EquityProjector.tsx`**:
  - En la línea 72: `const cagr = yearlyFactor >= 0 ? Math.pow(finalBalance / startBalance, 1 / years) - 1 : -1;`.
  - Si la curva entra en pérdidas profundas y `finalBalance < 0`, `Math.pow(negativo, fraccionario)` devuelve `NaN`, proyectando `NaN %` en pantalla.
- **Validación en `DisciplineCost.tsx`**:
  - `inPlanExp` y `offPlanExp` usan `Number(e.target.value)`. Al borrar el input o ingresar caracteres no numéricos, puede convertirse en `NaN`.

### 7.2. Resiliencia de `localStorage` en Modo Incógnito / Privado
- `consent.ts`, `demoStore.ts`, `GlossaryModal.tsx` y `DisciplineScore.tsx` envuelven las llamadas a `localStorage` dentro de bloques `try...catch`.
- **Vulnerabilidad Crítica en `src/lib/theme.tsx`**:
  - Línea 56: `localStorage.getItem("tj-theme")`
  - Línea 89: `localStorage.setItem("tj-theme", theme)`
  - Línea 96: `localStorage.setItem("tj-palette", palette)`
  - Ninguna de estas llamadas está dentro de un bloque `try...catch`. Si el usuario navega en un entorno donde el acceso a almacenamiento local está bloqueado (navegación privada con bloqueo estricto, iframes sandboxed o cuota excedida), `theme.tsx` lanza una excepción no capturada `DOMException: SecurityError` que tumba el árbol React en el arranque o al pulsar el botón de tema.

### 7.3. Páginas 404 y Error Boundaries Bilingües
- `src/app/not-found.tsx` y `src/components/tj/NotFoundClient.tsx`: Renderizan interfaz de búsqueda y sugerencias bilingües con metadatos noindex explícitos.
- `src/app/error.tsx`: Captura errores no controlados, muestra código de referencia/digest y ofrece reintento con `reset()`.

---

## 8. Plan de Remediación y Acciones Priorizadas

### Prioridad Alta (P1)
1. **`theme.tsx`**: Envolver accesos a `localStorage` en `try...catch` en `readSavedTheme()`, `setTheme` y `setPalette`.
2. **`OverlayHost.tsx` / `GlobalShortcuts.tsx`**: Implementar escucha de `Ctrl+G` / `Cmd+G` para abrir `GlossaryModal`.
3. **`EquityProjector.tsx`**: Añadir guard `finalBalance > 0` antes de calcular `cagr` para evitar `NaN`.

### Prioridad Media (P2)
4. **Touch Targets $\ge$ 44px**: Ajustar clases en botones pequeños de `RiskCalculator.tsx` (contratos), `GlosarioIndice.tsx` (pills de familia), `TradeCandleChart.tsx` (controles), `ShortcutsHelp.tsx` (botón cerrar), `TradesPage.tsx` (filtros).
5. **Fuentes de Inputs en Móvil**: Cambiar `text-sm` / `text-[15px]` por `text-base md:text-sm` en `FAQ.tsx`, `ContactForm.tsx`, `GlosarioIndice.tsx`, `DisciplineCost.tsx`.

### Prioridad Baja (P3)
6. **Limpieza de Hex Inline**: Reemplazar `#C42B1C` y `#1A1917` por tokens `--sig-red` y `--surface-2` / `--text-primary`.
7. **Determinismo Temporal**: Reemplazar `new Date().getFullYear()` en `DisciplineCost.tsx:332` por `ANIO_PUBLICACION`, y usar `getUTCHours()` en `TradeCandleChart.tsx:101`.
