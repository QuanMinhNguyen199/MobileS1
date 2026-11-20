import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SendIcon, WarningIcon } from "../icons.jsx";

// compact: cột chat hẹp (máy tính khi khung web đang mở bên phải) dùng lề như điện thoại.
// offline: hiện dòng báo mất kết nối phía trên ô; vẫn cho gõ và gửi (tin gửi lúc mất mạng hiện "Chưa gửi được" kèm nút Thử lại).
// Chưa có đính kèm / giọng nói: không đặt nút giả, thêm lại khi có chức năng thật.
export default function Composer({ onSend, placeholder = "Nhắn tin", compact = false, offline = false }) {
  const [text, setText] = useState("");
  const formRef = useRef(null);
  const hasText = text.trim() !== "";

  const submit = (e) => {
    e.preventDefault();
    if (!hasText) return;
    onSend(text.trim());
    setText("");
  };

  // Enter gửi, Shift+Enter xuống dòng; bỏ qua khi bộ gõ (Telex/IME) đang ghép chữ
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      formRef.current.requestSubmit();
    }
  };

  return (
    <form ref={formRef} onSubmit={submit} className="sticky bottom-0 z-10 pt-6 pb-[calc(12px+var(--safe-bottom))] md:pb-5">
      {/* Như Gemini: chữ cạnh và dưới ô soạn tin nhạt dần vào màu nền, không làm mờ (blur), không có dải che */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b/srgb from-composer-fade/0 via-composer-fade/60 via-45% to-composer-fade/85"
      />
      {/* Cùng khung với cột tin nhắn (ChatPane): mép ô soạn trùng mép nội dung */}
      <div className={`mx-auto w-full max-w-[1040px] ${compact ? "px-4" : "px-8 md:px-[72px]"}`}>
        {/* Dải che phía sau là kính mờ (thấy lờ mờ nội dung bên dưới); ô soạn tin trắng đặc để chữ luôn dễ đọc */}
        <p role="status" className="m-0 empty:hidden">
          {offline && (
            <span className="mb-2 flex items-center gap-2 px-2 text-small text-chat-notice-text">
              <WarningIcon size={16} className="shrink-0 text-chat-notice-icon" />
              Mất kết nối mạng. Tin nhắn chưa gửi được cho đến khi có mạng lại.
            </span>
          )}
        </p>
        <div className="flex min-h-14 items-end gap-1 rounded-composer border border-composer-border bg-composer-bg p-2 pl-4 shadow-composer">
          <label htmlFor="msg" className="sr-only">Nội dung tin nhắn</label>
          <textarea
            id="msg"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            enterKeyHint="send"
            className="field-sizing-content max-h-[8lh] min-h-[1lh] w-full min-w-0 flex-1 resize-none self-center bg-transparent px-1 py-2 text-input outline-none placeholder:text-composer-placeholder"
          />
          {/* Nút gửi hiện khi đã có chữ */}
          <AnimatePresence initial={false} mode="popLayout">
            {hasText && (
              <motion.button
                key="send"
                type="submit"
                aria-label="Gửi tin nhắn"
                title="Gửi (Enter)"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", bounce: 0, visualDuration: 0.2 }}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-composer-send-bg text-composer-send-icon hover:bg-composer-send-bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <SendIcon />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </form>
  );
}
