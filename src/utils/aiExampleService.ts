import { AiExampleItem } from '../types/vocab';
import pregenExamples from '../data/aiExamples.json';
import { pinyin } from 'pinyin-pro';

const STORAGE_CUSTOM_EXAMPLES_KEY = 'ai_custom_examples_v1';
const FAILED_ATTEMPTS_STORAGE_KEY = 'ai_attempted_cooldown_v1';
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown before re-attempting a failed word

// In-memory merge of pregen and local custom examples
const pregenDict = pregenExamples as Record<string, AiExampleItem[]>;

// Fast in-memory cache to avoid repeated JSON.parse on every frame/render
let memoryCustomStore: Record<string, AiExampleItem[]> | null = null;

export function normalizeHanziKey(hanzi: string): string {
  if (!hanzi) return '';
  return hanzi
    .split(/[\/\n\r;；,，、]/)[0]
    .replace(/[（(].*?[）)]/g, '')
    .replace(/[\[\]]/g, '')
    .trim();
}

export function getCustomExamplesStore(): Record<string, AiExampleItem[]> {
  if (memoryCustomStore !== null) {
    return memoryCustomStore;
  }
  try {
    const saved = localStorage.getItem(STORAGE_CUSTOM_EXAMPLES_KEY);
    memoryCustomStore = saved ? JSON.parse(saved) : {};
    return memoryCustomStore!;
  } catch {
    memoryCustomStore = {};
    return memoryCustomStore;
  }
}

export function saveCustomExampleForWord(hanzi: string, examples: AiExampleItem[]) {
  if (!hanzi || !examples || examples.length === 0) return;
  const cleanKey = normalizeHanziKey(hanzi);
  if (!cleanKey) return;

  try {
    const store = getCustomExamplesStore();
    store[cleanKey] = examples;

    // Also store with raw trimmed key if different
    const rawTrimmed = hanzi.trim();
    if (rawTrimmed && rawTrimmed !== cleanKey) {
      store[rawTrimmed] = examples;
    }

    memoryCustomStore = store;
    localStorage.setItem(STORAGE_CUSTOM_EXAMPLES_KEY, JSON.stringify(store));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai_examples_updated', { detail: { hanzi: cleanKey } }));
    }
  } catch (e) {
    console.warn('Could not save custom AI examples to localStorage:', e);
  }
}

export function isWordInCooldown(hanzi: string): boolean {
  const clean = normalizeHanziKey(hanzi);
  if (!clean) return false;
  try {
    if (typeof sessionStorage === 'undefined') return false;
    const raw = sessionStorage.getItem(FAILED_ATTEMPTS_STORAGE_KEY);
    if (!raw) return false;
    const records: Record<string, number> = JSON.parse(raw);
    const lastTime = records[clean];
    if (lastTime && Date.now() - lastTime < COOLDOWN_MS) {
      return true;
    }
  } catch {}
  return false;
}

export function markWordFailedCooldown(hanzi: string) {
  const clean = normalizeHanziKey(hanzi);
  if (!clean) return;
  try {
    if (typeof sessionStorage === 'undefined') return;
    const raw = sessionStorage.getItem(FAILED_ATTEMPTS_STORAGE_KEY);
    const records: Record<string, number> = raw ? JSON.parse(raw) : {};
    records[clean] = Date.now();
    sessionStorage.setItem(FAILED_ATTEMPTS_STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

/**
 * Get all available examples for a word (from custom localStorage store, pregen file, or sheet fallback)
 */
export function getWordExamples(hanzi: string, sheetExample?: string): AiExampleItem[] {
  if (!hanzi) return [];
  const clean = normalizeHanziKey(hanzi);
  const raw = hanzi.trim();
  const customStore = getCustomExamplesStore();

  // 1. Check custom localStorage store
  if (clean && customStore[clean] && customStore[clean].length > 0) {
    return customStore[clean];
  }
  if (raw && customStore[raw] && customStore[raw].length > 0) {
    return customStore[raw];
  }

  // 2. Check pre-generated file
  if (clean && pregenDict[clean] && pregenDict[clean].length > 0) {
    return pregenDict[clean];
  }
  if (raw && pregenDict[raw] && pregenDict[raw].length > 0) {
    return pregenDict[raw];
  }

  // 3. Fallback to sheet example if provided
  if (sheetExample && sheetExample.trim()) {
    const exText = sheetExample.trim().split(/[\n\r]+/)[0];
    const py = pinyin(exText, { toneType: 'symbol' }).trim();
    const formattedPy = py.charAt(0).toUpperCase() + py.slice(1);
    return [{
      hanzi: exText,
      pinyin: formattedPy,
      meaning: 'Ví dụ từ bảng tính (bấm nút AI bên dưới để tạo 3 ví dụ kèm bản dịch)'
    }];
  }

  return [];
}

/**
 * Check if a word already has examples in store
 */
export function hasWordExamples(hanzi: string): boolean {
  if (!hanzi) return false;
  const clean = normalizeHanziKey(hanzi);
  const raw = hanzi.trim();
  const customStore = getCustomExamplesStore();

  if (clean && customStore[clean] && customStore[clean].length > 0) return true;
  if (raw && customStore[raw] && customStore[raw].length > 0) return true;
  if (clean && pregenDict[clean] && pregenDict[clean].length > 0) return true;
  if (raw && pregenDict[raw] && pregenDict[raw].length > 0) return true;

  return false;
}

export interface FallbackModelConfig {
  id: string;
  name: string;
}

/**
 * Chuỗi Fallback Model theo yêu cầu chuẩn:
 * 1. gemini-2.5-flash
 * 2. gemma-4-31b-it
 * 3. gemma-4-31b
 * 4. Gemma 4 26B (gemma-4-26b)
 * 5. gemini-3.8-flash
 * 6. Gemini 3 Flash (gemini-3-flash)
 * 7. Gemini 3.1 Flash Lite (gemini-3.1-flash-lite)
 * (Đã loại bỏ hoàn toàn 2 model: gemini-2.0-flash và gemini-1.5-flash)
 */
export const FALLBACK_MODEL_CHAIN: FallbackModelConfig[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemma-4-31b-it', name: 'Gemma 4 31B (it)' },
  { id: 'gemma-4-31b', name: 'Gemma 4 31B' },
  { id: 'gemma-4-26b', name: 'Gemma 4 26B' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' },
];

/**
 * Call Gemini API (gemini-2.5-flash -> gemma-4-31b-it -> gemma-4-31b -> Gemma 4 26B -> gemini-3.8-flash -> Gemini 3 Flash -> Gemini 3.1 Flash Lite)
 */
export async function generateExamplesWithGemini(
  apiKey: string,
  hanzi: string,
  meaning: string
): Promise<AiExampleItem[]> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Chưa cấu hình Google Gemini API Key.');
  }

  const cleanHanzi = normalizeHanziKey(hanzi);
  if (!cleanHanzi) {
    throw new Error('Từ vựng không hợp lệ để tạo câu ví dụ.');
  }

  const prompt = `Bạn là chuyên gia giảng dạy tiếng Trung Quốc cho người Việt Nam.
Hãy tạo đúng 3 câu ví dụ tiếng Trung thông dụng, tự nhiên và thiết thực nhất cho từ vựng: "${cleanHanzi}" (nghĩa tiếng Việt: "${meaning}").
Yêu cầu:
1. Câu 1: Ngắn gọn, cơ bản, giao tiếp hàng ngày.
2. Câu 2: Tình huống thực tế (học tập, công sở, mua sắm hoặc ăn uống).
3. Câu 3: Câu ghép tự nhiên giúp mở rộng cách dùng từ.
4. Cực kỳ quan trọng: Phần "meaning" TUYỆT ĐỐI KHÔNG chứa chữ Hán (chữ Trung Quốc), chỉ dịch nghĩa tiếng Việt tự nhiên chuẩn xác.

BẮT BUỘC trả về định dạng JSON thuần túy (không bọc trong markdown code block, không thêm lời chào), cấu trúc:
[
  {
    "hanzi": "chữ Hán đầy đủ có dấu câu",
    "pinyin": "phiên âm pinyin có dấu thanh điệu chuẩn",
    "meaning": "dịch nghĩa tiếng Việt tự nhiên"
  }
]`;

  let lastErrorMsg = '';

  for (let i = 0; i < FALLBACK_MODEL_CHAIN.length; i++) {
    const modelConfig = FALLBACK_MODEL_CHAIN[i];
    const isLastModel = i === FALLBACK_MODEL_CHAIN.length - 1;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.id}:generateContent?key=${apiKey.trim()}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            maxOutputTokens: 800,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const msg = errorData.error?.message || `Lỗi HTTP ${status}`;

        // Kiểm tra điều kiện Fallback: Lỗi 429 (Rate Limit / Quota), 404 (Chưa hỗ trợ), 503/500 (Quá tải)
        const isRateLimited = status === 429 || 
          msg.includes('429') || 
          msg.toLowerCase().includes('quota') || 
          msg.toLowerCase().includes('resource has been exhausted') || 
          msg.toLowerCase().includes('rate limit');

        const isModelNotFound = status === 404 || 
          msg.toLowerCase().includes('not found') || 
          msg.toLowerCase().includes('unsupported model');

        const isOverloaded = status === 503 || 
          status === 500 || 
          msg.toLowerCase().includes('overloaded');

        if (isRateLimited || isModelNotFound || isOverloaded) {
          console.warn(`[AI Service] Model ${modelConfig.name} (${modelConfig.id}) gặp lỗi ${status}: "${msg}". Tự động fallback sang model tiếp theo...`);
          lastErrorMsg = `${modelConfig.name} (${status}): ${msg}`;
          continue; // Chuyển sang model tiếp theo trong chuỗi fallback
        }

        throw new Error(msg);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Extract JSON array slice safely even if model wraps in markdown or adds text
      let jsonToParse = rawText.trim();
      const firstBracket = jsonToParse.indexOf('[');
      const lastBracket = jsonToParse.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        jsonToParse = jsonToParse.substring(firstBracket, lastBracket + 1);
      } else {
        jsonToParse = jsonToParse
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
      }

      const parsed = JSON.parse(jsonToParse);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized: AiExampleItem[] = parsed.map(p => ({
          hanzi: (p.hanzi || '').trim(),
          pinyin: (p.pinyin || pinyin(p.hanzi || '', { toneType: 'symbol' })).trim(),
          meaning: (p.meaning || '').trim()
        }));

        // Cache immediately in localStorage
        saveCustomExampleForWord(cleanHanzi, sanitized);
        return sanitized;
      }
      throw new Error('Dữ liệu JSON không đúng cấu trúc mảng.');
    } catch (err: any) {
      const isRetryableError = err.message && (
        err.message.includes('429') ||
        err.message.toLowerCase().includes('quota') ||
        err.message.toLowerCase().includes('resource has been exhausted') ||
        err.message.toLowerCase().includes('not found') ||
        err.message.toLowerCase().includes('overloaded') ||
        err.message.includes('JSON')
      );

      if (!isLastModel && isRetryableError) {
        console.warn(`[AI Service] Model ${modelConfig.name} (${modelConfig.id}) gặp sự cố: ${err.message}. Tiếp tục fallback...`);
        lastErrorMsg = `${modelConfig.name}: ${err.message}`;
        continue;
      }

      if (isLastModel) {
        console.error(`[AI Service] Tất cả model trong chuỗi fallback đều không thành công. Model cuối cùng ${modelConfig.name} báo lỗi:`, err);
        throw err;
      }
    }
  }

  throw new Error(`Không thể gọi API Gemini (${lastErrorMsg || 'Tất cả model trong chuỗi fallback đều phản hồi lỗi'})`);
}
