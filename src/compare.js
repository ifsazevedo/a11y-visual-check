// @ts-check
// Pure functions that compare two versions of a page. No browser, no file system.

/**
 * Line-by-line difference between two texts, based on the longest common
 * subsequence. Each output line starts with '  ' (unchanged), '- ' (only in
 * `before`) or '+ ' (only in `after`).
 * @param {string} before
 * @param {string} after
 * @returns {string}
 */
export function diffLines(before, after) {
  const a = before.split('\n');
  const b = after.split('\n');
  // lcs[i][j]: length of the longest common subsequence of a[i..] and b[j..]
  const lcs = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { out.push('  ' + a[i]); i++; j++; }
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) out.push('- ' + a[i++]);
    else out.push('+ ' + b[j++]);
  }
  while (i < a.length) out.push('- ' + a[i++]);
  while (j < b.length) out.push('+ ' + b[j++]);
  return out.join('\n');
}

/**
 * Reduces the violations reported by axe-core to one sorted line per affected
 * element: rule identifier, impact, and CSS selector. The complete result is
 * not kept because it contains details, such as HTML fragments, that change
 * for reasons unrelated to accessibility.
 * @param {{ id: string, impact?: string | null, nodes: { target: unknown[] }[] }[]} violations
 * @returns {string[]}
 */
export function formatViolations(violations) {
  return violations
    .flatMap(v => v.nodes.map(n => `${v.id} (${v.impact ?? 'unknown'}) ${n.target.map(String).join(' ')}`))
    .sort();
}

/**
 * Classifies violations as fixed (only before), introduced (only after), or
 * remaining (in both).
 * @param {string[]} before
 * @param {string[]} after
 * @returns {{ fixed: string[], introduced: string[], remaining: string[] }}
 */
export function compareViolations(before, after) {
  const inBefore = new Set(before);
  const inAfter = new Set(after);
  return {
    fixed: before.filter(v => !inAfter.has(v)),
    introduced: after.filter(v => !inBefore.has(v)),
    remaining: after.filter(v => inBefore.has(v)),
  };
}
