import { useEffect, useId, useRef, useState } from "react";
import { useColorScheme } from "../theme.js";
import { Avatar } from "./ui.jsx";

const SCHEMES = [
  ["system", "Theo hệ thống"],
  ["light", "Sáng"],
  ["dark", "Tối"],
];

// Avatar + tên người dùng ở cuối sidebar là nút mở bảng tài khoản và cài đặt (kiểu ChatGPT/Gemini).
// Bảng mở lên phía trên, chứa lựa chọn giao diện; đổi là áp ngay, không cần nút Lưu.
// Đóng: bấm ra ngoài, Esc (trả focus về nút), hoặc Tab ra khỏi bảng.
export default function Settings({ name }) {
  const [open, setOpen] = useState(false);
  const [pref, choose, systemDark] = useColorScheme();
  const id = useId();
  const wrap = useRef(null);
  const button = useRef(null);

  useEffect(() => {
    if (!open) return;
    wrap.current.querySelector("input:checked")?.focus();
    const onPointerDown = (e) => { if (!wrap.current.contains(e.target)) setOpen(false); };
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation(); // không đóng luôn ngăn kéo danh sách trên điện thoại
      setOpen(false);
      button.current.focus();
    };
    const node = wrap.current;
    document.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={wrap}
      className="relative"
      onBlur={(e) => {
        // Safari có thể trả relatedTarget=null khi bấm radio/nhãn trong bảng.
        // Chỉ đóng khi focus sang một phần tử khác; bấm ra ngoài đã được xử lý bằng pointerdown.
        if (open && e.relatedTarget && !wrap.current.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-2xl px-2 py-1.5 text-left text-sidebar-text transition-colors hover:bg-sidebar-item-bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sidebar-focus-ring aria-expanded:bg-sidebar-item-bg-hover"
      >
        <Avatar name={name} size={28} tone="frame" />
        <span className="min-w-0 flex-1 truncate text-small font-medium">
          {name}
          {/* Chỉ hiện tên; trình đọc màn hình vẫn biết đây là nút mở tài khoản và cài đặt */}
          <span className="sr-only">, tài khoản và cài đặt</span>
        </span>
      </button>

      {open && (
        <div
          id={`${id}-panel`}
          className="absolute inset-x-0 bottom-full z-30 mb-2 rounded-2xl border border-menu-border bg-menu-bg p-2 text-menu-text shadow-float"
        >
          <fieldset className="m-0 border-0 p-0">
            <legend className="px-2 pt-1 pb-2 text-xs font-medium text-menu-text-muted">Giao diện</legend>
            {SCHEMES.map(([value, label]) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-menu-item-bg-hover"
              >
                <input
                  type="radio"
                  name={`${id}-scheme`}
                  value={value}
                  checked={pref === value}
                  onChange={() => choose(value)}
                  className="size-4 shrink-0 accent-menu-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                />
                <span className="min-w-0 flex-1">
                  {label}
                  {value === "system" && <span className="block text-xs text-menu-text-muted">Máy đang ở chế độ {systemDark ? "tối" : "sáng"}</span>}
                </span>
              </label>
            ))}
          </fieldset>
        </div>
      )}
    </div>
  );
}
