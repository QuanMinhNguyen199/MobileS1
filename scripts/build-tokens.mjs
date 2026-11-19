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

// ---- Tầng 1 + tầng 2: biến CSS (chỉ áp dụng cho bản improved)
const prim = leaves(T.primitive, ["primitive"]);
const sem = leaves(T.semantic, ["semantic"]);
out(`${SCOPE} {`);
out("  /* Tầng 1 · Primitive: mã màu gốc. Đổi màu cho dự án khác: sửa ở đây (qua token JSON). */");
const primCss = new Map();
for (const [p, tok] of prim) {
  const name = cssName(tok, "--" + p.slice(1).join("-"));
  primCss.set(p.join("."), name);
  out(`  ${name}: ${colorCss(tok.$value, p.join("."))};`);
}
out();
out("  /* Tầng 2 · Semantic: vai trò, luôn trỏ về primitive. Component chỉ dùng tầng này. */");
const semNames = [];
for (const [p, tok] of sem) {
  const name = cssName(tok, "--" + p.at(-1));
  const m = typeof tok.$value === "string" && tok.$value.match(/^\{(.+)\}$/);
  if (!m) { errors.push(`${p.join(".")}: semantic phải là alias {primitive...}, đang là ${JSON.stringify(tok.$value)}`); continue; }
  if (!primCss.has(m[1])) { errors.push(`${p.join(".")}: không có primitive ${m[1]}`); continue; }
  semNames.push(name);
  out(`  ${name}: var(${primCss.get(m[1])});${tok.$description ? " /* " + tok.$description + " */" : ""}`);
}
out("}");
out();

// ---- Tailwind: class màu bg-*, text-*, border-* cho mọi biến semantic
out("@theme inline {");
for (const name of semNames) out(`  --color-${name.slice(2)}: var(${name});`);
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
if (process.argv.includes("--check")) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (cur !== css) { console.error("src/tokens.css chưa khớp tokens JSON. Chạy: npm run tokens"); process.exit(1); }
  console.log("src/tokens.css khớp tokens JSON.");
} else {
  fs.writeFileSync(OUT, css);
  console.log(`Đã ghi src/tokens.css: ${prim.length} primitive, ${semNames.length} semantic, ${leaves(T.typography).length} kiểu chữ, ${leaves(T.shadow).length} đổ bóng.`);
}
