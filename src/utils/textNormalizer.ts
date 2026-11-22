import { pinyin } from 'pinyin-pro';

/**
 * Remove whitespace, common punctuation (English & Chinese), and case formatting.
 */
export function normalizeChineseText(text: string): string {
  if (!text) return '';
  return text
    // Remove all whitespace (including unicode whitespace and normal spaces)
    .replace(/\s+/g, '')
    // Remove Chinese & English punctuation
    .replace(/[.,/#!$%^&*;:{}=\-_`~()，。？！、；：“”‘’（）《》〈〉【】…—]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Split a raw hanzi cell that may contain multiple valid answers.
 * e.g. "谢谢 / 多谢", "你好；您好", "对不起, 抱歉"
 */
export function extractValidAnswers(rawHanzi: string): string[] {
  if (!rawHanzi) return [];
  
  // Split on slash, semicolons, commas, or newline
  const parts = rawHanzi.split(/[/;；,，、\n\r|]/);
  const answers = parts
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // If nothing resulted from split, fallback to original trimmed
  if (answers.length === 0 && rawHanzi.trim()) {
    return [rawHanzi.trim()];
  }
  return answers;
}

/**
 * Compare user input with list of valid answers.
 */
export function isAnswerCorrect(input: string, validAnswers: string[]): boolean {
  const normalizedInput = normalizeChineseText(input);
  if (!normalizedInput) return false;

  return validAnswers.some(ans => {
    const normalizedAns = normalizeChineseText(ans);
    return normalizedInput === normalizedAns;
  });
}

/**
 * Generate pinyin fallback if missing from sheet
 */
export function getFallbackPinyin(text: string): string {
  if (!text) return '';
  try {
    return pinyin(text, { toneType: 'symbol' });
  } catch (err) {
    console.error('Failed to generate pinyin fallback:', err);
    return '';
  }
}

/**
 * Parse Google Sheet URL or ID
 * Supports:
 * - Full URL: https://docs.google.com/spreadsheets/d/1AbC.../edit#gid=12345
 * - View URL: https://docs.google.com/spreadsheets/d/1AbC.../view
 * - Raw ID: 1AbC...
 */
export function parseSheetUrl(urlOrId: string): { sheetId: string; gid: string } | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const cleanInput = urlOrId.trim();

  // Try extracting from full URL
  const sheetIdMatch = cleanInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = cleanInput.match(/gid=([0-9]+)/);

  let sheetId = '';
  let gid = '0';

  if (sheetIdMatch && sheetIdMatch[1]) {
    sheetId = sheetIdMatch[1];
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }
  } else if (/^[a-zA-Z0-9-_]{20,}$/.test(cleanInput)) {
    // Input is directly a sheet ID
    sheetId = cleanInput;
  }

  if (!sheetId) return null;
  return { sheetId, gid };
}

/**
 * Build export CSV endpoint for Google Visualization API
 */
export function buildGVizCsvUrl(sheetId: string, gid: string = '0'): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}
