# DSConcepts — Learn it, then try it

A local-first learning site built with **Next.js 16, React 19, TypeScript, and hand-built SVG diagrams**. Learn concepts and practice SQL with one fictional ecommerce company: **Northstar**. Previously branded StatsConcepts; existing learning notes, progress, and preferences are preserved.

- **Forecasting:** 31 stops, from uncertainty and seasonality to models and practical workflows.
- **Experimentation:** 24 stops, following an Amazon-like marketplace testing a new product-page cache. Measure buyer conversion, latency, reliability, and the evidence needed for a safe rollout.
- **SQL Practice:** 24 interview-prep problems (12 basic, 12 advanced), a focused problem statement, a syntax-highlighted editor, and real browser-local DuckDB execution. Inspect schemas/sample data, run queries, compare results, reveal hints, and work through ecommerce/finance cases.
- **LLMs & AI (work in progress):** a homepage placeholder for learning how LLMs work—tokens, embeddings, attention, transformers, and training—and how to use AI models, including prompting, model selection, tools, retrieval, and evaluation. No lessons, labs, or model integrations are implemented yet.
- **Two layouts:** use the **Classic / Lab** control in the header. Classic keeps the original spacious graph-paper design; Lab adds a compact rail, part cards, focused concept cards, and **Learn / Explore / Check** modes. The preference persists across journeys. Regression and probability remain planned.
- **Structured explanations:** Classic lesson bullets are now emoji-led tables: **concept/component → what it means → Northstar example**. All forecasting and experimentation lessons have authored business examples. The components lesson distinguishes trend, seasonality, cycle, and remainder, with a separate additive/multiplicative comparison.
- **Scannable lesson copy:** multi-sentence introductions, definitions, explanations, and table examples render as sentence-by-sentence bullets in both layouts; short single-sentence copy stays as prose. Wording, punctuation, numerical caveats, and order are preserved. The planning-case introduction uses the full available width above its table rather than wrapping at an artificial text-width cap.
- **Focused Learn cards:** Lab lays short cards on one scrollable page instead of a paginated deck. Each card carries one or two ideas, with sections such as **The big idea**, **Why it matters**, **How it works**, **Remember this**, and compact concept/meaning/Northstar tables. Formulas and takeaways stay intact, and the cards stack cleanly on narrow screens or at 140% text. The expanded first forecast lesson includes a structured Northstar planning use case in both layouts.
- **Lesson-specific forecast labs:** history-window fitting, animated rolling backtests, lag scatterplots with ACF bars, biased residual diagnostics, growth-rate and six-metric error experiments, hierarchy reconciliation, driver leakage, interval coverage, staged Holt–Winters, Fourier wave fitting, and DHR residual correction. Each lab states what is computed, what is supplied, and what is only illustrative.
- **Text size:** top-right **A− / 90% / A+** controls default to **90%**. Adjust in 10-point steps from 70% to 140%; click the percentage to reset to 90%. Your setting persists across pages and both layouts without changing browser zoom or lesson progress.

**Agent onboarding:** Read [education/CONTEXT.md](education/CONTEXT.md) for implementation history, user preferences, architecture, curriculum, storage migrations, and development/testing guidance.

## Run locally

```bash
cd /Users/kunalkohli/Documents/kunal_ai_setup/concepts
npm install
npm run dev
```

Open **http://localhost:3000**. The server binds to loopback, not the public network. To use another port: `npm run dev -- --port 3001`.

Open **http://localhost:3000/sql-practice** for SQL interview practice. Node **22+** is recommended. `npm run dev` and `npm run build` automatically run `prepare:sql`, copying DuckDB's worker/WASM assets from the installed, locked npm package into ignored `public/sql-engine/`. These relatively large assets are served by this app—not a CDN—and are not committed to Git. Run `npm run prepare:sql` manually if needed. Browser support requires Web Workers and WebAssembly; the first query loads the engine. No database server or external service is required.

```bash
npm run build
npm start
```

## What’s included

- Journey library with forecasting and experimentation available; future journeys explicitly labeled as planned.
- All **31 forecasting stops**, grouped into six parts, with explanations, interactive playgrounds, takeaways, and answer-feedback questions.
- Stops 24–25 introduce MSTL + ETS and compare **Prophet vs DHR vs MSTL + ETS**, with a responsive strengths/weaknesses table, model mechanics, event handling, and uncertainty caveats.
- Stop 31 provides an end-to-end forecasting workflow: define, audit, baseline, backtest, diagnose, try a targeted candidate, compare, and monitor. Includes a model-selection guide and links back to the relevant concepts.
- Annual Black Friday / Cyber Monday effects calculated from the actual event calendar. Covers moving-date alignment, why a 364-day lag can fail, trend versus seasonality, and event-relative features.
- Dedicated **autocorrelation** lesson plus **autoregression in ARIMA**: lags, ACF versus PACF, positive/negative AR(1) coefficients, conditional-mean reversion, differencing, and MA innovations versus rolling averages.
- Local progress, per-lesson notes, a journal, and Markdown export. No account, remote database, tracking, or hosted service.
- Responsive navigation and reduced-motion support.
- Original explanations and diagrams with further-reading links to Hyndman & Athanasopoulos, *Forecasting: Principles and Practice*, 3rd edition, [OTexts](https://otexts.com/fpp3/).
- Experimentation lessons cover randomization, hypotheses, buyer-level assignment, intent-to-treat, lift, latency percentiles, guardrails, A/A and SRM, sampling, confidence intervals, p-values, power/MDE, underpowered winners, stopping, capping, CUPED, triggering, ratios, multiplicity, infrastructure interference, segments, ramps, and decisions.
- Experimentation includes computed conversion/interval comparisons, sample-size planning, 300-trial simulations, and explicit theoretical/schematic demonstrations. Further reading links to Microsoft ExP and the NIST handbook.

## Important limitations

The playgrounds teach concepts; they do **not** fit full production ARIMA, ETS, STL, Prophet, or ML models. Some labs implement deliberately small teaching algorithms—SES/Holt–Winters recursions, OLS and Fourier regression, a single AR(1) error correction, rolling refits—with fixed or supplied parameters. They are not tuned or validated forecasting services. Diagrams clearly identify simulated data, supplied coefficients, and oracle components. Baseline error scores are calculated from a chronological simulated holdout. Future inputs are not used as predictors. Prediction bands are illustrative unless a lab explicitly computes coverage, and none are calibrated Northstar business intervals.

Notes and progress stay in this browser’s local storage. Export before clearing site data or changing browsers/devices. Classic uses the graph-paper palette in `../profile.html` and local system fonts. Lab uses rounded **Nunito**, bundled in `public/fonts/` under the SIL Open Font License, stronger ink borders, dotted paper, numbered navigation, and guided steps. No external font requests are made at runtime.

Experimentation uses constructed data, not Amazon data. Conversion inference assumes independent buyers, mature outcomes, and fixed-horizon large-sample analysis. The trial simulation is a known-variance Gaussian approximation, not exact binomial inference. CUPED, spillovers, and load curves are theoretical/schematic, not fitted engines. Cumulative peeking is not modeled by the independent-tests formula. Every playground states its limitations.

Forecasting notes keep their original storage key and ID migrations. Experimentation notes use a separate key and appear in a separate journal section with their own Markdown export. Layout preferences never migrate or overwrite lesson notes.

## SQL interview practice

### The case and dataset

Northstar Commerce sells products to buyers in the US, GB, and CA. **All transactions are USD cents** regardless of buyer country; no currency conversion is implied. Order timestamps are UTC. The fixed data covers January–June 2026:

- `customers`: 60 fictional buyers, including NULL emails and accounts with no orders.
- `products`: six catalog products and categories.
- `orders`: 251 orders with completed, cancelled, and pending statuses.
- `order_items`: historical sale prices and quantities; line sums reconstruct each order total.
- `payments`: captured payments and failed attempts, potentially on the same order.
- `refunds`: succeeded/pending requests, including multiple refunds against one payment.

The compact **Data & schema** panel prioritizes tables used by the current problem. Switch between **Schema** (column names and types) and **Sample data** (first ten rows). Expand **Table notes & relationships** for business definitions, foreign-key relationships, and status meanings. Download the full fixture as SQL from the panel footer. On desktop, the panel stays alongside the editor while scrolling.

### Problems

**Basic (1–12):** SELECT/filter/sort, NULL handling, status counts, monthly revenue, average order value, HAVING, customers without orders, joins by country, conditional aggregation, category line revenue, net collections, and March spend thresholds.

**Advanced (13–24):** first-ever completed orders; first-ever March orders over $100; RANK versus DENSE_RANK ties; LEAD/LAG purchase gaps; running customer spend; monthly revenue changes; second-purchase timing; country winners with ties; refund-safe financial preaggregation; calendar filling before running sums.

### Editor and checking

- CodeMirror provides syntax highlighting, line numbers, schema-aware completion, and **Cmd/Ctrl+Enter** to run. A plain-text editor remains available if enhancement fails.
- New problems start with a **blank editor**, so you write the query yourself. Returning to a problem restores only your own saved draft. **Clear query** asks before removing a nonempty draft and stays blank after reload. Hints and solution loading are opt-in; SQL is never filled automatically.
- **Run query** executes your SQL; it never marks a problem solved. **Expected output** lets you inspect the target without awarding progress.
- **Check answer** compares named columns and typed result values with the reference, not SQL text. Column order and alias case may differ. Row order is ignored unless the question requires sorting. NULL differs from the text `NULL`, and duplicate row counts matter. Fractional numbers are normalized to eight decimal places; monetary answers stay in cents.
- A correct visible result is also checked against a deterministic amount-variation fixture. This catches some hardcoded outputs and threshold errors, but passing two fixtures is **not proof of correctness on every possible dataset**.
- Hints are progressive; solutions/explanations are revealed only on request. Each problem saves its query draft and successful checks in this browser under `dsconcepts-sql-progress-v1`. The workspace intentionally omits a large heading card, topic tags, scratchpad, and checking explainer to keep attention on the statement, query, results, and data. Previously saved scratchpad notes are preserved in storage, not displayed or deleted. Existing `statsconcepts-*` keys intentionally remain unchanged for backwards compatibility.

### Execution limits and dialect

The dialect is **DuckDB SQL**, not PostgreSQL or MySQL. Examples use `strftime`, `date_diff`, timestamp literals, CTEs, and window functions. CodeMirror's PostgreSQL grammar is used only for highlighting/completion; DuckDB decides query semantics.

Queries run in a dedicated DuckDB Web Worker against a fresh in-memory fixture per execution. A one-statement SELECT/WITH guard and an outer SELECT query context reject writes and statement escapes. External access and extension installation/loading are disabled, configuration is locked, and the engine is given a 128 MB query memory limit. Output is capped at 500 rows. A 5-second execution deadline (separate 30-second engine startup limit) or **Cancel query** terminates the worker; subsequent runs recreate it. This is a local teaching sandbox, not a security boundary for executing arbitrary code on a production server. No query is uploaded.

DuckDB worker/WASM assets are copied from npm during development/build. Its MIT notice is included at `public/licenses/duckdb-wasm.txt`; CodeMirror is MIT-licensed through its npm distribution. Bundled Nunito retains its separate SIL OFL notice.

## Project map

| Path | Purpose |
| --- | --- |
| `src/lib/curriculum.ts` | All 31 lessons, quizzes, grouping, and reading links |
| `src/lib/workflow.ts` | Workflow stages and pattern-based model-selection guidance |
| `src/components/workflow-lab.tsx` | Interactive workflow and model guide for the final stop |
| `src/components/seasonal-model-labs.tsx` | MSTL pipeline schematic and responsive three-model comparison |
| `src/lib/model-comparison.ts` | Comparison table and use-case guidance |
| `src/lib/progress.ts` | Saved-progress normalization and migration after lesson insertion |
| `src/lib/forecast.ts` | Reproducible sales simulation, holiday calendar, metrics |
| `src/components/labs.tsx` | Interactive teaching playgrounds and lab router |
| `src/components/forecast-diagnostic-labs.tsx` | Focused forecasting labs: history, backtest, ACF, residuals, growth, metrics, hierarchy, drivers, intervals, Holt–Winters, Fourier, DHR |
| `src/lib/forecast-playgrounds.ts` | Reproducible fitting, backtests, diagnostics, and simulation helpers |
| `src/components/chart.tsx` | SVG time-series and ACF charts |
| `src/components/lesson-teaching.tsx` | Emoji-led teaching tables, baseline comparison, Remember this |
| `src/app/focused-learning.css` | Focused-card and diagnostic-lab styling |
| `src/components/site.tsx` | Homepage, route map, lessons, journal |
| `src/components/home.tsx` | Reference-style homepage and concept library |
| `src/components/chrome.tsx` | DSConcepts branding, header, and sketches |
| `src/components/route-map.tsx` | Linked winding route map and mobile equivalent |
| `src/components/progress.ts` | Browser storage hook |
| `src/app/globals.css` | Paper/notebook design and responsive styles |
| `src/app/forecasting/[slug]/page.tsx` | Statically generated lesson routes |
| `src/lib/experimentation.ts` | All 24 experimentation lessons and six parts |
| `src/lib/experiment-math.ts` | Conversion inference, power, seeded simulations, and experiment progress normalization |
| `src/components/experimentation.tsx` | Experimentation shell, contents, notes, and journal |
| `src/components/experiment-labs.tsx` | Nineteen kinds of experimentation playground |
| `src/components/layout-preference.tsx` | Shared persistent Classic/Lab choice and journey navigation |
| `src/components/focus-lesson.tsx` | Lab reading cards and Learn/Explore/Check modes for both journeys |
| `src/lib/reading-pages.ts` | Balanced groups of 2–3 reading ideas, preserving order and final formula/takeaway |
| `src/lib/lesson-teaching.ts` | Authored emoji/example metadata for all 55 lessons, component comparisons, and first-forecast use case |
| `src/components/lesson-teaching.tsx` | Accessible concept/example and business-use-case tables |
| `src/app/lesson-teaching.css` | Responsive teaching tables and Lab business-example styling |
| `src/components/journey-parts.tsx` | Linked part-card overview |
| `src/app/journeys.css` | New journey styles and scoped Lab design |
| `src/app/lab-workspace.css` | Screenshot-inspired rounded Lab typography, panels, and responsive toolbar |
| `src/app/typography.css` | Rem-based text sizing shared by both layouts |
| `src/lib/display-preferences.ts` | Default, limits, and safe restoration of text-size preferences |
| `src/lib/journey-guides.ts` | Two actionable guided steps for each experimentation playground |
| `public/fonts/` | Self-hosted Nunito variable font and its OFL license |
| `src/lib/sql/questions.ts` | 24 SQL prompts, output contracts, hints, solutions, and explanations |
| `src/lib/sql/data.ts` | Reproducible Northstar tables, schema, and two fixtures |
| `src/lib/sql/runner.ts` | Browser-local DuckDB worker lifecycle, limits, and result conversion |
| `src/lib/sql/checker.ts` | Read-only statement guard and result comparison |
| `src/lib/sql/progress.ts` | Independent draft/solved-state normalization; preserves legacy notes |
| `src/components/sql/` | Practice workspace, CodeMirror editor, schema explorer, and result tables |
| `src/app/sql-practice/` | Overview and 24 statically generated problem routes |
| `src/app/sql-practice.css` | Practice layout and responsive navigation |
| `scripts/prepare-sql-assets.mjs` | Copy installed engine assets into ignored public output |
| `.github/CODEOWNERS` | Owner review policy for all files |
| `.github/REVIEW_POLICY.md` | Owner-review rules, initial-PR limitations, and deferred CI setup |

To add or edit forecasting content, start with `curriculum.ts`. To add a new journey, create a curriculum, route, and library card; planned cards are intentionally not fake links.

## Tests

```bash
npm test
npm run typecheck
npx playwright install chromium
# With the development server running:
npm run test:e2e
# Or test a running production server on another port:
BASE_URL=http://127.0.0.1:3001 npm run test:e2e
```

Tests cover holiday dates, additive reconstruction, metric calculations, curriculum completeness, all lesson routes, mobile overflow, interactive controls, quiz feedback, persistence, export, and 404s.

Locally, keep an app server running before `npm run test:e2e`. Playwright also supports starting a built production server automatically when `CI` is set. GitHub-hosted CI is deferred by owner approval: the workflow is retained locally but omitted from this PR because the current GitHub login lacks `workflow` permission. No required CI check is configured until that workflow can be enabled. See [.github/REVIEW_POLICY.md](.github/REVIEW_POLICY.md).

## Contributing and review

Open a pull request against `main`; do not push changes directly to it. All files are owned by **@kunalkohli** in `.github/CODEOWNERS`. Contributor PRs require approval; the owner can merge their own PRs using GitHub's admin bypass without self-review. This owner bypass is broader than an author-specific exception. Required code-owner review depends on GitHub branch protection **and the CODEOWNERS file being present on the base branch**. See [.github/REVIEW_POLICY.md](.github/REVIEW_POLICY.md) for enforcement and the initial-PR limitation.

The existing repository MIT license is preserved.
