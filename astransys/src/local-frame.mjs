import Astronomy from '../vendor/astronomy-engine-browser.mjs';

const EPSILON = 1.0e-12;
const POLE_WARNING_THRESHOLD_DEG = 1;

function finite(value, label) {
  if (!Number.isFinite(value)) throw new Error(`Non-finite ${label}`);
  return value;
}

function normalizeDegrees(value) {
  const x = value % 360;
  let normalized = x < 0 ? x + 360 : x;
  // Floating-point addition can round 360 - epsilon back to exactly 360.
  // The public half-open convention is [0, 360), so fold that endpoint.
  if (normalized >= 360) normalized = 0;
  return Object.is(normalized, -0) ? 0 : normalized;
}

export function normalizeAzimuthDeg(value) {
  return normalizeDegrees(value);
}

function normalizeHours(value) {
  const x = value % 24;
  return x < 0 ? x + 24 : x;
}

function vector(x, y, z) {
  return { x: finite(x, 'vector.x'), y: finite(y, 'vector.y'), z: finite(z, 'vector.z') };
}

function add(a, b) {
  return vector(a.x + b.x, a.y + b.y, a.z + b.z);
}

function scale(a, factor) {
  return vector(a.x * factor, a.y * factor, a.z * factor);
}

function norm(a) {
  return Math.hypot(a.x, a.y, a.z);
}

function unit(a, label) {
  const length = norm(a);
  if (!(length > EPSILON)) throw new Error(`Degenerate ${label}`);
  return scale(a, 1 / length);
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function rotate(rotation, a, time) {
  const out = Astronomy.RotateVector(rotation, new Astronomy.Vector(a.x, a.y, a.z, time));
  return vector(out.x, out.y, out.z);
}

function spherical(a) {
  return Astronomy.SphereFromVector(new Astronomy.Vector(a.x, a.y, a.z, null));
}

function coordinatesFromEct(ect, ectToEqd, time) {
  const eqd = rotate(ectToEqd, ect, time);
  const sphere = spherical(eqd);
  const ecl = spherical(ect);
  return {
    eclipticLongitudeDeg: normalizeDegrees(ecl.lon),
    eclipticLatitudeDeg: ecl.lat,
    rightAscensionHours: normalizeHours(sphere.lon / 15),
    declinationDeg: sphere.lat,
    vector: {
      eclipticOfDate: ect,
      equatorialOfDate: eqd
    }
  };
}

function pointFromLambda(lambdaDeg) {
  const lambda = lambdaDeg * Astronomy.DEG2RAD;
  return vector(Math.cos(lambda), Math.sin(lambda), 0);
}

function intersectionLambda(rotation, axisIndex, time, label) {
  const x = rotate(rotation, vector(1, 0, 0), time);
  const y = rotate(rotation, vector(0, 1, 0), time);
  const components = (value) => [value.x, value.y, value.z];
  const a = components(x)[axisIndex];
  const b = components(y)[axisIndex];
  const radius = Math.hypot(a, b);
  if (!(radius > EPSILON)) throw new Error(`Singular ${label} intersection`);
  // a*cos(lambda) + b*sin(lambda) = 0.
  return normalizeDegrees(Math.atan2(-a, b) / Astronomy.DEG2RAD);
}

function makeAnglePoint(name, lambdaDeg, ectToEqd, ectToHor, time, angleStatus) {
  const ect = pointFromLambda(lambdaDeg);
  const hor = rotate(ectToHor, ect, time);
  const coordinates = coordinatesFromEct(ect, ectToEqd, time);
  return {
    name,
    angleStatus,
    ...coordinates,
    horizontal: {
      vector: hor,
      altitudeDeg: Math.atan2(hor.z, Math.hypot(hor.x, hor.y)) / Astronomy.DEG2RAD,
      azimuthDeg: normalizeAzimuthDeg(Math.atan2(-hor.y, hor.x) / Astronomy.DEG2RAD)
    }
  };
}

function selectIntersection(rotation, axisIndex, preferredAxisIndex, sign, time, label) {
  const first = intersectionLambda(rotation, axisIndex, time, label);
  const candidates = [first, normalizeDegrees(first + 180)];
  let best = null;
  for (const lambda of candidates) {
    const ect = pointFromLambda(lambda);
    const hor = rotate(rotation, ect, time);
    const components = [hor.x, hor.y, hor.z];
    if (sign * components[preferredAxisIndex] > EPSILON) {
      best = lambda;
      break;
    }
  }
  if (best === null) throw new Error(`Unable to select ${label} quadrant`);
  return best;
}

function frameVector(horizontal, horToEqd, horToEct, time) {
  return {
    horizontal,
    equatorialOfDate: rotate(horToEqd, horizontal, time),
    eclipticOfDate: rotate(horToEct, horizontal, time)
  };
}

function plane(name, equation, normal, basis, horToEqd, horToEct, time) {
  return {
    name,
    equation,
    normal: frameVector(normal, horToEqd, horToEct, time),
    basis: Object.fromEntries(Object.entries(basis).map(([key, value]) => [
      key, frameVector(value, horToEqd, horToEct, time)
    ]))
  };
}

function validateObserverInput(input) {
  if (!input || typeof input !== 'object') throw new Error('Observer is required for local-frame calculations');
  if (input.latitudeDeg === null || input.latitudeDeg === undefined || input.longitudeDeg === null || input.longitudeDeg === undefined) throw new Error('Observer latitude and longitude are required');
  const latitudeDeg = finite(Number(input.latitudeDeg), 'observer.latitudeDeg');
  const longitudeDeg = finite(Number(input.longitudeDeg), 'observer.longitudeDeg');
  const missingHeight = input.heightMeters === null || input.heightMeters === undefined;
  if (missingHeight && input.heightSource !== 'assumed-zero-reference' && input.heightSource !== 'assumed-zero-city-reference') {
    throw new Error('Observer heightMeters is required; use heightSource=assumed-zero-reference to make a documented 0 m assumption');
  }
  const heightMeters = missingHeight ? 0 : finite(Number(input.heightMeters), 'observer.heightMeters');
  const heightSource = missingHeight ? input.heightSource : (input.heightSource ?? 'manual-wgs84-ellipsoidal');
  if (latitudeDeg < -90 || latitudeDeg > 90) throw new Error('Observer latitude must be in [-90, 90] degrees');
  if (longitudeDeg < -180 || longitudeDeg > 180) throw new Error('Observer longitude must be in [-180, 180] degrees east');
  return { latitudeDeg, longitudeDeg, heightMeters, heightSource };
}

export function makeLocalFrame(date, input) {
  const observerInput = validateObserverInput(input);
  const observer = new Astronomy.Observer(
    observerInput.latitudeDeg,
    observerInput.longitudeDeg,
    observerInput.heightMeters
  );
  const time = Astronomy.MakeTime(date);
  const gastHours = Astronomy.SiderealTime(date);
  const lastHours = normalizeHours(gastHours + observer.longitude / 15);
  const ectToEqd = Astronomy.Rotation_ECT_EQD(time);
  const eqdToHor = Astronomy.Rotation_EQD_HOR(time, observer);
  const ectToHor = Astronomy.CombineRotation(ectToEqd, eqdToHor);
  const horToEqd = Astronomy.InverseRotation(eqdToHor);
  const horToEct = Astronomy.InverseRotation(ectToHor);

  const north = vector(1, 0, 0);
  const west = vector(0, 1, 0);
  const zenith = vector(0, 0, 1);
  const nadir = vector(0, 0, -1);
  const absoluteLatitude = Math.abs(observer.latitude);
  const status = Math.abs(absoluteLatitude - 90) < 1.0e-10
    ? 'pole-degenerate'
    : absoluteLatitude >= 90 - POLE_WARNING_THRESHOLD_DEG ? 'near-pole' : 'ok';
  const angleStatus = status === 'pole-degenerate'
    ? 'conventional-at-pole'
    : status === 'near-pole' ? 'geometric-near-pole' : 'geometric';
  const warnings = [
    'Geometric local frame: no atmospheric refraction, terrain, or horizon obstruction is applied.',
    'UTC is treated as approximately UT1 by Astronomy Engine; local Earth rotation uses the bundled time model.',
    'No IERS Earth-orientation parameters were supplied; UT1−UTC and the resulting local-angle time uncertainty are unquantified.'
  ];
  if (status === 'pole-degenerate') {
    warnings.push('At a geographic pole, longitude is a conventional reference and east/west quadrant labels are not physically unique.');
  } else if (status === 'near-pole') {
    warnings.push(`At latitudes within ${POLE_WARNING_THRESHOLD_DEG}° of a pole, local east/west quadrant labels and house constructions are highly sensitive to the reference longitude.`);
  }

  const ascLambda = selectIntersection(ectToHor, 2, 1, -1, time, 'ASC');
  const dscLambda = selectIntersection(ectToHor, 2, 1, +1, time, 'DSC');
  const mcLambda = selectIntersection(ectToHor, 1, 2, +1, time, 'MC');
  const icLambda = selectIntersection(ectToHor, 1, 2, -1, time, 'IC');

  return {
    status,
    input: {
      utc: date.toISOString(),
      latitudeDeg: observer.latitude,
      longitudeDeg: observer.longitude,
      longitudeConvention: 'east-positive degrees from Greenwich',
      heightMeters: observer.height,
      heightSource: observerInput.heightSource,
      heightSemantics: 'ellipsoidal height above the WGS84 reference ellipsoid; --height is retained as the CLI compatibility flag',
      datum: 'WGS84 geodetic coordinates (Astronomy Engine Earth ellipsoid)'
    },
    time: {
      gastHours,
      lastHours,
      siderealConvention: 'Greenwich apparent sidereal time + east longitude / 15',
      utcApproximatelyUt1: true,
      ut1MinusUtcSeconds: null,
      earthOrientationSource: 'none (no IERS Earth Orientation Parameters supplied)',
      earthOrientationModel: 'Astronomy Engine treats UTC as approximately UT1',
      timeUncertainty: {
        status: 'unquantified',
        statement: 'The local rotation error from UT1−UTC is not numerically bounded in this result because no Earth Orientation Parameters were supplied.'
      }
    },
    frames: {
      horizontal: 'HOR: x=north, y=west, z=zenith',
      equatorial: 'EQD: true equator of date',
      ecliptic: 'ECT: true ecliptic of date; true equinox origin, nutation-adjusted obliquity, longitude eastward from 0° and latitude north-positive'
    },
    geometry: {
      horizon: plane('horizon', 'z = 0 in HOR', zenith, { north, west }, horToEqd, horToEct, time),
      meridian: plane('meridian', 'y = 0 in HOR', west, { north, zenith }, horToEqd, horToEct, time),
      zenith: frameVector(zenith, horToEqd, horToEct, time),
      nadir: frameVector(nadir, horToEqd, horToEct, time)
    },
    angles: {
      ascendant: makeAnglePoint('ASC', ascLambda, ectToEqd, ectToHor, time, angleStatus),
      descendant: makeAnglePoint('DSC', dscLambda, ectToEqd, ectToHor, time, angleStatus),
      midheaven: makeAnglePoint('MC', mcLambda, ectToEqd, ectToHor, time, angleStatus),
      imumCoeli: makeAnglePoint('IC', icLambda, ectToEqd, ectToHor, time, angleStatus)
    },
    method: {
      intersections: 'unit vectors on ECT; solve the selected HOR plane coordinate equal to zero; select the declared local quadrant',
      refraction: 'none',
      houses: 'not calculated',
      numericalTolerance: 'double-precision floating point; model/input uncertainty dominates'
    },
    warnings
  };
}
