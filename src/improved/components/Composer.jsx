import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ClipIcon, MicIcon, SendIcon } from "../icons.jsx";

export default function Composer({ onSend, placeholder = "Nhắn tin" }) {
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
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgb(252_248_247_/_0),rgb(252_248_247_/_0.6)_45%,rgb(252_248_247_/_0.85))]"
      />
      {/* Cùng khung với cột tin nhắn (ChatPane): mép ô soạn trùng mép nội dung */}
      <div className="mx-auto w-full max-w-[1040px] px-8 md:px-[72px]">
        {/* Dải che phía sau là kính mờ (thấy lờ mờ nội dung bên dưới); ô soạn tin trắng đặc để chữ luôn dễ đọc */}
        <div className="flex items-end gap-1 rounded-[28px] border border-line-strong bg-surface p-2 shadow-[0_4px_16px_rgb(29_20_22_/_0.08)]">
          <button
            type="button"
            aria-label="Đính kèm tệp"
            title="Đính kèm tệp"
            className="grid size-10 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-panel hover:text-ink focus-visible:outline-2 focus-visible:outline-focus"
          >
            <ClipIcon />
          </button>
          <label htmlFor="msg" className="sr-only">Nội dung tin nhắn</label>
          <textarea
            id="msg"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            enterKeyHint="send"
            className="field-sizing-content max-h-[8lh] min-h-[1lh] w-full min-w-0 flex-1 resize-none self-center bg-transparent px-1 py-2 text-[15px] leading-[1.45] outline-none placeholder:text-ink-2"
          />
          {/* Góc phải: micro luôn có; khi có chữ, micro trượt sang trái nhường chỗ cho nút gửi */}
          <motion.button
            layout
            type="button"
            aria-label="Nhập bằng giọng nói"
            title="Nhập bằng giọng nói"
            transition={{ type: "spring", bounce: 0, visualDuration: 0.2 }}
            className="grid size-10 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-panel hover:text-ink focus-visible:outline-2 focus-visible:outline-focus"
          >
            <MicIcon />
          </motion.button>
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
                className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white hover:bg-[#8a1218] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
