import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CONVERSATIONS } from "./data.js";
import Sidebar from "./components/Sidebar.jsx";
import DesktopSidebar from "./components/DesktopSidebar.jsx";
import ChatPane from "./components/ChatPane.jsx";
import { watchScrolling } from "./scrollbars.js";

const now = () => new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

function useIsMobile() {
  const mq = "(max-width: 767px)";
  const [mobile, setMobile] = useState(() => window.matchMedia(mq).matches);
  useEffect(() => {
    const m = window.matchMedia(mq);
    const onChange = () => setMobile(m.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);
  return mobile;
}

export default function App({ logoRef, logoHidden }) {
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [activeId, setActiveId] = useState(CONVERSATIONS[0].id);
  const [drawer, setDrawer] = useState(false); // điện thoại: danh sách hội thoại dạng ngăn kéo (kiểu Gemini)
  const [typing, setTyping] = useState(false);
  const [query, setQuery] = useState("");
  const timer = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => watchScrolling(), []);

  // Đóng ngăn kéo khi chuyển sang máy tính; Esc để đóng
  useEffect(() => {
    if (!isMobile) setDrawer(false);
  }, [isMobile]);

  const closeDrawer = () => {
    setDrawer(false);
    requestAnimationFrame(() => document.querySelector("[data-menu-button]")?.focus());
  };

  const active = conversations.find((c) => c.id === activeId);
  const update = (id, fn) => setConversations((list) => list.map((c) => (c.id === id ? fn(c) : c)));

  const open = (id) => {
    clearTimeout(timer.current);
    setTyping(false);
    setActiveId(id);
    update(id, (c) => ({ ...c, unread: false }));
    if (drawer) closeDrawer();
  };

  const send = (text) => {
    const id = activeId;
    update(id, (c) => ({
      ...c,
      preview: `Bạn: ${text}`,
      messages: [...c.messages, { id: Date.now(), from: "user", time: now(), text }],
    }));
    // Phản hồi giả lập: thay bằng lời gọi API GeoAgent thật
    setTyping(true);
    timer.current = setTimeout(() => {
      setTyping(false);
      update(id, (c) => ({
        ...c,
        messages: [
          ...c.messages,
          {
            id: Date.now(),
            from: "bot",
            time: now(),
            blocks: [{ type: "p", text: "Đây là giao diện mẫu. Hãy kết nối **API của GeoAgent** để nhận câu trả lời thật." }],
          },
        ],
      }));
    }, 900);
  };

  const sidebarProps = {
    conversations,
    activeId,
    showActive: true,
    onOpen: open,
    query,
    onQuery: setQuery,
    logoHidden,
  };

  // Máy tính: kéo đổi chiều rộng hoặc thu về thanh menu. Điện thoại: danh sách dạng ngăn kéo.
  return (
    <div className="flex h-dvh bg-surface text-ink">
      <DesktopSidebar {...sidebarProps} hidden={isMobile} logoRef={isMobile ? undefined : logoRef} />
      <ChatPane
        conversation={active}
        typing={typing}
        onSend={send}
        onMenu={() => setDrawer(true)}
        logoRef={isMobile ? logoRef : undefined}
        logoHidden={logoHidden}
        inert={drawer}
        className="min-w-0 flex-1"
      />

      <AnimatePresence>
        {isMobile && drawer && (
          <>
            <motion.div
              key="scrim"
              aria-hidden="true"
              onClick={closeDrawer}
              className="fixed inset-0 z-40 bg-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Danh sách hội thoại"
              onKeyDown={(e) => e.key === "Escape" && closeDrawer()}
              className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[340px] shadow-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, visualDuration: 0.28 }}
              onAnimationComplete={() => document.querySelector("[aria-label='Đóng danh sách hội thoại']")?.focus({ preventScroll: true })}
            >
              <Sidebar {...sidebarProps} onClose={closeDrawer} className="w-full" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
