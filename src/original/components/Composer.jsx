import { useRef, useState } from "react";
import { IconButton } from "./ui.jsx";
import { ClipIcon, SendIcon, SmileIcon } from "../icons.jsx";

export default function Composer({ onSend }) {
  const [text, setText] = useState("");
  const formRef = useRef(null);
  const empty = text.trim() === "";

  const submit = (e) => {
    e.preventDefault();
    if (empty) return;
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
    <form ref={formRef} onSubmit={submit} className="flex shrink-0 items-end gap-2 bg-chat px-4 pt-1 pb-3 md:pt-0.5 md:pr-4 md:pb-[14.4px] md:pl-[42.4px]">
      <div className="flex min-h-[41.6px] min-w-0 flex-1 items-end gap-1.5 rounded-[25.6px] border border-line-strong bg-surface p-1 pl-1.5 focus-within:border-focus focus-within:ring-1 focus-within:ring-focus md:min-h-[52.8px] md:py-[9.6px] md:pr-[7.2px] md:pl-1">
        <IconButton label="Chèn biểu tượng cảm xúc"><SmileIcon /></IconButton>
        <label htmlFor="msg" className="sr-only">Nội dung tin nhắn</label>
        <textarea
          id="msg"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nhắn tin..."
          enterKeyHint="send"
          className="field-sizing-content max-h-[8lh] min-h-[1lh] w-full min-w-0 flex-1 resize-none self-center bg-transparent py-1.5 text-lg leading-[1.4] outline-none placeholder:text-ink-2"
        />
        <button
          type="submit"
          aria-label="Gửi tin nhắn"
          disabled={empty}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white disabled:bg-send disabled:opacity-60"
        >
          <SendIcon />
        </button>
      </div>
      <IconButton label="Đính kèm tệp" className="mb-1.5 md:mb-[10.4px]"><ClipIcon /></IconButton>
    </form>
  );
}
