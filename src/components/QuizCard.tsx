import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  BookMarked,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { VocabItem, QuizStatus } from '../types/vocab';
import { CardState } from '../hooks/useQuizSession';

interface QuizCardProps {
  item: VocabItem;
  cardState: CardState;
  onSubmit: (input: string) => boolean;
  onRequestHint: () => void;
  onSpeak: (text: string, rate?: number) => void;
  onNext: () => void;
  autoSpeak: boolean;
  speechRate: number;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  item,
  cardState,
  onSubmit,
  onRequestHint,
  onSpeak,
  onNext,
  autoSpeak,
  speechRate,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [localRate, setLocalRate] = useState<number>(speechRate);
  const [shake, setShake] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isResolved = cardState.status === 'correct' || cardState.status === 'revealed';
  const isWrong = cardState.status === 'wrong';

  // Sync speech rate from parent settings
  useEffect(() => {
    setLocalRate(speechRate);
  }, [speechRate]);

  // Reset or initialize input when word changes
  useEffect(() => {
    setInputValue(cardState.userTyped || '');
    setShake(false);

    // Auto-focus on new item
    const timer = setTimeout(() => {
      if (inputRef.current && !isResolved) {
        inputRef.current.focus();
        if (cardState.userTyped) {
          inputRef.current.select();
        }
      }
    }, 50);

    // If autoSpeak is on and card is resolved (e.g., correct or revealed), speak it
    if (autoSpeak && cardState.status === 'correct') {
      onSpeak(item.validAnswers[0] || item.hanzi, localRate);
    }

    return () => clearTimeout(timer);
  }, [item.id, cardState.status]);

  // Handle wrong shake animation trigger
  useEffect(() => {
    if (isWrong) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      // Select input text for quick correction
      if (inputRef.current) {
        inputRef.current.select();
      }
      return () => clearTimeout(timer);
    }
  }, [isWrong, cardState.attempts]);

  // Handle Input KeyDown with strict IME composition handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // CRITICAL for Chinese IME: do not submit while user is composing characters with pinyin
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (isResolved) {
        onNext();
      } else {
        handleCheckAnswer();
      }
    }
  };

  const handleCheckAnswer = () => {
    if (!inputValue.trim()) {
      // If empty and user presses enter, highlight hint or gently remind
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    const isCorrect = onSubmit(inputValue);
    if (isCorrect && autoSpeak) {
      onSpeak(item.validAnswers[0] || item.hanzi, localRate);
    }
  };

  const toggleSpeechRate = () => {
    const nextRate = localRate === 1.0 ? 0.75 : 1.0;
    setLocalRate(nextRate);
    onSpeak(item.validAnswers[0] || item.hanzi, nextRate);
  };

  // Generate blank spaces for hint level 2 (e.g. "_ _" for 2-character word)
  const getCharBlanksHint = () => {
    const sample = item.validAnswers[0] || item.hanzi;
    // Replace Chinese characters with underscore placeholders
    return sample
      .split('')
      .map(char => (/[\u4e00-\u9fa5]/.test(char) ? '—' : char))
      .join(' ');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-3 flex-1 flex flex-col justify-center">
      <div 
        className={`bg-white rounded-3xl border transition-all duration-300 shadow-lg shadow-slate-200/50 p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden ${
          cardState.status === 'correct'
            ? 'border-emerald-300 ring-4 ring-emerald-500/10'
            : isWrong
            ? 'border-rose-300 ring-4 ring-rose-500/10'
            : cardState.status === 'revealed'
            ? 'border-amber-300 ring-4 ring-amber-500/10'
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Question Header: Vietnamese Meaning */}
        <div className="w-full mb-6">
          <span className="inline-block text-[11px] font-semibold tracking-wider uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3">
            Nghĩa Tiếng Việt
          </span>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-snug tracking-tight px-2">
            {item.meaning}
          </h2>

          {/* Optional Note / Part of Speech */}
          {item.note && (
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium italic">
              ({item.note})
            </p>
          )}
        </div>

        {/* Input Form */}
        <div className="w-full max-w-md my-2">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isResolved}
              autoFocus
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              placeholder={isResolved ? '' : 'Nhập chữ Hán tại đây...'}
              className={`w-full text-center text-2xl sm:text-3xl font-chinese font-medium py-3.5 px-4 rounded-2xl border-2 transition-all outline-none ${
                shake ? 'animate-shake' : ''
              } ${
                cardState.status === 'correct'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800'
                  : isWrong
                  ? 'border-rose-500 bg-rose-50/50 text-rose-800'
                  : cardState.status === 'revealed'
                  ? 'border-amber-400 bg-amber-50/40 text-amber-900'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/70 hover:bg-white text-slate-900'
              }`}
            />
          </div>

          {/* Status Message */}
          {isWrong && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-rose-600 font-medium animate-fade-in">
              <AlertCircle size={15} />
              <span>Chưa đúng, hãy thử lại hoặc xem gợi ý!</span>
            </div>
          )}
        </div>

        {/* Hint Area (When not yet solved) */}
        {!isResolved && (
          <div className="mt-4 flex flex-col items-center gap-2">
            {cardState.hintLevel > 0 && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-2 text-amber-900 animate-fade-in flex flex-col items-center gap-1">
                {cardState.hintLevel >= 1 && (
                  <div className="text-sm font-semibold tracking-wide">
                    Pinyin: <span className="text-amber-800 font-mono text-base">{item.pinyin}</span>
                  </div>
                )}
                {cardState.hintLevel >= 2 && (
                  <div className="text-xs text-amber-700 font-medium">
                    Số chữ Hán: <span className="font-bold tracking-widest text-sm">{getCharBlanksHint()}</span> ({item.validAnswers[0]?.length || 0} chữ)
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onRequestHint}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 hover:bg-amber-50/70 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
            >
              <Lightbulb size={14} className="text-amber-500" />
              <span>
                {cardState.hintLevel === 0 && 'Gợi ý (Bấm 1: Pinyin)'}
                {cardState.hintLevel === 1 && 'Gợi ý thêm (Bấm 2: Số chữ Hán)'}
                {cardState.hintLevel === 2 && 'Xem đáp án đầy đủ'}
              </span>
            </button>
          </div>
        )}

        {/* Resolved Area: Correct or Revealed Answer */}
        {isResolved && (
          <div className="w-full mt-5 pt-5 border-t border-slate-100 flex flex-col items-center gap-3 animate-fade-in">
            {/* Status Badge */}
            {cardState.status === 'correct' ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 size={14} />
                <span>Chính xác!</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <HelpCircle size={14} />
                <span>Đáp án đúng:</span>
              </div>
            )}

            {/* Hanzi Big Display */}
            <div className="text-4xl sm:text-5xl font-chinese font-bold text-slate-900 tracking-wider">
              {item.validAnswers.join(' / ')}
            </div>

            {/* Pinyin with tone */}
            <div className="text-lg sm:text-xl font-medium text-blue-600 font-mono tracking-wide">
              {item.pinyin}
            </div>

            {/* Sino-Vietnamese (Hán Việt) */}
            {item.sinoVietnamese && (
              <div className="text-xs sm:text-sm text-slate-600 font-medium">
                Hán Việt: <span className="font-semibold text-slate-800 uppercase tracking-wider">{item.sinoVietnamese}</span>
              </div>
            )}

            {/* Example sentence if available in Google Sheet */}
            {item.example && (
              <div className="w-full max-w-lg mt-2 bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Ví dụ:</span>
                  <button
                    onClick={() => onSpeak(item.example || '', localRate)}
                    title="Nghe câu ví dụ"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 size={13} />
                    <span>Nghe</span>
                  </button>
                </div>
                <p className="text-sm sm:text-base font-chinese text-slate-800">
                  {item.example}
                </p>
              </div>
            )}

            {/* Audio Controls */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => onSpeak(item.validAnswers[0] || item.hanzi, localRate)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
              >
                <Volume2 size={16} />
                <span>Nghe lại</span>
              </button>

              <button
                onClick={toggleSpeechRate}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                title="Thay đổi tốc độ phát âm"
              >
                {localRate}x
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
