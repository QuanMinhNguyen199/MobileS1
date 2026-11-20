// Dựng phần nội dung trang Token từ một file token (chuẩn W3C DTCG).
// Dùng chung cho hai nơi:
//   - scripts/export-geoagent-icons.mjs (Node): sinh trang tĩnh từ tokens/geoagent.tokens.json
//   - public/geoagent-icons/token-page.js (trình duyệt): dựng lại khi người dùng thả một file khác vào
// Module thuần: chỉ nhận object JSON, trả về chuỗi HTML. Không dùng DOM, không dùng API của Node.

export const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const code = (text) => `<button type="button" class="copy" data-copy="${esc(text)}" aria-label="Sao chép ${esc(text)}"><code>${esc(text)}</code></button>`;
const searchable = (...parts) => esc(parts.filter((p) => p != null && p !== "").join(" "));
// tools: điều khiển đặt bên phải tiêu đề mục (công tắc Sáng / Tối của Alias, Component)
const section = (id, title, meta, note, body, tools = "") =>
  `<section class="tk-section" id="${id}" aria-labelledby="h-${id}"><div class="tk-head"><h2 id="h-${id}">${title}${meta ? `<span>${meta}</span>` : ""}</h2>${tools}</div>${note ? `<p class="set-note">${note}</p>` : ""}${body}</section>`;
// Công tắc Sáng / Tối cạnh tiêu đề mục. Mỗi mục một nhóm radio; token-page.js đồng bộ mọi nhóm và nhớ lựa chọn.
const schemeSwitch = (id) => `<fieldset class="tk-scheme" data-scheme-switch><legend class="sr-only">Màu theo giao diện</legend><label><input type="radio" name="tk-scheme-${id}" value="light" checked><span>Sáng</span></label><label><input type="radio" name="tk-scheme-${id}" value="dark"><span>Tối</span></label></fieldset>`;

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

// Names in this view describe the layer; source paths and CSS names stay intact.
const variableName = (name) => name.replace(/^(base|global|primitive|components?)[/.]/, "").replace(/[/.\-]/g, "_");
const aliasName = (name) => "alias_" + variableName(name.replace(/^--/, "").replace(/^(semantic|alias(?:es)?|colors?)[/.]/, ""));
const aliasRef = (value) => typeof value === "string" && value.match(/^\{([^}]+)\}$/)?.[1];
const table = (label, headers, body, cls = "") => `<div class="tk-table-wrap" role="region" aria-label="${esc(label)}" tabindex="0"><table class="tk-table ${cls}"><caption class="sr-only">${esc(label)}</caption><thead><tr>${headers.map(h => `<th scope="col">${h.startsWith("<span") ? h : esc(h)}</th>`).join("")}</tr></thead>${body}</table></div>`;
const row = (search, name, cells) => `<tr data-search="${search}"><th scope="row">${name}</th>${cells.map(c => `<td>${c}</td>`).join("")}</tr>`;
const group = (name, rows, columns) => `<tbody class="tk-group"><tr class="tk-group-title"><th colspan="${columns}" scope="rowgroup">${esc(name)}</th></tr>${rows}</tbody>`;
const swatch = (c) => `<span aria-hidden="true" class="tk-swatch" style="--c:${c ? esc(c.css) : "transparent"}"></span>`;
const colorValue = (c, ref) => `<div class="tk-value">${swatch(c)}<div>${ref ? code(ref) : c ? code(c.a < 1 ? c.css : c.hex ? c.hex.toUpperCase() : c.css) : '<span class="warn">Không đọc được</span>'}${ref && c ? `<span class="tk-resolved">${esc(colorLabel(c))}</span>` : ""}</div></div>`;
// Có bản tối: một cột màu, công tắc Sáng / Tối (token-page.js) chọn bản đang hiện. Không có bản tối: chỉ một bản.
const schemeHead = () => "Màu";
const schemeCell = (has, light, dark) => (has ? `<div class="tk-on-light">${light}</div><div class="tk-on-dark">${dark}</div>` : light);
const description = (text) => `<span class="tk-desc">${esc(text || "—")}</span>`;

// =====================================================================
// Cách 1: file của GeoAgent, 3 tầng global → alias → component (file cũ: primitive + semantic). Có class Tailwind.
const GLOBAL_REF = /^\{(?:global|primitive)\.(.+)\}$/;
const ALIAS_REF = /^\{(?:alias|semantic)\.(.+)\}$/;
// Tiền tố class của token Component theo tên bộ phận
const utilFor = (part) =>
  /(^|-)bg(-|$)|(^|-)tile$/.test(part) ? "bg"
  : /(^|-)(border|divider|indicator)(-|$)|^status-ring$/.test(part) ? "border"
  : /(^|-)ring$/.test(part) ? "outline"
  : part === "accent" ? "accent"
  : /(^|-)(text|label|icon|placeholder|meta|sender|strong|link|bullet)(-|$)/.test(part) ? "text"
  : "bg";
const tiered = (T) => {
  const resolve = makeResolver(T);
  const problems = [];
  const G = T.global || T.primitive, A = T.alias || T.semantic;
  const prims = leaves(G).map(([p, t]) => ({ ref: p.join("."), name: p.join("/"), color: readColor(t.$value) }));
  for (const p of prims) if (!p.color) problems.push(`Màu gốc ${p.name} không đọc được giá trị`);
  const primByRef = Object.fromEntries(prims.map((p) => [p.ref, p]));
  const sems = leaves(A).map(([p, t]) => {
    const ref = (typeof t.$value === "string" && t.$value.match(GLOBAL_REF)) || [];
    const prim = primByRef[ref[1]];
    if (!prim) problems.push(`Màu vai trò ${p.join("/")} không trỏ về màu gốc (${JSON.stringify(t.$value)})`);
    const css = ext(t).css || "--" + p.at(-1);
    const n = css.slice(2);
    // Tiền tố theo vai trò: màu chữ → text-, đường viền → border-, viền focus → outline-, còn lại → bg-
    const util = n === "focus" ? "outline" : p[0] === "text" || /(^|-)ink(-|$)|^on-|-fg$/.test(n) ? "text" : p[0] === "border" || /(^|-)(edge|divider|line|rule)(-|$)/.test(n) ? "border" : "bg";
    const color = prim?.color || readColor(resolve(t.$value).value);
    // Bản tối (nếu có): $extensions.geoagent.dark trỏ về một màu gốc
    const darkRef = (typeof ext(t).dark === "string" && ext(t).dark.match(GLOBAL_REF)) || [];
    const dark = darkRef[1] ? primByRef[darkRef[1]] : null;
    if (ext(t).dark && !dark) problems.push(`Màu vai trò ${p.join("/")}: bản tối không trỏ về màu gốc (${ext(t).dark})`);
    return { group: p[0], name: p.join("/"), css, cls: `${util}-${n}`, prim, color, dark, desc: t.$description || "" };
  });
  const usedBy = {};
  for (const s of sems) if (s.prim) (usedBy[s.prim.name] ||= []).push(s.name.split("/").pop());
  for (const s of sems) if (s.dark && s.dark !== s.prim) (usedBy[s.dark.name] ||= []).push(s.name.split("/").pop() + " (tối)");
  const darkCount = sems.filter((s) => s.dark).length;
  const families = [...new Set(prims.map((p) => p.name.split("/")[0]))];
  const GROUP_LABEL = { brand: "Thương hiệu", sidebar: "Sidebar (nền đỏ)", surface: "Nền", text: "Chữ", border: "Viền và đường kẻ", state: "Trạng thái", avatar: "Avatar" };
  const groups = [...new Set(sems.map((s) => s.group))];
  const primitive = section("primitive", "Global", `${prims.length} biến · primitive`,
    "Giá trị màu gốc. Cột Alias sử dụng cho biết vai trò nào đang tham chiếu đến biến này.",
    table("Global — màu gốc", ["Tên biến", "Giá trị", "Alias sử dụng"], families.map(f => group(f, prims.filter(p => p.name.startsWith(f + "/")).map(p => row(
      searchable(p.name, variableName(p.name), p.color?.hex, ...(usedBy[p.name] || []).map(aliasName)),
      code(variableName(p.name)),
      [colorValue(p.color), description(usedBy[p.name]?.map(aliasName).join(", ") || "Chưa có alias tham chiếu")],
    )).join(""), 3)).join(""), "tk-table-global"));

  const semantic = section("semantic", "Alias", `${sems.length} biến`,
    "Tên hiển thị theo vai trò, với tiền tố alias_. Giá trị là tham chiếu về Global; tên biến CSS và class trong code giữ nguyên.",
    table("Alias — màu theo vai trò", ["Tên alias", schemeHead(darkCount), "Dùng trong code", "Mô tả"], groups.map(g => group(GROUP_LABEL[g] || g, sems.filter(s => s.group === g).map(s => row(
      searchable(s.name, aliasName(s.css), s.css, s.cls, s.prim?.name, s.color?.hex, s.dark?.name, s.dark?.color?.hex, s.desc),
      `<span title="${esc(s.name)}">${code(aliasName(s.css))}</span>`,
      [schemeCell(darkCount, colorValue(s.color, s.prim ? variableName(s.prim.name) : undefined),
          colorValue(s.dark?.color || s.color, s.dark ? variableName(s.dark.name) : s.prim ? variableName(s.prim.name) : undefined)),
        `<div class="tk-codes">${code(s.cls)}${code(`var(${s.css})`)}</div>`, description(s.desc)],
    )).join(""), 4)).join(""), "tk-table-alias"), darkCount ? schemeSwitch("semantic") : "");

  // Tầng 3 · Component: bộ phận của component trỏ về một alias; Light/Dark là giá trị cuối sau alias
  const semByPath = Object.fromEntries(sems.map((s) => [s.name.replace("/", "."), s]));
  const comps = leaves(T.component).map(([p, t]) => {
    const ref = (typeof t.$value === "string" && t.$value.match(ALIAS_REF)) || [];
    const sem = semByPath[ref[1]];
    if (!sem) problems.push(`Component ${p.join("/")} không trỏ về alias (${JSON.stringify(t.$value)})`);
    const css = ext(t).css || "--" + p.join("-");
    return { group: p[0], name: p.join("/"), css, cls: `${utilFor(p.slice(1).join("-"))}-${css.slice(2)}`, sem, desc: t.$description || "" };
  });
  const component = comps.length ? section("component", "Component", `${comps.length} biến`,
    "Mỗi bộ phận của component trỏ về một alias. Code component dùng tầng này, nên đổi màu riêng một bộ phận chỉ cần trỏ nó sang alias khác. Cột Màu là màu cuối cùng sau khi đi qua alias, theo giao diện đang chọn (Sáng / Tối).",
    table("Component — bộ phận của component", ["Tên component", schemeHead(darkCount), "Alias", "Dùng trong code", "Mô tả"],
      [...new Set(comps.map((c) => c.group))].map((g) => group(g, comps.filter((c) => c.group === g).map((c) => row(
        searchable(c.name, variableName(c.name), c.css, c.cls, c.sem && aliasName(c.sem.css), c.sem?.name, c.desc),
        `<span title="${esc(c.name)}">${code(variableName(c.name))}</span>`,
        [schemeCell(darkCount, colorValue(c.sem?.color), colorValue(c.sem?.dark?.color || c.sem?.color)),
          c.sem ? code(aliasName(c.sem.css)) : '<span class="warn">không trỏ về alias</span>',
          `<div class="tk-codes">${code(c.cls)}${code(`var(${c.css})`)}</div>`, description(c.desc)],
      )).join(""), 5)).join(""), "tk-table-component"), darkCount ? schemeSwitch("component") : "") : "";

  const types = leaves(T.typography).map(([p, t]) => ({ key: p.at(-1), v: resolve(t.$value).value || {}, figma: ext(t).figma || p.join("/"), desc: t.$description || "" }));
  const unread = T.fontWeight?.unread;
  const typography = types.length || unread ? section("typography", "Kiểu chữ", String(types.length + (unread ? 1 : 0)), "",
    table("Biến kiểu chữ", ["Tên", "Giá trị / xem trước", "Dùng trong code", "Mô tả"], `<tbody>${types.map(t => row(
      searchable("text-" + t.key, t.figma, t.desc, t.v.fontFamily), code(t.figma),
      [`<span class="tk-resolved">${esc(typeMeta(t.v))}</span><p class="tk-sample" style="${typeStyle(t.v)}">${SAMPLE}</p>`, code((t.key === "wordmark" ? "font-heading " : "") + "text-" + t.key), description(t.desc)],
    )).join("")}${unread ? row(searchable("font-unread", "tên chưa đọc", unread.$value), code("Label/List title unread"),
      [`<span class="tk-resolved">Inter ${esc(unread.$value)} · 14px / 20px</span><p class="tk-sample" style="font-size:14px;line-height:20px;font-weight:${esc(unread.$value)}">Phòng Kế toán</p>`, code("text-sm font-unread"), description(unread.$description)]) : ""}</tbody>`, "tk-table-type")) : "";

  const radii = leaves(T.radius).map(([p, t]) => ({ key: p.at(-1), v: dim(resolve(t.$value).value), desc: t.$description || "" }));
  const radius = radii.length ? section("radius", "Bo góc", String(radii.length), "",
    table("Biến bo góc", ["Tên", "Giá trị", "Dùng trong code", "Mô tả"], `<tbody>${radii.map(r => row(
      searchable("rounded-" + r.key, r.v, r.desc), code("radius/" + r.key),
      [`<div class="tk-value"><span aria-hidden="true" class="tk-radius-sample" style="border-radius:${esc(r.v)}"></span><code>${esc(r.v)}</code></div>`, code("rounded-" + r.key), description(r.desc)],
    )).join("")}</tbody>`, "tk-table-detail")) : "";

  const shadows = leaves(T.shadow).map(([p, t]) => ({ key: p.at(-1), css: shadowCss(resolve(t.$value).value, resolve), figma: ext(t).figma || p.join("/"), desc: t.$description || "" }));
  const shadow = shadows.length ? section("shadow", "Đổ bóng", String(shadows.length), "",
    table("Biến đổ bóng", ["Tên", "Giá trị / xem trước", "Dùng trong code", "Mô tả"], `<tbody>${shadows.map(s => row(
      searchable("shadow-" + s.key, s.figma, s.desc, s.css), code(s.figma),
      [`<div class="tk-value"><span aria-hidden="true" class="tk-shadow-sample" style="box-shadow:${esc(s.css)}"></span><code class="tk-raw-value">${esc(s.css)}</code></div>`, code("shadow-" + s.key), description(s.desc)],
    )).join("")}</tbody>`, "tk-table-detail")) : "";

  const total = prims.length + sems.length + comps.length + types.length + (unread ? 1 : 0) + radii.length + shadows.length;
  const nav = [["primitive", "Global"], ["semantic", "Alias"], comps.length && ["component", "Component"], (types.length || unread) && ["typography", "Kiểu chữ"], radii.length && ["radius", "Bo góc"], shadows.length && ["shadow", "Đổ bóng"]].filter(Boolean);
  return { kind: "geoagent", total, nav, problems, html: primitive + semantic + component + typography + radius + shadow };
};

// =====================================================================
// Cách 2: file token bất kỳ theo DTCG (dự án khác, Tokens Studio…): nhóm theo $type
const generic = (T) => {
  const resolve = makeResolver(T);
  const problems = [];
  const all = leaves(T).map(([p, t]) => {
    const r = resolve(t.$value);
    if (r.broken) problems.push(`${p.join(".")} trỏ tới token không có: {${r.broken}}`);
    const alias = aliasRef(t.$value);
    return { path: p.join("."), type: t.$type || guessType(r.value), value: r.value, alias, desc: t.$description || "" };
  });
  const isComponent = t => /^components?\./.test(t.path);
  const names = Object.fromEntries(all.map(t => [t.path, t.alias && !isComponent(t) ? aliasName(t.path) : variableName(t.path)]));
  const label = t => names[t.path];
  const reference = t => t.alias ? names[t.alias] || variableName(t.alias) : undefined;
  const colorTokens = all.filter(t => t.type === "color").map(t => ({ ...t, c: readColor(t.value) }));
  for (const t of colorTokens) if (!t.c && !problems.some(p => p.startsWith(t.path))) problems.push(`${t.path}: không đọc được màu`);
  const colorTable = (tokens, id, title) => tokens.length ? section(id, title, String(tokens.length), "",
    table(title, ["Tên biến", "Giá trị / tham chiếu", "Mô tả"], `<tbody>${tokens.map(t => row(searchable(t.path, label(t), t.alias, reference(t), t.c?.hex, t.desc),
      `<span title="${esc(t.path)}">${code(label(t))}</span>`, [colorValue(t.c, reference(t)), description(t.desc)],
    )).join("")}</tbody>`, "tk-table-global")) : "";
  const components = colorTokens.filter(isComponent);
  const globals = colorTokens.filter(t => !t.alias && !isComponent(t)), aliases = colorTokens.filter(t => t.alias && !isComponent(t));
  const types = all.filter(t => t.type === "typography" && t.value && typeof t.value === "object");
  const typeHtml = types.length ? section("g-typography", "Kiểu chữ", String(types.length), "",
    table("Biến kiểu chữ", ["Tên biến", "Giá trị / xem trước", "Tham chiếu", "Mô tả"], `<tbody>${types.map(t => row(searchable(t.path, label(t), t.desc), code(label(t)),
      [`<span class="tk-resolved">${esc(typeMeta(t.value))}</span><p class="tk-sample" style="${typeStyle(t.value)}">${SAMPLE}</p>`, reference(t) ? code(reference(t)) : "—", description(t.desc)],
    )).join("")}</tbody>`, "tk-table-type")) : "";
  const shadows = all.filter(t => t.type === "shadow" && t.value);
  const shadowHtml = shadows.length ? section("g-shadow", "Đổ bóng", String(shadows.length), "",
    table("Biến đổ bóng", ["Tên biến", "Giá trị / xem trước", "Tham chiếu", "Mô tả"], `<tbody>${shadows.map(t => {
      const css = shadowCss(t.value, resolve);
      return row(searchable(t.path, label(t), t.desc), code(label(t)), [`<div class="tk-value"><span aria-hidden="true" class="tk-shadow-sample" style="box-shadow:${esc(css)}"></span>${code(css)}</div>`, reference(t) ? code(reference(t)) : "—", description(t.desc)]);
    }).join("")}</tbody>`, "tk-table-detail")) : "";
  const rest = all.filter(t => !["color", "typography", "shadow"].includes(t.type));
  const restHtml = rest.length ? section("g-other", "Token khác", String(rest.length), "",
    table("Biến khác", ["Tên biến", "Loại", "Giá trị / tham chiếu", "Mô tả"], `<tbody>${rest.map(t => {
      const value = typeof t.value === "object" ? JSON.stringify(t.value) : String(t.value ?? "");
      return row(searchable(t.path, label(t), t.alias, t.type, value, t.desc), code(label(t)), [esc(t.type || "—"), `<div class="tk-codes">${reference(t) ? code(reference(t)) : ""}${code(value)}</div>`, description(t.desc)]);
    }).join("")}</tbody>`, "tk-table-detail")) : "";
  const nav = [globals.length && ["g-global", "Global"], aliases.length && ["g-alias", "Alias"], components.length && ["g-component", "Component"], types.length && ["g-typography", "Kiểu chữ"], shadows.length && ["g-shadow", "Đổ bóng"], rest.length && ["g-other", "Token khác"]].filter(Boolean);
  return { kind: "generic", total: all.length, nav, problems, html: colorTable(globals, "g-global", "Global") + colorTable(aliases, "g-alias", "Alias") + colorTable(components, "g-component", "Component") + typeHtml + shadowHtml + restHtml };
};
// File cũ không ghi $type: đoán theo giá trị
const guessType = (v) => (typeof v === "string" && (hexRe.test(v) || /^(rgb|hsl)a?\(/i.test(v)) ? "color" : v && typeof v === "object" && "fontSize" in v ? "typography" : v && typeof v === "object" && ("blur" in v || (Array.isArray(v) && v[0]?.blur != null)) ? "shadow" : undefined);

export function renderTokenView(T) {
  if (!T || typeof T !== "object" || Array.isArray(T)) throw new Error("File không phải object JSON.");
  const view = (T.global && T.alias) || (T.primitive && T.semantic) ? tiered(T) : generic(T);
  if (!view.total) throw new Error("Không tìm thấy token nào (cần các mục có \"$value\" theo chuẩn W3C DTCG).");
  return view;
}
