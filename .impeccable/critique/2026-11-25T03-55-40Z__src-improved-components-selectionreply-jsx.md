---
target: nút Hỏi GeoAgent khi bôi đen + khung trích dẫn
total_score: 18
max_score: 32
na_heuristics: 9,10
p0_count: 0
p1_count: 2
target_identity: "file:c:\\Users\\admin\\Desktop\\Collection\\src\\improved\\components\\SelectionReply.jsx"
target_fingerprint: "sha256:3427578168c38378646f81197041a138b0ad350e1235f683855bab571961868f"
target_path: "c:\\Users\\admin\\Desktop\\Collection\\src\\improved\\components\\SelectionReply.jsx"
timestamp: 2026-11-25T03-55-40Z
slug: src-improved-components-selectionreply-jsx
---
# Critique: nút "Hỏi GeoAgent" khi bôi đen + khung trích dẫn (Composer, tin đã gửi)
Method: dual-agent (A design review · B detector + browser)

Heuristics: H1 3, H2 2, H3 3, H4 2, H5 2, H6 2, H7 2, H8 2, H9 n/a, H10 n/a → 18/32 (56%, Acceptable)

Specificity: đúng mẫu Gemini, chưa có dấu ấn GeoAgent (nút như chrome trình duyệt, khung trích "thẻ xám + sọc"). Token đúng, có bản tối.
Detector: side-tab Composer.jsx:69 (thật); overlay: nested-cards ở khung trích, line-length ~86 ký tự; dark-glow trên dialog đóng = báo nhầm.

Priority issues:
- [P1] Nút đặt last.bottom+8 (SelectionReply.jsx:79) đè lên dòng/tiêu đề/link sau vùng chọn. Fix: đặt phía trên dòng đầu, xuống dưới khi hết chỗ; điện thoại luôn phía trên; đo bề rộng thật (156 vs đoán 148). → layout
- [P1] Trích cả câu trả lời (toQuote) ra chuỗi ô bảng vô nghĩa. Fix: loại trích dẫn; cả câu trả lời hiện nhãn "Trả lời: <tiêu đề/chủ đề>", nội dung đầy đủ gửi riêng cho AI; tin đã gửi theo cùng quy tắc. → clarify
- [P2] Tối: nền nút = nền thẻ (1.00:1), viền 1.44:1, bóng vô hình; vạch trích ember-600/night-800 2.72:1 < 3:1. Fix: nền nút nổi/đảo màu, bóng tối riêng, vạch tối ember-350 hoặc gold. → colorize
- [P2] Khung trích side-tab + nested-cards; vùng bôi đen xanh mặc định. Fix: token selection (vàng nhạt) trong câu trả lời; khung trích bỏ sọc hoặc bỏ bo trái. → polish
- [P2] Nhãn "Hỏi GeoAgent" trùng placeholder, nghe như gửi ngay. Fix: "Hỏi về đoạn này"/"Trích dẫn để hỏi" + dấu hiệu thương hiệu. → clarify

Personas: Alex (không trích nhiều đoạn, không phím tắt, nút che phần chọn tiếp); Sam (nút không được báo, xa trong thứ tự tab, không trích đoạn bằng bàn phím); Casey (nút trùng chỗ tay cầm/menu hệ thống, che 2 dòng ở 375px, vòng icon vuốt 1.06:1, không gợi ý vuốt).

Minor: khung trích ô soạn có nền, tin đã gửi không; nút ✕ dùng token composer; khung trích đẩy ô soạn sát hàng nút ở 700px; cỡ chạm 40px chưa kiểm chứng.

Questions: bỏ/đổi nút trả lời cả câu? hành động riêng cho số liệu & căn cứ pháp lý? dùng chung vàng nhấn cho vùng chọn + nút + khung trích?
