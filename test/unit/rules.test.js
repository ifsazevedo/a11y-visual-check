import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { AXE_TAGS, axeEngine, criteria, describeRules, ruleMetadata, ruleOf, unknownTags } from '../../src/rules.js';

test('criteria: success criteria with their level', () => {
  assert.equal(criteria(['cat.color', 'wcag2aa', 'wcag143', 'EN-9.1.4.3']), '1.4.3 (AA)');
  assert.equal(criteria(['wcag2a', 'wcag244', 'wcag412']), '2.4.4 (A), 4.1.2 (A)');
  assert.equal(criteria(['wcag22aa', 'wcag258']), '2.5.8 (AA)');
  assert.equal(criteria(['wcag21aa', 'wcag1410']), '1.4.10 (AA)');
});

test('criteria: best practices and rules without criteria', () => {
  assert.equal(criteria(['cat.semantics', 'best-practice']), 'Best practice');
  assert.equal(criteria(['cat.other']), '');
  assert.equal(criteria(['wcag2a-obsolete', 'wcag411', 'deprecated']), '4.1.1');
});

test('describeRules: sorted, without duplicates, links without query', () => {
  const meta = [
    { ruleId: 'label', help: 'Form elements must have labels', helpUrl: 'https://x/label?application=axeAPI', tags: ['wcag2a', 'wcag412'] },
    { ruleId: 'heading-order', help: 'Heading levels should only increase by one', helpUrl: 'https://x/heading-order', tags: ['best-practice'] },
  ];
  assert.deepEqual(describeRules(['label', 'heading-order', 'label', 'gone'], meta), [
    { id: 'gone', wcag: '', help: 'Rule not known to the installed axe-core.', url: '' },
    { id: 'heading-order', wcag: 'Best practice', help: 'Heading levels should only increase by one', url: 'https://x/heading-order' },
    { id: 'label', wcag: '4.1.2 (A)', help: 'Form elements must have labels', url: 'https://x/label' },
  ]);
});

test('unknownTags: tags that no rule has, e.g. misspelt', () => {
  const meta = [{ ruleId: 'label', help: '', helpUrl: '', tags: ['wcag2a', 'wcag412'] }];
  assert.deepEqual(unknownTags(['wcag2a', 'wcag22a', 'typo'], meta), ['wcag22a', 'typo']);
  assert.deepEqual(unknownTags(AXE_TAGS, ruleMetadata()), []);
});

test('ruleOf: identifier of a violation line', () => {
  assert.equal(ruleOf('link-name (serious) .ms-1 > a[target="_blank"]'), 'link-name');
});

test('axeEngine: the same axe-core module that @axe-core/playwright loads', () => {
  const require = createRequire(import.meta.url);
  const used = createRequire(require.resolve('@axe-core/playwright'))('axe-core');
  assert.equal(axeEngine(), used);
  assert.match(axeEngine().version, /^\d+\.\d+\.\d+/);
});

test('installed axe-core: metadata of known rules, and every tag in AXE_TAGS is used', () => {
  const meta = ruleMetadata();
  const [contrast] = describeRules(['color-contrast'], meta);
  assert.equal(contrast.wcag, '1.4.3 (AA)');
  assert.match(contrast.url, /^https:\/\/dequeuniversity\.com\/rules\/axe\/[\d.]+\/color-contrast$/);
  assert.equal(describeRules(['target-size'], meta)[0].wcag, '2.5.8 (AA)');
  for (const tag of AXE_TAGS) assert.ok(meta.some(r => r.tags.includes(tag)), tag);
});
