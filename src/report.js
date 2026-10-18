// @ts-check
// Pure function that builds the Markdown report. No browser, no file system.

/**
 * @typedef {object} ReportData
 * @property {string} name        name of the page under analysis
 * @property {string} date        ISO date of the comparison
 * @property {string} url         address of the page
 * @property {string} browser     Playwright project name, e.g. 'chromium'
 * @property {boolean} visualOk   true when the screenshot matches the reference
 * @property {string[]} images    image files added to the report folder
 * @property {string} treeBefore  reference accessibility tree
 * @property {string} treeAfter   current accessibility tree
 * @property {{ fixed: string[], introduced: string[], remaining: string[] }} violations
 */

/**
 * Builds the text of report.md.
 * @param {ReportData} data
 * @param {(before: string, after: string) => string} diff line-difference function
 * @returns {string}
 */
export function buildReport(data, diff) {
  const list = (/** @type {string[]} */ items) =>
    items.length ? items.map(v => `- \`${v}\``).join('\n') : '- none';
  const { fixed, introduced, remaining } = data.violations;
  return [
    `# Comparison report: ${data.name}`,
    '',
    `- Date: ${data.date}`,
    `- Page: ${data.url}`,
    `- Browser: ${data.browser}`,
    '',
    '## 1. Screenshot',
    '',
    data.visualOk
      ? 'No visible difference from the reference.'
      : ['The rendering differs from the reference.', '', ...data.images.map(f => `![${f.replace(/\.png$/, '')}](${f})`)].join('\n'),
    '',
    '## 2. Accessibility tree',
    '',
    data.treeBefore === data.treeAfter
      ? 'Unchanged.'
      : 'Changed (`-` only before, `+` only after):\n\n```diff\n' + diff(data.treeBefore, data.treeAfter) + '\n```',
    '',
    '## 3. axe-core violations',
    '',
    `### Fixed (${fixed.length})`, '', list(fixed), '',
    `### Introduced (${introduced.length})`, '', list(introduced), '',
    `### Remaining (${remaining.length})`, '', list(remaining),
  ].join('\n') + '\n';
}
