# a11y-visual-check

Compares a web page **before and after a change** and writes a report that
answers three questions:

| Comparison | Question |
|---|---|
| Screenshot | Did the rendering change? |
| Accessibility tree | Did the semantics exposed to assistive technologies change? |
| axe-core violations | Which accessibility problems were fixed, introduced, or remain? |

It is built on [Playwright](https://playwright.dev) and
[axe-core](https://github.com/dequelabs/axe-core), and was written for the
Software Quality course (QSOFT) of the Master in Informatics Engineering at
ISEP. It is maintained for teaching purposes.

## Requirements

- Node.js 22 or later
- A project with Playwright Test (`npm init playwright@latest`)
- Git, used by npm to install the package from GitHub

## Installation

```bash
npm install --save-dev github:ifsazevedo/a11y-visual-check#v1.1.0
```

This also installs `@axe-core/playwright`, which includes axe-core. The version after `#` is recorded in
`package.json`, so every clone of the project uses the same version.

## Usage

Each test opens one page and calls `checkPage`:

```js
import { test } from '@playwright/test';
import { checkPage } from 'a11y-visual-check';

test('book list', async ({ page }, testInfo) => {
  await page.goto('http://localhost:9000/book');
  await checkPage(page, testInfo, 'book-list');
});
```

A file with this content and two exercises is provided in
[`example/a11y-visual.spec.js`](example/a11y-visual.spec.js); copy it to your
`tests/` folder.

The comparison has two stages:

```bash
# Stage 1, before the change: store the references
npx playwright test a11y-visual -g "book list" --update-snapshots

# ... make the change to the page ...

# Stage 2, after the change: compare and write the report
npx playwright test a11y-visual -g "book list"
```

`a11y-visual` selects the test file, `-g` selects the test by name (a regular
expression matched against the full test title), and `--update-snapshots` (or
`-u`) stores the references. Never use `--update-snapshots` in stage 2: it
replaces the references and writes no report.

### What is stored and written

| Stage | Files |
|---|---|
| 1 | `<name>-<browser>-<platform>.png`, `<name>-aria-<browser>-<platform>.yml`, and `<name>-axe-<browser>-<platform>.txt`, in the `-snapshots` folder next to the test file |
| 2 | `visual-evidence/<name>/<browser>/report.md` in the project root (see `outputDir`) and, when the screenshot differs, `actual.png` and `diff.png` next to it |

Keep each report folder together: `report.md` refers to the images by file
name. The references and the reports are meant to be committed.

### Result of stage 2

- The test **fails only when the screenshot differs** from the reference. The
  report is written in any case.
- Differences in the accessibility tree and in the axe-core violations are
  reported but do not fail the test, because the expected result depends on
  the kind of change.

### Options

```js
await checkPage(page, testInfo, 'home', {
  selector: 'main',                                  // region of the accessibility tree
  mask: [page.getByText(/You are logged in as/)],    // hidden in the screenshot
  fullPage: true,                                    // whole page, not only the visible part
  outputDir: 'evidence/AnaMaria1223344',             // folder of the reports
  axeTags: ['wcag2a', 'wcag2aa'],                    // axe-core rules to run
});
```

| Option | Default | Description |
|---|---|---|
| `selector` | `'body'` | Region whose accessibility tree is compared; it must match a single element |
| `mask` | `[]` | Locators covered by a box in the screenshot, e.g. content that changes between runs |
| `fullPage` | `false` | Compare the whole page instead of the visible part |
| `outputDir` | `'visual-evidence'` | Folder of the reports, relative to the project root or absolute |
| `axeTags` | `AXE_TAGS` | Tags of the axe-core rules to run; WCAG 2.2 levels A and AA and best practices by default. Unknown tags are rejected |

Use the same options in both stages: references captured with other
`axeTags` would report rules as fixed or introduced only because they were
not run. To share options between the tests of a file, define them once:

```js
const OPTIONS = { outputDir: 'evidence/AnaMaria1223344' };

test('home', async ({ page }, testInfo) => {
  await page.goto('/');
  await checkPage(page, testInfo, 'home', { ...OPTIONS, selector: 'main' });
});
```

The default values are exported as `DEFAULTS`.

`name` may contain letters, digits, `-` and `_`. axe-core always analyses the
whole page, because some of its rules apply to the `html` element.

### Accessibility rules

axe-core checks the WCAG 2.2 success criteria of levels A and AA, including
those introduced in WCAG 2.0 and 2.1, and its own best practices. The report
lists each violation as `rule (impact) selector` and ends with a table that
gives, for every rule named, its WCAG 2.2 success criteria and level (or
*Best practice*), a short description, and a link to the rule's documentation:

```markdown
| Rule | WCAG 2.2 | Description |
|---|---|---|
| `color-contrast` | 1.4.3 (AA) | Elements must meet minimum color contrast ratio thresholds ([details](https://dequeuniversity.com/rules/axe/4.14/color-contrast)) |
| `heading-order` | Best practice | Heading levels should only increase by one ([details](https://dequeuniversity.com/rules/axe/4.14/heading-order)) |
```

The rules run are exported as `AXE_TAGS`, and can be changed with the option
`axeTags`.

## Exercises

`example/a11y-visual.spec.js` contains two exercises:

1. **A published page.** A contrast correction was published at another
   address while the previous version is still online. Run stage 1, replace
   the address as indicated in the file, and run stage 2.
2. **A local page (optional).** Copy the example application and start it:

   ```bash
   cp -r node_modules/a11y-visual-check/example/app example-app   # macOS, Linux, Git Bash
   node example-app/server.js                                       # http://localhost:3100/
   ```

   Run stage 1, add `role="status" aria-live="polite"` to the status text in
   `example-app/index.html`, and run stage 2. `index.solution.html` shows the
   expected result. If port 3100 is in use, start the server with another port,
   e.g. `node example-app/server.js 3101`, and change the address in the test.

## Limitations

- Automated checks detect only part of the accessibility problems of a page;
  the rest requires manual evaluation. Neither comparison shows that an
  improvement is adequate, for instance that a text alternative describes the
  image correctly.
- Rendering differs between operating systems and browsers. Each browser and
  platform has its own references; run both stages on the same machine.

## Development

```bash
npm ci
npx playwright install chromium
npm test            # type check, unit tests (node --test), and end-to-end tests
```

The end-to-end tests run Playwright twice, as a user would, on the pages in
`test/e2e/fixtures/` and on the example application.

## Security

See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
