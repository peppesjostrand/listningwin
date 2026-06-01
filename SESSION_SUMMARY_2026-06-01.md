# ListingWIN – Sessionssummering 2026-06-01

## Vad som byggts i denna session

### Onboarding
- Välkomstflöde i två steg – skapar varumärke, väljer kedja, navigerar till Aktiva lanseringar
- Hoppar automatiskt över för inbjudna kollegor med befintlig workspace-data
- Grön välkomstbanner efter onboarding med instruktioner
- Blå informationsbanner efter första lansering skapad
- onboarding_completed sparas i Supabase Auth user metadata via auth.getUser() för att undvika stale JWT

### Tomma tillstånd
- Aktiva lanseringar, Varumärken, Kontakter, Arkiv har tomma tillstånd med CTA
- Dashboard visar kom-igång-checklista när inga lanseringar finns

### Kontextuella tips
- Tips på alla sidor sparas i localStorage och visas aldrig igen efter stängning
- Tips på: Fönster & Kategorier, Tidslinje, Aktiva lanseringar, Kontakter, Branschkunskap, Marknaden, Kalkyl, Påminnelser, Arkiv, Aktivitetslogg, Inställningar, Dashboard, Varumärken

### Dashboard
- Sektion 1: Mötesbokning-zoner med grön/gul/röd färgkodning baserat på dagar till aviseringsdeadline
- Sektion 2: Varumärkeskort med aktiva lanseringar, progress-bar och dagar till avisering
- Sektion 3: Senaste 5 aktiviteter i workspacet
- Sektion 4: Snabbstatistik – aktiva lanseringar, deadlines inom 14 dagar, öppna uppgifter, dagar till nästa avisering
- Årsschema data/weeks/2026.json och data/weeks/2027.json med korrekta ISO 8601-datum
- Hjälpfunktioner getWeekStartDate, getWeekEndDate, daysUntilWeek

### Lanseringsdetaljvyn
- Fyra tabbar per kund: Uppgifter, Artiklar & priser, Aktivitet, Deadlines
- Kedjeval som dropdown istället för flikar
- Lägg till kund med fritextfält och kundtyp DVH/SVH/Foodservice/Servicehandel/Övrigt
- Artikelblock med 13 fält inklusive tre EAN-fält och automatiska kalkyler med korrekt momshantering
- Aktivitetslogg och kontaktlogg sammanslagna till ett aktivitetsflöde
- Uppgifter kan tas bort inklusive grunduppgifter
- Datumformat DD/MM/ÅÅÅÅ
- Deadlines visar passerade med nedtonad stil

### Kontakter
- Ny sida under Planera med sökning, filter och Senast ändrad-kolumn
- Kopplas till lanseringar och aktivitetslogg
- Supabase-tabeller contacts och contacts_projects skapade
- Kundval är fritextfält med hjälptext för DVH, Foodservice, Servicehandel

### Varumärkessidan
- Produktgrupper expanderbara med inline-redigering av namn
- Artiklar redigerbara inline
- Blockering av borttagning om aktiva lanseringar finns
- Kontextuellt tips och CTA för att skapa lansering

### Tekniska förbättringar
- Sentry error tracking aktiverat
- Performance-loggning med console.time på alla Supabase-anrop
- Feedback-knapp i sidebar sparar till Supabase feedback-tabell
- Backup-script backup.js för lokal JSON-export
- CLAUDE.md, CHANGELOG.md och design.md skapade och uppdaterade
- Kommentarer på svenska i all ny kod
- Commit-meddelanden på svenska
- Favicon med LW i marinblå och guld
- Collapsbar sidebar med ikoner och tooltips i kollapsad vy
- Sökfunktion på Fönster & Kategorier och Kontakter med DOM-filtrering utan fokusförlust
- Fönster-kolumn i Fönster & Kategorier visar avisering→lansering-par
- Aktiv lansering-badge i kategoritabellen
- Arkivering och återaktivering av lanseringar med direkt rendering
- Arkiveringsdatum visas i Arkiv-vyn

### Designförbättringar
- Zonering med gradienter i sidebar och huvudinnehåll
- Ljus border i mörkt läge för distinktion
- Kortstil konsekvent genomgående med border och box-shadow
- Dagab logotyp uppdaterad med korrekt grön färg
- Coop och ICA logotyper från assets-mappen
- Sidebar utan ikoner utom Inställningar i expanderat läge

## Att göra

| # | Åtgärd | Impact | Status |
|---|---|---|---|
| 1 | Dashboard actionable | Hög – dagligt värde | Pågår |
| 2 | Visuell upplyftning | Medel – trovärdighet | Pågår |
| 3 | Mobiloptimering | Medel – framtida behov | Ej klar |
| 4 | Juridik + integritetspolicy | Medel | Ej klar |
| 5 | Betalning Stripe | Hög – intäkt | Ej klar |
| 6 | Branschkunskap – innehåll ses över | Medel | Pågår |
| 7 | Skärmbilder på landningssidan | Medel | Ej klar |
| 8 | Notifikationer via mail | Hög – återkommande användning | Ses över |
| 9 | Exportfunktion PDF/Excel | Medel | Ej klar |
| 10 | Mobilapp / PWA | Medel | Ej klar |
| 11 | Admin-vy för feedback | Låg | Avvaktar |
| 12 | Admin-vy för datakontroll – veckonummer och kedjefiler | Hög – datakvalitet | Ej klar |

## Öppna frågor och beslut

- Branschkunskap-sidans innehåll ska ses över – struktur är bra men formuleringar kan skärpas
- Dashboard testas när onboarding är verifierad
- Notifikationer via mail finns i Påminnelser men är otestad – ska ses över
- Realtime-fel i konsolen: cannot add postgres_changes callbacks for realtime:activity_log_realtime after subscribe() – ej kritiskt men bör åtgärdas
- Skärmbilder på landningssidan tas när designen sitter

## Teknisk skuld att adressera om 6 månader
- app.js är en stor fil – ska brytas upp i moduler
- Saknar automatiserade tester
- Felhantering är inkonsekvent på vissa ställen
