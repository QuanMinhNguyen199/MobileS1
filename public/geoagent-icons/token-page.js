
// Trang Token: tìm kiếm, sao chép, và xem file token khác bằng kéo thả / chọn file.
// Nội dung dựng bằng token-view.js, cùng module với script build, nên file thả vào hiển thị giống trang gốc.
import { renderTokenView, esc } from "./token-view.js";

const $ = (s) => document.querySelector(s);
const content = $("#tk-content"), nav = $("#tk-nav"), search = $("#tk-search"), count = $("#tk-count"), empty = $("#tk-empty");
const status = $("#copy-status"), drop = $("#tk-drop"), fileInput = $("#tk-file"), viewing = $("#tk-viewing"), viewingText = $("#tk-viewing-text");
const problemsBox = $("#tk-problems"), title = $("#tk-title"), summary = $("#tk-summary");
const original = { html: content.innerHTML, nav: nav.innerHTML, title: title.textContent, summary: summary.textContent, total: count.textContent };

// ---- Tìm kiếm (không dấu)
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
let items = [];
const index = () => { items = [...content.querySelectorAll("[data-search]")]; for (const el of items) el.dataset.key = norm(el.dataset.search + " " + el.textContent); };
const filter = () => {
  const q = norm(search.value.trim());
  let n = 0;
  for (const el of items) { const show = !q || el.dataset.key.includes(q); el.hidden = !show; if (show) n++; }
  for (const g of content.querySelectorAll(".tk-group")) g.hidden = !g.querySelector("[data-search]:not([hidden])");
  for (const s of content.querySelectorAll(".tk-section")) s.hidden = !s.querySelector("[data-search]:not([hidden])");
  count.textContent = n + " token";
  empty.hidden = n > 0;
};
search.addEventListener("input", filter);
index();

// ---- Sao chép (Async Clipboard, dự phòng execCommand khi không có quyền)
const legacyCopy = (text) => {
  const field = Object.assign(document.createElement("textarea"), { value: text });
  field.setAttribute("readonly", ""); field.style.cssText = "position:fixed;inset-block-start:0;opacity:0";
  document.body.append(field); field.select();
  try { return document.execCommand("copy"); } finally { field.remove(); }
};
const timers = new WeakMap();
let last = "";
const announce = (message, failed = false) => {
  if (message === last) message += " "; // VoiceOver bỏ qua thông báo trùng
  last = message; status.textContent = message; status.toggleAttribute("data-failed", failed);
};
document.addEventListener("click", async (event) => {
  const button = event.target.closest(".copy");
  if (!button) return;
  const text = button.dataset.copy;
  let ok = true;
  try { await navigator.clipboard.writeText(text); } catch { ok = legacyCopy(text); }
  clearTimeout(timers.get(button));
  button.removeAttribute("data-copied"); button.removeAttribute("data-failed");
  button.setAttribute(ok ? "data-copied" : "data-failed", "");
  announce(ok ? "Đã sao chép " + text : "Không sao chép được, hãy chọn chữ và sao chép tay", !ok);
  timers.set(button, setTimeout(() => { button.removeAttribute("data-copied"); button.removeAttribute("data-failed"); status.textContent = ""; }, 2000));
});

// ---- Xem file token khác
const showProblems = (list, failedName) => {
  problemsBox.hidden = !list.length;
  const head = failedName
    ? `<b>Không mở được ${esc(failedName)}.</b> Trang vẫn hiển thị nội dung trước đó.`
    : `<b>${list.length} lỗi trong file</b> (vẫn hiển thị phần đọc được):`;
  problemsBox.innerHTML = list.length ? `<p>${head}</p><ul>${list.slice(0, 12).map((p) => `<li>${esc(p)}</li>`).join("")}${list.length > 12 ? `<li>… và ${list.length - 12} lỗi khác</li>` : ""}</ul>` : "";
};
const apply = ({ html, navHtml, heading, line, total }) => {
  content.innerHTML = html;
  nav.innerHTML = navHtml;
  title.textContent = heading;
  summary.textContent = line;
  search.value = "";
  index(); filter();
  count.textContent = total;
};
const loadFile = async (file) => {
  if (!file) return;
  drop.dataset.state = "loading";
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error("File lớn hơn 5 MB, không giống một file token.");
    let data;
    try { data = JSON.parse(await file.text()); } catch { throw new Error("Không đọc được JSON. Kiểm tra file có đúng định dạng .json không."); }
    const view = renderTokenView(data);
    apply({
      html: view.html,
      navHtml: view.nav.map(([id, l]) => `<a href="#${id}">${esc(l)}</a>`).join("") + '<a href="#usage">Dùng trong code</a>',
      heading: "Đang xem: " + file.name,
      line: `${view.total} token · ${view.kind === "geoagent" ? "Cấu trúc GeoAgent (màu gốc → vai trò)" : "Nhóm theo loại token ($type)"}`,
      total: view.total + " token",
    });
    showProblems(view.problems);
    viewingText.textContent = `Đang xem file ${file.name} trên máy bạn. Trang gốc không thay đổi.`;
    viewing.hidden = false;
    announce(`Đã mở ${file.name}: ${view.total} token`);
    title.scrollIntoView({ block: "start" });
  } catch (error) {
    showProblems([error.message], file.name);
    announce("Không mở được " + file.name, true);
  } finally {
    delete drop.dataset.state;
    fileInput.value = ""; // chọn lại cùng file vẫn mở được
  }
};
fileInput.addEventListener("change", () => loadFile(fileInput.files[0]));
$("#tk-reset").addEventListener("click", () => {
  apply({ html: original.html, navHtml: original.nav, heading: original.title, line: original.summary, total: original.total });
  showProblems([]); viewing.hidden = true;
  announce("Đã quay lại token GeoAgent");
  fileInput.focus();
});

// Kéo thả: thả được ở bất kỳ đâu trên trang; vùng thả sáng lên khi đang kéo file
let depth = 0;
const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
addEventListener("dragenter", (e) => { if (!hasFiles(e)) return; e.preventDefault(); depth++; drop.dataset.over = ""; });
addEventListener("dragover", (e) => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
addEventListener("dragleave", () => { if (--depth <= 0) { depth = 0; delete drop.dataset.over; } });
addEventListener("drop", (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault(); depth = 0; delete drop.dataset.over;
  loadFile(e.dataTransfer.files[0]);
});
