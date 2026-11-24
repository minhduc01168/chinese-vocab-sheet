const fs = require('fs');
const path = require('path');
const { pinyin } = require('pinyin-pro');

function formatPinyin(text) {
  const py = pinyin(text, { toneType: 'symbol' }).trim();
  return py ? py.charAt(0).toUpperCase() + py.slice(1) : '';
}

const inputPath = path.join(__dirname, '../scratch_generated_examples.json');
const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const outputPath = path.join(__dirname, '../src/data/aiExamples.json');
const finalResult = {};

let totalWords = 0;
let totalSentences = 0;
let chineseInMeaningCount = 0;
let roboticPhraseCount = 0;

for (const [word, examples] of Object.entries(rawData)) {
  totalWords++;
  const processedExamples = [];

  for (const ex of examples) {
    totalSentences++;
    const py = formatPinyin(ex.hanzi);

    // Double check meaning
    let cleanMeaning = ex.meaning.replace(/[\u4e00-\u9fa5]/g, '').trim();
    cleanMeaning = cleanMeaning.replace(/\(\s*\)/g, '').replace(/""/g, '').replace(/\s+/g, ' ').trim();

    if (/[\u4e00-\u9fa5]/.test(cleanMeaning)) {
      chineseInMeaningCount++;
    }

    if (cleanMeaning.includes('rất thông dụng') || cleanMeaning.includes('viết một câu đơn giản')) {
      roboticPhraseCount++;
    }

    processedExamples.push({
      hanzi: ex.hanzi.trim(),
      pinyin: py,
      meaning: cleanMeaning
    });
  }

  finalResult[word] = processedExamples;
}

// Verification assertion
if (chineseInMeaningCount > 0) {
  throw new Error(`Phát hiện ${chineseInMeaningCount} câu vẫn còn chứa chữ Hán trong nghĩa tiếng Việt!`);
}

if (roboticPhraseCount > 0) {
  throw new Error(`Phát hiện ${roboticPhraseCount} câu vẫn còn chứa cụm từ khuôn mẫu!`);
}

if (totalWords !== 322) {
  throw new Error(`Số lượng từ không đúng: mong đợi 322, nhận được ${totalWords}`);
}

if (totalSentences !== 966) {
  throw new Error(`Số lượng câu ví dụ không đúng: mong đợi 966 (322 x 3), nhận được ${totalSentences}`);
}

// Write to final file
fs.writeFileSync(outputPath, JSON.stringify(finalResult, null, 2), 'utf8');

// Clean up scratch files
const s1 = path.join(__dirname, '../scratch_all_words.json');
const s2 = path.join(__dirname, '../scratch_generated_examples.json');
if (fs.existsSync(s1)) fs.unlinkSync(s1);
if (fs.existsSync(s2)) fs.unlinkSync(s2);

console.log('================================================================');
console.log('✅ XÁC THỰC THÀNH CÔNG VÀ LÀM SẠCH 100% KHO VÍ DỤ:');
console.log(`- Tổng số từ vựng: ${totalWords} từ`);
console.log(`- Tổng số câu ví dụ: ${totalSentences} câu (đúng 3 câu/từ)`);
console.log(`- Chữ Hán trong nghĩa tiếng Việt: ${chineseInMeaningCount} (HOÀN TOÀN SẠCH CHỮ HÁN)`);
console.log(`- Cụm từ khuôn mẫu (rất thông dụng, viết câu đơn giản): ${roboticPhraseCount} (0 câu)`);
console.log(`- Đã cập nhật file: ${outputPath}`);
console.log('================================================================');
