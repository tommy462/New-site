// Solar geometry for Newton Abbot (and anywhere else).
// Implements the standard low-precision astronomical algorithms
// (as published by NOAA / used by SunCalc). Accurate to ~1 minute
// for sunrise/sunset — more than enough to light a room.

export const NEWTON_ABBOT = { lat: 50.5281, lon: -3.6101, name: 'Newton Abbot' };

const PI = Math.PI;
const rad = PI / 180;
const dayMs = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const e = rad * 23.4397; // obliquity of the Earth

const toJulian = (date) => date.valueOf() / dayMs - 0.5 + J1970;
const fromJulian = (j) => new Date((j + 0.5 - J1970) * dayMs);
const toDays = (date) => toJulian(date) - J2000;

const rightAscension = (l, b) => Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
const declination = (l, b) => Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
const azimuthOf = (H, phi, dec) => Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
const altitudeOf = (H, phi, dec) => Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
const siderealTime = (d, lw) => rad * (280.16 + 360.9856235 * d) - lw;
const solarMeanAnomaly = (d) => rad * (357.5291 + 0.98560028 * d);
function eclipticLongitude(M) {
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  return M + C + rad * 102.9372 + PI;
}
function sunCoords(d) {
  const L = eclipticLongitude(solarMeanAnomaly(d));
  return { dec: declination(L, 0), ra: rightAscension(L, 0) };
}

/**
 * Sun position. altitude in radians above horizon.
 * bearing in degrees clockwise from true north (0 = N, 90 = E, 180 = S).
 */
export function sunPosition(date, lat = NEWTON_ABBOT.lat, lon = NEWTON_ABBOT.lon) {
  const lw = rad * -lon;
  const phi = rad * lat;
  const d = toDays(date);
  const c = sunCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  const az = azimuthOf(H, phi, c.dec); // from south, westwards
  const altitude = altitudeOf(H, phi, c.dec);
  const bearing = ((az / rad + 180) % 360 + 360) % 360;
  return { altitude, altitudeDeg: altitude / rad, bearing };
}

const J0 = 0.0009;
const julianCycle = (d, lw) => Math.round(d - J0 - lw / (2 * PI));
const approxTransit = (Ht, lw, n) => J0 + (Ht + lw) / (2 * PI) + n;
const solarTransitJ = (ds, M, L) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
const hourAngle = (h, phi, d) => Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));

export function sunTimes(date, lat = NEWTON_ABBOT.lat, lon = NEWTON_ABBOT.lon) {
  const lw = rad * -lon;
  const phi = rad * lat;
  const d = toDays(date);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);
  const Jnoon = solarTransitJ(ds, M, L);
  const at = (deg) => {
    const w = hourAngle(deg * rad, phi, dec);
    const Jset = solarTransitJ(approxTransit(w, lw, n), M, L);
    return { rise: fromJulian(Jnoon - (Jset - Jnoon)), set: fromJulian(Jset) };
  };
  const sun = at(-0.833);
  const golden = at(6);
  return {
    sunrise: sun.rise,
    sunset: sun.set,
    noon: fromJulian(Jnoon),
    goldenHourStart: golden.set,
    goldenHourEnd: golden.rise,
    dayLengthMs: sun.set - sun.rise,
  };
}

/** Offset (minutes) of Europe/London from UTC at a given instant. */
export function londonOffsetMinutes(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(date);
  const get = (t) => +parts.find((p) => p.type === t).value;
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
  return Math.round((asUTC - date.valueOf()) / 60000);
}

/** Build an instant from a wall-clock time in Newton Abbot. */
export function londonDate(year, monthIndex, day, hours = 12, minutes = 0) {
  const guess = new Date(Date.UTC(year, monthIndex, day, hours, minutes));
  const off = londonOffsetMinutes(guess);
  return new Date(guess.valueOf() - off * 60000);
}

export const fmtTime = (date) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' }).format(date);

/** 0 = deep night, 1 = full day — a smooth "how lit is the world" factor. */
export function daylight(altitudeDeg) {
  const t = (altitudeDeg + 10) / 22;
  return Math.max(0, Math.min(1, t * t * (3 - 2 * t)));
}
