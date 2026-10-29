# AGENTS.md

This is a minimal static HTML repo. The only tracked file is `index.html`.

## Facts an agent would likely miss without help

- **No build system, package manager, or test suite.** There is no `package.json`, `Makefile`, or CI config. Do not run `npm install`, `npm test`, lint, typecheck, or build commands — nothing exists to run.
- **`index.html` is the only source file.** It contains a single `<h1>Full BG</h1>`. No framework, no bundler, no entrypoints beyond opening the HTML file in a browser.
- **Remote is configured.** `origin` points to `https://github.com/Tunde0087/test-github.git`; `main` tracks `origin/main`. Use `git push origin main` / `git pull origin main` as usual.
- **No existing instruction files.** There is no `README.md`, `CLAUDE.md`, `.cursorrules`, or `opencode.json`. This file is the single source of agent guidance.

## Conventions

- Keep changes small and commit messages in French if matching history (e.g. `"Ce que j'ai changé"`, `"Premier commit"`), but English is acceptable.
- Working tree should be clean before and after agent sessions.
