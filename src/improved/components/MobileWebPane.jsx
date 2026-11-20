import { useEffect, useRef, useState } from "react";
import { LINK_PREVIEWS } from "../data.js";
import { CloseIcon, ExternalLinkIcon } from "../icons.jsx";

// Bề rộng thanh cuộn của trang nhúng (máy tính ~15–17px; điện thoại thanh cuộn nổi = 0).
// Đo trong shadow DOM để quy tắc ẩn thanh cuộn của app không ảnh hưởng. Dùng để đẩy thanh cuộn của trang nhúng ra ngoài khung.
let scrollbarWidth;
function measureScrollbar() {
  if (scrollbarWidth !== undefined) return scrollbarWidth;
  const host = document.createElement("div");
  const box = document.createElement("div");
  box.style.cssText = "position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll;";
  host.attachShadow({ mode: "open" }).append(box);
  document.body.append(host);
  const measured = box.offsetWidth - box.clientWidth;
  host.remove();
  // Giả lập điện thoại trên máy tính (DevTools, cửa sổ hẹp): app đo ra thanh cuộn nổi = 0 nhưng trang khác nguồn
  // trong iframe vẫn vẽ thanh cuộn kiểu máy tính. Điện thoại thật không vào nhánh này.
  const desktop = window.outerWidth - window.innerWidth > 100 || (navigator.userAgentData && !navigator.userAgentData.mobile);
  scrollbarWidth = measured || (desktop ? 17 : 0);
  return scrollbarWidth;
}

// Non-modal: the chat stays interactive while a third-party page is open.
export default function MobileWebPane({ link, onClose }) {
  const [phase, setPhase] = useState("loading");
  const heading = useRef(null);
  let url;
  try { url = new URL(link.url); } catch { /* Render a recovery message below. */ }
  const valid = url && ["https:", "http:"].includes(url.protocol);
  const mixed = valid && location.protocol === "https:" && url.protocol === "http:";
  const blocked = LINK_PREVIEWS[link.url]?.embed === false;
  const canEmbed = valid && !mixed && !blocked;
  const host = url?.hostname.replace(/^www\./, "") || link.label;

  useEffect(() => {
    if (!canEmbed) return;
    const timeout = setTimeout(() => setPhase(value => value === "loading" ? "slow" : value), 10000);
    return () => clearTimeout(timeout);
  }, [canEmbed]);

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);

  return (
    <section id="mobile-web-panel" aria-label={`Website: ${host}`}
      className="mobile-web-pane bg-web-pane-bg text-web-pane-text" style={{ "--frame-scrollbar": `${measureScrollbar()}px` }}>
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-web-pane-border px-2 pt-[var(--safe-top)]">
        <p ref={heading} tabIndex={-1} className="m-0 min-w-0 flex-1 truncate pl-2 text-small font-medium outline-none" title={link.url}>{host}</p>
        {valid && <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label="Mở website trong tab mới" title="Mở website trong tab mới"
          className="grid size-11 shrink-0 place-items-center rounded-lg text-web-pane-text-muted hover:bg-icon-button-bg-hover focus-visible:outline-2 focus-visible:outline-focus-ring"><ExternalLinkIcon /></a>}
        <button type="button" onClick={onClose} aria-label="Đóng khung web" title="Đóng khung web"
          className="grid size-11 shrink-0 place-items-center rounded-lg text-web-pane-text-muted hover:bg-icon-button-bg-hover focus-visible:outline-2 focus-visible:outline-focus-ring"><CloseIcon /></button>
      </div>
      <div className="mobile-web-body">
        {blocked && <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-small text-web-pane-text-muted"><p className="m-0">Trang này không cho phép xem trong GeoAgent. Mở tab mới để sử dụng website.</p></div>}
        {canEmbed && <iframe src={link.url} title={link.label || `Website ${host}`} referrerPolicy="no-referrer"
          allow="focus-without-user-activation 'none'"
          // Same-origin embeds keep an opaque origin, so scripts cannot remove the sandbox.
          sandbox={`allow-forms allow-scripts allow-popups${url.origin !== location.origin ? " allow-same-origin" : ""}`}
          onLoad={() => setPhase("settled")} onError={() => setPhase("error")} className="mobile-web-frame" />}
        {(!canEmbed || phase !== "settled") && <p role="status" className="m-0 shrink-0 border-t border-web-pane-border px-3 py-1 text-xs text-web-pane-text-muted">
          {!valid ? "Liên kết không hợp lệ." : mixed ? "Trang HTTP không mở được trong khung này. " : blocked ? "Xem website: "
            : phase === "loading" ? "Đang mở website… " : phase === "error" ? "Không mở được trang. "
            : phase === "slow" ? "Trang chưa hiển thị? " : "Trang trống hoặc bị chặn? "}
          {valid && <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-content-link underline underline-offset-2">Mở tab mới</a>}
        </p>}
      </div>

    </section>
  );
}
