export function ticks(a, b, PW) {
  const result = [];
  const step = stepFor(a, b, PW);

  // Calculate initial date and minute index
  const da = new Date(a * 864e5);
  let mm = Math.ceil((da.getUTCFullYear() * 12 + da.getUTCMonth()) / step) * step;

  while (true) {
    // Calculate UTC day number (dn)
    const dn = Date.UTC(Math.floor(mm / 12), mm % 12, 1) / 864e5;

    // Stop condition
    if (dn > b) {
      break;
    }

    // Push condition
    if (dn >= a) {
      result.push({ dn: dn, label: labelFor(mm, step) });
    }

    // Update mm
    mm += step;
  }

  return result;
}

export function stepFor(a, b, PW) {
  const months = (b - a) / 30.44;
  const steps = [1, 3, 6, 12, 24, 60, 120];

  for (const step of steps) {
    // Check if PW / (months / step) >= 78
    // This is equivalent to: PW * step >= 78 * months
    if (PW * step >= 78 * months) {
      return step;
    }
  }

  return 120;
}

export function labelFor(mm, step) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (step >= 12) {
    return String(Math.floor(mm / 12));
  } else {
    const monthIndex = mm % 12;
    const year = Math.floor(mm / 12);
    const name = monthNames[monthIndex];

    if (monthIndex === 0) {
      return name + ' ' + String(year);
    } else {
      return name;
    }
  }
}
