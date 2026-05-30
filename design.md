# design.md — ListingWin designreferens

Referensdokument för all UI-utveckling. Alla nya komponenter ska följa dessa riktlinjer.

---

## Tema och lägen

Applikationen har ett **ljust läge** (standard) och ett **mörkt läge** (aktiverat med klassen `body.dark`). CSS-variabler definieras i `:root` och åsidosätts av `body.dark`. Temat sparas i localStorage och växlas via inställningssidan.

---

## CSS-variabler

### Ljust läge (`:root`)

| Variabel | Värde | Användning |
|---|---|---|
| `--bg` | `linear-gradient(#F4F6F9, #EEF1F5)` | Sidans bakgrund |
| `--surface` | `#FFFFFF` | Kort, modaler, paneler |
| `--surface2` | `#E8ECF2` | Sekundär yta — tabellrader, inmatningsfält |
| `--sidebar-bg` | `linear-gradient(#DFE5EF, #D4DCE8)` | Sidebarbakgrund |
| `--border` | `#0A1F44` | Primär kant (stark) |
| `--border2` | `#B8C4D4` | Sekundär kant (subtil) |
| `--text` | `#0A1F44` | Primär text |
| `--muted` | `#4A5568` | Sekundär text, labels |
| `--muted2` | `#8A94A6` | Tertiär text, platshållartext |
| `--primary` | `#0A1F44` | Primärfärg (marinblå) |
| `--accent` | `#0A1F44` | Accentfärg — länkar, fokus |
| `--accent-soft` | `rgba(10,31,68,0.08)` | Mjuk accent — hover-bakgrunder |
| `--btn-bg` | `#0A1F44` | Primärknappens bakgrund |
| `--btn-text` | `#FFFFFF` | Primärknappens text |
| `--btn-hover-bg` | `#0F2A5A` | Primärknapp hover |
| `--input-bg` | `#FFFFFF` | Inmatningsfältets bakgrund |
| `--input-focus` | `#0A1F44` | Fokuskant på inmatningsfält |
| `--table-hover` | `#F5F7FA` | Tabellrad hover |
| `--shadow-sm` | `0 2px 8px rgba(10,31,68,.10), 0 1px 3px rgba(10,31,68,.08)` | Kort, small lift |
| `--shadow-md` | `0 4px 12px rgba(10,31,68,.10)` | Modaler, dropdowns |
| `--shadow-lg` | `0 8px 32px rgba(10,31,68,.14)` | Stora modaler, toasts |

### Mörkt läge (`body.dark`)

| Variabel | Värde | Notering |
|---|---|---|
| `--bg` | `linear-gradient(#071530, #050F20)` | Djup marinblå |
| `--surface` | `#0A1F44` | |
| `--surface2` | `#0F2A5A` | |
| `--sidebar-bg` | `linear-gradient(#0A1F44, #071530)` | |
| `--border` | `#F0F4F8` | Ljus kant mot mörk bakgrund |
| `--border2` | `#244880` | |
| `--text` | `#F0F4F8` | |
| `--muted` | `#A0AEC0` | |
| `--muted2` | `#6B7A8D` | |
| `--accent` | `#a78bfa` | Lila i mörkt läge |
| `--accent-soft` | `rgba(167,139,250,0.1)` | |
| `--btn-bg` | `#2455A4` | Ljusare blå i mörkt läge |
| `--btn-hover-bg` | `#2D63BC` | |
| `--input-bg` | `#0F2A5A` | |
| `--input-focus` | `#4A90D9` | |
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,.30), ...` | Starkare skuggor i mörkt läge |

### Kedjefärger (samma i båda lägena)

| Variabel | Färg | Kedja |
|---|---|---|
| `--coop-color` | `#00AB46` | Coop |
| `--ica-color` | `#E3000B` | ICA |
| `--dagab-color` | `#0D4F35` | Dagab |

---

## Typografi

| Variabel | Värde | Användning |
|---|---|---|
| `--font` | `'Inter', 'Barlow', sans-serif` | Brödtext, knappar, labels |
| `--display` | `'Inter', 'Barlow Condensed', sans-serif` | Rubriker, kortnamn |

### Typografiskala

| Storlek | Användning |
|---|---|
| `22px` + `font-weight: 700` | Lanseringsnamn, stora sidrubriker |
| `16px` + `font-weight: 700` | Modalrubriker |
| `14px` | Brödtext, dropdown-text |
| `13px` | Standard UI-text |
| `12px` | Tabellceller, formulärfält |
| `11px` | Knappar, badges, sekundära labels |
| `10px` + `font-weight: 700` + `letter-spacing: 1px` | Tabellrubriker (uppercase) |
| `9px` | Metadata, områdesmarkeringar |

---

## Kortdesign

Standardkort används för lanseringar, kategorier och paneler.

```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 12px;
padding: 24px;
box-shadow: var(--shadow-sm);
```

Sekundärt kort (inuti primärt kort, lättare):
```css
background: var(--surface2);
border: 1px solid var(--border2);
border-radius: 8px;
padding: 12px 16px;
```

**Riktlinje:** Använd primärt kort för huvud-innehållsytor. Sekundärt kort för taggar, aktivitetsposter och nested-innehåll.

---

## Knappstilar

### Primärknapp — `.inline-btn`
```css
background: var(--btn-bg);
color: var(--btn-text);
padding: 7px 14px;
border-radius: 8px;
border: none;
font-size: 12px;
font-weight: 500;
transition: background 0.15s, transform 0.12s;
```
Hover: `background: var(--btn-hover-bg); transform: translateY(-1px);`

**Riktlinje:** Primär åtgärd per sektion — t.ex. "Lägg till kontakt", "Spara", "Skapa lansering".

### Sekundärknapp — `.inline-btn.secondary`
```css
background: transparent;
border: 1px solid var(--border);
color: var(--text);
```
Hover: `background: var(--table-hover); border-color: var(--input-focus);`

**Riktlinje:** Avbryt-alternativ, sekundära åtgärder bredvid primärknapp.

### Åtgärdsknapp — `.lansering-action-btn`
```css
background: var(--surface2);
border: 1px solid var(--border2);
color: var(--text);
padding: 6px 12px;
border-radius: 6px;
font-size: 11px;
```
Hover: `border-color: #f59e0b; color: #f59e0b;`  
Danger hover: `border-color: rgba(248,113,113,0.4); color: #f87171;`

**Riktlinje:** Inline-åtgärder i tabeller och listor — t.ex. "Redigera", "Ta bort". Lägg till `.danger` för destruktiva åtgärder.

---

## Tabbstil

### Kedjeflikar — `.tl-cust-tab`
```css
background: none;
border: none;
border-bottom: 2px solid transparent;
padding: 8px 16px;
cursor: pointer;
```
Aktiv: `background: var(--surface2); border-bottom-color: var(--chain-color);`

**Riktlinje:** Används för att växla mellan Coop / ICA / Dagab. Understreck i kedjerespektive färg.

### Innerflikar (detaljvy)
Fyra tabbar per kedja i lanseringsdetaljvyn: Uppgifter, Artiklar & priser, Aktivitet, Deadlines.  
Aktiv flik markeras med `border-bottom: 2px solid var(--accent)` och `color: var(--text)`.

---

## Formulärelement

### Input
```css
background: var(--input-bg);
border: 1px solid var(--border);
color: var(--text);
border-radius: 7px;
padding: 7px 12px;
font-family: var(--font);
font-size: 13px;
outline: none;
```
Fokus: `border-color: var(--input-focus);`

### Klassen `.lansering-form-input`
Standardklass för alla formulärinmatningsfält i modaler och formulär. Använd denna i stället för inline-stilar.

---

## Notiser

`addNotif(message, type)` — visas som en toast i nedre vänstra hörnet.

| Typ | Användning |
|---|---|
| `'success'` | Sparad, borttagen, skapad |
| `'error'` | Misslyckade Supabase-anrop, valideringsfel |
| `'info'` | Neutrala meddelanden |

---

## Badges och chips

### Fönster-chip — `.wchip`
Liten badge som visar en lanseringsvecka: `v.37`

### Fönster-par — `.wchip.wchip-pair`
Kombinerad badge: `v.18 → v.37` — avisering → lansering

### Kedjebadge — `.contact-chain-badge`
Inline-badge med kedjespecifik bakgrundsfärg (halvtransparent) och textfärg.  
Byggd med `contactCustomerBg(customer)` + `CHAIN_COLORS[customer]`.

---

## Sidebaren

- Expanderad bredd: `220px`
- Kollapsad bredd: `52px`
- Övergångstid: `0.25s ease`
- Aktiv länk: vänster border i `var(--nav-active-border)`, bakgrund `var(--nav-active-bg)`
- Ikonbibliotek: **Tabler Icons** (`ti ti-*`-klasser) — en ikon per navigeringslänk i kollapsad vy

---

## Riktlinjer

1. **Använd alltid CSS-variabler** — inga hårdkodade färger utanför `:root` och `body.dark`
2. **`border-radius: 12px`** för primära kort, `8px` för sekundära ytor, `6–7px` för knappar och inputs
3. **Skuggor ska lyfta** — `--shadow-sm` på kort, `--shadow-md` på modaler, `--shadow-lg` på stora modaler
4. **Primärknapp = en per sektion** — undvik att stapla flera `.inline-btn` bredvid varandra
5. **Destruktiva åtgärder** — använd `.danger`-modifieraren, visa aldrig en röd knapp direkt utan bekräftelse
6. **Tomma tillstånd** — visa alltid `.empty-state` med förklaringstext när en lista är tom
7. **Ikoner** — använd Tabler Icons (`ti ti-*`) konsekvent, blanda inte med andra ikonbibliotek
