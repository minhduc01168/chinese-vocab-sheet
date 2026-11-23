import { useEffect, useRef, useState, useCallback } from 'react';
import { VocabItem } from '../types/vocab';
import { hasWordExamples, generateExamplesWithGemini } from '../utils/aiExampleService';

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

    // Find words that don't have examples yet
    const missingItems = allItems.filter(item => !hasWordExamples(item.hanzi));
    if (missingItems.length === 0) return;

    isRunningRef.current = true;
    setState({
      isGenerating: true,
      pendingCount: missingItems.length,
      currentWord: missingItems[0].hanzi,
      error: null,
    });

    for (let i = 0; i < missingItems.length; i++) {
      const item = missingItems[i];
      setState(prev => ({
        ...prev,
        pendingCount: missingItems.length - i,
        currentWord: item.hanzi,
      }));

      try {
        await generateExamplesWithGemini(apiKey, item.hanzi, item.meaning);
        // Sleep 2 seconds between calls to respect rate limit
        await new Promise(res => setTimeout(res, 2000));
      } catch (err: any) {
        console.warn(`Could not generate examples for ${item.hanzi}:`, err);
        // If API key is invalid or rate limited, stop the queue
        if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('Resource has been exhausted'))) {
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
