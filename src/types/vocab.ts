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

export type StudyRange = 'all' | 'latest20' | 'latest50' | 'incorrect';

export interface AppSettings {
  sheetUrl: string;
  autoSpeak: boolean;
  soundEffects: boolean;
  speechRate: number; // e.g. 1.0, 0.75
  autoNextOnCorrect: boolean;
  selectedVoiceName?: string;
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
