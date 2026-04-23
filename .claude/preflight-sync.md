# Agent Workspace — `refactored-potato` ↔ `preflight` sync

> **Protocol for agents reading this file:**
> 1. Read every task below.
> 2. For each task with `status: pending`, implement it in the target repo.
> 3. After completing a task, update its `status` to `done` and fill in `completed_at`.
> 4. Commit the updated file back to `haaanky/refactored-potato` on `main`.
>
> This file is the source of truth. Do not rely on session memory across repos.

**Source repo:** `haaanky/refactored-potato`  
**Target repo:** `haaanky/preflight`  
**Last updated:** 2026-04-23  

---

## TASK-001 — PR preview deploy pattern (Astro)

```yaml
status: pending
completed_at: ~
```

### Context

When building static Astro apps that deploy to GitHub Pages, the standard template
does not include PR preview deployment. We solved this in `refactored-potato` using
`rossjrw/pr-preview-action`, which writes previews to a `gh-pages` branch under
`pr-preview/pr-<N>/`.

The trick that makes it work for Astro is that the base path must be different at
build time for previews vs production. We solved this via an `ASTRO_BASE` env var
read in `astro.config.mjs`:

```js
// astro.config.mjs
const base = process.env.ASTRO_BASE ?? '/your-repo/'
export default defineConfig({ base, ... })
```

CI injects `ASTRO_BASE=/your-repo/pr-preview/pr-${{ github.event.pull_request.number }}/`
for preview builds. Production omits the var entirely.

### What to add to the preflight template

**File: `templates/astro/ci.yml`** (or equivalent Astro CI template)

Add a `preview` job that:
1. Triggers on `pull_request` with `types: [opened, synchronize, reopened, closed]`
2. Builds with `ASTRO_BASE` set to `/{{REPO_NAME}}/pr-preview/pr-${{ github.event.pull_request.number }}/`
3. Deploys using `rossjrw/pr-preview-action@v1` with `preview-branch: gh-pages`, `umbrella-dir: pr-preview`
4. On `closed` events, skips build and lets the action clean up

Requires `permissions: contents: write, pull-requests: write`.

**File: `templates/astro/deploy.yml`** (or equivalent production deploy template)

Switch from `actions/upload-pages-artifact` + `actions/deploy-pages` to:
- `peaceiris/actions-gh-pages@v4` with `keep_files: true`

`keep_files: true` is critical — it preserves the `pr-preview/` subdirectory when
production is deployed, so live previews are not wiped.

**File: `templates/astro/astro.config.mjs`**

Update the base path line to:
```js
const base = process.env.ASTRO_BASE ?? '/{{REPO_NAME}}/'
```

### Preview URL pattern

```
https://{{GITHUB_USER}}.github.io/{{REPO_NAME}}/pr-preview/pr-<N>/
```

---

## TASK-002 — Nullable external client pattern

```yaml
status: pending
completed_at: ~
```

### Context

The preflight template (and `refactored-potato` main branch CLAUDE.md) contained
this rule:

> “Environment variables must be declared before use; assert non-empty at startup —
> never call a client with empty credentials.”

This rule is correct for production, but **conflicts with preview builds** where
secrets intentionally do not exist. We learned that making the Supabase client
nullable is the right pattern for static apps with optional backend connectivity.

### What to update in the preflight template

**File: `CLAUDE.md` (or the CLAUDE.md template the preflight applies)**

Replace the env-var rule with a more nuanced version:

```markdown
### Environment variables and external clients

- Credentials required for production must be set as GitHub Secrets and referenced
  in the deploy workflow; never hardcode or commit them.
- For clients used in static/JAMstack apps (Supabase, third-party APIs):
  - Export a nullable client + a boolean `isConfigured` flag.
  - Guard every function that calls the client with `if (!client) return null/false/empty`.
  - The app must render a graceful "not configured" UI state, not crash.
  - CI preview builds intentionally omit secrets; **never add placeholder values** to
    work around a missing-credentials error.
- For server-side apps (Node services, API routes): assert non-null at startup
  as before — a server with missing credentials should fail fast.
```

---

## TASK-003 — TypeScript version constraint for Astro projects

```yaml
status: pending
completed_at: ~
```

### Context

When setting up a new Astro project in this repo, installing `typescript@6.x` caused
a peer dependency conflict:

```
Could not resolve dependency:
peer typescript@"^5.3.3" from @astrojs/svelte@7.2.5
```

The fix was to downgrade to `typescript@~5.7.2`.

### What to add to the preflight template

**File: `CLAUDE.md` known_limitations section (Astro projects specifically)**

```markdown
known_limitations:
  - "Astro projects: use TypeScript ~5.7.x, not 6.x — @astrojs/svelte peer dep
     declares ^5.3.3 and npm will refuse to install with TS 6.x"
```

**File: `templates/astro/package.json`**

Set `"typescript": "~5.7.2"` (not `~6.x`) in devDependencies.

---

## TASK-004 — `preview_url_pattern` field in CLAUDE.md manifest

```yaml
status: pending
completed_at: ~
```

### Context

The CLAUDE.md manifest template has a `preview_url_pattern` field that was left as `~`
(null). With the preview deploy pattern from TASK-001 in place, this field has a
predictable value that should be auto-filled by `/init-project` or documented
as detectable.

### What to update in the preflight template

**File: `CLAUDE.md` template (the manifest section)**

Update the detect comment for `preview_url_pattern`:

```yaml
# detect: if rossjrw/pr-preview-action is present in ci.yml
#   → https://<github-user>.github.io/<repo>/pr-preview/pr-<N>/
# detect: if netlify.toml present → https://<deploy-id>--<site>.netlify.app
# detect: if vercel.json present → https://<repo>-git-<branch>-<org>.vercel.app
preview_url_pattern: ~
```

Also update `/init-project` skill logic (if applicable) to auto-detect and fill
this field when `rossjrw/pr-preview-action` is found in a workflow file.
