import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { evidenceDir, prepareEvidence, writeReport } from '../../src/evidence.js';

/** A temporary folder with the images Playwright would produce for a failed comparison. */
function setup() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-'));
  const out = path.join(tmp, 'test-results');
  fs.mkdirSync(out);
  for (const kind of ['actual', 'diff']) fs.writeFileSync(path.join(out, `page-${kind}.png`), kind);
  return { dir: path.join(tmp, 'visual-evidence', 'page', 'chromium'), source: (/** @type {string} */ k) => path.join(out, `page-${k}.png`) };
}

test('evidenceDir: <outputDir>/<name>/<browser> under the project root', () => {
  assert.equal(evidenceDir('/p', 'visual-evidence', 'book-list', 'chromium'), path.resolve('/p', 'visual-evidence', 'book-list', 'chromium'));
  assert.equal(evidenceDir('/p', 'evidence/AnaMaria1223344', 'home', 'chromium'), path.resolve('/p', 'evidence', 'AnaMaria1223344', 'home', 'chromium'));
});

test('evidenceDir: an absolute outputDir is used as given', () => {
  const abs = path.resolve('/tmp', 'reports');
  assert.equal(evidenceDir('/p', abs, 'home', 'chromium'), path.join(abs, 'home', 'chromium'));
});

test('prepareEvidence: creates the folder and copies the images when the screenshot differs', () => {
  const { dir, source } = setup();
  assert.deepEqual(prepareEvidence(dir, source, true), ['actual.png', 'diff.png']);
  assert.equal(fs.readFileSync(path.join(dir, 'diff.png'), 'utf8'), 'diff');
});

test('prepareEvidence: removes the images of an earlier run when the screenshot matches', () => {
  const { dir, source } = setup();
  prepareEvidence(dir, source, true);
  assert.deepEqual(prepareEvidence(dir, source, false), []);
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('prepareEvidence: copies only the images that exist', () => {
  const { dir, source } = setup();
  fs.rmSync(source('diff'));
  assert.deepEqual(prepareEvidence(dir, source, true), ['actual.png']);
});

test('writeReport: writes report.md and returns its path', () => {
  const { dir, source } = setup();
  prepareEvidence(dir, source, false);
  const file = writeReport(dir, '# Report\n');
  assert.equal(file, path.join(dir, 'report.md'));
  assert.equal(fs.readFileSync(file, 'utf8'), '# Report\n');
});
