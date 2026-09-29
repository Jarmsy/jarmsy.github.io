// Draws the 2024 election autopsy charts with Observable Plot. Each
// <div data-plot="<chart id>" data-part="…"> from Chart.astro is drawn at its
// own width and redrawn when that width changes. Colours are CSS variables
// (dnc.css, tokens.css), so the light/dark switch needs no redraw.
import * as Plot from '@observablehq/plot';
import {
  fundamentals, turnout, stayhome, perception, rating, issues, order, nyc, benchmark,
  num, signed1, pct1, pct0, millions, votes, binLabel, PARTIES, isIndex, RATING_ORDER,
  BENCHMARK_KINDS, isPositiveControl,
} from './data';

const C = {
  loyal: 'var(--g-loyal)',
  switch: 'var(--g-switch)',
  rep: 'var(--g-rep)',
  hi: 'var(--g-hi)',
  ref: 'var(--g-ref)',
  partA: 'var(--g-part-a)',
  partB: 'var(--g-part-b)',
  ink: 'var(--text)',
  muted: 'var(--text-muted)',
  bg: 'var(--bg)',
};
const PARTY_COLOR: Record<string, string> = { Democrats: C.loyal, Independents: C.ref, Republicans: C.rep };

type Render = (width: number, part?: string) => SVGSVGElement | HTMLElement;

/** Settings every chart shares. */
const base = (width: number, ariaLabel: string) => ({
  width,
  ariaLabel,
  style: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
    background: 'transparent',
    overflow: 'visible',
  },
  color: { type: 'identity' as const },
});
const narrowAt = 480;

// ---- 01 -----------------------------------------------------------
const draw01: Render = (w) => {
  const h = fundamentals.harris_2024;
  const all = [...fundamentals.elections, { year: 2024, incumbent_party: 'D', predicted: h.predicted, actual: h.actual }];
  const past = fundamentals.elections;
  const narrow = w < narrowAt;
  const title = (d: (typeof all)[number]) =>
    `${d.year} · incumbent party ${d.incumbent_party}\nPredicted ${d.predicted}%\nActual ${d.actual}%` +
    (d.year === 2024 ? `\nMargin of error ±${h.error_band_pp} (±${h.error_band_refit_without_2020_pp} refit without 2020)` : '');
  return Plot.plot({
    ...base(w, 'Predicted and actual Democratic two-party vote share, 1948 to 2024'),
    height: narrow ? 300 : 340,
    marginLeft: 36,
    marginRight: 14,
    marginTop: 24,
    x: { domain: [1944, 2028], ticks: narrow ? [1948, 1968, 1988, 2008] : [1948, 1960, 1972, 1984, 1996, 2008, 2020], tickFormat: 'd', label: null },
    y: { domain: [36, 66], grid: true, label: 'Democratic share of the two-party vote (%)' },
    marks: [
      Plot.ruleY([50], { stroke: C.muted, strokeDasharray: '2,3', strokeOpacity: 0.7 }),
      Plot.rect([h], { x1: 2021.6, x2: 2026.4, y1: h.predicted - h.error_band_pp, y2: h.predicted + h.error_band_pp, fill: C.hi, fillOpacity: 0.16 }),
      Plot.ruleX(all, { x: 'year', y1: 'predicted', y2: 'actual', stroke: (d) => (d.year === 2024 ? C.hi : C.ref), strokeWidth: 1.2 }),
      Plot.dot(past, { x: 'year', y: 'predicted', r: 3.5, stroke: C.ref, fill: C.bg, strokeWidth: 1.5 }),
      Plot.dot(past, { x: 'year', y: 'actual', r: 3.5, fill: C.ink }),
      Plot.dot([h], { x: 2024, y: 'predicted', r: 4.5, stroke: C.hi, fill: C.bg, strokeWidth: 2 }),
      Plot.dot([h], { x: 2024, y: 'actual', r: 4.5, fill: C.hi }),
      Plot.text([h], { x: 2024, y: h.predicted - h.error_band_pp, text: () => '2024', dy: 12, fill: C.hi, fontWeight: 600 }),
      Plot.tip(all, Plot.pointerX({ x: 'year', y: 'actual', title , lineWidth: 40 })),
    ],
  });
};

// ---- 02 -----------------------------------------------------------
const draw02: Render = (w) => {
  const bins = turnout.bins.map((b) => ({ ...b, label: binLabel(b.bin) }));
  const parts = bins.flatMap((b) => [
    { ...b, part: 'Turnout', v: b.turnout_M, fill: C.partA },
    { ...b, part: 'Share', v: b.share_M, fill: C.partB },
  ]);
  const title = (b: (typeof bins)[number]) =>
    `${b.bin} · ${b.counties.toLocaleString('en-US')} counties\nTurnout part ${millions(b.turnout_M)}\nShare part ${millions(b.share_M)}\nTotal ${millions(b.total_M)}`;
  const leftEdge = (b: (typeof bins)[number]) => Math.min(0, b.turnout_M) + Math.min(0, b.share_M);
  return Plot.plot({
    ...base(w, 'Change in Democratic votes by county group, split into turnout and share'),
    height: 260,
    marginTop: 4,
    marginLeft: 96,
    marginRight: 16,
    x: { domain: [w < narrowAt ? -4.4 : -3.9, 0.5], ticks: 5, grid: true, label: 'Change in Democratic votes, 2020→2024 (millions)', tickFormat: (d: number) => num(d) },
    y: { domain: bins.map((b) => b.label), label: null, padding: 0.3 },
    marks: [
      Plot.barX(parts, { y: 'label', x: 'v', fill: 'fill' }),
      Plot.ruleX([0], { stroke: C.ink }),
      Plot.text(bins, { y: 'label', x: leftEdge, text: (b) => millions(b.total_M), textAnchor: 'end', dx: -5, fill: C.ink }),
      Plot.tip(bins, Plot.pointerY({ y: 'label', x: leftEdge, title , lineWidth: 40 })),
    ],
  });
};

// ---- 02b ----------------------------------------------------------
const draw02b: Render = (w, part) => {
  const national = part === 'national';
  const states = stayhome.states.filter((s) => (s.state === 'National') === national);
  const KINDS = ['2024 result', 'If stay-homes voted'];
  // Bars are drawn at margin + net; x1/x2 place the interval. Tooltips read the state's own numbers.
  const rows = states.flatMap((s) => [
    { s, state: s.state, kind: KINDS[0], v: s.margin_2024, x1: null, x2: null, fill: C.ref },
    {
      s, state: s.state, kind: KINDS[1], v: s.margin_2024 + s.net_if_stayhomes_voted,
      x1: s.margin_2024 + s.lo, x2: s.margin_2024 + s.hi, fill: C.partA,
    },
  ]);
  const title = (s: (typeof states)[number]) =>
    `${s.state}\n2024 Democratic margin ${votes(s.margin_2024)}\nNet if stay-homes voted ${votes(s.net_if_stayhomes_voted)}\n(interval ${votes(s.lo)} to ${votes(s.hi)})`;
  const scale = national ? 1e6 : 1e3;
  const unit = national ? 'M' : 'k';
  return Plot.plot({
    ...base(w, national ? 'National margin, actual and if stay-homes had voted' : 'Swing-state margins, actual and if stay-homes had voted'),
    height: national ? 90 : 40 + states.length * 38,
    marginLeft: 104,
    marginRight: 16,
    marginTop: 6,
    x: {
      domain: national ? [-2.5e6, 0.2e6] : [-200e3, 20e3],
      grid: true,
      label: 'Democratic margin (votes)',
      tickFormat: (d: number) => (d === 0 ? '0' : num(d / scale) + unit),
      ticks: national ? 5 : w < narrowAt ? 4 : 8,
    },
    y: { axis: null, domain: KINDS, padding: 0.1 },
    fy: { label: null, axis: 'left', domain: states.map((s) => s.state), padding: 0.25 },
    marks: [
      Plot.barX(rows, { fy: 'state', y: 'kind', x: 'v', fill: 'fill' }),
      Plot.ruleY(rows.filter((r) => r.x1 != null), { fy: 'state', y: 'kind', x1: 'x1', x2: 'x2', stroke: C.bg, strokeWidth: 5 }),
      Plot.ruleY(rows.filter((r) => r.x1 != null), { fy: 'state', y: 'kind', x1: 'x1', x2: 'x2', stroke: C.ink, strokeWidth: 1.5 }),
      Plot.ruleX([0], { stroke: C.ink, strokeWidth: 1.5 }),
      Plot.tip(rows, Plot.pointerY({ fy: 'state', y: 'kind', x: 'v', title: (r) => title(r.s), lineWidth: 40 })),
    ],
  });
};

// ---- 03 -----------------------------------------------------------
const draw03: Render = (w) => {
  const years = perception.years.map((y) => y.year);
  const long = perception.years.flatMap((y) =>
    PARTIES.map((p) => ({ year: y.year, party: p, v: y[p], incumbent: y.incumbent, stroke: PARTY_COLOR[p] })),
  );
  const last = long.filter((d) => d.year === 2024);
  return Plot.plot({
    ...base(w, 'Mean rating of the national economy by party, 2016, 2020 and 2024'),
    height: 320,
    marginLeft: 36,
    marginRight: 92,
    marginTop: 24,
    x: { type: 'point', domain: years, label: null, tickFormat: 'd', padding: 0.2 },
    y: { domain: [-2, 2], ticks: [-2, -1, 0, 1, 2], grid: true, tickFormat: (d: number) => (d > 0 ? '+' : '') + num(d), label: null },
    marks: [
      Plot.ruleY([0], { stroke: C.muted, strokeOpacity: 0.6 }),
      Plot.text(perception.years, {
        x: 'year', frameAnchor: 'top', dy: -16,
        text: (y) => `${y.incumbent} president`,
        fill: (y) => (y.incumbent === 'D' ? C.loyal : C.rep), fontWeight: 600,
      }),
      Plot.line(long, { x: 'year', y: 'v', z: 'party', stroke: 'stroke', strokeWidth: 2 }),
      Plot.dot(long, { x: 'year', y: 'v', fill: 'stroke', r: 4 }),
      Plot.text(last, { x: 'year', y: 'v', text: 'party', textAnchor: 'start', dx: 8, fill: C.ink }),
      Plot.tip(long, Plot.pointer({ x: 'year', y: 'v', title: (d) => `${d.party}, ${d.year}: ${d.v > 0 ? '+' : ''}${num(d.v)}\n${d.incumbent} president` })),
    ],
  });
};

// ---- 04 -----------------------------------------------------------
const draw04: Render = (w) => {
  const rows = rating.ratings;
  const narrow = w < narrowAt;
  return Plot.plot({
    ...base(w, 'Share of Biden 2020 voters who voted Trump in 2024, by their 2022 economic rating'),
    height: 290,
    marginLeft: 40,
    marginTop: 34,
    marginBottom: narrow ? 40 : 30,
    x: { domain: RATING_ORDER, label: null, tickFormat: (d: string) => (narrow ? d.replace(' ', '\n') : d), padding: 0.25 },
    y: { domain: [0, 10], grid: true, label: 'Voted Trump in 2024 (%, unweighted)', tickFormat: (d: number) => d + '%' },
    marks: [
      Plot.barY(rows, { x: 'rating_2022', y: (r) => r.rate_unweighted * 100, fill: C.switch }),
      Plot.ruleY([0], { stroke: C.ink }),
      Plot.text(rows, {
        x: 'rating_2022', y: (r) => r.rate_unweighted * 100, dy: -14, fill: C.ink, lineHeight: 1.2,
        text: (r) => (r.switched === 0 ? 'none\n' : pct1(r.rate_unweighted) + '\n') + (narrow ? `${r.switched}/${r.N}` : `${r.switched} of ${r.N}`),
      }),
      Plot.tip(rows, Plot.pointerX({ x: 'rating_2022', y: (r) => r.rate_unweighted * 100, title: (r) => `${r.switched} of ${r.N} switched (${pct1(r.rate_unweighted)})` })),
    ],
  });
};

// ---- 05 -----------------------------------------------------------
const GROUPS = [
  { key: 'loyal_democrats', label: 'Loyal D', name: 'Loyal Democrats', fill: C.loyal },
  { key: 'switchers', label: 'Switchers', name: 'Switchers', fill: C.switch },
  { key: 'loyal_republicans', label: 'Loyal R', name: 'Loyal Republicans', fill: C.rep },
] as const;
const draw05: Render = (w, axis) => {
  const rows = issues.items.filter((i) => i.axis === axis).sort((a, b) => b.switchers - a.switchers);
  const labelRow = axis === 'economic' ? rows.find((r) => r.item === 'Keep the Affordable Care Act') : undefined;
  const rowH = 50;
  const dots = rows.flatMap((r) => GROUPS.map((g) => ({ item: r.item, v: r[g.key] * 100, ...g })));
  const title = (r: (typeof rows)[number]) =>
    `${r.item}\n${GROUPS.map((g) => `${g.name} ${pct1(r[g.key])}`).join('\n')}`;
  const extra = labelRow ? 16 : 0;
  return Plot.plot({
    ...base(w, `Share taking the Democratic position: ${axis} issues`),
    height: rows.length * rowH + 30 + extra,
    marginLeft: 8,
    marginRight: 16,
    marginTop: 26,
    marginBottom: 26 + extra,
    x: { domain: [0, 100], grid: true, ticks: [0, 25, 50, 75, 100], tickFormat: (d: number) => d + '%', label: null },
    y: { axis: null, domain: rows.map((r) => r.item), padding: 0 },
    marks: [
      Plot.text(rows, { x: 0, y: 'item', text: 'item', textAnchor: 'start', dy: -15, fill: C.ink }),
      Plot.ruleY(rows, {
        y: 'item', x1: (r) => Math.min(...GROUPS.map((g) => r[g.key])) * 100, x2: (r) => Math.max(...GROUPS.map((g) => r[g.key])) * 100,
        stroke: C.muted, strokeOpacity: 0.6,
      }),
      Plot.dot(dots, { x: 'v', y: 'item', fill: 'fill', r: 5, stroke: C.bg, strokeWidth: 1 }),
      labelRow
        ? Plot.text(GROUPS, { x: (g: (typeof GROUPS)[number]) => labelRow[g.key] * 100, y: () => labelRow.item, text: 'label', dy: 15, fill: C.ink })
        : null,
      Plot.tip(rows, Plot.pointerY({ y: 'item', x: (r) => r.switchers * 100, title , lineWidth: 40 })),
    ],
  });
};

// ---- 06 -----------------------------------------------------------
const draw06: Render = (w, measure = '') => {
  const rows = order.series.filter((s) => s.measure === measure);
  const anes = measure.includes('(ANES)');
  const index = isIndex(measure);
  const k = index ? 1 : 100;
  const years = rows.map((r) => r.wave);
  const domainX = anes ? [2015, 2025] : [2019.5, 2024.5];
  const fmt = (v: number) => (index ? String(v) : pct0(v));
  // The ANES series plots the unweighted count share: its 21 switchers' weights are extreme.
  const sv = (r: (typeof rows)[number]) => ('plot_field' in r && r.switchers_unweighted != null ? r.switchers_unweighted : r.switchers);
  const sw = rows.map((r) => ({
    year: r.wave, v: sv(r) * k,
    lo: 'switchers_lo' in r && r.switchers_lo != null ? r.switchers_lo * k : null,
    hi: 'switchers_hi' in r && r.switchers_hi != null ? r.switchers_hi * k : null,
    tip:
      'switchers_count' in r && r.switchers_count != null
        ? `Switchers, ${r.wave}: ${r.switchers_count} of ${r.N_switchers} (${pct0(r.switchers_unweighted!)}) · weighted ${pct0(r.switchers)}`
        : `Switchers, ${r.wave}: ${fmt(r.switchers)} (n = ${r.N_switchers})` +
          ('switchers_lo' in r && r.switchers_lo != null ? `\ninterval ${fmt(r.switchers_lo)} to ${fmt(r.switchers_hi!)}` : ''),
  }));
  const loyal = rows.map((r) => ({
    year: r.wave, v: r.loyal * k,
    tip: `Loyal Democrats, ${r.wave}: ${fmt(r.loyal)}` + ('N_loyal' in r && r.N_loyal ? ` (n = ${r.N_loyal.toLocaleString('en-US')})` : ''),
  }));
  const band = sw.filter((d) => d.lo != null);
  const lastSw = sw.at(-1)!;
  const lastLoyal = loyal.at(-1)!;
  const gap = Math.abs(lastSw.v - lastLoyal.v) < 0.12 * k;
  return Plot.plot({
    ...base(w, `${measure}: switchers and loyal Democrats over time`),
    height: 210,
    marginLeft: 38,
    marginRight: 70,
    marginTop: 30,
    x: { domain: domainX, ticks: anes ? years : [2020, 2022, 2024], tickFormat: 'd', label: null },
    y: { domain: [0, k], grid: true, ticks: 5, tickFormat: (d: number) => (index ? String(d) : d + '%'), label: null },
    marks: [
      Plot.ruleX([2022], { stroke: C.muted, strokeDasharray: '3,3' }),
      Plot.text([2022], { x: (d) => d, frameAnchor: 'top', dy: -26, text: () => '2022:\nbefore the campaign', lineHeight: 1.15, fill: C.muted }),
      band.length > 1
        ? Plot.areaY(band, { x: 'year', y1: 'lo', y2: 'hi', fill: C.switch, fillOpacity: 0.16 })
        : Plot.ruleX(band, { x: 'year', y1: 'lo', y2: 'hi', stroke: C.switch, strokeOpacity: 0.5, strokeWidth: 3 }),
      Plot.line(loyal, { x: 'year', y: 'v', stroke: C.loyal, strokeWidth: 2 }),
      Plot.dot(loyal, { x: 'year', y: 'v', fill: C.loyal, r: 3.5 }),
      Plot.line(sw, { x: 'year', y: 'v', stroke: C.switch, strokeWidth: 2 }),
      Plot.dot(sw, { x: 'year', y: 'v', fill: C.switch, r: 3.5 }),
      Plot.text([lastSw], { x: 'year', y: 'v', text: () => 'Switchers', textAnchor: 'start', dx: 7, dy: gap && lastSw.v < lastLoyal.v ? 6 : 0, fill: C.ink }),
      Plot.text([lastLoyal], { x: 'year', y: 'v', text: () => 'Loyal D', textAnchor: 'start', dx: 7, dy: gap && lastLoyal.v < lastSw.v ? 6 : 0, fill: C.ink }),
      Plot.tip([...sw, ...loyal], Plot.pointer({ x: 'year', y: 'v', title: 'tip' , lineWidth: 40 })),
    ],
  });
};

// ---- 07 -----------------------------------------------------------
const draw07: Render = (w) => {
  const d = nyc.deciles;
  const narrow = w < narrowAt;
  const lines = [
    { key: 'mamdani_vs_harris', short: 'Mamdani', stroke: C.hi, dash: null, dy: 0 },
    { key: 'levine_vs_harris', short: 'Levine', stroke: C.ref, dash: '5,3', dy: 7 },
    { key: 'williams_vs_harris', short: 'Williams', stroke: C.ref, dash: null, dy: -7 },
  ] as const;
  const title = (r: (typeof d)[number]) =>
    `Tenth ${r.decile}: swing to Trump ${signed1(r.swing_to_trump_2024)} pts\n` +
    `${nyc.labels.mamdani} ${signed1(r.mamdani_vs_harris)}\n${nyc.labels.levine} ${signed1(r.levine_vs_harris)}\n${nyc.labels.williams} ${signed1(r.williams_vs_harris)}`;
  const last = d.at(-1)!;
  return Plot.plot({
    ...base(w, 'NYC 2025 Democrats’ share minus Harris 2024, by 2024 swing to Trump'),
    height: narrow ? 300 : 340,
    marginLeft: 40,
    marginRight: 64,
    x: { domain: [-2, 30], grid: true, label: 'Swing to Trump, 2020→2024 (points) →', tickFormat: (v: number) => signed1(v).replace('.0', '') },
    y: { domain: [-26, 26], grid: true, label: 'Share minus Harris 2024 (points)', tickFormat: (v: number) => signed1(v).replace('.0', '') },
    marks: [
      Plot.ruleY([0], { stroke: C.ink }),
      ...lines.flatMap((l) => [
        Plot.line(d, { x: 'swing_to_trump_2024', y: l.key, stroke: l.stroke, strokeWidth: 2, strokeDasharray: l.dash ?? undefined }),
        Plot.dot(d, { x: 'swing_to_trump_2024', y: l.key, fill: l.stroke, r: 2.5 }),
        Plot.text([last], { x: 'swing_to_trump_2024', y: l.key, text: () => l.short, textAnchor: 'start', dx: 6, dy: l.dy, fill: C.ink }),
      ]),
      Plot.tip(d, Plot.pointerX({ x: 'swing_to_trump_2024', y: 'mamdani_vs_harris', title , lineWidth: 40 })),
    ],
  });
};

// ---- 08 -----------------------------------------------------------
const draw08: Render = (w, kind) => {
  // Rows sit at fixed pixel offsets: two label lines, then the dot and its interval.
  // A comparison too long for one line moves its place and year ("…, Ohio 2018, counties") down to the sample line.
  const fits = (text: string) => text.length * 6.6 <= w - 24;
  const rows = benchmark.rows
    .filter((r) => r.kind === kind)
    .map((r, i) => {
      const cut = r.comparison.indexOf(', ', r.comparison.lastIndexOf(')')); // not inside "(Sen, incumbent)"
      const wrap = !fits(r.comparison) && cut > 0;
      return {
        ...r,
        i,
        line1: wrap ? r.comparison.slice(0, cut) : r.comparison,
        line2: wrap ? `${r.comparison.slice(cut + 2)} · ${r.sample}` : r.sample,
      };
    });
  const first = kind === BENCHMARK_KINDS[0];
  const dryRun = kind?.startsWith('2024');
  const pending = rows.every((r) => r.slope == null);
  const color = dryRun ? C.ref : isPositiveControl(kind) ? C.hi : C.ink;
  const rowH = 54;
  const top = first ? 24 : 6;
  const n = rows.length;
  const mark = 40 / rowH; // the dot line sits 40px below the top of its row
  return Plot.plot({
    ...base(w, `Slope of the gap between two Democrats on the swing to Trump: ${kind}`),
    height: top + n * rowH + 28,
    marginLeft: 8,
    marginRight: 16,
    marginTop: top,
    marginBottom: 28,
    x: { domain: [-0.2, 0.4], grid: true, ticks: [-0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4], tickFormat: (v: number) => (v > 0 ? '+' : '') + num(v), label: null },
    y: { axis: null, domain: [n, 0], range: [top + n * rowH, top] },
    marks: [
      Plot.rectX([0], { x1: -0.1, x2: 0.1, fill: C.ref, fillOpacity: 0.16 }),
      first ? Plot.text([0], { x: 0, frameAnchor: 'top', dy: -14, text: () => 'ordinary candidate differences', fill: C.muted }) : null,
      Plot.ruleX([0], { stroke: C.muted }),
      Plot.text(rows, { x: -0.2, y: 'i', text: 'line1', textAnchor: 'start', dy: 10, fill: C.ink }),
      Plot.text(rows, { x: -0.2, y: 'i', text: 'line2', textAnchor: 'start', dy: 22, fill: C.muted }),
      pending
        ? Plot.text(rows, { x: 0, y: (r) => r.i + mark, text: () => 'result: late November 2026', fill: C.hi, fontWeight: 600, stroke: C.bg, strokeWidth: 3, paintOrder: 'stroke' })
        : null,
      pending ? null : Plot.ruleY(rows, { y: (r) => r.i + mark, x1: 'lo', x2: 'hi', stroke: color, strokeWidth: 1.5, strokeOpacity: dryRun ? 0.7 : 1 }),
      pending ? null : Plot.dot(rows, { y: (r) => r.i + mark, x: 'slope', fill: color, r: 4, fillOpacity: dryRun ? 0.7 : 1 }),
      pending
        ? null
        : Plot.tip(rows, Plot.pointerY({ y: (r) => r.i + mark, x: 'slope', lineWidth: 40, title: (r) => `${r.comparison}\n${r.sample}\nSlope ${num(r.slope!)} (${num(r.lo!)} to ${num(r.hi!)})` })),
    ],
  });
};

const RENDER: Record<string, Render> = {
  '01_fundamentals': draw01,
  '02_turnout_vs_share': draw02,
  '02b_stayhome_counterfactual': draw02b,
  '03_perception_by_party': draw03,
  '04_rating_2022_predicts_switch': draw04,
  '05_issue_positions': draw05,
  '06_order_of_events': draw06,
  '07_nyc_same_ballot': draw07,
  '08_testA_benchmark': draw08,
};

// ---- Mounting -------------------------------------------------------
let observer: ResizeObserver | undefined;

function mount() {
  observer?.disconnect();
  const widths = new WeakMap<Element, number>();
  observer = new ResizeObserver((entries) => {
    for (const { target } of entries) {
      const el = target as HTMLElement;
      const w = Math.floor(el.clientWidth);
      if (!w || widths.get(el) === w) continue;
      widths.set(el, w);
      const render = RENDER[el.dataset.plot ?? ''];
      if (!render) continue;
      try {
        el.replaceChildren(render(w, el.dataset.part));
      } catch (err) {
        console.error(`chart ${el.dataset.plot} ${el.dataset.part ?? ''}`, err);
      }
    }
  });
  document.querySelectorAll('[data-plot]').forEach((el) => observer!.observe(el));
}

document.addEventListener('astro:page-load', mount);
document.addEventListener('astro:before-swap', () => observer?.disconnect());
