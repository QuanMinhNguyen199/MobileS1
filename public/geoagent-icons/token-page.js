
// Tìm token và sao chép class / biến CSS (Async Clipboard, dự phòng execCommand khi không có quyền)
const $ = (s) => document.querySelector(s);
const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();
const items = [...document.querySelectorAll("[data-search]")];
for (const el of items) el.dataset.key = norm(el.dataset.search + " " + el.textContent);
const search = $("#tk-search"), count = $("#tk-count"), empty = $("#tk-empty"), status = $("#copy-status");
const filter = () => {
  const q = norm(search.value.trim());
  let n = 0;
  for (const el of items) { const show = !q || el.dataset.key.includes(q); el.hidden = !show; if (show) n++; }
  for (const g of document.querySelectorAll(".tk-group")) g.hidden = !g.querySelector("[data-search]:not([hidden])");
  for (const s of document.querySelectorAll(".tk-section:not(.tk-usage)")) s.hidden = !s.querySelector("[data-search]:not([hidden])");
  count.textContent = n + " token";
  empty.hidden = n > 0;
};
search.addEventListener("input", filter);
const legacyCopy = (text) => {
  const field = Object.assign(document.createElement("textarea"), { value: text });
  field.setAttribute("readonly", ""); field.style.cssText = "position:fixed;inset-block-start:0;opacity:0";
  document.body.append(field); field.select();
  try { return document.execCommand("copy"); } finally { field.remove(); }
};
const timers = new WeakMap();
let last = "";
document.addEventListener("click", async (event) => {
  const button = event.target.closest(".copy");
  if (!button) return;
  const text = button.dataset.copy;
  let ok = true;
  try { await navigator.clipboard.writeText(text); } catch { ok = legacyCopy(text); }
  clearTimeout(timers.get(button));
  button.removeAttribute("data-copied"); button.removeAttribute("data-failed");
  button.setAttribute(ok ? "data-copied" : "data-failed", "");
  let message = ok ? "Đã sao chép " + text : "Không sao chép được, hãy chọn chữ và sao chép tay";
  if (message === last) message += "\u00a0"; // VoiceOver bỏ qua thông báo trùng
  last = message; status.textContent = message; status.toggleAttribute("data-failed", !ok);
  timers.set(button, setTimeout(() => { button.removeAttribute("data-copied"); button.removeAttribute("data-failed"); status.textContent = ""; }, 2000));
});
