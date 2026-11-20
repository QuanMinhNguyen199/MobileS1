import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon, InfoIcon } from "../icons.jsx";

// Chân câu trả lời của trợ lý: lưu ý kiểm tra và thao tác sao chép / tải bảng.
// Câu trả lời có số liệu (bảng) hoặc dẫn link mới hiện lưu ý (link đã nằm ngay trong câu trả lời); sao chép luôn có.
const LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
const plain = (text) => text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(LINK, "$1 ($2)");

// Câu trả lời có dẫn link (văn bản pháp luật, bài viết) thì cũng cần lưu ý kiểm tra
const hasLink = (blocks) => blocks.some((b) => [b.text, ...(b.items ?? [])].some((t) => t && /\[[^\]]+\]\(https?:\/\//.test(t)));

// Văn bản thuần để dán vào email / Word: bảng tách cột bằng Tab (dán vào Excel thành ô)
const toText = (blocks) =>
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

// CSV cho Excel: BOM UTF-8 để giữ dấu tiếng Việt, mỗi bảng có tên mục phía trên
const toCsv = (blocks) => {
  const cell = (v) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const out = [];
  let heading = "";
  for (const b of blocks) {
    if (b.type === "h") heading = b.text;
    if (b.type !== "table") continue;
    if (out.length) out.push("");
    if (heading) out.push(cell(heading));
    for (const r of [b.head, ...b.rows]) out.push(r.map(cell).join(","));
  }
  return "﻿" + out.join("\r\n");
};

// Nút chỉ có icon: tên đọc qua aria-label, rê chuột thấy tooltip (title)
const btn =
  "grid size-9 place-items-center rounded-full text-icon-button-icon transition-colors hover:bg-icon-button-bg-hover hover:text-icon-button-icon-hover focus-visible:outline-2 focus-visible:outline-focus-ring motion-reduce:transition-none pointer-coarse:size-11 [&_svg]:size-5";

export default function AnswerFooter({ blocks, title }) {
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(null); // nút vừa thao tác xong: đổi icon thành dấu tích một lúc
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const hasTable = blocks.some((b) => b.type === "table");
  const substantive = hasTable || hasLink(blocks);

  const say = (text, which = null) => {
    setStatus(text);
    setDone(which);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setStatus(""); setDone(null); }, 2000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toText(blocks));
      say("Đã sao chép câu trả lời", "copy");
    } catch {
      say("Không sao chép được. Hãy chọn và sao chép thủ công.");
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([toCsv(blocks)], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${(title || "GeoAgent").replace(/[\\/:*?"<>|]/g, "-").slice(0, 80)}.csv` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say("Đã tải bảng xuống (CSV, mở được bằng Excel)", "csv");
  };

  return (
    <div className="mt-2 flex flex-col gap-1.5 px-1">
      {substantive && (
        <div className="flex flex-col gap-1 text-xs text-answer-meta">
          <p className="m-0 flex items-start gap-1.5 text-pretty">
            <InfoIcon size={14} className="mt-px shrink-0" />
            GeoAgent có thể sai. Kiểm tra lại với văn bản gốc trước khi kê khai.
          </p>
        </div>
      )}
      <div className="-ml-2 flex items-center gap-0.5">
        <button type="button" onClick={copy} aria-label="Sao chép câu trả lời" title="Sao chép" className={btn}>
          {done === "copy" ? <CheckIcon /> : <CopyIcon />}
        </button>
        {hasTable && (
          <button type="button" onClick={download} aria-label="Tải bảng xuống (CSV, mở bằng Excel)" title="Tải bảng (CSV)" className={btn}>
            {done === "csv" ? <CheckIcon /> : <DownloadIcon />}
          </button>
        )}
        {/* Kết quả thao tác: trình đọc màn hình đọc, mắt thấy qua dấu tích trên nút */}
        <span role="status" className="sr-only">{status}</span>
      </div>
    </div>
  );
}
