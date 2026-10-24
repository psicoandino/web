// engine.mjs: transitOS's statistics. TISS's walk-forward OLS (index.html:1170-1188 and 1260-1273) kept as running sums, plus the sky-shift test.
// Deviations from TISS, all declared: the fit is renewed every REFIT days, not daily; a tiny ridge keeps dummy columns solvable; only the next-day return (H=1).
export const REFIT = 21, SHIFTS = 200, RIDGE = 1e-8, MIN_ROWS = 700;

export function solve(A, b, p, ridge = RIDGE) {
  const w = p + 1, M = new Float64Array(p * w);
  for (let j = 0; j < p; j++) {
    for (let k = 0; k < p; k++) M[j * w + k] = A[j * p + k] + (j === k && j > 0 ? ridge : 0);
    M[j * w + p] = b[j];
  }
  for (let col = 0; col < p; col++) {
    let pivot = col;
    for (let r = col + 1; r < p; r++) if (Math.abs(M[r * w + col]) > Math.abs(M[pivot * w + col])) pivot = r;
    if (pivot !== col) for (let k = 0; k < w; k++) { const t = M[col * w + k]; M[col * w + k] = M[pivot * w + k]; M[pivot * w + k] = t; }
    const pv = M[col * w + col];
    if (!isFinite(pv) || Math.abs(pv) < 1e-12) return null;
    for (let k = col; k < w; k++) M[col * w + k] /= pv;
    for (let r = 0; r < p; r++) {
      if (r === col) continue;
      const f = M[r * w + col];
      if (f === 0) continue;
      for (let k = col; k < w; k++) M[r * w + k] -= f * M[col * w + k];
    }
  }
  const beta = new Float64Array(p);
  for (let j = 0; j < p; j++) beta[j] = M[j * w + p];
  return beta;
}

// cols: feature columns (each as long as y); shift rotates the features against y (the sky moved by other years).
export function walkForwardSSE(cols, y, shift = 0, refit = REFIT, ridge = RIDGE) {
  const N = y.length, q = cols.length, p = q + 1;
  const minTrain = Math.min(100, Math.floor(N * 0.3));
  const A = new Float64Array(p * p), b = new Float64Array(p), x = new Float64Array(p);
  const load = (i) => { x[0] = 1; for (let c = 0; c < q; c++) x[c + 1] = cols[c][(i + shift) % N]; };
  const add = (i) => { load(i); for (let j = 0; j < p; j++) { b[j] += x[j] * y[i]; for (let k = 0; k < p; k++) A[j * p + k] += x[j] * x[k]; } };
  for (let i = 0; i < minTrain; i++) add(i);
  let beta = null, sse = 0, n = 0;
  for (let t = minTrain; t < N; t++) {
    if ((t - minTrain) % refit === 0) beta = solve(A, b, p, ridge) || beta;
    load(t);
    let pr = 0;
    if (beta) for (let j = 0; j < p; j++) pr += beta[j] * x[j];
    const e = y[t] - pr;
    sse += e * e; n++;
    add(t);
  }
  return { sse, n };
}

// tests: [{id, cols|null}]. Skill = 1 - SSE(with the question) / SSE(a model that ignores the sky: the expanding mean).
// p: how often the sky shifted by another year does as well; padj: how often the best of all questions, on a shifted sky, does as well (counts every question asked).
export async function skyTest(tests, y, { shifts = SHIFTS, refit = REFIT, tick = null } = {}) {
  const N = y.length;
  if (N < MIN_ROWS) return { insufficient: true, rows: N, need: MIN_ROWS };
  const base = walkForwardSSE([], y, 0, refit).sse;
  const skill = (cols, shift) => (cols ? 1 - walkForwardSSE(cols, y, shift, refit).sse / base : 0);
  const observed = tests.map((t) => skill(t.cols, 0));
  const lags = Array.from({ length: shifts }, (_, s) => 250 + Math.floor((s * (N - 500)) / shifts));
  const beat = new Int32Array(tests.length), beatMax = new Int32Array(tests.length);
  for (let s = 0; s < shifts; s++) {
    const st = tests.map((t) => skill(t.cols, lags[s]));
    const top = Math.max(...st);
    st.forEach((v, j) => { if (v >= observed[j]) beat[j]++; if (top >= observed[j]) beatMax[j]++; });
    if (tick && s % 5 === 4) await tick((s + 1) / shifts);
  }
  return {
    insufficient: false, rows: N, shifts, refit, base,
    tests: tests.map((t, j) => ({ id: t.id, skill: observed[j], p: (1 + beat[j]) / (shifts + 1), padj: (1 + beatMax[j]) / (shifts + 1), testable: !!t.cols }))
  };
}

export function verdict(result) {
  const live = result.tests.filter((t) => t.testable);
  const best = live.slice().sort((a, b) => a.padj - b.padj || b.skill - a.skill)[0];
  const kind = best && best.skill > 0 && best.padj < 0.05 ? 'lead' : best && best.skill > 0 && best.padj < 0.2 ? 'faint' : 'none';
  return { kind, best };
}

export function dayNumber(date) {
  return Math.floor(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / 864e5);
}

export function parseCsv(text) {
  const lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('the file has no rows');
  const sep = [',', ';', '\t'].map((s) => [s, lines[0].split(s).length]).sort((a, b) => b[1] - a[1])[0][0];
  const head = lines[0].split(sep).map((h) => h.trim().replace(/"/g, '').toLowerCase());
  const di = head.findIndex((h) => h === 'date' || h === 'fecha');
  let ci = head.findIndex((h) => h === 'close' || h === 'cierre');
  if (ci < 0) ci = head.findIndex((h) => h === 'adj close' || h === 'adj_close');
  if (di < 0 || ci < 0) throw new Error('the file needs a Date column and a Close column');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(sep);
    const date = (c[di] || '').replace(/"/g, '').trim().slice(0, 10), close = parseFloat((c[ci] || '').replace(/"/g, ''));
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && close > 0) rows.push({ date, close });
  }
  if (!rows.length) throw new Error('no row has a date as YYYY-MM-DD and a positive close');
  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return rows.filter((r, i) => i === 0 || r.date !== rows[i - 1].date);
}
