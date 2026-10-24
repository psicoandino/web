// app.mjs: transitOS on the site. mount(root, menuPane) fills the viewport with a price under the sky, a time visor and one honest answer;
// the tools (which question, a CSV, the answer's summary, the guide) live in the footer Menu's transitOS tab (menuPane), the way the site keeps every system's settings.
// Everything is drawn at the real pixel size (it redraws on resize). Colors and fonts come from the site's own variables; every rule is scoped to #transit-view or #tab-transit.
import { parseCsv, skyTest, verdict, walkForwardSSE, dayNumber, SHIFTS, REFIT, MIN_ROWS } from './engine.mjs';
import { skyFromBuffers, alignSeries, FAMILY, ORDER, BODY_SYMBOLS, CLOSE_HOUR } from './sky.mjs';
import { ticks } from './axis.mjs';

const TICKERS = [['SPY', 'spy_us_d.csv'], ['QQQ', 'qqq_us_d.csv'], ['AAPL', 'aapl_us_d.csv'], ['GLD', 'gld_us_d.csv'], ['TLT', 'tlt_us_d.csv']];
const RANGES = [['1Y', 365], ['5Y', 1826], ['10Y', 3652], ['All', Infinity]];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (x) => (x >= 0 ? '+' : '') + (x * 100).toFixed(3) + '%';
const nap = () => new Promise((r) => setTimeout(r, 4));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lower = (arr, v) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < v) lo = m + 1; else hi = m; } return lo; };
const keep = (f) => { try { return f(); } catch (e) { return null; } };

const STYLE = `
@T .tr{position:absolute;inset:0;display:flex;flex-direction:column;text-align:right;animation:homeIn 1.2s ease both}
@T h1{margin:0;font-family:'Fraunces';font-weight:450;font-size:26px;line-height:1}
@T button{font-family:'Newsreader';color:var(--fg);cursor:pointer;background:none;border:0}
@T .tr-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:6px 20px;padding:10px 3vw 4px}
@T .tr-brand{display:flex;align-items:baseline;gap:10px}
@T .tr-sub{font-size:14px;opacity:.6}
@T .tr-series,@T .tr-range{display:flex;align-items:center;flex-wrap:wrap;justify-content:flex-end;gap:2px 16px}
@T .tr-series button,@T .tr-range button{border-bottom:1px solid transparent;padding:2px 0;font-size:17px;opacity:.55;transition:opacity .3s ease,border-color .3s ease}
@T .tr-range button{font-size:14px}
@T .tr-series button:hover,@T .tr-range button:hover{opacity:1}
@T .tr-series button.on,@T .tr-range button.on{opacity:1;border-bottom-color:var(--mostaza)}
@T .tr-help{width:26px;height:26px;border:1px solid var(--line);border-radius:999px;font-family:'Fraunces';font-size:14px;transition:border-color .25s ease}
@T .tr-help:hover{border-color:var(--mostaza)}
@T .tr-main{position:relative;flex:1;min-height:0}
@T .tr-plot{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:crosshair;outline:none}
@T .tr-plot text{font-family:'Newsreader'}
@T .tr-day{position:absolute;top:8px;right:3vw;padding:10px 14px;border-radius:12px;background:color-mix(in srgb,var(--bg) 80%,transparent);pointer-events:none;font-size:14px;line-height:1.45}
@T .tr-day.left{right:auto;left:3vw;text-align:left}
@T .tr-date{font-family:'Fraunces';font-size:20px;font-weight:450}
@T .tr-close{opacity:.7;margin-bottom:6px;font-variant-numeric:tabular-nums}
@T .tr-bl{display:grid;grid-template-columns:auto auto;gap:1px 22px;justify-content:end}
@T .tr-day.left .tr-bl{justify-content:start}
@T .tr-b{display:grid;grid-template-columns:18px auto;gap:6px;align-items:baseline;opacity:.88}
@T .tr-b i{color:var(--sangre);font-style:normal;margin-left:3px}
@T .tr-vrow{display:flex;align-items:center;gap:14px;padding:0 3vw}
@T .tr-visor{flex:1;min-width:0;height:46px;display:block;touch-action:none;cursor:grab}
@T .tr-dock{display:flex;align-items:center;justify-content:flex-end;gap:16px;padding:4px 3vw 10px}
@T .tr-cap{flex:1;margin:0;min-height:20px;font-size:14px;line-height:1.4;opacity:.8}
@T .tr-go{flex:none;background:var(--pill);border:1px solid var(--line);border-radius:999px;padding:8px 20px;font-family:'Fraunces';font-size:15px;transition:border-color .25s ease,transform .25s ease}
@T .tr-go:hover:not(:disabled){border-color:var(--mostaza);transform:translateY(-1px)}
@T .tr-go:disabled{opacity:.45;cursor:progress}
@T .tr-load{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:min(440px,86vw);text-align:center;font-size:15px;line-height:1.45;opacity:0;visibility:hidden;transition:opacity .4s ease,visibility 0s linear .4s;pointer-events:none}
@T .tr-load.on{opacity:.9;visibility:visible;transition:opacity .4s ease}
@T .tr-bar{height:2px;margin-top:10px;background:var(--line);overflow:hidden;border-radius:2px}
@T .tr-bar i{display:block;height:100%;width:0;background:var(--mostaza);transition:width .25s ease}
@T .tr-load.ind .tr-bar i{width:30%;animation:trInd 1.4s ease-in-out infinite}
@keyframes trInd{0%{transform:translateX(-100%)}100%{transform:translateX(340%)}}
@T .tr-sheet{position:absolute;right:3vw;bottom:8px;width:min(400px,94vw);box-sizing:border-box;padding:16px 18px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--bg) 90%,transparent);opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity .4s ease,transform .4s ease,visibility 0s linear .4s}
@T .tr-sheet.on{opacity:1;visibility:visible;transform:none;transition:opacity .4s ease,transform .4s ease}
@T .tr-sheet h2{margin:0 0 8px;font-family:'Fraunces';font-weight:450;font-size:28px;line-height:1.05}
@T .tr-sheet p{margin:0 0 6px;font-size:15px;line-height:1.5;opacity:.86}
@T .tr-x{position:absolute;top:6px;left:10px;font-size:22px;opacity:.6}
@T .tr-guide{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:flex-end;padding:0 6vw;background:color-mix(in srgb,var(--bg) 94%,transparent);opacity:0;visibility:hidden;transition:opacity .5s ease,visibility 0s linear .5s;overflow:auto}
@T .tr-guide.on{opacity:1;visibility:visible;transition:opacity .5s ease}
@T .tr-gc{max-width:560px;padding:20px 0}
@T .tr-gc h2{font-family:'Fraunces';font-weight:450;font-size:clamp(28px,4vw,44px);margin:0 0 14px}
@T .tr-gc ol{list-style:none;margin:0 0 18px;padding:0}
@T .tr-gc li{margin:0 0 10px;font-size:17px;line-height:1.5;opacity:.88}
@T .tr-gc li b{font-family:'Fraunces';font-weight:450;color:var(--mostaza)}
@T .tr-gc small{display:block;margin-top:10px;opacity:.55}
@P .tr-groups,@P .tr-qs{display:flex;flex-wrap:wrap;gap:5px}
@P .tr-qs{max-height:176px;overflow:auto}
@P .av-pick small{opacity:.65;margin-left:5px;font-size:.78em}
@P .av-pick.lead{border-color:var(--mostaza)}
@P .tr-st{font-size:12.5px;line-height:1.4;opacity:.78;min-height:34px}
@P .tr-go2{width:100%;padding:8px 0}
@P .av-pick:disabled{opacity:.45;cursor:progress}
@media(max-width:720px){
@T .tr-top{padding:8px 4vw 2px;gap:4px 12px}
@T h1{font-size:20px}
@T .tr-sub{display:none}
@T .tr-day{font-size:12px;padding:8px 10px;top:4px}
@T .tr-date{font-size:16px}
@T .tr-vrow{flex-wrap:wrap;gap:0 10px}
@T .tr-range{width:100%}
@T .tr-sheet{left:3vw;right:3vw;width:auto}
@T .tr-dock{flex-wrap:wrap}
}
`.replaceAll('@T ', '#transit-view ').replaceAll('@P ', '#tab-transit ');

export async function mount(root, menuPane) {
  if (root.dataset.ready) return;
  root.dataset.ready = '1';
  if (!document.getElementById('tr-style')) { const st = document.createElement('style'); st.id = 'tr-style'; st.textContent = STYLE; document.head.appendChild(st); }
  root.innerHTML = `<div class="tr">
<header class="tr-top"><nav class="tr-series" aria-label="Series"></nav><button class="tr-help" aria-label="How to read this" title="How to read this">?</button><div class="tr-brand"><h1>transitOS</h1><span class="tr-sub">a price under the sky</span></div></header>
<div class="tr-main"><svg class="tr-plot" role="img" aria-label="A price line above the daily sky of ten bodies" tabindex="0"></svg><div class="tr-day" aria-live="polite"></div>
<div class="tr-load"><p></p><div class="tr-bar"><i></i></div></div><aside class="tr-sheet" aria-live="polite"></aside></div>
<div class="tr-vrow"><div class="tr-range" aria-label="Time range"></div><svg class="tr-visor" role="img" aria-label="Time visor: drag to travel in time, drag its edges to zoom"></svg></div>
<div class="tr-dock"><p class="tr-cap" aria-live="polite"></p><button class="tr-go">Ask the sky</button></div>
<div class="tr-guide" role="dialog" aria-label="How to read transitOS"><div class="tr-gc"><h2>A price under the sky</h2><ol>
<li><b>The price.</b> The mustard line is the price of the series you chose. Scroll or pinch to zoom, and drag the visor beneath the chart to travel in time.</li>
<li><b>The sky.</b> Ten rows, one per body, every day. A red bar means the body moves backward (℞); a mustard point, that it enters a new constellation.</li>
<li><b>A day.</b> Move across the chart and the panel shows where each body stood that day. On a phone, touch and slide.</li>
<li><b>A question.</b> Open the footer Menu, tab transitOS: pick a question and its days are shaded on the price. Your own CSV goes there too.</li>
<li><b>The answer.</b> “Ask the sky” tests all ${FAMILY.length} questions against pure luck. Most of the time the honest answer is: nothing.</li></ol>
<button class="tr-go tr-ok">Understood</button><small>Reopen this with the ? button. A study, not advice.</small></div></div></div>`;
  const pane = menuPane || root.appendChild(document.createElement('div'));
  pane.innerHTML = `<div class="pop-title">transitOS · the questions</div><div class="tr-groups"></div><div class="tr-qs"></div><div class="tr-st"></div><button class="av-pick tr-go2">Ask the sky</button><div class="pop-row" style="justify-content:space-between"><label class="av-pick tr-csv">+ a CSV<input type="file" accept=".csv,text/csv" hidden></label><button class="av-pick tr-how">How to read this</button></div>`;
  const q = (s) => root.querySelector(s), p = (s) => pane.querySelector(s);
  const nav = q('.tr-series'), rangeEl = q('.tr-range'), helpBtn = q('.tr-help'), main = q('.tr-main'), svg = q('.tr-plot'), dayEl = q('.tr-day'), loadEl = q('.tr-load'), sheet = q('.tr-sheet'), visor = q('.tr-visor'), capEl = q('.tr-cap'), go = q('.tr-go'), guide = q('.tr-guide');
  const groupsEl = p('.tr-groups'), chipsEl = p('.tr-qs'), stEl = p('.tr-st'), go2 = p('.tr-go2'), csvIn = p('.tr-csv input');

  const series = new Map(TICKERS.map(([name, file]) => [name, { name, file }]));
  let sky = null, cur = null, sel = FAMILY[0].id, win = { a: 0, b: 1 }, d0 = 0, d1 = 1, W = 0, H = 0, geo = null, hoverRow = 0, busy = false, maskG = null, hair = null, pt = null;
  const defOf = (id) => FAMILY.find((d) => d.id === id);
  const selBody = () => { const b = sel.split(':')[1]; return ORDER.includes(b) ? b : null; };

  function setLoad(msg, f) {
    loadEl.classList.toggle('on', !!msg);
    loadEl.classList.toggle('ind', !!msg && f == null);
    if (msg) loadEl.firstChild.textContent = msg;
    loadEl.querySelector('i').style.width = f == null ? '' : Math.round(f * 100) + '%';
  }

  async function loadSeries(name) {
    const s = series.get(name);
    if (s.al) return s;
    const res = await fetch(new URL('./data/' + s.file, import.meta.url));
    if (!res.ok) throw new Error('the price table ' + s.file + ' did not open');
    s.rows = parseCsv(await res.text());
    s.days = Int32Array.from(s.rows, (r) => dayNumber(r.date));
    s.al = alignSeries(s.rows, sky);
    return s;
  }

  const isRange = (d) => cur && (d === Infinity ? win.a <= d0 + 1 && win.b >= d1 - 1 : Math.abs(win.b - win.a - d) < 3 && win.b >= d1 - 1);
  function renderTop() {
    nav.innerHTML = [...series.keys()].map((n) => `<button data-n="${esc(n)}" class="${cur && cur.name === n ? 'on' : ''}">${esc(n)}</button>`).join('');
    rangeEl.innerHTML = RANGES.map(([l, d]) => `<button data-d="${d}" class="${isRange(d) ? 'on' : ''}">${l}</button>`).join('');
  }

  function fit(a, span) {
    const total = d1 - d0, s = clamp(span, Math.min(30, total), total), a2 = clamp(a, d0, d1 - s);
    setWindow(a2, a2 + s);
  }
  function setWindow(a, b) {
    const minS = Math.min(30, d1 - d0);
    a = Math.max(a, d0); b = Math.min(b, d1);
    if (b - a < minS) { b = Math.min(d1, a + minS); a = Math.max(d0, b - minS); }
    win = { a, b };
    renderTop(); draw(); drawVisor();
  }

  function ticks(a, b, PW) {
    const months = (b - a) / 30.44, step = [1, 3, 6, 12, 24, 60, 120].find((s) => PW / (months / s) >= 78) || 120, out = [];
    const da = new Date(a * 864e5);
    let mm = Math.ceil((da.getUTCFullYear() * 12 + da.getUTCMonth()) / step) * step;
    for (; ; mm += step) {
      const dn = Date.UTC(Math.floor(mm / 12), mm % 12, 1) / 864e5;
      if (dn > b) break;
      if (dn >= a) out.push({ dn, label: step >= 12 ? String(Math.floor(mm / 12)) : MONTHS[mm % 12] + (mm % 12 === 0 ? ' ' + Math.floor(mm / 12) : '') });
    }
    return out;
  }

  function draw() {
    if (!cur || !sky || !W) return;
    const mob = W < 720, R = mob ? 30 : 100, PW = W - R, PY0 = 18, PY1 = Math.round(H * (mob ? 0.36 : 0.4)), top = PY1 + 26, AX = 40;
    const RH = Math.max(12, Math.min(40, (H - top - AX) / ORDER.length));
    const a = win.a, b = win.b, span = b - a, X = (dn) => ((dn - a) / span) * PW, days = cur.days, rows = cur.rows;
    const i0 = Math.max(0, lower(days, a) - 1), i1 = Math.min(days.length - 1, lower(days, b + 1));
    let lo = Infinity, hi = -Infinity;
    for (let i = i0; i <= i1; i++) { const v = rows[i].close; if (v < lo) lo = v; if (v > hi) hi = v; }
    const pad = (hi - lo) * 0.06 || 1; lo -= pad; hi += pad;
    const Y = (v) => PY1 - ((v - lo) / (hi - lo)) * (PY1 - PY0);
    geo = { a, b, span, PW, PY0, PY1, X, Y, top, RH };
    const step = Math.max(1, Math.ceil((i1 - i0 + 1) / (PW * 1.2)));
    let d = '';
    for (let i = i0; i <= i1; i += step) d += (d ? 'L' : 'M') + X(days[i]).toFixed(1) + ' ' + Y(rows[i].close).toFixed(1);
    const fmt = (v) => (v < 10 ? v.toFixed(2) : Math.round(v).toString());
    let grid = '';
    for (const v of [lo + (hi - lo) * 0.08, (lo + hi) / 2, hi - (hi - lo) * 0.08]) grid += `<line x1="0" x2="${PW}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="var(--line)" opacity=".6"/><text x="6" y="${(Y(v) - 4).toFixed(1)}" font-size="11" fill="var(--fg)" opacity=".5">${fmt(v)}</text>`;
    const A = Math.floor(a), B = Math.ceil(b);
    let sr = '';
    ORDER.forEach((bd, i) => {
      const y = top + i * RH + RH / 2, on = selBody() === bd;
      sr += `<line x1="0" x2="${PW}" y1="${y}" y2="${y}" stroke="var(${on ? '--amatista' : '--line'})" stroke-width="${on ? 1.6 : 1}"/>`;
      const rt = sky.retro[bd], bh = Math.min(9, RH * 0.42);
      if (rt) {
        let run = -1;
        for (let dn = A; dn <= B + 1; dn++) {
          const isOn = dn <= B && rt[dn - sky.start] === 1;
          if (isOn && run < 0) run = dn;
          if (!isOn && run >= 0) { sr += `<rect x="${X(run).toFixed(1)}" y="${y - bh / 2}" width="${Math.max(1.5, X(dn) - X(run)).toFixed(1)}" height="${bh}" rx="${bh / 2}" fill="var(--sangre)" opacity=".85"/>`; run = -1; }
        }
      }
      if (bd !== 'Moon') {
        const tr = sky.terr[bd];
        for (let dn = A + 1; dn <= B; dn++) if (tr[dn - sky.start] !== tr[dn - sky.start - 1]) sr += `<circle cx="${X(dn).toFixed(1)}" cy="${y}" r="${mob ? 1.6 : 2.2}" fill="var(--mostaza)"/>`;
      }
      sr += `<text x="${W - 6}" y="${y + 5}" text-anchor="end" font-size="${mob ? 15 : 17}" fill="var(${on ? '--amatista' : '--fg'})" opacity="${on ? 1 : 0.75}">${BODY_SYMBOLS[bd]}</text>`;
      if (!mob) sr += `<text x="${W - 30}" y="${y + 4}" text-anchor="end" font-size="12" fill="var(${on ? '--amatista' : '--fg'})" opacity="${on ? 1 : 0.5}">${bd}</text>`;
    });
    let tk = '';
    for (const t of ticks(a, b, PW)) tk += `<line x1="${X(t.dn).toFixed(1)}" x2="${X(t.dn).toFixed(1)}" y1="${top - 4}" y2="${top + ORDER.length * RH}" stroke="var(--line)" opacity=".5"/><text x="${X(t.dn).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="11" fill="var(--fg)" opacity=".6">${t.label}</text>`;
    const legend = `<text x="8" y="${H - 22}" font-size="11" fill="var(--fg)" opacity=".6">${mob ? 'red bar: moves backward (℞) · point: new constellation' : 'red bar: the body moves backward (℞) · point: it enters a new constellation'}</text>`;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `<g class="m"></g>${grid}<path d="${d}" fill="none" stroke="var(--mostaza)" stroke-width="1.7" stroke-linejoin="round"/>${tk}${sr}${legend}<line class="h" y1="${PY0}" y2="${top + ORDER.length * RH}" stroke="var(--fg)" stroke-dasharray="2 4" opacity=".55"/><circle class="p" r="4.5" fill="var(--sangre)"/>`;
    maskG = svg.querySelector('.m'); hair = svg.querySelector('.h'); pt = svg.querySelector('.p');
    hoverAt(clamp(hoverRow, i0, i1));
  }

  function drawVisor() {
    const Wv = visor.clientWidth, Hv = visor.clientHeight;
    if (!cur || !Wv) return;
    const total = Math.max(1, d1 - d0), VX = (dn) => ((dn - d0) / total) * Wv, rows = cur.rows, n = rows.length, st = Math.max(1, Math.ceil(n / 500));
    if (cur.lo === undefined) { cur.lo = Infinity; cur.hi = -Infinity; for (const r of rows) { if (r.close < cur.lo) cur.lo = r.close; if (r.close > cur.hi) cur.hi = r.close; } }
    let d = '';
    for (let i = 0; i < n; i += st) d += (d ? 'L' : 'M') + VX(cur.days[i]).toFixed(1) + ' ' + (Hv - 5 - ((rows[i].close - cur.lo) / Math.max(1e-9, cur.hi - cur.lo)) * (Hv - 10)).toFixed(1);
    const xa = VX(win.a), w = Math.max(8, VX(win.b) - xa);
    visor.setAttribute('viewBox', `0 0 ${Wv} ${Hv}`);
    visor.innerHTML = `<path d="${d}" fill="none" stroke="var(--fg)" stroke-width="1" opacity=".4"/><rect x="${xa.toFixed(1)}" y="2" width="${w.toFixed(1)}" height="${Hv - 4}" rx="6" fill="var(--amatista)" opacity=".2"/><rect x="${xa.toFixed(1)}" y="2" width="${w.toFixed(1)}" height="${Hv - 4}" rx="6" fill="none" stroke="var(--mostaza)" stroke-width="1.4"/>`;
  }

  function drawMask(ref) {
    const def = defOf(sel), A = Math.floor(geo.a), B = Math.ceil(geo.b);
    let out = '', run = -1;
    for (let dn = A; dn <= B + 1; dn++) {
      const isOn = dn <= B && def.mask(sky, dn - sky.start, ref);
      if (isOn && run < 0) run = dn;
      if (!isOn && run >= 0) { out += `<rect x="${geo.X(run).toFixed(1)}" y="${geo.PY0}" width="${Math.max(0.8, geo.X(dn) - geo.X(run)).toFixed(1)}" height="${geo.PY1 - geo.PY0}" fill="var(--amatista)" opacity=".24"/>`; run = -1; }
    }
    maskG.innerHTML = out;
  }

  function showDay(row) {
    const r = cur.rows[row], k = cur.days[row] - sky.start;
    dayEl.innerHTML = `<div class="tr-date">${r.date}</div><div class="tr-close">${esc(cur.name)} ${r.close.toFixed(2)}</div><div class="tr-bl">` + ORDER.map((b) => {
      const rt = sky.retro[b] && sky.retro[b][k];
      return `<div class="tr-b" title="${b}"><span>${BODY_SYMBOLS[b]}</span><span>${esc(sky.names.get(sky.symbolOf[sky.terr[b][k]]))}${rt ? ' <i>℞</i>' : ''}</span></div>`;
    }).join('') + '</div>';
  }

  function caption() {
    if (!cur || !sky) return;
    const def = defOf(sel), b = sel.split(':')[1], ref = cur.days[hoverRow] - sky.start, total = d1 - d0 + 1;
    let shaded = 0;
    for (let dn = d0; dn <= d1; dn++) if (def.mask(sky, dn - sky.start, ref)) shaded++;
    const what = def.group === 'Retrograde' ? `the days ${b} moved backward` : def.group === 'Territory' ? `the days ${b} stood in ${sky.names.get(sky.symbolOf[sky.terr[b][ref]])}, as on the day under your finger` : def.group === 'Moon' ? 'the days the Moon was in the same quarter of its cycle as the day under your finger' : `the days ${b} was within two days of entering a new constellation`;
    const t = cur.result && !cur.result.insufficient ? cur.result.tests.find((x) => x.id === sel) : null;
    capEl.textContent = `Shaded: ${what}, ${shaded} of ${total} days.` + (t ? ` Asked: it changes the fit by ${pct(t.skill)} (0 means nothing); chance this is luck among ${cur.result.tests.length} questions: ${Math.round(t.padj * 100)}%.` : ' Choose another question in the footer Menu, tab transitOS.');
  }

  function hoverAt(row) {
    if (!cur || !geo) return;
    hoverRow = clamp(row, 0, cur.rows.length - 1);
    const x = geo.X(cur.days[hoverRow]), y = geo.Y(cur.rows[hoverRow].close);
    hair.setAttribute('x1', x); hair.setAttribute('x2', x); pt.setAttribute('cx', x); pt.setAttribute('cy', y);
    dayEl.classList.toggle('left', x > geo.PW / 2);
    showDay(hoverRow);
    drawMask(cur.days[hoverRow] - sky.start);
    caption();
  }

  function scrub(clientX) {
    if (!cur || !geo) return;
    const r = svg.getBoundingClientRect(), dn = geo.a + clamp((clientX - r.left) / geo.PW, 0, 1) * geo.span;
    let lo = 0, hi = cur.days.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cur.days[m] < dn) lo = m + 1; else hi = m; }
    hoverAt(lo > 0 && Math.abs(cur.days[lo - 1] - dn) <= Math.abs(cur.days[lo] - dn) ? lo - 1 : lo);
  }

  const ptrs = new Map();
  let pinch = null;
  svg.addEventListener('pointerdown', (e) => {
    svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, e.clientX);
    if (ptrs.size === 2 && geo) {
      const [x1, x2] = [...ptrs.values()], r = svg.getBoundingClientRect(), frac = clamp(((x1 + x2) / 2 - r.left) / geo.PW, 0, 1), span = win.b - win.a;
      pinch = { d: Math.max(20, Math.abs(x1 - x2)), span, at: win.a + frac * span };
    } else scrub(e.clientX);
  });
  svg.addEventListener('pointermove', (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, e.clientX);
    if (ptrs.size >= 2 && pinch && geo) {
      const [x1, x2] = [...ptrs.values()], r = svg.getBoundingClientRect(), frac = clamp(((x1 + x2) / 2 - r.left) / geo.PW, 0, 1), ns = pinch.span * (pinch.d / Math.max(20, Math.abs(x1 - x2)));
      fit(pinch.at - frac * ns, ns);
      return;
    }
    if (e.pointerType === 'touch' && !ptrs.has(e.pointerId)) return;
    scrub(e.clientX);
  });
  const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('wheel', (e) => {
    if (!cur || !geo) return;
    e.preventDefault();
    const r = svg.getBoundingClientRect(), frac = clamp((e.clientX - r.left) / geo.PW, 0, 1), span = win.b - win.a;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { fit(win.a + (e.deltaX / geo.PW) * span, span); return; }
    const ns = span * Math.exp(e.deltaY * 0.002), at = win.a + frac * span;
    fit(at - frac * ns, ns);
  }, { passive: false });
  svg.addEventListener('keydown', (e) => {
    if (!cur) return;
    const dir = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (dir) {
      e.preventDefault();
      const row = clamp(hoverRow + dir * (e.shiftKey ? 10 : 1), 0, cur.rows.length - 1), dn = cur.days[row], s = win.b - win.a;
      if (dn < win.a || dn > win.b) fit(dn - s / 2, s);
      hoverAt(row);
    } else if (e.key === '+' || e.key === '=' || e.key === '-') {
      const s = win.b - win.a, mid = (win.a + win.b) / 2, ns = e.key === '-' ? s * 1.4 : s / 1.4;
      fit(mid - ns / 2, ns);
    }
  });

  let vdrag = null;
  visor.addEventListener('pointerdown', (e) => {
    if (!cur) return;
    visor.setPointerCapture(e.pointerId);
    const r = visor.getBoundingClientRect(), Wv = r.width, total = d1 - d0, x = e.clientX - r.left, xa = ((win.a - d0) / total) * Wv, xb = ((win.b - d0) / total) * Wv, wide = xb - xa > 36;
    const mode = wide && Math.abs(x - xa) < 14 ? 'a' : wide && Math.abs(x - xb) < 14 ? 'b' : x >= xa && x <= xb ? 'pan' : 'jump';
    vdrag = { mode, x, a: win.a, b: win.b, Wv };
    if (mode === 'jump') { const s = win.b - win.a, mid = d0 + (x / Wv) * total; fit(mid - s / 2, s); vdrag.mode = 'pan'; vdrag.a = win.a; vdrag.b = win.b; }
  });
  visor.addEventListener('pointermove', (e) => {
    if (!vdrag) return;
    const r = visor.getBoundingClientRect(), dd = ((e.clientX - r.left - vdrag.x) / vdrag.Wv) * (d1 - d0), s = vdrag.b - vdrag.a;
    if (vdrag.mode === 'pan') fit(vdrag.a + dd, s); else if (vdrag.mode === 'a') setWindow(vdrag.a + dd, vdrag.b); else setWindow(vdrag.a, vdrag.b + dd);
  });
  const vup = () => { vdrag = null; };
  visor.addEventListener('pointerup', vup); visor.addEventListener('pointercancel', vup);

  function headOf(v) { return v.kind === 'lead' ? 'A lead that survives.' : v.kind === 'faint' ? 'A faint lead.' : 'No evidence.'; }
  function renderQ() {
    const groups = [...new Set(FAMILY.map((d) => d.group))], g = defOf(sel).group;
    const res = cur && cur.result && !cur.result.insufficient ? new Map(cur.result.tests.map((t) => [t.id, t])) : null;
    groupsEl.innerHTML = groups.map((x) => `<button class="av-pick tr-tab${x === g ? ' on' : ''}" data-g="${x}">${x}</button>`).join('');
    chipsEl.innerHTML = FAMILY.filter((d) => d.group === g).map((d) => {
      const t = res && res.get(d.id), lead = t && t.skill > 0 && t.padj < 0.05;
      return `<button class="av-pick tr-chip${d.id === sel ? ' on' : ''}${lead ? ' lead' : ''}" data-id="${d.id}">${esc(d.label)}${t ? `<small>luck ${Math.round(t.padj * 100)}%</small>` : ''}</button>`;
    }).join('');
    const r = cur && cur.result;
    stEl.textContent = !r ? 'Not asked yet. Picking a question shades its days on the price.' : r.insufficient ? 'Too few days to ask.' : `${headOf(cur.verdict)} Closest: ${defOf(cur.verdict.best.id).label}, chance of luck ${Math.round(cur.verdict.best.padj * 100)}%.`;
  }

  function renderSheet() {
    const c = cur, r = c && c.result;
    if (!r) { sheet.classList.remove('on'); return; }
    if (r.insufficient) { sheet.innerHTML = `<button class="tr-x" aria-label="Close">×</button><h2>Too few days.</h2><p>${r.rows} days read; at least ${r.need} are needed before any answer is honest.</p>`; sheet.classList.add('on'); return; }
    const v = c.verdict, b = v.best, lab = defOf(b.id).label;
    const rep = c.repl && c.repl.of ? ` The same question on the other ${c.repl.of} series lifts the fit on ${c.repl.up} of ${c.repl.of}; chance alone gives about half.` : '';
    const tail = v.kind === 'lead' ? ' A lead is not a forecast: it asks for more series and more years.' : v.kind === 'faint' ? ' Not enough to stand on. A lead stays a lead until it repeats.' : ' The sky shifted by other years does as well as the real one. That is the finding, not a failure.';
    sheet.innerHTML = `<button class="tr-x" aria-label="Close">×</button><h2>${headOf(v)}</h2><p>Of ${r.tests.length} questions about the sky, the closest was “${esc(lab)}”. It changes the fit by ${pct(b.skill)} (0 means the sky adds nothing), and the chance that this is luck, counting every question asked, is ${Math.round(b.padj * 100)}%.${rep}${tail}</p>`;
    sheet.classList.add('on');
  }

  function replicate(c, best) {
    const def = defOf(best.id);
    let up = 0, of = 0;
    for (const s of series.values()) {
      if (s === c || !s.al) continue;
      const cols = def.cols(sky, s.al.idx);
      if (!cols) continue;
      of++;
      if (1 - walkForwardSSE(cols, s.al.y).sse / walkForwardSSE([], s.al.y).sse > 0) up++;
    }
    return { up, of };
  }

  async function select(name) {
    try {
      setLoad('Opening ' + name + '…');
      const s = await loadSeries(name);
      cur = s; d0 = s.days[0]; d1 = s.days[s.days.length - 1]; hoverRow = s.rows.length - 1;
      renderQ(); renderSheet();
      fit(d1 - 3652, 3652);
      setLoad('');
    } catch (err) { setLoad(err.message); }
  }

  function showGuide(on) { guide.classList.toggle('on', on); if (!on) keep(() => localStorage.setItem('transit_guide_seen', '1')); }
  helpBtn.addEventListener('click', () => showGuide(!guide.classList.contains('on')));
  p('.tr-how').addEventListener('click', () => showGuide(true));
  q('.tr-ok').addEventListener('click', () => showGuide(false));
  sheet.addEventListener('click', (e) => { if (e.target.closest('.tr-x')) sheet.classList.remove('on'); });
  nav.addEventListener('click', (e) => { const b = e.target.closest('button[data-n]'); if (b) select(b.dataset.n); });
  rangeEl.addEventListener('click', (e) => { const b = e.target.closest('button[data-d]'); if (b && cur) { const d = Number(b.dataset.d); fit(d === Infinity ? d0 : d1 - d, d === Infinity ? d1 - d0 : d); } });
  groupsEl.addEventListener('click', (e) => { const b = e.target.closest('button[data-g]'); if (b && cur) { sel = FAMILY.find((d) => d.group === b.dataset.g).id; renderQ(); draw(); } });
  chipsEl.addEventListener('click', (e) => { const b = e.target.closest('button[data-id]'); if (b && cur) { sel = b.dataset.id; renderQ(); draw(); } });
  csvIn.addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      setLoad('Reading ' + f.name + '…');
      const rows = parseCsv(await f.text());
      if (rows.length <= MIN_ROWS) throw new Error(`${rows.length} days is too few; transitOS needs more than ${MIN_ROWS}`);
      let name = f.name.replace(/\.[^.]+$/, '').slice(0, 14).toUpperCase();
      while (series.has(name)) name += '*';
      const s = { name, rows, days: Int32Array.from(rows, (r) => dayNumber(r.date)) };
      s.al = alignSeries(rows, sky);
      series.set(name, s);
      await select(name);
    } catch (err) { setLoad(err.message); }
  });

  async function ask() {
    if (busy || !cur || !sky) return;
    busy = true; go.disabled = true; go2.disabled = true;
    const c = cur;
    try {
      setLoad('Reading the other series…');
      for (const [n] of TICKERS) if (n !== c.name) { try { await loadSeries(n); } catch (e) { /* a series that cannot open is left out of the check on other series */ } }
      const tests = FAMILY.map((d) => ({ id: d.id, cols: d.cols(sky, c.al.idx) }));
      c.result = await skyTest(tests, c.al.y, { tick: async (f) => { setLoad(`Asking all ${FAMILY.length} questions, then moving the sky by other years to see what luck alone can do. ${Math.round(f * 100)}%`, f); await nap(); } });
      if (!c.result.insufficient) { c.verdict = verdict(c.result); c.repl = replicate(c, c.verdict.best); }
      setLoad('');
    } catch (err) { setLoad(err.message); }
    busy = false; go.disabled = false; go2.disabled = false;
    if (cur === c) { renderQ(); renderSheet(); caption(); }
  }
  go.addEventListener('click', ask); go2.addEventListener('click', ask);

  const measure = () => { const r = main.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height); draw(); drawVisor(); };
  new ResizeObserver(measure).observe(main);
  new ResizeObserver(drawVisor).observe(visor);

  try {
    renderTop(); renderQ();
    setLoad('Opening the sky and the price…');
    const [meta, buf] = await Promise.all([
      fetch(new URL('./data/sky.json', import.meta.url)).then((r) => { if (!r.ok) throw new Error('the sky table did not open'); return r.json(); }),
      fetch(new URL('./data/sky.bin', import.meta.url)).then((r) => { if (!r.ok) throw new Error('the sky numbers did not open'); return r.arrayBuffer(); })
    ]);
    sky = skyFromBuffers(meta, buf);
    measure();
    await select('SPY');
    if (!keep(() => localStorage.getItem('transit_guide_seen'))) showGuide(true);
    if (location.hash === '#transit-ask' || location.hash === '#transit-menu') { showGuide(false); if (location.hash === '#transit-ask') ask(); }
  } catch (err) { setLoad(err.message); }
}
