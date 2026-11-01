# StatsConcepts — Concept Journeys

A local-first learning site built with **Next.js 16, React 19, TypeScript, and hand-built SVG diagrams**. Two interactive journeys, one fictional ecommerce company: **Northstar**.

- **Forecasting:** 31 stops, from uncertainty and seasonality to models and practical workflows.
- **Experimentation:** 24 stops, following an Amazon-like marketplace testing a new product-page cache. Measure buyer conversion, latency, reliability, and the evidence needed for a safe rollout.
- **Two layouts:** use the **Classic / Lab** control in the header. Classic keeps the original spacious graph-paper design; Lab adds a compact rail, part cards, concept-card decks, and **Learn / Explore / Check** modes. The preference persists across journeys. Regression and probability remain planned.
- **Text size:** top-right **A− / 90% / A+** controls default to **90%**. Adjust in 10-point steps from 70% to 140%; click the percentage to reset to 90%. Your setting persists across pages and both layouts without changing browser zoom or lesson progress.

**Agent onboarding:** Read [education/CONTEXT.md](education/CONTEXT.md) for implementation history, user preferences, architecture, curriculum, storage migrations, and development/testing guidance.

## Run locally

```bash
cd /Users/kunalkohli/Documents/kunal_ai_setup/concepts
npm install
npm run dev
```

Open **http://localhost:3000**. The server binds to loopback, not the public network. To use another port: `npm run dev -- --port 3001`.

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
- Local progress, per-lesson notes, a journal, and Markdown export. No account, database, tracking, or hosted service.
- Responsive navigation and reduced-motion support.
- Original explanations and diagrams with further-reading links to Hyndman & Athanasopoulos, *Forecasting: Principles and Practice*, 3rd edition, [OTexts](https://otexts.com/fpp3/).
- Experimentation lessons cover randomization, hypotheses, buyer-level assignment, intent-to-treat, lift, latency percentiles, guardrails, A/A and SRM, sampling, confidence intervals, p-values, power/MDE, underpowered winners, stopping, capping, CUPED, triggering, ratios, multiplicity, infrastructure interference, segments, ramps, and decisions.
- Experimentation includes computed conversion/interval comparisons, sample-size planning, 300-trial simulations, and explicit theoretical/schematic demonstrations. Further reading links to Microsoft ExP and the NIST handbook.

## Important limitations

The playgrounds teach concepts; they do **not** fit full ARIMA, ETS, STL, Prophet, or ML models. Diagrams clearly identify simulated data, supplied coefficients, and oracle components. Baseline error scores are calculated from a chronological simulated holdout. Future inputs are not used as baseline predictors. Prediction bands are illustrative, not empirically calibrated for an ecommerce business.

Notes and progress stay in this browser’s local storage. Export before clearing site data or changing browsers/devices. Classic uses the graph-paper palette in `../profile.html` and local system fonts. Lab uses rounded **Nunito**, bundled in `public/fonts/` under the SIL Open Font License, stronger ink borders, dotted paper, numbered navigation, and guided steps. No external font requests are made at runtime.

Experimentation uses constructed data, not Amazon data. Conversion inference assumes independent buyers, mature outcomes, and fixed-horizon large-sample analysis. The trial simulation is a known-variance Gaussian approximation, not exact binomial inference. CUPED, spillovers, and load curves are theoretical/schematic, not fitted engines. Cumulative peeking is not modeled by the independent-tests formula. Every playground states its limitations.

Forecasting notes keep their original storage key and ID migrations. Experimentation notes use a separate key and appear in a separate journal section with their own Markdown export. Layout preferences never migrate or overwrite lesson notes.

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
| `src/components/labs.tsx` | Interactive teaching playgrounds |
| `src/components/chart.tsx` | SVG time-series and ACF charts |
| `src/components/site.tsx` | Homepage, route map, lessons, journal |
| `src/components/home.tsx` | Reference-style homepage and concept library |
| `src/components/chrome.tsx` | StatsConcepts branding, header, and sketches |
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
| `src/components/journey-parts.tsx` | Linked part-card overview |
| `src/app/journeys.css` | New journey styles and scoped Lab design |
| `src/app/lab-workspace.css` | Screenshot-inspired rounded Lab typography, panels, and responsive toolbar |
| `src/app/typography.css` | Rem-based text sizing shared by both layouts |
| `src/lib/display-preferences.ts` | Default, limits, and safe restoration of text-size preferences |
| `src/lib/journey-guides.ts` | Two actionable guided steps for each experimentation playground |
| `public/fonts/` | Self-hosted Nunito variable font and its OFL license |
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
