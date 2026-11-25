import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import MessageContent from "./MessageContent.jsx";
import Composer from "./Composer.jsx";
import AnswerFooter from "./AnswerFooter.jsx";
import PopupMenu from "./PopupMenu.jsx";
import SelectionReply from "./SelectionReply.jsx";
import SwipeReply from "./SwipeReply.jsx";
import { toQuote } from "../answerText.js";
import MobileWebPane from "./MobileWebPane.jsx";
import useMobileViewport from "../useMobileViewport.js";
import useWebChatSheet from "../useWebChatSheet.js";
import { Avatar, BotAvatar, IconButton } from "./ui.jsx";
import { ChevronDown, ChevronUp, EditIcon, MenuIcon, MoreIcon, RetryIcon, WarningIcon } from "../icons.jsx";

const ME = "Nguyễn Minh Quân";
// Gợi ý cho phiên mới (trạng thái rỗng): bấm là gửi luôn
const SUGGESTIONS = [
  "So sánh nghĩa vụ thuế TNDN năm 2025 với 2024",
  "Hạn nộp hồ sơ quyết toán thuế TNDN là khi nào?",
  "Giải thích cách tính thuế GTGT phải nộp theo phương pháp khấu trừ",
];
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

// webLink/onOpenWeb/onCloseWeb: link đang mở của phiên này (App.jsx lưu theo phiên; máy tính hiện bên phải, điện thoại hiện trong khung). compact: cột chat hẹp khi khung web mở.
export default function ChatPane({ conversation, typing, onSend, onRetry, onNewChat, actions = [], online = true, onMenu, webLink = null, onOpenWeb, onCloseWeb, compact = false, inert = false, className = "" }) {
  const scroller = useRef(null);
  const [atTop, setAtTop] = useState(true);
  // Link do App.jsx lưu theo từng phiên. Điện thoại: khung trò chuyện mở/thu gọn cũng nhớ theo phiên.
  const link = webLink;
  const [chatOpenById, setChatOpenById] = useState({});
  const webChatOpen = chatOpenById[conversation.id] ?? true;
  const setWebChatOpen = (value) =>
    setChatOpenById((all) => ({ ...all, [conversation.id]: typeof value === "function" ? value(all[conversation.id] ?? true) : value }));
  // Bản nháp ô soạn tin của từng phiên: đổi phiên rồi quay lại vẫn còn chữ đang gõ dở
  const drafts = useRef(new Map());
  // Đoạn đang trả lời của từng phiên ({ text, key }): từ đoạn bôi đen, vuốt tin (điện thoại) hoặc nút Trả lời
  const [quotes, setQuotes] = useState({});
  const quote = quotes[conversation.id] ?? null;
  const replyTo = (text) => {
    if (!text) return;
    setQuotes((all) => ({ ...all, [conversation.id]: { text, key: Date.now() } }));
  };
  const clearQuote = () => setQuotes(({ [conversation.id]: _removed, ...rest }) => rest);
  const collapseWebChat = () => {
    setWebChatOpen(false);
    requestAnimationFrame(() => document.querySelector(".mobile-web-chat-toggle")?.focus());
  };
  const sheet = useWebChatSheet({ onCollapse: collapseWebChat });
  const viewport = useMobileViewport();
  const [atBottom, setAtBottom] = useState(true);

  // Vị trí cuộn của từng phiên: quay lại phiên cũ thì đứng đúng chỗ đã đọc; phiên chưa mở lần nào thì xuống tin mới nhất
  const positions = useRef(new Map());
  const currentId = useRef(conversation.id);
  const lastCount = useRef(conversation.messages.length);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    positions.current.set(currentId.current, el.scrollTop);
    setAtTop(el.scrollTop < 40);
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }, []);

  const scrollTo = (top, smooth = true) =>
    scroller.current?.scrollTo({ top, behavior: smooth && !prefersReduced() ? "smooth" : "auto" });

  useLayoutEffect(() => {
    currentId.current = conversation.id;
    lastCount.current = conversation.messages.length;
    const saved = positions.current.get(conversation.id);
    scrollTo(saved ?? scroller.current.scrollHeight, false);
    measure();
  }, [conversation.id, measure]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chỉ tự cuộn xuống khi chính phiên đang xem có tin mới hoặc bắt đầu trả lời (không phải khi đổi phiên)
  useEffect(() => {
    const grew = conversation.messages.length > lastCount.current;
    lastCount.current = conversation.messages.length;
    if (grew || typing) scrollTo(scroller.current.scrollHeight);
  }, [conversation.messages.length, typing]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // Người trả lời luôn là GeoAgent, không lấy tên phiên làm tên người gửi
  const otherName = "GeoAgent";
  const otherAvatar = <BotAvatar size={28} />;
  const webActive = viewport.mobile && Boolean(link);

  const openLink = (next, origin) => {
    onOpenWeb?.(next, origin || document.activeElement);
    if (viewport.mobile) setWebChatOpen(true);
  };
  const closeLink = () => onCloseWeb?.(); // App.jsx trả focus về link vừa bấm

  return (
    <main inert={inert} data-web-active={webActive} style={webActive ? { height: viewport.height, maxHeight: "100%" } : undefined} className={`relative flex min-h-0 flex-col bg-chat-bg ${className}`}>
      {/* Header không có thanh: tin nhắn cuộn lên nhạt dần rồi biến mất ở mép trên (giống dải mờ phía trên ô soạn tin).
          Chỉ các nút (điện thoại) nổi trên dải mờ. Khi khung web mở trên điện thoại, header nằm trong luồng với nền đặc. */}
      <header
        className={`${viewport.mobile && link ? "relative shrink-0 bg-chat-bg" : "pointer-events-none absolute inset-x-0 top-0"} z-20 flex items-center gap-3 px-3 pt-[var(--safe-top)] md:px-6`}
      >
        {!(viewport.mobile && link) && (
          <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[calc(5rem+var(--safe-top))] bg-linear-to-b/srgb from-chat-header-fade from-40% to-chat-header-fade/0" />
        )}
        <div className="flex h-16 min-w-0 flex-1 items-center gap-3">
          {/* Điện thoại: kiểu Gemini, danh sách hội thoại mở từ nút menu */}
          <IconButton label="Mở danh sách hội thoại" onClick={onMenu} data-menu-button className="pointer-events-auto -ml-1 md:hidden">
            <MenuIcon />
          </IconButton>
          {/* Tiêu đề ẩn: trình đọc màn hình vẫn biết đang ở phiên nào; Root.jsx chuyển focus vào đây sau khi đăng nhập */}
          <h1 id="chat-title" tabIndex={-1} className="sr-only">
            {conversation.topic ?? conversation.name}
          </h1>
          <div className="min-w-0 flex-1" />
          <IconButton label="Cuộc trò chuyện mới" onClick={onNewChat} className="pointer-events-auto md:hidden"><EditIcon /></IconButton>
          {/* Tùy chọn của phiên đang mở: cùng các mục với menu ⋮ của phiên ở danh sách */}
          {actions.length > 0 && (
            <div className="pointer-events-auto -mr-1 flex">
              <PopupMenu
                label={`Tùy chọn cho phiên “${conversation.topic ?? conversation.name}”`}
                title="Tùy chọn"
                icon={<MoreIcon />}
                items={actions}
                triggerClassName="inline-grid size-9 shrink-0 place-items-center rounded-lg text-icon-button-icon hover:bg-icon-button-bg-hover hover:text-icon-button-icon-hover focus-visible:outline-2 focus-visible:outline-focus-ring aria-expanded:bg-icon-button-bg-hover aria-expanded:text-icon-button-icon-hover [&_svg]:size-5"
              />
            </div>
          )}
        </div>
      </header>

      <div className="chat-workspace flex min-h-0 flex-1 flex-col" data-web-active={webActive}
        data-sheet-resizing={webActive && sheet.resizing}
        style={webActive ? { "--chat-sheet-size": webChatOpen ? `${sheet.extent}%` : "0px", "--chat-sheet-gap": webChatOpen ? "8px" : "0px", "--chat-bar-size": webChatOpen ? "0px" : "calc(48px + var(--safe-bottom))" } : undefined}>
      {viewport.mobile && link && <MobileWebPane key={`${conversation.id}|${link.url}`} link={link} onClose={closeLink} />}
      <div id="mobile-web-chat" hidden={webActive && !webChatOpen}
        role={webActive ? "region" : undefined} aria-label={webActive ? `Trò chuyện với ${otherName}` : undefined}
        className="mobile-web-chat flex min-h-0 flex-1 flex-col overflow-hidden bg-chat-bg"
        onKeyDown={event => {
          if (webActive && event.key === "Escape") {
            collapseWebChat();
          }
        }}>
      {webActive && <div className="mobile-web-chat-heading">
        <div {...sheet.handleProps} className="mobile-web-chat-handle" title="Kéo lên/xuống; phím mũi tên để đổi chiều cao">
          <span className="mobile-web-chat-grip" aria-hidden="true" />
        </div>
        <button type="button" aria-label="Thu gọn khung trò chuyện" onClick={collapseWebChat}
          className="grid size-11 shrink-0 place-items-center rounded-lg text-icon-button-icon hover:bg-icon-button-bg-hover focus-visible:outline-2 focus-visible:outline-focus-ring"><ChevronDown /></button>
      </div>}
      <div className="mobile-web-chat-body relative min-h-0 flex-1">
        <div ref={scroller} onScroll={measure} tabIndex={0} aria-label="Tin nhắn" className="h-full overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring">
          {/* Ô soạn tin nằm trong vùng cuộn và dính ở đáy (sticky): nội dung cuộn ra phía sau, không còn dải nền che chữ */}
          <div className="flex min-h-full flex-col">
          <div className={`mx-auto flex w-full max-w-[1040px] flex-1 flex-col gap-8 px-4 pb-6 ${compact ? "" : "md:px-6"} ${viewport.mobile && link ? "pt-4" : "pt-[calc(4rem+var(--safe-top)+1rem)]"}`} aria-live="polite">
            {conversation.messages.length === 0 && !typing && (
              <section aria-labelledby="empty-title" className="my-auto flex flex-col items-start gap-5 py-8">
                <div className="flex items-center gap-3">
                  <BotAvatar size={36} />
                  <h2 id="empty-title" className="m-0 text-display">Bạn cần GeoAgent hỗ trợ việc gì?</h2>
                </div>
                <ul className="m-0 flex w-full list-none flex-col gap-2 p-0 md:max-w-xl">
                  {SUGGESTIONS.map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        onClick={() => onSend(q)}
                        className="w-full rounded-2xl border border-message-bot-border bg-message-bot-bg px-4 py-3 text-left text-sm text-content-text transition-colors hover:bg-icon-button-bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {conversation.messages.map((m) =>
              m.from === "user" ? (
                <div key={m.id} className={`flex max-w-[85%] flex-col items-end self-end ${compact ? "" : "md:max-w-[75%]"}`}>
                  <span className="sr-only">Bạn: </span>
                  {m.quote && (
                    <blockquote className="m-0 mb-1.5 max-w-full border-l-2 border-quote-bar py-0.5 pl-2.5 text-small text-quote-text">
                      <span className="sr-only">Trả lời đoạn: </span>
                      <span className="line-clamp-2 [overflow-wrap:anywhere]">{m.quote}</span>
                    </blockquote>
                  )}
                  <div className="rounded-bubble rounded-br-bubble-tip bg-message-user-bg px-4 py-2.5 text-bubble whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {m.text}
                  </div>
                  {/* Avatar nằm trên dòng giờ gửi để mép phải bong bóng thẳng với mép ô soạn tin */}
                  {m.status === "failed" ? (
                    <p className="m-0 mt-1.5 flex flex-wrap items-center justify-end gap-x-2 text-xs text-message-user-error">
                      <WarningIcon size={14} className="shrink-0" />
                      <span>Chưa gửi được{online ? "." : ": mất kết nối mạng."}</span>
                      <button
                        type="button"
                        onClick={() => onRetry(m.id)}
                        disabled={!online}
                        className="inline-flex h-8 items-center gap-1 rounded-full px-2 font-medium text-message-user-error underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline pointer-coarse:h-10 [&_svg]:size-3.5"
                      >
                        <RetryIcon />
                        Thử lại
                      </button>
                    </p>
                  ) : (
                    <p className="m-0 mt-1.5 flex items-center gap-2 text-xs text-message-user-meta">
                      <time className="tabular-nums">{m.time}</time>
                      <Avatar name={ME} size={22} />
                    </p>
                  )}
                </div>
              ) : (
                <article key={m.id} className="w-full">
                  <div className="min-w-0">
                    <SwipeReply enabled={viewport.mobile} onReply={() => replyTo(toQuote(m.blocks))}>
                      <p className="m-0 mb-2 flex items-center gap-2 text-small">
                        {otherAvatar}
                        <span className="font-medium text-message-bot-sender">{otherName}</span>
                        <time className="text-xs text-message-bot-meta tabular-nums">{m.time}</time>
                      </p>
                      <div data-reply-source className="w-full rounded-bubble rounded-tl-bubble-tip border border-message-bot-border bg-message-bot-bg px-4 py-3.5 shadow-bubble md:px-5 md:py-4">
                        <MessageContent blocks={m.blocks} onOpenLink={openLink} linkPreviewMode={viewport.mobile ? "panel" : "dialog"} />
                      </div>
                    </SwipeReply>
                    <AnswerFooter blocks={m.blocks} title={conversation.topic ?? conversation.name} onReply={replyTo} />
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
          <Composer key={conversation.id} draft={drafts.current.get(conversation.id)} onDraft={(t) => drafts.current.set(conversation.id, t)} onSend={onSend} quote={quote} onClearQuote={clearQuote} compact={compact} offline={!online} placeholder="Hỏi GeoAgent" />
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
      {webActive && !webChatOpen && <button type="button" className="mobile-web-chat-toggle text-sm font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
        aria-expanded={webChatOpen} aria-controls="mobile-web-chat" onClick={() => setWebChatOpen(value => !value)}>
        <span>GeoChat</span>
        {webChatOpen ? <ChevronDown /> : <ChevronUp />}
      </button>}
      </div>
      {!inert && <SelectionReply onReply={replyTo} scroller={scroller} />}
    </main>
  );
}
