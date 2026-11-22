import React from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Shuffle, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  WifiOff, 
  Flame,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { StudyRange } from '../types/vocab';

interface HeaderProps {
  studyRange: StudyRange;
  onRangeChange: (range: StudyRange) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  onSync: () => void;
  isSyncing: boolean;
  onOpenSettings: () => void;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  currentIndex: number;
  totalCards: number;
  isOffline: boolean;
  lastSyncedAt: Date | null;
  wrongHistoryCount: number;
  currentStreak: number;
}

export const Header: React.FC<HeaderProps> = ({
  studyRange,
  onRangeChange,
  isShuffle,
  onToggleShuffle,
  onSync,
  isSyncing,
  onOpenSettings,
  correctCount,
  wrongCount,
  skippedCount,
  currentIndex,
  totalCards,
  isOffline,
  lastSyncedAt,
  wrongHistoryCount,
  currentStreak,
}) => {
  const currentCardNumber = Math.min(currentIndex + 1, totalCards);
  const progressPercent = totalCards > 0 ? Math.round((currentCardNumber / totalCards) * 100) : 0;

  return (
    <header className="w-full max-w-4xl mx-auto px-4 pt-3 sm:pt-5 pb-2">
      {/* Top Navbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 backdrop-blur-xl px-4 py-3 rounded-3xl border border-indigo-100/80 shadow-md shadow-indigo-500/5">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 ring-2 ring-white">
            <span className="font-bold text-xl font-chinese leading-none">汉</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-violet-700 via-indigo-700 to-sky-600 bg-clip-text text-transparent tracking-tight">
                Hán Tự Review
              </h1>
              {isOffline && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200" title="Đang dùng dữ liệu lưu ngoại tuyến">
                  <WifiOff size={11} />
                  <span>Offline</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Ôn từ vựng & gõ chữ Hán mỗi ngày 🏮✨
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Streak Badge for Students */}
          {currentStreak > 1 && (
            <div 
              className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm shadow-orange-500/25 animate-bounce"
              title={`Chuỗi làm đúng: ${currentStreak} từ liên tiếp!`}
            >
              <Flame size={14} className="fill-amber-200 text-amber-100" />
              <span>x{currentStreak}</span>
            </div>
          )}

          {/* Scope Dropdown */}
          <div className="relative">
            <select
              value={studyRange}
              onChange={(e) => onRangeChange(e.target.value as StudyRange)}
              aria-label="Chọn phạm vi từ vựng ôn tập"
              className="text-xs sm:text-sm font-semibold bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-900 py-1.5 px-3 rounded-2xl border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-400 transition-all cursor-pointer"
            >
              <option value="all">📚 Tất cả ({totalCards})</option>
              <option value="latest20">⚡ 20 từ mới nhất</option>
              <option value="latest50">🔥 50 từ mới nhất</option>
              <option value="incorrect">
                ⚠️ Cần ôn lại {wrongHistoryCount > 0 ? `(${wrongHistoryCount})` : ''}
              </option>
            </select>
          </div>

          {/* Shuffle Toggle */}
          <button
            onClick={onToggleShuffle}
            title={isShuffle ? 'Đang bật trộn ngẫu nhiên' : 'Bật trộn ngẫu nhiên'}
            className={`p-2 rounded-2xl transition-all cursor-pointer ${
              isShuffle
                ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Shuffle size={17} />
          </button>

          {/* Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            title={lastSyncedAt ? `Đồng bộ Sheet (Lần cuối: ${lastSyncedAt.toLocaleTimeString('vi-VN')})` : 'Đồng bộ lại từ Google Sheet'}
            className={`p-2 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 transition-all cursor-pointer ${
              isSyncing ? 'animate-spin text-indigo-600' : ''
            }`}
          >
            <RotateCcw size={17} />
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            title="Cài đặt & Chia sẻ"
            className="p-2 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 transition-all cursor-pointer"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      {/* Progress & Stat Pill */}
      <div className="mt-2.5 px-4 py-2.5 bg-white/70 backdrop-blur-md rounded-2xl border border-indigo-100/60 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Tiến trình:</span>
            <span className="font-bold text-slate-800">
              {totalCards > 0 ? `${currentCardNumber} / ${totalCards}` : '0 / 0'}
            </span>
            <span className="text-indigo-600 font-semibold">({progressPercent}%)</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 size={13} />
              <span>{correctCount} đúng</span>
            </span>
            {wrongCount > 0 && (
              <span className="inline-flex items-center gap-1 text-rose-500 font-semibold">
                <XCircle size={13} />
                <span>{wrongCount} sai</span>
              </span>
            )}
            {skippedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                <HelpCircle size={13} />
                <span>{skippedCount} qua</span>
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Rainbow Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-600 rounded-full transition-all duration-400 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </header>
  );
};
