import { useEffect, useRef, useState } from "react";
import { LINK_PREVIEWS } from "../data.js";
import { ChevronDown, ChevronUp, CloseIcon, ExternalLinkIcon } from "../icons.jsx";

// Non-modal: the chat stays interactive while a third-party page is open.
export default function MobileWebPane({ link, onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const [portion, setPortion] = useState(45);
  const [phase, setPhase] = useState("loading");
  const [resizing, setResizing] = useState(false);
  const pane = useRef(null);
  const drag = useRef(null);
  const bodyId = "mobile-web-content";
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

  useEffect(() => {
    if (!resizing) return;
    document.documentElement.classList.add("web-pane-resizing");
    return () => document.documentElement.classList.remove("web-pane-resizing");
  }, [resizing]);

  function resizeTo(value) {
    setPortion(Math.max(25, Math.min(65, Math.round(value))));
  }
  function finish(event, cancel = false) {
    if (drag.current?.id !== event.pointerId) return;
    if (cancel) setPortion(drag.current.portion);
    drag.current = null;
    setResizing(false);
    // pointerup / pointercancel release capture natively. Releasing it while the
    // pointer is still down can send the next click into the iframe in WebKit.
  }

  return (
    <section ref={pane} id="mobile-web-panel" aria-label={`Website: ${host}`}
      className="mobile-web-pane border-y border-web-pane-border bg-web-pane-bg text-web-pane-text"
      data-collapsed={collapsed} data-resizing={resizing} style={{ "--web-portion": `${portion}%` }}>
      <div className="flex h-12 shrink-0 items-center gap-1 px-2">
        <p className="m-0 min-w-0 flex-1 truncate pl-2 text-small font-medium" title={link.url}>{host}</p>
        <button type="button" aria-label={collapsed ? "Mở rộng khung web" : "Thu gọn khung web"}
          title={collapsed ? "Mở rộng khung web" : "Thu gọn khung web"} aria-expanded={!collapsed} aria-controls={bodyId}
          onClick={() => setCollapsed(value => !value)}
          className="grid size-11 shrink-0 place-items-center rounded-lg text-web-pane-text-muted hover:bg-icon-button-bg-hover focus-visible:outline-2 focus-visible:outline-focus-ring">
          {collapsed ? <ChevronDown /> : <ChevronUp />}
        </button>
        {valid && <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label="Mở website trong tab mới" title="Mở website trong tab mới"
          className="grid size-11 shrink-0 place-items-center rounded-lg text-web-pane-text-muted hover:bg-icon-button-bg-hover focus-visible:outline-2 focus-visible:outline-focus-ring"><ExternalLinkIcon /></a>}
        <button type="button" onClick={onClose} aria-label="Đóng khung web" title="Đóng khung web"
          className="grid size-11 shrink-0 place-items-center rounded-lg text-web-pane-text-muted hover:bg-icon-button-bg-hover focus-visible:outline-2 focus-visible:outline-focus-ring"><CloseIcon /></button>
      </div>
      <div id={bodyId} hidden={collapsed} className="mobile-web-body">
        {blocked && <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-small text-web-pane-text-muted"><p className="m-0">Trang này không cho phép xem trong GeoAgent. Mở tab mới để sử dụng website.</p></div>}
        {canEmbed && <iframe src={link.url} title={link.label || `Website ${host}`} referrerPolicy="no-referrer"
          allow="focus-without-user-activation 'none'"
          // Same-origin embeds keep an opaque origin, so scripts cannot remove the sandbox.
          sandbox={`allow-forms allow-scripts allow-popups${url.origin !== location.origin ? " allow-same-origin" : ""}`}
          onLoad={() => setPhase("settled")} onError={() => setPhase("error")} className="mobile-web-frame" />}
        <p role="status" className="m-0 shrink-0 border-t border-web-pane-border px-3 py-1 text-xs text-web-pane-text-muted">
          {!valid ? "Liên kết không hợp lệ." : mixed ? "Trang HTTP không mở được trong khung này. " : blocked ? "Xem website: "
            : phase === "loading" ? "Đang mở website… " : phase === "error" ? "Không mở được trang. "
            : phase === "slow" ? "Trang chưa hiển thị? " : "Trang trống hoặc bị chặn? "}
          {valid && <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-content-link underline underline-offset-2">Mở tab mới</a>}
        </p>
      </div>
      {!collapsed && <div role="separator" tabIndex={0} aria-label="Chiều cao khung web" aria-orientation="horizontal"
        aria-controls={bodyId} aria-valuemin={25} aria-valuemax={65} aria-valuenow={portion} aria-valuetext={`${portion}% vùng làm việc`}
        title="Kéo để chia lại vùng web và chat" className="mobile-web-resizer"
        onPointerDown={event => {
          if (event.button !== 0 || !event.isPrimary) return;
          event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { id: event.pointerId, y: event.clientY, portion, height: pane.current.parentElement.clientHeight };
          setResizing(true);
        }}
        onPointerMove={event => {
          const session = drag.current;
          if (session?.id === event.pointerId && !session.cancelled && session.height) resizeTo(session.portion + (event.clientY - session.y) / session.height * 100);
        }}
        onPointerUp={finish} onPointerCancel={event => finish(event, true)} onLostPointerCapture={finish}
        onKeyDown={event => {
          if (event.key === "ArrowUp") resizeTo(portion - 5);
          else if (event.key === "ArrowDown") resizeTo(portion + 5);
          else if (event.key === "Home") resizeTo(25);
          else if (event.key === "End") resizeTo(65);
          else if (event.key === "Escape" && drag.current) {
            setPortion(drag.current.portion);
            drag.current.cancelled = true;
          }
          else return;
          event.preventDefault();
        }}><span aria-hidden="true" /></div>}
    </section>
  );
}
