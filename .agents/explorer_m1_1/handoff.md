# Investigation Report: Milestone 1 — Feature 1 (D12: LocalStorage Resilience) & Feature 2 (D11: Ctrl+G / Cmd+G Shortcut)

**Working Directory**: `c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\explorer_m1_1`  
**Target Milestone**: Milestone 1 (Core Resilience, Storage & Navigation)  
**Author**: Explorer M1.1  
**Recipient**: Parent Orchestrator (`5c47d07f-8b2d-4047-aa81-85801a9bd3bb`)

---

## 1. Observation

### Feature 1 (D12): LocalStorage Resilience in `src/lib/theme.tsx`

1. **Direct `localStorage` access without `try...catch` in `src/lib/theme.tsx`**:
   - **Line 54–58** in `src/lib/theme.tsx`:
     ```tsx
     function readSavedTheme(): Theme {
       if (typeof window === "undefined") return "light";
       const saved = localStorage.getItem("tj-theme");
       return saved === "dark" || saved === "light" ? saved : "light";
     }
     ```
     `localStorage.getItem("tj-theme")` is called without any `try...catch` block.
   - **Line 86–91** in `src/lib/theme.tsx`:
     ```tsx
     useEffect(() => {
       if (!mounted) return;
       document.documentElement.dataset.theme = theme;
       localStorage.setItem("tj-theme", theme);
       document.documentElement.classList.toggle("dark", theme === "dark");
     }, [theme, mounted]);
     ```
     `localStorage.setItem("tj-theme", theme)` is called directly without `try...catch`.
   - **Line 93–97** in `src/lib/theme.tsx`:
     ```tsx
     useEffect(() => {
       if (!mounted) return;
       document.documentElement.dataset.palette = palette;
       localStorage.setItem("tj-palette", palette);
     }, [palette, mounted]);
     ```
     `localStorage.setItem("tj-palette", palette)` is called directly without `try...catch`.

2. **Existing Resilience Patterns in Other Modules**:
   - `src/lib/consent.ts` (lines 55–65 & 73–81):
     ```tsx
     export function readConsent(): Consent {
       if (typeof window === "undefined") return null;
       try {
         const v = window.localStorage.getItem(CONSENT_KEY);
         return v === "accepted" || v === "declined" ? v : null;
       } catch {
         return null;
       }
     }
     export function writeConsent(choice: Exclude<Consent, null>): void {
       if (typeof window === "undefined") return;
       try {
         window.localStorage.setItem(CONSENT_KEY, choice);
       } catch {}
       window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: choice }));
     }
     ```
   - `src/components/tj/GlossaryModal.tsx` (lines 54–77):
     `readRecent()` and `writeRecent()` wrap `window.localStorage` in `try...catch` and degrade gracefully in-memory.
   - `src/lib/trading/demoStore.ts` (lines 175–205 & 262–266):
     `readRaw()` and `writeRaw()` guard `window.localStorage.getItem` / `setItem` / `removeItem` in `try...catch`.
   - `src/components/marketing/DisciplineScore.tsx` (lines 153–184):
     `useEffect` reads and writes `CLAVE_GUARDADO` in `try...catch`.
   - `src/app/layout.tsx` (line 242):
     Inline anti-FOUC script already wraps `localStorage.getItem('tj-theme')` in `try { ... } catch (e) { ... }`.

3. **Interface Contract Requirements (`PROJECT.md:41-45`)**:
   - `getTheme()`: returns `Theme`, must never throw even if `localStorage` throws `SecurityError`.
   - `setTheme(theme)`: persists safely inside `try...catch`.
   - `getPalette()` / `setPalette()`: persists safely inside `try...catch`.

---

### Feature 2 (D11): `Ctrl+G` / `Cmd+G` Shortcut for `GlossaryModal`

1. **Current `OverlayHost.tsx` Implementation**:
   - Located at `src/components/tj/OverlayHost.tsx`.
   - Lines 41–49 dynamically import `CommandPalette` and `ShortcutsHelp` with `{ ssr: false }`.
   - Lines 72–91 (`prefetchOverlays`) prefetch `CommandPalette` and `ShortcutsHelp` on the first user pointer/touch/key gesture.
   - Lines 100–104 manage `cmdMounted`, `cmdOpen`, `helpMounted`, `helpOpen`.
   - Lines 133–143 apply `EXIT_MS` (260ms) unmount delay after closing.
   - Lines 151–157 handle `Ctrl+K` / `Cmd+K`:
     ```tsx
     const onKey = (e: KeyboardEvent) => {
       if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
         e.preventDefault();
         setCmdMounted(true);
         setCmdOpen((o) => !o);
       }
     };
     ```
   - `OverlayHost` does NOT currently import or mount `GlossaryModal` or listen for `Ctrl+G` / `Cmd+G`.

2. **Current `GlobalShortcuts.tsx` Implementation**:
   - Located at `src/components/tj/GlobalShortcuts.tsx`.
   - Line 130 skips handling when modifiers are held: `if (e.metaKey || e.ctrlKey || e.altKey) return;`.
   - Lines 173–177 intercept un-modified single key `"g"` to initiate the two-key sequence (`g` + `h`, `g` + `f`, `g` + `o` for `/glosario`, etc.).
   - Lines 124–128 skip shortcuts if `[cmdk-root]` or `body[data-shortcuts-help-open="true"]` is active.

3. **Current `GlossaryModal.tsx` Implementation**:
   - Located at `src/components/tj/GlossaryModal.tsx`.
   - Supports controlled mode: `trigger={false}`, `open={open}`, `onOpenChange={onOpenChange}`.
   - Built on `@radix-ui/react-dialog` (`Dialog`, `DialogContent`), which handles focus traps, ESC key dismissal, click-outside dismissal, and ARIA attributes.
   - Currently only instantiated in `GlossaryLauncher.tsx` (footer trigger) and `FAQ.tsx` (search fallback).

4. **Platform Modifier Handling (`src/hooks/use-tecla-mando.ts`)**:
   - Returns `"Ctrl"` on Windows/Linux and `"⌘"` on macOS / iOS.
   - Uses `navigator.userAgentData?.platform ?? navigator.platform` after client hydration.

5. **Overlay Communication (`src/lib/overlays.ts`)**:
   - Defines `OPEN_SHORTCUTS_HELP` and `openShortcutsHelp()` to decouple dispatchers from heavy component trees.

6. **Shortcuts Help Overlay (`src/components/tj/ShortcutsHelp.tsx`)**:
   - Lists all site shortcuts using `useTeclaMando()`. Currently lists `Ctrl+K` / `⌘K`, `?`, `T`, `L`, `g + o` (Go to Glossary), but lacks an entry for `Ctrl+G` / `⌘G` (Open Glossary).

---

## 2. Logic Chain

### For Feature 1 (D12: LocalStorage Resilience)

1. **Failure Modes of `localStorage`**:
   - **`SecurityError` (DOMException 18)**: Thrown by browsers in private browsing mode (e.g. Safari Private Mode, Firefox strict isolation), when third-party cookies/storage are blocked, or in sandboxed iframes without `allow-same-origin`.
   - **`QuotaExceededError` (DOMException 22)**: Thrown by `localStorage.setItem` when the origin storage quota is full.
   - **SSR / Node.js Environment**: Calling `localStorage` without verifying `typeof window !== "undefined"` throws a `ReferenceError`.
2. **Current Impact**:
   - If a user in private browsing visits the site or toggles the theme, unhandled exceptions in `readSavedTheme` or `useEffect` (`setItem`) cause React component failures or break theme switching.
3. **Required Solution**:
   - Encapsulate all storage reads and writes in dedicated safe helper functions (`getSavedTheme`, `saveTheme`, `getSavedPalette`, `savePalette`, with aliases `getTheme`, `setTheme`, `getPalette`, `setPalette` for contractual compliance).
   - Ensure all helpers check `typeof window !== "undefined"` and wrap `window.localStorage` calls in `try...catch`.
   - Fall back to `"light"` and `"clasico"` whenever `localStorage` is inaccessible, corrupted, or missing.
   - Ensure `ThemeProvider`'s `useState` maintains full in-memory theme and palette state and updates `document.documentElement` attributes (`data-theme`, `data-palette`, `.dark` class) seamlessly even when persistence is blocked.

### For Feature 2 (D11: `Ctrl+G` / `Cmd+G` Glossary Shortcut)

1. **Native Browser Conflict**:
   - In Chromium, Firefox, and Safari, `Ctrl+G` / `Cmd+G` is the default keybinding for "Find Next" (find match in page).
   - Therefore, the event listener must call `e.preventDefault()` when `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g"` is detected.
2. **Architecture & Performance**:
   - `GlossaryModal` contains glossary definitions in two languages, search indexing, category filtering, and Radix UI dialog dependencies (~80KB).
   - Mounting `GlossaryModal` directly in the critical bundle of every page would degrade initial page weight.
   - Hosting `GlossaryModal` in `OverlayHost.tsx` via `next/dynamic({ ssr: false })` keeps it out of the critical bundle and loads it on demand or on first gesture via `prefetchOverlays()`.
3. **Mutual Exclusivity & Overlay Host Lifecycle**:
   - When `Ctrl+G` / `Cmd+G` is pressed, any other open overlay (`CommandPalette`, `ShortcutsHelp`) should be closed (`setCmdOpen(false)`, `setHelpOpen(false)`).
   - When `Ctrl+K` / `Cmd+K` is pressed, `setGlossaryOpen(false)` should be called.
   - `OverlayHost` manages `glossaryMounted` and `glossaryOpen`, retaining the component during exit animations and unmounting after `EXIT_MS` (260ms).
4. **Decoupled Dispatching & Discoverability**:
   - Add `OPEN_GLOSSARY = "tj:open-glossary"` and `openGlossaryModal()` in `src/lib/overlays.ts`.
   - In `OverlayHost.tsx`, listen to both the `keydown` event (`Ctrl+G` / `Cmd+G`) and `OPEN_GLOSSARY` custom event.
   - In `GlobalShortcuts.tsx`, guard against open dialogs (`document.querySelector('[data-slot="dialog-content"]')` or `document.querySelector('[role="dialog"]')`) to suppress single-key shortcuts while interacting with `GlossaryModal`.
   - In `ShortcutsHelp.tsx`, add `{ keys: (<><Kbd>{mando}</Kbd><Kbd>G</Kbd></>), label: es ? "Abrir el glosario" : "Open the glossary" }`.

---

## 3. Caveats

1. **Platform Modifier Compatibility**:
   - On macOS, `e.metaKey` is `true` for `Cmd+G`. On Windows/Linux, `e.ctrlKey` is `true` for `Ctrl+G`. Testing with `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g"` covers all desktop operating systems.
2. **Keyboard Sequence vs Modifier**:
   - In `GlobalShortcuts.tsx`, the two-key sequence `g` then `o` navigates to `/glosario` (full page navigation).
   - In contrast, `Ctrl+G` / `Cmd+G` toggles the quick interactive `GlossaryModal` overlay without leaving the current route. Both mechanisms serve distinct, complementary user intents.
3. **Radix Dialog DOM Lifecycle**:
   - `GlossaryModal` renders via Radix `DialogContent` with `data-slot="dialog-content"` in a portal attached to `document.body`. Radix natively handles ESC key and focus restoration when unmounting.

---

## 4. Conclusion & Recommended Implementation

### Exact Code Recommendations

#### 1. `src/lib/theme.tsx`
Replace bare `localStorage` calls with robust, typed helpers and inline `try...catch` blocks:

```tsx
// Storage helpers with full private browsing fault tolerance
export function getSavedTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = window.localStorage.getItem("tj-theme");
    return saved === "dark" || saved === "light" ? saved : "light";
  } catch {
    return "light";
  }
}

export function saveTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("tj-theme", theme);
  } catch {
    /* localStorage unavailable or quota exceeded — keep in-memory only */
  }
}

export function getSavedPalette(): PaletteName {
  if (typeof window === "undefined") return "clasico";
  try {
    const saved = window.localStorage.getItem("tj-palette");
    return saved === "clasico" ? saved : "clasico";
  } catch {
    return "clasico";
  }
}

export function savePalette(palette: PaletteName): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("tj-palette", palette);
  } catch {
    /* localStorage unavailable or quota exceeded — keep in-memory only */
  }
}

// Aliases for explicit interface contract compatibility
export const getTheme = getSavedTheme;
export const setThemeStorage = saveTheme;
export const getPalette = getSavedPalette;
export const setPaletteStorage = savePalette;
```

In `ThemeProvider`:
```tsx
  useEffect(() => {
    setTheme(getSavedTheme());
    setPalette(getSavedPalette());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.palette = palette;
    savePalette(palette);
  }, [palette, mounted]);
```

---

#### 2. `src/lib/overlays.ts`
Add event contract for `GlossaryModal`:

```tsx
export const OPEN_SHORTCUTS_HELP = "tj:open-shortcuts-help";
export const OPEN_GLOSSARY = "tj:open-glossary";

/** Pide abrir la ayuda de atajos. La escucha `OverlayHost`. */
export function openShortcutsHelp() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_SHORTCUTS_HELP));
}

/** Pide abrir el glosario. La escucha `OverlayHost`. */
export function openGlossaryModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_GLOSSARY));
}
```

---

#### 3. `src/components/tj/OverlayHost.tsx`
Add dynamic import, state management, prefetching, and `Ctrl+G` / `Cmd+G` listener for `GlossaryModal`:

```tsx
const GlossaryModal = dynamic(
  () => import("@/components/tj/GlossaryModal").then((m) => m.GlossaryModal),
  { ssr: false }
);

// In prefetchOverlays():
function prefetchOverlays() {
  if (typeof window === "undefined") return;
  let pedido = false;
  const load = () => {
    if (pedido) return;
    pedido = true;
    quitar();
    import("@/components/tj/CommandPalette");
    import("@/components/tj/ShortcutsHelp");
    import("@/components/tj/GlossaryModal");
  };
  // ...
}

// In OverlayHost component:
export function OverlayHost() {
  const [cmdMounted, setCmdMounted] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [helpMounted, setHelpMounted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [glossaryMounted, setGlossaryMounted] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const openCmd = useCallback((next: boolean) => {
    setCmdMounted(true);
    setCmdOpen(next);
  }, []);

  const openHelp = useCallback((next: boolean) => {
    setHelpMounted(true);
    setHelpOpen(next);
  }, []);

  const openGlossary = useCallback((next: boolean) => {
    setGlossaryMounted(true);
    setGlossaryOpen(next);
  }, []);

  useEffect(() => {
    if (glossaryOpen || !glossaryMounted) return;
    const t = window.setTimeout(() => setGlossaryMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [glossaryOpen, glossaryMounted]);

  useEffect(() => {
    prefetchOverlays();

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setHelpOpen(false);
        setGlossaryOpen(false);
        setCmdMounted(true);
        setCmdOpen((o) => !o);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        setCmdOpen(false);
        setHelpOpen(false);
        setGlossaryMounted(true);
        setGlossaryOpen((o) => !o);
      }
    };

    const onHelp = () => {
      setCmdOpen(false);
      setGlossaryOpen(false);
      setHelpMounted(true);
      setHelpOpen(true);
    };

    const onGlossary = () => {
      setCmdOpen(false);
      setHelpOpen(false);
      setGlossaryMounted(true);
      setGlossaryOpen(true);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SHORTCUTS_HELP, onHelp);
    window.addEventListener(OPEN_GLOSSARY, onGlossary);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SHORTCUTS_HELP, onHelp);
      window.removeEventListener(OPEN_GLOSSARY, onGlossary);
    };
  }, []);

  return (
    <>
      {cmdMounted && <CommandPalette open={cmdOpen} onOpenChange={openCmd} />}
      {helpMounted && <ShortcutsHelp open={helpOpen} onOpenChange={openHelp} />}
      {glossaryMounted && (
        <GlossaryModal trigger={false} open={glossaryOpen} onOpenChange={openGlossary} />
      )}
    </>
  );
}
```

---

#### 4. `src/components/tj/GlobalShortcuts.tsx`
Add suppression check for active dialogs:

```tsx
// 4) Skip when any modal/dialog is open (such as GlossaryModal).
if (document.querySelector('[data-slot="dialog-content"]') || document.querySelector('[role="dialog"]')) return;
```

---

#### 5. `src/components/tj/ShortcutsHelp.tsx`
Add `Ctrl+G` / `⌘G` shortcut card to the shortcuts list:

```tsx
{
  keys: (
    <>
      <Kbd>{mando}</Kbd>
      <Kbd>G</Kbd>
    </>
  ),
  label: es ? "Abrir el glosario" : "Open the glossary",
},
```

---

## 5. Verification Method

### 1. Automated Tests & Typecheck
- **TypeScript Typecheck**:
  ```bash
  npm run typecheck
  ```
  Must complete with exit code 0.
- **Unit Test Suite**:
  ```bash
  npm test
  ```
  Must pass 100% of test files.
- **Dedicated Resilience Unit Test**:
  Add unit test in `tests/theme.test.ts` (or `contratos.test.ts`) that mocks `window.localStorage.getItem` and `setItem` throwing `new DOMException("Access denied", "SecurityError")` and verifies `getSavedTheme()` returns `"light"`, `saveTheme("dark")` does not throw, and `getSavedPalette()` returns `"clasico"`.
- **Dedicated Shortcut Test**:
  Add unit test dispatching `KeyboardEvent("keydown", { key: "g", ctrlKey: true, bubbles: true })` and `KeyboardEvent("keydown", { key: "g", metaKey: true, bubbles: true })` and verifying `preventDefault` is called and `GlossaryModal` mounts.

### 2. Manual / Browser Verification
- **Private Browsing Mode**: Open Safari / Chrome Incognito / Firefox Private Window, navigate to `http://localhost:3000`, switch theme via UI and `T` shortcut, verify zero console errors and clean DOM attribute updates.
- **Shortcut Verification**:
  - Press `Ctrl+G` (Windows/Linux) or `Cmd+G` (macOS) on any page (`/`, `/features`, `/demo`, `/pricing`, `/en/faq`) -> verify `GlossaryModal` opens and native "Find Next" is prevented.
  - Press `Ctrl+G` / `Cmd+G` again or `Escape` -> verify `GlossaryModal` closes.
  - Press `?` -> verify `ShortcutsHelp` lists `Ctrl+G` / `⌘G`.
  - While `GlossaryModal` is open, press `T`, `L`, `g + h` -> verify single-key global shortcuts remain safely suppressed.

### 3. Invalidation Conditions
- Any unhandled `DOMException` or `SecurityError` thrown when invoking theme methods.
- Browser "Find next" dialog or search prompt opening when pressing `Ctrl+G` / `Cmd+G`.
- Initial bundle size regression (verified by ensuring `GlossaryModal` remains dynamically loaded in `OverlayHost.tsx`).
