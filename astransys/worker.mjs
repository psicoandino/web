import Astronomy from './vendor/astronomy-engine-browser.mjs';
import { parseUtc, makeResult } from './src/ephemeris.mjs';
import { calculateAstransysTerritory } from './src/astransys-territory.mjs';
import { calculateHouseSet, compareHouseSets } from './src/houses.mjs';
import { humanError } from './serializers.mjs';

const AXES = Object.freeze([
  ['ascendant', 'ASC'], ['midheaven', 'MC'], ['descendant', 'DSC'], ['imumCoeli', 'IC']
]);

function axisTerritories(result, date) {
  if (!result.localFrame) return null;
  const time = Astronomy.MakeTime(date);
  const rotation = Astronomy.Rotation_EQD_EQJ(time);
  return Object.fromEntries(AXES.map(([key, label]) => {
    const source = result.localFrame.angles[key].vector.equatorialOfDate;
    const eqj = Astronomy.RotateVector(rotation, new Astronomy.Vector(source.x, source.y, source.z, time));
    const territory = calculateAstransysTerritory(eqj, date);
    const degree = ((territory.eclipticLongitudeDeg % 30) + 30) % 30;
    return [label, {
      symbol: territory.symbol,
      name: territory.name,
      longitudeDeg: territory.eclipticLongitudeDeg,
      degree,
      degreeDefinition: 'grado interno del ciclo visual de 30°; no es distancia a un límite IAU'
    }];
  }));
}

function houseOptions(result, payload, date) {
  if (!payload.houses || payload.houses === 'none') return;
  const observer = payload.observer;
  if (!observer || !result.localFrame) return;
  const options = {
    utc: date.toISOString(),
    latitudeDeg: observer.latitudeDeg,
    longitudeDeg: observer.longitudeDeg,
    heightMeters: observer.heightMeters,
    localFrame: result.localFrame,
    bodies: result.bodies,
    toleranceArcsec: Number.isFinite(payload.toleranceArcsec) ? payload.toleranceArcsec : 1
  };
  result.houses = payload.houses === 'compare'
    ? Object.fromEntries(compareHouseSets(options).map((set) => [set.system, set]))
    : calculateHouseSet({ ...options, system: payload.houses });
}

export function calculateRequest(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Solicitud inválida');
  const date = parseUtc(payload.utc);
  const observer = payload.observer ?? null;
  if (payload.houses && payload.houses !== 'none' && (payload.timeStatus !== 'exact' || !observer)) {
    throw new Error('Las casas requieren hora exacta UTC y una ciudad seleccionada.');
  }
  const result = makeResult(date, {
    includeCrossings: payload.includeCrossings !== false,
    observer,
    inputCompleteness: payload.inputCompleteness ?? (observer ? 'date-time-location' : 'date-time'),
    timeStatus: payload.timeStatus ?? 'exact',
    locationStatus: payload.locationStatus ?? (observer ? 'provided' : 'missing'),
    originalInput: payload.originalInput ?? null,
    locationMetadata: payload.locationMetadata ?? null
  });
  houseOptions(result, payload, date);
  return { result, axes: axisTerritories(result, date) };
}

if (typeof globalThis.addEventListener === 'function') {
  globalThis.addEventListener('message', (event) => {
    const requestId = event.data?.requestId ?? null;
    try {
      const response = calculateRequest(event.data?.payload);
      globalThis.postMessage({ requestId, type: 'result', ...response });
    } catch (error) {
      globalThis.postMessage({ requestId, type: 'error', message: humanError(error) });
    }
  });
}
