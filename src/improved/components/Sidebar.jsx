import { useState } from "react";
import { LOGIN_ASSETS } from "../assets.js";
import { FILTERS } from "../data.js";
import { Avatar } from "./ui.jsx";
import { CloseIcon, EditIcon } from "../icons.jsx";

const TABS = [{ key: null, label: "Tất cả" }, ...FILTERS];
const ME = "Nguyễn Minh Quân";
const lastTime = (c) => c.messages.at(-1)?.time ?? "";

// Sidebar đỏ thương hiệu. Kiểu chữ: Plus Jakarta Sans cho tên sản phẩm, Inter cho phần còn lại.
export default function Sidebar({ conversations, activeId, showActive, onOpen, query, onQuery, logoRef, logoHidden, onClose, className = "" }) {
  const [filter, setFilter] = useState(null);

  const q = query.trim().toLocaleLowerCase("vi");
  const items = conversations.filter((c) => {
    if (filter === "unread" && !c.unread) return false;
    if (filter && filter !== "unread" && !c.tags.includes(filter)) return false;
    if (q && !`${c.name} ${c.preview}`.toLocaleLowerCase("vi").includes(q)) return false;
    return true;
  });

  return (
    <aside
      aria-label="Danh sách hội thoại"
      className={`flex min-h-0 flex-col bg-frame pt-[var(--safe-top)] pb-[var(--safe-bottom)] text-on-frame ${className}`}
    >
      {/* Thương hiệu */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-4">
        <img ref={logoRef} src={LOGIN_ASSETS.emblem} alt="" width="400" height="407" className={`h-auto w-8 shrink-0 ${logoHidden ? "invisible" : ""}`} />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base leading-5 font-semibold tracking-[-0.01em]">GeoAgent</p>
          <p className="text-xs leading-4 text-on-frame-muted">Trợ lý AI thông minh</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng danh sách hội thoại"
            className="-mr-1 grid size-10 place-items-center rounded-full text-on-frame-muted hover:bg-frame-hover hover:text-on-frame focus-visible:outline-2 focus-visible:outline-on-frame [&_svg]:size-5"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Tạo hội thoại: biểu tượng + chữ, gọn như Gemini */}
      <div className="px-2">
        <button
          type="button"
          className="flex h-10 items-center gap-3 rounded-full pr-4 pl-3 text-sm font-medium text-on-frame transition-colors hover:bg-frame-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-frame [&_svg]:size-[18px]"
        >
          <EditIcon />
          Cuộc trò chuyện mới
        </button>
      </div>

      {/* Ô tìm kiếm: nền đỏ tối, viền và placeholder đủ rõ; nút xóa chỉ hiện khi đã gõ */}
      <label className="relative mx-3 mt-2 flex h-10 items-center rounded-full border border-frame-edge bg-frame-sunken px-4 focus-within:border-on-frame focus-within:ring-1 focus-within:ring-on-frame">
        <span className="sr-only">Tìm hội thoại</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onQuery("")}
          placeholder="Tìm hội thoại"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-on-frame outline-none placeholder:text-on-frame-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="Xóa tìm kiếm"
            onClick={() => onQuery("")}
            className="-mr-2 grid size-7 place-items-center rounded-full text-on-frame-muted hover:bg-frame-hover hover:text-on-frame [&_svg]:size-4"
          >
            <CloseIcon />
          </button>
        )}
      </label>

      {/* Tab lọc: chia đều trong lề 16px hai bên */}
      <div role="group" aria-label="Lọc hội thoại" className="mx-4 mt-3 flex justify-between border-b border-on-frame/15">
        {TABS.map((t) => {
          const on = filter === t.key;
          return (
            <button
              key={t.label}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(t.key)}
              className={`-mb-px border-b-2 pt-1 pb-2 text-[13px] leading-[18px] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-on-frame ${
                on ? "border-gold text-on-frame font-semibold" : "border-transparent text-on-frame-muted hover:text-on-frame"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="m-0 flex-1 px-4 py-8 text-center text-sm text-on-frame-muted">Không có hội thoại phù hợp.</p>
      ) : (
        <ul className="m-0 min-h-0 flex-1 list-none space-y-0.5 overflow-y-auto px-2 py-2">
          {items.map((c) => {
            const selected = showActive && c.id === activeId;
            const muted = selected ? "text-on-frame-active-muted" : "text-on-frame-muted group-hover:text-on-frame-muted-strong";
            return (
              <li key={c.id}>
                <button
                  type="button"
                  data-id={c.id}
                  aria-current={selected ? "true" : undefined}
                  onClick={() => onOpen(c.id)}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-on-frame ${
                    selected ? "bg-frame-active text-brand" : "hover:bg-frame-hover"
                  }`}
                >
                  <Avatar name={c.name} size={36} tone={selected ? "selected" : "frame"} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span
                        className={`min-w-0 flex-1 truncate text-sm leading-5 ${
                          c.unread ? "font-[650]" : "font-medium"
                        }`}
                      >
                        {c.name}
                      </span>
                      <span className={`shrink-0 text-xs leading-4 tabular-nums ${muted}`}>{lastTime(c)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`min-w-0 flex-1 truncate text-[13px] leading-[18px] ${c.unread && !selected ? "text-on-frame" : muted}`}>
                        {c.preview}
                      </span>
                      {c.unread && (
                        <>
                          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-gold" />
                          <span className="sr-only">Chưa đọc</span>
                        </>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Người dùng */}
      <div className="flex items-center gap-3 border-t border-on-frame/15 px-4 py-3">
        <Avatar name={ME} size={32} tone="frame" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{ME}</span>
      </div>
    </aside>
  );
}
