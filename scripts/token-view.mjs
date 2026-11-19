// Dựng phần nội dung trang Token từ một file token (chuẩn W3C DTCG).
// Dùng chung cho hai nơi:
//   - scripts/export-geoagent-icons.mjs (Node): sinh trang tĩnh từ tokens/geoagent.tokens.json
//   - public/geoagent-icons/token-page.js (trình duyệt): dựng lại khi người dùng thả một file khác vào
// Module thuần: chỉ nhận object JSON, trả về chuỗi HTML. Không dùng DOM, không dùng API của Node.

export const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const code = (text) => `<button type="button" class="copy" data-copy="${esc(text)}"><code>${esc(text)}</code></button>`;
const searchable = (...parts) => esc(parts.filter((p) => p != null && p !== "").join(" "));
const section = (id, title, meta, note, body) =>
  `<section class="tk-section" id="${id}" aria-labelledby="h-${id}"><h2 id="h-${id}">${title}${meta ? `<span>${meta}</span>` : ""}</h2>${note ? `<p class="set-note">${note}</p>` : ""}${body}</section>`;

// Duyệt cây token. $type khai báo ở nhóm được kế thừa xuống token con (theo DTCG).
const leaves = (node, prefix = [], inheritedType) =>
  Object.entries(node || {}).flatMap(([k, v]) => {
    if (k.startsWith("$") || v === null || typeof v !== "object") return [];
    const type = v.$type || inheritedType;
    return "$value" in v ? [[[...prefix, k], { ...v, $type: type }]] : leaves(v, [...prefix, k], type);
  });
const ext = (t) => t.$extensions?.geoagent || {};

// ---- Màu
const hexRe = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const rgbOfHex = (hex) => {
  const h = hex.slice(1);
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
// Trả { css, hex, a } hoặc null nếu không đọc được
export const readColor = (v) => {
  if (typeof v === "string") {
    if (hexRe.test(v)) {
      const a = v.length === 9 ? Math.round((parseInt(v.slice(7), 16) / 255) * 1000) / 1000 : 1;
      const hex = "#" + rgbOfHex(v).map((x) => x.toString(16).padStart(2, "0")).join("");
      return { css: a < 1 ? `rgb(${rgbOfHex(v).join(" ")} / ${a})` : hex, hex, a };
    }
    return /^(rgb|hsl|oklch|oklab|lab|lch|color)\(|^[a-z]+$/i.test(v.trim()) ? { css: v.trim(), hex: null, a: 1 } : null;
  }
  if (v && typeof v === "object") {
    const a = v.alpha ?? 1;
    let rgb = null;
    if (typeof v.hex === "string" && hexRe.test(v.hex)) rgb = rgbOfHex(v.hex);
    else if (Array.isArray(v.components) && (!v.colorSpace || v.colorSpace === "srgb")) rgb = v.components.map((c) => Math.round(c * 255));
    if (!rgb) return null;
    const hex = "#" + rgb.map((x) => x.toString(16).padStart(2, "0")).join("");
    return { css: a < 1 ? `rgb(${rgb.join(" ")} / ${a})` : hex, hex, a };
  }
  return null;
};
const colorLabel = (c) => (c.hex ? c.hex.toUpperCase() : c.css) + (c.a < 1 ? ` · ${Math.round(c.a * 100)}%` : "");

// Giải alias {a.b.c}, có giới hạn để tránh vòng lặp
const makeResolver = (T) => {
  const get = (ref) => ref.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), T);
  const resolve = (value, depth = 0) => {
    if (typeof value === "string") {
      const m = value.match(/^\{([^}]+)\}$/);
      if (m) {
        const target = get(m[1]);
        if (!target || !("$value" in target) || depth > 10) return { value: undefined, broken: m[1] };
        return resolve(target.$value, depth + 1);
      }
    }
    return { value };
  };
  return resolve;
};

// ---- Kiểu chữ, đổ bóng, kích thước: dùng chung cho cả hai cách hiển thị
const dim = (d) => (typeof d === "number" ? d + "px" : d && typeof d === "object" && "value" in d ? d.value + (d.unit || "px") : String(d ?? ""));
const typeStyle = (v) => {
  const fam = Array.isArray(v.fontFamily) ? v.fontFamily.map((f) => `'${f}'`).join(",") : `'${v.fontFamily || "Inter"}'`;
  const lh = v.lineHeight == null ? "normal" : typeof v.lineHeight === "number" ? String(v.lineHeight) : dim(v.lineHeight);
  return `font-family:${esc(fam)},Inter,system-ui,sans-serif;font-size:${esc(dim(v.fontSize || "16px"))};font-weight:${esc(String(v.fontWeight ?? 400))};line-height:${esc(lh)}${v.letterSpacing ? ";letter-spacing:" + esc(dim(v.letterSpacing)) : ""}`;
};
const typeMeta = (v) => `${Array.isArray(v.fontFamily) ? v.fontFamily[0] : v.fontFamily || "?"} ${v.fontWeight ?? 400} · ${dim(v.fontSize)} / ${v.lineHeight ?? "normal"}${v.letterSpacing ? " · " + dim(v.letterSpacing) : ""}`;
const shadowCss = (value, resolve) =>
  (Array.isArray(value) ? value : [value])
    .map((l) => {
      const c = readColor(resolve(l.color).value);
      return `${l.inset ? "inset " : ""}${dim(l.offsetX)} ${dim(l.offsetY)} ${dim(l.blur)} ${dim(l.spread || 0)} ${c ? c.css : "transparent"}`;
    })
    .join(", ");
const SAMPLE = "Ước tính chi phí đo đạc địa chính cho 3 thửa đất";

// =====================================================================
// Cách 1: file của GeoAgent (có primitive + semantic): hiển thị hai tầng, class Tailwind
const tiered = (T) => {
  const resolve = makeResolver(T);
  const problems = [];
  const prims = leaves(T.primitive).map(([p, t]) => ({ ref: p.join("."), name: p.join("/"), color: readColor(t.$value) }));
  for (const p of prims) if (!p.color) problems.push(`Màu gốc ${p.name} không đọc được giá trị`);
  const primByRef = Object.fromEntries(prims.map((p) => [p.ref, p]));
  const sems = leaves(T.semantic).map(([p, t]) => {
    const ref = (typeof t.$value === "string" && t.$value.match(/^\{primitive\.(.+)\}$/)) || [];
    const prim = primByRef[ref[1]];
    if (!prim) problems.push(`Màu vai trò ${p.join("/")} không trỏ về màu gốc (${JSON.stringify(t.$value)})`);
    const css = ext(t).css || "--" + p.at(-1);
    const n = css.slice(2);
    // Tiền tố theo vai trò: màu chữ → text-, đường viền → border-, viền focus → outline-, còn lại → bg-
    const util = n === "focus" ? "outline" : p[0] === "text" || /(^|-)ink(-|$)|^on-|-fg$/.test(n) ? "text" : p[0] === "border" || /(^|-)(edge|divider|line|rule)(-|$)/.test(n) ? "border" : "bg";
    const color = prim?.color || readColor(resolve(t.$value).value);
    return { group: p[0], name: p.join("/"), css, cls: `${util}-${n}`, prim, color, desc: t.$description || "" };
  });
  const usedBy = {};
  for (const s of sems) if (s.prim) (usedBy[s.prim.name] ||= []).push(s.name.split("/").pop());
  const families = [...new Set(prims.map((p) => p.name.split("/")[0]))];
  const GROUP_LABEL = { brand: "Thương hiệu", sidebar: "Sidebar (nền đỏ)", surface: "Nền", text: "Chữ", border: "Viền và đường kẻ", state: "Trạng thái", avatar: "Avatar" };
  const groups = [...new Set(sems.map((s) => s.group))];
  const swatch = (c, cls = "sw") => `<span class="${cls}" style="--c:${c ? esc(c.css) : "transparent"}"></span>`;

  const primitive = section("primitive", "Màu gốc", `${prims.length} · tầng 1`,
    "Chỉ tầng này chứa mã màu. Đổi màu cho dự án khác: sửa ở đây (Figma: GeoAgent / Primitives), mọi màu vai trò đổi theo. <b>Không dùng trong component</b>: nút sao chép ở đây cho mã hex, để trao đổi với designer hoặc nhập vào công cụ khác. Trong code, dùng màu theo vai trò bên dưới.",
    families.map((f) => `<div class="tk-group"><h3>${esc(f)}</h3><ul class="tk-grid">${prims.filter((p) => p.name.startsWith(f + "/")).map((p) => `<li class="tk-card" data-search="${searchable(p.name, p.color?.hex, ...(usedBy[p.name] || []))}">${swatch(p.color)}<div class="tk-meta"><b>${esc(p.name)}</b>${p.color ? code(p.color.hex ? p.color.hex.toUpperCase() : p.color.css) : "<span>?</span>"}${p.color && p.color.a < 1 ? `<span>Độ đục ${Math.round(p.color.a * 100)}%</span>` : ""}<span class="used">${usedBy[p.name] ? "→ " + esc(usedBy[p.name].join(", ")) : "→ chưa dùng"}</span></div></li>`).join("")}</ul></div>`).join(""));

  const semantic = section("semantic", "Màu theo vai trò", `${sems.length} · tầng 2`,
    "Component chỉ dùng tầng này. Tên Figma lấy phần sau dấu “/” là tên class: <code>brand/brand</code> → <code>bg-brand</code>, <code>text/ink-2</code> → <code>text-ink-2</code>. Ưu tiên class Tailwind; dùng <code>var(--…)</code> ở nơi không viết được class (style inline, file CSS, thư viện ngoài, SVG).",
    groups.map((g) => `<div class="tk-group"><h3>${esc(GROUP_LABEL[g] || g)}</h3><ul class="tk-list">${sems.filter((s) => s.group === g).map((s) => `<li class="tk-row" data-search="${searchable(s.name, s.css, s.cls, s.prim?.name, s.color?.hex, s.desc)}">${swatch(s.color, "sw dot")}<div class="tk-name"><b>${esc(s.name)}</b><span>${s.prim ? esc(s.prim.name) + " · " + esc(colorLabel(s.prim.color || { css: "?", a: 1 })) : '<span class="warn">không trỏ về màu gốc</span>'}</span></div><div class="tk-codes">${code(s.cls)}${code(`var(${s.css})`)}</div><p class="tk-desc">${esc(s.desc)}</p></li>`).join("")}</ul></div>`).join(""));

  const types = leaves(T.typography).map(([p, t]) => ({ key: p.at(-1), v: resolve(t.$value).value || {}, figma: ext(t).figma || p.join("/"), desc: t.$description || "" }));
  const unread = T.fontWeight?.unread;
  const typography = types.length ? section("typography", "Kiểu chữ", String(types.length),
    "Một class đặt cả cỡ chữ, khoảng dòng và độ đậm. Kiểu chữ thường (14/20, 12/16) dùng sẵn <code>text-sm</code>, <code>text-xs</code> của Tailwind.",
    `<ul class="tk-list">${types.map((t) => `<li class="tk-type" data-search="${searchable("text-" + t.key, t.figma, t.desc, t.v.fontFamily)}"><div class="tk-name"><b>${esc(t.figma)}</b><span>${esc(typeMeta(t.v))}</span>${code((t.key === "wordmark" ? "font-heading " : "") + "text-" + t.key)}</div><p class="tk-sample" style="${typeStyle(t.v)}">${SAMPLE}</p><p class="tk-desc">${esc(t.desc)}</p></li>`).join("")}${unread ? `<li class="tk-type" data-search="font-unread tên chưa đọc ${esc(unread.$value)}"><div class="tk-name"><b>Label/List title unread</b><span>Inter ${esc(unread.$value)} · dùng kèm text-sm</span>${code("text-sm font-unread")}</div><p class="tk-sample" style="font-size:14px;line-height:20px;font-weight:${esc(unread.$value)}">Phòng Kế toán</p><p class="tk-desc">${esc(unread.$description || "")}</p></li>` : ""}</ul>`) : "";

  const radii = leaves(T.radius).map(([p, t]) => ({ key: p.at(-1), v: dim(resolve(t.$value).value), desc: t.$description || "" }));
  const radius = radii.length ? section("radius", "Bo góc", String(radii.length),
    "Bong bóng tin bo 20, góc phía người gửi bo 6: tin người dùng <code>rounded-bubble rounded-br-bubble-tip</code>, tin bot <code>rounded-bubble rounded-tl-bubble-tip</code>.",
    `<ul class="tk-grid">${radii.map((r) => `<li class="tk-card tk-shape" data-search="${searchable("rounded-" + r.key, r.v, r.desc)}"><span class="shape" style="border-radius:${esc(r.v)}"></span><div class="tk-meta"><b>radius/${esc(r.key)}</b><span>${esc(r.v)}</span>${code("rounded-" + r.key)}<span class="used">${esc(r.desc)}</span></div></li>`).join("")}</ul>`) : "";

  const shadows = leaves(T.shadow).map(([p, t]) => ({ key: p.at(-1), css: shadowCss(resolve(t.$value).value, resolve), figma: ext(t).figma || p.join("/"), desc: t.$description || "" }));
  const shadow = shadows.length ? section("shadow", "Đổ bóng", String(shadows.length), "Bóng mềm tông nâu mực, không dùng đen thuần.",
    `<ul class="tk-grid tk-shadows">${shadows.map((s) => `<li class="tk-card tk-shadow" data-search="${searchable("shadow-" + s.key, s.figma, s.desc)}"><span class="shadow-box" style="box-shadow:${esc(s.css)}"></span><div class="tk-meta"><b>${esc(s.figma)}</b>${code("shadow-" + s.key)}<span class="used">${esc(s.desc)}</span></div></li>`).join("")}</ul>`) : "";

  const total = prims.length + sems.length + types.length + (unread ? 1 : 0) + radii.length + shadows.length;
  const nav = [["primitive", "Màu gốc"], ["semantic", "Màu theo vai trò"], types.length && ["typography", "Kiểu chữ"], radii.length && ["radius", "Bo góc"], shadows.length && ["shadow", "Đổ bóng"]].filter(Boolean);
  return { kind: "geoagent", total, nav, problems, html: primitive + semantic + typography + radius + shadow };
};

// =====================================================================
// Cách 2: file token bất kỳ theo DTCG (dự án khác, Tokens Studio…): nhóm theo $type
const generic = (T) => {
  const resolve = makeResolver(T);
  const problems = [];
  const all = leaves(T).map(([p, t]) => {
    const r = resolve(t.$value);
    if (r.broken) problems.push(`${p.join(".")} trỏ tới token không có: {${r.broken}}`);
    const alias = typeof t.$value === "string" && /^\{.+\}$/.test(t.$value) ? t.$value : null;
    return { path: p.join("."), type: t.$type || guessType(r.value), value: r.value, alias, desc: t.$description || "" };
  });
  const by = (type) => all.filter((t) => t.type === type);
  const aliasNote = (t) => (t.alias ? `<span class="used">→ ${esc(t.alias)}</span>` : "");

  const colors = by("color").map((t) => ({ ...t, c: readColor(t.value) }));
  for (const t of colors) if (!t.c && !problems.some((p) => p.startsWith(t.path))) problems.push(`${t.path}: không đọc được màu`);
  const colorFamilies = [...new Set(colors.map((t) => t.path.split(".").slice(0, -1).join(".") || "(gốc)"))];
  const colorHtml = colors.length ? section("g-color", "Màu", String(colors.length), "Nhóm theo đường dẫn trong file. Bấm để sao chép mã màu.",
    colorFamilies.map((f) => `<div class="tk-group"><h3>${esc(f)}</h3><ul class="tk-grid">${colors.filter((t) => (t.path.split(".").slice(0, -1).join(".") || "(gốc)") === f).map((t) => `<li class="tk-card" data-search="${searchable(t.path, t.c?.hex, t.alias, t.desc)}"><span class="sw" style="--c:${t.c ? esc(t.c.css) : "transparent"}"></span><div class="tk-meta"><b>${esc(t.path.split(".").pop())}</b>${t.c ? code(t.c.hex ? t.c.hex.toUpperCase() : t.c.css) : '<span class="warn">không đọc được</span>'}${t.c && t.c.a < 1 ? `<span>Độ đục ${Math.round(t.c.a * 100)}%</span>` : ""}${aliasNote(t)}${t.desc ? `<span class="used">${esc(t.desc)}</span>` : ""}</div></li>`).join("")}</ul></div>`).join("")) : "";

  const types = by("typography").filter((t) => t.value && typeof t.value === "object");
  const typeHtml = types.length ? section("g-typography", "Kiểu chữ", String(types.length), "",
    `<ul class="tk-list">${types.map((t) => `<li class="tk-type" data-search="${searchable(t.path, t.desc)}"><div class="tk-name"><b>${esc(t.path)}</b><span>${esc(typeMeta(t.value))}</span>${aliasNote(t)}</div><p class="tk-sample" style="${typeStyle(t.value)}">${SAMPLE}</p>${t.desc ? `<p class="tk-desc">${esc(t.desc)}</p>` : ""}</li>`).join("")}</ul>`) : "";

  const shadows = by("shadow").filter((t) => t.value);
  const shadowHtml = shadows.length ? section("g-shadow", "Đổ bóng", String(shadows.length), "",
    `<ul class="tk-grid tk-shadows">${shadows.map((t) => { const css = shadowCss(t.value, resolve); return `<li class="tk-card tk-shadow" data-search="${searchable(t.path, t.desc)}"><span class="shadow-box" style="box-shadow:${esc(css)}"></span><div class="tk-meta"><b>${esc(t.path)}</b>${code(css)}${aliasNote(t)}</div></li>`; }).join("")}</ul>`) : "";

  const shown = new Set(["color", "typography", "shadow"]);
  const rest = all.filter((t) => !shown.has(t.type));
  const restHtml = rest.length ? section("g-other", "Token khác", String(rest.length), "Kích thước, khoảng cách, font, độ đậm, thời gian…",
    `<ul class="tk-list">${rest.map((t) => { const v = typeof t.value === "object" ? JSON.stringify(t.value) : String(t.value ?? ""); return `<li class="tk-row tk-row-plain" data-search="${searchable(t.path, t.type, v, t.desc)}"><span class="tk-type-tag">${esc(t.type || "?")}</span><div class="tk-name"><b>${esc(t.path)}</b>${t.alias ? `<span>→ ${esc(t.alias)}</span>` : ""}</div><div class="tk-codes">${code(v)}</div><p class="tk-desc">${esc(t.desc)}</p></li>`; }).join("")}</ul>`) : "";

  const nav = [colors.length && ["g-color", "Màu"], types.length && ["g-typography", "Kiểu chữ"], shadows.length && ["g-shadow", "Đổ bóng"], rest.length && ["g-other", "Token khác"]].filter(Boolean);
  return { kind: "generic", total: all.length, nav, problems, html: colorHtml + typeHtml + shadowHtml + restHtml };
};
// File cũ không ghi $type: đoán theo giá trị
const guessType = (v) => (typeof v === "string" && (hexRe.test(v) || /^(rgb|hsl)a?\(/i.test(v)) ? "color" : v && typeof v === "object" && "fontSize" in v ? "typography" : v && typeof v === "object" && ("blur" in v || (Array.isArray(v) && v[0]?.blur != null)) ? "shadow" : undefined);

export function renderTokenView(T) {
  if (!T || typeof T !== "object" || Array.isArray(T)) throw new Error("File không phải object JSON.");
  const view = T.primitive && T.semantic ? tiered(T) : generic(T);
  if (!view.total) throw new Error("Không tìm thấy token nào (cần các mục có \"$value\" theo chuẩn W3C DTCG).");
  return view;
}
