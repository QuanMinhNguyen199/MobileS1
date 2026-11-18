import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import MessageContent from "./MessageContent.jsx";
import Composer from "./Composer.jsx";
import { Avatar, BotAvatar, IconButton } from "./ui.jsx";
import { BackIcon, ChatIcon, ChevronDown, ChevronUp, CloseIcon, InfoIcon } from "../icons.jsx";

const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function RoundButton({ label, onClick, disabled, small, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`pointer-events-auto grid place-items-center rounded-full border-ink-2 bg-surface text-ink-2 transition-opacity motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-0 ${
        small ? "size-6 border-[0.96px] [&_svg]:size-3.5" : "size-10 border-[1.2px] md:size-[36.8px]"
      }`}
    >
      {children}
    </button>
  );
}

const ME = "Nguyễn Minh Quân";

export default function ChatPane({ conversation, typing, onSend, onBack, className = "" }) {
  const otherName = conversation.bot ? "GeoAgent" : conversation.name;
  const otherAvatar = conversation.bot ? <BotAvatar /> : <Avatar name={conversation.name} size="sm" />;
  const scroller = useRef(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const [navVisible, setNavVisible] = useState(true);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setAtTop(el.scrollTop < 40);
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }, []);

  const scrollTo = (top, smooth = true) =>
    scroller.current?.scrollTo({ top, behavior: smooth && !prefersReduced() ? "smooth" : "auto" });

  // Mở hội thoại: nhảy ngay xuống tin mới nhất
  useLayoutEffect(() => {
    scrollTo(scroller.current.scrollHeight, false);
    measure();
  }, [conversation.id, measure]);

  // Tin mới hoặc đang trả lời: cuộn mượt xuống cuối
  useEffect(() => {
    scrollTo(scroller.current.scrollHeight);
  }, [conversation.messages.length, typing]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <main className={`flex min-h-0 min-w-0 flex-col bg-chat ${className}`}>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-surface pr-3 pl-2 md:h-20 md:gap-4 md:pr-[14.4px] md:pl-6">
        <IconButton label="Quay lại danh sách" onClick={onBack} className="md:hidden">
          <BackIcon />
        </IconButton>
        <Avatar name={conversation.name} size="lg" status />
        <h1 id="chat-title" tabIndex={-1} className="m-0 min-w-0 flex-1 truncate text-[1.08rem] font-medium">{conversation.name}</h1>
        <div className="flex gap-3.5 [&_svg]:size-[24px]!">
          <IconButton label="Chủ đề trò chuyện"><ChatIcon /></IconButton>
          <IconButton label="Thông tin hội thoại"><InfoIcon /></IconButton>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scroller}
          onScroll={measure}
          tabIndex={0}
          aria-label="Tin nhắn"
          className="bg-dots h-full overflow-y-auto overscroll-contain px-4 focus-visible:-outline-offset-2 md:px-[72px]"
        >
          <div className="mx-auto flex min-h-full w-full max-w-[1100px] flex-col gap-4 py-4" aria-live="polite">
            {conversation.messages.map((m) =>
              m.from === "user" ? (
                <div key={m.id} className="flex max-w-[92%] items-end gap-2 self-end md:max-w-[min(75%,600px)]">
                  <div className="min-w-0">
                  <span className="sr-only">Bạn: </span>
                  <div className="rounded-[16px_16px_4px_16px] bg-brand-soft px-[14px] py-[9px] text-base leading-[1.45] whitespace-pre-wrap md:text-[15.2px] [overflow-wrap:anywhere]">
                    {m.text}
                  </div>
                  <time className="mt-1 block pr-1 text-right text-[12px] text-ink-2">{m.time}</time>
                  </div>
                  <span className="mb-[22px]"><Avatar name={ME} size="sm" /></span>
                </div>
              ) : (
                <div key={m.id} className="flex max-w-full items-end gap-2 self-start">
                  {otherAvatar}
                  <div className="min-w-0 w-fit max-w-full rounded-[16px_16px_16px_4px] bg-surface px-4 py-3 md:max-w-[min(100%,860px)] md:px-[18px] md:py-[14px]">
                    <span className="sr-only">{otherName}: </span>
                    <MessageContent blocks={m.blocks} />
                  </div>
                </div>
              )
            )}
            {typing && (
              <div className="flex max-w-full items-end gap-2 self-start">
                {otherAvatar}
                <div className="w-fit max-w-full rounded-[16px_16px_16px_4px] bg-surface px-4 py-3 md:max-w-[min(100%,860px)] md:px-[18px] md:py-[14px]">
                <span role="status" aria-label="GeoAgent đang trả lời" className="inline-flex gap-1 py-1">
                  {[0, 200, 400].map((d) => (
                    <i key={d} className="animate-blink size-[5.6px] rounded-full bg-ink-2 motion-reduce:animate-none" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {navVisible && (
          <div className="pointer-events-none absolute inset-y-3 right-3 hidden flex-col md:flex items-center justify-between md:inset-y-8 md:right-[23.2px]">
            <div className="flex flex-col items-center gap-2">
              <RoundButton label="Lên đầu hội thoại" disabled={atTop} onClick={() => scrollTo(0)}>
                <ChevronUp />
              </RoundButton>
              <RoundButton label="Ẩn nút cuộn" small onClick={() => { setNavVisible(false); scroller.current.focus(); }}>
                <CloseIcon />
              </RoundButton>
            </div>
            <RoundButton label="Xuống tin mới nhất" disabled={atBottom} onClick={() => scrollTo(scroller.current.scrollHeight)}>
              <ChevronDown />
            </RoundButton>
          </div>
        )}
      </div>

      <Composer key={conversation.id} onSend={onSend} />
    </main>
  );
}
