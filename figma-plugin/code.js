// GeoAgent DS Builder: dựng nốt design system trên trang "GeoAgent Design System".
// Chạy được nhiều lần: phần do plugin tạo được xóa và dựng lại theo tên cố định, không tạo trùng.
// Cuối mỗi lần chạy, plugin tự kiểm tra (đủ thành phần, chồng lấn, tràn chữ, tương phản, màu chưa gắn biến)
// và mở cửa sổ báo cáo có nút sao chép.
// Cần sẵn: biến "GeoAgent / Color" + "GeoAgent / Size", kiểu chữ, đổ bóng, icon và các component bước đầu.

const log = [];

async function main() {
  const page = figma.root.children.find((p) => p.name === "GeoAgent Design System") || figma.root.children[0];
  await figma.setCurrentPageAsync(page);
  const root = page.findOne((n) => n.type === "FRAME" && n.name === "GeoAgent DS");
  if (!root) throw new Error('Không thấy khung "GeoAgent DS" trên trang.');
  const compSec = root.findChild((n) => n.name === "05 Component");
  if (!compSec) throw new Error('Không thấy mục "05 Component".');

  // ---------- Nền tảng ----------
  const vars = await figma.variables.getLocalVariablesAsync();
  const V = {};
  for (const v of vars) V[v.name] = v;
  const paint = (name) => {
    if (!V[name]) throw new Error("Thiếu biến " + name);
    return figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", V[name]);
  };
  const TS = {};
  for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
  const FX = {};
  for (const s of await figma.getLocalEffectStylesAsync()) FX[s.name] = s;
  const fonts = [["Inter", "Regular"], ["Inter", "Medium"], ["Inter", "Semi Bold"], ["Inter", "Bold"], ["Inter", "Black"], ["Plus Jakarta Sans", "SemiBold"], ["Plus Jakarta Sans", "Bold"]];
  for (const [family, style] of fonts) await figma.loadFontAsync({ family, style });

  const AL = (dir, o = {}) => {
    const f = figma.createFrame();
    f.layoutMode = dir;
    f.primaryAxisSizingMode = "AUTO";
    f.counterAxisSizingMode = "AUTO";
    f.fills = [];
    f.clipsContent = false;
    for (const k of Object.keys(o)) f[k] = o[k];
    return f;
  };
  const pad = (f, x, y) => { f.paddingLeft = f.paddingRight = x; f.paddingTop = f.paddingBottom = y; };
  const T = (chars, size, lh, style = "Regular", color = "text/ink", family = "Inter") => {
    const t = figma.createText();
    t.fontName = { family, style };
    t.characters = chars;
    t.fontSize = size;
    t.lineHeight = { unit: "PIXELS", value: lh };
    t.fills = [paint(color)];
    return t;
  };
  // dynamic-page không cho gán style đồng bộ: chép thuộc tính style ngay để bố cục đúng,
  // rồi gắn liên kết style bằng hàm async ở cuối (linkStyles).
  const styleLinks = [];
  const TX = (chars, styleName, color = "text/ink") => {
    const s = TS[styleName];
    if (!s) throw new Error("Thiếu kiểu chữ " + styleName);
    const t = figma.createText();
    t.fontName = s.fontName; t.fontSize = s.fontSize; t.lineHeight = s.lineHeight; t.letterSpacing = s.letterSpacing;
    t.characters = chars;
    t.fills = [paint(color)];
    styleLinks.push(() => t.setTextStyleIdAsync(s.id));
    return t;
  };
  const shadow = (n, name) => {
    const s = FX[name];
    if (!s) throw new Error("Thiếu đổ bóng " + name);
    n.effects = s.effects;
    styleLinks.push(() => n.setEffectStyleIdAsync(s.id));
  };
  const linkStyles = async () => { for (const f of styleLinks.splice(0)) await f(); };
  const radius = (n, name) => { for (const k of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) n.setBoundVariable(k, V[name]); };
  const radii = (n, tl, tr, br, bl) => {
    n.setBoundVariable("topLeftRadius", V[tl]); n.setBoundVariable("topRightRadius", V[tr]);
    n.setBoundVariable("bottomRightRadius", V[br]); n.setBoundVariable("bottomLeftRadius", V[bl]);
  };
  const fill = (child) => { child.layoutSizingHorizontal = "FILL"; return child; };
  const oneLine = (t) => { t.layoutSizingHorizontal = "FILL"; t.textAutoResize = "HEIGHT"; t.textTruncation = "ENDING"; t.maxLines = 1; return t; };
  const wrapText = (t) => { t.layoutSizingHorizontal = "FILL"; t.textAutoResize = "HEIGHT"; return t; };
  const stroke = (n, color, w = 1, align = "INSIDE") => { n.strokes = [paint(color)]; n.strokeWeight = w; n.strokeAlign = align; };
  const bottomRule = (n, color) => { n.strokes = [paint(color)]; n.strokeTopWeight = 0; n.strokeLeftWeight = 0; n.strokeRightWeight = 0; n.strokeBottomWeight = 1; n.strokeAlign = "INSIDE"; };

  // Icon và component đã có, tìm theo tên
  const iconComp = (name) => {
    const c = root.findOne((n) => n.type === "COMPONENT" && n.name === "Icon/" + name);
    if (!c) throw new Error("Thiếu icon " + name);
    return c;
  };
  const icon = (name, size, color) => {
    const i = iconComp(name).createInstance();
    i.resize(size, size);
    if (color) for (const n of i.findAll(() => true)) {
      if ("strokes" in n && n.strokes.length) n.strokes = [paint(color)];
      if ("fills" in n && n.fills.length && n.type !== "INSTANCE") n.fills = [paint(color)];
    }
    return i;
  };
  const set = (name) => {
    const s = root.findOne((n) => n.type === "COMPONENT_SET" && n.name === name);
    if (!s) throw new Error("Thiếu component " + name);
    return s;
  };
  const variant = (setName, variantName) => {
    const c = set(setName).children.find((n) => n.name === variantName);
    if (!c) throw new Error("Thiếu biến thể " + setName + " / " + variantName);
    return c.createInstance();
  };
  const setProp = (inst, prefix, value) => {
    const key = Object.keys(inst.componentProperties).find((k) => k.split("#")[0] === prefix);
    if (key) inst.setProperties({ [key]: value });
  };
  const avatar = (tone, size, initial) => { const a = variant("Avatar", `Tone=${tone}, Size=${size}`); setProp(a, "Initial", initial); return a; };
  const emblemHash = (() => {
    const e = root.findOne((n) => n.name === "Emblem" && "fills" in n);
    const f = e && e.fills.find((p) => p.type === "IMAGE");
    return f ? f.imageHash : null;
  })();
  const emblem = (w) => {
    const r = figma.createRectangle();
    r.name = "Emblem";
    r.resize(w, Math.round(w * 407 / 400));
    r.fills = emblemHash ? [{ type: "IMAGE", imageHash: emblemHash, scaleMode: "FIT" }] : [paint("brand/gold")];
    return r;
  };

  const block = (title, desc, source) => {
    const name = "Block " + title;
    const b = AL("VERTICAL", { name, itemSpacing: 16 });
    compSec.appendChild(b); fill(b);
    const tr = AL("HORIZONTAL", { name: "Title", itemSpacing: 12, counterAxisAlignItems: "BASELINE" });
    b.appendChild(tr);
    tr.appendChild(T(title, 20, 28, "Semi Bold"));
    tr.appendChild(T(source, 12, 16, "Regular", "text/ink-2"));
    const d = T(desc, 14, 22, "Regular", "text/ink-2"); b.appendChild(d); d.textAutoResize = "HEIGHT"; d.resize(880, d.height);
    const stage = AL("HORIZONTAL", { name: "Stage", itemSpacing: 40, counterAxisSpacing: 40, layoutWrap: "WRAP", counterAxisAlignItems: "CENTER" });
    pad(stage, 40, 40);
    stage.fills = [paint("surface/surface")]; stage.cornerRadius = 16; stroke(stage, "border/rule");
    b.appendChild(stage); fill(stage);
    log.push("+ " + title);
    return stage;
  };
  const makeSet = (stage, name, comps, desc, opts = {}) => {
    for (const c of comps) stage.appendChild(c);
    const s = figma.combineAsVariants(comps, stage);
    s.name = name; s.description = desc;
    s.layoutMode = opts.dir || "HORIZONTAL"; s.layoutWrap = s.layoutMode === "HORIZONTAL" ? "WRAP" : "NO_WRAP";
    s.itemSpacing = opts.gap != null ? opts.gap : 24; if (s.layoutMode === "HORIZONTAL") s.counterAxisSpacing = s.itemSpacing;
    pad(s, 24, 24); s.counterAxisAlignItems = opts.align || "CENTER";
    s.fills = opts.bg ? [paint(opts.bg)] : []; s.cornerRadius = 12;
    s.strokes = [{ type: "SOLID", color: { r: 0.59, g: 0.28, b: 1 } }]; s.dashPattern = [6, 4]; s.strokeWeight = 1;
    if (opts.width) { s.primaryAxisSizingMode = "FIXED"; s.resize(opts.width, s.height); s.counterAxisSizingMode = "AUTO"; }
    else { s.primaryAxisSizingMode = "AUTO"; s.counterAxisSizingMode = "AUTO"; }
    return s;
  };
  const comp = (name, dir = "HORIZONTAL", o = {}) => {
    const c = figma.createComponent();
    c.name = name; c.layoutMode = dir; c.primaryAxisSizingMode = "AUTO"; c.counterAxisSizingMode = "AUTO"; c.fills = []; c.clipsContent = false;
    for (const k of Object.keys(o)) c[k] = o[k];
    return c;
  };
  const fixed = (c, w, h) => { c.resize(w, h); c.primaryAxisSizingMode = "FIXED"; c.counterAxisSizingMode = "FIXED"; };
  const fixedWidth = (c, w) => {
    if (c.layoutMode === "HORIZONTAL") { c.primaryAxisSizingMode = "FIXED"; c.resize(w, c.height); }
    else { c.counterAxisSizingMode = "FIXED"; c.resize(w, c.height); }
  };
  const splitBg = (s, stop) => {
    const red = { r: 0.639, g: 0.078, b: 0.102, a: 1 }, white = { r: 1, g: 1, b: 1, a: 1 };
    s.fills = [{ type: "GRADIENT_LINEAR", gradientTransform: [[0, 1, 0], [-1, 0, 1]], gradientStops: [{ position: 0, color: white }, { position: stop, color: white }, { position: stop, color: red }, { position: 1, color: red }] }];
  };

  // ---------- Dọn node lẻ do lần chạy lỗi để lại ở gốc trang ----------
  // Chỉ xóa: component biến thể chưa ghép bộ (tên dạng "State=…") và ô chữ rỗng.
  for (const n of [...page.children]) {
    if (n === root) continue;
    const strayVariant = n.type === "COMPONENT" && /^[A-Z][A-Za-z ]*=/.test(n.name);
    const emptyText = n.type === "TEXT" && n.characters === "";
    if (strayVariant || emptyText) { n.remove(); log.push("- dọn " + n.type); }
  }
  // Dựng lại toàn bộ phần do plugin này tạo (tên cố định), để mỗi lần chạy ra cùng một kết quả chuẩn.
  // Phần dựng bằng MCP trước đó (biến, kiểu chữ, mục 01–04, sáu component đầu) được giữ nguyên.
  // Gồm cả tên block cũ đã bỏ (Filter Tab, Language Select) để lần chạy này dọn chúng đi.
  const OWN_BLOCKS = ["Conversation Item", "Search Field", "Filter Tab", "Language Select", "Popup Menu", "Filter Bar", "Chat Header", "Message", "Answer Footer", "Data Table", "Composer", "Status Message", "Dialog", "Empty State"];
  for (const t of OWN_BLOCKS) { const old = compSec.findChild((n) => n.name === "Block " + t); if (old) old.remove(); }
  { const pat = root.findChild((n) => n.name === "06 Pattern"); if (pat) pat.remove(); }

  // ---------- Biến màu có độ trong suốt (giá trị lấy đúng từ code) ----------
  {
    const colorCol = findCol(await figma.variables.getLocalVariableCollectionsAsync(), "alias", true);
    if (!colorCol) throw new Error('Thiếu bộ biến "GeoAgent / Alias" (tên cũ "GeoAgent / Semantic", "GeoAgent / Color")');
    const mode = colorCol.modes[0].modeId;
    const ALPHA = [
      ["avatar/frame-bg", { r: 1, g: 247 / 255, b: 240 / 255, a: 0.16 }, ["FRAME_FILL", "SHAPE_FILL"], "var(--avatar-frame-bg)", "Avatar trên sidebar đỏ: trắng ấm 16%"],
      ["sidebar/divider", { r: 1, g: 247 / 255, b: 240 / 255, a: 0.15 }, ["STROKE_COLOR"], "var(--divider)", "Đường kẻ trên nền đỏ"],
      ["surface/scrim", { r: 29 / 255, g: 20 / 255, b: 22 / 255, a: 0.4 }, ["FRAME_FILL", "SHAPE_FILL"], "var(--scrim)", "Lớp phủ sau ngăn kéo trên điện thoại"],
    ];
    for (const [name, value, scopes, code, desc] of ALPHA) {
      let v = V[name];
      if (!v) { v = figma.variables.createVariable(name, colorCol, "COLOR"); V[name] = v; vars.push(v); log.push("+ biến " + name); }
      v.setValueForMode(mode, value); v.scopes = scopes; v.description = desc; v.setVariableCodeSyntax("WEB", code);
    }
  }

  // ---------- Token: màu gốc, màu vai trò mới, mode Dark (tạo sớm để component gắn vào được ngay) ----------
  await prepareTokens(V, vars);

  // ---------- Icon mới trong bộ icon (lọc, chưa đọc, đổi tên, xóa, đăng xuất): tạo component nếu chưa có ----------
  {
    // Icon đã bỏ khỏi bộ icon: xóa component (instance nào còn dùng sẽ thành bản tách rời, Figma tự xử lý)
    for (const name of ICON_REMOVED) {
      const old = root.findOne((n) => n.type === "COMPONENT" && n.name === "Icon/" + name);
      if (old) { old.remove(); log.push("- Icon/" + name); }
    }
    const home = iconComp("close").parent;
    for (const [name, svg] of Object.entries(ICON_SVG)) {
      if (root.findOne((n) => n.type === "COMPONENT" && n.name === "Icon/" + name)) continue;
      const src = figma.createNodeFromSvg(svg);
      const c = figma.createComponent(); c.name = "Icon/" + name; c.resize(24, 24); c.fills = []; c.clipsContent = false;
      for (const ch of [...src.children]) c.appendChild(ch);
      src.remove();
      for (const n of c.findAll((x) => "strokes" in x && x.strokes.length)) n.strokes = [paint("text/ink")];
      c.description = "GeoAgent Icons (Lucide), nét 1.75px. React: icons.jsx";
      home.appendChild(c);
      log.push("+ Icon/" + name);
    }
  }

  // ---------- Nối Figma với code: tên class Tailwind trên kiểu chữ, đổ bóng, bo góc ----------
  {
    // Kiểu chữ ô soạn tin (code: text-input, 15/1.45) khác bong bóng (1.5)
    if (!TS["Body/Input"]) {
      const s = figma.createTextStyle(); s.name = "Body/Input";
      s.fontName = { family: "Inter", style: "Regular" }; s.fontSize = 15; s.lineHeight = { unit: "PERCENT", value: 145 };
      s.description = "Ô soạn tin"; TS["Body/Input"] = s; log.push("+ kiểu chữ Body/Input");
    }
    // Mô tả khớp tokens/geoagent.tokens.json (bỏ ghi chú cũ nhắc class gõ tay đã thay bằng token)
    const DESC = {
      var: { "brand/brand-hover": "Nút chính khi rê chuột", "brand/brand-pressed": "Nút chính khi nhấn", "sidebar/frame-edge": "Viền ô tìm kiếm, vạch kéo sidebar" },
      text: { "Display/Welcome title": "Tiêu đề thẻ đăng nhập", "Heading/Brand": "Tên sản phẩm trên sidebar (kèm font-heading)", "Body/Bubble": "Bong bóng tin của người dùng", "Body/Small": "Xem trước tin, tab lọc, chân thẻ đăng nhập, tên người gửi" },
      effect: { "Shadow/Drawer": "Ngăn kéo danh sách trên điện thoại" },
    };
    for (const [n, d] of Object.entries(DESC.var)) if (V[n]) V[n].description = d;
    for (const [n, d] of Object.entries(DESC.text)) if (TS[n]) TS[n].description = d;
    for (const [n, d] of Object.entries(DESC.effect)) if (FX[n]) FX[n].description = d;
    const withCode = (desc, code) => (desc || "").split(" · Code:")[0] + " · Code: " + code;
    for (const [name, code] of Object.entries(TEXT_CODE)) if (TS[name]) TS[name].description = withCode(TS[name].description, code);
    for (const [name, key] of Object.entries(EFFECT_CODE)) if (FX[name]) FX[name].description = withCode(FX[name].description, "shadow-" + key);
    // Bo góc: radius/sm (6px) đổi tên theo code là radius/bubble-tip; Code syntax trỏ biến CSS của Tailwind
    if (V["radius/sm"] && !V["radius/bubble-tip"]) { V["radius/sm"].name = "radius/bubble-tip"; V["radius/bubble-tip"] = V["radius/sm"]; delete V["radius/sm"]; log.push("~ radius/sm → radius/bubble-tip"); }
    for (const v of vars.filter((x) => x.name.indexOf("radius/") === 0)) {
      const k = v.name.split("/")[1];
      v.setVariableCodeSyntax("WEB", k === "full" ? "9999px" : "var(--radius-" + k + ")");
      v.description = (k === "full" ? "rounded-full" : "rounded-" + k) + (k === "bubble-tip" ? " (góc nhọn phía người gửi: rounded-br-bubble-tip / rounded-tl-bubble-tip)" : "");
    }
  }

  // ---------- Bảng màu (mục 01): chữ không tràn, thêm thẻ cho biến mới ----------
  {
    const colorSec = root.findChild((n) => n.name === "01 Color");
    if (colorSec) {
      const hexOf = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
      for (const [name, group] of [["avatar/frame-bg", "avatar"], ["sidebar/divider", "sidebar"], ["surface/scrim", "surface"]]) {
        const row = colorSec.findOne((n) => n.name === "Swatches" && n.parent && n.parent.name === "Group " + group);
        if (!row || row.findChild((n) => n.name === name)) continue;
        const model = row.children[0]; if (!model) continue;
        const card = model.clone(); row.appendChild(card); card.name = name;
        const sw = card.findChild((n) => n.name === "Swatch");
        // Ô màu trong suốt cần nền phía sau mới thấy được (đỏ cho màu trên sidebar, trắng cho lớp phủ)
        sw.fills = [paint(group === "surface" ? "surface/surface" : "sidebar/frame"), paint(name)];
        const v = V[name], val = Object.values(v.valuesByMode)[0];
        const tx = card.findAll((n) => n.type === "TEXT");
        if (tx[0]) tx[0].characters = name.split("/")[1];
        if (tx[1]) tx[1].characters = v.codeSyntax.WEB + "  ·  " + hexOf(val) + " " + Math.round(val.a * 100) + "%";
        if (tx[2]) tx[2].characters = v.description;
      }
      for (const meta of colorSec.findAll((n) => n.name === "Meta")) {
        for (const t of meta.children.filter((n) => n.type === "TEXT")) {
          if (t.characters.indexOf("  ·  ") > 0) t.characters = t.characters.replace("  ·  ", "\n");
          t.layoutSizingHorizontal = "FILL"; t.textAutoResize = "HEIGHT";
        }
      }
    }
  }

  // ---------- 0. Sửa bố cục hai bộ đã có ----------
  {
    // Rộng vừa đúng một hàng cho mỗi tông, cộng 4px dư để làm tròn số không đẩy phần tử cuối xuống hàng
    // (nhỏ hơn một phần tử + khoảng cách nên không lọt thêm phần tử). Nền tách tại mép trên hàng Frame.
    const splitAtFrameRow = (s, width) => {
      const frameRow = s.children.filter((n) => n.name.indexOf("Tone=Frame") === 0);
      for (const c of frameRow) s.appendChild(c); // hàng Frame xuống cuối
      s.primaryAxisSizingMode = "FIXED"; s.resize(width + 4, s.height); s.counterAxisSizingMode = "AUTO";
      const lastOther = s.children.filter((n) => n.name.indexOf("Tone=Frame") !== 0);
      const otherBottom = Math.max.apply(null, lastOther.map((n) => n.y + n.height));
      const frameTop = Math.min.apply(null, frameRow.map((n) => n.y));
      splitBg(s, Math.max(0, Math.min(1, (otherBottom + frameTop) / 2 / s.height)));
      return { rows: new Set(s.children.map((n) => Math.round(n.y))).size, frameTop, otherBottom };
    };
    // Avatar tông Frame: nền là biến có sẵn độ trong suốt (Figma bỏ opacity của lớp tô khi gắn biến)
    for (const c of set("Avatar").children.filter((n) => n.name.indexOf("Tone=Frame") === 0)) {
      c.fills = [paint("avatar/frame-bg")];
    }
    // Chữ cái của avatar trong mục đang chọn: màu vai trò riêng (khớp code: var(--on-frame-active))
    for (const c of set("Avatar").children.filter((n) => n.name.indexOf("Tone=Selected") === 0)) {
      for (const t of c.findAll((n) => n.type === "TEXT")) t.fills = [paint("sidebar/on-frame-active")];
    }
    const ibInfo = splitAtFrameRow(set("Icon Button"), 48 + 3 * 36 + 2 * 24);
    const avInfo = splitAtFrameRow(set("Avatar"), 48 + 22 + 28 + 32 + 36 + 40 + 4 * 20);
    if (ibInfo.frameTop < ibInfo.otherBottom || avInfo.frameTop < avInfo.otherBottom) throw new Error("Hàng Frame chưa tách khỏi các hàng khác");
    log.push("~ Icon Button, Avatar: nền tách trắng/đỏ");
  }

  // Nút icon trên nền trắng / đỏ với icon chỉ định (dùng component Icon Button có sẵn)
  const iconButton = (iconName, tone = "Sheet", state = "Default") => {
    const b = variant("Icon Button", `Tone=${tone}, State=${state}`);
    const key = Object.keys(b.componentProperties).find((x) => x.split("#")[0] === "Icon");
    if (key) b.setProperties({ [key]: iconComp(iconName).id });
    return b;
  };
  const tryVariant = (setName, names) => { for (const n of names) { try { return variant(setName, n); } catch (e) { /* thử tên kế tiếp */ } } throw new Error("Thiếu biến thể " + setName + " / " + names.join(" | ")); };
  const pill = (label, kind) => {
    const b = AL("HORIZONTAL", { name: kind === "primary" ? "Button primary" : "Button secondary", primaryAxisAlignItems: "CENTER", counterAxisAlignItems: "CENTER" });
    b.paddingLeft = b.paddingRight = 16; b.counterAxisSizingMode = "FIXED"; b.resize(b.width, 40); radius(b, "radius/full");
    if (kind === "primary") b.fills = [paint("brand/brand")]; else stroke(b, "border/line-strong");
    b.appendChild(T(label, 14, 20, "Medium", kind === "primary" ? "text/on-brand" : "text/ink"));
    return b;
  };
  const fadeDown = (n) => {
    // Dải mờ dần từ nền vùng chat (đặc ở trên) xuống trong suốt: chữ cuộn lên nhạt dần rồi biến mất
    const c = { r: 252 / 255, g: 248 / 255, b: 247 / 255 };
    n.fills = [{ type: "GRADIENT_LINEAR", gradientTransform: [[0, 1, 0], [-1, 0, 1]], gradientStops: [{ position: 0, color: Object.assign({ a: 1 }, c) }, { position: 0.4, color: Object.assign({ a: 1 }, c) }, { position: 1, color: Object.assign({ a: 0 }, c) }] }];
  };

  // ---------- 1. Conversation Item ----------
  {
    const stage = block("Conversation Item", "Một phiên chat trong sidebar: một dòng chủ đề (chữ 13), bo tròn, cao 36. Chưa đọc: chữ đậm và chấm vàng. Yêu thích: ngôi sao. Rê chuột / focus: hiện nút ⋮ (tùy chọn phiên). Đang chọn: viên trắng ấm, chữ đỏ. Rộng 248 (sidebar 264, lề 8).", "Sidebar.jsx");
    if (stage) {
      stage.fills = [paint("sidebar/frame")];
      const comps = [];
      for (const state of ["Default", "Hover", "Selected"]) for (const unread of ["No", "Yes"]) {
        const sel = state === "Selected", hover = state === "Hover";
        const c = comp(`State=${state}, Unread=${unread}`, "HORIZONTAL", { itemSpacing: 8, counterAxisAlignItems: "CENTER" });
        c.paddingLeft = 12; c.paddingRight = hover ? 4 : 12; c.paddingTop = c.paddingBottom = 0;
        fixed(c, 248, 36); radius(c, "radius/full");
        c.fills = sel ? [paint("sidebar/frame-active")] : hover ? [paint("sidebar/frame-hover")] : [];
        const ink = sel ? "sidebar/on-frame-active" : "sidebar/on-frame";
        const t = unread === "Yes" && !sel ? T("Kiểm tra số dư tài khoản 131", 13, 18, "Semi Bold", ink) : TX("Kiểm tra số dư tài khoản 131", "Body/Small", ink);
        t.name = "Topic"; c.appendChild(t); oneLine(t);
        const star = icon("favorite", 14, ink); star.name = "Favorite"; c.appendChild(star);
        for (const n of star.findAll((x) => "fills" in x && x.type !== "INSTANCE")) n.fills = [paint(ink)];
        const dot = figma.createEllipse(); dot.name = "Unread dot"; dot.resize(8, 8); dot.fills = [paint("brand/gold")]; dot.visible = unread === "Yes" && !sel; c.appendChild(dot);
        if (hover) { const m = iconButton("more", "Frame", "Default"); m.name = "More"; m.resize(32, 32); c.appendChild(m); }
        comps.push(c);
      }
      const s = makeSet(stage, "Conversation Item", comps, "Phiên chat trong Sidebar.jsx (li > button + nút ⋮ PopupMenu).", { dir: "VERTICAL", gap: 12, bg: "sidebar/frame", align: "MIN" });
      const tp = s.addComponentProperty("Topic", "TEXT", "Kiểm tra số dư tài khoản 131");
      const fp = s.addComponentProperty("Favorite", "BOOLEAN", false);
      for (const c of s.children) {
        c.findOne((n) => n.name === "Topic").componentPropertyReferences = { characters: tp };
        c.findOne((n) => n.name === "Favorite").componentPropertyReferences = { visible: fp };
      }
    }
  }

  // ---------- 2. Search Field ----------
  {
    const stage = block("Search Field", "Ô tìm hội thoại trên nền đỏ: cao 36 (cảm ứng 40), bo tròn, nền đỏ tối, viền frame-edge, chữ 13. Nút xóa (28, icon close 16) chỉ hiện khi đã gõ. Focus: viền và vòng on-frame.", "Sidebar.jsx");
    if (stage) {
      stage.fills = [paint("sidebar/frame")];
      const comps = [];
      for (const state of ["Empty", "Filled", "Focus"]) {
        const c = comp(`State=${state}`, "HORIZONTAL", { itemSpacing: 8, counterAxisAlignItems: "CENTER" });
        c.paddingLeft = 16; c.paddingRight = state === "Filled" ? 8 : 16;
        fixed(c, 240, 36); radius(c, "radius/full");
        c.fills = [paint("sidebar/frame-sunken")];
        stroke(c, state === "Focus" ? "sidebar/on-frame" : "sidebar/frame-edge", state === "Focus" ? 2 : 1);
        const t = TX(state === "Filled" ? "thuế" : "Tìm hội thoại", "Body/Small", state === "Filled" ? "sidebar/on-frame" : "sidebar/on-frame-muted"); t.name = "Text";
        c.appendChild(t); oneLine(t);
        if (state === "Filled") {
          const x = AL("HORIZONTAL", { name: "Clear", primaryAxisAlignItems: "CENTER", counterAxisAlignItems: "CENTER" });
          fixed(x, 28, 28); radius(x, "radius/full");
          x.appendChild(icon("close", 16, "sidebar/on-frame-muted")); c.appendChild(x);
        }
        comps.push(c);
      }
      makeSet(stage, "Search Field", comps, "Ô tìm kiếm trong Sidebar.jsx (input type=search). Esc xóa nội dung.", { dir: "VERTICAL", gap: 16, bg: "sidebar/frame", align: "MIN" });
    }
  }

  // ---------- 3. Menu (bộ lọc, tùy chọn phiên, tài khoản) ----------
  {
    const stage = block("Popup Menu", "Menu bật lên từ một nút (popover, phím mũi tên): mở xuống, mép trái thẳng nút, chạm mép màn hình thì lật. Mục cao 36 (cảm ứng 44), icon 16, chữ 14 Medium; dấu tích cho lựa chọn đang áp dụng. Bộ lọc dùng chọn một (menuitemradio) và đóng sau 100ms; lệnh thường đóng ngay.", "PopupMenu.jsx, FilterMenu.jsx, Settings.jsx");
    if (stage) {
      stage.counterAxisAlignItems = "MIN";
      const comps = [];
      for (const state of ["Default", "Hover"]) for (const checked of ["No", "Yes"]) {
        const c = comp(`State=${state}, Checked=${checked}`, "HORIZONTAL", { itemSpacing: 10, counterAxisAlignItems: "CENTER" });
        c.paddingLeft = c.paddingRight = 10; fixed(c, 200, 36); radius(c, "radius/lg");
        c.fills = state === "Hover" ? [paint("surface/surface-2")] : [];
        const ic = icon("chat", 16, "text/ink-2"); ic.name = "Icon"; c.appendChild(ic);
        const t = T("Tất cả", 14, 20, "Medium"); t.name = "Label"; c.appendChild(t); oneLine(t);
        const ck = icon("check", 16, "text/ink"); ck.name = "Check"; ck.visible = checked === "Yes"; c.appendChild(ck);
        comps.push(c);
      }
      const s = makeSet(stage, "Menu Item", comps, "Một mục menu (PopupMenu.jsx). Checked=Yes: mục đang chọn của nhóm chọn một.", { gap: 16 });
      const lp = s.addComponentProperty("Label", "TEXT", "Tất cả");
      const ip = s.addComponentProperty("Icon", "INSTANCE_SWAP", iconComp("chat").id);
      for (const c of s.children) {
        c.findOne((n) => n.name === "Label").componentPropertyReferences = { characters: lp };
        c.findOne((n) => n.name === "Icon").componentPropertyReferences = { mainComponent: ip };
      }
      const item = (label, iconName, st = "Default", checked = "No") => {
        const i = variant("Menu Item", `State=${st}, Checked=${checked}`);
        setProp(i, "Label", label);
        const key = Object.keys(i.componentProperties).find((x) => x.split("#")[0] === "Icon");
        if (key) i.setProperties({ [key]: iconComp(iconName).id });
        return i;
      };
      const menu = (name, width, rows, desc, extra) => {
        const m = comp(name, "VERTICAL", { itemSpacing: 0 });
        pad(m, 4, 4); m.fills = [paint("surface/surface")]; stroke(m, "border/line"); radius(m, "radius/xl"); shadow(m, "Shadow/Floating button");
        fixedWidth(m, width); // cố định bề rộng trước, rồi các mục mới FILL được
        if (extra) extra(m);
        for (const r of rows) { m.appendChild(r); r.layoutSizingHorizontal = "FILL"; }
        m.description = desc; stage.appendChild(m);
        return m;
      };
      menu("Menu / Filter", 184, [item("Tất cả", "chat", "Default", "Yes"), item("Chưa đọc", "unread", "Hover"), item("Yêu thích", "favorite")],
        "Menu của nút lọc (FilterMenu.jsx): chọn một, nhãn bộ lọc đang áp dụng hiện ở đầu danh sách.");
      menu("Menu / Conversation", 208, [item("Thêm vào Yêu thích", "favorite"), item("Đổi tên", "rename", "Hover"), item("Đánh dấu chưa đọc", "unread"), item("Xóa", "delete")],
        "Tùy chọn một phiên (conversationActions.js), dùng cho nút ⋮ ở danh sách và ở header. Phiên đang mở không có \"Đánh dấu chưa đọc\"; phiên cuối cùng không có \"Xóa\".");
      menu("Menu / Account", 248, [], "Bảng Tài khoản và cài đặt (Settings.jsx): chọn giao diện, Đăng xuất.", (m) => {
        const lg = T("Giao diện", 12, 16, "Medium", "text/ink-2"); const lw = AL("HORIZONTAL", { name: "Legend" }); lw.paddingLeft = 8; lw.paddingTop = 4; lw.paddingBottom = 8; lw.appendChild(lg); m.appendChild(lw);
        for (const [label, on, sub] of [["Theo hệ thống", true, "Máy đang ở chế độ sáng"], ["Sáng", false], ["Tối", false]]) {
          const r = AL("HORIZONTAL", { name: "Option", itemSpacing: 12, counterAxisAlignItems: "CENTER" }); r.paddingLeft = r.paddingRight = 8; r.paddingTop = r.paddingBottom = 6;
          r.counterAxisSizingMode = "AUTO"; m.appendChild(r);
          const dot = figma.createEllipse(); dot.name = "Radio"; dot.resize(16, 16); dot.fills = [paint("surface/surface")]; stroke(dot, on ? "brand/brand" : "border/line-strong", on ? 5 : 1.5); r.appendChild(dot);
          const col = AL("VERTICAL", { name: "Text" }); r.appendChild(col);
          col.appendChild(T(label, 14, 20, "Regular"));
          if (sub) col.appendChild(T(sub, 12, 16, "Regular", "text/ink-2"));
        }
        const hr = figma.createRectangle(); hr.name = "Divider"; hr.resize(200, 1); hr.fills = [paint("border/line")]; m.appendChild(hr);
        m.appendChild(item("Đăng xuất", "sign-out"));
        hr.layoutSizingHorizontal = "FILL";
      });
    }
  }

  // ---------- 4. Filter Bar ----------
  {
    const stage = block("Filter Bar", "Đầu danh sách: tên bộ lọc đang áp dụng (chữ 13 Medium, on-frame-muted) và nút lọc mở Menu / Filter. Tên phiên bên dưới sáng hơn nhãn này (sidebar/item-text).", "Sidebar.jsx, FilterMenu.jsx");
    if (stage) {
      stage.fills = [paint("sidebar/frame")];
      const c = comp("Filter Bar", "HORIZONTAL", { counterAxisAlignItems: "CENTER", primaryAxisAlignItems: "SPACE_BETWEEN" });
      c.paddingLeft = 12; c.paddingRight = 0; fixed(c, 248, 36);
      const t = T("Tất cả", 13, 18, "Medium", "sidebar/on-frame-muted"); t.name = "Label"; c.appendChild(t);
      c.appendChild(iconButton("filter", "Frame"));
      c.description = "Nhãn bộ lọc + nút lọc (aria-haspopup=menu).";
      stage.appendChild(c);
      const lp = c.addComponentProperty("Label", "TEXT", "Tất cả"); t.componentPropertyReferences = { characters: lp };
    }
  }

  // ---------- 5. Chat Header ----------
  {
    const stage = block("Chat Header", "Không có thanh nền: tin nhắn cuộn lên nhạt dần rồi biến mất ở mép trên (dải mờ từ nền vùng chat). Máy tính: nút ⋮ (tùy chọn phiên đang mở). Điện thoại: nút menu, nút cuộc trò chuyện mới và ⋮. Tên phiên chỉ có cho trình đọc màn hình (h1 ẩn).", "ChatPane.jsx");
    if (stage) {
      const comps = [];
      for (const device of ["Desktop", "Mobile"]) {
        const mobile = device === "Mobile";
        const c = comp(`Device=${device}`, "HORIZONTAL", { itemSpacing: 4, counterAxisAlignItems: "CENTER" });
        c.paddingLeft = c.paddingRight = mobile ? 12 : 24;
        fixed(c, mobile ? 375 : 760, 64); fadeDown(c);
        if (mobile) c.appendChild(iconButton("menu"));
        const sp = AL("HORIZONTAL", { name: "Spacer" }); c.appendChild(sp); sp.layoutGrow = 1;
        if (mobile) c.appendChild(iconButton("edit"));
        c.appendChild(iconButton("more"));
        comps.push(c);
      }
      makeSet(stage, "Chat Header", comps, "Header của ChatPane.jsx. Trên iPhone có thêm lề an toàn phía trên (safe-area).", { dir: "VERTICAL", gap: 24, align: "MIN" });
    }
  }

  // ---------- 6. Message ----------
  {
    const stage = block("Message", "Tin của người dùng: bong bóng hồng thương hiệu, góc dưới phải nhọn 6px, giờ và avatar nằm dưới. Tin của bot: dòng tên + giờ, thẻ trắng viền bubble-edge, góc trên trái nhọn, có tiêu đề, đoạn văn, danh sách chấm đỏ và bảng; bên dưới là Answer Footer.", "ChatPane.jsx, MessageContent.jsx");
    if (stage) {
      stage.counterAxisAlignItems = "MIN";
      const u = comp("Message / User", "VERTICAL", { itemSpacing: 6, counterAxisAlignItems: "MAX" });
      fixedWidth(u, 392);
      const b = AL("HORIZONTAL", { name: "Bubble" }); b.paddingLeft = b.paddingRight = 16; b.paddingTop = b.paddingBottom = 10;
      b.fills = [paint("brand/brand-soft")]; radii(b, "radius/bubble", "radius/bubble", "radius/bubble-tip", "radius/bubble");
      u.appendChild(b); b.layoutSizingHorizontal = "FILL";
      const ut = TX("Phân tích nghĩa vụ thuế năm 2025 và so sánh với 2024.", "Body/Bubble"); ut.name = "Text";
      b.appendChild(ut); wrapText(ut);
      const meta = AL("HORIZONTAL", { name: "Meta", itemSpacing: 8, counterAxisAlignItems: "CENTER" }); u.appendChild(meta);
      const tm = TX("09:12", "Caption/Default", "text/ink-2"); tm.name = "Time"; meta.appendChild(tm);
      meta.appendChild(avatar("Teal", 22, "N"));
      stage.appendChild(u);
      u.description = "Tin của người dùng (tối đa 75% bề rộng cột trên máy tính, 85% trên điện thoại). Gửi lỗi: thay dòng giờ bằng Status Message / Send failed.";
      const tp = u.addComponentProperty("Text", "TEXT", ut.characters);
      const tt = u.addComponentProperty("Time", "TEXT", "09:12");
      ut.componentPropertyReferences = { characters: tp }; tm.componentPropertyReferences = { characters: tt };

      const m = comp("Message / Bot", "VERTICAL", { itemSpacing: 8 });
      const hr = AL("HORIZONTAL", { name: "Sender", itemSpacing: 8, counterAxisAlignItems: "CENTER" }); m.appendChild(hr);
      hr.appendChild(variant("Bot Avatar", "Size=28"));
      const sn = TX("GeoAgent", "Label/Small"); sn.name = "Sender name"; hr.appendChild(sn);
      const bt = TX("09:12", "Caption/Default", "text/ink-2"); bt.name = "Time"; hr.appendChild(bt);
      const card = AL("VERTICAL", { name: "Bubble", itemSpacing: 12 }); card.paddingLeft = card.paddingRight = 20; card.paddingTop = card.paddingBottom = 16;
      card.fills = [paint("surface/surface")]; stroke(card, "border/bubble-edge"); radii(card, "radius/bubble-tip", "radius/bubble", "radius/bubble", "radius/bubble");
      shadow(card, "Shadow/Bot bubble");
      m.appendChild(card); fixedWidth(m, 640); fill(card);
      const h3 = TX("Nhận xét", "Heading/Message heading"); card.appendChild(h3); wrapText(h3);
      const p = TX("Tổng thuế phải nộp giảm 36% so với năm trước, trong khi:", "Body/Message"); card.appendChild(p); wrapText(p);
      const list = AL("VERTICAL", { name: "List", itemSpacing: 4 }); card.appendChild(list); fill(list);
      for (const it of ["Doanh thu tăng 525%", "Lợi nhuận kế toán tăng 11,6%"]) {
        const li = AL("HORIZONTAL", { name: "Item", itemSpacing: 10, counterAxisAlignItems: "MIN" }); list.appendChild(li); fill(li);
        const d = figma.createFrame(); d.name = "Marker"; d.resize(6, 24); d.fills = [];
        const dot = figma.createEllipse(); dot.resize(5, 5); dot.x = 0; dot.y = 10; dot.fills = [paint("brand/brand")]; d.appendChild(dot);
        li.appendChild(d);
        const lt = TX(it, "Body/Message"); li.appendChild(lt); wrapText(lt);
      }
      stage.appendChild(m);
      m.description = "Câu trả lời của bot (MessageContent.jsx): tiêu đề, đoạn văn, danh sách, bảng, link nguồn. Chữ đậm và link [nhãn](https://…) trong đoạn văn.";
      const bp = m.addComponentProperty("Time", "TEXT", "09:12");
      bt.componentPropertyReferences = { characters: bp };

      const ty = comp("Typing Indicator", "HORIZONTAL", { itemSpacing: 12, counterAxisAlignItems: "CENTER" });
      ty.appendChild(variant("Bot Avatar", "Size=28"));
      const dots = AL("HORIZONTAL", { name: "Dots", itemSpacing: 6, counterAxisAlignItems: "CENTER" }); ty.appendChild(dots);
      [1, 0.6, 0.3].forEach((o) => { const e = figma.createEllipse(); e.resize(6, 6); e.fills = [paint("text/ink-2")]; e.opacity = o; dots.appendChild(e); });
      ty.description = "Bot đang trả lời: 3 chấm nhấp nháy lệch nhau 200ms (role=status). Tắt chuyển động khi người dùng chọn giảm chuyển động.";
      stage.appendChild(ty);
    }
  }

  // ---------- 7. Answer Footer ----------
  {
    const stage = block("Answer Footer", "Dưới mỗi câu trả lời. Có bảng hoặc dẫn nguồn: dòng Nguồn (số lượng + link, mở ở khung web cạnh chat) và lưu ý kiểm tra. Luôn có nút Sao chép (bảng sao chép dạng Tab, dán vào Excel thành ô); có bảng thì thêm Tải bảng (CSV). Nút chỉ có icon 20 trong ô 36 (cảm ứng 44), tên ở tooltip; xong thì icon đổi thành dấu tích 2 giây.", "AnswerFooter.jsx");
    if (stage) {
      const c = comp("Answer Footer", "VERTICAL", { itemSpacing: 6 });
      c.paddingLeft = 4; fixedWidth(c, 640);
      const src = AL("HORIZONTAL", { name: "Sources", itemSpacing: 8, counterAxisSpacing: 4, layoutWrap: "WRAP", counterAxisAlignItems: "BASELINE" }); c.appendChild(src); fill(src);
      src.appendChild(T("Nguồn (2):", 12, 16, "Regular", "text/ink-2"));
      for (const l of ["Thuế giá trị gia tăng", "Thông tư 80/2021/TT-BTC"]) { const a = T(l, 12, 16, "Medium", "text/link"); a.textDecoration = "UNDERLINE"; src.appendChild(a); }
      const note = AL("HORIZONTAL", { name: "Note", itemSpacing: 6, counterAxisAlignItems: "MIN" }); c.appendChild(note); fill(note);
      note.appendChild(icon("info", 14, "text/ink-2"));
      const nt = T("GeoAgent có thể sai. Kiểm tra lại với văn bản gốc trước khi kê khai.", 12, 16, "Regular", "text/ink-2"); note.appendChild(nt); wrapText(nt);
      const act = AL("HORIZONTAL", { name: "Actions", itemSpacing: 2 }); c.appendChild(act);
      act.appendChild(iconButton("copy")); act.appendChild(iconButton("download"));
      c.description = "AnswerFooter.jsx: <AnswerFooter blocks={m.blocks} title={…} onOpenLink={…} />. Câu trả lời không có bảng/nguồn chỉ còn nút Sao chép.";
      stage.appendChild(c);
    }
  }

  // ---------- 8. Data Table ----------
  {
    const stage = block("Data Table", "Bảng trong câu trả lời: chỉ đường kẻ ngang, cột đầu căn trái, cột số căn phải với chữ số đều nhau. Bảng rộng thì cuộn ngang trong khung, không làm vỡ trang.", "MessageContent.jsx › DataTable");
    if (stage) {
      const c = comp("Data Table", "VERTICAL");
      const rows = [["Loại thuế", "2024", "2025", "Biến động"], ["GTGT phải nộp", "0", "0", "—"], ["TNDN phải nộp", "5,70 tỷ", "3,66 tỷ", "-36%"], ["Tổng thuế", "5,70 tỷ", "3,66 tỷ", "-36%"]];
      const widths = [160, 96, 96, 104];
      rows.forEach((r, i) => {
        const row = AL("HORIZONTAL", { name: i === 0 ? "Head" : "Row " + i }); c.appendChild(row);
        bottomRule(row, i === 0 ? "border/line" : "border/rule");
        r.forEach((cell, j) => {
          const cf = AL("HORIZONTAL", { name: "Cell", primaryAxisAlignItems: j === 0 ? "MIN" : "MAX" });
          cf.paddingLeft = j === 0 ? 0 : 12; cf.paddingRight = j === r.length - 1 ? 0 : (j === 0 ? 24 : 12);
          cf.paddingTop = i === 0 ? 2 : 8; cf.paddingBottom = i === 0 ? 6 : 8;
          row.appendChild(cf); cf.primaryAxisSizingMode = "FIXED"; cf.resize(widths[j], cf.height);
          cf.appendChild(i === 0 ? TX(cell, "Caption/Table head", "text/ink-2") : TX(cell, "Body/Default"));
        });
      });
      c.description = "Bảng dữ liệu (role=region, focus được để cuộn ngang bằng bàn phím).";
      stage.appendChild(c);
    }
  }

  // ---------- 9. Composer ----------
  {
    const stage = block("Composer", "Ô soạn tin dính đáy khung chat: bo 28, viền line-strong, bóng Composer, cao tối thiểu 56. Trái: đính kèm. Phải: micro; khi đã gõ, nút gửi đỏ xuất hiện và micro dịch sang trái. Mất mạng: dòng báo phía trên ô, vẫn gõ được; tin gửi lúc đó hiện Chưa gửi được + Thử lại. Enter gửi, Shift+Enter xuống dòng.", "Composer.jsx");
    if (stage) {
      const comps = [];
      for (const state of ["Empty", "Typing", "Offline"]) {
        const c = comp(`State=${state}`, "VERTICAL", { itemSpacing: 8 });
        fixedWidth(c, 640);
        if (state === "Offline") {
          const n = AL("HORIZONTAL", { name: "Notice", itemSpacing: 8, counterAxisAlignItems: "CENTER" }); n.paddingLeft = 8; c.appendChild(n);
          n.appendChild(icon("warning", 16, "text/danger"));
          const nt = TX("Mất kết nối mạng. Tin nhắn chưa gửi được cho đến khi có mạng lại.", "Body/Small", "text/ink-2"); n.appendChild(nt); fill(n); wrapText(nt);
        }
        const box = AL("HORIZONTAL", { name: "Box", itemSpacing: 4, counterAxisAlignItems: "MAX" });
        box.paddingLeft = box.paddingRight = 8; box.paddingTop = box.paddingBottom = 8;
        radius(box, "radius/composer"); box.fills = [paint("surface/surface")]; shadow(box, "Shadow/Composer"); stroke(box, "border/line-strong", 1);
        c.appendChild(box); box.layoutSizingHorizontal = "FILL";
        const clip = variant("Round Button", "Type=Ghost, State=Default");
        { const k = Object.keys(clip.componentProperties).find((x) => x.split("#")[0] === "Icon"); if (k) clip.setProperties({ [k]: iconComp("attach").id }); }
        box.appendChild(clip);
        const field = AL("HORIZONTAL", { name: "Field", counterAxisAlignItems: "CENTER" }); field.paddingLeft = field.paddingRight = 4; field.paddingTop = field.paddingBottom = 8;
        box.appendChild(field); field.layoutGrow = 1; field.layoutSizingHorizontal = "FILL"; field.layoutSizingVertical = "HUG";
        const t = TX(state === "Typing" ? "Hạn nộp hồ sơ quyết toán thuế TNDN là khi nào?" : "Hỏi GeoAgent", "Body/Input", state === "Typing" ? "text/ink" : "text/ink-2"); t.name = "Text";
        field.appendChild(t); wrapText(t);
        const mic = variant("Round Button", "Type=Ghost, State=Default");
        { const k = Object.keys(mic.componentProperties).find((x) => x.split("#")[0] === "Icon"); if (k) mic.setProperties({ [k]: iconComp("microphone").id }); }
        box.appendChild(mic);
        if (state === "Typing") box.appendChild(variant("Round Button", "Type=Send, State=Default"));
        comps.push(c);
      }
      makeSet(stage, "Composer", comps, "Composer.jsx. Ô nhập tự giãn tối đa 8 dòng.", { dir: "VERTICAL", gap: 24, align: "MIN" });
    }
  }

  // ---------- 10. Status Message ----------
  {
    const stage = block("Status Message", "Thông báo lỗi ngay tại chỗ, icon cảnh báo + chữ text/danger (đỏ trên nền sáng, đỏ nhạt trên nền tối, đều đạt 4.5:1). Send failed: dưới tin của người dùng, có nút Thử lại (tắt khi chưa có mạng). Login error: trên nút Đăng nhập (role=alert).", "ChatPane.jsx, Welcome.jsx");
    if (stage) {
      const comps = [];
      for (const type of ["Send failed", "Login error"]) {
        const c = comp(`Type=${type}`, "HORIZONTAL", { itemSpacing: 8, counterAxisAlignItems: "CENTER" });
        if (type === "Send failed") {
          c.appendChild(icon("warning", 14, "text/danger"));
          c.appendChild(T("Chưa gửi được: mất kết nối mạng.", 12, 16, "Regular", "text/danger"));
          const r = AL("HORIZONTAL", { name: "Retry", itemSpacing: 4, counterAxisAlignItems: "CENTER" }); r.paddingLeft = r.paddingRight = 8; r.counterAxisSizingMode = "FIXED"; r.resize(r.width, 32); c.appendChild(r);
          r.appendChild(icon("retry", 14, "text/danger")); r.appendChild(T("Thử lại", 12, 16, "Medium", "text/danger"));
        } else {
          c.counterAxisAlignItems = "MIN"; fixedWidth(c, 340);
          c.appendChild(icon("warning", 16, "text/danger"));
          const t = T("Không kết nối được máy chủ. Kiểm tra mạng rồi đăng nhập lại.", 14, 20, "Regular", "text/danger"); c.appendChild(t); wrapText(t);
        }
        comps.push(c);
      }
      makeSet(stage, "Status Message", comps, "Thông báo lỗi (gửi tin, đăng nhập). Dòng mất mạng nằm trong Composer / Offline.", { dir: "VERTICAL", gap: 16, align: "MIN" });
    }
  }

  // ---------- 11. Dialog ----------
  {
    const stage = block("Dialog", "Hộp thoại modal gốc (dialog showModal): khóa trang, giữ focus, Esc hoặc bấm ra ngoài để hủy, đóng xong trả focus về nút đã mở. Xóa: focus mặc định ở Hủy. Đổi tên (từ header): ô nhập chọn sẵn tên cũ, Enter để lưu.", "ConversationDialogs.jsx");
    if (stage) {
      const comps = [];
      for (const type of ["Delete", "Rename"]) {
        const c = comp(`Type=${type}`, "VERTICAL", { itemSpacing: 0 });
        pad(c, 20, 20); fixedWidth(c, 384); c.fills = [paint("surface/surface")]; stroke(c, "border/line"); radius(c, "radius/2xl"); shadow(c, "Shadow/Login card");
        const h = TX(type === "Delete" ? "Xóa phiên chat?" : "Đổi tên phiên chat", "Heading/Chat title"); c.appendChild(h); wrapText(h);
        const gap = (px) => { const g = figma.createFrame(); g.name = "Gap"; g.resize(1, px); g.fills = []; return g; };
        if (type === "Delete") {
          c.appendChild(gap(8));
          const d = TX("“Kiểm tra số dư tài khoản 131” và toàn bộ tin nhắn trong phiên sẽ bị xóa. Không thể hoàn tác.", "Body/Default", "text/ink-2"); c.appendChild(d); wrapText(d);
        } else {
          c.appendChild(gap(16));
          const inp = AL("HORIZONTAL", { name: "Input", counterAxisAlignItems: "CENTER" }); inp.paddingLeft = inp.paddingRight = 12;
          inp.counterAxisSizingMode = "FIXED"; inp.resize(inp.width, 44); radius(inp, "radius/xl"); stroke(inp, "state/focus", 2);
          c.appendChild(inp); inp.layoutSizingHorizontal = "FILL";
          const v = TX("Phân tích nghĩa vụ thuế 2025 so với 2024", "Body/Default"); inp.appendChild(v); oneLine(v);
        }
        c.appendChild(gap(20));
        const row = AL("HORIZONTAL", { name: "Actions", itemSpacing: 8, primaryAxisAlignItems: "MAX" }); c.appendChild(row); row.layoutSizingHorizontal = "FILL";
        row.appendChild(pill("Hủy", "secondary")); row.appendChild(pill(type === "Delete" ? "Xóa" : "Lưu", "primary"));
        comps.push(c);
      }
      makeSet(stage, "Dialog", comps, "Hộp thoại xóa / đổi tên phiên chat (DeleteDialog, RenameDialog).", { gap: 32, align: "MIN" });
    }
  }

  // ---------- 12. Empty State ----------
  {
    const stage = block("Empty State", "Phiên mới (bấm Cuộc trò chuyện mới): lời mời và 3 câu hỏi gợi ý về thuế/kế toán, bấm là gửi luôn. Câu hỏi đầu tiên thành tên phiên trong danh sách.", "ChatPane.jsx");
    if (stage) {
      const c = comp("Empty State", "VERTICAL", { itemSpacing: 20 });
      fixedWidth(c, 576);
      const head = AL("HORIZONTAL", { name: "Heading", itemSpacing: 12, counterAxisAlignItems: "CENTER" }); c.appendChild(head);
      head.appendChild(tryVariant("Bot Avatar", ["Size=36", "Size=28"]));
      head.appendChild(TX("Bạn cần GeoAgent hỗ trợ việc gì?", "Display/Welcome title"));
      for (const q of ["So sánh nghĩa vụ thuế TNDN năm 2025 với 2024", "Hạn nộp hồ sơ quyết toán thuế TNDN là khi nào?", "Giải thích cách tính thuế GTGT phải nộp theo phương pháp khấu trừ"]) {
        const s = AL("HORIZONTAL", { name: "Suggestion", counterAxisAlignItems: "CENTER" }); s.paddingLeft = s.paddingRight = 16; s.paddingTop = s.paddingBottom = 12;
        s.fills = [paint("surface/surface")]; stroke(s, "border/bubble-edge"); radius(s, "radius/2xl");
        c.appendChild(s); s.layoutSizingHorizontal = "FILL";
        const t = TX(q, "Body/Default"); s.appendChild(t); wrapText(t);
      }
      c.description = "Trạng thái rỗng của ChatPane (SUGGESTIONS).";
      stage.appendChild(c);
    }
  }

  // ---------- 13. Mẫu ghép ----------
  let patSec = root.findChild((n) => n.name === "06 Pattern");
  if (!patSec) {
    patSec = AL("VERTICAL", { name: "06 Pattern", itemSpacing: 48 }); patSec.paddingLeft = patSec.paddingRight = 96;
    root.appendChild(patSec); fill(patSec);
    const head = AL("VERTICAL", { name: "Section header", itemSpacing: 8 }); patSec.appendChild(head); fill(head);
    head.appendChild(T("06  Mẫu ghép", 32, 40, "Bold", "text/ink", "Plus Jakarta Sans"));
    const hd = T("Các component ghép thành màn hình thật: thẻ đăng nhập, sidebar và màn chat trên máy tính. Dùng làm điểm bắt đầu khi thiết kế màn mới.", 15, 24, "Regular", "text/ink-2");
    head.appendChild(hd); hd.textAutoResize = "HEIGHT"; hd.resize(880, hd.height);
    const rl = figma.createRectangle(); rl.resize(100, 1); rl.fills = [paint("border/line")]; head.appendChild(rl); rl.layoutSizingHorizontal = "FILL";

    const row = AL("HORIZONTAL", { name: "Screens", itemSpacing: 48, counterAxisAlignItems: "MIN", layoutWrap: "WRAP", counterAxisSpacing: 48 }); patSec.appendChild(row); fill(row);
    const label = (frame, text) => { const w = AL("VERTICAL", { name: text, itemSpacing: 12 }); w.appendChild(T(text, 16, 24, "Semi Bold")); w.appendChild(frame); row.appendChild(w); };

    // Thẻ đăng nhập trên nền đỏ
    const login = figma.createFrame(); login.name = "Login"; login.fills = [paint("sidebar/frame")];
    login.layoutMode = "VERTICAL"; login.primaryAxisSizingMode = "FIXED"; login.counterAxisSizingMode = "FIXED"; login.resize(560, 640);
    login.primaryAxisAlignItems = "CENTER"; login.counterAxisAlignItems = "CENTER"; login.cornerRadius = 16; login.clipsContent = true;
    const cardL = AL("VERTICAL", { name: "Welcome Card", itemSpacing: 0, counterAxisAlignItems: "CENTER" });
    cardL.paddingLeft = cardL.paddingRight = 40; cardL.paddingTop = 36; cardL.paddingBottom = 24;
    cardL.fills = [paint("surface/surface")]; radius(cardL, "radius/2xl"); shadow(cardL, "Shadow/Login card");
    login.appendChild(cardL); cardL.counterAxisSizingMode = "FIXED"; cardL.resize(420, cardL.height);
    cardL.appendChild(emblem(72));
    const gap = (h) => { const s = figma.createFrame(); s.name = "Gap"; s.resize(1, h); s.fills = []; return s; };
    cardL.appendChild(gap(20));
    const wt = TX("Chào mừng tới GeoAgent", "Display/Welcome title"); wt.textAlignHorizontal = "CENTER"; cardL.appendChild(wt);
    cardL.appendChild(gap(8));
    const ws = TX("Trợ lý AI cho nghiệp vụ thuế và kế toán.", "Body/Default", "text/ink-2"); ws.textAlignHorizontal = "CENTER"; cardL.appendChild(ws); wrapText(ws);
    cardL.appendChild(gap(28));
    const btn = variant("Button / Primary", "State=Default"); cardL.appendChild(btn); btn.layoutSizingHorizontal = "FILL";
    cardL.appendChild(gap(20));
    const foot = AL("HORIZONTAL", { name: "Footer", primaryAxisAlignItems: "CENTER", counterAxisAlignItems: "CENTER" }); foot.paddingTop = 16;
    foot.strokes = [paint("border/rule")]; foot.strokeTopWeight = 1; foot.strokeBottomWeight = 0; foot.strokeLeftWeight = 0; foot.strokeRightWeight = 0;
    cardL.appendChild(foot); fill(foot);
    const run = AL("HORIZONTAL", { name: "Powered by", itemSpacing: 6, counterAxisAlignItems: "CENTER" }); foot.appendChild(run);
    run.appendChild(TX("Vận hành trên", "Body/Small", "text/ink-2"));
    const gotix = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="56" height="24" viewBox="0 0 793 340"><path fill="#1d1416" d="M10,9 L34,9 L34,2 L2,2 L2,338 L34,338 L34,331 L10,331 Z"/><path fill="#1d1416" d="M783,331 L759,331 L759,338 L791,338 L791,2 L759,2 L759,9 L783,9 Z"/></svg>');
    gotix.name = "gotix"; gotix.fills = [];
    for (const v of gotix.findAll((x) => x.type === "VECTOR")) v.fills = [paint("text/ink")];
    const gw = T("gotix", 15.5, 24, "Black"); gw.letterSpacing = { unit: "PIXELS", value: -0.4 }; gotix.appendChild(gw);
    gw.x = Math.round((56 - gw.width) / 2); gw.y = 0;
    run.appendChild(gotix);
    label(login, "Đăng nhập");

    // Sidebar
    const side = AL("VERTICAL", { name: "Sidebar", itemSpacing: 0 }); side.fills = [paint("sidebar/frame")]; side.cornerRadius = 16; side.clipsContent = true;
    side.primaryAxisSizingMode = "FIXED"; side.counterAxisSizingMode = "FIXED"; side.resize(264, 760);
    const brand = AL("HORIZONTAL", { name: "Brand", itemSpacing: 12, counterAxisAlignItems: "CENTER" }); brand.paddingLeft = brand.paddingRight = 16;
    side.appendChild(brand); fill(brand); brand.counterAxisSizingMode = "FIXED"; brand.resize(264, 64);
    brand.appendChild(emblem(32));
    const bcol = AL("VERTICAL", { name: "Name" }); brand.appendChild(bcol);
    bcol.appendChild(TX("GeoAgent", "Heading/Brand", "sidebar/on-frame"));
    bcol.appendChild(TX("Trợ lý AI thông minh", "Caption/Default", "sidebar/on-frame-muted"));
    const nb = AL("HORIZONTAL", { name: "New chat", itemSpacing: 12, counterAxisAlignItems: "CENTER" }); nb.paddingLeft = 20; nb.paddingRight = 16;
    side.appendChild(nb); nb.counterAxisSizingMode = "FIXED"; nb.resize(nb.width, 36);
    nb.appendChild(icon("edit", 18, "sidebar/on-frame"));
    nb.appendChild(T("Cuộc trò chuyện mới", 13, 18, "Medium", "sidebar/on-frame"));
    const sw = AL("HORIZONTAL", { name: "Search" }); sw.paddingLeft = sw.paddingRight = 12; sw.paddingTop = 8; side.appendChild(sw); fill(sw);
    const sf = variant("Search Field", "State=Empty"); sw.appendChild(sf); sf.layoutSizingHorizontal = "FILL";
    const fw = AL("HORIZONTAL", { name: "Filter" }); fw.paddingLeft = 8; fw.paddingRight = 8; fw.paddingTop = 12; side.appendChild(fw); fill(fw);
    const fbar = compSec.findOne((n) => n.type === "COMPONENT" && n.name === "Filter Bar").createInstance(); fw.appendChild(fbar); fbar.layoutSizingHorizontal = "FILL";
    const list = AL("VERTICAL", { name: "List", itemSpacing: 2 }); list.paddingLeft = list.paddingRight = 8; list.paddingTop = list.paddingBottom = 8;
    side.appendChild(list); fill(list); list.layoutGrow = 1;
    const convs = [["Phân tích nghĩa vụ thuế 2025 so với 2024", "Selected", "No", true], ["Kiểm tra số dư tài khoản 131", "Default", "Yes", false], ["Kiểm thử bản cập nhật mới", "Default", "No", true], ["Hạn nộp hồ sơ quyết toán thuế TNDN", "Hover", "No", false]];
    for (const [topic, st, un, fav] of convs) { const it = variant("Conversation Item", `State=${st}, Unread=${un}`); setProp(it, "Topic", topic); setProp(it, "Favorite", fav); list.appendChild(it); it.layoutSizingHorizontal = "FILL"; }
    const me = AL("HORIZONTAL", { name: "User (mở Menu / Account)", itemSpacing: 12, counterAxisAlignItems: "CENTER" }); me.paddingLeft = me.paddingRight = 16; me.paddingTop = me.paddingBottom = 12;
    me.strokes = [paint("sidebar/divider")]; me.strokeTopWeight = 1; me.strokeBottomWeight = 0; me.strokeLeftWeight = 0; me.strokeRightWeight = 0;
    side.appendChild(me); fill(me);
    me.appendChild(avatar("Frame", 28, "N"));
    me.appendChild(T("Nguyễn Minh Quân", 13, 18, "Medium", "sidebar/on-frame"));
    label(side, "Sidebar");

    // Màn chat máy tính
    const app = AL("HORIZONTAL", { name: "Desktop chat", itemSpacing: 0 }); app.cornerRadius = 16; app.clipsContent = true;
    app.primaryAxisSizingMode = "FIXED"; app.counterAxisSizingMode = "FIXED"; app.resize(1280, 800);
    app.fills = [paint("surface/canvas")]; stroke(app, "border/rule");
    const s2 = side.clone(); s2.cornerRadius = 0; app.appendChild(s2); s2.layoutSizingVertical = "FILL";
    const pane = AL("VERTICAL", { name: "Chat pane", itemSpacing: 0 }); app.appendChild(pane); pane.layoutSizingHorizontal = "FILL"; pane.layoutSizingVertical = "FILL";
    const hdr = variant("Chat Header", "Device=Desktop"); pane.appendChild(hdr); hdr.layoutSizingHorizontal = "FILL";
    const msgs = AL("VERTICAL", { name: "Messages", itemSpacing: 32 }); msgs.paddingLeft = msgs.paddingRight = 72; msgs.paddingTop = 24; msgs.paddingBottom = 16;
    pane.appendChild(msgs); msgs.layoutSizingHorizontal = "FILL"; msgs.layoutSizingVertical = "FILL";
    const um = (compSec.findOne((n) => n.type === "COMPONENT" && n.name === "Message / User")).createInstance();
    msgs.appendChild(um); um.layoutAlign = "MAX";
    const bm = (compSec.findOne((n) => n.type === "COMPONENT" && n.name === "Message / Bot")).createInstance();
    msgs.appendChild(bm); bm.layoutSizingHorizontal = "FILL";
    const af = compSec.findOne((n) => n.type === "COMPONENT" && n.name === "Answer Footer").createInstance(); msgs.appendChild(af); af.layoutSizingHorizontal = "FILL";
    const ti = (compSec.findOne((n) => n.type === "COMPONENT" && n.name === "Typing Indicator")).createInstance(); msgs.appendChild(ti);
    const cw = AL("HORIZONTAL", { name: "Composer area" }); cw.paddingLeft = cw.paddingRight = 72; cw.paddingTop = 8; cw.paddingBottom = 20;
    pane.appendChild(cw); cw.layoutSizingHorizontal = "FILL";
    const cp = variant("Composer", "State=Empty"); cw.appendChild(cp); cp.layoutSizingHorizontal = "FILL";
    const appWrap = AL("VERTICAL", { name: "Màn chat (máy tính)", itemSpacing: 12 }); appWrap.appendChild(T("Màn chat (máy tính)", 16, 24, "Semi Bold")); appWrap.appendChild(app);
    patSec.appendChild(appWrap);
    log.push("+ Mẫu ghép: Đăng nhập, Sidebar, Màn chat");

    // ===== Điện thoại (375 × 812, iPhone có tai thỏ): theo code mobile của app
    if (!FX["Shadow/Drawer"]) {
      const e = figma.createEffectStyle(); e.name = "Shadow/Drawer"; e.description = "Ngăn kéo danh sách trên điện thoại (8px 0 32px, 18%)";
      e.effects = [{ type: "DROP_SHADOW", color: { r: 29 / 255, g: 20 / 255, b: 22 / 255, a: 0.18 }, offset: { x: 8, y: 0 }, radius: 32, spread: 0, visible: true, blendMode: "NORMAL" }];
      FX["Shadow/Drawer"] = e;
    }
    const W = 375, H = 812, SAFE_TOP = 47, SAFE_BOTTOM = 34;
    const phone = (name, bg) => {
      const f = figma.createFrame(); f.name = name;
      f.layoutMode = "VERTICAL"; f.primaryAxisSizingMode = "FIXED"; f.counterAxisSizingMode = "FIXED"; f.resize(W, H);
      f.fills = [paint(bg)]; f.cornerRadius = 40; f.clipsContent = true; stroke(f, "border/line");
      return f;
    };
    // Thanh trạng thái iOS nằm trong vùng lề an toàn trên (code: pt-[var(--safe-top)])
    const statusBar = (onDark) => {
      const s = AL("HORIZONTAL", { name: "Status bar (safe area)", primaryAxisAlignItems: "SPACE_BETWEEN", counterAxisAlignItems: "CENTER" });
      s.paddingLeft = 36; s.paddingRight = 28; s.counterAxisSizingMode = "FIXED"; s.resize(W, SAFE_TOP); s.primaryAxisSizingMode = "FIXED";
      const ink = onDark ? "sidebar/on-frame" : "text/ink";
      s.appendChild(T("9:41", 16, 20, "Semi Bold", ink));
      const bat = figma.createFrame(); bat.name = "Battery"; bat.resize(25, 12); bat.cornerRadius = 4; bat.fills = []; stroke(bat, ink, 1);
      const lvl = figma.createRectangle(); lvl.resize(19, 8); lvl.x = 3; lvl.y = 2; lvl.cornerRadius = 2; lvl.fills = [paint(ink)]; bat.appendChild(lvl);
      s.appendChild(bat);
      return s;
    };
    const homeBar = (onDark) => {
      const h = AL("HORIZONTAL", { name: "Home indicator (safe area)", primaryAxisAlignItems: "CENTER", counterAxisAlignItems: "MAX" });
      h.paddingBottom = 8; h.counterAxisSizingMode = "FIXED"; h.resize(W, SAFE_BOTTOM); h.primaryAxisSizingMode = "FIXED";
      const pill = figma.createRectangle(); pill.name = "Pill"; pill.resize(134, 5); pill.cornerRadius = 3; pill.fills = [paint(onDark ? "sidebar/on-frame" : "text/ink")];
      h.appendChild(pill);
      return h;
    };

    const mRow = AL("HORIZONTAL", { name: "Mobile screens", itemSpacing: 48, counterAxisAlignItems: "MIN", layoutWrap: "WRAP", counterAxisSpacing: 48 });
    const mWrap = AL("VERTICAL", { name: "Điện thoại", itemSpacing: 12 }); patSec.appendChild(mWrap); fill(mWrap);
    mWrap.appendChild(T("Điện thoại (375 × 812)", 20, 28, "Semi Bold"));
    const mNote = T("Dưới 768 px: sidebar thành ngăn kéo mở từ nút menu; header chỉ có nút menu, cuộc trò chuyện mới và ⋮ nổi trên dải mờ. Lề an toàn trên 47 px và dưới 34 px (iPhone có tai thỏ). Trên iPhone thật chữ hiển thị bằng SF Pro (code dùng -apple-system); bản vẽ dùng Inter.", 14, 22, "Regular", "text/ink-2");
    mWrap.appendChild(mNote); mNote.textAutoResize = "HEIGHT"; mNote.resize(880, mNote.height);
    mWrap.appendChild(mRow); fill(mRow);
    const mLabel = (frame, text) => { const w = AL("VERTICAL", { name: text, itemSpacing: 12 }); w.appendChild(T(text, 16, 24, "Semi Bold")); w.appendChild(frame); mRow.appendChild(w); };

    // 1. Đăng nhập: thẻ rộng 100% − 32px, lề trong 24px (px-6)
    const mLogin = phone("Mobile / Login", "sidebar/frame");
    mLogin.appendChild(statusBar(true));
    const mBody = AL("VERTICAL", { name: "Body", primaryAxisAlignItems: "CENTER", counterAxisAlignItems: "CENTER" });
    mLogin.appendChild(mBody); mBody.layoutSizingHorizontal = "FILL"; mBody.layoutSizingVertical = "FILL";
    const mCard = cardL.clone(); mBody.appendChild(mCard);
    mCard.paddingLeft = mCard.paddingRight = 24; mCard.resize(W - 32, mCard.height);
    mLogin.appendChild(homeBar(true));
    mLabel(mLogin, "Đăng nhập (điện thoại)");

    // 2. Màn chat: header điện thoại, tin nhắn lề 16 (px-4), bóng bot lề 16/14, ô soạn lề 32 (px-8)
    const buildMobileChat = (name) => {
      const f = phone(name, "surface/canvas");
      const top = statusBar(false); top.fills = [paint("surface/surface")]; f.appendChild(top);
      const h = variant("Chat Header", "Device=Mobile"); f.appendChild(h); h.layoutSizingHorizontal = "FILL";
      const ms = AL("VERTICAL", { name: "Messages", itemSpacing: 32 }); ms.paddingLeft = ms.paddingRight = 16; ms.paddingTop = 16; ms.paddingBottom = 0;
      f.appendChild(ms); ms.layoutSizingHorizontal = "FILL"; ms.layoutSizingVertical = "FILL"; ms.clipsContent = true;
      const u = compSec.findOne((n) => n.type === "COMPONENT" && n.name === "Message / User").createInstance();
      ms.appendChild(u); u.layoutAlign = "MAX";
      u.resize(Math.round((W - 32) * 0.85), u.height); // tối đa 85% cột (max-w-[85%])
      const b = compSec.findOne((n) => n.type === "COMPONENT" && n.name === "Message / Bot").createInstance();
      ms.appendChild(b); b.layoutSizingHorizontal = "FILL";
      const af2 = compSec.findOne((n) => n.type === "COMPONENT" && n.name === "Answer Footer").createInstance(); ms.appendChild(af2); af2.layoutSizingHorizontal = "FILL";
      const bub = b.findOne((n) => n.name === "Bubble"); if (bub) { bub.paddingLeft = bub.paddingRight = 16; bub.paddingTop = bub.paddingBottom = 14; }
      const cw2 = AL("HORIZONTAL", { name: "Composer area" }); cw2.paddingLeft = cw2.paddingRight = 32; cw2.paddingTop = 12; cw2.paddingBottom = 12;
      f.appendChild(cw2); cw2.layoutSizingHorizontal = "FILL";
      const c2 = variant("Composer", "State=Empty"); cw2.appendChild(c2); c2.layoutSizingHorizontal = "FILL";
      f.appendChild(homeBar(false));
      return f;
    };
    const mChat = buildMobileChat("Mobile / Chat");
    mLabel(mChat, "Màn chat (điện thoại)");

    // 3. Ngăn kéo: rộng 86% (tối đa 340), lớp phủ 40%, bóng 8px 0 32px, có nút đóng
    const mDrawer = buildMobileChat("Mobile / Drawer open");
    const scrim = figma.createRectangle(); scrim.name = "Scrim"; scrim.fills = [paint("surface/scrim")];
    mDrawer.appendChild(scrim); scrim.layoutPositioning = "ABSOLUTE"; scrim.x = 0; scrim.y = 0; scrim.resize(W, H);
    const dr = side.clone(); dr.name = "Drawer"; dr.cornerRadius = 0;
    mDrawer.appendChild(dr); dr.layoutPositioning = "ABSOLUTE"; dr.x = 0; dr.y = 0; dr.resize(Math.min(340, Math.round(W * 0.86)), H);
    dr.paddingTop = SAFE_TOP; dr.paddingBottom = SAFE_BOTTOM; shadow(dr, "Shadow/Drawer");
    const dBrand = dr.findChild((n) => n.name === "Brand");
    if (dBrand) {
      dBrand.layoutSizingHorizontal = "FILL";
      const nm = dBrand.findChild((n) => n.name === "Name"); if (nm) nm.layoutSizingHorizontal = "FILL";
      const close = AL("HORIZONTAL", { name: "Close (Đóng danh sách hội thoại)", primaryAxisAlignItems: "CENTER", counterAxisAlignItems: "CENTER" });
      fixed(close, 40, 40); radius(close, "radius/full");
      close.appendChild(icon("close", 20, "sidebar/on-frame-muted")); dBrand.appendChild(close);
    }
    mLabel(mDrawer, "Danh sách mở (ngăn kéo)");
    log.push("+ Điện thoại: Đăng nhập, Màn chat, Ngăn kéo");

    // Giao diện tối: bản sao các màn điện thoại, đặt mode Dark cho bộ GeoAgent / Semantic
    if (DARK_STATUS.modeId) {
      const darkRow = AL("HORIZONTAL", { name: "Mobile screens (dark)", itemSpacing: 48, counterAxisAlignItems: "MIN", layoutWrap: "WRAP", counterAxisSpacing: 48 });
      mWrap.appendChild(T("Giao diện tối", 16, 24, "Semi Bold")); mWrap.appendChild(darkRow); fill(darkRow);
      for (const [src, label] of [[mLogin, "Đăng nhập (tối)"], [mChat, "Màn chat (tối)"], [mDrawer, "Ngăn kéo (tối)"]]) {
        const f = src.clone(); f.name = src.name + " (dark)";
        try { f.setExplicitVariableModeForCollection(DARK_STATUS.collection, DARK_STATUS.modeId); }
        catch (e) { DARK_STATUS.error = "Không đặt được mode Dark cho khung: " + (e.message || e); }
        const w = AL("VERTICAL", { name: label, itemSpacing: 12 }); w.appendChild(T(label, 16, 24, "Semi Bold")); w.appendChild(f); darkRow.appendChild(w);
      }
      log.push("+ Điện thoại (tối)");
    }
  }

  // Cách dùng trong code (React + Tailwind) ghi vào mô tả từng component: dev mở Inspect là thấy
  for (const [name, doc] of Object.entries(REACT_DOC)) {
    for (const n of root.findAll((x) => (x.type === "COMPONENT_SET" || (x.type === "COMPONENT" && x.parent.type !== "COMPONENT_SET")) && x.name === name)) n.description = doc;
  }

  await tiers(root, V, vars, paint, T);
  await linkStyles();
  figma.viewport.scrollAndZoomIntoView([root]);
  return { report: await qa(page, root, await figma.variables.getLocalVariablesAsync()), tokens: await exportTokens() };
}

// Icon thêm vào bộ icon sau lần dựng đầu (lấy từ public/geoagent-icons/*.svg). Plugin tạo component nếu file Figma chưa có.
// Icon đã bỏ khỏi bộ icon (src/improved/icon-data.js): plugin xóa component tương ứng trong Figma
const ICON_REMOVED = ["phone"];
const ICON_SVG = {
  "filter": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#000000\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 5h20\"></path><path d=\"M6 12h12\"></path><path d=\"M9 19h6\"></path></svg>",
  "unread": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#000000\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12.7 3H4a2 2 0 0 0-2 2v16.286a.71.71 0 0 0 1.212.502l2.202-2.202A2 2 0 0 1 6.828 19H20a2 2 0 0 0 2-2v-4.7\"></path><circle cx=\"19\" cy=\"6\" r=\"3\"></circle></svg>",
  "rename": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#000000\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\"></path><path d=\"m15 5 4 4\"></path></svg>",
  "delete": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#000000\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10 11v6\"></path><path d=\"M14 11v6\"></path><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\"></path><path d=\"M3 6h18\"></path><path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"></path></svg>",
  "sign-out": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#000000\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m16 17 5-5-5-5\"></path><path d=\"M21 12H9\"></path><path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"></path></svg>"
};

// ---------- Figma ↔ code ----------
// Kiểu chữ Figma → class Tailwind. Chỉ các mục có key trong TEXT_KEY được xuất thành token typography.
const TEXT_KEY = {
  "Display/Welcome title": "display", "Heading/Brand": "wordmark", "Heading/Chat title": "title", "Heading/Message heading": "message-heading",
  "Body/Message": "message", "Body/Bubble": "bubble", "Body/Input": "input", "Label/Button": "button", "Body/Small": "small",
};
const TEXT_CODE = Object.assign(
  Object.fromEntries(Object.entries(TEXT_KEY).map(([k, v]) => [k, (k === "Heading/Brand" ? "font-heading " : "") + "text-" + v])),
  { "Body/Default": "text-sm", "Label/List title": "text-sm font-medium", "Label/List title unread": "text-sm font-unread (650; Figma dùng 600)", "Label/Small": "text-small font-medium", "Caption/Default": "text-xs", "Caption/Table head": "text-xs font-medium" }
);
const EFFECT_CODE = { "Shadow/Composer": "composer", "Shadow/Bot bubble": "bubble", "Shadow/Floating button": "float", "Shadow/Login card": "card", "Shadow/Drawer": "drawer" };
const RADIUS_ORDER = ["lg", "xl", "2xl", "bubble", "bubble-tip", "composer"];
const RADIUS_DESC = { lg: "rounded-lg: nút icon, chọn ngôn ngữ", xl: "rounded-xl: nút chính", "2xl": "rounded-2xl: thẻ đăng nhập, mục sidebar", bubble: "Bong bóng tin", "bubble-tip": "Góc nhọn của bong bóng (phía người gửi)", composer: "Ô soạn tin" };

const REACT_DOC = {
  "Icon Button": "React: <IconButton label=\"Mở danh sách hội thoại\" tone=\"sheet\"><MenuIcon /></IconButton> (src/improved/components/ui.jsx).\nTone=Sheet → tone=\"sheet\" (mặc định, trên nền trắng) · Tone=Frame → tone=\"frame\" (trên sidebar đỏ).\nState chỉ là trạng thái CSS (hover, focus-visible), không phải prop. Icon: đổi bằng component icon tương ứng trong icons.jsx.",
  "Button / Primary": "Markup trong Welcome.jsx: <button data-login-button className=\"flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-button-primary-bg text-button text-button-primary-label hover:bg-button-primary-bg-hover active:bg-button-primary-bg-pressed\"><SignInIcon size={18} />Đăng nhập</button>",
  "Round Button": "Composer.jsx. Type=Send: size-10 rounded-full bg-composer-send-bg text-composer-send-icon hover:bg-composer-send-bg-hover. Type=Ghost: nút đính kèm và micro (size-10 rounded-full text-composer-icon hover:bg-composer-icon-bg-hover hover:text-composer-icon-hover).",
  "Scroll Button": "ChatPane.jsx › <ScrollButton label=\"Lên đầu hội thoại\" onClick={fn} disabled={atTop}><ChevronUp /></ScrollButton>. size-9 rounded-full border-scroll-button-border bg-scroll-button-bg shadow-float; ẩn khi disabled. Chỉ trên máy tính.",
  "Avatar": "React: <Avatar name=\"Nguyễn Minh Quân\" size={28} tone=\"frame\" /> (ui.jsx).\nTone=Red/Amber/Teal/Violet: KHÔNG truyền tone, code tự chọn theo chữ cái đầu tên.\nTone=Frame → tone=\"frame\" (trên sidebar đỏ) · Tone=Selected → tone=\"selected\" · Size → size={…}.",
  "Bot Avatar": "React: <BotAvatar size={28} /> (ui.jsx). Nền bg-bot-avatar-bg, icon AssistantIcon màu text-bot-avatar-icon, cỡ icon = 68% avatar.",
  "Conversation Item": "Sidebar.jsx (li.group/item > button[data-id] + PopupMenu ⋮). text-small; Default: text-sidebar-item-text hover:bg-sidebar-item-bg-hover; Selected (aria-current): bg-sidebar-item-bg-selected text-sidebar-item-text-selected; Unread: font-unread + chấm bg-sidebar-unread-dot; Favorite: <FavoriteIcon size={14} fill=\"currentColor\" />. Nút ⋮ hiện khi hover/focus-within (cảm ứng luôn hiện).",
  "Search Field": "Sidebar.jsx (label > input type=search). h-9 pointer-coarse:h-10 rounded-full border-search-border bg-search-bg px-4 text-small; focus-within:border-search-border-focus focus-within:ring-1. Nút xóa chỉ hiện khi có chữ; Esc xóa.",
  "Menu Item": "PopupMenu.jsx: items=[{ key, label, Icon, onSelect, role?, checked? }]. Mục min-h-9 pointer-coarse:min-h-11 rounded-lg px-2.5 text-sm font-medium focus:bg-menu-item-bg-hover; icon size-4 text-menu-text-muted; Checked → role=\"menuitemradio\" aria-checked + CheckIcon.",
  "Menu / Filter": "<FilterMenu options={FILTER_OPTIONS} value={filter} onChange={setFilter} /> (FilterMenu.jsx, dựng trên PopupMenu). Popover .popup-menu: min-w-44 rounded-xl border-menu-border bg-menu-bg p-1 shadow-float.",
  "Menu / Conversation": "<PopupMenu label=\"Tùy chọn cho phiên …\" icon={<MoreIcon />} items={conversationActions(c, { selected, canDelete, onUpdate, onRename, onDelete })} />, dùng ở Sidebar.jsx (từng phiên) và ChatPane.jsx (header).",
  "Menu / Account": "Settings.jsx: nút avatar + tên mở bảng; fieldset Giao diện (radio accent-menu-accent) và nút Đăng xuất (onLogout → Root.jsx về màn đăng nhập).",
  "Filter Bar": "Sidebar.jsx: <p aria-live=\"polite\" className=\"text-small font-medium text-sidebar-text-muted\">{nhãn}</p> + <FilterMenu … />.",
  "Chat Header": "ChatPane.jsx (header absolute, pointer-events-none). Dải mờ: bg-linear-to-b from-chat-header-fade from-40% to-chat-header-fade/0. Nút: IconButton menu (điện thoại), IconButton Cuộc trò chuyện mới (điện thoại), PopupMenu ⋮ (actions của phiên đang mở). h1#chat-title là sr-only.",
  "Composer": "React: <Composer onSend={(text) => …} placeholder=\"Hỏi GeoAgent\" offline={!online} /> (Composer.jsx). Khung min-h-14 rounded-composer border-composer-border bg-composer-bg pl-4 shadow-composer; ô nhập text-input tự giãn tối đa 8 dòng; nút gửi hiện khi có chữ. Offline: dòng role=status text-chat-notice-text + icon text-chat-notice-icon.",
  "Message / User": "ChatPane.jsx. Bóng: rounded-bubble rounded-br-bubble-tip bg-message-user-bg px-4 py-2.5 text-bubble; tối đa 75% (máy tính), 85% (điện thoại). Dưới bóng: giờ text-message-user-meta + <Avatar size={22} />; m.status === \"failed\" thì thay bằng Status Message / Send failed.",
  "Message / Bot": "ChatPane.jsx + <MessageContent blocks={[{ type: \"h\" | \"p\" | \"ul\" | \"table\" | \"hr\", … }]} onOpenLink={…} />. Thẻ: rounded-bubble rounded-tl-bubble-tip border-message-bot-border bg-message-bot-bg shadow-bubble; dưới thẻ là <AnswerFooter />.",
  "Answer Footer": "AnswerFooter.jsx: <AnswerFooter blocks={m.blocks} title={topic} onOpenLink={openLink} />. Chữ text-answer-meta, link text-answer-source-link; nút icon size-9 (cảm ứng size-11), icon size-5, aria-label + title.",
  "Status Message": "Send failed: ChatPane.jsx (text-message-user-error, nút Thử lại gọi onRetry). Login error: Welcome.jsx prop error (role=alert, text-login-card-error).",
  "Dialog": "ConversationDialogs.jsx: <DeleteDialog target={{ id, topic }} onConfirm={…} onDone={…} /> · <RenameDialog target={…} onSave={…} onDone={…} />. <dialog closedby=\"any\"> showModal; w-[min(24rem,calc(100vw-2rem))] rounded-2xl border-menu-border bg-menu-bg p-5 shadow-card.",
  "Empty State": "ChatPane.jsx khi conversation.messages.length === 0: h2 text-display + 3 nút gợi ý (SUGGESTIONS) gọi onSend(câu hỏi).",
  "Typing Indicator": "ChatPane.jsx (prop typing). 3 chấm size-1.5 bg-chat-typing-dot animate-blink lệch 200ms; role=status; motion-reduce:animate-none.",
  "Data Table": "MessageContent block: { type: \"table\", head: [\"Loại thuế\", …], rows: [[…]] }. Đầu cột text-xs font-medium text-table-head-text border-b border-table-head-border; hàng text-sm border-b border-table-row-border; cột số căn phải tabular-nums."
};

// Xuất token theo đúng cấu trúc tokens/geoagent.tokens.json (chuẩn W3C DTCG) để chạy npm run tokens
async function exportTokens() {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const all = await figma.variables.getLocalVariablesAsync();
  const byId = {}; for (const v of all) byId[v.id] = v;
  const prim = findCol(cols, "global"), sem = findCol(cols, "alias"), compCol = findCol(cols, "component"), size = cols.find((c) => c.name === "GeoAgent / Size");
  const hex = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
  const r4 = (x) => Math.round(x * 10000) / 10000, r3 = (x) => Math.round(x * 1000) / 1000;
  const color = (c) => (c.a == null || c.a >= 0.9995 ? hex(c) : { colorSpace: "srgb", components: [r4(Math.round(c.r * 255) / 255), r4(Math.round(c.g * 255) / 255), r4(Math.round(c.b * 255) / 255)], alpha: r3(c.a), hex: hex(c) });
  const set = (obj, path, val) => { const k = path.split("/"); let o = obj; for (const p of k.slice(0, -1)) o = o[p] = o[p] || {}; o[k[k.length - 1]] = val; };
  const css = (v) => { const m = (v.codeSyntax.WEB || "").match(/var\((--[^)]+)\)/); return m ? m[1] : null; };
  const T = { $description: "GeoAgent design tokens (chuẩn W3C DTCG), 3 tầng: global (mã màu) → alias (vai trò, có bản sáng/tối ở $extensions.geoagent.dark) → component (bộ phận của component, trỏ về alias). Sửa file này hoặc xuất lại từ plugin Figma, rồi chạy `npm run tokens`.", global: {}, alias: {}, component: {}, radius: {}, typography: {}, fontWeight: {}, shadow: {} };
  for (const id of prim ? prim.variableIds : []) {
    const v = byId[id];
    set(T.global, v.name, { $type: "color", $value: color(Object.values(v.valuesByMode)[0]), $extensions: { geoagent: { css: css(v) || "--" + v.name.replace("/", "-"), figma: v.name } } });
  }
  for (const id of sem ? sem.variableIds : []) {
    const v = byId[id];
    if (v.resolvedType !== "COLOR") continue;
    const val = Object.values(v.valuesByMode)[0];
    const target = val && val.type === "VARIABLE_ALIAS" ? byId[val.id] : null;
    const tok = { $type: "color", $value: target ? "{global." + target.name.replace("/", ".") + "}" : color(val) };
    if (v.description) tok.$description = v.description;
    tok.$extensions = { geoagent: { css: css(v), figma: v.name } };
    // Bản tối: lấy từ mode Dark nếu có; gói Figma không cho thêm mode thì lấy từ bảng token của plugin
    const darkMode = sem.modes.find((m) => m.name === "Dark");
    const dv = darkMode ? v.valuesByMode[darkMode.modeId] : null;
    const darkName = dv && dv.type === "VARIABLE_ALIAS" && byId[dv.id] ? byId[dv.id].name : SEMANTIC_DARK[v.name];
    if (darkName) tok.$extensions.geoagent.dark = "{global." + darkName.replace("/", ".") + "}";
    set(T.alias, v.name, tok);
  }
  // Tầng 3 · Component: mỗi biến trỏ về một alias
  for (const id of compCol ? compCol.variableIds : []) {
    const v = byId[id];
    if (v.resolvedType !== "COLOR") continue;
    const val = Object.values(v.valuesByMode)[0];
    const target = val && val.type === "VARIABLE_ALIAS" ? byId[val.id] : null;
    if (!target) continue;
    const tok = { $type: "color", $value: "{alias." + target.name.replace("/", ".") + "}" };
    const desc = (v.description || "").split(" · trỏ về ")[0];
    if (desc) tok.$description = desc;
    tok.$extensions = { geoagent: { css: css(v) || "--" + v.name.replace("/", "-"), figma: v.name } };
    set(T.component, v.name, tok);
  }
  const radii = {};
  for (const id of size ? size.variableIds : []) { const v = byId[id]; if (v.name.indexOf("radius/") === 0) radii[v.name.split("/")[1]] = Object.values(v.valuesByMode)[0]; }
  for (const k of RADIUS_ORDER) if (radii[k] != null) T.radius[k] = { $type: "dimension", $value: radii[k] + "px", $description: RADIUS_DESC[k], $extensions: { geoagent: { tailwind: "rounded-" + k, figma: "radius/" + k } } };
  const WEIGHT = { Regular: 400, Medium: 500, "Semi Bold": 600, SemiBold: 600, Bold: 700 };
  const styles = await figma.getLocalTextStylesAsync();
  for (const [figmaName, key] of Object.entries(TEXT_KEY)) {
    const s = styles.find((x) => x.name === figmaName); if (!s) continue;
    const lh = s.lineHeight.unit === "PIXELS" ? s.lineHeight.value + "px" : s.lineHeight.unit === "PERCENT" ? r4(s.lineHeight.value / 100) : "normal";
    const value = { fontFamily: s.fontName.family, fontWeight: WEIGHT[s.fontName.style] || 400, fontSize: s.fontSize + "px", lineHeight: lh };
    if (s.letterSpacing && s.letterSpacing.value) value.letterSpacing = (s.letterSpacing.unit === "PERCENT" ? r4(s.letterSpacing.value / 100) + "em" : s.letterSpacing.value + "px");
    T.typography[key] = { $type: "typography", $value: value, $description: (s.description || "").split(" · Code:")[0], $extensions: { geoagent: { tailwind: "text-" + key, figma: figmaName, weightInTailwind: value.fontWeight !== 400 } } };
  }
  T.fontWeight.unread = { $type: "fontWeight", $value: 650, $description: "Tên hội thoại chưa đọc (Inter biến thiên; Figma dùng Semi Bold 600 vì không có 650)", $extensions: { geoagent: { tailwind: "font-unread", figma: "Label/List title unread" } } };
  const effects = await figma.getLocalEffectStylesAsync();
  for (const [figmaName, key] of Object.entries(EFFECT_CODE)) {
    const s = effects.find((x) => x.name === figmaName); if (!s) continue;
    T.shadow[key] = {
      $type: "shadow",
      $value: s.effects.filter((e) => e.type === "DROP_SHADOW").map((e) => ({ color: color(e.color), offsetX: e.offset.x + "px", offsetY: e.offset.y + "px", blur: e.radius + "px", spread: (e.spread || 0) + "px" })),
      $description: (s.description || "").split(" · Code:")[0],
      $extensions: { geoagent: { tailwind: "shadow-" + key, figma: figmaName } },
    };
  }
  return JSON.stringify(T, null, 2) + "\n";
}

// ---------- Token hai tầng: Primitive (mã màu) ← Semantic (vai trò, alias) ----------
// Đổi màu cho dự án khác: chỉ sửa giá trị trong "GeoAgent / Global". Alias và Component tự theo.
// Mã màu lấy đúng từ src/index.css và code component; không màu nào trên màn hình bị đổi.
// <token-data> SINH TỰ ĐỘNG bởi npm run tokens từ tokens/geoagent.tokens.json. Không sửa tay.
const TOKEN_DATA = {"primitives":[["base/white","#ffffff"],["red/50","#f8e3e1"],["red/100","#f8e2da"],["red/150","#f6dcd6"],["red/200","#f5d6d0"],["red/250","#f2cfc6"],["red/400","#e39a90"],["red/600","#ae2f33"],["red/700","#a3141a"],["red/750","#8a1c22"],["red/800","#8a1218"],["red/850","#85101a"],["red/900","#741015"],["ember/100","#f1e3dd"],["ember/150","#ecd6cf"],["ember/200","#f2bcb7"],["ember/250","#dcbdb5"],["ember/350","#ee8079"],["ember/450","#a2635a"],["ember/550","#d1353b"],["ember/600","#c62a31"],["ember/700","#a51d23"],["ember/750","#74463f"],["ember/850","#661d21"],["ember/880","#561217"],["ember/900","#4b2022"],["ember/920","#4a2224"],["ember/950","#400b10"],["rose/700","#7a4b47"],["warm/25","#fff7f0"],["warm/50","#fcf8f7"],["warm/100","#f6f1ee"],["warm/150","#f5f1ee"],["warm/200","#f0e9e6"],["warm/250","#eee6e2"],["warm/300","#e7dfdb"],["warm/350","#e7ddd8"],["warm/400","#d9cdc8"],["warm/500","#9a8f8c"],["warm/550","#958884"],["warm/700","#6b5f5c"],["warm/950","#1d1416"],["night/50","#f5ece7"],["night/300","#b9aba6"],["night/500","#8a7b76"],["night/650","#4a3c36"],["night/700","#403430"],["night/750","#362b28"],["night/800","#2e2421"],["night/900","#211916"],["night/950","#17110f"],["gold/100","#f6ecd6"],["gold/200","#f0d595"],["gold/400","#e9b84a"],["gold/800","#6e4a08"],["gold/900","#45361b"],["gold/950","#3d1205"],["blue/300","#79a6ff"],["blue/600","#1a5fd6"],["teal/50","#e3eef0"],["teal/200","#aadbe3"],["teal/800","#1f5560"],["teal/900","#1d3a40"],["violet/50","#ece6f3"],["violet/200","#d2c4ec"],["violet/800","#4e3a6e"],["violet/900","#362b49"],["alpha/warm-25-a15","#fff7f0",0.15],["alpha/warm-25-a16","#fff7f0",0.16],["alpha/warm-950-a40","#1d1416",0.4],["alpha/warm-950-a35","#1d1416",0.35],["alpha/warm-25-a35","#fff7f0",0.35],["alpha/warm-25-a50","#fff7f0",0.5],["alpha/black-a55","#000000",0.55]],"semantic":[{"name":"brand/brand","light":"red/700","dark":"ember/600","css":"--brand","desc":"Màu thương hiệu: nút chính, nút gửi, chấm danh sách"},{"name":"brand/brand-hover","light":"red/800","dark":"ember/550","css":"--brand-hover","desc":"Nút chính khi rê chuột"},{"name":"brand/brand-pressed","light":"red/900","dark":"ember/700","css":"--brand-pressed","desc":"Nút chính khi nhấn"},{"name":"brand/brand-soft","light":"red/200","dark":"ember/900","css":"--brand-soft","desc":"Bong bóng tin của người dùng"},{"name":"brand/gold","light":"gold/400","dark":"gold/400","css":"--gold","desc":"Vàng nhấn: tab đang chọn, chấm chưa đọc, icon trợ lý"},{"name":"brand/gold-ink","light":"gold/950","dark":"gold/950","css":"--gold-ink","desc":"Chữ trên nền vàng"},{"name":"sidebar/frame","light":"red/700","dark":"ember/880","css":"--frame","desc":"Nền sidebar và màn đăng nhập"},{"name":"sidebar/frame-hover","light":"red/600","dark":"ember/850","css":"--frame-hover","desc":"Mục sidebar khi rê chuột"},{"name":"sidebar/frame-active","light":"warm/25","dark":"ember/100","css":"--frame-active","desc":"Mục sidebar đang chọn (viên trắng ấm)"},{"name":"sidebar/frame-sunken","light":"red/850","dark":"ember/950","css":"--frame-sunken","desc":"Ô tìm kiếm trên nền đỏ"},{"name":"sidebar/frame-edge","light":"red/400","dark":"ember/450","css":"--frame-edge","desc":"Viền ô tìm kiếm, vạch kéo sidebar"},{"name":"sidebar/on-frame","light":"warm/25","dark":"night/50","css":"--on-frame","desc":"Chữ chính trên nền đỏ"},{"name":"sidebar/on-frame-muted","light":"red/250","dark":"ember/250","css":"--on-frame-muted","desc":"Chữ phụ trên nền đỏ"},{"name":"sidebar/on-frame-muted-strong","light":"red/100","dark":"ember/150","css":"--on-frame-muted-strong","desc":"Chữ phụ khi rê chuột"},{"name":"sidebar/on-frame-active-muted","light":"rose/700","dark":"ember/750","css":"--on-frame-active-muted","desc":"Chữ phụ trong mục đang chọn"},{"name":"sidebar/divider","light":"alpha/warm-25-a15","dark":"alpha/warm-25-a15","css":"--divider","desc":"Đường kẻ trên nền đỏ"},{"name":"sidebar/on-frame-active","light":"red/700","dark":"red/700","css":"--on-frame-active","desc":"Chữ trên viên sáng của mục đang chọn (tên, chữ cái avatar)"},{"name":"sidebar/scrollbar","light":"alpha/warm-25-a50","dark":"alpha/warm-25-a50","css":"--scrollbar-frame","desc":"Thanh cuộn trên sidebar đỏ"},{"name":"surface/surface","light":"base/white","dark":"night/900","css":"--surface","desc":"Nền trắng: header, thẻ, ô soạn tin, bóng bot"},{"name":"surface/surface-2","light":"warm/150","dark":"night/800","css":"--surface-2","desc":"Nền nút trung tính khi rê chuột"},{"name":"surface/canvas","light":"warm/50","dark":"night/950","css":"--canvas","desc":"Nền vùng hội thoại"},{"name":"surface/panel","light":"warm/100","dark":"night/800","css":"--panel","desc":"Nút tròn trong ô soạn tin khi rê chuột"},{"name":"surface/panel-hover","light":"warm/250","dark":"night/750","css":"--panel-hover","desc":"Panel khi rê chuột"},{"name":"surface/panel-active","light":"warm/350","dark":"night/700","css":"--panel-active","desc":"Panel khi nhấn"},{"name":"surface/scrim","light":"alpha/warm-950-a40","dark":"alpha/black-a55","css":"--scrim","desc":"Lớp phủ sau ngăn kéo trên điện thoại"},{"name":"surface/scrollbar","light":"alpha/warm-950-a35","dark":"alpha/warm-25-a35","css":"--scrollbar","desc":"Thanh cuộn trên nền sáng/tối"},{"name":"text/ink","light":"warm/950","dark":"night/50","css":"--ink","desc":"Chữ chính"},{"name":"text/ink-2","light":"warm/700","dark":"night/300","css":"--ink-2","desc":"Chữ phụ, icon trung tính, giờ gửi"},{"name":"text/link","light":"red/700","dark":"ember/350","css":"--link","desc":"Chữ link trong tin nhắn (luôn kèm gạch chân)"},{"name":"text/on-brand","light":"base/white","dark":"base/white","css":"--on-brand","desc":"Chữ và icon trên nền thương hiệu (nút chính, nút gửi)"},{"name":"text/danger","light":"red/700","dark":"ember/350","css":"--danger","desc":"Chữ báo lỗi (gửi thất bại, đăng nhập thất bại, mất mạng)"},{"name":"border/line","light":"warm/300","dark":"night/700","css":"--line","desc":"Viền nhạt: nút cuộn, đầu bảng"},{"name":"border/rule","light":"warm/200","dark":"night/800","css":"--rule","desc":"Đường kẻ: header, hàng bảng, phân cách"},{"name":"border/line-strong","light":"warm/550","dark":"night/500","css":"--line-strong","desc":"Viền điều khiển (ô soạn tin), 3,42:1 trên trắng"},{"name":"border/bubble-edge","light":"warm/400","dark":"night/650","css":"--bubble-edge","desc":"Viền bóng tin của bot"},{"name":"state/focus","light":"blue/600","dark":"blue/300","css":"--focus","desc":"Viền focus bàn phím"},{"name":"state/offline","light":"warm/500","dark":"night/500","css":"--status-offline","desc":"Chấm trạng thái trên avatar"},{"name":"avatar/red-bg","light":"red/50","dark":"ember/920","css":"--avatar-red-bg","desc":"Avatar sắc 1 (nền)"},{"name":"avatar/red-fg","light":"red/750","dark":"ember/200","css":"--avatar-red-fg","desc":"Avatar sắc 1 (chữ)"},{"name":"avatar/amber-bg","light":"gold/100","dark":"gold/900","css":"--avatar-amber-bg","desc":"Avatar sắc 2 (nền)"},{"name":"avatar/amber-fg","light":"gold/800","dark":"gold/200","css":"--avatar-amber-fg","desc":"Avatar sắc 2 (chữ)"},{"name":"avatar/teal-bg","light":"teal/50","dark":"teal/900","css":"--avatar-teal-bg","desc":"Avatar sắc 3 (nền)"},{"name":"avatar/teal-fg","light":"teal/800","dark":"teal/200","css":"--avatar-teal-fg","desc":"Avatar sắc 3 (chữ)"},{"name":"avatar/violet-bg","light":"violet/50","dark":"violet/900","css":"--avatar-violet-bg","desc":"Avatar sắc 4 (nền)"},{"name":"avatar/violet-fg","light":"violet/800","dark":"violet/200","css":"--avatar-violet-fg","desc":"Avatar sắc 4 (chữ)"},{"name":"avatar/selected-bg","light":"red/150","dark":"red/150","css":"--avatar-selected-bg","desc":"Avatar trong mục sidebar đang chọn"},{"name":"avatar/frame-bg","light":"alpha/warm-25-a16","dark":"alpha/warm-25-a16","css":"--avatar-frame-bg","desc":"Avatar trên sidebar đỏ: trắng ấm 16%"}],"component":[{"name":"focus/ring","alias":"state/focus","css":"--focus-ring","desc":"Viền focus bàn phím trên nền sáng"},{"name":"app/bg","alias":"surface/surface","css":"--app-bg","desc":"Nền ứng dụng"},{"name":"app/text","alias":"text/ink","css":"--app-text","desc":"Chữ mặc định của ứng dụng"},{"name":"sidebar/bg","alias":"sidebar/frame","css":"--sidebar-bg","desc":"Nền sidebar"},{"name":"sidebar/text","alias":"sidebar/on-frame","css":"--sidebar-text","desc":"Chữ chính trên sidebar"},{"name":"sidebar/text-muted","alias":"sidebar/on-frame-muted","css":"--sidebar-text-muted","desc":"Chữ phụ trên sidebar"},{"name":"sidebar/icon","alias":"sidebar/on-frame-muted","css":"--sidebar-icon","desc":"Icon trên sidebar"},{"name":"sidebar/item-bg-hover","alias":"sidebar/frame-hover","css":"--sidebar-item-bg-hover","desc":"Nền mục khi rê chuột"},{"name":"sidebar/item-bg-selected","alias":"sidebar/frame-active","css":"--sidebar-item-bg-selected","desc":"Nền mục đang chọn"},{"name":"sidebar/item-text","alias":"sidebar/on-frame","css":"--sidebar-item-text","desc":"Chữ tên phiên chat (đã đọc); sáng hơn nhãn bộ lọc"},{"name":"sidebar/item-text-selected","alias":"sidebar/on-frame-active","css":"--sidebar-item-text-selected","desc":"Chữ mục đang chọn"},{"name":"sidebar/divider","alias":"sidebar/divider","css":"--sidebar-divider","desc":"Đường kẻ trên sidebar"},{"name":"sidebar/focus-ring","alias":"sidebar/on-frame","css":"--sidebar-focus-ring","desc":"Viền focus trên sidebar"},{"name":"sidebar/unread-dot","alias":"brand/gold","css":"--sidebar-unread-dot","desc":"Chấm chưa đọc"},{"name":"sidebar/item-action-icon","alias":"sidebar/on-frame-muted","css":"--sidebar-item-action-icon","desc":"Icon nút tùy chọn (⋮) của phiên chat"},{"name":"sidebar/item-action-icon-selected","alias":"sidebar/on-frame-active-muted","css":"--sidebar-item-action-icon-selected","desc":"Icon nút tùy chọn trên phiên đang chọn"},{"name":"sidebar/item-action-bg-hover-selected","alias":"avatar/selected-bg","css":"--sidebar-item-action-bg-hover-selected","desc":"Nền nút tùy chọn khi rê chuột, trên phiên đang chọn"},{"name":"search/bg","alias":"sidebar/frame-sunken","css":"--search-bg","desc":"Nền ô tìm kiếm"},{"name":"search/border","alias":"sidebar/frame-edge","css":"--search-border","desc":"Viền ô tìm kiếm"},{"name":"search/border-focus","alias":"sidebar/on-frame","css":"--search-border-focus","desc":"Viền khi đang gõ"},{"name":"search/text","alias":"sidebar/on-frame","css":"--search-text","desc":"Chữ đang gõ"},{"name":"search/placeholder","alias":"sidebar/on-frame-muted","css":"--search-placeholder","desc":"Chữ gợi ý"},{"name":"chat/bg","alias":"surface/canvas","css":"--chat-bg","desc":"Nền vùng hội thoại và header kính mờ"},{"name":"chat/typing-dot","alias":"text/ink-2","css":"--chat-typing-dot","desc":"Chấm “đang trả lời”"},{"name":"chat/header-fade","alias":"surface/canvas","css":"--chat-header-fade","desc":"Dải mờ dần phía trên: tin nhắn cuộn lên nhạt dần rồi biến mất"},{"name":"chat/notice-text","alias":"text/ink-2","css":"--chat-notice-text","desc":"Dòng báo mất kết nối phía trên ô soạn tin"},{"name":"chat/notice-icon","alias":"text/danger","css":"--chat-notice-icon","desc":"Icon cảnh báo của dòng báo mất kết nối"},{"name":"message-user/bg","alias":"brand/brand-soft","css":"--message-user-bg","desc":"Bong bóng tin người dùng"},{"name":"message-user/meta","alias":"text/ink-2","css":"--message-user-meta","desc":"Giờ gửi"},{"name":"message-user/error","alias":"text/danger","css":"--message-user-error","desc":"Tin chưa gửi được"},{"name":"message-bot/bg","alias":"surface/surface","css":"--message-bot-bg","desc":"Thẻ tin của bot"},{"name":"message-bot/border","alias":"border/bubble-edge","css":"--message-bot-border","desc":"Viền thẻ tin bot"},{"name":"message-bot/sender","alias":"text/ink","css":"--message-bot-sender","desc":"Tên người gửi"},{"name":"message-bot/meta","alias":"text/ink-2","css":"--message-bot-meta","desc":"Giờ gửi"},{"name":"content/text","alias":"text/ink","css":"--content-text","desc":"Chữ câu trả lời"},{"name":"content/strong","alias":"text/ink","css":"--content-strong","desc":"Chữ đậm"},{"name":"content/link","alias":"text/link","css":"--content-link","desc":"Link (luôn gạch chân)"},{"name":"content/bullet","alias":"brand/brand","css":"--content-bullet","desc":"Chấm đầu dòng"},{"name":"content/divider","alias":"border/rule","css":"--content-divider","desc":"Đường phân cách giữa các mục"},{"name":"table/head-text","alias":"text/ink-2","css":"--table-head-text","desc":"Đầu cột"},{"name":"table/head-border","alias":"border/line","css":"--table-head-border","desc":"Kẻ dưới đầu cột"},{"name":"table/row-border","alias":"border/rule","css":"--table-row-border","desc":"Kẻ giữa các hàng"},{"name":"table/cell-text","alias":"text/ink","css":"--table-cell-text","desc":"Ô dữ liệu"},{"name":"composer/bg","alias":"surface/surface","css":"--composer-bg","desc":"Nền ô soạn tin"},{"name":"composer/border","alias":"border/line-strong","css":"--composer-border","desc":"Viền ô soạn tin"},{"name":"composer/placeholder","alias":"text/ink-2","css":"--composer-placeholder","desc":"Chữ gợi ý"},{"name":"composer/icon","alias":"text/ink-2","css":"--composer-icon","desc":"Icon đính kèm, micro"},{"name":"composer/icon-hover","alias":"text/ink","css":"--composer-icon-hover","desc":"Icon khi rê chuột"},{"name":"composer/icon-bg-hover","alias":"surface/panel","css":"--composer-icon-bg-hover","desc":"Nền nút tròn khi rê chuột"},{"name":"composer/fade","alias":"surface/canvas","css":"--composer-fade","desc":"Dải mờ phía sau ô soạn tin"},{"name":"composer/send-bg","alias":"brand/brand","css":"--composer-send-bg","desc":"Nút gửi"},{"name":"composer/send-bg-hover","alias":"brand/brand-hover","css":"--composer-send-bg-hover","desc":"Nút gửi khi rê chuột"},{"name":"composer/send-icon","alias":"text/on-brand","css":"--composer-send-icon","desc":"Icon nút gửi"},{"name":"button-primary/bg","alias":"brand/brand","css":"--button-primary-bg","desc":"Nút chính"},{"name":"button-primary/bg-hover","alias":"brand/brand-hover","css":"--button-primary-bg-hover","desc":"Khi rê chuột"},{"name":"button-primary/bg-pressed","alias":"brand/brand-pressed","css":"--button-primary-bg-pressed","desc":"Khi nhấn"},{"name":"button-primary/label","alias":"text/on-brand","css":"--button-primary-label","desc":"Chữ và icon"},{"name":"button-secondary/border","alias":"border/line-strong","css":"--button-secondary-border","desc":"Viền nút phụ"},{"name":"button-secondary/text","alias":"text/ink","css":"--button-secondary-text","desc":"Chữ nút phụ"},{"name":"button-secondary/bg-hover","alias":"surface/surface-2","css":"--button-secondary-bg-hover","desc":"Nền khi rê chuột"},{"name":"icon-button/icon","alias":"text/ink-2","css":"--icon-button-icon","desc":"Icon"},{"name":"icon-button/icon-hover","alias":"text/ink","css":"--icon-button-icon-hover","desc":"Icon khi rê chuột"},{"name":"icon-button/bg-hover","alias":"surface/surface-2","css":"--icon-button-bg-hover","desc":"Nền khi rê chuột"},{"name":"scroll-button/bg","alias":"surface/surface","css":"--scroll-button-bg","desc":"Nền nút cuộn"},{"name":"scroll-button/border","alias":"border/line","css":"--scroll-button-border","desc":"Viền"},{"name":"scroll-button/icon","alias":"text/ink-2","css":"--scroll-button-icon","desc":"Icon"},{"name":"scroll-button/icon-hover","alias":"text/ink","css":"--scroll-button-icon-hover","desc":"Icon khi rê chuột"},{"name":"menu/bg","alias":"surface/surface","css":"--menu-bg","desc":"Nền bảng Cài đặt"},{"name":"menu/border","alias":"border/line","css":"--menu-border","desc":"Viền"},{"name":"menu/text","alias":"text/ink","css":"--menu-text","desc":"Chữ"},{"name":"menu/text-muted","alias":"text/ink-2","css":"--menu-text-muted","desc":"Chữ phụ, tiêu đề nhóm"},{"name":"menu/item-bg-hover","alias":"surface/surface-2","css":"--menu-item-bg-hover","desc":"Mục khi rê chuột"},{"name":"menu/accent","alias":"brand/brand","css":"--menu-accent","desc":"Ô chọn (radio)"},{"name":"login-card/bg","alias":"surface/surface","css":"--login-card-bg","desc":"Thẻ đăng nhập"},{"name":"login-card/text","alias":"text/ink","css":"--login-card-text","desc":"Chữ"},{"name":"login-card/text-muted","alias":"text/ink-2","css":"--login-card-text-muted","desc":"Chữ phụ"},{"name":"login-card/divider","alias":"border/rule","css":"--login-card-divider","desc":"Đường kẻ chân thẻ"},{"name":"login-card/error","alias":"text/danger","css":"--login-card-error","desc":"Thông báo đăng nhập thất bại"},{"name":"avatar/status","alias":"state/offline","css":"--avatar-status","desc":"Chấm trạng thái"},{"name":"avatar/status-ring","alias":"surface/surface","css":"--avatar-status-ring","desc":"Viền quanh chấm trạng thái"},{"name":"bot-avatar/bg","alias":"sidebar/frame","css":"--bot-avatar-bg","desc":"Nền avatar trợ lý"},{"name":"bot-avatar/icon","alias":"brand/gold","css":"--bot-avatar-icon","desc":"Icon trợ lý"},{"name":"web-pane/bg","alias":"surface/surface","css":"--web-pane-bg","desc":"Khung web (máy tính)"},{"name":"web-pane/frame-bg","alias":"surface/surface-2","css":"--web-pane-frame-bg","desc":"Nền vùng trang nhúng"},{"name":"web-pane/border","alias":"border/rule","css":"--web-pane-border","desc":"Đường kẻ ngăn"},{"name":"web-pane/text","alias":"text/ink","css":"--web-pane-text","desc":"Chữ"},{"name":"web-pane/text-muted","alias":"text/ink-2","css":"--web-pane-text-muted","desc":"Chữ phụ"},{"name":"web-pane/card-bg","alias":"surface/surface","css":"--web-pane-card-bg","desc":"Thẻ tóm tắt"},{"name":"web-pane/card-border","alias":"border/line","css":"--web-pane-card-border","desc":"Viền thẻ tóm tắt"},{"name":"overlay/scrim","alias":"surface/scrim","css":"--overlay-scrim","desc":"Lớp phủ sau ngăn kéo"},{"name":"answer/meta","alias":"text/ink-2","css":"--answer-meta","desc":"Chân câu trả lời: lưu ý kiểm tra, nhãn nguồn"},{"name":"answer/source-link","alias":"text/link","css":"--answer-source-link","desc":"Link nguồn ở chân câu trả lời"}]};
// </token-data>
// Bảng token sinh từ tokens/geoagent.tokens.json (npm run tokens). Bản tối: SEMANTIC_DARK.
const PRIMITIVES = TOKEN_DATA.primitives; // [tên, hex, alpha?]
const SEMANTIC_TO_PRIMITIVE = Object.fromEntries(TOKEN_DATA.semantic.map((s) => [s.name, s.light]));
const SEMANTIC_DARK = Object.fromEntries(TOKEN_DATA.semantic.map((s) => [s.name, s.dark]));
const SEMANTIC_INFO = Object.fromEntries(TOKEN_DATA.semantic.map((s) => [s.name, s]));
const rgbOf = (hex, a) => { const h = hex.replace("#", ""); return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: a == null ? 1 : a }; };
const hexStr = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
// Giá trị cuối cùng của một biến màu, đi theo chuỗi alias
async function resolveColor(v) {
  let val = Object.values(v.valuesByMode)[0], guard = 0;
  while (val && val.type === "VARIABLE_ALIAS" && guard++ < 10) {
    const next = await figma.variables.getVariableByIdAsync(val.id);
    val = next ? Object.values(next.valuesByMode)[0] : null;
  }
  return val;
}

// Trạng thái mode Dark, dùng cho mẫu ghép, tự kiểm tra và xuất file
const DARK_STATUS = { collection: null, modeId: null, error: null };

// 3 tầng biến màu. Tìm bộ biến theo tên mới hoặc tên cũ, rồi đổi sang tên mới (giữ nguyên ID nên không đứt liên kết).
const COL = {
  global: { name: "GeoAgent / Global", old: ["GeoAgent / Primitives"] },
  alias: { name: "GeoAgent / Alias", old: ["GeoAgent / Semantic", "GeoAgent / Color"] },
  component: { name: "GeoAgent / Component", old: [] },
};
const findCol = (cols, tier, rename = false) => {
  const c = cols.find((x) => x.name === COL[tier].name || COL[tier].old.indexOf(x.name) >= 0);
  if (c && rename && c.name !== COL[tier].name) c.name = COL[tier].name;
  return c || null;
};

async function prepareTokens(V, vars) {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const sem = findCol(cols, "alias", true);
  if (sem.modes[0].name !== "Light") sem.renameMode(sem.modes[0].modeId, "Light");
  let prim = findCol(cols, "global", true);
  if (!prim) { prim = figma.variables.createVariableCollection(COL.global.name); prim.renameMode(prim.modes[0].modeId, "Value"); log.push("+ bộ Global"); }
  const pm = prim.modes[0].modeId;
  const P = {};
  for (const v of vars) if (v.variableCollectionId === prim.id) P[v.name] = v;
  for (const [name, hex, a] of PRIMITIVES) {
    let v = P[name];
    if (!v) { v = figma.variables.createVariable(name, prim, "COLOR"); P[name] = v; vars.push(v); }
    v.setValueForMode(pm, rgbOf(hex, a));
    v.scopes = []; // ẩn khỏi bộ chọn màu: component chỉ gắn vào tầng Semantic
    v.description = "Tầng 1 (primitive): chỉ sửa ở đây khi đổi màu cho dự án khác." + (/^(night|ember)\//.test(name) ? " Dùng cho giao diện tối." : "");
    v.setVariableCodeSyntax("WEB", "var(--" + name.replace("/", "-") + ")");
  }
  // Mode Dark. Gói Figma giới hạn số mode mỗi bộ biến: không thêm được thì bản tối chỉ có trong code và file xuất.
  let dark = sem.modes.find((m) => m.name === "Dark");
  if (!dark) {
    try { sem.addMode("Dark"); dark = sem.modes.find((m) => m.name === "Dark"); log.push("+ mode Dark"); }
    catch (e) { DARK_STATUS.error = e && e.message ? e.message : String(e); }
  }
  DARK_STATUS.collection = sem;
  DARK_STATUS.modeId = dark ? dark.modeId : null;
  // Màu vai trò mới trong file token (vd. sidebar/on-frame-active, thanh cuộn): tạo và trỏ thẳng về màu gốc
  const sm = sem.modes[0].modeId;
  for (const info of TOKEN_DATA.semantic) {
    if (V[info.name]) continue;
    const v = figma.variables.createVariable(info.name, sem, "COLOR");
    v.scopes = /on-frame-active$|(^text\/)|-fg$|ink/.test(info.name) ? ["TEXT_FILL"] : ["FRAME_FILL", "SHAPE_FILL"];
    v.description = info.desc;
    v.setVariableCodeSyntax("WEB", "var(" + info.css + ")");
    v.setValueForMode(sm, { type: "VARIABLE_ALIAS", id: P[info.light].id });
    V[info.name] = v; vars.push(v);
    log.push("+ biến " + info.name);
  }
  // Tầng 3 · Component: bộ biến riêng, mỗi biến trỏ về một alias (sáng/tối theo mode của bộ Alias).
  // Tên có thể trùng alias (vd. sidebar/divider) nên giữ trong COMP_VARS, không ghi vào V.
  let comp = findCol(cols, "component", true);
  if (!comp) { comp = figma.variables.createVariableCollection(COL.component.name); comp.renameMode(comp.modes[0].modeId, "Value"); log.push("+ bộ Component"); }
  const cm = comp.modes[0].modeId;
  for (const v of vars) if (v.variableCollectionId === comp.id) COMP_VARS[v.name] = v;
  let made = 0;
  for (const info of TOKEN_DATA.component || []) {
    const target = V[info.alias];
    if (!target) continue;
    let v = COMP_VARS[info.name];
    if (!v) { v = figma.variables.createVariable(info.name, comp, "COLOR"); COMP_VARS[info.name] = v; vars.push(v); made++; }
    const part = info.name.split("/")[1];
    v.scopes = /(^|-)bg(-|$)|tile$|scrim|fade|dot|indicator/.test(part) ? ["FRAME_FILL", "SHAPE_FILL"]
      : /(border|divider|ring)/.test(part) ? ["STROKE_COLOR"]
      : ["TEXT_FILL", "SHAPE_FILL"];
    v.description = info.desc + " · trỏ về " + info.alias;
    v.setVariableCodeSyntax("WEB", "var(" + info.css + ")");
    v.setValueForMode(cm, { type: "VARIABLE_ALIAS", id: target.id });
  }
  if (made) log.push("+ " + made + " biến Component");
  // Biến Component đã bỏ khỏi file token (vd. tab/*, composer/icon*, select/bg-hover, chat/header-border): xóa khỏi Figma
  const keep = new Set((TOKEN_DATA.component || []).map((c) => c.name));
  const stale = Object.keys(COMP_VARS).filter((n) => !keep.has(n));
  for (const n of stale) { COMP_VARS[n].remove(); delete COMP_VARS[n]; }
  if (stale.length) log.push("- " + stale.length + " biến Component cũ (" + stale.join(", ") + ")");
}
const COMP_VARS = {};

async function tiers(root, V, vars, paint, T) {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const sem = findCol(cols, "alias", true);
  const prim = findCol(cols, "global", true); // đã tạo trong prepareTokens
  const pm = prim.modes[0].modeId;
  const P = {};
  for (const v of vars) if (v.variableCollectionId === prim.id) P[v.name] = v; // đã tạo/cập nhật trong prepareTokens
  // Semantic → alias. Kiểm tra trước: giá trị cũ phải trùng mã màu primitive, để màu trên màn hình không đổi.
  const sm = sem.modes[0].modeId;
  const mismatch = [];
  for (const [sName, pName] of Object.entries(SEMANTIC_TO_PRIMITIVE)) {
    const s = V[sName], p = P[pName];
    if (!s) { mismatch.push(sName + " (không có)"); continue; }
    const cur = s.valuesByMode[sm];
    if (cur && cur.type !== "VARIABLE_ALIAS") {
      const target = Object.values(p.valuesByMode)[0];
      const d = Math.max(Math.abs(cur.r - target.r), Math.abs(cur.g - target.g), Math.abs(cur.b - target.b), Math.abs((cur.a == null ? 1 : cur.a) - (target.a == null ? 1 : target.a)));
      if (d > 0.6 / 255) { mismatch.push(sName + " " + hexStr(cur) + " ≠ " + pName + " " + hexStr(target)); continue; }
    }
    s.setValueForMode(sm, { type: "VARIABLE_ALIAS", id: p.id });
  }
  if (mismatch.length) throw new Error("Không đổi sang alias vì lệch màu: " + mismatch.join("; "));
  log.push("~ " + Object.keys(SEMANTIC_TO_PRIMITIVE).length + " biến semantic → alias của " + PRIMITIVES.length + " primitive");
  // Bản tối: mỗi biến vai trò trỏ về màu gốc của giao diện tối
  if (DARK_STATUS.modeId) {
    let n = 0;
    for (const [sName, pName] of Object.entries(SEMANTIC_DARK)) {
      const s = V[sName], p = P[pName];
      if (s && p) { s.setValueForMode(DARK_STATUS.modeId, { type: "VARIABLE_ALIAS", id: p.id }); n++; }
    }
    log.push("~ mode Dark: " + n + " biến");
  }

  // Bảng primitive trên trang (mục 01, đầu tiên): mỗi ô ghi biến semantic nào đang dùng nó
  const colorSec = root.findChild((n) => n.name === "01 Color");
  if (!colorSec) return;
  const old = colorSec.findChild((n) => n.name === "Group primitives"); if (old) old.remove();
  const usedBy = {};
  for (const [s, p] of Object.entries(SEMANTIC_TO_PRIMITIVE)) (usedBy[p] = usedBy[p] || []).push(s.split("/")[1]);
  const AL = (dir, o) => { const f = figma.createFrame(); f.layoutMode = dir; f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "AUTO"; f.fills = []; for (const k of Object.keys(o || {})) f[k] = o[k]; return f; };
  const grp = AL("VERTICAL", { name: "Group primitives", itemSpacing: 16 });
  colorSec.insertChild(1, grp); grp.layoutSizingHorizontal = "FILL";
  grp.appendChild(T("Tầng 1 · Global (mã màu gốc)", 16, 24, "Semi Bold"));
  const note = T("Chỉ tầng này chứa mã màu. Tầng 2 · Alias trỏ về đây và có bản Light/Dark; tầng 3 · Component (bộ biến GeoAgent / Component) trỏ về Alias, và code component dùng tầng 3. Làm dự án khác: nhân bản file, sửa mã màu ở tầng 1 (ví dụ red/700 là màu thương hiệu), mọi màn hình tự đổi theo. Global bị ẩn khỏi bộ chọn màu để không gắn nhầm.", 14, 22, "Regular", "text/ink-2");
  grp.appendChild(note); note.textAutoResize = "HEIGHT"; note.resize(880, note.height);
  const families = [];
  for (const [name] of PRIMITIVES) { const f = name.split("/")[0]; if (families.indexOf(f) < 0) families.push(f); }
  for (const fam of families) {
    const row = AL("HORIZONTAL", { name: "Family " + fam, itemSpacing: 8, counterAxisSpacing: 8, layoutWrap: "WRAP" });
    grp.appendChild(row); row.layoutSizingHorizontal = "FILL";
    for (const [name, hex, a] of PRIMITIVES.filter((x) => x[0].split("/")[0] === fam)) {
      const card = AL("VERTICAL", { name, itemSpacing: 0 }); card.fills = [paint("surface/surface")]; card.cornerRadius = 10; card.clipsContent = true;
      card.strokes = [paint("border/rule")]; card.strokeWeight = 1;
      row.appendChild(card); card.counterAxisSizingMode = "FIXED"; card.resize(148, card.height);
      const sw = figma.createRectangle(); sw.name = "Swatch"; sw.resize(148, 48);
      const bound = figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", P[name]);
      sw.fills = a != null && a < 1 ? [paint(name.indexOf("950") > 0 ? "surface/surface" : "sidebar/frame"), bound] : [bound];
      card.appendChild(sw); sw.layoutSizingHorizontal = "FILL";
      const meta = AL("VERTICAL", { name: "Meta", itemSpacing: 1 }); meta.paddingLeft = meta.paddingRight = 8; meta.paddingTop = 6; meta.paddingBottom = 8;
      card.appendChild(meta); meta.layoutSizingHorizontal = "FILL";
      const nm = T(name, 12, 16, "Semi Bold"); meta.appendChild(nm); nm.layoutSizingHorizontal = "FILL"; nm.textAutoResize = "HEIGHT";
      meta.appendChild(T(hex.toUpperCase() + (a != null && a < 1 ? " " + Math.round(a * 100) + "%" : ""), 11, 14, "Regular", "text/ink-2"));
      const u = T(usedBy[name] ? "→ " + usedBy[name].join(", ") : "→ (chưa dùng)", 11, 14, "Regular", "text/ink-2");
      meta.appendChild(u); u.layoutSizingHorizontal = "FILL"; u.textAutoResize = "HEIGHT";
    }
  }
  const t2 = T("Tầng 2 · Alias (vai trò, có Light/Dark)", 16, 24, "Semi Bold"); t2.name = "Tier 2 label";
  const oldT2 = colorSec.findChild((n) => n.name === "Tier 2 label"); if (oldT2) oldT2.remove();
  colorSec.insertChild(2, t2);
}

// ---------- Tự kiểm tra ----------
async function qa(page, root, vars) {
  const out = [];
  const fail = (group, msg) => out.push("✗ [" + group + "] " + msg);
  const pass = (group, msg) => out.push("✓ [" + group + "] " + msg);
  const path = (n) => { const p = []; let x = n; while (x && x !== root && p.length < 5) { p.unshift(x.name); x = x.parent; } return p.join(" › "); };
  const byId = {};
  for (const v of vars) byId[v.id] = v;

  // 1. Đủ thành phần
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const colN = (n) => { const c = cols.find((x) => x.name === n); return c ? c.variableIds.length : 0; };
  const semCol = findCol(cols, "alias"), primCol = findCol(cols, "global"), compCol = findCol(cols, "component");
  (colN(COL.global.name) === PRIMITIVES.length ? pass : fail)("Token", "Tầng 1 Global: " + colN(COL.global.name) + " màu (cần " + PRIMITIVES.length + ")");
  (colN(COL.alias.name) === Object.keys(SEMANTIC_TO_PRIMITIVE).length ? pass : fail)("Token", "Tầng 2 Alias: " + colN(COL.alias.name) + " biến (cần " + Object.keys(SEMANTIC_TO_PRIMITIVE).length + ")");
  const compNeed = (TOKEN_DATA.component || []).length;
  (colN(COL.component.name) === compNeed ? pass : fail)("Token", "Tầng 3 Component: " + colN(COL.component.name) + " biến (cần " + compNeed + ")");
  const aliasIds = new Set(semCol ? semCol.variableIds : []);
  const compBad = vars.filter((v) => compCol && v.variableCollectionId === compCol.id).filter((v) => { const x = Object.values(v.valuesByMode)[0]; return !(x && x.type === "VARIABLE_ALIAS" && aliasIds.has(x.id)); });
  (compBad.length ? fail : pass)("Token", compBad.length ? "Component chưa trỏ về alias: " + compBad.map((v) => v.name).slice(0, 6).join(", ") : "Mọi biến Component đều trỏ về Alias");
  (colN("GeoAgent / Size") === 13 ? pass : fail)("Token", "Bo góc + khoảng cách: " + colN("GeoAgent / Size") + " biến (cần 13)");
  const primIds = new Set(primCol ? primCol.variableIds : []);
  const notAlias = vars.filter((v) => semCol && v.variableCollectionId === semCol.id && v.resolvedType === "COLOR").filter((v) => { const x = Object.values(v.valuesByMode)[0]; return !(x && x.type === "VARIABLE_ALIAS" && primIds.has(x.id)); });
  (notAlias.length ? fail : pass)("Token", notAlias.length ? "Semantic còn mã màu cứng: " + notAlias.map((v) => v.name).slice(0, 8).join(", ") : "Mọi biến semantic đều là alias của primitive");
  const visibleP = vars.filter((v) => primIds.has(v.id) && v.scopes.length);
  (visibleP.length ? fail : pass)("Token", visibleP.length ? "Primitive chưa ẩn khỏi bộ chọn: " + visibleP.map((v) => v.name).join(", ") : "Primitive đã ẩn khỏi bộ chọn màu");
  let direct = 0;
  for (const n of root.findAll((x) => "fills" in x || "strokes" in x)) {
    if (n.parent && n.parent.name && /^Family /.test(n.parent.name)) continue;
    if (n.name === "Swatch" && n.parent && n.parent.parent && /^Family /.test(n.parent.parent.name)) continue; // ô mẫu của bảng primitive
    for (const key of ["fills", "strokes"]) {
      const arr = Array.isArray(n[key]) ? n[key] : [];
      for (const p of arr) if (p.boundVariables && p.boundVariables.color && primIds.has(p.boundVariables.color.id)) { direct++; if (direct <= 5) fail("Token", "Gắn thẳng vào primitive: " + path(n)); }
    }
  }
  if (!direct) pass("Token", "Không node nào gắn thẳng vào primitive (chỉ qua semantic)");
  // Mode Dark
  if (DARK_STATUS.modeId) {
    const sem2 = findCol(cols, "alias");
    const darkId = DARK_STATUS.modeId;
    const missing = vars.filter((v) => sem2 && v.variableCollectionId === sem2.id && v.resolvedType === "COLOR").filter((v) => { const x = v.valuesByMode[darkId]; return !(x && x.type === "VARIABLE_ALIAS" && primIds.has(x.id)); });
    (missing.length ? fail : pass)("Token", missing.length ? "Mode Dark còn biến chưa trỏ về màu gốc: " + missing.map((v) => v.name).slice(0, 6).join(", ") : "Mode Dark: mọi biến vai trò trỏ về màu gốc của giao diện tối");
  } else {
    out.push("• [Token] Chưa có mode Dark trong Figma" + (DARK_STATUS.error ? " (" + DARK_STATUS.error + ")" : "") + ". Bản tối vẫn có trong code và trong tokens.json xuất từ plugin.");
  }
  if (DARK_STATUS.error && DARK_STATUS.modeId) out.push("• [Token] " + DARK_STATUS.error);
  const fb = vars.find((v) => v.name === "avatar/frame-bg"); const fbv = fb && (await resolveColor(fb));
  (fbv && Math.abs(fbv.a - 0.16) < 0.01 ? pass : fail)("Nền tảng", "avatar/frame-bg giữ độ trong suốt 16%" + (fbv ? " (a=" + fbv.a.toFixed(2) + ")" : ""));
  const nTs = (await figma.getLocalTextStylesAsync()).length; (nTs >= 14 ? pass : fail)("Nền tảng", nTs + " kiểu chữ (cần 14)");
  const nFx = (await figma.getLocalEffectStylesAsync()).length; (nFx >= 5 ? pass : fail)("Nền tảng", nFx + " đổ bóng (cần 5, gồm bóng ngăn kéo)");
  const nIcons = root.findAll((n) => n.type === "COMPONENT" && n.name.indexOf("Icon/") === 0).length;
  const iconNeed = 39 + Object.keys(ICON_SVG).length - ICON_REMOVED.length;
  (nIcons === iconNeed ? pass : fail)("Icon", nIcons + " icon (cần " + iconNeed + ")");
  const EXPECT = { "Icon Button": 6, "Button / Primary": 4, "Round Button": 6, "Scroll Button": 4, "Avatar": 30, "Bot Avatar": 2, "Conversation Item": 6, "Search Field": 3, "Menu Item": 4, "Chat Header": 2, "Composer": 3, "Status Message": 2, "Dialog": 2 };
  for (const gone of ["Filter Tab", "Language Select"]) {
    const k = root.findAll((n) => n.type === "COMPONENT_SET" && n.name === gone).length;
    (k === 0 ? pass : fail)("Component", gone + (k ? ": vẫn còn, cần xóa (app không dùng nữa)" : ": đã bỏ (app không dùng nữa)"));
  }
  for (const name of Object.keys(EXPECT)) {
    const sets = root.findAll((n) => n.type === "COMPONENT_SET" && n.name === name);
    if (sets.length !== 1) { fail("Component", name + ": có " + sets.length + " bộ (cần 1)"); continue; }
    const k = sets[0].children.length;
    (k === EXPECT[name] ? pass : fail)("Component", name + ": " + k + " biến thể (cần " + EXPECT[name] + ")");
  }
  for (const name of ["Message / User", "Message / Bot", "Typing Indicator", "Data Table", "Filter Bar", "Menu / Filter", "Menu / Conversation", "Menu / Account", "Answer Footer", "Empty State"]) {
    const k = root.findAll((n) => n.type === "COMPONENT" && n.name === name).length;
    (k === 1 ? pass : fail)("Component", name + ": " + k + " (cần 1)");
  }
  for (const name of ["Đăng nhập", "Sidebar", "Màn chat (máy tính)"]) {
    (root.findOne((n) => n.name === name) ? pass : fail)("Mẫu ghép", name);
  }
  // Điện thoại: đủ 3 màn, rộng 375, không phần tử nào tràn ngang (trừ lớp phủ/ngăn kéo cố ý nằm trên)
  for (const name of ["Mobile / Login", "Mobile / Chat", "Mobile / Drawer open"]) {
    const f = root.findOne((n) => n.type === "FRAME" && n.name === name);
    if (!f) { fail("Điện thoại", "Thiếu " + name); continue; }
    const fb = f.absoluteBoundingBox; let wide = 0;
    for (const n of f.findAll((x) => x.visible)) {
      const b = n.absoluteBoundingBox; if (!b) continue;
      if (b.x < fb.x - 1 || b.x + b.width > fb.x + fb.width + 1) { wide++; if (wide <= 3) fail("Điện thoại", name + ": tràn ngang " + path(n)); }
    }
    if (!wide) pass("Điện thoại", name + ": " + Math.round(f.width) + " × " + Math.round(f.height) + ", không tràn ngang");
  }

  // 2. Node lẻ ngoài khung chính
  const strays = page.children.filter((n) => n !== root);
  (strays.length === 0 ? pass : fail)("Trang", strays.length ? "Node nằm ngoài khung GeoAgent DS: " + strays.map((n) => n.type + " " + n.name).slice(0, 8).join(", ") : "Không có node lẻ");

  // 3. Biến thể chồng lên nhau trong bộ
  let overlaps = 0;
  for (const s of root.findAll((n) => n.type === "COMPONENT_SET")) {
    const ch = s.children;
    for (let i = 0; i < ch.length; i++) for (let j = i + 1; j < ch.length; j++) {
      const a = ch[i], b = ch[j];
      if (a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1) { overlaps++; if (overlaps <= 5) fail("Bố cục", "Chồng nhau: " + s.name + " › " + a.name + " / " + b.name); }
    }
  }
  if (!overlaps) pass("Bố cục", "Không có biến thể chồng nhau");

  // 4. Chữ tràn khỏi khung cha
  const texts = root.findAll((n) => n.type === "TEXT" && n.visible);
  let overflow = 0;
  for (const t of texts) {
    const p = t.parent; const a = t.absoluteBoundingBox, b = p && p.absoluteBoundingBox;
    if (!a || !b || p.type === "GROUP") continue;
    if (a.x < b.x - 1 || a.y < b.y - 1 || a.x + a.width > b.x + b.width + 1 || a.y + a.height > b.y + b.height + 1) { overflow++; if (overflow <= 8) fail("Chữ", "Tràn khung: " + path(t) + " \"" + t.characters.slice(0, 30) + "\""); }
  }
  if (!overflow) pass("Chữ", texts.length + " ô chữ, không ô nào tràn khung");

  // 5. Tương phản chữ (WCAG: 4.5:1 chữ thường, 3:1 chữ lớn)
  const solid = async (p) => {
    if (!p || p.type !== "SOLID" || p.visible === false) return null;
    let c = p.color;
    if (p.boundVariables && p.boundVariables.color) {
      const v = byId[p.boundVariables.color.id] || (await figma.variables.getVariableByIdAsync(p.boundVariables.color.id));
      if (v) c = await resolveColor(v);
    }
    // Độ trong suốt có thể nằm ở lớp tô (opacity) hoặc trong giá trị biến (kênh a)
    return { c: { r: c.r, g: c.g, b: c.b }, o: (p.opacity == null ? 1 : p.opacity) * (c.a == null ? 1 : c.a) };
  };
  const lum = (c) => { const f = (x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)); return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const mix = (fg, bg, o) => ({ r: fg.r * o + bg.r * (1 - o), g: fg.g * o + bg.g * (1 - o), b: fg.b * o + bg.b * (1 - o) });
  const bgOf = async (t) => {
    const tb = t.absoluteBoundingBox; let x = t.parent; let over = null;
    while (x && x.type !== "PAGE") {
      const fills = "fills" in x && Array.isArray(x.fills) ? x.fills.filter((f) => f.visible !== false) : [];
      const top = fills[fills.length - 1];
      if (top && top.type === "GRADIENT_LINEAR" && top.gradientStops.length === 4) {
        const bb = x.absoluteBoundingBox; const rel = (tb.y + tb.height / 2 - bb.y) / bb.height;
        const base = rel < top.gradientStops[1].position ? top.gradientStops[0].color : top.gradientStops[3].color;
        return over ? mix(over.c, base, over.o) : base;
      }
      if (top && top.type === "SOLID") {
        const s = await solid(top);
        if (s.o >= 0.99) return over ? mix(over.c, s.c, over.o) : s.c;
        if (!over) over = s; // lớp bán trong suốt: trộn với nền bên dưới
      }
      x = x.parent;
    }
    return { r: 1, g: 1, b: 1 };
  };
  let low = 0, checked = 0;
  for (const t of texts) {
    if (!t.characters.trim() || t.fills === figma.mixed) continue;
    const f = await solid(t.fills[0]); if (!f) continue;
    const bg = await bgOf(t); const fg = f.o < 1 ? mix(f.c, bg, f.o) : f.c;
    const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = t.fontSize === figma.mixed ? 14 : t.fontSize;
    const bold = t.fontName !== figma.mixed && /Bold|Semi/.test(t.fontName.style);
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    checked++;
    if (ratio < need - 0.01) { low++; if (low <= 8) fail("Tương phản", ratio.toFixed(2) + ":1 < " + need + " — " + path(t) + " \"" + t.characters.slice(0, 24) + "\""); }
  }
  if (!low) pass("Tương phản", checked + " ô chữ đạt 4.5:1 (chữ lớn 3:1)");

  // 6. Màu chưa gắn biến trong component
  let raw = 0;
  for (const n of root.findAll((x) => (x.type === "COMPONENT" || x.type === "INSTANCE" || x.type === "FRAME" || x.type === "TEXT" || x.type === "VECTOR" || x.type === "ELLIPSE" || x.type === "RECTANGLE") && !!x.parent && (x.parent.type === "COMPONENT" || x.parent.type === "COMPONENT_SET" || (x.parent.parent && (x.parent.parent.type === "COMPONENT")) ))) {
    const fills = Array.isArray(n.fills) ? n.fills : [];
    for (const p of fills) if (p.type === "SOLID" && p.visible !== false && !(p.boundVariables && p.boundVariables.color)) { raw++; if (raw <= 6) fail("Biến", "Màu cứng: " + path(n)); }
  }
  if (!raw) pass("Biến", "Màu trong component đều gắn biến");

  // 7. Kiểu chữ chưa gắn (chữ trong component)
  const unstyled = root.findAll((n) => n.type === "TEXT" && n.textStyleId === "" && !!n.parent && (n.parent.type === "COMPONENT" || (n.parent.parent && n.parent.parent.type === "COMPONENT"))).length;
  out.push((unstyled ? "• " : "✓ ") + "[Chữ] " + unstyled + " ô chữ trong component dùng cỡ chữ riêng, không gắn kiểu chữ (Avatar, menu, chân câu trả lời: cố ý theo code)");

  const bad = out.filter((l) => l[0] === "✗").length;
  out.unshift("GeoAgent DS — tự kiểm tra: " + (bad ? bad + " lỗi" : "đạt tất cả") + "\n" + log.join(" · ") + "\n");
  return out.join("\n");
}

const showReport = (text, tokens) => {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const tokenJs = JSON.stringify(tokens || "").replace(/</g, "\\u003c");
  figma.showUI(
    `<style>body{font:12px/1.5 Inter,system-ui,sans-serif;margin:0;padding:12px;color:#1d1416}
     textarea{width:100%;height:330px;box-sizing:border-box;font:12px/1.5 ui-monospace,Consolas,monospace;border:1px solid #d9cdc8;border-radius:8px;padding:8px}
     .row{display:flex;gap:8px;margin-top:10px}button{font:600 13px Inter,system-ui;border-radius:8px;padding:8px 14px;border:1px solid #958884;background:#fff;cursor:pointer}
     button.p{background:#a3141a;border-color:#a3141a;color:#fff}button:focus-visible{outline:2px solid #1a5fd6;outline-offset:2px}</style>
     <textarea id="r" readonly>${esc}</textarea>
     <div class="row"><button class="p" id="c">Sao chép báo cáo</button><button id="t" ${tokens ? "" : "disabled"}>Tải tokens.json</button><button id="x">Đóng</button><span id="s" role="status"></span></div>
     <script>
       const r=document.getElementById('r');
       const TOKENS=${tokenJs};
       document.getElementById('t').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([TOKENS],{type:'application/json'}));a.download='geoagent.tokens.json';document.body.appendChild(a);a.click();a.remove();document.getElementById('s').textContent='Chép đè vào tokens/geoagent.tokens.json rồi chạy npm run tokens';};
       document.getElementById('c').onclick=()=>{r.select();document.execCommand('copy');document.getElementById('s').textContent='Đã sao chép';};
       document.getElementById('x').onclick=()=>parent.postMessage({pluginMessage:'close'},'*');
     </script>`,
    { width: 560, height: 420, title: "GeoAgent DS — báo cáo" }
  );
  figma.ui.onmessage = (m) => { if (m === "close") figma.closePlugin(); };
};

main()
  .then((r) => showReport(r.report, r.tokens))
  .catch((e) => showReport("Lỗi: " + (e && e.message ? e.message : e) + "\n\nĐã làm: " + (log.join(" · ") || "chưa có")));
