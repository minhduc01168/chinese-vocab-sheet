import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Settings as SettingsIcon, 
  VolumeX, 
  Sparkles,
  BookOpen,
  WifiOff
} from 'lucide-react';
import { AppSettings, StudyRange } from './types/vocab';
import { useGoogleSheet } from './hooks/useGoogleSheet';
import { useSpeech } from './hooks/useSpeech';
import { useQuizSession } from './hooks/useQuizSession';
import { Header } from './components/Header';
import { QuizCard } from './components/QuizCard';
import { ActionBar } from './components/ActionBar';
import { SettingsModal } from './components/SettingsModal';
import { SummaryModal } from './components/SummaryModal';
import { parseSheetUrl } from './utils/textNormalizer';

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Bw2Gv20NRcTdPRufPsIDdtdn7YxFzfdRfXVQyBOR3nA/edit?usp=sharing';
const SETTINGS_STORAGE_KEY = 'vocab_app_settings_v1';

export function App() {
  // Determine initial Google Sheet URL from URL query or localStorage or default
  const initialSheetUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sheetParam = params.get('sheet');
      const gidParam = params.get('gid') || '0';
      if (sheetParam) {
        return `https://docs.google.com/spreadsheets/d/${sheetParam}/edit#gid=${gidParam}`;
      }
      try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.sheetUrl) return parsed.sheetUrl;
        }
      } catch (e) {
        console.warn('Error reading saved settings:', e);
      }
    }
    return DEFAULT_SHEET_URL;
  }, []);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return {
          ...JSON.parse(saved),
          sheetUrl: initialSheetUrl,
        };
      }
    } catch {}
    return {
      sheetUrl: initialSheetUrl,
      autoSpeak: true,
      speechRate: 1.0,
      autoNextOnCorrect: false,
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [voiceWarningDismissed, setVoiceWarningDismissed] = useState<boolean>(false);

  // Custom Hooks
  const {
    data: allItems,
    isLoading,
    error: sheetError,
    isOfflineFallback,
    lastSyncedAt,
    refetch: refetchSheet,
    changeSheetUrl,
    currentUrl,
  } = useGoogleSheet(settings.sheetUrl);

  const {
    speak,
    stop: stopSpeech,
    hasZhVoice,
    voices,
    selectedVoice,
    setSelectedVoice,
  } = useSpeech(settings.speechRate);

  const {
    studyRange,
    setStudyRange,
    isShuffle,
    setIsShuffle,
    currentIndex,
    activeItems,
    currentItem,
    currentCardState,
    cardsState,
    submitAnswer,
    requestHint,
    skipCard,
    goNext,
    goBack,
    stats,
    restartSession,
    clearWrongHistory,
    wrongHistoryCount,
  } = useQuizSession(allItems);

  // Sync settings back to localStorage
  const handleSaveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Could not save settings:', e);
    }
  }, []);

  const handleReloadSheet = useCallback((newUrl: string) => {
    changeSheetUrl(newUrl);
    handleSaveSettings({
      ...settings,
      sheetUrl: newUrl,
    });
  }, [changeSheetUrl, handleSaveSettings, settings]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing inside settings modal inputs
      if (isSettingsOpen) return;

      // Ctrl + Space: Repeat speech
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        if (currentItem) {
          speak(currentItem.validAnswers[0] || currentItem.hanzi, settings.speechRate);
        }
        return;
      }

      // Alt + ArrowRight or Tab (outside input focus): Skip
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        skipCard();
        return;
      }

      // Alt + ArrowLeft: Back
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSettingsOpen, currentItem, speak, settings.speechRate, skipCard, goBack]);

  const handleSpeakWord = useCallback((text: string, rate?: number) => {
    speak(text, rate ?? settings.speechRate);
  }, [speak, settings.speechRate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Voice Warning Banner (if no Chinese voice detected) */}
      {!hasZhVoice && !voiceWarningDismissed && (
        <div className="bg-amber-500 text-white text-xs px-4 py-2 flex items-center justify-between text-center">
          <div className="flex items-center justify-center gap-2 mx-auto">
            <VolumeX size={15} />
            <span>
              Trình duyệt của bạn chưa có gói giọng phát âm Tiếng Trung (zh-CN). Bạn vẫn có thể luyện gõ bình thường hoặc cài thêm gói giọng trong Cài đặt hệ điều hành.
            </span>
          </div>
          <button 
            onClick={() => setVoiceWarningDismissed(true)} 
            className="text-white hover:text-amber-100 font-bold ml-2 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header */}
      <Header
        studyRange={studyRange}
        onRangeChange={setStudyRange}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(prev => !prev)}
        onSync={refetchSheet}
        isSyncing={isLoading}
        onOpenSettings={() => setIsSettingsOpen(true)}
        correctCount={stats.correct}
        wrongCount={stats.wrong}
        skippedCount={stats.skipped}
        currentIndex={currentIndex}
        totalCards={activeItems.length}
        isOffline={isOfflineFallback}
        lastSyncedAt={lastSyncedAt}
        wrongHistoryCount={wrongHistoryCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center py-2 sm:py-4 w-full">
        {/* Loading State */}
        {isLoading && allItems.length === 0 && (
          <div className="w-full max-w-md mx-auto p-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 animate-spin">
              <RefreshCw size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Đang đồng bộ dữ liệu từ Google Sheet...</h3>
            <p className="text-xs text-slate-500 mt-1">Đang phân tích bảng từ vựng và phiên âm Pinyin</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && sheetError && allItems.length === 0 && (
          <div className="w-full max-w-lg mx-auto p-6 bg-white rounded-3xl border border-rose-200 shadow-md text-center m-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Không thể tải Google Sheet</h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-4 px-2 leading-relaxed">
              {sheetError}
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 text-left text-xs text-slate-700 space-y-1.5 mb-5 border border-slate-200">
              <p className="font-semibold text-slate-800">Hướng dẫn khắc phục nhanh:</p>
              <p>1. Mở file Google Sheet của bạn trên trình duyệt.</p>
              <p>2. Bấm vào nút màu xanh <b>"Chia sẻ" (Share)</b> ở góc trên bên phải.</p>
              <p>3. Tại mục "Quyền truy cập chung", đổi thành: <b>"Bất kỳ ai có đường liên kết đều có thể xem"</b>.</p>
              <p>4. Bấm "Xong" rồi quay lại đây bấm nút <b>Thử lại</b>.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => refetchSheet()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Thử lại</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <SettingsIcon size={14} />
                <span>Đổi link Sheet</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Quiz Card */}
        {currentItem && !stats.isSessionFinished && (
          <QuizCard
            key={currentItem.id}
            item={currentItem}
            cardState={currentCardState}
            onSubmit={submitAnswer}
            onRequestHint={requestHint}
            onSpeak={handleSpeakWord}
            onNext={goNext}
            autoSpeak={settings.autoSpeak}
            speechRate={settings.speechRate}
          />
        )}

        {/* Empty list for selected filter */}
        {!isLoading && allItems.length > 0 && activeItems.length === 0 && (
          <div className="w-full max-w-md mx-auto p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <BookOpen size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Không có từ vựng nào</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {studyRange === 'incorrect' 
                ? 'Tuyệt vời! Bạn không có từ nào bị sai cần ôn lại.'
                : 'Chưa có từ vựng phù hợp với bộ lọc hiện tại.'}
            </p>
            <button
              onClick={() => setStudyRange('all')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
            >
              Học tất cả từ vựng
            </button>
          </div>
        )}
      </main>

      {/* Action Navigation Bar */}
      {currentItem && !stats.isSessionFinished && (
        <ActionBar
          canGoBack={currentIndex > 0}
          onBack={goBack}
          status={currentCardState.status}
          onCheck={() => {
            // Trigger check via synthetic enter or focus
            const inputEl = document.querySelector('input') as HTMLInputElement;
            if (inputEl) {
              const val = inputEl.value;
              submitAnswer(val);
              if (settings.autoSpeak) {
                handleSpeakWord(currentItem.validAnswers[0] || currentItem.hanzi);
              }
            }
          }}
          onNext={goNext}
          onSkip={skipCard}
          isLastCard={currentIndex === activeItems.length - 1}
        />
      )}

      {/* Summary Modal on session finish */}
      <SummaryModal
        isOpen={stats.isSessionFinished}
        activeItems={activeItems}
        cardsState={cardsState}
        onRestart={restartSession}
        onRetryWrongOnly={() => {
          setStudyRange('incorrect');
          restartSession();
        }}
        onSpeak={handleSpeakWord}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onClearWrongHistory={clearWrongHistory}
        wrongCount={wrongHistoryCount}
        voices={voices}
        onReloadSheet={handleReloadSheet}
        defaultSheetUrl={DEFAULT_SHEET_URL}
      />
    </div>
  );
}

export default App;
