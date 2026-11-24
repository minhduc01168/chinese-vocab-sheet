const assert = require('assert');

console.log('================================================================');
console.log('🧪 TEST MÔ PHỎNG CHUỖI 7 MODEL FALLBACK KHI GẶP LỖI 429');
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

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Lỗi: ${err.message}`);
    failed++;
  }
}

const FALLBACK_MODEL_CHAIN = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemma-4-31b-it', name: 'Gemma 4 31B (it)' },
  { id: 'gemma-4-26b-a4b-it', name: 'Gemma 4 26B (a4b-it)' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite' },
];

it('1. Thứ tự chuỗi 7 model fallback chuẩn xác theo yêu cầu người dùng', () => {
  assert.strictEqual(FALLBACK_MODEL_CHAIN.length, 7);
  assert.strictEqual(FALLBACK_MODEL_CHAIN[0].id, 'gemini-2.5-flash');
  assert.strictEqual(FALLBACK_MODEL_CHAIN[1].id, 'gemma-4-31b-it');
  assert.strictEqual(FALLBACK_MODEL_CHAIN[2].id, 'gemma-4-26b-a4b-it');
  assert.strictEqual(FALLBACK_MODEL_CHAIN[3].id, 'gemini-3.8-flash');
  assert.strictEqual(FALLBACK_MODEL_CHAIN[4].id, 'gemini-3-flash-preview');
  assert.strictEqual(FALLBACK_MODEL_CHAIN[5].id, 'gemini-3.1-flash-lite');
  assert.strictEqual(FALLBACK_MODEL_CHAIN[6].id, 'gemini-3.5-flash-lite');

  // Đảm bảo không chứa 2 model cũ (gemini-2.0-flash và gemini-1.5-flash)
  const hasOldModels = FALLBACK_MODEL_CHAIN.some(m => m.id === 'gemini-2.0-flash' || m.id === 'gemini-1.5-flash');
  assert.strictEqual(hasOldModels, false, 'Đã loại bỏ hoàn toàn gemini-2.0-flash và gemini-1.5-flash');
});

// Mô phỏng logic generateContent với hàm mockFetch
async function simulateGenerateContentWithMock(mockResponses) {
  const calls = [];
  let lastErrorMsg = '';

  for (let i = 0; i < FALLBACK_MODEL_CHAIN.length; i++) {
    const modelConfig = FALLBACK_MODEL_CHAIN[i];
    const isLastModel = i === FALLBACK_MODEL_CHAIN.length - 1;
    calls.push(modelConfig.id);

    const mockRes = mockResponses[modelConfig.id] || { status: 500, message: 'Server error' };

    try {
      if (mockRes.status !== 200) {
        const status = mockRes.status;
        const msg = mockRes.message;

        const isRateLimited = status === 429 || 
          msg.includes('429') || 
          msg.toLowerCase().includes('quota') || 
          msg.toLowerCase().includes('resource has been exhausted') || 
          msg.toLowerCase().includes('rate limit');

        const isModelNotFound = status === 404 || 
          msg.toLowerCase().includes('not found') || 
          msg.toLowerCase().includes('unsupported model');

        const isOverloaded = status === 503 || status === 500 || msg.toLowerCase().includes('overloaded');

        if (isRateLimited || isModelNotFound || isOverloaded) {
          lastErrorMsg = `${modelConfig.name} (${status}): ${msg}`;
          continue; // Fallback sang model kế tiếp
        }

        throw new Error(msg);
      }

      // Giả lập thành công
      return {
        success: true,
        modelUsed: modelConfig.id,
        modelName: modelConfig.name,
        callsMade: calls,
        data: mockRes.data
      };
    } catch (err) {
      if (isLastModel) throw err;
      continue;
    }
  }

  throw new Error(`Tất cả model đều thất bại (${lastErrorMsg})`);
}

async function runAsyncTests() {
  await itAsync('2. Khi gemini-2.5-flash gặp 429, tự động fallback sang gemma-4-31b-it', async () => {
    const mockResponses = {
      'gemini-2.5-flash': { status: 429, message: 'Resource has been exhausted (rate limit 15 RPM)' },
      'gemma-4-31b-it': {
        status: 200,
        data: [{ hanzi: '这是测试句。', pinyin: 'Zhè shì cèshì jù.', meaning: 'Đây là câu thử nghiệm.' }]
      }
    };

    const res = await simulateGenerateContentWithMock(mockResponses);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.modelUsed, 'gemma-4-31b-it');
    assert.deepStrictEqual(res.callsMade, ['gemini-2.5-flash', 'gemma-4-31b-it']);
  });

  await itAsync('3. Khi chuỗi gặp lỗi 429 tuần tự: chuyển tiếp qua gemma-4-31b-it -> gemma-4-26b-a4b-it -> gemini-3.8-flash', async () => {
    const mockResponses = {
      'gemini-2.5-flash': { status: 429, message: '429 Rate Limit' },
      'gemma-4-31b-it': { status: 429, message: '429 Too Many Requests' },
      'gemma-4-26b-a4b-it': { status: 429, message: 'Quota exceeded' },
      'gemini-3.8-flash': {
        status: 200,
        data: [{ hanzi: '这是3.8生成的句子。', pinyin: 'Zhè shì 3.8 shēngchéng de jùzi.', meaning: 'Đây là câu do 3.8 sinh.' }]
      }
    };

    const res = await simulateGenerateContentWithMock(mockResponses);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.modelUsed, 'gemini-3.8-flash');
    assert.deepStrictEqual(res.callsMade, [
      'gemini-2.5-flash',
      'gemma-4-31b-it',
      'gemma-4-26b-a4b-it',
      'gemini-3.8-flash'
    ]);
  });

  await itAsync('4. Khi toàn bộ các model trước đều lỗi 429/503, fallback tới gemini-3.5-flash-lite', async () => {
    const mockResponses = {
      'gemini-2.5-flash': { status: 429, message: '429' },
      'gemma-4-31b-it': { status: 503, message: 'High demand' },
      'gemma-4-26b-a4b-it': { status: 503, message: 'High demand' },
      'gemini-3.8-flash': { status: 503, message: 'High demand' },
      'gemini-3-flash-preview': { status: 503, message: 'High demand' },
      'gemini-3.1-flash-lite': { status: 503, message: 'High demand' },
      'gemini-3.5-flash-lite': {
        status: 200,
        data: [{ hanzi: '最终轻量模型成功。', pinyin: 'Zuìzhōng qīngliàng móxíng chénggōng.', meaning: 'Model nhẹ cuối cùng thành công.' }]
      }
    };

    const res = await simulateGenerateContentWithMock(mockResponses);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.modelUsed, 'gemini-3.5-flash-lite');
    assert.strictEqual(res.callsMade.length, 7);
  });

  console.log('\n================================================================');
  console.log(`🏁 TỔNG KẾT: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAsyncTests();
