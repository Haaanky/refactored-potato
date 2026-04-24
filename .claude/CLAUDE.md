# .claude/CLAUDE.md — Per-Project Context

> **AI startup protocol:** Read the PROJECT MANIFEST below.
> If `status: pending` → run `/init-project` immediately before doing anything else.
> If `status: complete` → use the manifest as ground truth for this session.

---

## PROJECT MANIFEST

```yaml
status: complete

# ── Identity ──────────────────────────────────────────────────────────────────
name: refactored-potato
description: TV-serie Händelselogg — shared real-time event counter for TV-show watch groups
language: TypeScript/JavaScript
runtime_version: v22.22.2
package_manager: npm

# ── Testing ───────────────────────────────────────────────────────────────────
test_framework: Vitest
test_command: npx vitest run
test_paths: src

# ── CI / CD ───────────────────────────────────────────────────────────────────
ci_workflows:
  - file: ci.yml
    trigger: pull_request
    purpose: lint + test + build; deploys PR preview to gh-pages branch via rossjrw/pr-preview-action
  - file: deploy.yml
    trigger: push to main
    purpose: test + build + deploy production to gh-pages branch via peaceiris/actions-gh-pages

deploy_platform: GitHub Pages
production_url: https://haaanky.github.io/refactored-potato/
preview_url_pattern: https://haaanky.github.io/refactored-potato/pr-preview/pr-<N>/
branch_base: main

# ── Constraints ───────────────────────────────────────────────────────────────
known_limitations:
  - "@astrojs/svelte requires TypeScript ^5.x — do not upgrade to TS 6.x on the Astro branch"
  - "Astro base path is read from ASTRO_BASE env var at build time; PR builds set this to
     /refactored-potato/pr-preview/pr-<N>/, production omits it (defaults in astro.config.mjs)"
  - "Supabase client is nullable on the Astro branch — env vars are optional for builds;
     the app renders a 'not configured' banner when VITE_SUPABASE_* are absent"

# ── Cross-repo coordination ───────────────────────────────────────────────────
companion_reads:
  - '.claude/preflight-sync.md'   # cross-repo agent workspace; read at session start
```

---

## Cross-Repo Agent Workspace

`.claude/preflight-sync.md` is a structured task file shared between this repo and `haaanky/preflight`.
Its purpose: record patterns and rules discovered here that need to be propagated to the preflight
template repo, so a future agent session scoped to `haaanky/preflight` can read the file and
implement the pending tasks without needing full context from this session.

**Always read it at session start** (it is listed in `companion_reads` above).
If you resolve a TASK entry, mark it `status: done` in the file and commit the change.

---

## Branches

| Branch | Stack | Notes |
|--------|-------|-------|
| `main` | React 19 + Vite 8 + localStorage | original prototype |
| `claude/tv-series-event-logger-X9V1s` | React 19 + Vite 8 + Supabase | adds rooms + Realtime to React app |
| `claude/astro-svelte-variant-P4w9` | **Astro 5 + Svelte 5 + Supabase** | spec-compliant rebuild from scratch |

The Astro branch is the intended production branch. Merge it to `main` when ready.

---

## Stack-Specific Rules

### Node / TypeScript

- Package manager: `npm` — use it consistently, do not mix with others
- Test framework: Vitest — tests in `src/test`; run with: `npx vitest run`

### Supabase (Astro branch)

- The client in `src/lib/supabase.ts` is **nullable** — exports `supabase` (null when env vars absent) and `isSupabaseConfigured` (boolean)
- Every function in `roomStore.ts` must guard with `if (!supabase) return null/false/empty` before any DB call
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are only required for production; PR/preview builds succeed without them
- Never hardcode placeholder credential values in CI — leave the env block empty and let the app degrade gracefully

### Astro + Svelte (Astro branch)

- `output: 'static'` — no server runtime; everything is pre-rendered + client-side islands
- Interactive components use `client:load` directive in `.astro` pages
- Svelte 5 runes syntax (`$state`, `$derived`, `$props`) — not Svelte 4 stores
- Base path is controlled via `ASTRO_BASE` env var in `astro.config.mjs`; do not hardcode it in components
- TypeScript must stay at `~5.7.x` — `@astrojs/svelte` peer dep does not support TS 6.x yet

### Deploy / Preview

- Both production and preview write to the `gh-pages` branch (not `upload-pages-artifact`)
- Production uses `peaceiris/actions-gh-pages` with `keep_files: true` to preserve live PR previews
- PR previews use `rossjrw/pr-preview-action`; cleanup is automatic on PR close
- GitHub Pages must be configured to serve from the `gh-pages` branch
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as GitHub repo secrets for production deploy

---

## Session Notes

> Format: `YYYY-MM-DD — <note>`. Remove entries older than ~30 days.

2026-04-23 — Initial setup: React 19 + Vite 8 + Tailwind v4 + Vitest 4. Data model is pure functions over an AppState object; localStorage is the only persistence. `vite.config.ts` uses `vitest/config` import (not `vite`) to avoid TS error on the `test` field. `base` is `/refactored-potato/` for GitHub Pages sub-path routing.

2026-04-23 — Created Astro + Svelte 5 + Supabase variant on `claude/astro-svelte-variant-P4w9` from scratch. Season entity removed from DB schema — seasons are derived from `episode.season` integer (matches spec). Supabase client made nullable so builds work without secrets; app shows 'not configured' banner instead of crashing. PR preview deploy via `rossjrw/pr-preview-action` with per-PR base path baked in at build time via `ASTRO_BASE` env var.

2026-04-23 — Created `.claude/preflight-sync.md` as cross-repo agent workspace with 4 pending tasks for `haaanky/preflight`. Added to `companion_reads` so future agents read it at session start.
