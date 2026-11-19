import { ExternalLinkIcon } from "../icons.jsx";

// Hiển thị câu trả lời có cấu trúc, không dùng innerHTML. Trong đoạn văn hỗ trợ **đậm** và [link](https://…).
// Chỉ nhận link http(s); link khác hiện như chữ thường.
const LINK = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/;
function Rich({ text, onOpenLink, linkPreviewMode }) {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-content-strong">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = part.match(LINK);
    if (link) {
      const [, label, url] = link;
      // Mobile mở vùng web cạnh chat; desktop mở modal. Ctrl/⌘/giữa chuột vẫn mở tab mới.
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-haspopup={onOpenLink && linkPreviewMode !== "panel" ? "dialog" : undefined}
          aria-controls={onOpenLink && linkPreviewMode === "panel" ? "mobile-web-panel" : undefined}
          onClick={(e) => {
            if (!onOpenLink || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            onOpenLink({ label, url }, e.currentTarget);
          }}
          className="rounded-sm font-medium text-content-link underline decoration-1 underline-offset-[3px] hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {label}
          <ExternalLinkIcon size={14} className="ml-0.5 inline-block align-[-2px]" />
        </a>
      );
    }
    return part;
  });
}

// Bảng chỉ dùng đường kẻ ngang; cột số căn phải, chữ số đều nhau
function DataTable({ head, rows, label }) {
  return (
    <div tabIndex={0} role="region" aria-label={label ? `Bảng: ${label}` : "Bảng dữ liệu"} className="mb-4 max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-focus-ring">
      <table className="border-collapse text-sm tabular-nums">
        <thead>
          <tr>
            {head.map((h, c) => (
              <th
                key={h}
                scope="col"
                className={`border-b border-table-head-border px-3 pt-0.5 pb-1.5 text-xs font-medium whitespace-nowrap text-table-head-text first:pl-0 ${c === 0 ? "text-left" : "text-right"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) =>
                c === 0 ? (
                  <th key={c} scope="row" className="border-b border-table-row-border py-2 pr-6 text-left leading-5 font-normal whitespace-nowrap text-table-cell-text">
                    {cell}
                  </th>
                ) : (
                  <td key={c} className="border-b border-table-row-border px-3 py-2 text-right leading-5 whitespace-nowrap text-table-cell-text last:pr-0">
                    {cell}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MessageContent({ blocks, onOpenLink, linkPreviewMode = "dialog" }) {
  let lastHeading = null;
  return (
    <div className="text-message text-content-text [overflow-wrap:anywhere] [&>*:last-child]:mb-0">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h":
            lastHeading = b.text;
            return (
              <h3 key={i} className="mt-0 mb-2 text-message-heading text-content-text">
                {b.text}
              </h3>
            );
          case "table":
            return <DataTable key={i} head={b.head} rows={b.rows} label={lastHeading} />;
          case "hr":
            return <hr key={i} className="my-5 border-0 border-t border-content-divider" />;
          case "ul":
            return (
              <ul key={i} className="mb-3 list-disc space-y-1 pl-5 marker:text-content-bullet">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Rich text={it} onOpenLink={onOpenLink} linkPreviewMode={linkPreviewMode} />
                  </li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={i} className="mb-3 text-pretty">
                <Rich text={b.text} onOpenLink={onOpenLink} linkPreviewMode={linkPreviewMode} />
              </p>
            );
        }
      })}
    </div>
  );
}
