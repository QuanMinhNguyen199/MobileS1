import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Lucide from "lucide-react";
import { ICONS, ICON_GROUPS, STROKE, PLATFORMS, lucideFor } from "../src/improved/icon-data.js";
import { renderTokenView } from "./token-view.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = resolve(root, "public/geoagent-icons");
mkdirSync(out, { recursive: true });
// Self-host the browser build, including on static GitHub Pages deployments.
copyFileSync(fileURLToPath(import.meta.resolve('svgo/browser')), resolve(out, 'svgo.browser.js'));
copyFileSync(new URL('./catalog-svg-optimizer.js', import.meta.url), resolve(out, 'svg-optimizer.js'));
copyFileSync(new URL('../LICENSE', import.meta.resolve('svgo/browser')), resolve(out, 'SVGO-LICENSE.txt'));
const xml = (s) => String(s).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const attributes = (values) => Object.entries(values).map(([key, value]) => `${kebab(key)}="${xml(value)}"`).join(" ");
// Cả bộ chung một kiểu: lưới 24 × 24, nét STROKE, đầu nét tròn.
// Icon Lucide: render ra SVG tĩnh rồi lấy phần hình bên trong; dấu hiệu assistant: hình tự vẽ.
const presentation = `fill="none" stroke="currentColor" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"`;
const customGeometry = (definition) => definition.nodes.map(([tag, props]) => `<${tag} ${attributes(props)}/>`).join("");
const parts = (name, platform = "shared") => {
  const def = ICONS[name];
  if (!def.lucide) return { inner: customGeometry(def) };
  const lucideName = lucideFor(def, platform);
  const Icon = Lucide[lucideName];
  if (!Icon) throw new Error(`Lucide icon not found: ${lucideName}`);
  const markup = renderToStaticMarkup(createElement(Icon, { size: 24, strokeWidth: STROKE }));
  return { inner: markup.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "") };
};
const svg = (name, { size = 24, decorative = true, platform = "shared" } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ${presentation} ${decorative ? 'aria-hidden="true"' : `role="img" aria-label="${xml(ICONS[name].label)}"`} focusable="false">${parts(name, platform).inner}</svg>`;

// Ba bộ: dùng chung ở thư mục gốc (giữ đường dẫn cũ), iPhone ở ios/, Android ở android/
const dirOf = (platform) => (platform === "shared" ? "" : `${platform}/`);
const spriteOf = (platform) => (platform === "shared" ? "sprite.svg" : `sprite-${platform}.svg`);
const isVariant = (def, platform) => platform !== "shared" && Boolean(def.platforms) && lucideFor(def, platform) !== def.lucide;
for (const { id: platform } of PLATFORMS) {
  mkdirSync(resolve(out, dirOf(platform) || "."), { recursive: true });
  for (const name of Object.keys(ICONS)) writeFileSync(resolve(out, `${dirOf(platform)}${name}.svg`), `${svg(name, { decorative: false, platform })}\n`);
  writeFileSync(resolve(out, spriteOf(platform)), `<svg xmlns="http://www.w3.org/2000/svg"><defs>${Object.keys(ICONS).map((name) => `<symbol id="geo-${name}" viewBox="0 0 24 24" ${presentation}>${parts(name, platform).inner}</symbol>`).join("")}</defs></svg>\n`);
}
writeFileSync(resolve(out, "manifest.json"), JSON.stringify({
  name: "GeoAgent Icons", version: "3.1.0", base: "Lucide (lucide-react)", grid: 24, strokeWidth: STROKE,
  sets: PLATFORMS.map(({ id, label }) => ({ id, label, folder: dirOf(id) || "./", sprite: spriteOf(id) })),
  icons: Object.entries(ICONS).map(([name, def]) => ({
    name, label: def.label, group: def.group, source: def.lucide ? `lucide:${def.lucide}` : "geoagent:custom",
    ...(def.platforms ? { platforms: Object.fromEntries(Object.entries(def.platforms).map(([k, v]) => [k, `lucide:${v}`])) } : {}),
    file: `${name}.svg`,
  })),
}, null, 2));

// Màu có sẵn cho ô chọn màu trên catalog (màu đầu là mặc định)
const SWATCHES = [["#a3141a", "Đỏ GeoAgent"], ["#1d1416", "Mực"], ["#6b5f5c", "Xám ấm"], ["#1a5fd6", "Xanh"], ["#e9b84a", "Vàng"]];
const swatchSet = (group, pickerId, legend) => `<fieldset class="color-control"><legend>${legend}</legend>${SWATCHES.map(([hex, name], i) => `<label class="swatch" title="${name}"><input type="radio" name="${group}" value="${hex}"${i ? "" : " checked"}><span style="background:${hex}"></span><span class="sr-only">${name}</span></label>`).join("")}<label class="swatch custom" title="Chọn màu khác"><input type="color" id="${pickerId}" value="${SWATCHES[0][0]}"><span class="sr-only">Chọn màu khác</span></label></fieldset>`;
const FORMATS = [["svg", "SVG"], ["png", "PNG 24 px"]];
const formatSelect = (id) => `<select id="${id}" class="format-select">${FORMATS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select>`;
const PLATFORM_NOTE = { ios: "Riêng iPhone", android: "Riêng Android" };
const variantCount = (platform) => Object.values(ICONS).filter((def) => isVariant(def, platform)).length;
const sections = (platform) => ICON_GROUPS.map((group) => {
  const entries = Object.entries(ICONS).filter(([, def]) => def.group === group.id);
  const sid = `${platform}-${group.id}`;
  return `<section id="${sid}" aria-labelledby="heading-${sid}"><h2 id="heading-${sid}">${group.label}<span>${entries.length}</span></h2><div class="icon-grid">${entries.map(([name, def]) => {
    const variant = isVariant(def, platform);
    const badge = variant ? `<span class="badge">${PLATFORM_NOTE[platform]}</span>` : platform === "shared" && def.platforms ? `<span class="badge neutral">Có bản riêng</span>` : "";
    return `<button type="button" class="icon-item${variant ? " is-variant" : ""}" data-name="${name}" data-label="${xml(def.label)}" data-search="${xml(`${name} ${def.label}`)}" aria-haspopup="dialog" aria-label="${xml(def.label)}${variant ? `, ${PLATFORM_NOTE[platform].toLowerCase()}` : ""}: đổi màu và tải">${badge}<span class="glyph">${svg(name, { platform })}</span><span class="icon-label">${xml(def.label)}</span><span class="icon-name">${name}</span></button>`;
  }).join("")}</div></section>`;
}).join("\n");
const SET_NOTE = {
  shared: "Bộ mặc định cho web, dùng được trên cả iPhone và Android. Icon có nhãn “Có bản riêng” sẽ đổi hình khi chọn bộ iPhone hoặc Android.",
  ios: `Theo thói quen iOS: ${variantCount("ios")} icon khác bộ dùng chung (đánh dấu “Riêng iPhone”), các icon còn lại giữ nguyên.`,
  android: `Theo thói quen Android: ${variantCount("android")} icon khác bộ dùng chung (đánh dấu “Riêng Android”), các icon còn lại giữ nguyên.`,
};
const panels = PLATFORMS.map(({ id }, i) => `<div id="panel-${id}" class="set-panel" role="tabpanel" aria-labelledby="tab-${id}"${i ? " hidden" : ""}><p class="set-note">${xml(SET_NOTE[id])}</p>${sections(id)}</div>`).join("\n");
const tabs = `<div class="set-tabs" role="tablist" aria-label="Bộ icon theo nền tảng">${PLATFORMS.map(({ id, label }, i) => `<button type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-platform="${id}">${xml(label)}${id === "shared" ? "" : `<span>${variantCount(id)} riêng</span>`}</button>`).join("")}</div>`;

// Thanh trên cùng dùng chung cho hai trang của site: Icon và Token
const masthead = (current, tagline) => `<header class="masthead"><a class="brand" href="../"><img src="../app/logo.svg" width="34" height="34" alt="">GeoAgent</a><nav class="site-nav" aria-label="Trang thư viện">${[["index.html", "icon", "Icon"], ["tokens.html", "token", "Token"]].map(([href, id, label]) => `<a href="${href}"${id === current ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav><p>${tagline}</p><a class="back-link" href="../">${svg("back", { size: 18 })} Về ứng dụng</a></header>`;

writeFileSync(resolve(out, "index.html"), `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>GeoAgent — Bộ icon riêng</title><link rel="stylesheet" href="catalog.css"></head>
<body>${masthead("icon", "Bộ biểu tượng giao diện")}
<div class="layout"><aside class="catalog-nav" aria-label="Nhóm biểu tượng"><p>GeoAgent Icons</p><nav>${ICON_GROUPS.map((g) => `<a href="#shared-${g.id}" data-group="${g.id}">${xml(g.label)}</a>`).join("")}</nav><button type="button" class="download-link download-all">${svg("download", { size: 18 })} Tải cả bộ (.zip)</button><p class="download-hint">Bộ đang xem, theo màu, cỡ và định dạng đã chọn.</p><a class="text-link" href="README.md">Hướng dẫn sử dụng</a></aside>
<main><div class="intro"><div><h1>Bộ icon riêng cho GeoAgent</h1><p>${Object.keys(ICONS).length} biểu tượng SVG dựa trên Lucide · Lưới 24 × 24 · Nét ${String(STROKE).replace(".", ",")} · Đầu nét bo tròn</p></div><a class="sprite-link" id="sprite-link" href="sprite.svg" download>Tải SVG sprite ${svg("download", { size: 18 })}</a></div>
<div class="specimen"><div class="signature">${svg("assistant", { size: 64 })}<div><h2>Biểu tượng trợ lý</h2><p>Chữ G từ logo GeoAgent bao quanh bong bóng hội thoại.<br>Biểu tượng dùng một màu, đồng bộ với bộ biểu tượng chức năng.</p></div></div><div class="context-samples" aria-label="Ví dụ icon trên nền sáng và đỏ"><div class="sample light">${["new-chat", "search", "attach", "send"].map((n) => svg(n)).join("")}<span>Nền sáng</span></div><div class="sample dark">${["new-chat", "search", "attach", "send"].map((n) => svg(n)).join("")}<span>Sidebar đỏ</span></div></div></div>
${tabs}<div class="toolbar"><label class="search">${svg("search", { size: 18 })}<span class="sr-only">Tìm biểu tượng</span><input id="search" type="search" placeholder="Tìm tên hoặc chức năng…" autocomplete="off"></label><label class="size-control">Kích thước <select id="size"><option value="16">16 px</option><option value="20">20 px</option><option value="24" selected>24 px</option><option value="32">32 px</option><option value="48">48 px</option></select></label>${swatchSet("swatch", "color", "Màu cả bộ")}<label class="size-control">Tải dạng ${formatSelect("format")}</label><button type="button" class="primary-button download-all">${svg("download", { size: 18 })} Tải cả bộ</button><span id="result-count" role="status" aria-live="polite">${Object.keys(ICONS).length} biểu tượng</span></div>
<p class="download-note"><span>Chọn một biểu tượng để đổi màu riêng cho nó, hoặc tải về.</span> <span id="custom-count" hidden></span> <span id="color-warning" hidden>Màu này khó thấy trên nền trắng (tương phản dưới 3:1).</span></p><div id="catalog">${panels}</div><p id="empty" hidden>Không tìm thấy biểu tượng phù hợp. Hãy thử từ khóa khác.</p>
<footer>Icon chức năng: Lucide (giấy phép ISC). Dấu hiệu trợ lý: vẽ riêng cho GeoAgent. File SVG trong thư mục và sprite dùng currentColor (màu theo ngữ cảnh); file tải từ trang này mang màu đã chọn.</footer></main></div>
<dialog id="icon-dialog" closedby="any" aria-labelledby="dlg-title"><form method="dialog" class="dlg-close"><button value="" aria-label="Đóng">${svg("close", { size: 20 })}</button></form>
<div class="dlg-preview" id="dlg-preview"></div><h2 id="dlg-title"></h2><p class="dlg-name" id="dlg-name"></p>
${swatchSet("dlg-swatch", "dlg-color", "Màu của icon này")}<p class="dlg-warning" id="dlg-warning" hidden>Màu này khó thấy trên nền trắng (tương phản dưới 3:1).</p>
<div class="dlg-row"><button type="button" class="ghost-button" id="dlg-apply-all">Áp dụng màu này cho tất cả</button></div>
<div class="dlg-row dlg-download"><label class="size-control">Tải dạng ${formatSelect("dlg-format")}</label><button type="button" class="primary-button" id="dlg-download" autofocus>${svg("download", { size: 18 })} Tải xuống</button></div></dialog><script type="module" src="catalog.js"></script></body></html>`);

writeFileSync(resolve(out, "catalog.css"), `
:root{color-scheme:light;--brand:#a3141a;--ink:#1d1416;--muted:#6b5f5c;--line:#e7dfdb;--glyph-size:24px;font-family:Inter,"Segoe UI",system-ui,sans-serif;color:var(--ink);background:#fcf8f7}
*{box-sizing:border-box}body{margin:0}a{color:inherit}button,input,select{font:inherit}svg{flex:none}a,input,select{outline-offset:4px}:focus-visible{outline:2px solid #1a5fd6}a{text-underline-offset:4px}p{line-height:1.6}h1,h2,p{margin-top:0}
.masthead{min-height:80px;display:flex;align-items:center;gap:32px;padding:18px 40px;background:var(--brand);color:#fff7f0}.brand{display:flex;gap:12px;align-items:center;font-size:21px;font-weight:700;text-decoration:none}.masthead p{margin:0;color:#f2cfc6;font-size:14px}.back-link{display:flex;align-items:center;gap:8px;margin-left:auto;font-size:14px;text-decoration:none}.masthead :focus-visible{outline-color:#fff7f0}.site-nav{display:flex;gap:4px;padding:4px;border-radius:999px;background:#85101a}.site-nav a{display:flex;align-items:center;min-height:36px;padding:0 16px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;color:#f2cfc6}.site-nav a:hover{color:#fff7f0}.site-nav a[aria-current=page]{background:#fff7f0;color:var(--brand)}
.layout{display:grid;grid-template-columns:236px minmax(0,1fr);max-width:1600px;margin:auto}.catalog-nav{padding:42px 28px;border-right:1px solid var(--line)}.catalog-nav>p{font-size:14px;font-weight:650;margin-bottom:24px}.catalog-nav nav{display:grid;gap:8px}.catalog-nav nav a{padding:10px 0;font-size:14px;text-decoration:none;color:var(--muted)}.catalog-nav a:hover{color:var(--brand)}.download-link{display:flex;align-items:center;gap:8px;margin-top:40px;font-size:14px;font-weight:600}.text-link{display:block;font-size:13px;color:var(--muted);margin-top:18px}main{min-width:0;padding:40px 44px}.intro{display:flex;gap:24px;align-items:center;justify-content:space-between}.intro h1{font-size:28px;line-height:1.3;letter-spacing:-.025em;margin-bottom:12px}.intro p{font-size:14px;color:var(--muted);margin-bottom:0}.sprite-link{display:flex;gap:8px;align-items:center;font-size:13px;white-space:nowrap}
.specimen{display:grid;grid-template-columns:1.1fr 1fr;gap:32px;align-items:center;padding:28px 0;margin:28px 0;border-block:1px solid var(--line)}.signature{display:flex;align-items:center;gap:20px;color:var(--brand)}.signature h2{color:var(--ink);font-size:17px;margin-bottom:6px}.signature p{color:var(--muted);font-size:13px;margin-bottom:0}.context-samples{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line);border-radius:12px;overflow:hidden}.sample{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 10px;padding:22px 16px;place-items:center}.sample span{grid-column:1/-1;font-size:11px}.light{background:white;color:var(--brand)}.dark{background:var(--brand);color:#fff7f0}
.toolbar{display:flex;align-items:center;gap:20px;flex-wrap:wrap}.search{display:flex;align-items:center;gap:10px;max-width:360px;flex:1 1 260px;min-width:220px;border:1px solid #958884;border-radius:8px;padding:10px 12px;background:white}.search input{min-width:0;width:100%;border:0;background:transparent;color:var(--ink);font-size:14px}.search input:focus{outline:0}.search:focus-within{outline:2px solid #1a5fd6;outline-offset:2px}.search input::placeholder{color:var(--muted)}.size-control{font-size:13px;color:var(--muted);display:flex;align-items:center;gap:8px}.size-control select{padding:8px;border:1px solid #958884;border-radius:6px;background:white;color:var(--ink)}#result-count{margin-left:auto;font-size:13px;color:var(--muted)}.download-note{font-size:12px;color:var(--muted);margin:14px 0 24px}
.set-tabs{display:flex;gap:4px;margin:0 0 20px;border-bottom:1px solid var(--line);overflow-x:auto}.set-tabs button{display:flex;align-items:center;gap:8px;margin-bottom:-1px;padding:12px 16px;border:0;border-bottom:2px solid transparent;background:none;color:var(--muted);font-size:14px;font-weight:600;white-space:nowrap;cursor:pointer}.set-tabs button span{font-size:11px;font-weight:500;padding:2px 8px;border-radius:999px;background:#f3ece8;color:var(--muted)}.set-tabs button:hover{color:var(--ink)}.set-tabs button[aria-selected="true"]{color:var(--brand);border-bottom-color:var(--brand)}.set-tabs button[aria-selected="true"] span{background:#f5d6d0;color:#7a1519}.set-tabs button:focus-visible{outline-offset:-2px}.color-control{display:flex;align-items:center;gap:6px;margin:0;padding:0;border:0;min-width:0}.color-control legend{float:left;margin-right:4px;font-size:13px;color:var(--muted)}.swatch{position:relative;display:grid;place-items:center;width:32px;height:32px;border-radius:50%;cursor:pointer}.swatch input[type=radio]{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}.swatch span:not(.sr-only){width:22px;height:22px;border-radius:50%;box-shadow:inset 0 0 0 1px rgb(0 0 0 / .15)}.swatch:has(input:checked){box-shadow:0 0 0 2px var(--ink)}.swatch:has(input:focus-visible){outline:2px solid #1a5fd6;outline-offset:2px}.swatch.custom input{width:26px;height:26px;padding:0;border:1px solid #958884;border-radius:50%;background:conic-gradient(red,yellow,lime,aqua,blue,magenta,red);cursor:pointer;overflow:hidden}.swatch.custom input::-webkit-color-swatch-wrapper{padding:0}.swatch.custom input::-webkit-color-swatch{border:0;border-radius:50%}.swatch.custom input::-moz-color-swatch{border:0;border-radius:50%}.swatch.custom:not(.active) input::-webkit-color-swatch{opacity:0}.swatch.custom:not(.active) input::-moz-color-swatch{opacity:0}.swatch.custom.active{box-shadow:0 0 0 2px var(--ink)}#color-warning,.dlg-warning{color:#8a4b00;font-weight:600}
.icon-item{font:inherit;color:inherit;cursor:pointer;border-top:0;border-left:0}.icon-item.has-color .glyph::after{content:"";position:absolute;top:10px;left:10px;width:8px;height:8px;border-radius:50%;background:var(--glyph-color)}
.ghost-button,.primary-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:38px;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer}.ghost-button{border:1px solid #958884;background:white;color:var(--ink)}.ghost-button:hover:not(:disabled){background:#f5efec}.ghost-button:disabled{opacity:.5;cursor:default}.primary-button{border:0;background:var(--brand);color:#fff}.primary-button:hover{background:#8a1218}.primary-button:disabled{opacity:.6;cursor:progress}
button.download-link{border:0;background:none;padding:0;color:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:4px}.catalog-nav .download-hint{font-size:12px;font-weight:400;line-height:1.5;color:var(--muted);margin:6px 0 0}
#icon-dialog{width:min(440px,calc(100vw - 32px));max-height:calc(100dvh - 32px);padding:28px 24px 24px;border:0;border-radius:16px;color:var(--ink);background:#fff;box-shadow:0 24px 60px rgb(40 4 6 / .3)}#icon-dialog:modal{overscroll-behavior:contain}#icon-dialog::backdrop{background:rgb(29 20 22 / .45);overflow:hidden;overscroll-behavior:contain}
.dlg-close{position:absolute;top:10px;right:10px;margin:0}.dlg-close button{display:grid;place-items:center;width:40px;height:40px;border:0;border-radius:50%;background:none;color:var(--muted);cursor:pointer}.dlg-close button:hover{background:#f5efec;color:var(--ink)}
.dlg-preview{display:grid;place-items:center;height:132px;margin-bottom:16px;border:1px solid var(--line);border-radius:12px;background:#fff;color:var(--glyph-color)}.dlg-preview svg{width:88px;height:88px}#icon-dialog h2{font-size:18px;margin:0 0 2px;padding-right:32px}.dlg-name{font-size:12px;color:var(--muted);margin:0 0 16px}#icon-dialog .color-control{flex-wrap:wrap}#icon-dialog .color-control legend{float:none;width:100%;margin:0 0 8px}.dlg-preview{margin-top:20px}.dlg-warning{font-size:12px;margin:8px 0 0}.dlg-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.dlg-download{align-items:center;justify-content:space-between;padding-top:16px;border-top:1px solid var(--line)}
.set-note{font-size:13px;color:var(--muted);margin:0 0 22px}.icon-item{position:relative}.badge{position:absolute;top:8px;right:8px;font-size:10px;line-height:1;padding:4px 6px;border-radius:999px;background:#f5d6d0;color:#7a1519;font-weight:600}.badge.neutral{background:#f3ece8;color:var(--muted)}.icon-item.is-variant{background:#fffaf8}
section{scroll-margin-top:20px;margin-bottom:32px}section h2{font-size:16px;font-weight:650;display:flex;gap:10px;align-items:center;margin-bottom:16px}section h2 span{color:var(--muted);font-size:12px;font-weight:400}.icon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));border-top:1px solid var(--line);border-left:1px solid var(--line)}.icon-item{min-height:142px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;padding:16px 8px;background:#fff;text-decoration:none;text-align:center;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.icon-item:hover{background:#f5e9e5;color:var(--brand)}.glyph{height:36px;display:flex;align-items:center;justify-content:center;color:var(--glyph-color,var(--brand))}.glyph svg{width:var(--glyph-size);height:var(--glyph-size)}.icon-label{font-size:12px;line-height:1.6}.icon-name{font-size:11px;color:var(--muted);overflow-wrap:anywhere}footer{padding:24px 0 4px;border-top:1px solid var(--line);font-size:12px;line-height:1.8;color:var(--muted)}.sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}[hidden]{display:none!important}
@media(max-width:1050px){.layout{grid-template-columns:190px minmax(0,1fr)}.catalog-nav{padding:32px 20px}main{padding:32px 24px}.specimen{grid-template-columns:1fr}.intro{align-items:flex-start;flex-direction:column;gap:16px}}
@media(max-width:600px){.masthead{padding:16px 20px;gap:12px;flex-wrap:wrap}.site-nav{order:3;width:100%}.site-nav a{flex:1;justify-content:center}.masthead p{display:none}.brand{font-size:19px}.back-link{font-size:12px}.layout{display:block}.catalog-nav{padding:16px 20px;border-right:0;border-bottom:1px solid var(--line)}.catalog-nav>p{margin-bottom:8px}.catalog-nav nav{display:flex;overflow-x:auto;gap:20px}.catalog-nav nav a{white-space:nowrap;padding:8px 0}.download-link{margin-top:16px}.text-link{margin-top:12px}main{padding:28px 20px}.intro h1{font-size:25px}.intro p{font-size:13px;line-height:1.8}.specimen{gap:24px;margin:24px 0}.signature{gap:16px}.signature>svg{width:52px;height:52px}.signature p{font-size:12px}.toolbar{gap:14px}.search{flex-basis:100%;max-width:none}.size-control{font-size:12px}#result-count{font-size:12px}.set-tabs{gap:0}.set-tabs button{flex:1;justify-content:center;gap:5px;padding:12px 6px;font-size:13px}.set-tabs button span{font-size:10px;padding:2px 6px}.icon-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.icon-item{min-height:132px;padding-inline:5px}.icon-label{font-size:11px}.icon-name{font-size:10px}.sample{padding-inline:12px}}
`);
// ===== Trang Token: nội dung dựng bởi scripts/token-view.mjs (dùng chung với trình duyệt khi thả file khác vào)
{
  const TOK = JSON.parse(readFileSync(resolve(root, "tokens/geoagent.tokens.json"), "utf8"));
  copyFileSync(resolve(root, "tokens/geoagent.tokens.json"), resolve(out, "geoagent.tokens.json"));
  copyFileSync(new URL("./token-view.mjs", import.meta.url), resolve(out, "token-view.js"));
  // Đánh số phiên bản CSS/JS theo nội dung: trình duyệt không dùng bản cũ đã lưu khi trang đổi
  const tokenAssetVersion = createHash("sha256").update(["token-page.css", "token-page.js", "token-view.mjs"].map((n) => readFileSync(new URL("./" + n, import.meta.url))).join("")).digest("hex").slice(0, 10);
  const view = renderTokenView(TOK);
  if (view.problems.length) throw new Error("tokens/geoagent.tokens.json lỗi:\n- " + view.problems.join("\n- "));
  const navHtml = (nav) => nav.map(([id, l]) => `<a href="#${id}">${l}</a>`).join("");
  const usage = `<section class="tk-section tk-usage" id="usage" aria-labelledby="h-usage"><h2 id="h-usage">Dùng trong code</h2>
<ol><li><b>Trong Figma</b>, chọn phần tử, đọc tên biến (Fill <code>brand/brand</code>), kiểu chữ (<code>Body/Message</code>) hoặc đổ bóng. Mô tả của component ghi sẵn cách gọi component React.</li>
<li><b>Trong code</b>, tìm token đó trên trang này và bấm để sao chép class: <code>bg-brand</code>, <code>text-message</code>, <code>shadow-composer</code>. Chỉ dùng <code>var(--brand)</code> ở nơi không viết được class (style inline, file CSS, thư viện ngoài, SVG). Không gõ mã màu hay số px.</li>
<li><b>Đồng bộ</b> khi token đổi: plugin GeoAgent DS Builder → Tải tokens.json → chép đè <code>tokens/geoagent.tokens.json</code> → <code>npm run tokens</code>. Trang này tự cập nhật ở lần deploy sau.</li>
<li><b>Nền tảng khác</b> (iOS, Android, React Native): dùng file <a href="geoagent.tokens.json" download>geoagent.tokens.json</a> (chuẩn W3C DTCG) với công cụ như Style Dictionary.</li></ol></section>`;
  writeFileSync(resolve(out, "tokens.html"), `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>GeoAgent — Design token</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Plus+Jakarta+Sans:wght@600&display=swap&subset=vietnamese">
<link rel="stylesheet" href="catalog.css"><link rel="stylesheet" href="token-page.css?v=${tokenAssetVersion}"></head>
<body>${masthead("token", "Design token")}
<div class="layout"><aside class="catalog-nav" aria-label="Nhóm token"><p>GeoAgent Tokens</p><nav id="tk-nav">${navHtml(view.nav)}<a href="#usage">Dùng trong code</a></nav><a class="download-link" href="geoagent.tokens.json" download>${svg("download", { size: 18 })} Tải tokens.json</a><p class="download-hint">Chuẩn W3C DTCG. Nguồn chung của Figma và code.</p></aside>
<main><div class="intro"><div><h1 id="tk-title">Design token GeoAgent</h1><p id="tk-summary">${view.total} token · Global → Alias → Component · Bảng biến, màu Sáng / Tối và cách dùng trong code</p></div></div>
<div class="tk-drop" id="tk-drop"><div class="tk-drop-text">${svg("document", { size: 22 })}<p><b>Xem file token khác</b><span>Kéo thả file .json vào đây, hoặc chọn file. File chỉ được đọc trên máy bạn, không tải lên đâu.</span></p></div><label class="ghost-button tk-pick">Chọn file…<input type="file" id="tk-file" accept=".json,application/json" class="sr-only"></label></div>
<div class="tk-viewing" id="tk-viewing" hidden><p><span id="tk-viewing-text"></span></p><button type="button" class="ghost-button" id="tk-reset">Xem lại token GeoAgent</button></div>
<div class="tk-problems" id="tk-problems" role="alert" hidden></div>
<div class="toolbar tk-toolbar"><label class="search">${svg("search", { size: 18 })}<span class="sr-only">Tìm token</span><input id="tk-search" type="search" placeholder="Tìm alias, biến gốc hoặc class" autocomplete="off"></label><span id="tk-count" role="status" aria-live="polite">${view.total} token</span><span id="copy-status" class="copy-status" role="status" aria-live="polite"></span></div>
<div id="tk-content">${view.html}</div>
<p id="tk-empty" hidden>Không tìm thấy token phù hợp. Thử tên ngắn hơn, ví dụ “brand” hoặc “ink”.</p>
${usage}
<footer>Sinh tự động từ tokens/geoagent.tokens.json bởi npm run icons:export. Không sửa tay trang này.</footer></main></div>
<script type="module" src="token-page.js?v=${tokenAssetVersion}"></script></body></html>`);

  copyFileSync(new URL("./token-page.css", import.meta.url), resolve(out, "token-page.css"));

  writeFileSync(resolve(out, "token-page.js"), readFileSync(new URL("./token-page.js", import.meta.url), "utf8").replace("./token-view.js\"", `./token-view.js?v=${tokenAssetVersion}"`));
}

writeFileSync(resolve(out, "catalog.js"), `
import { optimizeSvg } from './svg-optimizer.js';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replaceAll('đ', 'd');
const SPRITES = { shared: 'sprite.svg', ios: 'sprite-ios.svg', android: 'sprite-android.svg' };
const DIRS = { shared: '', ios: 'ios/', android: 'android/' };
const DEFAULT_COLOR = $('input[name="swatch"]').value;
const search = $('#search');
const tabs = $$('[role="tab"]');
const dialog = $('#icon-dialog');

// Trạng thái: bộ đang xem, màu cả bộ, màu riêng từng icon, định dạng tải
let platform = 'shared';
let color = DEFAULT_COLOR;
let format = 'svg';
let current = null;
const overrides = new Map();
const colorOf = (name) => overrides.get(name) || color;
const size = () => Number($('#size').value);

// Tương phản với nền trắng (WCAG)
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const lowContrast = (hex) => 1.05 / (luminance(hex) + 0.05) < 3;

function syncSwatches(group, picker, hex) {
  let matched = false;
  for (const radio of $$('input[name="' + group + '"]')) { radio.checked = radio.value === hex; matched ||= radio.checked; }
  picker.value = hex;
  picker.parentElement.classList.toggle('active', !matched);
}

function paint() {
  document.documentElement.style.setProperty('--glyph-color', color);
  for (const item of $$('.icon-item')) {
    const own = overrides.get(item.dataset.name);
    item.classList.toggle('has-color', Boolean(own));
    if (own) item.style.setProperty('--glyph-color', own); else item.style.removeProperty('--glyph-color');
  }
  syncSwatches('swatch', $('#color'), color);
  $('#custom-count').hidden = overrides.size === 0;
  $('#custom-count').textContent = overrides.size + ' icon đang có màu riêng (chấm màu ở góc).';
  $('#color-warning').hidden = !lowContrast(color);
  const url = new URL(location.href);
  if (color === DEFAULT_COLOR) url.searchParams.delete('mau'); else url.searchParams.set('mau', color.slice(1));
  history.replaceState(null, '', url);
}

// Màu cả bộ: giữ nguyên các icon đã đặt màu riêng
$$('input[name="swatch"]').forEach(radio => radio.addEventListener('change', () => { color = radio.value; paint(); }));
$('#color').addEventListener('input', (event) => { color = event.target.value.toLowerCase(); paint(); });

// Hộp thoại từng icon
function syncDialog() {
  const hex = colorOf(current);
  $('#dlg-preview').style.setProperty('--glyph-color', hex);
  syncSwatches('dlg-swatch', $('#dlg-color'), hex);
  $('#dlg-warning').hidden = !lowContrast(hex);
}
function setIconColor(hex) {
  hex = hex.toLowerCase();
  if (hex === color) overrides.delete(current); else overrides.set(current, hex);
  syncDialog();
  paint();
}
function openDialog(item) {
  current = item.dataset.name;
  $('#dlg-preview').replaceChildren($('.glyph svg', item).cloneNode(true));
  $('#dlg-title').textContent = item.dataset.label;
  $('#dlg-name').textContent = current + (platform === 'shared' ? '' : ' · bộ ' + $('#tab-' + platform).firstChild.textContent);
  $('#dlg-apply-all').textContent = 'Áp dụng màu này cho tất cả';
  $('#dlg-format').value = format;
  syncDialog();
  dialog.showModal();
}
$('#catalog').addEventListener('click', (event) => {
  const item = event.target.closest('.icon-item');
  if (item) openDialog(item);
});
$$('input[name="dlg-swatch"]').forEach(radio => radio.addEventListener('change', () => setIconColor(radio.value)));
$('#dlg-color').addEventListener('input', (event) => setIconColor(event.target.value));
$('#dlg-apply-all').addEventListener('click', (event) => {
  color = colorOf(current);
  overrides.clear();
  paint();
  syncDialog();
  event.currentTarget.textContent = 'Đã áp dụng cho cả bộ';
});
// Safari chưa hỗ trợ closedby: tự đóng khi bấm ra ngoài hộp thoại
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const outside = (e) => { const r = dialog.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; };
  let pressedOutside = false;
  dialog.addEventListener('pointerdown', (e) => { pressedOutside = outside(e); });
  dialog.addEventListener('pointerup', (e) => { if (pressedOutside && outside(e)) dialog.close(); });
}

// Định dạng tải: SVG, hoặc PNG đúng bằng Kích thước đang chọn
for (const select of $$('.format-select')) select.addEventListener('change', () => { format = select.value; for (const other of $$('.format-select')) other.value = format; });
const baseName = (name) => 'geoagent-' + (platform === 'shared' ? '' : platform + '-') + name;

async function render(name, fmt) {
  const px = size();
  const hex = colorOf(name);
  const filename = baseName(name);
  const response = await fetch(DIRS[platform] + name + '.svg');
  if (!response.ok) throw new Error('Không đọc được SVG: ' + response.status);
  const source = await response.text();
  let text = source.replaceAll('currentColor', hex).replace('width="24" height="24"', 'width="' + px + '" height="' + px + '"');
  if (fmt === 'svg') text = await optimizeSvg(text);
  const svgBlob = new Blob([text], { type: 'image/svg+xml' });
  if (fmt === 'svg') return { name: filename + '.svg', blob: svgBlob };
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = new Image(px, px);
    image.src = url;
    await image.decode();
    const canvas = Object.assign(document.createElement('canvas'), { width: px, height: px });
    canvas.getContext('2d').drawImage(image, 0, 0, px, px);
    const blob = await new Promise((done) => canvas.toBlob(done, 'image/png'));
    return { name: filename + '.png', blob };
  } finally { URL.revokeObjectURL(url); }
}
function save(blob, filename) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
async function busy(button, label, task) {
  if (button.getAttribute('aria-busy') === 'true') return;
  const original = button.innerHTML;
  button.setAttribute('aria-busy', 'true');
  button.disabled = true;
  button.textContent = label;
  try { await task(); } catch (error) { console.error(error); alert('Không tạo được file. Hãy thử lại.'); }
  finally { button.disabled = false; button.removeAttribute('aria-busy'); button.innerHTML = original; }
}
$('#sprite-link').addEventListener('click', (event) => {
  event.preventDefault();
  const sprite = SPRITES[platform];
  busy(event.currentTarget, 'Đang tạo…', async () => {
    const response = await fetch(sprite);
    if (!response.ok) throw new Error('Không đọc được sprite: ' + response.status);
    const text = await optimizeSvg(await response.text());
    save(new Blob([text], { type: 'image/svg+xml' }), sprite);
  });
});
$('#dlg-download').addEventListener('click', (event) => busy(event.currentTarget, 'Đang tạo…', async () => {
  const file = await render(current, format);
  save(file.blob, file.name);
}));

// ZIP không nén (đủ cho SVG/PNG nhỏ), tự dựng để không cần thư viện
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (bytes) => { let c = 0xffffffff; for (const b of bytes) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zip(files) {
  const encoder = new TextEncoder();
  const body = [], central = [];
  let offset = 0, centralSize = 0;
  for (const { name, bytes } of files) {
    const path = encoder.encode(name);
    const crc = crc32(bytes);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
    local.setUint16(12, 0x21, true); local.setUint32(14, crc, true); local.setUint32(18, bytes.length, true);
    local.setUint32(22, bytes.length, true); local.setUint16(26, path.length, true);
    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true); entry.setUint16(4, 20, true); entry.setUint16(6, 20, true); entry.setUint16(8, 0x0800, true);
    entry.setUint16(14, 0x21, true); entry.setUint32(16, crc, true); entry.setUint32(20, bytes.length, true);
    entry.setUint32(24, bytes.length, true); entry.setUint16(28, path.length, true); entry.setUint32(42, offset, true);
    body.push(local, path, bytes);
    central.push(entry, path);
    offset += 30 + path.length + bytes.length;
    centralSize += 46 + path.length;
  }
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true); end.setUint32(16, offset, true);
  return new Blob([...body, ...central, end], { type: 'application/zip' });
}
for (const button of $$('.download-all')) button.addEventListener('click', () => busy(button, 'Đang tạo…', async () => {
  const names = $$('.set-panel:not([hidden]) .icon-item').map(item => item.dataset.name);
  const files = await Promise.all(names.map(async (name) => {
    const file = await render(name, format);
    return { name: file.name, bytes: new Uint8Array(await file.blob.arrayBuffer()) };
  }));
  const kind = format;
  save(zip(files), 'geoagent-icons-' + platform + '-' + kind + '-' + size() + 'px.zip');
}));

// Tìm kiếm trong bộ đang xem
function applySearch() {
  const query = normalize(search.value.trim());
  const panel = $('.set-panel:not([hidden])');
  let count = 0;
  for (const item of $$('.icon-item', panel)) { item.hidden = !normalize(item.dataset.search).includes(query); if (!item.hidden) count++; }
  for (const section of $$('section', panel)) section.hidden = !$$('.icon-item', section).some(item => !item.hidden);
  $('#result-count').textContent = count + ' biểu tượng';
  $('#empty').hidden = count > 0;
}
search.addEventListener('input', applySearch);

// Chuyển bộ: tab theo mẫu ARIA (mũi tên trái/phải, Home/End); bộ đang xem ghi vào ?bo= để chia sẻ link
function select(next, focus = false) {
  platform = next;
  for (const tab of tabs) {
    const on = tab.dataset.platform === next;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !on;
    if (on && focus) tab.focus();
  }
  $('#sprite-link').href = SPRITES[next];
  for (const link of $$('.catalog-nav nav a')) link.href = '#' + next + '-' + link.dataset.group;
  const url = new URL(location.href);
  if (next === 'shared') url.searchParams.delete('bo'); else url.searchParams.set('bo', next);
  history.replaceState(null, '', url);
  applySearch();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => select(tab.dataset.platform));
  tab.addEventListener('keydown', (event) => {
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(tabs[(next + tabs.length) % tabs.length].dataset.platform, true);
  });
});
// Nhãn PNG ghi cỡ ảnh theo Kích thước đang chọn
function labelFormats() {
  for (const option of $$('.format-select option')) {
    if (option.value === 'svg') continue;
    option.textContent = 'PNG ' + size() + ' px';
  }
}
$('#size').addEventListener('change', event => { document.documentElement.style.setProperty('--glyph-size', event.target.value + 'px'); labelFormats(); });
labelFormats();

const params = new URLSearchParams(location.search);
if (/^[0-9a-f]{6}$/i.test(params.get('mau') || '')) color = '#' + params.get('mau').toLowerCase();
select(SPRITES[params.get('bo')] ? params.get('bo') : 'shared');
paint();
`);

writeFileSync(resolve(out, "README.md"), `# GeoAgent Icons v3\n\n${Object.keys(ICONS).length} icon cho GeoAgent, dựng trên Lucide (lucide-react, giấy phép ISC). Tên, nhóm và nhãn tiếng Việt là của GeoAgent; riêng dấu hiệu trợ lý (assistant) được vẽ riêng theo cùng kiểu nét.\n\n## Quy chuẩn\n\n- Lưới 24 × 24, nét ${STROKE} px, đầu và góc nét tròn. Độ dày nét giữ nguyên ở mọi cỡ (absoluteStrokeWidth).\n- 16 px cho icon phụ, 20 px mặc định, 24 px cho thao tác nổi bật.\n- Màu currentColor: tự theo màu chữ của component. Không tô cố định màu thương hiệu trong file.\n- Sidebar đỏ: trắng ấm; vùng sáng: màu chữ hoặc đỏ thương hiệu. Giữ tương phản icon chức năng tối thiểu 3:1.\n- Dấu hiệu assistant (bong bóng hội thoại và dấu định vị) là đề xuất thiết kế, chưa được kiểm chứng nhận diện với người dùng. Không thay thế logo.\n\n## React\n\nImport GeoIcon hoặc các component có tên từ src/improved/icons.jsx, không import thẳng từ lucide-react, để giữ một bộ tên và một độ dày nét chung.\n\n    <button aria-label="Đính kèm tệp"><GeoIcon name="attach" /></button>\n    <GeoIcon name="warning" label="Cảnh báo" size={24} />\n\nIcon mặc định aria-hidden, focusable=false. Đặt tên cho nút trên chính nút. Chỉ dùng label khi icon đứng độc lập mang thông tin.\n\n## Thêm icon mới\n\n1. Chọn icon trên lucide.dev.\n2. Thêm vào src/improved/icon-data.js: tên GeoAgent, nhãn tiếng Việt, nhóm, tên Lucide.\n3. Import component đó theo tên trong src/improved/icons.jsx, để bundler chỉ đóng gói icon đang dùng.\n4. Chạy npm run icons:export.\n\n## SVG riêng\n\nCác file SVG có kích thước 24 × 24 và nhãn tiếng Việt. Có thể nhập vào Figma. Khi inline vào nút đã có tên, đặt aria-hidden=true và bỏ role/aria-label của SVG.\n\nNếu dùng img, màu của phần tử cha không truyền vào file SVG: dùng inline SVG hoặc sprite để đổi màu theo theme.\n\n## Ba bộ: dùng chung, iPhone, Android\n\nMột số icon đổi hình theo thói quen từng nền tảng: quay lại (iPhone: chevron), tùy chọn (Android: ba chấm dọc), gửi (Android: máy bay giấy), chia sẻ (Android: ba nút nối). Các icon còn lại giống nhau ở cả ba bộ.\n\n- Dùng chung: thư mục gốc, sprite.svg\n- iPhone: ios/, sprite-ios.svg\n- Android: android/, sprite-android.svg\n\nTrong React: <GeoIcon name="back" platform="ios" />. Mặc định platform="shared".\n\n## Đổi màu và tải PNG trên trang catalog\n\n- Màu cả bộ: chọn ở thanh công cụ; ô đầu tiên (đỏ GeoAgent) là màu mặc định.\n- Màu riêng: bấm một icon, chọn màu trong hộp thoại; Áp dụng màu này cho tất cả đặt màu đó cho cả bộ và bỏ các màu riêng.\n- SVG tải riêng, trong ZIP và sprite được tự động tối ưu bằng SVGO ngay trong trình duyệt. Giữ viewBox, kích thước, nhãn và ID sprite; nếu tối ưu lỗi thì tải bản gốc.\n- Tải dạng SVG hoặc PNG. PNG có cỡ đúng bằng Kích thước đang chọn (16 đến 48 px). Tải cả bộ tạo file .zip của bộ đang xem ngay trong trình duyệt.\n- Màu riêng từng icon chỉ giữ trong lần mở trang; màu cả bộ được ghi vào link (?mau=).\n\n## Sprite\n\n    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">\n      <use href="/geoagent-icons/sprite.svg#geo-search" />\n    </svg>\n\n## Xuất lại\n\nNguồn: src/improved/icon-data.js. Chạy npm run icons:export sau khi chỉnh; không sửa riêng file được sinh trong public/geoagent-icons.\n`);
console.log(`Exported ${Object.keys(ICONS).length} GeoAgent icons and catalog to ${out}`);

