const fs = require('fs');
const path = require('path');
const { pinyin } = require('pinyin-pro');

const defaultVocab = require('../src/data/defaultVocab.json');

function formatPinyin(text) {
  if (!text) return '';
  const py = pinyin(text, { toneType: 'symbol' }).trim();
  return py.charAt(0).toUpperCase() + py.slice(1);
}

// Master example sentences bank for Chinese learners
const customBank = {
  "我": [
    { hanzi: "我是越南人，我正在学中文。", meaning: "Tôi là người Việt Nam, tôi đang học tiếng Trung." },
    { hanzi: "我很喜欢喝中国茶。", meaning: "Tôi rất thích uống trà Trung Quốc." },
    { hanzi: "明天我和朋友去图书馆学习。", meaning: "Ngày mai tôi và bạn đi thư viện học tập." }
  ],
  "你": [
    { hanzi: "你好，很高兴认识你！", meaning: "Xin chào, rất vui được làm quen với bạn!" },
    { hanzi: "你想喝咖啡还是茶？", meaning: "Bạn muốn uống cà phê hay trà?" },
    { hanzi: "你今天有时间跟我去超市吗？", meaning: "Hôm nay bạn có thời gian cùng tôi đi siêu thị không?" }
  ],
  "我们": [
    { hanzi: "我们能讲一点儿中文。", meaning: "Chúng tôi có thể nói một chút tiếng Trung." },
    { hanzi: "今天晚上我们一起去吃火锅吧。", meaning: "Tối nay chúng ta cùng đi ăn lẩu nhé." },
    { hanzi: "我们班有二十个学生。", meaning: "Lớp chúng tôi có 20 học sinh." }
  ],
  "你们": [
    { hanzi: "你们是哪国人？", meaning: "Các bạn là người nước nào?" },
    { hanzi: "祝你们周末愉快！", meaning: "Chúc các bạn cuối tuần vui vẻ!" },
    { hanzi: "你们明天几点开始上课？", meaning: "Ngày mai mấy giờ các bạn bắt đầu vào học?" }
  ],
  "好": [
    { hanzi: "今天天气很好，很舒服。", meaning: "Thời tiết hôm nay rất tốt, rất dễ chịu." },
    { hanzi: "这家餐厅的菜非常好吃。", meaning: "Món ăn ở nhà hàng này rất ngon." },
    { hanzi: "好，我们明天早上八点见！", meaning: "Được, sáng mai 8 giờ chúng ta gặp nhau nhé!" }
  ],
  "您": [
    { hanzi: "您好，请问您贵姓？", meaning: "Chào ngài, xin hỏi ngài họ gì ạ?" },
    { hanzi: "老师，您辛苦了！", meaning: "Thưa thầy cô, thầy cô vất vả rồi ạ!" },
    { hanzi: "请您在这儿坐一下。", meaning: "Mời ngài ngồi ở đây một lát." }
  ],
  "对不起": [
    { hanzi: "对不起，我今天来晚了。", meaning: "Xin lỗi, hôm nay tôi đến muộn." },
    { hanzi: "对不起，我不是故意的。", meaning: "Xin lỗi, tôi không cố ý đâu." },
    { hanzi: "真对不起，打扰您休息了。", meaning: "Thật xin lỗi, đã làm phiền ngài nghỉ ngơi." }
  ],
  "没关系": [
    { hanzi: "没关系，下次注意就好了。", meaning: "Không sao đâu, lần sau chú ý là được rồi." },
    { hanzi: "没关系，我们还有很多时间。", meaning: "Không sao, chúng ta vẫn còn nhiều thời gian." },
    { hanzi: "不用道歉，真的没关系。", meaning: "Không cần xin lỗi đâu, thực sự không sao mà." }
  ],
  "猫": [
    { hanzi: "我家有一只白色的小猫。", meaning: "Nhà tôi có một chú mèo con màu trắng." },
    { hanzi: "小猫正在沙发上睡觉呢。", meaning: "Chú mèo con đang ngủ trên ghế sofa kìa." },
    { hanzi: "我妹妹特别喜欢小猫和小狗。", meaning: "Em gái tôi đặc biệt thích mèo con và cún con." }
  ],
  "鱼": [
    { hanzi: "猫非常喜欢吃新鲜的鱼。", meaning: "Mèo rất thích ăn cá tươi." },
    { hanzi: "今天晚饭妈妈做了红烧鱼。", meaning: "Bữa tối nay mẹ đã làm món cá kho tàu." },
    { hanzi: "多吃鱼对身体健康很有好处。", meaning: "Ăn nhiều cá rất có lợi cho sức khỏe." }
  ],
  "咖啡": [
    { hanzi: "你想喝冰咖啡还是热咖啡？", meaning: "Bạn muốn uống cà phê đá hay cà phê nóng?" },
    { hanzi: "我每天早上都要喝一杯黑咖啡。", meaning: "Mỗi buổi sáng tôi đều phải uống một ly cà phê đen." },
    { hanzi: "这家咖啡馆的环境非常安静。", meaning: "Không gian của quán cà phê này rất yên tĩnh." }
  ],
  "可乐": [
    { hanzi: "喝太多可乐对牙齿不好。", meaning: "Uống quá nhiều nước ngọt coke không tốt cho răng." },
    { hanzi: "服务员，请给我一罐冰可乐。", meaning: "Phục vụ ơi, cho tôi một lon coca đá nhé." },
    { hanzi: "吃汉堡包的时候我喜欢配可乐。", meaning: "Khi ăn burger tôi thích uống kèm coca." }
  ],
  "烤鸭": [
    { hanzi: "北京烤鸭是世界闻名的中国菜。", meaning: "Vịt quay Bắc Kinh là món ăn Trung Hoa nổi tiếng thế giới." },
    { hanzi: "今天我带外国朋友去尝尝烤鸭。", meaning: "Hôm nay tôi dẫn bạn người nước ngoài đi nếm thử vịt quay." },
    { hanzi: "这里的烤鸭外皮香脆，肉质鲜嫩。", meaning: "Vịt quay ở đây da ngoài giòn rụm, thịt thơm mềm." }
  ],
  "火锅": [
    { hanzi: "冬天最适合和朋友一起吃火锅了。", meaning: "Mùa đông thích hợp nhất là cùng bạn bè đi ăn lẩu." },
    { hanzi: "这家四川火锅味道很正宗，但是有点儿辣。", meaning: "Quán lẩu Tứ Xuyên này vị rất chuẩn, nhưng hơi cay." },
    { hanzi: "你想吃海鲜火锅还是牛肉火锅？", meaning: "Bạn muốn ăn lẩu hải sản hay lẩu thịt bò?" }
  ],
  "谢谢": [
    { hanzi: "非常感谢你的热情帮助！", meaning: "Vô cùng cảm ơn sự giúp đỡ nhiệt tình của bạn!" },
    { hanzi: "谢谢大家今天的参与和支持。", meaning: "Cảm ơn mọi người vì sự tham gia và ủng hộ hôm nay." },
    { hanzi: "太谢谢你了，帮了我这么大的忙。", meaning: "Quá cảm ơn bạn, đã giúp tôi một việc lớn như vậy." }
  ],
  "不客气": [
    { hanzi: "不用谢，这是我应该做的，不客气！", meaning: "Không cần cảm ơn đâu, đây là việc tôi nên làm mà, đừng khách sáo!" },
    { hanzi: "举手之劳，大家都是朋友，别客气。", meaning: "Tiện tay giúp thôi, đều là bạn bè cả, đừng khách sáo." },
    { hanzi: "以后有什么困难随时找我，不客气。", meaning: "Sau này có khó khăn gì cứ tìm tôi nhé, đừng khách khí." }
  ],
  "再见": [
    { hanzi: "时间不早了，我们明天学校见，再见！", meaning: "Thời gian không còn sớm nữa, mai gặp ở trường nhé, tạm biệt!" },
    { hanzi: "再见，祝你一路平安！", meaning: "Tạm biệt, chúc bạn lên đường bình an!" },
    { hanzi: "老师再见，明天见！", meaning: "Em chào thầy cô ạ, hẹn gặp thầy cô ngày mai!" }
  ],
  "叫": [
    { hanzi: "请问你叫什么名字？", meaning: "Xin hỏi bạn tên là gì?" },
    { hanzi: "我叫明德，来自越南河内。", meaning: "Tôi tên là Minh Đức, đến từ Hà Nội, Việt Nam." },
    { hanzi: "大家平时都叫我的小名。", meaning: "Mọi người ngày thường đều gọi tên thân mật của tôi." }
  ],
  "什么": [
    { hanzi: "你在找什么东西呢？", meaning: "Bạn đang tìm cái gì thế?" },
    { hanzi: "今天晚饭你想吃什么？", meaning: "Bữa tối nay bạn muốn ăn gì?" },
    { hanzi: "这句话在中文里是什么意思？", meaning: "Câu này trong tiếng Trung có nghĩa là gì?" }
  ],
  "名字": [
    { hanzi: "你的中文名字很有诗意。", meaning: "Tên tiếng Trung của bạn rất giàu chất thơ." },
    { hanzi: "请在表格的右上角签上你的名字。", meaning: "Vui lòng ký tên của bạn vào góc trên bên phải của biểu mẫu." },
    { hanzi: "我一时想不起来这部电影的名字了。", meaning: "Tôi nhất thời không nhớ ra tên của bộ phim này rồi." }
  ],
  "会议": [
    { hanzi: "我们今天下午两点有一个重要的项目会议。", meaning: "Chiều nay lúc 2 giờ chúng tôi có một cuộc họp dự án quan trọng." },
    { hanzi: "经理正在会议室里开会呢。", meaning: "Giám đốc đang họp trong phòng họp kìa." },
    { hanzi: "这次会议主要讨论下个季度的计划。", meaning: "Cuộc họp lần này chủ yếu thảo luận kế hoạch quý tới." }
  ],
  "确认": [
    { hanzi: "请尽快确认一下订单的信息。", meaning: "Vui lòng nhanh chóng xác nhận lại thông tin đơn hàng." },
    { hanzi: "我已经向客户确认了交货时间。", meaning: "Tôi đã xác nhận thời gian giao hàng với khách hàng rồi." },
    { hanzi: "在发邮件之前，请再次确认收件人地址。", meaning: "Trước khi gửi email, vui lòng xác nhận lại địa chỉ người nhận." }
  ],
  "尽快": [
    { hanzi: "请尽快给我答复，我很着急。", meaning: "Vui lòng trả lời cho tôi sớm nhất có thể, tôi đang rất gấp." },
    { hanzi: "我们会尽快处理您的申请。", meaning: "Chúng tôi sẽ xử lý yêu cầu của quý khách nhanh nhất có thể." },
    { hanzi: "如果有新消息，请尽快通知大家。", meaning: "Nếu có tin tức mới, vui lòng thông báo cho mọi người càng sớm càng tốt." }
  ],
  "学会": [
    { hanzi: "经过一个月的努力，我终于学会了游泳。", meaning: "Sau một tháng nỗ lực, tôi cuối cùng đã học được bơi rồi." },
    { hanzi: "在大学里，我们要学会独立思考。", meaning: "Ở trường đại học, chúng ta phải học cách tư duy độc lập." },
    { hanzi: "他很快就学会了如何使用这个新软件。", meaning: "Anh ấy rất nhanh đã học được cách sử dụng phần mềm mới này." }
  ],
  "会计": [
    { hanzi: "我姐姐在一家外企当财务会计。", meaning: "Chị gái tôi làm kế toán tài chính ở một công ty nước ngoài." },
    { hanzi: "会计工作需要非常细心和认真。", meaning: "Công việc kế toán đòi hỏi phải vô cùng tỉ mỉ và cẩn thận." },
    { hanzi: "大学毕业后，他打算考注册会计师。", meaning: "Sau khi tốt nghiệp đại học, anh ấy dự định thi chứng chỉ kiểm toán viên." }
  ]
};

// Generic smart contextual generator for other words
function generateContextualExamples(item) {
  const hanzi = (item.validAnswers[0] || item.hanzi || '').trim();
  const meaning = item.meaning || '';
  const ex = item.example ? item.example.trim().split(/[\n\r]+/)[0] : '';

  if (customBank[hanzi]) {
    return customBank[hanzi].map(itemEx => ({
      hanzi: itemEx.hanzi,
      pinyin: formatPinyin(itemEx.hanzi),
      meaning: itemEx.meaning
    }));
  }

  const examples = [];

  // If sheet has an example, use it as first
  if (ex && ex.length >= 2) {
    examples.push({
      hanzi: ex,
      pinyin: formatPinyin(ex),
      meaning: `(Ví dụ thực tế): ${ex}`
    });
  }

  // Generate 2 or 3 natural sentences based on part of speech / meaning
  if (meaning.includes('thời gian') || meaning.includes('ngày') || meaning.includes('tháng') || meaning.includes('năm') || meaning.includes('tuần') || meaning.includes('hôm')) {
    examples.push({
      hanzi: `我们${hanzi}一起去旅行吧。`,
      pinyin: formatPinyin(`我们${hanzi}一起去旅行吧。`),
      meaning: `Chúng ta hãy cùng nhau đi du lịch vào ${meaning.split(';')[0]} nhé.`
    });
    examples.push({
      hanzi: `${hanzi}的工作非常顺利。`,
      pinyin: formatPinyin(`${hanzi}的工作非常顺利。`),
      meaning: `Công việc của ${meaning.split(';')[0]} rất suôn sẻ.`
    });
  } else if (meaning.includes('động từ') || meaning.includes('ăn') || meaning.includes('uống') || meaning.includes('mua') || meaning.includes('học') || meaning.includes('nói') || meaning.includes('đi')) {
    examples.push({
      hanzi: `我想${hanzi}，你觉得怎么样？`,
      pinyin: formatPinyin(`我想${hanzi}，你觉得怎么样？`),
      meaning: `Tôi muốn ${meaning.split(';')[0]}, bạn thấy thế nào?`
    });
    examples.push({
      hanzi: `他每天都${hanzi}，非常认真。`,
      pinyin: formatPinyin(`他每天都${hanzi}，非常认真。`),
      meaning: `Anh ấy mỗi ngày đều ${meaning.split(';')[0]}, rất chăm chỉ.`
    });
  } else if (meaning.includes('người') || meaning.includes('bạn') || meaning.includes('thầy') || meaning.includes('em') || meaning.includes('anh') || meaning.includes('chị')) {
    examples.push({
      hanzi: `他是我的${hanzi}，人很好。`,
      pinyin: formatPinyin(`他是我的${hanzi}，人很好。`),
      meaning: `Anh ấy là ${meaning.split(';')[0]} của tôi, tính tình rất tốt.`
    });
    examples.push({
      hanzi: `我的${hanzi}非常喜欢学中文。`,
      pinyin: formatPinyin(`我的${hanzi}非常喜欢学中文。`),
      meaning: `${meaning.split(';')[0]} của tôi rất thích học tiếng Trung.`
    });
  } else {
    examples.push({
      hanzi: `这个${hanzi}在生活中很常用。`,
      pinyin: formatPinyin(`这个${hanzi}在生活中很常用。`),
      meaning: `${hanzi} (${meaning.split(';')[0]}) rất thông dụng trong đời sống.`
    });
    examples.push({
      hanzi: `请用“${hanzi}”写一个简单的句子。`,
      pinyin: formatPinyin(`请用“${hanzi}”写一个简单的句子。`),
      meaning: `Xin hãy dùng từ "${hanzi}" để viết một câu đơn giản.`
    });
  }

  // Ensure exactly 3 examples
  while (examples.length < 3) {
    examples.push({
      hanzi: `大家都很喜欢${hanzi}。`,
      pinyin: formatPinyin(`大家都很喜欢${hanzi}。`),
      meaning: `Mọi người đều rất thích ${meaning.split(';')[0]}.`
    });
  }

  return examples.slice(0, 3);
}

// Build complete dictionary
const finalDict = {};
let count = 0;

defaultVocab.forEach(item => {
  const key = (item.validAnswers[0] || item.hanzi || '').trim();
  if (!key) return;
  finalDict[key] = generateContextualExamples(item);
  count++;
});

const outputPath = path.join(__dirname, '../src/data/aiExamples.json');
fs.writeFileSync(outputPath, JSON.stringify(finalDict, null, 2), 'utf8');
console.log(`Generated AI examples for ${count} words saved to ${outputPath}`);
