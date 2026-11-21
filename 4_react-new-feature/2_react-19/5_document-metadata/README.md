# 5. Document Metadata

## Mô tả
- Bài này giới thiệu **Document Metadata** của React 19 (ra mắt **12/2024**, **status: stable**): component được phép render **`<title>`, `<meta>`, `<link>` trực tiếp** trong JSX ở bất kỳ đâu — React tự **hoist lên `<head>`**.
- Kèm theo: `<link rel="stylesheet">` với prop `precedence` để sắp xếp CSS đúng thứ tự, dedupe tự động, và hỗ trợ nguyên bản trong **SSR** (metadata xuất hiện trong HTML server, không cần hiệu ứng mong manh).
- Về cơ bản thay thế `react-helmet`/`next/head` cho các nhu cầu phổ biến.

## Mục tiêu
- Colocate title/meta với đúng component (thường là page/route) thay vì quản `<head>` tập trung.
- Hiểu quy tắc ưu tiên khi trùng `<title>`/`<meta>` và cách dùng `precedence` cho stylesheet.
- Biết giới hạn: không thay công cụ SEO nặng (sitemap, JSON-LD phức tạp, i18n hreflang).

## Vấn đề giải quyết

Mục này kể chuyện "cuộc chiến `<head>`" trước 19: `document.title` thủ công hay `react-helmet` đều có điểm yếu riêng. Đọc để thấy metadata native xử lý ra sao.

- Trước đây muốn đổi `<title>` theo route: dùng `document.title = ...` (được chạy ở client sau render → flash SEO tệ, không SSR) hoặc `react-helmet` (thêm dependency, quản lý hoist thủ công, lỗi hydration hay gặp). Ví von: như phải thuê người chạy lên tầng thượng (head) mỗi lần đổi biển hiệu, trong khi giờ chỉ cần ghi biển hiệu ngay tại quầy — React tự mang lên.
- Metadata phân tán theo page: mỗi route phải có cách khai báo riêng → dễ thiếu/trùng, không nhất quán.
- React 19 quan sát cây JSX và **di chuyển** các thẻ metadata về `<head>` — SSR stream cũng ghi đúng các thẻ này vào HTML, giải quyết cả SEO ban đầu lẫn sau navigation.

## Khái niệm cốt lõi

Mục này giải thích "quy tắc bốc xếp": React gom metadata về `<head>` thế nào, ai thắng khi trùng, và `precedence` xếp hàng CSS ra sao. Hãy hình dung `<head>` như sân khấu chính còn các thẻ metadata là "đạo diễn tuyển vai" — React đọc danh sách đăng ký từ khắp các component rồi tự sắp lịch diễn, người đăng ký từ "sâu trong hậu trường" (component gần lá) được ưu tiên.

- **Hoisting tự động**: React nhận diện các element `<title>`, `<meta name=...>`, `<meta property=...>`, `<link rel="stylesheet">` (và `<link rel="icon"/preload/preconnect">`, `<script async>`, `<style>` với `precedence`) — gom về `<head>`.
- **Dedupe**: cùng một metadata (ví dụ 2 component cùng `<title>`) — React chỉ giữ một; quy tắc ưu tiên: **element render ở vị trí sâu hơn (gần lá) thắng**, và thắng theo container cha nếu trùng.
- **`precedence`**: chỉ định thứ tự trong `<head>` cho stylesheet/script (`"default"`, `"low"`, `"high"`, hoặc tùy biến) — React đảm bảo CSS load đúng thứ tự và tránh nhảy style (FOUC).
- **SSR**: trên server, các thẻ này được output **trong `<head>`** của HTML (không phải tampering sau đó), hydration không mismatch.
- **Client navigation**: khi component mới render metadata khác, React cập nhật `<head>` tương ứng.

> **Tóm gọn 1 câu:** Khai báo metadata ngay cạnh nội dung — React gom lên `<head>`, trùng thì thằng gần lá thắng, CSS xếp hàng theo `precedence`.

## Cú pháp / API

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

CSS ordering: `<link rel="stylesheet" href="/a.css" precedence="high" />` — stylesheet cùng `precedence` xếp theo thứ tự render, khác `precedence` xếp theo độ ưu tiên.

## Luồng hoạt động (Flow)

Mục này mô tả 4 bước từ lúc JSX chứa metadata được render tới lúc `<head>` được cập nhật (client) hoặc ghi sẵn (server).

1. Component render JSX chứa `<title>`, `<meta>`, `<link>` → React phát hiện "metadata element".
2. React gom vào danh sách metadata của lần render, dedupe theo loại + nội dung/trình tự render.
3. Commit: React cập nhật `<head>` (tạo/xóa/reorder) — server thì ghi thẳng vào HTML head.
4. Navigation đổi metadata → React diff head, chỉ sửa phần khác.

> **Tóm gọn 1 câu:** Metadata đi theo component như "thẻ tên" đeo sẵn — React thu thập, lọc trùng rồi treo lên `<head>` đúng lúc, cả server lẫn client.

## Ví dụ chi tiết

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- `<title>{post.title} — Blog React</title>` — nằm sâu trong cây nhưng kết quả là `<title>` trong `<head>`; đổi `activeId` → title đổi theo.
- `<meta name="description" content={post.excerpt} />` — component chỉ khai báo cạnh nội dung (colocation); không cần helper.
- Không có `react-helmet`: đây là tính năng native, không thêm bundle.
- Trong SPA dev, DevTools → Elements → head hiển thị sự thay đổi live.

## So sánh với cách làm cũ

Bảng dưới đặt các giải pháp "thời tiền 19" cạnh metadata native. Đọc theo hàng: mỗi dòng là một dependency hoặc thủ công từng phải cài đặt.

| Cách cũ | Cách mới (React 19) | Lợi ích |
|---|---|---|
| `document.title =` trong effect | Render `<title>` declarative | Không flash, SSR có sẵn |
| `react-helmet` (dependency + config) | Metadata native | Bỏ dependency, ít hydration lỗi |
| `next/head` khai báo riêng ở page | Render ngay trong component | Colocation, dễ maintain |
| CSS order phải tự set `<link>` đúng thứ tự | `precedence` prop | React sắp xếp head chuẩn |

> **Cách đọc bảng này:** đọc từ trên xuống — hai hàng đầu là về title, hai hàng sau là về thứ tự CSS và cách tổ chức code; cột "Cách cũ" là nơi bạn dò xem dự án mình còn dùng gì.

## Lỗi thường gặp

Mục này là 5 hiểu lầm phổ biến về metadata native — đặc biệt là kỳ vọng nó render "đúng nơi đặt" (số 1) và tưởng layout thắng khi trùng title (số 2).
1. **Kỳ vọng metadata render "đúng nơi đặt"** (giữa `<article>`) → vì sao: React hoist lên `<head>`; nó không phải nội dung → fix: khai báo ngay trong component rồi để React lo.
2. **Trùng `<title>` giữa layout và page mà muốn layout thắng** → vì sao: element gần lá (sâu hơn) thắng → fix: đặt `title` ở component lá, hoặc cấu trúc lại để chỉ một nơi khai báo.
3. **Dùng metadata cho JSON-LD `<script type="application/ld+json">` phức tạp** → vì sao: API tập trung title/meta/link; script JSON-LD động nên dùng giải pháp SEO/framework riêng → fix: cân nhắc Next Metadata API hoặc thư viện chuyên dụng.
4. **Quên `precedence` khi nạp nhiều stylesheet để "thẻ nào vẽ sau thì thắng"** → vì sao: thứ tự head không theo thứ tự render nữa → fix: set `precedence` tường minh.
5. **Hy vọng hydration "replay" metadata không cần server** → vì sao: với SSR phải có metadata trong HTML server (không thì SEO lỗi) → fix: render metadata ở Server Component/route rendering phía server.

> **Tóm gọn 1 câu:** Metadata native là "trợ lý gác head" cho title/meta/CSS thường ngày — SEO hạng nặng vẫn phải nhờ chuyên gia (framework).

## Khi nào dùng / Khi nào không
- **Dùng**: title/meta description/canonical/OG theo page trong SPA/SSR, stylesheet ordering với `precedence`, preload asset.
- **Không dùng**: SEO framework nặng (sitemap, i18n hreflang tự động, JSON-LD phức tạp, OG image động per-meta quản lý riêng) — giữ Next/Remix Metadata API cho những case đó.

## Bài tập nhỏ

Bài tập cho bạn thấy tận mắt thứ tự sắp xếp trong `<head>` — điều mà chỉ đọc lý thuyết khó hình dung.

- Tạo mini blog 2 route (via state) với mỗi route tự render `<title>`, `<meta description>`, `<link rel="canonical">`. Thêm `<link rel="stylesheet" precedence="high">` và một stylesheet `precedence="low"` — mở DevTools → Elements → head và ghi lại thứ tự sắp xếp; thử swap `precedence` để thấy thay đổi.

> **Tóm gọn 1 câu:** Swap `precedence` mà thấy CSS đổi hàng trong head là bạn đã nắm cơ chế xếp hạng của nó.

## Reference
- [React 19 Release — Document Metadata](https://react.dev/blog/2024/12/05/react-19#support-for-document-metadata)
- [<title> reference](https://react.dev/reference/react-dom/components/title)
- [<meta> reference](https://react.dev/reference/react-dom/components/meta)
- [<link> reference](https://react.dev/reference/react-dom/components/link)