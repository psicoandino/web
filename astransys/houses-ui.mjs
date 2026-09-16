const HOUSE_LABELS = Object.freeze({ equal: 'Equal desde ASC', porphyry: 'Porphyry', compare: 'Comparar Equal / Porphyry' });
const HOUSE_STATUS_LABELS = Object.freeze({
  valid: 'calculado',
  'on-cusp': 'en cúspide',
  'polar-undefined': 'polar no definido',
  singular: 'singular',
  'numerically-unstable': 'numéricamente inestable',
  'model-mismatch': 'incompatibilidad geométrica',
  'invalid-input': 'entrada inválida'
});

export function houseLabel(system) { return HOUSE_LABELS[system] ?? String(system ?? 'Casas'); }

export function houseShortLabel(system) { return system === 'equal' ? 'Equal' : system === 'porphyry' ? 'Porphyry' : houseLabel(system); }

export function houseStatusLabel(status) { return HOUSE_STATUS_LABELS[status] ?? 'estado no disponible'; }

export function houseSets(houses) {
  if (!houses || typeof houses !== 'object') return [];
  if (typeof houses.system === 'string') return [houses];
  return ['equal', 'porphyry'].filter((system) => houses[system] && typeof houses[system] === 'object').map((system) => houses[system]);
}

export function housePrerequisiteMessage(system, { exact = false, city = null, cityPending = false } = {}) {
  if (!system || system === 'none') return 'Las casas se retirarán al recalcular con «No calcular».';
  if (cityPending) return 'Esperando que termine la carga de la ciudad antes de calcular casas.';
  if (!exact || !city) return `Para ${houseLabel(system)} se requiere hora exacta UTC y una ciudad seleccionada.`;
  return `${houseLabel(system)} listo para calcular.`;
}

export function houseStaleMessage(system) { return `${houseLabel(system)} pendiente de recalcular.`; }

export function houseActionLabel(system, status = 'idle') {
  if (!system || system === 'none') return 'Calcular arquitectura';
  if (status === 'pending') return 'Calculando casas…';
  if (status === 'success') return `${houseLabel(system)} · calculado`;
  return 'Aplicar casas y calcular';
}

export function assignmentText(assignment) {
  if (!assignment || typeof assignment !== 'object') return 'sin asignación';
  if (assignment.status === 'valid' && Number.isInteger(assignment.house)) return `casa ${assignment.house}`;
  if (assignment.status === 'on-cusp' && Number.isInteger(assignment.cusp)) {
    const neighbors = Array.isArray(assignment.neighboringHouses) ? assignment.neighboringHouses.join(' / ') : '—';
    return `cúspide ${assignment.cusp} · casas ${neighbors}`;
  }
  return `sin asignación · ${houseStatusLabel(assignment.status)}`;
}

export function assignmentFocusText(assignment) {
  if (!assignment || typeof assignment !== 'object') return '—';
  if (assignment.status === 'valid' && Number.isInteger(assignment.house)) return `H${assignment.house}`;
  if (assignment.status === 'on-cusp' && Number.isInteger(assignment.cusp)) {
    const neighbors = Array.isArray(assignment.neighboringHouses) ? assignment.neighboringHouses.map((house) => `H${house}`).join(' / ') : '—';
    return `cúspide H${assignment.cusp} · vecinas ${neighbors}`;
  }
  return `— · ${houseStatusLabel(assignment.status)}`;
}

export function houseResultStatus(houses, system) {
  const sets = houseSets(houses);
  if (!sets.length) return 'error';
  const selected = system === 'compare' ? sets : sets.filter((set) => set.system === system);
  return selected.length && selected.every((set) => set.status === 'valid') ? 'success' : 'error';
}
