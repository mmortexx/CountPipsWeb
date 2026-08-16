# Challenger 2 Task Assignment

## Mission
Perform empirical adversarial stress testing on multi-viewport responsiveness, touch target bounds, 165 fps rendering performance, and no-JS fallback safety across CountPipsWeb.

## Authoritative User Request
Path: `c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\ORIGINAL_REQUEST.md`

## Focus Areas
1. **Multi-Resolution & Mobile Viewport (390×844)**:
   - Verify zero horizontal scrolling (`scrollWidth <= innerWidth`) on all marketing pages and 5 WinUI 3 demo views.
   - Verify touch targets $\ge 44 \times 44\text{px}$ on all interactive controls.
   - Verify input font sizes $\ge 16\text{px}$ on mobile viewports.
2. **Rendering & Animation Invariants**:
   - Run `node scripts/humo.mjs --serve out` across all 19 routes and 4 viewports + no-JS.
   - Verify GPU layer compositing (`translate3d`, `contain: layout paint`) and canvas stippling performance.
3. **WCAG AA Legibility**:
   - Run `npm run legible` to evaluate live text node contrast ratios.

Write your verdict (APPROVE or REQUEST_CHANGES) and 5-section report to:
`c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\challenger_2\handoff.md`
