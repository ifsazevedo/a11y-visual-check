# Changelog

All notable changes to this project are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions
follow [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-10-30

### Added

- The axe-core section of the report ends with a table of the rules named in
  it: WCAG 2.2 success criteria and level (or *Best practice*), description,
  and a link to the rule's documentation. The descriptions come from the
  axe-core loaded by `@axe-core/playwright`, the engine that analysed the page.
- `AXE_TAGS`, the tags of the rules run by `checkPage`.
- Options `outputDir` (folder of the reports) and `axeTags` (rules to run),
  and `DEFAULTS`, the default values of the options. Invalid options and
  unknown axe-core tags are rejected with a clear message.
- The report header gives the version of axe-core that analysed the page.

### Changed

- axe-core now checks the WCAG 2.2 success criteria of levels A and AA,
  including `target-size` (2.5.8), which axe-core skips by default, together
  with its best practices. References captured with 1.0.0 remain valid; a page
  with small targets reports `target-size` as introduced.
- Internal: the report folder and the options are handled by two new modules,
  `evidence.js` and `options.js`, with their own unit tests; `checkPage` only
  coordinates the steps.

## [1.0.0] - 2026-10-18

### Added

- `checkPage`: compares the screenshot, the accessibility tree, and the
  axe-core violations of a page with references captured before a change, and
  writes `visual-evidence/<name>/<browser>/report.md`.
- Options `selector`, `mask`, and `fullPage`.
- Example test file with two exercises, and a minimal example application.
- Unit and end-to-end tests; continuous integration, CodeQL, dependency review,
  and Dependabot configuration.
