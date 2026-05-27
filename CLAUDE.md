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

## Critical Architecture Note

The entire application is a **single monolithic `index.html`** (~640 KB) with all JavaScript and CSS inlined. There is no build system, no `package.json`, no source directory — only the final artifact. All changes must be made directly in `index.html`.

A future goal is to split this into separate files (HTML, CSS, JS modules, data files) — but this has not been done yet.

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

1. `authInit()` → check session → `authOnLogin(user)` → load workspace → `loadBrands()` + `loadLanseringar()`
2. All reads/writes via Supabase RPC
3. `renderAll()` reads `state.tab` and calls the appropriate `render*()` function
4. `saveProject(brandId)` and `saveLansering(lid)` handle persistence

## Navigation Tabs

```
overview | categories | timeline | brands | lansering | historik | kalkyl | paminnelser | agenda
```

## Retailer Calendar Data

Hard-coded near the top of index.html. **All dates now roll forward automatically to next year when passed** — do not revert this logic.

- `COOP_FOOD_RAW`, `COOP_HEMMA_RAW` → `buildCoopRounds()` — week-based, dynamic year assignment
- `ICA_ALL_STEPS` → `buildIcaRounds()` — explicit dates via `icaDate(d, m, y)` which auto-advances
- `DAGAB_ALL_STEPS` → `buildDagabRounds()` — explicit dates via `dagabDate(d, m, y)` which auto-advances
- `CATEGORIES` — maps category names to chains and launch windows

To update retailer schedules, edit the raw data arrays. Never hard-code years.

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

- Dark theme; CSS variables define colors at top of `<style>`
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

1. Split index.html into separate files (HTML / CSS / JS modules / data JSON)
2. UX improvements — onboarding, empty states, navigation clarity
3. Frontend redesign — consistent typography, spacing, component library
4. Landing page for non-logged-in visitors (pricing, features, CTA)
5. Legal — Terms of Service, Privacy Policy (GDPR), cookie banner
6. Payment integration — Stripe, workspace model (2 000 kr + 500 kr/user)
