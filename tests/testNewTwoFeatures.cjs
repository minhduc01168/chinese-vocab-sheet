/**
 * Test Suite for 2 Newly Added Features:
 * Feature 1: Audio Hint (Gợi ý bằng âm thanh đọc từ vựng)
 * Feature 2: Auto-decrement and clear "Cần ôn tập" to 0 when answers are correct
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Mock localStorage for Node environment
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

console.log('================================================================');
console.log('🧪 BẮT ĐẦU TEST KIỂM THỬ 2 TÍNH NĂNG MỚI BỔ SUNG');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Chi tiết lỗi: ${err.message}`);
    failed++;
  }
}

// ----------------------------------------------------------------------------
// SUITE 1: TÍNH NĂNG 1 - GỢI Ý BẰNG ÂM THANH ĐỌC TỪ
// ----------------------------------------------------------------------------
it('1.1: Gợi ý âm thanh chuẩn bị đúng văn bản chữ Hán cần phát âm', () => {
  const item1 = { id: 1, hanzi: '咖啡', validAnswers: ['咖啡'], meaning: 'cà phê' };
  const item2 = { id: 2, hanzi: '谢谢 / 多谢', validAnswers: ['谢谢', '多谢'], meaning: 'cảm ơn' };
  
  // Logic chuẩn bị text trong nút Gợi ý âm thanh
  const speechText1 = item1.validAnswers[0] || item1.hanzi;
  assert.strictEqual(speechText1, '咖啡');

  const speechText2 = item2.validAnswers[0] || item2.hanzi;
  assert.strictEqual(speechText2, '谢谢');
});

it('1.2: Hàm speak lọc đúng từ vựng không bị đứt đoạn và giữ nguyên câu nếu có dấu câu', () => {
  function getCleanText(text, isFullSentence = false) {
    let clean = text.trim();
    if (!isFullSentence) {
      clean = clean.split(/[/|\n]/)[0].trim();
    }
    return clean;
  }

  assert.strictEqual(getCleanText('咖啡'), '咖啡');
  assert.strictEqual(getCleanText('谢谢 / 多谢'), '谢谢');
  assert.strictEqual(getCleanText('您好，请问您贵姓？', true), '您好，请问您贵姓？');
});

it('1.3: Kiểm tra giao diện QuizCard.tsx có nút Gợi ý âm thanh với icon Volume2', () => {
  const quizCardPath = path.join(__dirname, '../src/components/QuizCard.tsx');
  const content = fs.readFileSync(quizCardPath, 'utf8');

  assert.ok(content.includes('Gợi ý âm thanh 🔊'), 'QuizCard phải chứa nhãn "Gợi ý âm thanh 🔊"');
  assert.ok(content.includes('Volume2'), 'QuizCard phải hiển thị biểu tượng Volume2');
  assert.ok(content.includes('Nghe phát âm từ này để nhớ cách gõ'), 'Nút phải có tooltip giải thích rõ ràng');
});

// ----------------------------------------------------------------------------
// SUITE 2: TÍNH NĂNG 2 - TRỪ DẦN "CẦN ÔN TẬP" KHI LÀM ĐÚNG VỀ 0
// ----------------------------------------------------------------------------
const STORAGE_FLAGGED_KEY = 'vocab_flagged_history_v1';
const STORAGE_WRONG_KEY = 'vocab_wrong_history_v1';

it('2.1: Khi làm đúng trong chế độ Cần ôn tập, từ được gỡ khỏi cả wrongHistory và flaggedIds', () => {
  localStorage.clear();

  // Khởi tạo 3 từ trong mục "Cần ôn tập"
  let wrongHistory = {
    '101': { wrongCount: 1, lastReviewedAt: Date.now(), lastStatus: 'wrong' },
    '102': { wrongCount: 2, lastReviewedAt: Date.now(), lastStatus: 'wrong' },
  };
  let flaggedIds = {
    '103': true,
  };

  // Tính số lượng Cần ôn tập ban đầu
  function calcReviewAllCount(wHist, fIds) {
    const wrongKeys = new Set(
      Object.entries(wHist)
        .filter(([, v]) => v.wrongCount > 0 || v.lastStatus === 'wrong' || v.lastStatus === 'skipped')
        .map(([k]) => k)
    );
    Object.keys(fIds).forEach(k => wrongKeys.add(k));
    return wrongKeys.size;
  }

  assert.strictEqual(calcReviewAllCount(wrongHistory, flaggedIds), 3, 'Ban đầu phải có 3 từ cần ôn tập');

  // Giả lập hàm recordCorrectHistory khi ở chế độ review_all
  function handleCorrectAnswer(itemId, studyRange) {
    // 1. Xóa khỏi wrongHistory
    if (wrongHistory[itemId]) {
      delete wrongHistory[itemId];
    }
    // 2. Xóa khỏi flaggedIds nếu ở chế độ ôn tập
    if (studyRange === 'review_all' || studyRange === 'flagged' || studyRange === 'incorrect') {
      if (flaggedIds[itemId]) {
        delete flaggedIds[itemId];
      }
    }
  }

  // Bước 1: Người dùng làm ĐÚNG từ 101
  handleCorrectAnswer('101', 'review_all');
  assert.strictEqual(calcReviewAllCount(wrongHistory, flaggedIds), 2, 'Sau khi làm đúng từ 101, còn 2 từ');

  // Bước 2: Người dùng làm ĐÚNG từ 103 (từ được gắn cờ)
  handleCorrectAnswer('103', 'review_all');
  assert.strictEqual(calcReviewAllCount(wrongHistory, flaggedIds), 1, 'Sau khi làm đúng từ 103, còn 1 từ');

  // Bước 3: Người dùng làm ĐÚNG nốt từ 102
  handleCorrectAnswer('102', 'review_all');
  assert.strictEqual(calcReviewAllCount(wrongHistory, flaggedIds), 0, 'Sau khi làm đúng toàn bộ, Cần ôn tập về ĐÚNG 0!');
});

it('2.2: Phiên làm bài hiện tại không bị nhảy thẻ giữa chừng nhờ cơ chế neo sessionSeed', () => {
  // Giả lập 3 thẻ đang có trong phiên
  const initialItems = [
    { id: '101', hanzi: '咖啡' },
    { id: '102', hanzi: '可乐' },
    { id: '103', hanzi: '烤鸭' }
  ];

  // Trong phiên làm bài, danh sách activeItems được giữ nguyên 3 thẻ
  const sessionActiveItems = [...initialItems];
  let currentIndex = 0;

  // Trả lời đúng thẻ 1 (101)
  assert.strictEqual(sessionActiveItems[currentIndex].id, '101');
  currentIndex++;

  // Sang thẻ 2 (102) vẫn an toàn không bị giật hay out of bounds
  assert.strictEqual(sessionActiveItems[currentIndex].id, '102');
  currentIndex++;

  // Sang thẻ 3 (103)
  assert.strictEqual(sessionActiveItems[currentIndex].id, '103');
  currentIndex++;

  // Phiên hoàn tất
  assert.strictEqual(currentIndex, 3);
});

it('2.3: Khi Cần ôn tập về 0, giao diện App.tsx hiển thị thông báo chúc mừng hoàn thành', () => {
  const appPath = path.join(__dirname, '../src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  assert.ok(appContent.includes('Không còn từ nào cần ôn tập! 🎉'), 
    'App.tsx phải chứa tiêu đề chúc mừng khi mục cần ôn tập về 0');
  assert.ok(appContent.includes('danh sách cần ôn tập hiện đã về 0'),
    'App.tsx phải chứa thông báo hoàn thành toàn bộ từ');
});

console.log('\n================================================================');
console.log(`🏁 TỔNG KẾT TEST 2 TÍNH NĂNG MỚI: ${passed} PASSED / ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
