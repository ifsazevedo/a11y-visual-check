// @ts-check
// checkPage: captures the screenshot, the accessibility tree and the axe-core
// violations of a page, and compares them with references captured before a
// change.
import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { diffLines, formatViolations, compareViolations } from './compare.js';
import { buildReport } from './report.js';
import { isStageOne, readReference, writeReference, parseViolations, validateName } from './references.js';

/**
 * @typedef {object} CheckPageOptions
 * @property {string} [selector] region whose accessibility tree is compared
 *   (default: 'body'); it must identify a single element
 * @property {import('@playwright/test').Locator[]} [mask] elements hidden in
 *   the screenshot, such as content that changes between runs
 * @property {boolean} [fullPage] compare the whole page, not only the visible
 *   part (default: false)
 */

/**
 * Stage 1 (run with --update-snapshots, or no references yet): stores the
 * screenshot, the accessibility tree and the axe-core violations as references.
 * Stage 2 (any later run): compares them with the references and writes
 * visual-evidence/<name>/<browser>/report.md. The test fails only when the
 * screenshot differs; the report is written in any case.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} name name of the references and of the report folder
 * @param {CheckPageOptions} [options]
 */
export async function checkPage(page, testInfo, name, { selector = 'body', mask = [], fullPage = false } = {}) {
  validateName(name);
  const tree = await page.locator(selector).ariaSnapshot();
  // axe-core always analyses the whole page: some rules apply to <html>
  const violations = formatViolations((await new AxeBuilder({ page }).analyze()).violations);

  const treeRef = testInfo.snapshotPath(`${name}.aria.yml`);
  const axeRef = testInfo.snapshotPath(`${name}.axe.txt`);
  const stage1 = isStageOne(testInfo.config.updateSnapshots, fs.existsSync(treeRef));

  // soft assertion: the report is written even when the screenshot differs
  const errors = testInfo.errors.length;
  await expect.soft(page).toHaveScreenshot(`${name}.png`, { mask, fullPage });
  const visualOk = testInfo.errors.length === errors;

  if (stage1) {
    writeReference(treeRef, tree);
    writeReference(axeRef, violations.join('\n'));
    console.log(`\nStage 1: references stored for "${name}".\n`);
    return;
  }

  const root = path.dirname(testInfo.config.configFile ?? path.resolve('playwright.config.js'));
  const dir = path.join(root, 'visual-evidence', name, testInfo.project.name || 'default');
  fs.mkdirSync(dir, { recursive: true });
  const images = [];
  for (const kind of ['actual', 'diff']) {
    const target = path.join(dir, `${kind}.png`);
    fs.rmSync(target, { force: true }); // images of an earlier run
    const source = testInfo.outputPath(`${name}-${kind}.png`);
    if (!visualOk && fs.existsSync(source)) {
      fs.copyFileSync(source, target);
      images.push(`${kind}.png`);
    }
  }

  const report = buildReport({
    name,
    date: new Date().toISOString(),
    url: page.url(),
    browser: testInfo.project.name || 'default',
    visualOk,
    images,
    treeBefore: readReference(treeRef),
    treeAfter: tree,
    violations: compareViolations(parseViolations(readReference(axeRef)), violations),
  }, diffLines);
  const file = path.join(dir, 'report.md');
  fs.writeFileSync(file, report);
  await testInfo.attach('report', { body: report, contentType: 'text/markdown' });
  console.log(`\nReport written to ${path.relative(process.cwd(), file)}\n`);
}
