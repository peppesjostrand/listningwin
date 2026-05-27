# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**ListingWIN** (Listningsfönster) is a Swedish-language SPA for tracking product listing windows and launch deadlines across major Swedish grocery retail chains: Coop, ICA, and Dagab. It helps brands coordinate product launches against retailer-specific calendar deadlines.

## Critical Architecture Note

**The repository contains only the compiled output.** The entire application is a single monolithic `index.html` (~630 KB) with all JavaScript and CSS inlined. There is no build system, no `package.json`, no source directory — only the final artifact. All changes must be made directly in `index.html`.

## Development

There is no build step. To develop locally, serve `index.html` over HTTP (required for Supabase auth to work):

```powershell
# Any static file server works, e.g.:
npx serve .
# or
python -m http.server 8080
```

Do not open `index.html` directly as a `file://` URL — Supabase auth will fail.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), no framework, all DOM manipulation is imperative
- **Backend**: [Supabase](https://supabase.com) — PostgreSQL via RPC calls, email/password auth
- **Hosting**: GitHub Pages (static), custom domain via CNAME

## Architecture

### Global State

```javascript
let state = { tab: 'overview', active: { coop, ica, dagab, coopHemma } };
let brands = [];           // projects where is_lansering = false
let lanseringar = [];      // projects where is_lansering = true
let currentUser = null;
let currentWorkspaceId = null;
let currentUserRole = 'owner' | 'member';
```

### Data Flow

1. `init()` → auth check → `authOnLogin()` → load workspace → `loadBrands()` + `loadLanseringar()`
2. All data reads/writes go through Supabase RPC functions (`get_my_projects`, `save_project_data`, `create_project`, `update_project_visibility`)
3. Project data (products, product groups, metadata) is stored as a JSONB `data` column in Supabase
4. `renderAll()` is the master render dispatcher — it reads `state.tab` and calls the appropriate render function

### Views

The sidebar switches `state.tab` between: `overview`, `timeline`, `lansering`, `historik`, `kalkyl`, `paminnelser`, `agenda`. Each has a corresponding `render*()` function.

### Listing Windows

Retailer calendar data is **hard-coded** in JavaScript arrays near the top of the file:
- `COOP_FOOD_RAW`, `COOP_HEMMA_RAW` → processed by `buildCoopRounds()`
- `ICA_LAUNCH_WEEKS`, `ICA_ALL_STEPS` → processed by `buildIcaRounds()`
- `DAGAB_RAW` → processed by `buildDagabRounds()`

To update retailer deadlines, find and edit these arrays directly.

### UI Conventions

- Dark theme; CSS variables define the color system at the top of `<style>`
- Customer accent colors: Coop `#4ade80`, ICA `#f87171`, Dagab `#fb923c`, current week `#facc15`
- Notifications use `addNotif(message, type)` — types: `'success'`, `'error'`, `'info'`
- Undo/redo: `pushUndo(snapshot)`, `undoAction()`, `redoAction()`

### Auth & Workspaces

- Email/password via Supabase Auth; session in `localStorage`
- Workspace invite tokens passed as `?invite=<token>` URL param, preserved in `sessionStorage.pendingInviteToken`
- Access roles: `owner` / `member` at workspace level; `owner` / `editor` / `viewer` at project level

## Language

UI text is Swedish. Code comments are English.
