const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SLASH_DATE = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
const TIME_24 = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
const TIME_12 = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])\.?m?\.?$/i;

function fail(message) { throw new RangeError(message); }

function calendarUtc(year, month, day, hour, minute, second) {
  if (![year, month, day, hour, minute, second].every(Number.isInteger)) fail('La fecha y la hora deben usar números enteros.');
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || date.getUTCHours() !== hour || date.getUTCMinutes() !== minute || date.getUTCSeconds() !== second) fail('La fecha u hora no existe en el calendario.');
  if (year < 1800 || year > 2100) fail('La fecha debe estar entre 1800 y 2100.');
  return date;
}

function dateParts(value) {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) fail('La fecha no es válida.');
    return { date: new Date(value.getTime()), full: true };
  }
  if (typeof value !== 'string' || !value.trim()) fail('Ingresa una fecha.');
  const text = value.trim();
  if (text.includes('T')) {
    const date = new Date(text);
    if (!Number.isFinite(date.getTime())) fail('La fecha ISO no es válida.');
    return { date, full: true };
  }
  let match = text.match(ISO_DATE);
  let year; let month; let day;
  if (match) [, year, month, day] = match.map(Number);
  else {
    match = text.match(SLASH_DATE);
    if (!match) fail('Usa AAAA-MM-DD, DD-MM-AAAA o DD/MM/AAAA.');
    [, day, month, year] = match.map(Number);
  }
  return { date: calendarUtc(year, month, day, 12, 0, 0), full: false };
}

function timeParts(value) {
  if (value instanceof Date) return { hour: value.getUTCHours(), minute: value.getUTCMinutes(), second: value.getUTCSeconds() };
  if (value == null || String(value).trim() === '') return { hour: 12, minute: 0, second: 0, reference: true };
  const text = String(value).trim();
  let match = text.match(TIME_24);
  if (match) {
    const [, hour, minute, second = '0'] = match;
    return { hour: Number(hour), minute: Number(minute), second: Number(second), reference: false };
  }
  match = text.replace(/\s+/g, ' ').match(TIME_12);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3] ?? 0);
    const meridiem = match[4].toLowerCase();
    if (hour < 1 || hour > 12) fail('La hora de 12 horas debe estar entre 1 y 12.');
    if (meridiem === 'p' && hour < 12) hour += 12;
    if (meridiem === 'a' && hour === 12) hour = 0;
    return { hour, minute, second, reference: false };
  }
  fail('Usa hora UTC de 24 horas (HH:MM[:SS]) o 12 horas (h:MM AM/PM).');
}

export function serializeUtc(dateValue, timeValue = '') {
  const parsedDate = dateParts(dateValue);
  if (parsedDate.full && (dateValue instanceof Date || (typeof dateValue === 'string' && dateValue.includes('T'))) && (timeValue == null || String(timeValue).trim() === '')) {
    const utc = parsedDate.date.toISOString();
    if (parsedDate.date.getUTCFullYear() < 1800 || parsedDate.date.getUTCFullYear() > 2100) fail('La fecha debe estar entre 1800 y 2100.');
    return { utc, timeStatus: 'exact' };
  }
  const time = timeParts(timeValue);
  const date = parsedDate.full ? parsedDate.date : parsedDate.date;
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const exact = calendarUtc(year, month, day, time.hour, time.minute, time.second);
  return { utc: exact.toISOString(), timeStatus: time.reference ? 'date-only-reference' : 'exact' };
}

export function todayFormValues(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(date.getTime())) fail('La fecha actual no es válida.');
  return { date: date.toISOString().slice(0, 10), time: '' };
}

export function nowFormValues(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(date.getTime())) fail('La fecha actual no es válida.');
  return { date: date.toISOString().slice(0, 10), time: date.toISOString().slice(11, 19) };
}

export function humanError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/UTC must be ISO|UTC must be|fecha ISO/i.test(message)) return 'La fecha y hora deben estar en UTC ISO válido.';
  if (/Invalid UTC calendar|no existe en el calendario/i.test(message)) return 'La fecha u hora no existe en el calendario.';
  if (/outside supported validity|entre 1800 y 2100/i.test(message)) return 'La fecha debe estar entre 1800 y 2100.';
  if (/Unsupported body|Unsupported house|Solicitud inválida/i.test(message)) return 'La solicitud no es válida para este cálculo.';
  if (/^(El |La |Las |Los |No |Falta |Ingresa |Ciudad |Archivo |Este |Lugar |Solicitud )/.test(message)) return message;
  return 'No se pudo completar el cálculo. Revisa los datos e inténtalo nuevamente.';
}
