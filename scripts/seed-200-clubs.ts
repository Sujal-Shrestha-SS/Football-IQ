import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clubsFilePath = path.resolve(__dirname, '../src/data/clubs.json');

interface Club {
  id: string;
  name: string;
  shortName: string;
  country: string;
  league: string;
  primaryColor: string;
  secondaryColor: string;
}

const existingClubs: Club[] = JSON.parse(fs.readFileSync(clubsFilePath, 'utf8'));
const existingMap = new Map<string, Club>();
existingClubs.forEach((c) => existingMap.set(c.id, c));

const additionalClubs: Club[] = [
  // ==========================================
  // ENGLAND - PREMIER LEAGUE & CHAMPIONSHIP
  // ==========================================
  { id: 'brighton', name: 'Brighton & Hove Albion', shortName: 'BHA', country: 'England', league: 'Premier League', primaryColor: '#0057B8', secondaryColor: '#FFCD00' },
  { id: 'brentford', name: 'Brentford FC', shortName: 'BRE', country: 'England', league: 'Premier League', primaryColor: '#D20000', secondaryColor: '#000000' },
  { id: 'fulham', name: 'Fulham FC', shortName: 'FUL', country: 'England', league: 'Premier League', primaryColor: '#000000', secondaryColor: '#CC0000' },
  { id: 'crystal-palace', name: 'Crystal Palace', shortName: 'CRY', country: 'England', league: 'Premier League', primaryColor: '#1B458F', secondaryColor: '#C4122E' },
  { id: 'wolves', name: 'Wolverhampton Wanderers', shortName: 'WOL', country: 'England', league: 'Premier League', primaryColor: '#FDB913', secondaryColor: '#231F20' },
  { id: 'bournemouth', name: 'AFC Bournemouth', shortName: 'BOU', country: 'England', league: 'Premier League', primaryColor: '#DA291C', secondaryColor: '#000000' },
  { id: 'nottingham-forest', name: 'Nottingham Forest', shortName: 'NFO', country: 'England', league: 'Premier League', primaryColor: '#DD0000', secondaryColor: '#FFFFFF' },
  { id: 'southampton', name: 'Southampton FC', shortName: 'SOU', country: 'England', league: 'Premier League', primaryColor: '#D71920', secondaryColor: '#130C0E' },
  { id: 'ipswich', name: 'Ipswich Town', shortName: 'IPS', country: 'England', league: 'Premier League', primaryColor: '#003399', secondaryColor: '#FFFFFF' },
  { id: 'burnley', name: 'Burnley FC', shortName: 'BUR', country: 'England', league: 'Championship', primaryColor: '#6C1D45', secondaryColor: '#99D6EA' },
  { id: 'sheffield-united', name: 'Sheffield United', shortName: 'SHU', country: 'England', league: 'Championship', primaryColor: '#EE2737', secondaryColor: '#000000' },
  { id: 'luton', name: 'Luton Town', shortName: 'LUT', country: 'England', league: 'Championship', primaryColor: '#F78F1E', secondaryColor: '#002D62' },
  { id: 'leeds', name: 'Leeds United', shortName: 'LEE', country: 'England', league: 'Championship', primaryColor: '#FFCD00', secondaryColor: '#1D428A' },
  { id: 'norwich', name: 'Norwich City', shortName: 'NOR', country: 'England', league: 'Championship', primaryColor: '#FFF200', secondaryColor: '#00A651' },
  { id: 'watford', name: 'Watford FC', shortName: 'WAT', country: 'England', league: 'Championship', primaryColor: '#FBEE23', secondaryColor: '#ED2127' },
  { id: 'west-brom', name: 'West Bromwich Albion', shortName: 'WBA', country: 'England', league: 'Championship', primaryColor: '#122F67', secondaryColor: '#FFFFFF' },
  { id: 'sunderland', name: 'Sunderland AFC', shortName: 'SUN', country: 'England', league: 'Championship', primaryColor: '#EB172B', secondaryColor: '#000000' },
  { id: 'middlesbrough', name: 'Middlesbrough FC', shortName: 'MID', country: 'England', league: 'Championship', primaryColor: '#D00027', secondaryColor: '#FFFFFF' },
  { id: 'swansea-city', name: 'Swansea City', shortName: 'SWA', country: 'England', league: 'Championship', primaryColor: '#000000', secondaryColor: '#FFFFFF' },
  { id: 'stoke-city', name: 'Stoke City', shortName: 'STK', country: 'England', league: 'Championship', primaryColor: '#E03A3E', secondaryColor: '#1B449C' },
  { id: 'hull-city', name: 'Hull City', shortName: 'HUL', country: 'England', league: 'Championship', primaryColor: '#F5A623', secondaryColor: '#000000' },
  { id: 'qpr', name: 'Queens Park Rangers', shortName: 'QPR', country: 'England', league: 'Championship', primaryColor: '#1D5BA4', secondaryColor: '#FFFFFF' },
  { id: 'blackburn', name: 'Blackburn Rovers', shortName: 'BLB', country: 'England', league: 'Championship', primaryColor: '#009EE0', secondaryColor: '#ED1C24' },
  { id: 'derby-county', name: 'Derby County', shortName: 'DER', country: 'England', league: 'Championship', primaryColor: '#000000', secondaryColor: '#FFFFFF' },
  { id: 'coventry', name: 'Coventry City', shortName: 'COV', country: 'England', league: 'Championship', primaryColor: '#53B0E5', secondaryColor: '#002B49' },
  { id: 'cardiff-city', name: 'Cardiff City', shortName: 'CAR', country: 'England', league: 'Championship', primaryColor: '#0070B8', secondaryColor: '#D12631' },
  { id: 'bristol-city', name: 'Bristol City', shortName: 'BRC', country: 'England', league: 'Championship', primaryColor: '#CC0000', secondaryColor: '#FFFFFF' },
  { id: 'preston', name: 'Preston North End', shortName: 'PNE', country: 'England', league: 'Championship', primaryColor: '#FFFFFF', secondaryColor: '#002F6C' },
  { id: 'millwall', name: 'Millwall FC', shortName: 'MIL', country: 'England', league: 'Championship', primaryColor: '#001A4B', secondaryColor: '#FFFFFF' },
  { id: 'wigan', name: 'Wigan Athletic', shortName: 'WIG', country: 'England', league: 'League One', primaryColor: '#003399', secondaryColor: '#FFFFFF' },
  { id: 'portsmouth', name: 'Portsmouth FC', shortName: 'POR', country: 'England', league: 'Championship', primaryColor: '#001489', secondaryColor: '#DA291C' },
  { id: 'birmingham', name: 'Birmingham City', shortName: 'BIR', country: 'England', league: 'League One', primaryColor: '#0000FF', secondaryColor: '#FFFFFF' },
  { id: 'reading', name: 'Reading FC', shortName: 'REA', country: 'England', league: 'League One', primaryColor: '#004494', secondaryColor: '#FFFFFF' },
  { id: 'huddersfield', name: 'Huddersfield Town', shortName: 'HUD', country: 'England', league: 'League One', primaryColor: '#0E63AD', secondaryColor: '#FFFFFF' },

  // ==========================================
  // SPAIN - LA LIGA & SEGUNDA
  // ==========================================
  { id: 'athletic-bilbao', name: 'Athletic Club Bilbao', shortName: 'ATH', country: 'Spain', league: 'La Liga', primaryColor: '#EE2524', secondaryColor: '#000000' },
  { id: 'real-sociedad', name: 'Real Sociedad', shortName: 'RSO', country: 'Spain', league: 'La Liga', primaryColor: '#0067B1', secondaryColor: '#FFFFFF' },
  { id: 'villarreal', name: 'Villarreal CF', shortName: 'VIL', country: 'Spain', league: 'La Liga', primaryColor: '#FFE600', secondaryColor: '#00519E' },
  { id: 'real-betis', name: 'Real Betis', shortName: 'BET', country: 'Spain', league: 'La Liga', primaryColor: '#0BB364', secondaryColor: '#FFFFFF' },
  { id: 'valencia', name: 'Valencia CF', shortName: 'VAL', country: 'Spain', league: 'La Liga', primaryColor: '#FFFFFF', secondaryColor: '#000000' },
  { id: 'celta-vigo', name: 'Celta de Vigo', shortName: 'CEL', country: 'Spain', league: 'La Liga', primaryColor: '#8AC3EE', secondaryColor: '#C8102E' },
  { id: 'osasuna', name: 'CA Osasuna', shortName: 'OSA', country: 'Spain', league: 'La Liga', primaryColor: '#0A1C2A', secondaryColor: '#D91A2A' },
  { id: 'getafe', name: 'Getafe CF', shortName: 'GET', country: 'Spain', league: 'La Liga', primaryColor: '#005CA9', secondaryColor: '#D91A2A' },
  { id: 'rayo-vallecano', name: 'Rayo Vallecano', shortName: 'RAY', country: 'Spain', league: 'La Liga', primaryColor: '#FFFFFF', secondaryColor: '#D81E05' },
  { id: 'girona', name: 'Girona FC', shortName: 'GIR', country: 'Spain', league: 'La Liga', primaryColor: '#CD1317', secondaryColor: '#FFFFFF' },
  { id: 'mallorca', name: 'RCD Mallorca', shortName: 'MLL', country: 'Spain', league: 'La Liga', primaryColor: '#E20613', secondaryColor: '#000000' },
  { id: 'alaves', name: 'Deportivo Alavés', shortName: 'ALA', country: 'Spain', league: 'La Liga', primaryColor: '#005BAC', secondaryColor: '#FFFFFF' },
  { id: 'las-palmas', name: 'UD Las Palmas', shortName: 'LPA', country: 'Spain', league: 'La Liga', primaryColor: '#FFD700', secondaryColor: '#005BAC' },
  { id: 'espanol', name: 'RCD Espanyol', shortName: 'ESP', country: 'Spain', league: 'La Liga', primaryColor: '#007FC8', secondaryColor: '#FFFFFF' },
  { id: 'valladolid', name: 'Real Valladolid', shortName: 'VLD', country: 'Spain', league: 'La Liga', primaryColor: '#582C83', secondaryColor: '#FFFFFF' },
  { id: 'leganes', name: 'CD Leganés', shortName: 'LEG', country: 'Spain', league: 'La Liga', primaryColor: '#005BAC', secondaryColor: '#FFFFFF' },
  { id: 'granada', name: 'Granada CF', shortName: 'GRA', country: 'Spain', league: 'Segunda División', primaryColor: '#C8102E', secondaryColor: '#002F6C' },
  { id: 'cadiz', name: 'Cádiz CF', shortName: 'CAD', country: 'Spain', league: 'Segunda División', primaryColor: '#FFD700', secondaryColor: '#003399' },
  { id: 'almeria', name: 'UD Almería', shortName: 'ALM', country: 'Spain', league: 'Segunda División', primaryColor: '#ED1C24', secondaryColor: '#FFFFFF' },
  { id: 'elche', name: 'Elche CF', shortName: 'ELC', country: 'Spain', league: 'Segunda División', primaryColor: '#008751', secondaryColor: '#FFFFFF' },
  { id: 'levante', name: 'Levante UD', shortName: 'LEV', country: 'Spain', league: 'Segunda División', primaryColor: '#8C1D40', secondaryColor: '#0047AB' },
  { id: 'eibar', name: 'SD Eibar', shortName: 'EIB', country: 'Spain', league: 'Segunda División', primaryColor: '#9B1B30', secondaryColor: '#003366' },
  { id: 'zaragoza', name: 'Real Zaragoza', shortName: 'ZAR', country: 'Spain', league: 'Segunda División', primaryColor: '#003399', secondaryColor: '#FFFFFF' },
  { id: 'sporting-gijon', name: 'Sporting de Gijón', shortName: 'RSG', country: 'Spain', league: 'Segunda División', primaryColor: '#DA291C', secondaryColor: '#FFFFFF' },
  { id: 'malaga', name: 'Málaga CF', shortName: 'MAL', country: 'Spain', league: 'Segunda División', primaryColor: '#0077C8', secondaryColor: '#FFFFFF' },
  { id: 'deportivo-la-coruna', name: 'Deportivo La Coruña', shortName: 'RCD', country: 'Spain', league: 'Segunda División', primaryColor: '#0055A5', secondaryColor: '#FFFFFF' },
  { id: 'racing-santander', name: 'Racing Santander', shortName: 'RAC', country: 'Spain', league: 'Segunda División', primaryColor: '#008057', secondaryColor: '#000000' },
  { id: 'oviedo', name: 'Real Oviedo', shortName: 'ROV', country: 'Spain', league: 'Segunda División', primaryColor: '#0047AB', secondaryColor: '#FFFFFF' },
  { id: 'tenerife', name: 'CD Tenerife', shortName: 'TEN', country: 'Spain', league: 'Segunda División', primaryColor: '#003399', secondaryColor: '#FFFFFF' },
  { id: 'huesca', name: 'SD Huesca', shortName: 'HUE', country: 'Spain', league: 'Segunda División', primaryColor: '#8B0000', secondaryColor: '#002147' },

  // ==========================================
  // ITALY - SERIE A & SERIE B
  // ==========================================
  { id: 'atalanta', name: 'Atalanta BC', shortName: 'ATA', country: 'Italy', league: 'Serie A', primaryColor: '#1E71B8', secondaryColor: '#000000' },
  { id: 'fiorentina', name: 'ACF Fiorentina', shortName: 'FIO', country: 'Italy', league: 'Serie A', primaryColor: '#4F2683', secondaryColor: '#FFFFFF' },
  { id: 'bologna', name: 'Bologna FC 1909', shortName: 'BOL', country: 'Italy', league: 'Serie A', primaryColor: '#1A2B4C', secondaryColor: '#9E1B32' },
  { id: 'torino', name: 'Torino FC', shortName: 'TOR', country: 'Italy', league: 'Serie A', primaryColor: '#8B1E41', secondaryColor: '#FFFFFF' },
  { id: 'udinese', name: 'Udinese Calcio', shortName: 'UDI', country: 'Italy', league: 'Serie A', primaryColor: '#000000', secondaryColor: '#FFFFFF' },
  { id: 'monza', name: 'AC Monza', shortName: 'MON', country: 'Italy', league: 'Serie A', primaryColor: '#D12631', secondaryColor: '#FFFFFF' },
  { id: 'genoa', name: 'Genoa CFC', shortName: 'GEN', country: 'Italy', league: 'Serie A', primaryColor: '#C8102E', secondaryColor: '#0C2340' },
  { id: 'sampdoria', name: 'UC Sampdoria', shortName: 'SAM', country: 'Italy', league: 'Serie B', primaryColor: '#005BAA', secondaryColor: '#E20613' },
  { id: 'cagliari', name: 'Cagliari Calcio', shortName: 'CAG', country: 'Italy', league: 'Serie A', primaryColor: '#C8102E', secondaryColor: '#002F6C' },
  { id: 'verona', name: 'Hellas Verona', shortName: 'VER', country: 'Italy', league: 'Serie A', primaryColor: '#002F6C', secondaryColor: '#FFD700' },
  { id: 'empoli', name: 'Empoli FC', shortName: 'EMP', country: 'Italy', league: 'Serie A', primaryColor: '#005CA9', secondaryColor: '#FFFFFF' },
  { id: 'lecce', name: 'US Lecce', shortName: 'LEC', country: 'Italy', league: 'Serie A', primaryColor: '#FFD700', secondaryColor: '#C8102E' },
  { id: 'parma', name: 'Parma Calcio 1913', shortName: 'PAR', country: 'Italy', league: 'Serie A', primaryColor: '#FFD700', secondaryColor: '#003399' },
  { id: 'como', name: 'Como 1907', shortName: 'COM', country: 'Italy', league: 'Serie A', primaryColor: '#0047AB', secondaryColor: '#FFFFFF' },
  { id: 'venezia', name: 'Venezia FC', shortName: 'VEN', country: 'Italy', league: 'Serie A', primaryColor: '#000000', secondaryColor: '#FF7900' },
  { id: 'sassuolo', name: 'US Sassuolo', shortName: 'SAS', country: 'Italy', league: 'Serie B', primaryColor: '#008751', secondaryColor: '#000000' },
  { id: 'frosinone', name: 'Frosinone Calcio', shortName: 'FRO', country: 'Italy', league: 'Serie B', primaryColor: '#FFD700', secondaryColor: '#003399' },
  { id: 'salernitana', name: 'US Salernitana 1919', shortName: 'SAL', country: 'Italy', league: 'Serie B', primaryColor: '#800000', secondaryColor: '#FFFFFF' },
  { id: 'spezia', name: 'Spezia Calcio', shortName: 'SPE', country: 'Italy', league: 'Serie B', primaryColor: '#000000', secondaryColor: '#FFFFFF' },
  { id: 'cremonese', name: 'US Cremonese', shortName: 'CRE', country: 'Italy', league: 'Serie B', primaryColor: '#808080', secondaryColor: '#C8102E' },
  { id: 'palermo', name: 'Palermo FC', shortName: 'PAL', country: 'Italy', league: 'Serie B', primaryColor: '#FFB6C1', secondaryColor: '#000000' },
  { id: 'bari', name: 'SSC Bari', shortName: 'BARI', country: 'Italy', league: 'Serie B', primaryColor: '#D71920', secondaryColor: '#FFFFFF' },
  { id: 'brescia', name: 'Brescia Calcio', shortName: 'BRE', country: 'Italy', league: 'Serie B', primaryColor: '#003399', secondaryColor: '#FFFFFF' },
  { id: 'chievo-verona', name: 'Chievo Verona', shortName: 'CHI', country: 'Italy', league: 'Serie B', primaryColor: '#FFD700', secondaryColor: '#003399' },
  { id: 'spal', name: 'SPAL', shortName: 'SPA', country: 'Italy', league: 'Serie C', primaryColor: '#87CEEB', secondaryColor: '#FFFFFF' },
  { id: 'benevento', name: 'Benevento Calcio', shortName: 'BEN', country: 'Italy', league: 'Serie C', primaryColor: '#FFD700', secondaryColor: '#D71920' },
  { id: 'crotone', name: 'FC Crotone', shortName: 'CRO', country: 'Italy', league: 'Serie C', primaryColor: '#8B0000', secondaryColor: '#002F6C' },
  { id: 'pisa', name: 'Pisa Sporting Club', shortName: 'PIS', country: 'Italy', league: 'Serie B', primaryColor: '#003399', secondaryColor: '#000000' },
  { id: 'modena', name: 'Modena FC', shortName: 'MOD', country: 'Italy', league: 'Serie B', primaryColor: '#FFD700', secondaryColor: '#003399' },
  { id: 'cesena', name: 'Cesena FC', shortName: 'CES', country: 'Italy', league: 'Serie B', primaryColor: '#000000', secondaryColor: '#FFFFFF' },

  // ==========================================
  // GERMANY - BUNDESLIGA & 2. BUNDESLIGA
  // ==========================================
  { id: 'frankfurt', name: 'Eintracht Frankfurt', shortName: 'SGE', country: 'Germany', league: 'Bundesliga', primaryColor: '#E1000F', secondaryColor: '#000000' },
  { id: 'wolfsburg', name: 'VfL Wolfsburg', shortName: 'WOB', country: 'Germany', league: 'Bundesliga', primaryColor: '#65B32E', secondaryColor: '#FFFFFF' },
  { id: 'stuttgart', name: 'VfB Stuttgart', shortName: 'VFB', country: 'Germany', league: 'Bundesliga', primaryColor: '#E30613', secondaryColor: '#FFFFFF' },
  { id: 'monchengladbach', name: 'Borussia Mönchengladbach', shortName: 'BMG', country: 'Germany', league: 'Bundesliga', primaryColor: '#000000', secondaryColor: '#008542' },
  { id: 'freiburg', name: 'SC Freiburg', shortName: 'SCF', country: 'Germany', league: 'Bundesliga', primaryColor: '#000000', secondaryColor: '#E20613' },
  { id: 'hoffenheim', name: 'TSG 1899 Hoffenheim', shortName: 'TSG', country: 'Germany', league: 'Bundesliga', primaryColor: '#005CA9', secondaryColor: '#FFFFFF' },
  { id: 'werder-bremen', name: 'SV Werder Bremen', shortName: 'SVW', country: 'Germany', league: 'Bundesliga', primaryColor: '#1D9053', secondaryColor: '#FFFFFF' },
  { id: 'mainz', name: '1. FSV Mainz 05', shortName: 'M05', country: 'Germany', league: 'Bundesliga', primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },
  { id: 'augsburg', name: 'FC Augsburg', shortName: 'FCA', country: 'Germany', league: 'Bundesliga', primaryColor: '#BA171D', secondaryColor: '#00654D' },
  { id: 'union-berlin', name: '1. FC Union Berlin', shortName: 'FCU', country: 'Germany', league: 'Bundesliga', primaryColor: '#ED1C24', secondaryColor: '#FFDE00' },
  { id: 'heidenheim', name: '1. FC Heidenheim', shortName: 'FCH', country: 'Germany', league: 'Bundesliga', primaryColor: '#C8102E', secondaryColor: '#003399' },
  { id: 'bochum', name: 'VfL Bochum', shortName: 'BOC', country: 'Germany', league: 'Bundesliga', primaryColor: '#005CA9', secondaryColor: '#FFFFFF' },
  { id: 'st-pauli', name: 'FC St. Pauli', shortName: 'STP', country: 'Germany', league: 'Bundesliga', primaryColor: '#5B3926', secondaryColor: '#FFFFFF' },
  { id: 'holstein-kiel', name: 'Holstein Kiel', shortName: 'KSV', country: 'Germany', league: 'Bundesliga', primaryColor: '#003399', secondaryColor: '#ED1C24' },
  { id: 'schalke', name: 'FC Schalke 04', shortName: 'S04', country: 'Germany', league: '2. Bundesliga', primaryColor: '#004D9D', secondaryColor: '#FFFFFF' },
  { id: 'hamburg', name: 'Hamburger SV', shortName: 'HSV', country: 'Germany', league: '2. Bundesliga', primaryColor: '#003399', secondaryColor: '#000000' },
  { id: 'koln', name: '1. FC Köln', shortName: 'KOE', country: 'Germany', league: '2. Bundesliga', primaryColor: '#ED1C24', secondaryColor: '#FFFFFF' },
  { id: 'hertha-berlin', name: 'Hertha BSC', shortName: 'BSC', country: 'Germany', league: '2. Bundesliga', primaryColor: '#004192', secondaryColor: '#FFFFFF' },
  { id: 'fortuna-dusseldorf', name: 'Fortuna Düsseldorf', shortName: 'F95', country: 'Germany', league: '2. Bundesliga', primaryColor: '#D00027', secondaryColor: '#FFFFFF' },
  { id: 'hannover', name: 'Hannover 96', shortName: 'H96', country: 'Germany', league: '2. Bundesliga', primaryColor: '#008000', secondaryColor: '#000000' },
  { id: 'nurnberg', name: '1. FC Nürnberg', shortName: 'FCN', country: 'Germany', league: '2. Bundesliga', primaryColor: '#8C1D40', secondaryColor: '#FFFFFF' },
  { id: 'kaiserslautern', name: '1. FC Kaiserslautern', shortName: 'FCK', country: 'Germany', league: '2. Bundesliga', primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },
  { id: 'darmstadt', name: 'SV Darmstadt 98', shortName: 'D98', country: 'Germany', league: '2. Bundesliga', primaryColor: '#005CA9', secondaryColor: '#FFFFFF' },
  { id: 'karlsruher', name: 'Karlsruher SC', shortName: 'KSC', country: 'Germany', league: '2. Bundesliga', primaryColor: '#003399', secondaryColor: '#FFFFFF' },
  { id: 'paderborn', name: 'SC Paderborn 07', shortName: 'SCP', country: 'Germany', league: '2. Bundesliga', primaryColor: '#005CA9', secondaryColor: '#000000' },
  { id: 'greuther-furth', name: 'SpVgg Greuther Fürth', shortName: 'SGF', country: 'Germany', league: '2. Bundesliga', primaryColor: '#009640', secondaryColor: '#FFFFFF' },
  { id: 'arminia-bielefeld', name: 'Arminia Bielefeld', shortName: 'DSC', country: 'Germany', league: '3. Liga', primaryColor: '#003399', secondaryColor: '#000000' },
  { id: 'braunschweig', name: 'Eintracht Braunschweig', shortName: 'EBS', country: 'Germany', league: '2. Bundesliga', primaryColor: '#FFD700', secondaryColor: '#003399' },
  { id: 'ingolstadt', name: 'FC Ingolstadt 04', shortName: 'FCI', country: 'Germany', league: '3. Liga', primaryColor: '#CC0000', secondaryColor: '#000000' },
  { id: 'hansa-rostock', name: 'F.C. Hansa Rostock', shortName: 'FCH', country: 'Germany', league: '3. Liga', primaryColor: '#003399', secondaryColor: '#FFFFFF' },

  // ==========================================
  // FRANCE - LIGUE 1 & LIGUE 2
  // ==========================================
  { id: 'marseille', name: 'Olympique de Marseille', shortName: 'OM', country: 'France', league: 'Ligue 1', primaryColor: '#009FE3', secondaryColor: '#FFFFFF' },
  { id: 'lille', name: 'LOSC Lille', shortName: 'LOSC', country: 'France', league: 'Ligue 1', primaryColor: '#E20613', secondaryColor: '#0C2340' },
  { id: 'lens', name: 'RC Lens', shortName: 'RCL', country: 'France', league: 'Ligue 1', primaryColor: '#FFD700', secondaryColor: '#C8102E' },
  { id: 'rennes', name: 'Stade Rennais FC', shortName: 'SRFC', country: 'France', league: 'Ligue 1', primaryColor: '#C8102E', secondaryColor: '#000000' },
  { id: 'nice', name: 'OGC Nice', shortName: 'OGCN', country: 'France', league: 'Ligue 1', primaryColor: '#C8102E', secondaryColor: '#000000' },
  { id: 'reims', name: 'Stade de Reims', shortName: 'SDR', country: 'France', league: 'Ligue 1', primaryColor: '#E20613', secondaryColor: '#FFFFFF' },
  { id: 'strasbourg', name: 'RC Strasbourg Alsace', shortName: 'RCSA', country: 'France', league: 'Ligue 1', primaryColor: '#005CA9', secondaryColor: '#FFFFFF' },
  { id: 'toulouse', name: 'Toulouse FC', shortName: 'TFC', country: 'France', league: 'Ligue 1', primaryColor: '#582C83', secondaryColor: '#FFFFFF' },
  { id: 'montpellier', name: 'Montpellier HSC', shortName: 'MHSC', country: 'France', league: 'Ligue 1', primaryColor: '#002F6C', secondaryColor: '#F26522' },
  { id: 'nantes', name: 'FC Nantes', shortName: 'FCN', country: 'France', league: 'Ligue 1', primaryColor: '#FFD700', secondaryColor: '#008542' },
  { id: 'brest', name: 'Stade Brestois 29', shortName: 'SB29', country: 'France', league: 'Ligue 1', primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },
  { id: 'auxerre', name: 'AJ Auxerre', shortName: 'AJA', country: 'France', league: 'Ligue 1', primaryColor: '#005CA9', secondaryColor: '#FFFFFF' },
  { id: 'angers', name: 'Angers SCO', shortName: 'SCO', country: 'France', league: 'Ligue 1', primaryColor: '#000000', secondaryColor: '#FFFFFF' },
  { id: 'saint-etienne', name: 'AS Saint-Étienne', shortName: 'ASSE', country: 'France', league: 'Ligue 1', primaryColor: '#008542', secondaryColor: '#FFFFFF' },
  { id: 'le-havre', name: 'Le Havre AC', shortName: 'HAC', country: 'France', league: 'Ligue 1', primaryColor: '#87CEEB', secondaryColor: '#002F6C' },
  { id: 'lorient', name: 'FC Lorient', shortName: 'FCL', country: 'France', league: 'Ligue 2', primaryColor: '#F26522', secondaryColor: '#000000' },
  { id: 'metz', name: 'FC Metz', shortName: 'FCM', country: 'France', league: 'Ligue 2', primaryColor: '#800020', secondaryColor: '#FFFFFF' },
  { id: 'clermont', name: 'Clermont Foot 63', shortName: 'CF63', country: 'France', league: 'Ligue 2', primaryColor: '#8B0000', secondaryColor: '#002F6C' },
  { id: 'bordeaux', name: 'Girondins de Bordeaux', shortName: 'FCGB', country: 'France', league: 'National 2', primaryColor: '#002F6C', secondaryColor: '#FFFFFF' },
  { id: 'troyes', name: 'ESTAC Troyes', shortName: 'ESTAC', country: 'France', league: 'Ligue 2', primaryColor: '#005CA9', secondaryColor: '#FFFFFF' },
  { id: 'guingamp', name: 'En Avant Guingamp', shortName: 'EAG', country: 'France', league: 'Ligue 2', primaryColor: '#C8102E', secondaryColor: '#000000' },
  { id: 'caen', name: 'SM Caen', shortName: 'SMC', country: 'France', league: 'Ligue 2', primaryColor: '#002F6C', secondaryColor: '#C8102E' },
  { id: 'dijon', name: 'Dijon FCO', shortName: 'DFCO', country: 'France', league: 'National', primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },
  { id: 'ajaccio', name: 'AC Ajaccio', shortName: 'ACA', country: 'France', league: 'Ligue 2', primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },
  { id: 'bastia', name: 'SC Bastia', shortName: 'SCB', country: 'France', league: 'Ligue 2', primaryColor: '#005CA9', secondaryColor: '#FFFFFF' },
  { id: 'sochaux', name: 'FC Sochaux-Montbéliard', shortName: 'FCSM', country: 'France', league: 'National', primaryColor: '#FFD700', secondaryColor: '#003399' },
  { id: 'paris-fc', name: 'Paris FC', shortName: 'PFC', country: 'France', league: 'Ligue 2', primaryColor: '#002F6C', secondaryColor: '#FFFFFF' },
  { id: 'amiens', name: 'Amiens SC', shortName: 'ASC', country: 'France', league: 'Ligue 2', primaryColor: '#FFFFFF', secondaryColor: '#000000' },
  { id: 'nancy', name: 'AS Nancy Lorraine', shortName: 'ASNL', country: 'France', league: 'National', primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },
  { id: 'valenciennes', name: 'Valenciennes FC', shortName: 'VAFC', country: 'France', league: 'National', primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },

  // ==========================================
  // OTHER NOTABLE EUROPEAN GIANTS
  // ==========================================
  { id: 'feyenoord', name: 'Feyenoord Rotterdam', shortName: 'FEY', country: 'Netherlands', league: 'Eredivisie', primaryColor: '#DA291C', secondaryColor: '#FFFFFF' },
  { id: 'psv', name: 'PSV Eindhoven', shortName: 'PSV', country: 'Netherlands', league: 'Eredivisie', primaryColor: '#ED1C24', secondaryColor: '#FFFFFF' },
  { id: 'az-alkmaar', name: 'AZ Alkmaar', shortName: 'AZ', country: 'Netherlands', league: 'Eredivisie', primaryColor: '#D00027', secondaryColor: '#FFFFFF' },
  { id: 'twente', name: 'FC Twente', shortName: 'TWE', country: 'Netherlands', league: 'Eredivisie', primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },
  { id: 'braga', name: 'SC Braga', shortName: 'SCB', country: 'Portugal', league: 'Primeira Liga', primaryColor: '#D00027', secondaryColor: '#FFFFFF' },
  { id: 'celtic', name: 'Celtic FC', shortName: 'CEL', country: 'Scotland', league: 'Scottish Premiership', primaryColor: '#018749', secondaryColor: '#FFFFFF' },
  { id: 'rangers', name: 'Rangers FC', shortName: 'RAN', country: 'Scotland', league: 'Scottish Premiership', primaryColor: '#003399', secondaryColor: '#C8102E' },
  { id: 'club-brugge', name: 'Club Brugge KV', shortName: 'CLU', country: 'Belgium', league: 'Belgian Pro League', primaryColor: '#005BA9', secondaryColor: '#000000' },
  { id: 'anderlecht', name: 'RSC Anderlecht', shortName: 'AND', country: 'Belgium', league: 'Belgian Pro League', primaryColor: '#582C83', secondaryColor: '#FFFFFF' },
  { id: 'galatasaray', name: 'Galatasaray SK', shortName: 'GAL', country: 'Turkey', league: 'Süper Lig', primaryColor: '#A90432', secondaryColor: '#FDB913' },
  { id: 'fenerbahce', name: 'Fenerbahçe SK', shortName: 'FEN', country: 'Turkey', league: 'Süper Lig', primaryColor: '#002D62', secondaryColor: '#FFED00' },
  { id: 'besiktas', name: 'Beşiktaş JK', shortName: 'BJK', country: 'Turkey', league: 'Süper Lig', primaryColor: '#000000', secondaryColor: '#FFFFFF' },
  { id: 'olympiacos', name: 'Olympiacos FC', shortName: 'OLY', country: 'Greece', league: 'Super League Greece', primaryColor: '#DA291C', secondaryColor: '#FFFFFF' },
  { id: 'shakhtar', name: 'Shakhtar Donetsk', shortName: 'SHK', country: 'Ukraine', league: 'Ukrainian Premier League', primaryColor: '#F15A24', secondaryColor: '#000000' },
  { id: 'dynamo-kyiv', name: 'Dynamo Kyiv', shortName: 'DYN', country: 'Ukraine', league: 'Ukrainian Premier League', primaryColor: '#005CA9', secondaryColor: '#FFFFFF' },
  { id: 'salzburg', name: 'FC Red Bull Salzburg', shortName: 'RBS', country: 'Austria', league: 'Austrian Bundesliga', primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },
];

let added = 0;
for (const club of additionalClubs) {
  if (!existingMap.has(club.id)) {
    existingClubs.push(club);
    existingMap.set(club.id, club);
    added++;
  }
}

fs.writeFileSync(clubsFilePath, JSON.stringify(existingClubs, null, 2), 'utf8');
console.log(`Successfully added ${added} new clubs. Total clubs in database: ${existingClubs.length}`);
