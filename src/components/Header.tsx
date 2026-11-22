import React from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Shuffle, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  WifiOff, 
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
}) => {
  const currentCardNumber = Math.min(currentIndex + 1, totalCards);
  const progressPercent = totalCards > 0 ? Math.round((currentCardNumber / totalCards) * 100) : 0;

  return (
    <header className="w-full max-w-4xl mx-auto px-4 pt-4 pb-2">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <span className="font-bold text-lg font-chinese leading-none">汉</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Hán Tự Review</h1>
              {isOffline && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200" title="Đang dùng dữ liệu lưu ngoại tuyến">
                  <WifiOff size={11} />
                  <span>Offline</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Ôn tập từ vựng & gõ chữ Hán từ Google Sheet</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Study Scope Dropdown */}
          <div className="relative">
            <select
              value={studyRange}
              onChange={(e) => onRangeChange(e.target.value as StudyRange)}
              aria-label="Chọn phạm vi từ vựng ôn tập"
              className="text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200/70 text-slate-700 py-1.5 px-2.5 sm:px-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="all">📚 Tất cả ({totalCards})</option>
              <option value="latest20">⚡ 20 từ mới nhất</option>
              <option value="latest50">🔥 50 từ mới nhất</option>
              <option value="incorrect">
                ⚠️ Cần ôn lại {wrongHistoryCount > 0 ? `(${wrongHistoryCount})` : ''}
              </option>
            </select>
          </div>

          {/* Shuffle Button */}
          <button
            onClick={onToggleShuffle}
            title={isShuffle ? 'Đang bật trộn ngẫu nhiên' : 'Bật trộn ngẫu nhiên'}
            className={`p-2 rounded-xl transition-all ${
              isShuffle
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
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
            className={`p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 transition-all ${
              isSyncing ? 'animate-spin text-blue-600' : ''
            }`}
          >
            <RotateCcw size={17} />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Cài đặt & Chia sẻ"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 transition-all"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      {/* Progress & Quick Stats Card */}
      <div className="mt-2.5 px-4 py-2.5 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Tiến độ:</span>
            <span className="font-semibold text-slate-900">
              {totalCards > 0 ? `${currentCardNumber} / ${totalCards}` : '0 / 0'}
            </span>
            <span className="text-slate-400">({progressPercent}%)</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <CheckCircle2 size={13} />
              <span>Đúng: <b>{correctCount}</b></span>
            </span>
            {wrongCount > 0 && (
              <span className="inline-flex items-center gap-1 text-rose-500">
                <XCircle size={13} />
                <span>Sai: <b>{wrongCount}</b></span>
              </span>
            )}
            {skippedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-500">
                <HelpCircle size={13} />
                <span>Bỏ qua: <b>{skippedCount}</b></span>
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </header>
  );
};
