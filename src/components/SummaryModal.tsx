import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Volume2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { VocabItem } from '../types/vocab';
import { CardState } from '../hooks/useQuizSession';

interface SummaryModalProps {
  isOpen: boolean;
  activeItems: VocabItem[];
  cardsState: Record<string | number, CardState>;
  onRestart: () => void;
  onRetryWrongOnly: () => void;
  onSpeak: (text: string) => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  activeItems,
  cardsState,
  onRestart,
  onRetryWrongOnly,
  onSpeak,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti animation
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate statistics
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  activeItems.forEach(item => {
    const s = cardsState[item.id];
    if (s?.status === 'correct') correctCount++;
    else if (s?.status === 'wrong') wrongCount++;
    else if (s?.status === 'revealed') skippedCount++;
  });

  const total = activeItems.length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const hasWrongOrSkipped = wrongCount > 0 || skippedCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with celebration banner */}
        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 px-6 py-8 text-center text-white relative">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
            <Trophy size={32} className="text-amber-300 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Hoàn thành phiên ôn tập!</h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            Bạn đã hoàn thành toàn bộ {total} từ vựng trong lượt này
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50 border-b border-slate-100 py-3 text-center">
          <div>
            <div className="text-xs text-slate-500 font-medium">Độ chính xác</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 mt-0.5">{accuracy}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Đúng</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-0.5">{correctCount}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Cần cải thiện</div>
            <div className="text-xl sm:text-2xl font-bold text-rose-500 mt-0.5">{wrongCount + skippedCount}</div>
          </div>
        </div>

        {/* Word Review List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 divide-y divide-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Danh sách từ đã ôn ({total} từ)
          </h4>

          {activeItems.map((item, idx) => {
            const state = cardsState[item.id];
            const isCorrect = state?.status === 'correct';
            const isWrong = state?.status === 'wrong';
            const isSkipped = state?.status === 'revealed';

            return (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0">
                    {isCorrect ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={15} />
                      </span>
                    ) : isWrong ? (
                      <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                        <XCircle size={15} />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <HelpCircle size={15} />
                      </span>
                    )}
                  </div>

                  <div className="truncate">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base sm:text-lg font-bold font-chinese text-slate-900">
                        {item.validAnswers[0]}
                      </span>
                      <span className="text-xs font-mono text-blue-600">{item.pinyin}</span>
                      {item.sinoVietnamese && (
                        <span className="text-[11px] text-slate-400 hidden sm:inline">({item.sinoVietnamese})</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 truncate">{item.meaning}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSpeak(item.validAnswers[0])}
                  title="Phát âm"
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  <Volume2 size={17} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
          {hasWrongOrSkipped && (
            <button
              type="button"
              onClick={onRetryWrongOnly}
              className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>Ôn lại các từ chưa đúng ({wrongCount + skippedCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className={`py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              hasWrongOrSkipped
                ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                : 'flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
            }`}
          >
            <RotateCcw size={16} />
            <span>Luyện lại toàn bộ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
