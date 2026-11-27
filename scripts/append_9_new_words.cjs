const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { pinyin } = require('pinyin-pro');

const aiExamplesPath = path.join(__dirname, '../src/data/aiExamples.json');
const defaultVocabPath = path.join(__dirname, '../src/data/defaultVocab.json');
const aiExamples = JSON.parse(fs.readFileSync(aiExamplesPath, 'utf8'));

const new9Words = {
  "穿": [
    {
      "hanzi": "今天天气很冷，你要多穿一点衣服。",
      "pinyin": "Jīntiān tiānqì hěn lěng, nǐ yào duō chuān yìdiǎn yīfu.",
      "meaning": "Hôm nay thời tiết rất lạnh, bạn nên mặc thêm nhiều áo vào nhé."
    },
    {
      "hanzi": "去参加面试的时候，他穿了一套整齐的西装。",
      "pinyin": "Qù cānjiā miànshì de shíhou, tā chuān le yí tào zhěngqí de xīzhuāng.",
      "meaning": "Khi đi phỏng vấn, anh ấy đã mặc một bộ âu phục chỉnh tề."
    },
    {
      "hanzi": "这双运动鞋穿起来特别舒服，很适合慢跑。",
      "pinyin": "Zhè shuāng yùndòngxié chuān qǐlai tèbié shūfu, hěn shìhé mànpǎo.",
      "meaning": "Đôi giày thể thao này đi vào đặc biệt thoải mái, rất thích hợp để chạy bộ."
    }
  ],
  "得": [
    {
      "hanzi": "今天工作很忙，大家都忙得不可开交。",
      "pinyin": "Jīntiān gōngzuò hěn máng, dàjiā dōu máng de bù kě kāijiāo.",
      "meaning": "Hôm nay công việc rất bận, mọi người đều bận rộn không ngơi tay."
    },
    {
      "hanzi": "他汉语学得很好，发音也十分标准。",
      "pinyin": "Tā hànyǔ xué de hěn hǎo, fāyīn yě shífēn biāozhǔn.",
      "meaning": "Bạn ấy học tiếng Trung rất giỏi, phát âm cũng vô cùng chuẩn xác."
    },
    {
      "hanzi": "时间过得真快，转眼间我们已经认识三年了。",
      "pinyin": "Shíjiān guò de zhēn kuài, zhuǎnyǎnjiān wǒmen yǐjīng rènshi sān nián le.",
      "meaning": "Thời gian trôi qua thật nhanh, chớp mắt một cái chúng ta đã quen nhau được ba năm rồi."
    }
  ],
  "温柔": [
    {
      "hanzi": "她说话的声音总是那么温柔动听。",
      "pinyin": "Tā shuōhuà de shēngyīn zǒngshì nàme wēnróu dòngtīng.",
      "meaning": "Giọng nói của cô ấy lúc nào cũng dịu dàng và êm tai như vậy."
    },
    {
      "hanzi": "他有一位性格温和、体贴温柔的妻子。",
      "pinyin": "Tā yǒu yí wèi xìnggé wēnhé, tǐtiē wēnróu de qīzi.",
      "meaning": "Anh ấy có một người vợ tính tình hiền hòa và dịu dàng chu đáo."
    },
    {
      "hanzi": "对待年幼的孩子，老师总是充满了耐心和温柔。",
      "pinyin": "Duìdài niányòu de háizi, lǎoshī zǒngshì chōngmǎn le nàixīn hé wēnróu.",
      "meaning": "Đối với những đứa trẻ nhỏ, cô giáo lúc nào cũng tràn đầy kiên nhẫn và sự dịu dàng."
    }
  ],
  "大概": [
    {
      "hanzi": "从这里坐地铁到机场大概需要四十分钟。",
      "pinyin": "Cóng zhèlǐ zuò dìtiě dào jīchǎng dàgài xūyào sìshí fēnzhōng.",
      "meaning": "Từ đây đi tàu điện ngầm ra sân bay mất khoảng chừng bốn mươi phút."
    },
    {
      "hanzi": "外面突然刮起了大风，大概是要下暴雨了。",
      "pinyin": "Wàimiàn tūrán guā qǐ le dà fēng, dàgài shì yào xià bàoyǔ le.",
      "meaning": "Bên ngoài bỗng nhiên nổi gió to, có lẽ là sắp mưa to bão lớn rồi."
    },
    {
      "hanzi": "关于明天的行程安排，我已经了解了个大概。",
      "pinyin": "Guānyú míngtiān de xíngchéng ānpái, wǒ yǐjīng liǎojiě le gè dàgài.",
      "meaning": "Về lịch trình sắp xếp cho ngày mai, tôi đã nắm được đại khái rồi."
    }
  ],
  "你有空吗？": [
    {
      "hanzi": "今天晚上你有空吗？我们一起去吃火锅吧。",
      "pinyin": "Jīntiān wǎnshang nǐ yǒu kòng ma? Wǒmen yìqǐ qù chī huǒguō ba.",
      "meaning": "Tối nay bạn có rảnh không? Chúng mình cùng nhau đi ăn lẩu nhé."
    },
    {
      "hanzi": "请问经理，您现在有空吗？我有一份文件需要您签字。",
      "pinyin": "Qǐngwèn jīnglǐ, nín xiànzài yǒu kòng ma? Wǒ yǒu yí fèn wénjiàn xūyào nín qiānzì.",
      "meaning": "Xin hỏi giám đốc, bây giờ ngài có rảnh không ạ? Tôi có một tập tài liệu cần ngài ký tên."
    },
    {
      "hanzi": "周末如果有空的话，欢迎随时来我家做客。",
      "pinyin": "Zhōumò rúguǒ yǒu kòng de huà, huānyíng suíshí lái wǒ jiā zuòkè.",
      "meaning": "Cuối tuần nếu bạn rảnh thì hoan nghênh bạn bất cứ lúc nào ghé nhà tôi chơi."
    }
  ],
  "你有空吗": [
    {
      "hanzi": "今天晚上你有空吗？我们一起去吃火锅吧。",
      "pinyin": "Jīntiān wǎnshang nǐ yǒu kòng ma? Wǒmen yìqǐ qù chī huǒguō ba.",
      "meaning": "Tối nay bạn có rảnh không? Chúng mình cùng nhau đi ăn lẩu nhé."
    },
    {
      "hanzi": "请问经理，您现在有空吗？我有一份文件需要您签字。",
      "pinyin": "Qǐngwèn jīnglǐ, nín xiànzài yǒu kòng ma? Wǒ yǒu yí fèn wénjiàn xūyào nín qiānzì.",
      "meaning": "Xin hỏi giám đốc, bây giờ ngài có rảnh không ạ? Tôi có một tập tài liệu cần ngài ký tên."
    },
    {
      "hanzi": "周末如果有空的话，欢迎随时来我家做客。",
      "pinyin": "Zhōumò rúguǒ yǒu kòng de huà, huānyíng suíshí lái wǒ jiā zuòkè.",
      "meaning": "Cuối tuần nếu bạn rảnh thì hoan nghênh bạn bất cứ lúc nào ghé nhà tôi chơi."
    }
  ],
  "流利": [
    {
      "hanzi": "经过多年的刻苦练习，他能说一口流利的汉语。",
      "pinyin": "Jīngguò duō nián de kèkǔ liànxí, tā néng shuō yì kǒu liúlì de hànyǔ.",
      "meaning": "Trải qua nhiều năm khổ luyện, anh ấy có thể nói một thứ tiếng Trung trôi chảy."
    },
    {
      "hanzi": "这位翻译员在国际会议上的翻译十分流利准确。",
      "pinyin": "Zhè wèi fānyìyuán zài guójì huìyì shang de fānyì shífēn liúlì zhǔnquè.",
      "meaning": "Người phiên dịch viên này dịch tại hội nghị quốc tế vô cùng lưu loát và chuẩn xác."
    },
    {
      "hanzi": "要想把一门外语说得流利，需要经常开口练习。",
      "pinyin": "Yào xiǎng bǎ yì mén wàiyǔ shuō de liúlì, xūyào chīngcháng kāikǒu liànxí.",
      "meaning": "Muốn nói trôi chảy một ngoại ngữ, cần phải thường xuyên mở miệng luyện tập."
    }
  ],
  "早起": [
    {
      "hanzi": "养成早起的好习惯，会让一整天都精力充沛。",
      "pinyin": "Yǎngchéng zǎoqǐ de hǎo xíguàn, huì ràng yì zhěng tiān dōu jīnglì chōngpèi.",
      "meaning": "Rèn luyện thói quen tốt dậy sớm sẽ giúp cả ngày tràn đầy năng lượng."
    },
    {
      "hanzi": "明天我们要赶早班飞机，所以必须早起。",
      "pinyin": "Míngtiān wǒmen yào gǎn zǎobān fēijī, suǒyǐ bìxū zǎoqǐ.",
      "meaning": "Ngày mai chúng ta phải đón chuyến bay sớm, cho nên nhất định phải dậy sớm."
    },
    {
      "hanzi": "爷爷每天早起去公园晨练，身体非常健康。",
      "pinyin": "Yéye měitiān zǎoqǐ qù gōngyuán chénliàn, shēntǐ fēicháng jiànkāng.",
      "meaning": "Ông nội mỗi ngày đều dậy sớm ra công viên tập thể dục buổi sáng, sức khỏe rất dẻo dai."
    }
  ],
  "不必": [
    {
      "hanzi": "这只是一件小事，你完全不必放在心上。",
      "pinyin": "Zhè zhǐshì yí jiàn xiǎoshì, nǐ wánquán búbì fàng zài xīn shang.",
      "meaning": "Đây chỉ là một chuyện nhỏ thôi, bạn hoàn toàn không cần phải để bụng đâu."
    },
    {
      "hanzi": "车票我已经帮你买好了，你就不必再去车站了。",
      "pinyin": "Chēpiào wǒ yǐjīng bāng nǐ mǎi hǎo le, nǐ jiù búbì zài qù chēzhàn le.",
      "meaning": "Vé xe tôi đã mua giúp bạn xong rồi, bạn không cần phải đích thân ra bến xe nữa."
    },
    {
      "hanzi": "大家都是多年的好朋友，见面不必这么客气。",
      "pinyin": "Dàjiā dōu shì duō nián de hǎo péngyou, jiànmiàn búbì zhème kèqi.",
      "meaning": "Mọi người đều là bạn bè tốt nhiều năm rồi, gặp nhau không cần phải khách sáo như vậy."
    }
  ],
  "度": [
    {
      "hanzi": "今天夏天的最高气温达到了三十八度。",
      "pinyin": "Jīntiān xiàtiān de zuì gāo qìwēn dádào le sānshíbā dù.",
      "meaning": "Nhiệt độ cao nhất của mùa hè hôm nay đã lên tới ba mươi tám độ."
    },
    {
      "hanzi": "做事情要有度，切忌走极端。",
      "pinyin": "Zuò shìqing yào yǒu dù, qièjì zǒu jíduān.",
      "meaning": "Làm việc gì cũng cần phải có chừng mực, tránh đi đến cực đoan."
    },
    {
      "hanzi": "经过多次测试，这款新材料的耐热度非常出色。",
      "pinyin": "Jīngguò duō cì cèshì, zhè kuǎn xīn cáiliào de nàirèdù fēicháng chūsè.",
      "meaning": "Sau nhiều lần thử nghiệm, độ chịu nhiệt của loại vật liệu mới này vô cùng xuất sắc."
    }
  ]
};

// Also map corrupt character key if present in sheet: 回 -> 回复
if (aiExamples["回复"]) {
  new9Words["回"] = aiExamples["回复"];
}

// 1. Kiểm tra 100% không có chữ Hán trong phần dịch tiếng Việt
const chineseRegex = /[\u4e00-\u9fa5]/;
for (const [w, list] of Object.entries(new9Words)) {
  for (const ex of list) {
    if (chineseRegex.test(ex.meaning)) {
      console.error(`LỖI: Phát hiện chữ Hán trong phần dịch của từ "${w}": ${ex.meaning}`);
      process.exit(1);
    }
  }
}

// 2. Gộp vào aiExamples.json
for (const [w, list] of Object.entries(new9Words)) {
  aiExamples[w] = list;
}
fs.writeFileSync(aiExamplesPath, JSON.stringify(aiExamples, null, 2), 'utf8');
console.log(`Đã cập nhật aiExamples.json thành công! Tổng số từ hiện tại: ${Object.keys(aiExamples).length}`);

// 3. Cập nhật defaultVocab.json từ dữ liệu Google Sheet mới nhất
const sheetData = JSON.parse(fs.readFileSync(path.join(__dirname, 'fetched_sheet_latest.json'), 'utf8'));
const rows = sheetData.rows;

function extractValidAnswers(hanzi) {
  const parts = hanzi.split(/[\/\n;；,，]+/).map(p => p.trim()).filter(Boolean);
  const res = [];
  for (const part of parts) {
    const cleaned = part.replace(/[（(].*?[）)]/g, '').trim();
    if (cleaned && !res.includes(cleaned)) res.push(cleaned);
    const match = part.match(/^(.*?)[（(](.*?)[）)]$/);
    if (match) {
      const base = match[1].trim();
      const paren = match[2].trim();
      if (base && !res.includes(base)) res.push(base);
      if (paren && !res.includes(paren)) res.push(paren);
      const combined = base + paren;
      if (combined && !res.includes(combined)) res.push(combined);
    }
  }
  return res.length > 0 ? res : (hanzi.trim() ? [hanzi.trim()] : []);
}

const defaultVocabItems = [];
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  let rawHanzi = (row[1] || '').trim();
  const rawMeaning = (row[4] || '').trim();
  if (!rawHanzi || !rawMeaning) continue;

  // Chuẩn hóa nếu có lỗi font
  if (rawHanzi.includes('赛') && !rawHanzi.includes('比')) {
    rawHanzi = '比赛';
  }
  if (rawHanzi.includes('回') && rawHanzi.includes('')) {
    rawHanzi = '回复';
  }

  const validAnswers = extractValidAnswers(rawHanzi);
  if (validAnswers.length === 0) continue;

  let pinyinVal = (row[2] || '').trim().replace(/[\[\]]/g, '');
  if (!pinyinVal) {
    pinyinVal = pinyin(validAnswers[0], { toneType: 'symbol' }).trim();
  }

  const sinoVietnamese = (row[3] || '').trim() || undefined;
  const example = (row[5] || '').trim() || undefined;

  defaultVocabItems.push({
    id: `default_${i}`,
    originalIndex: i,
    hanzi: rawHanzi,
    validAnswers,
    meaning: rawMeaning,
    pinyin: pinyinVal,
    sinoVietnamese,
    example
  });
}

fs.writeFileSync(defaultVocabPath, JSON.stringify(defaultVocabItems, null, 2), 'utf8');
console.log(`Đã cập nhật defaultVocab.json thành công! Tổng số từ vựng: ${defaultVocabItems.length}`);
