import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ClipIcon, CloseIcon, MicIcon, ReplyIcon, SendIcon, WarningIcon } from "../icons.jsx";

// compact: cột chat hẹp (máy tính khi khung web đang mở bên phải) dùng lề như điện thoại.
// offline: hiện dòng báo mất kết nối phía trên ô; vẫn cho gõ và gửi (tin gửi lúc mất mạng hiện "Chưa gửi được" kèm nút Thử lại).
// Đính kèm (trái) và micro (phải) là nút giao diện, chưa nối chức năng.
// draft/onDraft: chữ đang gõ dở của phiên (ChatPane giữ theo từng phiên).
// quote/onClearQuote: đoạn đang trả lời ({ text, label?, key }), hiện phía trên ô nhập; gửi tin thì đi kèm tin. key mới thì đưa focus vào ô nhập.
export default function Composer({ draft = "", onDraft, onSend, quote = null, onClearQuote, placeholder = "Nhắn tin", compact = false, offline = false }) {
  const [text, setTextState] = useState(draft);
  const setText = (value) => {
    setTextState(value);
    onDraft?.(value);
  };
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const hasText = text.trim() !== "";

  // Vừa chọn trả lời một đoạn: đưa con trỏ vào ô nhập (không chạy khi chỉ đổi phiên có sẵn trích dẫn)
  const lastQuoteKey = useRef(quote?.key);
  useEffect(() => {
    if (quote && quote.key !== lastQuoteKey.current) inputRef.current?.focus();
    lastQuoteKey.current = quote?.key;
  }, [quote]);

  const submit = (e) => {
    e.preventDefault();
    if (!hasText) return;
    // Gửi kèm trích dẫn: toàn văn cho AI (text) và nhãn hiển thị nếu là cả câu trả lời (label)
    onSend(text.trim(), quote ? { text: quote.text, ...(quote.label ? { label: quote.label } : {}) } : undefined);
    setText("");
    onClearQuote?.();
  };

  // Enter gửi, Shift+Enter xuống dòng; bỏ qua khi bộ gõ (Telex/IME) đang ghép chữ. Esc bỏ trích dẫn.
  const onKeyDown = (e) => {
    if (e.key === "Escape" && quote) {
      e.preventDefault();
      onClearQuote?.();
      return;
    }
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
        <div className="rounded-composer border border-composer-border bg-composer-bg p-2 shadow-composer">
        {quote && (
          // Trích dẫn: vạch trái liền mép (không bo góc trái), chỉ bo góc phải; cùng kiểu với tin đã gửi.
          // Trả lời cả câu trả lời: chỉ hiện nhãn ngắn (label), toàn văn vẫn gửi kèm cho AI.
          <div className="mb-1 flex items-start gap-2 rounded-r-lg border-l-2 border-quote-bar bg-quote-bg py-2 pr-1 pl-3">
            <ReplyIcon size={16} className="mt-0.5 shrink-0 text-quote-icon" />
            <p id="composer-quote" className="m-0 line-clamp-2 min-w-0 flex-1 text-small text-quote-text [overflow-wrap:anywhere]">
              <span className="sr-only">{quote.label ? "Đang trả lời: " : "Đang trả lời đoạn: "}</span>
              {quote.label ?? quote.text}
            </p>
            <button
              type="button"
              onClick={() => {
                onClearQuote?.();
                inputRef.current?.focus();
              }}
              aria-label="Bỏ trích dẫn"
              title="Bỏ trích dẫn (Esc)"
              className="-my-1 grid size-8 shrink-0 place-items-center rounded-full text-quote-icon hover:bg-quote-close-bg-hover focus-visible:outline-2 focus-visible:outline-focus-ring pointer-coarse:size-10 [&_svg]:size-4"
            >
              <CloseIcon />
            </button>
          </div>
        )}
        <div className="flex min-h-10 items-end gap-1">
          <button
            type="button"
            aria-label="Đính kèm tệp"
            title="Đính kèm tệp"
            className="grid size-10 shrink-0 place-items-center rounded-full text-composer-icon hover:bg-composer-icon-bg-hover hover:text-composer-icon-hover focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            <ClipIcon />
          </button>
          <label htmlFor="msg" className="sr-only">Nội dung tin nhắn</label>
          <textarea
            ref={inputRef}
            id="msg"
            aria-describedby={quote ? "composer-quote" : undefined}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            enterKeyHint="send"
            className="field-sizing-content max-h-[8lh] min-h-[1lh] w-full min-w-0 flex-1 resize-none self-center bg-transparent px-1 py-2 text-input outline-none placeholder:text-composer-placeholder"
          />
          {/* Góc phải: micro luôn có; khi có chữ, micro trượt sang trái nhường chỗ cho nút gửi */}
          <motion.button
            layout
            type="button"
            aria-label="Nhập bằng giọng nói"
            title="Nhập bằng giọng nói"
            transition={{ type: "spring", bounce: 0, visualDuration: 0.2 }}
            className="grid size-10 shrink-0 place-items-center rounded-full text-composer-icon hover:bg-composer-icon-bg-hover hover:text-composer-icon-hover focus-visible:outline-2 focus-visible:outline-focus-ring"
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
                className="grid size-10 shrink-0 place-items-center rounded-full bg-composer-send-bg text-composer-send-icon hover:bg-composer-send-bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <SendIcon />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
    </form>
  );
}
