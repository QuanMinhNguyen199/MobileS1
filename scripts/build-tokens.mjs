// Sinh src/tokens.css từ tokens/geoagent.tokens.json (chuẩn W3C DTCG).
// Chạy: npm run tokens  ·  Kiểm tra không ghi file: npm run tokens -- --check
//
// Luồng đồng bộ: sửa token trong Figma → plugin GeoAgent DS Builder → "Tải tokens.json"
// → chép đè tokens/geoagent.tokens.json → npm run tokens. Không sửa tay src/tokens.css.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "tokens/geoagent.tokens.json");
const OUT = path.join(root, "src/tokens.css");
const SCOPE = ':root[data-variant="improved"]';

const T = JSON.parse(fs.readFileSync(SRC, "utf8"));
const errors = [];

// Duyệt cây token: trả về [đường dẫn, token] cho mọi nút có $value
const leaves = (node, prefix = []) =>
  Object.entries(node).flatMap(([k, v]) => (k.startsWith("$") || typeof v !== "object" ? [] : "$value" in v ? [[[...prefix, k], v]] : leaves(v, [...prefix, k])));
const lookup = (ref) => ref.split(".").reduce((o, k) => (o ? o[k] : undefined), T);
const cssName = (tok, fallback) => tok.$extensions?.geoagent?.css || fallback;

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const colorCss = (v, where) => {
  if (typeof v === "string") {
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
    errors.push(`${where}: màu không hợp lệ "${v}"`);
    return v;
  }
  const [r, g, b] = v.hex ? hexToRgb(v.hex) : v.components.map((c) => Math.round(c * 255));
  return v.alpha == null || v.alpha === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${+v.alpha.toFixed(3)})`;
};
const px = (d) => (d === "0px" ? "0" : d);

const lines = [];
const out = (s = "") => lines.push(s);
out("/* SINH TỰ ĐỘNG bởi scripts/build-tokens.mjs từ tokens/geoagent.tokens.json. Không sửa tay: sửa token rồi chạy `npm run tokens`. */");
out();

// ---- 3 tầng: global (mã màu) → alias (vai trò, sáng/tối) → component (bộ phận). Chỉ áp dụng cho bản improved.
const prim = leaves(T.global, ["global"]);
const sem = leaves(T.alias, ["alias"]);
const comp = leaves(T.component || {}, ["component"]);
out(`${SCOPE} {`);
out("  /* Tầng 1 · Global: mã màu gốc. Đổi màu cho dự án khác: sửa ở đây (qua token JSON). */");
const primCss = new Map();
for (const [p, tok] of prim) {
  const name = cssName(tok, "--" + p.slice(1).join("-"));
  primCss.set(p.join("."), name);
  out(`  ${name}: ${colorCss(tok.$value, p.join("."))};`);
}
out();
out("  /* Tầng 2 · Alias: vai trò, luôn trỏ về global; có bản sáng và bản tối. */");
const semNames = [];
const darkPairs = []; // [tên biến, primitive sáng, primitive tối]
const aliasOf = (value, where) => {
  const m = typeof value === "string" && value.match(/^\{(.+)\}$/);
  if (!m) { errors.push(`${where}: phải trỏ về {global...}, đang là ${JSON.stringify(value)}`); return null; }
  if (!primCss.has(m[1])) { errors.push(`${where}: không có global ${m[1]}`); return null; }
  return primCss.get(m[1]);
};
for (const [p, tok] of sem) {
  const name = cssName(tok, "--" + p.at(-1));
  const light = aliasOf(tok.$value, p.join("."));
  if (!light) continue;
  semNames.push(name);
  out(`  ${name}: var(${light});${tok.$description ? " /* " + tok.$description + " */" : ""}`);
  const darkRef = tok.$extensions?.geoagent?.dark;
  if (darkRef) { const dark = aliasOf(darkRef, p.join(".") + " (bản tối)"); if (dark && dark !== light) darkPairs.push([name, light, dark]); }
}
if (darkPairs.length) {
  out();
  out("  /* Giao diện tối. Trình duyệt cũ (chưa có light-dark()): theo cài đặt sáng/tối của máy. */");
  out("  @media (prefers-color-scheme: dark) {");
  for (const [name, , dark] of darkPairs) out(`    ${name}: var(${dark});`);
  out("  }");
  out("  /* Trình duyệt mới: light-dark() theo color-scheme của trang, nên lựa chọn Sáng/Tối trong Cài đặt của app có tác dụng. */");
  out("  @supports (color: light-dark(white, black)) {");
  for (const [name, light, dark] of darkPairs) out(`    ${name}: light-dark(var(${light}), var(${dark}));`);
  out("  }");
  out("  /* Lựa chọn thủ công luôn thắng màu theo hệ thống, kể cả khi chưa hỗ trợ light-dark(). */");
  for (const [scheme, index] of [["light", 1], ["dark", 2]]) {
    out(`  &:has(> head > meta[name="color-scheme"][content="${scheme}"]) {`);
    for (const pair of darkPairs) out(`    ${pair[0]}: var(${pair[index]});`);
    out("  }");
  }
}

// Tầng 3 · Component: bộ phận của component, trỏ về alias nên tự theo sáng/tối
const aliasCss = new Map(sem.map(([p, tok]) => [p.join("."), cssName(tok, "--" + p.at(-1))]));
const compNames = [];
if (comp.length) { out(); out("  /* Tầng 3 · Component: bộ phận của từng component, trỏ về alias. Code component dùng tầng này. */"); }
for (const [p, tok] of comp) {
  const name = cssName(tok, "--" + p.slice(1).join("-"));
  const m = typeof tok.$value === "string" && tok.$value.match(/^\{(alias\..+)\}$/);
  if (!m || !aliasCss.has(m[1])) { errors.push(`${p.join(".")}: phải trỏ về một alias {alias...}, đang là ${JSON.stringify(tok.$value)}`); continue; }
  compNames.push(name);
  out(`  ${name}: var(${aliasCss.get(m[1])});${tok.$description ? " /* " + tok.$description + " */" : ""}`);
}
out("}");
out();

// ---- Tailwind: class màu bg-*, text-*, border-* cho mọi biến alias và component
out("@theme inline {");
for (const name of [...semNames, ...compNames]) out(`  --color-${name.slice(2)}: var(${name});`);
out("}");
out();

// ---- Tailwind: bo góc, kiểu chữ, độ đậm, đổ bóng
out("@theme {");
for (const [p, tok] of leaves(T.radius, ["radius"])) out(`  --radius-${p.at(-1)}: ${tok.$value};${tok.$description ? " /* " + tok.$description + " */" : ""}`);
out();
for (const [p, tok] of leaves(T.typography, ["typography"])) {
  const k = p.at(-1), v = tok.$value;
  out(`  --text-${k}: ${v.fontSize};${tok.$description ? " /* " + tok.$description + " */" : ""}`);
  out(`  --text-${k}--line-height: ${v.lineHeight};`);
  if (v.fontWeight && v.fontWeight !== 400) out(`  --text-${k}--font-weight: ${v.fontWeight};`);
  if (v.letterSpacing) out(`  --text-${k}--letter-spacing: ${v.letterSpacing};`);
}
out();
for (const [p, tok] of leaves(T.fontWeight || {}, ["fontWeight"])) out(`  --font-weight-${p.at(-1)}: ${tok.$value};`);
out();
for (const [p, tok] of leaves(T.shadow, ["shadow"])) {
  const layers = (Array.isArray(tok.$value) ? tok.$value : [tok.$value]).map((l) =>
    [px(l.offsetX), px(l.offsetY), px(l.blur), l.spread && l.spread !== "0px" ? l.spread : null, colorCss(l.color, p.join("."))].filter(Boolean).join(" ")
  );
  out(`  --shadow-${p.at(-1)}: ${layers.join(", ")};`);
}
out("}");

// Alias trong token (vd. typography trỏ token khác) chưa dùng; báo nếu có tham chiếu hỏng
for (const [p, tok] of [...sem]) { const m = tok.$value.match?.(/^\{(.+)\}$/); if (m && !lookup(m[1])) errors.push(`${p.join(".")}: tham chiếu hỏng ${m[1]}`); }

if (errors.length) {
  console.error("Token lỗi:\n- " + errors.join("\n- "));
  process.exit(1);
}
const css = lines.join("\n") + "\n";

// ---- Bảng token cho plugin Figma (figma-plugin/code.js, giữa hai dấu <token-data>):
// plugin tạo màu gốc, màu vai trò và mode Dark từ bảng này, nên Figma luôn khớp file token.
const PLUGIN = path.join(root, "figma-plugin/code.js");
const refName = (v, tier = "global") => {
  const m = typeof v === "string" && v.match(/^\{([a-z]+)\.(.+)\}$/);
  return m && m[1] === tier ? m[2].replace(".", "/") : null;
};
const pluginData = {
  primitives: prim.map(([p, tok]) => {
    const v = tok.$value;
    const row = [p.slice(1).join("/"), typeof v === "string" ? v.toLowerCase() : v.hex.toLowerCase()];
    if (typeof v === "object" && v.alpha != null && v.alpha !== 1) row.push(v.alpha);
    return row;
  }),
  semantic: sem.map(([p, tok]) => ({
    name: p.slice(1).join("/"),
    light: refName(tok.$value),
    dark: refName(tok.$extensions?.geoagent?.dark) || refName(tok.$value),
    css: cssName(tok, "--" + p.at(-1)),
    desc: tok.$description || "",
  })),
  component: comp.map(([p, tok]) => ({ name: p.slice(1).join("/"), alias: refName(tok.$value, "alias"), css: cssName(tok, "--" + p.slice(1).join("-")), desc: tok.$description || "" })),
};
const pluginBlock = `// <token-data> SINH TỰ ĐỘNG bởi npm run tokens từ tokens/geoagent.tokens.json. Không sửa tay.\nconst TOKEN_DATA = ${JSON.stringify(pluginData)};\n// </token-data>`;
const pluginSrc = fs.existsSync(PLUGIN) ? fs.readFileSync(PLUGIN, "utf8") : null;
const pluginNext = pluginSrc?.replace(/\/\/ <token-data>[\s\S]*?\/\/ <\/token-data>/, pluginBlock);

if (process.argv.includes("--check")) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (cur !== css) { console.error("src/tokens.css chưa khớp tokens JSON. Chạy: npm run tokens"); process.exit(1); }
  if (pluginSrc && pluginSrc !== pluginNext) { console.error("figma-plugin/code.js (bảng token) chưa khớp tokens JSON. Chạy: npm run tokens"); process.exit(1); }
  console.log("src/tokens.css và bảng token của plugin Figma khớp tokens JSON.");
} else {
  fs.writeFileSync(OUT, css);
  if (pluginSrc) {
    if (!pluginSrc.includes("// <token-data>")) console.warn("figma-plugin/code.js chưa có dấu <token-data>: bỏ qua cập nhật plugin.");
    else if (pluginNext !== pluginSrc) { fs.writeFileSync(PLUGIN, pluginNext); console.log("Đã cập nhật bảng token trong figma-plugin/code.js."); }
  }
  console.log(`Đã ghi src/tokens.css: ${prim.length} global, ${semNames.length} alias (${darkPairs.length} có bản tối), ${compNames.length} component, ${leaves(T.typography).length} kiểu chữ, ${leaves(T.shadow).length} đổ bóng.`);
}
