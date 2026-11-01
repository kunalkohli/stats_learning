export const workflowSteps = [
  {
    title: "Define the decision", summary: "Target · horizon · cost of error",
    action: "Write a one-paragraph forecasting brief before touching a model: what quantity, for whom, at what granularity, how far ahead, and what action depends on it? Decide whether you need individual days, the horizon total, or both.",
    example: "Northstar: daily net sales by category for the next 42 days, refreshed weekly. The inventory team also needs plausible high-demand scenarios before Black Friday. Clarify how sales, prices, and availability relate to the units they must stock.",
    output: "An agreed target, information cut-off, horizon, metric, and business owner.", refs: [30, 26],
  },
  {
    title: "Audit & explore", summary: "Plot first · understand the calendar",
    action: "Check dates, units, missing observations versus true zeros, stockouts, returns, outliers, and changes in the business. Plot training history, seasonal views, and ACF. Consider log/Box–Cox transforms when the scale warrants it; fit all preprocessing inside each training window.",
    example: "Northstar has weekly shopping rhythms, growing sales, and an annual event whose date moves. STL/MSTL can help inspect components, but an event-relative Black Friday view exposes something a fixed weekday or date cannot.",
    output: "An annotated series and a short list of plausible patterns—not a declaration of the winning model.", refs: [2, 4, 11, 12],
  },
  {
    title: "Set a simple baseline", summary: "A reference every candidate must beat",
    action: "Try the last observation, a seasonal naïve forecast, and another domain-appropriate simple method. Use the same weekday last week for a weekly rhythm. Last-year comparisons require enough history and careful calendar alignment; estimate growth using training data only.",
    example: "Northstar benchmarks last-week sales and an event-aligned last-year forecast with a training-only growth estimate. A blind 364-day copy aligns weekdays but can put Black Friday on the wrong Friday.",
    output: "A reproducible benchmark, plus a fallback if a more complex forecasting system fails.", refs: [5, 6, 17],
  },
  {
    title: "Backtest realistically", summary: "Earlier → later · match the real horizon",
    action: "Define the evaluation protocol before tuning: rolling origins, deployment frequency, forecast horizon, and decision-relevant metrics. Avoid random splits. Refit models and preprocessing at each origin, with only information available then. Where history allows, reserve a final chronological test period for one last check after selection.",
    example: "Northstar makes 42-day forecasts from several earlier weekly origins. Include origins before Black Friday and ordinary periods. With only a few annual events, report that holiday performance is estimated from limited evidence.",
    output: "Comparable validation forecasts, MAE or other chosen loss, bias, interval coverage, and event-specific errors.", refs: [7, 8, 27],
  },
  {
    title: "Diagnose the misses", summary: "Ask what structure is still missing",
    action: "Look at held-out errors by horizon, weekday, product, and event. Use residual plots, ACF, and suitable diagnostics as clues. Is the miss a shifted level, trend, seasonal pattern, calendar effect, autocorrelated error, or a data-quality problem? Check inputs before adding parameters.",
    example: "Northstar’s weekly model does fine on ordinary days but misses the Black Friday lift. That points to a missing calendar effect. Increasing trend flexibility would solve the wrong problem.",
    output: "A testable hypothesis: ‘Adding an event window should reduce holiday underprediction without worsening ordinary days.’", refs: [9, 10, 17],
  },
  {
    title: "Try a targeted candidate", summary: "Choose a branch, not a complexity ladder",
    action: "Fit a small number of plausible candidates. Use the model guide below to match a missing pattern to a method. Compare Prophet, DHR, and MSTL + ETS where appropriate. Fourier terms are seasonal regression features, not a required step after ETS. ARIMA can be a standalone alternative or model errors left after regression.",
    example: "For Northstar, a candidate might combine a trend, weekday effects, smooth annual Fourier terms, and explicit Black Friday/Cyber Monday windows. Add ARIMA errors only if serial dependence remains and validation supports the change.",
    output: "One clearly motivated experiment with known-ahead features and a versioned set of assumptions.", refs: [19, 22, 24, 25],
  },
  {
    title: "Compare & decide", summary: "Worthwhile improvement? If not, keep it simple",
    action: "Compare every candidate against the baseline on identical origins and horizons. Inspect the size and consistency of improvements, interval calibration, important segments, runtime, and maintenance. Repeated tuning can overfit validation too; confirm the selected approach on the reserved test period where feasible.",
    example: "Northstar keeps the event-aware approach only if the holiday improvement is credible and ordinary-day performance remains acceptable. If no candidate adds reliable value, the baseline can be the production choice. Combining good candidates is another experiment, not a guaranteed win.",
    output: "A selected method—or a documented reason to return to the audit/diagnosis stage. A simple model is allowed to win.", refs: [8, 26, 29],
  },
  {
    title: "Refit, use & monitor", summary: "The forecast is a system, not a notebook",
    action: "Refit the chosen specification on information available at the current origin. Publish point forecasts, calibrated intervals where supported, scenarios, and assumptions. Reconcile totals when needed. Automate data checks, refreshes, fallbacks, and monitoring of error, bias, coverage, and drift.",
    example: "Northstar checks weekly sales bias and interval coverage, then separately reviews Black Friday outcomes. A new pricing policy or persistent demand shift sends the team back to diagnosis, not automatically to a more complicated algorithm.",
    output: "A usable forecast, a responsible owner, a refresh cadence, and a trigger for revisiting the method.", refs: [26, 28, 30],
  },
];

export const modelBranches = [
  {
    id: "level", label: "A changing level, no clear trend or seasonality",
    baseline: "Mean or last observation", candidate: "Simple exponential smoothing (SES)",
    why: "SES updates the estimated level without inventing a trend or seasonal rhythm. It is a sensible lightweight candidate when those extra patterns are absent.",
    avoid: "A high smoothing parameter chases noise. If the last observation wins honestly, keep it.", refs: [5, 13],
  },
  {
    id: "trend", label: "An underlying trend, little seasonality",
    baseline: "Naïve or drift forecast", candidate: "Holt or damped-trend ETS",
    why: "A trend component addresses systematic directional misses. Damping can avoid extending the current slope indefinitely. ARIMA with appropriate differencing is an alternative worth comparing, not a compulsory later stage.",
    avoid: "Don’t mistake a holiday ramp or a one-off step for permanent growth.", refs: [3, 14, 19, 20],
  },
  {
    id: "single", label: "One clear, stable seasonal rhythm",
    baseline: "Seasonal naïve", candidate: "Seasonal ETS / Holt–Winters; compare SARIMA",
    why: "A single repeating pattern, such as weekly seasonality, is a good reason to test a seasonal model. Choose additive or proportional effects based on the series and available scale.",
    avoid: "A 7-day seasonal model does not automatically learn an annual moving holiday. Do not use a giant seasonal period just because it is possible.", refs: [5, 15, 19, 21],
  },
  {
    id: "northstar", label: "Northstar: weekly + annual patterns + Black Friday",
    baseline: "Weekly naïve plus a separate event-aligned last-year benchmark",
    candidate: "Compare calendar/Fourier regression, Prophet, and MSTL + ETS with event handling",
    why: "Weekday and annual Fourier features plus event-relative windows form one candidate; DHR adds ARIMA errors if useful. Prophet provides a trend/seasonality/holiday alternative. MSTL + ETS separates multiple seasons but needs deliberate event adjustment and add-back. Compare their complete pipelines under the same validation protocol.",
    avoid: "Neither smooth Fourier waves nor a fixed seasonal slot reliably aligns a sharp moving holiday by itself. Tune within time-aware validation, and use scenarios for unknown future drivers.", refs: [17, 22, 23, 24, 25, 27],
  },
  {
    id: "memory", label: "Errors still show autocorrelation after known effects",
    baseline: "The best current simple or calendar-aware candidate",
    candidate: "ARIMA / SARIMA, or regression with ARIMA errors",
    why: "Check the working series and stationarity; difference only where appropriate. Lagged observations and innovations can model dependence that seasonal or calendar terms did not explain. Compare against ETS or the current regression under the same protocol.",
    avoid: "A big raw-sales ACF spike can come from trend or seasonality. Residual whiteness alone does not prove better multi-step forecasts.", refs: [9, 10, 11, 20, 21],
  },
  {
    id: "sparse", label: "Lots of true zeros or intermittent demand",
    baseline: "A simple rate/aggregation benchmark suited to the decision",
    candidate: "Intermittent-demand or count-aware methods; consider aggregation",
    why: "Inspect the frequency and size of nonzero demand separately. Methods such as Croston-style approaches or suitable count models may be more appropriate than smooth seasonal curves. Evaluate the replenishment horizon and the cost of stock decisions.",
    avoid: "First distinguish no demand from missing data or stockouts. MAPE is unsuitable at zero, and ordinary Gaussian intervals can imply impossible negative demand.", refs: [8, 12, 30],
  },
  {
    id: "limited", label: "A new product, a major break, or too little history",
    baseline: "A transparent analogue, recent-level, or scenario benchmark",
    candidate: "Domain-informed scenarios and carefully chosen comparable series",
    why: "First decide whether old patterns still apply. Use product knowledge, relevant peer series, and documented assumptions; collect new evidence. Flexible fitted models cannot recover annual seasonality that the history does not identify.",
    avoid: "Don’t force an automatic ETS → Fourier → ARIMA → ML sequence when the main limitation is missing or irrelevant information.", refs: [1, 3, 12, 27],
  },
];
