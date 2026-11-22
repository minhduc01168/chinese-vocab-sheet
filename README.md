# Hán Tự Review - Web App Ôn Tập Từ Vựng Tiếng Trung Từ Google Sheet

Ứng dụng web hiện đại, tối giản giúp bạn ôn tập từ vựng tiếng Trung, luyện trí nhớ mặt chữ và phản xạ gõ chữ Hán (Hanzi) đồng bộ trực tiếp từ Google Sheet cá nhân mà không cần backend hay cơ sở dữ liệu phức tạp.

---

## 🌟 Tính Năng Nổi Bật

1. **Không Cần Backend (100% Client-Side):**
   - Đọc dữ liệu trực tiếp từ Google Sheet qua Google Visualization API (GViz CSV).
   - Tự động đồng bộ từ mới khi bạn cập nhật trên Google Sheet mà không cần deploy lại web.
   - Hỗ trợ chế độ Offline / Lưu đệm cục bộ (Local Cache) đảm bảo việc học không bao giờ bị gián đoạn.

2. **Xử Lý Bộ Gõ Chữ Hán (IME Composition Safe):**
   - Kiểm tra chặt chẽ `isComposing` và `keyCode === 229` đảm bảo khi bạn gõ Pinyin và bấm `Enter` để chọn chữ Hán từ khung gợi ý (macOS, Windows, Sogou), hệ thống **không** bị nộp bài nhầm hay báo sai.

3. **Chuẩn Hóa & Đa Đáp Án Thông Minh:**
   - Tự động bỏ qua khoảng trắng thừa và toàn bộ dấu câu (tiếng Trung lẫn tiếng Anh).
   - Hỗ trợ nhiều đáp án đồng nghĩa ngăn cách bởi `/`, `;`, `,` (ví dụ: `谢谢 / 多谢`). Bạn gõ đáp án nào cũng được tính là đúng.

4. **Phát Âm Chuẩn Xác (Web Speech API):**
   - Tự động phát âm tiếng Trung (`zh-CN`) ngay khi trả lời đúng.
   - Cơ chế hủy hàng đợi âm thanh (`cancel queue`) chống nghẽn hoặc chồng lặp khi bấm nghe lại nhiều lần.
   - Nút chỉnh tốc độ đọc linh hoạt (`0.75x`, `1.0x`, `1.25x`) và ưu tiên các gói giọng chuẩn như *Google 普通话*, *Microsoft Xiaoxiao*, *Tingting*.

5. **Gợi Ý Đa Cấp Độ (Hint System):**
   - **Bấm 1:** Hiện phiên âm Pinyin có thanh điệu chuẩn.
   - **Bấm 2:** Hiện số lượng ký tự chữ Hán (ví dụ: `— —`).
   - **Bấm 3:** Xem đáp án đầy đủ.

6. **Đa Nền Tảng (Responsive):**
   - **Máy tính (Desktop):** Tối ưu hệ thống phím tắt nhanh (`Enter`, `Ctrl + Space`, `Alt + →`, `Alt + ←`).
   - **Điện thoại & iPad / Máy tính bảng:** Bố cục tối ưu thao tác chạm, tự động co giãn không bị che khuất khi bàn phím ảo hiển thị.

7. **Chia Sẻ Dễ Dàng:**
   - Hỗ trợ URL tham số `?sheet={SHEET_ID}&gid={GID}`. Bấm nút sao chép link là có thể gửi cho bạn bè cùng học ngay bộ từ vựng của bạn.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### Yêu cầu:
- Node.js >= 18.0.0
- npm hoặc pnpm / yarn

```bash
# Cài đặt thư viện
npm install

# Khởi chạy môi trường phát triển (Dev Server)
npm run dev

# Đóng gói sản phẩm (Build for Production)
npm run build
```

---

## 📊 Cấu Trúc Bảng Google Sheet (Data Contract)

Dòng 1 trong bảng Google Sheet là tiêu đề cột. Hệ thống hỗ trợ nhận diện linh hoạt không phân biệt hoa thường:

| Tên Cột Đề Xuất | Bắt Buộc | Mô Tả |
| --- | :---: | --- |
| `汉字` / `hanzi` / `Chữ Hán` | **Có** | Từ vựng chữ Hán. Hỗ trợ nhiều từ cách nhau bởi `/` |
| `越南语意思` / `meaning` / `Nghĩa` | **Có** | Nghĩa tiếng Việt hiển thị làm đề bài |
| `拼音` / `pinyin` / `Phiên âm` | Không | Phiên âm Pinyin. Nếu trống, hệ thống tự sinh tự động qua `pinyin-pro` |
| `汉越音` / `sinoVietnamese` | Không | Âm Hán Việt (ví dụ: `ngã`, `nhĩ`, `tạ tạ`) |
| `例如` / `example` / `Ví dụ` | Không | Câu ví dụ thực tế kèm tính năng nghe câu mẫu |
| `note` / `Ghi chú` / `Từ loại` | Không | Ghi chú thêm dưới nghĩa tiếng Việt |

> **Lưu ý quan trọng về quyền xem:**
> File Google Sheet cần được bật quyền chia sẻ: **"Bất kỳ ai có đường liên kết đều có thể xem"** (Anyone with the link can view).

---

## ⌨️ Bảng Phím Tắt (Desktop)

| Phím Tắt | Chức Năng |
| --- | --- |
| `Enter` | Kiểm tra đáp án (khi đang gõ) / Chuyển sang từ tiếp theo (khi đã đúng/xem đáp án) |
| `Ctrl + Space` | Nghe lại phát âm từ vựng |
| `Alt + →` hoặc `Tab` | Bỏ qua từ vựng hiện tại |
| `Alt + ←` | Quay lại từ vựng liền trước |

---

## 🌐 Triển Khai Lên Vercel / GitHub Pages

### Triển khai lên Vercel (1 Click)
1. Đẩy mã nguồn lên GitHub.
2. Truy cập [vercel.com](https://vercel.com) &rarr; Import repository.
3. Framework preset: **Vite**, Root Directory: `./`.
4. Bấm **Deploy**.

### Triển khai lên GitHub Pages
1. Trong file `vite.config.ts`, `base: './'` đã được cấu hình sẵn.
2. Chạy lệnh: `npm run build`
3. Thư mục `dist/` chứa toàn bộ static files sẵn sàng deploy lên GitHub Pages hoặc bất kỳ hosting tĩnh nào.
