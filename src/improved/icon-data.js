// GeoAgent Icons: bộ icon của GeoAgent dựng trên Lucide (lucide-react, giấy phép ISC).
// Mỗi icon chức năng trỏ tới một icon Lucide; tên, nhóm và nhãn tiếng Việt là của GeoAgent.
// Riêng "assistant" là dấu hiệu tự vẽ (Lucide không có), cùng kiểu nét: lưới 24 × 24, đầu nét tròn.
// Dùng chung cho component React (icons.jsx) và script xuất SVG (scripts/export-geoagent-icons.mjs).

// Độ dày nét hiển thị (px), giữ nguyên ở mọi cỡ icon. Đổi một chỗ này để chỉnh cả bộ.
export const STROKE = 1.75;

const item = (label, group, lucide) => ({ label, group, lucide });
const p = (d) => ["path", { d }];
const c = (cx, cy, r, dot = false) => ["circle", { cx, cy, r, ...(dot ? { fill: "currentColor", stroke: "none" } : {}) }];
const custom = (label, group, ...nodes) => ({ label, group, nodes });

export const ICON_GROUPS = [
  { id: "navigation", label: "Điều hướng" },
  { id: "conversation", label: "Hội thoại" },
  { id: "compose", label: "Soạn tin" },
  { id: "knowledge", label: "Tài liệu & nguồn" },
  { id: "feedback", label: "Phản hồi & trạng thái" },
];

export const ICONS = {
  menu: item("Mở danh sách", "navigation", "Menu"),
  close: item("Đóng", "navigation", "X"),
  back: item("Quay lại", "navigation", "ArrowLeft"),
  "chevron-down": item("Mở rộng", "navigation", "ChevronDown"),
  "chevron-up": item("Thu gọn", "navigation", "ChevronUp"),
  more: item("Tùy chọn", "navigation", "Ellipsis"),
  phone: item("Xem trên điện thoại", "navigation", "Smartphone"),
  settings: item("Cài đặt", "navigation", "SlidersHorizontal"),
  "sign-in": item("Đăng nhập", "navigation", "LogIn"),
  search: item("Tìm kiếm", "conversation", "Search"),
  chat: item("Hội thoại", "conversation", "MessageSquareText"),
  "new-chat": item("Hội thoại mới", "conversation", "MessageSquarePlus"),
  edit: item("Soạn mới", "conversation", "SquarePen"),
  group: item("Phòng hội thoại", "conversation", "Users"),
  "group-add": item("Thêm thành viên", "conversation", "UserPlus"),
  favorite: item("Yêu thích", "conversation", "Star"),
  assistant: custom(
    "Trợ lý GeoAgent",
    "conversation",
    p("M18.5 5.5A8.5 8.5 0 0 0 4 14.8L3 21l6.2-1a8.5 8.5 0 0 0 11.2-9.5M12 6.5l4 4-4 6-4-6 4-4Z"),
    c(12, 10.5, 1, true),
    p("M19 3v4m-2-2h4")
  ),
  plus: item("Thêm", "compose", "Plus"),
  attach: item("Đính kèm tệp", "compose", "Paperclip"),
  send: item("Gửi tin nhắn", "compose", "ArrowUp"),
  stop: item("Dừng trả lời", "compose", "Square"),
  smile: item("Biểu cảm", "compose", "Smile"),
  microphone: item("Nhập bằng giọng nói", "compose", "Mic"),
  document: item("Tài liệu", "knowledge", "FileText"),
  sources: item("Nguồn tham khảo", "knowledge", "BookOpenText"),
  link: item("Liên kết", "knowledge", "Link"),
  "external-link": item("Mở liên kết ngoài", "knowledge", "ExternalLink"),
  download: item("Tải xuống", "knowledge", "Download"),
  copy: item("Sao chép", "knowledge", "Copy"),
  shield: item("Bảo mật", "knowledge", "ShieldCheck"),
  retry: item("Thử lại", "feedback", "RotateCw"),
  "thumbs-up": item("Hữu ích", "feedback", "ThumbsUp"),
  "thumbs-down": item("Chưa hữu ích", "feedback", "ThumbsDown"),
  info: item("Thông tin", "feedback", "Info"),
  success: item("Thành công", "feedback", "CircleCheck"),
  warning: item("Cảnh báo", "feedback", "TriangleAlert"),
  error: item("Có lỗi", "feedback", "CircleX"),
  check: item("Đã chọn", "feedback", "Check"),
};
