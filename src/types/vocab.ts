export interface VocabItem {
  id: string | number;
  originalIndex: number;
  hanzi: string;
  validAnswers: string[];
  meaning: string;
  pinyin: string;
  sinoVietnamese?: string;
  example?: string;
  note?: string;
}

export type QuizStatus = 'idle' | 'correct' | 'wrong' | 'revealed';

// Extended study ranges including blocks (e.g. block_1_100, block_101_200), random 100, flagged, review_all
export type StudyRange = 
  | 'all' 
  | 'latest20' 
  | 'latest50' 
  | 'random100'
  | 'flagged' 
  | 'incorrect'
  | 'review_all'
  | string; // Allows dynamic blocks like block_0_100, block_100_200

export interface AiExampleItem {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

export interface AppSettings {
  sheetUrl: string;
  autoSpeak: boolean;
  soundEffects: boolean;
  speechRate: number; // e.g. 1.0, 0.75
  autoNextOnCorrect: boolean;
  selectedVoiceName?: string;
  geminiApiKey?: string;
  adminPasscode?: string;
}

export interface CardHistory {
  wrongCount: number;
  lastReviewedAt: number;
  lastStatus: 'correct' | 'wrong' | 'skipped';
}

export interface SheetParseResult {
  sheetId: string;
  gid: string;
  items: VocabItem[];
  title?: string;
  fetchedAt: number;
}
