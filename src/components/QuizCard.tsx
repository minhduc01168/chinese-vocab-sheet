import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Volume2, 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  Sparkles,
  PartyPopper,
  Flag,
  MessageSquareQuote,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { VocabItem, AiExampleItem } from '../types/vocab';
import { CardState } from '../hooks/useQuizSession';
import { playSound } from '../utils/soundEffects';
import { getWordExamples, generateExamplesWithGemini } from '../utils/aiExampleService';

interface QuizCardProps {
  item: VocabItem;
  cardState: CardState;
  onSubmit: (input: string) => boolean;
  onRequestHint: () => void;
  onSpeak: (text: string, rate?: number) => void;
  onNext: () => void;
  autoSpeak: boolean;
  soundEffects: boolean;
  speechRate: number;
  currentStreak: number;
  isFlagged: boolean;
  onToggleFlag: () => void;
  geminiApiKey?: string;
}

const ENCOURAGEMENTS = [
  'Đỉnh của chóp! 🚀',
  'Quá xuất sắc luôn! 🌟',
  'Trí nhớ siêu đỉnh! 🧠✨',
  'Chuẩn không cần chỉnh! 🎯',
  'Thần tốc luôn bạn ơi! ⚡',
  'Tuyệt vời ông mặt trời! 🎉',
];

export const QuizCard: React.FC<QuizCardProps> = ({
  item,
  cardState,
  onSubmit,
  onRequestHint,
  onSpeak,
  onNext,
  autoSpeak,
  soundEffects,
  speechRate,
  currentStreak,
  isFlagged,
  onToggleFlag,
  geminiApiKey,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [localRate, setLocalRate] = useState<number>(speechRate);
  const [shake, setShake] = useState<boolean>(false);
  const [cheerMessage, setCheerMessage] = useState<string>('Xuất sắc! 🎉');
  const [selectedExampleIndex, setSelectedExampleIndex] = useState<number>(0);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiGenError, setAiGenError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isResolved = cardState.status === 'correct' || cardState.status === 'revealed';
  const isWrong = cardState.status === 'wrong';

  useEffect(() => {
    setLocalRate(speechRate);
  }, [speechRate]);

  // When word changes
  useEffect(() => {
    setInputValue(cardState.userTyped || '');
    setShake(false);
    setSelectedExampleIndex(0);
    setAiGenError(null);

    const randomCheer = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    setCheerMessage(randomCheer);

    const timer = setTimeout(() => {
      if (inputRef.current && !isResolved) {
        inputRef.current.focus();
        if (cardState.userTyped) {
          inputRef.current.select();
        }
      }
    }, 60);

    // Auto-speak on resolved
    if (autoSpeak && cardState.status === 'correct') {
      onSpeak(item.validAnswers[0] || item.hanzi, localRate);
    }

    return () => clearTimeout(timer);
  }, [item.id, cardState.status]);

  // Handle wrong attempt animation & sound
  useEffect(() => {
    if (isWrong) {
      setShake(true);
      if (soundEffects) playSound.wrong();
      const timer = setTimeout(() => setShake(false), 500);
      if (inputRef.current) {
        inputRef.current.select();
      }
      return () => clearTimeout(timer);
    }
  }, [isWrong, cardState.attempts, soundEffects]);

  // Retrieve 3-5 example sentences for this word
  const wordExamples = useMemo<AiExampleItem[]>(() => {
    return getWordExamples(item.validAnswers[0] || item.hanzi, item.example);
  }, [item.id, item.validAnswers, item.hanzi, item.example, isGeneratingAi]);

  // IME Safe Keydown Handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // CRITICAL: Do not submit when composing pinyin with IME
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }

    // Alt + F to toggle flag
    if (e.altKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      onToggleFlag();
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
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    const isCorrect = onSubmit(inputValue);
    if (isCorrect) {
      if (soundEffects) {
        if (currentStreak >= 2) {
          playSound.streak();
        } else {
          playSound.correct();
        }
      }
      if (autoSpeak) {
        onSpeak(item.validAnswers[0] || item.hanzi, localRate);
      }
    }
  };

  const handleHintClick = () => {
    if (soundEffects) playSound.pop();
    onRequestHint();
  };

  const toggleSpeechRate = () => {
    const nextRate = localRate === 1.0 ? 0.75 : 1.0;
    setLocalRate(nextRate);
    onSpeak(item.validAnswers[0] || item.hanzi, nextRate);
  };

  const handleGenerateAiExamples = async () => {
    if (!geminiApiKey) {
      setAiGenError('Vui lòng vào Cài đặt (⚙) để cấu hình Google Gemini API Key trước.');
      return;
    }
    setIsGeneratingAi(true);
    setAiGenError(null);
    try {
      await generateExamplesWithGemini(
        geminiApiKey,
        item.validAnswers[0] || item.hanzi,
        item.meaning
      );
      if (soundEffects) playSound.pop();
    } catch (err: any) {
      setAiGenError(err.message || 'Lỗi gọi Gemini API.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const getCharBlanksHint = () => {
    const sample = item.validAnswers[0] || item.hanzi;
    return sample
      .split('')
      .map(char => (/[\u4e00-\u9fa5]/.test(char) ? '—' : char))
      .join(' ');
  };

  const currentExample = wordExamples[selectedExampleIndex] || wordExamples[0];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-2 sm:py-4 flex-1 flex flex-col justify-center">
      <div 
        className={`bg-white/95 backdrop-blur-xl rounded-3xl border transition-all duration-300 shadow-xl p-6 sm:p-9 flex flex-col items-center text-center relative overflow-hidden ${
          cardState.status === 'correct'
            ? 'border-emerald-300 ring-4 ring-emerald-500/15 shadow-emerald-500/10'
            : isWrong
            ? 'border-rose-300 ring-4 ring-rose-500/15 shadow-rose-500/10'
            : cardState.status === 'revealed'
            ? 'border-amber-300 ring-4 ring-amber-500/15 shadow-amber-500/10'
            : 'border-indigo-100 shadow-indigo-500/5 hover:border-indigo-200'
        }`}
      >
        {/* Playful Top Rainbow Bar */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-violet-500 via-indigo-500 via-sky-400 to-emerald-400" />

        {/* Top Action Row: Flag Bookmark Button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            type="button"
            onClick={onToggleFlag}
            title={isFlagged ? 'Bỏ gắn cờ (phím F)' : 'Gắn cờ từ khó để ôn lại (phím F)'}
            className={`p-2.5 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              isFlagged
                ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm shadow-rose-500/15'
                : 'bg-slate-100/80 text-slate-400 hover:text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <Flag 
              size={16} 
              className={isFlagged ? 'fill-rose-500 text-rose-500' : ''} 
            />
            {isFlagged && <span className="text-[11px] font-bold text-rose-600">Đã cắm cờ</span>}
          </button>
        </div>

        {/* Question Header: Vietnamese Meaning */}
        <div className="w-full mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-full mb-3 shadow-xs">
            <Sparkles size={13} className="text-indigo-500" />
            <span>Nghĩa Tiếng Việt</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-snug tracking-tight px-2">
            {item.meaning}
          </h2>

          {/* Optional Note / Part of Speech */}
          {item.note && (
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium italic">
              ({item.note})
            </p>
          )}
        </div>

        {/* Input Area */}
        <div className="w-full max-w-md my-1">
          <div className="relative group">
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
              placeholder={isResolved ? '' : '✍️ Gõ chữ Hán vào đây...'}
              className={`w-full text-center text-2xl sm:text-3xl font-chinese font-semibold py-3.5 px-4 rounded-2xl border-2 transition-all outline-none ${
                shake ? 'animate-shake' : ''
              } ${
                cardState.status === 'correct'
                  ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800 ring-2 ring-emerald-400/20'
                  : isWrong
                  ? 'border-rose-500 bg-rose-50/60 text-rose-800 ring-2 ring-rose-400/20'
                  : cardState.status === 'revealed'
                  ? 'border-amber-400 bg-amber-50/50 text-amber-900'
                  : 'border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/15 bg-slate-50/80 hover:bg-white text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:text-lg sm:placeholder:text-xl'
              }`}
            />
          </div>

          {/* Encouragement or Error message */}
          {isWrong && (
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-rose-600 font-semibold animate-fade-in bg-rose-50/80 py-1 px-3 rounded-xl border border-rose-100">
              <AlertCircle size={15} />
              <span>Chưa đúng rồi! Thử lại nha hoặc xem gợi ý bên dưới nè 💪</span>
            </div>
          )}
        </div>

        {/* Hint Area */}
        {!isResolved && (
          <div className="mt-4 flex flex-col items-center gap-2">
            {cardState.hintLevel > 0 && (
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl px-4 py-2 text-amber-900 animate-fade-in flex flex-col items-center gap-1 shadow-xs">
                {cardState.hintLevel >= 1 && (
                  <div className="text-sm font-semibold tracking-wide">
                    Pinyin: <span className="text-amber-800 font-mono text-base font-bold">{item.pinyin}</span>
                  </div>
                )}
                {cardState.hintLevel >= 2 && (
                  <div className="text-xs text-amber-700 font-medium">
                    Số chữ Hán: <span className="font-extrabold tracking-widest text-base text-amber-900">{getCharBlanksHint()}</span> ({item.validAnswers[0]?.length || 0} chữ)
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleHintClick}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-700 hover:bg-amber-50/90 px-3.5 py-1.5 rounded-xl transition-all font-semibold cursor-pointer border border-transparent hover:border-amber-200 active:scale-95"
            >
              <Lightbulb size={15} className="text-amber-500" />
              <span>
                {cardState.hintLevel === 0 && 'Gợi ý (Bấm 1: Pinyin)'}
                {cardState.hintLevel === 1 && 'Gợi ý thêm (Bấm 2: Số chữ Hán)'}
                {cardState.hintLevel === 2 && 'Xem đáp án đầy đủ'}
              </span>
            </button>
          </div>
        )}

        {/* Resolved Area: Correct or Revealed */}
        {isResolved && (
          <div className="w-full mt-5 pt-5 border-t border-slate-100 flex flex-col items-center gap-3 animate-fade-in">
            {/* Cheer Badge */}
            {cardState.status === 'correct' ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-xs">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>{cheerMessage}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/80 px-3.5 py-1.5 rounded-full border border-amber-200 shadow-xs">
                <PartyPopper size={15} className="text-amber-600" />
                <span>Đáp án đúng để bạn ghi nhớ mặt chữ nè:</span>
              </div>
            )}

            {/* Hanzi Big Display */}
            <div className="text-4xl sm:text-5xl font-chinese font-extrabold text-slate-900 tracking-wider">
              {item.validAnswers.join(' / ')}
            </div>

            {/* Pinyin with tones */}
            <div className="text-lg sm:text-xl font-bold text-indigo-600 font-mono tracking-wide">
              {item.pinyin}
            </div>

            {/* Sino-Vietnamese (Hán Việt) */}
            {item.sinoVietnamese && (
              <div className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100/90 px-3 py-1 rounded-xl">
                <span>Âm Hán Việt:</span>
                <span className="font-bold text-slate-800 uppercase tracking-wider">{item.sinoVietnamese}</span>
              </div>
            )}

            {/* 3-5 Example Sentences Carousel / Tabs */}
            {wordExamples.length > 0 ? (
              <div className="w-full max-w-lg mt-3 bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-slate-50 rounded-2xl p-4 border border-indigo-100 text-left shadow-xs">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-indigo-100/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                    <MessageSquareQuote size={15} className="text-indigo-600" />
                    <span>Mẫu câu thực tế ({selectedExampleIndex + 1}/{wordExamples.length})</span>
                  </div>

                  {/* Tabs Switcher for multiple examples */}
                  {wordExamples.length > 1 && (
                    <div className="flex items-center gap-1 bg-white/80 p-0.5 rounded-xl border border-indigo-100">
                      {wordExamples.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedExampleIndex(idx)}
                          className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedExampleIndex === idx
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Example Content */}
                {currentExample && (
                  <div className="space-y-1.5 animate-fade-in">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base sm:text-lg font-chinese font-bold text-slate-900 leading-snug">
                        {currentExample.hanzi}
                      </p>
                      <button
                        type="button"
                        onClick={() => onSpeak(currentExample.hanzi, localRate)}
                        title="Nghe câu này"
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 rounded-xl border border-indigo-100 shrink-0 cursor-pointer transition-colors shadow-xs"
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>

                    <p className="text-xs font-mono font-medium text-indigo-600">
                      {currentExample.pinyin}
                    </p>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {currentExample.meaning}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Fallback: button to generate examples with Gemini if not yet in store */
              <div className="w-full max-w-lg mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <button
                  type="button"
                  onClick={handleGenerateAiExamples}
                  disabled={isGeneratingAi}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles size={14} className={isGeneratingAi ? 'animate-spin' : ''} />
                  <span>{isGeneratingAi ? 'AI đang sinh 3 câu ví dụ...' : '✨ Tạo 3 câu ví dụ bằng AI (Gemini 2.5 Flash)'}</span>
                </button>
                {aiGenError && (
                  <p className="text-xs text-rose-600 mt-2 font-medium">{aiGenError}</p>
                )}
              </div>
            )}

            {/* Audio & Rate Pills */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => onSpeak(item.validAnswers[0] || item.hanzi, localRate)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
              >
                <Volume2 size={16} />
                <span>Nghe từ này</span>
              </button>

              <button
                onClick={toggleSpeechRate}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
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
