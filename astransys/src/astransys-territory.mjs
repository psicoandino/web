import Astronomy from '../vendor/astronomy-engine-browser.mjs';
import { annotateConstellation } from './constellations.mjs';

// These are the 13 IAU regions intersected by the true ecliptic. They are a
// projection convention of Astransys, not astrological houses and not a
// replacement for the body's actual 2D sky constellation.
export const ASTRANSYS_TERRITORY_SYMBOLS = Object.freeze([
  'Ari', 'Tau', 'Gem', 'Cnc', 'Leo', 'Vir', 'Lib',
  'Sco', 'Oph', 'Sgr', 'Cap', 'Aqr', 'Psc'
]);

const TERRITORY_SET = new Set(ASTRANSYS_TERRITORY_SYMBOLS);

function finite(value, label) {
  if (!Number.isFinite(value)) throw new Error(`Non-finite ${label}`);
  return value;
}

function normalizeDegrees(value) {
  const x = value % 360;
  let normalized = x < 0 ? x + 360 : x;
  if (normalized >= 360) normalized = 0;
  return Object.is(normalized, -0) ? 0 : normalized;
}

function vector(x, y, z) {
  return {
    x: finite(x, 'vector.x'),
    y: finite(y, 'vector.y'),
    z: finite(z, 'vector.z')
  };
}

function rotate(rotation, value, time) {
  const out = Astronomy.RotateVector(
    rotation,
    new Astronomy.Vector(value.x, value.y, value.z, time)
  );
  return vector(out.x, out.y, out.z);
}

function unitEclipticVector(longitudeDeg, time) {
  const longitude = normalizeDegrees(longitudeDeg);
  return Astronomy.VectorFromSphere(
    new Astronomy.Spherical(0, longitude, 1),
    time
  );
}

export function projectedVectorFromGeocentricVector(geocentricVector, date) {
  const time = Astronomy.MakeTime(date);
  const ecliptic = Astronomy.Ecliptic(geocentricVector);
  const ect = unitEclipticVector(ecliptic.elon, time);
  const ectToEqd = Astronomy.Rotation_ECT_EQD(time);
  const eqdToEqj = Astronomy.Rotation_EQD_EQJ(time);
  const ectToEqj = Astronomy.CombineRotation(ectToEqd, eqdToEqj);
  const eqj = rotate(ectToEqj, ect, time);
  return new Astronomy.Vector(eqj.x, eqj.y, eqj.z, time);
}

function coordinates(projected, date) {
  const time = Astronomy.MakeTime(date);
  const ecliptic = Astronomy.Ecliptic(projected);
  const eqd = rotate(Astronomy.Rotation_EQJ_EQD(time), projected, time);
  const eqdCoordinates = Astronomy.EquatorFromVector(
    new Astronomy.Vector(eqd.x, eqd.y, eqd.z, time)
  );
  const eqjCoordinates = Astronomy.EquatorFromVector(projected);
  const constellation = Astronomy.Constellation(eqjCoordinates.ra, eqjCoordinates.dec);
  if (!TERRITORY_SET.has(constellation.symbol)) {
    throw new Error(`Projected ecliptic point classified outside the 13 Astransys territories: ${constellation.symbol}`);
  }
  return {
    symbol: constellation.symbol,
    name: constellation.name,
    eclipticLongitudeDeg: normalizeDegrees(ecliptic.elon),
    eclipticLatitudeDeg: 0,
    equatorialOfDate: {
      raHours: finite(eqdCoordinates.ra, 'projected.raOfDate'),
      decDeg: finite(eqdCoordinates.dec, 'projected.decOfDate'),
      frame: 'EQD',
      epoch: 'of-date'
    },
    equatorialJ2000: {
      raHours: finite(eqjCoordinates.ra, 'projected.raJ2000'),
      decDeg: finite(eqjCoordinates.dec, 'projected.decJ2000'),
      frame: 'EQJ',
      epoch: 'J2000'
    },
    constellation: {
      symbol: constellation.symbol,
      name: constellation.name,
      ra1875Hours: finite(constellation.ra1875, 'projected.ra1875'),
      dec1875Deg: finite(constellation.dec1875, 'projected.dec1875'),
      ...annotateConstellation(constellation)
    }
  };
}

export function calculateAstransysTerritory(geocentricVector, date) {
  const projected = projectedVectorFromGeocentricVector(geocentricVector, date);
  const time = Astronomy.MakeTime(date);
  const ectToEqd = Astronomy.Rotation_ECT_EQD(time);
  const projectedEct = rotate(
    Astronomy.Rotation_EQJ_ECT(time),
    projected,
    time
  );
  const info = coordinates(projected, date);
  return {
    symbol: info.symbol,
    name: info.name,
    eclipticLongitudeDeg: info.eclipticLongitudeDeg,
    eclipticLatitudeDeg: info.eclipticLatitudeDeg,
    coordinates: {
      eclipticOfDate: vector(projectedEct.x, projectedEct.y, projectedEct.z),
      equatorialOfDate: (() => {
        const eqd = rotate(ectToEqd, projectedEct, time);
        return vector(eqd.x, eqd.y, eqd.z);
      })(),
      equatorialJ2000: vector(projected.x, projected.y, projected.z)
    },
    constellation: info.constellation,
    method: 'project geocentric true-ecliptic-of-date longitude to latitude 0°, transform ECT→EQD→EQJ, then apply the IAU Roman-Delporte classifier',
    source: 'Astransys projection convention; not an actual-sky replacement and not astrological houses'
  };
}
