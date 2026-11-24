import { useState, useEffect, useMemo, useCallback } from 'react';
import { VocabItem, QuizStatus, StudyRange, CardHistory } from '../types/vocab';
import { isAnswerCorrect } from '../utils/textNormalizer';

const STORAGE_WRONG_KEY = 'vocab_wrong_history_v1';
const STORAGE_FLAGGED_KEY = 'vocab_flagged_history_v1';

export interface CardState {
  status: QuizStatus;
  userTyped: string;
  attempts: number;
  hintLevel: number; // 0 = none, 1 = pinyin, 2 = letter count/blanks, 3 = full answer
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useQuizSession(allItems: VocabItem[]) {
  const [studyRange, setStudyRange] = useState<StudyRange>('all');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  
  // Card states keyed by item.id
  const [cardsState, setCardsState] = useState<Record<string | number, CardState>>({});

  // History of wrong words stored across sessions: Map<itemId, CardHistory>
  const [wrongHistory, setWrongHistory] = useState<Record<string | number, CardHistory>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WRONG_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Flagged words (gắn cờ 🚩) stored across sessions
  const [flaggedIds, setFlaggedIds] = useState<Record<string | number, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FLAGGED_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Session seed: increments when starting/restarting a session or changing range/shuffle,
  // ensuring the current session card list is stable while answering cards!
  const [sessionSeed, setSessionSeed] = useState<number>(0);

  // Save wrongHistory to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WRONG_KEY, JSON.stringify(wrongHistory));
    } catch (e) {
      console.warn('Could not save wrong history to localStorage:', e);
    }
  }, [wrongHistory]);

  // Save flaggedIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FLAGGED_KEY, JSON.stringify(flaggedIds));
    } catch (e) {
      console.warn('Could not save flagged items to localStorage:', e);
    }
  }, [flaggedIds]);

  // Toggle flag on/off
  const toggleFlag = useCallback((itemId: string | number) => {
    setFlaggedIds(prev => {
      const next = { ...prev };
      if (next[itemId]) {
        delete next[itemId];
      } else {
        next[itemId] = true;
      }
      return next;
    });
  }, []);

  const isFlagged = useCallback((itemId: string | number) => {
    return Boolean(flaggedIds[itemId]);
  }, [flaggedIds]);

  // Order items based on range and shuffle setting, anchored to sessionSeed
  const activeItems = useMemo(() => {
    if (!allItems || allItems.length === 0) return [];

    let result: VocabItem[] = [];

    if (studyRange.startsWith('block_')) {
      // Dynamic STT blocks e.g. block_1_100, block_101_200
      const parts = studyRange.split('_');
      const start = Math.max(0, parseInt(parts[1], 10) - 1);
      const end = parseInt(parts[2], 10);
      result = allItems.slice(start, end);
    } else if (studyRange === 'random100') {
      // Pick random 100 items from all items
      const sampleSize = Math.min(100, allItems.length);
      result = shuffleArray(allItems).slice(0, sampleSize);
    } else if (studyRange === 'flagged') {
      // Only flagged words
      result = allItems.filter(item => Boolean(flaggedIds[item.id]));
    } else if (studyRange === 'review_all') {
      // Combined: words marked wrong OR flagged
      result = allItems.filter(item => {
        const isW = wrongHistory[item.id] && (wrongHistory[item.id].wrongCount > 0 || wrongHistory[item.id].lastStatus === 'wrong' || wrongHistory[item.id].lastStatus === 'skipped');
        const isF = Boolean(flaggedIds[item.id]);
        return isW || isF;
      });
    } else if (studyRange === 'incorrect') {
      // Only words marked wrong or skipped
      result = allItems.filter(item => {
        const rec = wrongHistory[item.id];
        return rec && (rec.wrongCount > 0 || rec.lastStatus === 'wrong' || rec.lastStatus === 'skipped');
      });
    } else if (studyRange === 'latest20') {
      result = allItems.slice(-20);
    } else if (studyRange === 'latest50') {
      result = allItems.slice(-50);
    } else {
      // 'all'
      result = [...allItems];
    }

    if (isShuffle && studyRange !== 'random100') {
      return shuffleArray(result);
    }
    return result;
  }, [allItems, studyRange, isShuffle, sessionSeed]);

  // Reset session when user deliberately switches filter or shuffle mode
  useEffect(() => {
    setCurrentIndex(0);
    setCardsState({});
    setSessionSeed(s => s + 1);
  }, [studyRange, isShuffle]);

  // When items list updates from background sync, keep current card index in bounds
  useEffect(() => {
    setCurrentIndex(prev => {
      if (activeItems.length === 0) return 0;
      if (prev >= activeItems.length) {
        return Math.max(0, activeItems.length - 1);
      }
      return prev;
    });
  }, [activeItems.length]);

  const currentItem = activeItems[currentIndex] || null;

  const currentCardState = useMemo<CardState>(() => {
    if (!currentItem) {
      return { status: 'idle', userTyped: '', attempts: 0, hintLevel: 0 };
    }
    return (
      cardsState[currentItem.id] || {
        status: 'idle',
        userTyped: '',
        attempts: 0,
        hintLevel: 0,
      }
    );
  }, [currentItem, cardsState]);

  // Record a wrong attempt in persistent history
  const recordWrongHistory = useCallback((itemId: string | number, status: 'wrong' | 'skipped') => {
    setWrongHistory(prev => {
      const existing: CardHistory = prev[itemId] || { wrongCount: 0, lastReviewedAt: Date.now(), lastStatus: status };
      const updated: CardHistory = {
        wrongCount: existing.wrongCount + 1,
        lastReviewedAt: Date.now(),
        lastStatus: status,
      };
      return {
        ...prev,
        [itemId]: updated,
      };
    });
  }, []);

  // Record a correct attempt: remove from wrongHistory and, if in review mode, unflag from flaggedIds
  const recordCorrectHistory = useCallback((itemId: string | number) => {
    // 1. Remove from wrongHistory so it is no longer marked wrong
    setWrongHistory(prev => {
      if (!prev[itemId]) return prev;
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    // 2. If in review mode ('review_all', 'flagged', or 'incorrect'), unflag so the review list shrinks toward 0
    if (studyRange === 'review_all' || studyRange === 'flagged' || studyRange === 'incorrect') {
      setFlaggedIds(prev => {
        if (!prev[itemId]) return prev;
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
  }, [studyRange]);

  // Submit answer
  const submitAnswer = useCallback((input: string): boolean => {
    if (!currentItem) return false;

    const isCorrect = isAnswerCorrect(input, currentItem.validAnswers);
    const prevAttempts = currentCardState.attempts;
    const nextStatus: QuizStatus = isCorrect ? 'correct' : 'wrong';

    setCardsState(prev => {
      const updatedState: CardState = {
        ...currentCardState,
        userTyped: input,
        status: nextStatus,
        attempts: prevAttempts + 1,
      };
      return {
        ...prev,
        [currentItem.id]: updatedState,
      };
    });

    if (isCorrect) {
      setCurrentStreak(prev => {
        const next = prev + 1;
        setMaxStreak(m => Math.max(m, next));
        return next;
      });
      recordCorrectHistory(currentItem.id);
    } else {
      setCurrentStreak(0);
      recordWrongHistory(currentItem.id, 'wrong');
    }

    return isCorrect;
  }, [currentItem, currentCardState, recordCorrectHistory, recordWrongHistory]);

  // Request next hint level
  const requestHint = useCallback(() => {
    if (!currentItem) return;
    setCardsState(prev => {
      const current = prev[currentItem.id] || { status: 'idle', userTyped: '', attempts: 0, hintLevel: 0 };
      const nextLevel = Math.min(current.hintLevel + 1, 3);
      const nextStatus: QuizStatus = nextLevel === 3 ? 'revealed' : current.status;
      const updatedState: CardState = {
        ...current,
        hintLevel: nextLevel,
        status: nextStatus,
      };
      return {
        ...prev,
        [currentItem.id]: updatedState,
      };
    });
  }, [currentItem]);

  // Skip card: reveals answer and marks as skipped
  const skipCard = useCallback(() => {
    if (!currentItem) return;
    const updatedState: CardState = {
      ...currentCardState,
      status: 'revealed',
      hintLevel: 3,
    };
    setCardsState(prev => ({
      ...prev,
      [currentItem.id]: updatedState,
    }));
    setCurrentStreak(0);
    recordWrongHistory(currentItem.id, 'skipped');
  }, [currentItem, currentCardState, recordWrongHistory]);

  // Navigation
  const goNext = useCallback(() => {
    if (currentIndex < activeItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(activeItems.length);
    }
  }, [currentIndex, activeItems.length]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const jumpToIndex = useCallback((index: number) => {
    if (index >= 0 && index <= activeItems.length) {
      setCurrentIndex(index);
    }
  }, [activeItems.length]);

  // Session Statistics
  const stats = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    activeItems.forEach(item => {
      const state = cardsState[item.id];
      if (state) {
        if (state.status === 'correct') correct++;
        else if (state.status === 'wrong') wrong++;
        else if (state.status === 'revealed') skipped++;
      }
    });

    const completed = correct + wrong + skipped;
    return {
      correct,
      wrong,
      skipped,
      completed,
      total: activeItems.length,
      isSessionFinished: currentIndex >= activeItems.length && activeItems.length > 0,
    };
  }, [activeItems, cardsState, currentIndex]);

  const restartSession = useCallback(() => {
    setCurrentIndex(0);
    setCardsState({});
    setCurrentStreak(0);
    setSessionSeed(s => s + 1);
  }, []);

  const clearWrongHistory = useCallback(() => {
    setWrongHistory({});
    try {
      localStorage.removeItem(STORAGE_WRONG_KEY);
    } catch (e) {
      console.warn('Failed to clear wrong history:', e);
    }
  }, []);

  const clearFlaggedWords = useCallback(() => {
    setFlaggedIds({});
    try {
      localStorage.removeItem(STORAGE_FLAGGED_KEY);
    } catch (e) {
      console.warn('Failed to clear flagged words:', e);
    }
  }, []);

  const wrongHistoryCount = useMemo(() => {
    return Object.values(wrongHistory).filter(v => v.wrongCount > 0 || v.lastStatus === 'wrong').length;
  }, [wrongHistory]);

  const flaggedCount = useMemo(() => {
    return Object.keys(flaggedIds).length;
  }, [flaggedIds]);

  const reviewAllCount = useMemo(() => {
    const wrongKeys = new Set(
      Object.entries(wrongHistory)
        .filter(([_, v]) => v.wrongCount > 0 || v.lastStatus === 'wrong' || v.lastStatus === 'skipped')
        .map(([k]) => k)
    );
    Object.keys(flaggedIds).forEach(k => wrongKeys.add(k));
    return wrongKeys.size;
  }, [wrongHistory, flaggedIds]);

  return {
    studyRange,
    setStudyRange,
    isShuffle,
    setIsShuffle,
    currentIndex,
    activeItems,
    currentItem,
    currentCardState,
    cardsState,
    currentStreak,
    maxStreak,
    submitAnswer,
    requestHint,
    skipCard,
    goNext,
    goBack,
    jumpToIndex,
    stats,
    restartSession,
    clearWrongHistory,
    clearFlaggedWords,
    wrongHistoryCount,
    flaggedCount,
    reviewAllCount,
    toggleFlag,
    isFlagged,
  };
}
