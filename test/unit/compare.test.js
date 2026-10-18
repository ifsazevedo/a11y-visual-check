import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffLines, formatViolations, compareViolations } from '../../src/compare.js';

test('diffLines: identical texts have only unchanged lines', () => {
  assert.equal(diffLines('a\nb', 'a\nb'), '  a\n  b');
});

test('diffLines: a replaced line appears as removed and added', () => {
  assert.equal(diffLines('a\nb\nc', 'a\nB\nc'), '  a\n- b\n+ B\n  c');
});

test('diffLines: added and removed lines at the ends', () => {
  assert.equal(diffLines('a', 'a\nb'), '  a\n+ b');
  assert.equal(diffLines('a\nb', 'b'), '- a\n  b');
});

test('diffLines: role change in an accessibility tree', () => {
  const before = '- main:\n  - text: "Done"';
  const after = '- main:\n  - status: "Done"';
  assert.equal(diffLines(before, after), '  - main:\n-   - text: "Done"\n+   - status: "Done"');
});

test('formatViolations: one sorted line per affected element', () => {
  const lines = formatViolations([
    { id: 'link-name', impact: 'serious', nodes: [{ target: ['.b'] }, { target: ['.a'] }] },
    { id: 'html-has-lang', impact: 'serious', nodes: [{ target: ['html'] }] },
  ]);
  assert.deepEqual(lines, [
    'html-has-lang (serious) html',
    'link-name (serious) .a',
    'link-name (serious) .b',
  ]);
});

test('formatViolations: missing impact and nested targets', () => {
  assert.deepEqual(
    formatViolations([{ id: 'x', impact: null, nodes: [{ target: ['iframe', '#a'] }] }]),
    ['x (unknown) iframe #a'],
  );
});

test('compareViolations: fixed, introduced and remaining', () => {
  assert.deepEqual(compareViolations(['a', 'b'], ['b', 'c']), {
    fixed: ['a'], introduced: ['c'], remaining: ['b'],
  });
});

test('compareViolations: empty lists', () => {
  assert.deepEqual(compareViolations([], []), { fixed: [], introduced: [], remaining: [] });
});
