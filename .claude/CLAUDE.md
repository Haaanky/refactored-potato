# .claude/CLAUDE.md — Per-Project Context

> **AI startup protocol:** Read the PROJECT MANIFEST below.
> If `status: pending` → run `/init-project` immediately before doing anything else.
> If `status: complete` → use the manifest as ground truth for this session.

---

## PROJECT MANIFEST

```yaml
# Filled automatically by /init-project on first session.
# Do NOT edit field names. Set values to ~ (null) to trigger re-detection.
status: complete   # pending | complete

# ── Identity ──────────────────────────────────────────────────────────────────
# detect: basename $PWD  OR  jq -r '.name' package.json  OR  grep 'config/name' project.godot
name: refactored-potato

# detect: jq -r '.description' package.json  OR  head -2 README.md | tail -1
description: ~

# detect: presence of package.json → Node/TypeScript, project.godot → GDScript/Godot,
#         requirements.txt → Python, Cargo.toml → Rust, go.mod → Go, pom.xml → Java
language: TypeScript/JavaScript

# detect: node --version / python --version / godot --version / rustc --version
runtime_version: v22.22.2

# detect: package-lock.json → npm, yarn.lock → yarn, pnpm-lock.yaml → pnpm,
#         uv.lock → uv, Pipfile.lock → pipenv
package_manager: npm

# ── Testing ───────────────────────────────────────────────────────────────────
# detect: jq '.devDependencies | keys' package.json → look for playwright, jest, vitest, mocha;
#         ls addons/ in Godot → gut; grep -r 'import pytest' tests/
test_framework: Vitest

# detect: jq -r '.scripts.test' package.json  OR
#         check playwright.config.* → "npx playwright test"  OR
#         check gut_cmdln.gd → "godot --headless -s addons/gut/gut_cmdln.gd ..."
test_command: npx vitest run

# detect: ls -d tests/ __tests__/ spec/ e2e/ test/ 2>/dev/null | head -5
test_paths: src

# ── CI / CD ───────────────────────────────────────────────────────────────────
# detect: ls .github/workflows/ → read each file, extract name + on: trigger + jobs keys
ci_workflows:
  - file: ci.yml
    trigger: pull_request
    purpose: ~
  - file: deploy.yml
    trigger: push
    purpose: ~
  # - file: ~       # e.g. deploy.yml
  #   trigger: ~    # e.g. push to main
  #   purpose: ~    # e.g. build + deploy to GitHub Pages

# detect: presence of vercel.json → Vercel, fly.toml → Fly.io, netlify.toml → Netlify,
#         gh-pages branch or pages: in workflow → GitHub Pages, Dockerfile → container
deploy_platform: GitHub Pages

# detect: read workflow file deploy step for URL output  OR  CNAME file  OR  README
production_url: https://haaanky.github.io/refactored-potato/

# detect: read pr-preview or preview workflow for URL construction pattern
preview_url_pattern: ~

# default unless a workflow or branch protection rule says otherwise
branch_base: main

# ── Constraints ───────────────────────────────────────────────────────────────
# Populated during init or as new limitations are discovered in later sessions.
# Format: "symptom — root cause — fix/workaround"
# Examples from real projects:
#   - "Task Scheduler install fails silently — requires admin terminal — user must run:
#      .venv\Scripts\python.exe -m scheduler.task_scheduler install (as Administrator)"
#   - "HTTPS proxy in CI blocks Chromium — do not run playwright locally inside Claude cloud"
#   - "call_deferred() required for scene changes — silent failure in Godot exported builds"
known_limitations: []
  # - ~

# Files that must be read at every session start (beyond CLAUDE.md itself).
# detect: look for AI_BACKENDS.md, ASSET_POLICY.md, CONTRIBUTING.md, ARCHITECTURE.md, ADMIN.md
# ADMIN.md — if present, always include: contains elevated commands for Task Scheduler etc.
companion_reads: []
  # - ~
```

---

## Stack-Specific Rules

### Node / TypeScript

- Environment variables must be declared before use; assert non-empty at startup — never call a client with empty credentials
- Package manager: `npm` — use it consistently, do not mix with others
- Test framework: Vitest — tests in `src`; run with: `npx vitest run`
## Session Notes

> Append discoveries here during a session so future sessions benefit.
> Format: `YYYY-MM-DD — <note>`. Keep entries short and factual.
> Remove entries older than ~30 days that are no longer relevant.

<!-- SESSION_NOTES_PLACEHOLDER -->

## Session Notes

2026-04-23 — Initial setup: React 19 + Vite 8 + Tailwind v4 + Vitest 4. Data model is pure functions over an AppState object; localStorage is the only persistence. `vite.config.ts` uses `vitest/config` import (not `vite`) to avoid TS error on the `test` field. `base` is `/refactored-potato/` for GitHub Pages sub-path routing.
