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

Trang **Token** trên site thư viện (`/geoagent-icons/tokens.html`, cạnh trang Icon): ô màu thật, mẫu chữ,
bo góc, đổ bóng, tìm kiếm và bấm để sao chép class. Trang được sinh từ file JSON này bởi
`npm run icons:export` (bước deploy đã chạy lệnh này), nên luôn khớp token hiện tại.

## Hai tầng màu

- **Primitive** (`--red-700`, `--warm-950`…): mã màu gốc. Chỉ tầng này chứa mã màu.
- **Semantic** (`--brand`, `--frame`, `--ink`…): vai trò, luôn trỏ về một primitive.
  Component chỉ dùng semantic, qua class Tailwind: `bg-brand`, `text-ink-2`, `border-divider`…

Đổi màu cho dự án khác: sửa primitive (ví dụ `red/700` là màu thương hiệu), chạy `npm run tokens`.

## Bảng tra nhanh

| Figma | Code |
|---|---|
| Biến `brand/brand`, `sidebar/frame`, `text/ink-2`… | `bg-brand`, `bg-frame`, `text-ink-2` (tên sau dấu `/`) |
| Kiểu chữ `Body/Message`, `Body/Bubble`, `Body/Input` | `text-message`, `text-bubble`, `text-input` |
| `Display/Welcome title`, `Heading/Chat title`, `Heading/Message heading` | `text-display`, `text-title`, `text-message-heading` |
| `Heading/Brand`, `Label/Button`, `Body/Small` | `font-heading text-wordmark`, `text-button`, `text-small` |
| `Body/Default`, `Caption/Default` | `text-sm`, `text-xs` (Tailwind sẵn có) |
| Bo góc `radius/bubble`, `radius/bubble-tip`, `radius/composer` | `rounded-bubble`, `rounded-br-bubble-tip`, `rounded-composer` |
| Đổ bóng `Shadow/Composer`, `Bot bubble`, `Floating button`, `Login card`, `Drawer` | `shadow-composer`, `shadow-bubble`, `shadow-float`, `shadow-card`, `shadow-drawer` |

Mô tả của từng component trong Figma ghi sẵn cách gọi component React và class cần dùng.

## Đồng bộ từ Figma

1. Sửa token trong Figma (Variables → GeoAgent / Primitives hoặc Semantic; Text / Effect styles).
2. Chạy plugin **GeoAgent DS Builder** → cửa sổ báo cáo → **Tải tokens.json**.
3. Chép đè file vừa tải vào `tokens/geoagent.tokens.json`.
4. `npm run tokens` (ghi `src/tokens.css`). Xem lại diff, chạy app kiểm tra.

`npm run tokens:check` báo lỗi nếu `src/tokens.css` không khớp JSON (dùng được trong CI).
Script cũng từ chối semantic không phải alias của primitive, để không ai gõ mã màu thẳng vào tầng vai trò.
