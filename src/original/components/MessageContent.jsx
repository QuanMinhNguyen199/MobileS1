// Hiển thị khối nội dung có cấu trúc; chỉ hỗ trợ **đậm** trong đoạn văn, không dùng innerHTML.
function Rich({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}

function DataTable({ head, rows, label }) {
  return (
    // Vùng cuộn ngang có tabIndex để người dùng bàn phím cuộn được trên màn hẹp
    <div tabIndex={0} role="region" aria-label={label ? `Bảng: ${label}` : "Bảng dữ liệu"} className="mb-3 max-w-full overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="border border-line-strong px-2.5 py-1.5 text-center font-medium whitespace-nowrap md:px-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="odd:bg-stripe">
              {row.map((cell, c) =>
                c === 0 ? (
                  <th key={c} scope="row" className="border border-line-strong px-2.5 py-[4px] text-left font-normal whitespace-nowrap md:px-4">
                    {cell}
                  </th>
                ) : (
                  <td key={c} className="border border-line-strong px-2.5 py-[4px] whitespace-nowrap md:px-4">
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
    <div className="text-base leading-snug [overflow-wrap:anywhere] md:text-[15.2px] [&>*:last-child]:mb-0">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h":
            lastHeading = b.text;
            return (
              <h3 key={i} className="mt-0 mb-2 text-[0.88rem] font-normal uppercase md:text-[15.2px]">
                {b.text}
              </h3>
            );
          case "table":
            return <DataTable key={i} head={b.head} rows={b.rows} label={lastHeading} />;
          case "hr":
            return <hr key={i} className="my-4 w-10 border-0 border-t-2 border-ink" />;
          case "ul":
            return (
              <ul key={i} className="mb-3 list-none p-0">
                {b.items.map((it, j) => (
                  <li key={j} className="before:content-['•_']">
                    <Rich text={it} />
                  </li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={i} className="mb-3">
                <Rich text={b.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
