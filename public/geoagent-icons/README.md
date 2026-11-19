# GeoAgent Icons v3

39 icon cho GeoAgent, dựng trên Lucide (lucide-react, giấy phép ISC). Tên, nhóm và nhãn tiếng Việt là của GeoAgent; riêng dấu hiệu trợ lý (assistant) được vẽ riêng theo cùng kiểu nét.

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

## Ba bộ: dùng chung, iPhone, Android

Một số icon đổi hình theo thói quen từng nền tảng: quay lại (iPhone: chevron), tùy chọn (Android: ba chấm dọc), gửi (Android: máy bay giấy), chia sẻ (Android: ba nút nối). Các icon còn lại giống nhau ở cả ba bộ.

- Dùng chung: thư mục gốc, sprite.svg
- iPhone: ios/, sprite-ios.svg
- Android: android/, sprite-android.svg

Trong React: <GeoIcon name="back" platform="ios" />. Mặc định platform="shared".

## Đổi màu và tải PNG trên trang catalog

- Màu cả bộ: chọn ở thanh công cụ; ô đầu tiên (đỏ GeoAgent) là màu mặc định.
- Màu riêng: bấm một icon, chọn màu trong hộp thoại; Áp dụng màu này cho tất cả đặt màu đó cho cả bộ và bỏ các màu riêng.
- Tải dạng SVG hoặc PNG. PNG có cỡ đúng bằng Kích thước đang chọn (16 đến 48 px). Tải cả bộ tạo file .zip của bộ đang xem ngay trong trình duyệt.
- Màu riêng từng icon chỉ giữ trong lần mở trang; màu cả bộ được ghi vào link (?mau=).

## Sprite

    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <use href="/geoagent-icons/sprite.svg#geo-search" />
    </svg>

## Xuất lại

Nguồn: src/improved/icon-data.js. Chạy npm run icons:export sau khi chỉnh; không sửa riêng file được sinh trong public/geoagent-icons.
