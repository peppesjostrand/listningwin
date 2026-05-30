# CLAUDE.md

Instruktionsfil för Claude Code när det arbetar med ListingWin-repot.

---

## Vad är ListingWin?

**ListingWin** (listingwin.com) är ett svenskspråkigt SaaS-verktyg för leverantörer inom svensk dagligvaruhandel (DVH). Det hjälper varumärken att hålla koll på listningsfönster och lanseringsdeadlines hos de tre stora kedjorna: **Coop, ICA och Dagab**.

Produkten byggs och underhålls av Peter Sjöstrand på Foodster AB (tillverkare av Tony's Pizza). ListingWin är i pilotfas med sin första betalande kund (1 000 kr/mån). Målmarknaden är leverantörer med flera varumärken och produktgrupper inom flera kategorier.

### Affärskontext

- **Prismodell**: 2 000 kr/mån per workspace (inkl. 1 användare) + 500 kr/mån per extra användare. Obegränsat antal varumärken.
- **Målkund**: Leverantörer som hanterar flera varumärken hos Coop, ICA och Dagab
- **Kärnvärde**: ECR-revideringsfönster-konceptet — att veta exakt när man måste agera för att få en produkt listad hos respektive kedja
- **Språk**: All UI-text är på svenska. Kodkommentarer är på svenska (se Kodstil nedan).

---

## Sidor i applikationen

| Sida | Tab-nyckel | Beskrivning |
|---|---|---|
| **Hem** | `overview` | Dashboard med aktiva lanseringar, kommande fönster och snabbåtgärder |
| **Fönster & Kategorier** | `categories` | Alla kategorier per kedja med listningstillfällen och aviserings-/lanseringsveckor. Sökbar. |
| **Tidslinje** | `timeline` | Visuell tidslinje per kedja och lanseringsfönster — visar alla steg och deadlines |
| **Varumärken** | `brands` | Automatiskt register över varumärken och deras produktgrupper, byggt från aktiva lanseringar |
| **Aktiva lanseringar** | `lansering` | Aktiva lanseringsprojekt. Detaljvy per kedja med fyra tabbar: Uppgifter, Artiklar & priser, Aktivitet, Deadlines |
| **Arkiv** | `arkiv` | Avslutade och arkiverade lanseringar |
| **Kalkyl** | `kalkyl` | Marginalberäkning med moms-korrigering, bruttomarginal och nettomarginal |
| **Påminnelser** | `paminnelser` | Händelsebaserade påminnelser om kommande deadlines |
| **Branschkunskap** | `branschkunskap` | 22 expanderbara insikter om DVH-branschen — statiskt innehåll |
| **Marknaden** | `marknaden` | Struktur och marknadsdata om svensk dagligvaruhandel — statiskt innehåll |
| **Kontakter** | `contacts` | Kontaktregister för nyckelkontakter hos kedjorna. Sökbart med kundfilter. Kopplas till lanseringar. |
| **Inställningar** | `settings` | Workspace-inställningar, teammedlemmar och mörkt/ljust läge |
| **Aktivitetslogg** | `aktivitetslogg` | Realtidsfeed med alla händelser i workspacet, sparad i Supabase (12 månaders retention) |

---

## Teknisk stack och filstruktur

**Frontend**: Vanilla JavaScript (ES6+), inget ramverk, imperativ DOM-manipulation  
**Backend**: Supabase — PostgreSQL via RPC, e-post/lösenords-auth, realtidsprenumerationer  
**Hosting**: GitHub Pages, custom domän via CNAME (listingwin.com)

### Filer

```
index.html          — HTML-skelett (~590 rader)
styles.css          — All CSS (~2 573 rader)
app.js              — All JavaScript (~6 416 rader)
CLAUDE.md           — Instruktioner för Claude Code
CHANGELOG.md        — Ändringslogg
design.md           — Designreferens (färger, typografi, komponenter)
supabase-contacts-migration.sql  — SQL för att skapa contacts + contacts_projects

assets/
  Coop.png          — Coop-logotyp
  ICA.png           — ICA-logotyp
  Dagab.png         — Dagab-logotyp

data/windows/
  coop.json         — COOP_FOOD_RAW + COOP_HEMMA_RAW
  ica.json          — 12 lanseringsfönster × 8 steg
  dagab.json        — 12 lanseringsfönster × 9 steg
  dagab-cats.json   — Kategoridata för Dagab
```

Kalenderdata laddas dynamiskt via `loadWindowData()` vid uppstart innan `authInit()` körs.

### Lokal utveckling

Inget byggsteg. Servera över HTTP (krävs för Supabase-auth):

```powershell
npx serve .
# eller
python -m http.server 8080
```

Öppna **aldrig** `index.html` som `file://` — Supabase-auth kommer att misslyckas.

---

## Supabase-tabeller

### `workspaces`
| Kolumn | Typ | Beskrivning |
|---|---|---|
| `id` | uuid PK | Unikt workspace-ID |
| `name` | text | Workspace-namn (företagsnamn) |
| `created_at` | timestamptz | Skapandedatum |

### `workspace_members`
| Kolumn | Typ | Beskrivning |
|---|---|---|
| `id` | uuid PK | |
| `workspace_id` | uuid FK | Referens till workspaces |
| `user_id` | uuid | Supabase auth user ID |
| `role` | text | `owner` eller `member` |
| `created_at` | timestamptz | |

### `projects`
| Kolumn | Typ | Beskrivning |
|---|---|---|
| `id` | uuid PK | |
| `workspace_id` | uuid FK | |
| `name` | text | Projektnamn |
| `color` | text | HEX-färg |
| `visibility` | text | `workspace` eller `private` |
| `data` | text | JSON-blob med all appdata (se Datastruktur) |
| `created_at` | timestamptz | |

### `project_members`
| Kolumn | Typ | Beskrivning |
|---|---|---|
| `id` | uuid PK | |
| `project_id` | uuid FK | |
| `user_id` | uuid | |
| `role` | text | `owner`, `editor` eller `viewer` |

### `activity_log`
| Kolumn | Typ | Beskrivning |
|---|---|---|
| `id` | uuid PK | |
| `workspace_id` | uuid FK | |
| `user_id` | uuid | |
| `user_email` | text | |
| `emoji` | text | Emoji-ikon för aktiviteten |
| `action` | text | Fritext — vad som hände |
| `created_at` | timestamptz | |

### `contacts`
| Kolumn | Typ | Beskrivning |
|---|---|---|
| `id` | uuid PK | |
| `workspace_id` | uuid FK | |
| `name` | text | Kontaktpersonens namn |
| `customer` | text | Fritext — t.ex. "ICA", "Coop", "Dagab", "Foodservice" |
| `category` | text | Produktkategori (valfritt) |
| `role` | text | Roll/titel (valfritt) |
| `phone` | text | Telefonnummer (valfritt) |
| `email` | text | E-postadress (valfritt) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Uppdateras vid redigering |

### `contacts_projects`
| Kolumn | Typ | Beskrivning |
|---|---|---|
| `id` | uuid PK | |
| `contact_id` | uuid FK | Referens till contacts |
| `project_id` | uuid FK | Referens till projects (lansering) |

> **OBS:** `contacts` och `contacts_projects` skapas av `supabase-contacts-migration.sql`. Kör den i Supabase SQL Editor om tabellerna saknas.

### Viktiga RPC-funktioner
- `create_workspace_for_user(workspace_name, user_id)`
- `create_project(p_workspace_id, p_name, p_color, p_visibility)`
- `get_my_projects(p_workspace_id)`
- `save_project_data(p_project_id, p_data)`
- `my_project_permission(p_project_id)`
- `clean_old_activity_log()` — tar bort activity_log-poster äldre än 12 månader, anropas vid inloggning

### Datalagringsmönster
All appdata lagras som JSON-blob i `data`-kolumnen (typ: text — **parsa alltid defensivt**):
```javascript
if (typeof data === 'string') data = JSON.parse(data);
```
- **Varumärken** (`is_lansering !== true`): productGroups, products, cats, logo, color
- **Lanseringar** (`is_lansering: true`): brandId, groupIndex, chains, customers, contactLog

---

## Navigationsstruktur

Sidebaren är grupperad i sektioner:

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
KUNSKAP
  → Branschkunskap         (tab: branschkunskap)
  → Marknaden              (tab: marknaden)
─────────────
  Kontakter                (tab: contacts)
  Inställningar            (tab: settings)
  Aktivitetslogg           (tab: aktivitetslogg)
```

Borttagna flikar: `historik` (ersatt av arkiv), `agenda` (borttagen helt).  
Ångra/gör om-funktionaliteten är borttagen — lägg inte tillbaka den.

---

## Global state

```javascript
let state = { tab: 'overview', active: { coop, ica, dagab, coopHemma }, showPast: false };
let brands = [];                 // projects där is_lansering !== true
let lanseringar = [];            // projects där is_lansering === true
let contacts = [];               // alla kontakter för workspacet
let cachedCatRows = [];          // cachade kategorirader för DOM-filtrering
let currentUser = null;
let currentWorkspaceId = null;
let currentUserRole = 'owner' | 'member';
let selectedBrandId = null;
let selectedLanseringId = null;
const openGroups = new Set();    // format: "brandId|groupIndex" (pipe, inte bindestreck)
```

---

## Dataflöde

1. `loadWindowData()` — hämtar 3 JSON-filer, bygger ROUNDS-konstanter
2. `authInit()` → sessionskontroll → `authOnLogin(user)`
3. `authOnLogin()` → laddar workspace → `loadBrands()` + `loadLanseringar()` + `loadActivityLog()`
4. `subscribeActivityLog()` — realtidskanal för teamets aktivitetsfeed
5. `renderAll()` läser `state.tab` → anropar rätt `render*()`-funktion
6. `saveProject(brandId)` och `saveLansering(lid)` hanterar persistens

---

## Viktiga datastrukturer

### Varumärke (Brand)
```javascript
{
  id, name, color, logo,
  productGroups: [{
    name: 'Pizzaslice',
    articles: [{ id, name, ean }],
    cats: [{ catName, source }]  // source = 'coop' | 'ica' | 'dagab'
  }],
  products: []  // legacy, används ej
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

---

## Kalenderdata

Alla datum rullar automatiskt framåt — hårdkoda aldrig år.

- `buildCoopRounds()` — dynamiskt år via `weekYear(w)`
- `icaDate(d, m, y)` — avancerar automatiskt om datumet passerat
- `dagabDate(d, m, y)` — avancerar automatiskt om datumet passerat
- `isoWeekToDate(w)` — returnerar fredag 23:59 för given vecka
- `weekYear(w)` — returnerar innevarande år om veckan ej passerat, annars nästa år

---

## UI-konventioner

- Dualt tema (ljust/mörkt); CSS-variabler i `styles.css` (se `design.md` för komplett referens)
- Kedjefärger: Coop `#00AB46`, ICA `#E3000B`, Dagab `#0D4F35`
- Notiser: `addNotif(message, type)` — typer: `'success'`, `'error'`, `'info'`
- Aktivitetslogg: `addActivity(emoji, text)` — sparas i Supabase, visas i Aktivitetslogg-fliken
- Använd alltid `getOrInitGroups(brand)` för att komma åt productGroups

### DOM-filtreringsmönster
Sök- och filterfält ska **aldrig** orsaka en full re-render av sidan. Mönstret:
1. Cacha datarader i en modulvariabel (t.ex. `cachedCatRows`, `contacts`)
2. Ge tabellens `<tbody>` ett unikt `id`
3. Uppdatera bara `tbody.innerHTML` vid sökning — aldrig hela sidan
4. Sökfältet förlorar aldrig fokus

---

## Testdata

Varumärkena **Tony's Pizza**, **Toppery** och **Dippery** är testdata som används under pilotfasen. De är inte riktiga externa kunder. När riktiga kunder tillkommer ska testdata hållas separerat och inte blandas med kunddata i produktion.

---

## Arbetssätt

### Commit-meddelanden
- Alla commit-meddelanden ska vara **på svenska**
- Beskriv exakt vad som ändrades och varför
- Undvik generiska meddelanden som "fix", "update" eller "changes"
- Format: `Kort rubrik som beskriver förändringen` — max 72 tecken på första raden
- Exempel: `Kontaktsidan: sökfält, kundfilter och Senast ändrad-kolumn`

### Automatisk commit och push
- Committa och pusha till GitHub automatiskt när en uppgift är klar — vänta inte på att Peter ska fråga

### Kodstil
- Alla kommentarer i `app.js` ska vara **på svenska**
- Varje ny funktion ska ha en kommentarsrad ovanför: `// Renderar kontaktsidan med sökning och filter.`
- Varje större kodblock inom en funktion ska ha en kort inline-kommentar: `// Hämta kontakter från Supabase och cacha lokalt.`
- Inga onödiga kommentarer — kommentera bara om **varför** inte är uppenbart från koden

### Supabase-backup
- Supabase automatisk backup ska vara aktiverad i projektinställningarna
- Kontrollera detta regelbundet under inloggade sessioner med Supabase-dashboarden
- URL: https://supabase.com/dashboard/project/rjbqvbnzxxltnwoqfstb/settings/general

---

## Klart / Planerat

### Klar funktionalitet
- ✅ Delning av index.html → index.html + styles.css + app.js
- ✅ Kedjekалenderdata extraherad till data/windows/*.json
- ✅ CLAUDE.md skapad och underhållen
- ✅ Navigation omstrukturerad med grupperade sektioner
- ✅ Historik ersatt av Arkiv, Agenda borttagen
- ✅ Kedjetoggle-knappar borttagna från sidebaren
- ✅ Hero/countdown visas bara på HEM
- ✅ Aktivitetslogg med Supabase-persistens, realtid, 12 månaders retention
- ✅ Ångra/gör om borttagen
- ✅ Kollapsbar sidebar med ikonläge och tooltips
- ✅ Kontaktsida med sökning, kundfilter och koppling till lanseringar
- ✅ Lanseringsdetaljvy med kedjeval-dropdown och fyra tabbar
- ✅ Fönster & Kategorier-sökning utan re-render eller fokusstörtning
- ✅ Branschkunskap- och Marknaden-sidor

### Planerat (prioritetsordning)

#### UX
1. Tomma tillstånd + onboarding — guida nya användare steg för steg
2. Dashboard actionable — brådskande åtgärder, aktiva lanseringar, kommande fönster
3. Arkiv — arkivera kunder per lansering, auto-flytta till arkiv när alla är arkiverade
4. Förenkla varumärkes-/lanseringsflödet
5. Mobiloptimering

#### Design
6. Visuell upplyftning — typografi, avstånd, komponentkonsekvens

#### Produkt
7. Landningssida — för icke-inloggade besökare (priser, funktioner, CTA)
8. Juridik — Användarvillkor, Integritetspolicy (GDPR), cookie-banner
9. Betalning — Stripe-integration, workspace-modell (2 000 kr + 500 kr/användare)
