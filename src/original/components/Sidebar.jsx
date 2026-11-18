import { useState } from "react";
import { FILTERS } from "../data.js";
import { Avatar, IconButton } from "./ui.jsx";
import { ChevronDown, EditIcon, GroupAddIcon, MoreIcon, SearchIcon } from "../icons.jsx";

export default function Sidebar({ conversations, activeId, showActive, onOpen, logoRef, logoHidden = false, className = "" }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(null);
  const [chipsOpen, setChipsOpen] = useState(false);

  const q = query.trim().toLocaleLowerCase("vi");
  const items = conversations.filter((c) => {
    if (filter === "unread" && !c.unread) return false;
    if (filter && filter !== "unread" && !c.tags.includes(filter)) return false;
    if (q && !`${c.name} ${c.preview}`.toLocaleLowerCase("vi").includes(q)) return false;
    return true;
  });

  return (
    <aside aria-label="Danh sách hội thoại" className={`flex min-h-0 flex-col border-r border-line bg-surface ${className}`}>
      {/* Thanh trên */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4 md:h-20 md:gap-4 md:pl-3">
        <img
          ref={logoRef}
          src="/login/emblem.svg"
          alt="GeoAgent"
          width="400"
          height="407"
          className={`h-auto w-[33.6px] shrink-0 md:w-[40px] ${logoHidden ? "invisible" : ""}`}
        />
        <label className="flex h-11 flex-1 items-center gap-3 rounded-full bg-surface-2 px-4 md:h-[36.8px] md:pl-5 text-ink-2 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-focus">
          <SearchIcon />
          <span className="sr-only">Tìm kiếm hội thoại</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-lg text-ink outline-none placeholder:text-ink-2"
          />
        </label>
        <Avatar name="N" size="lg" />
      </div>

      {/* Lời chào */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-2 md:px-3">
        <p className="m-0 min-w-0 flex-1 truncate text-lg text-ink-2">
          <span aria-hidden="true">👋</span> Xin chào{" "}
          <strong className="ml-1 text-xl font-medium text-ink">Nguyễn Minh Quân</strong>
        </p>
        <div className="flex gap-1.5">
          <IconButton label="Tùy chọn khác"><MoreIcon /></IconButton>
          <IconButton label="Soạn tin mới"><EditIcon /></IconButton>
          <IconButton label="Tạo nhóm"><GroupAddIcon /></IconButton>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="flex items-start gap-2 px-4 pt-1.5 pb-3.5 md:px-3">
        <div
          id="chips"
          role="group"
          aria-label="Lọc hội thoại"
          className={`flex min-w-0 flex-1 gap-2.5 overflow-hidden pr-4 ${chipsOpen ? "flex-wrap" : "flex-nowrap"}`}
        >
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(on ? null : f.key)}
                className={`h-9 shrink-0 rounded-full border px-2.5 text-base md:px-3 md:text-[13.6px] ${
                  on ? "border-brand bg-brand-soft font-semibold text-brand" : "border-line-strong bg-surface text-ink hover:bg-surface-2"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-expanded={chipsOpen}
          aria-controls="chips"
          aria-label={chipsOpen ? "Thu gọn bộ lọc" : "Hiện thêm bộ lọc"}
          onClick={() => setChipsOpen((v) => !v)}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2"
        >
          <ChevronDown className={chipsOpen ? "rotate-180" : ""} />
        </button>
      </div>

      {/* Danh sách */}
      {items.length === 0 ? (
        <p className="m-0 flex-1 px-4 py-6 text-center text-ink-2">Không có hội thoại phù hợp.</p>
      ) : (
        <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-0">
          {items.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                data-id={c.id}
                aria-current={showActive && c.id === activeId ? "true" : undefined}
                onClick={() => onOpen(c.id)}
                className="flex w-full items-center gap-3.5 py-2.5 pr-5 pl-2 text-left hover:bg-surface-2 aria-[current=true]:bg-surface-2"
              >
                <Avatar name={c.name} size="xl" status />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-lg">
                    {c.name}
                    {c.unread && (
                      <>
                        <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
                        <span className="sr-only">, chưa đọc</span>
                      </>
                    )}
                  </span>
                  <span className="mt-1 flex items-center text-base text-ink">
                    <span className="truncate">{c.preview}</span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Thương hiệu */}
      <footer className="relative flex h-16 shrink-0 items-center gap-3.5 overflow-hidden bg-linear-to-r from-brand-bar to-brand-bar-deep px-3 text-white md:h-[59.2px]">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-white/50 bg-[radial-gradient(circle_at_35%_30%,#ffd84d,var(--gold)_60%,#e49a00)] text-3xl font-extrabold text-brand-bar md:size-[46.4px] md:text-4xl"
        >
          G
        </span>
        <span className="flex flex-col leading-tight">
          <strong className="text-2xl font-bold md:text-[22.4px]">GeoAgent</strong>
          <small className="text-xs font-semibold text-[#ffe08a] md:text-[10.4px]">Trợ lý AI thông minh</small>
        </span>
        <span aria-hidden="true" className="absolute right-3 bottom-0 flex items-end gap-1.5 opacity-20">
          {[21, 34, 16, 29, 43, 24].map((h, i) => (
            <i key={i} className="block w-3.5 bg-white" style={{ height: h }} />
          ))}
        </span>
      </footer>
    </aside>
  );
}
