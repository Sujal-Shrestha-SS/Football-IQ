import 'dotenv/config';
import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const FOCUS_ANGLES = [
  'Serie A, Bundesliga, and Europa League cult heroes',
  'La Liga, Ligue 1, and Premier League mid-table standouts',
  'Champions League knockout unsung heroes and domestic cup winners',
  'Eredivisie, Liga Portugal, and international tournament surprises',
  'Promoted club stars, free transfers, and tactical utility players',
  'Goalkeepers, full-backs, and defensive midfielders post-2010',
];

function buildPrompt(
  mode: string,
  count: number,
  excludeAnswers: string[] = []
): string {
  const angle = FOCUS_ANGLES[Math.floor(Math.random() * FOCUS_ANGLES.length)];
  const uniqueBatchSeed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const cleanExcludes = excludeAnswers
    .map((a) => String(a).trim())
    .filter(Boolean)
    .slice(-45);
  const excludeRule =
    cleanExcludes.length > 0
      ? `\n- CRITICAL UNIQUENESS RULE: Do NOT use any of these previously asked players/answers: ${cleanExcludes.join(', ')}`
      : '';

  const base = `You are a football trivia expert. Generate ${count} unique football quiz questions (Batch ${uniqueBatchSeed}, spotlight on: ${angle}).
STRICT RULES:
- All players and events must be from 2010 onwards only
- Questions must be GENUINELY HARD — suitable for hardcore football fans, not casual viewers
- Avoid overused superstars as answers: do NOT make Messi, Ronaldo, Mbappé, or Haaland the answer more than once per generated batch
- Focus on: squad players who made pivotal contributions, cult heroes, niche transfers, obscure records, lesser-known award winners, players with surprising club moves, specific season stats of non-superstar players
- Good niche answer examples: Michu, Kasper Dolberg, Emil Forsberg, Sofiane Feghouli, Roberto Pereyra, Shinji Kagawa, Joel Matip, Jonjo Shelvey, Riyad Mahrez before 2016, the goalkeeper who saved penalties in a CL shootout, a free transfer who changed a title race
- options must be VERY PLAUSIBLE — same position, same era, same nationality or league — genuinely hard to distinguish
- Every correctAnswer must be 100% factually accurate — do not hallucinate stats, fees, or dates
- hints: never mention the player's name or nationality in hint 1. Work up gradually.
- explanation must cite a specific fact: year, stat, club, trophy, or record
- In the options array, place the correctAnswer at a RANDOM position (index 0, 1, 2, or 3), never always first${excludeRule}
- Return ONLY a valid JSON array, no markdown, no extra text`;

  const schemas: Record<string, string> = {
    'three-clubs': `${base}
MODE: Three Clubs. User sees 3 club badges and must name the player who played senior official matches for all three.
JSON schema for each question:
{
  "id": "tc-gen-<number>",
  "mode": "three-clubs",
  "difficulty": "expert",
  "category": "Three Clubs",
  "question": "Which player represented all three of these clubs?",
  "clubs": ["<club-id-1>", "<club-id-2>", "<club-id-3>"],
  "correctAnswer": "<Full Player Name>",
  "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
  "hints": ["<hint1>", "<hint2>", "<hint3>"],
  "playerClubStints": { "<club-id>": "<year-year>" },
  "explanation": "<factual explanation>"
}
Valid club IDs to use: man-city, man-united, liverpool, chelsea, arsenal, tottenham, real-madrid, barcelona, atletico-madrid, psg, bayern-munich, juventus, inter-milan, ac-milan, napoli, dortmund, ajax, porto, benfica, sevilla, lyon, roma, lazio, leicester, west-ham, everton, newcastle, aston-villa, rb-leipzig, leverkusen, monaco, sporting-cp`,

    'career-path': `${base}
MODE: Career Path. User sees a list of clubs in chronological order and must name the player.
JSON schema for each question:
{
  "id": "cp-gen-<number>",
  "mode": "career-path",
  "difficulty": "expert",
  "category": "Career Path",
  "question": "Which footballer followed this career path?",
  "clubs": [
    { "clubId": "<id>", "clubName": "<name>", "period": "<YYYY-YYYY>", "apps": <number>, "goals": <number> }
  ],
  "correctAnswer": "<Full Player Name>",
  "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
  "hints": ["<hint1>", "<hint2>", "<hint3>"],
  "explanation": "<factual explanation>"
}
Include 3 to 5 clubs in the career path. All club stints must start from 2010 or later.`,

    'guess-player': `${base}
MODE: Guess Player. User sees progressive clues and must identify the footballer. Mix subType between "clues", "stats", and "silhouette" (for silhouette, provide exactly 5 clues ordered: Nationality, Position, Club Era, Trophy, Key Stat).
JSON schema for each question:
{
  "id": "gp-gen-<number>",
  "mode": "guess-player",
  "difficulty": "expert",
  "category": "Player Clues",
  "subType": "clues",
  "question": "Who is this footballer?",
  "clues": [
    { "label": "Nationality", "value": "<value>" },
    { "label": "Position", "value": "<value>" },
    { "label": "Club Era", "value": "<value>" },
    { "label": "Trophy", "value": "<value>" },
    { "label": "Key Stat", "value": "<value>" }
  ],
  "correctAnswer": "<Full Player Name>",
  "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
  "hints": ["<hint1>", "<hint2>", "<hint3>"],
  "explanation": "<factual explanation>"
}`,

    'football-quiz': `${base}
MODE: Football Quiz. Standard multiple choice trivia about football facts, records, and history post-2010.
JSON schema for each question:
{
  "id": "fq-gen-<number>",
  "mode": "football-quiz",
  "difficulty": "expert",
  "category": "<Premier League|La Liga|Serie A|Bundesliga|Ligue 1|Champions League|World Cup|Transfers>",
  "question": "<specific trivia question>",
  "correctAnswer": "<answer>",
  "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
  "hints": ["<hint1>", "<hint2>", "<hint3>"],
  "explanation": "<factual explanation>"
}
Vary categories across the ${count} questions. Focus on records, stats, lesser-known award winners, finals, clubs.`,

    'jumbled-name': `${base}
MODE: Jumbled Name. User sees a scrambled version of a footballer's name and must identify them.
JSON schema for each question:
{
  "id": "jn-gen-<number>",
  "mode": "jumbled-name",
  "difficulty": "expert",
  "category": "Jumbled Name",
  "question": "Unscramble the letters to find the footballer:",
  "correctAnswer": "<Full Player Name>",
  "jumbledLetters": "<ALL LETTERS UPPERCASE NO SPACES SCRAMBLED>",
  "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
  "hints": ["<hint1: club/league clue without name or nationality>", "<hint2: trophy/stat/career clue>", "<hint3: nationality and defining career detail>"],
  "explanation": "<factual explanation>",
  "nationality": "<country>",
  "position": "<GK|DF|MF|FW>",
  "era": "<e.g. 2015-present>"
}
CRITICAL FOR jumbled-name:
- hints MUST be 3 progressive clues (ordered easiest-to-hardest/most specific, never mentioning the player's name, and keeping nationality out of hint 1).
- For jumbledLetters: take the full name, remove spaces and accents, uppercase all letters, then scramble them randomly. Make sure jumbledLetters has the exact same letters as correctAnswer without spaces!`,

    'transfer-quiz': `${base}
MODE: Transfer Market Quiz. Questions about transfer fees, destination clubs, and seasons post-2010.
JSON schema for each question:
{
  "id": "tr-gen-<number>",
  "mode": "transfer-quiz",
  "difficulty": "expert",
  "category": "Transfers",
  "question": "<specific transfer question>",
  "correctAnswer": "<answer>",
  "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
  "hints": ["<hint1>", "<hint2>", "<hint3>"],
  "explanation": "<factual explanation including fee and year>"
}
Cover: niche transfers, swap deals, surprise moves, loan deals, free transfers, club-record signings outside the obvious 4 superstars. All post-2010.`,

    'shirt-number': `${base}
MODE: Shirt Number Quiz. Questions about which player wore a specific shirt number for a club or national team post-2010.
JSON schema for each question:
{
  "id": "sn-gen-<number>",
  "mode": "shirt-number",
  "difficulty": "expert",
  "category": "Shirt Numbers",
  "question": "<specific shirt number question>",
  "correctAnswer": "<player or number>",
  "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
  "hints": ["<hint1>", "<hint2>", "<hint3>"],
  "explanation": "<factual explanation>"
}
Focus on squad players, cult heroes, and memorable post-2010 number stories (e.g. Kagawa at Man Utd, Michu at Swansea, squad numbers in title races and UCL runs).`,
  };

  return schemas[mode] || '';
}

function safeParseJsonArray(rawText: string): Record<string, unknown>[] {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Attempt partial recovery if a large array response got truncated at the end
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > 0) {
      const candidate = cleaned.slice(0, lastBrace + 1);
      const startBracket = candidate.indexOf('[');
      if (startBracket >= 0) {
        try {
          const recovered = JSON.parse(`${candidate.slice(startBracket)}]`);
          if (Array.isArray(recovered)) return recovered;
        } catch {
          // Ignore recovery failure
        }
      }
    }
  }
  return [];
}

const MODE_SEED_FILE: Record<string, string> = {
  'three-clubs': 'threeClubsQuestions.json',
  'career-path': 'careerPathQuestions.json',
  'guess-player': 'guessPlayerQuestions.json',
  'football-quiz': 'footballQuizQuestions.json',
  'jumbled-name': 'jumbledNameQuestions.json',
  'transfer-quiz': 'transferQuizQuestions.json',
  'shirt-number': 'shirtNumberQuestions.json',
};

function shuffleServerArray<T>(arr: T[]): T[] {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

function readSeedQuestions(mode: string): Record<string, unknown>[] {
  const fileName = MODE_SEED_FILE[mode];
  if (!fileName) return [];
  const filePath = path.resolve(__dirname, 'src/data', fileName);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`[Server] Failed reading seed file ${fileName}:`, err);
    return [];
  }
}

const MODEL_CHAIN: Array<{ model: string; useThinkingLow: boolean }> = [
  { model: 'gemini-4-hydrogen', useThinkingLow: true },
  { model: 'gemini-3.1-flash-lite', useThinkingLow: false },
];
const modelCooldownUntil = new Map<string, number>();
const serverLeaguePoolCache = new Map<string, Record<string, unknown>[]>();

class QuotaExhaustedError extends Error {
  status = 429;
  constructor(message: string) {
    super(message);
  }
}

function isQuotaError(err: unknown): boolean {
  const e = err as { status?: number; code?: number; message?: string };
  const msg = String(e?.message || '');
  return (
    e?.status === 429 ||
    e?.code === 429 ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.toLowerCase().includes('quota')
  );
}

function getQuotaCooldownMs(err: unknown): number {
  const msg = String((err as { message?: string })?.message || '');
  if (msg.includes('PerMinute') || msg.includes('RPM') || msg.includes('TPM')) {
    return 60 * 1000;
  }
  return 15 * 60 * 1000;
}

async function generateJsonTextWithFallback(
  contents: string,
  maxOutputTokens?: number
): Promise<string> {
  if (!ai) {
    throw new Error('Gemini API key is not configured on the server');
  }

  let sawQuotaError = false;
  let lastError: unknown = null;

  for (const candidate of MODEL_CHAIN) {
    const blockedUntil = modelCooldownUntil.get(candidate.model) || 0;
    if (Date.now() < blockedUntil) {
      sawQuotaError = true;
      continue;
    }

    try {
      const config: Record<string, unknown> = {
        responseMimeType: 'application/json',
      };
      if (candidate.useThinkingLow) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }
      if (typeof maxOutputTokens === 'number') {
        config.maxOutputTokens = maxOutputTokens;
      }

      const response = await ai.models.generateContent({
        model: candidate.model,
        contents,
        config,
      });
      return response.text ?? '';
    } catch (err) {
      lastError = err;
      if (isQuotaError(err)) {
        sawQuotaError = true;
        const prevBlocked = modelCooldownUntil.get(candidate.model) || 0;
        const cooldownMs = getQuotaCooldownMs(err);
        modelCooldownUntil.set(candidate.model, Date.now() + cooldownMs);
        if (Date.now() >= prevBlocked) {
          console.warn(
            `[Server] Gemini quota limit reached on ${candidate.model}; cooling down ${Math.round(cooldownMs / 1000)}s.`
          );
        }
        continue;
      }
      throw err;
    }
  }

  if (sawQuotaError) {
    throw new QuotaExhaustedError(
      'Gemini API free-tier quota exceeded (429). Playing with offline seed data.'
    );
  }
  throw lastError || new Error('Failed to generate from Gemini API');
}

async function generateOrFallbackModeQuestions(
  mode: string,
  count: number,
  excludeAnswers: string[] = [],
  usedSeedIds?: Set<string>
): Promise<{ questions: Record<string, unknown>[]; source: 'ai' | 'cached' }> {
  let generated: Record<string, unknown>[] = [];
  if (ai) {
    const prompt = buildPrompt(mode, count, excludeAnswers);
    if (prompt) {
      try {
        const rawText = await generateJsonTextWithFallback(prompt);
        const parsed = safeParseJsonArray(rawText);
        if (parsed.length > 0) {
          generated = parsed.map((q, i) => ({
            ...q,
            id: `${mode}-mp-${Date.now()}-${i}`,
            difficulty: 'expert',
          }));
        }
      } catch (err) {
        if (!(err instanceof QuotaExhaustedError)) {
          console.warn(`[Server] Multiplayer Gemini generation fallback for ${mode}:`, err);
        }
      }
    }
  }

  if (generated.length >= count) {
    return { questions: generated.slice(0, count), source: 'ai' };
  }

  const allSeed = readSeedQuestions(mode);
  const seenAnswers = new Set(generated.map((q) => String(q.correctAnswer || '').trim().toLowerCase()));
  const unseenSeed = shuffleServerArray(
    allSeed.filter(
      (q) =>
        (!usedSeedIds || !usedSeedIds.has(String(q.id || ''))) &&
        !seenAnswers.has(String(q.correctAnswer || '').trim().toLowerCase())
    )
  );
  const previouslyUsedSeed = shuffleServerArray(
    allSeed.filter(
      (q) =>
        usedSeedIds?.has(String(q.id || '')) &&
        !seenAnswers.has(String(q.correctAnswer || '').trim().toLowerCase())
    )
  );

  const needed = Math.max(0, count - generated.length);
  const extra = [...unseenSeed, ...previouslyUsedSeed].slice(0, needed);
  if (usedSeedIds) {
    for (const q of extra) {
      if (q.id) usedSeedIds.add(String(q.id));
    }
  }

  return {
    questions: [...generated, ...extra].slice(0, count),
    source: generated.length >= Math.ceil(count / 2) ? 'ai' : 'cached',
  };
}

interface ServerPlayer {
  playerId: string;
  username: string;
  avatarId: string;
  isHost: boolean;
  connected: boolean;
  totalPoints: number;
  modePoints: Record<number, number>;
  correctCount: number;
  currentModeAnswered: number;
  finishedCurrentMode: boolean;
  answeredKeys: Set<string>;
  ws: WebSocket | null;
}

interface ServerRoom {
  code: string;
  hostId: string;
  modes: string[];
  questionCount: 5 | 10 | 15;
  timerSeconds: number;
  phase: 'lobby' | 'loading' | 'playing' | 'intermission' | 'finished';
  currentModeIndex: number;
  intermissionEndsAt: number | null;
  intermissionTimer: ReturnType<typeof setTimeout> | null;
  players: Map<string, ServerPlayer>;
  modeQuestionSets: Map<number, { questions: Record<string, unknown>[]; source: 'ai' | 'cached' }>;
  usedAnswers: string[];
  usedSeedIds: Set<string>;
  updatedAt: number;
}

const VALID_MP_MODES = new Set(Object.keys(MODE_SEED_FILE));
const rooms = new Map<string, ServerRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function serializeRoom(room: ServerRoom) {
  const currentSet = room.modeQuestionSets.get(room.currentModeIndex);
  return {
    code: room.code,
    hostId: room.hostId,
    modes: room.modes,
    questionCount: room.questionCount,
    timerSeconds: room.timerSeconds,
    phase: room.phase,
    currentModeIndex: room.currentModeIndex,
    intermissionEndsAt: room.intermissionEndsAt,
    players: Array.from(room.players.values()).map((p) => ({
      playerId: p.playerId,
      username: p.username,
      avatarId: p.avatarId,
      isHost: p.isHost,
      connected: p.connected,
      totalPoints: p.totalPoints,
      modePoints: p.modePoints,
      correctCount: p.correctCount,
      currentModeAnswered: p.currentModeAnswered,
      finishedCurrentMode: p.finishedCurrentMode,
    })),
    currentQuestions:
      room.phase === 'playing' && currentSet ? currentSet.questions : [],
    questionSource: currentSet?.source ?? 'cached',
  };
}

function broadcastRoom(room: ServerRoom) {
  room.updatedAt = Date.now();
  const payload = JSON.stringify({ type: 'room:state', room: serializeRoom(room) });
  for (const player of room.players.values()) {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(payload);
    }
  }
}

function sendError(ws: WebSocket, message: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'room:error', error: message }));
  }
}

function maybeAdvanceAfterModeComplete(room: ServerRoom, force = false) {
  if (room.phase !== 'playing') return;

  const activePlayers = Array.from(room.players.values()).filter((p) => p.connected);
  const targets = activePlayers.length > 0 ? activePlayers : Array.from(room.players.values());
  const allDone = targets.length > 0 && targets.every((p) => p.finishedCurrentMode);

  if (!allDone && !force) return;

  const hasNextMode = room.currentModeIndex + 1 < room.modes.length;
  if (!hasNextMode) {
    room.phase = 'finished';
    room.intermissionEndsAt = null;
    broadcastRoom(room);
    return;
  }

  // Show 5-second leaderboard tally before automatically starting the next mode
  room.phase = 'intermission';
  room.intermissionEndsAt = Date.now() + 5000;
  broadcastRoom(room);

  if (room.intermissionTimer) {
    clearTimeout(room.intermissionTimer);
  }

  const nextIndex = room.currentModeIndex + 1;
  const ensureNextQuestions = room.modeQuestionSets.has(nextIndex)
    ? Promise.resolve(room.modeQuestionSets.get(nextIndex)!)
    : generateOrFallbackModeQuestions(
        room.modes[nextIndex],
        room.questionCount,
        room.usedAnswers,
        room.usedSeedIds
      ).then((res) => {
        room.modeQuestionSets.set(nextIndex, res);
        for (const q of res.questions) {
          if (q.correctAnswer) room.usedAnswers.push(String(q.correctAnswer));
        }
        return res;
      });

  room.intermissionTimer = setTimeout(async () => {
    room.intermissionTimer = null;
    if (!rooms.has(room.code) || room.phase !== 'intermission') return;
    await ensureNextQuestions;
    room.currentModeIndex = nextIndex;
    room.intermissionEndsAt = null;
    room.phase = 'playing';
    for (const p of room.players.values()) {
      p.currentModeAnswered = 0;
      p.finishedCurrentMode = false;
    }
    broadcastRoom(room);
  }, 5000);
}

// Periodically prune stale rooms older than 2 hours
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [code, room] of rooms.entries()) {
    if (room.updatedAt < cutoff) {
      if (room.intermissionTimer) clearTimeout(room.intermissionTimer);
      rooms.delete(code);
    }
  }
}, 15 * 60 * 1000);

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    let joinedRoomCode: string | null = null;
    let joinedPlayerId: string | null = null;

    ws.on('message', async (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const type = String(msg.type || '');

      if (type === 'ping') {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
        return;
      }

      if (type === 'room:create') {
        const playerId = String(msg.playerId || '').trim();
        const username = String(msg.username || 'Player').trim().slice(0, 24) || 'Player';
        const avatarId = String(msg.avatarId || 'av-1');
        const requestedModes = Array.isArray(msg.modes)
          ? msg.modes.map((m) => String(m)).filter((m) => VALID_MP_MODES.has(m))
          : [];
        const modes = requestedModes.length > 0 ? requestedModes : ['three-clubs'];
        const qCount = msg.questionCount === 5 || msg.questionCount === 15 ? msg.questionCount : 10;
        const timerSeconds =
          typeof msg.timerSeconds === 'number' && [0, 15, 30, 45].includes(msg.timerSeconds)
            ? msg.timerSeconds
            : 30;

        if (!playerId) {
          sendError(ws, 'Missing player identity');
          return;
        }

        const code = generateRoomCode();
        const room: ServerRoom = {
          code,
          hostId: playerId,
          modes,
          questionCount: qCount,
          timerSeconds,
          phase: 'lobby',
          currentModeIndex: 0,
          intermissionEndsAt: null,
          intermissionTimer: null,
          players: new Map(),
          modeQuestionSets: new Map(),
          usedAnswers: [],
          usedSeedIds: new Set(),
          updatedAt: Date.now(),
        };

        room.players.set(playerId, {
          playerId,
          username,
          avatarId,
          isHost: true,
          connected: true,
          totalPoints: 0,
          modePoints: {},
          correctCount: 0,
          currentModeAnswered: 0,
          finishedCurrentMode: false,
          answeredKeys: new Set(),
          ws,
        });

        rooms.set(code, room);
        joinedRoomCode = code;
        joinedPlayerId = playerId;
        broadcastRoom(room);
        return;
      }

      if (type === 'room:join') {
        const code = String(msg.code || '').trim().toUpperCase();
        const playerId = String(msg.playerId || '').trim();
        const username = String(msg.username || 'Player').trim().slice(0, 24) || 'Player';
        const avatarId = String(msg.avatarId || 'av-1');

        const room = rooms.get(code);
        if (!room) {
          sendError(ws, `Battle room "${code}" not found.`);
          return;
        }
        if (!playerId) {
          sendError(ws, 'Missing player identity');
          return;
        }

        const existing = room.players.get(playerId);
        if (existing) {
          existing.ws = ws;
          existing.connected = true;
          existing.username = username;
          existing.avatarId = avatarId;
        } else {
          if (room.phase !== 'lobby') {
            sendError(ws, 'This battle has already started.');
            return;
          }
          room.players.set(playerId, {
            playerId,
            username,
            avatarId,
            isHost: room.hostId === playerId,
            connected: true,
            totalPoints: 0,
            modePoints: {},
            correctCount: 0,
            currentModeAnswered: 0,
            finishedCurrentMode: false,
            answeredKeys: new Set(),
            ws,
          });
        }

        joinedRoomCode = code;
        joinedPlayerId = playerId;
        broadcastRoom(room);
        return;
      }

      if (type === 'room:leave') {
        if (joinedRoomCode && joinedPlayerId) {
          const room = rooms.get(joinedRoomCode);
          if (room) {
            room.players.delete(joinedPlayerId);
            if (room.players.size === 0) {
              if (room.intermissionTimer) clearTimeout(room.intermissionTimer);
              rooms.delete(joinedRoomCode);
            } else {
              if (room.hostId === joinedPlayerId) {
                const nextHost = Array.from(room.players.values())[0];
                if (nextHost) {
                  room.hostId = nextHost.playerId;
                  nextHost.isHost = true;
                }
              }
              broadcastRoom(room);
              maybeAdvanceAfterModeComplete(room);
            }
          }
        }
        joinedRoomCode = null;
        joinedPlayerId = null;
        return;
      }

      if (!joinedRoomCode || !joinedPlayerId) return;
      const room = rooms.get(joinedRoomCode);
      if (!room) {
        sendError(ws, 'Battle room is no longer active.');
        return;
      }
      const player = room.players.get(joinedPlayerId);
      if (!player) return;

      if (type === 'room:start') {
        if (room.hostId !== player.playerId) {
          sendError(ws, 'Only the room host can start the battle.');
          return;
        }
        if (room.phase !== 'lobby' && room.phase !== 'finished') return;

        if (room.intermissionTimer) {
          clearTimeout(room.intermissionTimer);
          room.intermissionTimer = null;
        }

        room.phase = 'loading';
        room.currentModeIndex = 0;
        room.intermissionEndsAt = null;
        room.modeQuestionSets.clear();
        for (const p of room.players.values()) {
          p.totalPoints = 0;
          p.modePoints = {};
          p.correctCount = 0;
          p.currentModeAnswered = 0;
          p.finishedCurrentMode = false;
          p.answeredKeys.clear();
        }
        broadcastRoom(room);

        // Generate/load mode 0 immediately, and pre-generate remaining modes in parallel
        const firstRes = await generateOrFallbackModeQuestions(
          room.modes[0],
          room.questionCount,
          room.usedAnswers,
          room.usedSeedIds
        );
        room.modeQuestionSets.set(0, firstRes);
        for (const q of firstRes.questions) {
          if (q.correctAnswer) room.usedAnswers.push(String(q.correctAnswer));
        }

        for (let idx = 1; idx < room.modes.length; idx++) {
          const targetIdx = idx;
          generateOrFallbackModeQuestions(
            room.modes[targetIdx],
            room.questionCount,
            room.usedAnswers,
            room.usedSeedIds
          ).then((res) => {
            if (rooms.has(room.code)) {
              room.modeQuestionSets.set(targetIdx, res);
              for (const q of res.questions) {
                if (q.correctAnswer) room.usedAnswers.push(String(q.correctAnswer));
              }
            }
          });
        }

        if (!rooms.has(room.code)) return;
        room.phase = 'playing';
        broadcastRoom(room);
        return;
      }

      if (type === 'room:reset_lobby') {
        if (room.hostId !== player.playerId) return;
        if (room.intermissionTimer) {
          clearTimeout(room.intermissionTimer);
          room.intermissionTimer = null;
        }
        room.phase = 'lobby';
        room.currentModeIndex = 0;
        room.intermissionEndsAt = null;
        room.modeQuestionSets.clear();
        for (const p of room.players.values()) {
          p.totalPoints = 0;
          p.modePoints = {};
          p.correctCount = 0;
          p.currentModeAnswered = 0;
          p.finishedCurrentMode = false;
          p.answeredKeys.clear();
        }
        broadcastRoom(room);
        return;
      }

      if (type === 'game:answer') {
        if (room.phase !== 'playing') return;
        const modeIndex = Number(msg.modeIndex);
        const questionIndex = Number(msg.questionIndex);
        if (modeIndex !== room.currentModeIndex) return;
        const activeQuestionsCount =
          room.modeQuestionSets.get(modeIndex)?.questions.length ?? room.questionCount;
        if (questionIndex < 0 || questionIndex >= activeQuestionsCount) return;

        const key = `${modeIndex}:${questionIndex}`;
        if (player.answeredKeys.has(key)) return;
        player.answeredKeys.add(key);

        const isCorrect = Boolean(msg.isCorrect);
        const rawTimeLeft = typeof msg.timeLeft === 'number' ? msg.timeLeft : 0;
        let earned = 0;
        if (isCorrect) {
          const speedBonus =
            room.timerSeconds > 0
              ? Math.round(
                  (Math.max(0, Math.min(rawTimeLeft, room.timerSeconds)) /
                    room.timerSeconds) *
                    50
                )
              : 0;
          earned = 100 + speedBonus;
          player.correctCount += 1;
        }

        player.totalPoints += earned;
        player.modePoints[modeIndex] = (player.modePoints[modeIndex] || 0) + earned;
        player.currentModeAnswered += 1;
        broadcastRoom(room);
        return;
      }

      if (type === 'game:mode_complete') {
        if (room.phase !== 'playing') return;
        const modeIndex = Number(msg.modeIndex);
        if (modeIndex !== room.currentModeIndex) return;
        player.finishedCurrentMode = true;
        broadcastRoom(room);
        maybeAdvanceAfterModeComplete(room);
        return;
      }

      if (type === 'room:force_advance') {
        if (room.hostId !== player.playerId) return;
        if (room.phase !== 'playing') return;
        const modeIndex = Number(msg.modeIndex);
        if (modeIndex !== room.currentModeIndex) return;
        maybeAdvanceAfterModeComplete(room, true);
      }
    });

    ws.on('close', () => {
      if (!joinedRoomCode || !joinedPlayerId) return;
      const code = joinedRoomCode;
      const pid = joinedPlayerId;
      const room = rooms.get(code);
      if (!room) return;
      const player = room.players.get(pid);
      if (player && player.ws === ws) {
        player.connected = false;
        player.ws = null;
        broadcastRoom(room);
        // Give 8s grace period for mobile/proxy reconnects before advancing without this player
        setTimeout(() => {
          const currentRoom = rooms.get(code);
          if (!currentRoom) return;
          const p = currentRoom.players.get(pid);
          if (p && !p.connected) {
            maybeAdvanceAfterModeComplete(currentRoom);
          }
        }, 8000);
      }
    });
  });

  app.post('/api/questions/generate', async (req, res) => {
    const { mode, count, excludeAnswers } = req.body ?? {};
    if (!mode || typeof count !== 'number' || mode === 'tictactoe') {
      res.status(400).json({ error: 'Invalid mode or count' });
      return;
    }

    if (!ai) {
      res.status(503).json({ error: 'Gemini API key is not configured on the server' });
      return;
    }

    const excludes = Array.isArray(excludeAnswers)
      ? excludeAnswers.map((a) => String(a))
      : [];
    const prompt = buildPrompt(mode, Math.min(Math.max(count, 1), 15), excludes);
    if (!prompt) {
      res.status(400).json({ error: 'Unsupported mode' });
      return;
    }

    try {
      const rawText = await generateJsonTextWithFallback(prompt);
      const parsed = safeParseJsonArray(rawText);
      if (parsed.length === 0) {
        res.status(502).json({ error: 'Model returned invalid question array' });
        return;
      }

      const withIds = parsed.map((q: Record<string, unknown>, i: number) => ({
        ...q,
        id: `${mode}-gen-${Date.now()}-${i}`,
        difficulty: 'expert',
      }));

      res.json({ questions: withIds });
    } catch (err) {
      if (err instanceof QuotaExhaustedError || isQuotaError(err)) {
        res.status(429).json({
          error: 'Gemini API quota exceeded. Upgrade key in Settings > Secrets for fresh AI questions.',
          quotaExceeded: true,
        });
        return;
      }
      console.warn('[Server] Gemini generation failed:', (err as Error)?.message || err);
      res.status(502).json({ error: 'Failed to generate questions from Gemini API' });
    }
  });

  app.post('/api/players/pool', async (req, res) => {
    const { league, country, count } = req.body ?? {};
    if (!league || !country) {
      res.status(400).json({ error: 'League and country are required' });
      return;
    }

    const cacheKey = `${String(league).toLowerCase()}:${String(country).toLowerCase()}`;
    const cachedBatch = serverLeaguePoolCache.get(cacheKey);
    if (cachedBatch && cachedBatch.length > 0) {
      res.json({ players: cachedBatch, cached: true });
      return;
    }

    if (!ai) {
      res.status(503).json({ error: 'Gemini API key is not configured on the server' });
      return;
    }

    const targetCount =
      typeof count === 'number' ? Math.min(Math.max(count, 50), 500) : 250;

    const prompt = `List ${targetCount} real professional footballers who played in ${league} (${country}) between 2010 and 2025.
Include players from ALL clubs that appeared in ${league} during 2010-2025, including promoted, relegated, and mid-table clubs — not just the top clubs.
Include starters, squad regulars, goalkeepers, cult heroes, and notable transfers.
Return ONLY a valid JSON array with no markdown or extra text. Each item must strictly match:
{"id":"<slug-id>","name":"<Full Name>","nationality":"<Country>","position":"<GK|DF|MF|FW>","era":"<e.g. 2012-2021>","clubs":["<club-id>"]}
Use lowercase kebab-case club IDs (e.g. "man-city", "man-united", "real-madrid", "barcelona", "atletico-madrid", "psg", "bayern-munich", "inter-milan", "ac-milan", "juventus", "napoli", "roma", "lazio", "dortmund", "leverkusen", "rb-leipzig", "arsenal", "chelsea", "liverpool", "tottenham", "leicester", "west-ham", "everton", "newcastle", "aston-villa", "sevilla", "lyon", "monaco", "swansea-city", etc.).
Every player must be a real footballer who played senior league matches from 2010 onwards.`;

    try {
      const rawText = await generateJsonTextWithFallback(prompt, 65536);
      const parsed = safeParseJsonArray(rawText);
      const validPlayers = parsed
        .filter(
          (p) =>
            p &&
            typeof p.name === 'string' &&
            p.name.trim().length > 1 &&
            Array.isArray(p.clubs)
        )
        .map((p, idx) => ({
          id:
            typeof p.id === 'string' && p.id.trim()
              ? p.id.trim()
              : `pool-${league.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
          name: String(p.name).trim(),
          nationality: typeof p.nationality === 'string' ? p.nationality.trim() : '',
          position: (['GK', 'DF', 'MF', 'FW'].includes(String(p.position))
            ? String(p.position)
            : 'MF') as 'GK' | 'DF' | 'MF' | 'FW',
          era: typeof p.era === 'string' ? p.era : '2010–present',
          clubs: (p.clubs as unknown[])
            .map((c) => String(c).trim().toLowerCase())
            .filter(Boolean),
        }));

      if (validPlayers.length > 0) {
        serverLeaguePoolCache.set(cacheKey, validPlayers);
      }

      res.json({ players: validPlayers });
    } catch (err) {
      if (err instanceof QuotaExhaustedError || isQuotaError(err)) {
        res.status(429).json({
          error: `Gemini API quota exceeded while loading ${league}. Using offline player pool.`,
          quotaExceeded: true,
        });
        return;
      }
      console.warn(
        `[Server] Player pool generation failed for ${league}:`,
        (err as Error)?.message || err
      );
      res.status(502).json({ error: `Failed to generate player pool for ${league}` });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`FOOTBALL IQ server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
