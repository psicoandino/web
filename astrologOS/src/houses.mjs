/*
 * Pure house geometry. Astronomy (time, observer, angles) is intentionally
 * supplied by the caller; this module only constructs the two agreed systems
 * and assigns already-calculated true ecliptic longitudes.
 */

export const HOUSE_SYSTEMS = Object.freeze(['equal', 'porphyry']);
export const DEFAULT_TOLERANCE_ARCSEC = 1;
const LOCAL_FRAME_STATUSES = Object.freeze(['ok', 'near-pole', 'pole-degenerate']);

function mod(value, cycle = 360) {
  const result = value % cycle;
  return result < 0 ? result + cycle : result;
}

function forward(from, to) { return mod(to - from); }
function distance(a, b) {
  const d = mod(a - b + 180) - 180;
  return Math.abs(d);
}
function finite(value, name) {
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite`);
  return value;
}

export function makeCusps(system, angles) {
  if (!HOUSE_SYSTEMS.includes(system)) throw new Error(`Unsupported house system: ${system}`);
  if (!angles || typeof angles !== 'object') throw new Error('Angles object is required');
  for (const key of ['ascendant', 'descendant', 'midheaven', 'imumCoeli']) {
    if (!angles[key] || typeof angles[key] !== 'object') throw new Error(`Missing angle: ${key}`);
  }
  const asc = mod(finite(angles.ascendant.eclipticLongitudeDeg, 'ASC'));
  const mc = mod(finite(angles.midheaven.eclipticLongitudeDeg, 'MC'));
  const dsc = mod(finite(angles.descendant.eclipticLongitudeDeg, 'DSC'));
  const ic = mod(finite(angles.imumCoeli.eclipticLongitudeDeg, 'IC'));
  if (distance(mod(asc + 180), dsc) > 1e-8 || distance(mod(mc + 180), ic) > 1e-8) {
    throw new Error('Angles violate DSC=ASC+180 or IC=MC+180');
  }
  const c = Array(13).fill(null);
  if (system === 'equal') {
    for (let i = 1; i <= 12; ++i) c[i] = mod(asc + 30 * (i - 1));
    return c;
  }
  c[1] = asc; c[4] = ic; c[7] = dsc; c[10] = mc;
  const mcAsc = forward(mc, asc);
  const ascIc = forward(asc, ic);
  c[11] = mod(mc + mcAsc / 3);
  c[12] = mod(mc + 2 * mcAsc / 3);
  c[2] = mod(asc + ascIc / 3);
  c[3] = mod(asc + 2 * ascIc / 3);
  c[5] = mod(c[11] + 180);
  c[6] = mod(c[12] + 180);
  c[8] = mod(c[2] + 180);
  c[9] = mod(c[3] + 180);
  return c;
}

function validateOrder(cusps, toleranceDeg) {
  const unique = new Set(cusps.slice(1).map((value) => value.toFixed(10))).size === 12;
  if (!unique) return false;
  let total = 0;
  for (let i = 1; i <= 12; ++i) {
    const next = i === 12 ? 1 : i + 1;
    const span = forward(cusps[i], cusps[next]);
    if (!(span > toleranceDeg && span < 360 - toleranceDeg)) return false;
    total += span;
  }
  return Math.abs(total - 360) <= Math.max(1e-8, toleranceDeg * 1e-3);
}

export function assignLongitude(longitudeDeg, cusps, toleranceArcsec = DEFAULT_TOLERANCE_ARCSEC) {
  const longitude = mod(finite(longitudeDeg, 'ecliptic longitude'));
  const toleranceDeg = finite(toleranceArcsec, 'toleranceArcsec') / 3600;
  if (toleranceDeg < 0) throw new Error('toleranceArcsec must be non-negative');
  for (let i = 1; i <= 12; ++i) {
    if (distance(longitude, cusps[i]) <= toleranceDeg) {
      return {
        status: 'on-cusp', house: null, cusp: i,
        neighboringHouses: [i === 1 ? 12 : i - 1, i],
        longitudeDeg: longitude, toleranceArcsec
      };
    }
  }
  for (let i = 1; i <= 12; ++i) {
    const next = i === 12 ? 1 : i + 1;
    if (forward(cusps[i], longitude) < forward(cusps[i], cusps[next])) {
      return {
        status: 'valid', house: i, cusp: null, neighboringHouses: null,
        longitudeDeg: longitude, toleranceArcsec
      };
    }
  }
  return {
    status: 'model-mismatch', house: null, cusp: null,
    neighboringHouses: null, longitudeDeg: longitude, toleranceArcsec
  };
}

export function calculateHouseSet({ system, utc, latitudeDeg, longitudeDeg, heightMeters = null, localFrame, bodies = [], toleranceArcsec = DEFAULT_TOLERANCE_ARCSEC }) {
  const warnings = [];
  const outputSystem = HOUSE_SYSTEMS.includes(system) ? system : null;
  const invalid = (message, extra = {}) => ({
    status: 'invalid-input', system: outputSystem, definition: null, source: null,
    input: {
      utc: typeof utc === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(utc) ? utc : null,
      latitudeDeg: typeof latitudeDeg === 'number' && Number.isFinite(latitudeDeg) ? latitudeDeg : null,
      longitudeDeg: typeof longitudeDeg === 'number' && Number.isFinite(longitudeDeg) ? longitudeDeg : null,
      heightMeters: typeof heightMeters === 'number' && Number.isFinite(heightMeters) ? heightMeters : null,
      longitudeConvention: 'east-positive degrees'
    },
    localFrameStatus: LOCAL_FRAME_STATUSES.includes(localFrame?.status) ? localFrame.status : null,
    angles: null, cusps: {}, assignments: [],
    warnings: [message], polarStatus: 'undefined', toleranceArcsec: Number.isFinite(toleranceArcsec) ? toleranceArcsec : null,
    orderValidated: false,
    diagnostics: {
      rawInput: {
        system: system == null ? null : String(system),
        utc: utc == null ? null : String(utc),
        latitudeDeg: latitudeDeg == null ? null : String(latitudeDeg),
        longitudeDeg: longitudeDeg == null ? null : String(longitudeDeg),
        localFrameStatus: localFrame?.status == null ? null : String(localFrame.status)
      }
    },
    ...extra
  });
  if (!HOUSE_SYSTEMS.includes(system)) return invalid(`Unsupported system: ${system}`);
  if (typeof utc !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(utc) || !localFrame || !Array.isArray(bodies)) {
    return invalid('Exact canonical UTC, observer localFrame and body positions are required');
  }
  const canonicalDate = new Date(utc);
  if (!Number.isFinite(canonicalDate.getTime()) || canonicalDate.toISOString() !== utc) return invalid('UTC is not a valid canonical timestamp');
  if (!Number.isFinite(latitudeDeg) || !Number.isFinite(longitudeDeg) || latitudeDeg < -90 || latitudeDeg > 90 || longitudeDeg < -180 || longitudeDeg > 180) {
    return invalid('Latitude/longitude outside valid ranges');
  }
  if (!Number.isFinite(toleranceArcsec) || toleranceArcsec < 0) {
    return invalid('toleranceArcsec must be a non-negative finite number');
  }
  if (!LOCAL_FRAME_STATUSES.includes(localFrame.status)) return invalid('localFrame.status is not an allowed value');
  if (localFrame.input?.utc !== utc ||
      Math.abs(Number(localFrame.input?.latitudeDeg) - latitudeDeg) > 1e-12 ||
      Math.abs(Number(localFrame.input?.longitudeDeg) - longitudeDeg) > 1e-12) {
    return invalid('UTC and observer coordinates disagree with localFrame');
  }
  const malformed = bodies.find((body) => !body || typeof body !== 'object' || !body.ecliptic || !Number.isFinite(body.ecliptic.longitudeDeg));
  if (malformed) return invalid('Every body must contain a finite true ecliptic longitude');
  if (localFrame.angles?.ascendant === undefined || localFrame.angles?.midheaven === undefined ||
      localFrame.angles?.descendant === undefined || localFrame.angles?.imumCoeli === undefined) {
    return invalid('localFrame is missing ASC/DSC/MC/IC');
  }
  const angleToleranceDeg = Math.max(toleranceArcsec / 3600, 1e-9);
  const ascDeg = localFrame.angles.ascendant.eclipticLongitudeDeg;
  const dscDeg = localFrame.angles.descendant.eclipticLongitudeDeg;
  const mcDeg = localFrame.angles.midheaven.eclipticLongitudeDeg;
  const icDeg = localFrame.angles.imumCoeli.eclipticLongitudeDeg;
  if (![ascDeg, dscDeg, mcDeg, icDeg].every(Number.isFinite) ||
      distance(mod(ascDeg + 180), dscDeg) > angleToleranceDeg ||
      distance(mod(mcDeg + 180), icDeg) > angleToleranceDeg) {
    return invalid('localFrame angles violate DSC=ASC+180 or IC=MC+180');
  }
  if (localFrame.status === 'pole-degenerate') {
    return {
      status: 'polar-undefined', system,
      definition: null, source: null,
      input: { utc, latitudeDeg, longitudeDeg, heightMeters, longitudeConvention: 'east-positive degrees' },
      localFrameStatus: localFrame.status, angles: null, cusps: {}, assignments: [],
      warnings: ['ASC/MC east-west orientation is not unique at a geographic pole'],
      polarStatus: 'undefined', toleranceArcsec, orderValidated: false, diagnostics: null
    };
  }
  if (localFrame.status === 'near-pole') warnings.push('Near-polar local frame: east/west quadrant orientation is highly longitude-sensitive');
  if (Math.abs(latitudeDeg) >= 66) {
    warnings.push('High latitude: house-system output is geometric, not evidence of an astronomical physical division');
  }
  let cusps;
  try { cusps = makeCusps(system, localFrame.angles); }
  catch (error) {
    return {
      status: 'singular', system, definition: null, source: null,
      input: { utc, latitudeDeg, longitudeDeg, heightMeters, longitudeConvention: 'east-positive degrees' },
      localFrameStatus: localFrame.status, angles: null, cusps: {}, assignments: [],
      warnings: [error.message], polarStatus: 'singular', toleranceArcsec, orderValidated: false,
      diagnostics: { singularReason: error.message }
    };
  }
  const toleranceDeg = toleranceArcsec / 3600;
  const orderValidated = validateOrder(cusps, toleranceDeg);
  if (!orderValidated) warnings.push('Cusp sequence is not strictly circular at the requested tolerance');
  const status = !orderValidated ? 'model-mismatch' : Math.abs(latitudeDeg) >= 89 ? 'numerically-unstable' : 'valid';
  const assignments = bodies.map((body) => orderValidated
    ? { body: body.body, symbol: body.symbol, ...assignLongitude(body.ecliptic.longitudeDeg, cusps, toleranceArcsec) }
    : {
      body: body.body, symbol: body.symbol, status: 'model-mismatch', house: null,
      cusp: null, neighboringHouses: null, longitudeDeg: mod(body.ecliptic.longitudeDeg), toleranceArcsec
    });
  const angleValues = localFrame.angles;
  return {
    status, system,
    definition: system === 'equal'
      ? '12 independent 30-degree ecliptic intervals beginning at the eastern Ascendant'
      : '12 independent sectors from trisection of the ecliptic arcs MC–ASC and ASC–IC; opposite cusps at 180 degrees',
    source: system === 'equal'
      ? 'Equal-from-ASC formula; technical reference: LibEphemeris house-systems.md'
      : 'Porphyry formula; technical reference: LibEphemeris house-systems.md',
    input: { utc, latitudeDeg, longitudeDeg, heightMeters, longitudeConvention: 'east-positive degrees' },
    localFrameStatus: localFrame.status,
    angles: {
      lastHours: localFrame.time.lastHours,
      armcDeg: localFrame.time.lastHours * 15,
      ascDeg: angleValues.ascendant.eclipticLongitudeDeg,
      mcDeg: angleValues.midheaven.eclipticLongitudeDeg,
      dscDeg: angleValues.descendant.eclipticLongitudeDeg,
      icDeg: angleValues.imumCoeli.eclipticLongitudeDeg
    },
    cusps: orderValidated ? Object.fromEntries(cusps.slice(1).map((value, index) => [String(index + 1), value])) : {},
    assignments, warnings,
    polarStatus: Math.abs(latitudeDeg) >= 66 ? 'high-latitude' : 'ordinary',
    toleranceArcsec,
    orderValidated,
    diagnostics: orderValidated ? null : {
      invalidCusps: {
        reason: 'cusp sequence is not unique and/or does not complete one circular turn',
        uniqueCount: new Set(cusps.slice(1).map((value) => value.toFixed(10))).size,
        expectedCount: 12,
        orderValidated: false
      }
    }
  };
}

export function compareHouseSets(options) {
  return HOUSE_SYSTEMS.map((system) => calculateHouseSet({ ...options, system }));
}
