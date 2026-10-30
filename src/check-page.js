// @ts-check
// checkPage: captures the screenshot, the accessibility tree and the axe-core
// violations of a page, and compares them with references captured before a
// change. This module coordinates the steps; the comparisons, the report and
// the files are handled by the other modules.
import path from 'node:path';
import fs from 'node:fs';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { diffLines, formatViolations, compareViolations } from './compare.js';
import { buildReport } from './report.js';
import { isStageOne, readReference, writeReference, parseViolations, validateName } from './references.js';
import { describeRules, ruleMetadata, ruleOf, unknownTags } from './rules.js';
import { evidenceDir, prepareEvidence, writeReport } from './evidence.js';
import { resolveOptions } from './options.js';

/**
 * Stage 1 (run with --update-snapshots, or no references yet): stores the
 * screenshot, the accessibility tree and the axe-core violations as references.
 * Stage 2 (any later run): compares them with the references and writes
 * <outputDir>/<name>/<browser>/report.md. The test fails only when the
 * screenshot differs; the report is written in any case. Both stages must use
 * the same options.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} name name of the references and of the report folder
 * @param {import('./options.js').CheckPageOptions} [options]
 */
export async function checkPage(page, testInfo, name, options) {
  validateName(name);
  const { selector, mask, fullPage, outputDir, axeTags } = resolveOptions(options);
  const unknown = unknownTags(axeTags, ruleMetadata());
  if (unknown.length)
    throw new Error(`checkPage: unknown axe-core tags ${JSON.stringify(unknown)}; see the tags of each rule in the axe-core documentation, e.g. "wcag2a" or "best-practice".`);
  const current = await capture(page, selector, axeTags);
  const refs = {
    tree: testInfo.snapshotPath(`${name}.aria.yml`),
    axe: testInfo.snapshotPath(`${name}.axe.txt`),
  };
  const stage1 = isStageOne(testInfo.config.updateSnapshots, fs.existsSync(refs.tree));

  // soft assertion: the report is written even when the screenshot differs
  const errors = testInfo.errors.length;
  await expect.soft(page).toHaveScreenshot(`${name}.png`, { mask, fullPage });
  const visualOk = testInfo.errors.length === errors;

  if (stage1) {
    writeReference(refs.tree, current.tree);
    writeReference(refs.axe, current.violations.join('\n'));
    console.log(`\nStage 1: references stored for "${name}".\n`);
    return;
  }

  const browser = testInfo.project.name || 'default';
  const root = path.dirname(testInfo.config.configFile ?? path.resolve('playwright.config.js'));
  const dir = evidenceDir(root, outputDir, name, browser);
  const images = prepareEvidence(dir, kind => testInfo.outputPath(`${name}-${kind}.png`), !visualOk);
  const violations = compareViolations(parseViolations(readReference(refs.axe)), current.violations);
  const report = buildReport({
    name,
    date: new Date().toISOString(),
    url: page.url(),
    browser,
    engine: current.engine,
    visualOk,
    images,
    treeBefore: readReference(refs.tree),
    treeAfter: current.tree,
    violations,
    rules: describeRules([...violations.fixed, ...violations.introduced, ...violations.remaining].map(ruleOf), ruleMetadata()),
  }, diffLines);
  const file = writeReport(dir, report);
  await testInfo.attach('report', { body: report, contentType: 'text/markdown' });
  console.log(`\nReport written to ${path.relative(process.cwd(), file)}\n`);
}

/**
 * Captures the accessibility tree of a region and the axe-core violations of
 * the whole page (some rules apply to the html element, outside the region).
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string[]} axeTags
 * @returns {Promise<{ tree: string, violations: string[], engine: string }>}
 */
async function capture(page, selector, axeTags) {
  const tree = await page.locator(selector).ariaSnapshot();
  const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  return { tree, violations: formatViolations(results.violations), engine: results.testEngine.version };
}
