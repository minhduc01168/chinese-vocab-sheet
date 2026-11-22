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
  Flame,
  Award
} from 'lucide-react';
import { VocabItem } from '../types/vocab';
import { CardState } from '../hooks/useQuizSession';
import { playSound } from '../utils/soundEffects';

interface SummaryModalProps {
  isOpen: boolean;
  activeItems: VocabItem[];
  cardsState: Record<string | number, CardState>;
  onRestart: () => void;
  onRetryWrongOnly: () => void;
  onSpeak: (text: string) => void;
  maxStreak?: number;
  soundEffects?: boolean;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  activeItems,
  cardsState,
  onRestart,
  onRetryWrongOnly,
  onSpeak,
  maxStreak = 0,
  soundEffects = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      if (soundEffects) playSound.streak();
      // Burst celebratory confetti
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, soundEffects]);

  if (!isOpen) return null;

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

  // Rank determination
  let rankTitle = 'Đang tiến bộ 🌱';
  let rankBadge = 'bg-amber-100 text-amber-800 border-amber-300';
  if (accuracy === 100) {
    rankTitle = '👑 Rank SSS: Thần Đồng Hán Tự';
    rankBadge = 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 border-yellow-200 shadow-md';
  } else if (accuracy >= 90) {
    rankTitle = '🌟 Rank S: Cao Thủ Tiếng Trung';
    rankBadge = 'bg-indigo-100 text-indigo-900 border-indigo-300';
  } else if (accuracy >= 75) {
    rankTitle = '🚀 Rank A: Học Bá Xuất Sắc';
    rankBadge = 'bg-sky-100 text-sky-900 border-sky-300';
  } else if (accuracy >= 50) {
    rankTitle = '💪 Rank B: Tiến Bộ Vượt Bậc';
    rankBadge = 'bg-emerald-100 text-emerald-900 border-emerald-300';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with Rank */}
        <div className="bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-600 px-6 py-7 text-center text-white relative">
          <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner ring-4 ring-white/10">
            <Trophy size={34} className="text-amber-300 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Hoàn Thành Xuất Sắc! 🎉</h2>
          
          <div className="mt-2.5">
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${rankBadge}`}>
              {rankTitle}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 bg-slate-50/90 border-b border-slate-100 py-3 text-center">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Chính xác</div>
            <div className="text-lg sm:text-xl font-extrabold text-indigo-600 mt-0.5">{accuracy}%</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Đúng</div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-0.5">{correctCount}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Cần ôn</div>
            <div className="text-lg sm:text-xl font-extrabold text-rose-500 mt-0.5">{wrongCount + skippedCount}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Streak Max</div>
            <div className="text-lg sm:text-xl font-extrabold text-orange-500 mt-0.5 flex items-center justify-center gap-0.5">
              <Flame size={15} className="fill-orange-500 text-orange-500" />
              <span>{maxStreak}</span>
            </div>
          </div>
        </div>

        {/* Word Review List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 divide-y divide-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chi tiết kết quả ({total} từ)
            </h4>
            <span className="text-[11px] text-slate-400">Bấm loa để nghe lại</span>
          </div>

          {activeItems.map((item) => {
            const state = cardsState[item.id];
            const isCorrect = state?.status === 'correct';
            const isWrong = state?.status === 'wrong';

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
                      <span className="text-xs font-mono text-indigo-600 font-semibold">{item.pinyin}</span>
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
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  <Volume2 size={17} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
          {hasWrongOrSkipped && (
            <button
              type="button"
              onClick={onRetryWrongOnly}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw size={16} />
              <span>Ôn lại các từ chưa đúng ({wrongCount + skippedCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className={`py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
              hasWrongOrSkipped
                ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
                : 'flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/25'
            }`}
          >
            <RotateCcw size={16} />
            <span>Luyện lại toàn bộ lượt này</span>
          </button>
        </div>
      </div>
    </div>
  );
};
