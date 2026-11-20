import { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar.jsx";
import { MenuIcon } from "../icons.jsx";

const RAIL = 40;
const MIN = 240;
const DEFAULT = 264;
const MAX = 480;
const SNAP = (RAIL + MIN) / 2;
const maxWidth = () => Math.max(MIN, Math.min(MAX, window.innerWidth - 400));

export default function DesktopSidebar({ hidden, ...sidebarProps }) {
  const [preferredWidth, setPreferredWidth] = useState(DEFAULT);
  const [collapsed, setCollapsed] = useState(false);
  const [limit, setLimit] = useState(maxWidth);
  const [resizing, setResizing] = useState(false);
  const drag = useRef(null);
  const resizer = useRef(null);
  const width = collapsed ? RAIL : Math.min(preferredWidth, limit);

  useEffect(() => {
    const update = () => setLimit(maxWidth());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!resizing) return;
    document.documentElement.classList.add("sidebar-resizing");
    return () => document.documentElement.classList.remove("sidebar-resizing");
  }, [resizing]);

  useEffect(() => {
    if (hidden) {
      drag.current = null;
      setResizing(false);
    }
  }, [hidden]);

  function resizeTo(next) {
    if (next < SNAP) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
      setPreferredWidth(Math.round(Math.max(MIN, Math.min(limit, next))));
    }
  }

  function startDrag(event) {
    if (event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, width, preferredWidth, collapsed, pointerId: event.pointerId };
    setResizing(true);
  }

  function finishDrag(event, cancel = false) {
    const session = drag.current;
    if (!session || session.pointerId !== event.pointerId) return;
    if (cancel) {
      setPreferredWidth(session.preferredWidth);
      setCollapsed(session.collapsed);
    }
    drag.current = null;
    setResizing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onKeyDown(event) {
    const step = event.shiftKey ? 40 : 16;
    switch (event.key) {
      case "ArrowLeft":
        if (width <= MIN) setCollapsed(true);
        else resizeTo(Math.max(MIN, width - step));
        break;
      case "ArrowRight": resizeTo(collapsed ? MIN : width + step); break;
      case "Home": setCollapsed(true); break;
      case "End": resizeTo(limit); break;
      case "Enter": setCollapsed(value => !value); break;
      case "Escape":
        if (!drag.current) return;
        finishDrag({ currentTarget: event.currentTarget, pointerId: drag.current.pointerId }, true);
        break;
      default: return;
    }
    event.preventDefault();
  }

  return (
    <div
      hidden={hidden}
      className="desktop-sidebar bg-frame text-on-frame"
      data-collapsed={collapsed}
      data-resizing={resizing}
      style={{ flexBasis: width }}
    >
      {collapsed && <button
        type="button"
        className="sidebar-toggle"
        aria-label="Mở danh sách hội thoại"
        title="Mở danh sách hội thoại"
        aria-expanded={false}
        aria-controls="desktop-conversations"
        onClick={() => {
          setCollapsed(false);
          resizer.current?.focus({ preventScroll: true });
        }}
      >
        <MenuIcon />
      </button>}
      <div id="desktop-conversations" hidden={collapsed} className="h-full">
        <Sidebar {...sidebarProps} className="h-full w-full" />
      </div>
      <div
        ref={resizer}
        role="separator"
        tabIndex={0}
        aria-label="Chiều rộng danh sách hội thoại"
        aria-orientation="vertical"
        aria-controls="desktop-conversations"
        aria-valuemin={RAIL}
        aria-valuemax={limit}
        aria-valuenow={width}
        aria-valuetext={collapsed ? "Đã thu gọn" : `${width} pixel`}
        aria-describedby="sidebar-resize-help"
        title="Kéo để đổi chiều rộng; nhấp đúp để đặt lại"
        className="sidebar-resizer"
        onPointerDown={startDrag}
        onPointerMove={event => {
          if (drag.current?.pointerId === event.pointerId) {
            resizeTo(drag.current.width + event.clientX - drag.current.x);
          }
        }}
        onPointerUp={finishDrag}
        onPointerCancel={event => finishDrag(event, true)}
        onLostPointerCapture={finishDrag}
        onKeyDown={onKeyDown}
        onDoubleClick={() => { setPreferredWidth(DEFAULT); setCollapsed(false); }}
      />
      <span id="sidebar-resize-help" className="sr-only">
        Dùng phím trái, phải để đổi chiều rộng. Home thu gọn, End mở rộng tối đa.
        Enter đóng hoặc mở. Escape hủy thao tác kéo.
      </span>
    </div>
  );
}
