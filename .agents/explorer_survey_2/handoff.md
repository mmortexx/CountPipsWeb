# Handoff Report — UI & UX Survey & Technical Audit (D2, D3, D6, D8, D11, D12)

**Agent**: UI & UX Survey Explorer  
**Working Directory**: `c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\explorer_survey_2\`  
**Date**: 2026-08-14  
**Handoff Type**: Hard (Task Complete)

---

## 1. Observation

Direct observations and evidence collected from the codebase:

1. **Accessibility & Touch Targets (D2)**:
   - `src/components/tj/CookieConsent.tsx` lines 235, 242 declare `min-h-[44px]` on action buttons.
   - `src/components/tj/BackToTop.tsx` line 99 uses 44px container/button.
   - `src/components/marketing/RiskCalculator.tsx` line 333 declares `className="h-7 px-2.5 rounded-[2px] text-xs font-mono transition-all ..."` (height 28px).
   - `src/components/glosario/GlosarioIndice.tsx` lines 84, 99 declare `className="h-7 px-3 rounded-[2px] text-xs font-medium transition-all ..."` (height 28px).
   - `src/components/charts/TradeCandleChart.tsx` lines 236, 249 declare `h-7 px-2.5` and `h-7 w-7` (28px height/width).
   - `src/components/tj/ShortcutsHelp.tsx` line 347 declares close button with `w-8 h-8` (32px).
   - `src/components/ui/button.tsx` lines 31–34 define default size as `h-9` (36px), `sm` as `h-8` (32px), `icon` as `size-9` (36px).

2. **Mobile Viewport & Font Sizes (D3)**:
   - `src/components/ui/input.tsx` line 15 sets `"text-base ... md:text-sm"` (16px base on mobile).
   - `src/components/marketing/FAQ.tsx` line 155 sets `text-sm` (14px) on `<input type="search">`.
   - `src/components/marketing/ContactForm.tsx` lines 287, 304, 317 set `text-sm` (14px) on `<input>` and `<textarea>`.
   - `src/components/glosario/GlosarioIndice.tsx` line 73 sets `text-[15px]` (15px) on `<input type="search">`.
   - `src/components/marketing/DisciplineCost.tsx` lines 230, 248 set `text-sm` (14px) on `<input type="number">`.

3. **Performance, Loading & Determinism (D6)**:
   - `src/components/tj/OverlayHost.tsx` lines 41–49 load `CommandPalette` and `ShortcutsHelp` via `dynamic(..., { ssr: false })` with prefetch on first user gesture (pointermove/touchstart/keydown).
   - `src/components/tj/BackgroundFX.tsx` lines 24–27 load `EngravedAtlas` dynamically with `{ ssr: false }`, mounted conditionally via `platesForRoute(pathname).length > 0`.
   - `src/app/layout.tsx` lines 74–129 load local fonts from `src/app/fonts/` with `display: "swap"` and `adjustFontFallback: true`.
   - `src/components/marketing/Ticker.tsx` lines 50–140 run on CSS keyframe animation `.tj-cinta` and modulate `playbackRate` during scroll.
   - `src/lib/publicacion.ts` line 31 provides build-constant `ANIO_PUBLICACION`. In contrast, `src/components/marketing/DisciplineCost.tsx` line 332 executes `#LEAK-{new Date().getFullYear()}` directly.
   - `src/components/charts/TradeCandleChart.tsx` line 101 uses `date.getHours()` and `date.getMinutes()` (local time) instead of UTC methods.

4. **Visual Consistency & Design System (D8)**:
   - Tokens `--accent-base`, `--accent-ink`, `--pnl-pos`, `--pnl-neg`, `--sig-green`, `--txt-primary`, `--txt-secondary`, `--txt-tertiary` and surface classes `.tj-paper`, `.tj-paper-dense`, `.tj-paper-glow`, `.tj-range` are systematically utilized in `src/app/globals.css`.
   - `src/components/demo/WindowChrome.tsx` line 283 contains inline hex `hover:bg-[#C42B1C]`.
   - `src/components/demo/pages/DashboardPage.tsx` line 752 contains inline hex `advanced ? "left-[19px] bg-[#1A1917]" : ...`.

5. **Keyboard Shortcuts & Navigation (D11)**:
   - `src/components/tj/GlobalShortcuts.tsx` handles single-key shortcuts `T`, `L`, `?` and sequential `g` + key (`g h`, `g f`, `g m`, `g d`, `g s`, `g p`, `g e`, `g a`, `g q`, `g t`, `g c`, `g o`, `g b`, `g u`, `g r`).
   - `src/components/tj/OverlayHost.tsx` lines 151–157 listen exclusively for `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"`. No listener exists for `Ctrl+G` / `Cmd+G` to trigger `GlossaryModal`.

6. **Error Handling & Resilience (D12)**:
   - `src/lib/theme.tsx` lines 56, 89, 96 execute `localStorage.getItem("tj-theme")`, `localStorage.setItem("tj-theme", theme)`, `localStorage.setItem("tj-palette", palette)` without `try...catch`.
   - `src/components/marketing/EquityProjector.tsx` line 72 computes `cagr = yearlyFactor >= 0 ? Math.pow(finalBalance / startBalance, 1 / years) - 1 : -1;` without checking `finalBalance > 0`, leading to `NaN` when `finalBalance < 0`.

---

## 2. Logic Chain

1. **Accessibility Logic**:
   - WCAG 2.1 AA Criterion 2.5.5 / 2.5.8 requires interactive targets to have minimum dimensions of 44×44px or sufficient spacing.
   - Observations 1.3 to 1.7 demonstrate that several interactive elements (`RiskCalculator.tsx:333`, `GlosarioIndice.tsx:84,99`, `TradeCandleChart.tsx:236`, `ShortcutsHelp.tsx:347`) have fixed heights of 28px or 32px without responsive enlargement for touch viewports.
   - Therefore, touch target compliance is violated on these specific subcontrols.

2. **Responsive Font Size Logic**:
   - iOS Safari triggers automatic viewport zooming upon focusing any form element with computed `font-size < 16px`.
   - Observation 2 demonstrates that while `Input.tsx` correctly enforces `text-base md:text-sm` (16px on mobile), custom inputs in `FAQ.tsx:155`, `ContactForm.tsx:287,304,317`, `GlosarioIndice.tsx:73`, and `DisciplineCost.tsx:230,248` specify 12px–15px (`text-sm`, `text-[15px]`).
   - Therefore, mobile users on iOS experience unwanted page zooming when focusing these inputs.

3. **Performance & Determinism Logic**:
   - Static Site Generation (SSG) pre-renders HTML at build time. When runtime rendering in the client produces different text (e.g. copyright year crossing New Year or timezone offsets on date getters), React throws Hydration Mismatch Error `#418` / `#423`.
   - While `publicacion.ts` and `fechas.ts` solve this for the global layout and footer, Observation 3 shows `DisciplineCost.tsx:332` still calls `new Date().getFullYear()` and `TradeCandleChart.tsx:101` reads local timezone hours.
   - Therefore, isolated hydration/timezone non-determinism remains in these two files.

4. **Keyboard Shortcut Parity Logic**:
   - Requirement R11 / D11 specifies global accessibility for both `CommandPalette` (Ctrl+K) and `GlossaryModal` (Ctrl+G).
   - Observation 5 confirms that `OverlayHost.tsx` only binds `Ctrl+K`. `GlossaryModal` is only reachable via footer click or `g o` route navigation, leaving `Ctrl+G` modal activation unimplemented.

5. **Storage Resilience Logic**:
   - In browser environments with third-party cookie blocking, sandboxed iframes, or strict incognito storage denial, accessing `localStorage` throws a `SecurityError` / `DOMException`.
   - Observation 6 shows `theme.tsx` calls `localStorage.getItem` and `localStorage.setItem` synchronously outside `try...catch`.
   - Therefore, visitors in restricted storage environments experience an unhandled JavaScript crash on mount or theme toggle.

---

## 3. Caveats

- **No Code Modifications**: Per explorer role constraints, all analysis was performed in read-only mode without altering application source code.
- **SSG Page Generation Count**: The project generates 182+ static pages during a full build (`next build`). Static routes and components were analyzed statically and checked via unit tests (`vitest`) and type checking (`tsc --noEmit`).

---

## 4. Conclusion

The CountPips frontend codebase presents an outstanding baseline architecture with 0 TypeScript compilation errors and 94 passing unit tests. 

However, six actionable remediations must be prioritized for subsequent implementation phases:
1. **[P1 - Bug / Resilience]**: Wrap `localStorage` calls in `src/lib/theme.tsx` inside `try...catch`.
2. **[P1 - Feature Parity]**: Implement `Ctrl+G` / `Cmd+G` shortcut in `OverlayHost.tsx` / `GlobalShortcuts.tsx` to launch `GlossaryModal`.
3. **[P1 - Math Edge Case]**: Guard `finalBalance > 0` in `EquityProjector.tsx:72` to prevent `cagr = NaN`.
4. **[P2 - Mobile UX]**: Upgrade input font sizes to `text-base md:text-sm` in `FAQ.tsx`, `ContactForm.tsx`, `GlosarioIndice.tsx`, `DisciplineCost.tsx`.
5. **[P2 - Accessibility]**: Ensure minimum 44×44px touch targets on mobile for buttons in `RiskCalculator.tsx`, `GlosarioIndice.tsx`, `TradeCandleChart.tsx`, `ShortcutsHelp.tsx`.
6. **[P3 - Visual & Determinism Cleanup]**: Replace hardcoded `#C42B1C` and `#1A1917` with CSS tokens; replace `new Date().getFullYear()` with `ANIO_PUBLICACION` in `DisciplineCost.tsx:332`; use `getUTCHours()` in `TradeCandleChart.tsx:101`.

---

## 5. Verification Method

To independently verify the audit findings:
1. **Typecheck & Tests**:
   - Execute `npm run typecheck` (verifies 0 TypeScript errors).
   - Execute `npm test` (verifies 94 unit tests passing across 10 test suites).
2. **Search Verification**:
   - Inspect `src/lib/theme.tsx:56, 89, 96` for unguarded `localStorage` calls.
   - Inspect `src/components/tj/OverlayHost.tsx:151-157` for absence of `Ctrl+G` handler.
   - Inspect `src/components/marketing/RiskCalculator.tsx:333` for `h-7` button height.
   - Inspect `src/components/marketing/FAQ.tsx:155` and `ContactForm.tsx:287` for `text-sm` input classes.
   - Inspect `src/components/marketing/EquityProjector.tsx:72` for unguarded `Math.pow(finalBalance / startBalance, 1 / years)`.
