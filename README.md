# MobileS1 — GeoAgent

Giao diện React + Vite. Yêu cầu Node.js 22.12+ và npm.

## Chạy trên máy

```sh
npm ci
npm run dev
```

## Deploy GitHub Pages bằng GitHub Actions

Workflow: `.github/workflows/deploy-pages.yml`.

1. Đưa mã nguồn và workflow lên nhánh `main` của repository `QuanMinhNguyen199/MobileS1`.
2. Trong repository, mở **Settings → Pages → Build and deployment → Source**, chọn **GitHub Actions**.
3. Trong tab **Actions**, chọn **Deploy GeoAgent to GitHub Pages → Run workflow** nếu lần push đầu diễn ra trước khi bật Pages.
4. Mở URL trong kết quả deployment sau khi workflow thành công.

Địa chỉ dự kiến: https://quanminhnguyen199.github.io/MobileS1/

Trang icon: https://quanminhnguyen199.github.io/MobileS1/geoagent-icons/index.html

Mỗi lần push lên `main`, workflow cài dependency từ lockfile, xuất icon, build rồi deploy thư mục `dist`. Không cần commit `node_modules` hoặc `dist`, không cần thêm token cá nhân.

Vite dùng `base: "./"`; ảnh runtime dùng `import.meta.env.BASE_URL`, liên kết trong trang icon dùng đường dẫn tương đối. Vì vậy bản build chạy được ở cả đường dẫn gốc và dưới thư mục repository.

## Build và xem trước

```sh
npm run icons:export
npm run build
npm run preview
```

`dist/` là bộ file tĩnh để deploy. Xem qua HTTP bằng lệnh preview; không mở `index.html` bằng `file://`.

## Dùng file ZIP đã build

File bàn giao trên máy: `release/geoagent-github-pages.zip`.

Để deploy thủ công, giải nén rồi đưa **nội dung bên trong ZIP** lên thư mục gốc của một nhánh `gh-pages` hoặc repository chỉ chứa site tĩnh. `index.html` phải nằm ngay ở gốc nhánh, cùng `assets/`, `login/` và `geoagent-icons/`.

Chọn **Settings → Pages → Source: Deploy from a branch**, chọn nhánh chứa file tĩnh và thư mục **/(root)**. Đây là cách thay thế cho workflow Actions; chỉ chọn một cách deploy.

File ZIP là bản chụp tại thời điểm build. Sau khi sửa mã nguồn cần build và đóng gói lại.

## Phạm vi bản demo

Đăng nhập và phản hồi AI hiện là mô phỏng trong frontend. GitHub Pages phục vụ giao diện tĩnh; không cung cấp API hay máy chủ xác thực cho ứng dụng này.

Tài liệu: [Vite — static deploy](https://vite.dev/guide/static-deploy), [GitHub — deploy bằng Actions](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically).
