import { useRef, useState } from "react";
import { LOGIN_ASSETS } from "../assets.js";
import { FILTERS } from "../data.js";
import { ChatIcon, CloseIcon, EditIcon, FavoriteIcon, MoreIcon, UnreadIcon } from "../icons.jsx";
import { conversationActions } from "../conversationActions.js";
import FilterMenu from "./FilterMenu.jsx";
import PopupMenu from "./PopupMenu.jsx";
import Settings from "./Settings.jsx";

const FILTER_ICONS = { unread: UnreadIcon, favorite: FavoriteIcon };
const FILTER_OPTIONS = [{ key: null, label: "Tất cả", Icon: ChatIcon }, ...FILTERS.map((f) => ({ ...f, Icon: FILTER_ICONS[f.key] }))];
const ME = "Nguyễn Minh Quân";

// Sidebar đỏ thương hiệu. Kiểu chữ: Plus Jakarta Sans cho tên sản phẩm, Inter cho phần còn lại.
export default function Sidebar({ conversations, activeId, showActive, onOpen, onUpdate, onRequestDelete, onNewChat, onLogout, query, onQuery, logoRef, logoHidden, onClose, className = "" }) {
  const [filter, setFilter] = useState(null);
  const [editing, setEditing] = useState(null); // id phiên đang đổi tên
  const list = useRef(null);

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
        <img ref={logoRef} src={LOGIN_ASSETS.logo} alt="" width="512" height="512" className={`size-8 shrink-0 ${logoHidden ? "invisible" : ""}`} />
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
          onClick={onNewChat}
          className="flex h-9 items-center gap-3 rounded-full pr-4 pl-3 text-small font-medium pointer-coarse:h-10 text-sidebar-text transition-colors hover:bg-sidebar-item-bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-focus-ring [&_svg]:size-[18px]"
        >
          <EditIcon />
          Cuộc trò chuyện mới
        </button>
      </div>

      {/* Ô tìm kiếm: nền đỏ tối, viền và placeholder đủ rõ; nút xóa chỉ hiện khi đã gõ */}
      <label className="relative mx-3 mt-2 flex h-9 items-center pointer-coarse:h-10 rounded-full border border-search-border bg-search-bg px-4 focus-within:border-search-border-focus focus-within:ring-1 focus-within:ring-search-border-focus">
        <span className="sr-only">Tìm hội thoại</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onQuery("")}
          placeholder="Tìm hội thoại"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-small text-search-text outline-none placeholder:text-search-placeholder [&::-webkit-search-cancel-button]:hidden"
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

      {/* Lọc: tên bộ lọc đang áp dụng làm tiêu đề danh sách, nút lọc mở menu (kiểu Gemini) */}
      <div className="mt-3 flex items-center justify-between gap-2 pr-2 pl-5">
        <p aria-live="polite" className="m-0 truncate text-small font-medium text-sidebar-text-muted">
          {FILTER_OPTIONS.find((o) => o.key === filter).label}
        </p>
        <FilterMenu options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
      </div>

      {items.length === 0 ? (
        <p className="m-0 flex-1 px-4 py-8 text-center text-small text-sidebar-text-muted">Không có hội thoại phù hợp.</p>
      ) : (
        <ul ref={list} className="m-0 min-h-0 flex-1 list-none space-y-0.5 overflow-y-auto px-2 py-2">
          {items.map((c) => {
            const selected = showActive && c.id === activeId;
            const unread = c.unread && !selected;
            const topic = c.topic ?? c.name; // phiên chưa có chủ đề tóm tắt thì tạm dùng tên
            // Kiểu ChatGPT/Gemini: mỗi phiên một dòng chủ đề, chữ sáng hơn nhãn bộ lọc phía trên. Chưa đọc: chữ đậm và chấm vàng.
            const fav = c.tags.includes("favorite");
            // Đổi tên ở danh sách: ô nhập tại chỗ. Xóa: App mở hộp xác nhận chung (dùng cả cho menu ở header).
            const actions = conversationActions(c, {
              selected,
              canDelete: conversations.length > 1,
              onUpdate,
              onRename: () => setEditing(c.id),
              renameMovesFocus: true,
              onDelete: () => onRequestDelete({ id: c.id, topic, from: "sidebar" }),
            });
            // Đổi tên: Enter / rời ô thì lưu, Esc thì hủy; xong trả focus về dòng của phiên
            const finishRename = (input, save) => {
              const li = input.closest("li");
              const value = input.value.trim();
              if (save && value && value !== topic) onUpdate(c.id, (x) => ({ ...x, topic: value }));
              setEditing(null);
              requestAnimationFrame(() => li?.querySelector("button[data-id]")?.focus());
            };
            return (
              <li key={c.id} className="group/item relative">
                {editing === c.id ? (
                  <input
                    aria-label="Tên mới của phiên chat"
                    defaultValue={topic}
                    autoFocus
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={(e) => finishRename(e.currentTarget, !e.currentTarget.dataset.cancel)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
                      if (e.key === "Escape") { e.stopPropagation(); e.currentTarget.dataset.cancel = "1"; e.currentTarget.blur(); }
                    }}
                    className="block h-9 w-full rounded-full border border-search-border-focus bg-search-bg px-3 text-small pointer-coarse:h-10 text-search-text outline-none"
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      data-id={c.id}
                      data-unread={unread || undefined}
                      aria-current={selected ? "true" : undefined}
                      title={topic}
                      onClick={() => onOpen(c.id)}
                      className={`flex min-h-9 w-full items-center gap-2 rounded-full py-1.5 pr-3 pl-3 text-left text-small pointer-coarse:min-h-10 transition-colors group-hover/item:pr-10 group-focus-within/item:pr-10 group-has-aria-expanded/item:pr-10 pointer-coarse:pr-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sidebar-focus-ring ${
                        selected
                          ? "bg-sidebar-item-bg-selected font-medium text-sidebar-item-text-selected"
                          : unread
                            ? "font-unread text-sidebar-text hover:bg-sidebar-item-bg-hover"
                            : "text-sidebar-item-text hover:bg-sidebar-item-bg-hover"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">{topic}</span>
                      {fav && (
                        <>
                          <FavoriteIcon size={14} fill="currentColor" className="shrink-0" />
                          <span className="sr-only">Yêu thích</span>
                        </>
                      )}
                      {unread && (
                        <>
                          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-sidebar-unread-dot" />
                          <span className="sr-only">Chưa đọc</span>
                        </>
                      )}
                    </button>
                    {/* Tùy chọn của phiên: hiện khi rê chuột / focus / đang mở; màn hình cảm ứng luôn hiện */}
                    <div className="absolute inset-y-0 right-1 flex items-center">
                      <PopupMenu
                        label={`Tùy chọn cho phiên “${topic}”`}
                        title="Tùy chọn"
                        icon={<MoreIcon />}
                        items={actions}
                        triggerClassName={`grid size-8 place-items-center rounded-full opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-within/item:opacity-100 aria-expanded:opacity-100 pointer-coarse:opacity-100 focus-visible:outline-2 focus-visible:outline-sidebar-focus-ring motion-reduce:transition-none [&_svg]:size-[18px] ${
                          selected
                            ? "text-sidebar-item-action-icon-selected hover:bg-sidebar-item-action-bg-hover-selected aria-expanded:bg-sidebar-item-action-bg-hover-selected"
                            : "text-sidebar-item-action-icon hover:bg-sidebar-item-bg-hover hover:text-sidebar-text aria-expanded:bg-sidebar-item-bg-hover aria-expanded:text-sidebar-text"
                        }`}
                      />
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Người dùng */}
      <div className="border-t border-sidebar-divider px-2 py-2">
        <Settings name={ME} onLogout={onLogout} />
      </div>
    </aside>
  );
}
