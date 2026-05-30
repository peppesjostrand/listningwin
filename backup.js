// backup.js — ListingWIN Supabase-backup
//
// ANVÄNDNING:
//   node backup.js
//
// KRAV:
//   Node.js 18 eller senare (inbyggd fetch används — ingen npm-installation behövs)
//   Kontrollera din version: node --version
//
// KONFIGURATION:
//   Scriptet kräver service_role-nyckeln för att kringgå RLS och hämta all data.
//   Hämta din service_role-nyckel (INTE anon-nyckeln) härifrån:
//   https://supabase.com/dashboard/project/rjbqvbnzxxltnwoqfstb/settings/api
//
//   OBS: Dela aldrig service_role-nyckeln publikt — den ger full åtkomst till databasen.
//
// OUTPUT:
//   En fil med namnet backup-YYYY-MM-DD.json sparas i samma katalog som scriptet.
//   Varje körning skapar en ny fil. Gamla backuper skrivs inte över.
//
// TABELLER SOM INKLUDERAS:
//   projects          — varumärken och lanseringar (skilda via is_lansering-flagga i data-kolumnen)
//   workspaces        — workspace-poster
//   workspace_members — vilka användare som tillhör vilket workspace
//   activity_log      — händelselogg per workspace
//   contacts          — kontaktpersoner hos kedjorna
//   contacts_projects — kopplingstabellen mellan kontakter och lanseringar
//   feedback          — inskickad feedback

'use strict';

const fs = require('fs');

const SUPA_URL = 'https://rjbqvbnzxxltnwoqfstb.supabase.co';

// OBS: Byt ut mot din service_role-nyckel från Supabase-dashboarden.
// Använd INTE anon-nyckeln — den blockeras av RLS och ger ofullständig data.
const SERVICE_ROLE_KEY = 'BYTA_UT_MOT_SERVICE_ROLE_KEY_FRAN_SUPABASE_DASHBOARDEN';

// Tabeller att inkludera i backupen
const TABLES = [
  'projects',
  'workspaces',
  'workspace_members',
  'activity_log',
  'contacts',
  'contacts_projects',
  'feedback',
];

// Hämtar alla rader från en Supabase-tabell via REST API.
async function fetchTable(table) {
  const url = `${SUPA_URL}/rest/v1/${table}?select=*`;
  const res = await fetch(url, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} — ${text}`);
  }
  return res.json();
}

// Kör backup-flödet: hämta alla tabeller och skriv till JSON-fil.
async function runBackup() {
  if (SERVICE_ROLE_KEY === 'BYTA_UT_MOT_SERVICE_ROLE_KEY_FRAN_SUPABASE_DASHBOARDEN') {
    console.error('FEL: Byt ut SERVICE_ROLE_KEY i backup.js mot din riktiga nyckel.');
    console.error('Hämta den från: https://supabase.com/dashboard/project/rjbqvbnzxxltnwoqfstb/settings/api');
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const filename = `backup-${today}.json`;

  console.log(`\nListingWIN Supabase-backup — ${today}`);
  console.log('─'.repeat(45));

  const backup = {
    created_at: new Date().toISOString(),
    project: 'ListingWIN',
    tables: {},
  };

  let totalRows = 0;

  // Hämta varje tabell och samla resultaten
  for (const table of TABLES) {
    process.stdout.write(`  ${table.padEnd(22)}`);
    try {
      const data = await fetchTable(table);
      backup.tables[table] = data;
      totalRows += data.length;
      console.log(`${data.length} rader`);
    } catch (err) {
      console.log(`FEL: ${err.message}`);
      backup.tables[table] = { error: err.message };
    }
  }

  // Skriv JSON-filen till disk
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2), 'utf8');

  console.log('─'.repeat(45));
  console.log(`  Totalt: ${totalRows} rader`);
  console.log(`  Sparad: ${filename}\n`);
}

runBackup().catch(err => {
  console.error('\nBackup misslyckades:', err.message);
  process.exit(1);
});
