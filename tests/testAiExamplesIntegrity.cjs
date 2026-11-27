/**
 * Integrity and Quality Verification Test Suite for aiExamples.json
 * 
 * Verifies:
 * 1. Completeness: Exactly 322 words, each having exactly 3 examples (total 966 examples)
 * 2. Structural validity: Each example has valid `hanzi`, `pinyin`, and `meaning`
 * 3. 100% Pure Vietnamese Meanings: Zero Chinese characters in any translation (`meaning`)
 * 4. Zero Robotic Template Phrases: No generic filler phrases like "rất thông dụng", "viết câu đơn giản"
 * 5. Quality of previously problematic words: `运动场`, `服务员`, `她` have authentic conversational sentences
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const dataPath = path.join(__dirname, '../src/data/aiExamples.json');
const aiExamples = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('================================================================');
console.log('🧪 BẮT ĐẦU TEST KIỂM TRA CHẤT LƯỢNG VÀ TOÀN VẸN CỦA KHO VÍ DỤ');
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

// TEST 1: Số lượng từ vựng và câu ví dụ
it('1. Toàn bộ các từ vựng đều có mặt và mỗi từ có đúng 3 câu ví dụ', () => {
  const words = Object.keys(aiExamples);
  assert.ok(words.length >= 345, `Mong đợi ít nhất 345 từ, thực tế có ${words.length}`);

  let totalExamples = 0;
  for (const [w, list] of Object.entries(aiExamples)) {
    assert.ok(Array.isArray(list), `Từ "${w}" phải có danh sách ví dụ là mảng`);
    assert.strictEqual(list.length, 3, `Từ "${w}" phải có đúng 3 câu ví dụ (hiện có ${list.length})`);
    totalExamples += list.length;
  }
  assert.strictEqual(totalExamples, words.length * 3, `Tổng số câu ví dụ phải là ${words.length * 3}`);
});

// TEST 2: Đầy đủ trường và cấu trúc dữ liệu
it('2. Mỗi câu ví dụ đều có đầy đủ trường hanzi, pinyin, meaning không rỗng', () => {
  for (const [w, list] of Object.entries(aiExamples)) {
    list.forEach((ex, idx) => {
      assert.ok(ex.hanzi && ex.hanzi.trim().length >= 2, `Từ "${w}" câu ${idx+1} thiếu trường hanzi hợp lệ`);
      assert.ok(ex.pinyin && ex.pinyin.trim().length >= 2, `Từ "${w}" câu ${idx+1} thiếu trường pinyin hợp lệ`);
      assert.ok(ex.meaning && ex.meaning.trim().length >= 2, `Từ "${w}" câu ${idx+1} thiếu trường meaning hợp lệ`);
      // Pinyin phải viết hoa chữ cái đầu (hỗ trợ đầy đủ Unicode Pinyin có thanh điệu như Ě, Ā, Ō, v.v.)
      assert.ok(/^\p{Lu}/u.test(ex.pinyin), 
        `Pinyin của từ "${w}" câu ${idx+1} phải viết hoa đầu câu: "${ex.pinyin}"`);
    });
  }
});

// TEST 3: Tuyệt đối KHÔNG có chữ Hán trong cột nghĩa tiếng Việt
it(`3. Tất cả ${Object.keys(aiExamples).length * 3} câu ví dụ: phần dịch tiếng Việt 100% thuần Việt (0 ký tự chữ Hán)`, () => {
  const violations = [];
  for (const [w, list] of Object.entries(aiExamples)) {
    list.forEach((ex, idx) => {
      if (/[\u4e00-\u9fa5]/.test(ex.meaning)) {
        violations.push({ word: w, index: idx + 1, meaning: ex.meaning });
      }
    });
  }

  assert.strictEqual(violations.length, 0, 
    `Phát hiện ${violations.length} câu bị dính chữ Hán: ${JSON.stringify(violations.slice(0, 3))}`);
});

// TEST 4: Tuyệt đối KHÔNG còn câu mẫu khuôn sáo cũ
it('4. Không còn bất kỳ câu nào dùng khuôn mẫu điền vào chỗ trống cũ', () => {
  const forbiddenPhrases = [
    'rất thông dụng',
    'viết một câu đơn giản',
    'trong đời sống.',
    'của tôi rất thích học tiếng Trung',
    'Mọi người đều rất thích'
  ];

  const foundTemplates = [];
  for (const [w, list] of Object.entries(aiExamples)) {
    list.forEach((ex, idx) => {
      for (const phrase of forbiddenPhrases) {
        if (ex.meaning.includes(phrase)) {
          foundTemplates.push({ word: w, index: idx + 1, phrase, meaning: ex.meaning });
        }
      }
    });
  }

  assert.strictEqual(foundTemplates.length, 0, 
    `Phát hiện ${foundTemplates.length} câu chứa khuôn mẫu: ${JSON.stringify(foundTemplates.slice(0, 3))}`);
});

// TEST 5: Kiểm tra các từ cụ thể người dùng đã hỏi: 运动场, 服务员, 她
it('5. Kiểm tra chất lượng câu ví dụ của các từ cụ thể: 运动场, 服务员, 她', () => {
  const yundongchang = aiExamples['运动场'];
  assert.ok(yundongchang, 'Phải có từ 运动场');
  assert.strictEqual(yundongchang[0].hanzi, '我们学校的运动场很大');
  assert.strictEqual(yundongchang[0].meaning, 'Sân vận động trường chúng tôi rất rộng.');
  assert.strictEqual(yundongchang[1].meaning.includes('chạy bộ và chơi bóng'), true);
  assert.strictEqual(yundongchang[2].meaning.includes('sân vận động điền kinh'), true);

  const fuwuyuan = aiExamples['服务员'];
  assert.ok(fuwuyuan, 'Phải có từ 服务员');
  assert.strictEqual(fuwuyuan[0].hanzi, '我叫服务员点餐');
  assert.strictEqual(fuwuyuan[0].meaning, 'Tôi gọi nhân viên phục vụ để gọi món.');
  assert.strictEqual(fuwuyuan[1].hanzi.includes('绿茶'), true);
  assert.strictEqual(fuwuyuan[2].meaning.includes('nhiệt tình chu đáo'), true);

  const ta = aiExamples['她'];
  assert.ok(ta, 'Phải có từ 她');
  assert.strictEqual(ta[0].hanzi, '她是我的大学中文老师。');
  assert.strictEqual(ta[0].meaning, 'Cô ấy là giáo viên tiếng Trung đại học của tôi.');
  assert.strictEqual(ta[1].hanzi.includes('慢跑'), true);
  assert.strictEqual(ta[2].meaning.includes('chăm chỉ trách nhiệm'), true);
});

console.log('\n================================================================');
console.log(`🏁 TỔNG KẾT TEST: ${passed} PASSED / ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
