// @ts-check
// Options of checkPage: default values and validation. No browser, no file system.
import { AXE_TAGS } from './rules.js';

/**
 * @typedef {object} CheckPageOptions
 * @property {string} [selector] region whose accessibility tree is compared
 *   (default: 'body'); it must identify a single element
 * @property {import('@playwright/test').Locator[]} [mask] elements hidden in
 *   the screenshot, such as content that changes between runs
 * @property {boolean} [fullPage] compare the whole page, not only the visible
 *   part (default: false)
 * @property {string} [outputDir] folder of the reports, relative to the
 *   project root or absolute (default: 'visual-evidence')
 * @property {string[]} [axeTags] tags of the axe-core rules to run
 *   (default: AXE_TAGS, WCAG 2.2 levels A and AA and best practices)
 */

/**
 * @typedef {object} ResolvedOptions
 * @property {string} selector
 * @property {import('@playwright/test').Locator[]} mask
 * @property {boolean} fullPage
 * @property {string} outputDir
 * @property {string[]} axeTags
 */

/** Values used when an option is not given. */
export const DEFAULTS = Object.freeze({
  selector: 'body',
  fullPage: false,
  outputDir: 'visual-evidence',
  axeTags: AXE_TAGS,
});

/**
 * Fills in the default values and rejects invalid options with a clear
 * message, before any browser work is done. An option given as undefined
 * takes its default value, e.g. { selector: process.env.SELECTOR } when the
 * variable is not set. The arrays are copied, so that changing the result
 * changes neither the options given nor the defaults of later calls.
 * @param {CheckPageOptions} [options]
 * @returns {ResolvedOptions}
 */
export function resolveOptions(options = {}) {
  const given = Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined));
  const o = { ...DEFAULTS, mask: [], ...given };
  const fail = (/** @type {string} */ message) => { throw new Error(`checkPage: ${message}`); };
  if (typeof o.selector !== 'string' || o.selector.trim() === '')
    fail('selector must be a non-empty string, e.g. "main".');
  if (!Array.isArray(o.mask))
    fail('mask must be an array of locators, e.g. [page.locator(".clock")].');
  if (typeof o.fullPage !== 'boolean')
    fail('fullPage must be true or false.');
  if (typeof o.outputDir !== 'string' || o.outputDir.trim() === '')
    fail('outputDir must be a non-empty string, e.g. "visual-evidence".');
  if (!Array.isArray(o.axeTags) || o.axeTags.length === 0 || !o.axeTags.every(t => typeof t === 'string' && t !== ''))
    fail('axeTags must be a non-empty array of tags, e.g. ["wcag2a", "wcag2aa"].');
  return { ...o, mask: [...o.mask], axeTags: [...o.axeTags] };
}
