import { useEffect, useId, useRef, useState } from "react";
import { CheckIcon } from "../icons.jsx";

// Nút mở menu + menu bật lên (dùng cho bộ lọc và tùy chọn từng phiên chat).
// Nền web: popover="auto" (lớp trên cùng, bấm ra ngoài / Esc tự đóng) mở bằng invoker command,
// focusgroup cho phím mũi tên, CSS anchor positioning để bám nút (.popup-menu trong index.css).
// Trình duyệt thiếu tính năng nào thì có đoạn thay thế tương ứng bên dưới (phím mũi tên, mở bằng script,
// đặt vị trí bằng script, và khi không có popover: hiện/ẩn bằng state).
//
// items: [{ key, label, Icon, onSelect, role?, checked? }]
//   role "menuitemradio" | "menuitemcheckbox" có checked: hiện dấu tích, đóng sau một nhịp ngắn để kịp thấy.
//   Không có role: lệnh thường, đóng ngay.
// groupLabel: bọc các mục trong role="group" (cần cho nhóm menuitemradio).
const has = (test) => { try { return test(); } catch { return false; } };
const POPOVER = has(() => Object.hasOwn(HTMLElement.prototype, "popover"));
const INVOKERS = has(() => "commandForElement" in HTMLButtonElement.prototype);
const FOCUSGROUP = has(() => "focusGroup" in HTMLElement.prototype);
const ANCHOR = has(() => CSS.supports("position-area: block-end"));
const CHECK_CLOSE_DELAY = 100; // vừa đủ thấy dấu tích đổi chỗ rồi đóng

export default function PopupMenu({ label, title = label, icon, items, groupLabel, triggerClassName = "", onOpenChange }) {
  const id = useId();
  const trigger = useRef(null);
  const menu = useRef(null);
  const enterOnOpen = useRef(false); // mở bằng bàn phím thì đưa focus vào menu
  const [open, setOpen] = useState(false);

  const buttons = () => [...menu.current.querySelectorAll("button")];
  const isOpen = () => (POPOVER ? menu.current.matches(":popover-open") : open);
  const enter = () => (buttons().find((b) => b.getAttribute("aria-checked") === "true") ?? buttons()[0])?.focus();

  useEffect(() => { onOpenChange?.(open); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Không có anchor positioning: đặt menu dưới nút (hoặc lật lên trên), mép trái thẳng nút (mở sang phải; chạm mép thì lật sang trái)
  const place = () => {
    if (ANCHOR && POPOVER) return;
    const r = trigger.current.getBoundingClientRect();
    const m = menu.current;
    const w = m.offsetWidth, h = m.offsetHeight, gap = 4;
    const left = r.left + w <= innerWidth - 8 ? r.left : Math.max(8, r.right - w);
    const top = r.bottom + gap + h <= innerHeight - 8 ? r.bottom + gap : Math.max(8, r.top - gap - h);
    Object.assign(m.style, { left: `${left}px`, top: `${top}px` });
  };

  const show = () => (POPOVER ? menu.current.showPopover({ source: trigger.current }) : setOpen(true));
  const hide = ({ restore = true, ring = true } = {}) => {
    if (restore) trigger.current?.focus({ focusVisible: ring });
    if (POPOVER) menu.current?.hidePopover();
    else setOpen(false);
  };

  // Popover: đồng bộ trạng thái mở theo sự kiện toggle (cả khi trình duyệt tự đóng do bấm ra ngoài / Esc)
  useEffect(() => {
    if (!POPOVER) return;
    const m = menu.current;
    const onToggle = (e) => {
      const nowOpen = e.newState === "open";
      setOpen(nowOpen);
      if (!nowOpen) return;
      place();
      if (enterOnOpen.current) enter();
      else trigger.current.focus({ focusVisible: false }); // mở bằng chuột: focus ở nút, không vòng focus
      enterOnOpen.current = false;
    };
    m.addEventListener("toggle", onToggle);
    return () => m.removeEventListener("toggle", onToggle);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Khi đang mở: Tab / focus ra ngoài thì đóng. Không có popover: tự lo bấm ra ngoài.
  useEffect(() => {
    if (!open) return;
    if (!POPOVER) {
      place();
      if (enterOnOpen.current) enter();
      enterOnOpen.current = false;
    }
    const inside = (n) => menu.current?.contains(n) || trigger.current?.contains(n);
    const onFocusIn = (e) => { if (!inside(e.target)) hide({ restore: false }); };
    const onPointerDown = (e) => { if (!inside(e.target)) hide({ restore: false }); };
    document.addEventListener("focusin", onFocusIn);
    if (!POPOVER) document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTriggerClick = (e) => {
    e.stopPropagation(); // nút nằm trên một dòng bấm được (phiên chat): không mở luôn phiên đó
    if (e.detail === 0) enterOnOpen.current = true; // Enter / Space
    if (INVOKERS && POPOVER) return; // trình duyệt tự bật/tắt qua command="toggle-popover"
    e.preventDefault();
    if (isOpen()) hide({ ring: e.detail === 0 });
    else show();
  };

  const onTriggerKeyDown = (e) => {
    // Mở bằng chuột thì focus vẫn ở nút: Esc lúc này chỉ đóng menu, không đóng luôn ngăn kéo chứa nút
    if (e.key === "Escape" && isOpen()) {
      e.stopPropagation();
      if (!POPOVER) hide();
      return;
    }
    if (e.key !== "ArrowDown") return;
    e.preventDefault();
    if (isOpen()) enter();
    else { enterOnOpen.current = true; trigger.current.click(); }
  };

  // Esc chỉ đóng menu, không đóng luôn ngăn kéo chứa nó (popover tự đóng và trả focus về nút).
  // Phím mũi tên chỉ tự xử lý khi trình duyệt chưa có focusgroup.
  const onMenuKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      if (!POPOVER) hide();
      return;
    }
    if (FOCUSGROUP || !["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const list = buttons();
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next = e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : (i + (e.key === "ArrowUp" ? -1 : 1) + list.length) % list.length;
    list[next].focus({ preventScroll: true });
  };

  const choose = (item, e) => {
    e.stopPropagation();
    const fromPointer = e.detail > 0;
    const checkable = item.checked !== undefined;
    // Lệnh có thể đưa focus đi nơi khác (ô đổi tên): đóng menu trước, không trả focus về nút
    if (!checkable) {
      hide({ restore: !item.movesFocus, ring: !fromPointer });
      item.onSelect();
      return;
    }
    item.onSelect();
    setTimeout(() => { if (isOpen()) hide({ ring: !fromPointer }); }, CHECK_CLOSE_DELAY);
  };

  const list = items.map((item) => {
    const { key, label: text, Icon, role, checked } = item;
    return (
      <button
        key={key}
        type="button"
        {...(role ? { role, "aria-checked": checked } : FOCUSGROUP ? {} : { role: "menuitem" })}
        onClick={(e) => choose(item, e)}
        onPointerMove={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.focus({ focusVisible: false }); }}
        className="flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-medium whitespace-nowrap outline-none pointer-coarse:min-h-11 focus:bg-menu-item-bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring [&_svg]:size-4"
      >
        <span aria-hidden="true" className="text-menu-text-muted"><Icon /></span>
        <span className="flex-1">{text}</span>
        {checked !== undefined && <span aria-hidden="true" className={checked ? "" : "invisible"}><CheckIcon /></span>}
      </button>
    );
  });

  return (
    <>
      <button
        ref={trigger}
        id={`${id}-trigger`}
        type="button"
        aria-label={label}
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        {...(POPOVER ? { commandfor: `${id}-menu`, command: "toggle-popover" } : {})}
        onPointerDown={(e) => { if (e.pointerType !== "touch") e.preventDefault(); }}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
        className={triggerClassName}
      >
        {icon}
      </button>
      {/* Ngay sau nút để trình duyệt không thêm aria-details */}
      <div
        ref={menu}
        id={`${id}-menu`}
        {...(POPOVER ? { popover: "auto" } : { hidden: !open })}
        className="popup-menu min-w-44 rounded-xl border border-menu-border bg-menu-bg p-1 text-menu-text shadow-float"
      >
        <div focusgroup="menu nomemory" aria-labelledby={`${id}-trigger`} {...(FOCUSGROUP ? {} : { role: "menu" })} onKeyDown={onMenuKeyDown}>
          {groupLabel ? <div role="group" aria-label={groupLabel}>{list}</div> : list}
        </div>
      </div>
    </>
  );
}
