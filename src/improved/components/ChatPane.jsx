import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import MessageContent from "./MessageContent.jsx";
import Composer from "./Composer.jsx";
import MobileWebPane from "./MobileWebPane.jsx";
import useMobileViewport from "../useMobileViewport.js";
import { Avatar, BotAvatar, IconButton } from "./ui.jsx";
import { ChevronDown, ChevronUp, EditIcon, InfoIcon, MenuIcon } from "../icons.jsx";

const ME = "Nguyễn Minh Quân";
const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ScrollButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="pointer-events-auto grid size-9 place-items-center rounded-full border border-scroll-button-border bg-scroll-button-bg text-scroll-button-icon shadow-float transition-opacity hover:text-scroll-button-icon-hover motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-0 [&_svg]:size-[18px]"
    >
      {children}
    </button>
  );
}

// onOpenWeb (máy tính): mở link trong khung web bên phải do App.jsx đặt. compact: cột chat hẹp khi khung web mở.
export default function ChatPane({ conversation, typing, onSend, onMenu, onOpenWeb, compact = false, inert = false, className = "" }) {
  const scroller = useRef(null);
  const [atTop, setAtTop] = useState(true);
  const [link, setLink] = useState(null);
  const linkOrigin = useRef(null);
  const viewport = useMobileViewport();
  const [atBottom, setAtBottom] = useState(true);
  const [scrolled, setScrolled] = useState(false); // nội dung đã cuộn vào dưới header

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setAtTop(el.scrollTop < 40);
    setScrolled(el.scrollTop > 2);
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }, []);

  const scrollTo = (top, smooth = true) =>
    scroller.current?.scrollTo({ top, behavior: smooth && !prefersReduced() ? "smooth" : "auto" });

  useLayoutEffect(() => {
    scrollTo(scroller.current.scrollHeight, false);
    measure();
  }, [conversation.id, measure]);

  useEffect(() => {
    scrollTo(scroller.current.scrollHeight);
  }, [conversation.messages.length, typing]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const otherName = conversation.bot ? "GeoAgent" : conversation.name;
  const otherAvatar = conversation.bot ? <BotAvatar size={28} /> : <Avatar name={conversation.name} size={28} />;

  const openLink = (next, origin) => {
    if (!viewport.mobile && onOpenWeb) return onOpenWeb(next, origin || document.activeElement);
    linkOrigin.current = origin || document.activeElement;
    setLink(next);
  };
  const closeLink = () => {
    setLink(null);
    const origin = linkOrigin.current;
    requestAnimationFrame(() => {
      if (origin?.isConnected) origin.focus({ preventScroll: true });
      else document.getElementById("chat-title")?.focus({ preventScroll: true });
    });
  };

  return (
    <main inert={inert} style={viewport.mobile && link ? { height: viewport.height, maxHeight: "100%" } : undefined} className={`relative flex min-h-0 flex-col bg-chat-bg ${className}`}>
      {/* Header kính mờ nổi trên nội dung: tin nhắn cuộn ra phía sau và bị làm mờ.
          Không tiêu đề (chủ đề đã ở danh sách). Đã cuộn thì hiện đường kẻ mảnh để tách lớp. */}
      <header
        className={`${viewport.mobile && link ? "relative shrink-0" : "absolute inset-x-0 top-0"} z-20 flex items-center gap-3 border-b bg-chat-bg/70 px-3 pt-[var(--safe-top)] backdrop-blur-xl backdrop-saturate-150 transition-colors md:px-6 ${
          scrolled ? "border-chat-header-border" : "border-transparent"
        }`}
      >
        <div className="flex h-16 min-w-0 flex-1 items-center gap-3">
          {/* Điện thoại: kiểu Gemini, danh sách hội thoại mở từ nút menu */}
          <IconButton label="Mở danh sách hội thoại" onClick={onMenu} data-menu-button className="-ml-1 md:hidden">
            <MenuIcon />
          </IconButton>
          {/* Tiêu đề ẩn: trình đọc màn hình vẫn biết đang ở phiên nào; Root.jsx chuyển focus vào đây sau khi đăng nhập */}
          <h1 id="chat-title" tabIndex={-1} className="sr-only">
            {conversation.topic ?? conversation.name}
          </h1>
          <div className="min-w-0 flex-1" />
          <IconButton label="Thông tin hội thoại" className="max-md:hidden"><InfoIcon /></IconButton>
          <IconButton label="Cuộc trò chuyện mới" className="-mr-1 md:hidden"><EditIcon /></IconButton>
        </div>
      </header>

      <div className="chat-workspace flex min-h-0 flex-1 flex-col">
      {viewport.mobile && link && <MobileWebPane key={link.url} link={link} onClose={closeLink} />}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-chat-bg">
      <div className="relative min-h-0 flex-1">
        <div ref={scroller} onScroll={measure} tabIndex={0} aria-label="Tin nhắn" className="h-full overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring">
          {/* Ô soạn tin nằm trong vùng cuộn và dính ở đáy (sticky): nội dung cuộn ra phía sau, không còn dải nền che chữ */}
          <div className="flex min-h-full flex-col">
          <div className={`mx-auto flex w-full max-w-[1040px] flex-1 flex-col gap-8 px-4 pb-6 ${compact ? "" : "md:px-6"} ${viewport.mobile && link ? "pt-4" : "pt-[calc(4rem+var(--safe-top)+1rem)]"}`} aria-live="polite">
            {conversation.messages.map((m) =>
              m.from === "user" ? (
                <div key={m.id} className={`flex max-w-[85%] flex-col items-end self-end ${compact ? "" : "md:max-w-[75%]"}`}>
                  <span className="sr-only">Bạn: </span>
                  <div className="rounded-bubble rounded-br-bubble-tip bg-message-user-bg px-4 py-2.5 text-bubble whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {m.text}
                  </div>
                  {/* Avatar nằm trên dòng giờ gửi để mép phải bong bóng thẳng với mép ô soạn tin */}
                  <p className="m-0 mt-1.5 flex items-center gap-2 text-xs text-message-user-meta">
                    <time className="tabular-nums">{m.time}</time>
                    <Avatar name={ME} size={22} />
                  </p>
                </div>
              ) : (
                <article key={m.id} className="w-full">
                  <div className="min-w-0">
                    <p className="m-0 mb-2 flex items-center gap-2 text-small">
                      {otherAvatar}
                      <span className="font-medium text-message-bot-sender">{otherName}</span>
                      <time className="text-xs text-message-bot-meta tabular-nums">{m.time}</time>
                    </p>
                    <div className="w-full rounded-bubble rounded-tl-bubble-tip border border-message-bot-border bg-message-bot-bg px-4 py-3.5 shadow-bubble md:px-5 md:py-4">
                      <MessageContent blocks={m.blocks} onOpenLink={openLink} linkPreviewMode={viewport.mobile ? "panel" : "dialog"} />
                    </div>
                  </div>
                </article>
              )
            )}
            {typing && (
              <div className="flex items-center gap-3">
                {otherAvatar}
                <span role="status" aria-label={`${otherName} đang trả lời`} className="inline-flex gap-1.5">
                  {[0, 200, 400].map((d) => (
                    <i key={d} className="animate-blink size-1.5 rounded-full bg-chat-typing-dot motion-reduce:animate-none" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              </div>
            )}
          </div>
          <Composer key={conversation.id} onSend={onSend} compact={compact} placeholder={conversation.bot ? "Hỏi GeoAgent" : "Nhắn tin"} />
          </div>
        </div>

        <div className={`pointer-events-none absolute top-[calc(4rem+var(--safe-top)+1rem)] right-4 bottom-[104px] hidden flex-col justify-between ${compact ? "" : "md:flex"}`}>
          <ScrollButton label="Lên đầu hội thoại" disabled={atTop} onClick={() => scrollTo(0)}>
            <ChevronUp />
          </ScrollButton>
          <ScrollButton label="Xuống tin mới nhất" disabled={atBottom} onClick={() => scrollTo(scroller.current.scrollHeight)}>
            <ChevronDown />
          </ScrollButton>
        </div>
      </div>
      </div>
      </div>
    </main>
  );
}
