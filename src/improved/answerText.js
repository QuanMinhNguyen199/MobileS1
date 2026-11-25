// Chuyển câu trả lời có cấu trúc (blocks) thành chữ thường: dùng cho sao chép và trích dẫn khi trả lời.
export const LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
export const plain = (text) => text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(LINK, "$1 ($2)");

// Văn bản thuần để dán vào email / Word: bảng tách cột bằng Tab (dán vào Excel thành ô)
export const toText = (blocks) =>
  blocks
    .map((b) => {
      if (b.type === "table") return [b.head, ...b.rows].map((r) => r.join("\t")).join("\n");
      if (b.type === "ul") return b.items.map((i) => `• ${plain(i)}`).join("\n");
      if (b.type === "hr") return "";
      return plain(b.text ?? "");
    })
    .filter((s, i, a) => s !== "" || a[i - 1] !== "")
    .join("\n\n")
    .trim();

// Trích dẫn cả câu trả lời: bỏ link trong ngoặc, gộp khoảng trắng cho gọn
export const toQuote = (blocks) =>
  blocks
    .map((b) => {
      const strip = (t) => t.replace(/\*\*([^*]+)\*\*/g, "$1").replace(LINK, "$1");
      if (b.type === "table") return [b.head, ...b.rows].map((r) => r.join(" ")).join(" · ");
      if (b.type === "ul") return b.items.map(strip).join(" · ");
      return strip(b.text ?? "");
    })
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
