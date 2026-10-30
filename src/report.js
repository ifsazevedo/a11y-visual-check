// @ts-check
// Pure function that builds the Markdown report. No browser, no file system.

/**
 * @typedef {object} ReportData
 * @property {string} name        name of the page under analysis
 * @property {string} date        ISO date of the comparison
 * @property {string} url         address of the page
 * @property {string} browser     Playwright project name, e.g. 'chromium'
 * @property {string} [engine]    version of axe-core that analysed the page
 * @property {boolean} visualOk   true when the screenshot matches the reference
 * @property {string[]} images    image files added to the report folder
 * @property {string} treeBefore  reference accessibility tree
 * @property {string} treeAfter   current accessibility tree
 * @property {{ fixed: string[], introduced: string[], remaining: string[] }} violations
 * @property {import('./rules.js').RuleRow[]} [rules] rules named in the
 *   violations, with their WCAG success criteria
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
  // Markdown table cell: backslashes first, so that the backslash added before
  // each pipe cannot be cancelled by one already in the text; then the pipes,
  // which would split the cell; then &, < and >, so that HTML in the text, such
  // as "<html>", is shown as text instead of being interpreted
  const cell = (/** @type {string} */ s) => s
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const rules = data.rules?.length ? [
    '',
    '### Rules',
    '',
    'WCAG 2.2 success criteria and conformance level checked by each rule above.',
    'Best practices are recommended by axe-core but are not WCAG requirements.',
    '',
    '| Rule | WCAG 2.2 | Description |',
    '|---|---|---|',
    ...data.rules.map(r =>
      `| \`${r.id}\` | ${r.wcag || '-'} | ${cell(r.help)}${r.url ? ` ([details](${r.url}))` : ''} |`),
  ] : [];
  return [
    `# Comparison report: ${data.name}`,
    '',
    `- Date: ${data.date}`,
    `- Page: ${data.url}`,
    `- Browser: ${data.browser}`,
    ...(data.engine ? [`- axe-core: ${data.engine}`] : []),
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
    ...rules,
  ].join('\n') + '\n';
}
