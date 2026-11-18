import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Lucide from "lucide-react";
import { ICONS, ICON_GROUPS, STROKE } from "../src/improved/icon-data.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = resolve(root, "public/geoagent-icons");
mkdirSync(out, { recursive: true });
const xml = (s) => String(s).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const attributes = (values) => Object.entries(values).map(([key, value]) => `${kebab(key)}="${xml(value)}"`).join(" ");
// Cả bộ chung một kiểu: lưới 24 × 24, nét STROKE, đầu nét tròn.
// Icon Lucide: render ra SVG tĩnh rồi lấy phần hình bên trong; dấu hiệu assistant: hình tự vẽ.
const presentation = `fill="none" stroke="currentColor" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"`;
const customGeometry = (definition) => definition.nodes.map(([tag, props]) => `<${tag} ${attributes(props)}/>`).join("");
const parts = (name) => {
  const def = ICONS[name];
  if (!def.lucide) return { inner: customGeometry(def) };
  const Icon = Lucide[def.lucide];
  if (!Icon) throw new Error(`Lucide icon not found: ${def.lucide}`);
  const markup = renderToStaticMarkup(createElement(Icon, { size: 24, strokeWidth: STROKE }));
  return { inner: markup.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "") };
};
const svg = (name, { size = 24, decorative = true } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ${presentation} ${decorative ? 'aria-hidden="true"' : `role="img" aria-label="${xml(ICONS[name].label)}"`} focusable="false">${parts(name).inner}</svg>`;

for (const name of Object.keys(ICONS)) writeFileSync(resolve(out, `${name}.svg`), `${svg(name, { decorative: false })}\n`);
writeFileSync(resolve(out, "sprite.svg"), `<svg xmlns="http://www.w3.org/2000/svg"><defs>${Object.keys(ICONS).map((name) => `<symbol id="geo-${name}" viewBox="0 0 24 24" ${presentation}>${parts(name).inner}</symbol>`).join("")}</defs></svg>\n`);
writeFileSync(resolve(out, "manifest.json"), JSON.stringify({ name: "GeoAgent Icons", version: "3.0.0", base: "Lucide (lucide-react)", grid: 24, strokeWidth: STROKE, icons: Object.entries(ICONS).map(([name, { label, group, lucide }]) => ({ name, label, group, source: lucide ? `lucide:${lucide}` : "geoagent:custom", file: `${name}.svg` })) }, null, 2));

const sections = ICON_GROUPS.map((group) => {
  const entries = Object.entries(ICONS).filter(([, def]) => def.group === group.id);
  return `<section id="${group.id}" aria-labelledby="heading-${group.id}"><h2 id="heading-${group.id}">${group.label}<span>${entries.length}</span></h2><div class="icon-grid">${entries.map(([name, def]) => `<a class="icon-item" href="${name}.svg" download="geoagent-${name}.svg" data-search="${xml(`${name} ${def.label}`)}" aria-label="Tải SVG: ${xml(def.label)}"><span class="glyph">${svg(name)}</span><span class="icon-label">${xml(def.label)}</span><span class="icon-name">${name}</span></a>`).join("")}</div></section>`;
}).join("\n");

writeFileSync(resolve(out, "index.html"), `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>GeoAgent — Bộ icon riêng</title><link rel="stylesheet" href="catalog.css"></head>
<body><header class="masthead"><a class="brand" href="../"><img src="../login/emblem.svg" width="34" height="35" alt="">GeoAgent</a><p>Bộ biểu tượng giao diện</p><a class="back-link" href="../">${svg("back", { size: 18 })} Về ứng dụng</a></header>
<div class="layout"><aside class="catalog-nav" aria-label="Nhóm biểu tượng"><p>GeoAgent Icons</p><nav>${ICON_GROUPS.map((g) => `<a href="#${g.id}">${xml(g.label)}</a>`).join("")}</nav><a class="download-link" href="../geoagent-icons.zip" download>${svg("download", { size: 18 })} Tải toàn bộ SVG</a><a class="text-link" href="README.md">Hướng dẫn sử dụng</a></aside>
<main><div class="intro"><div><h1>Bộ icon riêng cho GeoAgent</h1><p>${Object.keys(ICONS).length} biểu tượng SVG dựa trên Lucide · Lưới 24 × 24 · Nét ${String(STROKE).replace(".", ",")} · Đầu nét bo tròn</p></div><a class="sprite-link" href="sprite.svg" download>Tải SVG sprite ${svg("download", { size: 18 })}</a></div>
<div class="specimen"><div class="signature">${svg("assistant", { size: 64 })}<div><h2>Dấu hiệu trợ lý</h2><p>Bong bóng hội thoại kết hợp dấu định vị.<br>Một dấu hiệu riêng, đi cùng bộ icon chức năng.</p></div></div><div class="context-samples" aria-label="Ví dụ icon trên nền sáng và đỏ"><div class="sample light">${["new-chat", "search", "attach", "send"].map((n) => svg(n)).join("")}<span>Nền sáng</span></div><div class="sample dark">${["new-chat", "search", "attach", "send"].map((n) => svg(n)).join("")}<span>Sidebar đỏ</span></div></div></div>
<div class="toolbar"><label class="search">${svg("search", { size: 18 })}<span class="sr-only">Tìm biểu tượng</span><input id="search" type="search" placeholder="Tìm tên hoặc chức năng…" autocomplete="off"></label><label class="size-control">Kích thước <select id="size"><option value="16">16 px</option><option value="20">20 px</option><option value="24" selected>24 px</option><option value="32">32 px</option></select></label><span id="result-count" role="status" aria-live="polite">${Object.keys(ICONS).length} biểu tượng</span></div>
<p class="download-note">Chọn một biểu tượng để tải file SVG.</p><div id="catalog">${sections}</div><p id="empty" hidden>Không tìm thấy biểu tượng phù hợp. Hãy thử từ khóa khác.</p>
<footer>Icon chức năng: Lucide (giấy phép ISC). Dấu hiệu trợ lý: vẽ riêng cho GeoAgent. Màu lấy theo ngữ cảnh sử dụng, không cố định trong file.</footer></main></div><script type="module" src="catalog.js"></script></body></html>`);

writeFileSync(resolve(out, "catalog.css"), `
:root{color-scheme:light;--brand:#a3141a;--ink:#1d1416;--muted:#6b5f5c;--line:#e7dfdb;--glyph-size:24px;font-family:Inter,"Segoe UI",system-ui,sans-serif;color:var(--ink);background:#fcf8f7}
*{box-sizing:border-box}body{margin:0}a{color:inherit}button,input,select{font:inherit}svg{flex:none}a,input,select{outline-offset:4px}:focus-visible{outline:2px solid #1a5fd6}a{text-underline-offset:4px}p{line-height:1.6}h1,h2,p{margin-top:0}
.masthead{min-height:80px;display:flex;align-items:center;gap:32px;padding:18px 40px;background:var(--brand);color:#fff7f0}.brand{display:flex;gap:12px;align-items:center;font-size:21px;font-weight:700;text-decoration:none}.masthead p{margin:0;color:#f2cfc6;font-size:14px}.back-link{display:flex;align-items:center;gap:8px;margin-left:auto;font-size:14px;text-decoration:none}.masthead :focus-visible{outline-color:#fff7f0}
.layout{display:grid;grid-template-columns:236px minmax(0,1fr);max-width:1600px;margin:auto}.catalog-nav{padding:42px 28px;border-right:1px solid var(--line)}.catalog-nav>p{font-size:14px;font-weight:650;margin-bottom:24px}.catalog-nav nav{display:grid;gap:8px}.catalog-nav nav a{padding:10px 0;font-size:14px;text-decoration:none;color:var(--muted)}.catalog-nav a:hover{color:var(--brand)}.download-link{display:flex;align-items:center;gap:8px;margin-top:40px;font-size:14px;font-weight:600}.text-link{display:block;font-size:13px;color:var(--muted);margin-top:18px}main{min-width:0;padding:40px 44px}.intro{display:flex;gap:24px;align-items:center;justify-content:space-between}.intro h1{font-size:28px;line-height:1.3;letter-spacing:-.025em;margin-bottom:12px}.intro p{font-size:14px;color:var(--muted);margin-bottom:0}.sprite-link{display:flex;gap:8px;align-items:center;font-size:13px;white-space:nowrap}
.specimen{display:grid;grid-template-columns:1.1fr 1fr;gap:32px;align-items:center;padding:28px 0;margin:28px 0;border-block:1px solid var(--line)}.signature{display:flex;align-items:center;gap:20px;color:var(--brand)}.signature h2{color:var(--ink);font-size:17px;margin-bottom:6px}.signature p{color:var(--muted);font-size:13px;margin-bottom:0}.context-samples{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line);border-radius:12px;overflow:hidden}.sample{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 10px;padding:22px 16px;place-items:center}.sample span{grid-column:1/-1;font-size:11px}.light{background:white;color:var(--brand)}.dark{background:var(--brand);color:#fff7f0}
.toolbar{display:flex;align-items:center;gap:20px;flex-wrap:wrap}.search{display:flex;align-items:center;gap:10px;max-width:360px;flex:1;min-width:180px;border:1px solid #958884;border-radius:8px;padding:10px 12px;background:white}.search input{min-width:0;width:100%;border:0;background:transparent;color:var(--ink);font-size:14px}.search input:focus{outline:0}.search:focus-within{outline:2px solid #1a5fd6;outline-offset:2px}.search input::placeholder{color:var(--muted)}.size-control{font-size:13px;color:var(--muted);display:flex;align-items:center;gap:8px}.size-control select{padding:8px;border:1px solid #958884;border-radius:6px;background:white;color:var(--ink)}#result-count{margin-left:auto;font-size:13px;color:var(--muted)}.download-note{font-size:12px;color:var(--muted);margin:14px 0 24px}
section{scroll-margin-top:20px;margin-bottom:32px}section h2{font-size:16px;font-weight:650;display:flex;gap:10px;align-items:center;margin-bottom:16px}section h2 span{color:var(--muted);font-size:12px;font-weight:400}.icon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));border-top:1px solid var(--line);border-left:1px solid var(--line)}.icon-item{min-height:142px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;padding:16px 8px;background:#fff;text-decoration:none;text-align:center;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.icon-item:hover{background:#f5e9e5;color:var(--brand)}.glyph{height:36px;display:flex;align-items:center;justify-content:center;color:var(--brand)}.glyph svg{width:var(--glyph-size);height:var(--glyph-size)}.icon-label{font-size:12px;line-height:1.6}.icon-name{font-size:11px;color:var(--muted);overflow-wrap:anywhere}footer{padding:24px 0 4px;border-top:1px solid var(--line);font-size:12px;line-height:1.8;color:var(--muted)}.sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}[hidden]{display:none!important}
@media(max-width:1050px){.layout{grid-template-columns:190px minmax(0,1fr)}.catalog-nav{padding:32px 20px}main{padding:32px 24px}.specimen{grid-template-columns:1fr}.intro{align-items:flex-start;flex-direction:column;gap:16px}}
@media(max-width:600px){.masthead{padding:16px 20px;gap:12px;flex-wrap:wrap}.masthead p{display:none}.brand{font-size:19px}.back-link{font-size:12px}.layout{display:block}.catalog-nav{padding:16px 20px;border-right:0;border-bottom:1px solid var(--line)}.catalog-nav>p{margin-bottom:8px}.catalog-nav nav{display:flex;overflow-x:auto;gap:20px}.catalog-nav nav a{white-space:nowrap;padding:8px 0}.download-link{margin-top:16px}.text-link{margin-top:12px}main{padding:28px 20px}.intro h1{font-size:25px}.intro p{font-size:13px;line-height:1.8}.specimen{gap:24px;margin:24px 0}.signature{gap:16px}.signature>svg{width:52px;height:52px}.signature p{font-size:12px}.toolbar{gap:14px}.search{flex-basis:100%;max-width:none}.size-control{font-size:12px}#result-count{font-size:12px}.icon-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.icon-item{min-height:132px;padding-inline:5px}.icon-label{font-size:11px}.icon-name{font-size:10px}.sample{padding-inline:12px}}
`);
writeFileSync(resolve(out, "catalog.js"), `
const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replaceAll('đ', 'd');
const search = document.querySelector('#search');
const items = [...document.querySelectorAll('.icon-item')];
const sections = [...document.querySelectorAll('#catalog section')];
search.addEventListener('input', () => {
  const query = normalize(search.value.trim());
  let count = 0;
  for (const item of items) { item.hidden = !normalize(item.dataset.search).includes(query); if (!item.hidden) count++; }
  for (const section of sections) section.hidden = ![...section.querySelectorAll('.icon-item')].some(item => !item.hidden);
  document.querySelector('#result-count').textContent = count + ' biểu tượng';
  document.querySelector('#empty').hidden = count > 0;
});
document.querySelector('#size').addEventListener('change', event => document.documentElement.style.setProperty('--glyph-size', event.target.value + 'px'));
`);

writeFileSync(resolve(out, "README.md"), `# GeoAgent Icons v3\n\n${Object.keys(ICONS).length} icon cho GeoAgent, dựng trên Lucide (lucide-react, giấy phép ISC). Tên, nhóm và nhãn tiếng Việt là của GeoAgent; riêng dấu hiệu trợ lý (assistant) được vẽ riêng theo cùng kiểu nét.\n\n## Quy chuẩn\n\n- Lưới 24 × 24, nét ${STROKE} px, đầu và góc nét tròn. Độ dày nét giữ nguyên ở mọi cỡ (absoluteStrokeWidth).\n- 16 px cho icon phụ, 20 px mặc định, 24 px cho thao tác nổi bật.\n- Màu currentColor: tự theo màu chữ của component. Không tô cố định màu thương hiệu trong file.\n- Sidebar đỏ: trắng ấm; vùng sáng: màu chữ hoặc đỏ thương hiệu. Giữ tương phản icon chức năng tối thiểu 3:1.\n- Dấu hiệu assistant (bong bóng hội thoại và dấu định vị) là đề xuất thiết kế, chưa được kiểm chứng nhận diện với người dùng. Không thay thế logo.\n\n## React\n\nImport GeoIcon hoặc các component có tên từ src/improved/icons.jsx, không import thẳng từ lucide-react, để giữ một bộ tên và một độ dày nét chung.\n\n    <button aria-label="Đính kèm tệp"><GeoIcon name="attach" /></button>\n    <GeoIcon name="warning" label="Cảnh báo" size={24} />\n\nIcon mặc định aria-hidden, focusable=false. Đặt tên cho nút trên chính nút. Chỉ dùng label khi icon đứng độc lập mang thông tin.\n\n## Thêm icon mới\n\n1. Chọn icon trên lucide.dev.\n2. Thêm vào src/improved/icon-data.js: tên GeoAgent, nhãn tiếng Việt, nhóm, tên Lucide.\n3. Import component đó theo tên trong src/improved/icons.jsx, để bundler chỉ đóng gói icon đang dùng.\n4. Chạy npm run icons:export.\n\n## SVG riêng\n\nCác file SVG có kích thước 24 × 24 và nhãn tiếng Việt. Có thể nhập vào Figma. Khi inline vào nút đã có tên, đặt aria-hidden=true và bỏ role/aria-label của SVG.\n\nNếu dùng img, màu của phần tử cha không truyền vào file SVG: dùng inline SVG hoặc sprite để đổi màu theo theme.\n\n## Sprite\n\n    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">\n      <use href="/geoagent-icons/sprite.svg#geo-search" />\n    </svg>\n\n## Xuất lại\n\nNguồn: src/improved/icon-data.js. Chạy npm run icons:export sau khi chỉnh; không sửa riêng file được sinh trong public/geoagent-icons.\n`);
console.log(`Exported ${Object.keys(ICONS).length} GeoAgent icons and catalog to ${out}`);

