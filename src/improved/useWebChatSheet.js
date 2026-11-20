import { useEffect, useRef, useState } from "react";

const DEFAULT = 56;
const MAX = 68;

export default function useWebChatSheet({ onCollapse }) {
  const [extent, setExtent] = useState(DEFAULT);
  const [resizing, setResizing] = useState(false);
  const drag = useRef(null);
  const collapse = useRef(onCollapse);
  collapse.current = onCollapse;

  const finish = (event, cancel = false) => {
    const session = drag.current;
    if (!session || (event.pointerId != null && event.pointerId !== session.id)) return;
    drag.current = null;
    setResizing(false);
    if (cancel || session.cancelled) setExtent(session.extent);
    else if (session.current < 14) {
      setExtent(session.extent);
      collapse.current();
    }
    // Let pointerup/pointercancel release capture. Early release can leave
    // WebKit forwarding the next click into the iframe.
  };

  useEffect(() => {
    if (!resizing) return;
    const cancel = () => {
      const session = drag.current;
      if (session) {
        drag.current = null;
        setExtent(session.extent);
        setResizing(false);
      }
    };
    window.addEventListener("blur", cancel);
    return () => window.removeEventListener("blur", cancel);
  }, [resizing]);

  return {
    extent, resizing,
    handleProps: {
      role: "separator",
      tabIndex: 0,
      "aria-label": "Kéo thay đổi chiều cao trò chuyện",
      "aria-orientation": "horizontal",
      "aria-controls": "mobile-web-chat",
      "aria-valuemin": 0,
      "aria-valuemax": MAX,
      "aria-valuenow": Math.round(extent),
      "aria-valuetext": `${Math.round(extent)}% màn hình. Kéo xuống để thu gọn.`,
      onPointerDown(event) {
        if (event.button !== 0 || !event.isPrimary) return;
        event.preventDefault();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { id: event.pointerId, y: event.clientY, extent, current: extent,
          height: event.currentTarget.closest(".chat-workspace").clientHeight };
        setResizing(true);
      },
      onPointerMove(event) {
        const session = drag.current;
        if (session?.id !== event.pointerId || session.cancelled || !session.height) return;
        session.current = Math.max(7, Math.min(MAX, session.extent - (event.clientY - session.y) / session.height * 100));
        setExtent(session.current);
      },
      onPointerUp: finish,
      onPointerCancel: event => finish(event, true),
      onLostPointerCapture: event => finish(event, true),
      onKeyDown(event) {
        if (event.key === "ArrowUp") setExtent(value => Math.min(MAX, value + 5));
        else if (event.key === "ArrowDown") {
          if (extent <= 20) collapse.current();
          else setExtent(value => Math.max(15, value - 5));
        } else if (event.key === "Home") collapse.current();
        else if (event.key === "End") setExtent(MAX);
        else if (event.key === "Escape" && drag.current) {
          drag.current.cancelled = true;
          setExtent(drag.current.extent);
        } else return;
        event.preventDefault();
        event.stopPropagation();
      },
    },
  };
}
