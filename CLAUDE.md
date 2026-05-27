# CLAUDE.md

This file provides guidance to Claude Code when working with the ListingWin repository.

## What This Is

**ListingWin** (listingwin.com) is a Swedish-language SaaS tool for suppliers in the Swedish grocery trade (DVH — Dagligvaruhandeln). It helps brands track product listing windows and launch deadlines across the three major Swedish grocery retail chains: **Coop, ICA, and Dagab**.

The product is built and maintained by Peter Sjöstrand at Foodster AB (makers of Tony's Pizza). ListingWin is currently in pilot phase with its first paying customer (1 000 kr/mån). The target market is suppliers with multiple brands and product groups across multiple categories.

## Business Context

- **Pricing model**: 2 000 kr/mån per workspace (includes 1 user) + 500 kr/mån per additional user. Unlimited brands included.
- **Target customer**: Suppliers managing multiple brands across Coop, ICA, and Dagab categories
- **Core value proposition**: The ECR revision window concept — knowing exactly when to act to get a product listed at each chain
- **Language**: All UI text is Swedish. Code comments are English.

## Working Instructions

- **Always commit and push to GitHub automatically** when a task is complete — do not wait for Peter to ask
- Use clear Swedish-friendly commit messages describing what changed
- Verify that the site still works after each significant change

## Architecture Note

The application is split into separate files:
- `index.html` — HTML skeleton (~371 lines)
- `styles.css` — all CSS (~1 239 lines)
- `app.js` — all JavaScript (~4 503 lines)
- `data/windows/coop.json` — COOP_FOOD_RAW + COOP_HEMMA_RAW (Coop Food & Hemma round data)
- `data/windows/ica.json` — ICA_ALL_STEPS, launchWeeks, stepLabels
- `data/windows/dagab.json` — DAGAB_ALL_STEPS, raw entries, stepLabels

Retailer calendar data is loaded dynamically via `loadWindowData()` at startup (fetch + Promise.all). Dates are stored as `[d, m, y]` tuples in JSON and reconstructed via `icaDate()`/`dagabDate()` which apply roll-forward logic. `CATEGORIES` remains in `app.js`.

## Development

There is no build step. To develop locally, serve `index.html` over HTTP:

```powershell
npx serve .
# or
python -m http.server 8080
```

Do not open `index.html` directly as a `file://` URL — Supabase auth will fail.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), no framework, all DOM manipulation is imperative
- **Backend**: Supabase — PostgreSQL via RPC calls, email/password auth
- **Hosting**: GitHub Pages (static), custom domain via CNAME (listingwin.com)

## Supabase Structure

### Tables
- `workspaces` — one per company/team
- `workspace_members` — users belonging to a workspace (roles: owner, member)
- `projects` — both brands and lanseringar stored here
- `project_members` — access control per project (roles: owner, editor, viewer)

### Key RPC Functions
- `create_workspace_for_user(workspace_name, user_id)` — creates workspace + admin member
- `create_project(p_workspace_id, p_name, p_color, p_visibility)` — creates a project
- `get_my_projects(p_workspace_id)` — returns all projects the current user has access to
- `save_project_data(p_project_id, p_data)` — saves JSON data blob to project
- `my_project_permission(p_project_id)` — returns current user's permission level

### Data Storage Pattern
All application data is stored as a JSON blob in the `data` column (type: text, sometimes returns as string — always parse with JSON.parse). Two types of projects exist:
- **Brands** (`is_lansering !== true`): contain `productGroups`, `products`, `cats`, logo, color
- **Lanseringar** (`is_lansering: true`): contain `brandId`, `groupIndex`, `chains`, `customers`, `contactLog`, etc.

## Global State

```javascript
let state = { tab: 'overview', active: { coop, ica, dagab, coopHemma }, showPast: false };
let brands = [];                 // projects where is_lansering !== true
let lanseringar = [];            // projects where is_lansering === true
let currentUser = null;
let currentWorkspaceId = null;
let currentUserRole = 'owner' | 'member';
let selectedBrandId = null;
let selectedLanseringId = null;
const openGroups = new Set();    // format: "brandId|groupIndex"
```

## Data Flow

1. `loadWindowData()` → fetch JSON files → populate raw data + build ROUNDS constants
2. `authInit()` → check session → `authOnLogin(user)` → load workspace → `loadBrands()` + `loadLanseringar()`
3. All reads/writes via Supabase RPC
4. `renderAll()` reads `state.tab` and calls the appropriate `render*()` function
5. `saveProject(brandId)` and `saveLansering(lid)` handle persistence

## Navigation Structure

Sidebar is grouped into sections with dividers:

```
HEM
  overview       → Hem (startsida med widgets, aktiva lanseringar, akuta fönster)

PLANERA
  categories     → Fönster & Kategorier
  timeline       → Tidslinje

VARUMÄRKEN
  brands         → Varumärken

LANSERINGAR
  lansering      → Aktiva
  arkiv          → Arkiv  (tidigare "historik")

VERKTYG
  kalkyl         → Kalkyl
  paminnelser    → Påminnelser
```

`showTab(tab)` manages tab visibility and sets `page-title`. `renderAll()` dispatches to the correct `render*()` function. The `agenda` tab is no longer in the menu (its render function still exists as dead code).

## Retailer Calendar Data

Stored in `data/windows/*.json` and loaded at startup. **All dates roll forward automatically to next year when passed** — do not revert this logic.

- `data/windows/coop.json` → `COOP_FOOD_RAW`, `COOP_HEMMA_RAW` → `buildCoopRounds()` — week-based
- `data/windows/ica.json` → `ICA_ALL_STEPS` → `buildIcaRounds()` — dates via `icaDate(d, m, y)`
- `data/windows/dagab.json` → `DAGAB_ALL_STEPS` → `buildDagabRounds()` — dates via `dagabDate(d, m, y)`
- `CATEGORIES` — maps category names to chains and launch windows (still in `app.js`)

To update retailer schedules, edit the JSON files. Dates use `[day, month(0-indexed), year]` format. Never hard-code years.

## Key Data Structures

### Brand (project)
```javascript
{
  id, name, color, logo,
  productGroups: [
    {
      name: 'Pizzaslice',
      articles: [{ id, name, ean }],
      cats: [{ catName, source }]  // source = 'coop' | 'ica' | 'dagab'
    }
  ],
  products: []  // legacy, largely unused
}
```

### Lansering (project with is_lansering: true)
```javascript
{
  id, name, color,
  brandId, brand, groupIndex, groupName,
  chains: ['coop', 'ica'],         // auto-derived from productGroup.cats
  removedChains: [],               // chains manually removed by user
  freeCustomers: ['Mathem'],       // manually added free-text customers
  activeCustomerTab: 'coop',
  customers: {
    coop: {
      checklist: { validoo: '2026-01-15', ... },
      tasks: [{ name, deadline, status, owner }]
    }
  },
  contactLog: [{ customerTab, contact, date, note, next }],
  is_lansering: true
}
```

## UI Conventions

- Dark theme; CSS variables define colors at top of `styles.css`
- Chain colors: Coop `#4ade80`, ICA `#f87171`, Dagab `#fb923c`
- Notifications: `addNotif(message, type)` — types: `'success'`, `'error'`, `'info'`
- Undo/redo: `pushUndo(snapshot)`, `undoAction()`
- Activity log: `addActivity(emoji, text)`
- Always use `getOrInitGroups(brand)` to access productGroups — handles JSON string parsing

## Important Quirks

- `data` column from Supabase sometimes returns as a JSON string — always parse defensively:
  ```javascript
  if (typeof data === 'string') data = JSON.parse(data);
  ```
- `weekYear(w)` is dynamic — if week has passed this year, returns next year
- `isoWeekToDate(w)` returns Friday 23:59 of that week
- `getOrInitGroups(brand)` handles both string and array formats for productGroups
- `openGroups` Set uses `"brandId|groupIndex"` format (pipe separator, not dash, because UUIDs contain dashes)

## Planned Work (Priority Order)

1. UX improvements — onboarding, empty states, navigation clarity
2. Frontend redesign — consistent typography, spacing, component library
3. Landing page for non-logged-in visitors (pricing, features, CTA)
4. Legal — Terms of Service, Privacy Policy (GDPR), cookie banner
5. Payment integration — Stripe, workspace model (2 000 kr + 500 kr/user)

## Completed Refactoring

- Split `index.html` into `index.html` + `styles.css` + `app.js`
- Moved retailer calendar data to `data/windows/*.json`, loaded dynamically
- Navigation rebuilt with grouped sidebar sections (HEM / PLANERA / VARUMÄRKEN / LANSERINGAR / VERKTYG)
