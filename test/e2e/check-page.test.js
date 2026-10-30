// End-to-end tests: run Playwright twice, as a student would (stage 1 with
// --update-snapshots, stage 2 without), and check the references and the
// report produced by checkPage.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { axeEngine } from '../../src/rules.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const project = path.join(here, 'project');
const cli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
const fixture = (name) => pathToFileURL(path.join(here, 'fixtures', name)).href;

/** Runs `playwright test` and returns { status, output }. */
function playwright(args, { cwd = project, env = {} } = {}) {
  const r = spawnSync(process.execPath, [cli, 'test', ...args], {
    cwd, encoding: 'utf8', env: { ...process.env, ...env, CI: '1' },
  });
  return { status: r.status, output: (r.stdout ?? '') + (r.stderr ?? '') };
}

/** Stage 1 or 2 of the fixture test, for a page and a reference name. */
function stage(n, page, name, extra = {}) {
  return playwright(n === 1 ? ['--update-snapshots'] : [], { env: { PAGE: fixture(page), NAME: name, ...extra } });
}

const snapshots = path.join(project, 'tests', 'fixture.spec.js-snapshots');
const evidence = (name) => path.join(project, 'visual-evidence', name, 'chromium');
const report = (name) => fs.readFileSync(path.join(evidence(name), 'report.md'), 'utf8');
const refs = (name) => fs.existsSync(snapshots) ? fs.readdirSync(snapshots).filter(f => f.startsWith(name + '-')) : [];

before(() => {
  for (const dir of ['visual-evidence', 'evidence', 'test-results', path.join('tests', 'fixture.spec.js-snapshots')])
    fs.rmSync(path.join(project, dir), { recursive: true, force: true });
});

test('ARIA change: no visual difference, tree changed, no new violations', () => {
  const s1 = stage(1, 'before.html', 'aria', { SELECTOR: 'main' });
  assert.equal(s1.status, 0, s1.output);
  assert.match(s1.output, /Stage 1: references stored for "aria"/);
  assert.equal(refs('aria').length, 3, 'png, aria.yml and axe.txt references');

  const s2 = stage(2, 'after.html', 'aria', { SELECTOR: 'main' });
  assert.equal(s2.status, 0, s2.output);
  const r = report('aria');
  assert.ok(r.includes(`- axe-core: ${axeEngine().version}\n`), 'the report names the engine that analysed the page');
  assert.match(r, /No visible difference from the reference\./);
  assert.match(r, /^-\s+- text: "Upload the project brief/m);
  assert.match(r, /^\+\s+- status: "Upload the project brief/m);
  assert.match(r, /### Introduced \(0\)/);
});

test('fixed violation: missing lang is reported as fixed', () => {
  assert.equal(stage(1, 'before-nolang.html', 'lang').status, 0);
  const s2 = stage(2, 'after.html', 'lang');
  assert.equal(s2.status, 0, s2.output);
  assert.match(report('lang'), /### Fixed \(1\)\n\n- `html-has-lang \(serious\) html`/);
  assert.match(report('lang'), /^\| `html-has-lang` \| 3\.1\.1 \(A\) \| &lt;html&gt; element must have a lang attribute \(\[details\]\(https:\/\/dequeuniversity\.com\/rules\/axe\/[\d.]+\/html-has-lang\)\) \|$/m);
});

test('WCAG 2.2: small targets are reported as target-size (2.5.8)', () => {
  assert.equal(stage(1, 'after.html', 'target').status, 0);
  stage(2, 'small-target.html', 'target'); // fails: the screenshot differs
  const r = report('target');
  assert.match(r, /### Introduced \(2\)\n\n- `target-size \(serious\) [^`]+`\n- `target-size \(serious\) [^`]+`/);
  assert.match(r, /^\| `target-size` \| 2\.5\.8 \(AA\) \| /m);
});

test('outputDir: the report is written to the folder given', () => {
  assert.equal(stage(1, 'before.html', 'outdir').status, 0);
  const s2 = stage(2, 'before.html', 'outdir', { OUTPUT_DIR: 'evidence/AnaMaria1223344' });
  assert.equal(s2.status, 0, s2.output);
  const file = path.join(project, 'evidence', 'AnaMaria1223344', 'outdir', 'chromium', 'report.md');
  assert.ok(fs.existsSync(file), file);
  assert.ok(!fs.existsSync(evidence('outdir')), 'nothing written to visual-evidence');
});

test('axeTags: only the rules with the given tags are run', () => {
  assert.equal(stage(1, 'after.html', 'tags', { AXE_TAGS: 'wcag2a,wcag2aa' }).status, 0);
  stage(2, 'small-target.html', 'tags', { AXE_TAGS: 'wcag2a,wcag2aa' }); // fails: the screenshot differs
  assert.match(report('tags'), /### Introduced \(0\)/, 'target-size (WCAG 2.2) is not run');
});

test('axeTags: a misspelt tag is rejected instead of running no rules', () => {
  const s = stage(1, 'after.html', 'typo', { AXE_TAGS: 'wcag22a' });
  assert.notEqual(s.status, 0);
  assert.match(s.output, /unknown axe-core tags \["wcag22a"\]/);
});

test('visual change: the test fails, the report shows the images, a later passing run removes them', () => {
  assert.equal(stage(1, 'after.html', 'visual').status, 0);
  const failed = stage(2, 'after-red.html', 'visual');
  assert.notEqual(failed.status, 0, 'stage 2 must fail when the screenshot differs');
  assert.match(report('visual'), /The rendering differs from the reference\.[\s\S]*!\[actual\]\(actual\.png\)/);
  for (const f of ['actual.png', 'diff.png']) assert.ok(fs.existsSync(path.join(evidence('visual'), f)), f);

  const passed = stage(2, 'after.html', 'visual');
  assert.equal(passed.status, 0, passed.output);
  assert.match(report('visual'), /No visible difference/);
  assert.ok(!fs.existsSync(path.join(evidence('visual'), 'actual.png')), 'stale images removed');
});

test('CRLF references (Git on Windows) are read correctly', () => {
  assert.equal(stage(1, 'before.html', 'crlf').status, 0);
  for (const f of refs('crlf').filter(f => !f.endsWith('.png'))) {
    const file = path.join(snapshots, f);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/\n/g, '\r\n'));
  }
  assert.equal(stage(2, 'before.html', 'crlf').status, 0);
  assert.match(report('crlf'), /## 2\. Accessibility tree\n\nUnchanged\./);
  assert.match(report('crlf'), /### Fixed \(0\)/);
});

test('--update-snapshots in stage 2 stores references and writes no report', () => {
  assert.equal(stage(1, 'before.html', 'again').status, 0);
  const s = stage(1, 'after.html', 'again');
  assert.match(s.output, /Stage 1: references stored for "again"/);
  assert.ok(!fs.existsSync(path.join(evidence('again'), 'report.md')));
});

test('fullPage compares the whole page, not only the visible part', () => {
  assert.equal(stage(1, 'long.html', 'long', { FULL_PAGE: '1' }).status, 0);
  const png = fs.readFileSync(path.join(snapshots, refs('long').find(f => f.endsWith('.png'))));
  assert.ok(png.readUInt32BE(20) > 720, `height ${png.readUInt32BE(20)} should exceed the 720 px viewport`);
});

test('an invalid name is rejected with a clear message', () => {
  const s = stage(1, 'before.html', '../bad');
  assert.notEqual(s.status, 0);
  assert.match(s.output, /invalid name/);
});

test('the distributed example works: exercise 2 in two stages', async () => {
  // copy of the example app, edited between the stages as a student would
  const app = fs.mkdtempSync(path.join(os.tmpdir(), 'example-app-'));
  fs.cpSync(path.join(root, 'example', 'app'), app, { recursive: true });
  const server = spawn(process.execPath, [path.join(app, 'server.js'), '3100'], { stdio: 'pipe' });
  try {
    await new Promise((resolve, reject) => {
      server.stdout.on('data', d => String(d).includes('running') && resolve());
      server.on('exit', c => reject(new Error(`server exited with code ${c}`)));
    });
    const config = ['--config', path.join(here, 'example.config.js'), '-g', 'download progress'];
    for (const dir of ['.example-snapshots', 'visual-evidence']) fs.rmSync(path.join(here, dir), { recursive: true, force: true });

    const s1 = playwright([...config, '--update-snapshots'], { cwd: here });
    assert.equal(s1.status, 0, s1.output);
    fs.copyFileSync(path.join(app, 'index.solution.html'), path.join(app, 'index.html'));
    const s2 = playwright(config, { cwd: here });
    assert.equal(s2.status, 0, s2.output);

    const r = fs.readFileSync(path.join(here, 'visual-evidence', 'download-progress', 'chromium', 'report.md'), 'utf8');
    assert.match(r, /No visible difference/);
    assert.match(r, /^\+\s+- status:/m);
  } finally {
    server.kill();
  }
});
