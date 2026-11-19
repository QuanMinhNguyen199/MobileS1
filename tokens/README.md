# Design token GeoAgent

Một nguồn token cho cả Figma và code. Tên trong Figma, tên biến CSS và class Tailwind khớp nhau,
nên khi code chỉ cần đọc tên token trong Figma (Inspect / Code syntax) rồi dùng class tương ứng.

## Các file

| File | Vai trò | Sửa tay? |
|---|---|---|
| `tokens/geoagent.tokens.json` | Nguồn gốc, chuẩn W3C DTCG | Có (hoặc xuất từ Figma) |
| `scripts/build-tokens.mjs` | Sinh CSS từ JSON | Khi đổi cách sinh |
| `src/tokens.css` | Biến CSS + theme Tailwind, sinh tự động | **Không** |

## Xem token

Trang **Token** trên site thư viện (`/geoagent-icons/tokens.html`, cạnh trang Icon) hiển thị dạng bảng Variables:
Global (màu gốc), Alias (tham chiếu Light / Dark), Component (bộ phận → alias, kèm màu Light / Dark cuối cùng), kiểu chữ, bo góc và đổ bóng. Có tìm kiếm và sao chép tên, giá trị hoặc class. Trang được sinh từ file JSON này bởi
`npm run icons:export` (bước deploy đã chạy lệnh này), nên luôn khớp token hiện tại.

Muốn xem file khác (bản vừa xuất từ Figma, token của dự án khác): kéo thả file `.json` vào trang hoặc bấm
**Chọn file…**. File chỉ đọc trên máy, không tải lên. File có `global` + `alias` (+ `component`; file cũ: `primitive` + `semantic`) hiển thị như trang gốc;
file DTCG khác được nhóm theo `$type` (màu, kiểu chữ, đổ bóng, còn lại). Tham chiếu hỏng được liệt kê ở đầu trang.
Phần hiển thị dùng chung `scripts/token-view.mjs` với bước build, nên hai bên luôn giống nhau.

Tên hiển thị trên bảng: `red/50` thành `red_50`, `base/white` thành `white`, màu vai trò `surface/surface`
thành `alias_surface`. Đây là quy ước trình bày; đường dẫn trong JSON, tên Figma và biến CSS không đổi.
Cột **Dùng trong code** sao chép tên thật đang dùng (`bg-surface`, `var(--surface)`). File JSON tải xuống
giữ nguyên cấu trúc nguồn. CSS của bảng nằm ở `scripts/token-page.css`, được sao chép khi export.

## Ba tầng màu

| Tầng | Ví dụ | Trỏ về | Ai dùng |
|---|---|---|---|
| **Global** | `red/700` → `--red-700: #a3141a` | mã màu | chỉ Alias |
| **Alias** | `brand/brand` → `--brand: var(--red-700)` (tối: `--ember-600`) | Global, có Light/Dark | Component |
| **Component** | `button-primary/bg` → `--button-primary-bg: var(--brand)` | Alias | code component |

- Code component dùng **class Component**: `bg-button-primary-bg`, `text-composer-icon`, `border-search-border`…
  Không dùng thẳng Alias (`bg-brand`) hay Global trong component; class Alias vẫn còn ở vài file chưa chuyển
  (`MobileWebPane.jsx`, `DesktopSidebar.jsx`, `Root.jsx`).
- Đổi màu cho dự án khác: sửa Global (ví dụ `red/700` là màu thương hiệu).
- Đổi màu riêng một bộ phận (ví dụ nút gửi khác nút chính): trỏ token Component đó sang alias khác.
- Thêm bộ phận mới: thêm token vào `component` trong JSON, trỏ về alias có sẵn, rồi `npm run tokens`.

## Giao diện tối

Mỗi màu vai trò có thêm bản tối ở `$extensions.geoagent.dark`, cũng trỏ về một màu gốc
(họ `night/*` cho nền và chữ, `ember/*` cho đỏ, thêm vài bậc của `gold`, `teal`, `violet`, `blue`).
Class không đổi: `bg-brand` tự là đỏ sáng hơn khi tối. Component không cần `dark:`.

- `src/tokens.css` dùng `light-dark()`; trình duyệt cũ dùng `prefers-color-scheme` khi chọn Theo hệ thống.
  Lựa chọn Sáng/Tối thủ công ghi đè token trực tiếp để vẫn hoạt động khi chưa hỗ trợ `light-dark()`.
- Mặc định theo máy. Người dùng chọn Sáng / Tối / Theo hệ thống trong **Cài đặt** (nút ở dòng tên người dùng,
  cuối sidebar). Lựa chọn lưu ở `localStorage` (`color-scheme`) và ghi vào `<meta name="color-scheme">`
  (`src/improved/theme.js`; đoạn script trong `index.html` áp trước khi vẽ để không lóe sai màu).
- Các bảng Cài đặt desktop và mobile đọc chung trạng thái đang áp dụng; đổi ở đâu thì ô chọn ở nơi khác cũng cập nhật.
- Thêm màu vai trò mới: khai báo cả bản sáng và bản tối, rồi kiểm tra tương phản ở cả hai.
- Ảnh đơn sắc màu đen (logo) cần class `invert-on-dark`.
- Figma: plugin thêm mode **Dark** cho bộ GeoAgent / Alias và các màn điện thoại xem trước ở giao diện tối.
  Nếu gói Figma không cho thêm mode, báo cáo của plugin ghi rõ; bản tối vẫn có trong code và tokens.json xuất ra.
- `npm run tokens` cũng ghi bảng token vào `figma-plugin/code.js` (giữa hai dấu `<token-data>`), nên plugin luôn khớp file này.

## Bảng tra nhanh

| Figma | Code |
|---|---|
| Biến Component `button-primary/bg`, `composer/icon`… | `bg-button-primary-bg`, `text-composer-icon` (thay `/` bằng `-`) |
| Biến Alias `brand/brand`, `text/ink-2`… (khi chưa có token Component) | `bg-brand`, `text-ink-2` (tên sau dấu `/`) |
| Kiểu chữ `Body/Message`, `Body/Bubble`, `Body/Input` | `text-message`, `text-bubble`, `text-input` |
| `Display/Welcome title`, `Heading/Chat title`, `Heading/Message heading` | `text-display`, `text-title`, `text-message-heading` |
| `Heading/Brand`, `Label/Button`, `Body/Small` | `font-heading text-wordmark`, `text-button`, `text-small` |
| `Body/Default`, `Caption/Default` | `text-sm`, `text-xs` (Tailwind sẵn có) |
| Bo góc `radius/bubble`, `radius/bubble-tip`, `radius/composer` | `rounded-bubble`, `rounded-br-bubble-tip`, `rounded-composer` |
| Đổ bóng `Shadow/Composer`, `Bot bubble`, `Floating button`, `Login card`, `Drawer` | `shadow-composer`, `shadow-bubble`, `shadow-float`, `shadow-card`, `shadow-drawer` |

Mô tả của từng component trong Figma ghi sẵn cách gọi component React và class cần dùng.

## Đồng bộ từ Figma

1. Sửa token trong Figma (Variables → GeoAgent / Global, Alias hoặc Component; Text / Effect styles).
2. Chạy plugin **GeoAgent DS Builder** → cửa sổ báo cáo → **Tải tokens.json**.
3. Chép đè file vừa tải vào `tokens/geoagent.tokens.json`.
4. `npm run tokens` (ghi `src/tokens.css`). Xem lại diff, chạy app kiểm tra.

`npm run tokens:check` báo lỗi nếu `src/tokens.css` không khớp JSON (dùng được trong CI).
Script cũng từ chối Alias không trỏ về Global và Component không trỏ về Alias, để không ai gõ mã màu thẳng vào tầng trên.
