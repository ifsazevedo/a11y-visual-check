import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isStageOne, readReference, writeReference, parseViolations, validateName } from '../../src/references.js';

test('isStageOne: --update-snapshots stores references', () => {
  assert.equal(isStageOne('all', true), true);
  assert.equal(isStageOne('changed', true), true);
});

test('isStageOne: without the option, existing references are compared', () => {
  for (const mode of ['missing', 'none', 'default'])
    assert.equal(isStageOne(mode, true), false, mode);
});

test('isStageOne: missing references are always stored', () => {
  assert.equal(isStageOne('missing', false), true);
});

test('write and read a reference, creating the folder', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ref-')), 'sub', 'x.yml');
  writeReference(file, 'a\nb');
  assert.equal(fs.readFileSync(file, 'utf8'), 'a\nb\n');
  assert.equal(readReference(file), 'a\nb');
});

test('readReference normalises CRLF line endings (Git on Windows)', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ref-')), 'x.yml');
  fs.writeFileSync(file, 'a\r\nb\r\n');
  assert.equal(readReference(file), 'a\nb');
});

test('parseViolations: empty text means no violations', () => {
  assert.deepEqual(parseViolations(''), []);
  assert.deepEqual(parseViolations('a\nb'), ['a', 'b']);
});

test('validateName accepts safe names and rejects others', () => {
  assert.equal(validateName('book-list_2'), 'book-list_2');
  for (const bad of ['', '../x', 'a b', 'a/b', '-x', 42, undefined])
    assert.throws(() => validateName(bad), /invalid name/);
});
