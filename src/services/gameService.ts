import clubsData from '../data/clubs.json';
import tictactoePlayerPoolData from '../data/tictactoePlayerPool.json';
import threeClubsQuestions from '../data/threeClubsQuestions.json';
import careerPathQuestions from '../data/careerPathQuestions.json';
import guessPlayerQuestions from '../data/guessPlayerQuestions.json';
import footballQuizQuestions from '../data/footballQuizQuestions.json';
import jumbledNameQuestions from '../data/jumbledNameQuestions.json';
import transferQuizQuestions from '../data/transferQuizQuestions.json';
import shirtNumberQuestions from '../data/shirtNumberQuestions.json';
import { generateQuestions } from './questionGeneratorService';

import {
  Club,
  Player,
  GameModeId,
  Difficulty,
  AnyQuestion,
  ThreeClubsQuestion,
  CareerPathQuestion,
  GuessPlayerQuestion,
  FootballQuizQuestion,
  JumbledNameQuestion,
  TransferQuizQuestion,
  ShirtNumberQuestion,
  TicTacToePlayer,
} from '../types/football';

export const CLUBS: Club[] = clubsData;
export const TICTACTOE_PLAYERS: TicTacToePlayer[] =
  tictactoePlayerPoolData as unknown as TicTacToePlayer[];

export const CLUB_MAP = new Map<string, Club>();
CLUBS.forEach((c) => CLUB_MAP.set(c.id, c));

export const TICTACTOE_CLUB_IDS: string[] = [
  'man-city',
  'real-madrid',
  'psg',
  'barcelona',
  'liverpool',
  'bayern-munich',
  'chelsea',
  'juventus',
  'arsenal',
  'man-united',
  'atletico-madrid',
  'inter-milan',
  'dortmund',
  'napoli',
];

export interface TicTacToeAttribute {
  id: string;
  label: string;
  shortLabel: string;
}

export const TICTACTOE_ATTRIBUTES: TicTacToeAttribute[] = [
  { id: 'scored-20-goals', label: 'Scored 20+ goals in a season', shortLabel: '20+ Goals' },
  { id: 'won-ucl', label: 'Won the Champions League', shortLabel: 'Won UCL' },
  { id: 'international-captain', label: 'International Captain', shortLabel: 'Int. Captain' },
  { id: 'big-money-transfer', label: 'Cost 50M+ transfer fee', shortLabel: '50M+ Fee' },
  { id: 'won-ballon-dor', label: "Won Ballon d'Or", shortLabel: "Ballon d'Or" },
  { id: 'south-american', label: 'Born in South America', shortLabel: 'South America' },
  { id: 'multi-league', label: 'Played in 2+ top leagues', shortLabel: '2+ Leagues' },
  { id: 'world-cup-goal', label: 'Scored in a World Cup', shortLabel: 'WC Goal' },
  { id: 'won-treble', label: 'Won domestic treble', shortLabel: 'Treble Winner' },
  { id: 'free-transfer', label: 'Joined as a free transfer', shortLabel: 'Free Transfer' },
];

const CLUB_ALIAS_GROUPS: string[][] = [
  ['man-city', 'manchester-city', 'mancity'],
  ['man-united', 'manchester-united', 'manunited', 'man-utd'],
  ['psg', 'paris-saint-germain', 'parissg'],
  ['bayern-munich', 'bayern', 'fc-bayern-munich'],
  ['inter-milan', 'inter', 'internazionale'],
  ['ac-milan', 'milan'],
  ['atletico-madrid', 'atletico'],
  ['real-madrid', 'realmadrid'],
  ['barcelona', 'fc-barcelona'],
  ['dortmund', 'borussia-dortmund', 'bvb'],
  ['rb-leipzig', 'leipzig'],
  ['leverkusen', 'bayer-leverkusen'],
  ['sporting-cp', 'sporting', 'sporting-lisbon'],
  ['west-ham', 'west-ham-united'],
  ['aston-villa', 'astonvilla'],
  ['newcastle', 'newcastle-united'],
];

const CLUB_CANONICAL_MAP = new Map<string, string>();
CLUB_ALIAS_GROUPS.forEach((group) => {
  const canonical = group[0].replace(/[^a-z0-9]/g, '');
  group.forEach((alias) => {
    CLUB_CANONICAL_MAP.set(alias.replace(/[^a-z0-9]/g, ''), canonical);
  });
});

export function normalizeClubKey(clubId: string): string {
  const stripped = clubId.toLowerCase().replace(/[^a-z0-9]/g, '');
  return CLUB_CANONICAL_MAP.get(stripped) || stripped;
}

const SOUTH_AMERICAN_COUNTRIES = new Set([
  'argentina',
  'brazil',
  'uruguay',
  'colombia',
  'chile',
  'ecuador',
  'peru',
  'paraguay',
  'venezuela',
  'bolivia',
]);

/**
 * Normalizes text for forgiving football trivia comparisons.
 * Strips accents (diacritics), punctuation, and converts to lowercase.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Validates a user's answer against the target footballer / option.
 * Handles full name, last name, and common variations.
 */
export function validateAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normUser = normalizeText(userAnswer);
  const normTarget = normalizeText(correctAnswer);

  if (!normUser) return false;
  if (normUser === normTarget) return true;

  const targetWords = normTarget.split(/\s+/);
  const lastWord = targetWords[targetWords.length - 1];

  const nicknames: Array<[string, string[]]> = [
    ['cristiano ronaldo', ['ronaldo', 'cr7']],
    ['lionel messi', ['messi', 'leo messi']],
    ['neymar jr', ['neymar']],
    ['zlatan ibrahimovic', ['zlatan', 'ibrahimovic']],
    ['angel di maria', ['di maria', 'dimaria']],
    ['kevin de bruyne', ['de bruyne', 'debruyne', 'kdb']],
    ['erling haaland', ['haaland']],
    ['kylian mbappe', ['mbappe', 'kylian']],
    ['robert lewandowski', ['lewandowski', 'lewy']],
    ['luka modric', ['modric']],
    ['mohamed salah', ['salah', 'mo salah']],
    ['sadio mane', ['mane']],
    ['roberto firmino', ['firmino', 'bobby firmino']],
    ['virgil van dijk', ['van dijk', 'vandijk', 'vvd']],
    ['alisson becker', ['alisson']],
    ['thibaut courtois', ['courtois']],
    ['vinicius junior', ['vinicius', 'vinicius jr', 'vini', 'vini jr']],
    ['jude bellingham', ['bellingham']],
    ['bukayo saka', ['saka']],
    ['cole palmer', ['palmer']],
    ['phil foden', ['foden']],
    ['harry kane', ['kane']],
    ['son heungmin', ['son', 'sonny', 'heung min son']],
    ['karim benzema', ['benzema']],
    ['toni kroos', ['kroos']],
    ['xabi alonso', ['alonso']],
    ['andrea pirlo', ['pirlo']],
    ['arjen robben', ['robben']],
    ['cesc fabregas', ['fabregas', 'cesc']],
    ['romelu lukaku', ['lukaku']],
    ['james rodriguez', ['james']],
    ['alexis sanchez', ['alexis', 'sanchez']],
    ['mesut ozil', ['ozil']],
    ['thiago silva', ['thiago silva']],
    ['alvaro morata', ['morata']],
    ['ngolo kante', ['kante']],
    ['antoine griezmann', ['griezmann']],
    ['ousmane dembele', ['dembele']],
    ['luis suarez', ['suarez']],
    ['victor osimhen', ['osimhen']],
    ['khvicha kvaratskhelia', ['kvaratskhelia', 'kvara']],
    ['lautaro martinez', ['lautaro']],
    ['julian alvarez', ['alvarez']],
    ['martin odegaard', ['odegaard']],
    ['declan rice', ['rice']],
    ['bruno fernandes', ['fernandes']],
    ['ilkay gundogan', ['gundogan']],
    ['jamal musiala', ['musiala']],
    ['florian wirtz', ['wirtz']],
    ['lamine yamal', ['yamal', 'lamine']],
    ['rafael leao', ['leao']],
    ['riyad mahrez', ['mahrez']],
    ['manuel neuer', ['neuer']],
    ['joshua kimmich', ['kimmich']],
    ['federico valverde', ['valverde', 'fede valverde']],
    ['achraf hakimi', ['hakimi']],
    ['bernardo silva', ['bernardo']],
  ];

  for (const [canonical, aliases] of nicknames) {
    if (normTarget.includes(canonical) && aliases.includes(normUser)) {
      return true;
    }
  }

  if (lastWord.length >= 4 && normUser === lastWord) {
    return true;
  }

  return false;
}

/**
 * Fisher-Yates array shuffle
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

export interface LoadedQuestionsResult {
  questions: AnyQuestion[];
  source: 'ai' | 'cached';
}

export const gameService = {
  validateAnswer,

  getClub(id: string): Club | undefined {
    return CLUB_MAP.get(id);
  },

  getAllClubs(): Club[] {
    return CLUBS;
  },

  /**
   * Validates a Tic-Tac-Toe move against the dynamic playerPool (plus static attribute validation when known).
   */
  validateTicTacToeMove(
    playerName: string,
    clubId: string,
    attributeId: string,
    playerPool: Player[]
  ): { id: string; name: string } | null {
    const targetClub = normalizeClubKey(clubId);

    // 1. Check curated TicTacToe pool for strict attribute + club verification
    const curatedMatch = TICTACTOE_PLAYERS.find((p) =>
      validateAnswer(playerName, p.name)
    );
    const dynamicMatch = playerPool.find((p) =>
      validateAnswer(playerName, p.name)
    );

    if (curatedMatch) {
      const combinedClubs = new Set([
        ...curatedMatch.clubs.map(normalizeClubKey),
        ...(dynamicMatch?.clubs || []).map(normalizeClubKey),
      ]);
      if (
        combinedClubs.has(targetClub) &&
        curatedMatch.attributes.includes(attributeId)
      ) {
        return { id: curatedMatch.id, name: curatedMatch.name };
      }
      return null;
    }

    // 2. Check dynamic playerPool match
    if (dynamicMatch) {
      const playedForClub = dynamicMatch.clubs.some(
        (c) => normalizeClubKey(c) === targetClub
      );
      if (!playedForClub) return null;

      // Enforce nationality/multi-club check when derivable from Player fields
      if (attributeId === 'south-american' && dynamicMatch.nationality) {
        if (!SOUTH_AMERICAN_COUNTRIES.has(dynamicMatch.nationality.toLowerCase())) {
          return null;
        }
      }
      if (attributeId === 'multi-league' && dynamicMatch.clubs.length < 2) {
        return null;
      }

      return { id: dynamicMatch.id, name: dynamicMatch.name };
    }

    return null;
  },

  generateSolvableTicTacToeBoard(): {
    rowClubIds: string[];
    colAttributes: TicTacToeAttribute[];
  } {
    for (let attempt = 0; attempt < 250; attempt++) {
      const candidateClubs = shuffleArray(TICTACTOE_CLUB_IDS).slice(0, 3);
      const candidateAttrs = shuffleArray(TICTACTOE_ATTRIBUTES).slice(0, 3);

      const allCellsSolvable = candidateClubs.every((clubId) =>
        candidateAttrs.every((attr) =>
          TICTACTOE_PLAYERS.some(
            (p) => p.clubs.includes(clubId) && p.attributes.includes(attr.id)
          )
        )
      );

      if (allCellsSolvable) {
        return { rowClubIds: candidateClubs, colAttributes: candidateAttrs };
      }
    }

    return {
      rowClubIds: ['real-madrid', 'barcelona', 'man-city'],
      colAttributes: [
        TICTACTOE_ATTRIBUTES[0],
        TICTACTOE_ATTRIBUTES[1],
        TICTACTOE_ATTRIBUTES[6],
      ],
    };
  },

  async loadQuestions(
    mode: GameModeId,
    _difficulty: Difficulty,
    count: number
  ): Promise<LoadedQuestionsResult> {
    if (mode === 'tictactoe') {
      return { questions: [], source: 'cached' };
    }

    // 1. Try Gemini generation first
    const generated = await generateQuestions(mode, count);
    if (generated && generated.length >= count) {
      return {
        questions: generated.slice(0, count),
        source: 'ai',
      };
    }

    // 2. Fallback: static seed bank JSON files
    let sourceQuestions: AnyQuestion[] = [];
    switch (mode) {
      case 'three-clubs':
        sourceQuestions = threeClubsQuestions as unknown as ThreeClubsQuestion[];
        break;
      case 'career-path':
        sourceQuestions = careerPathQuestions as unknown as CareerPathQuestion[];
        break;
      case 'guess-player':
        sourceQuestions = guessPlayerQuestions as unknown as GuessPlayerQuestion[];
        break;
      case 'football-quiz':
        sourceQuestions = footballQuizQuestions as unknown as FootballQuizQuestion[];
        break;
      case 'jumbled-name':
        sourceQuestions = jumbledNameQuestions as unknown as JumbledNameQuestion[];
        break;
      case 'transfer-quiz':
        sourceQuestions = transferQuizQuestions as unknown as TransferQuizQuestion[];
        break;
      case 'shirt-number':
        sourceQuestions = shirtNumberQuestions as unknown as ShirtNumberQuestion[];
        break;
    }

    const base = generated ?? [];
    const seenIds = new Set(base.map((q) => q.id));
    const extra = shuffleArray(sourceQuestions.filter((q) => !seenIds.has(q.id)));
    const merged = [...base, ...extra].slice(0, count);

    return {
      questions: merged,
      source: 'cached',
    };
  },

  getModeInfo(mode: GameModeId) {
    switch (mode) {
      case 'three-clubs':
        return {
          title: 'Three Clubs, One Player',
          shortTitle: 'Three Clubs',
          tagline: 'Find the connection between 3 European clubs',
          description: 'Three clubs. One footballer. Can you find the connection?',
          badge: 'Viral Format',
          accentColor: '#10B981',
          iconName: 'Shield',
          isNew: false,
        };
      case 'career-path':
        return {
          title: 'Player Career Path',
          shortTitle: 'Career Path',
          tagline: 'Follow the chronological transfers',
          description: 'Follow the clubs. Discover the player.',
          badge: 'Timeline',
          accentColor: '#3B82F6',
          iconName: 'TrendingUp',
          isNew: false,
        };
      case 'guess-player':
        return {
          title: 'Guess the Player',
          shortTitle: 'Guess Player',
          tagline: 'Decode clues, silhouettes & career stats',
          description: 'Use scouting clues and progressive reveals to name the player.',
          badge: 'Scouting',
          accentColor: '#F59E0B',
          iconName: 'UserCheck',
          isNew: false,
        };
      case 'football-quiz':
        return {
          title: 'Football Quiz',
          shortTitle: 'Football Quiz',
          tagline: 'Champions League, World Cup & modern records',
          description: 'Test your knowledge of the beautiful game post-2010.',
          badge: 'Classic Trivia',
          accentColor: '#EC4899',
          iconName: 'Award',
          isNew: false,
        };
      case 'jumbled-name':
        return {
          title: 'Jumbled Name',
          shortTitle: 'Jumbled',
          tagline: "Unscramble the footballer's name",
          description: 'The letters are mixed up. Can you unscramble who it is?',
          badge: 'Word Puzzle',
          accentColor: '#8B5CF6',
          iconName: 'Shuffle',
          isNew: true,
        };
      case 'tictactoe':
        return {
          title: 'Football Tic-Tac-Toe',
          shortTitle: 'Tic-Tac-Toe',
          tagline: 'Claim cells with player knowledge',
          description: 'Name players to claim the grid. Beat the CPU!',
          badge: '1v CPU',
          accentColor: '#F97316',
          iconName: 'Grid3x3',
          isNew: true,
        };
      case 'transfer-quiz':
        return {
          title: 'Transfer Market',
          shortTitle: 'Transfers',
          tagline: 'Who moved where, and for how much?',
          description: 'Test your knowledge of the biggest deals in football.',
          badge: 'Big Money',
          accentColor: '#EAB308',
          iconName: 'DollarSign',
          isNew: true,
        };
      case 'shirt-number':
        return {
          title: 'Shirt Number Quiz',
          shortTitle: 'Shirt Numbers',
          tagline: 'Who wore the famous number?',
          description: 'Match the squad number to the star who wore it.',
          badge: 'Jersey',
          accentColor: '#EC4899',
          iconName: 'Hash',
          isNew: true,
        };
    }
  },
};
