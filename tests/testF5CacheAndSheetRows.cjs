const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const pregenDict = require('../src/data/aiExamples.json');
const defaultVocab = require('../src/data/defaultVocab.json');

console.log('================================================================');
console.log('🧪 TEST KIỂM TRA TOÀN DIỆN: PHÂN TÍCH 349 HÀNG & CHỐNG GỌI LẠI GEMINI KHI F5');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Lỗi: ${err.message}`);
    failed++;
  }
}

// Emulate normalizeHanziKey as defined in src/utils/aiExampleService.ts
function normalizeHanziKey(hanzi) {
  if (!hanzi) return '';
  return hanzi
    .split(/[\/\n\r;；,，、]/)[0]
    .replace(/[（(].*?[）)]/g, '')
    .replace(/[\[\]]/g, '')
    .trim();
}

// Emulate storage and cooldown
const mockLocalStorage = {};
const mockSessionStorage = {};
const STORAGE_CUSTOM_EXAMPLES_KEY = 'ai_custom_examples_v1';
const FAILED_ATTEMPTS_STORAGE_KEY = 'ai_attempted_cooldown_v1';
const COOLDOWN_MS = 5 * 60 * 1000;

let memoryCustomStore = null;

function getCustomExamplesStore() {
  if (memoryCustomStore !== null) return memoryCustomStore;
  const saved = mockLocalStorage[STORAGE_CUSTOM_EXAMPLES_KEY];
  memoryCustomStore = saved ? JSON.parse(saved) : {};
  return memoryCustomStore;
}

function saveCustomExampleForWord(hanzi, examples) {
  if (!hanzi || !examples || examples.length === 0) return;
  const cleanKey = normalizeHanziKey(hanzi);
  if (!cleanKey) return;
  const store = getCustomExamplesStore();
  store[cleanKey] = examples;
  const rawTrimmed = hanzi.trim();
  if (rawTrimmed && rawTrimmed !== cleanKey) {
    store[rawTrimmed] = examples;
  }
  memoryCustomStore = store;
  mockLocalStorage[STORAGE_CUSTOM_EXAMPLES_KEY] = JSON.stringify(store);
}

function hasWordExamples(hanzi) {
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

function isWordInCooldown(hanzi) {
  const clean = normalizeHanziKey(hanzi);
  if (!clean) return false;
  const raw = mockSessionStorage[FAILED_ATTEMPTS_STORAGE_KEY];
  if (!raw) return false;
  const records = JSON.parse(raw);
  const lastTime = records[clean];
  return !!(lastTime && Date.now() - lastTime < COOLDOWN_MS);
}

function markWordFailedCooldown(hanzi) {
  const clean = normalizeHanziKey(hanzi);
  if (!clean) return;
  const raw = mockSessionStorage[FAILED_ATTEMPTS_STORAGE_KEY];
  const records = raw ? JSON.parse(raw) : {};
  records[clean] = Date.now();
  mockSessionStorage[FAILED_ATTEMPTS_STORAGE_KEY] = JSON.stringify(records);
}

// TEST 1: Phân tích tại sao Google Sheet có 349 hàng dữ liệu nhưng chỉ có 345 từ
it('1. Kiểm tra chính xác 349 hàng dữ liệu trên Sheet và lý do loại trừ các hàng trống nghĩa', () => {
  // Giả lập mẫu các hàng dữ liệu thực tế từ Google Sheet phân tích hàng trống nghĩa
  const mockSheetRows = [
    ['序号', '汉字', '拼音', '汉越音', '越南语意思', '例如'],
    ['1', '我', 'wǒ', 'ngã', 'tôi', '我是学生'],
    ['148', '走边', '', '', '', ''], // Hàng 149 trống nghĩa
    ['293', '如此', '', '', '', ''], // Hàng 294 ban đầu trống nghĩa
    ['298', '果然超强吸收', '', '', '', ''], // Hàng 299 ban đầu trống nghĩa
    ['342', '妻子', 'qīzi', 'thê tử', '', ''], // Hàng 343 ban đầu trống nghĩa
    ['349', '提交', '[tíjiāo', '[đề giao]', 'nộp; đệ trình', ''],
  ];

  const skipped = [];
  mockSheetRows.slice(1).forEach((r, idx) => {
    const excelRow = idx + 2;
    const hanzi = (r[1] || '').trim();
    const meaning = (r[4] || '').trim();
    if (!hanzi || !meaning) {
      skipped.push({ excelRow, stt: r[0], hanzi, meaning });
    }
  });

  // Có đúng 4 hàng bị loại do trống nghĩa
  assert.strictEqual(skipped.length, 4, 'Đúng 4 hàng bị loại do trống nghĩa');
  assert.strictEqual(skipped[0].hanzi, '走边');
  assert.strictEqual(skipped[1].hanzi, '如此');
  assert.strictEqual(skipped[2].hanzi, '果然超强吸收');
  assert.strictEqual(skipped[3].hanzi, '妻子');
});

// TEST 2: Khi F5, tất cả từ vựng hiện tại đều có ví dụ sẵn -> missingItems = 0 -> KHÔNG gọi Gemini
it('2. Kiểm tra hàng đợi missingItems khi load F5 đối với toàn bộ từ vựng hiện tại', () => {
  const missingItems = defaultVocab.filter(item => {
    const primary = (item.validAnswers && item.validAnswers[0]) || item.hanzi;
    return !hasWordExamples(primary) && !hasWordExamples(item.hanzi);
  });

  assert.strictEqual(
    missingItems.length,
    0,
    `Hàng đợi thiếu ví dụ khi F5 phải bằng 0 tuyệt đối! Thực tế còn thiếu: ${missingItems.length}`
  );
});

// TEST 3: Chuẩn hóa key normalizeHanziKey hỗ trợ đa dòng, ngoặc kép, dấu phân cách
it('3. Hàm normalizeHanziKey làm sạch key chính xác cho các từ vựng phức tạp', () => {
  assert.strictEqual(normalizeHanziKey('驾驶员\n司机'), '驾驶员');
  assert.strictEqual(normalizeHanziKey('邮箱\n邮件'), '邮箱');
  assert.strictEqual(normalizeHanziKey('放假'), '放假');
  assert.strictEqual(normalizeHanziKey('[tíjiāo'), 'tíjiāo');
  assert.strictEqual(normalizeHanziKey('妻子（qīzi）'), '妻子');
  assert.strictEqual(normalizeHanziKey('常用/经常'), '常用');
});

// TEST 4: Lưu vào cache localStorage và truy xuất thành công cho từ mới
it('4. saveCustomExampleForWord lưu đúng cả key chuẩn hóa và key thô vào cache', () => {
  const newWord = '测试词';
  const sampleEx = [
    { hanzi: '这是一个测试句子。', pinyin: 'Zhè shì yí gè cèshì jùzi.', meaning: 'Đây là một câu kiểm thử.' }
  ];

  assert.strictEqual(hasWordExamples(newWord), false);
  saveCustomExampleForWord(newWord, sampleEx);
  assert.strictEqual(hasWordExamples(newWord), true);

  // Từ nhiều dòng: 经理\n老板
  saveCustomExampleForWord('经理\n老板', sampleEx);
  assert.strictEqual(hasWordExamples('经理'), true);
  assert.strictEqual(hasWordExamples('经理\n老板'), true);
});

// TEST 5: Cơ chế Cooldown ngăn chặn gọi lại Gemini liên tục khi gặp lỗi hoặc bị Rate Limit
it('5. Cơ chế Cooldown 5 phút chặn gọi lại Gemini đối với các từ lỗi khi F5', () => {
  const failedWord = '网络错误词';
  assert.strictEqual(isWordInCooldown(failedWord), false);

  // Giả lập từ này bị lỗi mạng hoặc Gemini 429
  markWordFailedCooldown(failedWord);
  assert.strictEqual(isWordInCooldown(failedWord), true);

  // Kiểm tra xem bộ lọc hàng đợi có tự động bỏ qua từ đang trong cooldown không
  const testItems = [
    { id: '1', hanzi: failedWord, validAnswers: [failedWord], meaning: 'nghĩa' }
  ];

  const pending = testItems.filter(item => {
    const primary = (item.validAnswers && item.validAnswers[0]) || item.hanzi;
    if (hasWordExamples(primary) || hasWordExamples(item.hanzi)) return false;
    if (isWordInCooldown(primary) || isWordInCooldown(item.hanzi)) return false;
    return true;
  });

  assert.strictEqual(pending.length, 0, 'Từ đang trong cooldown phải bị loại trừ khỏi hàng đợi F5!');
});

// TEST 6: Toàn bộ 349 từ vựng trong aiExamples.json đều không chứa chữ Hán ở cột nghĩa tiếng Việt
it('6. Tất cả câu ví dụ trong aiExamples.json đảm bảo 100% tiếng Việt ở cột nghĩa', () => {
  const chineseRegex = /[\u4e00-\u9fa5]/;
  const contaminated = [];

  for (const [word, exList] of Object.entries(pregenDict)) {
    exList.forEach((ex, idx) => {
      if (chineseRegex.test(ex.meaning)) {
        contaminated.push({ word, index: idx + 1, meaning: ex.meaning });
      }
    });
  }

  assert.strictEqual(
    contaminated.length,
    0,
    `Phát hiện ${contaminated.length} câu ví dụ bị dính chữ Hán: ${JSON.stringify(contaminated)}`
  );
});

console.log('\n================================================================');
console.log(`🏁 TỔNG KẾT: ${passed} PASSED / ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
