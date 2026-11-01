import Link from "next/link";
export default function NotFound() { return <main className="not-found"><span className="eyebrow">A SMALL DETOUR</span><h1>This stop isn’t on the map.</h1><p>Let’s get you back to the journey.</p><Link className="button primary" href="/forecasting">Back to forecasting →</Link></main>; }
