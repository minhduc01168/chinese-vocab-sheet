import React, { useState } from 'react';
import { 
  X, 
  Link2, 
  Copy, 
  Check, 
  Volume2, 
  Trash2, 
  ExternalLink, 
  Info,
  RefreshCw,
  Share2
} from 'lucide-react';
import { AppSettings } from '../types/vocab';
import { parseSheetUrl } from '../utils/textNormalizer';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClearWrongHistory: () => void;
  wrongCount: number;
  voices: SpeechSynthesisVoice[];
  onReloadSheet: (url: string) => void;
  defaultSheetUrl: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearWrongHistory,
  wrongCount,
  voices,
  onReloadSheet,
  defaultSheetUrl,
}) => {
  const [sheetInput, setSheetInput] = useState<string>(settings.sheetUrl);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(settings.autoSpeak);
  const [speechRate, setSpeechRate] = useState<number>(settings.speechRate);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(settings.selectedVoiceName || '');
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  const [clearedHistoryNotice, setClearedHistoryNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter Chinese voices for selector
  const zhVoices = voices.filter(v => 
    v.lang.toLowerCase().includes('zh') || 
    v.lang.toLowerCase().includes('cmn')
  );

  const handleApplySheet = () => {
    if (!sheetInput.trim()) return;
    onReloadSheet(sheetInput.trim());
    onSaveSettings({
      ...settings,
      sheetUrl: sheetInput.trim(),
      autoSpeak,
      speechRate,
      selectedVoiceName,
    });
  };

  const handleResetDefaultSheet = () => {
    setSheetInput(defaultSheetUrl);
    onReloadSheet(defaultSheetUrl);
    onSaveSettings({
      ...settings,
      sheetUrl: defaultSheetUrl,
      autoSpeak,
      speechRate,
      selectedVoiceName,
    });
  };

  const handleCopyShareLink = () => {
    const parsed = parseSheetUrl(sheetInput);
    let shareUrl = window.location.origin + window.location.pathname;
    if (parsed) {
      shareUrl += `?sheet=${encodeURIComponent(parsed.sheetId)}&gid=${encodeURIComponent(parsed.gid)}`;
    }
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    });
  };

  const handleSaveAndClose = () => {
    onSaveSettings({
      sheetUrl: sheetInput.trim(),
      autoSpeak,
      speechRate,
      selectedVoiceName,
      autoNextOnCorrect: settings.autoNextOnCorrect,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Cài đặt & Dữ liệu</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Section 1: Google Sheet Source */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Nguồn Google Sheet
            </label>
            <div className="relative">
              <input
                type="text"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                placeholder="Dán link Google Sheet hoặc Sheet ID..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleApplySheet}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Tải dữ liệu Sheet này</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaultSheet}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Khôi phục Sheet gốc
              </button>
            </div>

            {/* Share link button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border border-indigo-200/70 transition-colors cursor-pointer"
              >
                {copiedShareLink ? (
                  <>
                    <Check size={16} className="text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Đã sao chép link chia sẻ vào bộ nhớ tạm!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    <span>Sao chép Link chia sẻ kèm bộ từ vựng này</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 mt-1">
                Người khác mở link này sẽ học ngay bộ từ vựng của bạn mà không cần cài đặt gì.
              </p>
            </div>

            {/* Tip on Google Sheet sharing */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5 mt-2">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Lưu ý quyền xem Google Sheet:</p>
                <p className="text-blue-800 leading-relaxed">
                  Sheet cần được bật ở chế độ <b>"Bất kỳ ai có đường liên kết đều có thể xem"</b> (Chia sẻ &rarr; Chung &rarr; Người xem).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Audio & Pronunciation */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Phát âm & Âm thanh
            </label>

            {/* Auto speak toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="font-medium text-slate-800">Tự động phát âm</span>
                <p className="text-xs text-slate-400">Đọc tiếng Trung ngay khi bạn gõ đúng</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Speech Rate */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="font-medium text-slate-800">Tốc độ đọc mặc định</span>
                <p className="text-xs text-slate-400">Điều chỉnh tốc độ nhanh/chậm</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {[0.75, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSpeechRate(rate)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      speechRate === rate
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Voice selector if multiple Chinese voices are found */}
            {zhVoices.length > 1 && (
              <div className="space-y-1 py-1">
                <label className="text-xs font-medium text-slate-700">Giọng đọc ưu tiên</label>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => setSelectedVoiceName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none"
                >
                  <option value="">Mặc định của hệ thống ({zhVoices[0]?.name})</option>
                  {zhVoices.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Section 3: Learning History */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Lịch sử từ sai
            </label>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">
                  Số từ trong danh sách cần ôn: <b>{wrongCount}</b> từ
                </p>
                <p className="text-xs text-slate-400">Các từ từng làm sai hoặc bị bỏ qua</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClearWrongHistory();
                  setClearedHistoryNotice(true);
                  setTimeout(() => setClearedHistoryNotice(false), 2000);
                }}
                disabled={wrongCount === 0}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  wrongCount > 0
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer border border-rose-200'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 size={14} />
                <span>{clearedHistoryNotice ? 'Đã xóa!' : 'Xóa lịch sử'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            Đóng & Lưu
          </button>
        </div>
      </div>
    </div>
  );
};
