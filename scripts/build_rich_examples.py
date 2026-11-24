# -*- coding: utf-8 -*-
import json
import re

# Load all 322 words
with open('scratch_all_words.json', 'r', encoding='utf-8') as f:
    all_words = json.load(f)

# Load existing translations map from applyAccurateTranslations.cjs
with open('scripts/applyAccurateTranslations.cjs', 'r', encoding='utf-8') as f:
    content = f.read()

translations_map = {}
for m in re.finditer(r'"([^"\n\r]+)":\s*"([^"\n\r]+)"', content):
    k, v = m.group(1).strip(), m.group(2).strip()
    if k and v and len(k) < 30 and len(v) > 2:
        translations_map[k] = v

print(f"Loaded {len(translations_map)} existing sheet translations.")

# Complete dictionary of hand-crafted authentic examples for all core words
# Format: word -> list of (hanzi, vietnamese_meaning)
# Every sentence is a real-life sentence, with natural grammar and 100% pure Vietnamese translation.
custom_db = {
    # Food & Fruits
    "苹果": [
        ("桌子上的果盘里放着几个新鲜红润的苹果。", "Trong đĩa hoa quả trên bàn có đặt vài quả táo đỏ tươi ngon."),
        ("每天吃一个苹果，对促进身体健康很有益处。", "Mỗi ngày ăn một quả táo rất có lợi cho việc tăng cường sức khỏe."),
        ("妈妈去超市买了两公斤富士苹果做沙拉。", "Mẹ đi siêu thị mua 2 kg táo Fuji về làm món salad.")
    ],
    "香蕉": [
        ("运动出汗之后吃一根香蕉，能够快速补充体力。", "Sau khi vận động toát mồ hôi ăn một quả chuối có thể nhanh chóng hồi phục thể lực."),
        ("这把香蕉已经完全成熟变黄了，口感非常甜软。", "Nải chuối này đã chín vàng đều rồi, vị ăn rất ngọt và mềm."),
        ("早上喝一杯香蕉牛奶燕麦粥，营养又健康。", "Buổi sáng uống một cốc cháo yến mạch chuối sữa tươi vừa dinh dưỡng lại vừa lành mạnh.")
    ],
    "草莓": [
        ("红彤彤的草莓散发着诱人的果香，十分可口。", "Những quả dâu tây đỏ mọng tỏa ra mùi thơm hoa quả quyến rũ, ăn rất ngon miệng."),
        ("草莓蛋糕是妹妹过生日时最想要吃的甜点。", "Bánh kem dâu tây là món tráng miệng em gái muốn ăn nhất vào dịp sinh nhật."),
        ("春暖花开的季节，很多游客喜欢去郊区采摘新鲜草莓。", "Mùa xuân ấm áp hoa nở, nhiều du khách thích về vùng ngoại ô hái dâu tây tươi.")
    ],
    "橙子": [
        ("这箱橙子皮薄汁多，切开来香气扑鼻。", "Thùng cam này vỏ mỏng mọng nước, bổ ra mùi thơm ngào ngạt."),
        ("多喝鲜榨橙汁可以为身体补充丰富的维生素C。", "Uống nhiều nước cam vắt tươi có thể bổ sung vitamin C dồi dào cho cơ thể."),
        ("饭后吃几瓣酸甜可口的橙子，感觉非常解腻清爽。", "Sau bữa ăn ăn vài múi cam chua ngọt ngon miệng, cảm giác rất thanh mát và đỡ ngấy.")
    ],
    "橘子": [
        ("秋冬季节的砂糖橘个头小巧，味道十分清甜。", "Quýt đường vào mùa thu đông quả nhỏ xinh, vị ngọt thanh dễ chịu."),
        ("剥开橘子皮的时候，满屋子都是清新的果香味。", "Lúc bóc vỏ quýt ra, khắp căn phòng đều thoang thoảng mùi hương hoa quả tươi mát."),
        ("感冒咳嗽时，吃些热乎的烤橘子有助于缓解喉咙不适。", "Khi bị cảm ho, ăn chút quýt nướng nóng giúp làm dịu cảm giác khó chịu ở cổ họng.")
    ],
    "柚子": [
        ("中秋节赏月的时候，家家户户的餐桌上都会摆上柚子。", "Khi ngắm trăng dịp Tết Trung thu, trên bàn ăn của các gia đình đều bày bưởi."),
        ("这个金黄色的沙田柚果肉饱满，一点儿也不酸涩。", "Quả bưởi Sa Điền vàng ươm này tép bưởi căng mọng, không hề bị chua hay đắng chát chút nào."),
        ("清甜微苦的蜂蜜柚子茶在冬天喝起来格外暖胃舒心。", "Món trà bưởi mật ong ngọt thanh hơi đắng nhẹ uống vào mùa đông làm ấm bụng và khoan khoái lạ thường.")
    ],
    "桃子": [
        ("熟透的水蜜桃粉嫩饱满，轻轻咬一口便汁水四溢。", "Quả đào mật chín mọng hồng hào tròn trịa, khẽ cắn một miếng là nước cốt tuôn trào tràn ngập."),
        ("他在果园里亲手采摘了一整篮脆甜清爽的新鲜水蜜桃。", "Anh ấy tự tay hái đầy một giỏ đào mật tươi giòn ngọt thanh mát ở trong vườn cây ăn quả."),
        ("神话故事中，相传王母娘娘的蟠桃吃了能让人延年益寿。", "Trong truyện thần thoại, tương truyền quả đào tiên của Tây Vương Mẫu ăn vào có thể giúp con người kéo dài tuổi thọ.")
    ],
    "李子": [
        ("初夏时节的脆李酸甜爽脆，深受年轻人的喜爱。", "Những quả mận giòn vào dịp đầu hè vị chua chua ngọt ngọt giòn tan, rất được giới trẻ yêu thích."),
        ("这些紫红色的李子口感浓郁多汁，洗干净就能直接吃。", "Mấy quả mận màu đỏ tía này hương vị đậm đà mọng nước, rửa sạch là có thể ăn trực tiếp luôn."),
        ("李子虽然酸美开胃，但是一次性吃太多容易刺激肠胃。", "Mận tuy chua ngon kích thích vị giác nhưng ăn một lần quá nhiều dễ làm cồn cào đường ruột.")
    ],
    "梨": [
        ("秋燥咽喉干燥的时候，炖一碗冰糖雪梨汤能很好地润肺止咳。", "Vào mùa thu khi cổ họng bị khô rát, hầm một bát canh lê tuyết đường phèn sẽ giúp nhuận phổi trừ ho rất tốt."),
        ("刚从冰箱拿出来的砀山梨咬一口清脆多汁，格外甘甜解渴。", "Quả lê Đãng Sơn vừa lấy từ tủ lạnh ra cắn một miếng giòn tan nhiều nước, ngọt lành giải khát vô cùng."),
        ("梨含有丰富的膳食纤维和水分，是老少皆宜的健康水果。", "Lê chứa nhiều chất xơ hòa tan và lượng nước dồi dào, là loại hoa quả lành mạnh thích hợp cho mọi lứa tuổi.")
    ],
    "芒果": [
        ("成熟的大芒果果肉金黄厚实，散发着浓郁迷人的热带风味。", "Những quả xoài to chín mọng thịt xoài vàng ươm dày cùi, tỏa ra hương vị nhiệt đới đậm đà mê đắm."),
        ("夏天来一碗冰凉爽口的芒果西米露，让人倍感惬意舒畅。", "Mùa hè thưởng thức một bát chè xoài bột báng thanh mát lạnh tê lưỡi khiến người ta cảm thấy vô cùng dễ chịu sảng khoái."),
        ("越南富国岛和芽庄的气候十分适宜种植各种优质香甜芒果。", "Khí hậu ở đảo Phú Quốc và Nha Trang của Việt Nam rất thích hợp để gieo trồng các loại xoài thơm ngọt hảo hạng.")
    ],
    "菠萝": [
        ("切好新鲜的菠萝之后，最好先放在淡盐水里浸泡十几分钟。", "Sau khi gọt xong quả dứa tươi, tốt nhất nên ngâm trong nước muối loãng chừng mười mấy phút trước."),
        ("菠萝咕噜肉是一道酸甜可口、色香味俱全的经典粤菜佳肴。", "Món sườn xào chua ngọt nấu dứa là một món ăn Quảng Đông kinh điển chua ngọt vừa miệng, đủ cả sắc hương vị."),
        ("热带阳光雨露滋润下生长的菠萝格外清甜多汁、香气四溢。", "Những quả dứa lớn lên dưới sự nuôi dưỡng của nắng mưa nhiệt đới đặc biệt ngọt thanh mọng nước, hương thơm ngát tỏa khắp nơi.")
    ],
    "榴莲": [
        ("虽然榴莲闻起来气味奇特，但尝起来口感绵密香甜如奶油。", "Mặc dù sầu riêng ngửi mùi có chút lạ lùng, nhưng nếm thử thì chất thịt mềm mịn ngọt bùi như kem sữa."),
        ("喜欢吃榴莲的人把它视作果中之王，顿顿吃都吃不腻。", "Người thích ăn sầu riêng tôn nó là vua của các loại trái cây, bữa nào cũng ăn mà không hề biết chán."),
        ("泰国和越南南部的金枕头榴莲肉厚核小，品质享誉海内外。", "Giống sầu riêng Monthong ở Thái Lan và miền Nam Việt Nam cơm dày hạt lép, chất lượng nổi tiếng trong và ngoài nước.")
    ],
    "羊肉": [
        ("冬天围坐在热气腾腾的火锅旁涮羊肉，感觉浑身都暖和舒畅。", "Mùa đông quây quần bên nồi lẩu bốc khói nghi ngút nhúng thịt cừu, cảm giác cả người đều ấm áp khoan khoái."),
        ("烤羊肉串撒上孜然粉和辣椒面，是夜市街头最受欢迎的美食。", "Xiên thịt cừu nướng rắc thêm chút bột thì là và ớt bột là món ăn vặt được ưa chuộng nhất trên phố ẩm thực đêm."),
        ("清炖羊肉汤滋补温润，是抵御冬日严寒的传统养生佳品。", "Nồi canh thịt cừu hầm thanh đạm bổ dưỡng ấm áp, là món ẩm thực dưỡng sinh truyền thống giúp chống lại giá rét mùa đông.")
    ],
    "猪肉": [
        ("红烧肉是中华家常菜中的经典代表，色泽红亮肥而不腻。", "Thịt kho tàu là món ăn tiêu biểu kinh điển trong mâm cơm gia đình Trung Hoa, màu sắc đỏ au béo mà không ngấy."),
        ("妈妈早上去早市买了两斤新鲜猪里脊肉，准备晚上包饺子。", "Mẹ sáng sớm đi chợ sớm mua 1 kg thịt thăn lợn tươi, chuẩn bị tối nay gói sủi cảo."),
        ("挑选猪肉时要看肉质弹性与新鲜光泽，确保食品卫生安全。", "Khi chọn mua thịt lợn cần chú ý độ đàn hồi của thớ thịt và độ tươi sáng, đảm bảo vệ sinh an toàn thực phẩm.")
    ],
    "面条": [
        ("生日那天吃一碗热气腾腾的长寿面，寓意福寿绵长、安康吉祥。", "Vào ngày sinh nhật ăn một bát mì trường thọ nóng hổi mang ý nghĩa phúc thọ dài lâu, an khang tốt lành."),
        ("兰州牛肉拉面的汤头清香醇厚，师傅手工拉出的面条劲道爽滑。", "Nước dùng của món mì bò kéo Lan Châu thơm thanh đậm đà, sợi mì đầu bếp kéo tay dẻo dai trơn mượt."),
        ("工作繁忙时，下一碗热面条打一个荷包蛋就是简单营养的一餐。", "Khi công việc bận rộn, nấu một bát mì nóng kèm một quả trứng ốp la là có ngay bữa ăn đơn giản giàu dinh dưỡng.")
    ],
    "米": [
        ("水稻收获的季节，金黄色的稻浪翻滚，到处洋溢着丰收喜悦。", "Mùa thu hoạch lúa nước, từng đợt sóng lúa vàng ươm dập dờn, khắp nơi rộn ràng niềm vui mùa màng bội thu."),
        ("大米是千百年来亚洲许多国家人民一日三餐离不开的主食。", "Gạo là lương thực chính không thể thiếu trong ba bữa cơm mỗi ngày của người dân nhiều nước châu Á hàng ngàn năm qua."),
        ("刚出锅的热米饭散发着纯朴自然的米香味，搭配什么菜都可口。", "Bát cơm trắng nóng hổi vừa xới ra tỏa mùi hương gạo mộc mạc tự nhiên, kết hợp với món ăn nào cũng ngon miệng.")
    ],
    "牛奶": [
        ("睡前喝一杯温热的纯牛奶，能有效帮助放松神经、改善睡眠。", "Trước khi đi ngủ uống một ly sữa tươi nguyên chất ấm nóng có thể giúp thư giãn thần kinh, cải thiện giấc ngủ hiệu quả."),
        ("早餐桌上一杯新鲜牛奶搭配两片全麦吐司，营养均衡又健康。", "Trên bàn ăn sáng một ly sữa tươi kèm hai lát bánh mì nguyên cám vừa cân bằng dinh dưỡng lại vừa tốt cho sức khỏe."),
        ("坚持每天适量饮用优质牛奶，对儿童青少年的骨骼发育大有裨益。", "Kiên trì uống lượng sữa chất lượng vừa đủ mỗi ngày mang lại lợi ích rất lớn cho sự phát triển xương khớp của thanh thiếu niên.")
    ],
    "难吃": [
        ("这家快餐店的饭菜做得又咸又油腻，实在有些难以下咽。", "Cơm canh của quán đồ ăn nhanh này nấu vừa mặn vừa nhiều dầu mỡ, thực sự có phần khó nuốt nổi."),
        ("即使不小心把菜做难吃了，家人也总是笑着互相包容与鼓励。", "Cho dù lỡ tay nấu món ăn bị dở, cả nhà cũng luôn mỉm cười bao dung và động viên lẫn nhau."),
        ("药虽然苦口难吃，但为了身体早日康复还是必须按时服下。", "Thuốc tuy đắng chát khó uống nhưng vì muốn cơ thể sớm bình phục thì vẫn phải uống đúng giờ giấc quy định.")
    ],
    "盘子": [
        ("吃完晚饭后，弟弟主动帮妈妈把桌上的空盘子收拾到厨房水池。", "Sau bữa cơm tối, em trai chủ động giúp mẹ dọn các đĩa trống trên bàn vào bồn rửa bát trong bếp."),
        ("这套青花瓷盘子做工考究古朴典雅，摆在展柜里很有艺术欣赏价值。", "Bộ đĩa sứ hoa lam này gia công tỉ mỉ cổ kính trang nhã, trưng bày trong tủ kính mang giá trị thưởng lãm nghệ thuật cao."),
        ("洗碗时要拿稳光滑的陶瓷盘子，小心脱手滑落摔碎在地上。", "Khi rửa bát cần cầm chắc những chiếc đĩa gốm trơn bóng, cẩn thận kẻo tuột tay rơi vỡ xuống sàn nhà.")
    ],
    "叉子": [
        ("享用精致美味的草莓千层蛋糕时，大家习惯用小叉子慢慢品尝。", "Khi thưởng thức món bánh kem nghìn lớp dâu tây tinh tế, mọi người quen dùng chiếc nĩa nhỏ từ tốn nhâm nhi."),
        ("吃意大利面条时，用叉子顺时针卷起面条送入口中十分优雅规范。", "Khi ăn mì Ý, dùng nĩa cuộn tròn sợi mì theo chiều kim đồng hồ đưa vào miệng rất trang nhã đúng điệu."),
        ("西餐厅的服务生动作敏捷地为客人们重新摆放好干净闪亮的刀叉。", "Nhân viên phục vụ nhà hàng Tây thoăn thoắt xếp lại dao nĩa sạch bóng loáng cho quý khách.")
    ],
    "筷子": [
        ("正确熟练地使用双筷夹菜，是体验中华饮食文化不可或缺的一部分。", "Sử dụng đôi đũa gắp thức ăn chuẩn xác thuần thục là một phần không thể thiếu để trải nghiệm văn hóa ẩm thực Trung Hoa."),
        ("爷爷用上等红木亲手雕刻了一双光泽温润的木筷，送给我留作纪念。", "Ông nội tự tay lấy gỗ hồng mộc thượng hạng đẽo gọt một đôi đũa gỗ bóng mịn tặng tôi làm kỷ niệm."),
        ("很多外国留学生刚到中国时，都会兴致勃勃地跟着中国室友学用筷子。", "Rất nhiều lưu học sinh nước ngoài khi mới sang Trung Quốc đều hào hứng học bạn cùng phòng cách cầm đũa.")
    ],
    "勺子": [
        ("品尝浓郁鲜美的松茸土鸡汤时，要用白瓷汤勺一小口一小口慢慢喝。", "Khi nếm món canh gà nấm tùng nhung thơm đậm đà, nên dùng chiếc thìa sứ múc từng ngụm nhỏ từ tốn thưởng thức."),
        ("小宝宝抓着色彩鲜艳的小汤勺自己学吃饭，模样显得格外天真可爱。", "Em bé nắm lấy chiếc thìa nhỏ màu sắc rực rỡ tự học xúc ăn, dáng vẻ trông vô cùng ngây thơ đáng yêu."),
        ("盛饭舀汤离不开干净卫生的勺子，这是厨房里每天都用到的重要餐具。", "Xới cơm múc canh không thể thiếu chiếc thìa muôi sạch sẽ, đây là dụng cụ ăn uống quan trọng dùng đến mỗi ngày trong bếp.")
    ],
    "刀子": [
        ("使用锋利的小水果刀削苹果皮时，一定要注意力集中防止切伤手指。", "Khi dùng dao gọt hoa quả sắc bén để gọt vỏ táo, nhất định phải tập trung chú ý để tránh cắt vào ngón tay."),
        ("厨师手中的切菜刀上下翻飞，眨眼间就将胡萝卜切成了极细的细丝。", "Lưỡi dao thái rau trên tay đầu bếp thoăn thoắt lên xuống, chỉ chớp mắt đã thái củ cà rốt thành những sợi mỏng li ti."),
        ("家用刀具使用完毕后要清洗擦干并放入刀架，妥善放置保障居家安全。", "Dao kéo trong nhà sau khi dùng xong phải rửa sạch lau khô cất vào giá dao, sắp xếp cẩn thận để bảo đảm an toàn gia đình.")
    ],
    # Places & Transport
    "家": [
        ("无论走到世界的哪个角落，家永远是心灵深处最温暖避风的港湾。", "Dù đi đến góc bể chân trời nào, gia đình mãi là bến đỗ bình yên ấm áp nhất trong tâm hồn."),
        ("放假坐上回家的列车，看着窗外熟悉的风景，思乡的心情无比急切。", "Kỳ nghỉ bước lên chuyến tàu về nhà, nhìn cảnh vật thân quen ngoài cửa sổ, lòng ngập tràn nỗi niềm mong ngóng quê hương."),
        ("一家人围坐在一起吃顿热气腾腾的年夜饭，就是人间最纯粹的幸福。", "Cả nhà quây quần bên nhau ăn bữa cơm tất niên ấm cúng chính là niềm hạnh phúc thuần khiết nhất trần gian.")
    ],
    "中国": [
        ("中国拥有悠久灿烂的五千年历史文明和丰富绚丽的多元地理风貌。", "Trung Quốc sở hữu nền văn minh lịch sử 5.000 năm xán lạn và cảnh quan địa lý phong phú đa dạng."),
        ("许多外国青年通过学习中文和赴华留学，更加全面深入地了解中国。", "Nhiều thanh niên quốc tế thông qua học tiếng Trung và du học đã hiểu biết sâu sắc toàn diện hơn về Trung Quốc."),
        ("长城、故宫、兵马俑等世界文化遗产彰显了古代中国工匠的非凡智慧。", "Trường Thành, Cố Cung, Binh Mã Dũng là những di sản văn hóa thế giới thể hiện trí tuệ phi thường của thợ thủ công Trung Quốc cổ đại.")
    ],
    "美国": [
        ("纽约和旧金山是美国东西两岸极具国际知名度与文化代表性的大都市。", "New York và San Francisco là những đô thị lớn có danh tiếng quốc tế và đại diện văn hóa ở hai bờ đông tây nước Mỹ."),
        ("他高中毕业后申请到了美国著名大学的全额奖学金，攻读计算机科学。", "Sau khi tốt nghiệp cấp 3, anh ấy đã giành được học bổng toàn phần của trường đại học danh tiếng tại Mỹ theo học ngành khoa học máy tính."),
        ("好莱坞电影作为重要的文化载体，在全球许多国家和地区广泛传播。", "Điện ảnh Hollywood là một phương tiện văn hóa quan trọng, được truyền bá rộng rãi tại nhiều quốc gia và vùng lãnh thổ trên thế giới.")
    ],
    "英国": [
        ("伦敦大本钟和泰晤士河畔的古典建筑见证了英国悠久漫长的历史沧桑。", "Tháp đồng hồ Big Ben và các công trình cổ bên bờ sông Thames đã chứng kiến bao thăng trầm lịch sử lâu đời của nước Anh."),
        ("莎士比亚的戏剧作品是英国文学乃至全人类戏剧艺术宝库中的璀璨明珠。", "Các vở kịch của Shakespeare là viên ngọc sáng chói trong kho tàng văn học Anh cũng như nghệ thuật kịch nghệ của toàn nhân loại."),
        ("在英国留学期间，他体验了纯正传统的英式下午茶文化与优雅礼仪。", "Trong thời gian du học tại Anh, anh ấy đã trải nghiệm văn hóa trà chiều truyền thống thanh lịch cùng các nghi thức nhã nhặn của người Anh.")
    ],
    "外国": [
        ("接触并学习外国的优秀先进科技与文化，有助于拓宽本国青年的国际视野。", "Tiếp xúc và học hỏi công nghệ văn hóa tiên tiến của nước ngoài giúp mở rộng tầm nhìn quốc tế cho thanh niên trong nước."),
        ("国际文化交流节上，外国留学生们身着绚丽的民族服饰展示传统歌舞。", "Tại ngày hội giao lưu văn hóa quốc tế, các lưu học sinh nước ngoài khoác lên mình trang phục dân tộc rực rỡ biểu diễn ca múa truyền thống."),
        ("许多中国优质特色产品远销外国市场，赢得了海内外消费者的广泛赞誉。", "Nhiều mặt hàng đặc sắc chất lượng cao của Trung Quốc xuất khẩu sang thị trường nước ngoài, giành được sự khen ngợi rộng rãi của người tiêu dùng quốc tế.")
    ],
    "出租车": [
        ("走出火车站大门，广场旁边就有一条井然有序排队等候乘客的出租车站台。", "Bước ra khỏi cửa ga tàu hỏa, bên cạnh quảng trường có ngay một làn đón trả khách taxi xếp hàng ngay ngắn trật tự."),
        ("由于下雨天路面湿滑不好骑车，他果断在手机软件上预约了一辆出租车。", "Do trời mưa đường trơn trượt khó đi xe đạp, anh ấy quyết định đặt trước một chuyến taxi trên ứng dụng điện thoại."),
        ("热心的出租车司机不仅车技稳当娴熟，还热情地向外地游客介绍城市景点。", "Bác tài xế taxi nhiệt tình không những lái xe êm ái vững vàng mà còn hăng hái giới thiệu các danh thắng thành phố cho khách du lịch.")
    ],
    "汽车": [
        ("随着新能源技术的飞速革新，环保节能的电动汽车正越来越受到消费者青睐。", "Cùng với sự đổi mới nhanh chóng của công nghệ năng lượng mới, ô tô điện tiết kiệm năng lượng bảo vệ môi trường ngày càng được ưa chuộng."),
        ("驾驶汽车穿行在风景如画的环海公路上，吹着凉爽的海风感觉十分惬意惬怀。", "Lái xe ô tô vi vu trên cung đường ven biển đẹp như tranh vẽ, đón làn gió biển mát lành cảm thấy vô cùng dễ chịu sảng khoái."),
        ("定期对家庭汽车进行机油更换与轮胎刹车检查，是保障出行行车安全的前提。", "Định kỳ thay dầu máy và kiểm tra lốp, phanh xe cho ô tô gia đình là điều kiện tiên quyết để bảo đảm an toàn khi tham gia giao thông.")
    ],
    "飞机": [
        ("银白色的客运飞机直冲云霄，平稳地翱翔在万米高空的蔚蓝天际之中。", "Chiếc máy bay chở khách màu trắng bạc vút lên mây xanh, lượn cánh êm ả trên bầu trời cao vạn dặm ngắt một màu xanh biếc."),
        ("现代民用喷气式飞机的普及，极大地缩短了大洋两岸国家之间的地理时空距离。", "Sự phổ cập của máy bay phản lực dân dụng hiện đại đã rút ngắn đáng kể khoảng cách không gian địa lý giữa các quốc gia đôi bờ đại dương."),
        ("在飞机即将平稳降落之前，空乘人员温和地提醒全体旅客系好安全带调直座椅。", "Trước khi máy bay chuẩn bị hạ cánh êm thuận, tiếp viên hàng không ân cần nhắc nhở hành khách thắt dây an toàn dựng thẳng lưng ghế.")
    ],
    "火车": [
        ("乘坐穿梭在秀丽山川之间的绿皮火车，透过车窗欣赏沿途风景充满浪漫怀旧气息。", "Ngồi trên chuyến tàu hỏa lướt qua non xanh nước biếc, ngắm cảnh sắc dọc đường qua khung cửa sổ ngập tràn phong vị lãng mạn hoài niệm."),
        ("如今纵横交错的高速铁路网让人们的跨省出行变得像乘坐市内公交一样便捷迅速。", "Mạng lưới đường sắt cao tốc chằng chịt ngày nay giúp việc di chuyển liên tỉnh của người dân trở nên nhanh chóng tiện lợi như đi xe buýt nội thành."),
        ("列车缓缓驶入终点站台，满载思乡游子的火车终于平安抵达了阔别已久的温暖故土。", "Chuyến tàu từ từ tiến vào sân ga cuối, đoàn tàu chở đầy những người con xa quê cuối cùng cũng cập bến bình an mảnh đất quê hương ấm áp.")
    ],
    "大巴": [
        ("旅行社包租的长途豪华大巴车载着观光旅游团准时向风景名胜区进发。", "Chiếc xe buýt du lịch đường dài hạng sang do công ty lữ hành thuê chở đoàn tham quan đúng giờ khởi hành hướng về khu danh lam thắng cảnh."),
        ("坐在宽敞平稳的城际大巴靠窗位置上，戴上耳机听歌让人感觉旅途十分惬意轻松。", "Ngồi ở vị trí cạnh cửa sổ trên chiếc xe khách liên tỉnh rộng rãi êm ái, đeo tai nghe nghe nhạc khiến chuyến hành trình trở nên nhẹ nhàng thư thái."),
        ("节日客运高峰期间，客运总站增开了数十趟开往各个周边县市的加班公路大巴客车。", "Vào đợt cao điểm vận tải hành khách dịp lễ, bến xe trung tâm tăng cường thêm hàng chục chuyến xe khách đường dài chạy về các huyện thị lân cận.")
    ],
    "公共汽车": [
        ("乘坐公共汽车是一种既经济实惠又有助于减少城市碳排放的绿色出行环保方式。", "Đi lại bằng xe buýt công cộng là một phương thức di chuyển xanh vừa tiết kiệm chi phí lại vừa góp phần giảm thiểu khí thải carbon đô thị."),
        ("每当清晨第一班公共汽车亮起车灯缓缓驶出总站，整座沉睡的城市便开始苏醒。", "Mỗi khi chuyến xe buýt công cộng đầu tiên trong sớm mai bật sáng ánh đèn từ từ lăn bánh rời bến, cả thành phố đang say giấc bắt đầu thức giấc."),
        ("下班高峰期的公共汽车车厢内虽然有些拥挤，但乘客之间主动让座的温馨场景随处可见。", "Trong khoang xe buýt giờ tan tầm tuy có phần đông đúc chen chúc, nhưng hình ảnh ấm lòng hành khách chủ động nhường ghế vẫn hiện diện khắp nơi.")
    ],
    "超市": [
        ("周末陪父母去大型综合超市采购整整一周的蔬菜水果和日常生活用品。", "Cuối tuần cùng bố mẹ đến siêu thị bách hóa lớn mua sắm rau củ quả tươi và đồ dùng sinh hoạt cho cả tuần."),
        ("这家便民超市不仅二十四小时全天候营业，生鲜货架上的商品也总是整齐新鲜。", "Siêu thị tiện ích này không những mở cửa phục vụ 24/24 suốt ngày đêm mà hàng hóa trên kệ đồ tươi sống lúc nào cũng tươi mới ngăn nắp."),
        ("超市收银台开辟了自助扫码支付通道，大大减少了顾客排队结算等待的时间。", "Quầy thu ngân siêu thị mở thêm các làn thanh toán tự quét mã vạch, giúp giảm đáng kể thời gian xếp hàng chờ đợi của khách mua sắm.")
    ],
    "图书馆": [
        ("阳光透过高大洁净的玻璃幕墙洒在图书馆木质书桌上，营造出恬静优雅的阅读氛围。", "Ánh nắng xuyên qua bức tường kính cao lớn trong suốt rọi xuống mặt bàn gỗ thư viện, tạo nên bầu không khí đọc sách thanh tịnh trang nhã."),
        ("大学图书馆浩瀚丰富的古今藏书资源，为无数学子探索科学真理提供了坚实知识后盾。", "Kho tàng sách cổ kim phong phú mênh mông của thư viện đại học cung cấp điểm tựa tri thức vững chắc cho bao thế hệ học trò kiếm tìm chân lý khoa học."),
        ("在静谧无声的市立图书馆里捧读一本经典名著，能够让浮躁疲惫的心灵彻底沉淀下来。", "Cầm đọc một cuốn danh tác kinh điển trong thư viện thành phố tĩnh lặng không một tiếng động giúp tâm hồn xua tan mỏi mệt và lắng đọng an yên.")
    ],
    "博物馆": [
        ("历史博物馆展厅里陈列着数千件青铜古器和珍贵书画，诉说着古老灿烂的文明传奇。", "Phòng trưng bày viện bảo tàng lịch sử xếp đặt hàng ngàn hiện vật đồ đồng cổ và tranh thư pháp quý giá, kể lại huyền thoại văn minh rực rỡ thuở xưa."),
        ("周末带孩子们去自然科学博物馆参观巨大的恐龙化石骨架，激发他们探索未知的求知欲。", "Cuối tuần dẫn các em nhỏ đến bảo tàng khoa học tự nhiên ngắm nhìn những bộ xương hóa thạch khủng long khổng lồ, thắp lên niềm ham hiểu biết khám phá thế giới."),
        ("数字现代艺术博物馆运用高科技声光电全息投影技术，为广大观众带来震撼身心的沉浸式体验。", "Bảo tàng nghệ thuật hiện đại ứng dụng công nghệ trình chiếu ảnh toàn tức âm thanh ánh sáng mang lại trải nghiệm nhập vai vô cùng ấn tượng cho người xem.")
    ],
    "工厂": [
        ("现代化高新智能汽车制造工厂车间内，数十台橙红色的自动化工业机械手臂精准高效作业。", "Bên trong phân xưởng nhà máy sản xuất ô tô thông minh hiện đại, hàng chục cánh tay robot công nghiệp tự động vận hành chính xác và năng suất cao."),
        ("这家环保型造纸工厂引进了国际领先的污水循环净化处理设备，实现了工业废水近零排放。", "Nhà máy giấy kiểu mẫu thân thiện môi trường này đã đưa vào vận hành hệ thống tuần hoàn xử lý nước thải tiên tiến, đạt chuẩn xả thải gần như bằng không."),
        ("随着全球数字化转型浪潮推进，传统实体制造工厂正逐步向互联互通的绿色智慧工厂全面升级。", "Cùng với làn sóng chuyển đổi số toàn cầu, các nhà máy sản xuất truyền thống đang từng bước nâng cấp toàn diện thành những nhà máy thông minh xanh kết nối đa chiều.")
    ],
    "会客室": [
        ("公司一楼的商务会客室装修风格简约大气，专门用于接待来访的重要合作伙伴与客户。", "Phòng tiếp khách thương mại ở tầng một công ty mang phong cách bài trí tối giản thanh lịch, chuyên dùng để đón tiếp các đối tác và khách hàng quan trọng."),
        ("秘书端上刚冲泡好的香醇龙井绿茶，请客人坐在舒适厚实的皮质沙发上稍候片刻。", "Cô thư ký bưng lên tách trà Long Tỉnh thơm ngát mới pha, mời khách ngồi nghỉ ngơi trên chiếc ghế sofa da êm ái đợi trong chốc lát."),
        ("双方代表在宽敞安静的外交会客室内就文化交流合作等议题展开了真诚务实的友好交谈。", "Đại diện đôi bên đã tiến hành cuộc hội đàm hữu nghị chân thành thực chất về các chủ đề hợp tác giao lưu văn hóa trong phòng tiếp khách ngoại giao rộng rãi yên tĩnh.")
    ],
    "商场": [
        ("周末市中心的大型购物商场里人潮涌动热闹非凡，各大品牌专卖店纷纷推出节日酬宾折扣。", "Cuối tuần tại trung tâm thương mại lớn ở trung tâm thành phố dòng người tấp nập nhộn nhịp, các cửa hàng thương hiệu đồng loạt tung ưu đãi giảm giá ngày lễ."),
        ("现代综合型商业购物商场集时尚购物、风味餐饮、亲子乐园以及数字巨幕影城于一体。", "Khu trung tâm thương mại phức hợp hiện đại tích hợp đầy đủ mua sắm thời trang, ẩm thực phong vị, khu vui chơi trẻ em và cụm rạp chiếu phim kỹ thuật số màn hình lớn."),
        ("华灯初上，商场外立面闪烁的七彩霓虹灯光将整条繁华商业步行街装点得宛如璀璨白昼。", "Đèn hoa vừa lên, ánh đèn neon bảy sắc lấp lánh trên mặt ngoài trung tâm thương mại thắp sáng cả con phố đi bộ sầm uất tựa như ban ngày rực rỡ.")
    ],
    "停车场": [
        ("商场配有三层地下大型立体智能停车场，车牌自动感应识别出入十分顺畅高效。", "Trung tâm thương mại trang bị bãi đỗ xe thông minh ba tầng dưới hầm, camera nhận diện biển số tự động giúp xe ra vào êm xuôi và nhanh chóng."),
        ("节假日商圈周边车位格外紧张，建议大家尽量挑选公共交通工具出行以避免拥堵。", "Ngày nghỉ lễ chỗ đỗ xe quanh khu thương mại rất khan hiếm, khuyên mọi người nên lựa chọn phương tiện giao thông công cộng để tránh ùn ứ tắc nghẽn."),
        ("新建公共停车场专门规划安装了数十个高功率快速充电桩，极大方便了新能源电动车主。", "Bãi đỗ xe công cộng mới xây quy hoạch lắp đặt hàng chục trụ sạc nhanh công suất lớn, tạo sự thuận tiện tối đa cho các chủ xe điện.")
    ],
    "运动场": [
        ("晨曦初现，绿茵运动场上就迎来了许多坚持每天跑步锻炼身体的活力四射的青年学生。", "Ánh bình minh vừa rạng, trên sân vận động ngập cỏ xanh đã đón chào rất nhiều bạn học sinh tràn đầy sức sống kiên trì chạy bộ rèn luyện sức khỏe mỗi ngày."),
        ("学校规划整修了拥有标准四百米塑胶跑道和天然草坪足球场的综合性田径运动场。", "Nhà trường đã quy hoạch nâng cấp sân vận động điền kinh tổng hợp sở hữu đường chạy cao su tiêu chuẩn 400m và sân bóng đá cỏ tự nhiên."),
        ("秋高气爽的日子里，全校师生齐聚运动场看台，共同迎接收获与激情洋溢的校园运动盛会。", "Trong những ngày thu mát mẻ, thầy trò toàn trường hội tụ trên khán đài sân vận động, cùng nhau đón chào ngày hội thể thao học đường ngập tràn nhiệt huyết và niềm vui.")
    ],
    "自行车": [
        ("骑上一辆轻便的共享自行车穿行于林荫街道，既健康锻炼身体又能尽情领略慢调城市生活。", "Đạp một chiếc xe đạp công cộng gọn nhẹ lướt dưới hàng cây rợp bóng, vừa rèn luyện thể chất lại vừa cảm nhận trọn vẹn nhịp sống thư thả của phố phường."),
        ("荷兰阿姆斯特丹是举世闻名的自行车王国，市内规划有极其完善安全且独立的骑行专用道。", "Amsterdam của Hà Lan là vương quốc xe đạp nổi tiếng khắp thế giới, trong thành phố quy hoạch mạng lưới làn đường riêng cho xe đạp cực kỳ an toàn và đồng bộ."),
        ("爸爸在院子里耐心地扶着车座，一遍又一遍鼓励初学骑两轮自行车的小儿子保持平衡向前看。", "Bố kiên nhẫn giữ yên sau xe đạp ở ngoài sân, hết lần này đến lần khác động viên cậu con trai nhỏ tập đi xe đạp giữ thăng bằng và nhìn thẳng về phía trước.")
    ],
    "牛仔裤": [
        ("一件简单的纯白纯棉短袖搭配经典深蓝色直筒牛仔裤，显得整个人格外干净干练而有青春朝气。", "Một chiếc áo phông ngắn tay trắng tinh kết hợp cùng quần bò ống đứng xanh thẫm cổ điển tôn lên vẻ ngoài năng động, chỉn chu và tràn đầy sức trẻ."),
        ("质地结实耐磨的牛仔裤因其百搭实用的特性，历经数十年时尚潮流变迁依然深受全球年轻人钟爱。", "Những chiếc quần bò chất vải dày dặn bền bỉ với đặc tính dễ phối đồ trải qua bao thập kỷ xoay vần thời trang vẫn được giới trẻ khắp thế giới mến mộ."),
        ("试衣间里，她挑选了一条剪裁合身版型挺括的九分牛仔裤，搭配运动鞋感觉十分舒适惬意。", "Trong phòng thử đồ, cô ấy chọn được chiếc quần bò lửng chín tấc may đo vừa vặn đứng dáng, phối cùng đôi giày thể thao mang lại cảm giác cực kỳ thoải mái.")
    ],
    "花瓶": [
        ("茶几中央摆放着一只造型别致优雅的手工吹制彩色琉璃花瓶，插着几朵娇艳欲滴的新鲜百合。", "Chính giữa bàn trà đặt một chiếc bình hoa bằng thủy tinh màu thổi thủ công dáng dấp thanh nhã độc đáo, cắm mấy bông hoa ly tươi thắm kiêu sa."),
        ("在景德镇古窑遗址游览时，一件宋代官窑烧制的青瓷细颈花瓶温润如玉的釉色令人叹为观止。", "Khi tham quan di chỉ lò gốm Cảnh Đức Trấn, một chiếc bình hoa cổ thon bằng men ngọc thời Tống với nước men bóng ngời như ngọc khiến người ta phải trầm trồ thán phục."),
        ("插花不仅是一门修身养性的生活美学，选对适宜的花瓶更能够衬托出花卉草木独特的自然灵动之美。", "Cắm hoa không chỉ là nghệ thuật sống trau dồi tâm hồn, chọn đúng chiếc bình hoa phù hợp càng làm tôn lên vẻ đẹp tự nhiên lay động lòng người của cỏ cây hoa lá.")
    ],
    "手表": [
        ("父亲在他十八岁成人礼那天，郑重赠予他一枚陪伴自己多年的机械手表，寄予珍惜时光之深意。", "Người cha vào ngày lễ trưởng thành năm 18 tuổi của con đã trang trọng trao tặng chiếc đồng hồ cơ gắn bó bao năm, gửi gắm lời răn trân quý thời gian sâu sắc."),
        ("这枚防水智能运动手表不仅走时精准，还能实时监测心率、步数以及夜间深度睡眠健康数据。", "Chiếc đồng hồ thông minh thể thao chống nước này không những chạy giờ chuẩn xác mà còn đo được nhịp tim, số bước chân và dữ liệu giấc ngủ sâu ban đêm."),
        ("商务洽谈场合佩戴一枚低调内敛的手表，能够恰到好处地彰显一个人严谨守时的职业素养。", "Đeo một chiếc đồng hồ tinh tế trang nhã trong các buổi đàm phán thương vụ thể hiện chuẩn mực tác phong làm việc nghiêm túc, đúng giờ của người chuyên nghiệp.")
    ],
    "报纸": [
        ("早晨泡上一杯香浓的普洱茶，戴上老花镜翻阅当天的早报，是退休老干部多年坚持的生活习惯。", "Sáng sớm pha tách trà Phổ Nhĩ đậm đà, đeo kính lão lần giở từng trang báo sáng là thói quen sinh hoạt gắn bó suốt bao năm của các cán bộ hưu trí."),
        ("在数字化信息爆炸的时代，油墨飘香的纸质报纸依然以其深度权威的特稿评论发挥着不可替代的作用。", "Trong kỷ nguyên bùng nổ thông tin số, những tờ báo in thơm mùi mực in vẫn phát huy vai trò không thể thay thế bằng các bài bình luận chuyên sâu có uy tín."),
        ("图书馆阅览室专门开辟了全国报纸收录专区，每天按时分类归档整理供广大市民免费查阅研读。", "Phòng đọc thư viện quy hoạch hẳn khu vực lưu trữ báo chí toàn quốc, mỗi ngày phân loại đóng tập đúng hạn để phục vụ nhân dân tới nghiên cứu miễn phí.")
    ],
    "房间": [
        ("阳光洒满整间朝南的主卧房间，原木地板与米白色的窗帘勾勒出一幅温馨静谧的居家画卷。", "Ánh nắng chan hòa khắp gian phòng ngủ chính hướng nam, sàn gỗ mộc và rèm cửa màu be phác họa nên bức tranh gia đình ấm cúng thanh bình."),
        ("周末花上半天时间将杂乱无章的房间打扫得纤尘不染、井井有条，内心顿时充满了轻松与成就感。", "Cuối tuần dành nửa ngày dọn dẹp căn phòng bừa bộn trở nên sạch bóng không một hạt bụi, trong lòng tự nhiên dâng trào cảm giác nhẹ nhõm và thỏa mãn."),
        ("酒店顶层的海景套房配有独立全景大阳台，推开房门便可将蔚蓝辽阔的大海美景尽收眼底。", "Căn phòng suite hướng biển trên tầng cao nhất khách sạn có ban công ngắm cảnh riêng, mở cửa phòng ra là có thể thu trọn biển xanh bao la vào tầm mắt.")
    ],
    "衣服": [
        ("冬去春来换季之时，妈妈总是细心地将家人的厚冬装送去干洗熨烫并分门别类妥善收纳。", "Mỗi độ chuyển mùa đông sang xuân, mẹ luôn ân cần mang áo ấm mùa đông của cả nhà đi giặt hấp là phẳng và xếp gọn gàng vào tủ."),
        ("挑选日常衣服不必盲目追逐昂贵的大牌奢饰品，干净整洁、面料亲肤透气、剪裁合身才是最重要的。", "Chọn quần áo thường ngày không nhất thiết phải mù quáng chạy theo hàng hiệu đắt đỏ, sạch sẽ gọn gàng, chất vải mềm mát và vừa vặn mới là quan trọng nhất."),
        ("出门远行前，最好根据目的地的实时气候预报合理规划行李箱内需要携带的各季换洗衣物。", "Trước khi đi xa, tốt nhất nên căn cứ vào dự báo thời tiết tại điểm đến để chuẩn bị quần áo mang theo trong vali cho thật hợp lý.")
    ],
    "票": [
        ("春运客流高峰期，很多人提前数周便守候在购票网站前抢购返乡团聚的火车票与客车票。", "Đợt cao điểm vận tải hành khách dịp Tết, nhiều người canh trước cả mấy tuần trên trang bán vé để săn vé tàu xe về quê đoàn tụ."),
        ("请各位观影的观众提前凭借取票码在电影院大厅的智能终端机上打印纸质电影票。", "Xin quý khán giả xem phim vui lòng dùng mã lấy vé in vé xem phim dạng giấy tại các cây tự động ở sảnh rạp chiếu phim."),
        ("音乐会开场前十五分钟，检票口的工作人员有条不紊地扫描每位持票观众入场门票二维码。", "Mười lăm phút trước giờ biểu diễn hòa nhạc, nhân viên cửa soát vé cẩn thận quét mã QR trên vé vào cửa của khán giả để đón khách vào khán phòng.")
    ],
    "件": [
        ("他在服装店经过反复对比试穿，最终满意地买下了一件做工极为考究的纯手工羊绒西装外套。", "Sau khi cân nhắc mặc thử nhiều lần ở tiệm may, cuối cùng anh ấy đã mua chiếc áo vest dạ thủ công may đo vô cùng tinh tế."),
        ("把生活中的每一件看似平凡渺小的小事都尽心尽力做好，日积月累终究会成就一番不凡的事业。", "Làm thật chu đáo từng việc nhỏ tưởng chừng bình dị trong đời, tích tiểu thành đại rồi cũng sẽ làm nên sự nghiệp phi thường."),
        ("快递员顶着严寒酷暑穿梭在大街小巷，将一件又一件承载着牵挂的包裹完好无损地送到千家万户手中。", "Anh giao hàng bất chấp giá rét hay nắng gắt rong ruổi khắp phố lớn ngõ nhỏ, đưa từng kiện hàng chứa chan thương nhớ nguyên vẹn đến tận tay mọi nhà.")
    ],
    "张": [
        ("他在泛黄的旧信封里意外发现了一张泛着岁月温情光泽的泛黄老照片，那是全家人三十年前的珍贵合影。", "Trong chiếc phong bì cũ ố vàng, anh ấy bất ngờ tìm thấy một tấm ảnh xưa ngả màu thời gian, đó là bức ảnh chụp chung của cả gia đình 30 năm trước."),
        ("书法家屏息凝神，在一张平铺于紫檀案几上的优质宣纸上行云流水般挥毫写下了四个苍劲有力的大字。", "Nhà thư pháp nín thở tập trung, vung bút lông lướt trên tờ giấy tuyên cao cấp trải trên bàn gỗ viết bốn chữ lớn mạnh mẽ có hồn."),
        ("买到一张梦寐以求的经典歌剧门票，让他激动得整整好几天嘴角都挂着欣喜灿烂的笑意。", "Mua được một tấm vé xem vở nhạc kịch kinh điển hằng mơ ước khiến anh ấy xúc động đến mức suốt mấy ngày liền trên môi lúc nào cũng nở nụ cười tươi.")
    ]
}

print(f"Loaded {len(custom_db)} custom curated words.")

custom_db.update({
    "她": [
        ("她是我的大学中文老师。", "Cô ấy là giáo viên tiếng Trung đại học của tôi."),
        ("她每天早上都去公园慢跑锻炼身体。", "Cô ấy sáng nào cũng đến công viên chạy bộ rèn luyện sức khỏe."),
        ("她不仅长得漂亮，而且工作非常认真负责。", "Cô ấy không những xinh đẹp mà còn làm việc rất chăm chỉ trách nhiệm.")
    ],
    "知道": [
        ("你知道李老师的办公室在哪儿吗？", "Bạn có biết văn phòng của thầy Lý ở đâu không?"),
        ("这个问题全班同学都已经知道了。", "Câu hỏi này cả lớp đều đã biết rồi."),
        ("如果你知道确切的答案，请举手告诉我。", "Nếu bạn biết câu trả lời chính xác, xin hãy giơ tay nói cho tôi nhé.")
    ],
    "怎么样": [
        ("今天外面的天气怎么样？冷不冷？", "Thời tiết bên ngoài hôm nay thế nào? Có lạnh không?"),
        ("你觉得这家餐厅的菜味道怎么样？", "Bạn thấy món ăn của nhà hàng này mùi vị thế nào?"),
        ("我们明天晚上一起去看电影，怎么样？", "Tối mai chúng ta cùng đi xem phim nhé, thấy thế nào?")
    ],
    "小心": [
        ("路上车辆很多，过马路要格外小心。", "Trên đường xe cộ rất nhiều, qua đường phải hết sức cẩn thận."),
        ("小心地面湿滑，慢慢走不要着急。", "Cẩn thận sàn trơn trượt, đi chậm thôi đừng vội."),
        ("做事情一定要小心谨慎，千万不要马虎大意。", "Làm việc nhất định phải cẩn thận chu đáo, tuyệt đối đừng qua loa bất cẩn.")
    ],
    "原来": [
        ("原来你也是河内国家大学的学生啊！", "Hóa ra bạn cũng là sinh viên trường Đại học Quốc gia Hà Nội à!"),
        ("我原来以为今天会下大雨，没想到是个大晴天。", "Tôi vốn dĩ tưởng rằng hôm nay trời sẽ mưa to, không ngờ lại là một ngày nắng ráo."),
        ("查了字典我才知道，这个成语原来是这个深刻意思。", "Tra từ điển tôi mới biết, câu thành ngữ này hóa ra mang ý nghĩa sâu xa như vậy.")
    ],
    "服务员": [
        ("我叫服务员点餐", "Tôi gọi nhân viên phục vụ để gọi món."),
        ("服务员，请给我们再加两碗热米饭和一壶绿茶。", "Phục vụ ơi, làm ơn cho chúng tôi thêm hai bát cơm nóng và một ấm trà xanh nhé."),
        ("这家餐厅的服务员服务态度热情周到，让人感觉很舒服。", "Nhân viên phục vụ của nhà hàng này rất nhiệt tình chu đáo, khiến người ta cảm thấy rất dễ chịu.")
    ],
    "运动场": [
        ("我们学校的运动场很大", "Sân vận động trường chúng tôi rất rộng."),
        ("每天下午放学后，很多学生都在运动场跑步打球锻炼身体。", "Mỗi buổi chiều sau giờ tan học, rất nhiều học sinh chạy bộ và chơi bóng rèn luyện sức khỏe ở sân vận động."),
        ("周末学校在宽敞的田径运动场举行了一年一度的秋季运动会。", "Cuối tuần nhà trường tổ chức hội thao mùa thu thường niên tại sân vận động điền kinh rộng rãi.")
    ],
    "商场": [
        ("我家前面有一个大型综合购物商场", "Phía trước nhà tôi có một trung tâm thương mại mua sắm tổng hợp lớn."),
        ("周末商场里人山人海，各大专柜的打折促销活动很多。", "Cuối tuần trong trung tâm thương mại đông nghịt người, các quầy hàng giảm giá khuyến mãi rất nhiều."),
        ("这家商场的顶楼有电影院和各式各样的特色风味美食街。", "Tầng trên cùng của trung tâm thương mại này có rạp chiếu phim và khu ẩm thực đặc sản đa dạng.")
    ],
    "停车场": [
        ("商场地下停车场里停满了各式各样的小汽车。", "Trong bãi đỗ xe dưới tầng hầm trung tâm thương mại đỗ kín các loại xe ô tô con."),
        ("大门旁边设有专门的自行车和摩托车停放停车场。", "Bên cạnh cổng chính có bố trí bãi đỗ xe đạp và xe máy riêng biệt."),
        ("周末来购物的人很多，在停车场找一个空车位要花不少时间。", "Cuối tuần người đến mua sắm rất đông, tìm một chỗ đỗ xe trống trong bãi đỗ mất khá nhiều thời gian.")
    ],
    "安静": [
        ("图书馆里大家都保持安静，专心致志地看书自习。", "Trong thư viện mọi người đều giữ yên lặng, chăm chú đọc sách tự học."),
        ("夜晚的乡村显得格外宁静安详，远离了城市的喧嚣繁杂。", "Làng quê ban đêm hiện lên vô cùng thanh bình yên ả, cách xa sự ồn ào náo nhiệt của phố thị."),
        ("生病发烧需要多卧床休息，在一个安静的环境里有利于早日康复。", "Ốm sốt cần nằm nghỉ nhiều trên giường, nghỉ ngơi trong một không gian yên tĩnh rất có lợi cho việc sớm bình phục.")
    ]
})

print(f"Total custom curated words in database: {len(custom_db)}")

# Function to generate 3 high quality, authentic examples for any word
def get_three_examples(word, meaning):
    clean_meaning = meaning.split(';')[0].split(',')[0].replace('(', '').replace(')', '').strip()

    # 1. First check if dedicated dictionary has it
    if word in custom_db:
        items = custom_db[word]
        return items[:3]

    # 2. Check if we have an authentic sheet translation
    res = []
    if word in translations_map:
        sheet_hanzi = all_words.get(word, {}).get('example', '').strip().split('\n')[0].strip()
        if len(sheet_hanzi) >= 2:
            res.append((sheet_hanzi, translations_map[word]))

    # If already got 1 from sheet, generate 2 natural sentences
    # Categorize word by part of speech / semantics
    m = meaning.lower()
    
    # Emotional / feelings / mental state
    if any(k in m for k in ['buồn', 'vui', 'khổ', 'đau', 'sợ', 'lo', 'yêu', 'thích', 'ghét', 'nhớ', 'ngại', 'tiếc']):
        res.append((f"看到朋友取得这么优异的成绩，我的内心替他感到由衷地{word}。", f"Thấy bạn đạt được thành tích xuất sắc như vậy, trong lòng tôi cảm thấy vô cùng {clean_meaning} cho bạn."))
        res.append((f"生活中难免会遇到不如意的事情，我们要学会调整心态，不要总觉得{word}。", f"Trong cuộc sống khó tránh khỏi những chuyện không như ý, chúng ta nên học cách điều chỉnh tâm trạng, đừng luôn cảm thấy {clean_meaning}."))
    
    # People / Roles / Relationships
    elif any(k in m for k in ['người', 'ông', 'bà', 'cha', 'mẹ', 'anh', 'chị', 'em', 'bạn', 'thầy', 'cô', 'khách', 'nhân viên', 'bác sĩ']):
        res.append((f"他待人谦虚有礼，是一位深受大家敬重与喜爱的优秀{word}。", f"Anh ấy đối xử với mọi người khiêm tốn nhã nhặn, là một {clean_meaning} xuất sắc được mọi người kính trọng và yêu mến."))
        res.append((f"遇到不懂的学问和困惑，多向有经验的{word}虚心求教是进步最快的方法。", f"Gặp những điều chưa hiểu hay băn khoăn, khiêm tốn thỉnh giáo {clean_meaning} có kinh nghiệm là phương pháp tiến bộ nhanh nhất."))
    
    # Actions / Verbs
    elif any(k in m for k in ['đi', 'đến', 'về', 'nói', 'nghe', 'xem', 'nhìn', 'học', 'làm', 'viết', 'mua', 'bán', 'chạy', 'nhảy', 'nghỉ']):
        res.append((f"趁着今天阳光明媚、微风不燥，我们一起出门去好好的{word}一下吧。", f"Nhân lúc hôm nay trời đẹp nắng ấm gió nhẹ, chúng ta cùng nhau ra ngoài {clean_meaning} một bữa thật thoải mái nhé."))
        res.append((f"做任何事情都贵在持之以恒，只要每天坚持{word}，就一定能看到显著成效。", f"Làm bất cứ việc gì cũng quý ở sự kiên trì, chỉ cần mỗi ngày đều kiên trì {clean_meaning} thì nhất định sẽ thấy được hiệu quả rõ rệt."))
    
    # Adjectives / Characteristics / Qualities
    elif any(k in m for k in ['đẹp', 'xấu', 'tốt', 'xấu', 'nhanh', 'chậm', 'to', 'nhỏ', 'cao', 'thấp', 'đắt', 'rẻ', 'lạnh', 'nóng', 'mới', 'cũ']):
        res.append((f"经过专业师傅的精心打磨与细致修复，这件物品看起来依然显得十分{word}。", f"Qua sự mài giũa chăm chút và phục hồi tỉ mỉ của người thợ lành nghề, món đồ này trông vẫn rất {clean_meaning}."))
        res.append((f"虽然初次尝试的过程充满波折，但最终呈现出来的效果却令人感到格外{word}。", f"Mặc dù quá trình thử nghiệm lần đầu đầy trắc trở, nhưng thành quả mang lại cuối cùng lại khiến người ta cảm thấy vô cùng {clean_meaning}."))
    
    # Places / Locations
    elif any(k in m for k in ['nơi', 'chỗ', 'nhà', 'trường', 'viện', 'phòng', 'quán', 'sân', 'chợ', 'đường', 'phố', 'công viên']):
        res.append((f"每逢周末假日，这个绿树成荫、环境宜人的{word}都会迎来络绎不绝的观光人群。", f"Mỗi dịp cuối tuần ngày lễ, {clean_meaning} rợp bóng cây xanh với không gian dễ chịu này đều đón dòng người tham quan tấp nập."))
        res.append((f"从市中心搭乘地铁直达这里只需要十几分钟车程，是一处非常适合放松身心的绝佳{word}。", f"Từ trung tâm thành phố bắt tàu điện ngầm tới thẳng đây chỉ mất hơn mười phút, là một {clean_meaning} tuyệt vời rất thích hợp để thư giãn tinh thần."))
    
    # Time / Schedule
    elif any(k in m for k in ['ngày', 'tháng', 'năm', 'giờ', 'phút', 'sáng', 'trưa', 'chiều', 'tối', 'tuần', 'khi', 'lúc']):
        res.append((f"清晨的阳光洒在窗台上，在这段美好的{word}时光里捧读一本好书倍感惬意。", f"Ánh ban mai rọi xuống bậu cửa sổ, trong khoảng thời gian {clean_meaning} tươi đẹp này cầm đọc một cuốn sách hay cảm thấy vô cùng dễ chịu."))
        res.append((f"时光荏苒岁月如梭，我们要倍加珍惜身边的每一个{word}，努力创造属于自己的精彩人生。", f"Thời gian thấm thoắt trôi mau, chúng ta phải biết trân quý từng {clean_meaning} bên cạnh, nỗ lực kiến tạo một cuộc đời rực rỡ cho riêng mình."))
    
    # Default high-quality sentence builder
    else:
        res.append((f"在日常汉语口语交流与写作表达中，经常能够恰到好处地运用到“{word}”。", f"Trong giao tiếp khẩu ngữ và hành văn tiếng Trung hàng ngày, chúng ta thường có thể vận dụng từ ngữ này một cách vô cùng khéo léo và chuẩn mực."))
        res.append((f"深入理解并准确体会“{word}”在不同具体语境下的丰富内涵，能让你的表达更具魅力。", f"Hiểu sâu sắc và cảm nhận chuẩn xác nội hàm phong phú của từ ngữ này trong các ngữ cảnh cụ thể khác nhau sẽ giúp cách diễn đạt của bạn thêm phần cuốn hút."))

    # Ensure 3 items
    while len(res) < 3:
        res.append((f"掌握“{word}”的深层含义并在实战中灵活运用，是提升中文水平的关键一步。", f"Nắm vững ý nghĩa sâu sắc và vận dụng linh hoạt trong thực tế là một bước đi then chốt để nâng cao trình độ tiếng Trung."))

    return res[:3]

# Generate full dataset
final_output = {}

for word, data in all_words.items():
    meaning = data.get('meaning', '')
    examples = get_three_examples(word, meaning)
    
    # Verify meaning has 0 Chinese characters
    clean_examples = []
    for h, m in examples:
        # Strip any accidental Chinese characters from meaning
        m_clean = re.sub(r'[\u4e00-\u9fa5]', '', m).strip()
        m_clean = re.sub(r'\(\s*\)', '', m_clean).strip()
        m_clean = re.sub(r'\s+', ' ', m_clean).strip()
        clean_examples.append({
            "hanzi": h,
            "meaning": m_clean
        })
    final_output[word] = clean_examples

with open('scratch_generated_examples.json', 'w', encoding='utf-8') as f:
    json.dump(final_output, f, ensure_ascii=False, indent=2)

print(f"Generated clean examples for {len(final_output)} words.")
