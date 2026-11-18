export type GameModeId =
  | 'three-clubs'
  | 'career-path'
  | 'guess-player'
  | 'football-quiz'
  | 'jumbled-name'
  | 'transfer-quiz'
  | 'shirt-number'
  | 'tictactoe';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type QuestionCategory =
  | 'Three Clubs'
  | 'Career Path'
  | 'Player Clues'
  | 'Player Stats'
  | 'Progressive Hints'
  | 'Silhouette'
  | 'Premier League'
  | 'La Liga'
  | 'Serie A'
  | 'Bundesliga'
  | 'Ligue 1'
  | 'Champions League'
  | 'World Cup'
  | 'Legends'
  | 'Transfers'
  | 'Jumbled Name'
  | 'Shirt Numbers';

export interface Club {
  id: string;
  name: string;
  shortName: string;
  country: string;
  league: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface Player {
  id: string;
  name: string;
  fullName?: string;
  nationality: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  era: string;
  clubs: string[];
}

export interface BaseQuestion {
  id: string;
  mode: GameModeId;
  difficulty: Difficulty;
  category: QuestionCategory | string;
  question: string;
  correctAnswer: string;
  options?: string[];
  hints?: string[];
  explanation: string;
}

export interface ThreeClubsQuestion extends BaseQuestion {
  mode: 'three-clubs';
  clubs: [string, string, string];
  playerClubStints?: { [clubId: string]: string };
}

export interface CareerPathQuestion extends BaseQuestion {
  mode: 'career-path';
  clubs: {
    clubId: string;
    clubName: string;
    period: string;
    apps?: number;
    goals?: number;
  }[];
}

export interface GuessPlayerQuestion extends BaseQuestion {
  mode: 'guess-player';
  subType: 'clues' | 'stats' | 'progressive' | 'career' | 'silhouette';
  clues: {
    label: string;
    value: string;
  }[];
  statsBreakdown?: {
    matches?: number;
    goals?: number;
    assists?: number;
    trophies?: string[];
    individualAwards?: string[];
  };
}

export interface FootballQuizQuestion extends BaseQuestion {
  mode: 'football-quiz';
  options: string[];
}

export interface JumbledNameQuestion extends BaseQuestion {
  mode: 'jumbled-name';
  jumbledLetters: string;
  nationality: string;
  position: string;
  era: string;
}

export interface TransferQuizQuestion extends BaseQuestion {
  mode: 'transfer-quiz';
  options: string[];
}

export interface ShirtNumberQuestion extends BaseQuestion {
  mode: 'shirt-number';
  options: string[];
}

export type AnyQuestion =
  | ThreeClubsQuestion
  | CareerPathQuestion
  | GuessPlayerQuestion
  | FootballQuizQuestion
  | JumbledNameQuestion
  | TransferQuizQuestion
  | ShirtNumberQuestion;

export interface TicTacToePlayer {
  id: string;
  name: string;
  clubs: string[];
  attributes: string[];
}

export interface TicTacToeCell {
  row: number;
  col: number;
  claimedBy: 'player' | 'cpu' | null;
  playerAnswer?: string;
}

export interface GameSettings {
  mode: GameModeId;
  difficulty: Difficulty;
  questionCount: 5 | 10 | 15;
  timerSeconds: number; // 0 = unlimited, 15, 30, 45
  inputMode: 'choice' | 'text';
}

export interface UserProfile {
  id: string;
  username: string;
  avatarId: string;
  createdAt: number;
  soundEnabled: boolean;
}

export interface BattlePlayerState {
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
}

export type BattlePhase =
  | 'lobby'
  | 'loading'
  | 'playing'
  | 'intermission'
  | 'finished';

export interface BattleRoomState {
  code: string;
  hostId: string;
  modes: GameModeId[];
  questionCount: 5 | 10 | 15;
  timerSeconds: number;
  phase: BattlePhase;
  currentModeIndex: number;
  intermissionEndsAt: number | null;
  players: BattlePlayerState[];
  currentQuestions: AnyQuestion[];
  questionSource: 'ai' | 'cached';
}

