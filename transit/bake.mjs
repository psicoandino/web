// bake.mjs OUTDIR: computes the sky for 1980-01-01 to 2035-12-31 once and writes sky.json (the small table) and sky.bin (the numbers).
// The record is what this code reproduces; test/engine.test.mjs compares the baked file with the live calculation on known dates.
import { buildSky, ORDER, CLOSE_HOUR } from './sky.mjs';
import { dayNumber } from './engine.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const out = process.argv[2];
if (!out) { console.error('usage: node bake.mjs OUTDIR'); process.exit(2); }
const sky = await buildSky(dayNumber('1980-01-01'), dayNumber('2035-12-31'));
const n = sky.days, buf = Buffer.alloc(ORDER.length * n * 5);
ORDER.forEach((b, i) => {
  Buffer.from(Float32Array.from(sky.lon[b]).buffer).copy(buf, i * n * 4);
  Buffer.from(sky.terr[b]).copy(buf, ORDER.length * n * 4 + i * n);
});
mkdirSync(out, { recursive: true });
writeFileSync(out + '/sky.json', JSON.stringify({ start: sky.start, days: n, closeHour: CLOSE_HOUR, order: ORDER, symbols: sky.symbolOf, names: sky.symbolOf.map((s) => sky.names.get(s)) }));
writeFileSync(out + '/sky.bin', buf);
console.log(`baked ${n} days for ${ORDER.length} bodies, ${buf.length} bytes`);
