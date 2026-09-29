// The 2024 election autopsy page (content/made/2024-election-autopsy.mdx).
// Every number shown comes from src/data/dnc-autopsy/*.json, which the
// analysis repo exports and checks. Formatters here only change how a
// number is written (a fraction as a percentage, a proper minus sign) —
// never its value. Don't edit the JSON by hand; re-export it.
import fundamentals from '../../data/dnc-autopsy/01_fundamentals.json';
import turnout from '../../data/dnc-autopsy/02_turnout_vs_share.json';
import stayhome from '../../data/dnc-autopsy/02b_stayhome_counterfactual.json';
import perception from '../../data/dnc-autopsy/03_perception_by_party.json';
import rating from '../../data/dnc-autopsy/04_rating_2022_predicts_switch.json';
import issues from '../../data/dnc-autopsy/05_issue_positions.json';
import order from '../../data/dnc-autopsy/06_order_of_events.json';
import nyc from '../../data/dnc-autopsy/07_nyc_same_ballot.json';
import benchmark from '../../data/dnc-autopsy/08_testA_benchmark.json';
import recall from '../../data/dnc-autopsy/sidebar_recall.json';

export { fundamentals, turnout, stayhome, perception, rating, issues, order, nyc, benchmark, recall };

// ---- Formatting ------------------------------------------------

const minus = (s: string) => s.replace(/^-/, '−');

/** A number as given, with a real minus sign: -0.023 → "−0.023". */
export const num = (v: number) => minus(String(v));
/** Signed, as given: 3.8 → "+3.8", -20 → "−20.0" (one decimal, per the spec). */
export const signed1 = (v: number) => (v > 0 ? '+' : '') + minus(v.toFixed(1));
/** A fraction as a percentage, one decimal: 0.0792 → "7.9%". */
export const pct1 = (v: number) => minus((v * 100).toFixed(1)) + '%';
/** A fraction as a whole percentage: 0.309 → "31%". Chart 06's small samples. */
export const pct0 = (v: number) => minus((v * 100).toFixed(0)) + '%';
/** Millions of votes, as given: -2.905 → "−2.905M". */
export const millions = (v: number) => minus(String(v)) + 'M';
/** Whole votes with separators, signed: -80103 → "−80,103". */
export const votes = (v: number) => (v > 0 ? '+' : '') + minus(Math.round(v).toLocaleString('en-US'));

// ---- Shapes the charts share ------------------------------------

export const PARTIES = ['Democrats', 'Independents', 'Republicans'] as const;
export const AXES = ['economic', 'immigration', 'social'] as const;
export const AXIS_LABEL: Record<string, string> = {
  economic: 'Economic policy',
  immigration: 'Immigration',
  social: 'Social issues',
};

/** Chart 06 panels, in the order the spec recommends; the last two sit under "more". */
export const ORDER_PANELS = [
  { key: 'approves Biden', title: 'Approves of Biden' },
  { key: 'supports Medicare for all', title: 'Supports Medicare for All' },
  { key: 'immigration conservatism (0-1)', title: 'Immigration conservatism (0–1 scale)' },
  { key: "says Trump 'really cares about people like you' (ANES)", title: 'Says Trump “really cares about people like you” (ANES)' },
];
export const ORDER_MORE = [
  { key: 'economy got worse', title: 'Says the economy got worse' },
  { key: 'voted Democratic for House, 2022 (of voters)', title: 'Voted Democratic for House, 2022 (of those who voted)' },
];
export const isIndex = (measure: string) => measure.startsWith('immigration');

/** "<35% (R strongholds)" → "<35%\nR strongholds", for two-line tick labels. */
export const binLabel = (bin: string) => bin.replace(' (', '\n').replace(')', '');

export const RATING_ORDER = rating.ratings.map((r) => r.rating_2022);

/** Chart 08's groups, top to bottom: benchmarks, checks, the dry run, then the 2026 test. */
const KIND_ORDER = ['2018 benchmark', '2022 benchmark', '2018 familiarity', 'known populist', '2024 dry run', 'the pre-registered test'];
const kindRank = (kind: string) => {
  const i = KIND_ORDER.findIndex((prefix) => kind.startsWith(prefix));
  return i === -1 ? KIND_ORDER.length : i;
};
export const BENCHMARK_KINDS = [...new Set(benchmark.rows.map((r) => r.kind))].sort((a, b) => kindRank(a) - kindRank(b));
export const isPositiveControl = (kind = '') => kind.startsWith('known populist');
