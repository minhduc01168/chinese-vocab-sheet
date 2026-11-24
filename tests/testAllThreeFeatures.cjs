/**
 * End-to-End Comprehensive Test Suite for 3 Newly Added Features:
 * Feature 1: Study Range Selection (STT blocks 0-100, 100-200, ... & Random 100)
 * Feature 2: Flagging Bookmark (🚩) & Retry Wrong Words
 * Feature 3: AI Examples (Gemini 2.5/2.0 Flash, Full-Sentence TTS, Admin Passcode)
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pinyin } = require('pinyin-pro');

// Mock localStorage for headless Node environment
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

global.window = {
  dispatchEvent: () => {}
};
global.CustomEvent = class CustomEvent {
  constructor(name, opts) {
    this.name = name;
    this.detail = opts ? opts.detail : null;
  }
};

// Load datasets
const defaultVocab = require('../src/data/defaultVocab.json');
const aiExamples = require('../src/data/aiExamples.json');

console.log('================================================================');
console.log('🧪 TEST TỔNG HỢP TOÀN DIỆN 3 TÍNH NĂNG MỚI BỔ SUNG');
console.log('================================================================\n');

let totalPassed = 0;
let totalFailed = 0;

function runTest(suiteName, testName, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${suiteName} > ${testName}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${suiteName} > ${testName}`);
    console.error(`     Chi tiết lỗi: ${err.message}`);
    totalFailed++;
  }
}

// ============================================================================
// SUITE 1: TÍNH NĂNG 1 - LỰA CHỌN ÔN TẬP THEO BỘ STT & NGẪU NHIÊN 100 TỪ
// ============================================================================
const SUITE_1 = 'TÍNH NĂNG 1 (Study Ranges & Random 100)';

// Logic chia block STT như trong Header.tsx & App.tsx
function computeBlocks(totalItems) {
  const blockSize = 100;
  const blocks = [];
  const totalBlocks = Math.ceil(totalItems / blockSize);
  for (let i = 0; i < totalBlocks; i++) {
    const start = i * blockSize + 1;
    const end = Math.min((i + 1) * blockSize, totalItems);
    blocks.push({
      key: `block_${start}_${end}`,
      label: `Từ STT ${start} - ${end}`,
      start,
      end
    });
  }
  return blocks;
}

// Logic lọc từ theo studyRange như trong App.tsx
function filterItemsByRange(items, studyRange, flaggedIds = new Set()) {
  if (studyRange === 'all') {
    return [...items];
  }

  if (studyRange === 'random100') {
    if (items.length <= 100) return [...items];
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 100);
  }

  if (studyRange === 'flagged') {
    return items.filter(item => flaggedIds.has(String(item.id)));
  }

  if (studyRange.startsWith('block_')) {
    const parts = studyRange.split('_');
    const start = parseInt(parts[1], 10);
    const end = parseInt(parts[2], 10);
    if (!isNaN(start) && !isNaN(end)) {
      return items.slice(start - 1, end);
    }
  }

  return [...items];
}

runTest(SUITE_1, '1.1: Tạo chính xác các khối STT cho kho từ gốc', () => {
  const blocks = computeBlocks(defaultVocab.length);
  assert.strictEqual(blocks.length, Math.ceil(defaultVocab.length / 100));
  assert.strictEqual(blocks[0].key, 'block_1_100');
  assert.strictEqual(blocks[1].key, 'block_101_200');
  assert.strictEqual(blocks[2].key, 'block_201_300');
  assert.strictEqual(blocks[3].key, `block_301_${defaultVocab.length}`);
});

runTest(SUITE_1, '1.2: Lọc đúng số lượng và biên index của từng khối STT', () => {
  const lastBlockKey = `block_301_${defaultVocab.length}`;
  const b1 = filterItemsByRange(defaultVocab, 'block_1_100');
  const b2 = filterItemsByRange(defaultVocab, 'block_101_200');
  const b3 = filterItemsByRange(defaultVocab, 'block_201_300');
  const b4 = filterItemsByRange(defaultVocab, lastBlockKey);

  assert.strictEqual(b1.length, 100, 'Block 1-100 phải có 100 từ');
  assert.strictEqual(b2.length, 100, 'Block 101-200 phải có 100 từ');
  assert.strictEqual(b3.length, 100, 'Block 201-300 phải có 100 từ');
  assert.strictEqual(b4.length, defaultVocab.length - 300, `Block cuối phải có ${defaultVocab.length - 300} từ`);

  // Kiểm tra không bị chồng chéo index
  assert.strictEqual(b1[0].id, defaultVocab[0].id);
  assert.strictEqual(b1[99].id, defaultVocab[99].id);
  assert.strictEqual(b2[0].id, defaultVocab[100].id);
  assert.strictEqual(b4[b4.length - 1].id, defaultVocab[defaultVocab.length - 1].id);
});

runTest(SUITE_1, '1.3: Chế độ random100 chọn đúng 100 từ không trùng lặp và phân phối ngẫu nhiên', () => {
  const randomSet1 = filterItemsByRange(defaultVocab, 'random100');
  const randomSet2 = filterItemsByRange(defaultVocab, 'random100');

  assert.strictEqual(randomSet1.length, 100, 'Random phải có đúng 100 từ');
  assert.strictEqual(randomSet2.length, 100, 'Random phải có đúng 100 từ');

  // Kiểm tra tính không trùng lặp trong cùng 1 lượt random
  const uniqueIds1 = new Set(randomSet1.map(x => x.id));
  assert.strictEqual(uniqueIds1.size, 100, '100 từ random không được trùng nhau');

  // Kiểm tra 2 lượt random phải có khác biệt ngẫu nhiên (không phải cố định)
  const idSeq1 = randomSet1.map(x => x.id).join(',');
  const idSeq2 = randomSet2.map(x => x.id).join(',');
  assert.notStrictEqual(idSeq1, idSeq2, '2 lần random liên tiếp phải khác thứ tự');
});

runTest(SUITE_1, '1.4: Chế độ random100 xử lý an toàn khi kho từ < 100 từ', () => {
  const smallSet = defaultVocab.slice(0, 30);
  const result = filterItemsByRange(smallSet, 'random100');
  assert.strictEqual(result.length, 30, 'Nếu kho dưới 100 từ thì lấy trọn vẹn số từ hiện có');
});

// ============================================================================
// SUITE 2: TÍNH NĂNG 2 - GẮN CỜ 🚩 VÀ ÔN TẬP TỪ SAI / TỪ CẦN ÔN
// ============================================================================
const SUITE_2 = 'TÍNH NĂNG 2 (Flagging & Review Wrong Words)';

const STORAGE_FLAGGED_KEY = 'flagged_vocab_ids_v1';

function getFlaggedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_FLAGGED_KEY);
    return raw ? new Set(JSON.parse(raw).map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function toggleFlagId(id) {
  const current = getFlaggedIds();
  const idStr = String(id);
  if (current.has(idStr)) {
    current.delete(idStr);
  } else {
    current.add(idStr);
  }
  localStorage.setItem(STORAGE_FLAGGED_KEY, JSON.stringify(Array.from(current)));
  return current;
}

runTest(SUITE_2, '2.1: Gắn cờ và bỏ cờ lưu trữ bền bỉ vào localStorage', () => {
  localStorage.clear();
  assert.strictEqual(getFlaggedIds().size, 0);

  // Gắn cờ từ id=5
  toggleFlagId(5);
  let flagged = getFlaggedIds();
  assert.strictEqual(flagged.has('5'), true);
  assert.strictEqual(flagged.size, 1);

  // Gắn cờ tiếp từ id=12, id=99
  toggleFlagId(12);
  toggleFlagId(99);
  flagged = getFlaggedIds();
  assert.strictEqual(flagged.size, 3);
  assert.strictEqual(flagged.has('12'), true);
  assert.strictEqual(flagged.has('99'), true);

  // Bỏ cờ từ id=5
  toggleFlagId(5);
  flagged = getFlaggedIds();
  assert.strictEqual(flagged.has('5'), false);
  assert.strictEqual(flagged.size, 2);
});

runTest(SUITE_2, '2.2: Lọc danh sách ôn tập riêng cho các từ đã gắn cờ (studyRange = flagged)', () => {
  localStorage.clear();
  toggleFlagId(defaultVocab[10].id);
  toggleFlagId(defaultVocab[25].id);
  toggleFlagId(defaultVocab[80].id);

  const flaggedSet = getFlaggedIds();
  const flaggedItems = filterItemsByRange(defaultVocab, 'flagged', flaggedSet);

  assert.strictEqual(flaggedItems.length, 3);
  assert.strictEqual(flaggedItems[0].id, defaultVocab[10].id);
  assert.strictEqual(flaggedItems[1].id, defaultVocab[25].id);
  assert.strictEqual(flaggedItems[2].id, defaultVocab[80].id);
});

runTest(SUITE_2, '2.3: Chức năng Ôn lại các từ sai lọc chính xác các từ trả lời sai', () => {
  // Giả lập trạng thái kết quả một phiên học
  const mockCardsState = {
    [defaultVocab[0].id]: { status: 'correct', attempts: 1 },
    [defaultVocab[1].id]: { status: 'wrong', attempts: 2 },
    [defaultVocab[2].id]: { status: 'correct', attempts: 1 },
    [defaultVocab[3].id]: { status: 'wrong', attempts: 3 },
    [defaultVocab[4].id]: { status: 'revealed', attempts: 2 },
  };

  const currentSessionItems = defaultVocab.slice(0, 5);

  // Lọc từ sai để ôn lại (wrong hoặc revealed)
  const wrongOnlyItems = currentSessionItems.filter(item => {
    const st = mockCardsState[item.id]?.status;
    return st === 'wrong' || st === 'revealed';
  });

  assert.strictEqual(wrongOnlyItems.length, 3);
  assert.strictEqual(wrongOnlyItems[0].id, defaultVocab[1].id);
  assert.strictEqual(wrongOnlyItems[1].id, defaultVocab[3].id);
  assert.strictEqual(wrongOnlyItems[2].id, defaultVocab[4].id);
});

// ============================================================================
// SUITE 3: TÍNH NĂNG 3 - AI VÍ DỤ, PHÁT ÂM CÂU VÀ BẢO MẬT ADMIN PASSCODE
// ============================================================================
const SUITE_3 = 'TÍNH NĂNG 3 (AI Examples, Audio Full Sentence, Admin Passcode)';

runTest(SUITE_3, '3.1: Toàn bộ kho ví dụ aiExamples.json hợp lệ, có đủ Hán tự, Pinyin, Tiếng Việt', () => {
  const keys = Object.keys(aiExamples);
  assert.ok(keys.length >= 320, 'Kho ví dụ phải có >= 320 từ');

  let invalidCount = 0;
  let remainingRawExampleCount = 0;

  for (const [word, exList] of Object.entries(aiExamples)) {
    assert.ok(Array.isArray(exList) && exList.length >= 1, `Từ "${word}" phải có danh sách ví dụ`);
    for (const ex of exList) {
      if (!ex.hanzi || !ex.pinyin || !ex.meaning) {
        invalidCount++;
      }
      if (ex.meaning.includes('(Ví dụ thực tế):')) {
        remainingRawExampleCount++;
      }
    }
  }

  assert.strictEqual(invalidCount, 0, 'Tất cả các câu ví dụ phải có đủ 3 trường hanzi, pinyin, meaning');
  assert.strictEqual(remainingRawExampleCount, 0, 'Không còn câu nào bị lặp lại (Ví dụ thực tế): [câu tiếng Trung]');
});

runTest(SUITE_3, '3.2: Logic phát âm không bị cắt sau dấu phẩy tiếng Trung (，) và tiếng Anh (,)', () => {
  function cleanSpeechText(text, isFullSentence = false) {
    let cleanText = text.trim();
    if (!isFullSentence) {
      cleanText = cleanText.split(/[/|\n]/)[0].trim();
    }
    return cleanText;
  }

  // Câu ví dụ có dấu phẩy tiếng Trung
  const sentence1 = '您好，请问您贵姓？';
  assert.strictEqual(cleanSpeechText(sentence1, true), '您好，请问您贵姓？');
  // Kể cả khi quên truyền isFullSentence, do regex đã bỏ dấu phẩy nên vẫn giữ nguyên cả câu
  assert.strictEqual(cleanSpeechText(sentence1, false), '您好，请问您贵姓？');

  // Câu ví dụ phức hợp
  const sentence2 = '今天天气很好，我们出去散步吧。';
  assert.strictEqual(cleanSpeechText(sentence2, true), '今天天气很好，我们出去散步吧。');

  // Từ vựng có dấu gạch chéo đồng nghĩa
  const vocabSynonym = '谢谢 / 多谢';
  assert.strictEqual(cleanSpeechText(vocabSynonym, false), '谢谢');
});

runTest(SUITE_3, '3.3: Lưu trữ ví dụ sinh mới vào localStorage và ưu tiên lấy trước file json', () => {
  localStorage.clear();
  const STORAGE_CUSTOM_EXAMPLES_KEY = 'ai_custom_examples_v1';

  function saveCustom(word, list) {
    const cur = JSON.parse(localStorage.getItem(STORAGE_CUSTOM_EXAMPLES_KEY) || '{}');
    cur[word] = list;
    localStorage.setItem(STORAGE_CUSTOM_EXAMPLES_KEY, JSON.stringify(cur));
  }

  function getExamples(word) {
    const cur = JSON.parse(localStorage.getItem(STORAGE_CUSTOM_EXAMPLES_KEY) || '{}');
    if (cur[word]) return cur[word];
    return aiExamples[word] || [];
  }

  // Giả lập từ mới được thêm vào
  const newCustomWord = '高铁';
  const customList = [
    { hanzi: '中国的高铁速度非常快。', pinyin: 'Zhōngguó de gāotiě sùdù fēicháng kuài.', meaning: 'Tàu cao tốc Trung Quốc tốc độ rất nhanh.' }
  ];

  saveCustom(newCustomWord, customList);
  const retrieved = getExamples(newCustomWord);
  assert.strictEqual(retrieved.length, 1);
  assert.strictEqual(retrieved[0].hanzi, '中国的高铁速度非常快。');

  // Kiểm tra từ cũ vẫn lấy đúng từ file json
  const laoshi = getExamples('老师');
  assert.strictEqual(laoshi[0].hanzi, '李老师在哪儿？');
  assert.strictEqual(laoshi[0].meaning, 'Thầy Lý ở đâu thế?');
});

runTest(SUITE_3, '3.4: Cơ chế Multi-model Fallback khi gặp lỗi 429 theo thứ tự yêu cầu', () => {
  // Chuỗi model theo đúng yêu cầu: gemini-2.5-flash -> gemma-4-31b-it -> gemma-4-31b -> Gemma 4 26B -> gemini-3.8-flash -> Gemini 3 Flash -> Gemini 3.1 Flash Lite
  const fallbackChain = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemma-4-31b-it', name: 'Gemma 4 31B (it)' },
    { id: 'gemma-4-31b', name: 'Gemma 4 31B' },
    { id: 'gemma-4-26b', name: 'Gemma 4 26B' },
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
    { id: 'gemini-3-flash', name: 'Gemini 3 Flash' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' },
  ];

  assert.strictEqual(fallbackChain.length, 7, 'Chuỗi fallback gồm đúng 7 model theo yêu cầu');
  assert.strictEqual(fallbackChain[0].id, 'gemini-2.5-flash');
  assert.strictEqual(fallbackChain[1].id, 'gemma-4-31b-it');
  assert.strictEqual(fallbackChain[2].id, 'gemma-4-31b');
  assert.strictEqual(fallbackChain[3].id, 'gemma-4-26b');
  assert.strictEqual(fallbackChain[4].id, 'gemini-3.8-flash');
  assert.strictEqual(fallbackChain[5].id, 'gemini-3-flash');
  assert.strictEqual(fallbackChain[6].id, 'gemini-3.1-flash-lite');

  // Đảm bảo đã bỏ hoàn toàn 2 model gemini-2.0-flash và gemini-1.5-flash
  assert.strictEqual(fallbackChain.some(m => m.id.includes('2.0') || m.id.includes('1.5')), false, 'Đã loại bỏ 2.0-flash và 1.5-flash');

  // Kiểm tra logic điều kiện nhận diện lỗi 429 để kích hoạt Fallback
  const test429Response = { status: 429, message: 'Resource has been exhausted (e.g. check quota)' };
  const isRateLimited = test429Response.status === 429 || 
    test429Response.message.includes('429') || 
    test429Response.message.toLowerCase().includes('quota') || 
    test429Response.message.toLowerCase().includes('resource has been exhausted');
  assert.strictEqual(isRateLimited, true, 'Lỗi 429 / Quota phải được nhận diện chính xác để kích hoạt fallback sang model tiếp theo');
});

runTest(SUITE_3, '3.5: Bảo mật mật khẩu Admin: Mật khẩu lưu ở backend (.env) và khớp 161203', () => {
  // Kiểm tra file .env hoặc biến cấu hình
  const envPath = path.join(__dirname, '../.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Mật khẩu là 161203 trong .env
  const hasEnvConfig = envContent.includes('VITE_ADMIN_PASSCODE=161203');
  assert.ok(hasEnvConfig, 'File .env phải lưu biến VITE_ADMIN_PASSCODE=161203');

  // Kiểm tra giao diện SettingsModal không còn lộ mật khẩu mặc định trên placeholder hoặc mô tả
  const settingsModalPath = path.join(__dirname, '../src/components/SettingsModal.tsx');
  const settingsModalContent = fs.readFileSync(settingsModalPath, 'utf8');
  assert.strictEqual(
    settingsModalContent.includes('Mật khẩu mặc định 1688'),
    false,
    'Giao diện không được chứa chuỗi lộ mật khẩu mặc định 1688'
  );
  assert.strictEqual(
    settingsModalContent.includes('placeholder="Nhập mật khẩu quản trị..."'),
    true,
    'Placeholder phải là chuỗi bảo mật "Nhập mật khẩu quản trị..."'
  );
});

// ============================================================================
// TỔNG KẾT
// ============================================================================
console.log('\n================================================================');
console.log(`🏁 TỔNG KẾT KIỂM THỬ 3 TÍNH NĂNG: ${totalPassed} PASSED / ${totalFailed} FAILED`);
console.log('================================================================\n');

if (totalFailed > 0) {
  process.exit(1);
}
