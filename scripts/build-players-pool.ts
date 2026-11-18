import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../src/data');

interface Club {
  id: string;
  name: string;
  shortName: string;
  league?: string;
  country?: string;
}

interface PlayerEntry {
  id: string;
  name: string;
  nationality: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  era: string;
  clubs: Set<string>;
}

const clubs: Club[] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'clubs.json'), 'utf8'));
const clubMap = new Map<string, Club>();
clubs.forEach((c) => clubMap.set(c.id, c));

const clubSet = new Set(
  clubs.flatMap((c) => [
    c.id.toLowerCase().replace(/[^a-z0-9]/g, ''),
    c.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    c.shortName.toLowerCase().replace(/[^a-z0-9]/g, ''),
  ])
);

// Map of canonical club keywords for scanning text
const clubAliases: Array<{ id: string; patterns: RegExp[] }> = [
  { id: 'man-city', patterns: [/\b(manchester city|man city|mancity)\b/i] },
  { id: 'man-united', patterns: [/\b(manchester united|man united|man utd|manunited)\b/i] },
  { id: 'real-madrid', patterns: [/\b(real madrid|los blancos)\b/i] },
  { id: 'barcelona', patterns: [/\b(barcelona|barça|blaugrana)\b/i] },
  { id: 'liverpool', patterns: [/\b(liverpool|anfield)\b/i] },
  { id: 'chelsea', patterns: [/\b(chelsea|stamford bridge)\b/i] },
  { id: 'arsenal', patterns: [/\b(arsenal|emirates)\b/i] },
  { id: 'bayern-munich', patterns: [/\b(bayern munich|fc bayern|bayern)\b/i] },
  { id: 'psg', patterns: [/\b(paris saint-germain|paris saint germain|psg)\b/i] },
  { id: 'juventus', patterns: [/\b(juventus|juve)\b/i] },
  { id: 'inter-milan', patterns: [/\b(inter milan|internazionale|inter)\b/i] },
  { id: 'ac-milan', patterns: [/\b(ac milan|milan|rossoneri)\b/i] },
  { id: 'atletico-madrid', patterns: [/\b(atletico madrid|atlético madrid|atletico)\b/i] },
  { id: 'dortmund', patterns: [/\b(borussia dortmund|dortmund|bvb)\b/i] },
  { id: 'napoli', patterns: [/\b(napoli|partenopei)\b/i] },
  { id: 'tottenham', patterns: [/\b(tottenham|spurs)\b/i] },
  { id: 'roma', patterns: [/\b(as roma|roma|giallorossi)\b/i] },
  { id: 'lazio', patterns: [/\b(lazio|biancocelesti)\b/i] },
  { id: 'leicester', patterns: [/\b(leicester city|leicester)\b/i] },
  { id: 'west-ham', patterns: [/\b(west ham|west ham united|hammers)\b/i] },
  { id: 'everton', patterns: [/\b(everton|toffees)\b/i] },
  { id: 'newcastle', patterns: [/\b(newcastle united|newcastle|magpies)\b/i] },
  { id: 'aston-villa', patterns: [/\b(aston villa|villa)\b/i] },
  { id: 'rb-leipzig', patterns: [/\b(rb leipzig|leipzig)\b/i] },
  { id: 'leverkusen', patterns: [/\b(bayer leverkusen|leverkusen)\b/i] },
  { id: 'ajax', patterns: [/\b(ajax|afc ajax)\b/i] },
  { id: 'porto', patterns: [/\b(fc porto|porto)\b/i] },
  { id: 'benfica', patterns: [/\b(benfica|sl benfica)\b/i] },
  { id: 'sporting-cp', patterns: [/\b(sporting cp|sporting lisbon|sporting)\b/i] },
  { id: 'monaco', patterns: [/\b(as monaco|monaco)\b/i] },
  { id: 'lyon', patterns: [/\b(olympique lyonnais|lyon|ol)\b/i] },
  { id: 'marseille', patterns: [/\b(olympique de marseille|marseille|om)\b/i] },
  { id: 'lille', patterns: [/\b(lille osc|lille)\b/i] },
  { id: 'sevilla', patterns: [/\b(sevilla fc|sevilla)\b/i] },
  { id: 'villarreal', patterns: [/\b(villarreal|yellow submarine)\b/i] },
  { id: 'valencia', patterns: [/\b(valencia cf|valencia)\b/i] },
  { id: 'real-betis', patterns: [/\b(real betis|betis)\b/i] },
  { id: 'athletic-bilbao', patterns: [/\b(athletic bilbao|athletic club|bilbao)\b/i] },
  { id: 'real-sociedad', patterns: [/\b(real sociedad|la real)\b/i] },
  { id: 'atalanta', patterns: [/\b(atalanta)\b/i] },
  { id: 'fiorentina', patterns: [/\b(fiorentina|viola)\b/i] },
  { id: 'bologna', patterns: [/\b(bologna)\b/i] },
  { id: 'torino', patterns: [/\b(torino fc|torino)\b/i] },
  { id: 'frankfurt', patterns: [/\b(eintracht frankfurt|frankfurt)\b/i] },
  { id: 'wolfsburg', patterns: [/\b(vfl wolfsburg|wolfsburg)\b/i] },
  { id: 'stuttgart', patterns: [/\b(vfb stuttgart|stuttgart)\b/i] },
  { id: 'monchengladbach', patterns: [/\b(borussia mönchengladbach|monchengladbach|gladbach)\b/i] },
  { id: 'brighton', patterns: [/\b(brighton|seagulls)\b/i] },
  { id: 'wolves', patterns: [/\b(wolverhampton|wolves)\b/i] },
  { id: 'crystal-palace', patterns: [/\b(crystal palace|palace)\b/i] },
  { id: 'brentford', patterns: [/\b(brentford)\b/i] },
  { id: 'fulham', patterns: [/\b(fulham)\b/i] },
  { id: 'nottingham-forest', patterns: [/\b(nottingham forest|forest)\b/i] },
  { id: 'southampton', patterns: [/\b(southampton|saints)\b/i] },
  { id: 'bournemouth', patterns: [/\b(bournemouth|cherries)\b/i] },
  { id: 'celtic', patterns: [/\b(celtic|celtic fc)\b/i] },
  { id: 'rangers', patterns: [/\b(rangers|rangers fc)\b/i] },
  { id: 'galatasaray', patterns: [/\b(galatasaray)\b/i] },
  { id: 'fenerbahce', patterns: [/\b(fenerbahçe|fenerbahce)\b/i] },
  { id: 'besiktas', patterns: [/\b(beşiktaş|besiktas)\b/i] },
  { id: 'psv', patterns: [/\b(psv|psv eindhoven)\b/i] },
  { id: 'feyenoord', patterns: [/\b(feyenoord)\b/i] },
  { id: 'al-nassr', patterns: [/\b(al nassr|al-nassr)\b/i] },
  { id: 'inter-miami', patterns: [/\b(inter miami)\b/i] },
];

const KNOWN_SINGLE_NAMES = new Set([
  'michu', 'neymar', 'casemiro', 'rodri', 'pedri', 'gavi', 'alisson', 'ederson',
  'fred', 'fabinho', 'richarlison', 'antony', 'jorginho', 'fernandinho', 'willian',
  'oscar', 'hulk', 'kaka', 'ronaldo', 'ronaldinho', 'deco', 'pepe', 'nani', 'vitinha',
  'otavio', 'danilo', 'arthur', 'malcom', 'marquinhos', 'hernanes', 'allan', 'emerson',
  'douglas', 'ganso', 'miranda', 'dante', 'rafinha', 'paulinho', 'neymar jr',
  'joselu', 'suso', 'fernando', 'pedro', 'nacho', 'gabi', 'isco', 'koke', 'saul',
  'maicon', 'sylvinho', 'raphinha', 'gervinho', 'ramires', 'rodrygo'
]);

function isPlayerNameCandidate(str: string, isFromDedicatedPlayerGame = false): boolean {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim();
  if (s.length < 2 || s.length > 40) return false;
  if (/^[\+\-\#\d]/.test(s)) return false;
  if (/[\$€£%0-9]/.test(s)) return false;
  if (/\b(million|thousand|billion|league|cup|final|round|group|points|trophy|season|stadium|arena|united|city|rovers|wanderers|cf|fc|sc|sv|rb)\b/i.test(s)) return false;
  if (/^(yes|no|none|other|draw|group|final|stage|quarter-final|semi-final|seven|eight|nine|ten|eleven|twelve)$/i.test(s)) return false;

  const norm = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clubSet.has(norm)) return false;

  const words = s.split(/\s+/);
  if (words.length === 1) {
    if (isFromDedicatedPlayerGame) return true;
    return KNOWN_SINGLE_NAMES.has(norm);
  }
  return words.length >= 2 && words.length <= 4;
}

const nationalityList: Array<{ country: string; matchers: string[] }> = [
  { country: 'Spain', matchers: ['spanish', 'spain'] },
  { country: 'Germany', matchers: ['german', 'germany'] },
  { country: 'France', matchers: ['french', 'france'] },
  { country: 'England', matchers: ['english', 'england'] },
  { country: 'Italy', matchers: ['italian', 'italy'] },
  { country: 'Portugal', matchers: ['portuguese', 'portugal'] },
  { country: 'Netherlands', matchers: ['dutch', 'netherlands', 'holland'] },
  { country: 'Argentina', matchers: ['argentine', 'argentinian', 'argentina'] },
  { country: 'Brazil', matchers: ['brazilian', 'brazil'] },
  { country: 'Belgium', matchers: ['belgian', 'belgium'] },
  { country: 'Croatia', matchers: ['croatian', 'croatia'] },
  { country: 'Uruguay', matchers: ['uruguayan', 'uruguay'] },
  { country: 'Colombia', matchers: ['colombian', 'colombia'] },
  { country: 'Denmark', matchers: ['danish', 'denmark'] },
  { country: 'Sweden', matchers: ['swedish', 'sweden'] },
  { country: 'Norway', matchers: ['norwegian', 'norway'] },
  { country: 'Poland', matchers: ['polish', 'poland'] },
  { country: 'Senegal', matchers: ['senegalese', 'senegal'] },
  { country: 'Nigeria', matchers: ['nigerian', 'nigeria'] },
  { country: 'Morocco', matchers: ['moroccan', 'morocco'] },
  { country: 'Algeria', matchers: ['algerian', 'algeria'] },
  { country: 'Egypt', matchers: ['egyptian', 'egypt'] },
  { country: 'Ghana', matchers: ['ghanaian', 'ghana'] },
  { country: 'Ivory Coast', matchers: ['ivorian', 'ivory coast'] },
  { country: 'Cameroon', matchers: ['cameroonian', 'cameroon'] },
  { country: 'Japan', matchers: ['japanese', 'japan'] },
  { country: 'South Korea', matchers: ['south korean', 'korean', 'south korea'] },
  { country: 'Serbia', matchers: ['serbian', 'serbia'] },
  { country: 'Switzerland', matchers: ['swiss', 'switzerland'] },
  { country: 'Austria', matchers: ['austrian', 'austria'] },
  { country: 'Scotland', matchers: ['scottish', 'scotland'] },
  { country: 'Wales', matchers: ['welsh', 'wales'] },
  { country: 'Chile', matchers: ['chilean', 'chile'] },
  { country: 'Turkey', matchers: ['turkish', 'turkey'] },
  { country: 'Ukraine', matchers: ['ukrainian', 'ukraine'] },
  { country: 'Czech Republic', matchers: ['czech'] },
  { country: 'Hungary', matchers: ['hungarian', 'hungary'] },
  { country: 'Slovakia', matchers: ['slovak', 'slovakia'] },
  { country: 'Slovenia', matchers: ['slovenian', 'slovenia'] },
  { country: 'Bosnia', matchers: ['bosnian', 'bosnia'] },
  { country: 'Albania', matchers: ['albanian', 'albania'] },
  { country: 'Georgia', matchers: ['georgian', 'georgia'] },
  { country: 'Gabon', matchers: ['gabonese', 'gabon'] },
  { country: 'Guinea', matchers: ['guinean', 'guinea'] },
  { country: 'Canada', matchers: ['canadian', 'canada'] },
  { country: 'United States', matchers: ['american', 'usa', 'united states'] },
  { country: 'Mexico', matchers: ['mexican', 'mexico'] },
  { country: 'Ecuador', matchers: ['ecuadorian', 'ecuador'] },
  { country: 'Peru', matchers: ['peruvian', 'peru'] },
  { country: 'Paraguay', matchers: ['paraguayan', 'paraguay'] },
  { country: 'Venezuela', matchers: ['venezuelan', 'venezuela'] },
  { country: 'Jamaica', matchers: ['jamaican', 'jamaica'] },
  { country: 'Australia', matchers: ['australian', 'australia'] },
  { country: 'Greece', matchers: ['greek', 'greece'] },
  { country: 'Republic of Ireland', matchers: ['irish', 'republic of ireland'] },
  { country: 'Northern Ireland', matchers: ['northern irish'] },
  { country: 'Finland', matchers: ['finnish', 'finland'] },
  { country: 'Iceland', matchers: ['icelandic', 'iceland'] },
  { country: 'Mali', matchers: ['malian', 'mali'] },
  { country: 'DR Congo', matchers: ['congolese', 'dr congo'] },
];

function detectNationality(text: string): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  for (const { country, matchers } of nationalityList) {
    for (const m of matchers) {
      const reg = new RegExp(`(^|[^a-z])${m}([^a-z]|$)`, 'i');
      if (reg.test(lower)) return country;
    }
  }
  return '';
}

function detectPosition(text: string): 'GK' | 'DF' | 'MF' | 'FW' | '' {
  if (!text) return '';
  const lower = text.toLowerCase();
  if (/(^|[^a-z])(goalkeeper|keeper|shot-stopper|gk)([^a-z]|$)/i.test(lower)) return 'GK';
  if (/(^|[^a-z])(centre-back|center-back|defender|full-back|left-back|right-back|wing-back|df)([^a-z]|$)/i.test(lower)) return 'DF';
  if (/(^|[^a-z])(forward|striker|winger|number 9|goalscorer|finisher|centre-forward|center-forward|fw)([^a-z]|$)/i.test(lower)) return 'FW';
  if (/(^|[^a-z])(midfielder|playmaker|midfield|pivot|mf)([^a-z]|$)/i.test(lower)) return 'MF';
  return '';
}

function normalizeKey(name: string): string {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function makeSlug(name: string): string {
  const norm = (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `fb-${norm}`;
}

function extractClubsFromText(text: string): string[] {
  const found: string[] = [];
  for (const ca of clubAliases) {
    for (const pat of ca.patterns) {
      if (pat.test(text)) {
        found.push(ca.id);
        break;
      }
    }
  }
  return found;
}

const playerMap = new Map<string, PlayerEntry>();

function getOrCreatePlayer(name: string, isFromDedicatedPlayerGame = false): PlayerEntry | null {
  if (!isPlayerNameCandidate(name, isFromDedicatedPlayerGame)) return null;
  const clean = name.trim();
  const key = normalizeKey(clean);
  if (!key) return null;

  let entry = playerMap.get(key);
  if (!entry) {
    entry = {
      id: makeSlug(clean),
      name: clean,
      nationality: '',
      position: 'MF',
      era: '2010–present',
      clubs: new Set(),
    };
    playerMap.set(key, entry);
  } else {
    // Prefer cleaner/accented name if present
    if (clean.length > entry.name.length || /[à-üÀ-Ü]/.test(clean)) {
      entry.name = clean;
    }
  }
  return entry;
}

// 1. Ingest existing players.json
const existingPlayers = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'players.json'), 'utf8'));
for (const p of existingPlayers) {
  const entry = getOrCreatePlayer(p.name, true);
  if (entry) {
    if (p.id) entry.id = p.id;
    if (p.nationality) entry.nationality = p.nationality;
    if (p.position) entry.position = p.position;
    if (p.era) entry.era = p.era;
    if (Array.isArray(p.clubs)) p.clubs.forEach((c: string) => entry.clubs.add(c));
  }
}

// 2. Ingest tictactoePlayerPool.json
const tictactoePool = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tictactoePlayerPool.json'), 'utf8'));
for (const p of tictactoePool) {
  const entry = getOrCreatePlayer(p.name, true);
  if (entry) {
    if (Array.isArray(p.clubs)) p.clubs.forEach((c: string) => entry.clubs.add(c));
  }
}

// 3. Ingest careerPathQuestions.json (Dedicated player game)
const cpQuestions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'careerPathQuestions.json'), 'utf8'));
for (const q of cpQuestions) {
  const entry = getOrCreatePlayer(q.correctAnswer, true);
  if (entry) {
    if (Array.isArray(q.clubs)) {
      q.clubs.forEach((c: any) => {
        if (c.clubId && clubMap.has(c.clubId)) entry.clubs.add(c.clubId);
      });
      const firstYear = q.clubs[0]?.period?.match(/\d{4}/)?.[0];
      const lastPeriod = q.clubs[q.clubs.length - 1]?.period;
      if (firstYear) {
        entry.era = lastPeriod?.includes('present') ? `${firstYear}–present` : `${firstYear}–2024`;
      }
    }
    const text = `${q.hints?.join(' ') || ''} ${q.explanation || ''}`;
    const nat = detectNationality(text);
    if (nat && !entry.nationality) entry.nationality = nat;
    const pos = detectPosition(text);
    if (pos && entry.position === 'MF') entry.position = pos;
  }
  if (Array.isArray(q.options)) {
    q.options.forEach((opt: string) => getOrCreatePlayer(opt, true));
  }
}

// 4. Ingest threeClubsQuestions.json (Dedicated player game)
const tcQuestions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'threeClubsQuestions.json'), 'utf8'));
for (const q of tcQuestions) {
  const entry = getOrCreatePlayer(q.correctAnswer, true);
  if (entry) {
    if (Array.isArray(q.clubs)) {
      q.clubs.forEach((c: string) => {
        if (clubMap.has(c)) entry.clubs.add(c);
      });
    }
    if (q.playerClubStints) {
      Object.keys(q.playerClubStints).forEach((c: string) => {
        if (clubMap.has(c)) entry.clubs.add(c);
      });
    }
    const text = `${q.hints?.join(' ') || ''} ${q.explanation || ''}`;
    const nat = detectNationality(text);
    if (nat && !entry.nationality) entry.nationality = nat;
    const pos = detectPosition(text);
    if (pos && entry.position === 'MF') entry.position = pos;
    extractClubsFromText(text).forEach((c) => entry.clubs.add(c));
  }
  if (Array.isArray(q.options)) {
    q.options.forEach((opt: string) => getOrCreatePlayer(opt, true));
  }
}

// 5. Ingest jumbledNameQuestions.json (Dedicated player game)
const jnQuestions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'jumbledNameQuestions.json'), 'utf8'));
for (const q of jnQuestions) {
  const entry = getOrCreatePlayer(q.correctAnswer, true);
  if (entry) {
    if (q.nationality) entry.nationality = q.nationality;
    if (q.position) entry.position = q.position;
    if (q.era) entry.era = q.era;
    const text = `${q.hints?.join(' ') || ''} ${q.explanation || ''}`;
    extractClubsFromText(text).forEach((c) => entry.clubs.add(c));
  }
  if (Array.isArray(q.options)) {
    q.options.forEach((opt: string) => getOrCreatePlayer(opt, true));
  }
}

// 6. Ingest guessPlayerQuestions.json (Dedicated player game)
const gpQuestions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'guessPlayerQuestions.json'), 'utf8'));
for (const q of gpQuestions) {
  const entry = getOrCreatePlayer(q.correctAnswer, true);
  if (entry) {
    if (Array.isArray(q.clues)) {
      q.clues.forEach((c: any) => {
        if (c.label === 'Nationality' && c.value && !entry.nationality) {
          entry.nationality = c.value.trim();
        }
        if (c.label === 'Position' && c.value) {
          const p = detectPosition(c.value);
          if (p) entry.position = p;
        }
        if (c.label === 'Club Era' && c.value) {
          extractClubsFromText(c.value).forEach((cl) => entry.clubs.add(cl));
        }
      });
    }
    const text = `${q.hints?.join(' ') || ''} ${q.explanation || ''}`;
    const nat = detectNationality(text);
    if (nat && !entry.nationality) entry.nationality = nat;
    const pos = detectPosition(text);
    if (pos && entry.position === 'MF') entry.position = pos;
    extractClubsFromText(text).forEach((cl) => entry.clubs.add(cl));
  }
  if (Array.isArray(q.options)) {
    q.options.forEach((opt: string) => getOrCreatePlayer(opt, true));
  }
}

// 7. Ingest shirtNumberQuestions.json
const snQuestions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'shirtNumberQuestions.json'), 'utf8'));
for (const q of snQuestions) {
  const entry = getOrCreatePlayer(q.correctAnswer, false);
  if (entry) {
    const text = `${q.question || ''} ${q.hints?.join(' ') || ''} ${q.explanation || ''}`;
    const nat = detectNationality(text);
    if (nat && !entry.nationality) entry.nationality = nat;
    const pos = detectPosition(text);
    if (pos && entry.position === 'MF') entry.position = pos;
    extractClubsFromText(text).forEach((cl) => entry.clubs.add(cl));
  }
  if (Array.isArray(q.options)) {
    q.options.forEach((opt: string) => getOrCreatePlayer(opt, false));
  }
}

// 8. Ingest footballQuizQuestions.json & transferQuizQuestions.json
for (const filename of ['footballQuizQuestions.json', 'transferQuizQuestions.json']) {
  const list = JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
  for (const q of list) {
    const entry = getOrCreatePlayer(q.correctAnswer, false);
    if (entry) {
      const text = `${q.question || ''} ${q.hints?.join(' ') || ''} ${q.explanation || ''}`;
      const nat = detectNationality(text);
      if (nat && !entry.nationality) entry.nationality = nat;
      const pos = detectPosition(text);
      if (pos && entry.position === 'MF') entry.position = pos;
      extractClubsFromText(text).forEach((cl) => entry.clubs.add(cl));
    }
    if (Array.isArray(q.options)) {
      q.options.forEach((opt: string) => getOrCreatePlayer(opt, false));
    }
  }
}

// Normalize player list
const finalPlayers = Array.from(playerMap.values()).map((p) => ({
  id: p.id,
  name: p.name,
  nationality: p.nationality || 'International',
  position: p.position || 'MF',
  era: p.era || '2010–present',
  clubs: Array.from(p.clubs),
}));

finalPlayers.sort((a, b) => a.name.localeCompare(b.name));

console.log(`Total valid consolidated players: ${finalPlayers.length}`);
console.log(`Players with detected clubs: ${finalPlayers.filter((p) => p.clubs.length > 0).length}`);
console.log(`Players with detected nationality: ${finalPlayers.filter((p) => p.nationality !== 'International').length}`);

// Write back to src/data/players.json
fs.writeFileSync(
  path.join(DATA_DIR, 'players.json'),
  JSON.stringify(finalPlayers, null, 2) + '\n',
  'utf8'
);

console.log('Successfully wrote to src/data/players.json!');
