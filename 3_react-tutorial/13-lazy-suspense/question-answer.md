# DAY 13 — Hỏi & Đáp: Lazy + Suspense

> File hỏi–đáp chi tiết cho `3_react-tutorial/13-lazy-suspense`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (lazy + prefetch + boundary chạy được).

---

## 1. `lazy()` + `import()` là gì? Vite tách chunk thế nào?

**Hỏi:** `lazy(() => import("./HeavyChart"))` có gì khác `import HeavyChart from ...` thường?

**Đáp:**
- Import thường chui vào **bundle chính** (tải ngay từ đầu). `import()` động là cú pháp ES —
  Vite nhận diện và tách module đó thành **chunk riêng**, trình duyệt chỉ tải **lần đầu component được render**.
- `lazy` bọc component để React hiểu "đây là component tải muộn, có thể suspend".
- Tương đương `loadChildren` của Angular Router: màn hình nặng (chart, editor) không bắt user tải ngay.

---

## 2. `<Suspense fallback>` để làm gì? Không bọc thì sao?

**Hỏi:** Bỏ `Suspense` mà render thẳng `HeavyChart` được không?

**Đáp:**
- **Không.** Chunk chưa về → component "suspend" → React **báo lỗi** "needs a Suspense boundary".
  `fallback` (`Đang tải biểu đồ...`) là UI chờ bắt buộc cho mọi thứ suspend bên trong
  (lazy ở bài này, `use()` đọc promise ở DAY 12).
- Chu kỳ: mount → suspend → fallback → chunk về → render thật. Remount sau **không tải lại** (đã cache).

---

## 3. Vì sao Error Boundary phải nằm NGOÀI Suspense?

**Hỏi:** `fallback` của Suspense hiện lỗi tải chunk luôn được không?

**Đáp:**
- **Không.** Mất mạng khi tải chunk → promise reject → `lazy` component **throw lỗi** (không phải suspend).
  `fallback` chỉ bắt *chờ*, không bắt *lỗi* — phải có Error Boundary (class hoặc `react-error-boundary`)
  **bên ngoài** Suspense mới bắt được: `Boundary > Suspense > HeavyChart`.
- Thứ tự đúng trong example: `show && <ErrorBoundary><Suspense><HeavyChart/></Suspense></ErrorBoundary>`.
  Đây là phần hay quên nhất bài này.

---

## 4. Prefetch là gì? `onMouseEnter={() => import(...)}` có tác dụng gì?

**Hỏi:** Dòng prefetch trong example tải 2 lần à?

**Đáp:**
- Không — `import()` cùng module chỉ tải **1 lần** (browser cache theo URL chunk).
  Gọi sớm khi hover (hoặc idle) để chunk **về trước**; lúc click mở thì component render ngay, không thấy fallback.
- Dành cho màn hình user "hầu như chắc chắn" mở tiếp (bước tiếp theo của wizard, tab hay dùng).
  Route-level thì React Router tự lo qua `lazy` route (DAY 14) — không cần viết tay.

---

## 5. Khi nào tách chunk? Tách bừa có hại không?

**Hỏi:** Component nào cũng `lazy` cho nhẹ bundle đầu?

**Đáp:**
- Chỉ tách thứ **nặng + ít dùng ngay**: chart, editor, trang admin, modal phức tạp.
  Tách bừa component nhỏ → thêm request HTTP + hiện fallback giật cục, tổng còn chậm hơn.
- Nguyên tắc: bundle đầu nhỏ (route chính + UI khung), còn lại tải theo nhu cầu + prefetch điểm nóng.

---

## 6. `lazy` đòi `{ default: Component }`: named export thì sao?

**Hỏi:** File export `export function Chart()` (không default) mà `lazy(() => import(...))` trắng trang — vì sao?

**Đáp:**
- `import("./X")` trả về **module namespace object** (`{ Chart: fn, ... }`), còn `lazy` chỉ đọc thuộc tính `default`. Không có default thì `lazy` nhận `undefined` — chunk tải về rồi mà component rỗng, React render trắng không báo rõ.
- Cơ chế fix: chêm `.then` để ánh xạ named export thành default ngay tại chỗ `lazy`. Không sửa file gốc (giữ named export cho nơi khác import thường), chỉ adapter ở điểm lazy.
- Quy tắc nhận diện: mở file định lazy — thấy `export default` thì `lazy(() => import(...))` trực tiếp; thấy `export function/chart` thì phải có `.then(m => ({ default: m.Chart }))`. Sai shape này là lỗi top 3 của bài lazy.

```tsx
import { lazy } from "react";

// File HeavyChart.tsx chỉ có named export: export function HeavyChart() {...}
// Adapter: gói named export thành default để lazy hiểu được
const HeavyChart = lazy(() =>
  import("./HeavyChart").then((m) => ({ default: m.HeavyChart }))
);
```

---

## 7. Suspense lồng nhau + fallback nhỏ: đặt boundary ở đâu cho khỏi "nháy cả trang"?

**Hỏi:** Bọc 1 Suspense quanh cả trang, tải widget chart mà cả trang hiện spinner — đúng không?

**Đáp:**
- Sai về phạm vi. Cơ chế: khi bất kỳ child nào bên trong Suspense suspend, React hiện **fallback của Suspense gần nhất** thay cho **toàn bộ vùng** nó bọc. Bọc cả trang thì tải 1 widget cũng thay cả trang bằng spinner — giật cục, mất nội dung đang đọc.
- Fix: đặt **Suspense nhỏ sát từng vùng lazy** (mỗi widget/chart một boundary với fallback dòng nhỏ như skeleton gọn), vùng nào tải thì vùng đó chờ, phần còn lại đứng yên. Nhiều Suspense lồng nhau thì boundary gần nhất thắng — tận dụng để trang có skeleton tổng + widget có spinner riêng.
- Fallback nên nhỏ (dòng "Đang tải biểu đồ..." hoặc skeleton cùng kích thước) — fallback to bằng cả trang khi tải nhanh sẽ "nháy" khó chịu. Kết hợp `useTransition` khi điều hướng để giữ UI cũ thay vì nháy fallback.

```tsx
import { Suspense, lazy } from "react";

const HeavyChart = lazy(() =>
  Promise.resolve({ default: () => <div>Biểu đồ nặng (chunk riêng)</div> })
);

function Dashboard() {
  return (
    <div>
      <h1>Tổng quan (luôn hiện, không bị fallback nuốt)</h1>
      {/* Suspense nhỏ ôm sát widget lazy: chỉ vùng này chờ, trang còn lại yên */}
      <Suspense fallback={<p>Đang tải biểu đồ...</p>}>
        <HeavyChart />
      </Suspense>
    </div>
  );
}
```

---

## 8. Route-level lazy (React Router v7) khác `lazy()` tay ở đâu?

**Hỏi:** `lazy: () => import("./pages/Chart")` trong object route có cần `<Suspense>` tay không?

**Đáp:**
- Không cần viết tay. Cơ chế: data router của React Router v7 nhận `lazy` là hàm trả module route (`{ Component, loader, action }`), tự tách chunk khi **lần đầu vào route**, tự bọc Suspense nội bộ và chạy `loader` trước render. Bạn chỉ khai route, Router lo chunk + chờ + lỗi (qua `errorElement`).
- Khác với `lazy()` tay ở DAY 13 ở chỗ: `lazy()` tay tách **component lẻ trong trang** (chart, editor, modal nặng) và bạn tự bọc Suspense + ErrorBoundary; `lazy` route tách **cả trang** theo URL và Router tự lo. Prod dùng cả hai: route cho trang, `lazy()` tay cho widget nặng trong trang.
- Sai thì sao: vừa dùng `lazy` route vừa bọc thêm Suspense tay quanh `RouterProvider` là thừa, fallback chồng nhau. Fix: route để Router lo; chỉ bọc tay cho widget trong component.

```tsx
import { createBrowserRouter } from "react-router";

// Route lazy: vào /chart lần đầu mới tải chunk ChartPage, Router tự chờ + bắt lỗi
const router = createBrowserRouter([
  {
    path: "/chart",
    lazy: () => import("./pages/Chart"), // module export { Component, loader?, action? }
    // errorElement: <p>Không tải được trang.</p>, // bắt lỗi chunk/loader ở tầng route
  },
]);
```

---

## 9. Prefetch helper tái dùng + khi nào KHÔNG nên prefetch?

**Hỏi:** `onMouseEnter={() => import(...)}` viết mỗi nút một lần có gọn không? Prefetch bừa có hại?

**Đáp:**
- Viết gọn bằng helper dùng lại cache của `import()`: định nghĩa `const loadChart = () => import("./HeavyChart")` một lần, `lazy(loadChart)` dùng nó để tải muộn, `onMouseEnter={loadChart}` dùng nó để tải sớm. Hai đường cùng module URL nên trình duyệt chỉ tải 1 lần — hover trước thì click không chờ.
- Cơ chế khi không nên prefetch: chunk nặng mà user **hiếm khi mở** (trang admin, modal xóa sâu) — prefetch là tải thừa, tốn băng thông + pin mobile. Chỉ prefetch điểm nóng "hầu như chắc chắn mở tiếp" (bước tiếp wizard, tab hay dùng, nút chính trên hero). Trigger tốt: hover/focus nút, `requestIdleCallback` khi rảnh, IntersectionObserver khi link vào viewport.
- Sai thì sao: gọi `import()` trong thân render (mỗi render tải một lần tư duy) — thực tế cache nên không tải lại nhưng vẫn tạo promise rác + khó đọc. Fix: chỉ gọi trong event/idle, không gọi trong render.

| Trigger prefetch | Khi nào dùng | Ví dụ |
|---|---|---|
| `onMouseEnter`/`onFocus` nút | User sắp bấm (vài trăm ms sau) | Nút "Mở biểu đồ" |
| `requestIdleCallback` sau mount | Màn tiếp theo rất hay mở | Bước 2 của wizard |
| Không prefetch | Màn hiếm, chunk to | Trang admin, editor nặng ít dùng |

---

## 10. Lỗi thực chiến: `lazy` trong `if` + prefetch mỗi render + tự viết `componentDidCatch`?

**Hỏi:** Ba cách viết sai này gây hậu quả gì và fix chuẩn là gì?

**Đáp:**
- **Khai `lazy` trong `if`/trong component**: mỗi render tạo một `lazy` mới với promise mới → React tưởng component mới, unmount/remount liên tục, chunk tải lại + state mất. Fix: khai `lazy` ở **module scope** (ngoài component), một lần duy nhất.
- **Prefetch trong render** (`import()` gọi trực tiếp trong thân component): chạy mỗi render, tạo promise mỗi lần, che mất ý định "chỉ tải khi user sắp cần". Fix: dời vào handler (`onMouseEnter`) hoặc helper có điều kiện.
- **Tự viết class `componentDidCatch` cho từng chỗ**: lặp code, khó reset sau lỗi (kẹt fallback). Fix: dùng `react-error-boundary` với `fallback` + `resetKeys` (đổi key như route là tự thử lại), `onError` log tập trung.
- Cơ chế chung: `lazy` là khai báo tĩnh (như route), Suspense/ErrorBoundary là khung tĩnh bao quanh — không tạo mới chúng theo điều kiện render.

```tsx
// ĐÚNG: lazy ở module scope, prefetch trong event, boundary có resetKeys
import { Suspense, lazy, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

// Khai một lần ngoài component: promise ổn định, không remount oan
const HeavyChart = lazy(() =>
  Promise.resolve({ default: () => <div>Biểu đồ nặng (chunk riêng)</div> })
);
const preload = () => import("./example"); // helper prefetch dùng lại cache

function App() {
  const [show, setShow] = useState(false); // mở/tắt biểu đồ
  return (
    <>
      {/* Prefetch khi hover, mở khi click: 2 hành động tách bạch */}
      <button onMouseEnter={preload} onClick={() => setShow(true)}>Mở biểu đồ</button>
      {show && (
        <ErrorBoundary fallback={<p>Tải thất bại, thử lại.</p>}>
          <Suspense fallback={<p>Đang tải...</p>}>
            <HeavyChart />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
}
```

---

## 11. Đo chunk sau build: biết `index` có phình không?

**Hỏi:** Tách lazy rồi, kiểm tra hiệu quả ở đâu?

**Đáp:**
- Chạy `npm run build` và đọc báo cáo chunk của Vite: file `index-[hash].js` phải nhỏ (khung + route chính), các màn/widget lazy thành `HeavyChart-[hash].js`, `Chart-[hash].js` riêng. Vào Network tab, bấm nút mở chart lần đầu thấy request chunk mới — lần 2 không thấy (cache) là đạt.
- Cơ chế mục tiêu: bundle đầu nhỏ thì FCP/TTI nhanh; chunk theo route/widget tải theo nhu cầu + prefetch điểm nóng. Nếu `index` vẫn to, nghĩa là import thường (không `import()`) còn lôi chart vào bundle chính — rà lại import tĩnh sót.
- Gắn vào quy trình: bật `vite-bundle-visualizer` (hoặc `rollup-plugin-visualizer`) ở CI để phát hiện chunk phình bất ngờ khi ai đó import lib nặng vào bundle chính. Đây là "test hiệu năng tĩnh" rẻ nhất cho code splitting.

| Kiểm tra | Tín hiệu đạt | Tín hiệu hỏng |
|---|---|---|
| `npm run build` kích thước chunk | `index` nhỏ, chart tách riêng | `index` to, không thấy chunk chart |
| Network lần 1 mở chart | Có request chunk mới + fallback ngắn | Không request mà vẫn chậm (nằm trong index) |
| Mở lần 2 | Không request (cache) | Tải lại (lazy khai trong render) |

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 13)
- https://react.dev/reference/react/lazy · https://react.dev/reference/react/Suspense
- https://vite.dev/guide/features.html#dynamic-import (code splitting)
