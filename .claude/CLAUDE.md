# .claude/CLAUDE.md — Per-Project Context

> **AI startup protocol:** Read the PROJECT MANIFEST below.
> If `status: pending` → run `/init-project` immediately before doing anything else.
> If `status: complete` → use the manifest as ground truth for this session.

---

## PROJECT MANIFEST

```yaml
status: complete

# ── Identity ──────────────────────────────────────────────────────────────────
name: tv-series-event-logger (Astro variant)
description: TV-serie Händelselogg — Astro 5 + Svelte 5 + Supabase, rebuilt from scratch per spec
language: TypeScript/JavaScript
runtime_version: v22.22.2
package_manager: npm

# ── Testing ───────────────────────────────────────────────────────────────────
test_framework: Vitest
test_command: npx vitest run
test_paths: src/test
# Note: only pure-function tests exist (crypto, store helpers).
# Svelte component tests not yet written — add @testing-library/svelte when needed.

# ── CI / CD ───────────────────────────────────────────────────────────────────
ci_workflows:
  - file: ci.yml
    trigger: pull_request
    purpose: test + build with PR-specific ASTRO_BASE; deploys preview to gh-pages via rossjrw/pr-preview-action; cleans up on PR close
  - file: deploy.yml
    trigger: push to main
    purpose: test + build production (no ASTRO_BASE set); deploys to gh-pages via peaceiris/actions-gh-pages with keep_files:true

deploy_platform: GitHub Pages (gh-pages branch)
production_url: https://haaanky.github.io/refactored-potato/
preview_url_pattern: https://haaanky.github.io/refactored-potato/pr-preview/pr-<N>/
branch_base: main

# ── Constraints ───────────────────────────────────────────────────────────────
known_limitations:
  - "TypeScript must stay at ~5.7.x — @astrojs/svelte peer dep declares ^5.3.3 and rejects TS 6.x"
  - "Astro base path is read from ASTRO_BASE env var at build time (astro.config.mjs);
     PR builds set ASTRO_BASE=/refactored-potato/pr-preview/pr-<N>/;
     production omits it and the default /refactored-potato/ is used"
  - "Supabase client is nullable — VITE_SUPABASE_* are not required for CI/preview builds;
     app renders a 'not configured' banner when absent"
  - "GitHub Pages must be configured to serve from the gh-pages branch (not upload-pages-artifact)"

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

## Architecture

```
src/
├── lib/
│   ├── types.ts        # domain + DB row types
│   ├── crypto.ts       # sha256() via Web Crypto API
│   ├── supabase.ts     # nullable client + isSupabaseConfigured flag
│   ├── store.ts        # pure helpers: getSeasons, tallyFromEvents, patchIncrement, …
│   ├── roomStore.ts    # Supabase CRUD: createRoom, joinRoom, loadRoomData, logEvent, …
│   └── realtime.ts     # subscribeToEvents, applyEventPayload
├── components/
│   ├── App.svelte      # root island — session state, all handlers, layout
│   ├── RoomGate.svelte # join/create room form; hashes password with sha256
│   ├── EpisodeView.svelte
│   ├── EventCounter.svelte
│   └── StatsView.svelte
├── layouts/Base.astro
├── pages/index.astro   # single page, renders <App client:load />
├── styles/global.css   # @import "tailwindcss"
└── test/
    ├── crypto.test.ts
    └── store.test.ts
supabase/migrations/001_initial.sql
```

**Key data-model decision:** No `seasons` DB table. The `episodes` table stores `season` as an integer. `Season` objects are derived client-side via `getSeasons(state, seriesId)` with deterministic IDs (`${seriesId}-s${number}`).

---

## Stack-Specific Rules

### Supabase

- `supabase.ts` exports `supabase` (null when env vars absent) and `isSupabaseConfigured`
- Every function in `roomStore.ts` starts with `if (!supabase) return null/false/empty`
- `realtime.ts` `subscribeToEvents` returns `() => {}` no-op when supabase is null
- `App.svelte` renders a "not configured" banner when `!isSupabaseConfigured`
- **Never** add placeholder credentials to CI — leave the env block empty
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as GitHub repo Secrets (production only)

### Astro + Svelte 5

- `output: 'static'` — pre-rendered HTML + client-side islands only
- All interactive components use `client:load` in `.astro` pages
- Use Svelte 5 runes (`$state`, `$derived`, `$props`) — not Svelte 4 stores
- Base path via `ASTRO_BASE` env var — never hardcode it inside components
- TypeScript `~5.7.x` — do not bump to 6.x

### Deploy

- Both prod and preview target the `gh-pages` branch
- Production: `peaceiris/actions-gh-pages` with `keep_files: true`
- PR preview: `rossjrw/pr-preview-action`, auto-cleanup on close
- Changing to `upload-pages-artifact` / `deploy-pages` will break preview URLs

---

## Session Notes

2026-04-23 — Branch created from scratch (first commit only had LICENSE). Full Astro 5 + Svelte 5 + Supabase rebuild. 19 Vitest tests (pure functions). Preview deploy wired up with per-PR ASTRO_BASE baked into build. Supabase made nullable so secrets are production-only.

2026-04-23 — Created `.claude/preflight-sync.md` as cross-repo agent workspace with 4 pending tasks for `haaanky/preflight`. Added to `companion_reads` so future agents read it at session start.
