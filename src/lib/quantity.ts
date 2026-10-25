// Quantity & units helpers — "2 x 500ml milk", "500ml milk", "2 milk", "two eggs"

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

const UNIT_RE =
  /^(ml|l|ltr|litres?|liters?|g|gr|grams?|kg|kgs?|kilograms?|pack|packs|pk|dozen|doz|ea|each|pieces?|box|boxes|tin|tins|bottle|bottles|bag|bags)$/i;

// Is a token a unit-like quantity token, e.g. "500ml", "1.5kg", "6-pack"?
function isUnitToken(token: string): boolean {
  const t = token.toLowerCase().trim();
  if (!t) return false;
  // "500ml", "1.5kg", "6pack" — digits followed by a known unit
  if (/^\d+(?:[.,]\d+)?\s*(?:ml|l|ltr|litres?|liters?|g|gr|grams?|kg|kgs?|kilograms?|packs?|pk|dozen|doz|ea|each)$/.test(t)) {
    return true;
  }
  return UNIT_RE.test(t);
}

export interface ParsedQty {
  count: number | null;
  unit: string | null;
}

export function parseQty(raw?: string | null): ParsedQty | null {
  if (!raw) return null;
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  // Count followed by "x", whitespace, or end — "500ml" stays unit-only
  const m = text.match(/^(\d+(?:[.,]\d+)?)\s*(?:(?:x|×)\s*(.+)?|\s+(.+))?$/);
  if (m) {
    const count = parseFloat(m[1].replace(',', '.'));
    const unit = (m[2] ?? m[3] ?? '').trim() || null;
    return { count: Number.isFinite(count) ? count : null, unit };
  }
  // Unit-only, e.g. "500ml"
  return { count: null, unit: text };
}

export function formatQty(q: ParsedQty | null): string | undefined {
  if (!q) return undefined;
  if (q.count != null && q.unit) return `${q.count} x ${q.unit}`;
  if (q.count != null) return String(q.count);
  return q.unit ?? undefined;
}

/**
 * Merge two quantity strings, summing counts when the units agree.
 *   "2" + "1"            -> "3"
 *   "2 x 500ml" + "1"    -> "3 x 500ml"
 *   "500ml" + "500ml"    -> "2 x 500ml"
 *   "500ml" + "1L"       -> "500ml + 1L" (units differ)
 */
export function combineQuantities(a?: string | null, b?: string | null): string | undefined {
  const qa = parseQty(a);
  const qb = parseQty(b);
  if (!qa && !qb) return undefined;
  if (!qa) return formatQty(qb);
  if (!qb) return formatQty(qa);

  // Treat a unit-only quantity ("500ml") as one unit of it when combining with a count.
  const pa: ParsedQty = qa.count == null && qa.unit && qb.count != null ? { count: 1, unit: qa.unit } : qa;
  const pb: ParsedQty = qb.count == null && qb.unit && qa.count != null ? { count: 1, unit: qb.unit } : qb;

  const unitA = pa.unit ?? '';
  const unitB = pb.unit ?? '';

  if (pa.count != null && pb.count != null && unitA === unitB) {
    return formatQty({ count: pa.count + pb.count, unit: pa.unit });
  }

  const fa = formatQty(qa);
  const fb = formatQty(qb);
  if (fa && fb && fa !== fb) return `${fa} + ${fb}`;
  return fa ?? fb;
}

/**
 * Split a typed item into its quantity and clean name.
 *   "2 x 500ml milk" -> { name: "milk", quantity: "2 x 500ml" }
 *   "2x milk"        -> { name: "milk", quantity: "2" }
 *   "500ml milk"     -> { name: "milk", quantity: "500ml" }
 *   "two eggs"       -> { name: "eggs", quantity: "2" }
 *   "milk"           -> { name: "milk" }
 */
export function parseQuantityAndName(raw: string): { name: string; quantity?: string } {
  const text = raw.trim().replace(/\s+/g, ' ');
  if (!text) return { name: raw };

  // "2 x 500ml milk" / "2x milk" / "3 × 6-pack cooldrink"
  let m = text.match(/^(\d+(?:[.,]\d+)?)\s*(?:x|×)\s*(\S+)?(?:\s+(.+))?$/i);
  if (m) {
    const count = m[1].replace(',', '.');
    const token = (m[2] ?? '').trim();
    const rest = (m[3] ?? '').trim();
    if (token && isUnitToken(token)) {
      return { name: rest || text, quantity: `${count} x ${token}` };
    }
    if (token) {
      const name = `${token}${rest ? ` ${rest}` : ''}`;
      return { name, quantity: count };
    }
    return { name: text };
  }

  // "2 milk" / "500ml milk" / "2.5 kg rice"
  m = text.match(/^(\d+(?:[.,]\d+)?(?:\s*[a-z]{1,7})?)\s+(.+)$/i);
  if (m) {
    const token = m[1].trim();
    const name = m[2].trim();
    const bare = token.match(/^(\d+(?:[.,]\d+)?)$/);
    if (bare) {
      // Product names that start with a number, e.g. "2 minute noodles"
      if (/^minute\b/i.test(name)) return { name: text };
      return { name, quantity: bare[1] };
    }
    if (isUnitToken(token)) return { name, quantity: token };
  }

  // "two eggs" / "three bags of mealie meal"
  const firstWord = text.split(' ')[0].toLowerCase();
  if (firstWord in WORD_NUMBERS) {
    const name = text.slice(firstWord.length).trim();
    if (name) return { name, quantity: String(WORD_NUMBERS[firstWord]) };
  }

  return { name: text };
}
