import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeech(defaultRate: number = 1.0) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasZhVoice, setHasZhVoice] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load and sort available voices
  const updateVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setHasZhVoice(false);
      return;
    }

    const availableVoices = window.speechSynthesis.getVoices();
    setVoices(availableVoices);

    // Filter Chinese voices
    const zhVoices = availableVoices.filter(v => 
      v.lang.toLowerCase().includes('zh') || 
      v.lang.toLowerCase().includes('cmn')
    );

    if (zhVoices.length === 0) {
      setHasZhVoice(false);
      return;
    }

    setHasZhVoice(true);

    // Select preferred voice based on order:
    // 1. Google 普通话 (Google Chinese)
    // 2. Microsoft Xiaoxiao
    // 3. Microsoft Yunxi / Kangkang / Yaoyao
    // 4. Tingting (Apple / macOS)
    // 5. Any zh-CN
    // 6. Any Chinese voice
    let best = zhVoices.find(v => v.name.includes('Google 普通话') || v.name.includes('Google Chinese'));
    if (!best) best = zhVoices.find(v => v.name.toLowerCase().includes('xiaoxiao'));
    if (!best) best = zhVoices.find(v => v.name.toLowerCase().includes('tingting'));
    if (!best) best = zhVoices.find(v => v.lang === 'zh-CN' || v.lang === 'zh_CN');
    if (!best) best = zhVoices[0];

    setSelectedVoice(best || null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setHasZhVoice(false);
      return;
    }

    updateVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [updateVoices]);

  const speak = useCallback((text: string, customRate?: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    if (!text || !text.trim()) return;

    // Always cancel active speech before speaking a new phrase to prevent audio queuing
    window.speechSynthesis.cancel();

    // Clean text for speech: if multiple answers separated by slash, speak the first one
    const cleanText = text.split(/[/;；,，\n]/)[0].trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtteranceRef.current = utterance;
    utterance.lang = 'zh-CN';
    utterance.rate = customRate ?? defaultRate;
    utterance.pitch = 1.0;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    };

    // Chrome bug workaround: speechSynthesis may get stuck if page is inactive
    window.speechSynthesis.speak(utterance);
  }, [defaultRate, selectedVoice]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    hasZhVoice,
    voices,
    selectedVoice,
    setSelectedVoice,
  };
}
