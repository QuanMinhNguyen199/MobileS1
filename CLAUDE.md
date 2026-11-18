# Điều phối skill thiết kế frontend

## Phiên bản giao diện

- `src/improved/` là **bản chính**, app chỉ chạy bản này (`src/Shell.jsx`). Mọi thay đổi giao diện đưa vào đây.
- `src/original/` là bản gốc cũ, không còn chạy; giữ lại để tham chiếu, không sửa.
- CSS và token của bản chính viết dưới `:root[data-variant="improved"]` trong `src/index.css`
  (`Shell.jsx` luôn gắn `data-variant="improved"`).
- Thanh cuộn: không hiện trên điện thoại; trên máy tính chỉ hiện khi người dùng
  đang cuộn và ẩn sau khi dừng (`src/improved/scrollbars.js` + CSS trong `index.css`).
  Vùng cuộn mới không tự đặt lại kiểu thanh cuộn.

## Nguyên tắc

- Đọc hướng dẫn dự án, PRODUCT.md, DESIGN.md và giao diện hiện có
  trước khi đề xuất thay đổi.
- Phân biệt: bằng chứng / diễn giải / giả định / đề xuất.
- Chốt nhiệm vụ người dùng, flow, cấu trúc thông tin và các trạng thái
  trước khi chọn hướng thị giác.
- Chỉ gọi skill liên quan đến công việc hiện tại.
- Đọc SKILL.md của skill được gọi; tài liệu này phân vai,
  không thay thế hướng dẫn sử dụng skill.

## Phân công

### Impeccable — UX và chất lượng tổng thể

Dùng để:
- Shape: xác định nhiệm vụ, flow, phân cấp thông tin và trạng thái.
- Critique: đánh giá mức độ dễ hiểu và dễ sử dụng.
- Audit/harden: kiểm tra accessibility, responsive và edge cases.
- Polish: hoàn thiện tính nhất quán và chi tiết.

Kết quả cần có:
- Cấu trúc và hành vi của giao diện.
- Vấn đề cần sửa, mức ưu tiên và tiêu chí nghiệm thu.

Giữ nguyên hướng thị giác đã duyệt nếu yêu cầu chỉ là refinement.

### Taste — Hướng thị giác

Dùng khi cần tạo mới, redesign hoặc giải quyết vấn đề thị giác.

Phụ trách:
- Concept gắn với nội dung và đặc điểm riêng của sản phẩm.
- Composition, typography, palette, imagery và nhịp điệu bố cục.
- Kiểm tra kết quả thị giác trên trình duyệt.

Phân biệt trang được đọc/cuộn với màn hình dùng để làm việc;
chọn đúng workflow của skill.

Kế thừa thương hiệu, token và component hiện có.
Chỉ đề xuất hướng thay thế khi phạm vi công việc cho phép.
Không tự loại bỏ thành phần có chức năng chỉ vì coi là trang trí.

### Modern Web Guidance — Triển khai nền web

Tra cứu trước khi viết hoặc sửa HTML, CSS và JavaScript phía client.

Phụ trách:
- Semantic HTML, native controls và API phù hợp.
- Accessibility, responsive, browser support và fallback.
- Các yêu cầu kỹ thuật về hiệu năng và tương tác.

Mỗi truy vấn tập trung vào một khả năng hoặc UI pattern.
Khuyến nghị kỹ thuật không được tự mở rộng phạm vi sản phẩm.

Không cần chạy cho công việc chỉ lập kế hoạch hoặc bàn hướng thiết kế,
chưa triển khai web.

### Motion — Chuyển động

Dùng khi công việc có animation hoặc cần xử lý animation hiện có.

Trước khi triển khai, nêu mục đích:
- Phản hồi thao tác.
- Làm rõ thay đổi trạng thái hoặc quan hệ không gian.
- Hướng sự chú ý.
- Biểu đạt thương hiệu theo brief.

Phụ trách:
- Trigger, timing, easing, choreography và gián đoạn chuyển động.
- Chọn CSS hoặc thư viện phù hợp với yêu cầu và stack hiện có.
- Reduced motion và hiệu năng.

Không tự cài Motion hoặc thêm hiệu ứng khi không có nhu cầu rõ ràng.

## Trình tự làm việc

1. Đọc bối cảnh và ghi nhận điều chưa biết.
2. Impeccable: xác định flow, thông tin và trạng thái.
3. Taste: chọn hoặc kế thừa hướng thị giác.
4. Trước khi code: tra Modern Web Guidance theo các pattern cần làm.
5. Triển khai; gọi Motion nếu có chuyển động.
6. Kiểm chứng chung bằng trình duyệt:
   - Taste kiểm tra thị giác.
   - Impeccable kiểm tra UX và chất lượng.
   - Modern Web Guidance đối chiếu cách triển khai.
   - Motion kiểm tra chuyển động nếu có.

Đây là trình tự cho công việc đầy đủ.
Với thay đổi nhỏ, chỉ thực hiện những bước liên quan.

## Xử lý xung đột

Ưu tiên:
1. Ràng buộc sản phẩm và bằng chứng đã xác nhận.
2. Yêu cầu người dùng/business.
3. Logic UX, accessibility và khả năng hoàn thành nhiệm vụ.
4. Token và hướng thương hiệu đã duyệt.
5. Khuyến nghị của skill.

Trong phạm vi còn lại:
- Cấu trúc và hành vi: Impeccable phụ trách chính.
- Hướng thị giác: Taste phụ trách chính.
- API, browser support và fallback: Modern Web Guidance.
- Cách triển khai chuyển động: Motion.

Nếu khuyến nghị kỹ thuật khiến phương án không khả thi,
điều chỉnh phương án và giải thích đánh đổi.

## Kiểm chứng và bàn giao

Gộp kiểm tra của các skill vào một đợt desktop/mobile.
Sửa theo lô; xác nhận lại tối đa một đợt.
Không chạy các vòng polish riêng nối tiếp cho từng skill.

Mức tối thiểu:
- Responsive tới 375px, không cuộn ngang.
- Focus bàn phím nhìn thấy được.
- Tương phản chữ tối thiểu 4.5:1.
- Tôn trọng prefers-reduced-motion.
- Chữ tiếng Việt có dấu không bị cắt.
- Kiểm tra trạng thái rỗng, lỗi và đang tải khi áp dụng.

Bàn giao: quyết định đã thực hiện, cách kiểm chứng,
và phần chưa xác nhận. Không gọi kiểm tra heuristic
là kết quả thử nghiệm với người dùng.
