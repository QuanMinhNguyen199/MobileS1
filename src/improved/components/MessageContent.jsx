// Hiển thị câu trả lời có cấu trúc; chỉ hỗ trợ **đậm** trong đoạn văn, không dùng innerHTML.
function Rich({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-bold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

// Bảng chỉ dùng đường kẻ ngang; cột số căn phải, chữ số đều nhau
function DataTable({ head, rows, label }) {
  return (
    <div tabIndex={0} role="region" aria-label={label ? `Bảng: ${label}` : "Bảng dữ liệu"} className="mb-4 max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-focus">
      <table className="border-collapse text-sm tabular-nums">
        <thead>
          <tr>
            {head.map((h, c) => (
              <th
                key={h}
                scope="col"
                className={`border-b border-line px-3 pt-0.5 pb-1.5 text-xs font-medium whitespace-nowrap text-ink-2 first:pl-0 ${c === 0 ? "text-left" : "text-right"}`}
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
                  <th key={c} scope="row" className="border-b border-rule py-2 pr-6 text-left leading-5 font-normal whitespace-nowrap text-ink">
                    {cell}
                  </th>
                ) : (
                  <td key={c} className="border-b border-rule px-3 py-2 text-right leading-5 whitespace-nowrap text-ink last:pr-0">
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

export default function MessageContent({ blocks }) {
  let lastHeading = null;
  return (
    <div className="text-message text-ink [overflow-wrap:anywhere] [&>*:last-child]:mb-0">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h":
            lastHeading = b.text;
            return (
              <h3 key={i} className="mt-0 mb-2 text-message-heading text-ink">
                {b.text}
              </h3>
            );
          case "table":
            return <DataTable key={i} head={b.head} rows={b.rows} label={lastHeading} />;
          case "hr":
            return <hr key={i} className="my-5 border-0 border-t border-rule" />;
          case "ul":
            return (
              <ul key={i} className="mb-3 list-disc space-y-1 pl-5 marker:text-brand">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Rich text={it} />
                  </li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={i} className="mb-3 text-pretty">
                <Rich text={b.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
