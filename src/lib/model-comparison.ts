export const comparisonRows = [
  {
    topic: "What it does", group: "mechanics",
    prophet: "Fits a trend/changepoint model plus Fourier seasonality, holiday effects, and optional regressors.",
    dhr: "Fits regression with Fourier seasonal terms and optional known drivers; an ARIMA error process models remaining serial dependence.",
    mstl: "Decomposes multiple seasonal patterns; fits nonseasonal ETS to the adjusted series; projects seasonal components and recombines.",
  },
  {
    topic: "Strengths", group: "tradeoffs",
    prophet: "Convenient interface for trend changes, calendars, and holiday windows. A practical candidate for business series with strong patterns and enough history.",
    dhr: "Explicit calendar/driver effects, smooth long or multiple seasonalities, and autocorrelated errors in one framework. Fourier orders control seasonal flexibility.",
    mstl: "Readable component breakdown; can estimate evolving historical seasonal shapes. Modular: choose the adjusted-series model and seasonal projection separately.",
  },
  {
    topic: "Weaknesses", group: "tradeoffs",
    prophet: "Trend extrapolation can be implausible; too much changepoint flexibility can overfit. Standard errors do not have an explicit ARIMA correlation model. Not automatically accurate.",
    dhr: "Seasonal periods, Fourier orders, regressors, and error structure need care. Too many harmonics overfit; fixed seasonal coefficients may miss evolving shapes. ARIMA fitting can add cost.",
    mstl: "Needs enough cycles and sensible smoothing settings. Boundary estimates can be fragile. Basic seasonal-naïve projection repeats the last seasonal shape; moving events need extra handling.",
  },
  {
    topic: "Trend & short-run memory", group: "mechanics",
    prophet: "Trend is often piecewise linear, optionally with a saturating form. Standard Prophet does not explicitly model residual autocorrelation with AR/MA terms.",
    dhr: "Trend may be represented by regression terms and/or the ARIMA error specification. Lagged values and innovations can capture remaining short-run dependence.",
    mstl: "ETS forecasts level/trend behavior in the seasonally adjusted series. ETS innovations are not the same as choosing a general ARIMA error structure.",
  },
  {
    topic: "Changing seasonal patterns", group: "mechanics",
    prophet: "Standard seasonal coefficients are fixed within a fit. Refitting or deliberately adding interactions/conditional effects can adapt the model.",
    dhr: "Standard Fourier coefficients are fixed within a fit. Time-varying coefficients, interactions, or refitting are additional modeling choices.",
    mstl: "Finite smoothing windows allow changes across the historical sample. The common future rule repeats final estimated cycles; it does not extrapolate new seasonal changes by itself.",
  },
  {
    topic: "Black Friday & moving events", group: "calendar",
    prophet: "Supply the actual holiday dates and lead/lag windows. The holiday interface is convenient, but the lift and future promotion assumptions still require evidence.",
    dhr: "Add event-relative indicators or windows alongside seasonal waves. Calendar dates are known ahead; future discounts or spend must be known, forecast, or scenarized.",
    mstl: "A fixed seasonal period is not an event calendar. Adjust/model the event separately using training data, forecast its effect, and add it back without double counting.",
  },
  {
    topic: "External predictors", group: "calendar",
    prophet: "Additional regressors can be supplied. Their future values must be available or supplied as scenarios.",
    dhr: "A natural regression extension: price, promotions, weather, or availability indicators where justified. Unknown future inputs need forecasts or scenarios.",
    mstl: "Plain MSTL + ETS has no general external-regressor layer. Incorporating drivers requires an adjustment or a different/hybrid forecasting pipeline.",
  },
  {
    topic: "Uncertainty", group: "tradeoffs",
    prophet: "Intervals depend on model assumptions, fitting choices, and how future trend changes are simulated. Validate coverage; displayed bands are not guarantees.",
    dhr: "ARIMA errors provide conditional forecast uncertainty. Fixed future inputs and fitted coefficients may omit predictor or parameter uncertainty; validate coverage.",
    mstl: "Simple implementations often condition on estimated seasonal paths. Adjusted-series intervals alone can omit decomposition and future seasonal uncertainty; validate the whole pipeline.",
  },
  {
    topic: "What to tune and test", group: "tradeoffs",
    prophet: "Changepoint flexibility, seasonal orders/regularization, and holiday effects. Check trend plausibility and event errors.",
    dhr: "Fourier pairs for each period, driver specification, differencing and ARIMA orders. Check residual dependence and multi-step errors.",
    mstl: "Periods, smoothing/robustness settings, ETS structure, and seasonal extrapolation. Refit decomposition at every backtest origin.",
  },
];

export const comparisonCases = [
  { id: "calendar", label: "Black Friday & promotions", guidance: "Prophet and DHR both let you represent known calendar effects directly. MSTL + ETS remains a valid candidate if you deliberately add an event-adjustment layer. A sharp, moving sales event should not be left for smooth annual seasonality to discover automatically." },
  { id: "memory", label: "Autocorrelated errors", guidance: "DHR is a directly motivated candidate because it includes an ARIMA error process. Compare it against the current pipeline after known seasonality and calendar effects are represented. A diagnostic clue is not proof that DHR will have lower future error." },
  { id: "evolving", label: "Evolving seasonal shapes", guidance: "MSTL can describe changing historical seasonal components; standard Prophet/DHR fits usually hold Fourier coefficients fixed. But basic MSTL seasonal projections also freeze/repeat the latest cycle. Test the adaptation and future projection rules—not just how well a decomposition describes the past." },
];
