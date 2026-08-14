# BRIEFING — 2026-08-14T16:05:00Z

## Mission
Probe, catalog, and document the complete specification and routes inventory of CountPips, covering D4 (Bilingual Parity ES/EN), D5 (Technical SEO & Metadata), D10 (Editorial Accuracy & Institutional Tone), and the Complete Route & Feature Catalog.

## 🔒 My Identity
- Archetype: Specification Miner
- Roles: Teamwork specialist, Spec Miner
- Working directory: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\spec_miner_survey_1\
- Original parent: 50ae3109-7cde-43b1-bd08-1970eec5378d
- Milestone: Survey & Spec Mining Phase (Completed)

## 🔒 Key Constraints
- Read-only exploration and cataloging: do NOT implement/modify application code.
- Exhaustive inventory: probe ALL discovered routes, features, i18n keys, SEO tags, JSON-LD schemas, legal documents, and tone requirements.
- Produce comprehensive survey report `survey_spec_inventory.md` and `handoff.md`.
- Keep messages concise and put long content in reports.

## Current Parent
- Conversation ID: 50ae3109-7cde-43b1-bd08-1970eec5378d
- Updated: 2026-08-14T16:05:00Z

## Task Summary
- **What to build/audit**: Full specification mining of CountPips:
  - Route & Feature Catalog (32 static/dynamic routes, 182 SSG targets, 154 content pages: 77 ES + 77 EN, modals, calculators, tools, demo engine, shortcuts)
  - D4: Strict Bilingual Parity ES/EN (`STR` dictionary with 210 keys, 51 glossary terms, 7 tools, 17 FAQ pairs, 4 legal documents, vocabulary governance)
  - D5: Technical SEO & Metadata (Title tags, meta descriptions, single H1 hierarchy, canonical tags to `SITE_URL`, bidirectional `hreflang`, OpenGraph/Twitter cards, 13 JSON-LD schemas, `sitemap.xml`, `robots.txt`)
  - D10: Editorial Accuracy & Institutional Tone (Copy across all pages, 4 legal documents, tool disclosures: no profitability promises, launch pricing, deterministic simulations, technical demo disclaimer)
- **Success criteria**: Comprehensive `survey_spec_inventory.md` with tabular features, edge cases, route matrices, i18n analysis, SEO checks, and editorial standards.
- **Interface contracts**: `src/lib/i18n.tsx`, `src/lib/site.ts`, `src/lib/locale.ts`, `src/app/`, `src/components/`, `src/data/`
- **Code layout**: Next.js App Router project at `c:\Users\jmqc1\Documents\Cosas\web-trading-journal`

## Key Decisions Made
- Audited compiled HTML in `out/` via automated crawler (`audit_seo.mjs`) alongside source files to guarantee empirical verification of runtime artifacts.
- Isolated 1 specific SEO defect: `src/app/en/features/disciplina/page.tsx` description is 173 chars (> 160 chars limit).

## Artifact Index
- `.agents/spec_miner_survey_1/DISPATCH.md` — Initial dispatch message
- `.agents/spec_miner_survey_1/progress.md` — Liveness & heartbeat log
- `.agents/spec_miner_survey_1/survey_spec_inventory.md` — Comprehensive survey report
- `.agents/spec_miner_survey_1/handoff.md` — 5-component handoff report
- `.agents/spec_miner_survey_1/audit_seo.mjs` — Automated SEO & HTML crawler script
- `.agents/spec_miner_survey_1/audit_d4.mjs` — Bilingual dictionary & data model audit script
- `.agents/spec_miner_survey_1/audit_copy.mjs` — Editorial copy & prohibited terms audit script
