import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport } from '../../src/report.js';
import { diffLines } from '../../src/compare.js';

const base = {
  name: 'book-list',
  date: '2026-10-18T10:00:00.000Z',
  url: 'http://localhost:9000/book',
  browser: 'chromium',
  visualOk: true,
  images: [],
  treeBefore: '- main',
  treeAfter: '- main',
  violations: { fixed: [], introduced: [], remaining: [] },
};

test('report: header and the three sections', () => {
  const r = buildReport(base, diffLines);
  for (const s of ['# Comparison report: book-list', '- Page: http://localhost:9000/book',
    '- Browser: chromium', '## 1. Screenshot', '## 2. Accessibility tree', '## 3. axe-core violations'])
    assert.ok(r.includes(s), s);
});

test('report: no visual difference, unchanged tree, empty lists', () => {
  const r = buildReport(base, diffLines);
  assert.ok(r.includes('No visible difference from the reference.'));
  assert.ok(r.includes('Unchanged.'));
  assert.ok(!r.includes('!['));
  assert.equal(r.match(/^- none$/gm).length, 3);
});

test('report: images only when the screenshot differs', () => {
  const r = buildReport({ ...base, visualOk: false, images: ['actual.png', 'diff.png'] }, diffLines);
  assert.ok(r.includes('The rendering differs from the reference.'));
  assert.ok(r.includes('![actual](actual.png)'));
  assert.ok(r.includes('![diff](diff.png)'));
});

test('report: changed tree is shown as a diff block', () => {
  const r = buildReport({ ...base, treeBefore: '- text: "x"', treeAfter: '- status: "x"' }, diffLines);
  assert.ok(r.includes('```diff\n- - text: "x"\n+ - status: "x"\n```'));
});

test('report: violations listed with counts', () => {
  const r = buildReport({ ...base, violations: { fixed: ['html-has-lang (serious) html'], introduced: [], remaining: ['a', 'b'] } }, diffLines);
  assert.ok(r.includes('### Fixed (1)\n\n- `html-has-lang (serious) html`'));
  assert.ok(r.includes('### Introduced (0)\n\n- none'));
  assert.ok(r.includes('### Remaining (2)\n\n- `a`\n- `b`'));
});
