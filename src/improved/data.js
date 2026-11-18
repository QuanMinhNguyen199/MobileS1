// Dữ liệu mẫu để dựng giao diện. Số liệu thuế lấy theo ảnh chụp tham chiếu, không phải dữ liệu thật.
// Tin trả lời dùng khối có cấu trúc; **chữ đậm** được hỗ trợ trong p/li.
export const CONVERSATIONS = [
  {
    id: "tet-multi",
    name: "Tét Multi",
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
        ],
      },
    ],
  },
  {
    id: "phong-ke-toan",
    name: "Phòng Kế toán",
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
  { key: "contact", label: "Liên hệ" },
  { key: "room", label: "Phòng" },
  { key: "favorite", label: "Yêu thích" },
];
