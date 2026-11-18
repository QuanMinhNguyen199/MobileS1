// Thanh cuộn chỉ hiện khi người dùng đang cuộn: gắn data-scrolling lên vùng đang cuộn,
// gỡ sau HIDE_AFTER ms kể từ lần cuộn cuối. CSS (index.css) đọc thuộc tính này để hiện thanh cuộn.
const HIDE_AFTER = 800;

export function watchScrolling() {
  const timers = new WeakMap();
  const onScroll = (e) => {
    const el = e.target === document ? document.scrollingElement : e.target;
    if (!(el instanceof Element)) return;
    if (!el.hasAttribute("data-scrolling")) el.setAttribute("data-scrolling", "");
    clearTimeout(timers.get(el));
    timers.set(el, setTimeout(() => el.removeAttribute("data-scrolling"), HIDE_AFTER));
  };
  // Sự kiện scroll không nổi bọt, nên bắt ở pha capture để theo dõi mọi vùng cuộn
  document.addEventListener("scroll", onScroll, { capture: true, passive: true });
  return () => document.removeEventListener("scroll", onScroll, { capture: true });
}
