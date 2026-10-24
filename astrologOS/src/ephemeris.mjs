import Astronomy from '../vendor/astronomy-engine-browser.mjs';
import { annotateConstellation } from './constellations.mjs';
import { makeLocalFrame } from './local-frame.mjs';
import { calculateAstransysTerritory, projectedVectorFromGeocentricVector, ASTRANSYS_TERRITORY_SYMBOLS } from './astransys-territory.mjs';

export const BODY_NAMES = Object.freeze([
  'Pluto', 'Neptune', 'Uranus', 'Saturn', 'Jupiter', 'Mars',
  'Venus', 'Mercury', 'Sun', 'Moon'
]);

export const BODY_SYMBOLS = Object.freeze({
  Pluto: '♇', Neptune: '♆', Uranus: '♅', Saturn: '♄', Jupiter: '♃',
  Mars: '♂', Venus: '♀', Mercury: '☿', Sun: '☉', Moon: '☽'
});

export const BODY_SPANISH_NAMES = Object.freeze({
  Pluto: 'Plutón', Neptune: 'Neptuno', Uranus: 'Urano', Saturn: 'Saturno',
  Jupiter: 'Júpiter', Mars: 'Marte', Venus: 'Venus', Mercury: 'Mercurio',
  Sun: 'Sol', Moon: 'Luna'
});

const BODY_ENUM = Object.freeze(Object.fromEntries(
  BODY_NAMES.map((name) => [name, Astronomy.Body[name]])
));

export const STEP_SECONDS = 3600;
export const CROSSING_LIMIT_YEAR = 2100;

export const INPUT_COMPLETENESS = Object.freeze([
  'date-only', 'date-time', 'date-location', 'date-time-location'
]);
export const TIME_STATUS = Object.freeze(['exact', 'date-only-reference']);
export const LOCATION_STATUS = Object.freeze(['provided', 'missing']);

const CROSSING_STEP_DAYS = Object.freeze({
  Moon: 0.25, Mercury: 0.5, Venus: 1, Sun: 1, Mars: 2,
  Jupiter: 5, Saturn: 10, Uranus: 20, Neptune: 30, Pluto: 60
});

// A fixed per-body step is only the initial proposal. Long arcs are reduced
// until each classifier segment is at most this angular size. Interior
// quarter samples are recursively inspected as well, so A→B→A re-entry is
// detected when it is resolved by the sampling scale. This is not a formal
// proof for arbitrarily narrow regions; the limitation is emitted in JSON.
const MAX_CROSSING_SEGMENT_DEG = 0.25;
// One interior subdivision (quarter/mid/three-quarter probes) keeps the
// search fast while catching the common A→B→A case. The emitted limitation
// makes the finite sampling guarantee explicit.
const MAX_INTERIOR_RECURSION = 1;

function finite(value, label) {
  if (!Number.isFinite(value)) throw new Error(`Non-finite ${label}`);
  return value;
}

export function parseUtc(input) {
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(input)) {
    throw new Error('UTC must be ISO-8601 in the form YYYY-MM-DDTHH:mm:ss[.sss]Z');
  }
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/);
  const [, y, mo, d, h, mi, s, fraction = ''] = m;
  const date = new Date(input);
  const canonical = `${y}-${mo}-${d}T${h}:${mi}:${s}.${fraction.padEnd(3, '0')}Z`;
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== canonical) {
    throw new Error('Invalid UTC calendar date');
  }
  const year = Number(y);
  if (year < 1800 || year > CROSSING_LIMIT_YEAR) {
    throw new Error('UTC year outside supported validity interval 1800–2100');
  }
  return date;
}

export function addSeconds(date, seconds) {
  return new Date(date.getTime() + seconds * 1000);
}

function normalizeInputMetadata(date, {
  observer = null,
  inputCompleteness = null,
  timeStatus = null,
  locationStatus = null,
  originalInput = null,
  locationMetadata = null,
  civilConversion = null
} = {}) {
  const hasLocation = observer !== null;
  const resolvedTimeStatus = timeStatus ?? 'exact';
  const resolvedLocationStatus = locationStatus ?? (hasLocation ? 'provided' : 'missing');
  const resolvedCompleteness = inputCompleteness ?? (
    resolvedTimeStatus === 'date-only-reference'
      ? (hasLocation ? 'date-location' : 'date-only')
      : (hasLocation ? 'date-time-location' : 'date-time')
  );
  if (!TIME_STATUS.includes(resolvedTimeStatus)) throw new Error(`Unsupported timeStatus: ${resolvedTimeStatus}`);
  if (!LOCATION_STATUS.includes(resolvedLocationStatus)) throw new Error(`Unsupported locationStatus: ${resolvedLocationStatus}`);
  if (!INPUT_COMPLETENESS.includes(resolvedCompleteness)) throw new Error(`Unsupported inputCompleteness: ${resolvedCompleteness}`);
  const expectedTimeStatus = resolvedCompleteness === 'date-only' || resolvedCompleteness === 'date-location'
    ? 'date-only-reference' : 'exact';
  const expectedLocationStatus = resolvedCompleteness === 'date-only' || resolvedCompleteness === 'date-time'
    ? 'missing' : 'provided';
  if (resolvedTimeStatus !== expectedTimeStatus) throw new Error('inputCompleteness and timeStatus disagree');
  if (resolvedLocationStatus !== expectedLocationStatus) throw new Error('inputCompleteness and locationStatus disagree');
  const referenceUtc = date.toISOString();
  const windowStart = resolvedTimeStatus === 'date-only-reference'
    ? new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)) : null;
  const windowEnd = windowStart === null ? null : new Date(windowStart.getTime() + 86400000);
  const assumptions = resolvedTimeStatus === 'date-only-reference'
    ? [
      '12:00 UTC is used as a deterministic reference instant because no time was supplied.',
      'The date-only input window is the UTC civil day containing the reference instant.',
      'No local horizon, ASC, DSC, MC or IC is calculated from a reference instant.'
    ] : [];
  const result = {
    inputCompleteness: resolvedCompleteness,
    timeStatus: resolvedTimeStatus,
    locationStatus: resolvedLocationStatus,
    originalInput,
    referenceUtc,
    windowStartUtc: windowStart?.toISOString() ?? null,
    windowEndUtc: windowEnd?.toISOString() ?? null,
    assumptions
  };
  if (locationMetadata !== null) result.locationMetadata = locationMetadata;
  if (civilConversion !== null) result.civilConversion = civilConversion;
  return result;
}

function validateObserverMetadata(observer) {
  if (observer === null) return;
  if (!observer || typeof observer !== 'object') throw new Error('Observer must be an object or null');
  if (observer.latitudeDeg === null || observer.latitudeDeg === undefined || observer.longitudeDeg === null || observer.longitudeDeg === undefined) throw new Error('Observer latitude and longitude are required');
  if (!Number.isFinite(observer.latitudeDeg) || !Number.isFinite(observer.longitudeDeg)) throw new Error('Observer latitude and longitude must be finite numbers');
  const missingHeight = observer.heightMeters === null || observer.heightMeters === undefined;
  if (missingHeight && observer.heightSource !== 'assumed-zero-reference' && observer.heightSource !== 'assumed-zero-city-reference') throw new Error('Observer heightMeters is required; use heightSource=assumed-zero-reference to make a documented 0 m assumption');
  if (!missingHeight && !Number.isFinite(observer.heightMeters)) throw new Error('Observer heightMeters must be a finite number');
}

function angle360(deg) {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

function vectorUnit(vector) {
  const norm = Math.hypot(vector.x, vector.y, vector.z);
  return { x: vector.x / norm, y: vector.y / norm, z: vector.z / norm };
}

function angularSeparationDeg(a, b) {
  const ua = vectorUnit(a);
  const ub = vectorUnit(b);
  const dot = Math.max(-1, Math.min(1, ua.x * ub.x + ua.y * ub.y + ua.z * ub.z));
  return Math.acos(dot) / Astronomy.DEG2RAD;
}

function classifyVector(vector) {
  const equ = Astronomy.EquatorFromVector(vector);
  return Astronomy.Constellation(equ.ra, equ.dec);
}

function projectedPositionVector(name, date) {
  return projectedVectorFromGeocentricVector(positionVector(name, date), date);
}

function classifyProjectedVector(vector) {
  const equ = Astronomy.EquatorFromVector(vector);
  const info = Astronomy.Constellation(equ.ra, equ.dec);
  if (!ASTRANSYS_TERRITORY_SYMBOLS.includes(info.symbol)) {
    throw new Error(`Projected point escaped the 13 Astransys territories: ${info.symbol}`);
  }
  return info;
}

function positionVector(name, date) {
  const moon = name === 'Moon';
  return Astronomy.GeoVector(BODY_ENUM[name], date, !moon);
}

function crossingDateLimit(date) {
  // Include the complete validity year. The search is half-open at the final
  // millisecond only because JavaScript Date has millisecond resolution.
  return new Date(Date.UTC(CROSSING_LIMIT_YEAR, 11, 31, 23, 59, 59, 999));
}

function refineCrossing(name, lo, hi, startSymbol, positionAt, classifyAt) {
  while ((hi.getTime() - lo.getTime()) > 1000) {
    const mid = new Date((lo.getTime() + hi.getTime()) / 2);
    if (classifyAt(positionAt(name, mid)).symbol === startSymbol) lo = mid;
    else hi = mid;
  }
  const before = new Date(hi.getTime() - 1000);
  const after = new Date(hi.getTime() + 1000);
  const beforeInfo = classifyAt(positionAt(name, before));
  const afterInfo = classifyAt(positionAt(name, after));
  if (beforeInfo.symbol !== startSymbol || afterInfo.symbol === startSymbol) return null;
  return { crossing: hi, afterInfo };
}

// Finds the first classifier change in [start,end], including interior
// samples. It returns the path length to the first change along the sampled
// subsegments, or null when every inspected sample has the same symbol.
function firstInteriorChange(name, startDate, startVector, startSymbol, endDate, endVector, endSymbol, positionAt, classifyAt, depth = 0) {
  if (endSymbol !== startSymbol) {
    const refined = refineCrossing(name, startDate, endDate, startSymbol, positionAt, classifyAt);
    if (refined) {
      return {
        crossing: refined.crossing,
        afterInfo: refined.afterInfo,
        pathDeg: angularSeparationDeg(startVector, positionAt(name, refined.crossing))
      };
    }
    return null;
  }
  if (depth >= MAX_INTERIOR_RECURSION || (endDate.getTime() - startDate.getTime()) <= 1000) return null;

  const span = endDate.getTime() - startDate.getTime();
  const dates = [
    new Date(startDate.getTime() + span / 4),
    new Date(startDate.getTime() + span / 2),
    new Date(startDate.getTime() + (3 * span) / 4),
    endDate
  ];
  const vectors = dates.map((date) => positionAt(name, date));
  const infos = vectors.map(classifyAt);
  let priorDate = startDate;
  let priorVector = startVector;
  let priorSymbol = startSymbol;
  let pathDeg = 0;
  for (let i = 0; i < dates.length; ++i) {
    const hit = firstInteriorChange(name, priorDate, priorVector, priorSymbol, dates[i], vectors[i], infos[i].symbol, positionAt, classifyAt, depth + 1);
    if (hit) return { ...hit, pathDeg: pathDeg + hit.pathDeg };
    pathDeg += angularSeparationDeg(priorVector, vectors[i]);
    priorDate = dates[i];
    priorVector = vectors[i];
    priorSymbol = infos[i].symbol;
  }
  return null;
}

function findNextCrossing(name, date, currentSymbol, { projected = false } = {}) {
  const positionAt = projected ? projectedPositionVector : positionVector;
  const classifyAt = projected ? classifyProjectedVector : classifyVector;
  const searchKind = projected ? 'projected 13-territory' : 'geocentric 2D IAU';
  const limit = crossingDateLimit(date);
  if (date.getTime() >= limit.getTime()) {
    return {
      status: 'not-found-within-validity', nextConstellation: null,
      travelAlongPathDeg: null, elapsedDays: null, elapsedJulianYears: null,
      crossingUtc: null,
      search: {
        method: `adaptive sampling + classifier bisection on ${searchKind} regions`,
        limitUtc: limit.toISOString()
      }
    };
  }
  const stepDays = CROSSING_STEP_DAYS[name];
  let previousDate = date;
  let previousVector = positionAt(name, previousDate);
  let previousSymbol = currentSymbol;
  let pathDeg = 0;
  let maxSegmentDeg = 0;

  while (previousDate.getTime() < limit.getTime()) {
    let candidateMs = Math.min(
      previousDate.getTime() + stepDays * 86400000,
      limit.getTime()
    );
    let candidateDate = new Date(candidateMs);
    let candidateVector = positionAt(name, candidateDate);
    let segmentDeg = angularSeparationDeg(previousVector, candidateVector);
    while (segmentDeg > MAX_CROSSING_SEGMENT_DEG && candidateMs > previousDate.getTime() + 1000) {
      const reducedDays = Math.max(
        (candidateMs - previousDate.getTime()) / 86400000 * MAX_CROSSING_SEGMENT_DEG / segmentDeg * 0.9,
        1 / 86400
      );
      candidateMs = Math.min(previousDate.getTime() + reducedDays * 86400000, limit.getTime());
      candidateDate = new Date(candidateMs);
      candidateVector = positionAt(name, candidateDate);
      segmentDeg = angularSeparationDeg(previousVector, candidateVector);
    }
    const candidateInfo = classifyAt(candidateVector);
    maxSegmentDeg = Math.max(maxSegmentDeg, segmentDeg);
    const hit = firstInteriorChange(name, previousDate, previousVector, previousSymbol, candidateDate, candidateVector, candidateInfo.symbol, positionAt, classifyAt);
    if (hit) {
      const totalDeg = pathDeg + hit.pathDeg;
      const elapsedDays = (hit.crossing.getTime() - date.getTime()) / 86400000;
      return {
        status: 'found',
        nextConstellation: { symbol: hit.afterInfo.symbol, name: hit.afterInfo.name },
        travelAlongPathDeg: totalDeg,
        elapsedDays,
        elapsedJulianYears: elapsedDays / 365.25,
        crossingUtc: hit.crossing.toISOString(),
        search: {
          method: `adaptive sampling + classifier bisection on ${searchKind} regions`,
          limitUtc: limit.toISOString(),
          samplingStepDays: stepDays,
          pathMethod: projected ? 'sum of spherical separations of successive projected ecliptic vectors' : 'sum of spherical separations of successive geocentric vectors',
          samplingMaxAngularStepDeg: maxSegmentDeg,
          methodConfidence: 'high within the declared sampling scale',
          limitation: 'No formal guarantee for an IAU region narrower than the sampling scale or an unmodelled discontinuity.',
          refinementToleranceSeconds: 1,
          confirmedBeforeAfter: true
        }
      };
    }
    pathDeg += segmentDeg;
    previousDate = candidateDate;
    previousVector = candidateVector;
    previousSymbol = candidateInfo.symbol;
  }
  return {
    status: 'not-found-within-validity', nextConstellation: null,
    travelAlongPathDeg: null, elapsedDays: null, elapsedJulianYears: null,
    crossingUtc: null,
    search: {
      method: `adaptive sampling + classifier bisection on ${searchKind} regions`,
      limitUtc: limit.toISOString(), samplingStepDays: stepDays,
      pathMethod: projected ? 'sum of spherical separations of successive projected ecliptic vectors' : 'sum of spherical separations of successive geocentric vectors',
      samplingMaxAngularStepDeg: maxSegmentDeg,
      methodConfidence: 'high within the declared sampling scale',
      limitation: 'No formal guarantee for an IAU region narrower than the sampling scale or an unmodelled discontinuity.',
      refinementToleranceSeconds: 1
    }
  };
}

export function calculateBody(name, date) {
  const body = BODY_ENUM[name];
  if (!body) throw new Error(`Unsupported body: ${name}`);
  const time = Astronomy.MakeTime(date);
  // GeoVector is an Earth-centred EQJ vector. For the Moon Astronomy Engine
  // routes to GeoMoon(), which ignores the aberration argument and returns a
  // model geocentric position without light-time/aberration correction.
  const moon = name === 'Moon';
  const vector = positionVector(name, date);
  const equ = Astronomy.EquatorFromVector(vector);
  const ecl = Astronomy.Ecliptic(vector);
  const constellation = Astronomy.Constellation(equ.ra, equ.dec);
  return {
    body: name,
    symbol: BODY_SYMBOLS[name],
    displayName: BODY_SPANISH_NAMES[name],
    vector: {
      xAU: finite(vector.x, `${name}.vector.x`),
      yAU: finite(vector.y, `${name}.vector.y`),
      zAU: finite(vector.z, `${name}.vector.z`),
      frame: 'EQJ',
      center: 'Earth'
    },
    corrections: {
      lightTimeApplied: !moon,
      aberrationApplied: !moon,
      gravitationalDeflectionApplied: false,
      note: moon
        ? 'GeoMoon lunar model; the GeoVector aberration flag is not applied.'
        : 'GeoVector backdates for light travel and applies stellar aberration.'
    },
    distanceAU: finite(equ.dist, `${name}.distance`),
    equatorial: {
      raHours: finite(equ.ra, `${name}.ra`),
      decDeg: finite(equ.dec, `${name}.dec`),
      frame: 'EQJ',
      epoch: 'J2000'
    },
    ecliptic: {
      longitudeDeg: angle360(finite(ecl.elon, `${name}.ecliptic longitude`)),
      latitudeDeg: finite(ecl.elat, `${name}.ecliptic latitude`),
      // Astronomy Engine's Ecliptic() returns true ecliptic-of-date
      // coordinates (precession + nutation + true obliquity), not mean
      // ecliptic coordinates.
      frame: 'of-date true ecliptic'
    },
    constellation: {
      symbol: constellation.symbol,
      name: constellation.name,
      ra1875Hours: finite(constellation.ra1875, `${name}.ra1875`),
      dec1875Deg: finite(constellation.dec1875, `${name}.dec1875`),
      ...annotateConstellation(constellation)
    },
    _time: time
  };
}

export function calculateMotion(name, date) {
  const before = calculateBody(name, addSeconds(date, -STEP_SECONDS));
  const after = calculateBody(name, addSeconds(date, STEP_SECONDS));
  const central = (after.ecliptic.longitudeDeg - before.ecliptic.longitudeDeg);
  let delta = ((central + 540) % 360) - 180;
  if (delta <= -180) delta += 360;
  const rate = delta / (2 * STEP_SECONDS / 86400);
  const threshold = 0.005;
  return {
    longitudeRateDegPerDay: finite(rate, `${name}.motion`),
    state: rate > threshold ? 'direct' : rate < -threshold ? 'retrograde' : 'stationary',
    stepSeconds: STEP_SECONDS,
    thresholdDegPerDay: threshold,
    method: 'central-difference on reported true-of-date ecliptic longitude'
  };
}

export function makeResult(date, {
  includeCrossings = true,
  observer = null,
  inputCompleteness = null,
  timeStatus = null,
  locationStatus = null,
  originalInput = null,
  locationMetadata = null,
  civilConversion = null
} = {}) {
  validateObserverMetadata(observer);
  const inputMetadata = normalizeInputMetadata(date, {
    observer, inputCompleteness, timeStatus, locationStatus, originalInput, locationMetadata, civilConversion
  });
  const astroTime = Astronomy.MakeTime(date);
  const bodies = BODY_NAMES.map((name) => {
    const result = calculateBody(name, date);
    const bodyVector = new Astronomy.Vector(
      result.vector.xAU,
      result.vector.yAU,
      result.vector.zAU,
      astroTime
    );
    const territory = calculateAstransysTerritory(bodyVector, date);
    result.actualSky = {
      center: 'Earth',
      frame: 'geocentric',
      constellation: result.constellation,
      ecliptic: result.ecliptic,
      equatorial: result.equatorial
    };
    result.astransysTerritory = territory;
    result.motion = calculateMotion(name, date);
    const actualCrossing = includeCrossings
      ? findNextCrossing(name, date, result.constellation.symbol)
      : {
        status: 'disabled', nextConstellation: null,
        travelAlongPathDeg: null, elapsedDays: null, elapsedJulianYears: null,
        crossingUtc: null,
        search: { method: 'disabled by --no-crossings' }
      };
    const projectedCrossing = includeCrossings
      ? findNextCrossing(name, date, territory.symbol, { projected: true })
      : {
        status: 'disabled', nextConstellation: null,
        travelAlongPathDeg: null, elapsedDays: null, elapsedJulianYears: null,
        crossingUtc: null,
        search: { method: 'disabled by --no-crossings' }
      };
    result.crossing = {
      ...actualCrossing,
      nextAstransysTerritory: projectedCrossing.nextConstellation,
      travelAlongProjectedPathDeg: projectedCrossing.travelAlongPathDeg,
      projectedElapsedDays: projectedCrossing.elapsedDays,
      projectedElapsedJulianYears: projectedCrossing.elapsedJulianYears,
      projectedCrossingUtc: projectedCrossing.crossingUtc,
      projectedSearch: projectedCrossing.search
    };
    delete result._time;
    return result;
  });
  const localFrameAvailable = observer !== null && inputMetadata.timeStatus === 'exact';
  let localFrameReason = null;
  if (!localFrameAvailable) {
    localFrameReason = inputMetadata.timeStatus !== 'exact'
      ? 'exact-time-required'
      : 'observer-required';
  }
  return {
    schemaVersion: '1.5.0',
    input: {
      utc: date.toISOString(),
      center: 'Earth',
      observer: 'geocenter',
      ...inputMetadata
    },
    bodies,
    localFrame: localFrameAvailable ? makeLocalFrame(date, observer) : null,
    localFrameReason,
    provenance: {
      engine: 'Astronomy Engine',
      engineVersion: '2.1.19',
      ephemerisModel: 'Astronomy Engine internal model; not DE440/DE441',
      coordinates: 'per-body geocentric EQJ vector; corrections are declared on each body; ecliptic derived by Astronomy Engine',
      constellationSource: 'IAU 88 regions / Roman-Delporte B1875 table as bundled by Astronomy Engine 2.1.19 (compact 2.5 arcmin boundary grid; nominal quantization <= 1.25 arcmin)',
      inputTimeScale: 'UTC',
      utcApproximatelyUt1: true,
      timeScaleNote: 'Astronomy Engine treats UTC as UT1 for its Earth rotation model; UT1-UTC is not supplied.',
      terrestrialTimeDaysSinceJ2000: astroTime.tt,
      universalTimeDaysSinceJ2000: astroTime.ut,
      deltaTSeconds: finite((astroTime.tt - astroTime.ut) * 86400, 'deltaTSeconds'),
      deltaTModel: 'Astronomy Engine Espenak-Meeus polynomial model',
      precisionNominalArcmin: 1,
      precisionStatement: 'Nominal angular target is approximately +/-1 arcmin in the recommended interval; this is not a DE440 guarantee.',
      recommendedInterval: {
        startYear: 1800,
        endYear: 2100,
        note: 'Conservative operating interval for this v1 model; outside it, use JPL DE440/DE441 validation.'
      },
      warnings: [
        'UTC is treated as approximately UT1; local Earth-rotation precision is not represented.',
        'The internal ephemeris is not JPL DE440/DE441.',
        'Moon coordinates use GeoMoon and are not light-time/aberration corrected.',
        'Constellation boundaries use a compact approximately 2.5 arcmin grid; near-boundary results require external validation.'
      ],
      networkRequired: false
    }
  };
}
