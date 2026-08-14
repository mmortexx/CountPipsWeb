# Original User Request

## Initial Request — 2026-08-14T16:00:43Z

Auditoría integral, corrección, optimización y desarrollo continuo de CountPips (sitio web estático de marketing y demo interactiva del diario de trading nativo de Windows) a través de 13 dimensiones de calidad técnica, cuantitativa, de diseño y de accesibilidad.

Working directory: c:\Users\jmqc1\Documents\Cosas\web-trading-journal
Integrity mode: development

## Requirements

### R1. Exactitud Matemática y Cuantitativa (D1)
Auditar y verificar todas las fórmulas financieras y estadísticas en `src/lib/trading/` (Sharpe, Sortino con MAR=0, Calmar con base 365.25d, Profit Factor con Delta Method CI, Expectancy R, Kelly Criterion puro/medio/cuarto con clamping f*=0, test binomial con CDF normal vía Abramowitz & Stegun 7.1.26, simulación Monte Carlo determinista sin reemplazo, proyector de capital y ROI de Guardian Recovery Plan). Probar casos límite (n=0, n=1, 100% aciertos, 100% pérdidas, drawdown plano).

### R2. Accesibilidad Universal WCAG 2.1 AA (D2)
Garantizar touch targets >= 44x44px en todos los controles interactivos, contraste >= 4.5:1 (normal) y >= 3:1 (grande/no-texto) en temas claro y oscuro, focus visible ininterrumpido sin trampas de foco en modales (`OverlayHost`), roles y landmarks semánticos, `aria-label` / `aria-describedby` en formularios e inputs, soporte de `prefers-reduced-motion` y skip links funcionales.

### R3. Responsive Mobile Viewport 390×844 (D3)
Garantizar cero desbordamiento horizontal en las 32 rutas en ambos idiomas (`/` y `/en/`). Tipografía e inputs con tamaño base adecuado (>= 16px para prevenir auto-zoom en iOS Safari). Tablas, gráficos interactivos, megamenú de `Navbar`, modales y la demo interactiva adaptados con degradación elegante.

### R4. Paridad Bilingüe Estricta ES / EN (D4)
Asegurar 100% de paridad en el diccionario `STR` (`src/lib/i18n.tsx`), glosarios (`glosario.ts` vs `glossary.ts`), herramientas (`herramientas.ts`), FAQ (`faq.ts`) y páginas legales. Cero cadenas de texto hardcodeadas. Vocabulario institucional en español sin anglicismos espurios y redacción técnica natural en inglés.

### R5. SEO Técnico y Metadatos (D5)
Validar títulos únicos, descripciones meta <= 160 caracteres, jerarquía estricta de encabezados (`h1` único por página, `h2`, `h3`), canonicals correctos hacia `SITE_URL`, tags `hreflang` bidireccionales ES/EN, OpenGraph y Twitter Cards dinámicos, esquemas JSON-LD (`Organization`, `WebSite`, `SoftwareApplication`) y coherencia en `sitemap.xml` y `robots.txt`.

### R6. Rendimiento, Carga y Web Vitals (D6)
Validar lazy loading con `next/dynamic` sin Suspense boundaries rotos en SSG, optimización de fuentes Google con `display: swap`, compositing por GPU en `EngravedAtlas`, ticker por CSS puro, y cero errores de hidratación (#418 / #423) verificando determinismo temporal en renderizado.

### R7. Integridad de Tipado y Suite de Pruebas (D7)
Garantizar `npm test` al 100% con nuevas pruebas unitarias para cada fórmula o componente auditado, `npm run typecheck` con 0 errores bajo TypeScript estricto, y `npm run build` generando 182+ páginas SSG limpias sin warnings. Justificar formalmente cualquier test omitido y eliminar `any` o `@ts-ignore` no justificados.

### R8. Coherencia Visual y Sistema de Diseño (D8)
Asegurar que todas las vistas utilizan exclusivamente custom properties `--tj-*`, `--surface-*`, `--text-*` y clases de superficie (`tj-paper`, `tj-paper-dense`, `tj-range`), sin colores hex/rgb inline ni utilidades ad-hoc. Garantizar paridad visual completa en tema claro (`:root[data-theme="light"]`) y paletas alternativas (`data-palette`).

### R9. Seguridad, Privacidad y Tratamiento Local de Datos (D9)
Auditar que ninguna herramienta interactiva ni componente envíe datos a endpoints externos (100% local en cliente), que PostHog respete el consentimiento estricto (`CookieConsent`), que `dangerouslySetInnerHTML` esté restringido a JSON-LD seguro y sanitizado, y que `npm audit` se mantenga limpio.

### R10. Precisión Editorial y Tono Institucional (D10)
Revisar la totalidad del copy para mantener tono institucional directo (sin promesas de rentabilidad, precios como referencia de lanzamiento, proyecciones como aritmética determinista y demo como recreación técnica). Cero erratas en los cuatro documentos legales y glosarios.

### R11. Navegación, Atajos y Experiencia de Teclado (D11)
Auditar funcionalidad y accesibilidad de la `CommandPalette` (Ctrl+K), `GlossaryModal` (Ctrl+G), atajos globales (`GlobalShortcuts`, `ShortcutsHelp`), navegación por tabulación lógica y gestión de foco en modales y megamenú.

### R12. Manejo de Errores y Casos Límite (D12)
Garantizar validación exhaustiva en inputs de herramientas interactivas (evitando NaN, Infinity, valores negativos inválidos), robustez ante ausencia de `localStorage` en modo incógnito, y páginas de error / 404 elegantes y bilingües.

### R13. Consistencia de Datos y Motor Demo (D13)
Verificar coherencia completa del almacén determinista (`demoStore.ts` con PRNG `mulberry32` y fechas UTC), integridad de filtros (activos, setups, sesiones) frente a fixtures y sincronización de datos entre dashboard, calendario, equity curve y métricas analíticas.

## Acceptance Criteria

### Exactitud y Validación
- [ ] Todas las fórmulas matemáticas en `data.ts` y herramientas coinciden con definiciones analíticas de referencia (con tests unitarios para casos nominales y límite).
- [ ] `npm test` ejecuta 100% de tests pasando sin fallos imprevistos.
- [ ] `npm run typecheck` completa con 0 errores en TypeScript estricto.
- [ ] `npm run build` compila 182+ páginas SSG estáticas con 0 warnings.

### Accesibilidad y Responsive
- [ ] Todos los elementos interactivos cumplen touch target >= 44x44px y ratio de contraste WCAG AA en modo oscuro y claro.
- [ ] Cero desbordamiento horizontal verificado en viewport móvil de 390×844 en todas las páginas.

### Calidad Bilingüe y SEO
- [ ] 100% de cobertura en `STR` y paridad exacta entre rutas `/` y `/en/`.
- [ ] Metadatos SEO, canonicals, hreflang y esquemas JSON-LD validados en todas las rutas.

### Disciplina Operacional
- [ ] Edición estrictamente en sitio sin archivos duplicados (`_v2`, `_fix`).
- [ ] Commits atómicos verificados tras cada bloque de trabajo.
