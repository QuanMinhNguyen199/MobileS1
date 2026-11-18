# GeoAgent Icons v3

38 icon cho GeoAgent, dựng trên Lucide (lucide-react, giấy phép ISC). Tên, nhóm và nhãn tiếng Việt là của GeoAgent; riêng dấu hiệu trợ lý (assistant) được vẽ riêng theo cùng kiểu nét.

## Quy chuẩn

- Lưới 24 × 24, nét 1.75 px, đầu và góc nét tròn. Độ dày nét giữ nguyên ở mọi cỡ (absoluteStrokeWidth).
- 16 px cho icon phụ, 20 px mặc định, 24 px cho thao tác nổi bật.
- Màu currentColor: tự theo màu chữ của component. Không tô cố định màu thương hiệu trong file.
- Sidebar đỏ: trắng ấm; vùng sáng: màu chữ hoặc đỏ thương hiệu. Giữ tương phản icon chức năng tối thiểu 3:1.
- Dấu hiệu assistant (bong bóng hội thoại và dấu định vị) là đề xuất thiết kế, chưa được kiểm chứng nhận diện với người dùng. Không thay thế logo.

## React

Import GeoIcon hoặc các component có tên từ src/improved/icons.jsx, không import thẳng từ lucide-react, để giữ một bộ tên và một độ dày nét chung.

    <button aria-label="Đính kèm tệp"><GeoIcon name="attach" /></button>
    <GeoIcon name="warning" label="Cảnh báo" size={24} />

Icon mặc định aria-hidden, focusable=false. Đặt tên cho nút trên chính nút. Chỉ dùng label khi icon đứng độc lập mang thông tin.

## Thêm icon mới

1. Chọn icon trên lucide.dev.
2. Thêm vào src/improved/icon-data.js: tên GeoAgent, nhãn tiếng Việt, nhóm, tên Lucide.
3. Import component đó theo tên trong src/improved/icons.jsx, để bundler chỉ đóng gói icon đang dùng.
4. Chạy npm run icons:export.

## SVG riêng

Các file SVG có kích thước 24 × 24 và nhãn tiếng Việt. Có thể nhập vào Figma. Khi inline vào nút đã có tên, đặt aria-hidden=true và bỏ role/aria-label của SVG.

Nếu dùng img, màu của phần tử cha không truyền vào file SVG: dùng inline SVG hoặc sprite để đổi màu theo theme.

## Sprite

    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <use href="/geoagent-icons/sprite.svg#geo-search" />
    </svg>

## Xuất lại

Nguồn: src/improved/icon-data.js. Chạy npm run icons:export sau khi chỉnh; không sửa riêng file được sinh trong public/geoagent-icons.
