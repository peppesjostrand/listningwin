
const LOGOS = {
  coop: "assets/Coop.png",
  ica: "assets/ICA.png",
  dagab: "assets/Dagab.png",
};


// ═══════════════════════════════════════════════
// DATE HELPERS
// ═══════════════════════════════════════════════
const TODAY = new Date();
TODAY.setHours(0,0,0,0); // normalize to midnight local time

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - y) / 86400000) + 1) / 7);
}

function weekDate(week, year, dow = 5) {
  // dow: 1=Mon, 5=Fri
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const w1mon = new Date(jan4);
  w1mon.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1));
  const d = new Date(w1mon);
  d.setUTCDate(w1mon.getUTCDate() + (week - 1) * 7 + (dow - 1));
  return d;
}

function fmtDate(d) {
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}
function daysLeft(d) {
  return Math.round((d - TODAY) / 86400000);
}
function weekYear(w) {
  // Om veckan redan passerat i år, ta nästa år
  const thisYear = TODAY.getFullYear();
  const thisWeek = isoWeek(TODAY);
  if (w >= thisWeek) return thisYear;
  return thisYear + 1;
}

function isoWeekToDate(w) {
  const d = weekDate(w, weekYear(w), 5); // fredag i den veckan
  d.setUTCHours(23, 59, 59, 999); // slutet av fredagen
  return d;
}

const CW = isoWeek(TODAY);

// ═══════════════════════════════════════════════
// DATA — loaded from data/windows/*.json
// ═══════════════════════════════════════════════
let COOP_FOOD_RAW, COOP_HEMMA_RAW;
let ICA_LAUNCH_WEEKS, ICA_ALL_STEPS, ICA_STEP_LABELS;
let DAGAB_RAW, DAGAB_ALL_STEPS, DAGAB_STEP_LABELS;
let COOP_CATS = [], ICA_CATS = [], DAGAB_CATS = [];

async function loadWindowData() {
  const [coop, ica, dagab, coopCats, icaCats, dagabCats] = await Promise.all([
    fetch('data/windows/coop.json').then(r => r.json()),
    fetch('data/windows/ica.json').then(r => r.json()),
    fetch('data/windows/dagab.json').then(r => r.json()),
    fetch('data/windows/coop-cats.json').then(r => r.json()),
    fetch('data/windows/ica-cats.json').then(r => r.json()),
    fetch('data/windows/dagab-cats.json').then(r => r.json()),
  ]);
  COOP_FOOD_RAW  = coop.coopFood;
  COOP_HEMMA_RAW = coop.coopHemma;
  COOP_CATS  = coopCats;
  ICA_CATS   = icaCats;
  DAGAB_CATS = dagabCats;
  ICA_LAUNCH_WEEKS = ica.launchWeeks;
  ICA_STEP_LABELS  = ica.stepLabels;
  ICA_ALL_STEPS = Object.fromEntries(
    Object.entries(ica.allSteps).map(([lw, v]) => [+lw, { dates: v.dates.map(([d,m,y]) => icaDate(d,m,y)) }])
  );
  DAGAB_RAW         = dagab.raw;
  DAGAB_STEP_LABELS = dagab.stepLabels;
  DAGAB_ALL_STEPS = Object.fromEntries(
    Object.entries(dagab.allSteps).map(([lw, v]) => [+lw, { dates: v.dates.map(([d,m,y]) => dagabDate(d,m,y)) }])
  );
  COOP_FOOD_ROUNDS  = buildCoopRounds(COOP_FOOD_RAW, 'Coop Food');
  COOP_HEMMA_ROUNDS = buildCoopRounds(COOP_HEMMA_RAW, 'Coop Hemma');
  ICA_ROUNDS   = buildIcaRounds();
  DAGAB_ROUNDS = buildDagabRounds();
}

// ═══════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════
const CATEGORIES = [
  // Coop Food — 103 kategorier
  { name: 'GRÖNSAKER', source: 'coop', sub: 'Coop Food', windows: [4, 16, 34, 42], group: 'Bröd & färskvaror', sap: 1001, kat: 230 },
  { name: 'MATBRÖD MJUKT', source: 'coop', sub: 'Coop Food', windows: [16, 40], group: 'Bröd & färskvaror', sap: 1101, kat: 225 },
  { name: 'HÅRT BRÖD & MATKEX', source: 'coop', sub: 'Coop Food', windows: [16, 40], group: 'Bröd & färskvaror', sap: 1102, kat: 229 },
  { name: 'FIKA BRÖD', source: 'coop', sub: 'Coop Food', windows: [7, 37], group: 'Bröd & färskvaror', sap: 1103, kat: 236 },
  { name: 'BUTIKSBAKAT FRYST', source: 'coop', sub: 'Coop Food', windows: [7, 37], group: 'Bröd & färskvaror', sap: 1104, kat: 252 },
  { name: 'BUTIKSBAKAT FÄRSKT', source: 'coop', sub: 'Coop Food', windows: [7, 37], group: 'Bröd & färskvaror', sap: 1105, kat: 252 },
  { name: 'MATBRÖD MJUKT TINA & SÄLJ', source: 'coop', sub: 'Coop Food', windows: [16, 40], group: 'Bröd & färskvaror', sap: 1106, kat: 225 },
  { name: 'MATBRÖD MJUKT KOLONIAL', source: 'coop', sub: 'Coop Food', windows: [16, 40], group: 'Bröd & färskvaror', sap: 1107, kat: 225 },
  { name: 'FIKABRÖD TINA OCH SÄLJ', source: 'coop', sub: 'Coop Food', windows: [7, 37], group: 'Bröd & färskvaror', sap: 1108, kat: 236 },
  { name: 'FIKABRÖD FÄRSKT', source: 'coop', sub: 'Coop Food', windows: [7, 37], group: 'Bröd & färskvaror', sap: 1109, kat: 236 },
  { name: 'MATCHARK', source: 'coop', sub: 'Coop Food', windows: [11, 37, 46], group: 'Mejeri, chark & kött', sap: 1110, kat: 233 },
  { name: 'MANUELL CHARK', source: 'coop', sub: 'Coop Food', windows: [11, 37, 46], group: 'Mejeri, chark & kött', sap: 1111, kat: 238 },
  { name: 'PÅLÄGGSCHARK', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Mejeri, chark & kött', sap: 1112, kat: 262 },
  { name: 'DELI KONSUMENTPACK', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Mejeri, chark & kött', sap: 1113, kat: 264 },
  { name: 'MATOST', source: 'coop', sub: 'Coop Food', windows: [7, 19], group: 'Mejeri, chark & kött', sap: 1120, kat: 226 },
  { name: 'PÅLÄGGSOST', source: 'coop', sub: 'Coop Food', windows: [19, 37], group: 'Mejeri, chark & kött', sap: 1121, kat: 226 },
  { name: 'MANUELL OST', source: 'coop', sub: 'Coop Food', windows: [7, 37], group: 'Mejeri, chark & kött', sap: 1122, kat: 253 },
  { name: 'DESSERTOST', source: 'coop', sub: 'Coop Food', windows: [7, 37], group: 'Mejeri, chark & kött', sap: 1123, kat: 226 },
  { name: 'FISK & SKALDJURSKONSERV KYLD', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Mejeri, chark & kött', sap: 1130, kat: 208 },
  { name: 'FISK & SKALDJUR PACKAD FÄRSK', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Mejeri, chark & kött', sap: 1131, kat: 215 },
  { name: 'MANUELL FISK & SKALDJUR', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Mejeri, chark & kött', sap: 1132, kat: 235 },
  { name: 'MANUELL BUTIKSGRILLAD', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Mejeri, chark & kött', sap: 1140, kat: 270 },
  { name: 'FÄRDIGLAGAD MAT OCH TILLBEHÖR', source: 'coop', sub: 'Coop Food', windows: [11, 19, 37, 46], group: 'Mejeri, chark & kött', sap: 1141, kat: 234 },
  { name: 'TILLBEHÖR SALLADER', source: 'coop', sub: 'Coop Food', windows: [11, 37, 46], group: 'Mejeri, chark & kött', sap: 1142, kat: 261 },
  { name: 'MANUELL FÄRDIGMAT', source: 'coop', sub: 'Coop Food', windows: [11, 37, 46], group: 'Mejeri, chark & kött', sap: 1143, kat: 263 },
  { name: 'VEGETARISKA PROTEINER', source: 'coop', sub: 'Coop Food', windows: [11, 37, 46], group: 'Mejeri, chark & kött', sap: 1144, kat: 275 },
  { name: 'KÖTT FÄRSKT MANUELL', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Mejeri, chark & kött', sap: 1150, kat: 232 },
  { name: 'KÖTT FÄRSKT KPK', source: 'coop', sub: 'Coop Food', windows: [11, 37, 42], group: 'Mejeri, chark & kött', sap: 1151, kat: 258 },
  { name: 'FÅGEL FÄRSK', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Mejeri, chark & kött', sap: 1152, kat: 237 },
  { name: 'SMÅMÅL MEJERI', source: 'coop', sub: 'Coop Food', windows: [7, 19, 37], group: 'Mejeri, chark & kött', sap: 1160, kat: 209 },
  { name: 'VEGETABILISK MEJERI', source: 'coop', sub: 'Coop Food', windows: [7, 37], group: 'Mejeri, chark & kött', sap: 1161, kat: 210 },
  { name: 'MATFETT', source: 'coop', sub: 'Coop Food', windows: [7, 19, 37], group: 'Mejeri, chark & kött', sap: 1162, kat: 219 },
  { name: 'ÄGG', source: 'coop', sub: 'Coop Food', windows: [7, 19, 37], group: 'Mejeri, chark & kött', sap: 1163, kat: 220 },
  { name: 'MEJERI – MJÖLK', source: 'coop', sub: 'Coop Food', windows: [7, 19, 37], group: 'Mejeri, chark & kött', sap: 1164, kat: 222 },
  { name: 'JUICE & FRUKTDRYCK KYLD', source: 'coop', sub: 'Coop Food', windows: [7, 37], group: 'Mejeri, chark & kött', sap: 1165, kat: 218 },
  { name: 'MEJERI – LAKTOSFRITT', source: 'coop', sub: 'Coop Food', windows: [7, 19, 37], group: 'Mejeri, chark & kött', sap: 1166, kat: 222 },
  { name: 'VEG. MEJERI OKYLT', source: 'coop', sub: 'Coop Food', windows: [7, 37], group: 'Mejeri, chark & kött', sap: 1167, kat: 210 },
  { name: 'MEJERI – MATLAGNING', source: 'coop', sub: 'Coop Food', windows: [7, 19, 37], group: 'Mejeri, chark & kött', sap: 1168, kat: 222 },
  { name: 'MEJERI – YOGHURT/FIL', source: 'coop', sub: 'Coop Food', windows: [7, 19, 37], group: 'Mejeri, chark & kött', sap: 1169, kat: 222 },
  { name: 'FRYST FRUKT & BÄR', source: 'coop', sub: 'Coop Food', windows: [11, 19, 40], group: 'Fryst', sap: 1201, kat: 267 },
  { name: 'FRYST GRÖNSAKER', source: 'coop', sub: 'Coop Food', windows: [11, 40], group: 'Fryst', sap: 1202, kat: 266 },
  { name: 'FRYST BRÖD', source: 'coop', sub: 'Coop Food', windows: [11, 19, 40], group: 'Fryst', sap: 1210, kat: 267 },
  { name: 'FRYST DESSERT', source: 'coop', sub: 'Coop Food', windows: [11, 19, 40], group: 'Fryst', sap: 1211, kat: 267 },
  { name: 'FRYST FÄRDIGLAGAT', source: 'coop', sub: 'Coop Food', windows: [11, 40], group: 'Fryst', sap: 1212, kat: 265 },
  { name: 'FRYST POTATIS', source: 'coop', sub: 'Coop Food', windows: [11, 40], group: 'Fryst', sap: 1213, kat: 266 },
  { name: 'FRYST VEGETARISK', source: 'coop', sub: 'Coop Food', windows: [11, 40], group: 'Fryst', sap: 1214, kat: 265 },
  { name: 'GLASS (endast Styckglass v.7)', source: 'coop', sub: 'Coop Food', windows: [7, 11, 19, 40], group: 'Fryst', sap: 1215, kat: 227 },
  { name: 'MATÖVERKÄNSLIGHET DJUPFRYST', source: 'coop', sub: 'Coop Food', windows: [11, 40], group: 'Fryst', sap: 1216, kat: 250 },
  { name: 'FRYST FISK & SKALDJUR', source: 'coop', sub: 'Coop Food', windows: [11, 40, 42], group: 'Fryst', sap: 1220, kat: 221 },
  { name: 'FRYST FÅGEL', source: 'coop', sub: 'Coop Food', windows: [11, 40], group: 'Fryst', sap: 1221, kat: 268 },
  { name: 'FRYST KÖTT', source: 'coop', sub: 'Coop Food', windows: [11, 37, 42], group: 'Fryst', sap: 1222, kat: 258 },
  { name: 'GODIS', source: 'coop', sub: 'Coop Food', windows: [4, 7, 19, 37], group: 'Dagligvaror', sap: 1310, kat: 224 },
  { name: 'LÖSGODIS', source: 'coop', sub: 'Coop Food', windows: [7, 19, 37], group: 'Dagligvaror', sap: 1311, kat: 228 },
  { name: 'SNACKS', source: 'coop', sub: 'Coop Food', windows: [4, 34], group: 'Dagligvaror', sap: 1312, kat: 244 },
  { name: 'LÖSVIKTSSNACKS', source: 'coop', sub: 'Coop Food', windows: [4, 34], group: 'Dagligvaror', sap: 1313, kat: 245 },
  { name: 'KRYDDOR', source: 'coop', sub: 'Coop Food', windows: [7, 34], group: 'Dagligvaror', sap: 1320, kat: 242 },
  { name: 'OLJA & VINÄGER', source: 'coop', sub: 'Coop Food', windows: [7, 34], group: 'Dagligvaror', sap: 1321, kat: 254 },
  { name: 'SMAKSÄTTARE', source: 'coop', sub: 'Coop Food', windows: [7, 34], group: 'Dagligvaror', sap: 1322, kat: 255 },
  { name: 'GRÖNSAKSKONSERVER', source: 'coop', sub: 'Coop Food', windows: [11, 40], group: 'Dagligvaror', sap: 1330, kat: 211 },
  { name: 'MELLANMÅL & EFTERRÄTTER', source: 'coop', sub: 'Coop Food', windows: [4, 19, 34], group: 'Dagligvaror', sap: 1331, kat: 257 },
  { name: 'PASTA, RIS & MOS', source: 'coop', sub: 'Coop Food', windows: [16, 40], group: 'Dagligvaror', sap: 1332, kat: 241 },
  { name: 'FÄRDIGMAT & FISKKONSERVER', source: 'coop', sub: 'Coop Food', windows: [11, 40], group: 'Dagligvaror', sap: 1333, kat: 239 },
  { name: 'BAKNING', source: 'coop', sub: 'Coop Food', windows: [11, 40], group: 'Dagligvaror', sap: 1334, kat: 213 },
  { name: 'MATÖVERKÄNSLIGHET TORR', source: 'coop', sub: 'Coop Food', windows: [16, 42], group: 'Dagligvaror', sap: 1335, kat: 250 },
  { name: 'VÄRLDENS MAT', source: 'coop', sub: 'Coop Food', windows: [4, 34], group: 'Dagligvaror', sap: 1337, kat: 247 },
  { name: 'FLINGOR, GRYN & VÄLLING', source: 'coop', sub: 'Coop Food', windows: [4, 34], group: 'Dagligvaror', sap: 1350, kat: 240 },
  { name: 'SYLT, MOS & MARMELAD', source: 'coop', sub: 'Coop Food', windows: [4], group: 'Dagligvaror', sap: 1351, kat: 256 },
  { name: 'ÖL, VIN & CIDER', source: 'coop', sub: 'Coop Food', windows: [4, 16, 37], group: 'Dagligvaror', sap: 1360, kat: 223 },
  { name: 'LÄSK & SAFT', source: 'coop', sub: 'Coop Food', windows: [4, 16, 37], group: 'Dagligvaror', sap: 1361, kat: 249 },
  { name: 'VATTEN', source: 'coop', sub: 'Coop Food', windows: [4, 16, 37], group: 'Dagligvaror', sap: 1362, kat: 269 },
  { name: 'FUNKTIONSDRYCKER', source: 'coop', sub: 'Coop Food', windows: [4, 16, 37], group: 'Dagligvaror', sap: 1363, kat: 259 },
  { name: 'JUICE & FRUKTDRYCK OKYLD', source: 'coop', sub: 'Coop Food', windows: [7, 37], group: 'Dagligvaror', sap: 1364, kat: 216 },
  { name: 'BARNMAT, MELLANMÅL&DRYCK', source: 'coop', sub: 'Coop Food', windows: [16, 42], group: 'Dagligvaror', sap: 1370, kat: 212 },
  { name: 'BARNVÄLLING, GRÖT&ERSÄTTNING', source: 'coop', sub: 'Coop Food', windows: [16, 42], group: 'Dagligvaror', sap: 1371, kat: 212 },
  { name: 'KAFFE', source: 'coop', sub: 'Coop Food', windows: [7, 34], group: 'Dagligvaror', sap: 1380, kat: 214 },
  { name: 'TE & CHOKLAD', source: 'coop', sub: 'Coop Food', windows: [7, 34], group: 'Dagligvaror', sap: 1381, kat: 214 },
  { name: 'CIGARETTER', source: 'coop', sub: 'Coop Food', windows: [4, 19, 40], group: 'Tobak', sap: 2200, kat: 344 },
  { name: 'SNUS', source: 'coop', sub: 'Coop Food', windows: [4, 19, 40], group: 'Tobak', sap: 2201, kat: 345 },
  { name: 'TOBAKS TILLBEHÖR', source: 'coop', sub: 'Coop Food', windows: [4, 19, 40], group: 'Tobak', sap: 2202, kat: 344 },
  { name: 'SNUS TOBAKSFRITT', source: 'coop', sub: 'Coop Food', windows: [4, 19, 40], group: 'Tobak', sap: 2203, kat: 345 },
  { name: 'LJUS', source: 'coop', sub: 'Coop Food', windows: [4, 34], group: 'Nonfood', sap: 2300, kat: 331 },
  { name: 'SERVETTER & ENGÅNGSMATERIAL', source: 'coop', sub: 'Coop Food', windows: [4, 34], group: 'Nonfood', sap: 2301, kat: 355 },
  { name: 'LJUSKÄLLOR', source: 'coop', sub: 'Coop Food', windows: [11, 34], group: 'Nonfood', sap: 2310, kat: 533 },
  { name: 'BATTERIER & SÄKRINGAR', source: 'coop', sub: 'Coop Food', windows: [11, 34], group: 'Nonfood', sap: 2311, kat: 356 },
  { name: 'TVÄTTMEDEL & SKÖLJMEDEL', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Hushåll', sap: 2400, kat: 319 },
  { name: 'RENGÖRING', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Hushåll', sap: 2401, kat: 315 },
  { name: 'HUSHÅLL & TOAPAPPER', source: 'coop', sub: 'Coop Food', windows: [16, 40], group: 'Hushåll', sap: 2410, kat: 323 },
  { name: 'MATEMBALLAGE', source: 'coop', sub: 'Coop Food', windows: [11, 34], group: 'Hushåll', sap: 2411, kat: 326 },
  { name: 'BLÖJOR', source: 'coop', sub: 'Coop Food', windows: [16, 42], group: 'Barn & baby', sap: 2520, kat: 320 },
  { name: 'BARNTILLBEHÖR', source: 'coop', sub: 'Coop Food', windows: [16, 42], group: 'Barn & baby', sap: 2521, kat: 320 },
  { name: 'BABYVÅRD', source: 'coop', sub: 'Coop Food', windows: [16, 42], group: 'Barn & baby', sap: 2522, kat: 320 },
  { name: 'HÄLSA', source: 'coop', sub: 'Coop Food', windows: [4, 34], group: 'Hälsa & skönhet', sap: 2600, kat: 243 },
  { name: 'RECEPTFRIA LÄKEMEDEL', source: 'coop', sub: 'Coop Food', windows: [11, 34], group: 'Hälsa & skönhet', sap: 2601, kat: 336 },
  { name: 'KROPPSVÅRD', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Hälsa & skönhet', sap: 2610, kat: 322 },
  { name: 'ANSIKTSVÅRD', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Hälsa & skönhet', sap: 2611, kat: 327 },
  { name: 'MUNVÅRD', source: 'coop', sub: 'Coop Food', windows: [4, 34], group: 'Hälsa & skönhet', sap: 2612, kat: 328 },
  { name: 'HÅRVÅRD', source: 'coop', sub: 'Coop Food', windows: [4, 34], group: 'Hälsa & skönhet', sap: 2613, kat: 329 },
  { name: 'INTIMHYGIEN', source: 'coop', sub: 'Coop Food', windows: [7, 37], group: 'Hälsa & skönhet', sap: 2614, kat: 330 },
  { name: 'RAKVÅRD', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Hälsa & skönhet', sap: 2615, kat: 351 },
  { name: 'MAKEUP & ACCESSOARER', source: 'coop', sub: 'Coop Food', windows: [4, 19, 34], group: 'Hälsa & skönhet', sap: 2616, kat: 324 },
  { name: 'DJURMAT', source: 'coop', sub: 'Coop Food', windows: [16, 34, 40], group: 'Djur', sap: 2700, kat: 325 },
  { name: 'DJUR TILLBEHÖR', source: 'coop', sub: 'Coop Food', windows: [16, 34, 40], group: 'Djur', sap: 2701, kat: 325 },
  { name: 'STÄDA, TVÄTT & STRYK', source: 'coop', sub: 'Coop Food', windows: [11, 37], group: 'Hushåll', sap: 3120, kat: 315 },
  // Coop Hemma — 36 kategorier
  { name: 'LÖKAR & FRÖER', source: 'coop', sub: 'Coop Hemma', windows: [1, 9, 35], group: 'Trädgård & växter', sap: 2002, kat: 564 },
  { name: 'INOMHUS BLOMJORD & VÄXTNÄRING', source: 'coop', sub: 'Coop Hemma', windows: [9, 38], group: 'Trädgård & växter', sap: 2011, kat: 553 },
  { name: 'BÖCKER', source: 'coop', sub: 'Coop Hemma', windows: [1, 5, 9, 12, 18, 22, 32, 35, 38, 41, 46], group: 'Böcker & kort', sap: 2110, kat: 333 },
  { name: 'GRATTISKORT & PRESEN', source: 'coop', sub: 'Coop Hemma', windows: [9, 38], group: 'Böcker & kort', sap: 2111, kat: 337 },
  { name: 'MINIHEMMAFIXAREN', source: 'coop', sub: 'Coop Hemma', windows: [12, 32, 38], group: 'Hem & fritid', sap: 2320, kat: 540 },
  { name: 'GRILLKOL OCH VED', source: 'coop', sub: 'Coop Hemma', windows: [9, 38], group: 'Hem & fritid', sap: 2321, kat: 559 },
  { name: 'SKRIV & KONTOR', source: 'coop', sub: 'Coop Hemma', windows: [9, 32], group: 'Kontor & hobby', sap: 3100, kat: 332 },
  { name: 'HOBBY, SY & STICKA', source: 'coop', sub: 'Coop Hemma', windows: [18, 41], group: 'Kontor & hobby', sap: 3101, kat: 513 },
  { name: 'HEMTEXTIL', source: 'coop', sub: 'Coop Hemma', windows: [5, 35, 41], group: 'Hem & inredning', sap: 3110, kat: 521 },
  { name: 'INREDNING', source: 'coop', sub: 'Coop Hemma', windows: [5, 35, 41], group: 'Hem & inredning', sap: 3111, kat: 563 },
  { name: 'HÖGTIDER & FEST', source: 'coop', sub: 'Coop Hemma', windows: [5, 18, 27, 32, 38, 41, 46], group: 'Hem & inredning', sap: 3112, kat: 314 },
  { name: 'MUSIK', source: 'coop', sub: 'Coop Hemma', windows: [], group: 'Media', sap: 3130, kat: 342 },
  { name: 'FILM', source: 'coop', sub: 'Coop Hemma', windows: [], group: 'Media', sap: 3131, kat: 347 },
  { name: 'MATFÖRVARING', source: 'coop', sub: 'Coop Hemma', windows: [12, 38], group: 'Kök', sap: 3200, kat: 311 },
  { name: 'KOK&STEKKÄRL', source: 'coop', sub: 'Coop Hemma', windows: [12, 38], group: 'Kök', sap: 3201, kat: 311 },
  { name: 'KÖKSREDSKAP', source: 'coop', sub: 'Coop Hemma', windows: [12, 38], group: 'Kök', sap: 3202, kat: 311 },
  { name: 'DUKNING', source: 'coop', sub: 'Coop Hemma', windows: [12, 38], group: 'Kök', sap: 3210, kat: 312 },
  { name: 'KÖKSTEXTIL', source: 'coop', sub: 'Coop Hemma', windows: [5, 35, 41], group: 'Kök', sap: 3211, kat: 515 },
  { name: 'EL - STÄDA', source: 'coop', sub: 'Coop Hemma', windows: [18, 41], group: 'Elektronik', sap: 3300, kat: 349 },
  { name: 'EL - SKÖNHET', source: 'coop', sub: 'Coop Hemma', windows: [18, 41], group: 'Elektronik', sap: 3301, kat: 350 },
  { name: 'EL - KÖKSMASKINER', source: 'coop', sub: 'Coop Hemma', windows: [18, 41], group: 'Elektronik', sap: 3302, kat: 531 },
  { name: 'UNDERKLÄDER & STRUMPOR', source: 'coop', sub: 'Coop Hemma', windows: [5, 32], group: 'Kläder & skor', sap: 3400, kat: 474 },
  { name: 'KLÄDER', source: 'coop', sub: 'Coop Hemma', windows: [9, 32, 35], group: 'Kläder & skor', sap: 3402, kat: 420 },
  { name: 'SKOR', source: 'coop', sub: 'Coop Hemma', windows: [9, 32, 35], group: 'Kläder & skor', sap: 3403, kat: 450 },
  { name: 'BARNUNDERKLÄDER & STRUMPOR', source: 'coop', sub: 'Coop Hemma', windows: [5, 32], group: 'Kläder & skor', sap: 3404, kat: 470 },
  { name: 'VÄSKOR', source: 'coop', sub: 'Coop Hemma', windows: [9, 41], group: 'Sport & fritid', sap: 3500, kat: 452 },
  { name: 'CYKLAR', source: 'coop', sub: 'Coop Hemma', windows: [12, 32, 38], group: 'Sport & fritid', sap: 3501, kat: 464 },
  { name: 'ÖVRIG SPECIAL', source: 'coop', sub: 'Coop Hemma', windows: [], group: 'Sport & fritid', sap: 3502, kat: 510 },
  { name: 'TRÄDGÅRDSMÖBLER', source: 'coop', sub: 'Coop Hemma', windows: [9], group: 'Sport & fritid', sap: 3510, kat: 544 },
  { name: 'UTOMHUSJORD & BEKÄMPNING', source: 'coop', sub: 'Coop Hemma', windows: [9, 38], group: 'Sport & fritid', sap: 3511, kat: 553 },
  { name: 'REDSKAP', source: 'coop', sub: 'Coop Hemma', windows: [9, 38], group: 'Sport & fritid', sap: 3512, kat: 550 },
  { name: 'GRILLAR&TILLBEHÖR', source: 'coop', sub: 'Coop Hemma', windows: [9, 38], group: 'Sport & fritid', sap: 3513, kat: 559 },
  { name: 'LEGO', source: 'coop', sub: 'Coop Hemma', windows: [5, 12, 22, 41, 46], group: 'Lek & sport', sap: 3800, kat: 340 },
  { name: 'LEKSAKER', source: 'coop', sub: 'Coop Hemma', windows: [12, 38], group: 'Lek & sport', sap: 3801, kat: 341 },
  { name: 'SPORT', source: 'coop', sub: 'Coop Hemma', windows: [18, 38, 41], group: 'Lek & sport', sap: 3802, kat: 469 },
  { name: 'INOMHUS KRUKOR', source: 'coop', sub: 'Coop Hemma', windows: [9, 34], group: 'Trädgård & växter', sap: 2010, kat: 566 },
    // ICA — Fresh food
  { name: 'Mejeri — Mjölk, filmjölk, yoghurt, matlagning, laktosfritt, juice, småmål', source: 'ica', sub: 'ICA', windows: [7,37], tag:'fresh', group:'Färskvaror' },
  { name: 'Mejeri — Ägg', source: 'ica', sub: 'ICA', windows: [7], tag:'fresh', group:'Färskvaror' },
  { name: 'Ost', source: 'ica', sub: 'ICA', windows: [10], tag:'fresh', group:'Färskvaror' },
  { name: 'Charkuteri', source: 'ica', sub: 'ICA', windows: [10,37], tag:'fresh', group:'Färskvaror' },
  { name: 'Kött', source: 'ica', sub: 'ICA', windows: [10,37], tag:'fresh', group:'Färskvaror' },
  { name: 'Fågel', source: 'ica', sub: 'ICA', windows: [10,37], tag:'fresh', group:'Färskvaror' },
  { name: 'Fisk, skaldjur & kaviar', source: 'ica', sub: 'ICA', windows: [10,37], tag:'fresh', group:'Färskvaror' },
  { name: 'Kyld vegetarisk', source: 'ica', sub: 'ICA', windows: [10,37], tag:'fresh', group:'Färskvaror' },
  { name: 'Färdigmat — Portionsmåltider & komponenter', source: 'ica', sub: 'ICA', windows: [10,37], tag:'fresh', group:'Färskvaror' },
  { name: 'Kylda såser & tillbehör — Sallader, dips, såser & kryddor', source: 'ica', sub: 'ICA', windows: [10,37], tag:'fresh', group:'Färskvaror' },
  { name: 'Bröd — Förpackat, bake-off, mjukt fikabröd, kex & kakor', source: 'ica', sub: 'ICA', windows: [16,39], tag:'fresh', group:'Färskvaror' },
  { name: 'Bröd — Hårt bröd & skorpor', source: 'ica', sub: 'ICA', windows: [16], tag:'fresh', group:'Färskvaror' },
  // ICA — Grocery items
  { name: 'Djupfryst — Färdigmat, grönsaker, potatis, bär, fisk & glass', source: 'ica', sub: 'ICA', windows: [10,39], tag:'frozen', group:'Dagligvaror' },
  { name: 'Djupfryst — Fågel & kött', source: 'ica', sub: 'ICA', windows: [10], tag:'frozen', group:'Dagligvaror' },
  { name: 'Varma drycker — Kaffe & te', source: 'ica', sub: 'ICA', windows: [16,42], tag:'grocery', group:'Dagligvaror' },
  { name: 'Varma drycker — Chokladdryck', source: 'ica', sub: 'ICA', windows: [16], tag:'grocery', group:'Dagligvaror' },
  { name: 'Varma drycker — Kaffefiltrar & tillbehör', source: 'ica', sub: 'ICA', windows: [35,42], tag:'grocery', group:'Dagligvaror' },
  { name: 'Kalla drycker — Energidrycker', source: 'ica', sub: 'ICA', windows: [7,22], tag:'grocery', group:'Dagligvaror' },
  { name: 'Kalla drycker — Cider, läsk, juice, vatten, öl & fruktdryck', source: 'ica', sub: 'ICA', windows: [7,35], tag:'grocery', group:'Dagligvaror' },
  { name: 'Drycker — Vin & dryckestillbehör', source: 'ica', sub: 'ICA', windows: [7], tag:'grocery', group:'Dagligvaror' },
  { name: 'Varma drycker — Glögg', source: 'ica', sub: 'ICA', windows: [35], tag:'grocery', group:'Dagligvaror' },
  { name: 'Snacks, nötter & torkad frukt', source: 'ica', sub: 'ICA', windows: [4,37], tag:'grocery', group:'Dagligvaror' },
  { name: 'Konfektyr — Bulk, choklad, presenter, sockergodis', source: 'ica', sub: 'ICA', windows: [7,19,35], tag:'grocery', group:'Dagligvaror' },
  { name: 'Konfektyr — Tuggummi & halstabletter', source: 'ica', sub: 'ICA', windows: [19], tag:'grocery', group:'Dagligvaror' },
  { name: 'Internationell mat', source: 'ica', sub: 'ICA', windows: [12,42], tag:'grocery', group:'Dagligvaror' },
  { name: 'Ris & torrpasta', source: 'ica', sub: 'ICA', windows: [19, 42], tag:'grocery', group:'Dagligvaror' },
  { name: 'Pastasås, spannmål & potatismos', source: 'ica', sub: 'ICA', windows: [19], tag:'grocery', group:'Dagligvaror' },
  { name: 'Matintolerans', source: 'ica', sub: 'ICA', windows: [19,45], tag:'grocery', group:'Dagligvaror' },
  { name: 'Flingor, müsli & gryn — inkl. gröt & havregryn', source: 'ica', sub: 'ICA', windows: [4,35], tag:'grocery', group:'Dagligvaror' },
  { name: 'Bakning', source: 'ica', sub: 'ICA', windows: [12,39], tag:'grocery', group:'Dagligvaror' },
  { name: 'Barnmat', source: 'ica', sub: 'ICA', windows: [16,42], tag:'grocery', group:'Dagligvaror' },
  { name: 'Konserver — Soppor & torrvaror', source: 'ica', sub: 'ICA', windows: [22], tag:'grocery', group:'Dagligvaror' },
  { name: 'Konserver — Grönsaker, ärtor & bönor', source: 'ica', sub: 'ICA', windows: [42], tag:'grocery', group:'Dagligvaror' },
  { name: 'Kolonial — Sylt, mos, marmelad & dessert', source: 'ica', sub: 'ICA', windows: [4], tag:'grocery', group:'Dagligvaror' },
  { name: 'Kolonial — Dressingar, majonnäs & såser', source: 'ica', sub: 'ICA', windows: [12], tag:'grocery', group:'Dagligvaror' },
  { name: 'Smaksättning — Olja, vinäger, senap, kryddor, tomatbaserat', source: 'ica', sub: 'ICA', windows: [7,37], tag:'grocery', group:'Dagligvaror' },
  // ICA — Nearfood
  { name: 'Blöjor & babyvård', source: 'ica', sub: 'ICA', windows: [16,42], tag:'nearfood', group:'Nearfood' },
  { name: 'Hushållsprodukter — Rengöring, disk & tvätt', source: 'ica', sub: 'ICA', windows: [10,37], tag:'nearfood', group:'Nearfood' },
  { name: 'Hushållsprodukter — Toalettpapper, hushållspapper & matförvaring', source: 'ica', sub: 'ICA', windows: [10], tag:'nearfood', group:'Nearfood' },
  { name: 'Djur', source: 'ica', sub: 'ICA', windows: [16,39], tag:'nearfood', group:'Nearfood' },
  { name: 'Hälsa — Sportdryck, återhämtning & kosttillskott', source: 'ica', sub: 'ICA', windows: [4,35], tag:'nearfood', group:'Nearfood' },
  { name: 'Hälsa — Viktkontroll & hälsokost', source: 'ica', sub: 'ICA', windows: [4], tag:'nearfood', group:'Nearfood' },
  { name: 'Skönhet — Deodoranter & rakning', source: 'ica', sub: 'ICA', windows: [10,37], tag:'nearfood', group:'Nearfood' },
  { name: 'Skönhet — Bomull, vård, hår & intimprodukter', source: 'ica', sub: 'ICA', windows: [12], tag:'nearfood', group:'Nearfood' },
  { name: 'Skönhet — Munvård', source: 'ica', sub: 'ICA', windows: [4,35], tag:'nearfood', group:'Nearfood' },
  { name: 'Skönhet — Hudvård, tvål, bad & spa', source: 'ica', sub: 'ICA', windows: [7,37], tag:'nearfood', group:'Nearfood' },
  { name: 'Skönhet — Hårvård, hårstyling & hårfärg', source: 'ica', sub: 'ICA', windows: [4,22], tag:'nearfood', group:'Nearfood' },
  { name: 'Skönhet — Makeup', source: 'ica', sub: 'ICA', windows: [22], tag:'nearfood', group:'Nearfood' },
  { name: 'Skönhet — Bad & kosmetiktillbehör', source: 'ica', sub: 'ICA', windows: [22,35], tag:'nearfood', group:'Nearfood' },
  { name: 'Skönhet — Parfym', source: 'ica', sub: 'ICA', windows: [39], tag:'nearfood', group:'Nearfood' },
  { name: 'Receptfria läkemedel', source: 'ica', sub: 'ICA', windows: [12,39], tag:'nearfood', group:'Nearfood' },
  { name: 'Tobak', source: 'ica', sub: 'ICA', windows: [4,22], tag:'nearfood', group:'Nearfood' },
  { name: 'Digitala presentkort', source: 'ica', sub: 'ICA', windows: [16,42], tag:'nearfood', group:'Nearfood' },
  { name: 'Bärkassar', source: 'ica', sub: 'ICA', windows: [10,35], tag:'nearfood', group:'Nearfood' },
  { name: 'Förbrukningsvaror', source: 'ica', sub: 'ICA', windows: [10], tag:'nearfood', group:'Nearfood' },
  // Dagab — alla 57 revideringsområden
  { name: 'Mejeri', source: 'dagab', sub: 'Dagab', windows: [7, 37], group: 'Mejeri & kylt', area: 1, subgroups: [{hg:'04',pg:'0401',name:'MJÖLK/MATLAGNING'},{hg:'04',pg:'0402',name:'FRUKOST'},{hg:'04',pg:'0403',name:'MATFETT/BAK/JÄST'},{hg:'04',pg:'0404',name:'ÄGG'},{hg:'04',pg:'0407',name:'LAKTOSFRITT & VÄXTBASERAT MEJERI'},{hg:'04',pg:'0408',name:'VÄXTBASERAT & MEJERI EJ KYLD'},{hg:'04',pg:'0409',name:'SMÅMÅL & DESSERT'}] },
  { name: 'Juice/Nektar', source: 'dagab', sub: 'Dagab', windows: [7, 34], group: 'Mejeri & kylt', area: 2, subgroups: [{hg:'04',pg:'0405',name:'JUICE/KYLD'},{hg:'04',pg:'0406',name:'JUICE/EJ KYLD'}] },
  { name: 'Ost', source: 'dagab', sub: 'Dagab', windows: [7, 37], group: 'Mejeri & kylt', area: 3, subgroups: [{hg:'05',pg:'0501',name:'HÅRDOST/MESSMÖR/OST'},{hg:'05',pg:'0502',name:'MJUKOST'},{hg:'05',pg:'0503',name:'DESSERTOST/FÄRSKOST'},{hg:'05',pg:'0504',name:'MATLAGNINGSOST'},{hg:'05',pg:'0505',name:'HALVMANUELL DESSERTOST/FÄRSKOST'},{hg:'05',pg:'0506',name:'MANUELL FÄRSKOST/DESSERTOST'}] },
  { name: 'Chark & deli', source: 'dagab', sub: 'Dagab', windows: [11, 37], group: 'Mejeri & kylt', area: 4, subgroups: [{hg:'06',pg:'0601',name:'RIMMADE/RÖKTA CHARKPRODUKTER'},{hg:'06',pg:'0602',name:'KORV'},{hg:'06',pg:'0603',name:'KÖTTBULLAR/ÖVR KYLDA FÄRSPROD'},{hg:'06',pg:'0604',name:'CHARK/EJ KYLD'},{hg:'06',pg:'0606',name:'SMÖRGÅSMAT SKIVAD'},{hg:'06',pg:'0607',name:'DELIKATESS KONSUMENTPACKAD'},{hg:'06',pg:'0608',name:'PASTEJ/SMÖRGÅSMAT I BIT'},{hg:'06',pg:'0609',name:'DELIKATESS LÖSVIKT'}] },
  { name: 'Kött & fågel', source: 'dagab', sub: 'Dagab', windows: [13, 37], group: 'Mejeri & kylt', area: 5, subgroups: [{hg:'07',pg:'0702',name:'JULSKINKA'},{hg:'07',pg:'0703',name:'FÅGEL'},{hg:'07',pg:'0704',name:'FRYST KÖTT'},{hg:'07',pg:'0705',name:'NÖTKÖTT'},{hg:'07',pg:'0706',name:'KÖTTFÄRS'},{hg:'07',pg:'0707',name:'FLÄSKKÖTT'},{hg:'07',pg:'0708',name:'KALVKÖTT'},{hg:'07',pg:'0709',name:'LAMMKÖTT'},{hg:'07',pg:'0710',name:'VILT'},{hg:'07',pg:'0711',name:'INÄLVSMAT'},{hg:'07',pg:'0714',name:'PANNFÄRDIGT'}] },
  { name: 'Kylda vegetariska produkter', source: 'dagab', sub: 'Dagab', windows: [13, 37], group: 'Mejeri & kylt', area: 6, subgroups: [{hg:'30',pg:'3001',name:'VEGETARISKT KYLT'}] },
  { name: 'Kyld färdigmat & måltidskomplement', source: 'dagab', sub: 'Dagab', windows: [13, 37], group: 'Mejeri & kylt', area: 7, subgroups: [{hg:'02',pg:'0201',name:'FÄRDIGLAGAT'},{hg:'02',pg:'0202',name:'SALLADSBAR/MATBAR'},{hg:'02',pg:'0206',name:'FÄRSK PASTA'},{hg:'02',pg:'0207',name:'TILLBEHÖRSSALLADER'},{hg:'02',pg:'0208',name:'KYLD SÅS/AROMSMÖR'},{hg:'02',pg:'0209',name:'MANUELL FÄRDIGMAT/CATERING'},{hg:'02',pg:'0210',name:'FÖRBUTIKSMENYER'}] },
  { name: 'Ur havet', source: 'dagab', sub: 'Dagab', windows: [13, 37], group: 'Mejeri & kylt', area: 8, subgroups: [{hg:'08',pg:'0801',name:'FISK/LAKEPRODUKTER'},{hg:'08',pg:'0802',name:'SILL/ANSJOVIS/KAVIAR'},{hg:'08',pg:'0803',name:'MANUELL FISK'}] },
  { name: 'Färskt matbröd', source: 'dagab', sub: 'Dagab', windows: [16, 40], group: 'Bröd & fryst', area: 9, subgroups: [{hg:'01',pg:'0105',name:'LÖSBRÖD/BAKE OFF MATBRÖD'},{hg:'01',pg:'0110',name:'PORTIONSBITAR/MÖRKT SKIVAT/LIMPA'},{hg:'01',pg:'0111',name:'LANT/ROST/ATMOSBRÖD'},{hg:'01',pg:'0112',name:'BRÖDKAKOR/TUNNBRÖD'},{hg:'01',pg:'0113',name:'FASTFOOD BRÖD'},{hg:'01',pg:'0115',name:'EGET BAGERI/BAKE OFF MATBRÖD'},{hg:'01',pg:'0116',name:'GRÄDDA HEMMA'}] },
  { name: 'Torra kakor, kex, skorpor & hårt bröd', source: 'dagab', sub: 'Dagab', windows: [16, 40], group: 'Bröd & fryst', area: 10, subgroups: [{hg:'01',pg:'0102',name:'KNÄCKEBRÖD/HÅRT TUNNBRÖD'},{hg:'01',pg:'0103',name:'RISKAKOR/SKORPOR'},{hg:'01',pg:'0104',name:'LÖSBRÖD/BAKE OFF KAFFEBRÖD'},{hg:'01',pg:'0106',name:'SÖTA KEX/KAKOR'},{hg:'01',pg:'0107',name:'SMÖRGÅSKEX'},{hg:'01',pg:'0108',name:'KONDITORI'},{hg:'01',pg:'0109',name:'MJUKT KAFFEBRÖD'},{hg:'01',pg:'0114',name:'EGET BAGERI/BAKE OFF KAFFEBRÖD'}] },
  { name: 'Djupfryst & glass', source: 'dagab', sub: 'Dagab', windows: [11, 40], group: 'Bröd & fryst', area: 11, subgroups: [{hg:'12',pg:'1202',name:'DJ FRUKT/BÄR'},{hg:'12',pg:'1203',name:'DJ STYCKGLASS'},{hg:'12',pg:'1204',name:'DJ HUSHÅLLSGLASS'},{hg:'12',pg:'1205',name:'DJ ENPORTION'},{hg:'12',pg:'1206',name:'DJ FLERPORTION/MÅLTIDSDELAR'},{hg:'12',pg:'1207',name:'DJ PIZZA/SNACKS'},{hg:'12',pg:'1208',name:'DJ GRÖNSAKER'},{hg:'12',pg:'1209',name:'DJ POTATIS'},{hg:'12',pg:'1210',name:'DJ FÅGEL'},{hg:'12',pg:'1211',name:'DJ FISK/SKALDJUR'},{hg:'12',pg:'1212',name:'DJ BRÖD/DESSERT'},{hg:'12',pg:'1213',name:'DJ ALLERGI'},{hg:'12',pg:'1214',name:'DJ VEGETARISKT'}] },
  { name: 'Varma drycker med tillbehör', source: 'dagab', sub: 'Dagab', windows: [11, 40], group: 'Drycker', area: 12, subgroups: [{hg:'10',pg:'1001',name:'KAFFE'},{hg:'10',pg:'1002',name:'TE/DRICKCHOKLAD'}] },
  { name: 'Kalla drycker', source: 'dagab', sub: 'Dagab', windows: [7, 37], group: 'Drycker', area: 13, subgroups: [{hg:'11',pg:'1101',name:'VATTEN'},{hg:'11',pg:'1102',name:'ÖL'},{hg:'11',pg:'1103',name:'CIDER'},{hg:'11',pg:'1106',name:'LÄSK/DRINKMIX'},{hg:'11',pg:'1107',name:'STILLDRINK'},{hg:'11',pg:'1109',name:'BACKDRICKA'}] },
  { name: 'Saft & funktionella drycker', source: 'dagab', sub: 'Dagab', windows: [4, 16, 37], group: 'Drycker', area: 14, subgroups: [{hg:'10',pg:'1031',name:'SAFT'},{hg:'11',pg:'1108',name:'FUNKTIONELLA DRYCKER'}] },
  { name: 'Snacks', source: 'dagab', sub: 'Dagab', windows: [4, 37], group: 'Dagligvaror', area: 15, subgroups: [{hg:'13',pg:'1301',name:'CHIPS/OSTBÅGAR/POPCORN'},{hg:'13',pg:'1302',name:'NÖTTER/ÖVR SNACKS'},{hg:'13',pg:'1303',name:'TORKAD FRUKT/NYTTIGA SNACKS'},{hg:'13',pg:'1304',name:'NATURGODIS LÖSVIKT'}] },
  { name: 'Konfektyr', source: 'dagab', sub: 'Dagab', windows: [7, 19, 34], group: 'Dagligvaror', area: 16, subgroups: [{hg:'14',pg:'1402',name:'LÖSVIKTSGODIS'},{hg:'14',pg:'1404',name:'GÅVA'},{hg:'14',pg:'1405',name:'SOCKER-/BARNGODIS'},{hg:'14',pg:'1406',name:'CHOKLADGODIS'},{hg:'14',pg:'1407',name:'UPPFRÄSCHARE'}] },
  { name: 'Frukt & bär, desserter', source: 'dagab', sub: 'Dagab', windows: [16, 42], group: 'Dagligvaror', area: 17, subgroups: [{hg:'10',pg:'1014',name:'SYLT/MARMELAD'},{hg:'10',pg:'1024',name:'SOPPA/KRÄM'},{hg:'10',pg:'1025',name:'FRUKTKONSERVER'},{hg:'10',pg:'1026',name:'DESSERT/GLASSTILLBEHÖR'}] },
  { name: 'Flingor, müsli & gryn', source: 'dagab', sub: 'Dagab', windows: [4, 34], group: 'Dagligvaror', area: 18, subgroups: [{hg:'10',pg:'1022',name:'GRYNER/VÄLLING'},{hg:'10',pg:'1023',name:'FLINGOR/MUSLI'}] },
  { name: 'Konserver, soppor, torr färdigmat & baljväxter', source: 'dagab', sub: 'Dagab', windows: [11, 42], group: 'Dagligvaror', area: 19, subgroups: [{hg:'10',pg:'1007',name:'TORRA BALJVÄXTER'},{hg:'10',pg:'1017',name:'TRAD INLAGDA GRÖNSAKER'},{hg:'10',pg:'1020',name:'KONSERVERADE BALJVÄXTER'},{hg:'10',pg:'1021',name:'KÖTT-/FISKKONSERV/MATMIXER'},{hg:'10',pg:'1030',name:'SOPPA'},{hg:'10',pg:'1032',name:'TORR FÄRDIGMAT'}] },
  { name: 'Grönsakskonserver', source: 'dagab', sub: 'Dagab', windows: [11, 42], group: 'Dagligvaror', area: 20, subgroups: [{hg:'10',pg:'1018',name:'GRÖNSAKSKONSERVER'}] },
  { name: 'Olja, vinäger, oliver & delikonserver', source: 'dagab', sub: 'Dagab', windows: [16, 45], group: 'Dagligvaror', area: 21, subgroups: [{hg:'10',pg:'1012',name:'MATOLJA/ÄTTIKA/VINÄGER'},{hg:'10',pg:'1019',name:'OLIV/DELIKATESSKONSERV'}] },
  { name: 'All världens mat', source: 'dagab', sub: 'Dagab', windows: [4, 34], group: 'Dagligvaror', area: 22, subgroups: [{hg:'10',pg:'1003',name:'TACO'},{hg:'10',pg:'1004',name:'ASIEN'}] },
  { name: 'Smaksättning kolonial', source: 'dagab', sub: 'Dagab', windows: [7, 34], group: 'Dagligvaror', area: 23, subgroups: [{hg:'10',pg:'1008',name:'SMAKSÄTTNING/VÅT OCH TORR SÅS'},{hg:'10',pg:'1009',name:'KRYDDOR/SALT/BULJONG/GRILL'},{hg:'10',pg:'1011',name:'DRESSING/MAJONNÄS'},{hg:'10',pg:'1013',name:'KETCHUP/SENAP'}] },
  { name: 'Pasta, ris & mos', source: 'dagab', sub: 'Dagab', windows: [16, 42], group: 'Dagligvaror', area: 24, subgroups: [{hg:'10',pg:'1005',name:'PASTA/SÅS TILL PASTA'},{hg:'10',pg:'1006',name:'RIS/MOS/MATGRYN/SÅS TILL RIS'}] },
  { name: 'Bak & sötningsprodukter', source: 'dagab', sub: 'Dagab', windows: [11, 42], group: 'Dagligvaror', area: 25, subgroups: [{hg:'10',pg:'1027',name:'MJÖL/BAKMIXER'},{hg:'10',pg:'1028',name:'SOCKER/HONUNG'},{hg:'10',pg:'1029',name:'BAKTILLBEHÖR'}] },
  { name: 'Matöverkänslighet', source: 'dagab', sub: 'Dagab', windows: [19, 45], group: 'Dagligvaror', area: 26, subgroups: [{hg:'10',pg:'1016',name:'ALLERGI'}] },
  { name: 'Barn & baby', source: 'dagab', sub: 'Dagab', windows: [16, 42], group: 'Dagligvaror', area: 27, subgroups: [{hg:'15',pg:'1501',name:'BARNMAT/BARNVÄLLING'},{hg:'15',pg:'1502',name:'BLÖJOR'},{hg:'15',pg:'1503',name:'BABYARTIKLAR'},{hg:'15',pg:'1504',name:'BARNMAT/BARNVÄLLING KYLD'}] },
  { name: 'Djur', source: 'dagab', sub: 'Dagab', windows: [16, 42], group: 'Dagligvaror', area: 28, subgroups: [{hg:'16',pg:'1602',name:'KATT'},{hg:'16',pg:'1603',name:'HUND'},{hg:'16',pg:'1604',name:'ÖVRIGA DJUR'}] },
  { name: 'Häst', source: 'dagab', sub: 'Dagab', windows: [4, 34], group: 'Dagligvaror', area: 29, subgroups: [{hg:'16',pg:'1605',name:'HÄST'}] },
  { name: 'Tvätt, rengöring & disk', source: 'dagab', sub: 'Dagab', windows: [11, 37], group: 'Nearfood', area: 30, subgroups: [{hg:'18',pg:'1801',name:'RENGÖRING/DOFTMEDEL'},{hg:'18',pg:'1802',name:'DISKMEDEL'},{hg:'18',pg:'1803',name:'TVÄTTA'}] },
  { name: 'Papper', source: 'dagab', sub: 'Dagab', windows: [16, 42], group: 'Nearfood', area: 31, subgroups: [{hg:'18',pg:'1804',name:'PAPPER'}] },
  { name: 'Hårvård', source: 'dagab', sub: 'Dagab', windows: [4, 34], group: 'Nearfood', area: 32, subgroups: [{hg:'17',pg:'1702',name:'HÅRVÅRD/FÄRG'}] },
  { name: 'Hårmode & hemmaspa', source: 'dagab', sub: 'Dagab', windows: [4], group: 'Nearfood', area: 33, subgroups: [{hg:'17',pg:'1709',name:'HÅRMODE OCH HEMMASPA'}] },
  { name: 'Kroppsvård, ansiktsvård, rakning & egenvård', source: 'dagab', sub: 'Dagab', windows: [11, 37], group: 'Nearfood', area: 34, subgroups: [{hg:'17',pg:'1701',name:'RAKARTIKLAR/DEODORANTER'},{hg:'17',pg:'1705',name:'TOALETTARTIKLAR SÅRVÅRD'},{hg:'17',pg:'1707',name:'HUDVÅRD'},{hg:'17',pg:'1708',name:'TVÅL/DUSCH'}] },
  { name: 'Munvård', source: 'dagab', sub: 'Dagab', windows: [4, 34], group: 'Nearfood', area: 35, subgroups: [{hg:'17',pg:'1703',name:'MUNHYGIEN'}] },
  { name: 'Intimhygien', source: 'dagab', sub: 'Dagab', windows: [7, 42], group: 'Nearfood', area: 36, subgroups: [{hg:'17',pg:'1704',name:'INTIMHYGIEN'}] },
  { name: 'Make-up', source: 'dagab', sub: 'Dagab', windows: [4, 34], group: 'Nearfood', area: 37, subgroups: [{hg:'17',pg:'1706',name:'MAKE UP'}] },
  { name: 'Hälsa', source: 'dagab', sub: 'Dagab', windows: [4, 34], group: 'Nearfood', area: 38, subgroups: [{hg:'10',pg:'1015',name:'HÄLSOKOST/VITAMINER'}] },
  { name: 'Receptfria läkemedel', source: 'dagab', sub: 'Dagab', windows: [11, 37], group: 'Nearfood', area: 39, subgroups: [{hg:'27',pg:'2701',name:'NIKOTINPREPARAT'},{hg:'27',pg:'2702',name:'RECEPTFRIA LÄKEMEDEL'}] },
  { name: 'Tobak', source: 'dagab', sub: 'Dagab', windows: [4, 19, 39], group: 'Nearfood', area: 40, subgroups: [{hg:'21',pg:'2101',name:'CIGARETTER'},{hg:'21',pg:'2102',name:'SNUS'},{hg:'21',pg:'2103',name:'TOBAK ÖVRIG'},{hg:'21',pg:'2104',name:'TOBAK TILLBEHÖR'},{hg:'21',pg:'2105',name:'NIKOTINPORTIONER'},{hg:'21',pg:'2106',name:'E-CIGARETTER'}] },
  { name: 'Kort/presentpapper', source: 'dagab', sub: 'Dagab', windows: [11, 34], group: 'Special', area: 41, subgroups: [{hg:'19',pg:'1919',name:'KORT/PRESENTPAPPER'}] },
  { name: 'Ljus, servetter & engångsartiklar', source: 'dagab', sub: 'Dagab', windows: [4, 34], group: 'Special', area: 42, subgroups: [{hg:'19',pg:'1916',name:'ENGÅNGSARTIKLAR/PARTY'},{hg:'19',pg:'1917',name:'LJUS/SERVETTER/DUKAR'}] },
  { name: 'Köket', source: 'dagab', sub: 'Dagab', windows: [4, 37], group: 'Special', area: 43, subgroups: [{hg:'19',pg:'1907',name:'KÖKET'},{hg:'19',pg:'1909',name:'MATFÖRVARING FLERGÅNGSBRUK'},{hg:'19',pg:'1908',name:'MATFÖRVARING ENGÅNGSBRUK'}] },
  { name: 'Badrum', source: 'dagab', sub: 'Dagab', windows: [7, 40], group: 'Special', area: 44, subgroups: [{hg:'19',pg:'1904',name:'BADRUM'}] },
  { name: 'Städartiklar', source: 'dagab', sub: 'Dagab', windows: [13, 40], group: 'Special', area: 45, subgroups: [{hg:'19',pg:'1903',name:'STÄDARTIKLAR'}] },
  { name: 'Batterier, ljuskällor & proppar', source: 'dagab', sub: 'Dagab', windows: [7, 40], group: 'Special', area: 46, subgroups: [{hg:'19',pg:'1901',name:'BATTERIER/LJUSKÄLLOR/PROPPAR'}] },
  { name: 'Gör det själv', source: 'dagab', sub: 'Dagab', windows: [7, 40], group: 'Special', area: 47, subgroups: [{hg:'19',pg:'1902',name:'GÖR DET SJÄLV'}] },
  { name: 'Hemkontor', source: 'dagab', sub: 'Dagab', windows: [11, 37], group: 'Special', area: 48, subgroups: [{hg:'19',pg:'1914',name:'HEMKONTOR'}] },
  { name: 'Förvaring', source: 'dagab', sub: 'Dagab', windows: [7, 40], group: 'Special', area: 49, subgroups: [{hg:'19',pg:'1928',name:'FÖRVARING'}] },
  { name: 'Hemtextil', source: 'dagab', sub: 'Dagab', windows: [4, 34], group: 'Special', area: 50, subgroups: [{hg:'19',pg:'1922',name:'HEMTEXTIL'}] },
  { name: 'Grill & trädgård', source: 'dagab', sub: 'Dagab', windows: [11, 37], group: 'Special', area: 51, subgroups: [{hg:'19',pg:'1920',name:'GRILL'},{hg:'19',pg:'1925',name:'TRÄDGÅRD'}] },
  { name: 'Krukor/vaser/konstväxter', source: 'dagab', sub: 'Dagab', windows: [11, 19, 37], group: 'Special', area: 52, subgroups: [{hg:'19',pg:'1926',name:'KRUKOR/VASER/KONSTVÄXTER'}] },
  { name: 'Lek & rita/måla', source: 'dagab', sub: 'Dagab', windows: [4, 11, 19, 34], group: 'Special', area: 53, subgroups: [{hg:'19',pg:'1915',name:'LEK RITA/MÅLA'}] },
  { name: 'Media hårdvara', source: 'dagab', sub: 'Dagab', windows: [7, 42], group: 'Special', area: 54, subgroups: [{hg:'19',pg:'1906',name:'MEDIA HÅRDVARA'}] },
  { name: 'Kläder', source: 'dagab', sub: 'Dagab', windows: [4, 11, 34, 42], group: 'Special', area: 55, subgroups: [{hg:'19',pg:'1912',name:'KLÄDER'}] },
  { name: 'Glasögon', source: 'dagab', sub: 'Dagab', windows: [11, 42], group: 'Special', area: 56, subgroups: [{hg:'19',pg:'1923',name:'GLASÖGON'}] },
  { name: 'Bilistiskt', source: 'dagab', sub: 'Dagab', windows: [7, 40], group: 'Special', area: 57, subgroups: [{hg:'19',pg:'1924',name:'BILISTISKT'}] },
];

// ═══════════════════════════════════════════════
// BUILD ROUNDS
// ═══════════════════════════════════════════════
function buildCoopRounds(rawArr, subname) {
  return rawArr.map(r => {
    // Dynamically assign year — if the launch week has passed this year, use next year
    const thisYear = TODAY.getFullYear();
    const thisWeek = isoWeek(TODAY);
    const launchYear = r.launch >= thisWeek ? thisYear : thisYear + 1;
    const launchD = weekDate(r.launch, launchYear, 1);

    function stepDate(w, isFri=true) {
      // If step week > launch week, the step is in the year before launch
      const y = w > r.launch ? launchYear - 1 : launchYear;
      return weekDate(w, y, isFri ? 5 : 1);
    }

    const steps = [
      { key:'avisering', label:'Deadline Nyhetspresentation', date: stepDate(r.av), week: r.av, primary: true },
      { key:'ks',        label:'KS Bild & artikelinfo (Validoo)', date: stepDate(r.ks), week: r.ks },
      { key:'sortiment', label:'Sortiment i Leverantörsportalen', date: stepDate(r.sort), week: r.sort },
      { key:'launch',    label:'Lanseringsvecka', date: launchD, week: r.launch, isLaunch: true },
    ];
    steps.forEach(s => s.days = daysLeft(s.date));

    return { id: r.id, customer: 'coop', sub: subname, launch: r.launch, launchDate: launchD, steps };
  });
}

// ICA all steps — explicit Date objects, all launches 2026
function icaDate(d, m, y) {
  const base = new Date(Date.UTC(y, m, d));
  // Om datumet redan passerat, flytta fram ett år
  if (base < TODAY) {
    base.setUTCFullYear(base.getUTCFullYear() + 1);
  }
  return base;
}

function buildIcaRounds() {
  return ICA_LAUNCH_WEEKS.map((lw) => {
    const d = ICA_ALL_STEPS[lw];
    const dates = d.dates;
    const launchD = dates[7];
    const steps = ICA_STEP_LABELS.map((label, i) => ({
      key: i === 7 ? 'launch' : 's' + (i+1),
      label,
      date: dates[i],
      week: isoWeek(dates[i]),
      primary: i === 0,
      isLaunch: i === 7,
    }));
    steps.forEach(s => s.days = daysLeft(s.date));
    return { id: 'ICA' + lw, customer: 'ica', sub: 'ICA', launch: lw, launchDate: launchD, steps };
  });
}

// Full Dagab step dates from PDF — explicit dates per step
// Format: [day, month(0-indexed), year]
function dagabDate(d, m, y) {
  const base = new Date(Date.UTC(y, m, d));
  if (base < TODAY) {
    base.setUTCFullYear(base.getUTCFullYear() + 1);
  }
  return base;
}

function buildDagabRounds() {
  return DAGAB_RAW.map(r => {
    const d = DAGAB_ALL_STEPS[r.launch];
    const dates = d.dates;
    const launchD = dates[8];
    const steps = DAGAB_STEP_LABELS.map((label, i) => ({
      key: i === 8 ? 'launch' : 's' + (i+1),
      label,
      date: dates[i],
      week: isoWeek(dates[i]),
      primary: i === 0,
      isLaunch: i === 8,
    }));
    steps.forEach(s => s.days = daysLeft(s.date));
    return { id: r.id, customer: 'dagab', sub: 'Dagab', launch: r.launch, launchDate: launchD, steps };
  });
}

let COOP_FOOD_ROUNDS, COOP_HEMMA_ROUNDS, ICA_ROUNDS, DAGAB_ROUNDS;

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
const state = {
  active: { coop: true, coopHemma: false, ica: true, dagab: true },
  showPast: false,
  tab: 'overview',
  selectedCat: null,
  catTab: 'coop',
  catSearch: '',
};

function allRounds() {
  const r = [];
  if (state.active.coop) { r.push(...COOP_FOOD_ROUNDS); if (state.active.coopHemma) r.push(...COOP_HEMMA_ROUNDS); }
  if (state.active.ica) r.push(...ICA_ROUNDS);
  if (state.active.dagab) r.push(...DAGAB_ROUNDS);
  return r;
}

function visibleRounds() {
  if (state.showPast) return allRounds();
  return allRounds().filter(r => daysLeft(r.launchDate) >= -21);
}

// ═══════════════════════════════════════════════
// STATUS
// ═══════════════════════════════════════════════
function status(days) {
  if (days < 0) return { cls: 'pill-done', label: 'Passerad' };
  if (days <= 7) return { cls: 'pill-urgent', label: `${days}d — KRITISK` };
  if (days <= 21) return { cls: 'pill-soon', label: `${days}d — snart` };
  return { cls: 'pill-ok', label: `${days}d` };
}

function nextStepOf(round) {
  // Next upcoming primary step (avisering), fallback to any non-launch step
  return round.steps.find(s => s.primary && s.days >= 0)
      || round.steps.find(s => !s.isLaunch && s.days >= 0);
}

// ═══════════════════════════════════════════════
// RENDER HERO
// ═══════════════════════════════════════════════
function renderHero() {
  const groups = [
    { key: 'coop', rounds: [...COOP_FOOD_ROUNDS, ...(state.active.coopHemma ? COOP_HEMMA_ROUNDS : [])], label: 'Coop' },
    { key: 'ica',  rounds: ICA_ROUNDS, label: 'ICA' },
    { key: 'dagab',rounds: DAGAB_ROUNDS, label: 'Dagab' },
  ];

  // Collect all launch weeks relevant to the user's brands for each customer
  function brandLaunchWeeks(customerKey) {
    const allCats = brands.flatMap(b => (b.productGroups||[]).flatMap(g => g.cats||[]).concat(b.products.flatMap(p => p.cats||[])));
    const relevant = allCats.filter(c => c.source === customerKey);
    const catDefs = relevant.map(c => CATEGORIES.find(cd => cd.name === c.catName && cd.source === customerKey)).filter(Boolean);
    return new Set(catDefs.flatMap(cd => cd.windows));
  }

  const cards = groups.map(g => {
    if (!state.active[g.key]) return '';

    // If brands exist, filter rounds to only those relevant to brand categories
    let relevantRounds = g.rounds;
    if (brands.length > 0) {
      const weeks = brandLaunchWeeks(g.key);
      if (weeks.size > 0) {
        relevantRounds = g.rounds.filter(r => weeks.has(r.launch));
      } else {
        // Brand exists but no categories linked for this customer — skip card
        return '';
      }
    }

    const upcoming = relevantRounds.flatMap(r => r.steps.filter(s => s.primary && daysLeft(s.date) >= 0))
      .sort((a,b) => daysLeft(a.date) - daysLeft(b.date))[0];
    if (!upcoming) return '';
    const ownerRound = relevantRounds.find(r => r.steps.includes(upcoming));
    const upcomingDays = daysLeft(upcoming.date);
    return `<div class="hero-card ${g.key}">
      <div class="hero-card-accent"></div>
      <div class="hero-card-top">
        <img class="hero-card-logo" src="${LOGOS[g.key]}">
        <span class="hero-card-label">Nästa deadline</span>
      </div>
      <div class="hero-card-body">
        <div class="hero-card-left">
          <div class="hero-card-type">Avisering</div>
          <div class="hero-card-weeks">v.${upcoming.week}<span>→</span>v.${ownerRound.launch}</div>
        </div>
        <div class="hero-card-right">
          <div class="hero-days ${g.key}">${upcomingDays}</div>
          <div class="hero-unit">dagar</div>
        </div>
      </div>
    </div>`;
  }).filter(Boolean);

  document.getElementById('hero-area').innerHTML = cards.join('');
}

// ═══════════════════════════════════════════════
// RENDER ROUND CARD
// ═══════════════════════════════════════════════
function renderRoundCard(r) {
  const tagCls = 'tag-' + r.customer;
  const logoImg = '<img src="' + LOGOS[r.customer] + '" style="height:14px;object-fit:contain;opacity:1;max-width:44px">';
  const subLabel = r.sub === 'Coop Food' ? 'FOOD' : r.sub === 'Coop Hemma' ? 'HEMMA' : '';
  const tagContent = subLabel
    ? logoImg + '<span style="font-size:9px;opacity:0.7;margin-left:2px">' + subLabel + '</span>'
    : logoImg;

  const primary = r.steps.find(s => s.primary);
  const launchStep = r.steps.find(s => s.isLaunch);
  const dl = daysLeft(r.launchDate);
  const custColor = r.customer==='coop' ? 'var(--coop-color)' : r.customer==='ica' ? 'var(--ica-color)' : 'var(--dagab-color)';
  const labelBadge = r.label ? '<span style="font-size:10px;padding:2px 7px;border-radius:4px;background:rgba(13,79,53,0.15);color:var(--dagab-color);border:1px solid rgba(13,79,53,0.3);margin-left:4px">' + r.label.toUpperCase() + '</span>' : '';

  // Categories that belong to this round (same source + launch week)
  const roundCats = CATEGORIES.filter(c => c.source === r.customer && c.windows.includes(r.launch));
  const catNames = roundCats.length
    ? roundCats.map(c => c.name).join(' · ')
    : 'v.' + r.launch;

  // Primary row pill
  let primaryPill = '';
  if (!primary) {
    primaryPill = '<span class="pill pill-done">Passerad</span>';
  } else if (primary.days < 0) {
    primaryPill = '<span class="pill pill-done">Passerad</span>';
  } else {
    const st = status(primary.days);
    primaryPill = '<span class="pill ' + st.cls + '">' + st.label + '</span>';
  }

  // Launch pill
  const launchPill = launchStep
    ? '<span class="pill pill-launch">v.' + r.launch + '</span>'
    : '';

  // All steps for expanded view
  const allStepsHtml = r.steps.map((s, i) => {
    if (!state.showPast && s.days < 0 && !s.isLaunch) return '';
    const isDone = s.days < 0 && !s.isLaunch;
    let pill = '';
    if (s.isLaunch)    pill = '<span class="pill pill-launch">v.' + s.week + '</span>';
    else if (isDone)   pill = '<span class="pill pill-done">Passerad</span>';
    else               { const st = status(s.days); pill = '<span class="pill ' + st.cls + '">' + st.label + '</span>'; }
    const numCls = isDone ? 'done' : s.isLaunch ? 'launch-num' : s.primary ? 'is-next' : '';
    const labelCls = isDone ? 'done' : s.isLaunch ? 'launch-label' : '';
    return '<div class="step-row' + (s.isLaunch ? ' is-launch' : '') + (s.primary ? ' is-primary-step' : '') + '">'
      + '<div class="step-num ' + numCls + '">' + (s.isLaunch ? '★' : (i + 1)) + '</div>'
      + '<div class="step-label ' + labelCls + '">' + s.label + '</div>'
      + '<div class="step-week-col ' + (s.isLaunch ? 'launch-week' : isDone ? 'done' : '') + '">v.' + s.week + '</div>'
      + '<div class="step-status-col">' + pill + '</div>'
      + '</div>';
  }).join('');

  return '<div class="round-card" id="rc-' + r.id + '">'
    // PRIMARY ROW — always visible, click expands
    + '<div class="round-primary-row" data-toggle="rc-' + r.id + '">'
    +   '<span class="customer-tag ' + tagCls + '" style="display:flex;align-items:center;gap:3px;padding:4px 8px">' + tagContent + '</span>'
    +   '<div class="round-info">'
    +     '<div class="round-launch" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
    +       (primary && primary.days >= 0
          ? '<span style="font-size:12px">' + catNames + '</span>'
          + '<span style="color:var(--muted);font-size:11px">Avisering v.' + primary.week + '</span>'
          : '<span style="font-size:12px;color:var(--muted)">' + catNames + '</span>'
          + '<span style="color:var(--muted2);font-size:11px"> · Avisering passerad</span>')
    +     '</div>'
    +   '</div>'
    +   '<div style="display:flex;align-items:center;gap:8px;margin-left:auto">'
    +     primaryPill
    +     launchPill
    +     labelBadge
    +     '<span class="chevron" style="margin-left:4px">▼</span>'
    +   '</div>'
    + '</div>'
    // EXPANDED STEPS — hidden by default
    + '<div class="round-steps">' + allStepsHtml + '</div>'
    + '</div>';
}

// ═══════════════════════════════════════════════
// RENDER OVERVIEW — brand boxes
// ═══════════════════════════════════════════════
function renderOverview() {
  const allRoundsMap = {
    coop:  [...COOP_FOOD_ROUNDS, ...(state.active.coopHemma ? COOP_HEMMA_ROUNDS : [])],
    ica:   ICA_ROUNDS,
    dagab: DAGAB_ROUNDS,
  };

  // Helper: get next avisering + launch for a category
  function catDeadlines(catName, source) {
    const catDef = CATEGORIES.find(c => c.name === catName && c.source === source);
    if (!catDef) return null;
    const rounds = allRoundsMap[source] || [];
    const catRounds = rounds.filter(r => catDef.windows.includes(r.launch));
    // Find the round with the next upcoming avisering — launch comes from same round
    const nextAv = catRounds
      .map(r => ({ r, step: r.steps.find(s => s.primary && s.days >= 0) }))
      .filter(x => x.step)
      .sort((a, b) => a.step.days - b.step.days)[0];
    return {
      avWeek:     nextAv ? nextAv.step.week           : null,
      avDays:     nextAv ? nextAv.step.days           : null,
      launchWeek: nextAv ? nextAv.r.launch            : null,
      launchDays: nextAv ? daysLeft(nextAv.r.launchDate) : null,
    };
  }

  if (!brands.length) {
    document.getElementById('overview-content').innerHTML =
      '<div class="empty-state" style="margin-top:40px">Inga varumärken än — lägg till i fliken Varumärken</div>';
    return;
  }

  const custColor = { coop: 'var(--coop-color)', ica: 'var(--ica-color)', dagab: 'var(--dagab-color)' };

  let html = '<div class="brand-overview-grid">';

  brands.forEach(b => {
    // Collect all cat rows across all products
    const allRows = [];
    // Produktgrupper (ny struktur)
    (b.productGroups||[]).forEach(g => {
      (g.cats||[]).forEach(c => {
        if (!state.active[c.source]) return;
        if (c.source === 'coop' && c.catName) {
          const catDef = CATEGORIES.find(cd => cd.name === c.catName && cd.source === 'coop');
          if (catDef && catDef.sub === 'Coop Hemma' && !state.active.coopHemma) return;
        }
        const dl = catDeadlines(c.catName, c.source);
        allRows.push({ product: g.name, catName: c.catName, source: c.source, dl });
      });
    });

    // Sort: soonest avisering first, nulls last
    allRows.sort((a, b) => {
      const da = a.dl?.avDays ?? 9999;
      const db = b.dl?.avDays ?? 9999;
      return da - db;
    });

    // Find nearest deadline for badge
    const nearest = allRows.find(r => r.dl?.avDays != null && r.dl.avDays >= 0);
    let badgeHtml = '';
    if (nearest) {
      const st = status(nearest.dl.avDays);
      badgeHtml = '<span class="pill ' + st.cls + '" style="margin-left:auto">' + st.label + '</span>';
    }

    // Build rows
    const rowsHtml = allRows.length === 0
      ? '<div style="color:var(--muted);font-size:11px;padding:10px 0">Inga kopplade kategorier</div>'
      : allRows.map(row => {
          const logo = '<img src="' + LOGOS[row.source] + '" style="height:11px;object-fit:contain;max-width:32px;vertical-align:middle;opacity:0.85">';
          let avHtml = '<span style="color:var(--muted)">—</span>';
          let lvHtml = '<span style="color:var(--muted)">—</span>';
          let pillHtml = '';
          if (row.dl) {
            if (row.dl.avDays != null) {
              const st = status(row.dl.avDays);
              const col = row.dl.avDays < 0 ? 'var(--muted)' : 'var(--text)';
              avHtml = '<span style="color:' + col + '">v.' + row.dl.avWeek + '</span>';
              pillHtml = row.dl.avDays >= 0 ? '<span class="pill ' + st.cls + '">' + st.label + '</span>' : '<span class="pill pill-done">Passerad</span>';
            }
            if (row.dl.launchWeek != null) {
              lvHtml = '<span style="color:var(--text)">v.' + row.dl.launchWeek + '</span>';
            }
          }
          return '<div class="bov-row">'
            + '<div class="bov-logo">' + logo + '</div>'
            + '<div class="bov-product">' + row.product + '</div>'
            + '<div class="bov-cat">' + row.catName + '</div>'
            + '<div class="bov-av">' + avHtml + '</div>'
            + '<div class="bov-lv">' + lvHtml + '</div>'
            + '<div class="bov-pill">' + pillHtml + '</div>'
            + '</div>';
        }).join('');

    html += '<div class="bov-box">'
      + '<div class="bov-header">'
      +   (b.logo
          ? '<img class="bov-brand-logo" src="' + b.logo + '" alt="' + b.name + '">'
          : '<span class="brand-color-dot" style="background:' + (b.color||'#888') + ';width:12px;height:12px;border-radius:50%;display:inline-block;flex-shrink:0"></span>'
          + '<span class="bov-brand-name">' + b.name + '</span>')
      +   badgeHtml
      + '</div>'
      + '<div class="bov-table-head">'
      +   '<div></div><div>Produkt</div><div>Kategori</div><div>Avisering</div><div>Lansering</div><div></div>'
      + '</div>'
      + '<div class="bov-rows">' + rowsHtml + '</div>'
      + '</div>';
  });

  html += '</div>';

  // Lägg till mobilsnabbvy
  html += renderMobileQuick();

  document.getElementById('overview-content').innerHTML = html;

}

// ═══════════════════════════════════════════════
// RENDER CATEGORIES
// ═══════════════════════════════════════════════
function renderCategories() {
  if (!state.catTab) state.catTab = 'coop';
  const activeChain = state.catTab;
  const q = (state.catSearch || '').toLowerCase();

  // Chain tabs with logos
  const tabBar = ['coop', 'ica', 'dagab'].map(k => {
    const lbl = k === 'coop' ? 'Coop' : k === 'ica' ? 'ICA' : 'Dagab';
    const active = activeChain === k;
    const col = active ? 'var(--' + k + '-color)' : 'transparent';
    return `<button class="tl-cust-tab${active ? ' active' : ''}"
              onclick="state.catTab='${k}';state.catSearch='';state.selectedCat=null;renderCategories()"
              style="border-bottom-color:${col};gap:8px">
              <img src="${LOGOS[k]}" style="height:14px;object-fit:contain;max-width:36px">
            </button>`;
  }).join('');

  // Rounds for active chain
  const sourceRounds = activeChain === 'coop'
    ? [...COOP_FOOD_ROUNDS, ...(state.active.coopHemma ? COOP_HEMMA_ROUNDS : [])]
    : activeChain === 'ica' ? ICA_ROUNDS : DAGAB_ROUNDS;

  // Filter categories for active chain + search
  const filtered = CATEGORIES.filter(c => {
    if (c.source !== activeChain) return false;
    if (c.source === 'coop' && c.sub === 'Coop Hemma' && !state.active.coopHemma) return false;
    if (q && !c.name.toLowerCase().includes(q)) return false;
    return true;
  });

  const rows = filtered.map(c => {
    // Build avisering→fönster pair badges
    const pairBadges = c.windows.map(w => {
      const round = sourceRounds.find(r => r.launch === w);
      const primary = round ? round.steps.find(s => s.primary) : null;
      if (primary) {
        return `<span class="wchip wchip-pair">v.${primary.week}&thinsp;→&thinsp;v.${w}</span>`;
      }
      return `<span class="wchip">v.${w}</span>`;
    }).join('');

    const sel = state.selectedCat === c.name ? 'selected' : '';
    const rowId = 'sg-' + c.source + '-' + (c.area||0) + '-' + Math.random().toString(36).slice(2,6);
    const hasSubs = c.subgroups && c.subgroups.length > 0;
    const safeName = c.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const areaLabel = c.area ? `<span style="font-size:9px;color:var(--muted);margin-right:5px">Omr.${c.area}</span>` : '';
    const trClick = hasSubs ? '' : `onclick="selectCat('${safeName}')"`;
    const tdClick = `onclick="selectCat('${safeName}')" style="cursor:pointer"`;
    const sgToggle = hasSubs
      ? `<span class="subgroup-toggle" onclick="event.stopPropagation();toggleSubgroup('${rowId}')">⊞ ${c.subgroups.length} artikelgrupp${c.subgroups.length > 1 ? 'er' : ''}</span>`
      : '';
    const sgRows = hasSubs
      ? c.subgroups.map(s => `<tr><td>${s.hg}</td><td>${s.pg}</td><td>${s.name}</td></tr>`).join('')
      : '';
    const sgPanel = sgRows
      ? `<tr class="subgroup-tr"><td colspan="3"><div class="subgroup-panel" id="${rowId}"><table class="sg-table">${sgRows}</table></div></td></tr>`
      : '';

    return `<tr class="cat-row ${sel}${hasSubs ? ' has-subgroup' : ''}" ${trClick}>
      <td style="font-size:10px;color:var(--muted2)">${c.group || c.sub}</td>
      <td class="cat-name-cell" ${tdClick}>${areaLabel}${c.name}${sgToggle ? ' ' + sgToggle : ''}</td>
      <td><div class="window-chips">${pairBadges}</div></td>
    </tr>${sgPanel}`;
  }).join('');

  const tableHTML = `
    <div style="padding:16px 20px 0">
      <div style="display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:16px">${tabBar}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:14px;color:var(--muted)">⌕</span>
        <input style="background:var(--surface2);border:1px solid var(--border);color:var(--text);font-family:var(--font);font-size:12px;border-radius:6px;padding:6px 10px;width:260px"
               type="text" id="cat-search" placeholder="Sök kategori..."
               autocomplete="new-password" name="search-cats"
               oninput="state.catSearch=this.value;renderCategories()">
      </div>
    </div>
    <table class="cat-table">
      <thead><tr>
        <th>Grupp</th>
        <th>Kategori</th>
        <th>Fönster</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="3" style="color:var(--muted);padding:20px">Inga kategorier hittades</td></tr>'}</tbody>
    </table>`;

  // Restore search input value (innerHTML wipes it)
  let detailHTML = '';
  if (state.selectedCat) {
    const cat = CATEGORIES.find(c => c.name === state.selectedCat && c.source === activeChain);
    if (cat) {
      const roundsForCat = sourceRounds.filter(r => cat.windows.includes(r.launch));
      const visibleRounds = state.showPast ? roundsForCat : roundsForCat.filter(r => daysLeft(r.launchDate) >= -21);
      detailHTML = `<div class="detail-panel">
        <div class="detail-title">${cat.name}</div>
        <div class="detail-sub">${cat.sub} · Revideringsfönster: ${cat.windows.map(w=>'v.'+w).join(', ')}</div>
        ${visibleRounds.length ? visibleRounds.map(renderRoundCard).join('') : '<div class="empty-state">Inga matchande omgångar</div>'}
      </div>`;
    }
  }

  document.getElementById('cat-content').innerHTML = tableHTML + detailHTML;

  // Restore search value (lost when innerHTML was replaced)
  const inp = document.getElementById('cat-search');
  if (inp && state.catSearch) { inp.value = state.catSearch; inp.setSelectionRange(inp.value.length, inp.value.length); }
}

function selectCat(name) {
  state.selectedCat = state.selectedCat === name ? null : name;
  renderCategories();
}

// ═══════════════════════════════════════════════
// RENDER TIMELINE
// ═══════════════════════════════════════════════
// ── TIMELINE STATE ──
let tlSelectedCustomer = 'coop';
let tlSelectedWindow = null; // launch week number

function renderTimeline() {
  const allRoundsForCustomer = {
    coop:  [...COOP_FOOD_ROUNDS, ...(state.active.coopHemma ? COOP_HEMMA_ROUNDS : [])],
    ica:   ICA_ROUNDS,
    dagab: DAGAB_ROUNDS,
  };

  // Build customer tabs
  const custTabs = ['coop','ica','dagab'].map(k => {
    const label = k === 'coop' ? 'Coop' : k === 'ica' ? 'ICA' : 'Dagab';
    const active = tlSelectedCustomer === k;
    return `<button class="tl-cust-tab${active?' active':''}" onclick="tlSetCustomer('${k}')" style="border-bottom-color:${active?'var(--'+k+'-color)':'transparent'}">
      <img src="${LOGOS[k]}" style="height:14px;object-fit:contain;">
    </button>`;
  }).join('');

  const rounds = allRoundsForCustomer[tlSelectedCustomer] || [];

  // Set default window if none selected or if switching customer
  if (!tlSelectedWindow || !rounds.find(r => r.launch === tlSelectedWindow)) {
    // Pick next upcoming or first
    const next = rounds.find(r => daysLeft(r.launchDate) >= 0) || rounds[0];
    tlSelectedWindow = next ? next.launch : null;
  }

  // Build window dropdown options
  const windowOpts = rounds.map(r => {
    const past = daysLeft(r.launchDate) < 0;
    return `<option value="${r.launch}" ${r.launch === tlSelectedWindow ? 'selected' : ''}>
      ${r.sub ? r.sub + ' · ' : ''}v.${r.launch}${past ? ' ✓' : ''}
    </option>`;
  }).join('');

  // Find selected round
  const round = rounds.find(r => r.launch === tlSelectedWindow);

  // Build tree
  let treeHtml = '';
  if (round) {
    const custColor = `var(--${tlSelectedCustomer}-color)`;
    treeHtml = round.steps.map((s, i) => {
      const isLast = i === round.steps.length - 1;
      const isPast = s.days < 0;
      const isNow = s.week === CW && !isPast;
      const isFuture = s.days >= 0 && !isNow;
      const stepNum = i + 1;

      let dotStyle = isPast
        ? `background:var(--border2);border-color:var(--border2)`
        : s.isLaunch
          ? `background:${custColor};border-color:${custColor};box-shadow:0 0 0 3px ${custColor}33`
          : isNow
            ? `background:#facc15;border-color:#facc15`
            : `background:transparent;border-color:${custColor}`;

      let labelStyle = isPast ? 'opacity:0.35;text-decoration:line-through' : s.isLaunch ? `color:${custColor};font-weight:700` : isNow ? 'color:#facc15;font-weight:600' : '';
      let weekStyle = isPast ? 'opacity:0.35' : isNow ? 'color:#facc15' : `color:${custColor}`;

      let badge = '';
      if (isNow) badge = '<span style="font-size:9px;background:rgba(250,204,21,0.15);color:#facc15;padding:1px 7px;border-radius:8px;letter-spacing:1px;margin-left:8px">DENNA VECKA</span>';
      else if (s.isLaunch && !isPast) badge = `<span style="font-size:9px;background:${custColor}22;color:${custColor};padding:1px 7px;border-radius:8px;letter-spacing:1px;margin-left:8px">LANSERING</span>`;
      else if (!isPast && s.days <= 14) badge = `<span style="font-size:9px;background:rgba(248,113,113,0.15);color:#f87171;padding:1px 7px;border-radius:8px;letter-spacing:1px;margin-left:8px">${s.days}d</span>`;

      return `<div class="tl-tree-row">
        <div class="tl-tree-left">
          <div class="tl-tree-week" style="${weekStyle}">v.${s.week}</div>
          <div class="tl-tree-line-wrap">
            <div class="tl-tree-dot" style="${dotStyle}"></div>
            ${!isLast ? `<div class="tl-tree-connector" style="background:${isPast?'var(--border)':'var(--border2)'}"></div>` : ''}
          </div>
        </div>
        <div class="tl-tree-label" style="${labelStyle}">
          <span class="tl-step-num" style="color:${isPast?'var(--border2)':custColor}">${stepNum}</span>
          ${s.label}${badge}
        </div>
      </div>`;
    }).join('');
  }

  // Build categories for selected launch week
  const catSource = tlSelectedCustomer === 'coop' ? COOP_CATS : tlSelectedCustomer === 'ica' ? ICA_CATS : DAGAB_CATS;
  const weekCats = round ? catSource.filter(c => c.fonster.includes(String(tlSelectedWindow))) : [];
  const catsHtml = weekCats.length
    ? weekCats.map(c => `<div class="tl-week-cat-row">${c.cat}</div>`).join('')
    : `<div style="color:var(--muted);font-size:12px">Inga kategorier för denna vecka</div>`;

  document.getElementById('timeline-content').innerHTML = `
    <div class="tl-new-wrap">
      <div class="tl-cust-tabs">${custTabs}</div>
      <div class="tl-window-bar">
        <label class="tl-window-label">Lanseringsvecka</label>
        <select class="tl-window-select" onchange="tlSetWindow(parseInt(this.value))">${windowOpts}</select>
      </div>
      <div class="tl-detail-wrap">
        <div class="tl-tree">${treeHtml || '<div class="empty-state">Inget fönster valt</div>'}</div>
        <div class="tl-week-cats">
          <div class="tl-week-cats-title">Kategorier denna vecka</div>
          ${catsHtml}
        </div>
      </div>
    </div>`;
}

function tlSetCustomer(k) {
  tlSelectedCustomer = k;
  tlSelectedWindow = null;
  renderTimeline();
}
function tlSetWindow(w) {
  tlSelectedWindow = w;
  renderTimeline();
}

// ═══════════════════════════════════════════════
// INTERACTIONS
// ═══════════════════════════════════════════════

function toggleSubgroup(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}
function toggleRound(id) {
  document.getElementById(id)?.classList.toggle('open');
}

function toggleSubCustomer(key) {
  state.active[key] = !state.active[key];
  document.getElementById('toggle-' + key).classList.toggle('off', !state.active[key]);
  renderAll();
}

function toggleCustomer(key) {
  const others = Object.values(state.active).filter(Boolean).length;
  if (state.active[key] && others <= 1) return; // keep at least one
  state.active[key] = !state.active[key];
  document.getElementById(`toggle-${key}`).classList.toggle('off', !state.active[key]);
  renderAll();
}

function togglePast() {
  state.showPast = !state.showPast;
  const btn = document.getElementById('btn-past');
  btn?.classList.toggle('active', state.showPast);
  renderAll();
}

function showTab(tab) {
  state.tab = tab;
  ['overview','categories','timeline','brands','lansering','arkiv','kalkyl','paminnelser','aktivitetslogg'].forEach(t => {
    document.getElementById(`tab-${t}`).style.display = t === tab ? 'block' : 'none';
    const navEl = document.getElementById(`nav-${t}`);
    if (navEl) navEl.classList.toggle('active', t === tab);
  });
  const titles = { overview: 'Hem', categories: 'Fönster & Kategorier', timeline: 'Tidslinje', brands: 'Varumärken', lansering: 'Aktiva lanseringar', arkiv: 'Arkiv', kalkyl: 'Kalkylator', paminnelser: 'Påminnelser', aktivitetslogg: 'Aktivitetslogg' };
  document.getElementById('page-title').textContent = titles[tab] || tab;
  closeMobileMenu();
  renderAll();
}

function renderAll() {
  if (state.tab === 'overview') renderHero();
  else document.getElementById('hero-area').innerHTML = '';
  renderDashWidgets();
  if (state.tab === 'overview') renderOverview();
  if (state.tab === 'categories') renderCategories();
  if (state.tab === 'timeline') renderTimeline();
  if (state.tab === 'brands') renderBrands();
  if (state.tab === 'lansering') renderLansering();
  if (state.tab === 'arkiv') renderArkiv();
  if (state.tab === 'kalkyl') renderKalkyl();
  if (state.tab === 'paminnelser') renderPaminnelser();
  if (state.tab === 'aktivitetslogg') renderAktivitetslogg();
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
// ── COMPANY LOGO ──
function triggerCompanyLogo() {
  document.getElementById('logo-company-input').click();
}
async function handleCompanyLogo(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const url = e.target.result;
    applyCompanyLogo(url);
    // Save to Supabase only — no localStorage
    if (currentWorkspaceId) {
      await supabaseClient
        .from('workspaces')
        .update({ logo: url })
        .eq('id', currentWorkspaceId);
    }
  };
  reader.readAsDataURL(file);
}
function applyCompanyLogo(url) {
  const img = document.getElementById('logo-company-img');
  const forRow = document.getElementById('logo-for-row');
  const removeBtn = document.getElementById('logo-company-remove');
  if (url) {
    img.src = url; img.style.display = '';
    forRow.style.display = '';
    if (removeBtn) removeBtn.style.opacity = '0';
    // Sync settings modal
    const sp = document.getElementById('settings-logo-preview');
    const si = document.getElementById('settings-logo-img');
    const sr = document.getElementById('settings-remove-logo');
    if (sp) { sp.style.display = ''; si.src = url; sr.style.display = ''; }
  } else {
    img.src = ''; img.style.display = 'none';
    forRow.style.display = 'none';
    const sp = document.getElementById('settings-logo-preview');
    const sr = document.getElementById('settings-remove-logo');
    if (sp) { sp.style.display = 'none'; sr.style.display = 'none'; }
  }
}
function removeCompanyLogo(e) {
  e.stopPropagation();
  applyCompanyLogo(null);
  if (currentWorkspaceId) {
    supabaseClient
      .from('workspaces')
      .update({ logo: null })
      .eq('id', currentWorkspaceId);
  }
  addActivity('', 'Företagslogga borttagen');
}
// Load saved company logo on startup
// Company logo loaded per workspace in authOnLogin

document.getElementById('week-badge').textContent = `${TODAY.toLocaleDateString('sv-SE')} · V.${CW}`;

// Set sidebar logos
['coop','ica','dagab'].forEach(k => {
  const el = document.getElementById(`logo-sidebar-${k}`);
  if (el) el.src = LOGOS[k];
});



// ═══════════════════════════════════════════════
// PROJECTS — persistent state (ersätter brands)
// ═══════════════════════════════════════════════
const BRAND_COLORS = ['#a78bfa','#f472b6','#0D4F35','#facc15','#00AB46','#38bdf8','#E3000B','#34d399','#e879f9','#94a3b8'];

let selectedBrandId = null;
let editingBrandId = null;
let catModalTarget = null;
let catModalSelected = [];

// brands-arrayen behålls för kompatibilitet med all renderingskod
// men varje brand har nu även: projectId, visibility, permission
let brands = [];

// Map: brandId → projectId (för sparande)
const brandProjectMap = {};

// ═══════════════════════════════════════════════
// SUPABASE
// ═══════════════════════════════════════════════
const SUPA_URL = 'https://rjbqvbnzxxltnwoqfstb.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqYnF2Ym56eHhsdG53b3Fmc3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzU5MzIsImV4cCI6MjA4Nzc1MTkzMn0.w51_Lx8sipSdO48MquB9LTf-LOvru0qPuR1fwFVPtoA';
const supabaseClient = window.supabase.createClient(SUPA_URL, SUPA_KEY);

// Ladda alla projekt som användaren kan se
async function loadBrands() {
  document.getElementById('overview-content').innerHTML =
    '<div class="empty-state" style="margin-top:40px">⏳ Laddar data...</div>';
  try {
    if (!currentWorkspaceId) throw new Error('No workspace');
    console.log('loadBrands: currentWorkspaceId=', currentWorkspaceId);
    const { data, error } = await supabaseClient
      .rpc('get_my_projects', { p_workspace_id: currentWorkspaceId });
    console.log('loadBrands: get_my_projects returned', data?.length, 'rows, error:', error?.message);
    if (data) data.forEach(p => console.log('  projekt:', p.name, '| data:', JSON.stringify(p.data)?.slice(0,120)));
    if (error) throw error;

    brands = (data || []).filter(p => {
      let d = p.data;
      if (typeof d === 'string') { try { d = JSON.parse(d); } catch(e) { d = {}; } }
      if (!d || typeof d !== 'object') return true;
      return d.is_lansering !== true;
    }).map(p => {
      // Support string, object, and legacy array formats
      let products = [], productGroups = [];
      let parsedData = p.data;
      if (typeof parsedData === 'string') {
        try { parsedData = JSON.parse(parsedData); } catch(e) { parsedData = null; }
      }
      if (Array.isArray(parsedData)) {
        products = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        products = Array.isArray(parsedData.products) ? parsedData.products : [];
        productGroups = Array.isArray(parsedData.productGroups) ? parsedData.productGroups : [];
      }
      const brand = {
        id: p.id,           // använd project UUID som brand id
        name: p.name,
        color: p.color || '#a78bfa',
        products,
        productGroups,
        visibility: p.visibility,
        permission: p.permission,
        createdBy: p.created_by
      };
      brandProjectMap[p.id] = p.id;
      return brand;
    });
  } catch(e) {
    console.error('loadBrands error', e);
    brands = [];
    setTimeout(() => addNotif('Kunde inte ladda varumärken: ' + e.message, 'error'), 500);
  }
  renderAll();
}

// Spara ett enskilt projekt
async function saveProject(brandId) {
  const brand = brands.find(b => b.id === brandId);
  if (!brand || !currentWorkspaceId) {
    console.error('saveProject: avbruten — brand:', !!brand, 'workspaceId:', currentWorkspaceId);
    return;
  }
  console.log('saveProject: anropar RPC för', brandId);
  const { data, error } = await supabaseClient.rpc('save_project_data', {
    p_project_id: brandId,
    p_data: JSON.stringify({ products: brand.products, productGroups: brand.productGroups || [] })
  });
  console.log('saveProject: RPC svar — data:', data, 'error:', error);
  if (error) {
    console.error('saveProject error:', error);
    alert('Kunde inte spara: ' + error.message);
  }
}

// Bakåtkompatibel saveBrands — sparar alla projekt
async function saveBrands() {
  for (const brand of brands) {
    await saveProject(brand.id);
  }
}

// Skapa nytt projekt i Supabase + lägg till i brands-arrayen
async function createProject(name, color) {
  if (!currentWorkspaceId) return null;
  const { data: projectId, error } = await supabaseClient.rpc('create_project', {
    p_workspace_id: currentWorkspaceId,
    p_name: name,
    p_color: color,
    p_visibility: 'private'
  });
  if (error) { console.error('createProject error', error); return null; }
  const newBrand = {
    id: projectId,
    name,
    color,
    products: [],
    visibility: 'private',
    permission: 'owner',
    createdBy: currentUser?.id
  };
  brandProjectMap[projectId] = projectId;
  brands.push(newBrand);
  return newBrand;
}

// Uppdatera synlighet på ett projekt
async function updateProjectVisibility(brandId, visibility) {
  const { error } = await supabaseClient.rpc('update_project_visibility', {
    p_project_id: brandId,
    p_visibility: visibility
  });
  if (error) { console.warn('updateProjectVisibility error', error); return false; }
  const brand = brands.find(b => b.id === brandId);
  if (brand) brand.visibility = visibility;
  return true;
}

// ═══════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════
let currentUser = null;
let currentWorkspaceId = null;
let currentUserRole = 'member';

function authShowTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('auth-form-login').style.display = isLogin ? '' : 'none';
  document.getElementById('auth-form-register').style.display = isLogin ? 'none' : '';
  document.getElementById('auth-tab-login').style.background = isLogin ? '#332a26' : 'transparent';
  document.getElementById('auth-tab-login').style.color = isLogin ? '#fff' : '#ffffff88';
  document.getElementById('auth-tab-register').style.background = isLogin ? 'transparent' : '#332a26';
  document.getElementById('auth-tab-register').style.color = isLogin ? '#ffffff88' : '#fff';
}

function authShowError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = '';
}
function authHideError(id) {
  document.getElementById(id).style.display = 'none';
}

async function authLogin() {
  authHideError('auth-login-error');
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email || !password) return authShowError('auth-login-error', 'Fyll i email och lösenord.');

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return authShowError('auth-login-error', 'Fel email eller lösenord.');
  await authOnLogin(data.user);
  addActivity('', `Inloggad som ${data.user.email}`);
}

async function authRegister() {
  authHideError('auth-register-error');
  document.getElementById('auth-register-success').style.display = 'none';
  const workspace = document.getElementById('reg-workspace').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const hasPendingInvite = !!sessionStorage.getItem('pendingInviteToken');
  if (!hasPendingInvite && !workspace) return authShowError('auth-register-error', 'Ange ett företagsnamn.');
  if (!email) return authShowError('auth-register-error', 'Ange en email.');
  if (password.length < 6) return authShowError('auth-register-error', 'Lösenordet måste vara minst 6 tecken.');

  // 1. Skapa användare med metadata
  const firstname = document.getElementById('reg-firstname').value.trim();
  const lastname = document.getElementById('reg-lastname').value.trim();
  const userRole = document.getElementById('reg-role').value.trim();
  if (!firstname) return authShowError('auth-register-error', 'Ange ditt förnamn.');
  if (!lastname) return authShowError('auth-register-error', 'Ange ditt efternamn.');
  if (!userRole) return authShowError('auth-register-error', 'Ange din roll.');

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstname,
        last_name: lastname,
        role: userRole
      }
    }
  });
  if (error) {
    const msg = error.message.includes('already registered')
      ? 'Den här emailen är redan registrerad. Logga in istället.'
      : error.message;
    return authShowError('auth-register-error', msg);
  }

  // 2. Skapa workspace endast om ingen inbjudan
  if (!hasPendingInvite) {
    const { error: wsErr } = await supabaseClient.rpc('create_workspace_for_user', {
      user_id: data.user.id,
      workspace_name: workspace
    });
    if (wsErr) return authShowError('auth-register-error', 'Kunde inte skapa workspace: ' + wsErr.message);
  }

  document.getElementById('auth-register-success').textContent = 'Konto skapat! Du är nu inloggad.';
  document.getElementById('auth-register-success').style.display = '';
  await authOnLogin(data.user);
}

async function authOnLogin(user) {
  console.log('authOnLogin: user=', user?.email);
  currentUser = user;
  // Get workspace — use limit(1) instead of single() to avoid errors
  const { data: memberships } = await supabaseClient
    .from('workspace_members')
    .select('workspace_id, role, workspaces(name)')
    .eq('user_id', user.id)
    .limit(1);

  const membership = memberships && memberships.length ? memberships[0] : null;

  if (membership) {
    currentWorkspaceId = membership.workspace_id;
    currentUserRole = membership.role;
  }

  // Hide auth overlay and landing page, show app
  document.getElementById('auth-overlay').style.display = 'none';
  hideLandingPage();
  document.getElementById('app-root').style.display = 'flex';

  // Load workspace logo
  const { data: wsData } = await supabaseClient
    .from('workspaces')
    .select('logo')
    .eq('id', currentWorkspaceId)
    .single();
  if (wsData && wsData.logo) {
    applyCompanyLogo(wsData.logo);
  } else {
    applyCompanyLogo(null);
  }

  // Add logout button to sidebar
  const logoutBtn = document.getElementById('sidebar-logout');
  if (logoutBtn) {
    const wsName = membership?.workspaces?.name || '';
    const meta = user.user_metadata || {};
    const fullName = [meta.first_name, meta.last_name].filter(Boolean).join(' ');
    const userJobRole = meta.role || '';
    logoutBtn.innerHTML = 
      '<div style="font-size:10px;opacity:0.4;margin-bottom:4px;letter-spacing:1px;text-transform:uppercase;">' + wsName + '</div>' +
      (fullName ? '<div style="font-size:13px;font-weight:600;margin-bottom:2px;">' + fullName + '</div>' : '') +
      (userJobRole ? '<div style="font-size:11px;opacity:0.45;margin-bottom:8px;">' + userJobRole + '</div>' : '') +
      '<button class="nav-btn" onclick="authLogout()" style="width:100%;display:flex;align-items:center;gap:8px;opacity:0.6;"><span style="font-size:13px;">⎋</span> Logga ut</button>';
  }

  // Handle pending invite token
  const pendingToken = sessionStorage.getItem('pendingInviteToken');
  if (pendingToken) {
    sessionStorage.removeItem('pendingInviteToken');
    const { data: wsId, error } = await supabaseClient.rpc('accept_invitation', {
      p_token: pendingToken,
      p_user_id: user.id
    });
    if (!error && wsId) {
      currentWorkspaceId = wsId;
    }
  }

  loadBrands();
  loadLanseringar();
  loadWindowNotes();
  loadAgenda();
  loadActivityLog();
  subscribeActivityLog();
  supabaseClient.rpc('clean_old_activity_log').then(() => {});
  // Slight delay to allow data to load before checking
  setTimeout(() => {
    checkAndGenerateNotifs();
    startOnboarding();
  }, 1200);
}

async function authLogout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  currentWorkspaceId = null;
  brands = [];
  applyCompanyLogo(null);
  localStorage.removeItem('listwin_company_logo');
  document.getElementById('app-root').style.display = 'none';
  showLandingPage();
}

async function showInviteBanner(token) {
  // Look up invitation to get workspace name
  const { data: inv } = await supabaseClient
    .from('invitations')
    .select('workspace_id')
    .eq('token', token)
    .limit(1);

  if (!inv || !inv.length) return;

  const { data: ws } = await supabaseClient
    .from('workspaces')
    .select('name')
    .eq('id', inv[0].workspace_id)
    .limit(1);

  const wsName = ws && ws.length ? ws[0].name : '';

  // Show locked workspace field and update button for invite flow
  document.getElementById('reg-submit-btn').textContent = 'Skapa konto';

  if (wsName) {
    document.getElementById('reg-invite-banner').style.display = '';
    document.getElementById('reg-invite-text').textContent = 'Du är inbjuden att gå med i ' + wsName;

    // Show workspace field as locked with company name
    const wsField = document.getElementById('reg-workspace-field');
    wsField.style.display = '';
    const wsInput = document.getElementById('reg-workspace');
    wsInput.value = wsName;
    wsInput.readOnly = true;
    wsInput.style.opacity = '0.5';
    wsInput.style.cursor = 'not-allowed';
    wsInput.style.borderColor = '#3d3330';
  }
}

// Check session on load
async function authInit() {
  console.log('authInit: startar');
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('invite') || sessionStorage.getItem('pendingInviteToken');
  if (inviteToken) {
    sessionStorage.setItem('pendingInviteToken', inviteToken);
    window.history.replaceState({}, '', window.location.pathname);
  }

  // Kolla om URL-fragmentet innehåller en recovery-token (från mejllänken)
  const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
  const isRecovery = hashParams.get('type') === 'recovery' || urlParams.get('reset') === 'true';

  // Lyssna på auth-händelser — fångar PASSWORD_RECOVERY
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      document.getElementById('auth-overlay').style.display = 'flex';
      document.getElementById('auth-form-login').style.display = 'none';
      document.getElementById('auth-form-register').style.display = 'none';
      document.getElementById('auth-form-forgot').style.display = 'none';
      document.getElementById('auth-form-reset').style.display = '';
      // Dölj tab-switcher vid lösenordsåterställning
      document.querySelector('#auth-overlay > div > div:nth-child(2)').style.display = 'none';
    }
  });

  const { data: { session } } = await supabaseClient.auth.getSession();
  console.log('authInit: session=', !!session, session?.user?.email);
  if (session && isRecovery) {
    // Visa reset-formuläret istället för att logga in direkt
    document.getElementById('auth-overlay').style.display = 'flex';
    document.getElementById('auth-form-login').style.display = 'none';
    document.getElementById('auth-form-register').style.display = 'none';
    document.getElementById('auth-form-forgot').style.display = 'none';
    document.getElementById('auth-form-reset').style.display = '';
    const tabSwitcher = document.querySelector('#auth-overlay > div > div:nth-child(2)');
    if (tabSwitcher) tabSwitcher.style.display = 'none';
    window.history.replaceState({}, '', window.location.pathname);
  } else if (session) {
    await authOnLogin(session.user);
  } else {
    if (inviteToken) {
      document.getElementById('auth-overlay').style.display = 'flex';
      authShowTab('register');
      await showInviteBanner(inviteToken);
    } else {
      showLandingPage();
    }
  }
}


// ═══════════════════════════════════════════════
// LANSERING — SJOK 1
// ═══════════════════════════════════════════════

let lanseringar = [];
let selectedLanseringId = null;


const FREE_CUSTOMERS = [
  { group: 'DVH', customers: ['Mathem', 'Lidl', 'Netto', 'Amazon Fresh'] },
  { group: 'SVH', customers: ['OKQ8', 'Circle K', 'Reitan', 'St1', 'Preem'] },
  { group: 'Apotek', customers: ['Apohem', 'Kronans Apotek', 'Apoteket', 'Lloyds'] },
  { group: 'Övrigt', customers: ['Övrig kund'] },
];
const CHAIN_COLORS = { coop: '#00AB46', ica: '#E3000B', dagab: '#0D4F35' };
const CHAIN_LABELS = { coop: 'Coop', ica: 'ICA', dagab: 'Dagab' };

const CHECKLIST_ITEMS = [
  { id: 'validoo',    label: 'Artikeldata Validoo/Dabas' },
  { id: 'priskalkyl', label: 'Priskalkyl' },
  { id: 'varuprover', label: 'Varuprover till kedja' },
  { id: 'mote',       label: 'Mötesbokning kedja' },
  { id: 'presentation', label: 'Presentation' },
  { id: 'offert',     label: 'Offert kedja' },
];

const TASK_STATUSES = ['Ej påbörjad','Pågående','Klar','Blockerad'];

async function loadLanseringar() {
  if (!currentWorkspaceId) return;
  try {
    const { data, error } = await supabaseClient
      .rpc('get_my_projects', { p_workspace_id: currentWorkspaceId });
    if (error) throw error;
    // Lanseringar identifieras via is_lansering-flagga i data-fältet
    lanseringar = (data || [])
      .map(p => {
        let d = p.data;
        if (typeof d === 'string') { try { d = JSON.parse(d); } catch(e) { d = {}; } }
        if (!d || typeof d !== 'object') d = {};
        return { ...p, data: d };
      })
      .filter(p => p.data.is_lansering === true)
      .map(p => ({ id: p.id, name: p.name, color: p.color || '#f59e0b', ...p.data }));
  } catch(e) {
    console.error('loadLanseringar error', e);
    lanseringar = lanseringar || [];
    setTimeout(() => addNotif('Kunde inte ladda lanseringar: ' + e.message, 'error'), 500);
  }
  if (state.tab === 'lansering') renderLansering();
  if (state.tab === 'arkiv') renderArkiv();
  if (state.tab === 'kalkyl') renderKalkyl();
  if (state.tab === 'paminnelser') renderPaminnelser();
}

async function saveLansering(lid) {
  const l = lanseringar.find(x => x.id === lid);
  if (!l || !currentWorkspaceId) return;
  const { id, name, color, ...rest } = l;
  const { error } = await supabaseClient.rpc('save_project_data', {
    p_project_id: id,
    p_data: JSON.stringify({ ...rest, is_lansering: true })
  });
  if (error) { console.error('saveLansering error', error); addNotif('Kunde inte spara lansering: ' + error.message, 'error'); }
}

function getLansering(lid) { return lanseringar.find(x => x.id === lid); }

function getLanseringProgress(l) {
  const customers = getLanseringCustomers(l);
  if (customers.length === 0) return 0;
  let totalDone = 0, total = 0;
  customers.forEach(c => {
    const custData = (l.customers || {})[c.id] || {};
    const checks = custData.checklist || {};
    const tasks = custData.tasks || [];
    totalDone += CHECKLIST_ITEMS.filter(i => checks[i.id]).length;
    totalDone += tasks.filter(t => t.status === 'Klar').length;
    total += CHECKLIST_ITEMS.length + tasks.length;
  });
  return total === 0 ? 0 : Math.round((totalDone / total) * 100);
}

function renderLansering() {
  const el = document.getElementById('lansering-content');
  if (!el) return;

  const listHtml = `
    <div class="lansering-list">
      ${lanseringar.map(l => {
        const pct = getLanseringProgress(l);
        return `<div class="lansering-card ${selectedLanseringId===l.id?'selected':''}" onclick="selectLansering('${l.id}')">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="width:10px;height:10px;border-radius:50%;background:${l.color};flex-shrink:0;display:inline-block"></span>
            <div class="lansering-card-name">${l.name}</div>
          </div>
          <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
          <div class="lansering-card-meta" style="margin-top:6px">
            <span>${pct}% klart</span>
            ${l.brand ? `<span style="opacity:0.6">· ${l.brand}</span>` : ''}
            ${l.chain ? `<span style="color:${l.chain==='coop'?'#00AB46':l.chain==='ica'?'#E3000B':'#0D4F35'}">${l.chain==='coop'?'Coop':l.chain==='ica'?'ICA':l.chain==='dagab'?'Dagab':'Flera'}</span>` : ''}
          </div>
        </div>`;
      }).join('')}
      <button class="lansering-add-btn" onclick="openLanseringModal()">+ Ny lansering</button>
    </div>`;

  let detailHtml = `<div class="lansering-detail" style="display:flex;align-items:center;justify-content:center;min-height:200px">
    <span style="color:var(--muted);font-size:13px">← Välj en lansering eller skapa en ny</span>
  </div>`;

  const l = getLansering(selectedLanseringId);
  if (l) {
    detailHtml = renderLanseringDetail(l);
  }

  el.innerHTML = `<div class="lansering-layout">${listHtml}${detailHtml}</div>`;

  // Render lansering modal if open
  if (document.getElementById('lansering-modal')) return;
}

function selectLansering(lid) {
  selectedLanseringId = lid;
  renderLansering();
}

function toggleCheckItem(lid, itemId, checked) {
  const l = getLansering(lid);
  if (!l) return;
  if (!l.checklist) l.checklist = {};
  if (checked) {
    l.checklist[itemId] = new Date().toLocaleDateString('sv-SE');
  } else {
    delete l.checklist[itemId];
  }
  saveLansering(lid);
  addActivity('', `${CHECKLIST_ITEMS.find(i=>i.id===itemId)?.label} — ${getLansering(lid)?.name}`);
  renderLansering();
}

function addTask(lid) {
  const l = getLansering(lid);
  if (!l) return;
  if (!l.tasks) l.tasks = [];
  l.tasks.push({ name: '', deadline: '', status: 'Ej påbörjad', owner: '' });
  saveLansering(lid);
  addActivity('', `Uppgift tillagd i "${l.name}"`);
  renderLansering();
}

function updateTask(lid, idx, field, val) {
  const l = getLansering(lid);
  if (!l || !l.tasks || !l.tasks[idx]) return;
  l.tasks[idx][field] = val;
  saveLansering(lid);
  if (field === 'status') {
    addActivity('', `Uppgift "${l.tasks[idx].name || 'Namnlös'}" → ${val} — ${l.name}`);
    renderLansering();
  }
}

function deleteTask(lid, idx) {
  const l = getLansering(lid);
  if (!l || !l.tasks) return;
  const taskName = l.tasks[idx]?.name || 'Namnlös';
  l.tasks.splice(idx, 1);
  saveLansering(lid);
  addActivity('', `Uppgift "${taskName}" borttagen från "${l.name}"`);
  renderLansering();
}

function addContactEntry(lid) {
  const l = getLansering(lid);
  if (!l) return;
  const chain = document.getElementById(`log-chain-${lid}`)?.value || 'other';
  const contact = document.getElementById(`log-contact-${lid}`)?.value.trim() || '';
  const date = document.getElementById(`log-date-${lid}`)?.value || new Date().toISOString().slice(0,10);
  const note = document.getElementById(`log-note-${lid}`)?.value.trim() || '';
  const next = document.getElementById(`log-next-${lid}`)?.value.trim() || '';
  if (!note) return;
  const chainLabels = { coop: 'Coop', ica: 'ICA', dagab: 'Dagab', other: 'Övrigt' };
  if (!l.contactLog) l.contactLog = [];
  l.contactLog.push({ chain, chainLabel: chainLabels[chain], contact, date, note, next });
  saveLansering(lid);
  addActivity('', `Kontaktlogg: ${chainLabels[chain]} — ${note.slice(0,40)}`);
  renderLansering();
}

function deleteContactEntry(lid, idx) {
  const l = getLansering(lid);
  if (!l || !l.contactLog) return;
  l.contactLog.splice(idx, 1);
  saveLansering(lid);
  addActivity('', `Kontaktloggpost borttagen från "${l.name}"`);
  renderLansering();
}

// ── LANSERING MODAL (redigera befintlig) ──
let editingLanseringId = null;

function openLanseringModal(lid) {
  if (!lid) { openLanseringWizard(); return; }
  editingLanseringId = lid;
  const l = getLansering(lid);
  const modal = document.createElement('div');
  modal.className = 'lansering-modal';
  modal.id = 'lansering-modal';

  const brandOptions = brands.map(b =>
    `<option value="${b.id}" ${l && l.brandId === b.id ? 'selected' : ''}>${b.name}</option>`
  ).join('');

  modal.innerHTML = `
    <div class="lansering-modal-box">
      <div class="lansering-modal-title">Redigera lansering</div>
      <div class="lansering-form-group">
        <label class="lansering-form-label">Varumärke</label>
        <select class="lansering-form-input" id="lm-brand">
          <option value="">Välj varumärke...</option>
          ${brandOptions}
        </select>
      </div>
      <div class="lansering-form-group">
        <label class="lansering-form-label">Namn</label>
        <input class="lansering-form-input" id="lm-name" value="${l ? l.name || '' : ''}" placeholder="Namn på lansering">
      </div>
      <div class="lansering-modal-btns">
        <button class="lansering-action-btn" onclick="closeLanseringModal()">Avbryt</button>
        <button class="inline-btn" onclick="saveLanseringModal()">Spara</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function closeLanseringModal() {
  document.getElementById('lansering-modal')?.remove();
}

// ═══════════════════════════════════════════════
// LANSERING WIZARD (4-stegs skapandeflöde)
// ═══════════════════════════════════════════════

let wizardData = null;

function openLanseringWizard(prefillBrandId = null) {
  wizardData = {
    step: 1,
    brandId: prefillBrandId || '',
    newBrandName: '',
    useNewBrand: false,
    groupName: '',
    chains: [],
    categories: { coop: null, ica: null, dagab: null },
    catSearch: { coop: '', ica: '', dagab: '' },
    articles: ['']
  };
  renderWizardModal();
}

function closeWizard() {
  document.getElementById('lansering-wizard')?.remove();
  wizardData = null;
}

function openEditWizard(lid) {
  const l = lanseringar.find(x => x.id === lid);
  if (!l) return;
  const categories = { coop: null, ica: null, dagab: null };
  const catSearch  = { coop: '', ica: '', dagab: '' };
  for (const chain of (l.chains || [])) {
    const catName = l.chainData?.[chain]?.category || '';
    const cats = chain === 'coop' ? COOP_CATS : chain === 'ica' ? ICA_CATS : DAGAB_CATS;
    const found = cats.find(c => c.cat === catName) || null;
    categories[chain] = found;
    catSearch[chain]  = catName;
  }
  wizardData = {
    step: 1, isEdit: true, lanseringId: lid,
    brandId: l.brandId || '', newBrandName: '', useNewBrand: false,
    groupName: l.groupName || '',
    chains: [...(l.chains || [])],
    categories, catSearch,
    articles: (l.articles || [{name:''}]).map(a => (typeof a === 'string' ? a : a.name) || '')
  };
  renderWizardModal();
}

function renderWizardModal() {
  document.getElementById('lansering-wizard')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'lansering-modal';
  overlay.id = 'lansering-wizard';
  overlay.innerHTML = buildWizardHTML();
  document.body.appendChild(overlay);
}

function buildWizardHTML() {
  const { step } = wizardData;
  const stepLabels = ['Varumärke', 'Grupp & kedjor', 'Kategori', 'Artiklar'];

  const dots = stepLabels.map((lbl, i) => {
    const n = i + 1;
    const cls = n < step ? 'done' : n === step ? 'active' : '';
    const line = n < stepLabels.length
      ? `<div class="wz-step-line${n < step ? ' done' : ''}"></div>`
      : '';
    return `<div class="wz-step-dot ${cls}" title="${lbl}">${n < step ? '✓' : n}</div>${line}`;
  }).join('');

  let summaryHTML = '';
  if (step >= 2) {
    const brandName = wizardData.useNewBrand
      ? (wizardData.newBrandName || '—')
      : (brands.find(b => b.id === wizardData.brandId)?.name || '—');
    const parts = [`<span class="wz-summary-item">${brandName}</span>`];
    if (step >= 3 && wizardData.groupName)
      parts.push(`<span class="wz-summary-item">${wizardData.groupName}</span>`);
    if (step >= 3 && wizardData.chains.length)
      parts.push(...wizardData.chains.map(c => {
        const col = c === 'coop' ? '#00AB46' : c === 'ica' ? '#E3000B' : '#0D4F35';
        const lbl = c === 'coop' ? 'Coop' : c === 'ica' ? 'ICA' : 'Dagab';
        return `<span class="wz-summary-item" style="color:${col}">${lbl}</span>`;
      }));
    summaryHTML = `<div class="wz-summary">${parts.join('')}</div>`;
  }

  let content = '';
  if (step === 1) content = buildWizardStep1();
  else if (step === 2) content = buildWizardStep2();
  else if (step === 3) content = buildWizardStep3();
  else if (step === 4) content = buildWizardStep4();

  const backBtn = step > 1
    ? `<button class="lansering-action-btn" onclick="wizardPrev()">← Tillbaka</button>`
    : `<button class="lansering-action-btn" onclick="closeWizard()">Avbryt</button>`;
  const nextLabel = step === 4 ? (wizardData.isEdit ? 'Spara ändringar' : 'Skapa lansering') : 'Nästa →';
  const nextFn = step === 4 ? (wizardData.isEdit ? 'completeEditWizard()' : 'completeWizard()') : 'wizardNext()';

  return `
    <div class="lansering-modal-box wz-box">
      <div class="wz-header">
        <div class="lansering-modal-title">${wizardData.isEdit ? 'Redigera lansering' : 'Ny lansering'}</div>
        <button class="wz-close-btn" onclick="closeWizard()">✕</button>
      </div>
      <div class="wz-steps">${dots}</div>
      ${summaryHTML}
      <div class="wz-content">${content}</div>
      <div class="wz-nav">
        ${backBtn}
        <button class="inline-btn" onclick="${nextFn}">${nextLabel}</button>
      </div>
    </div>`;
}

// ── Steg 1: Varumärke ──
function buildWizardStep1() {
  const brandOptions = brands.map(b =>
    `<option value="${b.id}" ${wizardData.brandId === b.id ? 'selected' : ''}>${b.name}</option>`
  ).join('');
  const showNew = wizardData.useNewBrand;

  return `
    <div class="wz-step-title">Välj varumärke</div>
    <div class="lansering-form-group">
      <label class="lansering-form-label">Varumärke</label>
      <select class="lansering-form-input" id="wz-brand" onchange="wizardBrandChange()">
        <option value="">— Välj varumärke —</option>
        ${brandOptions}
        ${!wizardData.isEdit ? '<option value="__new__"' + (showNew ? ' selected' : '') + '>+ Skapa nytt varumärke...</option>' : ''}
      </select>
    </div>
    <div id="wz-new-brand-wrap" style="display:${showNew ? 'block' : 'none'}">
      <div class="lansering-form-group">
        <label class="lansering-form-label">Namn på nytt varumärke</label>
        <input type="text" class="lansering-form-input" id="wz-new-brand-name"
               value="${wizardData.newBrandName.replace(/"/g, '&quot;')}"
               placeholder="T.ex. Foodster"
               oninput="wizardData.newBrandName=this.value">
      </div>
    </div>`;
}

function wizardBrandChange() {
  const val = document.getElementById('wz-brand')?.value;
  if (val === '__new__') {
    wizardData.useNewBrand = true;
    wizardData.brandId = '';
  } else {
    wizardData.useNewBrand = false;
    wizardData.brandId = val;
  }
  document.getElementById('wz-new-brand-wrap').style.display =
    wizardData.useNewBrand ? 'block' : 'none';
}

// ── Steg 2: Produktgrupp & kedjor ──
function buildWizardStep2() {
  const tog = (c, lbl, col) => {
    const active = wizardData.chains.includes(c);
    return `<button class="wz-chain-btn${active ? ' active' : ''}" style="--chain-col:${col}"
              onclick="wizardToggleChain('${c}')">
              <span class="wz-chain-dot" style="background:${col}"></span>${lbl}
            </button>`;
  };
  return `
    <div class="wz-step-title">Produktgrupp och kedjor</div>
    <div class="lansering-form-group">
      <label class="lansering-form-label">Produktgrupp</label>
      <input type="text" class="lansering-form-input" id="wz-group"
             value="${wizardData.groupName.replace(/"/g, '&quot;')}"
             placeholder="T.ex. Havredryck"
             oninput="wizardData.groupName=this.value">
    </div>
    <div class="lansering-form-group">
      <label class="lansering-form-label">Kedjor</label>
      <div class="wz-chain-btns">
        ${tog('coop', 'Coop', '#00AB46')}
        ${tog('ica', 'ICA', '#E3000B')}
        ${tog('dagab', 'Dagab', '#0D4F35')}
      </div>
    </div>`;
}

function wizardToggleChain(chain) {
  const idx = wizardData.chains.indexOf(chain);
  if (idx >= 0) {
    wizardData.chains.splice(idx, 1);
    wizardData.categories[chain] = null;
  } else {
    wizardData.chains.push(chain);
  }
  renderWizardModal();
}

// ── Steg 3: Kategori per kedja ──
function buildWizardStep3() {
  const sections = wizardData.chains.map(chain => buildWizardCatSection(chain)).join('');
  return `<div class="wz-step-title">Välj kategori och fönster per kedja</div>${sections}`;
}

function wizardBuildCatListHTML(chain, q, sel) {
  const cats = chain === 'coop' ? COOP_CATS : chain === 'ica' ? ICA_CATS : DAGAB_CATS;
  let listHTML = '';
  if (chain === 'coop') {
    for (const sub of ['Coop Food', 'Coop Hemma']) {
      const subCats = cats.filter(c => c.sub === sub);
      const filtered = q ? subCats.filter(c => c.cat.toLowerCase().includes(q)) : subCats;
      if (!filtered.length) continue;
      listHTML += `<div class="wz-cat-group-lbl">${sub}</div>`;
      listHTML += filtered.map(c => {
        const i = cats.indexOf(c);
        const active = sel && sel.cat === c.cat ? ' active' : '';
        return `<div class="wz-cat-item${active}" data-idx="${i}" onmousedown="event.preventDefault()" onclick="wizardCatPick('${chain}',${i})">${c.cat}</div>`;
      }).join('');
    }
  } else {
    const filtered = q ? cats.filter(c => c.cat.toLowerCase().includes(q)) : cats;
    listHTML = filtered.map(c => {
      const i = cats.indexOf(c);
      const active = sel && sel.cat === c.cat ? ' active' : '';
      return `<div class="wz-cat-item${active}" data-idx="${i}" onmousedown="event.preventDefault()" onclick="wizardCatPick('${chain}',${i})">${c.cat}</div>`;
    }).join('');
  }
  return listHTML || `<div class="wz-cat-empty">Inga träffar</div>`;
}

function buildWizardCatSection(chain) {
  const col = chain === 'coop' ? '#00AB46' : chain === 'ica' ? '#E3000B' : '#0D4F35';
  const lbl = chain === 'coop' ? 'Coop'   : chain === 'ica' ? 'ICA'    : 'Dagab';
  const sel = wizardData.categories[chain];

  const listHTML = wizardBuildCatListHTML(chain, '', sel);

  let badgesHTML = '';
  if (sel && (sel.fonster.length || sel.avisering.length)) {
    const fBadges = sel.fonster.map(w   => `<span class="wz-badge fonster">V.${w}</span>`).join('');
    const aBadges = sel.avisering.map(w => `<span class="wz-badge avisering">V.${w}</span>`).join('');
    badgesHTML = `
      <div class="wz-selected-cat">✓ ${sel.cat}</div>
      <div class="wz-badges">
        <div class="wz-badge-row"><span class="wz-badge-lbl">Fönster:</span>${fBadges}</div>
        <div class="wz-badge-row"><span class="wz-badge-lbl">Avisering:</span>${aBadges}</div>
      </div>`;
  }

  const inputVal = (sel?.cat || '').replace(/"/g, '&quot;');

  return `
    <div class="wz-chain-section" style="border-left-color:${col}">
      <div class="wz-chain-label" style="color:${col}">${lbl}</div>
      <div class="wz-cat-dropdown" id="wz-cat-wrap-${chain}">
        <input class="lansering-form-input wz-cat-input" type="text"
               placeholder="Sök kategori..."
               value="${inputVal}"
               autocomplete="off"
               onfocus="wizardOpenCatDropdown('${chain}')"
               oninput="wizardFilterCats('${chain}',this.value)"
               onblur="wizardCatBlur('${chain}')">
        <span class="wz-cat-arrow">▾</span>
        <div class="wz-cat-list-float" id="wz-cat-list-${chain}">${listHTML}</div>
      </div>
      ${badgesHTML}
    </div>`;
}

function wizardOpenCatDropdown(chain) {
  const listEl = document.getElementById(`wz-cat-list-${chain}`);
  if (!listEl) return;
  listEl.innerHTML = wizardBuildCatListHTML(chain, '', wizardData.categories[chain]);
  listEl.style.display = 'block';
  const active = listEl.querySelector('.wz-cat-item.active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

function wizardFilterCats(chain, value) {
  wizardData.catSearch[chain] = value;
  const q = value.trim().toLowerCase();
  const listEl = document.getElementById(`wz-cat-list-${chain}`);
  if (!listEl) return;
  listEl.innerHTML = wizardBuildCatListHTML(chain, q, wizardData.categories[chain]);
  listEl.style.display = 'block';
}

function wizardCatBlur(chain) {
  setTimeout(() => {
    const listEl = document.getElementById(`wz-cat-list-${chain}`);
    if (listEl) listEl.style.display = 'none';
  }, 150);
}

function wizardCatPick(chain, idx) {
  const cats = chain === 'coop' ? COOP_CATS : chain === 'ica' ? ICA_CATS : DAGAB_CATS;
  const cat = cats[idx] || null;
  wizardData.categories[chain] = cat;
  wizardData.catSearch[chain] = cat?.cat || '';

  const wrap = document.getElementById(`wz-cat-wrap-${chain}`);
  const inputEl = wrap?.querySelector('.wz-cat-input');
  if (inputEl) inputEl.value = cat?.cat || '';

  const listEl = document.getElementById(`wz-cat-list-${chain}`);
  if (listEl) listEl.style.display = 'none';

  const section = wrap?.closest('.wz-chain-section');
  if (!section) return;
  let badgesHTML = '';
  if (cat && (cat.fonster.length || cat.avisering.length)) {
    const fBadges = cat.fonster.map(w   => `<span class="wz-badge fonster">V.${w}</span>`).join('');
    const aBadges = cat.avisering.map(w => `<span class="wz-badge avisering">V.${w}</span>`).join('');
    badgesHTML = `
      <div class="wz-selected-cat">✓ ${cat.cat}</div>
      <div class="wz-badges">
        <div class="wz-badge-row"><span class="wz-badge-lbl">Fönster:</span>${fBadges}</div>
        <div class="wz-badge-row"><span class="wz-badge-lbl">Avisering:</span>${aBadges}</div>
      </div>`;
  }
  section.querySelectorAll('.wz-selected-cat, .wz-badges').forEach(el => el.remove());
  if (badgesHTML) section.insertAdjacentHTML('beforeend', badgesHTML);
}

function wizardCatChange(chain, idxStr) {
  wizardCatPick(chain, parseInt(idxStr));
}

// ── Steg 4: Artiklar ──
function buildWizardStep4() {
  const rows = wizardData.articles.map((name, i) => `
    <div class="wz-article-row">
      <input type="text" class="lansering-form-input" value="${name.replace(/"/g, '&quot;')}"
             placeholder="Artikelnamn (t.ex. Havredryck Naturell 1L)"
             oninput="wizardData.articles[${i}]=this.value">
      ${wizardData.articles.length > 1
        ? `<button class="wz-remove-btn" onclick="wizardRemoveArticle(${i})" title="Ta bort">✕</button>`
        : ''}
    </div>`).join('');

  return `
    <div class="wz-step-title">Artiklar och varianter</div>
    <div class="wz-step-sub">Lägg till de artiklar / SKU:er som ingår i lanseringen. Minst en krävs.</div>
    <div id="wz-articles">${rows}</div>
    <button class="wz-add-article-btn" onclick="wizardAddArticle()">+ Lägg till artikel</button>`;
}

function wizardAddArticle() {
  wizardData.articles.push('');
  renderWizardModal();
  // Fokusera sista input
  setTimeout(() => {
    const inputs = document.querySelectorAll('#wz-articles input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }, 30);
}

function wizardRemoveArticle(i) {
  wizardData.articles.splice(i, 1);
  renderWizardModal();
}

// ── Navigation ──
function wizardNext() {
  const { step } = wizardData;

  if (step === 1 && wizardData.isEdit) { wizardData.step++; renderWizardModal(); return; }

  if (step === 1) {
    if (!wizardData.brandId && !wizardData.useNewBrand) {
      alert('Välj ett varumärke eller skapa ett nytt.');
      return;
    }
    if (wizardData.useNewBrand && !wizardData.newBrandName.trim()) {
      alert('Ange ett namn för det nya varumärket.');
      return;
    }
  } else if (step === 2) {
    if (!wizardData.groupName.trim()) {
      alert('Ange ett namn för produktgruppen.');
      return;
    }
    if (wizardData.chains.length === 0) {
      alert('Välj minst en kedja.');
      return;
    }
  } else if (step === 3) {
    for (const c of wizardData.chains) {
      if (!wizardData.categories[c]) {
        const lbl = c === 'coop' ? 'Coop' : c === 'ica' ? 'ICA' : 'Dagab';
        alert(`Välj kategori för ${lbl}.`);
        return;
      }
    }
  }

  wizardData.step++;
  renderWizardModal();
}

function wizardPrev() {
  wizardData.step = Math.max(1, wizardData.step - 1);
  renderWizardModal();
}

// ── Slutför: skapa projekt per kedja ──
async function completeWizard() {
  const validArticles = wizardData.articles.map(a => a.trim()).filter(Boolean);
  if (validArticles.length === 0) {
    alert('Lägg till minst en artikel.');
    return;
  }

  // Stäng wizard direkt — gör resten i bakgrunden
  const data = { ...wizardData };
  closeWizard();

  // Hämta/skapa varumärke
  let brandId = data.brandId;
  let brandName = '';
  let brandColor = '#f59e0b';

  if (data.useNewBrand) {
    brandName = data.newBrandName.trim();
    try {
      const { data: pid, error } = await supabaseClient.rpc('create_project', {
        p_workspace_id: currentWorkspaceId,
        p_name: brandName,
        p_color: brandColor,
        p_visibility: 'private'
      });
      if (error) throw error;
      const newBrand = { id: pid, name: brandName, color: brandColor, productGroups: [], products: [] };
      brands.push(newBrand);
      await supabaseClient.rpc('save_project_data', {
        p_project_id: pid,
        p_data: JSON.stringify({ productGroups: [], products: [] })
      });
      brandId = pid;
    } catch (e) {
      brandId = 'b_' + Date.now();
      brands.push({ id: brandId, name: brandName, color: brandColor, productGroups: [], products: [] });
    }
  } else {
    const b = brands.find(x => x.id === brandId);
    brandName  = b?.name  || '';
    brandColor = b?.color || '#f59e0b';
  }

  const groupName = data.groupName.trim();
  const articles  = validArticles.map(name => ({ id: 'a_' + Math.random().toString(36).slice(2, 8), name }));
  const name = `${brandName} — ${groupName}`;

  // Bygg chainData: per-kedja kategori + veckor
  const chainData = Object.fromEntries(data.chains.map(c => {
    const cat = data.categories[c];
    return [c, {
      category:        cat?.cat       || '',
      aviseringsVeckor: cat?.avisering || [],
      fonsterVeckor:   cat?.fonster   || []
    }];
  }));

  const chainLabels = data.chains.map(c =>
    c === 'coop' ? 'Coop' : c === 'ica' ? 'ICA' : 'Dagab'
  ).join(', ');

  try {
    const { data: pid, error } = await supabaseClient.rpc('create_project', {
      p_workspace_id: currentWorkspaceId,
      p_name: name,
      p_color: brandColor,
      p_visibility: 'private'
    });
    if (error) throw error;

    const newL = {
      id: pid, name, color: brandColor,
      brandId, brand: brandName, groupName,
      chains: data.chains,
      chainData,
      articles,
      customers: {}, checklist: {}, tasks: [], contactLog: [], freeCustomers: [],
      is_lansering: true, activeCustomerTab: data.chains[0]
    };
    lanseringar.push(newL);
    selectedLanseringId = pid;

    const { id: _id, name: _n, color: _c, ...rest } = newL;
    await supabaseClient.rpc('save_project_data', { p_project_id: pid, p_data: JSON.stringify(rest) });

    addActivity('', `Lansering skapad: ${groupName} (${chainLabels})`);
    addNotif(`Lansering skapad: ${groupName}`, 'success');
  } catch (e) {
    console.error('completeWizard: kunde inte skapa lansering', e);
    addNotif('Kunde inte spara lanseringen', 'error');
  }

  renderLansering();
  renderBrands();
}

async function completeEditWizard() {
  const validArticles = wizardData.articles.map(a => a.trim()).filter(Boolean);
  if (validArticles.length === 0) { alert('Lägg till minst en artikel.'); return; }
  const data = { ...wizardData };
  closeWizard();
  const l = lanseringar.find(x => x.id === data.lanseringId);
  if (!l) { addNotif('Lanseringen hittades inte', 'error'); return; }
  const b = brands.find(x => x.id === data.brandId);
  const brandName  = b?.name  || l.brand  || '';
  const brandColor = b?.color || l.color  || '#f59e0b';
  const groupName  = data.groupName.trim();
  const chainData = Object.fromEntries(data.chains.map(c => {
    const cat = data.categories[c];
    return [c, { category: cat?.cat || '', aviseringsVeckor: cat?.avisering || [], fonsterVeckor: cat?.fonster || [] }];
  }));
  const articles = validArticles.map((name, i) => ({
    id: l.articles?.[i]?.id || 'a_' + Math.random().toString(36).slice(2, 8), name
  }));
  const customers = { ...(l.customers || {}) };
  for (const chain of (l.chains || [])) { if (!data.chains.includes(chain)) delete customers[chain]; }
  for (const chain of data.chains) { if (!customers[chain]) customers[chain] = { checklist: {}, tasks: [] }; }
  const activeTab = data.chains.includes(l.activeCustomerTab) ? l.activeCustomerTab : data.chains[0];
  const updated = { ...l, brandId: data.brandId, brand: brandName, color: brandColor,
    groupName, name: `${brandName} — ${groupName}`,
    chains: data.chains, chainData, articles, customers,
    activeCustomerTab: activeTab, is_lansering: true };
  try {
    const { id: _id, name: _n, color: _c, ...rest } = updated;
    await supabaseClient.rpc('save_project_data', { p_project_id: updated.id, p_data: JSON.stringify(rest) });
    const idx = lanseringar.findIndex(x => x.id === updated.id);
    if (idx !== -1) lanseringar[idx] = updated;
    selectedLanseringId = updated.id;
    addActivity('✏️', `Lansering uppdaterad: ${groupName}`);
    addNotif(`"${updated.name}" sparad`, 'success');
  } catch (e) {
    console.error('completeEditWizard:', e);
    addNotif('Kunde inte spara ändringarna', 'error');
  }
  renderLansering();
}

async function saveLanseringModal() {
  if (!editingLanseringId) return;
  const brandId = document.getElementById('lm-brand')?.value;
  const name = document.getElementById('lm-name')?.value?.trim();
  if (!name) { alert('Ange ett namn'); return; }
  const l = getLansering(editingLanseringId);
  if (l) {
    l.name = name;
    if (brandId) { l.brandId = brandId; l.brand = brands.find(b => b.id === brandId)?.name || l.brand; }
  }
  await saveLansering(editingLanseringId);
  closeLanseringModal();
  addActivity('', `Lansering uppdaterad: ${name}`);
  renderLansering();
}

async function deleteLansering(lid) {
  if (!confirm('Ta bort denna lansering?')) return;
  const l = getLansering(lid);
  const name = l?.name || 'Okänd lansering';
  try {
    await supabaseClient.from('projects').delete().eq('id', lid);
  } catch(e) {}
  lanseringar = lanseringar.filter(x => x.id !== lid);
  if (selectedLanseringId === lid) selectedLanseringId = null;
  addActivity('', `Lansering "${name}" borttagen`);
  renderLansering();
}



// ═══════════════════════════════════════════════
// SJOK 2A: ARTIKELSTRUKTUR
// ═══════════════════════════════════════════════

function getOrInitGroups(brand) {
  // Hantera om productGroups är en JSON-sträng
  if (typeof brand.productGroups === 'string') {
    try { brand.productGroups = JSON.parse(brand.productGroups); } catch(e) { brand.productGroups = []; }
  }
  if (!Array.isArray(brand.productGroups)) brand.productGroups = [];
  return brand.productGroups;
}

function renderArticleSection(brand) {
  const groups = getOrInitGroups(brand);
  const groupsHtml = groups.map((g, gi) => {
    const articles = g.articles || [];
    const articleRows = articles.map((a, ai) => `
      <div class="article-row">
        <span class="article-row-name">${a.name}</span>
        ${a.ean ? `<span class="article-row-ean">EAN: ${a.ean}</span>` : ''}
        <button class="article-delete-btn" onclick="deleteArticle('${brand.id}',${gi},${ai})">×</button>
      </div>`).join('');

    return `<div class="product-group" id="pg-${brand.id}-${gi}">
      <div class="product-group-header" onclick="toggleGroup('${brand.id}',${gi})">
        <span class="product-group-name">${g.name}</span>
        <span style="font-size:10px;color:var(--muted)">${articles.length} artikel${articles.length!==1?'ar':''}</span>
        <span class="product-group-toggle" id="pgt-${brand.id}-${gi}">▸</span>
        <button onclick="event.stopPropagation();deleteGroup('${brand.id}',${gi})" style="background:none;border:none;color:rgba(255,255,255,0.2);cursor:pointer;font-size:13px;padding:0 2px">×</button>
      </div>
      <div class="product-group-body" id="pgb-${brand.id}-${gi}" style="display:none">
        <div class="article-list">${articleRows || '<div style="color:var(--muted);font-size:11px;padding:4px 0">Inga artiklar ännu</div>'}</div>
        <div class="article-add-row">
          <input class="article-input" id="art-name-${brand.id}-${gi}" placeholder="Artikelnamn..." style="flex:2;min-width:120px">
          <input class="article-input" id="art-ean-${brand.id}-${gi}" placeholder="EAN (valfritt)" style="width:130px">
          <button class="inline-btn" onclick="addArticle('${brand.id}',${gi})">+ Artikel</button>
        </div>
      </div>
    </div>`;
  }).join('');

  return `<div class="articles-section">
    <div class="section-title" style="margin-bottom:10px">ARTIKLAR</div>
    ${groupsHtml || '<div style="color:var(--muted);font-size:12px;padding:8px 0">Lägg till en produktgrupp nedan</div>'}
    <div class="group-add-row">
      <input class="inline-input" id="new-group-input-${brand.id}" placeholder="Ny produktgrupp (t.ex. Müsli 500g)..." onkeydown="if(event.key==='Enter')addProductGroup('${brand.id}')">
      <button class="inline-btn" onclick="addProductGroup('${brand.id}')">+ Grupp</button>
    </div>
  </div>`;
}

const openGroups = new Set(); // håller reda på vilka grupper som är öppna

function toggleGroup(brandId, gi) {
  const key = `${brandId}|${gi}`;
  const body = document.getElementById(`pgb-${brandId}-${gi}`);
  const toggle = document.getElementById(`pgt-${brandId}-${gi}`);
  if (!body) return;
  const open = body.style.display === 'block';
  body.style.display = open ? 'none' : 'block';
  if (toggle) toggle.textContent = open ? '▸' : '▾';
  if (open) openGroups.delete(key); else openGroups.add(key);
}

function restoreOpenGroups(brandId) {
  openGroups.forEach(key => {
    const sepIdx = key.indexOf('|');
    const bid = key.slice(0, sepIdx);
    const gi = key.slice(sepIdx + 1);
    if (bid !== brandId) return;
    const body = document.getElementById(`pgb-${bid}-${gi}`);
    const toggle = document.getElementById(`pgt-${bid}-${gi}`);
    if (body) { body.style.display = 'block'; }
    if (toggle) toggle.textContent = '▾';
  });
}

async function addProductGroup(brandId) {
  const input = document.getElementById(`new-group-input-${brandId}`);
  const name = input?.value.trim();
  if (!name) return;
  const brand = brands.find(b => b.id === brandId);
  if (!brand) { console.error('addProductGroup: brand not found', brandId); return; }
  console.log('addProductGroup: currentWorkspaceId=', currentWorkspaceId, 'brandId=', brandId);
  getOrInitGroups(brand).push({ name, articles: [] });
  await saveProject(brandId);
  input.value = '';
  addActivity('', `Produktgrupp "${name}" skapad i "${brand.name}"`);
  renderBrands();
}

function deleteGroup(brandId, gi) {
  const brand = brands.find(b => b.id === brandId);
  if (!brand) return;
  const groups = getOrInitGroups(brand);
  const groupName = groups[gi]?.name || 'Okänd grupp';
  groups.splice(gi, 1);
  saveProject(brandId);
  addActivity('', `Produktgrupp "${groupName}" borttagen från "${brand.name}"`);
  renderBrands();
  restoreOpenGroups(brandId);
}

async function addArticle(brandId, gi) {
  const brand = brands.find(b => b.id === brandId);
  if (!brand) { console.error('addArticle: brand not found', brandId); return; }
  const groups = getOrInitGroups(brand);
  const name = document.getElementById(`art-name-${brandId}-${gi}`)?.value.trim();
  const ean = document.getElementById(`art-ean-${brandId}-${gi}`)?.value.trim();
  if (!name) return;
  if (!groups[gi]) { console.error('addArticle: group index not found', gi); return; }
  if (!groups[gi].articles) groups[gi].articles = [];
  groups[gi].articles.push({ id: uid(), name, ean });
  console.log('addArticle: saving', brandId, 'groups:', JSON.stringify(groups));
  await saveProject(brandId);
  console.log('addArticle: saved OK');
  document.getElementById(`art-name-${brandId}-${gi}`).value = '';
  document.getElementById(`art-ean-${brandId}-${gi}`).value = '';
  addActivity('', `Artikel "${name}" tillagd i "${groups[gi].name}" (${brand.name})`);
  renderBrands();
  restoreOpenGroups(brandId);
}

function deleteArticle(brandId, gi, ai) {
  const brand = brands.find(b => b.id === brandId);
  if (!brand) return;
  const groups = getOrInitGroups(brand);
  const articleName = groups[gi]?.articles?.[ai]?.name || 'Okänd artikel';
  const groupName = groups[gi]?.name || 'Okänd grupp';
  groups[gi].articles.splice(ai, 1);
  saveProject(brandId);
  addActivity('', `Artikel "${articleName}" borttagen från "${groupName}" (${brand.name})`);
  renderBrands();
  restoreOpenGroups(brandId);
}

// ═══════════════════════════════════════════════
// SJOK 2B: AVISERINGSHISTORIK
// ═══════════════════════════════════════════════

function renderArkiv() {
  const el = document.getElementById('arkiv-content');
  if (!el) return;

  const allRoundsAll = allRounds();
  const pastRounds = allRoundsAll.filter(r => daysLeft(r.launchDate) < 0);
  const upcomingRounds = allRoundsAll.filter(r => daysLeft(r.launchDate) >= 0).sort((a,b) => daysLeft(a.launchDate)-daysLeft(b.launchDate));

  const filterChain = document.getElementById('hist-filter-chain')?.value || 'all';
  const filterView = document.getElementById('hist-filter-view')?.value || 'past';

  const rounds = filterView === 'past' ? pastRounds : upcomingRounds;
  const filtered = filterChain === 'all' ? rounds : rounds.filter(r => r.source === filterChain);

  const chainPill = (source) => {
    const map = { coop: 'hist-pill-coop', ica: 'hist-pill-ica', dagab: 'hist-pill-dagab' };
    const labels = { coop: 'Coop', ica: 'ICA', dagab: 'Dagab' };
    return `<span class="hist-pill ${map[source]||'hist-pill-past'}">${labels[source]||source}</span>`;
  };

  // Group by brand (products that have cats matching these rounds)
  const brandRows = brands.map(brand => {
    const allCats = (brand.productGroups||[]).flatMap(g => g.cats||[]).concat(brand.products.flatMap(p => p.cats||[]));
    const relevantRounds = filtered.filter(r => {
      return allCats.some(c => c.source === r.source);
    });
    return { brand, rounds: relevantRounds };
  }).filter(x => x.rounds.length > 0);

  const tableHtml = (rounds, brand) => {
    if (rounds.length === 0) return '';
    return `<table class="history-table">
      <thead><tr>
        <th>Kedja</th><th>Fönster</th><th>Lanseringsdatum</th><th>Dagar</th><th>Produkter</th>
      </tr></thead>
      <tbody>
        ${rounds.map(r => {
          const dl = daysLeft(r.launchDate);
          const st = status(dl);
          const relProducts = (brand.productGroups||[]).filter(g => (g.cats||[]).some(c => c.source === r.source));
          const prodNames = relProducts.map(g => g.name).join(', ') || '—';
          return `<tr>
            <td>${chainPill(r.source)}</td>
            <td style="font-weight:500">${r.name}</td>
            <td>${r.launchDate}</td>
            <td><span class="pill ${st.cls}" style="font-size:10px">${st.label}</span></td>
            <td style="color:var(--muted);font-size:11px">${prodNames}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  };

  const generalTable = () => {
    if (filtered.length === 0) return `<div class="history-empty">Inga aviseringar hittades</div>`;
    return `<table class="history-table">
      <thead><tr>
        <th>Kedja</th><th>Fönster</th><th>Lanseringsdatum</th><th>Status</th>
      </tr></thead>
      <tbody>
        ${filtered.map(r => {
          const dl = daysLeft(r.launchDate);
          const st = status(dl);
          return `<tr>
            <td>${chainPill(r.source)}</td>
            <td style="font-weight:500">${r.name}</td>
            <td>${r.launchDate}</td>
            <td><span class="pill ${st.cls}" style="font-size:10px">${st.label}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  };

  el.innerHTML = `<div class="history-section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div style="font-family:var(--display);font-size:18px;font-weight:700">Arkiv & Export</div>
      <button class="export-btn" onclick="exportToExcel()">Exportera till Excel</button>
    </div>

    <div class="history-filter-bar">
      <select class="history-filter-select" id="hist-filter-view" onchange="renderArkiv()">
        <option value="past">Passerade aviseringar</option>
        <option value="upcoming">Kommande aviseringar</option>
      </select>
      <select class="history-filter-select" id="hist-filter-chain" onchange="renderArkiv()">
        <option value="all">Alla kedjor</option>
        <option value="coop">Coop</option>
        <option value="ica">ICA</option>
        <option value="dagab">Dagab</option>
      </select>
    </div>

    ${brands.length > 0 ? `
      <div style="margin-bottom:20px">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Per varumärke</div>
        ${brandRows.length > 0 ? brandRows.map(({ brand, rounds: br }) => `
          <div class="history-brand-block">
            <div class="history-brand-title">
              <span style="width:10px;height:10px;border-radius:50%;background:${brand.color};display:inline-block"></span>
              ${brand.name}
            </div>
            ${tableHtml(br, brand)}
          </div>`).join('') : `<div class="history-empty">Inga varumärken med matchande aviseringar</div>`}
      </div>
      <div style="border-top:1px solid var(--border);padding-top:20px;margin-top:4px">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Alla aviseringar</div>
        ${generalTable()}
      </div>
    ` : `
      <div style="margin-bottom:20px">${generalTable()}</div>
    `}
  </div>`;
}

// ═══════════════════════════════════════════════
// SJOK 2C: EXCEL EXPORT
// ═══════════════════════════════════════════════

function exportToExcel() {
  const rows = [];

  // Header
  rows.push(['LISTINGWIN — Export', '', '', '', '', '', '', '']);
  rows.push(['Exportdatum:', new Date().toLocaleDateString('sv-SE'), '', '', '', '', '', '']);
  rows.push(['']);

  // === AVISERINGAR ===
  rows.push(['AVISERINGAR', '', '', '', '', '', '', '']);
  rows.push(['Kedja', 'Fönster', 'Lanseringsdatum', 'Status', 'Dagar kvar']);
  allRounds().forEach(r => {
    const dl = daysLeft(r.launchDate);
    const st = status(dl);
    rows.push([
      r.source === 'coop' ? 'Coop' : r.source === 'ica' ? 'ICA' : 'Dagab',
      r.name,
      r.launchDate,
      st.label,
      dl
    ]);
  });
  rows.push(['']);

  // === VARUMÄRKEN & ARTIKLAR ===
  rows.push(['VARUMÄRKEN & ARTIKLAR', '', '', '', '', '', '', '']);
  rows.push(['Varumärke', 'Produktgrupp', 'Artikel', 'EAN', 'Kategori (kopplad)', 'Källa']);
  brands.forEach(brand => {
    const groups = brand.productGroups || [];
    if (groups.length > 0) {
      groups.forEach(g => {
        const articles = g.articles || [];
        if (articles.length > 0) {
          articles.forEach(a => {
            rows.push([brand.name, g.name, a.name, a.ean || '', '', '']);
          });
        } else {
          rows.push([brand.name, g.name, '—', '', '', '']);
        }
      });
    }
    // Legacy products
    // Produktgrupper
    (brand.productGroups||[]).forEach(g => {
      const articles = g.articles || [];
      const cats = g.cats || [];
      if (articles.length > 0) {
        articles.forEach(a => {
          cats.forEach(c => rows.push([brand.name, g.name, a.name, a.ean||'', c.catName, c.source]));
          if (cats.length === 0) rows.push([brand.name, g.name, a.name, a.ean||'', '', '']);
        });
      } else {
        cats.forEach(c => rows.push([brand.name, g.name, '—', '', c.catName, c.source]));
        if (cats.length === 0) rows.push([brand.name, g.name, '—', '', '', '']);
      }
    });
  });
  rows.push(['']);

  // === LANSERING CHECKLISTA ===
  rows.push(['LANSERING — CHECKLISTA & LOGG', '', '', '', '', '', '', '']);
  lanseringar.forEach(l => {
    rows.push(['']);
    rows.push([`Lansering: ${l.name}`, l.brand || '', l.launchDate || '', '', '', '']);
    rows.push(['— Checklista —', '', '', '', '', '']);
    rows.push(['Steg', 'Status', 'Datum']);
    CHECKLIST_ITEMS.forEach(item => {
      const done = l.checklist && l.checklist[item.id];
      rows.push([item.label, done ? '✓ Klar' : 'Ej klar', done || '']);
    });
    if (l.tasks && l.tasks.length > 0) {
      rows.push(['— Projektuppgifter —', '', '', '', '', '']);
      rows.push(['Uppgift', 'Status', 'Deadline', 'Ansvarig']);
      l.tasks.forEach(t => rows.push([t.name, t.status, t.deadline || '', t.owner || '']));
    }
    if (l.contactLog && l.contactLog.length > 0) {
      rows.push(['— Kedjekontakt —', '', '', '', '', '']);
      rows.push(['Datum', 'Kedja', 'Kontakt', 'Anteckning', 'Nästa steg']);
      l.contactLog.forEach(e => rows.push([e.date, e.chainLabel || e.chain, e.contact || '', e.note, e.next || '']));
    }
  });

  // Build CSV
  const csv = rows.map(r => r.map(cell => {
    const s = String(cell ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(',')).join('\n');

  // BOM for Excel Swedish char support
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `listingwin_export_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}



// ═══════════════════════════════════════════════
// SJOK 3A: KALKYLATOR
// ═══════════════════════════════════════════════

const kalkylState = {
  // Värdekedja
  vk: {
    konsumentpris: '',
    moms: '12',
    butiksMarginal: '35',
    grossistMarginal: '8',
    fragtkostnad: '',
  },
  // Volym
  vol: {
    rotation: '',
    butiker: '',
    veckor: '52',
  },
  // Rapid Start
  rs: {
    chain: 'coop',
    kartongpris: '',
    butiker: '',
  }
};

function kv(id) {
  const el = document.getElementById(id);
  return el ? parseFloat(el.value.replace(',','.')) || 0 : 0;
}

function fmt(n, decimals = 0) {
  if (isNaN(n) || !isFinite(n)) return '—';
  return n.toLocaleString('sv-SE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtKr(n) {
  if (isNaN(n) || !isFinite(n)) return '—';
  return fmt(n, 2) + ' kr';
}

function renderKalkyl() {
  const el = document.getElementById('kalkyl-content');
  if (!el) return;

  el.innerHTML = `<div class="kalkyl-page">
    <div style="font-family:var(--display);font-size:22px;font-weight:700;margin-bottom:4px">Kalkylator</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:20px">Värdekedja, volymer och Rapid Start-kostnad</div>

    <div class="kalkyl-grid">

      <!-- VÄRDEKEDJA -->
      <div class="kalkyl-card">
        <div class="kalkyl-card-title">Värdekedja</div>
        <div class="kalkyl-card-sub">Räkna baklänges från konsumentpris till leverantörspris</div>

        <div class="kalkyl-field">
          <div class="kalkyl-label"><span>Konsumentpris inkl. moms (kr)</span></div>
          <input class="kalkyl-input" id="vk-konsumentpris" type="number" placeholder="t.ex. 49.90" oninput="updateVardekedja()">
        </div>
        <div class="kalkyl-field">
          <div class="kalkyl-label"><span>Momssats (%)</span></div>
          <input class="kalkyl-input" id="vk-moms" type="number" value="12" oninput="updateVardekedja()">
        </div>
        <div class="kalkyl-field">
          <div class="kalkyl-label"><span>Butiksmarginal (%)</span></div>
          <input class="kalkyl-input" id="vk-butik" type="number" value="35" oninput="updateVardekedja()">
        </div>
        <div class="kalkyl-field">
          <div class="kalkyl-label"><span>Grossistmarginal / kedjerabatt (%)</span></div>
          <input class="kalkyl-input" id="vk-grossist" type="number" value="8" oninput="updateVardekedja()">
        </div>
        <div class="kalkyl-field">
          <div class="kalkyl-label"><span>Frakt & logistik per enhet (kr)</span></div>
          <input class="kalkyl-input" id="vk-frakt" type="number" placeholder="t.ex. 2.50" oninput="updateVardekedja()">
        </div>

        <div class="kalkyl-result-box" id="vk-result">
          <div style="font-size:10px;color:var(--muted);margin-bottom:8px">Fyll i konsumentpris ovan för att se uträkning</div>
        </div>
      </div>

      <!-- VOLYMER -->
      <div class="kalkyl-card">
        <div class="kalkyl-card-title">Volymkalkyl</div>
        <div class="kalkyl-card-sub">Beräkna förväntad volym baserat på rotation och antal butiker</div>

        <div class="kalkyl-field">
          <div class="kalkyl-label"><span>Rotation (enheter/butik/vecka)</span></div>
          <input class="kalkyl-input" id="vol-rotation" type="number" placeholder="t.ex. 2" oninput="updateVolym()">
        </div>
        <div class="kalkyl-field">
          <div class="kalkyl-label"><span>Antal butiker</span></div>
          <input class="kalkyl-input" id="vol-butiker" type="number" placeholder="t.ex. 500" oninput="updateVolym()">
        </div>
        <div class="kalkyl-field">
          <div class="kalkyl-label"><span>Tidsperiod (veckor)</span></div>
          <input class="kalkyl-input" id="vol-veckor" type="number" value="52" oninput="updateVolym()">
        </div>

        <div class="kalkyl-result-box" id="vol-result">
          <div style="font-size:10px;color:var(--muted);margin-bottom:8px">Fyll i rotation och antal butiker</div>
        </div>

        <!-- Kombinerad volym + värde -->
        <div class="kalkyl-result-box" id="vol-value-result" style="margin-top:10px;display:none"></div>
      </div>

      <!-- RAPID START -->
      <div class="kalkyl-card" style="grid-column: 1 / -1;">
        <div class="kalkyl-card-title">Rapid Start — Statisk kostnad vid lansering</div>
        <div class="kalkyl-card-sub">Kostnad = Kartongpris × Antal butiker vid lansering</div>

        <div class="kalkyl-chain-tabs">
          <button class="kalkyl-chain-tab active-coop" id="rs-tab-coop" onclick="setRsChain('coop')">Coop</button>
          <button class="kalkyl-chain-tab" id="rs-tab-dagab" onclick="setRsChain('dagab')">Dagab (Willys/Hemköp)</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="kalkyl-field">
            <div class="kalkyl-label"><span>Kartongpris (kr/krt)</span></div>
            <input class="kalkyl-input" id="rs-kartong" type="number" placeholder="t.ex. 180" oninput="updateRapidStart()">
          </div>
          <div class="kalkyl-field">
            <div class="kalkyl-label" id="rs-butiker-label"><span>Antal butiker vid lansering</span></div>
            <input class="kalkyl-input" id="rs-butiker" type="number" placeholder="t.ex. 300" oninput="updateRapidStart()">
          </div>
        </div>

        <div class="kalkyl-field">
          <div class="kalkyl-label"><span>Enheter per kartong (kolli)</span></div>
          <input class="kalkyl-input" id="rs-kolli" type="number" placeholder="t.ex. 6" oninput="updateRapidStart()">
        </div>

        <div class="kalkyl-result-box" id="rs-result">
          <div style="font-size:10px;color:var(--muted)">Fyll i kartongpris och antal butiker</div>
        </div>
      </div>

    </div>
  </div>`;
}

let rsChain = 'coop';
function setRsChain(chain) {
  rsChain = chain;
  document.getElementById('rs-tab-coop').className = 'kalkyl-chain-tab' + (chain==='coop'?' active-coop':'');
  document.getElementById('rs-tab-dagab').className = 'kalkyl-chain-tab' + (chain==='dagab'?' active-dagab':'');
  updateRapidStart();
}

function updateVardekedja() {
  const konsument = kv('vk-konsumentpris');
  if (!konsument) {
    document.getElementById('vk-result').innerHTML = '<div style="font-size:10px;color:var(--muted)">Fyll i konsumentpris ovan</div>';
    return;
  }
  const moms = kv('vk-moms') / 100;
  const butik = kv('vk-butik') / 100;
  const grossist = kv('vk-grossist') / 100;
  const frakt = kv('vk-frakt');

  const exMoms = konsument / (1 + moms);
  const efterButik = exMoms * (1 - butik);
  const efterGrossist = efterButik * (1 - grossist);
  const netto = efterGrossist - frakt;

  document.getElementById('vk-result').innerHTML = `
    <div class="kalkyl-result-row"><span class="kalkyl-result-label">Konsumentpris inkl. moms</span><span class="kalkyl-result-value">${fmtKr(konsument)}</span></div>
    <div class="kalkyl-result-row"><span class="kalkyl-result-label">Exkl. moms (${kv('vk-moms')}%)</span><span class="kalkyl-result-value">${fmtKr(exMoms)}</span></div>
    <div class="kalkyl-result-row"><span class="kalkyl-result-label">Efter butiksmarginal (${kv('vk-butik')}%)</span><span class="kalkyl-result-value">${fmtKr(efterButik)}</span></div>
    <div class="kalkyl-result-row"><span class="kalkyl-result-label">Efter grossist/kedjerabatt (${kv('vk-grossist')}%)</span><span class="kalkyl-result-value">${fmtKr(efterGrossist)}</span></div>
    ${frakt ? `<div class="kalkyl-result-row"><span class="kalkyl-result-label">Frakt & logistik</span><span class="kalkyl-result-value red">− ${fmtKr(frakt)}</span></div>` : ''}
    <div class="kalkyl-result-row" style="margin-top:4px"><span class="kalkyl-result-label" style="font-weight:600">Nettopris till leverantör</span><span class="kalkyl-result-value highlight">${fmtKr(netto)}</span></div>
  `;
  // Update combined vol+value if volym is filled
  updateVolym();
}

function updateVolym() {
  const rotation = kv('vol-rotation');
  const butiker = kv('vol-butiker');
  const veckor = kv('vol-veckor') || 52;

  if (!rotation || !butiker) {
    document.getElementById('vol-result').innerHTML = '<div style="font-size:10px;color:var(--muted)">Fyll i rotation och antal butiker</div>';
    document.getElementById('vol-value-result').style.display = 'none';
    return;
  }

  const perVecka = rotation * butiker;
  const perAr = perVecka * veckor;
  const perManad = perAr / 12;

  document.getElementById('vol-result').innerHTML = `
    <div class="kalkyl-result-row"><span class="kalkyl-result-label">Per vecka</span><span class="kalkyl-result-value">${fmt(perVecka)} enheter</span></div>
    <div class="kalkyl-result-row"><span class="kalkyl-result-label">Per månad</span><span class="kalkyl-result-value">${fmt(perManad)} enheter</span></div>
    <div class="kalkyl-result-row"><span class="kalkyl-result-label">Per ${veckor} veckor</span><span class="kalkyl-result-value highlight">${fmt(perAr)} enheter</span></div>
  `;

  // Kombinera med värdekedjan om tillgänglig
  const konsument = kv('vk-konsumentpris');
  const moms = kv('vk-moms') / 100 || 0.12;
  const butikM = kv('vk-butik') / 100 || 0.35;
  const grossistM = kv('vk-grossist') / 100 || 0.08;
  const frakt = kv('vk-frakt');
  if (konsument) {
    const netto = (konsument / (1 + moms)) * (1 - butikM) * (1 - grossistM) - frakt;
    const omsVecka = perVecka * netto;
    const omsAr = perAr * netto;
    const vr = document.getElementById('vol-value-result');
    vr.style.display = '';
    vr.innerHTML = `
      <div style="font-size:10px;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Omsättning till leverantörspris</div>
      <div class="kalkyl-result-row"><span class="kalkyl-result-label">Per vecka</span><span class="kalkyl-result-value">${fmtKr(omsVecka)}</span></div>
      <div class="kalkyl-result-row"><span class="kalkyl-result-label">Per ${veckor} veckor</span><span class="kalkyl-result-value green">${fmtKr(omsAr)}</span></div>
    `;
  } else {
    document.getElementById('vol-value-result').style.display = 'none';
  }
}

function updateRapidStart() {
  const kartong = kv('rs-kartong');
  const butiker = kv('rs-butiker');
  const kolli = kv('rs-kolli');
  const chainLabel = rsChain === 'coop' ? 'Coop' : 'Dagab';

  if (!kartong || !butiker) {
    document.getElementById('rs-result').innerHTML = '<div style="font-size:10px;color:var(--muted)">Fyll i kartongpris och antal butiker</div>';
    return;
  }

  const totalKostn = kartong * butiker;
  const totEnheter = kolli ? kolli * butiker : null;

  document.getElementById('rs-result').innerHTML = `
    <div class="kalkyl-result-row"><span class="kalkyl-result-label">Kedja</span><span class="kalkyl-result-value">${chainLabel}</span></div>
    <div class="kalkyl-result-row"><span class="kalkyl-result-label">Kartongpris × Butiker</span><span class="kalkyl-result-value">${fmtKr(kartong)} × ${fmt(butiker)} st</span></div>
    ${totEnheter ? `<div class="kalkyl-result-row"><span class="kalkyl-result-label">Totalt antal enheter i startlager</span><span class="kalkyl-result-value">${fmt(totEnheter)} st</span></div>` : ''}
    <div class="kalkyl-result-row"><span class="kalkyl-result-label" style="font-weight:600">Total Rapid Start-kostnad</span><span class="kalkyl-result-value highlight">${fmtKr(totalKostn)}</span></div>
    <div style="font-size:10px;color:var(--muted);margin-top:8px">Statisk kostnad = ett kartongpris placeras i varje butik vid lansering</div>
  `;
}

// ═══════════════════════════════════════════════
// SJOK 3B: PÅMINNELSER
// ═══════════════════════════════════════════════

const PAM_KEY = 'lw_paminnelser';

function loadPamSettings() {
  try {
    const raw = sessionStorage.getItem(PAM_KEY);
    return raw ? JSON.parse(raw) : getDefaultPamSettings();
  } catch(e) { return getDefaultPamSettings(); }
}

function savePamSettings(settings) {
  try { sessionStorage.setItem(PAM_KEY, JSON.stringify(settings)); } catch(e) {}
}

function getDefaultPamSettings() {
  return {
    email: '',
    avisering: { enabled: false, days: 21 },
    prisListning: { enabled: false, days: 14 },
    validoo: { enabled: false, days: 30 },
    mote: { enabled: false, days: 7 },
    lansering: { enabled: false, days: 7 },
    customTasks: { enabled: false, days: 3 },
  };
}

function renderPaminnelser() {
  const el = document.getElementById('paminnelser-content');
  if (!el) return;
  const s = loadPamSettings();

  const pamRow = (key, label, sub) => `
    <div class="pam-row">
      <div style="flex:1">
        <div class="pam-row-label">${label}</div>
        <div class="pam-row-sub">${sub}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <input class="pam-days-input" type="number" min="1" max="90"
          value="${s[key]?.days ?? 7}"
          onchange="updatePamDay('${key}',this.value)"
          title="Antal dagar innan">
        <span style="font-size:10px;color:var(--muted)">dagar innan</span>
        <label class="pam-toggle">
          <input type="checkbox" ${s[key]?.enabled ? 'checked' : ''} onchange="togglePam('${key}',this.checked)">
          <span class="pam-slider"></span>
        </label>
      </div>
    </div>`;

  el.innerHTML = `<div class="pam-page">
    <div style="font-family:var(--display);font-size:22px;font-weight:700;margin-bottom:4px">Påminnelser</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:16px">Välj vilka moment du vill bli påmind om och hur många dagar i förväg</div>

    <div class="pam-intro">
      <strong>Så fungerar påminnelserna:</strong> Aktivera de moment du vill bli påmind om och ange hur många dagar i förväg.
      Ange din e-postadress nedan så skickas påminnelserna dit när deadlines närmar sig.
      Du kan alltid stänga av enskilda påminnelser utan att ändra andra inställningar.
    </div>

    <div class="pam-section">
      <div class="pam-section-title">Din e-postadress</div>
      <input class="pam-email-input" id="pam-email" type="email"
        placeholder="din@email.se"
        value="${s.email || ''}"
        oninput="updatePamEmail(this.value)">
    </div>

    <div class="pam-section">
      <div class="pam-section-title">Aviseringar & Kedjemoment</div>
      ${pamRow('avisering',  'Aviseringsfönster öppnar', 'Påminnelse när ett nytt aviseringsfönster börjar närma sig')}
      ${pamRow('lansering',  'Planerad lansering', 'Påminnelse inför ditt planerade lanseringsdatum')}
      ${pamRow('mote',       'Mötesbokning kedja', 'Påminnelse om att boka in möte med kedja')}
    </div>

    <div class="pam-section">
      <div class="pam-section-title">Checklistmoment</div>
      ${pamRow('validoo',    'Artikeldata Validoo/Dabas', 'Påminnelse om att säkerställa artikeldata')}
      ${pamRow('prisListning','Priskalkyl klar', 'Påminnelse om att slutföra priskalkylen')}
      ${pamRow('customTasks','Projektuppgifter med deadline', 'Påminnelse för uppgifter i projektledardelen')}
    </div>

    <div style="display:flex;align-items:center;margin-top:8px">
      <button class="pam-save-btn" onclick="savePamAndConfirm()">Spara inställningar</button>
      <span class="pam-saved-msg" id="pam-saved-msg">✓ Sparat</span>
    </div>

    <div style="margin-top:28px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px">
      <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Aktiva påminnelser just nu</div>
      ${renderActiveReminders(s)}
    </div>
  </div>`;
}

function renderActiveReminders(s) {
  const labels = {
    avisering: 'Aviseringsfönster',
    lansering: 'Planerad lansering',
    mote: 'Mötesbokning kedja',
    validoo: 'Artikeldata Validoo/Dabas',
    prisListning: 'Priskalkyl klar',
    customTasks: 'Projektuppgifter',
  };

  const active = Object.entries(labels).filter(([k]) => s[k]?.enabled);
  if (active.length === 0) return '<div style="color:var(--muted);font-size:12px">Inga påminnelser aktiverade</div>';

  // Find upcoming triggers
  const rows = [];
  const allR = allRounds().filter(r => { const d = daysLeft(r.launchDate); return d >= 0 && d <= 60; });

  if (s.avisering?.enabled) {
    allR.forEach(r => {
      const d = daysLeft(r.launchDate);
      const triggerAt = d - (s.avisering.days || 21);
      if (triggerAt <= 0 && d >= 0) {
        const src = r.source === 'coop' ? 'Coop' : r.source === 'ica' ? 'ICA' : 'Dagab';
        rows.push({ label: `Avisering: ${r.name} (${src})`, days: d, type: r.source });
      }
    });
  }

  if (s.lansering?.enabled) {
    lanseringar.filter(l => l.launchDate).forEach(l => {
      const d = Math.round((new Date(l.launchDate) - new Date()) / 86400000);
      if (d >= 0 && d <= (s.lansering.days || 7) * 3) {
        rows.push({ label: `Lansering: ${l.name}`, days: d, type: 'lansering' });
      }
    });
  }

  if (rows.length === 0 && active.length > 0) {
    return `<div style="color:var(--muted);font-size:12px">
      ${active.map(([k]) => `<span style="display:inline-block;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;border-radius:4px;padding:2px 8px;font-size:10px;margin:2px">${labels[k]} — ${s[k].days}d innan</span>`).join('')}
      <div style="margin-top:8px;font-size:11px">Inga triggers inom närmaste 60 dagarna</div>
    </div>`;
  }

  return rows.map(r => `
    <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px">
      <span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;flex-shrink:0"></span>
      <span style="flex:1">${r.label}</span>
      <span style="font-size:10px;color:#f59e0b;font-weight:600">${r.days}d kvar</span>
    </div>`).join('') || '<div style="color:var(--muted);font-size:12px">Inga aktiva triggers just nu</div>';
}

function togglePam(key, enabled) {
  const s = loadPamSettings();
  if (!s[key]) s[key] = { enabled: false, days: 7 };
  s[key].enabled = enabled;
  savePamSettings(s);
}

function updatePamDay(key, val) {
  const s = loadPamSettings();
  if (!s[key]) s[key] = { enabled: false, days: 7 };
  s[key].days = parseInt(val) || 7;
  savePamSettings(s);
}

function updatePamEmail(val) {
  const s = loadPamSettings();
  s.email = val;
  savePamSettings(s);
}

function savePamAndConfirm() {
  const email = document.getElementById('pam-email')?.value;
  if (email) updatePamEmail(email);
  const msg = document.getElementById('pam-saved-msg');
  if (msg) {
    msg.style.opacity = '1';
    setTimeout(() => { msg.style.opacity = '0'; }, 2500);
  }
}



// ═══════════════════════════════════════════════
// BLOCK 4 — 12 NYA FUNKTIONER
// ═══════════════════════════════════════════════

// ── 1. ONBOARDING ──
const ONBOARD_KEY = 'lw_onboarded_v1';
let onboardStep = 0;
const onboardData = { brandName: '', chains: [] };

function shouldShowOnboarding() {
  return !sessionStorage.getItem(ONBOARD_KEY) && brands.length === 0;
}

function startOnboarding() {
  if (!shouldShowOnboarding()) return;
  onboardStep = 0;
  renderOnboardStep();
}

function renderOnboardStep() {
  const existing = document.getElementById('onboard-overlay');
  if (existing) existing.remove();

  const steps = [
    {
      title: 'Välkommen till ListingWIN!',
      desc: 'Det här är ditt verktyg för att hantera listningar inom dagligvaruhandeln. Vi hjälper dig att hålla koll på aviseringsfönster, lanseringar och kontakter mot kedjorna. Låt oss sätta upp ditt konto på 3 enkla steg.',
      content: '',
      next: 'Kom igång →'
    },
    {
      title: 'Vilket varumärke representerar du?',
      desc: 'Börja med att lägga in ditt första varumärke. Du kan alltid lägga till fler senare.',
      content: `<input class="onboard-input" id="ob-brand" placeholder="T.ex. Löfbergs, Paulúns, Oatly..." value="${onboardData.brandName}" oninput="onboardData.brandName=this.value">`,
      next: 'Nästa →'
    },
    {
      title: 'Vilka kedjor jobbar du mot?',
      desc: 'Välj de kedjor du aktivt jobbar med. Aviseringsfönster visas bara för valda kedjor.',
      content: `<div class="onboard-chain-picks">
        <button class="onboard-chain-pick ${onboardData.chains.includes('coop')?'picked-coop':''}" onclick="toggleOnboardChain('coop',this)">Coop</button>
        <button class="onboard-chain-pick ${onboardData.chains.includes('ica')?'picked-ica':''}" onclick="toggleOnboardChain('ica',this)">ICA</button>
        <button class="onboard-chain-pick ${onboardData.chains.includes('dagab')?'picked-dagab':''}" onclick="toggleOnboardChain('dagab',this)">Dagab</button>
      </div>`,
      next: 'Avsluta setup →'
    }
  ];

  const s = steps[onboardStep];
  const pct = ((onboardStep) / steps.length) * 100;

  const div = document.createElement('div');
  div.className = 'onboard-overlay';
  div.id = 'onboard-overlay';
  div.innerHTML = `
    <div class="onboard-box">
      <div class="onboard-progress"><div class="onboard-progress-fill" style="width:${pct}%"></div></div>
      <div class="onboard-body">
        <div class="onboard-step-label">Steg ${onboardStep+1} av ${steps.length}</div>
        <div class="onboard-title">${s.title}</div>
        <div class="onboard-desc">${s.desc}</div>
        ${s.content}
      </div>
      <div class="onboard-btns">
        <span class="onboard-skip" onclick="skipOnboarding()">Hoppa över</span>
        <button class="onboard-next" onclick="nextOnboardStep()">${s.next}</button>
      </div>
    </div>`;
  document.body.appendChild(div);
}

function toggleOnboardChain(chain, btn) {
  const idx = onboardData.chains.indexOf(chain);
  if (idx >= 0) {
    onboardData.chains.splice(idx, 1);
    btn.className = 'onboard-chain-pick';
  } else {
    onboardData.chains.push(chain);
    btn.className = `onboard-chain-pick picked-${chain}`;
  }
}

async function nextOnboardStep() {
  if (onboardStep === 1) {
    const name = document.getElementById('ob-brand')?.value.trim();
    if (name) onboardData.brandName = name;
  }
  onboardStep++;
  if (onboardStep >= 3) {
    await finishOnboarding();
    return;
  }
  renderOnboardStep();
}

async function finishOnboarding() {
  sessionStorage.setItem(ONBOARD_KEY, '1');
  document.getElementById('onboard-overlay')?.remove();

  // Skapa varumärke om angivet
  if (onboardData.brandName && currentWorkspaceId) {
    await createProject(onboardData.brandName, '#a78bfa');
    renderAll();
  }

  // Aktivera valda kedjor
  if (onboardData.chains.length > 0) {
    state.active.coop = onboardData.chains.includes('coop');
    state.active.ica = onboardData.chains.includes('ica');
    state.active.dagab = onboardData.chains.includes('dagab');
    renderAll();
  }

  addActivity('', 'Välkommen! Ditt konto är nu satt upp.');
}

function skipOnboarding() {
  sessionStorage.setItem(ONBOARD_KEY, '1');
  document.getElementById('onboard-overlay')?.remove();
}

// ── 2. STATUSDASHBOARD WIDGETS ──
function renderDashWidgets() {
  const el = document.getElementById('dash-widgets-area');
  if (!el || state.tab !== 'overview') { if(el) el.innerHTML=''; return; }

  const urgentRounds = visibleRounds().filter(r => { const d = daysLeft(r.launchDate); return d >= 0 && d <= 21; });
  const activeLanseringar = lanseringar.length;
  const openTasks = lanseringar.reduce((n, l) => n + (l.tasks||[]).filter(t => t.status !== 'Klar').length, 0);
  const unchecked = lanseringar.reduce((n, l) => {
    const checks = l.checklist || {};
    return n + CHECKLIST_ITEMS.filter(i => !checks[i.id]).length * (activeLanseringar > 0 ? 1/activeLanseringar : 0);
  }, 0);
  const nextWindow = visibleRounds().filter(r => daysLeft(r.launchDate) > 0).sort((a,b) => daysLeft(a.launchDate)-daysLeft(b.launchDate))[0];

  el.innerHTML = `<div class="dash-widgets">
    <div class="dash-widget" onclick="showTab('lansering')">
      <div class="dash-widget-value" style="color:#f59e0b">${activeLanseringar}</div>
      <div class="dash-widget-label">Aktiva lanseringar</div>
      <div class="dash-widget-sub">Klicka för att hantera →</div>
    </div>
    <div class="dash-widget" onclick="showTab('overview')">
      <div class="dash-widget-value" style="color:${urgentRounds.length>0?'#E3000B':'#00AB46'}">${urgentRounds.length}</div>
      <div class="dash-widget-label">Fönster inom 21 dagar</div>
      <div class="dash-widget-sub">${nextWindow ? `Nästa: ${nextWindow.name}` : 'Inga akuta fönster'}</div>
    </div>
    <div class="dash-widget" onclick="showTab('lansering')">
      <div class="dash-widget-value" style="color:${openTasks>0?'#0D4F35':'#00AB46'}">${openTasks}</div>
      <div class="dash-widget-label">Öppna uppgifter</div>
      <div class="dash-widget-sub">Ej avklarade projektuppgifter</div>
    </div>
    <div class="dash-widget" onclick="showTab('brands')">
      <div class="dash-widget-value" style="color:#a78bfa">${brands.length}</div>
      <div class="dash-widget-label">Varumärken</div>
      <div class="dash-widget-sub">${(brands.reduce((n,b) => n+(b.productGroups||[]).reduce((m,g)=>m+(g.articles||[]).length,0),0))} artiklar registrerade</div>
    </div>
  </div>`;
}

// ── 3. KOPPLING LANSERING ↔ AVISERINGSFÖNSTER + DEADLINERÄKNARE ──
const DEADLINE_STEPS = [
  { name: 'Artikeldata Validoo/Dabas', daysBefore: 42, key: 'validoo' },
  { name: 'Priskalkyl klar',           daysBefore: 35, key: 'priskalkyl' },
  { name: 'Varuprover till kedja',     daysBefore: 28, key: 'varuprover' },
  { name: 'Mötesbokning kedja',        daysBefore: 21, key: 'mote' },
  { name: 'Presentation klar',         daysBefore: 14, key: 'presentation' },
  { name: 'Offert till kedja',         daysBefore: 7,  key: 'offert' },
  { name: 'Lansering',             daysBefore: 0,  key: '__launch__' },
];

const ROUNDS_BY_CHAIN = {
  coop:  () => [...COOP_FOOD_ROUNDS, ...(state.active.coopHemma ? COOP_HEMMA_ROUNDS : [])],
  ica:   () => ICA_ROUNDS,
  dagab: () => DAGAB_ROUNDS,
};

// Hämta nästa relevanta aviseringsfönster för en lansering + kedja
// baserat på produktgruppens kategorikopplingar
function getNextWindowForChain(l, chainId) {
  const brand = brands.find(b => b.id === l.brandId);
  if (!brand) { console.warn('getNextWindowForChain: brand not found', l.brandId); return null; }
  const groups = getOrInitGroups(brand);
  const group = groups[l.groupIndex];
  if (!group) { console.warn('getNextWindowForChain: group not found', l.groupIndex, groups.length); return null; }

  const cats = (group.cats || []).filter(c => c.source === chainId);
  if (cats.length === 0) { console.warn('getNextWindowForChain: no cats for chain', chainId, group.cats); return null; }

  const rounds = (ROUNDS_BY_CHAIN[chainId] || (() => []))();
  const catDefs = cats.map(c => CATEGORIES.find(cd => cd.name === c.catName && cd.source === chainId)).filter(Boolean);
  if (catDefs.length === 0) { console.warn('getNextWindowForChain: no catDefs matched', cats); return null; }
  const validWindows = [...new Set(catDefs.flatMap(cd => cd.windows))];
  console.log('getNextWindowForChain: validWindows', validWindows, 'chainId', chainId);
  const matchingRounds = rounds.filter(r => validWindows.includes(r.launch));
  matchingRounds.forEach(r => {
    const av = r.steps?.find(s => s.primary);
    console.log('  round v.' + r.launch + ' avStep.days=', av?.days, 'date=', av?.date?.toISOString?.());
  });

  const validRounds = rounds.filter(r => validWindows.includes(r.launch));

  // Försök hitta nästa kommande runda (aviseringen ej passerad)
  const upcoming = validRounds
    .filter(r => {
      const avStep = r.steps?.find(s => s.primary);
      return avStep ? daysLeft(avStep.date) >= 0 : daysLeft(r.launchDate) >= 0;
    })
    .sort((a, b) => {
      const avA = a.steps?.find(s => s.primary)?.days ?? 9999;
      const avB = b.steps?.find(s => s.primary)?.days ?? 9999;
      return avA - avB;
    });

  if (upcoming[0]) return upcoming[0];

  // Fallback: visa den senaste passerade rundan
  const past = validRounds
    .filter(r => daysLeft(r.launchDate) < 0)
    .sort((a, b) => daysLeft(b.launchDate) - daysLeft(a.launchDate));

  return past[0] || validRounds[0] || null;
}

// Bygg deadlines bakåt från ett lanseringsdatum
function buildDeadlineSteps(launchDateStr, custChecklist) {
  const launch = new Date(launchDateStr);
  return DEADLINE_STEPS.map(s => {
    const deadline = new Date(launch);
    deadline.setDate(deadline.getDate() - s.daysBefore);
    const daysUntil = Math.round((deadline - new Date()) / 86400000);
    const done = custChecklist && custChecklist[s.key];
    return { ...s, deadline: deadline.toLocaleDateString('sv-SE'), daysUntil, done };
  });
}

// Sammanfattningsbanner högst upp i kundtabb
function renderChainDeadlineBanner(l, chainId) {
  const win = getNextWindowForChain(l, chainId);
  if (!win) return `<div style="padding:10px 0;font-size:11px;color:var(--muted)">Ingen kategori kopplad till ${CHAIN_LABELS[chainId]||chainId} — lägg till kategori på produktgruppen.</div>`;

  const avStep = win.steps?.find(s => s.primary);
  const avWeek = avStep ? `v.${avStep.week}` : '—';
  const dToAv = avStep ? Math.round((isoWeekToDate(avStep.week) - new Date()) / 86400000) : null;
  const urgency = dToAv !== null && dToAv <= 14 ? '#E3000B' : dToAv !== null && dToAv <= 42 ? '#f59e0b' : '#00AB46';
  const dToAvStr = dToAv === null ? '' : dToAv > 0 ? `${dToAv}d kvar` : dToAv === 0 ? 'Idag' : `${Math.abs(dToAv)}d sedan`;

  return `<div style="display:flex;gap:20px;align-items:center;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin-bottom:16px">
    <div>
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Avisering</div>
      <div style="font-size:16px;font-weight:700;color:#f59e0b">${avWeek}</div>
    </div>
    <div style="width:1px;height:36px;background:var(--border)"></div>
    <div>
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Lansering</div>
      <div style="font-size:16px;font-weight:700;color:var(--text)">v.${win.launch}</div>
    </div>
    <div style="width:1px;height:36px;background:var(--border)"></div>
    <div style="font-size:13px;color:${urgency};font-weight:600">${dToAvStr}</div>
  </div>`;
}

function getLanseringDeadlines(l) {
  // Legacy — används ej längre, behålls för bakåtkompatibilitet
  if (!l.launchDate) return [];
  return buildDeadlineSteps(l.launchDate, l.checklist);
}

function renderDeadlineTimeline(l, chainId, custChecklist) {
  const win = chainId ? getNextWindowForChain(l, chainId) : null;
  if (!win) {
    return `<div style="color:var(--muted);font-size:11px;padding:8px 0">Ingen matchande kategori hittad — koppla en kategori till produktgruppen för att se deadlines.</div>`;
  }

  const checks = custChecklist || {};
  const stepsHtml = win.steps.map(s => {
    const d = daysLeft(s.date);
    const done = checks[s.key];
    const cls = done ? 'done' : d < 0 ? 'late' : d <= 7 ? 'due' : 'future';
    const dateStr = d === 0 ? 'Idag' : d > 0 ? `${d}d kvar` : `${Math.abs(d)}d sedan`;
    const dateLabel = s.date.toLocaleDateString('sv-SE', { day:'numeric', month:'short' });
    return `<div class="dl-step">
      <div class="dl-dot ${cls}"></div>
      <div class="dl-step-body">
        <div class="dl-step-name ${done?'done-text':''}">${s.label}</div>
        <div class="dl-step-date">${dateLabel} · <span style="color:${cls==='late'?'#E3000B':cls==='due'?'#f59e0b':cls==='done'?'#00AB46':'var(--muted)'}">${dateStr}</span></div>
      </div>
    </div>`;
  }).join('');

  return `<div class="deadline-timeline">${stepsHtml}</div>`;
}

// ── 4. NOTERINGAR PER AVISERINGSFÖNSTER ──
const windowNotes = {};

function getWindowNoteKey(roundName, source) { return `note_${source}_${roundName.replace(/\s/g,'_')}`; }

function renderWindowNote(roundName, source) {
  const key = getWindowNoteKey(roundName, source);
  const note = windowNotes[key] || '';
  const noteId = `wn-${key}`;
  const panelId = `wnp-${key}`;
  return `<div style="margin-top:6px">
    <button class="window-note-btn" onclick="toggleWindowNote('${panelId}')">${note ? 'Redigera notering' : 'Lägg till notering'}</button>
    <div class="window-note-panel" id="${panelId}" style="display:${note?'block':'none'}">
      <textarea class="window-note-textarea" id="${noteId}" placeholder="Anteckna vad du vet om det här fönstret..." onblur="saveWindowNote('${key}','${noteId}')">${note}</textarea>
      ${note ? `<div style="font-size:10px;color:var(--muted);margin-top:4px">Sparas automatiskt</div>` : ''}
    </div>
  </div>`;
}

function toggleWindowNote(panelId) {
  const p = document.getElementById(panelId);
  if (p) { p.style.display = p.style.display === 'none' ? 'block' : 'none'; }
}

function saveWindowNote(key, textareaId) {
  const val = document.getElementById(textareaId)?.value || '';
  windowNotes[key] = val;
  try { sessionStorage.setItem('lw_window_notes', JSON.stringify(windowNotes)); } catch(e) {}
}

function loadWindowNotes() {
  try {
    const raw = sessionStorage.getItem('lw_window_notes');
    if (raw) Object.assign(windowNotes, JSON.parse(raw));
  } catch(e) {}
}

// ── 5. MÖTESKALENDER / AGENDA ──
let agendaItems = [];

function loadAgenda() {
  try {
    const raw = sessionStorage.getItem('lw_agenda');
    agendaItems = raw ? JSON.parse(raw) : [];
  } catch(e) { agendaItems = []; }
}

function saveAgenda() {
  try { sessionStorage.setItem('lw_agenda', JSON.stringify(agendaItems)); } catch(e) {}
}

function renderAgenda() {
  const el = document.getElementById('agenda-content');
  if (!el) return;

  // Merge agenda items with lansering deadlines and avisering windows
  const allItems = [...agendaItems];

  // Add avisering windows as items
  visibleRounds().filter(r => daysLeft(r.launchDate) >= -7 && daysLeft(r.launchDate) <= 90).forEach(r => {
    allItems.push({
      id: `win_${r.source}_${r.launchDate}`,
      date: r.launchDate,
      title: r.name,
      sub: `Aviseringsfönster · ${r.source === 'coop' ? 'Coop' : r.source === 'ica' ? 'ICA' : 'Dagab'}`,
      color: r.source === 'coop' ? '#00AB46' : r.source === 'ica' ? '#E3000B' : '#0D4F35',
      type: 'window',
      readonly: true
    });
  });

  // Add lansering deadlines
  lanseringar.filter(l => l.launchDate).forEach(l => {
    getLanseringDeadlines(l).forEach(s => {
      if (!s.done && s.daysUntil >= -7 && s.daysUntil <= 90) {
        allItems.push({
          id: `dl_${l.id}_${s.key}`,
          date: s.deadline,
          title: s.name,
          sub: `${l.name}`,
          color: '#f59e0b',
          type: 'deadline',
          readonly: true
        });
      }
    });
  });

  allItems.sort((a,b) => new Date(a.date) - new Date(b.date));

  // Group by week
  const weeks = {};
  allItems.forEach(item => {
    const d = new Date(item.date);
    const weekNum = isoWeek(d);
    const yr = d.getFullYear();
    const key = `${yr}-${weekNum}`;
    if (!weeks[key]) weeks[key] = { label: `Vecka ${weekNum}, ${yr}`, items: [] };
    weeks[key].items.push(item);
  });

  const weeksHtml = Object.values(weeks).map(w => `
    <div class="agenda-week">
      <div class="agenda-week-title">${w.label}</div>
      ${w.items.map(item => `
        <div class="agenda-item">
          <div class="agenda-item-date">${item.date}</div>
          <div class="agenda-item-dot" style="background:${item.color}"></div>
          <div class="agenda-item-body">
            <div class="agenda-item-title">${item.title}</div>
            <div class="agenda-item-sub">${item.sub || ''}</div>
          </div>
          ${!item.readonly ? `<button onclick="deleteAgendaItem('${item.id}')" style="background:none;border:none;color:rgba(255,255,255,0.2);cursor:pointer;font-size:13px">×</button>` : ''}
        </div>`).join('')}
    </div>`).join('');

  el.innerHTML = `<div class="agenda-page">
    <div style="font-family:var(--display);font-size:22px;font-weight:700;margin-bottom:4px">Agenda & Möten</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:20px">Alla deadlines, aviseringsfönster och egna möten samlat</div>

    <div class="agenda-add-form">
      <input class="agenda-input" id="ag-title" placeholder="Möte / händelse..." style="grid-column:1/-1">
      <input class="agenda-input" id="ag-date" type="date" value="${new Date().toISOString().slice(0,10)}">
      <input class="agenda-input" id="ag-sub" placeholder="Anteckning (valfritt)">
      <button class="inline-btn" onclick="addAgendaItem()" style="grid-column:1/-1">+ Lägg till</button>
    </div>

    ${Object.keys(weeks).length > 0 ? weeksHtml : '<div style="color:var(--muted);font-size:13px;padding:20px 0">Inga kommande händelser — lanseringsfönster och deadlines dyker upp här automatiskt</div>'}
  </div>`;
}

function addAgendaItem() {
  const title = document.getElementById('ag-title')?.value.trim();
  const date = document.getElementById('ag-date')?.value;
  const sub = document.getElementById('ag-sub')?.value.trim();
  if (!title || !date) return;
  agendaItems.push({ id: uid(), date, title, sub, color: '#a78bfa', type: 'custom', readonly: false });
  saveAgenda();
  addActivity('', `Agendahändelse tillagd: ${title}`);
  renderAgenda();
}

function deleteAgendaItem(id) {
  const item = agendaItems.find(i => i.id === id);
  agendaItems = agendaItems.filter(i => i.id !== id);
  saveAgenda();
  addActivity('', `Agendahändelse "${item?.title || 'Okänd'}" borttagen`);
  renderAgenda();
}

// ── 6. IN-APP NOTIFIKATIONER ──
let notifications = [];
let notifPanelOpen = false;

function addNotif(text, type = 'info') {
  const n = { id: uid(), text, type, time: new Date(), read: false };
  notifications.unshift(n);
  if (notifications.length > 50) notifications.pop();
  updateNotifBadge();
}

function updateNotifBadge() {
  const unread = notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = unread > 9 ? '9+' : unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
  }
}

function toggleNotifPanel() {
  notifPanelOpen = !notifPanelOpen;
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  if (notifPanelOpen) {
    renderNotifPanel();
    panel.style.display = 'block';
    // Mark all as read after 1.5s
    setTimeout(() => {
      notifications.forEach(n => n.read = true);
      updateNotifBadge();
    }, 1500);
  } else {
    panel.style.display = 'none';
  }
}

function renderNotifPanel() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  const items = notifications.length === 0
    ? '<div class="notif-empty">Inga notifieringar</div>'
    : notifications.map(n => `
        <div class="notif-item ${n.read?'':'unread'}">
          <div class="notif-item-dot ${n.read?'read':''}"></div>
          <div class="notif-item-text">
            ${n.text}
            <div class="notif-item-time">${n.time.toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'})}</div>
          </div>
        </div>`).join('');

  panel.innerHTML = `
    <div class="notif-panel-header">
      <span class="notif-panel-title">Notifieringar</span>
      <span class="notif-panel-clear" onclick="clearNotifs()">Rensa alla</span>
    </div>
    <div class="notif-list">${items}</div>`;
}

function clearNotifs() {
  notifications = [];
  updateNotifBadge();
  renderNotifPanel();
}

// Check for urgent rounds and generate notifs
function checkAndGenerateNotifs() {
  const urgent = visibleRounds().filter(r => { const d = daysLeft(r.launchDate); return d >= 0 && d <= 14; });
  urgent.forEach(r => {
    const d = daysLeft(r.launchDate);
    const src = r.source === 'coop' ? 'Coop' : r.source === 'ica' ? 'ICA' : 'Dagab';
    if (d <= 7) addNotif(`KRITISKT: ${r.name} (${src}) lanserar om ${d} dagar!`, 'urgent');
    else addNotif(`${r.name} (${src}) lanserar om ${d} dagar`, 'info');
  });

  lanseringar.forEach(l => {
    if (!l.launchDate) return;
    const d = Math.round((new Date(l.launchDate) - new Date()) / 86400000);
    if (d >= 0 && d <= 14) addNotif(`Lansering "${l.name}" om ${d} dagar`, 'lansering');
  });
}

// Close notif panel on outside click
document.addEventListener('click', (e) => {
  if (notifPanelOpen && !e.target.closest('#notif-bell') && !e.target.closest('#notif-panel')) {
    notifPanelOpen = false;
    const panel = document.getElementById('notif-panel');
    if (panel) panel.style.display = 'none';
  }
});

// ── 7. AKTIVITETSLOGG ──
let activityLog = [];

function addActivity(emoji, text) {
  activityLog.unshift({ icon: emoji, text, time: new Date(), user_email: currentUser?.email });
  if (activityLog.length > 100) activityLog.pop();
  if (currentWorkspaceId && currentUser) {
    const row = {
      workspace_id: String(currentWorkspaceId),
      user_id: String(currentUser.id),
      user_email: currentUser.email,
      emoji,
      action: text
    };
    console.log('addActivity INSERT body:', row);
    supabaseClient.from('activity_log').insert(row).then(({ error }) => {
      if (error) console.error('addActivity INSERT failed:', error.message, row);
      else console.log('addActivity INSERT ok:', emoji, text);
    });
  } else {
    console.warn('addActivity skipped — missing workspace_id or user:', { currentWorkspaceId, userId: currentUser?.id });
  }
}

async function loadActivityLog() {
  if (!currentWorkspaceId) return;
  const { data } = await supabaseClient
    .from('activity_log')
    .select('emoji, action, user_email, created_at')
    .eq('workspace_id', currentWorkspaceId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (data) {
    activityLog = data.map(r => ({
      icon: r.emoji || '•',
      text: r.action,
      time: new Date(r.created_at),
      user_email: r.user_email
    }));
    if (state.tab === 'aktivitetslogg') renderAktivitetslogg();
  }
}

function subscribeActivityLog() {
  if (!currentWorkspaceId) return;
  supabaseClient
    .channel('activity_log_realtime')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'activity_log',
      filter: `workspace_id=eq.${currentWorkspaceId}`
    }, payload => {
      const r = payload.new;
      // Avoid duplicate if this client just inserted it
      if (!activityLog.some(a => a.time.toISOString() === r.created_at && a.text === r.action)) {
        activityLog.unshift({ icon: r.emoji || '•', text: r.action, time: new Date(r.created_at), user_email: r.user_email });
        if (activityLog.length > 100) activityLog.pop();
      }
      if (state.tab === 'aktivitetslogg') renderAktivitetslogg();
    })
    .subscribe();
}

function formatActivityTime(date) {
  const d = date.toLocaleDateString('sv-SE');
  const t = date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  return `${d} ${t}`;
}

function renderAktivitetslogg() {
  const el = document.getElementById('aktivitetslogg-content');
  if (!el) return;
  if (activityLog.length === 0) {
    el.innerHTML = '<div style="padding:60px 20px;color:var(--muted);font-size:13px;text-align:center;">Ingen aktivitet ännu</div>';
    return;
  }
  el.innerHTML = `<div style="padding:20px;max-width:680px;">
    <div style="font-family:var(--display);font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;opacity:0.45;margin-bottom:16px;">Aktivitetslogg</div>
    <div class="activity-feed">
      ${activityLog.map(a => `
        <div class="activity-item">
          <div class="activity-icon">${a.icon || '•'}</div>
          <div class="activity-body">
            <div>${a.text}</div>
            ${a.user_email ? `<div style="font-size:11px;opacity:0.4;margin-top:2px;">${a.user_email}</div>` : ''}
          </div>
          <div class="activity-time">${formatActivityTime(a.time)}</div>
        </div>`).join('')}
    </div>
  </div>`;
}

// ── 8. KOMMENTARER PER LANSERING ──
function renderComments(lid) {
  const l = getLansering(lid);
  if (!l) return '';
  const comments = l.comments || [];
  const initials = (email) => email ? email.slice(0,2).toUpperCase() : '??';
  const userEmail = currentUser?.email || 'du';

  const commentsHtml = comments.map((c,i) => `
    <div class="comment-item">
      <div class="comment-avatar">${initials(c.author)}</div>
      <div class="comment-body">
        <div class="comment-meta">${c.author} · ${c.date}</div>
        <div class="comment-text">${c.text}</div>
      </div>
      ${c.author === userEmail ? `<button onclick="deleteComment('${lid}',${i})" style="background:none;border:none;color:rgba(255,255,255,0.2);cursor:pointer;font-size:12px;align-self:flex-start">×</button>` : ''}
    </div>`).join('');

  return `<div class="comments-section">
    <div style="font-family:var(--display);font-size:11px;font-weight:700;letter-spacing:1px;color:var(--muted);text-transform:uppercase;margin-bottom:10px">Kommentarer</div>
    ${commentsHtml || '<div style="color:var(--muted);font-size:12px;padding:4px 0">Inga kommentarer ännu</div>'}
    <div class="comment-input-row">
      <textarea class="comment-textarea" id="comment-input-${lid}" placeholder="Skriv en kommentar..." rows="2"></textarea>
      <button class="inline-btn" onclick="addComment('${lid}')" style="align-self:flex-end">Skicka</button>
    </div>
  </div>`;
}

function addComment(lid) {
  const l = getLansering(lid);
  if (!l) return;
  const text = document.getElementById(`comment-input-${lid}`)?.value.trim();
  if (!text) return;
  if (!l.comments) l.comments = [];
  l.comments.push({ author: currentUser?.email || 'du', date: new Date().toLocaleDateString('sv-SE'), text });
  saveLansering(lid);
  addActivity('', `Kommentar tillagd på "${l.name}"`);
  renderLansering();
}

function deleteComment(lid, idx) {
  const l = getLansering(lid);
  if (!l?.comments) return;
  l.comments.splice(idx, 1);
  saveLansering(lid);
  addActivity('', `Kommentar borttagen från "${l.name}"`);
  renderLansering();
}

// ── 9. GLOBAL SÖKNING ──
let searchPanelVisible = false;

function showSearchPanel() {
  searchPanelVisible = true;
  renderGlobalSearch(document.getElementById('global-search')?.value || '');
}

function hideSearchPanel() {
  searchPanelVisible = false;
  const panel = document.getElementById('search-panel');
  if (panel) panel.style.display = 'none';
}

function renderGlobalSearch(q) {
  const panel = document.getElementById('search-panel');
  if (!panel || !searchPanelVisible) return;
  q = (q || '').toLowerCase().trim();

  const results = [];

  if (q.length < 1) { panel.style.display = 'none'; return; }

  // Search brands
  brands.forEach(b => {
    if (b.name.toLowerCase().includes(q)) {
      results.push({ icon: '◈', label: b.name, sub: `${(b.productGroups||[]).length} produktgrupper`, type: 'Varumärke', action: () => { showTab('brands'); /* select brand */ selectedBrandId = b.id; renderBrands(); } });
    }
    // Search products
    (b.productGroups||[]).forEach(g => {
      if (g.name.toLowerCase().includes(q)) {
        results.push({ icon: '·', label: g.name, sub: `Varumärke: ${b.name}`, type: 'Produktgrupp', action: () => { showTab('brands'); selectedBrandId = b.id; renderBrands(); } });
      }
    });
    // Search articles
    (b.productGroups||[]).forEach(g => {
      (g.articles||[]).forEach(a => {
        if (a.name.toLowerCase().includes(q) || (a.ean||'').includes(q)) {
          results.push({ icon: '·', label: a.name, sub: `${b.name} → ${g.name}${a.ean?' · EAN: '+a.ean:''}`, type: 'Artikel', action: () => { showTab('brands'); selectedBrandId = b.id; renderBrands(); } });
        }
      });
    });
  });

  // Search lanseringar
  lanseringar.forEach(l => {
    if (l.name.toLowerCase().includes(q)) {
      results.push({ icon: '▸', label: l.name, sub: l.launchDate ? `Lansering: ${l.launchDate}` : 'Lansering', type: 'Lansering', action: () => { showTab('lansering'); selectedLanseringId = l.id; renderLansering(); } });
    }
    // Search contact log
    (l.contactLog||[]).forEach(e => {
      if (e.note.toLowerCase().includes(q) || (e.contact||'').toLowerCase().includes(q)) {
        results.push({ icon: '·', label: `${e.chainLabel||e.chain}: ${e.note.slice(0,50)}`, sub: `Kontaktlogg · ${l.name}`, type: 'Logg', action: () => { showTab('lansering'); selectedLanseringId = l.id; renderLansering(); } });
      }
    });
  });

  // Search avisering windows
  allRounds().forEach(r => {
    if (r.name.toLowerCase().includes(q)) {
      const src = r.source === 'coop' ? 'Coop' : r.source === 'ica' ? 'ICA' : 'Dagab';
      results.push({ icon: '·', label: r.name, sub: `${src} · ${r.launchDate}`, type: 'Fönster', action: () => showTab('overview') });
    }
  });

  if (results.length === 0) {
    panel.style.display = 'block';
    panel.innerHTML = `<div class="search-empty">Inga resultat för "${q}"</div>`;
    return;
  }

  panel.style.display = 'block';
  panel.innerHTML = results.slice(0,8).map(r => `
    <div class="search-result-item" onmousedown="${r.action.toString().replace(/"/g,"'")}">
      <div class="search-result-icon">${r.icon}</div>
      <div class="search-result-label">
        ${r.label}
        <div class="search-result-sub">${r.sub}</div>
      </div>
      <span class="search-result-type">${r.type}</span>
    </div>`).join('');

  // Rewrite onclick since we can't use closures in innerHTML
  panel.querySelectorAll('.search-result-item').forEach((el, i) => {
    el.onclick = results[i].action;
  });
}

// ── 10. MOBILSNABBVY ──
function renderMobileQuick() {
  // Rendered directly in renderOverview for mobile
  const urgentLanseringar = lanseringar.filter(l => {
    if (!l.launchDate) return false;
    const d = Math.round((new Date(l.launchDate) - new Date()) / 86400000);
    return d >= 0 && d <= 30;
  });

  const openChecks = lanseringar.flatMap(l =>
    CHECKLIST_ITEMS.filter(i => !(l.checklist||{})[i.id]).map(i => ({ ...i, lanseringName: l.name, lid: l.id }))
  ).slice(0, 5);

  if (urgentLanseringar.length === 0 && openChecks.length === 0) return '';

  return `<div class="mobile-quick" style="padding:12px 16px 0">
    ${urgentLanseringar.length > 0 ? `
      <div class="mq-card">
        <div class="mq-card-title">Kommande lanseringar</div>
        ${urgentLanseringar.map(l => {
          const d = Math.round((new Date(l.launchDate) - new Date()) / 86400000);
          return `<div class="mq-check">
            <span style="flex:1">${l.name}</span>
            <span style="font-size:11px;color:#f59e0b">${d}d kvar</span>
          </div>`;
        }).join('')}
      </div>` : ''}
    ${openChecks.length > 0 ? `
      <div class="mq-card">
        <div class="mq-card-title">Att göra</div>
        ${openChecks.map(c => `
          <div class="mq-check">
            <input type="checkbox" onchange="toggleCheckItem('${c.lid}','${c.id}',this.checked)">
            <span style="flex:1">${c.label}</span>
            <span style="font-size:10px;color:var(--muted)">${c.lanseringName}</span>
          </div>`).join('')}
      </div>` : ''}
  </div>`;
}



// ── VARUMÄRKE ↔ LANSERING KOPPLING ──
function renderBrandLanseringar(brand) {
  const linked = lanseringar.filter(l => l.brandId === brand.id);
  const chainColors = { coop: '#00AB46', ica: '#E3000B', dagab: '#0D4F35', multi: '#a78bfa' };
  const chainLabels = { coop: 'Coop', ica: 'ICA', dagab: 'Dagab', multi: 'Flera kedjor' };

  if (linked.length === 0) {
    return `<div class="section-title" style="margin-bottom:10px">LANSERINGAR</div>
      <div style="color:var(--muted);font-size:12px;padding:8px 0">
        Inga lanseringar kopplade till detta varumärke.
        <button class="inline-btn" style="margin-left:10px" onclick="openLanseringModalForBrand('${brand.id}')">+ Skapa lansering</button>
      </div>`;
  }

  const items = linked.map(l => {
    const pct = getLanseringProgress(l);
    const daysToLaunch = l.launchDate ? Math.round((new Date(l.launchDate) - new Date()) / 86400000) : null;
    const color = chainColors[l.chain] || '#a78bfa';
    const chainLabel = chainLabels[l.chain] || l.chain || '—';
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:7px;cursor:pointer;margin-bottom:6px" onclick="showTab('lansering');selectedLanseringId='${l.id}';renderLansering()">
      <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span>
      <span style="flex:1;font-size:12px;font-weight:500">${l.name}</span>
      <span style="font-size:10px;color:${color}">${chainLabel}</span>
      ${daysToLaunch !== null ? `<span style="font-size:10px;color:var(--muted)">${daysToLaunch >= 0 ? daysToLaunch+'d kvar' : 'Passerad'}</span>` : ''}
      <div style="width:60px;background:var(--surface);border-radius:10px;height:4px;overflow:hidden"><div style="width:${pct}%;height:100%;background:#f59e0b;border-radius:10px"></div></div>
      <span style="font-size:10px;color:var(--muted)">${pct}%</span>
    </div>`;
  }).join('');

  return `<div class="section-title" style="margin-bottom:10px">LANSERINGAR (${linked.length})</div>
    ${items}
    <button class="inline-btn" style="margin-top:4px" onclick="openLanseringModalForBrand('${brand.id}')">+ Ny lansering</button>`;
}

function openLanseringModalForBrand(brandId) {
  openLanseringWizard(brandId);
}



// ─── PRODUKTGRUPPER (ny struktur) ───
function renderProductGroups(brand) {
  const groups = brand.productGroups || [];

  const groupsHtml = groups.map((g, gi) => {
    const articles = g.articles || [];
    const cats = g.cats || [];

    // Kategori-chips
    const catChips = cats.map(c => {
      const srcLabel = c.source === 'coop' ? 'Coop' : c.source === 'ica' ? 'ICA' : 'Dagab';
      return `<span class="pcat-chip" title="Klicka för att ta bort"
        onclick="removeCatFromGroup('${brand.id}',${gi},'${c.catName.replace(/'/g,"\'")}','${c.source}')">
        ${c.catName} <span style="opacity:0.5;font-size:9px">${srcLabel}</span> ×
      </span>`;
    }).join('');

    // Artikel-rader
    const articleRows = articles.map((a, ai) => `
      <div class="article-row">
        <span class="article-row-name">${a.name}</span>
        ${a.ean ? `<span class="article-row-ean">EAN: ${a.ean}</span>` : ''}
        <button class="article-delete-btn" onclick="deleteArticle('${brand.id}',${gi},${ai})">×</button>
      </div>`).join('');

    const bodyId = `pgb-${brand.id}-${gi}`;
    const toggleId = `pgt-${brand.id}-${gi}`;

    return `<div class="product-group">
      <div class="product-group-header" onclick="toggleGroup('${brand.id}',${gi})">
        <span class="product-group-name">${g.name}</span>
        <span style="font-size:10px;color:var(--muted)">${articles.length} artikel${articles.length!==1?'ar':''}</span>
        <span style="font-size:10px;color:var(--muted);margin-left:4px">${cats.length} kat.</span>
        <span class="product-group-toggle" id="${toggleId}">▸</span>
        <button onclick="event.stopPropagation();deleteGroup('${brand.id}',${gi})"
          style="background:none;border:none;color:rgba(255,255,255,0.2);cursor:pointer;font-size:13px;padding:0 2px">×</button>
      </div>
      <div class="product-group-body" id="${bodyId}" style="display:none">

        <div style="margin-bottom:10px">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Kategorikopplingar</div>
          <div class="product-cat-chips" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">
            ${catChips || '<span style="color:var(--muted);font-size:11px">Inga kategorier kopplade</span>'}
          </div>
          <button class="product-add-cat-btn" onclick="openCatModalForGroup('${brand.id}',${gi})">+ Koppla kategori</button>
        </div>

        <div style="margin-top:12px">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Artiklar</div>
          <div class="article-list">${articleRows || '<div style="color:var(--muted);font-size:11px;padding:4px 0">Inga artiklar ännu</div>'}</div>
          <div class="article-add-row" style="margin-top:6px">
            <input class="article-input" id="art-name-${brand.id}-${gi}" placeholder="Artikelnamn..." style="flex:2;min-width:120px">
            <input class="article-input" id="art-ean-${brand.id}-${gi}" placeholder="EAN (valfritt)" style="width:130px">
            <button class="inline-btn" onclick="addArticle('${brand.id}',${gi})">+ Artikel</button>
          </div>
        </div>

      </div>
    </div>`;
  }).join('');

  return `<div>
    <div class="section-title" style="margin-bottom:10px">PRODUKTGRUPPER</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:12px">Varje produktgrupp kan ha kategorikopplingar mot kedjor och enskilda artiklar</div>
    ${groupsHtml || '<div style="color:var(--muted);font-size:12px;padding:8px 0">Inga produktgrupper ännu — lägg till en nedan</div>'}
    <div class="group-add-row" style="margin-top:10px">
      <input class="inline-input" id="new-group-input-${brand.id}"
        placeholder="Ny produktgrupp (t.ex. Müsli, Yoghurt, Snacks)..."
        onkeydown="if(event.key==='Enter')addProductGroup('${brand.id}')">
      <button class="inline-btn" onclick="addProductGroup('${brand.id}')">+ Lägg till grupp</button>
    </div>
  </div>`;
}

// Öppna kategorimodal för en produktgrupp
function openCatModalForGroup(brandId, gi) {
  const brand = brands.find(b => b.id === brandId);
  const group = brand?.productGroups?.[gi];
  if (!group) return;
  catModalTarget = { brandId, groupIndex: gi };
  catModalSelected = [...(group.cats || [])];
  document.getElementById('cat-modal-sub').textContent = `Välj kategorier för "${group.name}"`;
  document.getElementById('cat-modal-search').value = '';
  document.getElementById('cat-modal').classList.add('open');
  renderCatModal();
}

// Ta bort kategori från produktgrupp
function removeCatFromGroup(brandId, gi, catName, source) {
  const brand = brands.find(b => b.id === brandId);
  if (!brand?.productGroups?.[gi]) return;
  brand.productGroups[gi].cats = (brand.productGroups[gi].cats || []).filter(
    c => !(c.catName === catName && c.source === source)
  );
  saveProject(brandId);
  renderBrands();
}



// ═══════════════════════════════════════════════
// LANSERING DETAIL MED KUNDTABBAR
// ═══════════════════════════════════════════════


function removeChainTab(lid, chainId) {
  const l = getLansering(lid);
  if (!l) return;
  if (!l.removedChains) l.removedChains = [];
  if (!l.removedChains.includes(chainId)) l.removedChains.push(chainId);
  if (l.activeCustomerTab === chainId) {
    const remaining = getLanseringCustomers(l).filter(c => c.id !== chainId);
    l.activeCustomerTab = remaining[0]?.id || null;
  }
  const chainLabel = { coop: 'Coop', ica: 'ICA', dagab: 'Dagab' }[chainId] || chainId;
  addActivity('', `Kundtabb "${chainLabel}" arkiverad i "${l.name}"`);
  saveLansering(lid);
  renderLansering();
}

function getLanseringCustomers(l) {
  // Kedjor från kategorikopplingar
  const removed = l.removedChains || [];
  const chainTabs = (l.chains || []).filter(c => !removed.includes(c)).map(c => ({
    id: c, label: CHAIN_LABELS[c] || c, color: CHAIN_COLORS[c] || '#a78bfa', type: 'chain'
  }));
  // Fria kunder tillagda manuellt
  const freeTabs = (l.freeCustomers || []).map(c => ({
    id: 'free_' + c.replace(/\s/g,'_'), label: c, color: '#a78bfa', type: 'free'
  }));
  return [...chainTabs, ...freeTabs];
}

function setLanseringTab(lid, tabId) {
  const l = getLansering(lid);
  if (!l) return;
  l.activeCustomerTab = tabId;
  renderLansering();
}

function addFreeCustomer(lid) {
  const input = document.getElementById(`free-cust-input-${lid}`);
  const name = input?.value.trim();
  if (!name) return;
  const l = getLansering(lid);
  if (!l) return;
  if (!l.freeCustomers) l.freeCustomers = [];
  if (!l.freeCustomers.includes(name)) l.freeCustomers.push(name);
  saveLansering(lid);
  addActivity('', `Kund "${name}" tillagd i "${l.name}"`);
  renderLansering();
}

function removeFreeCustomer(lid, name) {
  const l = getLansering(lid);
  if (!l) return;
  l.freeCustomers = (l.freeCustomers || []).filter(c => c !== name);
  if (l.activeCustomerTab === 'free_' + name.replace(/\s/g,'_')) {
    l.activeCustomerTab = (l.chains || [])[0] || null;
  }
  saveLansering(lid);
  addActivity('', `Kund "${name}" borttagen från "${l.name}"`);
  renderLansering();
}

function renderCustomerTabContent(l, tabId) {
  const isChain = !tabId.startsWith('free_');
  const custKey = tabId;
  const custData = (l.customers || {})[custKey] || {};
  const checks = custData.checklist || {};
  const tasks = custData.tasks || [];
  const log = (l.contactLog || []).filter(e => e.customerTab === custKey);
  const allLog = l.contactLog || [];

  const checklistHtml = CHECKLIST_ITEMS.map(item => `
    <div class="check-item ${checks[item.id] ? 'done' : ''}">
      <input type="checkbox" ${checks[item.id] ? 'checked' : ''} 
        onchange="toggleCustomerCheckItem('${l.id}','${custKey}','${item.id}',this.checked)">
      <span class="check-item-label">${item.label}</span>
      ${checks[item.id] ? `<span class="check-item-date">${checks[item.id]}</span>` : ''}
    </div>`).join('');

  const tasksHtml = tasks.map((t, i) => `
    <div class="task-row">
      <input class="task-name-input" value="${t.name||''}" placeholder="Uppgift..."
        onblur="updateCustomerTask('${l.id}','${custKey}',${i},'name',this.value)">
      <input class="task-deadline-input task-deadline" value="${t.deadline||''}" type="date"
        onchange="updateCustomerTask('${l.id}','${custKey}',${i},'deadline',this.value)">
      <select class="task-status-select task-status"
        onchange="updateCustomerTask('${l.id}','${custKey}',${i},'status',this.value)">
        ${TASK_STATUSES.map(s => `<option ${t.status===s?'selected':''}>${s}</option>`).join('')}
      </select>
      <input class="task-owner-input task-owner" value="${t.owner||''}" placeholder="Ansvarig..."
        onblur="updateCustomerTask('${l.id}','${custKey}',${i},'owner',this.value)">
      <button class="task-delete-btn" onclick="deleteCustomerTask('${l.id}','${custKey}',${i})">×</button>
    </div>`).join('');

  const logFiltered = allLog.filter(e => e.customerTab === custKey).slice().reverse();
  const logHtml = logFiltered.map((e, i) => {
    const origIdx = allLog.length - 1 - allLog.slice().reverse().findIndex(x => x === e);
    return `<div class="contact-entry">
      <div class="contact-entry-header">
        <span class="contact-entry-date">${e.date}</span>
        ${e.contact ? `<span style="font-size:10px;color:var(--muted)">${e.contact}</span>` : ''}
        <button onclick="deleteContactEntry('${l.id}',${allLog.indexOf(e)})"
          style="background:none;border:none;color:rgba(255,255,255,0.2);cursor:pointer;font-size:12px;margin-left:auto">×</button>
      </div>
      <div class="contact-entry-text">${e.note}</div>
      ${e.next ? `<div class="contact-entry-next">→ ${e.next}</div>` : ''}
    </div>`;
  }).join('');

  // Deadlines — bara för kedjor
  const chainId = isChain ? tabId : null;
  const deadlineSection = isChain ? `
    <div class="section-block">
      <div class="section-block-title">Deadlines & tidslinje</div>
      ${renderDeadlineTimeline(l, chainId, custData.checklist)}
    </div>` : '';

  const bannerHtml = isChain ? renderChainDeadlineBanner(l, chainId) : '';

  return `
    ${bannerHtml}
    <div class="section-block">
      <div class="section-block-title">Checklista</div>
      <div class="checklist">${checklistHtml}</div>
    </div>

    <div class="section-block">
      <div class="section-block-title">Projektuppgifter</div>
      <div class="custom-tasks">${tasksHtml || '<div style="color:var(--muted);font-size:12px;padding:8px 0">Inga uppgifter ännu</div>'}</div>
      <div class="task-add-row" style="margin-top:8px">
        <button class="inline-btn" onclick="addCustomerTask('${l.id}','${custKey}')">+ Lägg till uppgift</button>
      </div>
    </div>

    <div class="section-block">
      <div class="section-block-title">Kontaktlogg</div>
      <div class="contact-add-form">
        <div class="contact-form-row">
          <input class="contact-input" id="log-contact-${l.id}-${custKey}" placeholder="Kontaktperson...">
          <input class="contact-input" id="log-date-${l.id}-${custKey}" type="date" value="${new Date().toISOString().slice(0,10)}">
        </div>
        <textarea class="contact-input" id="log-note-${l.id}-${custKey}" rows="2"
          placeholder="Vad gjordes / vad sades?..." style="resize:vertical"></textarea>
        <input class="contact-input" id="log-next-${l.id}-${custKey}" placeholder="Nästa steg (valfritt)...">
        <div style="display:flex;justify-content:flex-end">
          <button class="inline-btn" onclick="addCustomerContactEntry('${l.id}','${custKey}')">+ Lägg till i logg</button>
        </div>
      </div>
      <div class="contact-log" style="margin-top:10px">${logHtml || '<div style="color:var(--muted);font-size:12px;padding:8px 0">Inga loggade moment ännu</div>'}</div>
    </div>

    ${deadlineSection}

    <div class="section-block">
      ${renderComments(l.id)}
    </div>`;
}

function renderLanseringDetail(l) {
  const customers = getLanseringCustomers(l);
  const activeTab = l.activeCustomerTab || customers[0]?.id || '';

  // Tabbar
  const tabsHtml = customers.map(c => `
    <button onclick="setLanseringTab('${l.id}','${c.id}')"
      style="padding:7px 16px;border-radius:7px 7px 0 0;border:1px solid ${c.id===activeTab?'var(--border)':'transparent'};border-bottom:${c.id===activeTab?'1px solid var(--surface)':'none'};background:${c.id===activeTab?'var(--surface)':'transparent'};color:${c.id===activeTab?c.color:'var(--muted)'};cursor:pointer;font-family:var(--font);font-size:12px;font-weight:${c.id===activeTab?'700':'400'};transition:all 0.12s;white-space:nowrap">
      ${c.id===activeTab?`<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${c.color};margin-right:5px;vertical-align:middle"></span>`:''}${c.label}
      <span onclick="event.stopPropagation();${c.type==='free'?`removeFreeCustomer('${l.id}','${c.label}')`:`removeChainTab('${l.id}','${c.id}')`}" style="opacity:0.3;margin-left:4px;cursor:pointer">×</span>
    </button>`).join('');

  // Lägg till kund-knapp
  const addCustomerHtml = `
    <div style="display:flex;align-items:center;gap:6px;margin-left:8px">
      <input id="free-cust-input-${l.id}" class="contact-input"
        placeholder="Lägg till kund..." style="width:140px;padding:5px 8px;font-size:11px"
        onkeydown="if(event.key==='Enter')addFreeCustomer('${l.id}')">
      <button class="inline-btn" style="padding:5px 10px;font-size:11px"
        onclick="addFreeCustomer('${l.id}')">+</button>
    </div>`;

  const tabContent = activeTab ? renderCustomerTabContent(l, activeTab) : 
    `<div style="color:var(--muted);font-size:13px;padding:20px">Inga kunder kopplade — lägg till via kategorierna på produktgruppen</div>`;

  // Progress baserat på aktiv tab
  const pct = getLanseringProgress(l);

  return `<div class="lansering-detail">
    <div class="lansering-detail-header">
      <span style="width:14px;height:14px;border-radius:50%;background:${l.color};flex-shrink:0;display:inline-block"></span>
      <span class="lansering-detail-name">${l.name}</span>
      <button class="lansering-action-btn" onclick="openEditWizard('${l.id}')">Redigera</button>
      <button class="lansering-action-btn danger" onclick="deleteLansering('${l.id}')">Ta bort</button>
    </div>

    <div style="padding:4px 0 0">
      <div class="progress-bar-wrap" style="margin-bottom:12px"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
    </div>

    <div style="display:flex;align-items:flex-end;gap:0;border-bottom:1px solid var(--border);flex-wrap:wrap;padding:0 0 0 4px">
      ${tabsHtml}
      ${addCustomerHtml}
    </div>

    <div style="padding-top:4px">
      ${tabContent}
    </div>
  </div>`;
}

// ── PER-KUND CHECKLISTA ──
function toggleCustomerCheckItem(lid, custKey, itemId, checked) {
  const l = getLansering(lid);
  if (!l) return;
  if (!l.customers) l.customers = {};
  if (!l.customers[custKey]) l.customers[custKey] = { checklist: {}, tasks: [] };
  if (!l.customers[custKey].checklist) l.customers[custKey].checklist = {};
  if (checked) l.customers[custKey].checklist[itemId] = new Date().toLocaleDateString('sv-SE');
  else delete l.customers[custKey].checklist[itemId];
  saveLansering(lid);
  addActivity('', `${CHECKLIST_ITEMS.find(i=>i.id===itemId)?.label} — ${l.name}`);
  renderLansering();
}

// ── PER-KUND UPPGIFTER ──
function addCustomerTask(lid, custKey) {
  const l = getLansering(lid);
  if (!l) return;
  if (!l.customers) l.customers = {};
  if (!l.customers[custKey]) l.customers[custKey] = { checklist: {}, tasks: [] };
  l.customers[custKey].tasks.push({ name: '', deadline: '', status: 'Ej påbörjad', owner: '' });
  saveLansering(lid);
  addActivity('', `Uppgift tillagd för ${custKey} i "${l.name}"`);
  renderLansering();
}

function updateCustomerTask(lid, custKey, idx, field, value) {
  const l = getLansering(lid);
  const task = l?.customers?.[custKey]?.tasks?.[idx];
  if (!task) return;
  task[field] = value;
  saveLansering(lid);
  if (field === 'status') {
    addActivity('', `Uppgift "${task.name || 'Namnlös'}" → ${value} (${custKey}, ${l.name})`);
  }
}

function deleteCustomerTask(lid, custKey, idx) {
  const l = getLansering(lid);
  if (!l?.customers?.[custKey]?.tasks) return;
  const taskName = l.customers[custKey].tasks[idx]?.name || 'Namnlös';
  l.customers[custKey].tasks.splice(idx, 1);
  saveLansering(lid);
  addActivity('', `Uppgift "${taskName}" borttagen (${custKey}, ${l.name})`);
  renderLansering();
}

// ── PER-KUND KONTAKTLOGG ──
function addCustomerContactEntry(lid, custKey) {
  const l = getLansering(lid);
  if (!l) return;
  const contact = document.getElementById(`log-contact-${lid}-${custKey}`)?.value.trim() || '';
  const date = document.getElementById(`log-date-${lid}-${custKey}`)?.value || new Date().toISOString().slice(0,10);
  const note = document.getElementById(`log-note-${lid}-${custKey}`)?.value.trim() || '';
  const next = document.getElementById(`log-next-${lid}-${custKey}`)?.value.trim() || '';
  if (!note) return;
  if (!l.contactLog) l.contactLog = [];
  l.contactLog.push({ customerTab: custKey, contact, date, note, next });
  saveLansering(lid);
  addActivity('', `Kontaktlogg: ${custKey} — ${note.slice(0,40)}`);
  renderLansering();
}


// ── TEMA ──
function initTheme() {
  const saved = localStorage.getItem('listwin_theme');
  if (saved === 'dark') document.body.classList.add('dark');
}

function toggleDarkMode(enable) {
  if (enable) {
    document.body.classList.add('dark');
    localStorage.setItem('listwin_theme', 'dark');
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('listwin_theme', 'light');
  }
}

// ── LANDNINGSSIDA ──
function showLandingPage() {
  const lp = document.getElementById('landing-page');
  if (lp) lp.style.display = '';
  document.getElementById('app-root').style.display = 'none';
  document.getElementById('auth-overlay').style.display = 'none';
}

function hideLandingPage() {
  const lp = document.getElementById('landing-page');
  if (lp) lp.style.display = 'none';
}

function openAuthOverlay(tab = 'login') {
  hideLandingPage();
  document.getElementById('auth-overlay').style.display = 'flex';
  authShowTab(tab);
}

initTheme();
loadWindowData().then(() => authInit());

// ── SETTINGS ──
function openSettings() {
  document.getElementById('settings-overlay').style.display = 'flex';
  // Sync dark mode toggle
  const darkToggle = document.getElementById('settings-dark-toggle');
  if (darkToggle) darkToggle.classList.toggle('on', document.body.classList.contains('dark'));
  // Sync Coop Hemma toggle
  const hemmaToggle = document.getElementById('settings-hemma-toggle');
  if (hemmaToggle) hemmaToggle.classList.toggle('on', state.active.coopHemma);
  // Show team section for admins
  if (currentUserRole === 'admin') {
    document.getElementById('settings-team-section').style.display = '';
    loadTeamMembers();
  }
  // Sync logo preview
  // Logo preview synced via applyCompanyLogo
  const logoImg = document.getElementById('logo-company-img');
  if (logoImg && logoImg.src && logoImg.style.display !== 'none') {
    document.getElementById('settings-logo-preview').style.display = '';
    document.getElementById('settings-logo-img').src = logoImg.src;
    document.getElementById('settings-remove-logo').style.display = '';
  } else {
    document.getElementById('settings-logo-preview').style.display = 'none';
    document.getElementById('settings-remove-logo').style.display = 'none';
  }
}
function closeSettings() {
  document.getElementById('settings-overlay').style.display = 'none';
}
function closeSettingsOutside(e) {
  if (e.target === document.getElementById('settings-overlay')) closeSettings();
}
function togglePastFromSettings(cb) {
  state.showPast = cb.checked;
  renderAll();
}
// ── TEAM / INVITATIONS ──
async function loadTeamMembers() {
  if (!currentWorkspaceId) return;
  const { data } = await supabaseClient
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', currentWorkspaceId);

  if (!data) return;

  // Get emails for each member
  const list = document.getElementById('settings-team-list');
  list.innerHTML = '<div style="font-size:12px;opacity:0.4;">Laddar...</div>';

  // Use Supabase admin to get user emails — fetch from our own function
  const { data: members } = await supabaseClient.rpc('get_workspace_members_with_email', {
    p_workspace_id: currentWorkspaceId
  });

  if (members && members.length) {
    list.innerHTML = members.map(m => `
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--border);">
        <span>${m.email}</span>
        <span style="font-size:10px;opacity:0.5;text-transform:uppercase;letter-spacing:1px;">${m.role}</span>
      </div>`).join('');
  } else {
    list.innerHTML = '<div style="font-size:12px;opacity:0.4;">Inga medlemmar hittades</div>';
  }
}

async function sendInvitation() {
  const email = document.getElementById('invite-email').value.trim();
  const fb = document.getElementById('invite-feedback');
  if (!email) return;

  fb.style.background = 'rgba(167,139,250,0.1)';
  fb.style.border = '1px solid rgba(167,139,250,0.3)';
  fb.style.color = '#a78bfa';
  fb.textContent = 'Skickar inbjudan...';
  fb.style.display = '';

  // Get workspace name
  const { data: wsData } = await supabaseClient
    .from('workspaces')
    .select('name')
    .eq('id', currentWorkspaceId)
    .limit(1);
  const workspaceName = wsData && wsData.length ? wsData[0].name : 'ditt företag';

  // Create invitation token
  const { data: token, error } = await supabaseClient.rpc('create_invitation', {
    p_workspace_id: currentWorkspaceId,
    p_email: email,
    p_role: 'member'
  });

  if (error) {
    fb.style.background = 'rgba(248,113,113,0.1)';
    fb.style.border = '1px solid rgba(248,113,113,0.3)';
    fb.style.color = '#E3000B';
    fb.textContent = 'Fel: ' + error.message;
    return;
  }

  const inviteUrl = window.location.origin + window.location.pathname + '?invite=' + token;

  // Send email via Edge Function
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const res = await fetch('https://rjbqvbnzxxltnwoqfstb.supabase.co/functions/v1/send-invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + session.access_token,
        'apikey': SUPA_KEY
      },
      body: JSON.stringify({ email, inviteUrl, workspaceName })
    });

    const result = await res.json();
    if (result.id) {
      fb.style.background = 'rgba(74,222,128,0.1)';
      fb.style.border = '1px solid rgba(74,222,128,0.3)';
      fb.style.color = '#00AB46';
      fb.textContent = 'Inbjudan skickad till ' + email + '!';
      document.getElementById('invite-email').value = '';
      addActivity('', `Inbjudan skickad till ${email}`);
    } else {
      throw new Error(result.message || 'Okänt fel');
    }
  } catch(e) {
    fb.style.background = 'rgba(248,113,113,0.1)';
    fb.style.border = '1px solid rgba(248,113,113,0.3)';
    fb.style.color = '#E3000B';
    fb.textContent = 'Kunde inte skicka email: ' + e.message;
  }
}

function toggleDarkModeSettings() {
  const isDark = document.body.classList.contains('dark');
  toggleDarkMode(!isDark);
  const el = document.getElementById('settings-dark-toggle');
  if (el) el.classList.toggle('on', !isDark);
}

function toggleCoopHemmaSettings() {
  state.active.coopHemma = !state.active.coopHemma;
  const el = document.getElementById('settings-hemma-toggle');
  if (el) el.classList.toggle('on', state.active.coopHemma);
  addActivity('', `Coop Hemma-fönster ${state.active.coopHemma ? 'aktiverat' : 'inaktiverat'}`);
  renderAll();
}

function showForgotPassword(show = true) {
  document.getElementById('auth-form-login').style.display = show ? 'none' : '';
  document.getElementById('auth-form-forgot').style.display = show ? '' : 'none';
  document.getElementById('forgot-feedback').style.display = 'none';
  if (show) setTimeout(() => document.getElementById('forgot-email').focus(), 50);
}

async function sendResetEmail() {
  const email = document.getElementById('forgot-email').value.trim();
  const fb = document.getElementById('forgot-feedback');
  if (!email) return;

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://listingwin.com/?reset=true'
  });

  fb.style.display = '';
  if (error) {
    fb.style.background = 'rgba(248,113,113,0.1)';
    fb.style.border = '1px solid rgba(248,113,113,0.3)';
    fb.style.color = '#E3000B';
    fb.textContent = 'Något gick fel: ' + error.message;
  } else {
    fb.style.background = 'rgba(74,222,128,0.1)';
    fb.style.border = '1px solid rgba(74,222,128,0.3)';
    fb.style.color = '#00AB46';
    fb.textContent = 'Mejl skickat! Kolla din inkorg.';
  }
}

async function saveNewPassword() {
  const password = document.getElementById('reset-password').value;
  const fb = document.getElementById('reset-feedback');
  if (password.length < 6) {
    fb.style.display = '';
    fb.style.background = 'rgba(248,113,113,0.1)';
    fb.style.border = '1px solid rgba(248,113,113,0.3)';
    fb.style.color = '#E3000B';
    fb.textContent = 'Lösenordet måste vara minst 6 tecken.';
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({ password });
  fb.style.display = '';
  if (error) {
    fb.style.background = 'rgba(248,113,113,0.1)';
    fb.style.border = '1px solid rgba(248,113,113,0.3)';
    fb.style.color = '#E3000B';
    fb.textContent = 'Något gick fel: ' + error.message;
  } else {
    fb.style.background = 'rgba(74,222,128,0.1)';
    fb.style.border = '1px solid rgba(74,222,128,0.3)';
    fb.style.color = '#00AB46';
    fb.textContent = 'Lösenord sparat! Loggar in...';
    setTimeout(() => {
      document.getElementById('auth-form-reset').style.display = 'none';
      document.getElementById('auth-overlay').style.display = 'none';
    }, 1500);
  }
}
function toggleMobileMenu() {
  const sidebar = document.getElementById('app-sidebar');
  const overlay = document.getElementById('mobile-overlay');
  const closeBtn = document.getElementById('sidebar-close-btn');
  sidebar.classList.toggle('mobile-open');
  overlay.classList.toggle('active');
  if (closeBtn) closeBtn.style.display = sidebar.classList.contains('mobile-open') ? '' : 'none';
}

function closeMobileMenu() {
  const sidebar = document.getElementById('app-sidebar');
  const overlay = document.getElementById('mobile-overlay');
  const closeBtn = document.getElementById('sidebar-close-btn');
  sidebar.classList.remove('mobile-open');
  overlay.classList.remove('active');
  if (closeBtn) closeBtn.style.display = 'none';
}

function uid() { return Math.random().toString(36).slice(2,9); }

// ─── SYNLIGHET ───
function renderVisibilityBadge(brand) {
  const icons = { private: '·', shared: '·', workspace: '·' };
  const labels = { private: 'Privat', shared: 'Delade', workspace: 'Hela workspace' };
  const colors = { private: '#94a3b8', shared: '#a78bfa', workspace: '#00AB46' };
  const v = brand.visibility || 'private';
  return `<span style="font-size:10px;padding:3px 8px;border-radius:10px;border:1px solid ${colors[v]}33;color:${colors[v]};background:${colors[v]}11;">${icons[v]} ${labels[v]}</span>`;
}

// ─── DELA-MODAL ───
let shareModalProjectId = null;
let workspaceMembers = [];
let cachedMemberMap = {}; // cachas så vi slipper nätverksanrop vid uppdatering

async function openShareModal(brandId) {
  shareModalProjectId = brandId;
  const brand = brands.find(b => b.id === brandId);
  if (!brand) return;

  // Hämta workspace-members
  const { data: members } = await supabaseClient.rpc('get_workspace_members_with_email', {
    p_workspace_id: currentWorkspaceId
  });
  workspaceMembers = (members || []).filter(m => m.user_id !== currentUser?.id);

  // Hämta nuvarande project_members
  const { data: projMembers } = await supabaseClient
    .from('project_members')
    .select('user_id, permission')
    .eq('project_id', brandId);
  const memberMap = {};
  (projMembers || []).forEach(pm => { memberMap[pm.user_id] = pm.permission; });
  cachedMemberMap = memberMap;

  const visOpts = ['private','shared','workspace'];
  const visLabels = { private:'Privat', shared:'Utvalda kollegor', workspace:'Hela workspace' };
  const visDescriptions = {
    private: 'Bara du kan se detta projekt.',
    shared: 'Välj vilka kollegor som ska ha åtkomst och vilken behörighet de ska ha.',
    workspace: 'Alla i ditt workspace kan se projektet.'
  };

  document.getElementById('share-modal-title').textContent = 'Dela — ' + brand.name;

  // Synlighetsknappar
  document.getElementById('share-visibility-btns').innerHTML = visOpts.map(v =>
    `<button onclick="setProjectVisibility('${brandId}','${v}')"
      style="flex:1;padding:8px;border-radius:7px;border:1px solid ${brand.visibility===v ? '#a78bfa' : 'var(--border2)'};background:${brand.visibility===v ? 'rgba(167,139,250,0.15)' : 'var(--surface2)'};color:#fff;cursor:pointer;font-family:var(--font);font-size:12px;transition:all 0.15s;">
      ${visLabels[v]}
    </button>`
  ).join('');

  // Beskrivning av vald synlighet
  document.getElementById('share-visibility-desc').textContent = visDescriptions[brand.visibility] || '';

  // Kollegolista — visas bara för 'shared'
  const colleagueSection = document.getElementById('share-colleague-section');
  if (brand.visibility === 'shared') {
    colleagueSection.style.display = '';
    renderShareMembersList(brandId);
  } else {
    colleagueSection.style.display = 'none';
  }

  document.getElementById('share-modal-overlay').style.display = 'flex';
}

function closeShareModal() {
  document.getElementById('share-modal-overlay').style.display = 'none';
  shareModalProjectId = null;
}

async function setProjectVisibility(brandId, visibility) {
  const ok = await updateProjectVisibility(brandId, visibility);
  if (ok) {
    const brand = brands.find(b => b.id === brandId);
    const visLabels = { private: 'Privat', shared: 'Delade kollegor', workspace: 'Hela workspace' };
    addActivity('', `Synlighet för "${brand?.name || 'projekt'}" ändrad till ${visLabels[visibility] || visibility}`);
    renderBrands();
    openShareModal(brandId);
  }
}

async function updateSharePermission(brandId, userId, permission) {
  if (!permission) {
    delete cachedMemberMap[userId];
  } else {
    cachedMemberMap[userId] = permission;
  }
  renderShareMembersList(brandId);

  const brand = brands.find(b => b.id === brandId);
  const member = workspaceMembers.find(m => m.user_id === userId);
  if (!permission) {
    addActivity('', `Åtkomst till "${brand?.name || 'projekt'}" borttagen för ${member?.email || userId}`);
    supabaseClient.from('project_members')
      .delete()
      .eq('project_id', brandId)
      .eq('user_id', userId)
      .neq('permission', 'owner');
  } else {
    const permLabels = { viewer: 'kan se', editor: 'kan redigera' };
    addActivity('', `${member?.email || userId} fick behörighet "${permLabels[permission] || permission}" på "${brand?.name || 'projekt'}"`);
    supabaseClient.rpc('share_project', {
      p_project_id: brandId,
      p_user_id: userId,
      p_permission: permission
    });
  }
}

function renderShareMembersList(brandId) {
  const membersHtml = workspaceMembers.length === 0
    ? '<div style="font-size:12px;opacity:0.4;padding:8px 0;">Inga kollegor i workspace ännu.</div>'
    : workspaceMembers.map(m => {
        const perm = cachedMemberMap[m.user_id] || '';
        if (perm === 'owner') return '';
        const initials = (m.email || '?').slice(0,2).toUpperCase();
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);">
          <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">${initials}</div>
          <div style="flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.email}</div>
          <div style="display:flex;gap:4px;">
            <button onclick="updateSharePermission('${brandId}','${m.user_id}','viewer')"
              style="padding:4px 10px;border-radius:6px;border:1px solid ${perm==='viewer' ? '#a78bfa' : 'var(--border2)'};background:${perm==='viewer' ? 'rgba(167,139,250,0.15)' : 'none'};color:${perm==='viewer' ? '#a78bfa' : '#fff'};cursor:pointer;font-family:var(--font);font-size:11px;transition:all 0.15s;">
              Kan se
            </button>
            <button onclick="updateSharePermission('${brandId}','${m.user_id}','editor')"
              style="padding:4px 10px;border-radius:6px;border:1px solid ${perm==='editor' ? '#a78bfa' : 'var(--border2)'};background:${perm==='editor' ? 'rgba(167,139,250,0.15)' : 'none'};color:${perm==='editor' ? '#a78bfa' : '#fff'};cursor:pointer;font-family:var(--font);font-size:11px;transition:all 0.15s;">
              Kan redigera
            </button>
            ${perm && perm !== 'owner' ? `<button onclick="updateSharePermission('${brandId}','${m.user_id}','')"
              style="padding:4px 8px;border-radius:6px;border:1px solid var(--border2);background:none;color:#f87171;cursor:pointer;font-family:var(--font);font-size:11px;" title="Ta bort åtkomst">✕</button>` : ''}
          </div>
        </div>`;
      }).join('');
  document.getElementById('share-members-list').innerHTML = membersHtml;
}

// ─── RENDER BRANDS TAB ───
function renderBrands() {
  const el = document.getElementById('brands-content');
  if (!el) return;

  if (brands.length === 0) {
    el.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--muted)">
        <div style="font-size:36px;margin-bottom:16px;opacity:0.4">◈</div>
        <div style="font-size:15px;font-weight:600;margin-bottom:8px;color:var(--text)">Inga varumärken ännu</div>
        <div style="font-size:13px;margin-bottom:24px;max-width:340px;margin-left:auto;margin-right:auto;line-height:1.6">
          Varumärken skapas automatiskt när du skapar din första lansering via wizarden.
        </div>
        <button class="inline-btn" onclick="openLanseringWizard()">+ Skapa lansering</button>
      </div>`;
    return;
  }

  const cards = brands.map(brand => {
    const linked = lanseringar.filter(l => l.brandId === brand.id);
    const canDelete = brand.permission === 'owner' && linked.length === 0;
    const canEdit   = brand.permission === 'owner' || brand.permission === 'editor';

    // Aggregate product groups dynamically from linked lanseringar
    const groupMap = new Map();
    for (const l of linked) {
      if (!l.groupName) continue;
      if (!groupMap.has(l.groupName)) groupMap.set(l.groupName, []);
      const existing = groupMap.get(l.groupName);
      const existingIds = new Set(existing.map(a => a.id));
      for (const a of (l.articles || [])) {
        if (!existingIds.has(a.id)) { existing.push(a); existingIds.add(a.id); }
      }
    }
    const groups = Array.from(groupMap.entries()).map(([name, arts]) => ({ name, articles: arts }));

    const groupsHtml = groups.length === 0
      ? `<span style="color:var(--muted);font-size:12px">Inga produktgrupper</span>`
      : groups.map(g => {
          const arts = g.articles || [];
          return `<div class="brand-group-row">
            <span class="brand-group-name">${g.name}</span>
            <span class="brand-group-meta">${arts.length} artikel${arts.length !== 1 ? 'ar' : ''}</span>
          </div>`;
        }).join('');

    const pillsHtml = linked.length > 0
      ? linked.map(l => `<span class="brand-lansering-pill"
          onclick="showTab('lansering');selectedLanseringId='${l.id}';renderLansering()">${l.name}</span>`).join('')
      : `<span style="color:var(--muted);font-size:12px">Inga aktiva lanseringar</span>`;

    return `<div class="brand-register-card">
      <div class="brand-register-header">
        <span class="brand-color-dot" style="background:${brand.color}"></span>
        ${brand.logo
          ? `<img src="${brand.logo}" alt="${brand.name}" style="max-height:22px;max-width:90px;object-fit:contain;">`
          : `<span class="brand-register-name">${brand.name}</span>`}
        <div style="flex:1"></div>
        ${canEdit   ? `<button class="brand-action-btn" onclick="openBrandModal('${brand.id}')">Redigera</button>` : ''}
        ${canDelete ? `<button class="brand-action-btn danger" onclick="deleteBrand('${brand.id}')">Ta bort</button>` : ''}
      </div>
      <div class="brand-register-body">
        <div class="brand-register-col">
          <div class="brand-register-section-title">PRODUKTGRUPPER</div>
          <div class="brand-group-list">${groupsHtml}</div>
        </div>
        <div class="brand-register-col">
          <div class="brand-register-section-title">AKTIVA LANSERINGAR</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px">${pillsHtml}</div>
          <button class="brand-new-lansering-btn" onclick="openLanseringModalForBrand('${brand.id}')">+ Ny lansering</button>
        </div>
      </div>
    </div>`;
  }).join('');

  el.innerHTML = `<div class="brand-register">${cards}</div>`;
}

function renderBrandWindows(brand, allCats) {
  if (allCats.length === 0) return '';

  const roundsMap = {
    coop:  [...COOP_FOOD_ROUNDS, ...(state.active.coopHemma ? COOP_HEMMA_ROUNDS : [])],
    ica:   ICA_ROUNDS,
    dagab: DAGAB_ROUNDS,
  };
  const chainColors = { coop: '#00AB46', ica: '#E3000B', dagab: '#0D4F35' };
  const chainLabels = { coop: 'Coop', ica: 'ICA', dagab: 'Dagab' };

  // Bygg en rad per unik (kategori, kedja) — visa nästa kommande fönster
  const rows = [];
  // Gruppera per produktgrupp för tydlighet
  const groups = brand.productGroups || [];
  groups.forEach(g => {
    const cats = g.cats || [];
    cats.forEach(c => {
      const catDef = CATEGORIES.find(cd => cd.name === c.catName && cd.source === c.source);
      if (!catDef) return;
      const rounds = roundsMap[c.source] || [];
      // Hitta nästa kommande avisering för den här kategorin
      const catRounds = rounds.filter(r => catDef.windows.includes(r.launch));
      const next = catRounds
        .map(r => ({ r, step: r.steps.find(s => s.primary && s.days >= 0) }))
        .filter(x => x.step)
        .sort((a, b) => a.step.days - b.step.days)[0];
      if (!next) return;
      rows.push({
        group: g.name,
        catName: c.catName,
        source: c.source,
        avWeek: next.step.week,
        avDays: next.step.days,
        launchWeek: next.r.launch,
        launchDate: next.r.launchDate,
      });
    });
  });

  if (rows.length === 0) return '';

  // Sortera på närmast avisering
  rows.sort((a, b) => a.avDays - b.avDays);

  const tableRows = rows.map(r => {
    const d = r.avDays;
    const urgency = d <= 14 ? '#E3000B' : d <= 42 ? '#f59e0b' : 'var(--muted)';
    return `<tr>
      <td style="padding:7px 10px;font-size:11px;color:var(--muted)">${r.group}</td>
      <td style="padding:7px 10px;font-size:11px">
        <span style="display:inline-flex;align-items:center;gap:5px">
          <img src="${LOGOS[r.source]}" style="height:11px;object-fit:contain;max-width:30px">
          ${r.catName}
        </span>
      </td>
      <td style="padding:7px 10px;font-size:11px;color:${urgency};font-weight:500">v.${r.avWeek} <span style="font-size:10px;opacity:0.7">(${d}d)</span></td>
      <td style="padding:7px 10px;font-size:11px;color:var(--muted)">v.${r.launchWeek}</td>
    </tr>`;
  }).join('');

  return `<div class="section-title" style="margin-bottom:10px">NÄSTA REVIDERINGSFÖNSTER</div>
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="border-bottom:1px solid var(--border)">
        <th style="padding:6px 10px;font-size:10px;color:var(--muted);text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Produktgrupp</th>
        <th style="padding:6px 10px;font-size:10px;color:var(--muted);text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Kategori</th>
        <th style="padding:6px 10px;font-size:10px;color:var(--muted);text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Avisering</th>
        <th style="padding:6px 10px;font-size:10px;color:var(--muted);text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Lansering</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>`;
}

// ─── BRAND MODAL ───
function openBrandModal(brandId) {
  editingBrandId = brandId || null;
  const brand = brandId ? brands.find(b => b.id === brandId) : null;
  document.getElementById('brand-modal-title').textContent = brand ? 'Redigera varumärke' : 'Nytt varumärke';
  document.getElementById('brand-name-input').value = brand ? brand.name : '';

  // Logo
  pendingLogoDataUrl = brand?.logo || null;
  if (pendingLogoDataUrl) {
    document.getElementById('logo-preview-img').src = pendingLogoDataUrl;
    document.getElementById('logo-preview-wrap').style.display = 'flex';
    document.getElementById('logo-drop-zone').style.display = 'none';
  } else {
    document.getElementById('logo-preview-wrap').style.display = 'none';
    document.getElementById('logo-drop-zone').style.display = 'flex';
    document.getElementById('logo-file-input').value = '';
  }

  // Color swatches
  const currentColor = brand ? brand.color : BRAND_COLORS[0];
  document.getElementById('color-picker').innerHTML = BRAND_COLORS.map(c =>
    `<span class="color-swatch ${c===currentColor?'selected':''}" style="background:${c}" data-color="${c}" onclick="selectColor('${c}')"></span>`
  ).join('');

  document.getElementById('brand-modal').classList.add('open');
  setTimeout(() => document.getElementById('brand-name-input').focus(), 50);
}

// ─── LOGO HANDLING ───
let pendingLogoDataUrl = null; // base64 data URL during editing

function handleLogoDrop(e) {
  e.preventDefault();
  document.getElementById('logo-drop-zone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleLogoFile(file);
}

function handleLogoFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    pendingLogoDataUrl = e.target.result;
    document.getElementById('logo-preview-img').src = pendingLogoDataUrl;
    document.getElementById('logo-preview-wrap').style.display = 'flex';
    document.getElementById('logo-drop-zone').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  pendingLogoDataUrl = null;
  document.getElementById('logo-preview-img').src = '';
  document.getElementById('logo-preview-wrap').style.display = 'none';
  document.getElementById('logo-drop-zone').style.display = 'flex';
  document.getElementById('logo-file-input').value = '';
}

function selectColor(color) {
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.toggle('selected', s.dataset.color === color));
}

function closeBrandModal() {
  document.getElementById('brand-modal').classList.remove('open');
}

async function saveBrand() {
  const name = document.getElementById('brand-name-input').value.trim();
  if (!name) return;
  const selectedSwatch = document.querySelector('.color-swatch.selected');
  const color = selectedSwatch ? selectedSwatch.dataset.color : BRAND_COLORS[0];

  if (editingBrandId) {
    const b = brands.find(b => b.id === editingBrandId);
    if (b) {
      b.name = name; b.color = color; b.logo = pendingLogoDataUrl || null;
      await supabaseClient.from('projects')
        .update({ name, color })
        .eq('id', editingBrandId);
      addActivity('', `Varumärke "${name}" uppdaterat`);
    }
  } else {
    const newBrand = await createProject(name, color);
    if (!newBrand) { alert('Kunde inte skapa projekt'); return; }
    newBrand.logo = pendingLogoDataUrl || null;
    selectedBrandId = newBrand.id;
    addActivity('', `Varumärke "${name}" skapat`);
  }
  closeBrandModal();
  renderBrands();
}

async function deleteBrand(id) {
  const linked = lanseringar.filter(l => l.brandId === id);
  if (linked.length > 0) {
    addNotif(`Kan inte ta bort — ${linked.length} aktiv${linked.length !== 1 ? 'a' : ''} lansering${linked.length !== 1 ? 'ar' : ''} är kopplade till varumärket`, 'error');
    return;
  }
  if (!confirm('Ta bort detta varumärke? Det kan inte ångras.')) return;
  const brandName = brands.find(b => b.id === id)?.name || 'Okänt varumärke';
  const { error } = await supabaseClient.from('projects').delete().eq('id', id);
  if (error) { alert('Kunde inte ta bort: ' + error.message); return; }
  brands = brands.filter(b => b.id !== id);
  if (selectedBrandId === id) selectedBrandId = brands[0]?.id || null;
  addActivity('', `Varumärke "${brandName}" borttaget`);
  renderBrands();
  if (state.tab === 'overview') renderOverview();
}

function selectBrand(id) {
  selectedBrandId = id;
  renderBrands();
}

// ─── PRODUCTS ───
// addProduct/deleteProduct ersatt av addProductGroup/addArticle

function removeCatFromProduct(brandId, productId, catName) {
  const brand = brands.find(b => b.id === brandId);
  const product = brand?.products.find(p => p.id === productId);
  if (product) { product.cats = product.cats.filter(c => c.catName !== catName); saveProject(brandId); }
  renderBrands();
}

// ─── CAT MODAL ───
function openCatModal(brandId, productId) {
  catModalTarget = { brandId, productId };
  const brand = brands.find(b => b.id === brandId);
  const product = brand?.products.find(p => p.id === productId);
  catModalSelected = product ? [...product.cats] : [];
  document.getElementById('cat-modal-sub').textContent = `Välj kategorier för "${product?.name}"`;
  document.getElementById('cat-modal-search').value = '';
  document.getElementById('cat-modal').classList.add('open');
  renderCatModal();
}

function closeCatModal() {
  document.getElementById('cat-modal').classList.remove('open');
  catModalTarget = null;
}

function renderCatModal() {
  const q = document.getElementById('cat-modal-search').value.toLowerCase();
  const filtered = CATEGORIES.filter(c => !q || c.name.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q));

  const groups = [
    { key: 'coop', label: 'Coop' },
    { key: 'ica',  label: 'ICA' },
    { key: 'dagab',label: 'Dagab' },
  ];

  const html = groups.map(g => {
    const cats = filtered.filter(c => c.source === g.key);
    if (!cats.length) return '';
    const rows = cats.map(c => {
      const isChecked = catModalSelected.some(s => s.catName === c.name && s.source === c.source);
      return `<div class="modal-cat-row ${isChecked?'checked':''}" onclick="toggleCatModalItem('${c.name.replace(/'/g,"\'")}','${c.source}')">
        <div class="modal-checkbox">${isChecked?'✓':''}</div>
        <span class="modal-cat-name">${c.name}</span>
        <span class="modal-cat-windows">${c.windows.map(w=>'v.'+w).join(', ')}</span>
      </div>`;
    }).join('');
    return `<div class="modal-cat-group">
      <div class="modal-cat-group-label" style="display:flex;align-items:center;gap:6px">
        <img src="${LOGOS[g.key]}" style="height:11px;object-fit:contain;opacity:1;max-width:28px">
        ${g.label}
      </div>
      ${rows}
    </div>`;
  }).join('');

  document.getElementById('cat-modal-list').innerHTML = html || '<div style="color:var(--muted);padding:12px">Inga kategorier hittades</div>';
}

function toggleCatModalItem(catName, source) {
  const idx = catModalSelected.findIndex(s => s.catName === catName && s.source === source);
  if (idx >= 0) catModalSelected.splice(idx, 1);
  else catModalSelected.push({ catName, source });
  renderCatModal();
}

function saveCatModal() {
  if (!catModalTarget) return;
  const brand = brands.find(b => b.id === catModalTarget.brandId);
  if (catModalTarget.groupIndex !== undefined) {
    const group = brand?.productGroups?.[catModalTarget.groupIndex];
    if (group) {
      group.cats = [...catModalSelected];
      saveProject(catModalTarget.brandId);
      addActivity('', `Kategorier uppdaterade på "${group.name}" (${brand?.name || ''}): ${catModalSelected.map(c=>c.catName).join(', ') || 'inga'}`);
      restoreOpenGroups(catModalTarget.brandId);
    }
  } else {
    const product = brand?.products.find(p => p.id === catModalTarget.productId);
    if (product) {
      product.cats = [...catModalSelected];
      saveProject(catModalTarget.brandId);
      addActivity('', `Kategorier uppdaterade på "${product.name}" (${brand?.name || ''})`);
    }
  }
  closeCatModal();
  renderBrands();
  if (catModalTarget) restoreOpenGroups(catModalTarget.brandId);
}

// Close modals on overlay click — listeners attached after DOM ready (see init)

// Attach modal overlay close listeners (elements now exist in DOM)
const _bm = document.getElementById('brand-modal');
const _cm = document.getElementById('cat-modal');
if (_bm) _bm.addEventListener('click', e => { if (e.target.id === 'brand-modal') closeBrandModal(); });
if (_cm) _cm.addEventListener('click', e => { if (e.target.id === 'cat-modal') closeCatModal(); });
