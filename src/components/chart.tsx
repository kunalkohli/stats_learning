"use client";

export type Series = { name: string; values: (number | null)[]; color: string; dashed?: boolean; fill?: boolean };
export type Band = { low: number[]; high: number[]; color: string };

export function Chart({ series, labels = [], bands = [], height = 280, money = true, marker, title = "Interactive time series chart", domain }: {
  series: Series[]; labels?: { at: number; text: string }[]; bands?: Band[]; height?: number; money?: boolean;
  marker?: { at: number; text: string }; title?: string; domain?: [number, number];
}) {
  const width = 800, left = 58, right = 20, top = 26, bottom = 36;
  const all = [...series.flatMap(s => s.values.filter((v): v is number => v !== null)), ...bands.flatMap(b => [...b.low, ...b.high])];
  const rawMin = domain?.[0] ?? Math.min(...all), rawMax = domain?.[1] ?? Math.max(...all);
  const pad = (rawMax - rawMin || 1) * 0.12;
  const min = domain ? rawMin : rawMin - pad, max = domain ? rawMax : rawMax + pad;
  const count = Math.max(...series.map(s => s.values.length), ...bands.map(b => b.low.length), 2);
  const x = (i: number) => left + i / (count - 1) * (width - left - right);
  const y = (n: number) => Number((top + (1 - (n - min) / (max - min || 1)) * (height - top - bottom)).toFixed(4));
  const path = (values: (number | null)[]) => {
    let gap = true;
    return values.map((v, i) => { if (v === null) { gap = true; return ""; } const p = `${gap ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`; gap = false; return p; }).join(" ");
  };
  return <div className="chart-wrap">
    <svg role="img" aria-label={title} viewBox={`0 0 ${width} ${height}`} className="chart">
      <title>{title}</title>
      {[0, 1, 2, 3].map(i => { const n = min + (max - min) * i / 3; return <g key={i}><line x1={left} x2={width - right} y1={y(n)} y2={y(n)} stroke="var(--line)" strokeDasharray="2 4" /><text x={left - 12} y={y(n) + 4} textAnchor="end">{money ? `${n < 0 ? "−" : ""}$${(Math.abs(n) / 1000).toFixed(0)}k` : n.toFixed(1)}</text></g>; })}
      {bands.map((b, i) => <path key={i} d={`${path(b.high)} ${b.low.map((v, j) => ({ v, j })).reverse().map(({ v, j }) => `L${x(j)},${y(v)}`).join(" ")} Z`} fill={b.color} />)}
      {marker && <g><line x1={x(marker.at)} x2={x(marker.at)} y1={top} y2={height - bottom} stroke="var(--muted)" strokeDasharray="4 4" /><text x={x(marker.at) - 7} y={16} textAnchor="end">{marker.text}</text></g>}
      {series.map(s => <path key={s.name} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={s.name === "Observed sales" ? 1.5 : 2.3} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? "5 5" : undefined} />)}
      {labels.map(l => <text key={`${l.at}-${l.text}`} x={x(l.at)} y={height - 10} textAnchor="middle">{l.text}</text>)}
    </svg>
    <div className="chart-legend">{series.map(s => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}{bands.length > 0 && <span><i style={{ background: "#b8c995" }} />Prediction intervals</span>}</div>
  </div>;
}

export function AcfChart({ values, bounds, title = "Autocorrelation by lag" }: { values: number[]; bounds?: number; title?: string }) {
  const x = (i: number) => 46 + i * 37;
  return <svg className="acf-chart" viewBox="0 0 670 230" role="img" aria-label={title}><title>{title}</title>
    {[-1, -0.5, 0, 0.5, 1].map(v => <g key={v}><line x1="35" x2="650" y1={108 - v * 80} y2={108 - v * 80} stroke="var(--line)" /><text x="27" y={112 - v * 80} textAnchor="end">{v}</text></g>)}
    {bounds && [-bounds, bounds].map(v => <line key={v} x1="35" x2="650" y1={108 - v * 80} y2={108 - v * 80} stroke="#b76b4e" strokeDasharray="4 4" />)}
    {values.map((v, i) => <g key={i}><line x1={x(i)} x2={x(i)} y1="108" y2={108 - v * 80} stroke="var(--green)" strokeWidth="9" /><text x={x(i)} y="215" textAnchor="middle">{i + 1}</text></g>)}
    <text x="340" y="230" textAnchor="middle">Lag (days)</text>
  </svg>;
}
