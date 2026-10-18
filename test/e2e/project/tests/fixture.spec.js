// A single test whose page and options come from environment variables set
// by the end-to-end tests (test/e2e/check-page.test.js).
import { test } from '@playwright/test';
import { checkPage } from 'a11y-visual-check';

test('fixture', async ({ page }, testInfo) => {
  await page.goto(process.env.PAGE);
  await checkPage(page, testInfo, process.env.NAME, {
    selector: process.env.SELECTOR || 'body',
    fullPage: process.env.FULL_PAGE === '1',
  });
});
