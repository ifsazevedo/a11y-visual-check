// @ts-check
// Reading and writing the reference files kept next to the screenshots.
import fs from 'node:fs';
import path from 'node:path';

/**
 * Decides whether this run stores the references (stage 1) or compares with
 * them (stage 2). Stage 1 happens with --update-snapshots ("all" or "changed")
 * or when the references do not exist yet.
 * @param {string} updateSnapshots value of testInfo.config.updateSnapshots
 * @param {boolean} referenceExists
 * @returns {boolean}
 */
export function isStageOne(updateSnapshots, referenceExists) {
  return updateSnapshots === 'all' || updateSnapshots === 'changed' || !referenceExists;
}

/**
 * Reads a reference text file. Line endings are normalised, because Git on
 * Windows may convert the file to CRLF, and the final newline is removed.
 * @param {string} file
 * @returns {string}
 */
export function readReference(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '');
}

/**
 * Writes a reference text file, creating its folder if needed.
 * @param {string} file
 * @param {string} text
 */
export function writeReference(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text + '\n');
}

/**
 * Splits a stored list of violations into lines; an empty file means no violations.
 * @param {string} text
 * @returns {string[]}
 */
export function parseViolations(text) {
  return text === '' ? [] : text.split('\n');
}

/**
 * Checks that a page name can be used in file names.
 * @param {unknown} name
 * @returns {string}
 */
export function validateName(name) {
  if (typeof name !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(name))
    throw new Error(`checkPage: invalid name ${JSON.stringify(name)}; use letters, digits, "-" or "_", e.g. "book-list".`);
  return name;
}
