/* Browser-only geography adapter. It deliberately never consults Intl for
 * civil-time conversion: this MVP accepts UTC only. */
const manifestUrl = new URL('./data/geography/manifest.json.gz', import.meta.url);
let manifestPromise;
const cityCache = new Map();
const MAX_CACHED_COUNTRIES = 2;

async function readJsonAsset(url) {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`No se pudo cargar el catálogo (${response.status})`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (!isGzip) return JSON.parse(new TextDecoder().decode(bytes));
  if (typeof DecompressionStream !== 'function') {
    throw new Error('Este navegador no ofrece descompresión gzip; el catálogo queda no disponible.');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text());
}

export function loadManifest() {
  manifestPromise ??= readJsonAsset(manifestUrl).then((manifest) => {
    if (manifest.schemaVersion !== '1.1.0' || !Array.isArray(manifest.continents) || !Array.isArray(manifest.countries)) {
      throw new Error('Manifiesto geográfico incompatible');
    }
    return manifest;
  });
  return manifestPromise;
}

export async function listContinents() {
  const manifest = await loadManifest();
  return manifest.continents;
}

export async function listCountries(continentCode) {
  const manifest = await loadManifest();
  const code = String(continentCode ?? '').toUpperCase();
  const continent = manifest.continents.find((item) => item.code === code);
  if (!continent) return [];
  const allowed = new Set(continent.countries);
  return manifest.countries.filter((country) => allowed.has(country.code));
}

export async function listCities(countryCode) {
  const manifest = await loadManifest();
  const code = String(countryCode ?? '').toUpperCase();
  if (cityCache.has(code)) {
    const value = cityCache.get(code);
    cityCache.delete(code);
    cityCache.set(code, value);
    return value;
  }
  const country = manifest.countries.find((item) => item.code === code);
  if (!country || country.status === 'historical') return [];
  const cities = await readJsonAsset(new URL(`./data/geography/${country.path}`, import.meta.url));
  if (cities.schemaVersion !== '1.1.0' || cities.countryCode !== code || !Array.isArray(cities.cities)) {
    throw new Error(`Archivo geográfico incompatible para ${code}`);
  }
  cityCache.set(code, cities.cities);
  while (cityCache.size > MAX_CACHED_COUNTRIES) cityCache.delete(cityCache.keys().next().value);
  return cities.cities;
}

export const browserTimeMetadata = Object.freeze({
  status: 'unavailable',
  reason: 'No se consulta Intl ni el tzdb del navegador; ingresa hora UTC explícita.'
});
