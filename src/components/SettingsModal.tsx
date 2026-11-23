import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Check, 
  Trash2, 
  Info, 
  RefreshCw,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink
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
  const [soundEffects, setSoundEffects] = useState<boolean>(settings.soundEffects ?? true);
  const [speechRate, setSpeechRate] = useState<number>(settings.speechRate);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(settings.selectedVoiceName || '');
  
  // Gemini AI Key & Admin Passcode States
  const defaultEnvPasscode = import.meta.env.VITE_ADMIN_PASSCODE || '161203';
  const [geminiApiKey, setGeminiApiKey] = useState<string>(settings.geminiApiKey || '');
  const [adminPasscode, setAdminPasscode] = useState<string>(settings.adminPasscode || defaultEnvPasscode);
  const [passcodeAttempt, setPasscodeAttempt] = useState<string>('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [passcodeError, setPasscodeError] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [newPasscode, setNewPasscode] = useState<string>('');
  const [showPasscodeChange, setShowPasscodeChange] = useState<boolean>(false);

  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  const [clearedHistoryNotice, setClearedHistoryNotice] = useState<boolean>(false);

  if (!isOpen) return null;

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
      soundEffects,
      speechRate,
      selectedVoiceName,
      geminiApiKey: geminiApiKey.trim(),
      adminPasscode,
    });
  };

  const handleResetDefaultSheet = () => {
    setSheetInput(defaultSheetUrl);
    onReloadSheet(defaultSheetUrl);
    onSaveSettings({
      ...settings,
      sheetUrl: defaultSheetUrl,
      autoSpeak,
      soundEffects,
      speechRate,
      selectedVoiceName,
      geminiApiKey: geminiApiKey.trim(),
      adminPasscode,
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

  const handleUnlockAdmin = () => {
    const targetPasscode = adminPasscode || defaultEnvPasscode;
    if (passcodeAttempt.trim() === targetPasscode.trim()) {
      setIsAdminUnlocked(true);
      setPasscodeError(false);
      setPasscodeAttempt('');
    } else {
      setPasscodeError(true);
    }
  };

  const handleChangePasscode = () => {
    if (newPasscode.trim().length >= 4) {
      setAdminPasscode(newPasscode.trim());
      setShowPasscodeChange(false);
      setNewPasscode('');
      alert('Đã cập nhật mật khẩu quản trị mới thành công!');
    } else {
      alert('Mật khẩu quản trị cần tối thiểu 4 ký tự.');
    }
  };

  const handleSaveAndClose = () => {
    onSaveSettings({
      sheetUrl: sheetInput.trim(),
      autoSpeak,
      soundEffects,
      speechRate,
      selectedVoiceName,
      geminiApiKey: geminiApiKey.trim(),
      adminPasscode,
      autoNextOnCorrect: settings.autoNextOnCorrect,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-700">
              Nguồn Google Sheet
            </label>
            <div className="relative">
              <input
                type="text"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                placeholder="Dán link Google Sheet hoặc Sheet ID..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleApplySheet}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Tải dữ liệu Sheet này</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaultSheet}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Khôi phục Sheet gốc
              </button>
            </div>

            {/* Share link button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-violet-50 to-indigo-50 hover:from-violet-100 hover:to-indigo-100 text-indigo-800 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-indigo-200 transition-colors cursor-pointer shadow-xs"
              >
                {copiedShareLink ? (
                  <>
                    <Check size={16} className="text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Đã sao chép link chia sẻ vào bộ nhớ tạm!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={16} className="text-indigo-600" />
                    <span>Sao chép Link chia sẻ kèm bộ từ vựng này</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 mt-1">
                Gửi link này cho bạn bè, họ mở ra là học được ngay bộ từ của bạn trên điện thoại/máy tính mà không cần setup.
              </p>
            </div>
          </div>

          {/* Section 2: AI Gemini 2.5 Flash Configuration (Password Protected) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-indigo-600" />
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Cấu hình AI Gemini 2.5 Flash
                </label>
              </div>

              {isAdminUnlocked ? (
                <button
                  type="button"
                  onClick={() => setIsAdminUnlocked(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Lock size={12} />
                  <span>Khóa lại</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Lock size={12} />
                  <span>Bảo vệ bằng mật khẩu</span>
                </span>
              )}
            </div>

            {!isAdminUnlocked ? (
              /* Locked State: Ask for admin passcode */
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-2.5">
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <Key size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <p>
                    Khu vực quản trị cấu hình AI (sinh ví dụ tự động ngầm khi thêm từ mới). Nhập mật khẩu quản trị để mở khóa:
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={passcodeAttempt}
                    onChange={(e) => {
                      setPasscodeAttempt(e.target.value);
                      setPasscodeError(false);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlockAdmin()}
                    placeholder="Nhập mật khẩu quản trị..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleUnlockAdmin}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Unlock size={13} />
                    <span>Mở khóa</span>
                  </button>
                </div>

                {passcodeError && (
                  <p className="text-xs text-rose-600 font-semibold">
                    Mật khẩu quản trị không chính xác, vui lòng thử lại!
                  </p>
                )}

                {geminiApiKey && (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1 self-start font-medium">
                    <Check size={12} />
                    <span>Hệ thống đã có API Key (Đang ẩn)</span>
                  </div>
                )}
              </div>
            ) : (
              /* Unlocked State: Configure API Key & Passcode */
              <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-2xl p-4 space-y-3 animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">
                      Google Gemini API Key
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                    >
                      <span>Lấy key miễn phí</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="Dán API Key (AIzaSy...)"
                      className="w-full pr-10 px-3.5 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mô hình: <b>gemini-2.5-flash</b>. Khi bạn thêm từ mới vào Google Sheet, AI sẽ tự động sinh 3 câu ví dụ ngầm và lưu đệm vĩnh viễn.
                  </p>
                </div>

                {/* Change admin passcode option */}
                <div className="pt-2 border-t border-indigo-100">
                  {!showPasscodeChange ? (
                    <button
                      type="button"
                      onClick={() => setShowPasscodeChange(true)}
                      className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer underline"
                    >
                      Đổi mật khẩu quản trị
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Mật khẩu quản trị mới</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPasscode}
                          onChange={(e) => setNewPasscode(e.target.value)}
                          placeholder="Nhập tối thiểu 4 ký tự..."
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleChangePasscode}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Lưu PIN
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPasscodeChange(false)}
                          className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Audio & Sound */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-700">
              Âm Thanh & Hiệu Ứng
            </label>

            {/* Auto speak toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="font-semibold text-slate-800">Tự động phát âm</span>
                <p className="text-xs text-slate-400">Đọc tiếng Trung ngay khi bạn gõ đúng</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Sound effects toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="font-semibold text-slate-800">Hiệu ứng âm thanh vui nhộn</span>
                <p className="text-xs text-slate-400">Âm thanh chúc mừng khi đúng và chuỗi streak</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEffects}
                  onChange={(e) => setSoundEffects(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Speech Rate */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="font-semibold text-slate-800">Tốc độ đọc mặc định</span>
                <p className="text-xs text-slate-400">Điều chỉnh tốc độ nhanh/chậm</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {[0.75, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSpeechRate(rate)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      speechRate === rate
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Voice selector */}
            {zhVoices.length > 1 && (
              <div className="space-y-1 py-1">
                <label className="text-xs font-semibold text-slate-700">Giọng đọc ưu tiên</label>
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

          {/* Section 4: History */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-700">
              Lịch sử từ vựng
            </label>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">
                  Số từ cần ôn lại: <b>{wrongCount}</b> từ
                </p>
                <p className="text-xs text-slate-400">Gồm các từ từng gõ sai hoặc bấm bỏ qua</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClearWrongHistory();
                  setClearedHistoryNotice(true);
                  setTimeout(() => setClearedHistoryNotice(false), 2000);
                }}
                disabled={wrongCount === 0}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
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
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
          >
            Đóng & Lưu
          </button>
        </div>
      </div>
    </div>
  );
};
