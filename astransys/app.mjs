import { browserTimeMetadata, listCities, listContinents, listCountries } from './geography-browser.mjs';
import { assignmentFocusText, houseActionLabel, houseLabel, housePrerequisiteMessage, houseResultStatus, houseSets, houseShortLabel, houseStaleMessage, houseStatusLabel } from './houses-ui.mjs';
import { humanError, nowFormValues, serializeUtc, todayFormValues } from './serializers.mjs';
import { acceptUiError, acceptUiSuccess, beginUiRequest, initialUiState, isCurrentRequest } from './ui-state.mjs';

const $ = (selector) => document.querySelector(selector);
const els = {
  form: $('#calc-form'), date: $('#input-date'), time: $('#input-time'), button: $('#calculate-button'),
  error: $('#form-error'), workerStatus: $('#worker-status'), resultTitle: $('#result-title'),
  assumptions: $('#assumptions'), axes: $('#axes'), bodyList: $('#body-list'), focus: $('#focus-panel'), science: $('#science-panel'), resultIso: $('#result-iso'),
  continent: $('#continent-select'), country: $('#country-select'), city: $('#city-select'), placeNote: $('#place-note'), houses: $('#houses-select'), houseStatus: $('#houses-status'), housePanel: $('#houses-panel'),
  today: $('#today-button'), now: $('#now-button'), stateDate: $('#state-date'), stateTime: $('#state-time'), statePlace: $('#state-place'), stateFrame: $('#state-frame')
};
const state = { ...initialUiState(), mode: 'diorama', selectedBody: 'Sun', city: null, cityOptions: [], cityPending: false, geoToken: 0, houses: null, houseStatus: 'none', houseError: null };
const worker = new Worker('./worker.mjs', { type: 'module' });
const TERRITORY_GLYPH = Object.freeze({ Ari: '♈︎', Tau: '♉︎', Gem: '♊︎', Cnc: '♋︎', Leo: '♌︎', Vir: '♍︎', Lib: '♎︎', Sco: '♏︎', Oph: '⛎︎', Sgr: '♐︎', Cap: '♑︎', Aqr: '♒︎', Psc: '♓︎' });
const TERRITORY_ES = Object.freeze({ Ari: 'Aries', Tau: 'Tauro', Gem: 'Géminis', Cnc: 'Cáncer', Leo: 'Leo', Vir: 'Virgo', Lib: 'Libra', Sco: 'Escorpión', Oph: 'Ofiuco', Sgr: 'Sagitario', Cap: 'Capricornio', Aqr: 'Acuario', Psc: 'Piscis' });

function utcForForm() {
  return serializeUtc(els.date.value, els.time.value);
}

function observerForCity() {
  if (!state.city) return null;
  return { latitudeDeg: state.city.latitude, longitudeDeg: state.city.longitude, heightMeters: 0, heightSource: 'assumed-zero-city-reference' };
}

function requestPayload() {
  const time = utcForForm();
  const observer = observerForCity();
  const locationProvided = observer !== null;
  const exact = time.timeStatus === 'exact';
  if (els.houses.value !== 'none' && (!exact || !state.city)) throw new Error('Las casas requieren hora exacta UTC y una ciudad seleccionada.');
  return {
    utc: time.utc,
    timeStatus: time.timeStatus,
    locationStatus: locationProvided ? 'provided' : 'missing',
    inputCompleteness: exact ? (locationProvided ? 'date-time-location' : 'date-time') : (locationProvided ? 'date-location' : 'date-only'),
    originalInput: { date: els.date.value, timeProvided: exact, locationProvided },
    observer,
    locationMetadata: state.city ? {
      geonameId: state.city.geonameId, name: state.city.name, admin1: state.city.admin1,
      countryCode: state.city.countryCode, timezone: state.city.timezone, latitude: state.city.latitude,
      longitude: state.city.longitude, source: 'GeoNames cities500; approximate named-place point',
      heightSource: 'assumed-zero-city-reference'
    } : null,
    includeCrossings: true,
    houses: els.houses.value,
    toleranceArcsec: 1
  };
}

function displayDegree(longitude) {
  if (!Number.isFinite(longitude)) return null;
  return ((longitude % 30) + 30) % 30;
}
function degreeText(longitude) {
  const degree = displayDegree(longitude);
  return degree === null ? '—' : `${degree.toFixed(2)}° interno`;
}
function remainingText(body) {
  const value = body?.crossing?.travelAlongProjectedPathDeg;
  return Number.isFinite(value) ? `faltan ${value.toFixed(2)}°` : '—';
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }

function territory(info) {
  if (!info) return '<span class="territory-name">—</span>';
  const glyph = TERRITORY_GLYPH[info.symbol] ?? '';
  return `<span class="territory-symbol" aria-hidden="true">${glyph}</span><span class="territory-name">${escapeHtml(TERRITORY_ES[info.symbol] ?? info.name ?? '—')}</span><span class="territory-degree">${degreeText(info.eclipticLongitudeDeg)}</span>`;
}

function renderAxes() {
  if (!state.axes) { els.axes.hidden = true; els.axes.innerHTML = ''; return; }
  els.axes.hidden = false;
  els.axes.innerHTML = Object.entries(state.axes).map(([label, axis]) => `<div class="axis"><div class="axis-label">${label}</div><div class="axis-value"><span class="axis-glyph" aria-hidden="true">${TERRITORY_GLYPH[axis.symbol] ?? ''}</span> · ${escapeHtml(TERRITORY_ES[axis.symbol] ?? axis.name ?? '—')}</div><div class="axis-degree">${degreeText(axis.degree)}</div></div>`).join('');
}

function renderAssumptions() {
  const result = state.result;
  const humanDate = new Date(result.input.utc).toLocaleDateString('es-CL', { dateStyle: 'full', timeZone: 'UTC' });
  const exact = result.input.timeStatus === 'exact';
  const place = state.city?.name ?? result.input.locationMetadata?.name ?? (result.input.locationStatus === 'provided' ? 'observador proporcionado' : 'geocéntrico');
  const frame = result.localFrame
    ? 'disponible · ASC / MC / DSC / IC'
    : result.localFrameReason === 'exact-time-required'
      ? 'no disponible · requiere hora exacta'
      : 'no disponible · requiere lugar';
  const messages = [];
  if (result.input.timeStatus !== 'exact') messages.push('Sin hora exacta: se usa 12:00 UTC como referencia visible; no se calcula marco local.');
  if (result.input.locationStatus !== 'provided') messages.push('Sin lugar: la arquitectura es geocéntrica y no incluye ASC/MC.');
  if (state.city) messages.push('Lugar GeoNames aproximado; altura 0 m asumida explícitamente como referencia WGS84.');
  if (result.localFrame?.status === 'near-pole') messages.push('Cerca del polo: la orientación local es muy sensible a la longitud de referencia.');
  if (result.localFrame?.status === 'pole-degenerate') messages.push('Polo geográfico: ASC/MC se conservan como convención trazable, no como orientación física única.');
  els.assumptions.hidden = false;
  els.assumptions.innerHTML = `<dl class="assumption-lines"><div><dt>Fecha</dt><dd>${escapeHtml(humanDate)}</dd></div><div><dt>Hora</dt><dd>${exact ? `${escapeHtml(result.input.utc.slice(11, 19))} UTC · exacta` : '12:00 UTC · referencia'}</dd></div><div><dt>Lugar</dt><dd>${escapeHtml(place)}</dd></div><div><dt>Marco local</dt><dd>${escapeHtml(frame)}</dd></div></dl>${messages.length ? `<ul class="assumption-warnings">${messages.map((message) => `<li>${escapeHtml(message)}</li>`).join('')}</ul>` : ''}`;
}

function renderHouseStatus() {
  const system = els.houses.value;
  if (state.houseStatus === 'pending') {
    els.houseStatus.textContent = 'Calculando casas…';
  } else if (state.houseStatus === 'success') {
    els.houseStatus.textContent = `${houseLabel(system)} · calculado`;
  } else if (state.houseStatus === 'error') {
    els.houseStatus.textContent = state.houseError ?? `Casas · ${houseStatusLabel('invalid-input')}`;
  } else if (state.houseStatus === 'stale' && els.time.value && state.city) {
    els.houseStatus.textContent = houseStaleMessage(system);
  } else {
    els.houseStatus.textContent = housePrerequisiteMessage(system, {
      exact: Boolean(els.time.value), city: state.city, cityPending: state.cityPending
    });
  }
}

function renderHouses() {
  const system = els.houses.value;
  if (!state.houses || system === 'none') {
    els.housePanel.hidden = true; els.housePanel.innerHTML = ''; return;
  }
  const sets = houseSets(state.houses);
  els.housePanel.hidden = false;
  els.housePanel.innerHTML = `<div class="section-kicker">laboratorio avanzado · casas</div><h3 id="houses-panel-title">${escapeHtml(houseLabel(system))}</h3>${sets.map((set) => {
    const status = houseStatusLabel(set.status);
    const entries = Object.entries(set.cusps ?? {}).sort(([a], [b]) => Number(a) - Number(b));
    const cuspList = entries.length
      ? `<ol class="house-cusps">${entries.map(([number, longitude]) => `<li><span>H${escapeHtml(number)}</span><span>${Number.isFinite(longitude) ? `${longitude.toFixed(2)}°` : '—'}</span></li>`).join('')}</ol>`
      : '<p class="house-empty">No hay cúspides consumibles para este estado.</p>';
    return `<details class="house-set" open><summary><span>${escapeHtml(houseLabel(set.system))}</span><span class="meta">${escapeHtml(status)}</span></summary><p class="house-definition">${escapeHtml(set.definition ?? 'Definición no disponible.')}</p>${cuspList}</details>`;
  }).join('')}`;
}

function bodyRow(body) {
  const current = body.astransysTerritory;
  const next = body.crossing.nextAstransysTerritory;
  const selected = body.body === state.selectedBody ? ' selected' : '';
  const rate = body.motion.state === 'retrograde' ? '℞' : body.motion.state === 'stationary' ? '·' : '→';
  const degree = displayDegree(body.ecliptic.longitudeDeg);
  const barWidth = degree === null ? 0 : degree / 30 * 100;
  return `<button class="body-row${selected}" type="button" data-body="${escapeHtml(body.body)}" aria-pressed="${body.body === state.selectedBody}" aria-label="${escapeHtml(body.displayName)}; ${escapeHtml(current.name)}; seleccionar detalle">
    <span class="territory">${territory(current)}</span>
    <span class="body-center"><span class="body-symbol" aria-hidden="true">${escapeHtml(body.symbol)}</span><span class="body-name">${escapeHtml(body.displayName)}</span><span class="body-degree">${degreeText(body.ecliptic.longitudeDeg)}</span><span class="degree-bar" aria-hidden="true"><span style="width:${barWidth}%"></span></span><span class="motion" title="${escapeHtml(body.motion.state)}">${rate}</span></span>
    <span class="territory right">${next ? `${territory(next)}<span class="territory-degree">${remainingText(body)}</span>` : '<span class="territory-name">—</span><span class="territory-degree">—</span>'}</span>
  </button>`;
}

function renderBodies() {
  const result = state.result;
  els.bodyList.innerHTML = state.mode === 'summary'
    ? `<div class="summary-table">${result.bodies.map((body) => `<button class="body-row${body.body === state.selectedBody ? ' selected' : ''}" type="button" data-body="${escapeHtml(body.body)}" aria-pressed="${body.body === state.selectedBody}"><span class="body-code">${escapeHtml(body.displayName)}</span><span class="body-name"><span class="axis-glyph" aria-hidden="true">${TERRITORY_GLYPH[body.astransysTerritory.symbol] ?? ''}</span> ${escapeHtml(TERRITORY_ES[body.astransysTerritory.symbol] ?? body.astransysTerritory.name ?? '—')} · ${degreeText(body.ecliptic.longitudeDeg)}</span><span class="motion">${body.motion.state === 'retrograde' ? '℞' : body.motion.state === 'stationary' ? '·' : '→'}</span></button>`).join('')}</div>`
    : result.bodies.map(bodyRow).join('');
  els.bodyList.querySelectorAll('[data-body]').forEach((button) => button.addEventListener('click', () => {
    state.selectedBody = button.dataset.body; renderBodies(); renderFocus();
  }));
}

function renderFocus() {
  const body = state.result?.bodies.find((item) => item.body === state.selectedBody);
  if (!body) { els.focus.hidden = true; return; }
  els.focus.hidden = false;
  const rate = Number.isFinite(body.motion.longitudeRateDegPerDay) ? `${body.motion.longitudeRateDegPerDay.toFixed(5)}°/día` : '—';
  const distance = Number.isFinite(body.distanceAU) ? `${body.distanceAU.toFixed(6)} AU` : '—';
  const next = body.crossing.nextAstransysTerritory;
  const houseSetsForBody = houseSets(state.houses);
  const houseText = houseSetsForBody.length
    ? houseSetsForBody.map((set) => {
      const assignment = set.assignments?.find((item) => item.body === body.body);
      return `${houseShortLabel(set.system)} ${set.status === 'valid' ? assignmentFocusText(assignment) : `— · ${houseStatusLabel(set.status)}`}`;
    }).join(' · ')
    : '—';
  els.focus.innerHTML = `<div class="section-kicker">detalle incremental</div><h3 id="focus-title"><span class="body-symbol" aria-hidden="true">${escapeHtml(body.symbol)}</span> ${escapeHtml(body.displayName)}</h3><div class="focus-grid"><div><div class="detail-label">TERRITORIO ACTUAL</div><div class="detail-value"><span class="axis-glyph" aria-hidden="true">${TERRITORY_GLYPH[body.astransysTerritory.symbol] ?? ''}</span> ${escapeHtml(TERRITORY_ES[body.astransysTerritory.symbol] ?? body.astransysTerritory.name ?? '—')}</div></div><div><div class="detail-label">MOVIMIENTO</div><div class="detail-value">${escapeHtml(body.motion.state)} · ${rate}</div></div><div><div class="detail-label">PRÓXIMO TERRITORIO</div><div class="detail-value">${next ? `<span class="axis-glyph" aria-hidden="true">${TERRITORY_GLYPH[next.symbol] ?? ''}</span> ${escapeHtml(TERRITORY_ES[next.symbol] ?? next.name ?? '—')} · ${remainingText(body)}` : '—'}</div></div><div><div class="detail-label">CASA LOCAL</div><div class="detail-value">${escapeHtml(houseText)}</div></div><div><div class="detail-label">DISTANCIA</div><div class="detail-value">${distance}</div></div></div>`;
}

function renderScience() {
  if (state.mode !== 'science') { els.science.hidden = true; return; }
  els.science.hidden = false;
  const body = state.result.bodies.find((item) => item.body === state.selectedBody);
  const territoryInfo = { code: body.astransysTerritory.symbol, glyph: TERRITORY_GLYPH[body.astransysTerritory.symbol] ?? null, name: TERRITORY_ES[body.astransysTerritory.symbol] ?? body.astransysTerritory.name };
  els.science.innerHTML = `<div class="section-kicker">modo ciencia · fuente completa</div><h3 id="science-title"><span class="body-symbol" aria-hidden="true">${escapeHtml(body.symbol)}</span> ${escapeHtml(body.displayName)} · datos técnicos</h3><p class="science-note">UTC: ${escapeHtml(state.result.input.utc)} · modelo: ${escapeHtml(state.result.provenance.ephemerisModel)} · constelación real IAU disponible solo en este modo.</p><p class="science-note">Territorio Astransys: ${escapeHtml(territoryInfo.code)} · glifo ${escapeHtml(territoryInfo.glyph ?? '—')} · ${escapeHtml(territoryInfo.name ?? '—')}</p><pre>${escapeHtml(JSON.stringify({ actualSky: body.actualSky, constellation: body.constellation, vector: body.vector, motion: body.motion, corrections: body.corrections, provenance: state.result.provenance, localFrame: state.result.localFrame ? { status: state.result.localFrame.status, angles: state.result.localFrame.angles } : null, houses: state.result.houses ?? null }, null, 2))}</pre>`;
}

function renderResult() {
  const result = state.result;
  const humanDate = new Date(result.input.utc).toLocaleDateString('es-CL', { dateStyle: 'full', timeZone: 'UTC' });
  els.resultTitle.textContent = `Arquitectura celeste · ${humanDate}`;
  els.resultIso.hidden = false; els.resultIso.textContent = result.input.utc;
  renderAssumptions(); renderAxes(); renderHouses(); renderBodies(); renderFocus(); renderScience(); renderHouseStatus();
}

function clearRenderedResult() {
  state.result = null; state.axes = null;
  els.resultTitle.textContent = 'El lienzo espera una fecha';
  els.resultIso.hidden = true; els.resultIso.textContent = '';
  els.assumptions.hidden = true; els.assumptions.textContent = '';
  els.axes.hidden = true; els.axes.innerHTML = '';
  state.houses = null; state.houseStatus = els.houses.value === 'none' ? 'none' : 'stale'; state.houseError = null;
  els.housePanel.hidden = true; els.housePanel.innerHTML = '';
  els.bodyList.innerHTML = '<p class="empty">El resultado aparecerá aquí. La primera vista conserva solo el territorio Astransys.</p>';
  els.focus.hidden = true; els.focus.innerHTML = '';
  els.science.hidden = true; els.science.innerHTML = '';
  renderHouseStatus();
}

function updateCalculateControl() {
  const label = houseActionLabel(els.houses.value, state.houseStatus);
  els.button.innerHTML = `${escapeHtml(label)} <span aria-hidden="true">→</span>`;
  els.button.disabled = state.status === 'pending' || state.cityPending;
}

function updateInputStates() {
  const hasDate = Boolean(els.date.value);
  const exact = Boolean(els.time.value);
  const hasPlace = Boolean(state.city);
  els.stateDate.textContent = hasDate ? 'lista' : 'pendiente';
  els.stateTime.textContent = exact ? 'exacta · UTC' : 'referencia 12:00 UTC';
  els.statePlace.textContent = state.cityPending ? 'cargando…' : hasPlace ? state.city.name : 'geocéntrico';
  els.stateFrame.textContent = state.status === 'pending' ? 'calculando…' : exact && hasPlace ? 'disponible' : 'requiere hora y lugar';
  updateCalculateControl(); renderHouseStatus();
}

function invalidateForInput() {
  if (state.status !== 'idle' || state.result !== null) clearRenderedResult();
  state.requestId += 1; state.status = 'idle';
  // The previous Worker response remains harmlessly in flight, but it no
  // longer owns the form. A new input must be calculable immediately.
  els.button.disabled = false;
  els.workerStatus.textContent = 'motor listo';
  updateInputStates();
}

function applyDatePreset(values) {
  els.date.value = values.date; els.time.value = values.time;
  clearError(); invalidateForInput();
}

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('[data-mode]').forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (state.result) renderResult();
}

function showError(message) { els.error.hidden = false; els.error.textContent = humanError(message); els.workerStatus.textContent = 'error · revisar entrada'; }
function clearError() { els.error.hidden = true; els.error.textContent = ''; }

function failRequest(message, requestId = state.requestId) {
  const next = acceptUiError(state, requestId, humanError(message));
  if (next === state) return;
  Object.assign(state, next); clearRenderedResult();
  if (els.houses.value !== 'none') { state.houseStatus = 'error'; state.houseError = next.error; }
  showError(next.error); updateInputStates(); renderHouseStatus(); els.button.disabled = false;
}

function calculate() {
  clearError(); clearRenderedResult();
  if (state.cityPending) { failRequest('Espera a que termine la carga de la ciudad.'); return; }
  let payload;
  try { payload = requestPayload(); } catch (error) { failRequest(error.message); return; }
  const requestId = ++state.requestId;
  Object.assign(state, beginUiRequest(state, requestId));
  state.houseStatus = els.houses.value === 'none' ? 'none' : 'pending';
  renderHouseStatus(); updateCalculateControl(); els.workerStatus.textContent = 'calculando en Worker…';
  try { worker.postMessage({ requestId, payload }); }
  catch (error) { failRequest(error.message, requestId); }
}

worker.addEventListener('message', (event) => {
  if (event.data.requestId !== state.requestId) return;
  els.button.disabled = false;
  if (event.data.type === 'error') { failRequest(event.data.message, event.data.requestId); return; }
  const next = acceptUiSuccess(state, event.data.requestId, event.data.result, event.data.axes);
  if (next === state) return;
  Object.assign(state, next);
  state.houses = event.data.result.houses ?? null;
  state.houseStatus = els.houses.value === 'none' ? 'none' : houseResultStatus(state.houses, els.houses.value);
  const invalidSets = houseSets(state.houses).filter((set) => set.status !== 'valid');
  state.houseError = invalidSets.length ? invalidSets.map((set) => `${houseLabel(set.system)} · ${houseStatusLabel(set.status)}`).join(' · ') : null;
  els.workerStatus.textContent = 'resultado listo · offline'; renderResult(); updateInputStates();
});
worker.addEventListener('error', (event) => failRequest(event.error ?? event.message ?? 'El motor no pudo completar el cálculo.'));
worker.addEventListener('messageerror', () => failRequest('El resultado del motor no pudo comunicarse con la interfaz.'));

els.form.addEventListener('submit', (event) => { event.preventDefault(); calculate(); });
document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
els.today.addEventListener('click', () => applyDatePreset(todayFormValues()));
els.now.addEventListener('click', () => applyDatePreset(nowFormValues()));
els.date.addEventListener('input', invalidateForInput);
els.time.addEventListener('input', invalidateForInput);
els.houses.addEventListener('change', () => {
  state.houses = null; state.houseError = null;
  state.houseStatus = els.houses.value === 'none' ? 'none' : 'stale';
  if (state.result) {
    state.result = { ...state.result, houses: null };
    renderResult();
  } else {
    renderHouses(); renderFocus(); renderHouseStatus(); updateCalculateControl();
  }
});

async function fillContinents() {
  const token = ++state.geoToken; state.cityPending = true; updateInputStates();
  try {
    const continents = await listContinents();
    if (!isCurrentRequest(token, state.geoToken)) return;
    els.continent.innerHTML = '<option value="">Elegir continente</option>' + continents.map((item) => `<option value="${item.code}">${escapeHtml(item.name)}</option>`).join('');
  } catch (error) { if (isCurrentRequest(token, state.geoToken)) els.placeNote.textContent = humanError(error); }
  finally { if (isCurrentRequest(token, state.geoToken)) { state.cityPending = false; updateInputStates(); } }
}
$('#place-disclosure').addEventListener('toggle', (event) => { if (event.target.open && !els.continent.dataset.loaded) { els.continent.dataset.loaded = 'true'; fillContinents(); } });
els.continent.addEventListener('change', async () => {
  const token = ++state.geoToken;
  state.city = null; state.cityOptions = []; invalidateForInput(); els.city.disabled = true; els.city.innerHTML = '<option value="">Elegir ciudad</option>'; els.country.disabled = !els.continent.value; updateInputStates();
  if (!els.continent.value) { state.cityPending = false; updateInputStates(); return; }
  state.cityPending = true; updateInputStates();
  try {
    const countries = await listCountries(els.continent.value);
    if (!isCurrentRequest(token, state.geoToken)) return;
    els.country.innerHTML = '<option value="">Elegir país</option>' + countries.map((item) => `<option value="${item.code}">${escapeHtml(item.name)} (${item.cityCount})</option>`).join('');
  } catch (error) { if (isCurrentRequest(token, state.geoToken)) els.placeNote.textContent = humanError(error); }
  finally { if (isCurrentRequest(token, state.geoToken)) { state.cityPending = false; updateInputStates(); } }
});
els.country.addEventListener('change', async () => {
  const token = ++state.geoToken;
  state.city = null; state.cityOptions = []; invalidateForInput(); els.city.disabled = !els.country.value; els.city.innerHTML = '<option value="">Cargando ciudades…</option>'; updateInputStates();
  if (!els.country.value) { state.cityPending = false; updateInputStates(); return; }
  state.cityPending = true; updateInputStates();
  try {
    const cities = await listCities(els.country.value);
    if (!isCurrentRequest(token, state.geoToken)) return;
    state.cityOptions = cities;
    els.city.innerHTML = '<option value="">Elegir ciudad</option>' + cities.map((item) => `<option value="${item.geonameId}">${escapeHtml(item.name)} · ${escapeHtml(item.admin1 ?? '')}</option>`).join('');
    els.placeNote.textContent = `${cities.length.toLocaleString('es-CL')} ciudades cargadas offline. La selección es un punto GeoNames aproximado.`;
  } catch (error) { if (isCurrentRequest(token, state.geoToken)) { els.city.innerHTML = '<option value="">No disponible</option>'; els.placeNote.textContent = humanError(error); } }
  finally { if (isCurrentRequest(token, state.geoToken)) { state.cityPending = false; updateInputStates(); } }
});
els.city.addEventListener('change', async () => {
  if (!els.city.value) { state.city = null; invalidateForInput(); return; }
  state.city = state.cityOptions.find((city) => String(city.geonameId) === els.city.value) ?? null; invalidateForInput();
});

const now = new Date();
els.date.value = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
els.placeNote.textContent = `${browserTimeMetadata.reason} El catálogo geográfico se carga bajo demanda.`;
updateInputStates();
renderHouseStatus();
