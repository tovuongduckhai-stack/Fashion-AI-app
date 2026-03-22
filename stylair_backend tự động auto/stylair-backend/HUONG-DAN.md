# HƯỚNG DẪN SETUP STYLAIR BACKEND

## BƯỚC 1 — Tạo bảng trong Supabase
1. Vào supabase.com → project stylair
2. Bấm "SQL Editor" bên menu trái
3. Copy toàn bộ nội dung file `supabase-setup.sql`
4. Paste vào và bấm "Run"

## BƯỚC 2 — Điền key vào 3 file functions
Mở 3 file trong thư mục `netlify/functions/`:
- `sepay-webhook.js`
- `sync-user.js`  
- `use-credit.js`

Tìm và thay thế:
- `SUPABASE_URL_HERE` → URL của bro: `https://jvsnvllauayliiasgdze.supabase.co`
- `SUPABASE_SECRET_KEY_HERE` → Secret key từ Supabase Settings → API Keys
- `SEPAY_WEBHOOK_SECRET_HERE` → để trống hoặc điền sau

## BƯỚC 3 — Deploy lên Netlify
1. Kéo thả toàn bộ folder `stylair-backend` lên Netlify
   (hoặc deploy vào site stylair hiện có)
2. Netlify tự detect netlify.toml và deploy functions

## BƯỚC 4 — Tạo webhook trong Sepay
1. Vào sepay.vn → Tích hợp Webhooks → Thêm webhook
2. URL: `https://stylair.netlify.app/.netlify/functions/sepay-webhook`
3. Chọn tài khoản MB Bank → Lưu

## BƯỚC 5 — Cập nhật stylair.html
Mở file `stylair.html`, tìm dòng `const OR_KEY=` và thêm vào đầu:
```
const BACKEND_URL = "https://stylair.netlify.app";
```

## XONG! 
Từ giờ khách chuyển khoản đúng nội dung → Sepay gửi webhook → 
backend tự cộng credits → khách dùng được ngay!
