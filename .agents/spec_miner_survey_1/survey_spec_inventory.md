# CountPips — Comprehensive Specification & Routes Inventory

- **Date**: 2026-08-14
- **Auditor / Role**: Specification Miner (`spec_miner_survey_1`)
- **Status**: Audit Completed & Verified
- **Workspace**: `c:\Users\jmqc1\Documents\Cosas\web-trading-journal`
- **Build Target**: 182 SSG Pages & Assets (154 Content Pages: 77 ES + 77 EN)

---

## 1. Executive Summary

CountPips is a static marketing website and interactive web demonstration for a native Windows 11 desktop trading journal application. The web architecture is built on Next.js 16 (App Router) with static export (`output: "export"`), featuring zero runtime server dependencies and client-side deterministic simulations.

This specification audit provides a complete, authoritative mapping across:
1. **Complete Route & Feature Catalog** (19 fixed route pairs, 51 dynamic glossary terms, 7 dynamic calculation tools, interactive desktop demo engine, and global overlays).
2. **D4: Strict Bilingual Parity ES / EN** (`STR` dictionary with 210 keys, 51 glossary terms, 7 tools, 17 FAQ pairs, 4 legal documents, vocabulary governance).
3. **D5: Technical SEO & Metadata** (154 content pages analyzed, titles, descriptions, single H1 hierarchy, canonical tags, bidirectional hreflang, OpenGraph/Twitter social cards, 13 JSON-LD schema types, `sitemap.xml`, and `robots.txt`).
4. **D10: Editorial Accuracy & Institutional Tone** (disclaimers, launch pricing representations, deterministic modeling messaging, zero profit promises, legal compliance).

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Navigation | Language Switcher | Toggles active locale between ES (`/`) and EN (`/en/...`), preserving query and hash. | User click, URL path | Navigates to localized route counterpart | Falls back to Spanish route if English route absent | `src/lib/i18n.tsx`, `src/lib/locale.ts` |
| 2 | Navigation | Theme & Palette Toggle | Toggles dark/light mode and classic palette; syncs with `localStorage` and `data-theme` attribute before paint. | User click, stored preference | `data-theme="dark" \| "light"`, CSS variables update | Fallback to `light` on storage failure/incognito | `src/lib/theme.tsx`, `src/app/layout.tsx` |
| 3 | Navigation | Command Palette (Ctrl+K) | Global fuzzy-search launcher across 32 routes, 51 terms, 7 tools, themes, and languages. | Keystrokes, search query | Filtered list of actions/routes, instant navigation | Empty state with helper prompt when no matches | `src/components/tj/CommandPalette.tsx`, `src/components/tj/OverlayHost.tsx` |
| 4 | Navigation | Glossary Modal (Ctrl+G) | Modal popup for instant term lookup with 5 categories and search input. | Keystrokes, category chips | Term definitions in active language | Shows "no results" message | `src/components/tj/GlossaryModal.tsx` |
| 5 | Navigation | Global Keyboard Shortcuts (?) | Modal displaying hotkeys (`g h`, `g d`, `g f`, `g p`, `g q`, `g b`, `g g`, `g t`, `1-6`, `Ctrl+K`, `Ctrl+G`). | Keystroke `?` or `/` | Shortcut cheat sheet modal | Ignored when input/textarea focused | `src/components/tj/GlobalShortcuts.tsx`, `ShortcutsHelp.tsx` |
| 6 | Navigation | Skip Link | Hidden accessibility anchor appearing on first Tab press to jump to `#main-content`. | Tab key | Focus shifted to `<main id="main-content">` | Bypassed on mouse click | `src/components/tj/SkipLink.tsx`, `layout.tsx` |
| 7 | Marketing | Engraved Atlas Visual FX | Canvas/WebGL/SVG dynamic background illustrating trading atlas that engraves as user scrolls. | Scroll progress, plate index | Engraved technical plates synchronized with viewport | Fallbacks to static paper grain if WebGL unsupported | `src/components/tj/EngravedAtlas.tsx`, `BackgroundFX.tsx` |
| 8 | Marketing | Intro Sequence & Loader | Session-first-load loader revealing hero content with sequence animation. | `sessionStorage.getItem('tj_intro')` | Staggered text & UI reveal | Skipped on repeat visits in same session | `src/components/tj/IntroSequence.tsx`, `layout.tsx` |
| 9 | Marketing | Profile Selector | Segmented funnel selector directing traders to Manual (`/traders/manual`) or Prop Firm (`/traders/prop-firms`). | User tab click | Dynamic content swap and targeted CTA links | Default to Manual profile | `src/components/marketing/ProfileSelector.tsx` |
| 10 | Marketing | Product Showcase | Visual anatomy of the native Windows application with tabbed deep dives. | User tab selection | Screenshot/mockup view with annotated feature callouts | Graceful fallback to static illustration | `src/components/marketing/ProductShowcase.tsx` |
| 11 | Marketing | Metrics Showcase | Interactive preview of 40+ quantitative metrics (Sharpe, Sortino, Calmar, Expectancy R, Max DD). | Metric cards selection | Real-time formulas, definitions, and visual mini-charts | Tooltip explanations on hover | `src/components/marketing/MetricsShowcaseNew.tsx` |
| 12 | Marketing | Guardian Discipline Engine | Visual demonstration of pre-trade risk circuit breakers and daily loss brakes. | Interactive violation triggers | Amber/Red warning modals with monetary cost breakdown | Safe-mode override simulation | `src/components/marketing/GuardianNew.tsx` |
| 13 | Marketing | Live Ticker | Pure CSS animated tape with asset symbols (BTC, ETH, EURUSD, XAU, AAPL, ES, NQ, CL, GER40). | CSS keyframes | Smooth horizontal continuous loop | Pauses on hover / accessible motion settings | `src/components/marketing/Ticker.tsx` |
| 14 | Marketing | Pricing Matrix | Comparison of Core ($149 planned launch) vs Pro ($249 planned launch) feature tiers. | Tier toggle, annual/once toggle | Feature checklist, plan comparison table, early access CTA | Displays explicit "Launch reference price" badge | `src/components/marketing/Pricing.tsx`, `SelloPrevisto.tsx` |
| 15 | Marketing | Pricing Calculator | Interactive scenario tool comparing monthly recurring SaaS costs against one-time launch reference. | Monthly SaaS price ($/mo), years | Cumulative savings & ROI calculation | Clamps negative or non-numeric inputs | `src/components/marketing/SavingsCalculator.tsx` |
| 16 | Tool | Position Size Calculator | Calculates exact units/lots/contracts and dollar risk from capital, risk %, and stop distance. | Capital ($), Risk %, Entry, Stop | Position size, lots, total risk $, risk-reward ratio | Displays warning on invalid entry/stop or 0% risk | `src/components/marketing/RiskCalculator.tsx` |
| 17 | Tool | Edge Significance Checker | Binomial test determining whether win rate / payoff exceeds random chance based on sample size. | Total trades, Win rate %, Payoff | p-value, edge confidence tier, normal CDF z-score | Rejects n < 5 or non-positive payoff | `src/components/marketing/EdgeSignificanceChecker.tsx` |
| 18 | Tool | Monte Carlo Simulator | Reshuffles historical/sample trade sequences across 1,000 iterations without replacement. | Sample size, win rate, payoff, risk % | Equity curve fan (5th, 50th, 95th percentiles), Max DD distribution, Risk of Ruin | Deterministic PRNG seed prevents hydration mismatch | `src/components/marketing/RMultipleSimulator.tsx` |
| 19 | Tool | Capital Projector | Multi-year compound growth model derived from expectancy per trade and monthly trade volume. | Starting capital, Expectancy (R), Trades/month, Years | Projected equity trajectory, CAGR, final balance | Includes explicit "Deterministic arithmetic, not a promise" disclosure | `src/components/marketing/EquityProjector.tsx` |
| 20 | Tool | Cost of Indiscipline | Calculates annual financial leak caused by off-plan trades vs disciplined execution. | Trades/year, In-plan expectancy, Off-plan expectancy, Off-plan % | Annual dollar loss gap, wasted expectancy, discipline invoice | Warns if in-plan expectancy is lower than off-plan | `src/components/marketing/DisciplineCost.tsx` |
| 21 | Tool | Market Session Clock | 24-hour visual clock showing real-time market sessions (Asia, London, NY) and overlap kill zones. | Current UTC time / client clock | Active session badges, overlap highlight, next open countdown | Handles cross-midnight UTC boundaries | `src/components/marketing/SessionClock.tsx` |
| 22 | Diagnostic | Discipline Assessment (/test) | 15-question diagnostic across 5 behavioral dimensions (Risk, Plan, Logging, Temper, Consistency). | 15 multiple-choice questions (0-3 score) | Score (0-100), radar breakdown, behavioral tier, recommendations | Preserves progress in `localStorage`; validates completion | `src/components/marketing/DisciplineScore.tsx`, `disciplineQuestions.ts` |
| 23 | Demo | Windows 11 Desktop Simulation | Interactive simulation of CountPips desktop app with title bar, LED indicators, and navigation. | User clicks, trade inputs | Live updating UI, state management, window controls | Clamps coordinates within viewport bounds | `src/components/demo/AppDemo.tsx`, `WindowChrome.tsx` |
| 24 | Demo | Trade Logging Composer | In-demo trade creation form with instrument, setup, direction, entry, stop, quantity, target. | Trade input fields | Stored in `localStorage` (`tj-demo-trades`), merged into tables/charts | Inline field validation (entry, stop, direction required) | `src/components/demo/pages/DashboardPage.tsx`, `demoStore.ts` |
| 25 | Demo | Trade Data Grid & Filters | Searchable, sortable, filterable operations table with batch selection and summary ribbon. | Search term, setup filter, compliance filter | Dynamic filtered row count, KPI recalculation | Empty filter result state with reset button | `src/components/demo/pages/TradesPage.tsx` |
| 26 | Demo | Trade Detail Inspection | Deep-dive modal inspecting planned vs actual execution, screenshots, and discipline notes. | Selected trade ID | Trade breakdown, MAE/MFE, notes, followed-plan toggle | Graceful fallback if trade ID not found | `src/components/demo/pages/TradeDetailPage.tsx` |
| 27 | Demo | Analytics Dashboard | Visual analytics suite (R-histogram, P&L by day/month, day/hour heatmap, setup performance). | Filter bar state | Recalculated distribution charts and expectancy tables | Short sample disclaimer when n < 30 | `src/components/demo/pages/AnalyticsPage.tsx` |
| 28 | Demo | Daily Journal & Ritual | Pre-market checklist, post-market reflection, day score (1-10), and discipline compliance log. | Daily reflection notes, score | Saved reflection entry, compliance % update | LocalStorage persistence | `src/components/demo/pages/JournalPage.tsx` |
| 29 | Demo | Trade Compare Modal | Side-by-side comparison modal analyzing execution differences between two trades. | Two selected trade IDs | Delta metrics (P&L diff, R diff, MAE diff, plan compliance) | Disabled until exactly 2 trades selected | `src/components/demo/TradeCompareModal.tsx` |
| 30 | Conversion | Early Access Form (/beta) | Multi-step qualification form for private pilot admission with Turnstile protection. | Email, profile, experience, markets, current method, goal, note | Submission to admission endpoint, confirmation screen | Anti-bot honeypot check, rate-limiting, field validation | `src/components/beta/BetaApplication.tsx`, `forms.ts` |
| 31 | Conversion | Contact Form | Support inquiry form routing to Web3Forms with client-side sanitization. | Name, email, message, botcheck honeypot | Confirmation toast, email forwarded to support | Displays error toast on network failure | `src/components/marketing/ContactForm.tsx`, `forms.ts` |
| 32 | Compliance | Cookie Consent Banner | Granular consent manager ("Solo necesarias" / "Aceptar todas") managing PostHog EU activation. | User consent choice | `localStorage` entry (`tj-cookie-consent`), loads/unloads PostHog | Zero cookies used (100% localStorage/sessionStorage) | `src/components/tj/CookieConsent.tsx`, `analytics/PostHog.tsx` |

---

## 3. Edge Cases Discovered

| # | Feature | Input / Condition | Observed Behavior |
|---|---------|-------------------|-------------------|
| 1 | Position Size Calculator | Stop price equals Entry price (`stop === entry`) | Clamps division by zero, shows error notification, disables calculate action. |
| 2 | Position Size Calculator | Negative or zero capital input (`capital <= 0`) | Input clamped to minimum positive value ($100), prevents NaN output. |
| 3 | Edge Significance Checker | Sample size n < 5 trades | Renders short sample warning banner, flags p-value as statistically inconclusive. |
| 4 | Edge Significance Checker | 100% Win Rate with 0 losses | Abramowitz & Stegun normal CDF clamps z-score to prevent `Infinity`. |
| 5 | Monte Carlo Simulator | Flat equity curve (all trades P&L = 0) | Renders straight horizontal fan lines with 0% Max DD and 0% Risk of Ruin. |
| 6 | Monte Carlo Simulator | Consecutive loss streak exceeding account balance | Equity drops to 0, triggers Ruin counter, stops negative compounding. |
| 7 | Capital Projector | Negative expectancy input (losing system) | Generates downward sloping decay curve showing account erosion rate. |
| 8 | Market Session Clock | Midnight UTC transition (23:59:59 -> 00:00:00) | Seamlessly rolls over 24-hour dial without visual glitch; updates Tokyo/Asia open status. |
| 9 | Demo Store Persistence | Incognito mode / `localStorage` quota exceeded | Gracefully catches quota error, retains trades in-memory for active session. |
| 10 | Demo Store Hydration | Server-side render vs first client paint | Server returns `EMPTY` array (`useSyncExternalStore`), client hydrates without #418 mismatch. |
| 11 | Locale Switcher | Route with query params and hash (`/faq?q=stop+loss#pricing`) | Switcher preserves query string and hash (`/en/faq?q=stop+loss#pricing`). |
| 12 | Command Palette | Accented query matching unaccented data (e.g. "métricas" vs "metricas") | Search normalizes NFD unicode accents to match seamlessly in both directions. |
| 13 | Glossary Title SEO | Long term names with acronym expansion (`MAE (Maximum Adverse Excursion)`) | `tituloDeTermino()` truncates expansion to keep `<title>` within <= 60 characters for Google SERP. |
| 14 | Postbuild Social Cards | Static export lacking `.png` extension on server | `postbuild.mjs` copies generated images to `.png` and rewrites HTML tags so crawlers don't get `application/octet-stream`. |
| 15 | No-JS Fallback | Browsers with JavaScript disabled | Global `<noscript>` CSS rule overrides inline `opacity: 0` from Framer Motion, ensuring 100% visible text. |

---

## 4. Complete Route Catalog (32 Routes / 182 Build Targets)

The project generates **182 static pages and assets** during `bun run build`. The 154 content pages consist of 77 Spanish routes at the root and 77 English routes under `/en/`.

### 4.1. Route Matrix Breakdown

| Route Path (ES) | Route Path (EN) | Route Type | Purpose & Primary Components | JSON-LD Schemas |
|-----------------|-----------------|------------|-------------------------------|-----------------|
| `/` | `/en/` | Static | Landing page (Hero, StatsBand, Showcase, Plates, Guardian) | `Organization`, `WebSite`, `SoftwareApplication` |
| `/features` | `/en/features/` | Static | Features overview & comparison bento | `Article`, `BreadcrumbList` |
| `/features/metricas` | `/en/features/metricas/` | Static | Quantitative ratios & expectancy deep dive | `Article`, `BreadcrumbList` |
| `/features/disciplina` | `/en/features/disciplina/` | Static | Guardian engine & drawdown brakes deep dive | `Article`, `BreadcrumbList` |
| `/features/seguridad` | `/en/features/seguridad/` | Static | Local SQLite architecture & zero-cloud security | `Article`, `BreadcrumbList` |
| `/pricing` | `/en/pricing/` | Static | Pricing tiers ($149 Core / $249 Pro) & FAQ | `Product`, `FAQPage`, `BreadcrumbList` |
| `/demo` | `/en/demo/` | Static | Full-screen interactive desktop Windows 11 demo | `BreadcrumbList` |
| `/test` | `/en/test/` | Static | 15-question behavioral discipline diagnostic test | `Quiz`, `BreadcrumbList` |
| `/about` | `/en/about/` | Static | Product origin story, mission, and philosophy | `BreadcrumbList` |
| `/faq` | `/en/faq/` | Static | Searchable FAQ repository with live query filter | `FAQPage`, `BreadcrumbList` |
| `/beta` | `/en/beta/` | Static | Early access application form & status checker | `BreadcrumbList` |
| `/traders/manual` | `/en/traders/manual/` | Static | Manual discretionary trader target profile | `WebPage`, `BreadcrumbList` |
| `/traders/prop-firms` | `/en/traders/prop-firms/` | Static | Prop firm trader target profile | `WebPage`, `BreadcrumbList` |
| `/glosario` | `/en/glosario/` | Static | 51-term trading dictionary index | `DefinedTermSet`, `BreadcrumbList` |
| `/glosario/[termino]` (51) | `/en/glosario/[termino]` (51) | SSG Dynamic | Dedicated definition pages for each term | `DefinedTerm`, `BreadcrumbList` |
| `/herramientas` | `/en/herramientas/` | Static | Directory index of 7 calculation tools | `ItemList`, `BreadcrumbList` |
| `/herramientas/[herramienta]` (7) | `/en/herramientas/[herramienta]` (7) | SSG Dynamic | Dedicated calculator pages for each tool | `WebApplication`, `BreadcrumbList` |
| `/privacidad` | `/en/privacidad/` | Static | GDPR / LOPD Privacy Policy (9 sections) | `BreadcrumbList` |
| `/cookies` | `/en/cookies/` | Static | Cookie & Local Storage Policy (4 sections) | `BreadcrumbList` |
| `/terminos` | `/en/terminos/` | Static | Terms of Use & Financial Disclaimer (7 sections) | `BreadcrumbList` |
| `/aviso-legal` | `/en/aviso-legal/` | Static | Legal Notice & Ownership Information (5 sections) | `BreadcrumbList` |
| `/_not-found` | N/A | Static | Bilingual 404 recovery page with search | None |

### 4.2. Non-Page Build Targets Generated
- `robots.txt` (`src/app/robots.ts`) -> Static robots file pointing to sitemap.
- `sitemap.xml` (`src/app/sitemap.ts`) -> 154 URLs with priority, changeFrequency, and reciprocal hreflang.
- `manifest.webmanifest` (`src/app/manifest.ts`) -> PWA web app manifest with brand colors.
- Dynamic OpenGraph and Twitter images generated for root and segment routes (`/opengraph-image`, `/twitter-image`, `/about/*`, `/demo/*`, `/faq/*`, `/features/*`, `/pricing/*`, `/test/*`).

---

## 5. D4: Strict Bilingual Parity Audit

### 5.1. Dictionaries & Data Files Verification
- **`STR` Dictionary (`src/lib/i18n.tsx`)**:
  - Exactly **210 keys** defined.
  - **100% paired**: 0 missing English keys, 0 missing Spanish keys, 0 empty strings.
  - Verified by unit tests in `tests/contratos.test.ts`.
- **Glossary (`src/lib/glosario.ts` & `src/lib/trading/glossary.ts`)**:
  - Exactly **51 terms** categorized into 5 groups:
    1. `basics` (13 terms: Long, Short, Setup, Breakout, Prop firm, Track record, Liquidity, Volatility, Pullback, Reversal, Trend, Range, Edge).
    2. `risk` (8 terms: Stop loss, Drawdown, Risk of ruin, Position sizing, Risk-reward ratio, Kelly criterion, Margin, Max drawdown).
    3. `psychology` (4 terms: FOMO, Revenge trading, Tilt, Discipline).
    4. `metrics` (13 terms: Expectancy, Profit factor, Sharpe ratio, Sortino ratio, Calmar ratio, R-multiple, Win rate, Payoff, Monte Carlo, Backtesting, Forward testing, Curve fitting, CAGR).
    5. `execution` (13 terms: Take profit, MAE, MFE, Spread, Slippage, Limit order, Market order, Leverage, Margin call, London session, NY session, Asia session, Kill zone).
  - Frozen Term philosophy: The `term` name is maintained in standard market English, while definitions are 100% bilingual.
- **Tools (`src/lib/herramientas.ts`)**:
  - Exactly **7 tools**, each with complete bilingual metadata (`tituloEs`/`tituloEn`, `h1Es`/`h1En`, `subtituloEs`/`subtituloEn`, `resumenEs`/`resumenEn`, `descripcionEs`/`descripcionEn`).
- **FAQ (`src/lib/faq.ts`)**:
  - 13 general questions in `FAQ_ES` and `FAQ_EN`.
  - 4 pricing questions in `PRICING_FAQ_ES` and `PRICING_FAQ_EN`.
  - Exactly 1:1 question and answer correspondence.
- **Legal Documents (`src/lib/legal/documentos.ts`)**:
  - 4 documents: `privacidad` (9 sections), `cookies` (4 sections), `terminos` (7 sections), `aviso-legal` (5 sections).
  - All sections, headings, paragraphs, lists, and tables contain complete ES and EN content.

### 5.2. Vocabulary Governance
- Strict avoidance of un-translated English slang inside Spanish prose:
  - Prohibited: `journal` in Spanish text -> Replaced with `diario`.
  - Prohibited: `overrides` in Spanish text -> Replaced with `excepciones`.
  - Prohibited: `command palette` in Spanish text -> Replaced with `paleta de comandos`.
- Institutional financial terminology maintained consistently across languages (e.g. `Expectancy R`, `Drawdown`, `Sharpe Ratio`, `Kill zone`, `Payoff`).

---

## 6. D5: Technical SEO & Metadata Audit

### 6.1. Metadata Audit Findings Across 154 Content Pages

| Metric / Check | Required Spec | Actual State | Status |
|----------------|---------------|--------------|--------|
| Total Audited Pages | 154 content pages | 154 content pages in `out/` | ✅ Complete |
| Missing Title Tags | 0 | 0 | ✅ Clean |
| Title Length (Google SERP) | <= 60 chars | 100% compliant (dynamic pruning on long glossary terms) | ✅ Clean |
| Missing Meta Descriptions | 0 | 0 | ✅ Clean |
| Meta Description Length | <= 160 chars | **153 compliant, 1 defect found** | ⚠️ **Defect Found** |
| Heading Hierarchy (`<h1>`) | Exactly 1 per page | 154 pages have exactly 1 `<h1>` | ✅ 100% Compliant |
| Canonical URL Tags | Present & absolute | 154 pages point to `SITE_URL` | ✅ 100% Compliant |
| Bidirectional Hreflang | `es`, `en`, `x-default` | 154 pages declare all 3 links | ✅ 100% Compliant |
| OpenGraph Social Cards | Title, Desc, URL, Image | 154 pages have absolute 1200x630 PNG images | ✅ 100% Compliant |
| Twitter Summary Large Image | Title, Desc, Card, Image | 154 pages have Twitter Cards with images | ✅ 100% Compliant |
| JSON-LD Structured Data | Valid schema types | 13 schema types verified across 154 pages | ✅ 100% Compliant |

### 6.2. Specific Discovered Defect
- **File**: `src/app/en/features/disciplina/page.tsx` (Line 44)
- **Current String**: `"The Guardian stops the mistake before it happens: it blocks sizes over your risk, forces you to respect the plan, and audits every exception. Indiscipline measured in money."`
- **Length**: **173 characters** (exceeds standard 160-character SEO maximum by 13 characters).
- **Recommended Remediation**: Shorten to <= 160 chars, e.g.:
  `"The Guardian stops mistakes before they happen: blocks oversized risk, enforces your trading plan, and audits exceptions. Indiscipline measured in money."` (154 chars).

### 6.3. JSON-LD Schema Distribution

```
BreadcrumbList      : 152 instances (All sub-pages in ES & EN)
DefinedTerm         : 102 instances (51 terms × 2 languages)
WebApplication      :  14 instances (7 tools × 2 languages)
Article             :   8 instances (4 feature deep dives × 2 languages)
WebPage             :   6 instances (Trader profiles & Legal)
FAQPage             :   4 instances (/faq, /en/faq, /pricing, /en/pricing)
SoftwareApplication :   2 instances (Home pages ES & EN)
Organization        :   2 instances (Home pages ES & EN)
WebSite             :   2 instances (Home pages ES & EN)
DefinedTermSet      :   2 instances (/glosario, /en/glosario)
ItemList            :   2 instances (/herramientas, /en/herramientas)
Product             :   2 instances (/pricing, /en/pricing)
Quiz                :   2 instances (/test, /en/test)
```

---

## 7. D10: Editorial Accuracy & Institutional Tone Audit

### 7.1. Financial & Profitability Disclaimer Review
- **Zero Profitability Guarantees**: Audit verified that no page makes claims of guaranteed returns, effortless wealth, or risk-free trading.
- **Financial Advice Clause**: Prominently published in `/terminos` (§ `no-advice`), stating unambiguously that tools, calculators, tests, and demo data do not constitute financial advice, investment recommendations, or invitations to trade.
- **Deterministic Math Disclosures**:
  - `EquityProjector` (`/herramientas/proyector-de-capital`): Explicit disclosure: *"Es aritmética, no una promesa: sirve para ver el efecto del interés compuesto, no para contar con él."* / *"It is arithmetic, not a promise: it shows what compounding does, it does not guarantee it."*
  - `EdgeSignificanceChecker`: Explicit clarification that statistical significance measures historical deviation from randomness, not future predictive certainty.
  - `DisciplineScore` (`/test`): Discloses that the 15-question quiz is an indicative behavioral self-assessment, not a psychological diagnosis.

### 7.2. Launch Pricing Representation
- Core ($149) and Pro ($249) are uniformly documented across all 13 touching files as **"Precios previstos de lanzamiento" / "Planned launch prices"**.
- No instant e-commerce checkout or shopping cart exists; instead, users are invited to apply for early access or try the live demo.
- Guarded by automated test in `tests/contratos.test.ts` to prevent price divergence across files.

### 7.3. Demo Re-creation vs Live Trading
- The demo at `/demo` clearly displays: *"Datos de muestra · No es trading real"* / *"Sample data · Not real trading"*.
- Built using deterministic Mulberry32 PRNG (seed `20260716`) with UTC timestamps to prevent temporal and geographic hydration errors (#418 / #423).

### 7.4. Legal Compliance & Data Protection (GDPR / LOPD)
- **Zero Cookies**: The web platform stores 0 cookies. Only 7 functional `localStorage` / `sessionStorage` keys are used.
- **Consent-Gated Analytics**: PostHog EU loads only after explicit consent from `CookieConsent`. Zero form answers, emails, financial values, or calculator inputs are transmitted to external servers.
- **Corporate Disclosures**: `titular.ts` exposes `titularIncompleto` flag, clearly displaying placeholder notices until commercial delivery opens.

---

## 8. Verification Commands & References

To verify this inventory independently, execute the following commands in the workspace root:

```bash
# 1. Run unit test suite (94 tests passing across 10 test files)
bun run test

# 2. Run TypeScript strict typecheck (0 errors)
bun run typecheck

# 3. Run production static build & postbuild (182 static targets)
bun run build

# 4. Run automated SEO audit script
node .agents/spec_miner_survey_1/audit_seo.mjs

# 5. Run D4 bilingual parity verification
bun .agents/spec_miner_survey_1/audit_d4.mjs

# 6. Run editorial copy & prohibited terms audit
node .agents/spec_miner_survey_1/audit_copy.mjs
```
