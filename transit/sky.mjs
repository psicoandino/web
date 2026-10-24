// sky.mjs: the sky for every calendar day, from astrologOS (offline, deterministic), and the fixed family of questions asked of it.
// The sky is read at CLOSE_HOUR UTC of each day (an approximation of the market close, declared here); the next-day return starts from that day's close, so nothing looks ahead.
// buildSky computes it live (the bake and the tests use it); the site reads the baked file (data/sky.json + sky.bin) through skyFromBuffers, so opening costs nothing.
import { calculateBody, BODY_SYMBOLS } from '../astrologOS/src/ephemeris.mjs';
import { dayNumber } from './engine.mjs';
export { BODY_SYMBOLS };
export const ORDER = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
export const MOVERS = ORDER.slice(2);
export const CLOSE_HOUR = 21;

function derive(s) {
  const { days, lon, terr } = s, retro = {}, cross = {}, phase = new Float64Array(days);
  for (const b of MOVERS) {
    const a = new Uint8Array(days);
    for (let k = 1; k < days - 1; k++) {
      let d = lon[b][k + 1] - lon[b][k - 1];
      d = ((((d + 540) % 360) + 360) % 360) - 180;
      a[k] = d < 0 ? 1 : 0;
    }
    retro[b] = a;
  }
  for (const b of ORDER) {
    if (b === 'Moon') continue;
    const a = new Uint8Array(days);
    for (let k = 0; k < days; k++) {
      let hit = 0;
      for (let j = Math.max(0, k - 2); j <= Math.min(days - 1, k + 2); j++) if (terr[b][j] !== terr[b][k]) hit = 1;
      a[k] = hit;
    }
    cross[b] = a;
  }
  for (let k = 0; k < days; k++) phase[k] = (((lon.Moon[k] - lon.Sun[k]) % 360) + 360) % 360;
  return { ...s, retro, cross, phase };
}

export async function buildSky(first, last, onProgress = null) {
  const start = first - 2, days = last - first + 5;
  const lon = {}, terr = {}, syms = new Map(), symbolOf = [], names = new Map();
  for (const b of ORDER) { lon[b] = new Float64Array(days); terr[b] = new Uint8Array(days); }
  for (let k = 0; k < days; k++) {
    const date = new Date((start + k) * 864e5 + CLOSE_HOUR * 36e5);
    for (const b of ORDER) {
      const r = calculateBody(b, date), sym = r.constellation.symbol;
      if (!syms.has(sym)) { syms.set(sym, symbolOf.length); symbolOf.push(sym); names.set(sym, r.constellation.name); }
      lon[b][k] = r.ecliptic.longitudeDeg;
      terr[b][k] = syms.get(sym);
    }
    if (onProgress && k % 120 === 119) await onProgress((k + 1) / days);
  }
  return derive({ start, days, lon, terr, symbolOf, names });
}

// meta: {start, days, symbols, names}; buf: all longitudes (Float32, body by body) then all territory bytes (body by body).
export function skyFromBuffers(meta, buf) {
  const { start, days, symbols, names } = meta, lon = {}, terr = {};
  ORDER.forEach((b, i) => {
    lon[b] = new Float32Array(buf, i * days * 4, days);
    terr[b] = new Uint8Array(buf, ORDER.length * days * 4 + i * days, days);
  });
  return derive({ start, days, lon, terr, symbolOf: symbols, names: new Map(symbols.map((s, i) => [s, names[i]])) });
}

export function alignSeries(rows, sky) {
  const n = rows.length - 1, idx = new Int32Array(n), y = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    idx[i] = dayNumber(rows[i].date) - sky.start;
    if (idx[i] < 0 || idx[i] >= sky.days) throw new Error('a day of the series is outside the sky that was read (1980 to 2035)');
    y[i] = rows[i + 1].close / rows[i].close - 1;
  }
  return { idx, y };
}

const col = (arr, idx) => Float64Array.from(idx, (k) => arr[k]);
function dummies(arr, idx) {
  const n = idx.length, count = new Map();
  for (let i = 0; i < n; i++) count.set(arr[idx[i]], (count.get(arr[idx[i]]) || 0) + 1);
  const ranked = [...count].sort((a, b) => b[1] - a[1]);
  const keep = ranked.slice(1).filter(([, c]) => c >= 0.03 * n).map(([v]) => v);
  return keep.length ? keep.map((v) => Float64Array.from(idx, (k) => (arr[k] === v ? 1 : 0))) : null;
}

// The family is fixed in advance: it is the number of questions the correction counts.
export function buildTests() {
  const t = [];
  for (const b of MOVERS) t.push({ id: `retro:${b}`, group: 'Retrograde', label: `${b} retrograde`, ref: false, cols: (s, idx) => [col(s.retro[b], idx)], mask: (s, k) => s.retro[b][k] === 1 });
  for (const b of ORDER) t.push({ id: `terr:${b}`, group: 'Territory', label: `${b}'s territory`, ref: true, cols: (s, idx) => dummies(s.terr[b], idx), mask: (s, k, ref) => s.terr[b][k] === s.terr[b][ref] });
  t.push({ id: 'phase:Moon', group: 'Moon', label: 'Moon phase', ref: true, cols: (s, idx) => [Float64Array.from(idx, (k) => Math.cos((s.phase[k] * Math.PI) / 180)), Float64Array.from(idx, (k) => Math.sin((s.phase[k] * Math.PI) / 180))], mask: (s, k, ref) => Math.floor(s.phase[k] / 90) === Math.floor(s.phase[ref] / 90) });
  for (const b of ORDER) if (b !== 'Moon') t.push({ id: `cross:${b}`, group: 'Crossing', label: `${b} near a crossing`, ref: false, cols: (s, idx) => [col(s.cross[b], idx)], mask: (s, k) => s.cross[b][k] === 1 });
  return t;
}
export const FAMILY = buildTests();
