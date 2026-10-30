// @ts-check
// WCAG success criteria and descriptions of the axe-core rules named in a
// report. The functions are pure, except axeEngine and ruleMetadata, which
// read the axe-core used by @axe-core/playwright: the same engine that
// analyses the page, so that the descriptions always match the results.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Tags of the rules run by checkPage: the WCAG 2.2 success criteria of levels
 * A and AA (including those introduced in WCAG 2.0 and 2.1), and the best
 * practices of axe-core. Without them, axe-core skips the WCAG 2.2 rule
 * `target-size`.
 */
export const AXE_TAGS = Object.freeze(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']);

/**
 * @typedef {object} RuleMetadata
 * @property {string} ruleId
 * @property {string} help
 * @property {string} helpUrl
 * @property {string[]} tags
 */

/**
 * @typedef {object} RuleRow
 * @property {string} id    rule identifier, e.g. 'color-contrast'
 * @property {string} wcag  e.g. '1.4.3 (AA)', 'Best practice', or '' if unknown
 * @property {string} help  one-sentence description of the rule
 * @property {string} url   page that documents the rule ('' if unknown)
 */

/**
 * Turns the tags of a rule into its WCAG success criteria and level, e.g.
 * ['wcag2a', 'wcag244', 'wcag412'] -> '2.4.4 (A), 4.1.2 (A)'. Rules without
 * success criteria but tagged 'best-practice' -> 'Best practice'.
 * @param {string[]} tags
 * @returns {string}
 */
export function criteria(tags) {
  const levels = [...new Set(tags.flatMap(t => /^wcag2\d?(a{1,3})$/.exec(t)?.[1].toUpperCase() ?? []))];
  const level = levels.length ? ` (${levels.join('/')})` : '';
  const numbers = tags.flatMap(t => {
    const m = /^wcag(\d)(\d)(\d{1,2})$/.exec(t);
    return m ? [`${m[1]}.${m[2]}.${m[3]}`] : [];
  });
  if (numbers.length) return numbers.map(n => n + level).join(', ');
  return tags.includes('best-practice') ? 'Best practice' : '';
}

/**
 * Describes the rules whose identifiers are given, in alphabetical order.
 * @param {string[]} ids rule identifiers (duplicates are ignored)
 * @param {RuleMetadata[]} metadata
 * @returns {RuleRow[]}
 */
export function describeRules(ids, metadata) {
  const byId = new Map(metadata.map(r => [r.ruleId, r]));
  return [...new Set(ids)].sort().map(id => {
    const r = byId.get(id);
    return r
      ? { id, wcag: criteria(r.tags), help: r.help, url: r.helpUrl.replace(/\?.*$/, '') }
      : { id, wcag: '', help: 'Rule not known to the installed axe-core.', url: '' };
  });
}

/**
 * Tags that no rule has. axe-core ignores them silently, so a misspelt tag
 * would make it run fewer rules, or none, without any warning.
 * @param {string[]} tags
 * @param {RuleMetadata[]} metadata
 * @returns {string[]}
 */
export function unknownTags(tags, metadata) {
  const known = new Set(metadata.flatMap(r => r.tags));
  return tags.filter(t => !known.has(t));
}

/**
 * Identifier of the rule of a violation line, as written by formatViolations.
 * @param {string} line e.g. 'color-contrast (serious) a.btn'
 * @returns {string}
 */
export function ruleOf(line) {
  return line.split(' ')[0];
}

/**
 * The axe-core module loaded by @axe-core/playwright. It is resolved from the
 * folder of @axe-core/playwright, not from this package, so that a project
 * never describes the rules with a different version of axe-core than the one
 * that analysed the page.
 * @returns {{ version: string, getRules: () => RuleMetadata[] }}
 */
export function axeEngine() {
  return createRequire(require.resolve('@axe-core/playwright'))('axe-core');
}

/**
 * Metadata of all the rules of the engine that analyses the page.
 * @returns {RuleMetadata[]}
 */
export function ruleMetadata() {
  return axeEngine().getRules();
}
