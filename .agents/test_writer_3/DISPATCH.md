## 2026-08-14T16:06:42Z

You are test_writer_3 in the E2E Testing Track for CountPips.
Working directory: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\test_writer_3\
Original Request: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\ORIGINAL_REQUEST.md
Project Blueprint: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\PROJECT.md
Test Infrastructure: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\TEST_INFRA.md
Workspace Root: c:\Users\jmqc1\Documents\Cosas\web-trading-journal

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your scope:
Implement comprehensive, requirement-driven opaque-box Vitest test suites covering:
1. Dimension D4 (Bilingual Parity ES / EN) in `tests/e2e/d4_bilingual_parity.test.ts`:
   - Tier 1 Feature Coverage (>= 5 tests): 100% key parity in `STR` dictionary (`src/lib/i18n.tsx`), glossary parity (all 51 terms matched between `glosario.ts` and `glossary.ts`), tools parity (`herramientas.ts`), FAQs parity (`faq.ts`), 4 legal documents parity.
   - Tier 2 Boundary & Corner Cases (>= 5 tests): Missing translation keys fallback, empty strings check, placeholder interpolation parity (`{0}`, `{name}`), Spanish institutional vocabulary (no spurious anglicisms), English technical grammar.
2. Dimension D5 (SEO Technical & Metadata) in `tests/e2e/d5_seo_metadata.test.ts`:
   - Tier 1 Feature Coverage (>= 5 tests): Unique page titles across all routes, meta description length <= 160 characters on all pages, single `h1` per page, canonical URLs pointing to `SITE_URL`, bidirectional `hreflang` tags ES/EN, JSON-LD schemas (`Organization`, `WebSite`, `SoftwareApplication`), sitemap & robots.txt coherence.
   - Tier 2 Boundary & Corner Cases (>= 5 tests): Truncated descriptions, trailing slash canonical normalization, special character escaping in OpenGraph tags, alternate language URL resolution.
3. Dimension D6 (Performance, SSG & Hydration) in `tests/e2e/d6_performance_hydration.test.ts`:
   - Tier 1 Feature Coverage (>= 5 tests): Temporal determinism in SSG rendering (no client/server time mismatch), dynamic component lazy loading without broken Suspense boundaries, Google font `display: swap` declarations, pure CSS ticker animation.
   - Tier 2 Boundary & Corner Cases (>= 5 tests): Leap year / UTC year transitions, midnight date boundary calculations, simulated slow network dynamic import fallbacks.
4. Dimension D9 & D10 (Security, Privacy & Editorial Tone) in `tests/e2e/d9_d10_security_editorial.test.ts`:
   - Tier 1 Feature Coverage (>= 5 tests): Zero external network requests from calculators (100% client-side computation), PostHog strict consent gating (`CookieConsent`), `dangerouslySetInnerHTML` restricted exclusively to sanitized JSON-LD, institutional copy verification (no guaranteed return promises, pricing disclaimers).
   - Tier 2 Boundary & Corner Cases (>= 5 tests): Injection payloads in tool input fields, rejected cookie consent state transitions, compliance disclaimer presence on all quantitative calculators.

Requirements:
- Tests must be written in TypeScript for Vitest (`npm test`).
- Test actual files, dictionary objects, metadata definitions, and privacy guards.
- Verify that tests run with `npx vitest run tests/e2e/d4_bilingual_parity.test.ts tests/e2e/d5_seo_metadata.test.ts tests/e2e/d6_performance_hydration.test.ts tests/e2e/d9_d10_security_editorial.test.ts`.
- Write your progress to `progress.md` and complete handoff in `handoff.md` in your working directory.
- Send a message back to parent when done.
