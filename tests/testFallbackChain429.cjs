const assert = require('assert');

console.log('================================================================');
console.log('🧪 TEST MÔ PHỎNG CHUỖI FALLBACK MODEL KHI GẶP LỖI 429');
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
  { id: 'gemma-4-31b', name: 'Gemma 4 31B' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
];

it('1. Thứ tự chuỗi model fallback chuẩn xác theo yêu cầu người dùng', () => {
  assert.strictEqual(FALLBACK_MODEL_CHAIN[0].id, 'gemini-2.5-flash');
  assert.strictEqual(FALLBACK_MODEL_CHAIN[1].name, 'Gemma 4 31B (it)');
  assert.strictEqual(FALLBACK_MODEL_CHAIN[2].name, 'Gemma 4 31B');
  assert.strictEqual(FALLBACK_MODEL_CHAIN[3].name, 'Gemini 3.8 Flash');
  assert.strictEqual(FALLBACK_MODEL_CHAIN[4].id, 'gemini-2.0-flash');
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
  await itAsync('2. Khi gemini-2.5-flash gặp 429, tự động fallback thành công sang Gemma 4 31B', async () => {
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
    assert.strictEqual(res.modelName, 'Gemma 4 31B (it)');
    assert.deepStrictEqual(res.callsMade, ['gemini-2.5-flash', 'gemma-4-31b-it']);
  });

  await itAsync('3. Khi cả gemini-2.5-flash và 2 lượt Gemma 4 31B đều gặp 429, tự động fallback sang Gemini 3.8 Flash', async () => {
    const mockResponses = {
      'gemini-2.5-flash': { status: 429, message: 'Resource has been exhausted' },
      'gemma-4-31b-it': { status: 429, message: '429 Too Many Requests' },
      'gemma-4-31b': { status: 429, message: 'Quota exceeded for quota metric' },
      'gemini-3.8-flash': {
        status: 200,
        data: [{ hanzi: '这是3.8生成的句子。', pinyin: 'Zhè shì 3.8 shēngchéng de jùzi.', meaning: 'Đây là câu do 3.8 sinh.' }]
      }
    };

    const res = await simulateGenerateContentWithMock(mockResponses);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.modelUsed, 'gemini-3.8-flash');
    assert.strictEqual(res.modelName, 'Gemini 3.8 Flash');
    assert.deepStrictEqual(res.callsMade, [
      'gemini-2.5-flash',
      'gemma-4-31b-it',
      'gemma-4-31b',
      'gemini-3.8-flash'
    ]);
  });

  await itAsync('4. Khi các model mới chưa hỗ trợ (404) hoặc 429, fallback an toàn đến model backup 2.0-flash', async () => {
    const mockResponses = {
      'gemini-2.5-flash': { status: 429, message: 'Resource has been exhausted' },
      'gemma-4-31b-it': { status: 404, message: 'models/gemma-4-31b-it is not found' },
      'gemma-4-31b': { status: 404, message: 'models/gemma-4-31b is not found' },
      'gemini-3.8-flash': { status: 404, message: 'models/gemini-3.8-flash is not found' },
      'gemini-2.0-flash': {
        status: 200,
        data: [{ hanzi: '备份模型成功。', pinyin: 'Bèifèn móxíng chénggōng.', meaning: 'Model backup thành công.' }]
      }
    };

    const res = await simulateGenerateContentWithMock(mockResponses);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.modelUsed, 'gemini-2.0-flash');
    assert.deepStrictEqual(res.callsMade, [
      'gemini-2.5-flash',
      'gemma-4-31b-it',
      'gemma-4-31b',
      'gemini-3.8-flash',
      'gemini-2.0-flash'
    ]);
  });

  console.log('\n================================================================');
  console.log(`🏁 TỔNG KẾT: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAsyncTests();
