import { AiExampleItem } from '../types/vocab';
import pregenExamples from '../data/aiExamples.json';
import { pinyin } from 'pinyin-pro';

const STORAGE_CUSTOM_EXAMPLES_KEY = 'ai_custom_examples_v1';

// In-memory merge of pregen and local custom examples
const pregenDict = pregenExamples as Record<string, AiExampleItem[]>;

export function getCustomExamplesStore(): Record<string, AiExampleItem[]> {
  try {
    const saved = localStorage.getItem(STORAGE_CUSTOM_EXAMPLES_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveCustomExampleForWord(hanzi: string, examples: AiExampleItem[]) {
  if (!hanzi || !examples || examples.length === 0) return;
  const cleanKey = hanzi.trim();
  try {
    const store = getCustomExamplesStore();
    store[cleanKey] = examples;
    localStorage.setItem(STORAGE_CUSTOM_EXAMPLES_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Could not save custom AI examples to localStorage:', e);
  }
}

/**
 * Get all available examples for a word (from pre-gen file, or localStorage, or sheet fallback)
 */
export function getWordExamples(hanzi: string, sheetExample?: string): AiExampleItem[] {
  if (!hanzi) return [];
  const clean = hanzi.split(/[/;；,，]/)[0].trim();

  // 1. Check custom localStorage store (for newly generated words)
  const customStore = getCustomExamplesStore();
  if (customStore[clean] && customStore[clean].length > 0) {
    return customStore[clean];
  }

  // 2. Check pre-generated file
  if (pregenDict[clean] && pregenDict[clean].length > 0) {
    return pregenDict[clean];
  }

  // 3. Fallback to sheet example if provided
  if (sheetExample && sheetExample.trim()) {
    const exText = sheetExample.trim().split(/[\n\r]+/)[0];
    const py = pinyin(exText, { toneType: 'symbol' }).trim();
    const formattedPy = py.charAt(0).toUpperCase() + py.slice(1);
    return [{
      hanzi: exText,
      pinyin: formattedPy,
      meaning: `(Ví dụ trong Sheet): ${exText}`
    }];
  }

  return [];
}

/**
 * Check if a word already has examples in store
 */
export function hasWordExamples(hanzi: string): boolean {
  if (!hanzi) return false;
  const clean = hanzi.split(/[/;；,，]/)[0].trim();
  const customStore = getCustomExamplesStore();
  if (customStore[clean] && customStore[clean].length > 0) return true;
  if (pregenDict[clean] && pregenDict[clean].length > 0) return true;
  return false;
}

/**
 * Call Gemini 2.5 Flash API to generate 3 practical example sentences
 */
export async function generateExamplesWithGemini(
  apiKey: string,
  hanzi: string,
  meaning: string
): Promise<AiExampleItem[]> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Chưa cấu hình Google Gemini API Key.');
  }

  const cleanHanzi = hanzi.split(/[/;；,，]/)[0].trim();
  const prompt = `Bạn là chuyên gia giảng dạy tiếng Trung Quốc cho người Việt Nam.
Hãy tạo đúng 3 câu ví dụ tiếng Trung thông dụng, tự nhiên và thiết thực nhất cho từ vựng: "${cleanHanzi}" (nghĩa tiếng Việt: "${meaning}").
Yêu cầu:
1. Câu 1: Ngắn gọn, cơ bản, giao tiếp hàng ngày.
2. Câu 2: Tình huống thực tế (học tập, công sở, mua sắm hoặc ăn uống).
3. Câu 3: Câu ghép tự nhiên giúp mở rộng cách dùng từ.

BẮT BUỘC trả về định dạng JSON thuần túy (không bọc trong markdown code block, không thêm lời chào), cấu trúc:
[
  {
    "hanzi": "chữ Hán đầy đủ có dấu câu",
    "pinyin": "phiên âm pinyin có dấu thanh điệu chuẩn",
    "meaning": "dịch nghĩa tiếng Việt tự nhiên"
  }
]`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

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
        maxOutputTokens: 800
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `Lỗi HTTP ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Clean JSON string if enclosed in markdown backticks
  const cleanedJsonStr = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    const parsed = JSON.parse(cleanedJsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const sanitized: AiExampleItem[] = parsed.map(p => ({
        hanzi: (p.hanzi || '').trim(),
        pinyin: (p.pinyin || pinyin(p.hanzi || '', { toneType: 'symbol' })).trim(),
        meaning: (p.meaning || '').trim()
      }));

      // Cache immediately
      saveCustomExampleForWord(cleanHanzi, sanitized);
      return sanitized;
    }
    throw new Error('Dữ liệu JSON không đúng cấu trúc mảng.');
  } catch (err: any) {
    console.error('Failed to parse Gemini output:', rawText, err);
    throw new Error('Không thể phân tích kết quả trả về từ Gemini: ' + err.message);
  }
}
