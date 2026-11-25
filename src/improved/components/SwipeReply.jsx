import { useLayoutEffect, useRef } from "react";
import { ReplyIcon } from "../icons.jsx";

// Điện thoại: vuốt câu trả lời sang phải để trả lời (kiểu ứng dụng nhắn tin).
// Dùng cuộn ngang gốc của trình duyệt + scroll snap: tự khóa trục khi cuộn dọc, tự bật về khi thả tay,
// không cần tự tính cử chỉ bằng pointer. Kéo đủ xa (icon hiện hết) thì trích cả câu trả lời vào ô soạn tin.
// enabled=false (máy tính): chỉ hiện nội dung, không bọc vùng cuộn ngang.
const ACTION = 56; // bề rộng vùng icon lộ ra khi vuốt

export default function SwipeReply({ enabled, onReply, children }) {
  const track = useRef(null);
  const fired = useRef(false);

  useLayoutEffect(() => {
    if (enabled && track.current) track.current.scrollLeft = ACTION;
  }, [enabled]);

  if (!enabled) return children;

  const onScroll = () => {
    const el = track.current;
    const progress = Math.min(Math.max(1 - el.scrollLeft / ACTION, 0), 1);
    el.style.setProperty("--swipe", progress.toFixed(3));
    // Câu trả lời dài hơn màn hình: đặt icon giữa phần tin đang nhìn thấy, không phải giữa cả tin
    const box = el.getBoundingClientRect();
    const area = el.closest("[aria-label='Tin nhắn']")?.getBoundingClientRect() ?? { top: 0, bottom: innerHeight };
    const top = Math.max(box.top, area.top + 64);
    const bottom = Math.min(box.bottom, area.bottom - 96);
    el.style.setProperty("--swipe-y", `${Math.max(0, (top + bottom) / 2 - box.top - 18)}px`);
    if (progress >= 0.9 && !fired.current) {
      fired.current = true;
      navigator.vibrate?.(10);
      onReply();
    } else if (progress < 0.1) {
      fired.current = false;
    }
  };

  return (
    // tabIndex -1: không cho vùng cuộn ngang tự nhận focus (phím mũi tên sẽ kích hoạt trả lời ngoài ý muốn)
    <div ref={track} onScroll={onScroll} tabIndex={-1} className="swipe-reply">
      <div className="swipe-reply-action" aria-hidden="true">
        <span className="grid size-9 place-items-center rounded-full bg-reply-swipe-bg text-reply-swipe-icon">
          <ReplyIcon size={18} />
        </span>
      </div>
      <div className="swipe-reply-content">{children}</div>
    </div>
  );
}
