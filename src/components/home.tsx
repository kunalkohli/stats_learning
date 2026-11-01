"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { lessons } from "@/lib/curriculum";
import { useProgress } from "./progress";
import { Header, Logo, ForecastSketch } from "./chrome";
import { experimentLessons } from "@/lib/experimentation";
import { useExperimentProgress } from "./experimentation";

export function Home() {
  const { progress } = useProgress();
  const { progress: experiments } = useExperimentProgress();
  const count = progress.understood.length;
  return <><Header /><main className="home-main" id="main">
    <section className="reference-hero">
      <h1>Statistics,<br /><span className="reference-underline">one concept at a time.</span></h1>
      <div className="reference-intro-layout">
        <div className="reference-panel intro-panel">
          <h2>A personal set of learning journeys.</h2>
          <p>Each concept is a route of short stops. Every stop explains one idea in plain language, gives you a diagram to play with, and ends with a question to check yourself.</p>
          <p>Examples are generic and all data is simulated, so the true answer behind every chart is known.</p>
          <Link className="button primary" href={count ? `/forecasting/${lessons[progress.lastLesson - 1].slug}` : "/forecasting"}>
            {count ? "Continue your journey" : "Start with forecasting"}<ArrowRight size={19} />
          </Link>
        </div>
        <div className="reference-hero-art"><ForecastSketch components /></div>
      </div>
    </section>

    <section id="journeys" className="reference-section">
      <div className="reference-section-title"><span className="eyebrow">Concepts</span><h2>Pick a<br /> journey.</h2></div>
      <div className="reference-panel journey-grid">
        <Link href="/forecasting" className="journey-card available">
          <div className="card-meta"><span>LIVE</span><span>{lessons.length} STOPS · {count} UNDERSTOOD</span></div>
          <h3>Forecasting</h3>
          <p>From “a forecast is a range” to exponential smoothing, Fourier terms, ARIMA, SARIMAX, dynamic harmonic regression, Prophet and forecasting in practice.</p>
          <div className="journey-progress"><i style={{ width: `${count / lessons.length * 100}%` }} /></div>
        </Link>
        <Link href="/experimentation" className="journey-card available experiment-card">
          <div className="card-meta"><span>LIVE</span><span>{experimentLessons.length} STOPS · {experiments.understood.length} UNDERSTOOD</span></div>
          <h3>Experimentation</h3><p>Test a faster ecommerce stack. From fair buyer assignment to conversion, latency, power, CUPED, guardrails, and a safe rollout decision.</p>
          <div className="journey-progress"><i style={{ width: `${experiments.understood.length / experimentLessons.length * 100}%` }} /></div>
        </Link>
        {[
          { name: "Regression", description: "Fitting lines, reading coefficients, confounders and what ‘controlling for’ really means." },
          { name: "Probability & distributions", description: "Randomness, the shapes it takes, and why averages behave so well." },
        ].map(j => <article className="journey-card planned" key={j.name}>
          <div className="card-meta"><span>COMING LATER</span><span>PLANNED</span></div>
          <h3>{j.name}</h3><p>{j.description}</p>
        </article>)}
      </div>
    </section>

    <section id="how-it-works" className="reference-section">
      <div className="reference-section-title"><span className="eyebrow">How it works</span><h2>Read, play,<br /> understand.</h2></div>
      <div className="reference-panel reference-steps">
        {[
          ["01 · THE IDEA", "One concept in plain language, with the details that matter in practice."],
          ["02 · THE DIAGRAM", "Sliders and switches. Change one thing and watch what moves."],
          ["03 · THE TAKEAWAY", "One line worth remembering, then a question to check yourself."],
          ["04 · YOUR JOURNAL", "Mark what you understand and keep your own notes as you go."],
        ].map(([title, text]) => <div key={title}><h3 className="eyebrow">{title}</h3><p>{text}</p></div>)}
        <div className="reference-callout">No sign-up. No grades. Your progress stays in this browser.</div>
      </div>
    </section>

    <footer className="site-footer"><Logo /><span>One concept at a time.</span><a href="https://otexts.com/fpp3/" target="_blank" rel="noreferrer">Further reading: FPP3 <ArrowUpRight size={13} /></a></footer>
  </main></>;
}
