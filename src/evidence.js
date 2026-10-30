// @ts-check
// Writing the evidence of stage 2: a report folder with report.md and, when
// the screenshot differs, the images actual.png and diff.png.
import fs from 'node:fs';
import path from 'node:path';

/** Images of a failed screenshot comparison, as named by Playwright. */
export const IMAGES = ['actual', 'diff'];

/**
 * Folder of the report of a page in a browser: <outputDir>/<name>/<browser>.
 * @param {string} root project root (folder of the Playwright configuration)
 * @param {string} outputDir folder of the reports, relative to root or absolute
 * @param {string} name name of the page under analysis
 * @param {string} browser Playwright project name, e.g. 'chromium'
 * @returns {string}
 */
export function evidenceDir(root, outputDir, name, browser) {
  return path.resolve(root, outputDir, name, browser);
}

/**
 * Prepares the report folder: creates it, removes the images of an earlier
 * run, and, when the screenshot differs, copies the images of this run.
 * @param {string} dir report folder
 * @param {(kind: string) => string} source path of the image produced by
 *   Playwright for 'actual' or 'diff'
 * @param {boolean} screenshotDiffers
 * @returns {string[]} file names of the copied images, e.g. ['actual.png']
 */
export function prepareEvidence(dir, source, screenshotDiffers) {
  fs.mkdirSync(dir, { recursive: true });
  const images = [];
  for (const kind of IMAGES) {
    const target = path.join(dir, `${kind}.png`);
    fs.rmSync(target, { force: true });
    if (screenshotDiffers && fs.existsSync(source(kind))) {
      fs.copyFileSync(source(kind), target);
      images.push(`${kind}.png`);
    }
  }
  return images;
}

/**
 * Writes report.md in the report folder.
 * @param {string} dir report folder
 * @param {string} text
 * @returns {string} path of the file
 */
export function writeReport(dir, text) {
  const file = path.join(dir, 'report.md');
  fs.writeFileSync(file, text);
  return file;
}
