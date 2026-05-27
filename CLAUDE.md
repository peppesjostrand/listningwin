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

## Architecture

The application is split into three files:
- `index.html` — HTML skeleton (~358 lines)
- `styles.css` — all CSS (~1 234 lines)
- `app.js` — all JavaScript (~4 500 lines)

Retailer calendar data lives in:
- `data/windows/coop.json` — COOP_FOOD_RAW + COOP_HEMMA_RAW
- `data/windows/ica.json` — 12 launch windows × 8 steps
- `data/windows/dagab.json` — 12 launch windows × 9 steps

Loaded dynamically via `loadWindowData()` at startup before `authInit()` runs.

## Development

No build step. Serve over HTTP (required for Supabase auth):

```powershell
npx serve .
# or
python -m http.server 8080
```

Never open `index.html` as `file://` — Supabase auth will fail.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), no framework, imperative DOM
- **Backend**: Supabase — PostgreSQL via RPC, email/password auth, realtime subscriptions
- **Hosting**: GitHub Pages, custom domain via CNAME (listingwin.com)

## Supabase Tables

| Table | Purpose |
|---|---|
| `workspaces` | One per company/team |
| `workspace_members` | Users in workspace (roles: owner, member) |
| `projects` | Both brands and lanseringar |
| `project_members` | Per-project access (roles: owner, editor, viewer) |
| `activity_log` | Workspace activity feed — workspace_id, user_id, user_email, emoji, action, created_at |

### Key RPC Functions
- `create_workspace_for_user(workspace_name, user_id)`
- `create_project(p_workspace_id, p_name, p_color, p_visibility)`
- `get_my_projects(p_workspace_id)`
- `save_project_data(p_project_id, p_data)`
- `my_project_permission(p_project_id)`
- `clean_old_activity_log()` — deletes activity_log entries older than 12 months, called at login

### Data Storage Pattern
All app data stored as JSON blob in `data` column (type: text — **always parse defensively**):
```javascript
if (typeof data === 'string') data = JSON.parse(data);
```
- **Brands** (`is_lansering !== true`): productGroups, products, cats, logo, color
- **Lanseringar** (`is_lansering: true`): brandId, groupIndex, chains, customers, contactLog

## Navigation Structure

Sidebar is grouped into sections:

```
HEM
─────────────
PLANERA
  → Fönster & Kategorier  (tab: categories)
  → Tidslinje              (tab: timeline)
─────────────
VARUMÄRKEN                 (tab: brands)
─────────────
LANSERINGAR
  → Aktiva                 (tab: lansering)
  → Arkiv                  (tab: arkiv)
─────────────
VERKTYG
  → Kalkyl                 (tab: kalkyl)
  → Påminnelser            (tab: paminnelser)
─────────────
  Inställningar
  Aktivitetslogg           (tab: aktivitetslogg)
```

Removed tabs: `historik` (replaced by arkiv), `agenda` (removed entirely).
Undo/redo functionality has been removed entirely — do not re-add it.

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
const openGroups = new Set();    // format: "brandId|groupIndex" (pipe, not dash)
```

## Data Flow

1. `loadWindowData()` — fetches 3 JSON files, builds ROUNDS constants
2. `authInit()` → session check → `authOnLogin(user)`
3. `authOnLogin()` → load workspace → `loadBrands()` + `loadLanseringar()` + `loadActivityLog()`
4. `subscribeActivityLog()` — realtime channel for team activity feed
5. `renderAll()` reads `state.tab` → calls appropriate `render*()` function
6. `saveProject(brandId)` and `saveLansering(lid)` handle persistence

## Key Data Structures

### Brand
```javascript
{
  id, name, color, logo,
  productGroups: [{
    name: 'Pizzaslice',
    articles: [{ id, name, ean }],
    cats: [{ catName, source }]  // source = 'coop' | 'ica' | 'dagab'
  }],
  products: []  // legacy, unused
}
```

### Lansering
```javascript
{
  id, name, color,
  brandId, brand, groupIndex, groupName,
  chains: ['coop', 'ica'],
  removedChains: [],
  freeCustomers: ['Mathem'],
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

## Retailer Calendar Data

All dates roll forward automatically — never hard-code years.

- `buildCoopRounds()` — dynamic year via `weekYear(w)`
- `icaDate(d, m, y)` — auto-advances if date has passed
- `dagabDate(d, m, y)` — auto-advances if date has passed
- `isoWeekToDate(w)` — returns Friday 23:59 of that week
- `weekYear(w)` — returns current year if week hasn't passed, else next year

## UI Conventions

- Dark theme; CSS variables in `styles.css`
- Chain colors: Coop `#4ade80`, ICA `#f87171`, Dagab `#fb923c`
- Notifications: `addNotif(message, type)` — types: `'success'`, `'error'`, `'info'`
- Activity log: `addActivity(emoji, text)` — saves to Supabase, shown in Aktivitetslogg tab
- Always use `getOrInitGroups(brand)` to access productGroups

## Completed Work

- ✅ Split index.html → index.html + styles.css + app.js
- ✅ Retailer data extracted to data/windows/*.json
- ✅ CLAUDE.md created and maintained
- ✅ Navigation restructured into grouped sections
- ✅ Historik replaced by Arkiv, Agenda removed
- ✅ Chain toggle buttons removed from sidebar
- ✅ Hero/countdown only shown on HEM
- ✅ Activity log with Supabase persistence, realtime, 12-month retention
- ✅ Undo/redo removed

## Planned Work (Priority Order)

### UX
1. Tomma tillstånd + onboarding — guide new users step by step
2. Dashboard actionable — urgent actions, active lanseringar, upcoming windows
3. Arkiv — archive customers per lansering, auto-move to arkiv when all archived
4. Förenkla varumärkes/lanseringsflödet
5. Mobiloptimering

### Design
6. Visuell upplyftning — typography, spacing, component consistency

### Product
7. Landningssida — for non-logged-in visitors (pricing, features, CTA)
8. Juridik — Terms of Service, Privacy Policy (GDPR), cookie banner
9. Betalning — Stripe integration, workspace model (2 000 kr + 500 kr/user)
