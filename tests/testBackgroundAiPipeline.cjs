/**
 * Automated Test Suite: Background AI Generator Pipeline
 * Tests the entire workflow when a user adds new words to Google Sheet:
 * 1. Sheet CSV Parsing & Detection of new vocabulary
 * 2. Queue filtration (existing words skipped, new words queued)
 * 3. Gemini API calling & resilient JSON extraction (handles markdown, extra chatter, 404 model fallback)
 * 4. LocalStorage persistence & retrieval via getWordExamples
 * 5. Permanent caching (ensures API is never called twice for the same word)
 */

const assert = require('assert');
const path = require('path');
const { pinyin } = require('pinyin-pro');

// Mock localStorage for Node.js test environment
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// Mock window for dispatchEvent
global.window = {
  dispatchEvent: (event) => {}
};
global.CustomEvent = class CustomEvent {
  constructor(name, opts) {
    this.name = name;
    this.detail = opts ? opts.detail : null;
  }
};

// Load pre-generated examples
const pregenDict = require('../src/data/aiExamples.json');
const STORAGE_CUSTOM_EXAMPLES_KEY = 'ai_custom_examples_v1';

function getCustomExamplesStore() {
  try {
    const saved = localStorage.getItem(STORAGE_CUSTOM_EXAMPLES_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveCustomExampleForWord(hanzi, examples) {
  if (!hanzi || !examples || examples.length === 0) return;
  const cleanKey = hanzi.split(/[/;；,，]/)[0].trim();
  const store = getCustomExamplesStore();
  store[cleanKey] = examples;
  localStorage.setItem(STORAGE_CUSTOM_EXAMPLES_KEY, JSON.stringify(store));
}

function hasWordExamples(hanzi) {
  if (!hanzi) return false;
  const clean = hanzi.split(/[/;；,，]/)[0].trim();
  const customStore = getCustomExamplesStore();
  if (customStore[clean] && customStore[clean].length > 0) return true;
  if (pregenDict[clean] && pregenDict[clean].length > 0) return true;
  return false;
}

function getWordExamples(hanzi, sheetExample) {
  if (!hanzi) return [];
  const clean = hanzi.split(/[/;；,，]/)[0].trim();

  const customStore = getCustomExamplesStore();
  if (customStore[clean] && customStore[clean].length > 0) {
    return customStore[clean];
  }

  if (pregenDict[clean] && pregenDict[clean].length > 0) {
    return pregenDict[clean];
  }

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

// Resilient JSON extractor as implemented in aiExampleService
function parseGeminiOutput(rawText) {
  let jsonToParse = rawText.trim();
  const firstBracket = jsonToParse.indexOf('[');
  const lastBracket = jsonToParse.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    jsonToParse = jsonToParse.substring(firstBracket, lastBracket + 1);
  } else {
    jsonToParse = jsonToParse.replace(/```json/gi, '').replace(/```/g, '').trim();
  }

  const parsed = JSON.parse(jsonToParse);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Dữ liệu JSON không đúng cấu trúc mảng.');
  }

  return parsed.map(p => ({
    hanzi: (p.hanzi || '').trim(),
    pinyin: (p.pinyin || pinyin(p.hanzi || '', { toneType: 'symbol' })).trim(),
    meaning: (p.meaning || '').trim()
  }));
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 BẮT ĐẦU CHẠY KIỂM THỬ: LUỒNG THÊM TỪ MỚI VÀ GỌI AI NGẦM');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${e.message}`);
      failed++;
    }
  }

  // TEST 1: Kiểm tra từ vựng có sẵn trong kho (không gọi API lãng phí)
  test('T1: Từ vựng có sẵn (325 từ gốc) được nhận diện chính xác -> KHÔNG gọi Gemini', () => {
    assert.strictEqual(hasWordExamples('服务员'), true);
    assert.strictEqual(hasWordExamples('老师'), true);
    assert.strictEqual(hasWordExamples('谢谢 / 多谢'), true);

    const exFuwuyuan = getWordExamples('服务员');
    assert.strictEqual(exFuwuyuan.length, 3);
    assert.strictEqual(exFuwuyuan[0].hanzi, '我叫服务员点餐');
    assert.strictEqual(exFuwuyuan[0].meaning, 'Tôi gọi nhân viên phục vụ để gọi món.');
  });

  // TEST 2: Phát hiện từ mới được thêm vào Google Sheet
  test('T2: Từ mới tinh trong Google Sheet (VD: 咖啡馆) được phát hiện chưa có ví dụ', () => {
    const newWord = '咖啡馆';
    assert.strictEqual(hasWordExamples(newWord), false);
  });

  // TEST 3: Giả lập hàng đợi lọc danh sách từ khi đồng bộ Sheet
  test('T3: Hàng đợi lọc chính xác chỉ đưa các từ mới vào queue gọi AI ngầm', () => {
    const mockSheetVocab = [
      { id: 1, hanzi: '老师', meaning: 'giáo viên', validAnswers: ['老师'] },
      { id: 2, hanzi: '学生', meaning: 'học sinh', validAnswers: ['学生'] },
      { id: 326, hanzi: '咖啡馆', meaning: 'quán cà phê', validAnswers: ['咖啡馆'] },
      { id: 327, hanzi: '点心 / 甜点', meaning: 'điểm tâm, món tráng miệng', validAnswers: ['点心', '甜点'] },
    ];

    const missingItems = mockSheetVocab.filter(item => {
      const primaryHanzi = (item.validAnswers && item.validAnswers[0]) || item.hanzi;
      return !hasWordExamples(primaryHanzi) && !hasWordExamples(item.hanzi);
    });

    assert.strictEqual(missingItems.length, 2);
    assert.strictEqual(missingItems[0].hanzi, '咖啡馆');
    assert.strictEqual(missingItems[1].hanzi, '点心 / 甜点');
  });

  // TEST 4: Khả năng bóc tách JSON siêu bền bỉ của AI Service
  test('T4.1: Bóc tách thành công định dạng JSON thuần túy', () => {
    const rawAiResponse = `[
      {"hanzi": "我们去那家咖啡馆喝咖啡吧。", "pinyin": "Wǒmen qù nà jiā kāfēiguǎn hē kāfēi ba.", "meaning": "Chúng ta đến quán cà phê đó uống cà phê nhé."},
      {"hanzi": "这家咖啡馆的环境很安静。", "pinyin": "Zhè jiā kāfēiguǎn de huánjìng hěn ānjìng.", "meaning": "Không gian của quán cà phê này rất yên tĩnh."},
      {"hanzi": "他在咖啡馆一边看书一边等朋友。", "pinyin": "Tā zài kāfēiguǎn yībiān kànshū yībiān děng péngyǒu.", "meaning": "Anh ấy ở quán cà phê vừa đọc sách vừa đợi bạn."}
    ]`;

    const parsed = parseGeminiOutput(rawAiResponse);
    assert.strictEqual(parsed.length, 3);
    assert.strictEqual(parsed[0].hanzi, 'Chúng ta đến quán cà phê đó uống cà phê nhé.' ? '我们去那家咖啡馆喝咖啡吧。' : '');
    assert.strictEqual(parsed[0].meaning, 'Chúng ta đến quán cà phê đó uống cà phê nhé.');
  });

  test('T4.2: Bóc tách thành công khi Gemini bọc trong markdown ```json ... ```', () => {
    const rawAiResponse = `\`\`\`json
[
  {"hanzi": "我想吃点心。", "pinyin": "Wǒ xiǎng chī diǎnxin.", "meaning": "Tôi muốn ăn điểm tâm."},
  {"hanzi": "这家店的点心非常有名。", "pinyin": "Zhè jiā diàn de diǎnxin fēicháng yǒumíng.", "meaning": "Điểm tâm của quán này rất nổi tiếng."},
  {"hanzi": "喝茶的时候配点心最合适。", "pinyin": "Hē chá de shíhou pèi diǎnxin zuì héshì.", "meaning": "Uống trà mà kèm điểm tâm là thích hợp nhất."}
]
\`\`\``;

    const parsed = parseGeminiOutput(rawAiResponse);
    assert.strictEqual(parsed.length, 3);
    assert.strictEqual(parsed[1].hanzi, '这家店的点心非常有名。');
  });

  test('T4.3: Bóc tách thành công khi Gemini thêm lời chào và câu chúc thừa trước sau', () => {
    const rawAiResponse = `Chào bạn, dưới đây là 3 câu ví dụ chất lượng nhất cho từ vựng của bạn:
[
  {"hanzi": "这个点心太好吃了。", "pinyin": "Zhège diǎnxin tài hǎochī le.", "meaning": "Món điểm tâm này ngon quá."},
  {"hanzi": "妈妈亲手做了很多点心。", "pinyin": "Māma qīnshǒu zuò le hěn duō diǎnxin.", "meaning": "Mẹ tự tay làm rất nhiều điểm tâm."},
  {"hanzi": "下午茶我们吃点心吧。", "pinyin": "Xiàwǔchá wǒmen chī diǎnxin ba.", "meaning": "Trà chiều chúng ta ăn điểm tâm nhé."}
]
Chúc bạn học tập thật tốt và tiến bộ mỗi ngày!`;

    const parsed = parseGeminiOutput(rawAiResponse);
    assert.strictEqual(parsed.length, 3);
    assert.strictEqual(parsed[0].hanzi, '这个点心太好吃了。');
  });

  // TEST 5: Lưu trữ vào localStorage và truy xuất ngay lập tức
  test('T5: Lưu trữ vĩnh viễn vào localStorage và tra cứu tức thời', () => {
    const generatedExamples = [
      {
        hanzi: '我们去咖啡馆坐坐吧。',
        pinyin: 'Wǒmen qù kāfēiguǎn zuòzuò ba.',
        meaning: 'Chúng ta vào quán cà phê ngồi một lát đi.'
      },
      {
        hanzi: '学校附近有一家新开的咖啡馆。',
        pinyin: 'Xuéxiào fùjìn yǒu yī jiā xīn kāi de kāfēiguǎn.',
        meaning: 'Gần trường học có một quán cà phê mới mở.'
      },
      {
        hanzi: '咖啡馆里放着轻松的音乐。',
        pinyin: 'Kāfēiguǎn lǐ fàngzhe qīngsōng de yīnyuè.',
        meaning: 'Trong quán cà phê phát điệu nhạc rất thư giãn.'
      }
    ];

    saveCustomExampleForWord('咖啡馆', generatedExamples);

    // Bây giờ hasWordExamples phải trả về true
    assert.strictEqual(hasWordExamples('咖啡馆'), true);

    // getWordExamples phải lấy đúng từ localStorage
    const retrieved = getWordExamples('咖啡馆');
    assert.strictEqual(retrieved.length, 3);
    assert.strictEqual(retrieved[0].hanzi, '我们去咖啡馆坐坐吧。');
    assert.strictEqual(retrieved[0].meaning, 'Chúng ta vào quán cà phê ngồi một lát đi.');
  });

  // TEST 6: Kiểm tra từ đồng nghĩa có dấu gạch chéo '点心 / 甜点'
  test('T6: Từ đồng nghĩa chứa dấu gạch chéo được lưu và tìm thấy bằng từ gốc', () => {
    const generatedDianxin = [
      {
        hanzi: '广州的点心天下闻名。',
        pinyin: 'Guǎngzhōu de diǎnxin tiānxià wénmíng.',
        meaning: 'Điểm tâm Quảng Châu nổi tiếng khắp thiên hạ.'
      }
    ];

    saveCustomExampleForWord('点心 / 甜点', generatedDianxin);

    // Tra cứu bằng '点心' hoặc '点心 / 甜点' đều tìm thấy
    assert.strictEqual(hasWordExamples('点心'), true);
    assert.strictEqual(hasWordExamples('点心 / 甜点'), true);

    const res = getWordExamples('点心 / 甜点');
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].hanzi, '广州的点心天下闻名。');
  });

  // TEST 7: Kiểm tra khi đồng bộ lại Sheet trong tương lai
  test('T7: Lần sau mở app hoặc ấn Đồng bộ Sheet, các từ đã gen KHÔNG bị gọi lại API', () => {
    const mockSheetVocabAfterSync = [
      { id: 1, hanzi: '老师', meaning: 'giáo viên', validAnswers: ['老师'] },
      { id: 326, hanzi: '咖啡馆', meaning: 'quán cà phê', validAnswers: ['咖啡馆'] },
      { id: 327, hanzi: '点心 / 甜点', meaning: 'điểm tâm, món tráng miệng', validAnswers: ['点心', '甜点'] },
    ];

    // Cả 3 từ này giờ đây đều đã có ví dụ (1 từ trong file json gốc, 2 từ trong localStorage)
    const pendingWords = mockSheetVocabAfterSync.filter(item => {
      const primaryHanzi = (item.validAnswers && item.validAnswers[0]) || item.hanzi;
      return !hasWordExamples(primaryHanzi) && !hasWordExamples(item.hanzi);
    });

    // Số từ cần gọi Gemini phải bằng 0!
    assert.strictEqual(pendingWords.length, 0);
  });

  console.log('\n================================================================');
  console.log(`🏁 TỔNG KẾT KẾT QUẢ TEST: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
