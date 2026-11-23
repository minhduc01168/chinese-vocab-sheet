import React, { useMemo } from 'react';
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
  Bookmark,
  Flag
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
  allTotalCount: number;
  isOffline: boolean;
  lastSyncedAt: Date | null;
  wrongHistoryCount: number;
  flaggedCount: number;
  reviewAllCount: number;
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
  allTotalCount,
  isOffline,
  lastSyncedAt,
  wrongHistoryCount,
  flaggedCount,
  reviewAllCount,
  currentStreak,
}) => {
  const currentCardNumber = Math.min(currentIndex + 1, totalCards);
  const progressPercent = totalCards > 0 ? Math.round((currentCardNumber / totalCards) * 100) : 0;

  // Generate dynamic 100-word blocks based on total words in sheet
  const blocks = useMemo(() => {
    const list: { id: string; label: string }[] = [];
    if (allTotalCount <= 0) return list;
    const blockSize = 100;
    const totalBlocks = Math.ceil(allTotalCount / blockSize);
    for (let i = 0; i < totalBlocks; i++) {
      const start = i * blockSize + 1;
      const end = Math.min((i + 1) * blockSize, allTotalCount);
      list.push({
        id: `block_${start}_${end}`,
        label: `🎯 STT ${start} – ${end}`
      });
    }
    return list;
  }, [allTotalCount]);

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
              className="text-xs sm:text-sm font-semibold bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-900 py-1.5 px-3 rounded-2xl border border-indigo-200/60 outline-none focus:ring-2 focus:ring-indigo-400 transition-all cursor-pointer shadow-xs max-w-[175px] sm:max-w-[210px] truncate"
            >
              <optgroup label="📚 Kho từ vựng">
                <option value="all">Tất cả ({allTotalCount})</option>
                <option value="random100">🎲 Ngẫu nhiên 100 từ</option>
              </optgroup>

              {blocks.length > 1 && (
                <optgroup label="🎯 Theo chặng STT">
                  {blocks.map(b => (
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ))}
                </optgroup>
              )}

              <optgroup label="⚡ Từ mới thêm">
                <option value="latest20">20 từ mới nhất</option>
                <option value="latest50">50 từ mới nhất</option>
              </optgroup>

              <optgroup label="🔁 Ôn tập nhắc lại">
                <option value="flagged">🚩 Đã gắn cờ ({flaggedCount})</option>
                <option value="review_all">⚠️ Cần ôn tập ({reviewAllCount})</option>
                <option value="incorrect">❌ Chỉ từ làm sai ({wrongHistoryCount})</option>
              </optgroup>
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
            {flaggedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-rose-600 font-semibold hidden sm:inline-flex">
                <Flag size={12} className="fill-rose-500 text-rose-500" />
                <span>{flaggedCount} cờ</span>
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
