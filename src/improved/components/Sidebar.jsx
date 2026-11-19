import { useState } from "react";
import { LOGIN_ASSETS } from "../assets.js";
import { FILTERS } from "../data.js";
import { CloseIcon, EditIcon } from "../icons.jsx";
import Settings from "./Settings.jsx";

const TABS = [{ key: null, label: "Tất cả" }, ...FILTERS];
const ME = "Nguyễn Minh Quân";

// Sidebar đỏ thương hiệu. Kiểu chữ: Plus Jakarta Sans cho tên sản phẩm, Inter cho phần còn lại.
export default function Sidebar({ conversations, activeId, showActive, onOpen, query, onQuery, logoRef, logoHidden, onClose, className = "" }) {
  const [filter, setFilter] = useState(null);

  const q = query.trim().toLocaleLowerCase("vi");
  const items = conversations.filter((c) => {
    if (filter === "unread" && !c.unread) return false;
    if (filter && filter !== "unread" && !c.tags.includes(filter)) return false;
    if (q && !`${c.topic ?? ""} ${c.name} ${c.preview}`.toLocaleLowerCase("vi").includes(q)) return false;
    return true;
  });

  return (
    <aside
      aria-label="Danh sách hội thoại"
      className={`flex min-h-0 flex-col bg-sidebar-bg pt-[var(--safe-top)] pb-[var(--safe-bottom)] text-sidebar-text ${className}`}
    >
      {/* Thương hiệu */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-4">
        <img ref={logoRef} src={LOGIN_ASSETS.emblem} alt="" width="400" height="407" className={`h-auto w-8 shrink-0 ${logoHidden ? "invisible" : ""}`} />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-wordmark">GeoAgent</p>
          <p className="text-xs leading-4 text-sidebar-text-muted">Trợ lý AI thông minh</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng danh sách hội thoại"
            className="-mr-1 grid size-10 place-items-center rounded-full text-sidebar-icon hover:bg-sidebar-item-bg-hover hover:text-sidebar-text focus-visible:outline-2 focus-visible:outline-sidebar-focus-ring [&_svg]:size-5"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Tạo hội thoại: biểu tượng + chữ, gọn như Gemini */}
      <div className="px-2">
        <button
          type="button"
          className="flex h-10 items-center gap-3 rounded-full pr-4 pl-3 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-item-bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-focus-ring [&_svg]:size-[18px]"
        >
          <EditIcon />
          Cuộc trò chuyện mới
        </button>
      </div>

      {/* Ô tìm kiếm: nền đỏ tối, viền và placeholder đủ rõ; nút xóa chỉ hiện khi đã gõ */}
      <label className="relative mx-3 mt-2 flex h-10 items-center rounded-full border border-search-border bg-search-bg px-4 focus-within:border-search-border-focus focus-within:ring-1 focus-within:ring-search-border-focus">
        <span className="sr-only">Tìm hội thoại</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onQuery("")}
          placeholder="Tìm hội thoại"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-search-text outline-none placeholder:text-search-placeholder [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="Xóa tìm kiếm"
            onClick={() => onQuery("")}
            className="-mr-2 grid size-7 place-items-center rounded-full text-sidebar-icon hover:bg-sidebar-item-bg-hover hover:text-sidebar-text [&_svg]:size-4"
          >
            <CloseIcon />
          </button>
        )}
      </label>

      {/* Tab lọc: chia đều trong lề 16px hai bên */}
      <div role="group" aria-label="Lọc hội thoại" className="mx-4 mt-3 flex justify-between border-b border-sidebar-divider">
        {TABS.map((t) => {
          const on = filter === t.key;
          return (
            <button
              key={t.label}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(t.key)}
              className={`-mb-px border-b-2 pt-1 pb-2 text-small whitespace-nowrap focus-visible:outline-2 focus-visible:outline-sidebar-focus-ring ${
                on ? "border-tab-indicator text-tab-text-selected font-semibold" : "border-transparent text-tab-text hover:text-tab-text-selected"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="m-0 flex-1 px-4 py-8 text-center text-sm text-sidebar-text-muted">Không có hội thoại phù hợp.</p>
      ) : (
        <ul className="m-0 min-h-0 flex-1 list-none space-y-0.5 overflow-y-auto px-2 py-2">
          {items.map((c) => {
            const selected = showActive && c.id === activeId;
            const unread = c.unread && !selected;
            const topic = c.topic ?? c.name; // phiên chưa có chủ đề tóm tắt thì tạm dùng tên
            // Kiểu ChatGPT/Gemini: mỗi phiên một dòng chủ đề. Chưa đọc: chữ đậm và chấm vàng.
            return (
              <li key={c.id}>
                <button
                  type="button"
                  data-id={c.id}
                  data-unread={unread || undefined}
                  aria-current={selected ? "true" : undefined}
                  title={topic}
                  onClick={() => onOpen(c.id)}
                  className={`flex min-h-10 w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sidebar-focus-ring ${
                    selected
                      ? "bg-sidebar-item-bg-selected font-medium text-sidebar-item-text-selected"
                      : unread
                        ? "font-unread text-sidebar-text hover:bg-sidebar-item-bg-hover"
                        : "text-sidebar-text-muted hover:bg-sidebar-item-bg-hover hover:text-sidebar-text-muted-hover"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{topic}</span>
                  {unread && (
                    <>
                      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-sidebar-unread-dot" />
                      <span className="sr-only">Chưa đọc</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Người dùng */}
      <div className="border-t border-sidebar-divider px-2 py-2">
        <Settings name={ME} />
      </div>
    </aside>
  );
}
