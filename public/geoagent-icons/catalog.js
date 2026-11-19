
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd');
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
  $('#reset-all').hidden = color === DEFAULT_COLOR && overrides.size === 0;
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
$('#reset-all').addEventListener('click', () => { color = DEFAULT_COLOR; overrides.clear(); paint(); $$('input[name="swatch"]')[0].focus(); });

// Hộp thoại từng icon
function syncDialog() {
  const hex = colorOf(current);
  $('#dlg-preview').style.setProperty('--glyph-color', hex);
  syncSwatches('dlg-swatch', $('#dlg-color'), hex);
  $('#dlg-warning').hidden = !lowContrast(hex);
  $('#dlg-reset').disabled = hex === DEFAULT_COLOR;
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
$('#dlg-reset').addEventListener('click', () => setIconColor(DEFAULT_COLOR));
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

// Định dạng tải: SVG hoặc PNG @1x/@2x/@3x theo cỡ đang chọn
for (const select of $$('.format-select')) select.addEventListener('change', () => { format = select.value; for (const other of $$('.format-select')) other.value = format; });
const scaleOf = (fmt) => Number(fmt.slice(3)) || 1;
const baseName = (name) => 'geoagent-' + (platform === 'shared' ? '' : platform + '-') + name;

async function render(name, fmt) {
  const source = await (await fetch(DIRS[platform] + name + '.svg')).text();
  const px = size() * (fmt === 'svg' ? 1 : scaleOf(fmt));
  const text = source.replaceAll('currentColor', colorOf(name)).replace('width="24" height="24"', 'width="' + px + '" height="' + px + '"');
  const svgBlob = new Blob([text], { type: 'image/svg+xml' });
  if (fmt === 'svg') return { name: baseName(name) + '.svg', blob: svgBlob };
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = new Image(px, px);
    image.src = url;
    await image.decode();
    const canvas = Object.assign(document.createElement('canvas'), { width: px, height: px });
    canvas.getContext('2d').drawImage(image, 0, 0, px, px);
    const blob = await new Promise((done) => canvas.toBlob(done, 'image/png'));
    const scale = scaleOf(fmt);
    return { name: baseName(name) + (scale > 1 ? '@' + scale + 'x' : '') + '.png', blob };
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
  const original = button.innerHTML;
  button.disabled = true;
  button.textContent = label;
  try { await task(); } catch (error) { console.error(error); alert('Không tạo được file. Hãy thử lại.'); }
  finally { button.disabled = false; button.innerHTML = original; }
}
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
  const kind = format === 'svg' ? 'svg' : 'png-' + scaleOf(format) + 'x';
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
$('#size').addEventListener('change', event => document.documentElement.style.setProperty('--glyph-size', event.target.value + 'px'));

const params = new URLSearchParams(location.search);
if (/^[0-9a-f]{6}$/i.test(params.get('mau') || '')) color = '#' + params.get('mau').toLowerCase();
select(SPRITES[params.get('bo')] ? params.get('bo') : 'shared');
paint();
