/**
 * Fractional Indexing Utility
 * ─────────────────────────────────────────────────────────────────────────────
 * Allows O(1) position updates when reordering tasks in a Kanban column.
 *
 * Instead of storing integer positions (which require updating ALL items after
 * a move — O(n)), we store fractional strings that can always be bisected
 * between any two existing positions.
 *
 * Interview talking point:
 *   "We use fractional indexing so a drag-and-drop reorder is a single DB
 *    write. If the gap gets too small, we rebalance only the affected column."
 */

const BASE_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const MID_CHAR = BASE_CHARS[Math.floor(BASE_CHARS.length / 2)];

export function generateInitialPosition(): string {
  return MID_CHAR + "0000";
}

/**
 * Generate a position between two existing positions.
 * - before=null → position before `after`
 * - after=null  → position after `before`
 * - both null   → initial position
 */
export function generatePositionBetween(
  before: string | null,
  after: string | null
): string {
  if (!before && !after) return generateInitialPosition();
  if (!before) return decrementPosition(after!);
  if (!after) return incrementPosition(before);
  return midpoint(before, after);
}

/**
 * Generate positions for bulk inserts.
 */
export function generatePositions(count: number, startAfter?: string): string[] {
  const positions: string[] = [];
  let current = startAfter ?? null;
  for (let i = 0; i < count; i++) {
    const next = incrementPosition(current ?? generateInitialPosition());
    positions.push(next);
    current = next;
  }
  return positions;
}

// ─── Internals ────────────────────────────────────────────────────────────────

function charValue(char: string): number {
  return BASE_CHARS.indexOf(char);
}

function charAt(value: number): string {
  return BASE_CHARS[Math.max(0, Math.min(BASE_CHARS.length - 1, value))];
}

function padRight(str: string, length: number): string {
  return str.padEnd(length, BASE_CHARS[0]);
}

function midpoint(a: string, b: string): string {
  const maxLen = Math.max(a.length, b.length) + 1;
  const aVals = padRight(a, maxLen).split("").map(charValue);
  const bVals = padRight(b, maxLen).split("").map(charValue);

  const midVals: number[] = [];
  let carry = 0;

  for (let i = maxLen - 1; i >= 0; i--) {
    const sum = aVals[i] + bVals[i] + carry;
    carry = Math.floor(sum / BASE_CHARS.length);
    midVals[i] = sum % BASE_CHARS.length;
  }

  const mid = midVals.map(charAt).join("").replace(/0+$/, "") || BASE_CHARS[0];

  if (mid === a || mid === b) {
    return a + BASE_CHARS[Math.floor(BASE_CHARS.length / 2)];
  }

  return mid;
}

function incrementPosition(pos: string): string {
  const chars = pos.split("");
  let i = chars.length - 1;
  while (i >= 0) {
    const val = charValue(chars[i]);
    if (val < BASE_CHARS.length - 1) {
      chars[i] = charAt(val + 1);
      return chars.join("").replace(/0+$/, "") || BASE_CHARS[0];
    }
    chars[i] = BASE_CHARS[0];
    i--;
  }
  return BASE_CHARS[1] + chars.join("");
}

function decrementPosition(pos: string): string {
  const chars = pos.split("");
  let i = chars.length - 1;
  while (i >= 0) {
    const val = charValue(chars[i]);
    if (val > 0) {
      chars[i] = charAt(val - 1);
      return chars.join("").replace(/0+$/, "") || BASE_CHARS[0];
    }
    chars[i] = BASE_CHARS[BASE_CHARS.length - 1];
    i--;
  }
  return BASE_CHARS[0] + chars.join("");
}