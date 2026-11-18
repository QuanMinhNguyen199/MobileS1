import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LOGIN_ASSETS } from "../assets.js";
import MessageContent from "./MessageContent.jsx";
import Composer from "./Composer.jsx";
import { Avatar, BotAvatar, IconButton } from "./ui.jsx";
import { ChevronDown, ChevronUp, EditIcon, InfoIcon, MenuIcon } from "../icons.jsx";

const ME = "Nguyễn Minh Quân";
const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function kindOf(c) {
  if (c.bot) return "Trợ lý GeoAgent trong phòng";
  if (c.tags.includes("room")) return "Phòng";
  return "Liên hệ";
}

function ScrollButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="pointer-events-auto grid size-9 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-[0_2px_8px_rgb(29_20_22_/_0.08)] transition-opacity hover:text-ink motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-0 [&_svg]:size-[18px]"
    >
      {children}
    </button>
  );
}

export default function ChatPane({ conversation, typing, onSend, onMenu, logoRef, logoHidden, inert = false, className = "" }) {
  const scroller = useRef(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setAtTop(el.scrollTop < 40);
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

  return (
    <main inert={inert} className={`flex min-h-0 flex-col bg-surface ${className}`}>
      <header className="flex shrink-0 items-center gap-3 border-b border-rule px-3 pt-[var(--safe-top)] md:px-6">
        <div className="flex h-16 min-w-0 flex-1 items-center gap-3">
          {/* Điện thoại: kiểu Gemini, danh sách hội thoại mở từ nút menu */}
          <IconButton label="Mở danh sách hội thoại" onClick={onMenu} data-menu-button className="-ml-1 md:hidden">
            <MenuIcon />
          </IconButton>
          {/* Trên điện thoại, quốc huy bay vào đây sau khi đăng nhập */}
          {logoRef && (
            <img ref={logoRef} src={LOGIN_ASSETS.emblem} alt="" width="400" height="407" className={`h-auto w-7 shrink-0 md:hidden ${logoHidden ? "invisible" : ""}`} />
          )}
          <div className="min-w-0 flex-1">
            <h1 id="chat-title" tabIndex={-1} className="m-0 truncate text-base leading-tight font-semibold outline-none">
              {conversation.name}
            </h1>
            <p className="m-0 truncate text-xs text-ink-2">{kindOf(conversation)}</p>
          </div>
          <IconButton label="Thông tin hội thoại" className="max-md:hidden"><InfoIcon /></IconButton>
          <IconButton label="Cuộc trò chuyện mới" className="md:hidden"><EditIcon /></IconButton>
          <span className="md:hidden"><Avatar name={ME} size={30} /></span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
      <div className="relative min-h-0 flex-1">
        <div ref={scroller} onScroll={measure} tabIndex={0} aria-label="Tin nhắn" className="h-full overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus">
          {/* Ô soạn tin nằm trong vùng cuộn và dính ở đáy (sticky): nội dung cuộn ra phía sau, không còn dải nền che chữ */}
          <div className="flex min-h-full flex-col">
          <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col gap-8 px-4 pt-4 pb-6 md:px-6" aria-live="polite">
            {conversation.messages.map((m) =>
              m.from === "user" ? (
                <div key={m.id} className="flex max-w-[85%] flex-col items-end self-end md:max-w-[75%]">
                  <span className="sr-only">Bạn: </span>
                  <div className="rounded-[20px_20px_6px_20px] bg-brand-soft px-4 py-2.5 text-[15px] leading-[1.5] whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {m.text}
                  </div>
                  {/* Avatar nằm trên dòng giờ gửi để mép phải bong bóng thẳng với mép ô soạn tin */}
                  <p className="m-0 mt-1.5 flex items-center gap-2 text-xs text-ink-2">
                    <time className="tabular-nums">{m.time}</time>
                    <Avatar name={ME} size={22} />
                  </p>
                </div>
              ) : (
                <article key={m.id} className="w-full">
                  <div className="min-w-0">
                    <p className="m-0 mb-2 flex items-center gap-2 text-[13px]">
                      {otherAvatar}
                      <span className="font-medium text-ink">{otherName}</span>
                      <time className="text-xs text-ink-2 tabular-nums">{m.time}</time>
                    </p>
                    <div className="w-full rounded-[6px_20px_20px_20px] border border-bubble-edge bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgb(29_20_22_/_0.05),0_6px_16px_rgb(29_20_22_/_0.05)] md:px-5 md:py-4">
                      <MessageContent blocks={m.blocks} />
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
                    <i key={d} className="animate-blink size-1.5 rounded-full bg-ink-2 motion-reduce:animate-none" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              </div>
            )}
          </div>
          <Composer key={conversation.id} onSend={onSend} placeholder={conversation.bot ? "Hỏi GeoAgent" : "Nhắn tin"} />
          </div>
        </div>

        <div className="pointer-events-none absolute top-4 right-4 bottom-[104px] hidden flex-col justify-between md:flex">
          <ScrollButton label="Lên đầu hội thoại" disabled={atTop} onClick={() => scrollTo(0)}>
            <ChevronUp />
          </ScrollButton>
          <ScrollButton label="Xuống tin mới nhất" disabled={atBottom} onClick={() => scrollTo(scroller.current.scrollHeight)}>
            <ChevronDown />
          </ScrollButton>
        </div>
      </div>
      </div>
    </main>
  );
}
