import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, resolveOptions } from '../../src/options.js';
import { AXE_TAGS } from '../../src/rules.js';

test('resolveOptions: defaults when no options are given', () => {
  assert.deepEqual(resolveOptions(), { selector: 'body', mask: [], fullPage: false, outputDir: 'visual-evidence', axeTags: AXE_TAGS });
  assert.deepEqual(resolveOptions({}), resolveOptions());
});

test('resolveOptions: given options replace the defaults', () => {
  const o = resolveOptions({ selector: 'main', fullPage: true, outputDir: 'evidence/AnaMaria1223344', axeTags: ['wcag2a'] });
  assert.equal(o.selector, 'main');
  assert.equal(o.fullPage, true);
  assert.equal(o.outputDir, 'evidence/AnaMaria1223344');
  assert.deepEqual(o.axeTags, ['wcag2a']);
});

test('resolveOptions: DEFAULTS cannot be changed by mistake', () => {
  assert.ok(Object.isFrozen(DEFAULTS));
});

test('resolveOptions: invalid options are rejected with a clear message', () => {
  const cases = [
    [{ selector: '' }, /selector must be a non-empty string/],
    [{ mask: 'header' }, /mask must be an array of locators/],
    [{ fullPage: 'yes' }, /fullPage must be true or false/],
    [{ outputDir: ' ' }, /outputDir must be a non-empty string/],
    [{ axeTags: [] }, /axeTags must be a non-empty array/],
    [{ axeTags: 'wcag2a' }, /axeTags must be a non-empty array/],
    [{ axeTags: ['wcag2a', ''] }, /axeTags must be a non-empty array/],
  ];
  for (const [options, message] of cases)
    assert.throws(() => resolveOptions(/** @type {any} */ (options)), message, JSON.stringify(options));
});
