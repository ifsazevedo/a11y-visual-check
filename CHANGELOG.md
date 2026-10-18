# Changelog

All notable changes to this project are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions
follow [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-18

### Added

- `checkPage`: compares the screenshot, the accessibility tree, and the
  axe-core violations of a page with references captured before a change, and
  writes `visual-evidence/<name>/<browser>/report.md`.
- Options `selector`, `mask`, and `fullPage`.
- Example test file with two exercises, and a minimal example application.
- Unit and end-to-end tests; continuous integration, CodeQL, dependency review,
  and Dependabot configuration.
