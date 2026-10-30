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

test('resolveOptions: an option given as undefined takes its default value', () => {
  const o = resolveOptions({ selector: undefined, fullPage: undefined, outputDir: undefined, axeTags: undefined, mask: undefined });
  assert.deepEqual(o, resolveOptions());
});

test('resolveOptions: DEFAULTS and AXE_TAGS cannot be changed by mistake', () => {
  assert.ok(Object.isFrozen(DEFAULTS));
  assert.ok(Object.isFrozen(AXE_TAGS));
  assert.throws(() => /** @type {any} */ (AXE_TAGS).push('experimental'), TypeError);
});

test('resolveOptions: changing the result affects neither the options given nor later calls', () => {
  const given = { axeTags: ['wcag2a'] };
  const first = resolveOptions(given);
  first.axeTags.push('best-practice');
  first.mask.push(/** @type {any} */ ({}));
  assert.deepEqual(given.axeTags, ['wcag2a']);
  const later = resolveOptions();
  later.axeTags.push('experimental');
  assert.deepEqual(resolveOptions().axeTags, [...AXE_TAGS]);
  assert.deepEqual(resolveOptions().mask, []);
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
