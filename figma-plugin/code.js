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
  const OWN_BLOCKS = ["Conversation Item", "Search Field", "Filter Tab", "Language Select", "Chat Header", "Message", "Data Table", "Composer"];
  for (const t of OWN_BLOCKS) { const old = compSec.findChild((n) => n.name === "Block " + t); if (old) old.remove(); }
  { const pat = root.findChild((n) => n.name === "06 Pattern"); if (pat) pat.remove(); }

  // ---------- Biến màu có độ trong suốt (giá trị lấy đúng từ code) ----------
  {
    const colorCol = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === "GeoAgent / Color" || c.name === "GeoAgent / Semantic");
    if (!colorCol) throw new Error('Thiếu bộ biến "GeoAgent / Semantic" (tên cũ "GeoAgent / Color")');
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
    const ibInfo = splitAtFrameRow(set("Icon Button"), 48 + 3 * 36 + 2 * 24);
    const avInfo = splitAtFrameRow(set("Avatar"), 48 + 22 + 28 + 32 + 36 + 40 + 4 * 20);
    if (ibInfo.frameTop < ibInfo.otherBottom || avInfo.frameTop < avInfo.otherBottom) throw new Error("Hàng Frame chưa tách khỏi các hàng khác");
    log.push("~ Icon Button, Avatar: nền tách trắng/đỏ");
  }

  // ---------- 1. Conversation Item ----------
  {
    const stage = block("Conversation Item", "Một hội thoại trong sidebar: avatar 36, tên (đậm hơn khi chưa đọc), giờ, dòng xem trước và chấm vàng chưa đọc. Đang chọn: viên trắng ấm, chữ đỏ. Rộng 284 (sidebar 300, lề 8).", "Sidebar.jsx");
    if (stage) {
      stage.fills = [paint("sidebar/frame")];
      const comps = [];
      for (const state of ["Default", "Hover", "Selected"]) for (const unread of ["No", "Yes"]) {
        const sel = state === "Selected";
        const c = comp(`State=${state}, Unread=${unread}`, "HORIZONTAL", { itemSpacing: 12, counterAxisAlignItems: "CENTER" });
        c.paddingLeft = c.paddingRight = 10; c.paddingTop = c.paddingBottom = 8;
        radius(c, "radius/2xl");
        c.fills = sel ? [paint("sidebar/frame-active")] : state === "Hover" ? [paint("sidebar/frame-hover")] : [];
        const muted = sel ? "sidebar/on-frame-active-muted" : state === "Hover" ? "sidebar/on-frame-muted-strong" : "sidebar/on-frame-muted";
        const main = sel ? "brand/brand" : "sidebar/on-frame";
        const av = avatar(sel ? "Selected" : "Frame", 36, "P"); av.name = "Avatar"; c.appendChild(av);
        const col = AL("VERTICAL", { name: "Text", itemSpacing: 0 }); c.appendChild(col);
        const r1 = AL("HORIZONTAL", { name: "Row 1", itemSpacing: 8, counterAxisAlignItems: "BASELINE" }); col.appendChild(r1);
        const name = TX("Phòng Kế toán", unread === "Yes" ? "Label/List title unread" : "Label/List title", main); name.name = "Name"; r1.appendChild(name);
        const time = TX("09:42", "Caption/Default", muted); time.name = "Time"; r1.appendChild(time);
        const r2 = AL("HORIZONTAL", { name: "Row 2", itemSpacing: 8, counterAxisAlignItems: "CENTER" }); col.appendChild(r2);
        const prev = TX("Bảng đối chiếu công nợ quý III đã sẵn sàng", "Body/Small", unread === "Yes" && !sel ? "sidebar/on-frame" : muted); prev.name = "Preview"; r2.appendChild(prev);
        const dot = figma.createEllipse(); dot.name = "Unread dot"; dot.resize(8, 8); dot.fills = [paint("brand/gold")]; dot.visible = unread === "Yes"; r2.appendChild(dot);
        fixedWidth(c, 284);
        fill(col); fill(r1); fill(r2); oneLine(name); oneLine(prev);
        comps.push(c);
      }
      const s = makeSet(stage, "Conversation Item", comps, "Mục hội thoại trong Sidebar.jsx. Chưa đọc: tên font-[650], xem trước on-frame, chấm vàng.", { dir: "VERTICAL", gap: 12, bg: "sidebar/frame", align: "MIN" });
      const pn = s.addComponentProperty("Name", "TEXT", "Phòng Kế toán");
      const pp = s.addComponentProperty("Preview", "TEXT", "Bảng đối chiếu công nợ quý III đã sẵn sàng");
      const pt = s.addComponentProperty("Time", "TEXT", "09:42");
      for (const c of s.children) {
        c.findOne((n) => n.name === "Name").componentPropertyReferences = { characters: pn };
        c.findOne((n) => n.name === "Preview").componentPropertyReferences = { characters: pp };
        c.findOne((n) => n.name === "Time").componentPropertyReferences = { characters: pt };
      }
    }
  }

  // ---------- 2. Search Field ----------
  {
    const stage = block("Search Field", "Ô tìm hội thoại trên nền đỏ: cao 40, bo tròn, nền đỏ tối, viền frame-edge. Nút xóa (28, icon close 16) chỉ hiện khi đã gõ. Focus: viền và vòng on-frame.", "Sidebar.jsx");
    if (stage) {
      stage.fills = [paint("sidebar/frame")];
      const comps = [];
      for (const state of ["Empty", "Filled", "Focus"]) {
        const c = comp(`State=${state}`, "HORIZONTAL", { itemSpacing: 8, counterAxisAlignItems: "CENTER" });
        c.paddingLeft = 16; c.paddingRight = state === "Filled" ? 8 : 16;
        fixed(c, 276, 40); radius(c, "radius/full");
        c.fills = [paint("sidebar/frame-sunken")];
        stroke(c, state === "Focus" ? "sidebar/on-frame" : "sidebar/frame-edge", state === "Focus" ? 2 : 1);
        const t = TX(state === "Filled" ? "kế toán" : "Tìm hội thoại", "Body/Default", state === "Filled" ? "sidebar/on-frame" : "sidebar/on-frame-muted"); t.name = "Text";
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

  // ---------- 3. Filter Tab ----------
  {
    const stage = block("Filter Tab", "Tab lọc dưới ô tìm kiếm: chữ 13, đang chọn đậm với gạch chân vàng 2px. Các tab chia đều trong lề 16px.", "Sidebar.jsx");
    if (stage) {
      stage.fills = [paint("sidebar/frame")];
      const comps = [];
      for (const sel of ["Yes", "No"]) {
        const c = comp(`Selected=${sel}`, "HORIZONTAL", { counterAxisAlignItems: "CENTER" });
        c.paddingTop = 4; c.paddingBottom = 8;
        c.strokes = sel === "Yes" ? [paint("brand/gold")] : [];
        c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 2; c.strokeAlign = "INSIDE";
        const t = T("Tất cả", 13, 18, sel === "Yes" ? "Semi Bold" : "Regular", sel === "Yes" ? "sidebar/on-frame" : "sidebar/on-frame-muted"); t.name = "Label";
        c.appendChild(t);
        comps.push(c);
      }
      const s = makeSet(stage, "Filter Tab", comps, "Tab lọc (aria-pressed). Nhãn: Tất cả, Chưa đọc, Liên hệ, Phòng, Yêu thích.", { gap: 24, bg: "sidebar/frame" });
      const lp = s.addComponentProperty("Label", "TEXT", "Tất cả");
      for (const c of s.children) c.findOne((n) => n.name === "Label").componentPropertyReferences = { characters: lp };
    }
  }

  // ---------- 4. Language Select ----------
  {
    const stage = block("Language Select", "Chọn ngôn ngữ ở chân thẻ đăng nhập: cao 32, bo 8, chữ 13 Medium, mũi tên 16. Dùng select gốc của trình duyệt.", "Welcome.jsx");
    if (stage) {
      const comps = [];
      for (const state of ["Default", "Hover", "Focus"]) {
        const c = comp(`State=${state}`, "HORIZONTAL", { itemSpacing: 4, counterAxisAlignItems: "CENTER" });
        c.paddingLeft = 8; c.paddingRight = 6; fixed(c, 112, 32); c.primaryAxisSizingMode = "AUTO"; radius(c, "radius/lg");
        c.fills = state === "Hover" ? [paint("surface/surface-2")] : [];
        if (state === "Focus") stroke(c, "state/focus", 2, "OUTSIDE");
        const t = TX("Tiếng Việt", "Label/Small"); t.name = "Label"; c.appendChild(t);
        c.appendChild(icon("chevron-down", 16, "text/ink-2"));
        comps.push(c);
      }
      makeSet(stage, "Language Select", comps, "Select ngôn ngữ trong Welcome.jsx.", { gap: 24 });
    }
  }

  // ---------- 5. Chat Header ----------
  {
    const stage = block("Chat Header", "Đầu khung chat, cao 64, đường kẻ rule bên dưới. Máy tính: tên + loại hội thoại + nút thông tin. Điện thoại: nút menu, quốc huy, nút soạn mới và avatar người dùng.", "ChatPane.jsx");
    if (stage) {
      const comps = [];
      for (const device of ["Desktop", "Mobile"]) {
        const mobile = device === "Mobile";
        const c = comp(`Device=${device}`, "HORIZONTAL", { itemSpacing: 12, counterAxisAlignItems: "CENTER" });
        c.paddingLeft = c.paddingRight = mobile ? 12 : 24;
        fixed(c, mobile ? 375 : 760, 64);
        c.fills = [paint("surface/surface")]; bottomRule(c, "border/rule");
        if (mobile) {
          const m = variant("Icon Button", "Tone=Sheet, State=Default"); c.appendChild(m);
          c.appendChild(emblem(28));
        }
        const col = AL("VERTICAL", { name: "Title", itemSpacing: 0 }); c.appendChild(col); fill(col);
        const h = TX("Trợ lý GeoAgent", "Heading/Chat title"); h.name = "Name"; col.appendChild(h); oneLine(h);
        const k = TX("Trợ lý GeoAgent trong phòng", "Caption/Default", "text/ink-2"); k.name = "Kind"; col.appendChild(k); oneLine(k);
        if (mobile) {
          const e = variant("Icon Button", "Tone=Sheet, State=Default");
          const key = Object.keys(e.componentProperties).find((x) => x.split("#")[0] === "Icon");
          if (key) e.setProperties({ [key]: iconComp("edit").id });
          c.appendChild(e);
          c.appendChild(avatar("Teal", 28, "N")); // người dùng "Nguyễn Minh Quân": sắc theo chữ N trong code là Teal
        } else {
          const i = variant("Icon Button", "Tone=Sheet, State=Default");
          const key = Object.keys(i.componentProperties).find((x) => x.split("#")[0] === "Icon");
          if (key) i.setProperties({ [key]: iconComp("info").id });
          c.appendChild(i);
        }
        comps.push(c);
      }
      const s = makeSet(stage, "Chat Header", comps, "Header của ChatPane.jsx. Trên iPhone có thêm lề an toàn phía trên (safe-area).", { dir: "VERTICAL", gap: 24, align: "MIN" });
      const np = s.addComponentProperty("Name", "TEXT", "Trợ lý GeoAgent");
      const kp = s.addComponentProperty("Kind", "TEXT", "Trợ lý GeoAgent trong phòng");
      for (const c of s.children) {
        c.findOne((n) => n.name === "Name").componentPropertyReferences = { characters: np };
        c.findOne((n) => n.name === "Kind").componentPropertyReferences = { characters: kp };
      }
    }
  }

  // ---------- 6. Message ----------
  {
    const stage = block("Message", "Tin của người dùng: bong bóng hồng thương hiệu, góc dưới phải nhọn 6px, giờ và avatar nằm dưới. Tin của bot: dòng tên + giờ, thẻ trắng viền bubble-edge, góc trên trái nhọn, có tiêu đề, đoạn văn, danh sách chấm đỏ và bảng.", "ChatPane.jsx, MessageContent.jsx");
    if (stage) {
      stage.counterAxisAlignItems = "MIN";
      // User
      // Bề rộng component = bề rộng tối đa của tin (75% cột trên máy tính, 85% trên điện thoại).
      // Bóng tin và chữ giãn theo component, nên đổi bề rộng instance là đủ (không phải sửa lớp bên trong).
      const u = comp("Message / User", "VERTICAL", { itemSpacing: 6, counterAxisAlignItems: "MAX" });
      fixedWidth(u, 392);
      const b = AL("HORIZONTAL", { name: "Bubble" }); b.paddingLeft = b.paddingRight = 16; b.paddingTop = b.paddingBottom = 10;
      b.fills = [paint("brand/brand-soft")]; radii(b, "radius/bubble", "radius/bubble", "radius/sm", "radius/bubble");
      u.appendChild(b); b.layoutSizingHorizontal = "FILL";
      const ut = TX("Ước tính giúp tôi chi phí đo đạc địa chính cho 3 thửa đất ở Hà Đông.", "Body/Bubble"); ut.name = "Text";
      b.appendChild(ut); wrapText(ut);
      const meta = AL("HORIZONTAL", { name: "Meta", itemSpacing: 8, counterAxisAlignItems: "CENTER" }); u.appendChild(meta);
      const tm = TX("09:40", "Caption/Default", "text/ink-2"); tm.name = "Time"; meta.appendChild(tm);
      meta.appendChild(avatar("Teal", 22, "N"));
      stage.appendChild(u);
      u.description = "Tin của người dùng (tối đa 75% bề rộng cột trên máy tính, 85% trên điện thoại).";
      const tp = u.addComponentProperty("Text", "TEXT", ut.characters);
      const tt = u.addComponentProperty("Time", "TEXT", "09:40");
      ut.componentPropertyReferences = { characters: tp }; tm.componentPropertyReferences = { characters: tt };

      // Bot
      const m = comp("Message / Bot", "VERTICAL", { itemSpacing: 8 });
      const hr = AL("HORIZONTAL", { name: "Sender", itemSpacing: 8, counterAxisAlignItems: "CENTER" }); m.appendChild(hr);
      hr.appendChild(variant("Bot Avatar", "Size=28"));
      const sn = TX("GeoAgent", "Label/Small"); sn.name = "Sender name"; hr.appendChild(sn);
      const bt = TX("09:41", "Caption/Default", "text/ink-2"); bt.name = "Time"; hr.appendChild(bt);
      const card = AL("VERTICAL", { name: "Bubble", itemSpacing: 12 }); card.paddingLeft = card.paddingRight = 20; card.paddingTop = card.paddingBottom = 16;
      card.fills = [paint("surface/surface")]; stroke(card, "border/bubble-edge"); radii(card, "radius/sm", "radius/bubble", "radius/bubble", "radius/bubble");
      shadow(card, "Shadow/Bot bubble");
      m.appendChild(card); fixedWidth(m, 640); fill(card);
      const h3 = TX("Chi phí ước tính", "Heading/Message heading"); card.appendChild(h3); wrapText(h3);
      const p = TX("Với 3 thửa đất tại Hà Đông, tổng chi phí đo đạc khoảng 9,6 triệu đồng, chưa gồm phí thẩm định.", "Body/Message"); card.appendChild(p); wrapText(p);
      const list = AL("VERTICAL", { name: "List", itemSpacing: 4 }); card.appendChild(list); fill(list);
      for (const it of ["Đo vẽ hiện trạng: 2,4 triệu đồng mỗi thửa", "Trích lục bản đồ: 0,8 triệu đồng mỗi thửa"]) {
        const li = AL("HORIZONTAL", { name: "Item", itemSpacing: 10, counterAxisAlignItems: "MIN" }); list.appendChild(li); fill(li);
        const d = figma.createFrame(); d.name = "Marker"; d.resize(6, 24); d.fills = [];
        const dot = figma.createEllipse(); dot.resize(5, 5); dot.x = 0; dot.y = 10; dot.fills = [paint("brand/brand")]; d.appendChild(dot);
        li.appendChild(d);
        const lt = TX(it, "Body/Message"); li.appendChild(lt); wrapText(lt);
      }
      stage.appendChild(m);
      m.description = "Câu trả lời của bot (MessageContent.jsx): tiêu đề, đoạn văn, danh sách, bảng. Chỉ hỗ trợ chữ đậm trong đoạn văn.";
      const bp = m.addComponentProperty("Time", "TEXT", "09:41");
      bt.componentPropertyReferences = { characters: bp };

      // Typing
      const ty = comp("Typing Indicator", "HORIZONTAL", { itemSpacing: 12, counterAxisAlignItems: "CENTER" });
      ty.appendChild(variant("Bot Avatar", "Size=28"));
      const dots = AL("HORIZONTAL", { name: "Dots", itemSpacing: 6, counterAxisAlignItems: "CENTER" }); ty.appendChild(dots);
      [1, 0.6, 0.3].forEach((o) => { const e = figma.createEllipse(); e.resize(6, 6); e.fills = [paint("text/ink-2")]; e.opacity = o; dots.appendChild(e); });
      ty.description = "Bot đang trả lời: 3 chấm nhấp nháy lệch nhau 200ms (role=status). Tắt chuyển động khi người dùng chọn giảm chuyển động.";
      stage.appendChild(ty);
    }
  }

  // ---------- 7. Data Table ----------
  {
    const stage = block("Data Table", "Bảng trong câu trả lời: chỉ đường kẻ ngang, cột đầu căn trái, cột số căn phải với chữ số đều nhau. Bảng rộng thì cuộn ngang trong khung, không làm vỡ trang.", "MessageContent.jsx › DataTable");
    if (stage) {
      const c = comp("Data Table", "VERTICAL");
      const rows = [["Hạng mục", "Đơn giá", "Số lượng", "Thành tiền"], ["Đo vẽ hiện trạng", "2.400.000", "3", "7.200.000"], ["Trích lục bản đồ", "800.000", "3", "2.400.000"], ["Tổng cộng", "", "", "9.600.000"]];
      const widths = [200, 120, 96, 128];
      rows.forEach((r, i) => {
        const row = AL("HORIZONTAL", { name: i === 0 ? "Head" : "Row " + i }); c.appendChild(row);
        bottomRule(row, i === 0 ? "border/line" : "border/rule");
        r.forEach((cell, j) => {
          const cf = AL("HORIZONTAL", { name: "Cell", primaryAxisAlignItems: j === 0 ? "MIN" : "MAX" });
          cf.paddingLeft = j === 0 ? 0 : 12; cf.paddingRight = j === r.length - 1 ? 0 : (j === 0 ? 24 : 12);
          cf.paddingTop = i === 0 ? 2 : 8; cf.paddingBottom = i === 0 ? 6 : 8;
          row.appendChild(cf); cf.primaryAxisSizingMode = "FIXED"; cf.resize(widths[j], cf.height);
          const t = i === 0 ? TX(cell, "Caption/Table head", "text/ink-2") : i === rows.length - 1 && cell ? T(cell, 14, 20, "Semi Bold") : TX(cell || " ", "Body/Default");
          cf.appendChild(t);
        });
      });
      c.description = "Bảng dữ liệu (role=region, focus được để cuộn ngang bằng bàn phím).";
      stage.appendChild(c);
    }
  }

  // ---------- 8. Composer ----------
  {
    const stage = block("Composer", "Ô soạn tin dính đáy khung chat: bo 28, viền line-strong, bóng Composer. Trái: đính kèm. Phải: micro; khi đã gõ, nút gửi đỏ xuất hiện và micro dịch sang trái. Enter gửi, Shift+Enter xuống dòng. Khung không đổi khi focus (code tắt viền focus của ô nhập).", "Composer.jsx");
    if (stage) {
      const comps = [];
      for (const state of ["Empty", "Typing"]) {
        const c = comp(`State=${state}`, "HORIZONTAL", { itemSpacing: 4, counterAxisAlignItems: "MAX" });
        pad(c, 8, 8); fixedWidth(c, 640); radius(c, "radius/composer");
        c.fills = [paint("surface/surface")]; shadow(c, "Shadow/Composer");
        stroke(c, "border/line-strong", 1);
        c.appendChild(variant("Round Button", "Type=Ghost, State=Default"));
        const field = AL("HORIZONTAL", { name: "Field", counterAxisAlignItems: "CENTER" }); field.paddingLeft = field.paddingRight = 4; field.paddingTop = field.paddingBottom = 8;
        c.appendChild(field); field.layoutGrow = 1; field.layoutSizingHorizontal = "FILL"; field.layoutSizingVertical = "HUG";
        const t = TX(state === "Typing" ? "Chi phí đo đạc 3 thửa đất ở Hà Đông là bao nhiêu?" : "Hỏi GeoAgent", "Body/Input", state === "Typing" ? "text/ink" : "text/ink-2"); t.name = "Text";
        field.appendChild(t); wrapText(t);
        const mic = variant("Round Button", "Type=Ghost, State=Default");
        const key = Object.keys(mic.componentProperties).find((x) => x.split("#")[0] === "Icon");
        if (key) mic.setProperties({ [key]: iconComp("microphone").id });
        c.appendChild(mic);
        if (state === "Typing") c.appendChild(variant("Round Button", "Type=Send, State=Default"));
        comps.push(c);
      }
      makeSet(stage, "Composer", comps, "Composer.jsx. Ô nhập tự giãn tối đa 8 dòng.", { dir: "VERTICAL", gap: 24, align: "MIN" });
    }
  }

  // ---------- 9. Mẫu ghép ----------
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
    const ws = TX("Dịch vụ nhắn tin và liên lạc được mã hóa, phi tập trung.", "Body/Default", "text/ink-2"); ws.textAlignHorizontal = "CENTER"; cardL.appendChild(ws); wrapText(ws);
    cardL.appendChild(gap(28));
    const btn = variant("Button / Primary", "State=Default"); cardL.appendChild(btn); btn.layoutSizingHorizontal = "FILL";
    cardL.appendChild(gap(20));
    const foot = AL("HORIZONTAL", { name: "Footer", primaryAxisAlignItems: "SPACE_BETWEEN", counterAxisAlignItems: "CENTER" }); foot.paddingTop = 16;
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
    foot.appendChild(variant("Language Select", "State=Default"));
    label(login, "Đăng nhập");

    // Sidebar
    const side = AL("VERTICAL", { name: "Sidebar", itemSpacing: 0 }); side.fills = [paint("sidebar/frame")]; side.cornerRadius = 16; side.clipsContent = true;
    side.primaryAxisSizingMode = "FIXED"; side.counterAxisSizingMode = "FIXED"; side.resize(300, 760);
    const brand = AL("HORIZONTAL", { name: "Brand", itemSpacing: 12, counterAxisAlignItems: "CENTER" }); brand.paddingLeft = brand.paddingRight = 16;
    side.appendChild(brand); fill(brand); brand.counterAxisSizingMode = "FIXED"; brand.resize(300, 64);
    brand.appendChild(emblem(32));
    const bcol = AL("VERTICAL", { name: "Name" }); brand.appendChild(bcol);
    bcol.appendChild(TX("GeoAgent", "Heading/Brand", "sidebar/on-frame"));
    bcol.appendChild(TX("Trợ lý AI thông minh", "Caption/Default", "sidebar/on-frame-muted"));
    const nb = AL("HORIZONTAL", { name: "New chat", itemSpacing: 12, counterAxisAlignItems: "CENTER" }); nb.paddingLeft = 20; nb.paddingRight = 16;
    side.appendChild(nb); nb.counterAxisSizingMode = "FIXED"; nb.resize(nb.width, 40);
    nb.appendChild(icon("edit", 18, "sidebar/on-frame"));
    nb.appendChild(T("Cuộc trò chuyện mới", 14, 20, "Medium", "sidebar/on-frame"));
    const sw = AL("HORIZONTAL", { name: "Search" }); sw.paddingLeft = sw.paddingRight = 12; sw.paddingTop = 8; side.appendChild(sw); fill(sw);
    const sf = variant("Search Field", "State=Empty"); sw.appendChild(sf); sf.layoutSizingHorizontal = "FILL";
    const tabs = AL("HORIZONTAL", { name: "Filters", primaryAxisAlignItems: "SPACE_BETWEEN" }); tabs.paddingLeft = tabs.paddingRight = 16; tabs.paddingTop = 12;
    side.appendChild(tabs); fill(tabs);
    ["Tất cả", "Chưa đọc", "Liên hệ", "Phòng", "Yêu thích"].forEach((l, i) => { const t = variant("Filter Tab", i === 0 ? "Selected=Yes" : "Selected=No"); setProp(t, "Label", l); tabs.appendChild(t); });
    const list = AL("VERTICAL", { name: "List", itemSpacing: 2 }); list.paddingLeft = list.paddingRight = 8; list.paddingTop = list.paddingBottom = 8;
    side.appendChild(list); fill(list); list.layoutGrow = 1;
    const convs = [["Trợ lý GeoAgent", "Chi phí ước tính cho 3 thửa đất…", "09:41", "Selected", "No"], ["Phòng Kế toán", "Bảng đối chiếu công nợ quý III đã sẵn sàng", "09:12", "Default", "Yes"], ["Hỗ trợ kỹ thuật", "Bản cập nhật sẽ được triển khai chiều nay", "Hôm qua", "Default", "Yes"], ["Tét Multi", "Trợ lý GeoAgent: | Ưu tiên | Hành động", "T2", "Default", "No"], ["Nguyễn Thu Hà", "Em gửi lại hồ sơ thửa 128 nhé", "T2", "Default", "No"]];
    for (const [n, p, t, st, un] of convs) { const it = variant("Conversation Item", `State=${st}, Unread=${un}`); setProp(it, "Name", n); setProp(it, "Preview", p); setProp(it, "Time", t); list.appendChild(it); it.layoutSizingHorizontal = "FILL";
      const av = it.findOne((x) => x.type === "INSTANCE" && x.name === "Avatar"); if (av) setProp(av, "Initial", n.charAt(0).toUpperCase()); }
    const me = AL("HORIZONTAL", { name: "User", itemSpacing: 12, counterAxisAlignItems: "CENTER" }); me.paddingLeft = me.paddingRight = 16; me.paddingTop = me.paddingBottom = 12;
    me.strokes = [paint("sidebar/divider")]; me.strokeTopWeight = 1; me.strokeBottomWeight = 0; me.strokeLeftWeight = 0; me.strokeRightWeight = 0;
    side.appendChild(me); fill(me);
    me.appendChild(avatar("Frame", 32, "N"));
    me.appendChild(T("Nguyễn Minh Quân", 14, 20, "Medium", "sidebar/on-frame"));
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
    const mNote = T("Dưới 768 px: sidebar thành ngăn kéo mở từ nút menu, quốc huy nằm trên header. Lề an toàn trên 47 px và dưới 34 px (iPhone có tai thỏ). Trên iPhone thật chữ hiển thị bằng SF Pro (code dùng -apple-system); bản vẽ dùng Inter.", 14, 22, "Regular", "text/ink-2");
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
  "Button / Primary": "Chưa tách thành component React; markup trong Welcome.jsx:\n<button className=\"flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-brand text-button text-white hover:bg-brand-hover active:bg-brand-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus\"><SignInIcon size={18} />Đăng nhập</button>",
  "Round Button": "Trong Composer.jsx. Ghost: size-10 rounded-full text-ink-2 hover:bg-panel hover:text-ink. Send: size-10 rounded-full bg-brand text-white hover:bg-brand-hover. Focus: focus-visible:outline-2 focus-visible:outline-focus.",
  "Scroll Button": "ChatPane.jsx › <ScrollButton label=\"Lên đầu hội thoại\" onClick={fn} disabled={atTop}><ChevronUp /></ScrollButton>. Class: size-9 rounded-full border border-line bg-surface shadow-float; ẩn (opacity 0) khi disabled.",
  "Avatar": "React: <Avatar name=\"Nguyễn Minh Quân\" size={36} /> (ui.jsx).\nTone=Red/Amber/Teal/Violet: KHÔNG truyền tone, code tự chọn theo chữ cái đầu tên (token avatar/*-bg, avatar/*-fg).\nTone=Frame → tone=\"frame\" (trên sidebar đỏ) · Tone=Selected → tone=\"selected\" · Size → size={…} · status → chấm trạng thái.",
  "Bot Avatar": "React: <BotAvatar size={28} /> (ui.jsx). Nền bg-frame, icon AssistantIcon màu text-gold, cỡ icon = 68% avatar.",
  "Conversation Item": "Trong Sidebar.jsx (li > button). Selected → aria-current; nền bg-frame-active, chữ text-brand. Hover: hover:bg-frame-hover. Unread: tên font-unread, xem trước text-on-frame, chấm size-2 bg-gold. Tên text-sm, giờ text-xs, xem trước text-small.",
  "Search Field": "Trong Sidebar.jsx (label > input type=search). h-10 rounded-full border border-frame-edge bg-frame-sunken px-4; focus-within:border-on-frame focus-within:ring-1 focus-within:ring-on-frame. Nút xóa chỉ hiện khi có chữ; Esc xóa.",
  "Filter Tab": "Trong Sidebar.jsx (button aria-pressed). text-small; Selected=Yes → border-gold text-on-frame font-semibold; No → border-transparent text-on-frame-muted. Nhóm tab: border-b border-divider.",
  "Language Select": "Trong Welcome.jsx: <select> gốc của trình duyệt. h-8 rounded-lg pr-7 pl-2 text-small font-medium hover:bg-surface-2; mũi tên ChevronDown 16.",
  "Chat Header": "Trong ChatPane.jsx (header). h-16 border-b border-rule; tên h1 text-title, loại hội thoại text-xs text-ink-2. Device=Mobile là dưới 768px (md:hidden): nút menu, quốc huy, nút soạn mới, avatar người dùng; có pt-[var(--safe-top)].",
  "Composer": "React: <Composer onSend={(text) => …} placeholder=\"Hỏi GeoAgent\" /> (Composer.jsx). Khung rounded-composer border border-line-strong bg-surface shadow-composer; ô nhập text-input, tự giãn tối đa 8 dòng. State=Typing: nút gửi xuất hiện khi có chữ.",
  "Message / User": "Trong ChatPane.jsx. Bóng: rounded-bubble rounded-br-bubble-tip bg-brand-soft px-4 py-2.5 text-bubble; tối đa max-w-[75%] (máy tính), max-w-[85%] (điện thoại). Dưới bóng: giờ text-xs text-ink-2 + <Avatar size={22} />.",
  "Message / Bot": "Trong ChatPane.jsx + <MessageContent blocks={[{ type: \"h\" | \"p\" | \"ul\" | \"table\" | \"hr\", … }]} />. Thẻ: rounded-bubble rounded-tl-bubble-tip border border-bubble-edge bg-surface shadow-bubble px-4 py-3.5 md:px-5 md:py-4; chữ text-message, tiêu đề text-message-heading. Dòng tên: text-small + <BotAvatar size={28} />.",
  "Typing Indicator": "Trong ChatPane.jsx (prop typing). 3 chấm size-1.5 bg-ink-2 animate-blink lệch 200ms; role=status; motion-reduce:animate-none.",
  "Data Table": "MessageContent block: { type: \"table\", head: [\"Chỉ tiêu\", …], rows: [[…]] }. Đầu cột text-xs font-medium text-ink-2 border-b border-line; hàng text-sm border-b border-rule; cột số căn phải tabular-nums.",
};

// Xuất token theo đúng cấu trúc tokens/geoagent.tokens.json (chuẩn W3C DTCG) để chạy npm run tokens
async function exportTokens() {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const all = await figma.variables.getLocalVariablesAsync();
  const byId = {}; for (const v of all) byId[v.id] = v;
  const prim = cols.find((c) => c.name === "GeoAgent / Primitives"), sem = cols.find((c) => c.name === "GeoAgent / Semantic"), size = cols.find((c) => c.name === "GeoAgent / Size");
  const hex = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
  const r4 = (x) => Math.round(x * 10000) / 10000, r3 = (x) => Math.round(x * 1000) / 1000;
  const color = (c) => (c.a == null || c.a >= 0.9995 ? hex(c) : { colorSpace: "srgb", components: [r4(Math.round(c.r * 255) / 255), r4(Math.round(c.g * 255) / 255), r4(Math.round(c.b * 255) / 255)], alpha: r3(c.a), hex: hex(c) });
  const set = (obj, path, val) => { const k = path.split("/"); let o = obj; for (const p of k.slice(0, -1)) o = o[p] = o[p] || {}; o[k[k.length - 1]] = val; };
  const css = (v) => { const m = (v.codeSyntax.WEB || "").match(/var\((--[^)]+)\)/); return m ? m[1] : null; };
  const T = { $description: "GeoAgent design tokens (chuẩn W3C DTCG). Nguồn gốc của src/tokens.css: sửa file này hoặc xuất lại từ plugin Figma, rồi chạy `npm run tokens`.", primitive: {}, semantic: {}, radius: {}, typography: {}, fontWeight: {}, shadow: {} };
  for (const id of prim ? prim.variableIds : []) {
    const v = byId[id];
    set(T.primitive, v.name, { $type: "color", $value: color(Object.values(v.valuesByMode)[0]), $extensions: { geoagent: { css: css(v) || "--" + v.name.replace("/", "-"), figma: v.name } } });
  }
  for (const id of sem ? sem.variableIds : []) {
    const v = byId[id];
    if (v.resolvedType !== "COLOR") continue;
    const val = Object.values(v.valuesByMode)[0];
    const target = val && val.type === "VARIABLE_ALIAS" ? byId[val.id] : null;
    const tok = { $type: "color", $value: target ? "{primitive." + target.name.replace("/", ".") + "}" : color(val) };
    if (v.description) tok.$description = v.description;
    tok.$extensions = { geoagent: { css: css(v), figma: v.name } };
    set(T.semantic, v.name, tok);
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
// Đổi màu cho dự án khác: chỉ sửa giá trị trong "GeoAgent / Primitives". Semantic và component tự theo.
// Mã màu lấy đúng từ src/index.css và code component; không màu nào trên màn hình bị đổi.
const PRIMITIVES = [
  // [tên, hex, alpha (bỏ trống = 1), mô tả]
  ["base/white", "#ffffff"],
  ["red/50", "#f8e3e1"], ["red/100", "#f8e2da"], ["red/150", "#f6dcd6"], ["red/200", "#f5d6d0"], ["red/250", "#f2cfc6"],
  ["red/400", "#e39a90"], ["red/600", "#ae2f33"], ["red/700", "#a3141a", 1, "Màu thương hiệu GeoAgent"], ["red/750", "#8a1c22"],
  ["red/800", "#8a1218"], ["red/850", "#85101a"], ["red/900", "#741015"],
  ["rose/700", "#7a4b47"],
  ["warm/25", "#fff7f0"], ["warm/50", "#fcf8f7"], ["warm/100", "#f6f1ee"], ["warm/150", "#f5f1ee"], ["warm/200", "#f0e9e6"],
  ["warm/250", "#eee6e2"], ["warm/300", "#e7dfdb"], ["warm/350", "#e7ddd8"], ["warm/400", "#d9cdc8"], ["warm/500", "#9a8f8c"],
  ["warm/550", "#958884"], ["warm/700", "#6b5f5c"], ["warm/950", "#1d1416"],
  ["gold/100", "#f6ecd6"], ["gold/400", "#e9b84a"], ["gold/800", "#6e4a08"], ["gold/950", "#3d1205"],
  ["blue/600", "#1a5fd6"],
  ["teal/50", "#e3eef0"], ["teal/800", "#1f5560"],
  ["violet/50", "#ece6f3"], ["violet/800", "#4e3a6e"],
  ["alpha/warm-25-a15", "#fff7f0", 0.15], ["alpha/warm-25-a16", "#fff7f0", 0.16], ["alpha/warm-950-a40", "#1d1416", 0.4],
];
const SEMANTIC_TO_PRIMITIVE = {
  "brand/brand": "red/700", "brand/brand-hover": "red/800", "brand/brand-pressed": "red/900", "brand/brand-soft": "red/200",
  "brand/gold": "gold/400", "brand/gold-ink": "gold/950",
  "sidebar/frame": "red/700", "sidebar/frame-hover": "red/600", "sidebar/frame-active": "warm/25", "sidebar/frame-sunken": "red/850",
  "sidebar/frame-edge": "red/400", "sidebar/on-frame": "warm/25", "sidebar/on-frame-muted": "red/250", "sidebar/on-frame-muted-strong": "red/100",
  "sidebar/on-frame-active-muted": "rose/700", "sidebar/divider": "alpha/warm-25-a15",
  "surface/surface": "base/white", "surface/surface-2": "warm/150", "surface/canvas": "warm/50", "surface/panel": "warm/100",
  "surface/panel-hover": "warm/250", "surface/panel-active": "warm/350", "surface/scrim": "alpha/warm-950-a40",
  "text/ink": "warm/950", "text/ink-2": "warm/700",
  "border/line": "warm/300", "border/rule": "warm/200", "border/line-strong": "warm/550", "border/bubble-edge": "warm/400",
  "state/focus": "blue/600", "state/offline": "warm/500",
  "avatar/red-bg": "red/50", "avatar/red-fg": "red/750", "avatar/amber-bg": "gold/100", "avatar/amber-fg": "gold/800",
  "avatar/teal-bg": "teal/50", "avatar/teal-fg": "teal/800", "avatar/violet-bg": "violet/50", "avatar/violet-fg": "violet/800",
  "avatar/selected-bg": "red/150", "avatar/frame-bg": "alpha/warm-25-a16",
};
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

async function tiers(root, V, vars, paint, T) {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const sem = cols.find((c) => c.name === "GeoAgent / Color" || c.name === "GeoAgent / Semantic");
  sem.name = "GeoAgent / Semantic";
  let prim = cols.find((c) => c.name === "GeoAgent / Primitives");
  if (!prim) { prim = figma.variables.createVariableCollection("GeoAgent / Primitives"); prim.renameMode(prim.modes[0].modeId, "Value"); log.push("+ bộ Primitives"); }
  const pm = prim.modes[0].modeId;
  const P = {};
  for (const v of vars) if (v.variableCollectionId === prim.id) P[v.name] = v;
  for (const [name, hex, a, desc] of PRIMITIVES) {
    let v = P[name];
    if (!v) { v = figma.variables.createVariable(name, prim, "COLOR"); P[name] = v; }
    v.setValueForMode(pm, rgbOf(hex, a));
    v.scopes = []; // ẩn khỏi bộ chọn màu: component chỉ gắn vào tầng Semantic
    v.description = (desc ? desc + ". " : "") + "Tầng 1 (primitive): chỉ sửa ở đây khi đổi màu cho dự án khác.";
    v.setVariableCodeSyntax("WEB", "var(--" + name.replace("/", "-") + ")");
  }
  // Semantic → alias. Kiểm tra trước: giá trị cũ phải trùng mã màu primitive, để màu trên màn hình không đổi.
  const sm = sem.modes[0].modeId;
  const mismatch = [];
  for (const [sName, pName] of Object.entries(SEMANTIC_TO_PRIMITIVE)) {
    const s = V[sName], p = P[pName];
    if (!s) { mismatch.push(sName + " (không có)"); continue; }
    const cur = Object.values(s.valuesByMode)[0];
    if (cur && cur.type !== "VARIABLE_ALIAS") {
      const target = Object.values(p.valuesByMode)[0];
      const d = Math.max(Math.abs(cur.r - target.r), Math.abs(cur.g - target.g), Math.abs(cur.b - target.b), Math.abs((cur.a == null ? 1 : cur.a) - (target.a == null ? 1 : target.a)));
      if (d > 0.6 / 255) { mismatch.push(sName + " " + hexStr(cur) + " ≠ " + pName + " " + hexStr(target)); continue; }
    }
    s.setValueForMode(sm, { type: "VARIABLE_ALIAS", id: p.id });
  }
  if (mismatch.length) throw new Error("Không đổi sang alias vì lệch màu: " + mismatch.join("; "));
  log.push("~ " + Object.keys(SEMANTIC_TO_PRIMITIVE).length + " biến semantic → alias của " + PRIMITIVES.length + " primitive");

  // Bảng primitive trên trang (mục 01, đầu tiên): mỗi ô ghi biến semantic nào đang dùng nó
  const colorSec = root.findChild((n) => n.name === "01 Color");
  if (!colorSec) return;
  const old = colorSec.findChild((n) => n.name === "Group primitives"); if (old) old.remove();
  const usedBy = {};
  for (const [s, p] of Object.entries(SEMANTIC_TO_PRIMITIVE)) (usedBy[p] = usedBy[p] || []).push(s.split("/")[1]);
  const AL = (dir, o) => { const f = figma.createFrame(); f.layoutMode = dir; f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "AUTO"; f.fills = []; for (const k of Object.keys(o || {})) f[k] = o[k]; return f; };
  const grp = AL("VERTICAL", { name: "Group primitives", itemSpacing: 16 });
  colorSec.insertChild(1, grp); grp.layoutSizingHorizontal = "FILL";
  grp.appendChild(T("Tầng 1 · Primitive (mã màu gốc)", 16, 24, "Semi Bold"));
  const note = T("Chỉ tầng này chứa mã màu. Các biến bên dưới (tầng 2 · Semantic) là alias trỏ về đây, và component chỉ gắn vào tầng 2. Làm dự án khác: nhân bản file, sửa mã màu ở tầng 1 (ví dụ red/700 là màu thương hiệu), mọi màn hình tự đổi theo. Primitive bị ẩn khỏi bộ chọn màu để không gắn nhầm.", 14, 22, "Regular", "text/ink-2");
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
  const t2 = T("Tầng 2 · Semantic (vai trò, component gắn vào đây)", 16, 24, "Semi Bold"); t2.name = "Tier 2 label";
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
  const semCol = cols.find((x) => x.name === "GeoAgent / Semantic"), primCol = cols.find((x) => x.name === "GeoAgent / Primitives");
  (colN("GeoAgent / Primitives") === PRIMITIVES.length ? pass : fail)("Token", "Tầng 1 Primitive: " + colN("GeoAgent / Primitives") + " màu (cần " + PRIMITIVES.length + ")");
  (colN("GeoAgent / Semantic") === Object.keys(SEMANTIC_TO_PRIMITIVE).length ? pass : fail)("Token", "Tầng 2 Semantic: " + colN("GeoAgent / Semantic") + " biến (cần " + Object.keys(SEMANTIC_TO_PRIMITIVE).length + ")");
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
  const fb = vars.find((v) => v.name === "avatar/frame-bg"); const fbv = fb && (await resolveColor(fb));
  (fbv && Math.abs(fbv.a - 0.16) < 0.01 ? pass : fail)("Nền tảng", "avatar/frame-bg giữ độ trong suốt 16%" + (fbv ? " (a=" + fbv.a.toFixed(2) + ")" : ""));
  const nTs = (await figma.getLocalTextStylesAsync()).length; (nTs >= 14 ? pass : fail)("Nền tảng", nTs + " kiểu chữ (cần 14)");
  const nFx = (await figma.getLocalEffectStylesAsync()).length; (nFx >= 5 ? pass : fail)("Nền tảng", nFx + " đổ bóng (cần 5, gồm bóng ngăn kéo)");
  const nIcons = root.findAll((n) => n.type === "COMPONENT" && n.name.indexOf("Icon/") === 0).length;
  (nIcons === 39 ? pass : fail)("Icon", nIcons + " icon (cần 39)");
  const EXPECT = { "Icon Button": 6, "Button / Primary": 4, "Round Button": 6, "Scroll Button": 4, "Avatar": 30, "Bot Avatar": 2, "Conversation Item": 6, "Search Field": 3, "Filter Tab": 2, "Language Select": 3, "Chat Header": 2, "Composer": 2 };
  for (const name of Object.keys(EXPECT)) {
    const sets = root.findAll((n) => n.type === "COMPONENT_SET" && n.name === name);
    if (sets.length !== 1) { fail("Component", name + ": có " + sets.length + " bộ (cần 1)"); continue; }
    const k = sets[0].children.length;
    (k === EXPECT[name] ? pass : fail)("Component", name + ": " + k + " biến thể (cần " + EXPECT[name] + ")");
  }
  for (const name of ["Message / User", "Message / Bot", "Typing Indicator", "Data Table"]) {
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
  out.push((unstyled ? "• " : "✓ ") + "[Chữ] " + unstyled + " ô chữ trong component dùng cỡ chữ riêng, không gắn kiểu chữ (Avatar, Filter Tab: cố ý theo code)");

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
