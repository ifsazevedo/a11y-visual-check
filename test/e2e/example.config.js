// Runs the distributed example (example/a11y-visual.spec.js) in the
// end-to-end tests, keeping its references and outputs out of example/.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const launchOptions = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};

export default defineConfig({
  testDir: '../../example',
  outputDir: path.join(here, '.example-output'),
  snapshotPathTemplate: path.join(here, '.example-snapshots', '{testFilePath}-snapshots', '{arg}{-projectName}{-snapshotSuffix}{ext}'),
  reporter: 'list',
  use: { viewport: { width: 1280, height: 720 }, launchOptions },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
