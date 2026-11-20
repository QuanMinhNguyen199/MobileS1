// Dữ liệu mẫu để dựng giao diện. Số liệu thuế lấy theo ảnh chụp tham chiếu, không phải dữ liệu thật.
// Tin trả lời dùng khối có cấu trúc; **chữ đậm** được hỗ trợ trong p/li.
// topic: chủ đề tóm tắt của phiên chat (hiện trong danh sách, kiểu ChatGPT/Gemini). Khi nối API, lấy từ tóm tắt tin đầu tiên.
export const CONVERSATIONS = [
  {
    id: "tet-multi",
    name: "Tét Multi",
    topic: "Phân tích nghĩa vụ thuế 2025 so với 2024",
    bot: true,
    tags: ["room", "favorite"],
    unread: false,
    preview: "Trợ lý GeoAgent: | Ưu tiên | Hành động | Căn cứ pháp lý",
    messages: [
      { id: 1, from: "user", time: "09:12", text: "Phân tích nghĩa vụ thuế năm 2025 và so sánh với 2024." },
      {
        id: 2,
        from: "bot",
        time: "09:12",
        blocks: [
          { type: "h", text: "1. Thuế GTGT" },
          { type: "table", head: ["Chỉ tiêu", "Giá trị"], rows: [["GTGT phải nộp", "0"]] },
          { type: "p", text: "Xem thêm: [Thuế giá trị gia tăng](https://vi.wikipedia.org/wiki/Thu%E1%BA%BF_gi%C3%A1_tr%E1%BB%8B_gia_t%C4%83ng) trên Wikipedia tiếng Việt." },
          { type: "hr" },
          { type: "h", text: "2. Thuế TNDN" },
          {
            type: "table",
            head: ["Chỉ tiêu", "Giá trị"],
            rows: [
              ["Thuế TNDN phải nộp", "3,66 tỷ VNĐ"],
              ["Lợi nhuận kế toán trước thuế", "32,89 tỷ"],
              ["Thu nhập tính thuế", "18,31 tỷ"],
              ["Thuế suất thực tế", "20%"],
            ],
          },
          { type: "p", text: "**Diễn giải**: Thuế TNDN phải nộp 3,66 tỷ tương ứng với thu nhập tính thuế 18,31 tỷ × 20%." },
          { type: "hr" },
          { type: "h", text: "3. Tổng thuế phải nộp cả năm" },
          {
            type: "table",
            head: ["Loại thuế", "Số phải nộp"],
            rows: [["GTGT", "0"], ["TNDN", "3,66 tỷ"], ["TỔNG CỘNG", "3,66 tỷ VNĐ"]],
          },
          { type: "hr" },
          { type: "h", text: "4. So sánh với 2024" },
          {
            type: "table",
            head: ["Loại thuế", "2024", "2025", "Biến động"],
            rows: [
              ["GTGT phải nộp", "0", "0", "—"],
              ["TNDN phải nộp", "5,70 tỷ", "3,66 tỷ", "-36%"],
              ["Tổng thuế", "5,70 tỷ", "3,66 tỷ", "-36%"],
            ],
          },
          { type: "p", text: "**Nhận xét**: Tổng thuế phải nộp **giảm 36%** so với năm trước, trong khi:" },
          { type: "ul", items: ["Doanh thu tăng **525%**", "Lợi nhuận kế toán tăng **11,6%**"] },
          { type: "p", text: "→ Điều này cho thấy các lần điều chỉnh có thể đã **làm giảm nghĩa vụ thuế** đáng kể." },
          { type: "p", text: "**Căn cứ pháp lý**: [Thông tư 80/2021/TT-BTC](https://thuvienphapluat.vn/page/tim-van-ban.aspx?keyword=80%2F2021%2FTT-BTC) hướng dẫn Luật Quản lý thuế về khai thuế và quyết toán thuế." },
        ],
      },
    ],
  },
  {
    id: "phong-ke-toan",
    name: "Phòng Kế toán",
    topic: "Kiểm tra số dư tài khoản 131",
    tags: ["room"],
    unread: true,
    preview: "Bảng đối chiếu công nợ quý III đã sẵn sàng",
    messages: [
      { id: 1, from: "user", time: "08:40", text: "Kiểm tra lại số dư tài khoản 131 giúp tôi." },
      { id: 2, from: "bot", time: "08:41", blocks: [{ type: "p", text: "Đã nhận yêu cầu. Bảng đối chiếu công nợ quý III đang được tổng hợp." }] },
    ],
  },
  {
    id: "ho-tro",
    name: "Hỗ trợ kỹ thuật",
    topic: "Kiểm thử bản cập nhật mới",
    tags: ["contact", "favorite"],
    unread: false,
    preview: "Bản cập nhật sẽ được triển khai chiều nay",
    messages: [
      { id: 1, from: "user", time: "Hôm qua", text: "Bản cập nhật mới đã kiểm thử xong chưa?" },
      { id: 2, from: "bot", time: "Hôm qua", blocks: [{ type: "p", text: "Đã kiểm thử xong. Bản cập nhật sẽ được triển khai chiều nay." }] },
    ],
  },
];

export const FILTERS = [
  { key: "unread", label: "Chưa đọc" },
  { key: "favorite", label: "Yêu thích" },
];

// Bản xem trước của link trong tin nhắn (giả lập, chưa gọi dịch vụ thật). Khóa là URL đầy đủ.
// Link không có ở đây vẫn mở được modal, chỉ hiện tên miền và nút mở link gốc.
// embed: trang có cho nhúng vào iframe không (máy tính hiện trang thật trong modal). Đã kiểm tra header X-Frame-Options / frame-ancestors.
export const LINK_PREVIEWS = {
  "https://thuvienphapluat.vn/page/tim-van-ban.aspx?keyword=80%2F2021%2FTT-BTC": {
    kind: "Văn bản pháp luật",
    embed: false, // thuvienphapluat.vn gửi X-Frame-Options: SAMEORIGIN
    title: "Thông tư 80/2021/TT-BTC hướng dẫn Luật Quản lý thuế",
    summary:
      "Hướng dẫn thi hành một số điều của Luật Quản lý thuế và Nghị định 126/2020/NĐ-CP: hồ sơ khai thuế, thời hạn nộp hồ sơ, quyết toán thuế thu nhập doanh nghiệp và xử lý số tiền thuế nộp thừa.",
    meta: [
      ["Loại văn bản", "Thông tư"],
      ["Cơ quan ban hành", "Bộ Tài chính"],
      ["Hiệu lực", "01/01/2022"],
      ["Liên quan trong câu trả lời", "Quyết toán thuế TNDN năm 2025"],
    ],
  },
  "https://vi.wikipedia.org/wiki/Thu%E1%BA%BF_gi%C3%A1_tr%E1%BB%8B_gia_t%C4%83ng": {
    kind: "Bài viết bách khoa",
    embed: true, // Wikipedia không chặn nhúng
    title: "Thuế giá trị gia tăng",
    summary: "Bài viết Wikipedia tiếng Việt về thuế giá trị gia tăng (GTGT): khái niệm, cách tính trên phần giá trị tăng thêm qua từng khâu và cơ chế khấu trừ thuế đầu vào.",
    meta: [
      ["Nguồn", "Wikipedia tiếng Việt"],
      ["Liên quan trong câu trả lời", "Mục 1. Thuế GTGT"],
    ],
  },
};
