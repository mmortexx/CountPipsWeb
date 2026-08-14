# Informe de Exploración (Handoff Report) — Milestone 1: Features 4 y 5

**Autor**: Explorer 3 (M1)  
**Destinatario**: Orchestrator M1 (`5c47d07f-8b2d-4047-aa81-85801a9bd3bb`)  
**Fecha**: 2026-08-14  
**Alcance**: 
- **Feature 4 (D8 - Coherencia Visual & Pureza de Tokens de Diseño)**: Sustitución de colores hexadecimales inline en `WindowChrome.tsx:283` y `DashboardPage.tsx:752`.
- **Feature 5 (D6 - Determinismo Temporal & Hidratación SSG)**: Sustitución de `new Date().getFullYear()` en `DisciplineCost.tsx:332` y tratamiento de horas en UTC en `TradeCandleChart.tsx:101`.

---

## 1. Observation (Observaciones Directas)

### 1.1. Feature 4: Colores Hexadecimales Inline (D8)

#### A. `WindowChrome.tsx` (Línea 283)
- **Ruta del archivo**: `src/components/demo/WindowChrome.tsx`
- **Contexto (L277-290)**:
  ```tsx
  277:         <button
  278:           type="button"
  279:           aria-label={t("winClose")}
  280:           onClick={() => {
  281:             if (fullscreen) setFullscreen(false);
  282:           }}
  283:           className="w-11 sm:w-[46px] h-full flex items-center justify-center text-tertiary hover:bg-[#C42B1C] hover:text-white transition-colors duration-150"
  284:         >
  285:           <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
  286:             <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
  287:             <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
  288:           </svg>
  289:         </button>
  ```
- **Hallazgo**: `hover:bg-[#C42B1C]` utiliza un valor hexadecimal hardcodeado (`#C42B1C`, rojo de cierre de ventana de Windows 11) en lugar de tokens semánticos definidos en `globals.css` (`--color-pnl-neg`, `--color-destructive`, o `--color-signal-red`).
- **Comentario asociado (L202)**: `* el de cerrar vira al rojo #C42B1C. Maximizar alterna el modo pantalla`.

#### B. `DashboardPage.tsx` (Línea 752)
- **Ruta del archivo**: `src/components/demo/pages/DashboardPage.tsx`
- **Contexto (L742-755)**:
  ```tsx
  742:                     <span
  743:                       aria-hidden="true"
  744:                       className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
  745:                         advanced
  746:                           ? "bg-[rgb(var(--accent-base))]"
  747:                           : "bg-[rgb(var(--divider)/0.15)]"
  748:                       } peer-focus-visible:ring-2 peer-focus-visible:ring-[rgb(var(--accent-base)/0.5)]`}
  749:                     >
  750:                       <span
  751:                         className={`absolute top-[3px] w-3.5 h-3.5 rounded-full transition-[left] ${
  752:                           advanced ? "left-[19px] bg-[#1A1917]" : "left-[3px] bg-[rgb(var(--txt-secondary))]"
  753:                         }`}
  754:                       />
  755:                     </span>
  ```
- **Hallazgo**: `advanced ? "left-[19px] bg-[#1A1917]" : "left-[3px] bg-[rgb(var(--txt-secondary))]"` fija `bg-[#1A1917]` de forma rígida. Cuando `advanced` está activo, el fondo de la pista es `bg-[rgb(var(--accent-base))]`. En temas claros o variantes de paleta, `#1A1917` no responde a la inversión de color del acento ni a las custom properties del sistema.
- **Tokens de referencia**: En `src/app/globals.css`, `--accent-ink` está definido en `:root` (L196: `12 17 22`) y en temas claros (L328: `235 237 239`, L3225: `238 240 243`). Otros componentes (como `JournalPage.tsx:835`: `on ? "bg-[rgb(var(--accent-ink))]" : "bg-[rgb(var(--txt-primary))]"` y `Pricing.tsx:298`: `color: "rgb(var(--accent-ink))"`) ya utilizan este token para elementos sobre `--accent-base`.

---

### 1.2. Feature 5: Determinismo Temporal e Hidratación SSG (D6)

#### A. `DisciplineCost.tsx` (Línea 332)
- **Ruta del archivo**: `src/components/marketing/DisciplineCost.tsx`
- **Contexto (L329-334)**:
  ```tsx
  329:               <span
  330:                 className="tnum text-[10px] px-2.5 py-1 rounded-[2px] bg-[rgb(var(--pnl-neg)/0.14)] text-[rgb(var(--pnl-neg))] border border-[rgb(var(--pnl-neg)/0.28)] font-mono self-start sm:self-auto"
  331:               >
  332:                 #LEAK-{new Date().getFullYear()}
  333:               </span>
  ```
- **Hallazgo**: La interpolación `#LEAK-{new Date().getFullYear()}` evalúa el reloj local del cliente en tiempo de ejecución. Esto viola el determinismo SSG e introduce discrepancias entre el HTML compilado en el servidor y el renderizado tras la hidratación en el cliente, arriesgando `Minified React error #418`.
- **Módulo de referencia**: `src/lib/publicacion.ts` exporta `export const ANIO_PUBLICACION: string = process.env.NEXT_PUBLIC_ANIO_PUBLICACION || "2026";` expresamente creado para este propósito (ver cabecera de `publicacion.ts`).

#### B. `TradeCandleChart.tsx` (Líneas 100-101)
- **Ruta del archivo**: `src/components/charts/TradeCandleChart.tsx`
- **Contexto (L100-103)**:
  ```tsx
  100:       const date = new Date(trade.openedAt.getTime() + (i - entryIdx) * (timeframe === "1m" ? 60000 : timeframe === "5m" ? 300000 : 900000));
  101:       const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  102: 
  103:       list.push({ time, open: o, high: h, low: l, close: c, volume: vol, ma, vwap });
  ```
- **Hallazgo**: `date.getHours()` y `date.getMinutes()` obtienen la hora en el huso horario local de la máquina del usuario. Dado que todas las operaciones del diario se fechan y visualizan en hora UTC (`src/lib/trading/format.ts:113-153`, `src/lib/trading/data.ts`, `tests/husos.test.ts`), esto provoca desfases entre la hora mostrada en la barra del gráfico y las fechas UTC del resto de la interfaz (desfases de varias horas según el huso horario del cliente).

---

## 2. Logic Chain (Cadena Lógica)

1. **Pureza de Tokens en `WindowChrome.tsx:283`**:
   - `WindowChrome.tsx` es una recreación de la barra de título de Windows 11.
   - El botón de cierre en hover se vuelve rojo. Actualmente tiene `hover:bg-[#C42B1C] hover:text-white`.
   - En `src/app/globals.css`, el sistema de diseño de CountPips expone `--color-pnl-neg: rgb(var(--pnl-neg))` y `--color-destructive: var(--destructive)`.
   - `WindowChrome.tsx` ya usa `bg-pnl-pos` y `bg-pnl-neg` (líneas 152 y 311).
   - Sustituir `hover:bg-[#C42B1C]` por `hover:bg-pnl-neg` (o `hover:bg-destructive hover:text-destructive-foreground`) elimina la dependencia de un color literal fijo y unifica la gestión de color con el tema de la aplicación.

2. **Contraste de Switch en `DashboardPage.tsx:752`**:
   - El interruptor "Modo avanzado" utiliza una pista que cuando `advanced` es `true` toma el color `bg-[rgb(var(--accent-base))]`.
   - La manecilla/píldora interior toma actualmente `bg-[#1A1917]`.
   - En tema claro o en paletas con acento oscuro, `#1A1917` carece de suficiente contraste contra fondos oscuros invertidos.
   - El sistema de diseño CountPips define `--accent-ink` precisamente como la tinta calculada para contrastar sobre `--accent-base` en cualquier tema y paleta (ratio >= 5.96:1 en tema claro y >= 13.22:1 en tema oscuro).
   - Sustituir `bg-[#1A1917]` por `bg-[rgb(var(--accent-ink))]` cumple las directrices WCAG 2.1 AA y sigue el patrón establecido en `JournalPage.tsx:835`.

3. **Determinismo SSG en `DisciplineCost.tsx:332`**:
   - `new Date().getFullYear()` produce un valor dinámico dependiente de la máquina donde se ejecuta.
   - Al compilar en SSG (`next export`), el HTML generado tendrá el año de compilación. Si un usuario abre la página tras un cambio de año, React detecta una discordancia en el nodo de texto y emite un fallo de hidratación (#418).
   - `src/lib/publicacion.ts` define `ANIO_PUBLICACION` de forma centralizada y determinista a partir de los metadatos de compilación del paquete.
   - Importar y usar `ANIO_PUBLICACION` garantiza paridad estricta entre servidor y cliente.

4. **Consistencia UTC en `TradeCandleChart.tsx:101`**:
   - `TradeCandleChart` construye velas sintéticas deterministas a partir de `trade.openedAt`.
   - `date.getHours()` y `date.getMinutes()` devuelven valores en la zona horaria del navegador, rompiendo la convención de visualización en UTC del diario de trading (declarada en `trading/data.ts` y auditada en `tests/husos.test.ts`).
   - Sustituir por `date.getUTCHours()` y `date.getUTCMinutes()` (o `fmtTime(date, lang)`) garantiza que la marca temporal de cada vela coincida exactamente con la sesión de mercado (por ejemplo, Londres o Nueva York en UTC) independientemente de si el usuario está en Madrid, Tokio o Nueva York.

---

## 3. Caveats (Salvedades y Casos Límite)

1. **`WindowChrome.tsx:283` (Variante de Color)**:
   - Se evaluaron tres opciones de token para el rojo de cierre:
     - `hover:bg-pnl-neg hover:text-white` (recomendada: coincide con el resto de `WindowChrome.tsx` y está definida en Tailwind `@theme`).
     - `hover:bg-destructive hover:text-destructive-foreground` (utilizada en `src/components/ui/button.tsx`).
     - `hover:bg-signal-red hover:text-white` (color de semáforo de estado).
   - La opción `hover:bg-pnl-neg hover:text-white` es la más armónica con la paleta de P&L de la demo y los usos existentes en el mismo componente.
2. **`TradeCandleChart.tsx:101` (Padding de minutos y horas)**:
   - `String(date.getUTCHours()).padStart(2, "0") + ":" + String(date.getUTCMinutes()).padStart(2, "0")` produce exactamente el formato `HH:mm` sin dependencias adicionales y con coste mínimo de ejecución en el bucle de 35 velas.

---

## 4. Conclusion (Propuestas Concretas de Código)

A continuación se detallan las modificaciones exactas listas para ser aplicadas por el agente implementador:

### Cambio 1: `src/components/demo/WindowChrome.tsx`
- **Línea 283**:
```diff
--- a/src/components/demo/WindowChrome.tsx
+++ b/src/components/demo/WindowChrome.tsx
@@ -280,7 +280,7 @@ export function WindowChrome() {
           onClick={() => {
             if (fullscreen) setFullscreen(false);
           }}
-          className="w-11 sm:w-[46px] h-full flex items-center justify-center text-tertiary hover:bg-[#C42B1C] hover:text-white transition-colors duration-150"
+          className="w-11 sm:w-[46px] h-full flex items-center justify-center text-tertiary hover:bg-pnl-neg hover:text-white transition-colors duration-150"
         >
```

---

### Cambio 2: `src/components/demo/pages/DashboardPage.tsx`
- **Línea 752**:
```diff
--- a/src/components/demo/pages/DashboardPage.tsx
+++ b/src/components/demo/pages/DashboardPage.tsx
@@ -749,7 +749,7 @@ export function DashboardPage() {
                     >
                       <span
                         className={`absolute top-[3px] w-3.5 h-3.5 rounded-full transition-[left] ${
-                          advanced ? "left-[19px] bg-[#1A1917]" : "left-[3px] bg-[rgb(var(--txt-secondary))]"
+                          advanced ? "left-[19px] bg-[rgb(var(--accent-ink))]" : "left-[3px] bg-[rgb(var(--txt-secondary))]"
                         }`}
                       />
                     </span>
```

---

### Cambio 3: `src/components/marketing/DisciplineCost.tsx`
- **Líneas 4 y 332**:
```diff
--- a/src/components/marketing/DisciplineCost.tsx
+++ b/src/components/marketing/DisciplineCost.tsx
@@ -2,6 +2,7 @@
 
 import { useMemo, useState } from "react";
 import { useLang } from "@/lib/i18n";
+import { ANIO_PUBLICACION } from "@/lib/publicacion";
 import { fmtMoney, fmtNum } from "@/lib/trading/format";
 
 interface MistakeItem {
@@ -329,7 +330,7 @@ export function DisciplineCost() {
               <span
                 className="tnum text-[10px] px-2.5 py-1 rounded-[2px] bg-[rgb(var(--pnl-neg)/0.14)] text-[rgb(var(--pnl-neg))] border border-[rgb(var(--pnl-neg)/0.28)] font-mono self-start sm:self-auto"
               >
-                #LEAK-{new Date().getFullYear()}
+                #LEAK-{ANIO_PUBLICACION}
               </span>
             </div>
```

---

### Cambio 4: `src/components/charts/TradeCandleChart.tsx`
- **Línea 101**:
```diff
--- a/src/components/charts/TradeCandleChart.tsx
+++ b/src/components/charts/TradeCandleChart.tsx
@@ -98,7 +98,7 @@ export function TradeCandleChart({ trade, decimals = 2 }: TradeCandleChartProps
       const vwap = cumVol > 0 ? cumVolPrice / cumVol : c;
 
       const date = new Date(trade.openedAt.getTime() + (i - entryIdx) * (timeframe === "1m" ? 60000 : timeframe === "5m" ? 300000 : 900000));
-      const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
+      const time = `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
 
       list.push({ time, open: o, high: h, low: l, close: c, volume: vol, ma, vwap });
       current = c;
```

---

## 5. Verification Method (Método de Verificación Independiente)

1. **Verificación de Tipos**:
   ```bash
   npm run typecheck
   ```
   *Condición de éxito*: 0 errores de tipado en TypeScript estricto.

2. **Verificación de Suite de Tests**:
   ```bash
   npx vitest run tests/husos.test.ts tests/css.test.ts
   ```
   *Condición de éxito*: Todos los tests de husos horarios y análisis de CSS pasan limpiamente.

3. **Verificación de Inexistencia de Hex Inline en Componentes Demo**:
   Ejecutar búsqueda regex para validar que no queden valores `#HEX` en el código de `src/components/demo`:
   ```bash
   # Comprobar que solo queden comentarios explicativos
   ```

4. **Verificación de Determinismo de Fechas**:
   Ejecutar búsqueda para comprobar que `getFullYear()` no se invoca directamente en ningún componente cliente o SSR:
   ```bash
   # Comprobar que getFullYear() solo aparece en publicacion.ts / fechas.ts
   ```
