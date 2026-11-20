import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { LINK_PREVIEWS } from "../data.js";
import { CloseIcon, ExternalLinkIcon } from "../icons.jsx";

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

// Máy tính: khung web cố định bên phải khung chat (không phải modal), để vừa đọc trang vừa nhắn tin.
// Esc khi đang ở trong khung: đóng và trả focus về link vừa bấm (App.jsx lo phần trả focus).
// Trang chặn nhúng (embed: false trong LINK_PREVIEWS) không dùng iframe: giải thích và đưa bản tóm tắt.
export default function DesktopWebPane({ link, onClose, className = "" }) {
  const id = useId();
  const heading = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const reduce = useReducedMotion();

  const preview = LINK_PREVIEWS[link.url];
  const host = hostOf(link.url);
  const title = preview ? preview.title : link.label;
  const embed = preview?.embed; // true: nhúng được · false: trang chặn nhúng · undefined: chưa biết, vẫn thử

  // Mở link khác: tải lại; đưa focus vào tiêu đề khung để trình đọc màn hình đọc tên trang
  useEffect(() => {
    setLoaded(false);
    heading.current?.focus({ preventScroll: true });
  }, [link.url]);

  return (
    <motion.section
      aria-labelledby={`${id}-title`}
      onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}
      initial={reduce ? false : { opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", bounce: 0, visualDuration: 0.25 }}
      className={`flex min-h-0 flex-col bg-web-pane-bg text-web-pane-text ${className}`}
    >
      {/* Thanh trên: nguồn, tiêu đề, mở tab mới, đóng */}
      <div className="flex h-16 shrink-0 items-center gap-1 border-b border-web-pane-border pr-3 pl-5 pt-[var(--safe-top)]">
        <div className="mr-2 min-w-0 flex-1">
          {/* text-nowrap!: quy tắc chung :root[data-variant] :is(h1,h2,h3) { text-wrap: balance } ưu tiên cao hơn class thường, đè mất nowrap của truncate */}
          <h2 ref={heading} id={`${id}-title`} tabIndex={-1} className="m-0 truncate text-nowrap! text-title outline-none" title={title}>{title}</h2>
          <p className="m-0 truncate text-xs text-web-pane-text-muted">{host} · {preview ? preview.kind : "Liên kết ngoài"}</p>
        </div>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Mở trang trong tab mới"
          title="Mở trong tab mới"
          className="grid size-9 shrink-0 place-items-center rounded-full text-icon-button-icon hover:bg-icon-button-bg-hover hover:text-icon-button-icon-hover focus-visible:outline-2 focus-visible:outline-focus-ring [&_svg]:size-5"
        >
          <ExternalLinkIcon />
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng trang web"
          title="Đóng (Esc)"
          className="grid size-9 shrink-0 place-items-center rounded-full text-icon-button-icon hover:bg-icon-button-bg-hover hover:text-icon-button-icon-hover focus-visible:outline-2 focus-visible:outline-focus-ring [&_svg]:size-5"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 bg-web-pane-frame-bg">
        {embed === false ? (
          // Trang chặn nhúng: giải thích, kèm tóm tắt để vẫn đọc được ý chính cạnh khung chat
          <div className="h-full overflow-y-auto p-8">
            <div className="mx-auto max-w-lg">
              <p className="m-0 text-title text-pretty">{host} không cho xem trang bên trong ứng dụng khác</p>
              <p className="mt-2 mb-0 text-small text-web-pane-text-muted text-pretty">Trang này chặn hiển thị trong khung nhúng. <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-content-link underline underline-offset-2">Mở trong tab mới</a> để đọc toàn văn.</p>
              {preview && (
                <div className="mt-6 rounded-2xl border border-web-pane-card-border bg-web-pane-card-bg p-5">
                  <p className="m-0 text-xs font-medium text-web-pane-text-muted">Tóm tắt · bản xem trước giả lập</p>
                  <p className="mt-2 mb-0 text-small text-web-pane-text text-pretty">{preview.summary}</p>
                  <dl className="mt-4 mb-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-web-pane-border pt-4 text-sm">
                    {preview.meta.map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-web-pane-text-muted">{k}</dt>
                        <dd className="m-0 text-web-pane-text [overflow-wrap:anywhere]">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              <p className="mt-4 mb-0 rounded-lg bg-web-pane-bg px-3 py-2 text-xs text-web-pane-text-muted [overflow-wrap:anywhere]">{link.url}</p>
            </div>
          </div>
        ) : (
          <>
            {!loaded && (
              <p role="status" className="absolute inset-0 m-0 grid place-items-center text-small text-web-pane-text-muted">Đang tải trang…</p>
            )}
            <iframe
              key={link.url}
              src={link.url}
              title={`Trang ${host}: ${title}`}
              onLoad={() => setLoaded(true)}
              // Trang nhúng không được cướp focus; giới hạn quyền; không gửi địa chỉ app sang trang đích
              allow="focus-without-user-activation 'none'"
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
              referrerPolicy="no-referrer"
              className={`relative block size-full border-0 bg-white transition-opacity motion-reduce:transition-none ${loaded ? "opacity-100" : "opacity-0"}`}
            />
            {embed === undefined && (
              <p className="absolute inset-x-0 bottom-0 m-0 border-t border-web-pane-border bg-web-pane-bg px-4 py-2 text-xs text-web-pane-text-muted">
                Khung trống? Một số trang chặn xem nhúng.{" "}
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-content-link underline underline-offset-2">Mở trong tab mới</a>
              </p>
            )}
          </>
        )}
      </div>
    </motion.section>
  );
}
