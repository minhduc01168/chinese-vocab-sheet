import { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { VocabItem } from '../types/vocab';
import defaultVocabData from '../data/defaultVocab.json';
import {
  parseSheetUrl,
  buildGVizCsvUrl,
  extractValidAnswers,
  getFallbackPinyin,
} from '../utils/textNormalizer';

// Fallback initial dataset (from the user's provided sheet sample)
const DEFAULT_FALLBACK_DATA: VocabItem[] = defaultVocabData as VocabItem[];

function normalizeHeaderKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove Vietnamese diacritics for matching
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, ''); // keep alphanumeric and chinese chars
}

interface ColumnMap {
  hanziIdx: number;
  meaningIdx: number;
  pinyinIdx: number;
  sinoVietnameseIdx: number;
  exampleIdx: number;
  noteIdx: number;
}

function detectColumns(headers: string[]): ColumnMap {
  let hanziIdx = -1;
  let meaningIdx = -1;
  let pinyinIdx = -1;
  let sinoVietnameseIdx = -1;
  let exampleIdx = -1;
  let noteIdx = -1;

  headers.forEach((h, idx) => {
    const raw = (h || '').trim();
    const clean = normalizeHeaderKey(raw);

    // Hanzi check: 汉字, chữ hán, từ vựng, hanzi, chu han
    if (hanziIdx === -1) {
      if (
        clean.includes('hanzi') ||
        clean.includes('chuhan') ||
        clean.includes('tuvung') ||
        clean.includes('汉字') ||
        clean === 'han' ||
        clean === 'chu'
      ) {
        hanziIdx = idx;
        return;
      }
    }

    // Meaning check: nghĩa, tiếng việt, meaning, 越南语意思
    if (meaningIdx === -1) {
      if (
        clean.includes('nghia') ||
        clean.includes('tiengviet') ||
        clean.includes('meaning') ||
        clean.includes('vietnamese') ||
        clean.includes('越南语') ||
        clean.includes('dich')
      ) {
        meaningIdx = idx;
        return;
      }
    }

    // Pinyin check: 拼音, pinyin, phiên âm
    if (pinyinIdx === -1) {
      if (
        clean.includes('pinyin') ||
        clean.includes('phienam') ||
        clean.includes('拼音')
      ) {
        pinyinIdx = idx;
        return;
      }
    }

    // Sino-Vietnamese: 汉越音, hán việt
    if (sinoVietnameseIdx === -1) {
      if (
        clean.includes('hanviet') ||
        clean.includes('汉越') ||
        clean.includes('amhanviet')
      ) {
        sinoVietnameseIdx = idx;
        return;
      }
    }

    // Example: 例如, ví dụ, example
    if (exampleIdx === -1) {
      if (
        clean.includes('vidu') ||
        clean.includes('example') ||
        clean.includes('例如') ||
        clean.includes('cauvd')
      ) {
        exampleIdx = idx;
        return;
      }
    }

    // Note: note, ghi chú, từ loại
    if (noteIdx === -1) {
      if (
        clean.includes('note') ||
        clean.includes('ghichu') ||
        clean.includes('tuloai') ||
        clean.includes('chuthich') ||
        clean.includes('loaitu')
      ) {
        noteIdx = idx;
        return;
      }
    }
  });

  // Fallback positional detection if headers are ambiguous
  if (hanziIdx === -1 && headers.length > 1) {
    hanziIdx = 1; // Often column B (index 1) in sheets with index at column A
  }
  if (meaningIdx === -1 && headers.length > 2) {
    meaningIdx = headers.length >= 5 ? 4 : 2;
  }

  return { hanziIdx, meaningIdx, pinyinIdx, sinoVietnameseIdx, exampleIdx, noteIdx };
}

export function useGoogleSheet(initialUrl: string) {
  const [url, setUrl] = useState<string>(initialUrl);
  const [data, setData] = useState<VocabItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const fetchAbortController = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (targetUrl: string, silent: boolean = false) => {
    const parsed = parseSheetUrl(targetUrl);
    if (!parsed) {
      setError('Đường link Google Sheet không hợp lệ. Vui lòng kiểm tra lại định dạng.');
      setIsLoading(false);
      return;
    }

    const { sheetId, gid } = parsed;
    const csvUrl = buildGVizCsvUrl(sheetId, gid, Date.now());
    const cacheKey = `vocab_cache_${sheetId}_${gid}`;

    if (!silent) {
      setIsLoading(true);
    }
    setError(null);

    // Cancel previous request if any
    if (fetchAbortController.current) {
      fetchAbortController.current.abort();
    }
    fetchAbortController.current = new AbortController();

    try {
      const response = await fetch(csvUrl, {
        signal: fetchAbortController.current.signal,
        cache: 'no-store',
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} (${response.statusText})`);
      }

      const csvText = await response.text();

      // Check if Google Sheet returned an HTML error page (e.g. login required or 404)
      if (csvText.trim().startsWith('<!DOCTYPE html>') || csvText.includes('google-site-verification')) {
        throw new Error('PERMISSION_DENIED');
      }

      // Parse with PapaParse
      Papa.parse<string[]>(csvText, {
        skipEmptyLines: 'greedy',
        complete: (results) => {
          const rows = results.data;
          if (!rows || rows.length < 2) {
            setError('Google Sheet chưa có dữ liệu từ vựng (chỉ có dòng tiêu đề hoặc trống).');
            setIsLoading(false);
            return;
          }

          const headers = rows[0];
          const colMap = detectColumns(headers);

          if (colMap.hanziIdx === -1 || colMap.meaningIdx === -1) {
            setError('Không tìm thấy cột Chữ Hán hoặc cột Nghĩa tiếng Việt. Hãy kiểm tra dòng tiêu đề đầu tiên trong Sheet.');
            setIsLoading(false);
            return;
          }

          const parsedItems: VocabItem[] = [];

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const rawHanzi = (row[colMap.hanziIdx] || '').trim();
            const rawMeaning = (row[colMap.meaningIdx] || '').trim();

            // Filter out empty rows
            if (!rawHanzi || !rawMeaning) continue;

            const validAnswers = extractValidAnswers(rawHanzi);
            if (validAnswers.length === 0) continue;

            // Pinyin: use sheet value if available, otherwise generate with pinyin-pro
            let pinyinVal = colMap.pinyinIdx !== -1 ? (row[colMap.pinyinIdx] || '').trim() : '';
            if (!pinyinVal) {
              pinyinVal = getFallbackPinyin(validAnswers[0]);
            }

            const sinoVietnamese = colMap.sinoVietnameseIdx !== -1 ? (row[colMap.sinoVietnameseIdx] || '').trim() : undefined;
            const example = colMap.exampleIdx !== -1 ? (row[colMap.exampleIdx] || '').trim() : undefined;
            const note = colMap.noteIdx !== -1 ? (row[colMap.noteIdx] || '').trim() : undefined;

            parsedItems.push({
              id: `${sheetId}_${gid}_${i}`,
              originalIndex: i,
              hanzi: rawHanzi,
              validAnswers,
              meaning: rawMeaning,
              pinyin: pinyinVal,
              sinoVietnamese: sinoVietnamese || undefined,
              example: example || undefined,
              note: note || undefined,
            });
          }

          if (parsedItems.length === 0) {
            setError('Không có dòng từ vựng hợp lệ nào trong Google Sheet.');
            setIsLoading(false);
            return;
          }

          setData(prev => {
            if (
              prev.length === parsedItems.length &&
              prev[0]?.hanzi === parsedItems[0]?.hanzi &&
              prev[prev.length - 1]?.hanzi === parsedItems[parsedItems.length - 1]?.hanzi &&
              JSON.stringify(prev) === JSON.stringify(parsedItems)
            ) {
              return prev; // No real change, don't trigger re-renders
            }
            return parsedItems;
          });
          setIsOfflineFallback(false);
          setLastSyncedAt(new Date());
          setIsLoading(false);

          // Save to local cache for offline resilience
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              items: parsedItems,
              savedAt: Date.now(),
            }));
          } catch (e) {
            console.warn('Could not save sheet to localStorage cache:', e);
          }
        },
        error: (err: Error) => {
          console.error('CSV parse error:', err);
          setError(`Lỗi đọc dữ liệu CSV: ${err.message}`);
          setIsLoading(false);
        }
      });
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      console.error('Fetch Google Sheet error:', err);

      // Attempt to load from offline cache
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          if (parsedCache.items && parsedCache.items.length > 0) {
            setData(parsedCache.items);
            setIsOfflineFallback(true);
            setLastSyncedAt(new Date(parsedCache.savedAt || Date.now()));
            setIsLoading(false);
            setError(null);
            return;
          }
        } catch (e) {
          // ignore cache parse error
        }
      }

      // If user default sheet is requested and network failed, use default fallback
      if (targetUrl.includes('1Bw2Gv20NRcTdPRufPsIDdtdn7YxFzfdRfXVQyBOR3nA')) {
        setData(DEFAULT_FALLBACK_DATA);
        setIsOfflineFallback(true);
        setLastSyncedAt(new Date());
        setIsLoading(false);
        setError(null);
        return;
      }

      if (err.message === 'PERMISSION_DENIED') {
        setError(
          'Không thể truy cập Google Sheet! Vui lòng mở Google Sheet > bấm nút "Chia sẻ" (Share) > chuyển sang "Bất kỳ ai có đường liên kết đều có thể xem" (Anyone with link can view).'
        );
      } else {
        setError(`Không thể kết nối đến Google Sheet (${err.message || 'Lỗi mạng'}). Vui lòng kiểm tra lại đường link và kết nối internet.`);
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData(url);

    // Auto-sync when user returns to this tab (e.g. from Google Sheet tab) with 60s throttle
    let lastTabReturnSync = 0;
    const handleTabReturn = () => {
      const now = Date.now();
      // Throttle: Chỉ đồng bộ ngầm khi đã rời tab ít nhất 60 giây để tránh spam mạng và trigger AI lặp lại
      if (now - lastTabReturnSync < 60000) return;
      lastTabReturnSync = now;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      fetchData(url, true);
    };

    window.addEventListener('focus', handleTabReturn);
    document.addEventListener('visibilitychange', handleTabReturn);

    // Periodic auto-sync every 3 minutes (silent background update)
    const intervalTimer = setInterval(() => {
      fetchData(url, true);
    }, 3 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', handleTabReturn);
      document.removeEventListener('visibilitychange', handleTabReturn);
      clearInterval(intervalTimer);
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }
    };
  }, [url, fetchData]);

  const refetch = useCallback(() => {
    return fetchData(url);
  }, [url, fetchData]);

  const changeSheetUrl = useCallback((newUrl: string) => {
    setUrl(newUrl);
  }, []);

  return {
    data,
    isLoading,
    error,
    isOfflineFallback,
    lastSyncedAt,
    refetch,
    changeSheetUrl,
    currentUrl: url,
  };
}
