import React from 'react';
import { ChevronLeft, ChevronRight, Check, ArrowRight } from 'lucide-react';
import { QuizStatus } from '../types/vocab';

interface ActionBarProps {
  canGoBack: boolean;
  onBack: () => void;
  status: QuizStatus;
  onCheck: () => void;
  onNext: () => void;
  onSkip: () => void;
  isLastCard: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  canGoBack,
  onBack,
  status,
  onCheck,
  onNext,
  onSkip,
  isLastCard,
}) => {
  const isResolved = status === 'correct' || status === 'revealed';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-6 pt-2">
      {/* Action Buttons Row */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          disabled={!canGoBack}
          type="button"
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all ${
            canGoBack
              ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-sm cursor-pointer active:scale-95'
              : 'bg-slate-100 text-slate-400 border border-slate-200/40 cursor-not-allowed opacity-60'
          }`}
          title="Quay lại từ trước (Alt + ←)"
        >
          <ChevronLeft size={18} />
          <span>Quay lại</span>
        </button>

        {/* Primary Action Button: Check OR Next */}
        {isResolved ? (
          <button
            onClick={onNext}
            type="button"
            className="flex-2 sm:flex-1 flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
            title="Sang từ tiếp theo (Enter)"
          >
            <span>{isLastCard ? 'Xem bảng điểm 🎉' : 'Tiếp theo'}</span>
            <ArrowRight size={20} />
          </button>
        ) : (
          <button
            onClick={onCheck}
            type="button"
            className="flex-2 sm:flex-1 flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 hover:from-violet-700 hover:to-sky-700 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
            title="Kiểm tra đáp án (Enter)"
          >
            <Check size={20} />
            <span>Kiểm tra</span>
          </button>
        )}

        {/* Skip Button */}
        <button
          onClick={onSkip}
          disabled={isResolved}
          type="button"
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all ${
            !isResolved
              ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-sm cursor-pointer active:scale-95'
              : 'bg-slate-100 text-slate-400 border border-slate-200/40 cursor-not-allowed opacity-60'
          }`}
          title="Bỏ qua từ này (Tab hoặc Alt + →)"
        >
          <span>Bỏ qua</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Keyboard Shortcuts Hint (Desktop only) */}
      <div className="hidden md:flex items-center justify-center gap-4 mt-3 text-[11px] text-slate-500 select-none font-medium">
        <span><kbd className="px-1.5 py-0.5 bg-slate-200/80 rounded-md text-slate-700 font-mono shadow-xs">Enter</kbd> {isResolved ? 'Tiếp tục' : 'Kiểm tra'}</span>
        <span><kbd className="px-1.5 py-0.5 bg-slate-200/80 rounded-md text-slate-700 font-mono shadow-xs">Ctrl + Space</kbd> Nghe lại</span>
        <span><kbd className="px-1.5 py-0.5 bg-slate-200/80 rounded-md text-slate-700 font-mono shadow-xs">Alt + →</kbd> Bỏ qua</span>
        <span><kbd className="px-1.5 py-0.5 bg-slate-200/80 rounded-md text-slate-700 font-mono shadow-xs">Alt + ←</kbd> Quay lại</span>
      </div>
    </div>
  );
};
