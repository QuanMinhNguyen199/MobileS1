import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ReplyIcon } from "../icons.jsx";

// Bôi đen một đoạn trong câu trả lời của GeoAgent → nút "Hỏi về đoạn này" hiện ngay trên đoạn chọn (kiểu Gemini).
// Bấm nút: đoạn chọn thành trích dẫn trong ô soạn tin. Chỉ nhận đoạn chọn nằm gọn trong một câu trả lời ([data-reply-source]).
// Hiện sau khi thả chuột / nhấc tay, không nhấp nháy theo con trỏ khi đang kéo chọn.
// Cách làm bằng bàn phím: nút Trả lời ở chân câu trả lời (AnswerFooter).
const GAP = 8;
const HEIGHT = 40;
const TOP_RESERVED = 64; // header nổi phía trên vùng tin nhắn (h-16): nút không chui xuống dưới header
const BOTTOM_RESERVED = 96; // dải ô soạn tin phía dưới
const coarse = () => window.matchMedia("(pointer: coarse)").matches;

function readSelection() {
  const sel = document.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const text = sel.toString().replace(/\s+/g, " ").trim();
  if (!text) return null;
  const sourceOf = (node) => (node?.nodeType === 1 ? node : node?.parentElement)?.closest("[data-reply-source]");
  const source = sourceOf(sel.anchorNode);
  if (!source || source !== sourceOf(sel.focusNode)) return null;
  const range = sel.getRangeAt(0);
  const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
  const box = range.getBoundingClientRect();
  const first = rects[0] ?? box;
  const last = rects.at(-1) ?? box;
  return { text, box, first, last };
}

export default function SelectionReply({ onReply, scroller }) {
  const [state, setState] = useState(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    let dragging = false;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setState(dragging ? null : readSelection()));
    };
    const down = (e) => {
      if (e.target.closest?.("[data-selection-reply]")) return;
      dragging = true;
      setState(null);
    };
    const up = () => {
      dragging = false;
      update();
    };
    const key = (e) => {
      if (e.key === "Escape") setState(null);
      else if (e.shiftKey || e.key.startsWith("Arrow")) update();
    };
    document.addEventListener("selectionchange", update);
    document.addEventListener("pointerdown", down);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    document.addEventListener("keyup", key);
    window.addEventListener("resize", update);
    const el = scroller.current;
    el?.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("selectionchange", update);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      document.removeEventListener("keyup", key);
      window.removeEventListener("resize", update);
      el?.removeEventListener("scroll", update);
    };
  }, [scroller]);

  // Đo bề rộng thật của nút (khác nhau theo font/cỡ chữ) để căn giữa đúng; lần vẽ đầu dùng ước lượng
  const btnRef = useRef(null);
  const [width, setWidth] = useState(168);
  useLayoutEffect(() => {
    const w = btnRef.current?.offsetWidth;
    if (w && Math.abs(w - width) > 1) setWidth(w);
  });

  // Mặc định đặt PHÍA TRÊN dòng đầu của đoạn chọn: không che phần chữ, tiêu đề, link người dùng đang đọc tiếp.
  // Máy tính: hết chỗ phía trên (sát header) thì xuống dưới dòng cuối. Điện thoại: tay cầm chọn chữ và menu hệ thống
  // nằm phía dưới, nên luôn ở trên (chỉ khi đoạn chọn sát header mới xuống dưới).
  // Đoạn chọn đã cuộn khuất khỏi vùng tin nhắn thì ẩn nút.
  let style = null;
  if (state) {
    const area = scroller.current?.getBoundingClientRect() ?? { top: 0, bottom: innerHeight };
    const minTop = area.top + TOP_RESERVED;
    const maxBottom = area.bottom - BOTTOM_RESERVED;
    const visible = state.box.bottom > minTop && state.box.top < maxBottom;
    if (visible) {
      const above = state.first.top - GAP - HEIGHT;
      const below = state.last.bottom + GAP;
      const useAbove = above >= minTop || (!coarse() && below + HEIGHT > maxBottom);
      const top = useAbove ? Math.max(above, area.top + 8) : below;
      const anchor = useAbove ? state.first : state.last;
      const center = (anchor.left + anchor.right) / 2;
      const left = Math.min(Math.max(center - width / 2, 8), innerWidth - width - 8);
      style = { top, left };
    }
  }

  const ask = () => {
    onReply(state.text);
    document.getSelection()?.removeAllRanges();
    setState(null);
  };

  return createPortal(
    <>
    {/* Báo cho trình đọc màn hình khi có thể hỏi về đoạn vừa chọn (vùng thông báo có sẵn từ trước) */}
    <span role="status" className="sr-only">{state && style ? "Có thể hỏi GeoAgent về đoạn đã chọn" : ""}</span>
    <AnimatePresence>
      {state && style && (
        <motion.button
          key="ask"
          type="button"
          ref={btnRef}
          data-selection-reply
          onPointerDown={(e) => e.preventDefault()} // giữ nguyên đoạn đang chọn khi bấm
          onClick={ask}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={{ type: "spring", bounce: 0, visualDuration: 0.16 }}
          style={{ position: "fixed", ...style }}
          className="z-50 inline-flex h-10 items-center gap-2 rounded-full border border-reply-action-border bg-reply-action-bg pr-4 pl-3 text-button whitespace-nowrap text-reply-action-text shadow-float hover:bg-reply-action-bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring [&_svg]:text-reply-action-icon"
        >
          <ReplyIcon size={18} />
          Hỏi về đoạn này
        </motion.button>
      )}
    </AnimatePresence>
    </>,
    document.body,
  );
}
