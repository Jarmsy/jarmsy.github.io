// Titles, captions, legends and data tables for each chart on the 2024
// election autopsy page. Captions are the analysis handoff's wording, verbatim.
import {
  fundamentals, turnout, stayhome, perception, rating, issues, order, nyc, benchmark,
  num, signed1, pct1, pct0, millions, votes, AXIS_LABEL, isIndex,
} from './data';

export type Swatch = { label: string; color: string; shape?: 'dot' | 'ring' | 'bar' | 'line' | 'dash' | 'band' };
export type Table = { head: string[]; rows: (string | number)[][] };
export type Spec = { title: string; caption: string; legend?: Swatch[]; table: () => Table };

const G = {
  loyal: 'var(--g-loyal)',
  switch: 'var(--g-switch)',
  rep: 'var(--g-rep)',
  hi: 'var(--g-hi)',
  ref: 'var(--g-ref)',
  partA: 'var(--g-part-a)',
  partB: 'var(--g-part-b)',
  ink: 'var(--text)',
};

const idx = (v: number) => String(v);

export const SPECS: Record<string, Spec> = {
  '01_fundamentals': {
    title: 'Predicted and actual vote, 1948–2024',
    caption:
      'Each pair is one election: the model’s prediction (hollow) and the actual result (filled). For 2024 the model, fit on 1948–2020, predicted 48.3%; Harris won 49.25%, inside its usual margin of error (shaded).',
    legend: [
      { label: 'Model prediction', color: G.ref, shape: 'ring' },
      { label: 'Actual result', color: G.ink, shape: 'dot' },
      { label: '2024, with ±4.23-point margin', color: G.hi, shape: 'band' },
    ],
    table: () => {
      const h = fundamentals.harris_2024;
      return {
        head: ['Year', 'Incumbent party', 'Predicted (%)', 'Actual (%)'],
        rows: [
          ...fundamentals.elections.map((e) => [e.year, e.incumbent_party, e.predicted, e.actual]),
          [2024, 'D', `${h.predicted} (±${h.error_band_pp}; ±${h.error_band_refit_without_2020_pp} refit without 2020)`, h.actual],
        ],
      };
    },
  },

  '02_turnout_vs_share': {
    title: 'Where the votes went',
    caption:
      'Change in Democratic votes, 2020→2024, by how Democratic the county was. In the strongest Democratic counties most of the loss was turnout, 2.9 million votes in total, but those counties were mostly in safe states.',
    legend: [
      { label: 'Turnout: fewer or more people voting', color: G.partA, shape: 'bar' },
      { label: 'Share: voters choosing differently', color: G.partB, shape: 'bar' },
    ],
    table: () => ({
      head: ['2020 Democratic share', 'Counties', 'Turnout part', 'Share part', 'Total', 'Turnout change'],
      rows: turnout.bins.map((b) => [
        b.bin, b.counties.toLocaleString('en-US'), millions(b.turnout_M), millions(b.share_M), millions(b.total_M),
        (b.turnout_change_pct > 0 ? '+' : '') + num(b.turnout_change_pct) + '%',
      ]),
    }),
  },

  '02b_stayhome_counterfactual': {
    title: 'Would the stay-homes have changed anything?',
    caption: 'If every 2020 voter who stayed home in 2024 had voted as in 2020, no swing state flips.',
    legend: [
      { label: 'Actual 2024 Democratic margin', color: G.ref, shape: 'bar' },
      { label: 'If the stay-homes had voted (with interval)', color: G.partA, shape: 'bar' },
    ],
    table: () => ({
      head: ['State', '2024 margin', 'Net if stay-homes voted', 'Interval'],
      rows: stayhome.states.map((s) => [
        s.state, votes(s.margin_2024), votes(s.net_if_stayhomes_voted), `${votes(s.lo)} to ${votes(s.hi)}`,
      ]),
    }),
  },

  '03_perception_by_party': {
    title: 'Economic ratings by party',
    caption:
      'How each party’s voters rated the national economy flipped whenever the White House changed hands. A county’s actual economic record explains 0.6% of the differences in ratings; party explains 34%.',
    legend: [
      { label: 'Democrats', color: G.loyal, shape: 'line' },
      { label: 'Independents', color: G.ref, shape: 'line' },
      { label: 'Republicans', color: G.rep, shape: 'line' },
    ],
    table: () => ({
      head: ['Year', 'Party in the White House', 'Democrats', 'Independents', 'Republicans'],
      rows: perception.years.map((y) => [y.year, y.incumbent, num(y.Democrats), num(y.Independents), num(y.Republicans)]),
    }),
  },

  '04_rating_2022_predicts_switch': {
    title: 'The bad rating came first',
    caption:
      'Biden 2020 voters, grouped by how they rated the economy in 2022. Share who voted Trump two years later. Not one of the 438 who saw improvement switched. (Same people re-interviewed; unweighted.)',
    table: () => ({
      head: ['Economy in 2022', 'Biden 2020 voters', 'Voted Trump 2024', 'Rate (unweighted)', 'Rate (weighted)'],
      rows: rating.ratings.map((r) => [r.rating_2022, r.N, r.switched, pct1(r.rate_unweighted), pct1(r.rate_weighted)]),
    }),
  },

  '05_issue_positions': {
    title: 'Where the switchers stood on the issues',
    caption:
      'Share taking the Democratic position, 2024. Switchers (orange) sit between the two parties on economic policy, mostly on the Democratic side, and near loyal Republicans on immigration.',
    legend: [
      { label: 'Loyal Democrats (Biden→Harris)', color: G.loyal, shape: 'dot' },
      { label: 'Switchers (Biden→Trump)', color: G.switch, shape: 'dot' },
      { label: 'Loyal Republicans (Trump→Trump)', color: G.rep, shape: 'dot' },
    ],
    table: () => ({
      head: ['Issue', 'Position', 'Loyal Democrats', 'Switchers', 'Loyal Republicans'],
      rows: issues.items.map((i) => [
        AXIS_LABEL[i.axis], i.item, pct1(i.loyal_democrats), pct1(i.switchers), pct1(i.loyal_republicans),
      ]),
    }),
  },

  '06_order_of_events': {
    title: 'The order of events',
    caption:
      'The same people followed over time. By 2022, future switchers had turned on the Biden government but still backed Medicare for All; their policy views and their picture of Trump changed only between 2022 and 2024. Switcher samples are small (39 and 21); bands show uncertainty.',
    legend: [
      { label: 'Switchers (Biden→Trump), with interval', color: G.switch, shape: 'line' },
      { label: 'Loyal Democrats (Biden→Harris)', color: G.loyal, shape: 'line' },
    ],
    table: () => ({
      head: ['Measure', 'Year', 'Loyal Democrats', 'Switchers', 'Switcher interval', 'Switchers (n)'],
      rows: order.series.map((s) => {
        const f = isIndex(s.measure) ? idx : pct0;
        const sw =
          'switchers_count' in s && s.switchers_count != null
            ? `${s.switchers_count} of ${s.N_switchers} (${pct0(s.switchers_unweighted!)}) · weighted ${pct0(s.switchers)}`
            : f(s.switchers);
        const interval = 'switchers_lo' in s && s.switchers_lo != null ? `${f(s.switchers_lo)} to ${f(s.switchers_hi!)}` : '—';
        return [s.measure, s.wave, f(s.loyal), sw, interval, s.N_switchers];
      }),
    }),
  },

  '07_nyc_same_ballot': {
    title: 'Every Democrat gained where voters had swung',
    caption:
      'New York City election districts grouped by how far they swung to Trump in 2024. Each line is a 2025 Democrat’s share minus Harris’s. All three Democrats gained most where the swing was largest, at about the same rate before adjusting for demographics (per point of swing, Mamdani 0.99, Levine 0.87, Williams 1.02); with demographics held equal, Mamdani gained least (0.25, against 0.66 and 0.44). Mamdani’s line sits lower throughout because he faced former Governor Andrew Cuomo, a Democrat running as an independent who won 41% citywide; the comptroller and public advocate faced no comparable challenger. Cuomo’s vote was uneven across the city, in the June primary and in November alike, so the slopes can’t settle whether Mamdani’s smaller gain was weaker pull with swing voters or Cuomo’s draw.',
    legend: [
      { label: nyc.labels.mamdani, color: G.hi, shape: 'line' },
      { label: nyc.labels.levine, color: G.ref, shape: 'dash' },
      { label: nyc.labels.williams, color: G.ref, shape: 'line' },
    ],
    table: () => ({
      head: ['Tenth', 'Swing to Trump (pts)', 'Mamdani − Harris', 'Levine − Harris', 'Williams − Harris'],
      rows: nyc.deciles.map((d) => [
        d.decile, signed1(d.swing_to_trump_2024), signed1(d.mamdani_vs_harris), signed1(d.levine_vs_harris), signed1(d.williams_vs_harris),
      ]),
    }),
  },

  '08_testA_benchmark': {
    title: 'The pre-registered test',
    caption:
      'How much the gap between two candidates on the same Michigan or Midwest ballot tracks the swing to Trump. Pairs of mainstream Democrats sit near zero. Sherrod Brown and Tammy Baldwin, known for running ahead in places that swung to Trump, come out clearly positive. Rows from 2018 use the swing before that election, 2012 to 2016. El-Sayed’s result against Benson comes after certification in late November 2026.',
    table: () => ({
      head: ['Comparison', 'Sample', 'Kind', 'Slope', 'Interval'],
      rows: benchmark.rows.map((r) => [
        r.comparison, r.sample, r.kind,
        r.slope == null ? 'pending: late November 2026' : num(r.slope),
        r.lo == null || r.hi == null ? '—' : `${num(r.lo)} to ${num(r.hi)}`,
      ]),
    }),
  },
};
