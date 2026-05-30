# Ändringslogg — ListingWin

Kronologisk sammanfattning av vad som byggts och förändrats. Nyast överst.

---

## 2026-05-30

### Fönster & Kategorier: sökfält utan re-render
Kategorisökningen omskrevs med samma DOM-filtreringsmönster som kontaktsidan. Kategoriraderna cachas i modulvariabeln `cachedCatRows` och en ny `filterCats()`-funktion uppdaterar bara `tbody` vid tangenttryckning. Sökfältet förlorar aldrig fokus och hela sidan re-renderas inte.

### Kontaktsidan: sökfält, kundfilter och Senast ändrad
Kontaktsidan fick ett realtidssökfält (alla kolumner), ett dynamiskt kundfilter-dropdown byggt från faktiska värden i databasen, och en ny kolumn "Senast ändrad" som visar `updated_at` från Supabase. Kolumnen `updated_at` lades till i migrations-SQL:en och uppdateras i Supabase vid redigering.

### Kontaktsida, aktivitetsflöde och lansering — flera fixar
Kontaktpersoner-sektionen flyttades in i Tab 3 (Aktivitet) i lanseringsdetaljvyn. Aktivitetsloggen visar nu alla kopplade kontakter plus "Intern anteckning"-alternativ. Radera-knappen fixades (var osynlig i ljust läge). Inline-redigering av aktivitetsposter lades till. Validering av kontaktfält togs bort (alla fält är frivilliga). Kundvalet ändrades till fritext.

---

## 2026-05-29

### Tooltips för sidebarikonerna i kollapsad läge
CSS `::after`-tooltips lades till på alla navigeringsikonerna i kollapsad sidebar. Tooltipsen visas till höger om ikonen med 200 ms fördröjning och matchar kortdesignens stil med border, border-radius och subtil box-shadow.

### Lanseringsdetaljvyn: kedjeval-dropdown och fyra tabbar
Kedjefliken i lanseringsdetaljvyn ersattes med en `<select>`-dropdown plus "Lägg till kedja"-alternativ. Varje kedja fick fyra innerflikar: Uppgifter (checklista + anpassade uppgifter), Artiklar & priser (EAN uppdelat i KFP/DFP/PALL, momskorrigerad marginalberäkning), Aktivitet (aktivitetsfeed med kontaktlogg + kommentarer) och Deadlines (statisk tidslinje).

### Kollapsbar sidebar med ikonläge
Sidebaren fick en collapse-toggle. I kollapsad vy ersätts navigationslänktexterna med Tabler Icons. Tillståndet sparas i localStorage med nyckeln `lw_sidebar_collapsed`. Övergången animeras med smooth transition.

### Kontakter: sida, koppling till lansering och kontaktlogg
Ny kontaktsida byggdes (tab: contacts) med tabell, sökfält och modal för att lägga till/redigera kontakter. Kontakter kan kopplas till lanseringar och visas i aktivitetsflödet. Supabase-migration skapad för `contacts` och `contacts_projects`.

### Marknaden och Branschkunskap
Två nya informationssidor lades till: Branschkunskap med 22 expanderbara insikter om DVH-branschen, och Marknaden med strukturdata om den svenska dagligvarumarknaden.

### Tidslinje: kategorilista per lanseringsvecka
Tidslinjesidan visar nu kategorier kopplade till varje lanseringsfönster.

### Fönster & Kategorier: kedjeflikar och kombinerade fönster-badges
Kategorisidan byggdes om med flikar per kedja (Coop/ICA/Dagab), sökning per flik och kombinerade aviserings→fönster-badges som visar par av aviserings- och lanseringsveckor.

### Redigeringsflöde för lanseringar
Befintlig wizard återanvändes för att redigera lanseringar. En "Redigera"-knapp öppnar wizarden förifylld med befintlig data.

---

## 2026-05-28

### Fullständig visuell redesign
Applikationen fick ett komplett nytt utseende inspirerat av Sana.ai — ljust tema som standard, mörkt läge som alternativ. Ny typografi (Inter), konsekvent kortdesign med border och box-shadow, och en renare sidebar-navigation.

### Varumärken: automatiskt register
Varumärkessidan förenklades till ett automatiskt register som aggregerar produktgrupper från aktiva lanseringar. Ingen manuell inmatning krävs.

### Lanseringsguide: fyrstegig wizard
En fyrstegig wizard byggdes för att skapa nya lanseringar: välj varumärke → välj produktgrupp → välj kategori per kedja → namnge och färgsätt lanseringen.

### Dagab-logotyp och accentfärg
Dagab-logotypen lades till som PNG och accentfärgen uppdaterades till `#0D4F35` (mörkgrön).

---

## 2026-05-27

### Arkitektur: uppdelning i tre filer
Den ursprungliga monolitiska `index.html` delades upp i tre separata filer: `index.html` (HTML-skelett), `styles.css` (all CSS) och `app.js` (all JavaScript). Kedjekалenderdata extraherades till `data/windows/*.json`.

### Ångra/gör om borttagen
Ångra/gör om-funktionaliteten togs bort helt från applikationen.

### CLAUDE.md skapad
Instruktionsfilen för Claude Code skapades med arkitekturbeskrivning och projektkontext.

---

## 2026-02-27 – 2026-03-05

### Tidig utveckling
Applikationen startade som en enda HTML-fil (`listningsfönster_v2.html`) med hårdkodad kalenderdata. Under februari–mars 2026 itererades snabbt på grundfunktionaliteten: listningstillfällen per kategori, Supabase-integration och grundläggande projektstruktur.
