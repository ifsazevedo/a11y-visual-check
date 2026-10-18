// Visual and accessibility comparison of a page before and after a change.
//
// Each test opens one page and calls checkPage, which compares the
// screenshot, the accessibility tree and the axe-core violations with
// references captured before the change.
//
//   Stage 1, before the change (stores the references):
//     npx playwright test a11y-visual -g "<test name>" --update-snapshots
//   Make the change.
//   Stage 2, after the change (compares and writes the report):
//     npx playwright test a11y-visual -g "<test name>"
//
// The report is written to visual-evidence/<name>/<browser>/report.md.
import { test } from '@playwright/test';
import { checkPage } from 'a11y-visual-check';

// Exercise 1: a published page. The corrected version was published at
// another address and the previous one has not been removed yet; between the
// two stages, replace PAGE by https://dulcet-naiad-d25f06.netlify.app/
const PAGE = 'https://cerulean-muffin-f4b88f.netlify.app/';

test('goldydocs', async ({ page }, testInfo) => {
  await page.goto(PAGE);
  await checkPage(page, testInfo, 'goldydocs', { fullPage: true });
});

// Exercise 2 (optional): a local page. Start it first with
//   node example-app/server.js
// and, between the two stages, edit example-app/index.html.
test('download progress', async ({ page }, testInfo) => {
  await page.goto('http://localhost:3100/');
  await checkPage(page, testInfo, 'download-progress', { selector: 'main' });
});

// Your page: copy this template, give it a name, and set its address.
// test('book list', async ({ page }, testInfo) => {
//   await page.goto('http://localhost:9000/book');
//   await checkPage(page, testInfo, 'book-list');
// });
