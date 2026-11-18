import { useEffect, useRef, useState } from "react";
import { CONVERSATIONS } from "./data.js";
import Sidebar from "./components/Sidebar.jsx";
import ChatPane from "./components/ChatPane.jsx";

const now = () => new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

function useIsMobile() {
  const query = "(max-width: 767px)";
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
}

export default function App({ logoRef, logoHidden }) {
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [activeId, setActiveId] = useState(CONVERSATIONS[0].id);
  const [view, setView] = useState("list"); // chỉ dùng trên mobile
  const [typing, setTyping] = useState(false);
  const timer = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => () => clearTimeout(timer.current), []);

  const active = conversations.find((c) => c.id === activeId);

  const update = (id, fn) => setConversations((list) => list.map((c) => (c.id === id ? fn(c) : c)));

  const open = (id) => {
    clearTimeout(timer.current);
    setTyping(false);
    setActiveId(id);
    update(id, (c) => ({ ...c, unread: false }));
    setView("chat");
  };

  const back = () => {
    setView("list");
    requestAnimationFrame(() => document.querySelector(`[data-id="${activeId}"]`)?.focus());
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

  const showChat = view === "chat";

  return (
    <div className="grid h-dvh grid-cols-1 md:grid-cols-[272px_1fr] xl:grid-cols-[367.2px_1fr]">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        showActive={!isMobile}
        onOpen={open}
        logoRef={logoRef}
        logoHidden={logoHidden}
        className={showChat ? "max-md:hidden" : ""}
      />
      <ChatPane
        conversation={active}
        typing={typing}
        onSend={send}
        onBack={back}
        className={showChat ? "" : "max-md:hidden"}
      />
    </div>
  );
}
