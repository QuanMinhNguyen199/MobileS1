import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CONVERSATIONS } from "./data.js";
import Sidebar from "./components/Sidebar.jsx";
import { DeleteDialog, RenameDialog } from "./components/ConversationDialogs.jsx";
import { conversationActions, topicOf } from "./conversationActions.js";
import DesktopSidebar from "./components/DesktopSidebar.jsx";
import ChatPane from "./components/ChatPane.jsx";
import DesktopWebPane from "./components/DesktopWebPane.jsx";
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

// Trạng thái mạng của trình duyệt (sự kiện online/offline)
function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export default function App({ logoRef, logoHidden, onLogout }) {
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [activeId, setActiveId] = useState(CONVERSATIONS[0].id);
  const [drawer, setDrawer] = useState(false); // điện thoại: danh sách hội thoại dạng ngăn kéo (kiểu Gemini)
  const [typing, setTyping] = useState(false);
  const [query, setQuery] = useState("");
  const timer = useRef(null);
  const isMobile = useIsMobile();
  const online = useOnline();
  // Link đang mở trong khung web, lưu riêng theo từng phiên: đổi phiên thì khung web đổi theo,
  // quay lại phiên cũ thì thấy lại đúng trang đã để dở (hoặc không có khung nếu lần trước chưa mở link nào).
  const [webs, setWebs] = useState({}); // { [conversationId]: link }
  const webOrigin = useRef(null);
  const openWeb = (link, origin) => {
    webOrigin.current = origin;
    setWebs((all) => ({ ...all, [activeId]: link }));
  };
  const closeWeb = (id = activeId) => {
    setWebs(({ [id]: _closed, ...rest }) => rest);
    const origin = webOrigin.current;
    requestAnimationFrame(() => (origin?.isConnected ? origin : document.getElementById("chat-title"))?.focus({ preventScroll: true }));
  };
  const web = webs[activeId] ?? null;

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

  // Xóa phiên; xóa đúng phiên đang mở thì chuyển sang phiên đầu còn lại
  const remove = (id) => {
    const rest = conversations.filter((c) => c.id !== id);
    if (!rest.length) return;
    if (id === activeId) {
      clearTimeout(timer.current);
      setTyping(false);
      setActiveId(rest[0].id);
      rest[0] = { ...rest[0], unread: false };
    }
    setWebs(({ [id]: _removed, ...others }) => others);
    setConversations(rest); // ngăn kéo (điện thoại) vẫn mở để xóa tiếp
  };

  // Phản hồi giả lập: thay bằng lời gọi API GeoAgent thật. Lỗi mạng thì đánh dấu tin chưa gửi để người dùng thử lại.
  const reply = (id) => {
    setTyping(true);
    clearTimeout(timer.current);
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

  // quote: { text, label? } — đoạn đang trả lời (bôi đen) hoặc cả câu trả lời (nút ↩ / vuốt, có label để hiển thị).
  // Khi nối API, gửi quote.text kèm làm ngữ cảnh; label chỉ để hiển thị.
  const send = (text, quote) => {
    const id = activeId;
    const failed = !navigator.onLine;
    update(id, (c) => ({
      ...c,
      // Phiên mới: lấy câu hỏi đầu tiên làm chủ đề (khi nối API, thay bằng tóm tắt do máy chủ trả về)
      topic: c.topic ?? (text.length > 60 ? `${text.slice(0, 57).trimEnd()}…` : text),
      preview: `Bạn: ${text}`,
      messages: [...c.messages, { id: Date.now(), from: "user", time: now(), text, ...(quote ? { quote } : {}), ...(failed ? { status: "failed" } : {}) }],
    }));
    if (!failed) reply(id);
  };

  const retry = (messageId) => {
    if (!navigator.onLine) return;
    const id = activeId;
    update(id, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, status: undefined, time: now() } : m)) }));
    reply(id);
  };

  // Cuộc trò chuyện mới: phiên rỗng ở đầu danh sách. Đang ở một phiên rỗng thì dùng lại, không tạo thêm.
  const newChat = () => {
    clearTimeout(timer.current);
    setTyping(false);
    if (drawer) closeDrawer();
    if (active && active.messages.length === 0) {
      requestAnimationFrame(() => document.getElementById("msg")?.focus());
      return;
    }
    const id = `new-${Date.now()}`;
    setConversations((list) => [{ id, name: "Cuộc trò chuyện mới", bot: true, tags: [], unread: false, preview: "", messages: [] }, ...list]);
    setActiveId(id);
    requestAnimationFrame(() => document.getElementById("msg")?.focus());
  };

  // Hộp xóa / đổi tên dùng chung cho menu ⋮ ở danh sách và ở header khung chat
  const [pendingDelete, setPendingDelete] = useState(null); // { id, topic, from }
  const [renaming, setRenaming] = useState(null); // { id, topic }
  const confirmDelete = (id) => {
    // Xóa từ danh sách: dòng đó biến mất nên focus sang dòng kế tiếp (hoặc dòng trước).
    // Xóa từ header: hộp thoại tự trả focus về nút ⋮ ở header.
    let next = null;
    if (pendingDelete?.from === "sidebar") {
      const row = [...document.querySelectorAll(`aside button[data-id="${id}"]`)].find((b) => b.offsetParent)?.closest("li");
      next = (row?.nextElementSibling ?? row?.previousElementSibling)?.querySelector("button[data-id]");
    }
    remove(id);
    if (next) requestAnimationFrame(() => next.focus());
  };
  const headerActions = active
    ? conversationActions(active, {
        selected: true,
        canDelete: conversations.length > 1,
        onUpdate: update,
        onRename: () => setRenaming({ id: active.id, topic: topicOf(active) }),
        onDelete: () => setPendingDelete({ id: active.id, topic: topicOf(active), from: "header" }),
      })
    : [];

  const sidebarProps = {
    conversations,
    activeId,
    showActive: true,
    onOpen: open,
    onUpdate: update,
    onRequestDelete: setPendingDelete,
    onNewChat: newChat,
    onLogout,
    query,
    onQuery: setQuery,
    logoHidden,
  };

  // Máy tính: kéo đổi chiều rộng hoặc thu về thanh menu. Điện thoại: danh sách dạng ngăn kéo.
  return (
    <div className="flex h-dvh bg-app-bg text-app-text">
      <DesktopSidebar {...sidebarProps} hidden={isMobile} logoRef={isMobile ? undefined : logoRef} />
      <ChatPane
        conversation={active}
        typing={typing}
        onSend={send}
        onRetry={retry}
        actions={headerActions}
        onNewChat={newChat}
        online={online}
        onMenu={() => setDrawer(true)}
        webLink={web}
        onOpenWeb={openWeb}
        onCloseWeb={() => closeWeb()}
        compact={!isMobile && Boolean(web)}
        inert={drawer}
        className={!isMobile && web ? "w-[clamp(380px,36vw,520px)] shrink-0" : "min-w-0 flex-1"}
      />
      {/* Máy tính: khung web bên phải khung chat. Mỗi phiên giữ khung riêng (ẩn khi không xem) để
          quay lại vẫn đúng chỗ đang đọc trong trang, không tải lại. */}
      {!isMobile &&
        Object.entries(webs).map(([id, link]) => (
          <DesktopWebPane
            key={id}
            link={link}
            active={id === activeId}
            onClose={() => closeWeb(id)}
            className="min-w-0 flex-1 border-l border-web-pane-border"
          />
        ))}

      <AnimatePresence>
        {isMobile && drawer && (
          <>
            <motion.div
              key="scrim"
              aria-hidden="true"
              onClick={closeDrawer}
              className="fixed inset-0 z-40 bg-overlay-scrim"
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

      <DeleteDialog target={pendingDelete} onConfirm={confirmDelete} onDone={() => setPendingDelete(null)} />
      <RenameDialog target={renaming} onSave={(id, topic) => update(id, (c) => ({ ...c, topic }))} onDone={() => setRenaming(null)} />
    </div>
  );
}
