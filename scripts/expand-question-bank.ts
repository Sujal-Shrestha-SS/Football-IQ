import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../src/data');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is missing.');
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const MODE_FILES: Record<string, string> = {
  'three-clubs': 'threeClubsQuestions.json',
  'career-path': 'careerPathQuestions.json',
  'guess-player': 'guessPlayerQuestions.json',
  'football-quiz': 'footballQuizQuestions.json',
  'jumbled-name': 'jumbledNameQuestions.json',
  'transfer-quiz': 'transferQuizQuestions.json',
  'shirt-number': 'shirtNumberQuestions.json',
};

const PREFIX_MAP: Record<string, string> = {
  'three-clubs': 'tc',
  'career-path': 'cp',
  'guess-player': 'gp',
  'football-quiz': 'fq',
  'jumbled-name': 'jn',
  'transfer-quiz': 'tr',
  'shirt-number': 'sn',
};

const FOCUS_ANGLES = [
  'Serie A, Bundesliga, and Europa League cult heroes',
  'La Liga, Ligue 1, and Premier League mid-table standouts',
  'Champions League knockout unsung heroes and domestic cup winners',
  'Eredivisie, Liga Portugal, and international tournament surprises',
  'Promoted club stars, free transfers, and tactical utility players',
  'Goalkeepers, full-backs, and defensive midfielders post-2010',
  'South American imports, Asian stars in Europe, and African Nations Cup standouts',
  'Championship to Premier League transition heroes and breakout youngsters 2012-2022',
];

const VALID_THREE_CLUBS_IDS = [
  'man-city', 'man-united', 'liverpool', 'chelsea', 'arsenal', 'tottenham',
  'real-madrid', 'barcelona', 'atletico-madrid', 'psg', 'bayern-munich',
  'juventus', 'inter-milan', 'ac-milan', 'napoli', 'dortmund', 'ajax', 'porto',
  'benfica', 'sevilla', 'lyon', 'roma', 'lazio', 'leicester', 'west-ham',
  'everton', 'newcastle', 'aston-villa', 'rb-leipzig', 'leverkusen', 'monaco',
  'sporting-cp'
];

function buildPrompt(mode: string, count: number, excludeAnswers: string[]): string {
  const angle = FOCUS_ANGLES[Math.floor(Math.random() * FOCUS_ANGLES.length)];
  const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const cleanExcludes = excludeAnswers.slice(-60);
  const excludeRule = cleanExcludes.length > 0
    ? `\n- CRITICAL UNIQUENESS RULE: Do NOT use any of these previously used players or answers: ${cleanExcludes.join(', ')}`
    : '';

  const base = `You are a football trivia expert. Generate ${count} unique football quiz questions (Batch ${seed}, focus area: ${angle}).
STRICT RULES:
- All players, matches, stats and events must be from 2010 onwards only
- Questions must be GENUINELY HARD — suitable for hardcore football fans, not casual viewers
- Avoid overused superstars: do NOT use Messi, Cristiano Ronaldo, Mbappe, or Haaland as answers
- Focus on: squad players who made pivotal contributions, cult heroes, niche transfers, obscure records, reliable starters, specific season stats
- Every correctAnswer must be 100% factually accurate — do not hallucinate clubs, stats, fees, or dates
- explanation must be 1 concise sentence citing a specific year, stat, club, or record${excludeRule}
- Return ONLY a valid JSON array of objects, with NO markdown code fences and NO extra commentary`;

  const schemas: Record<string, string> = {
    'three-clubs': `${base}
- hints: 3 progressive clues, never mentioning the player's name or nationality in hint 1.
- options: 4 distinct real footballer names including the correctAnswer, shuffled.
MODE: Three Clubs. User sees 3 club badges and must identify the player who played senior official matches for all three.
JSON schema for each question:
{
  "mode": "three-clubs",
  "difficulty": "expert",
  "category": "Three Clubs",
  "question": "Which player represented all three of these clubs?",
  "clubs": ["<club-id-1>", "<club-id-2>", "<club-id-3>"],
  "correctAnswer": "<Full Player Name>",
  "options": ["<opt1>", "<opt2>", "<opt3>", "<opt4>"],
  "hints": ["<hint1>", "<hint2>", "<hint3>"],
  "playerClubStints": { "<club-id>": "<year-year>" },
  "explanation": "<1-sentence factual explanation>"
}
Valid club IDs to use: ${VALID_THREE_CLUBS_IDS.join(', ')}`,

    'career-path': `${base}
- hints: 3 progressive clues, never mentioning the player's name or nationality in hint 1.
- options: 4 distinct real footballer names including the correctAnswer, shuffled.
MODE: Career Path. User sees a list of clubs in chronological order and must name the player.
JSON schema for each question:
{
  "mode": "career-path",
  "difficulty": "expert",
  "category": "Career Path",
  "question": "Which footballer followed this career path?",
  "clubs": [
    { "clubId": "<id>", "clubName": "<name>", "period": "<YYYY-YYYY>", "apps": <number>, "goals": <number> }
  ],
  "correctAnswer": "<Full Player Name>",
  "options": ["<opt1>", "<opt2>", "<opt3>", "<opt4>"],
  "hints": ["<hint1>", "<hint2>", "<hint3>"],
  "explanation": "<1-sentence factual explanation>"
}
Include 3 to 5 clubs in the career path. All club stints must start from 2010 or later.`,

    'guess-player': `${base}
- options: 4 distinct real footballer names including correctAnswer, shuffled.
- hints: 3 progressive clues.
MODE: Guess Player. Progressive clues. Mix subType between "clues", "stats", and "silhouette" (for silhouette, provide exactly 5 clues: Nationality, Position, Club Era, Trophy, Key Stat).
JSON schema for each question:
{
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
  "options": ["<opt1>", "<opt2>", "<opt3>", "<opt4>"],
  "hints": ["<hint1>", "<hint2>", "<hint3>"],
  "explanation": "<1-sentence factual explanation>"
}`,

    'football-quiz': `${base}
- options must be 4 VERY PLAUSIBLE choices, placing correctAnswer at a RANDOM index (0, 1, 2, or 3).
MODE: Football Quiz. Multiple choice trivia about football records, history, trophies post-2010.
JSON schema for each question:
{
  "mode": "football-quiz",
  "difficulty": "expert",
  "category": "<Premier League|La Liga|Serie A|Bundesliga|Ligue 1|Champions League|World Cup|Transfers>",
  "question": "<specific trivia question>",
  "correctAnswer": "<answer>",
  "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
  "explanation": "<1-sentence factual explanation>"
}`,

    'jumbled-name': `${base}
MODE: Jumbled Name. User sees scrambled uppercase letters of a footballer's name.
JSON schema for each question:
{
  "mode": "jumbled-name",
  "difficulty": "expert",
  "category": "Jumbled Name",
  "question": "Unscramble the letters to find the footballer:",
  "correctAnswer": "<Full Player Name>",
  "jumbledLetters": "<ALL LETTERS UPPERCASE NO SPACES SCRAMBLED>",
  "hints": ["<hint1: league/club clue without name or nationality>", "<hint2: trophy/stat clue>", "<hint3: nationality and career detail>"],
  "explanation": "<1-sentence factual explanation>",
  "nationality": "<country>",
  "position": "<GK|DF|MF|FW>",
  "era": "<e.g. 2014-present>"
}`,

    'transfer-quiz': `${base}
- options must be 4 VERY PLAUSIBLE choices, placing correctAnswer at a RANDOM index (0, 1, 2, or 3).
MODE: Transfer Market Quiz. Post-2010 fees, destination clubs, and seasons.
JSON schema for each question:
{
  "mode": "transfer-quiz",
  "difficulty": "expert",
  "category": "Transfers",
  "question": "<specific transfer question>",
  "correctAnswer": "<answer>",
  "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
  "explanation": "<1-sentence factual explanation including fee and year>"
}`,

    'shirt-number': `${base}
- options must be 4 VERY PLAUSIBLE choices, placing correctAnswer at a RANDOM index (0, 1, 2, or 3).
MODE: Shirt Number Quiz. Memorable squad numbers post-2010.
JSON schema for each question:
{
  "mode": "shirt-number",
  "difficulty": "expert",
  "category": "Shirt Numbers",
  "question": "<specific shirt number question>",
  "correctAnswer": "<player or number>",
  "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
  "explanation": "<1-sentence factual explanation>"
}`,
  };

  return schemas[mode] || '';
}

function cleanJsonText(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseJsonArray(text: string): any[] {
  const cleaned = cleanJsonText(text);
  try {
    const res = JSON.parse(cleaned);
    return Array.isArray(res) ? res : [];
  } catch {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > 0) {
      const candidate = cleaned.slice(0, lastBrace + 1);
      const startBracket = candidate.indexOf('[');
      if (startBracket >= 0) {
        try {
          const res = JSON.parse(candidate.slice(startBracket) + ']');
          return Array.isArray(res) ? res : [];
        } catch {
          return [];
        }
      }
    }
    return [];
  }
}

async function generateBatch(mode: string, count: number, excludeAnswers: string[]): Promise<any[]> {
  const prompt = buildPrompt(mode, count, excludeAnswers);
  const models = [
    { model: 'gemini-4-hydrogen', thinking: true },
    { model: 'gemini-3.1-flash-lite', thinking: false },
    { model: 'gemini-3.8-flash', thinking: false },
  ];

  for (const item of models) {
    try {
      const config: any = {
        temperature: 0.85,
        responseMimeType: 'application/json',
      };
      if (item.thinking) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const response = await ai.models.generateContent({
        model: item.model,
        contents: prompt,
        config,
      });

      const text = response.text || '';
      const parsed = parseJsonArray(text);
      if (parsed.length > 0) {
        return parsed;
      }
    } catch (err: any) {
      console.warn(`  [Warn] Model ${item.model} failed for ${mode}: ${err?.message || err}`);
    }
  }
  return [];
}

function validateQuestion(q: any, mode: string): boolean {
  if (!q || typeof q.question !== 'string' || !q.question.trim()) return false;
  if (typeof q.correctAnswer !== 'string' || !q.correctAnswer.trim()) return false;

  if (mode === 'three-clubs') {
    if (!Array.isArray(q.clubs) || q.clubs.length !== 3) return false;
    const allValidClubs = q.clubs.every((c: string) => VALID_THREE_CLUBS_IDS.includes(c));
    if (!allValidClubs) return false;
  }

  if (['football-quiz', 'transfer-quiz', 'shirt-number'].includes(mode)) {
    if (!Array.isArray(q.options) || q.options.length !== 4) return false;
    if (!q.options.includes(q.correctAnswer)) {
      q.options[0] = q.correctAnswer;
    }
  }

  if (mode === 'jumbled-name') {
    if (!q.jumbledLetters || typeof q.jumbledLetters !== 'string') {
      const letters = q.correctAnswer.toUpperCase().replace(/[^A-Z]/g, '').split('');
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      q.jumbledLetters = letters.join('');
    }
  }

  return true;
}

async function run() {
  const args = process.argv.slice(2);
  const targetMode = args.find((a) => !a.startsWith('--'));
  const targetTotalArg = args.find((a) => a.startsWith('--target='));
  const batchSizeArg = args.find((a) => a.startsWith('--batch='));

  const targetCountPerMode = targetTotalArg ? parseInt(targetTotalArg.split('=')[1], 10) : 100;
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) : 15;

  const modes = targetMode && targetMode !== 'all' ? [targetMode] : Object.keys(MODE_FILES);

  console.log(`\n======================================================`);
  console.log(`  FOOTBALL IQ - Question Bank Expander`);
  console.log(`  Target per mode: ${targetCountPerMode}`);
  console.log(`  Batch size:      ${batchSize}`);
  console.log(`  Modes:           ${modes.join(', ')}`);
  console.log(`======================================================\n`);

  for (const mode of modes) {
    const fileName = MODE_FILES[mode];
    if (!fileName) {
      console.warn(`Unknown mode: ${mode}`);
      continue;
    }

    const filePath = path.join(DATA_DIR, fileName);
    let existing: any[] = [];
    try {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      existing = [];
    }

    const prefix = PREFIX_MAP[mode] || 'q';
    const seenAnswers = new Set(existing.map((q) => String(q.correctAnswer).trim().toLowerCase()));

    console.log(`\n[${mode}] Currently has ${existing.length} questions. Target: ${targetCountPerMode}`);

    while (existing.length < targetCountPerMode) {
      const remaining = targetCountPerMode - existing.length;
      const currentBatchSize = Math.min(batchSize, remaining);

      console.log(`  Fetching batch of ${currentBatchSize} (progress: ${existing.length}/${targetCountPerMode})...`);
      const rawBatch = await generateBatch(mode, currentBatchSize, Array.from(seenAnswers));

      let addedCount = 0;
      for (const q of rawBatch) {
        if (!validateQuestion(q, mode)) continue;
        const normAns = String(q.correctAnswer).trim().toLowerCase();
        if (seenAnswers.has(normAns)) continue;

        seenAnswers.add(normAns);
        const newId = `${prefix}-${existing.length + 1}`;
        existing.push({
          id: newId,
          mode,
          ...q,
          idFieldPreserved: newId,
        });
        // Make sure id is placed first cleanly
        const cleanObj = { id: newId, ...q };
        existing[existing.length - 1] = cleanObj;
        addedCount++;

        if (existing.length >= targetCountPerMode) break;
      }

      console.log(`  -> Added ${addedCount} valid unique questions. Current total: ${existing.length}`);

      // Save progress incrementally so work is never lost
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf8');

      if (addedCount === 0) {
        console.log('  No questions added this round. Waiting 3s before retry...');
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        // Small delay to respect rate limits
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    console.log(`[${mode}] Finished! Final count: ${existing.length}`);
  }

  console.log('\nAll done! Question banks have been expanded successfully.');
}

run().catch((err) => {
  console.error('Fatal error running expander:', err);
  process.exit(1);
});
