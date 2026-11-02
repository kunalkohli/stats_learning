# DSConcepts — agent onboarding context

Last updated: **2026-11-01**.

This is the local handoff document for the education/learning project. Read it before continuing development, then inspect the current source rather than treating this document as a replacement for it.

## 1. Where things live

- **Project:** `/Users/kunalkohli/Documents/kunal_ai_setup/concepts` (relocated from `concept-journeys` during the November 1 session).
- **This document:** `education/CONTEXT.md`, relative to the project root.
- **Main README:** `../README.md`, relative to this document.
- **Local site:** <http://localhost:3000>
- The app is now in `concepts`; the earlier `concept-journeys` name in historical notes refers to this same project. Run commands from the current project root.

Read the project's `AGENTS.md` before editing. Next.js generates an instruction block requiring agents to read the relevant guides in `node_modules/next/dist/docs/`. Follow it; do not delete the generated block. This project uses Next.js 16 APIs, including asynchronous route `params`.

## 2. What we are building

**DSConcepts** (formerly StatsConcepts) is a local-first educational app for learning data-science concepts and practicing interview skills. Forecasting (31 stops), experimentation (24 stops), and SQL Practice (24 problems) are implemented. Regression and probability/distributions remain **planned**.

### Latest: DSConcepts branding and SQL interview practice

- The user chose the name **DSConcepts** and requested a **new PR for SQL practice**. PR #1 was verified merged; this work starts from the updated `origin/main` on `feat/dsconcepts-sql-practice`. Leave the new PR open; do not merge automatically or change repository permissions.
- Branding, page metadata, favicon, navigation, and exported journal headings use DSConcepts. **Do not rename old `statsconcepts-*` storage keys or the established forecasting/experimentation export filenames.** Existing URLs and note migrations are unchanged. The GitHub repository remains `kunalkohli/stats_learning`.
- Routes: `/sql-practice` plus 24 static `/sql-practice/[slug]` pages. Home and shared navigation link to it. Both layouts and persistent A−/90%/A+ controls work here too. Responsive chrome accounts for the additional navigation link.
- Northstar Commerce is the fictional ecommerce/finance case. Six tables: customers (60), products (6), orders (251), order_items, payments, refunds. All amounts are USD cents, timestamps UTC, and order dates span January–June 2026. Fixtures deliberately include missing emails, zero-order buyers, multiple order lines/quantities, tied timestamps, failed payment attempts, pending refunds, and several refunds against a payment.
- `src/lib/sql/data.ts` generates two deterministic, consistent fixtures. The alternate varies amounts, including making buyer 60's first March order cross the $100 threshold. The visible first-ever March >$100 cohort is customers 2, 40, 56, 57; the variation also includes 60. Do not hardcode these answers into user-facing starter queries.
- `src/lib/sql/questions.ts` defines 12 Basic and 12 Advanced problems with prompts, required columns/order, starter SQL, progressive hints, reference solutions, and explanations. Includes ROW_NUMBER first-ever cohorts, RANK/DENSE_RANK ties, LEAD/LAG, running sums, calendar scaffolding, and refund-safe preaggregation.
- **Engine:** pinned `@duckdb/duckdb-wasm` in a dedicated browser worker. `npm run dev` and `npm run build` run `scripts/prepare-sql-assets.mjs` first; assets are copied from node_modules into ignored `public/sql-engine/`. No CDN dependency, server SQL endpoint, account, or AI integration. MIT notice is in `public/licenses/duckdb-wasm.txt`. Keep generated WASM/worker files out of Git; they are relatively large.
- `src/lib/sql/runner.ts` lazily loads the engine, disables external access/extension auto-install/loading, locks configuration, sets a 128 MB query memory limit, and recreates fixtures for each execution. User SQL is guarded as one SELECT/WITH and embedded in outer SELECT context. No file/network access or writes are intended. This is a local teaching sandbox, not a general production arbitrary-code boundary.
- Limits: 30 seconds for engine startup, then 5 seconds for query/check work, 500 output rows, 20,000 query characters. Timeout and Cancel terminate the worker; recovery is tested. Query errors also discard the worker. Edits while running cancel the stale execution so feedback cannot certify a different draft.
- `src/lib/sql/checker.ts` compares named columns case-insensitively, allows column reordering, preserves row duplicates and typed NULL/value distinctions, and checks row order only when specified. Numeric fractional values normalize to eight decimals; supplied financial amounts fit safe JS integer cents. Check answer must pass the visible and variation fixtures. This is not proof of universal SQL correctness.
- `src/components/sql/` contains CodeMirror SQL editing (plain textarea fallback), results pagination, schema/sample preview/download, scratchpad, hints/solutions, and the main shell. Highlighting uses PostgreSQL grammar only; **actual execution is DuckDB SQL** (`strftime`, `date_diff`, etc.).
- SQL drafts, scratchpads, solved slugs, and resume slug use separate key **`dsconcepts-sql-progress-v1`**. Run and Expected output never mark solved; only successful checks on both fixtures do. Solved badges mean previously solved, not that the current edited draft is correct. Expected output does not appear as an actual query result.
- `tests/sql.test.ts` covers data consistency, cohort traps, comparator semantics, statement guard, and storage validation. `tests/e2e/sql.spec.ts` runs all 24 reference solutions in real browser DuckDB on both fixtures, checks wrong cohorts/hardcoded answers, alternate valid SQL, errors/network/write restrictions, timeout/cancel/recovery, row cap, storage, schemas, and responsive layouts.
- CI remains deferred per the prior explicit user decision. Do not add or push the local ignored workflow or request broader GitHub scopes for this feature. Local tests are not GitHub CI runs.
- SQL/rebrand verification: **20 unit tests, 28 browser tests against development, 28 against a fresh production server, typecheck, production build (87 generated pages), and production-dependency audit (0 vulnerabilities) passed**. Browser tests execute all 24 reference solutions on both fixtures using real DuckDB workers. Desktop/mobile SQL pages were visually inspected. These are local validations, not hosted CI.

### October 31 expansion: two layouts and experimentation

- The original design is **Classic**, still the default. The global header switch selects **Lab**, inspired by the user's new seven screenshots: warm dotted paper, compact contents, heavy bordered windows, purple controls, amber current-stop selection, part cards, and Learn / Explore / Check modes.
- `LayoutProvider` wraps the root layout. Preference key: `statsconcepts-layout` (`classic` / `lab`). It never touches learning progress. Browser storage failure does not prevent switching for the current session.
- Both journeys use `FocusLesson` in Lab mode: intro + point cards + takeaway, an interactive Explore view with a mission panel, and Check with quiz, notes, reading, and next-stop navigation. Classic retains the full reading/playground/quiz page.
- The experimentation story is Northstar, an Amazon-like marketplace testing an engineering/infra change: a new product-page cache. Default design: sticky eligible logged-in buyer assignment; primary metric: at least one purchase within seven days of first eligible visit; mechanism metrics: latency; guardrails: errors, checkout failures, stale data. Never equate faster requests with a proven business win.
- All 24 stops live in `src/lib/experimentation.ts`; six groups of four: foundations, measurement, inference, sharper estimates, hidden traps, and practice. See README for the topic list. Routes: `/experimentation` and `/experimentation/[slug]`.
- `src/components/experiment-labs.tsx` dispatches 19 playground kinds; `src/lib/experiment-math.ts` contains pure math and experiment progress normalization. Conversion uses an unpooled Wald interval and pooled z-test. Planning uses a two-sided 5% / 80%-power independent-buyer normal approximation. Simulations are seeded known-variance Gaussian draws, not exact binomial experiments. All schematics and theoretical curves are labeled.
- Protect the infra-specific lessons: sticky units/cluster-aware inference, intent-to-treat, treatment-independent triggers, shared queue/cache interference, saturation, washout for switchbacks, mature follow-up, and guardrail non-inferiority bounds.
- Do not interpret `1 − 0.95^k` as the exact error rate for correlated cumulative peeks. It is explicitly an independent-tests illustration. Capping changes the revenue estimand; CUPED uses only pre-treatment covariates. No fabricated experiment outcomes or Amazon claims.
- Experiment progress key: `statsconcepts-experimentation-progress-v1`. Shape matches `Progress`, normalized against 24 IDs independently. Existing forecasting keys/migrations are unchanged. Journal adds a separate experimentation section and `statsconcepts-experimentation-journal.md` export; forecasting export remains unchanged.
- New shared files: `layout-preference.tsx`, `focus-lesson.tsx`, `journey-parts.tsx`; new CSS: `src/app/journeys.css`. Keep new Lab overrides scoped to `html[data-layout="lab"]`.
- Round simulation SVG coordinates to avoid Node/browser transcendental-math ulp differences producing hydration warnings. New chart axes must use the correct units (`money={false}` for latency and conversion).
- Tests: `tests/experimentation.test.ts` and `tests/e2e/experimentation.spec.ts` supplement existing coverage. CI runs unit/type/build/browser checks. `playwright.config.ts` auto-starts a production server only when `CI` is set; local tests still use an existing server.
- Repository target is `https://github.com/kunalkohli/stats_learning`. Preserve its original MIT license and initial commit. User explicitly requested pushing changes on a feature branch and creating a PR, **not merging or pushing app changes directly to main**.
- `.github/CODEOWNERS` assigns all files to `@kunalkohli`. Protection config and the initial-PR/self-approval limitation are documented in `.github/REVIEW_POLICY.md`. A CODEOWNERS file does not enforce review until on the base branch; do not claim otherwise.
- Verification for this expansion: **13 unit tests passed, 17 browser tests passed against dev and production, typecheck passed, and production build generated 62 pages**. Browser coverage includes every new lesson, Lab modes, mobile overflow, storage separation, migrations, notes/export, controls, keyboard workflow, and blocked storage. Next type generation runs before `tsc` so clean checkouts do not require an existing `.next/` directory.
- Initial GitHub `main` protection included one approving review, code-owner reviews, stale dismissal, latest-push review, administrator enforcement, CI, resolved conversations, and force-push/deletion blocks. **This initial configuration was subsequently changed by explicit user requests:** CI is deferred and the owner/admin bypass is enabled. Current configuration is recorded in `.github/main-protection.json` and the latest review-policy correction below. Owner-specific review still waits for CODEOWNERS on the base branch. Do not merge the PR automatically.

Each forecasting stop has:

1. A plain-language explanation.
2. A diagram, interactive teaching tool, or comparison table.
3. A short takeaway.
4. A multiple-choice check with immediate explanatory feedback.
5. A private learning note and a manual “Mark as understood” action.
6. A further-reading link to the relevant FPP3 section.

The goal is intuition, not a certificate, a graded course, or a production forecasting service. The learner decides when an idea makes sense; passing the quiz does not automatically mark it understood.

### Running example

The original reference screenshots used a bakery. The user specifically requested replacing it with **Northstar, a fictional ecommerce company**, forecasting its daily sales.

Keep this story consistent:

- Underlying business growth.
- Weekly shopping patterns.
- Smooth annual variation.
- A recurring **Black Friday/Cyber Monday** lift.
- Random variation and occasional business/data issues.

Black Friday is recurring but **not a fixed date or guaranteed 364-day lag**. Model its actual calendar date and event-relative windows. The simulator computes the Friday after the fourth Thursday of November in UTC.

## 3. User preferences and decisions to preserve

### Branding and visual design

- The original implementation was called **Fieldnotes**, then **StatsConcepts**. The user has now chosen **DSConcepts**. Preserve legacy progress keys when changing visible branding.
- Do not restore the earlier serif/editorial design. The user explicitly wanted the layout from their screenshots and the coloring from:
  `/Users/kunalkohli/Documents/kunal_ai_setup/profile.html`.
- Image references: `/Users/kunalkohli/Downloads/IMG_0496.jpg` through `IMG_0508.jpg` inclusive.
- Current design: visible graph-paper background, large regular-weight sans-serif headings, dark ink, lime accents, bordered panels, minimal decorative effects.

Exact palette from `profile.html`:

| Token | Value |
| --- | --- |
| Paper | `#eeeee5` |
| Panel | `#f3f3eb` |
| Ink | `#20271f` |
| Muted text | `#555c50` |
| Borders | `#8b9080` |
| Grid | `rgba(104,119,91,.15)` |
| Lime | `#c9dd91` |
| Green | `#9bc452` |

Classic fonts are local system stacks: Helvetica Neue/Helvetica/Arial and a system monospace stack. Lab now uses bundled Nunito, including for metadata and controls, to match the user's rounded-text reference. No external Google Fonts runtime dependency exists.

### Screenshot correction and text sizing (November 1)

- The user said the first Lab implementation was too different from the reference, especially typography. Lab now uses self-hosted `public/fonts/Nunito-Variable.ttf`, OFL license alongside it, bold rounded headings, heavier black offset borders, numbered sidebar circles, amber active items, and lesson-specific numbered guided steps.
- Learn / Explore / Check pills sit **inside** the title panel (`FocusLesson` receives the shared title as a slot). Classic's title/reading layout remains separate. Keep marking understood manual.
- `lab-workspace.css` contains the refined Lab styles; `typography.css` centralizes rem-based typography so real text scales without CSS/browser zoom. Classic keeps its system-font appearance.
- **A− / 90% / A+** controls are in every page header, at the top right. Default 90%; 10-point steps; 70–140% range; click percentage to reset to 90%. Key: `statsconcepts-text-size`. Invalid values restore to 90%; blocked storage still allows session-only changes. Root SSR defaults to 90%, and the provider restores the preference after hydration.
- `display-preferences.ts` contains pure validation/constants. The `DisplayControls` component combines text sizing with the existing layout choice. Neither preference touches lesson notes or progress. Changing text size must not remount a playground or reset controls.
- `journey-guides.ts` provides two concrete actions per experiment lab. The underpowered-test display defaults to 1,000 buyers/arm and a supplied +1.00 pp effect; its scatterplot shows significant positive/negative dots, a known-variance non-significance band, truth and average-significant lines, theoretical power, significant counts, exaggeration, and wrong-sign counts. Advanced options retain true-effect, interval, and winner-highlighting controls. Statistics are computed, not copied from screenshot numbers.
- `tests/display-preferences.test.ts` and `tests/e2e/display.spec.ts` cover preference validation, actual text-size changes, persistence across routes/layouts, local font loading, guided steps, chart controls, bounds, blocked storage, and enlarged-text mobile layouts.
- Latest correction validation: **15 unit tests, 20 browser tests on dev, 20 browser tests on a fresh production server, typecheck, and build all passed**. The enlarged-text toolbar is explicitly tested at widths 320, 390, 800, 1024, and 1280 px, not just document-level overflow. Desktop and mobile screenshots were visually inspected at 90%.
- **Latest review-policy correction:** the user explicitly requested no review for their own PRs. A narrow individual-user PR bypass was attempted, but GitHub rejected it because this is a personal (not organization-owned) repository. Applied and verified the available owner/admin bypass: `enforce_admins: false` and `require_last_push_approval: false`. One required review, code-owner review, stale dismissal, conversation resolution, and the configured force-push/deletion blocks remain enabled for contributors. The owner bypass is broader than own-PR-only and can bypass other applicable protections; do not claim a native author-conditional exemption. GraphQL confirmed `viewerCanMergeAsAdmin: true` on PR #1, which remains OPEN and may still show REVIEW_REQUIRED. The owner may need to select the UI's bypass checkbox. Do not merge automatically.
- Push initially failed because GitHub OAuth lacked `workflow` scope; both attempted device refreshes timed out. The user subsequently **explicitly approved** pushing app/content/README now without CI and removing only the required CI status. The workflow remains on disk at `.github/workflows/checks.yml`, excluded locally via `.git/info/exclude`; full pre-publish history is preserved on local branch `local/complete-app-with-ci`. Published branch: `feat/experimentation-lab-layout`, consolidated from the original remote `main` without the workflow in its history. **PR #1 is open and unmerged:** <https://github.com/kunalkohli/stats_learning/pull/1>. Remote main remains its initial commit. CODEOWNERS has no validation errors. Do not claim GitHub CI ran. Add the workflow and restore required status checks in a later PR once auth is fixed. Required reviews, stale dismissal, conversation resolution, and configured force-push/deletion blocks remain for contributors, with the explicitly authorized owner/admin bypass described above. Do not merge automatically.

### Layout

- Home: oversized two-line headline, intro panel on the left, small concept illustration on the right; subsequent sections have a heading on the left and content panel on the right.
- Forecasting: fixed contents rail, top contents/navigation toolbar, large introduction, and a winding linked SVG route map.
- Desktop lessons: sticky lesson title/status on the left, bordered reading/playground panel on the right. Narrow screens stack the content and use a slide-out contents rail.
- The desktop comparison is a real table; on mobile its rows become readable stacked cards rather than requiring horizontal scrolling.

### Workflow interaction: important recent feedback

The user found it difficult to select a workflow step at the top and scroll past all other steps to find its explanation. We changed the explanation to expand **directly below its own heading**.

The user then explicitly asked for **one expanded step at a time**. Current behavior:

- First step starts open.
- Selecting another step collapses the previous one.
- Exactly one step remains open; clicking the active step does not collapse it.
- No “Read all” / “Expand all” control remains.
- Keyboard Enter/Space and `aria-expanded`/`aria-controls` are supported.

Do not revert to a separate shared detail panel or a multi-open accordion.

### Working while the user browses

The user is actively viewing the local app. Twice they caught an intermediate state: new markup with old CSS, and a blank new lesson playground before its renderer was connected. Prefer completing and wiring a feature together, and verify its rendered browser state before calling it ready. Do not confuse an empty renderer with a missing external image.

## 4. Current curriculum: 31 stops

Source of truth: `src/lib/curriculum.ts`.

| Part | Stops | Topics |
| --- | --- | --- |
| I · Foundations | 1–4 | Forecast ranges; trend/seasonality/noise; distinguishing trend from seasonality; decomposition |
| II · Measuring | 5–8 | Baselines; growth rates; holdout/backtesting; error metrics |
| III · Signal | 9–12 | Autocorrelation; residuals/white noise; stationarity/differencing; base effects |
| IV · Models | 13–18 | SES; Holt; Holt–Winters; Fourier terms; events/holidays; model families |
| V · More models | 19–25 | ETS; ARIMA/autoregression; SARIMA/SARIMAX; DHR; Prophet; MSTL + ETS; three-model comparison |
| VI · In practice | 26–31 | Prediction intervals; drivers/leakage; hierarchy; ML/combinations; forecast/plan/target; forecasting workflow |

Important URLs:

| Route | Purpose |
| --- | --- |
| `/` | Homepage and journey library |
| `/forecasting` | Journey introduction and route map |
| `/forecasting/autocorrelation` | ACF, lags, and persistence |
| `/forecasting/arima` | Autoregression and ARIMA explanation/playground |
| `/forecasting/dynamic-harmonic-regression` | DHR |
| `/forecasting/prophet` | Prophet |
| `/forecasting/mstl-ets` | Stop 24: MSTL + ETS pipeline |
| `/forecasting/prophet-dhr-mstl` | Stop 25: Prophet vs DHR vs MSTL + ETS |
| `/forecasting/forecasting-workflow` | Stop 31: reusable forecasting roadmap |
| `/journal` | Notes, understood stops, Markdown export |

### Autocorrelation and autoregression

The user specifically requested these concepts. Preserve the distinction:

- Autocorrelation describes a series' relationship with lagged copies of itself.
- Autoregression uses lagged values to predict.
- The AR(1) playground changes `φ`, shows positive persistence/negative alternation, theoretical versus sample ACF, and mean reversion.
- For a stationary pure AR(1), `ACF(k) = φ^k`. Do not generalize this identity to all ARMA processes or raw trending sales.
- ARIMA's MA part uses lagged innovations, not a rolling average of sales.

### MSTL + ETS and comparison

The user's final comparison request was **Prophet vs DHR vs MSTL + ETS**, not just DHR vs MSTL.

- MSTL + ETS: decompose multiple seasonal components, forecast the adjusted series with nonseasonal ETS, project seasonal components, and recombine.
- The adjusted series is **trend plus remainder**, not the remainder alone.
- Common seasonal projection repeats the latest component cycles. Evolving historical seasonality does not imply automatic extrapolation of future seasonal changes.
- Moving holidays need explicit handling; repeating an annual slot is not sufficient.
- The comparison table covers mechanics, strengths, weaknesses, trend/memory, seasonal changes, moving events, predictors, uncertainty, and tuning.
- Topic filters and a use-case selector are implemented. No universal winner or fabricated model-accuracy score is shown.

### Forecasting workflow

The user originally requested this as “section 29.” It is now **stop 31**, after inserting the two new More models lessons. Its URL did not change.

Eight workflow steps:

1. Define the decision.
2. Audit and explore.
3. Set a simple baseline.
4. Backtest realistically.
5. Diagnose the misses.
6. Try a targeted candidate.
7. Compare and decide.
8. Refit, use, and monitor.

Each has an action, a Northstar example, an expected output, and links back to relevant lessons. A pattern-based guide suggests candidates for level, trend, single seasonality, multiple seasonalities/events, residual dependence, sparse demand, and limited history.

Teaching principle: **baseline → honest tests → diagnosis → targeted improvement**, not a mandatory SES → ETS → Fourier → ARIMA → ML complexity ladder. The baseline is allowed to win.

## 5. Architecture and file map

Stack: **Next.js 16 App Router, React 19, TypeScript, custom CSS/SVG, Lucide icons**. No database, authentication, tracking, model API, or external forecasting service is configured.

| File | Responsibility |
| --- | --- |
| `src/app/layout.tsx` | Root layout, metadata, global CSS |
| `src/app/page.tsx` | Homepage entry |
| `src/app/forecasting/page.tsx` | Journey entry |
| `src/app/forecasting/[slug]/page.tsx` | Static lesson params, metadata, lookup, and 404 handling |
| `src/app/journal/page.tsx` | Journal entry |
| `src/app/globals.css` | Reference design, all component styles, responsive/reduced-motion rules |
| `src/app/icon.svg` | Green circular SC favicon |
| `src/components/home.tsx` | Homepage and planned journey cards |
| `src/components/chrome.tsx` | Brand/header and inline SVG sketches |
| `src/components/site.tsx` | Forecasting shell, contents, lesson UI, journal, exports |
| `src/components/route-map.tsx` | Winding SVG map and mobile route list |
| `src/components/chart.tsx` | Shared SVG time-series and ACF chart renderers |
| `src/components/labs.tsx` | Lab dispatch, common controls, most playgrounds |
| `src/components/seasonal-model-labs.tsx` | MSTL schematic and three-model comparison UI |
| `src/components/workflow-lab.tsx` | Single-open inline workflow accordion and model guide |
| `src/components/progress.ts` | Client-side storage hook and migration invocation |
| `src/lib/curriculum.ts` | Lessons, grouping, prose, quiz data, lab type, reading links |
| `src/lib/forecast.ts` | Deterministic sales simulator, holiday calendar, moving average, metrics |
| `src/lib/model-comparison.ts` | Comparison table rows and scenario guidance |
| `src/lib/workflow.ts` | Eight workflow stages and candidate-selection branches |
| `src/lib/progress.ts` | Pure progress normalization and legacy ID migration |
| `tests/forecast.test.ts` | Unit/content/migration checks |
| `tests/e2e/app.spec.ts` | Playwright browser checks |
| `playwright.config.ts` | Chromium/base URL/test configuration |
| `next.config.ts` | Disables the normal Next development indicator |

Most interactive UI lives in client components; route entries use the App Router. New lesson pages are generated automatically from `lessons` via `generateStaticParams`.

## 6. Teaching data and statistical limitations

**Do not present the playgrounds as fitted production models.**

- The reproducible sales simulator creates 1,096 daily observations for 2023–2025 and exposes its true components.
- Some diagrams use these known “oracle” components to isolate an idea. Those are not estimated STL/MSTL components.
- The MSTL pipeline diagram uses oracle seasonal components and a supplied level/trend projection. It does **not** implement a full MSTL or ETS fitting algorithm.
- The AR playground illustrates an AR(1) process and its conditional mean, not a fitted business forecast.
- Prediction bands are illustrative, not empirically calibrated for Northstar.
- Baseline scores are computed from an actual chronological **simulated** holdout, using pre-origin predictors. A supplied growth assumption is not a growth rate learned from future holdout observations.
- Residual/decomposition examples are teaching constructions, not statistical test results.
- Do not invent performance rankings for Prophet/DHR/MSTL + ETS. Real comparison requires matched time-aware evaluation.
- Backtests must refit decomposition, transformations, and feature preparation inside each training window. Keep known-ahead predictors separate from realized future outcomes.

## 7. Progress storage: protect the user's notes

Current local storage key: **`statsconcepts-progress-v2`**.

Shape:

```ts
{
  understood: number[];
  notes: Record<string, string>; // numeric lesson IDs as object keys
  lastLesson: number;
}
```

Fallback order when v2 is absent:

1. `statsconcepts-progress-v1`
2. `fieldnotes-progress-v1`

The older curriculum had 29 lessons. Inserting MSTL/comparison at 24–25 moved old practice IDs **24–29 to 26–31**. `restoreProgress(value, true)` migrates understood IDs, note keys, and last lesson; the hook writes the result to v2. Old keys are not deleted. Reloading v2 must **not** apply that translation a second time.

Notes are private to this browser/origin. Clearing site data, switching browsers/devices, or changing ports can make them unavailable. The journal exports Markdown as `statsconcepts-forecasting-journal.md`. Do not clear storage as a debugging shortcut in the user's browser.

### Adding or reordering lessons

Several places depend on numeric IDs matching 1-based array positions. Be deliberate:

- Keep `Lesson.id` contiguous and consistent with array order.
- Update `parts[].range`.
- Review numeric references in `workflow.ts`.
- Provide a new storage migration if existing IDs change again.
- Preserve URL slugs when possible.
- UI totals use `lessons.length`; do not reintroduce hard-coded counts.
- The route map computes its height from the number of rows; ensure new nodes and part labels fit.
- Update count-specific tests and this context doc/README.
- New lab types need both a title and a renderer in `labs.tsx`; otherwise the learner sees a blank box.

## 8. Run, restart, and verify

From the project root:

```bash
npm install
npm run dev -- --port 3000
```

Open <http://localhost:3000>. Dev/start scripts bind to `127.0.0.1`, not the public network. The server was most recently restarted during this session; **check whether it is still running**, rather than assuming it survives agent/server restarts.

```bash
curl --fail --silent --output /dev/null --write-out '%{http_code}\n' http://localhost:3000
```

If port 3000 is occupied, identify the listener before stopping anything. An alternative is `npm run dev -- --port 3001`; remember that a different origin has different browser storage.

Validation:

```bash
npm test
npm run typecheck
npm run build
npx playwright install chromium
# Requires an already-running app:
npm run test:e2e
```

Production preview, separately from dev:

```bash
npm run build
npm start -- --port 3001
# In another terminal:
BASE_URL=http://127.0.0.1:3001 npm run test:e2e
```

Playwright config does not automatically start a web server. Screenshots on failure go to `test-results/`, which is ignored along with `node_modules/`, `.next/`, and generated test artifacts.

Last implementation validation before this documentation task: **8 unit tests passed, 11 browser tests passed, and the production build succeeded**. These are historical results, not a promise about future changes; rerun after editing behavior. This documentation task itself does not change application behavior.

Coverage includes all 31 routes, mobile overflow, quiz feedback, notes/export, migrations, AR controls, MSTL/comparison controls, final workflow navigation, and the single-open inline accordion.

## 9. References and next-agent checklist

Primary teaching reference: Hyndman & Athanasopoulos, **Forecasting: Principles and Practice, 3rd edition**, <https://otexts.com/fpp3/>. Content/examples here are original, not copied textbook chapters.

Useful sections:

- <https://otexts.com/fpp3/graphics.html#sec-acf>
- <https://otexts.com/fpp3/arima.html#sec-AR>
- <https://otexts.com/fpp3/advanced.html#stl-with-multiple-seasonal-periods>
- <https://otexts.com/fpp3/advanced.html#sec-complexseasonality>
- <https://otexts.com/fpp3/intro.html#sec-basic-steps>

Some older FPP3 section URLs redirect; verify new reading links rather than guessing their filenames.

Before handing off another change:

- [ ] Preserve the reference design and Northstar example.
- [ ] Verify the changed lesson actually renders; an empty lab border is not completion.
- [ ] Check desktop and mobile without horizontal overflow.
- [ ] Keep workflow explanations inline, exactly one open at a time.
- [ ] Label illustrative/oracle diagrams honestly.
- [ ] Preserve notes and progress through any ID changes.
- [ ] Run relevant tests and distinguish new results from historical ones.
- [ ] Keep this file current when the curriculum, behavior, or architecture changes.

There is no requested unimplemented feature queued at the time of this handoff. Planned journeys and production model fitting are future possibilities, **not authorized work to start automatically**.
