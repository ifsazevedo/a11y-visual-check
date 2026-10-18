// Configuration of the fixture project used by the end-to-end tests.
import { defineConfig } from '@playwright/test';

// CHROMIUM_PATH: optional path to a preinstalled Chromium (for environments
// where `npx playwright install` cannot download browsers)
const launchOptions = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  reporter: 'list',
  use: { viewport: { width: 1280, height: 720 }, launchOptions },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
