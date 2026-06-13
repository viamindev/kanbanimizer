// Fractional indexing for ordering columns/tasks without re-numbering rows.
// Positions are short strings compared lexicographically; you can always
// generate a new key strictly between any two existing keys.
// Core `midpoint` is the proven algorithm from rocicorp/fractional-indexing (MIT).

const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const ZERO = DIGITS[0];

function midpoint(a: string, b: string | null): string {
  if (b != null && a >= b) throw new Error(`position: ${a} >= ${b}`);
  if (a.slice(-1) === ZERO || (b && b.slice(-1) === ZERO)) {
    throw new Error("position: unexpected trailing zero");
  }
  if (b) {
    // strip longest common prefix, padding `a` with zeros as needed
    let n = 0;
    while ((a[n] || ZERO) === b[n]) n++;
    if (n > 0) return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
  }
  const digitA = a ? DIGITS.indexOf(a[0]) : 0;
  const digitB = b != null ? DIGITS.indexOf(b[0]) : DIGITS.length;
  if (digitB - digitA > 1) {
    const mid = Math.round(0.5 * (digitA + digitB));
    return DIGITS[mid];
  }
  // consecutive first digits
  if (b && b.length > 1) return b.slice(0, 1);
  return DIGITS[digitA] + midpoint(a.slice(1), null);
}

/**
 * Generate a position key strictly between `lower` and `upper`.
 * Pass null for `lower` to insert at the start, null for `upper` to append.
 */
export function positionBetween(
  lower: string | null,
  upper: string | null,
): string {
  return midpoint(lower ?? "", upper);
}

/** Generate `n` ascending position keys for seeding a fresh board. */
export function initialPositions(n: number): string[] {
  const out: string[] = [];
  let last: string | null = null;
  for (let i = 0; i < n; i++) {
    last = positionBetween(last, null);
    out.push(last);
  }
  return out;
}
