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
- Trước đây muốn đổi `<title>` theo route: dùng `document.title = ...` (được chạy ở client sau render → flash SEO tệ, không SSR) hoặc `react-helmet` (thêm dependency, quản lý hoist thủ công, lỗi hydration hay gặp).
- Metadata phân tán theo page: mỗi route phải có cách khai báo riêng → dễ thiếu/trùng, không nhất quán.
- React 19 quan sát cây JSX và **di chuyển** các thẻ metadata về `<head>` — SSR stream cũng ghi đúng các thẻ này vào HTML, giải quyết cả SEO ban đầu lẫn sau navigation.

## Khái niệm cốt lõi
- **Hoisting tự động**: React nhận diện các element `<title>`, `<meta name=...>`, `<meta property=...>`, `<link rel="stylesheet">` (và `<link rel="icon"/preload/preconnect">`, `<script async>`, `<style>` với `precedence`) — gom về `<head>`.
- **Dedupe**: cùng một metadata (ví dụ 2 component cùng `<title>`) — React chỉ giữ một; quy tắc ưu tiên: **element render ở vị trí sâu hơn (gần lá) thắng**, và thắng theo container cha nếu trùng.
- **`precedence`**: chỉ định thứ tự trong `<head>` cho stylesheet/script (`"default"`, `"low"`, `"high"`, hoặc tùy biến) — React đảm bảo CSS load đúng thứ tự và tránh nhảy style (FOUC).
- **SSR**: trên server, các thẻ này được output **trong `<head>`** của HTML (không phải tampering sau đó), hydration không mismatch.
- **Client navigation**: khi component mới render metadata khác, React cập nhật `<head>` tương ứng.

## Cú pháp / API

```tsx
function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      {/* Ba thẻ này được hoist vào <head> tự động */}
      <title>{post.title}</title>
      <meta name="description" content={post.excerpt} />
      <link rel="canonical" href={`https://site.com/${post.slug}`} />

      <h1>{post.title}</h1>
      <p>{post.excerpt}</p>
    </article>
  );
}
```

CSS ordering: `<link rel="stylesheet" href="/a.css" precedence="high" />` — stylesheet cùng `precedence` xếp theo thứ tự render, khác `precedence` xếp theo độ ưu tiên.

## Luồng hoạt động (Flow)

1. Component render JSX chứa `<title>`, `<meta>`, `<link>` → React phát hiện "metadata element".
2. React gom vào danh sách metadata của lần render, dedupe theo loại + nội dung/trình tự render.
3. Commit: React cập nhật `<head>` (tạo/xóa/reorder) — server thì ghi thẳng vào HTML head.
4. Navigation đổi metadata → React diff head, chỉ sửa phần khác.

## Ví dụ chi tiết

```tsx
// example.tsx — Document Metadata (React 19)
import { useState } from 'react';

const POSTS = [
  { id: 1, title: 'Học React 19', excerpt: 'Actions, useOptimistic và ref as prop.' },
  { id: 2, title: 'React Compiler 1.0', excerpt: 'Auto-memoization, bỏ useMemo thủ công.' },
];

export default function MetadataDemo() {
  const [activeId, setActiveId] = useState(1);
  const post = POSTS.find((p) => p.id === activeId)!;

  return (
    <div>
      {/* React 19 hoist title/meta lên <head>, dedupe tự động */}
      <title>{post.title} — Blog React</title>
      <meta name="description" content={post.excerpt} />

      <h2>Document Metadata (React 19)</h2>
      <nav>
        {POSTS.map((p) => (
          <button key={p.id} onClick={() => setActiveId(p.id)}>
            {p.title}
          </button>
        ))}
      </nav>
      <article>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <p>
          <small>Mở DevTools → Elements → head để thấy title/meta đổi theo.</small>
        </p>
      </article>
    </div>
  );
}
```

## Giải thích từng phần
- `<title>{post.title} — Blog React</title>` — nằm sâu trong cây nhưng kết quả là `<title>` trong `<head>`; đổi `activeId` → title đổi theo.
- `<meta name="description" content={post.excerpt} />` — component chỉ khai báo cạnh nội dung (colocation); không cần helper.
- Không có `react-helmet`: đây là tính năng native, không thêm bundle.
- Trong SPA dev, DevTools → Elements → head hiển thị sự thay đổi live.

## So sánh với cách làm cũ

| Cách cũ | Cách mới (React 19) | Lợi ích |
|---|---|---|
| `document.title =` trong effect | Render `<title>` declarative | Không flash, SSR có sẵn |
| `react-helmet` (dependency + config) | Metadata native | Bỏ dependency, ít hydration lỗi |
| `next/head` khai báo riêng ở page | Render ngay trong component | Colocation, dễ maintain |
| CSS order phải tự set `<link>` đúng thứ tự | `precedence` prop | React sắp xếp head chuẩn |

## Lỗi thường gặp
1. **Kỳ vọng metadata render "đúng nơi đặt"** (giữa `<article>`) → vì sao: React hoist lên `<head>`; nó không phải nội dung → fix: khai báo ngay trong component rồi để React lo.
2. **Trùng `<title>` giữa layout và page mà muốn layout thắng** → vì sao: element gần lá (sâu hơn) thắng → fix: đặt `title` ở component lá, hoặc cấu trúc lại để chỉ một nơi khai báo.
3. **Dùng metadata cho JSON-LD `<script type="application/ld+json">` phức tạp** → vì sao: API tập trung title/meta/link; script JSON-LD động nên dùng giải pháp SEO/framework riêng → fix: cân nhắc Next Metadata API hoặc thư viện chuyên dụng.
4. **Quên `precedence` khi nạp nhiều stylesheet để "thẻ nào vẽ sau thì thắng"** → vì sao: thứ tự head không theo thứ tự render nữa → fix: set `precedence` tường minh.
5. **Hy vọng hydration "replay" metadata không cần server** → vì sao: với SSR phải có metadata trong HTML server (không thì SEO lỗi) → fix: render metadata ở Server Component/route rendering phía server.

## Khi nào dùng / Khi nào không
- **Dùng**: title/meta description/canonical/OG theo page trong SPA/SSR, stylesheet ordering với `precedence`, preload asset.
- **Không dùng**: SEO framework nặng (sitemap, i18n hreflang tự động, JSON-LD phức tạp, OG image động per-meta quản lý riêng) — giữ Next/Remix Metadata API cho những case đó.

## Bài tập nhỏ
- Tạo mini blog 2 route (via state) với mỗi route tự render `<title>`, `<meta description>`, `<link rel="canonical">`. Thêm `<link rel="stylesheet" precedence="high">` và một stylesheet `precedence="low"` — mở DevTools → Elements → head và ghi lại thứ tự sắp xếp; thử swap `precedence` để thấy thay đổi.

## Reference
- [React 19 Release — Document Metadata](https://react.dev/blog/2024/12/05/react-19#support-for-document-metadata)
- [<title> reference](https://react.dev/reference/react-dom/components/title)
- [<meta> reference](https://react.dev/reference/react-dom/components/meta)
- [<link> reference](https://react.dev/reference/react-dom/components/link)