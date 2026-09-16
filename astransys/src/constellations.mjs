import Astronomy from '../vendor/astronomy-engine-browser.mjs';

// Astronomy Engine's public Constellation(ra, dec) is the implementation used
// here. Its bundled Roman/Delporte B1875 boundary table is a compact integer
// grid: one unit is 2.5 arcminutes in RA/Dec. This wrapper estimates proximity
// to that classifier; it does not imply sub-arcminute boundary precision.
const B1875_UT = -45655.74141261017;
const B1875 = Astronomy.MakeTime(B1875_UT);
const TO_EQJ = Astronomy.Rotation_EQD_EQJ(B1875);
const AMBIGUOUS_ARC_MIN = 2;
const NEAR_BOUNDARY_ARC_MIN = 10;
const SEARCH_RADIUS_DEG = 5;
const RAYS = 72;

function wrapRa(hours) {
  const value = hours % 24;
  return value < 0 ? value + 24 : value;
}

function b1875ToEqj(raHours, decDeg) {
  const b = Astronomy.VectorFromSphere(
    new Astronomy.Spherical(decDeg, 15 * wrapRa(raHours), 1), B1875
  );
  return Astronomy.EquatorFromVector(Astronomy.RotateVector(TO_EQJ, b));
}

function classifyB1875(raHours, decDeg) {
  const eqj = b1875ToEqj(raHours, decDeg);
  return Astronomy.Constellation(eqj.ra, eqj.dec).symbol;
}

function destination(raHours, decDeg, distanceDeg, bearingRad) {
  const lat = decDeg * Astronomy.DEG2RAD;
  const lon = 15 * raHours * Astronomy.DEG2RAD;
  const d = distanceDeg * Astronomy.DEG2RAD;
  const sinLat = Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(bearingRad);
  const outLat = Math.asin(Math.max(-1, Math.min(1, sinLat)));
  const outLon = lon + Math.atan2(
    Math.sin(bearingRad) * Math.sin(d) * Math.cos(lat),
    Math.cos(d) - Math.sin(lat) * Math.sin(outLat)
  );
  return [wrapRa(outLon / (15 * Astronomy.DEG2RAD)), outLat / Astronomy.DEG2RAD];
}

function separationArcmin(a, b) {
  const lat1 = a[1] * Astronomy.DEG2RAD;
  const lat2 = b[1] * Astronomy.DEG2RAD;
  const dra = (15 * (a[0] - b[0])) * Astronomy.DEG2RAD;
  const cosine = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dra);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) / Astronomy.DEG2RAD * 60;
}

function boundaryDistance(raHours, decDeg, symbol) {
  const origin = [wrapRa(raHours), decDeg];
  let best = Infinity;
  // The compact table consists of horizontal and vertical segments. Rays
  // every 5 degrees provide a deterministic proximity probe. The result is an
  // estimate only: an unhit ray is reported as unmeasured, never as clear.
  for (let i = 0; i < RAYS; ++i) {
    const bearing = (2 * Math.PI * i) / RAYS;
    let previous = 0;
    for (const probe of [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]) {
      const point = destination(origin[0], origin[1], probe, bearing);
      if (classifyB1875(point[0], point[1]) !== symbol) {
        let lo = previous;
        let hi = probe;
        for (let n = 0; n < 32; ++n) {
          const mid = (lo + hi) / 2;
          const test = destination(origin[0], origin[1], mid, bearing);
          if (classifyB1875(test[0], test[1]) === symbol) lo = mid;
          else hi = mid;
        }
        best = Math.min(best, separationArcmin(origin, destination(origin[0], origin[1], hi, bearing)));
        break;
      }
      previous = probe;
    }
  }
  return Number.isFinite(best) ? best : null;
}

export function annotateConstellation(info) {
  const distance = boundaryDistance(info.ra1875, info.dec1875, info.symbol);
  let boundaryStatus = 'unmeasured';
  if (distance !== null) {
    if (distance <= AMBIGUOUS_ARC_MIN) boundaryStatus = 'ambiguous';
    else if (distance <= NEAR_BOUNDARY_ARC_MIN) boundaryStatus = 'near-boundary';
    else boundaryStatus = 'clear';
  }
  return {
    symbol: info.symbol,
    name: info.name,
    ra1875Hours: info.ra1875,
    dec1875Deg: info.dec1875,
    boundaryStatus,
    boundaryDistanceEstimateArcmin: distance,
    boundaryMethod: 'estimated minimum angular distance from a deterministic 72-ray probe of the Astronomy Engine Roman/Delporte classifier; not an exact geometric distance',
    boundarySearchRadiusArcmin: SEARCH_RADIUS_DEG * 60,
    boundaryAmbiguousThresholdArcmin: AMBIGUOUS_ARC_MIN,
    boundaryNearThresholdArcmin: NEAR_BOUNDARY_ARC_MIN
  };
}
