import { useState, useEffect, useMemo, useCallback } from 'react';
import { VocabItem, QuizStatus, StudyRange, CardHistory } from '../types/vocab';
import { isAnswerCorrect } from '../utils/textNormalizer';

const STORAGE_WRONG_KEY = 'vocab_wrong_history_v1';

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

  // Save wrongHistory to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WRONG_KEY, JSON.stringify(wrongHistory));
    } catch (e) {
      console.warn('Could not save wrong history to localStorage:', e);
    }
  }, [wrongHistory]);

  // Filter items according to range
  const filteredItems = useMemo(() => {
    if (!allItems || allItems.length === 0) return [];

    let result: VocabItem[] = [];

    switch (studyRange) {
      case 'latest20':
        result = allItems.slice(-20);
        break;
      case 'latest50':
        result = allItems.slice(-50);
        break;
      case 'incorrect':
        result = allItems.filter(item => {
          const rec = wrongHistory[item.id];
          return rec && (rec.wrongCount > 0 || rec.lastStatus === 'wrong' || rec.lastStatus === 'skipped');
        });
        if (result.length === 0) {
          result = allItems.slice(0, 20);
        }
        break;
      case 'all':
      default:
        result = [...allItems];
        break;
    }

    return result;
  }, [allItems, studyRange, wrongHistory]);

  // Order items based on shuffle setting
  const activeItems = useMemo(() => {
    if (isShuffle) {
      return shuffleArray(filteredItems);
    }
    return filteredItems;
  }, [filteredItems, isShuffle]);

  // Reset or adjust index when activeItems change
  useEffect(() => {
    setCurrentIndex(0);
    setCardsState({});
  }, [studyRange, isShuffle, allItems]);

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

  // Record a correct attempt
  const recordCorrectHistory = useCallback((itemId: string | number) => {
    setWrongHistory(prev => {
      if (!prev[itemId]) return prev;
      const updated: CardHistory = {
        ...prev[itemId],
        lastReviewedAt: Date.now(),
        lastStatus: 'correct',
      };
      return {
        ...prev,
        [itemId]: updated,
      };
    });
  }, []);

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
      recordCorrectHistory(currentItem.id);
    } else {
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
  }, []);

  const clearWrongHistory = useCallback(() => {
    setWrongHistory({});
    try {
      localStorage.removeItem(STORAGE_WRONG_KEY);
    } catch (e) {
      console.warn('Failed to clear wrong history:', e);
    }
  }, []);

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
    submitAnswer,
    requestHint,
    skipCard,
    goNext,
    goBack,
    jumpToIndex,
    stats,
    restartSession,
    clearWrongHistory,
    wrongHistoryCount: Object.values(wrongHistory).filter(v => v.wrongCount > 0 || v.lastStatus === 'wrong').length,
  };
}
