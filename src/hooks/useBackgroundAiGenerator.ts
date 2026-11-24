import { useEffect, useRef, useState, useCallback } from 'react';
import { VocabItem } from '../types/vocab';
import {
  hasWordExamples,
  generateExamplesWithGemini,
  normalizeHanziKey,
  isWordInCooldown,
  markWordFailedCooldown,
} from '../utils/aiExampleService';

interface BackgroundGeneratorState {
  isGenerating: boolean;
  pendingCount: number;
  currentWord?: string;
  error?: string | null;
}

export function useBackgroundAiGenerator(allItems: VocabItem[], apiKey?: string) {
  const [state, setState] = useState<BackgroundGeneratorState>({
    isGenerating: false,
    pendingCount: 0,
    currentWord: undefined,
    error: null,
  });

  const isRunningRef = useRef<boolean>(false);

  const processQueue = useCallback(async () => {
    if (!apiKey || !apiKey.trim() || isRunningRef.current) return;
    if (!allItems || allItems.length === 0) return;

    // Find unique words that don't have examples yet and are not in cooldown
    const seenKeys = new Set<string>();
    const missingItems: { item: VocabItem; primaryHanzi: string }[] = [];

    for (const item of allItems) {
      const primary = (item.validAnswers && item.validAnswers[0]) || item.hanzi;
      const cleanKey = normalizeHanziKey(primary);
      if (!cleanKey) continue;

      if (seenKeys.has(cleanKey)) continue;

      // Check if already has examples in pregen or custom localStorage
      if (hasWordExamples(cleanKey) || hasWordExamples(item.hanzi) || hasWordExamples(primary)) {
        continue;
      }

      // Check if this word failed recently in this session (cooldown to prevent infinite F5 loop)
      if (isWordInCooldown(cleanKey) || isWordInCooldown(item.hanzi) || isWordInCooldown(primary)) {
        continue;
      }

      seenKeys.add(cleanKey);
      missingItems.push({ item, primaryHanzi: cleanKey });
    }

    if (missingItems.length === 0) return;

    isRunningRef.current = true;
    setState({
      isGenerating: true,
      pendingCount: missingItems.length,
      currentWord: missingItems[0].primaryHanzi,
      error: null,
    });

    for (let i = 0; i < missingItems.length; i++) {
      const { item, primaryHanzi } = missingItems[i];
      setState(prev => ({
        ...prev,
        pendingCount: missingItems.length - i,
        currentWord: primaryHanzi,
      }));

      try {
        await generateExamplesWithGemini(apiKey, primaryHanzi, item.meaning);
        // Sleep 4 seconds between calls to respect Gemini Free Tier 15 RPM rate limit
        await new Promise(res => setTimeout(res, 4000));
      } catch (err: any) {
        console.warn(`Could not generate examples for ${primaryHanzi}:`, err);
        // Mark this word as failed with cooldown so refreshing won't re-trigger immediately
        markWordFailedCooldown(primaryHanzi);
        markWordFailedCooldown(item.hanzi);

        // If API key is invalid or rate limited, mark all remaining words in cooldown and stop
        const isExhausted = err.message && (
          err.message.includes('API_KEY_INVALID') ||
          err.message.includes('Resource has been exhausted') ||
          err.message.includes('429')
        );

        if (isExhausted) {
          for (let j = i; j < missingItems.length; j++) {
            markWordFailedCooldown(missingItems[j].primaryHanzi);
            markWordFailedCooldown(missingItems[j].item.hanzi);
          }
          setState({
            isGenerating: false,
            pendingCount: 0,
            currentWord: undefined,
            error: err.message,
          });
          isRunningRef.current = false;
          return;
        }
      }
    }

    isRunningRef.current = false;
    setState({
      isGenerating: false,
      pendingCount: 0,
      currentWord: undefined,
      error: null,
    });
  }, [allItems, apiKey]);

  useEffect(() => {
    processQueue();
  }, [processQueue]);

  return {
    ...state,
    triggerQueue: processQueue,
  };
}
