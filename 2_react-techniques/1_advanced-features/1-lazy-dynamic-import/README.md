# Lazy + Dynamic Import (React 19)

> Nguồn: https://react.dev/reference/react/lazy — https://react.dev/reference/react/Suspense

## Mục tiêu

### 1. Giảm kích thước bundle ban đầu (First Load) bằng cách tách code thành các chunk nhỏ

**Vì sao mục tiêu này tồn tại:** một SPA React thông thường khi build sẽ gom toàn bộ trang, component và thư viện vào một file `index-*.js` duy nhất. Người dùng vừa mở trang đăng nhập đã phải tải cả code của dashboard, báo cáo, editor — những thứ họ chưa hề dùng. Trên mạng 4G chậm, mỗi 100KB gzip thêm vào tương đương hàng trăm mili-giây chờ trắng màn hình, kéo LCP và TTI đi xuống, tăng tỉ lệ rời trang.

**Cơ chế đạt được:** khi ta viết `lazy(() => import('./ReportsPage'))`, bundler (Vite/Rollup) nhìn thấy lời gọi `import()` động có đường dẫn tĩnh và cắt module đó ra thành một chunk `.js` riêng, có hash riêng. File `index` chính không còn chứa code đó nữa, chỉ còn một câu lệnh tải lười. Trình duyệt vì thế chỉ tải chunk nặng đúng lúc route được mở hoặc nút được bấm.

**Code minh họa (comment tiếng Việt):**

```tsx
// ✅ ĐÚNG: route nặng tách thành chunk riêng — main bundle nhẹ đi trông thấy
import { lazy } from 'react';
// Vite thấy import('./pages/ReportsPage') → sinh file reports-abc123.js riêng
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
```

**Sai thì sao + fix:**

```tsx
// ❌ SAI: import tĩnh nhét toàn bộ ReportsPage + thư viện chart vào main bundle
import ReportsPage from './pages/ReportsPage'; // dù user ở /login vẫn phải tải

// ✅ ĐÚNG: chuyển sang lazy để ReportsPage nằm chunk riêng
import { lazy } from 'react';
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
```

### 2. Chỉ tải component/thư viện nặng khi thực sự cần (khi route được mở, khi user bấm nút)

**Vì sao:** nhiều thư viện nặng hàng trăm KB (recharts, monaco-editor, pdfjs, exceljs) chỉ xuất hiện ở một vài màn hình. Nếu nhét sẵn vào bundle đầu, 90% lượt truy cập phải trả giá cho 10% tính năng. Nguyên tắc là "trả tiền đúng lúc dùng": chưa bấm nút "Mở biểu đồ" thì chưa tải chart.

**Cơ chế:** có hai thời điểm kích hoạt. Một là mount của lazy component — khi `{show && <HeavyChart/>}` chuyển từ `false` sang `true`, React mới gọi factory `() => import(...)` và bắt đầu tải network. Hai là gọi `import()` thủ công trong event handler — promise chạy đúng lúc click, ta tự `setState` module đã tải.

**Code minh họa:**

```tsx
// ✅ ĐÚNG: chunk chart chỉ bắt đầu tải khi user bấm nút
const [show, setShow] = useState(false);
<button onClick={() => setShow(true)}>Mở biểu đồ</button>
{show && (
  <Suspense fallback={<p>Đang tải biểu đồ…</p>}>
    <HeavyChart />
  </Suspense>
)}
```

**Usecase thực tế:** trang quản trị có nút "Xuất Excel" dùng `exceljs` (~800KB). 95% phiên làm việc không bao giờ bấm nút này. Đặt `exceljs` sau `import()` trong handler giúp First Load giảm gần 1MB. Quy tắc nhận diện "khi nào dùng": thư viện chỉ xuất hiện sau một hành động có chủ đích của user (bấm nút, mở modal, chuyển tab ẩn) thì luôn là ứng viên lazy.

### 3. Cải thiện LCP/TTI: màn hình đầu chỉ gồm code cốt lõi, phần còn lại tải song song/trễ

**Vì sao:** LCP (Largest Contentful Paint) đo lúc phần tử lớn nhất hiện ra; TTI (Time To Interactive) đo lúc trang bấm được. Cả hai đều bị chặn bởi việc parse/eval JS trên main thread. Bundle càng to, trình duyệt càng lâu mới vẽ xong khung đầu và gắn xong event.

**Cơ chế:** sau khi tách, file đầu chỉ còn shell (layout, login/home, router). Các chunk còn lại tải song song khi rảnh hoặc khi prefetch (hover link). React 19 + Suspense giữ màn hình cũ/skeleton trong lúc chunk về nên không trắng trang.

**Code minh họa:**

```tsx
// ✅ ĐÚNG: màn hình đầu (Home) import tĩnh — vào ngay; Reports lazy — tải sau
import HomePage from './pages/HomePage'; // cốt lõi, giữ trong main bundle
const ReportsPage = lazy(() => import('./pages/ReportsPage')); // phần còn lại tải trễ
```

## Tổng quan

Bài này giải quyết vấn đề **bundle phình to**: một SPA thường nhét toàn bộ page + thư viện nặng (chart, editor, PDF…) vào một file JS duy nhất → người dùng phải tải những thứ họ không dùng. Hậu quả cụ thể là First Load 2–3MB, parse JS mất 1–2 giây trên máy yếu, LCP vượt 4 giây, user 3G bỏ đi trước khi thấy nội dung. Kỹ thuật gồm hai nửa bổ trợ:

- **Route-level lazy**: mỗi route là một chunk, chỉ tải khi user điều hướng tới (phù hợp app trung bình/lớn). Ví dụ app có `/home`, `/dashboard`, `/reports`: chỉ `/home` nằm trong main bundle, hai route còn lại là hai chunk riêng. Khi user gõ URL `/home`, trình duyệt chỉ tải ~120KB; khi họ bấm sang `/reports`, chunk reports mới được tải và cache lại cho lần sau. Usecase điển hình là admin dashboard 20 màn hình, trang marketing + app dùng chung repo, hoặc bất kỳ app nào có trang "nặng nhưng ít vào" (báo cáo cuối tháng, cài đặt nâng cao).

- **Conditional `import()`**: tải component nặng trong event handler (mở modal, bấm "Chỉnh sửa") — thứ chưa chắc user sẽ dùng (phù hợp feature nhỏ nhưng nặng). Ví dụ nút "Chỉnh sửa ảnh" mới cần `tui-image-editor` 1MB; modal "Xem PDF" mới cần `pdfjs`. Thay vì `lazy`, ta gọi `const mod = await import('./PdfViewer')` ngay trong `onClick`, rồi `setViewer(() => mod.PdfViewer)`. Quy tắc nhận diện: nếu tính năng nằm sau một thao tác có điều kiện (phải bấm, phải có quyền, phải chọn file) và không phải ai cũng dùng, hãy `import()` trong handler thay vì tải sẵn.

Áp dụng khi: bundle JS đầu > 150–200KB gzip, hoặc có module nặng chỉ dùng ở một vài màn hình. Cách đo: chạy `npm run build`, xem dòng `dist/assets/index-*.js` báo bao nhiêu KB (gzip). Nếu vượt ngưỡng trên, mở `vite-bundle-visualizer` xem 3 khối to nhất — đó chính là ứng viên tách đầu tiên. Không áp dụng khi app chỉ 2–3 trang nhẹ dưới 50KB: tách lúc này chỉ thêm request mà không bớt đáng kể thời gian parse.

## Khái niệm cốt lõi

### 1. `import()` động — dynamic import chuẩn ES

**Vì sao cần hiểu:** nhiều người nhầm `import()` với `import` tĩnh. `import` tĩnh chạy lúc build và gộp code vào bundle; `import()` động trả về `Promise<module>` chạy lúc runtime, là tín hiệu để bundler tách chunk. Không hiểu điểm này sẽ viết `import()` mà vẫn gộp nhầm, hoặc ngược lại tách mà không biết vì sao Network xuất hiện file mới.

**Cơ chế chi tiết:** khi Rollup gặp `import('./HeavyChart')` với đường dẫn chuỗi tĩnh, nó tạo một chunk riêng và thay lời gọi bằng `__vitePreload(() => import('./HeavyChart-*.js'))`. Lúc runtime, khi dòng này thực thi, trình duyệt fetch file JS đó, eval, resolve promise với namespace module. Mọi lần gọi sau dùng lại module đã cache — không tải lại.

**Code minh họa (comment tiếng Việt):**

```tsx
// Khi user bấm nút mới chạy dòng này → trình duyệt mới fetch chunk heavy-chart.js
async function moBieuDo() {
  // import() trả về Promise chứa toàn bộ export của module
  const mod = await import('./HeavyChart'); // network request xảy ra ở đây
  return mod.HeavyChart; // lấy named export ra dùng
}
```

**Sai thì sao:**

```tsx
// ❌ SAI: đường dẫn động hoàn toàn — bundler không tách được, có thể lỗi build
const ten = './HeavyChart';
const mod = await import(ten); // Rollup cảnh báo "dynamic import cannot be analyzed"

// ✅ ĐÚNG: đường dẫn tĩnh để bundler tách chunk
const mod = await import('./HeavyChart');
```

### 2. `React.lazy(factory)` — component "chưa có nội dung"

**Vì sao:** `import()` trả promise thô, ta phải tự quản state loading/error/cache. `lazy` bọc promise đó thành một component mà React hiểu: lần đầu mount thì suspend, lần sau mount thì dùng ngay. Nó giảm boilerplate và tích hợp Suspense nhất quán.

**Cơ chế:** `lazy(() => import('./X'))` trả về một kiểu component đặc biệt có `_payload`. Khi React render gặp nó lần đầu, nó throw một promise (suspend). `Suspense` gần nhất bắt promise này và vẽ fallback. Khi promise resolve, React thử render lại và lần này lấy được `module.default` làm component thật. `lazy` **chỉ đọc `module.default`** — đó là lý do named export phải map lại.

**Code minh họa:**

```tsx
import { lazy } from 'react';

// ✅ ĐÚNG với default export: không cần map
const Dashboard = lazy(() => import('./pages/Dashboard'));

// ✅ ĐÚNG với named export: bọc sang { default: ... }
const HeavyChart = lazy(() =>
  import('./HeavyChart').then((m) => ({ default: m.HeavyChart })),
);
```

**Sai thì sao:**

```tsx
// ❌ SAI: HeavyChart là named export nhưng không map — lazy nhận module không có .default
const HeavyChart = lazy(() => import('./HeavyChart')); // render ra undefined, trắng trang

// ✅ ĐÚNG: map named export sang default
const HeavyChart = lazy(() =>
  import('./HeavyChart').then((m) => ({ default: m.HeavyChart })),
);
```

### 3. `Suspense` — bộ điều phối chờ đợi

**Vì sao:** React cần một nơi để vẽ "đang tải" trong lúc chunk bay về. Không có `Suspense`, React không biết vẽ gì khi component suspend và sẽ ném lỗi runtime. `Suspense` chính là ranh giới UX: skeleton ở đâu, trắng ở đâu, giữ màn hình cũ hay đè fallback.

**Cơ chế:** khi con suspend, React unmount cây con đó tạm thời và vẽ `fallback`. Có thể lồng nhiều `Suspense`: cái gần nhất bắt trước. Ví dụ outer bọc layout vẽ skeleton trang, inner bọc widget vẽ spinner nhỏ — chỉ widget bị ảnh hưởng khi chunk widget về chậm.

**Code minh họa:**

```tsx
import { Suspense } from 'react';

// ✅ ĐÚNG: Suspense bọc ngoài lazy component, fallback là skeleton nhẹ
<Suspense fallback={<p>Đang tải biểu đồ…</p>}>
  <HeavyChart />
</Suspense>
```

**Sai thì sao:**

```tsx
// ❌ SAI: quên Suspense — runtime ném lỗi
<HeavyChart /> // Error: A component suspended while responding to synchronous input.

// ✅ ĐÚNG: luôn bọc Suspense, có thể bọc chung ở cấp route
<Suspense fallback={<p>Đang tải…</p>}>
  <HeavyChart />
</Suspense>
```

### 4. Link prefetch — tải trước khi user bấm

**Vì sao:** lazy giúp First Load nhẹ nhưng lần đầu vào route nặng vẫn phải chờ network. Prefetch lấp khoảng trống này: khi user hover/focus link, chunk đã bay về cache, lúc bấm là có ngay, không thấy fallback.

**Cơ chế:** trình duyệt hỗ trợ `<link rel="modulepreload">` để fetch module trước. Ta có thể tự gọi `import('./pages/Dashboard')` trong `onMouseEnter` (promise chạy, module cache lại, nhưng chưa mount nên chưa vẽ). React Router v7 làm sẵn qua `<Link prefetch="intent">` — hover là preload cả chunk lẫn loader data.

**Code minh họa:**

```tsx
// ✅ ĐÚNG: hover là tải trước — bấm là có ngay
<a
  href="/dashboard"
  onMouseEnter={() => import('./pages/Dashboard')} // prefetch thủ công
  onFocus={() => import('./pages/Dashboard')}
>
  Dashboard
</a>
```

### 5. Một module = một lần tải (cache tự nhiên)

**Vì sao:** nhiều người lo "mỗi lần mở modal lại tải lại chart 500KB". Thực tế ES module cache theo URL: lần đầu fetch, lần sau lấy từ module map + HTTP cache. Nhờ vậy không cần tự viết cache tay.

**Cơ chế:** cả `import()` động và `lazy` đều trỏ về cùng một module record. `lazy` giữ promise đã resolve; remount chỉ là render lại component đã có, không fetch lại trừ khi hash file đổi (deploy mới).

### 6. Suspense lồng nhau — skeleton phân tầng

**Vì sao:** một fallback toàn trang cho mọi thứ gây "trắng toàn màn hình" mỗi khi một widget nhỏ tải chậm. Chia tầng giúp UX mượt: layout hiện ngay, chỗ nào chưa về thì hiện skeleton chỗ đó.

**Cơ chế:** React tìm `Suspense` gần nhất từ lazy component đi lên. Nếu inner Suspense bọc widget suspend, chỉ inner vẽ fallback; outer không bị ảnh hưởng. Khi chunk về, chỉ subtree đó render lại.

**Code minh họa:**

```tsx
// ✅ ĐÚNG: skeleton phân tầng — trang hiện ngay, widget nào chậm thì chờ riêng
<Suspense fallback={<TrangSkeleton />}>
  <DashboardLayout />
  <Suspense fallback={<BieuDoSkeleton />}>
    <HeavyChart />
  </Suspense>
</Suspense>
```

### 7. SSR/hydration với lazy (React 19 streaming)

**Vì sao:** với SPA Vite thuần, lazy chỉ chạy ở client nên không lo SSR. Nhưng với framework SSR streaming (Next/Remix), server có thể gặp lazy component lúc render. React 19 xử lý bằng cách streaming: server gửi shell trước, chunk lazy gửi sau qua Suspense boundary, client hydrate dần.

**Quy tắc nhận diện:** nếu dự án là SPA Vite (không SSR) thì bỏ qua mục này. Nếu dùng SSR, cần đảm bảo lazy component nằm trong client boundary và có `preload` đúng, nếu không hydration mismatch hoặc waterfall.

## Luồng hoạt động / Cách áp dụng

### Bước 1. Xác định "món nặng": đo bằng bundle visualizer, chọn page/thư viện chiếm nhiều KB

**Vì sao:** đoán mò "chắc chart nặng" dễ sai — có khi lodash hay moment mới là thủ phạm. Đo cho con số: mở `dist` sau build, chạy `npx vite-bundle-visualizer` xem treemap, ghi lại 3 khối to nhất (tên + KB). Chỉ tách những khối > 20KB và không nằm ở màn hình đầu.

**Code minh họa:**

```bash
# Chạy build rồi mở treemap để thấy khối nào phình
npm run build
npx vite-bundle-visualizer
# Quan sát: recharts 480KB, monaco 900KB, ReportsPage 210KB → ứng viên tách
```

### Bước 2. Chuyển import tĩnh thành `lazy(() => import('./X'))` và bọc trong `<Suspense fallback={...}>`

**Vì sao:** đây là thao tác tách thật sự. Import tĩnh gộp; `lazy` tách. `Suspense` giữ UX không vỡ trong lúc chunk về.

**Sai thì sao:**

```tsx
// ❌ SAI: lazy nhưng quên Suspense — crash runtime
const Reports = lazy(() => import('./ReportsPage'));
<Reports /> // lỗi suspended without Suspense

// ✅ ĐÚNG: lazy + Suspense đi đôi
<Suspense fallback={<p>Đang tải báo cáo…</p>}>
  <Reports />
</Suspense>
```

### Bước 3. Chạy build: kiểm tra output gồm nhiều chunk `.js`, `import()` xuất hiện dưới dạng `Promise`

**Vì sao:** tách mà không kiểm tra thì không biết có tách thật không. Nhiều trường hợp đường dẫn động, config gom lại, hoặc import nhầm chỗ khiến chunk vẫn gộp vào main.

**Cách làm:** chạy `npm run build`, xem terminal in ra `dist/assets/Reports-*.js`, `dist/assets/chart-vendor-*.js` riêng biệt, file `index-*.js` nhỏ đi. Mở tab Network, load trang đầu xác nhận chunk reports chưa xuất hiện; điều hướng tới reports mới thấy request mới.

### Bước 4. Bọc `ErrorBoundary` quanh vùng lazy để xử lý cảnh mạng chậm → chunk tải thất bại

**Vì sao:** chunk là request network — có thể 404 (deploy lệch hash), rớt mạng, CDN lỗi. Không bọc, cả app trắng. Bọc thì chỉ vùng đó hiện "Tải lỗi — Thử lại".

**Code minh họa:**

```tsx
// ✅ ĐÚNG: ErrorBoundary ngoài Suspense để bắt lỗi tải chunk
<ErrorBoundary fallback={<p>Tải lỗi. <button onClick={() => location.reload()}>Thử lại</button></p>}>
  <Suspense fallback={<p>Đang tải…</p>}>
    <ReportsPage />
  </Suspense>
</ErrorBoundary>
```

### Bước 5. Nếu cần tương tác điều kiện (modal/editor), gọi `import()` ngay trong event handler thay vì dùng `lazy`

**Vì sao:** `lazy` kích hoạt khi mount; nhưng có trường hợp ta muốn tải trước khi mount (hover nút "Sửa" là tải editor, bấm mới mở modal) hoặc quyết định runtime (quyền admin mới tải module admin). `import()` trong handler linh hoạt hơn.

**Code minh họa:**

```tsx
// ✅ ĐÚNG: tải editor ngay trong handler, rồi mới mở modal
async function moEditor() {
  // Chunk editor bắt đầu tải khi bấm — trước đó bundle đầu không chứa nó
  const mod = await import('./HeavyEditor');
  setEditor(() => mod.HeavyEditor); // lưu component vào state rồi render
  setMoModal(true);
}
```

## Ví dụ chi tiết

Khối dưới đây mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn), chỉ thêm comment tiếng Việt để giải thích. Sau đó là ví dụ route-level bổ sung.

```tsx
// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import { lazy, Suspense, useState } from 'react';

// lazy() nhận factory trả về Promise của module.
// HeavyChart là named export nên phải map sang { default: m.HeavyChart }.
// Vì sao: lazy chỉ đọc module.default — không map là render undefined.
const HeavyChart = lazy(() =>
  import('./HeavyChart').then((m) => ({ default: m.HeavyChart })),
);

export function LazyDemo() {
  // show quyết định component có được mount không.
  // Vì sao: chunk chỉ bắt đầu tải khi show === true — trước đó bundle đầu nhẹ.
  const [show, setShow] = useState(false);
  return (
    <div>
      {/* Chỉ khi bấm nút, lazy component mới bắt đầu tải chunk */}
      <button onClick={() => setShow(true)}>Mở biểu đồ</button>
      {show && (
        // Suspense bắt buộc: vẽ fallback trong lúc chunk đang tải.
        // Nếu thiếu, React ném lỗi "suspended while responding to synchronous input".
        <Suspense fallback={<p>Đang tải biểu đồ…</p>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

Route-level lazy với React Router v7 (ví dụ bổ sung, cùng pattern):

```tsx
// Route-level: mỗi page một chunk — tải khi điều hướng tới
import { lazy, Suspense } from 'react';

// Dashboard là default export nên không cần .then map
const Dashboard = lazy(() => import('./pages/Dashboard'));
// Reports nặng hơn, cũng tách riêng
const Reports = lazy(() => import('./pages/Reports'));

export function AppRoutes({ page }: { page: 'dashboard' | 'reports' }) {
  return (
    // Một Suspense chung cho toàn vùng route — skeleton toàn trang
    <Suspense fallback={<p>Đang tải trang…</p>}>
      {page === 'dashboard' ? <Dashboard /> : <Reports />}
    </Suspense>
  );
}

// Prefetch khi hover link — chunk về trước khi bấm
export function NavLink() {
  return (
    <a
      href="/reports"
      onMouseEnter={() => import('./pages/Reports')}
      onFocus={() => import('./pages/Reports')}
    >
      Báo cáo
    </a>
  );
}
```

## Giải thích từng phần

### `const [show, setShow] = useState(false)` — điểm kích hoạt tải

**Vì sao:** đây là công tắc network. Khi `show` là `false`, `<HeavyChart/>` không tồn tại trong cây render nên factory `() => import(...)` chưa bao giờ chạy — trình duyệt chưa hề biết chunk chart tồn tại. Khi `setShow(true)`, React mount lazy component, factory chạy, request bay đi. Nhờ vậy bundle đầu không chứa chart library (có thể 300–500KB). **Sai thì sao:** nếu viết `{<HeavyChart/>}` không điều kiện (luôn mount), chunk tải ngay lần đầu — mất ý nghĩa lazy. Fix luôn là render có điều kiện hoặc theo route.

### `.then((m) => ({ default: m.HeavyChart }))` — chuyển named export sang default

**Vì sao:** `lazy` được thiết kế chỉ đọc `module.default`. Nhiều module export named (`export function HeavyChart`) nên phải bọc lại thành object có key `default`. Đây là hợp đồng API, không phải mẹo. **Sai thì sao:** bỏ `.then` khi module chỉ có named export → `lazy` nhận module không có `.default`, render ra `undefined`, trang trắng không báo lỗi rõ. Fix luôn map như trên. Với default export (`export default Dashboard`) thì không cần map.

### `<Suspense fallback={<p>…</p>}>` — giao diện "đang tải"

**Vì sao:** từ lúc request bay đi tới lúc eval xong có thể 200ms–2s. `fallback` là thứ user thấy trong khoảng đó. Với route-level, đặt một `<Suspense>` bọc `<Outlet/>` để dùng chung skeleton toàn trang thay vì mỗi page một spinner rời rạc. **Cơ chế:** React suspend cây con và vẽ fallback; khi promise resolve, React render lại với nội dung thật, fallback biến mất. **Sai thì sao:** đặt fallback là spinner nhỏ giữa trang cho route lớn gây "nhảy layout"; fix là dùng skeleton đầy đủ chiều cao tương đương trang thật.

### `{show && ...}` — vòng đời lazy bắt đầu khi mount

**Vì sao:** trước khi bấm, React giữ JSX có điều kiện là `false` nên không tạo fiber cho lazy component. Sau khi bấm, fiber được tạo, vòng đời tải → suspend → render diễn ra. Remount sau (tắt rồi mở lại) dùng module đã cache nên hiện ngay, không tải lại. **Sai thì sao:** tạo `lazy` bên trong render (`function Comp(){ const X = lazy(...) }`) khiến mỗi render tạo một lazy mới, reset trạng thái đã tải — chunk tải lại liên tục. Fix là khai báo `lazy` ở module scope, factory ổn định.

## So sánh (nếu có)

### `React.lazy` + `Suspense` vs gọi `import()` thủ công + `useState`

**`lazy`:** giữ trạng thái "đã tải" của module, tránh tải lại khi remount, vẽ qua Suspense nhất quán, ít code. Phù hợp khi quyết định tải gắn với mount (route, điều kiện hiển thị). Nhược điểm là kém linh hoạt với logic runtime phức tạp (quyền, feature flag, preload hover).

**`import()` thủ công:** linh hoạt tối đa — gọi lúc nào, với điều kiện gì, cache ra sao đều do ta quyết. Ví dụ `if (isAdmin) mod = await import('./AdminPanel')`. Nhược điểm là phải tự quản loading/error/cache bằng `useState`/`useEffect`, dễ quên cleanup và xử lý race.

**Khi nào dùng cái nào:** mount là tín hiệu tải → `lazy`. Hành động/tín hiệu khác (hover, quyền, feature flag) là tín hiệu tải → `import()` thủ công. Thực tế dùng cả hai trong cùng app.

```tsx
// import() thủ công: tự quản state — linh hoạt nhưng dài hơn
function ThuCong() {
  const [Comp, setComp] = useState<React.ComponentType | null>(null);
  async function tai() {
    const m = await import('./HeavyChart'); // tự gọi lúc bấm
    setComp(() => m.HeavyChart); // tự lưu vào state
  }
  return <button onClick={tai}>Tải</button>;
}
```

### Route-level vs component-level splitting

**Route-level** tách theo điều hướng (1 chunk/page) — đơn giản, hiệu quả cao, thường đủ tốt cho app vừa. Nhược điểm là trong một page vẫn có thể chứa widget nặng mà 90% lượt xem không dùng (chart trong dashboard).

**Component-level** tách widget nặng trong page — tinh chỉnh hơn, First Load của chính page đó cũng nhẹ. Nhược điểm là nhiều chunk nhỏ, nhiều Suspense lồng, phức tạp hơn.

**Thực tế:** dùng cả hai — route-level cho mọi page sau login, component-level cho chart/editor/modal nặng nằm trong page.

## Lỗi thường gặp / Chống chỉ định

### 1. Quên `<Suspense>`

**Vì sao sai:** React suspend nhưng không có ranh giới để vẽ fallback → ném lỗi runtime `A component suspended while responding to synchronous input` và trắng trang.

```tsx
// ❌ SAI: lazy mà không có Suspense — crash
const Reports = lazy(() => import('./Reports'));
export function App() { return <Reports />; }

// ✅ ĐÚNG: luôn bọc Suspense, có thể bọc chung ở cấp route
export function App() {
  return (
    <Suspense fallback={<p>Đang tải…</p>}>
      <Reports />
    </Suspense>
  );
}
```

### 2. `lazy` với named export để nguyên

**Vì sao sai:** chunk tải xong nhưng `module.default` là `undefined` → render rỗng, không báo lỗi mạng nên khó phát hiện.

```tsx
// ❌ SAI: HeavyChart là named export — lazy không hiểu
const HeavyChart = lazy(() => import('./HeavyChart'));

// ✅ ĐÚNG: map sang default
const HeavyChart = lazy(() =>
  import('./HeavyChart').then((m) => ({ default: m.HeavyChart })),
);
```

### 3. Không bọc ErrorBoundary — mạng lỗi khi tải chunk crash cả app

**Vì sao sai:** chunk là fetch network — rớt mạng, 404 hash cũ, CDN lỗi đều có thể xảy ra. Không bắt, lỗi lan lên root và unmount toàn app.

```tsx
// ❌ SAI: chỉ có Suspense — lỗi network không ai bắt
<Suspense fallback={<p>Đang tải…</p>}><Reports /></Suspense>

// ✅ ĐÚNG: ErrorBoundary ngoài cùng với nút Thử lại
<ErrorBoundary fallback={<div>Tải lỗi. <button onClick={() => location.reload()}>Thử lại</button></div>}>
  <Suspense fallback={<p>Đang tải…</p>}><Reports /></Suspense>
</ErrorBoundary>
```

### 4. Split quá nhỏ / quá nhiều chunk

**Vì sao sai:** mỗi request có overhead (DNS, handshake, header) 30–80ms. Chia 200 chunk 5KB chậm hơn 20 chunk 50KB, nhất là mạng yếu.

```tsx
// ❌ SAI: lazy từng icon 2KB — hàng chục request nhỏ
const IconA = lazy(() => import('./icons/IconA'));
const IconB = lazy(() => import('./icons/IconB'));

// ✅ ĐÚNG: chỉ split route/vendor lớn > 20KB; icon nhỏ giữ import tĩnh
import IconA from './icons/IconA';
import IconB from './icons/IconB';
```

### 5. Chống chỉ định: app nhỏ, thư viện dùng chung, module có side-effect

App < 50KB gzip hoặc mọi route dùng chung một thư viện lớn — lazy chỉ thêm request mà không bớt parse đáng kể. Module có side-effect lúc import (tự chạy `window.x = ...`, đăng ký global) mà lazy sẽ khiến side-effect chạy trễ/không đoán được — giữ import tĩnh cho loại này.

## Câu hỏi thường gặp

### Khác nhau giữa `React.lazy` và gọi `import()` trực tiếp?

`lazy` trả về component tích hợp Suspense — mount là tải, remount là dùng cache, không cần quản state. `import()` trả promise module thô — ta tự quyết khi nào gọi, tự `setState`, tự bắt lỗi, tự cache nếu cần. Dùng `lazy` khi tải gắn với hiển thị; dùng `import()` khi tải gắn với hành động/quyền/prefetch.

### Chunk tải thất bại vì mạng thì sao?

Bọc `ErrorBoundary` quanh vùng lazy với nút "Thử lại" gọi `location.reload()` hoặc gọi lại `import()`. Module lỗi lần đầu vẫn có thể tải lại thành công khi mạng hồi vì browser retry request mới. Với deploy mới đổi hash, reload là cách chắc chắn nhất để lấy HTML mới trỏ chunk mới.

### Có nên lazy hóa mọi component?

Không. Chỉ lazy route lớn và module nặng dùng không thường xuyên. Component nhỏ (< 20KB) lazy hóa chỉ tăng request, tăng Suspense lồng, tăng phức tạp mà First Load không giảm đáng kể. Giữ màn hình đầu (login/home) import tĩnh để LCP không phải chờ network.

### Lazy ảnh hưởng SEO không?

Với SPA client-render, nội dung phụ thuộc JS dù lazy hay không — crawler phải chạy JS mới thấy. Với SSR/streaming React 19, lazy boundary được stream: server gửi shell trước, chunk lazy gửi sau, crawler vẫn thấy đủ nếu chờ stream xong. Cần cấu hình `preload` đúng để chunk ưu tiên cao không bị trì hoãn.

### Làm sao biết chunk đã tách đúng?

Chạy `npm run build`, xem output có nhiều file `.js` (không chỉ một `index-*.js`). Mở `vite-bundle-visualizer` xác nhận module nặng nằm chunk riêng. Mở DevTools Network, load trang đầu xác nhận chunk nặng chưa xuất hiện; điều hướng tới route nặng mới thấy request mới. Nếu chunk nặng vẫn xuất hiện ngay lần đầu, kiểm tra lại có import tĩnh lọt ở đâu không.

## Ghi chú 2026

- **React 19.3 ổn định Suspense + streaming SSR:** `lazy` hoạt động tốt trong RSC khi kết hợp client boundary. Server stream shell trước, client hydrate từng boundary khi chunk về, không block toàn trang. Với SPA thuần Vite, cơ chế này không cần cấu hình thêm.

- **Ưu tiên `route.lazy` của React Router v7:** thay vì `const P = lazy(() => import('./P'))` rồi `<P/>`, khai `route.lazy = () => import('./pages/p')` để chunk mang cả `Component` lẫn `loader` trong một request. Giảm một tầng bọc, giảm waterfall (tải component xong mới tải data).

- **Vite 7 gom chunk nhỏ thông minh hơn:** `import()` trỏ module < 10KB có thể được gom vào chunk cha thay vì tách file riêng, tránh phân mảnh. Vẫn nên kiểm tra bằng `vite-bundle-visualizer` sau mỗi lần thêm lazy mới để xác nhận số lượng và kích thước chunk như kỳ vọng.

## Best practices / Mẹo

### Luôn đặt `Suspense` trên vùng lazy, dùng skeleton chung cho route

**Vì sao:** fallback rời rạc mỗi component gây chớp nhiều lần. Một `Suspense` bọc `<Outlet/>` với skeleton toàn trang cho cảm giác tải một lần, mượt hơn.

```tsx
// ✅ ĐÚNG: một Suspense chung cho route + Suspense nhỏ cho widget
<Suspense fallback={<TrangSkeleton />}>
  <Outlet />
</Suspense>
```

### Kết hợp prefetch khi hover/focus link

**Vì sao:** xóa độ trễ lần đầu vào route nặng. User hover trung bình 200–400ms trước khi bấm — đủ để chunk 100KB về trước.

```tsx
// ✅ ĐÚNG: hover là fetch trước
<Link to="/reports" prefetch="intent">Báo cáo</Link>
// hoặc thủ công onMouseEnter={() => import('./pages/Reports')}
```

### Giữ `lazy` factory ổn định ở module scope

**Vì sao:** tạo `lazy` trong render khiến mỗi render sinh component mới, mất cache đã tải, tải lại liên tục.

```tsx
// ❌ SAI: lazy trong render — mỗi render reset
function Comp() { const X = lazy(() => import('./X')); return <X />; }
// ✅ ĐÚNG: lazy ở module scope — factory ổn định
const X = lazy(() => import('./X'));
function Comp() { return <X />; }
```

### Kết hợp `lazy` + ErrorBoundary + nút "Thử lại"

**Vì sao:** chunk lỗi là lỗi mạng tạm thời, retry thường thành công. Không có nút này user chỉ còn cách reload tay hoặc bỏ đi.

### Ở tầng route dùng `route.lazy` để gộp loader + component

**Vì sao:** giảm waterfall: một chunk mang cả UI lẫn data loader, không phải tải component xong mới biết cần fetch gì.

### Kiểm tra chunk trong CI để bắt module lọt nhầm

**Vì sao:** một import tĩnh vô tình (`import {x} from './Reports'` trong file dùng chung) sẽ kéo cả chunk nặng về main bundle mà không ai hay. Script CI kiểm tra `dist` có chunk reports riêng và `index-*.js` dưới budget (ví dụ 200KB gzip) sẽ bắt hồi quy sớm.

### Tránh lazy cho màn hình đầu và component giữ state khởi tạo

Màn hình đầu lazy sẽ khiến LCP phải chờ network — giữ tĩnh. Component giữ state khởi tạo (form đang nhập) mà lazy/remount sẽ mất state — cân nhắc `key` ổn định hoặc không lazy.

## Bài tập nhỏ

Tạo app có 2 route: `/home` (nhẹ) và `/reports` (nặng, giả lập bằng `<HeavyTable/>` 10.000 dòng). Các bước chi tiết:

1. Tạo `HomePage.tsx` nhẹ (vài dòng chữ) import tĩnh; tạo `ReportsPage.tsx` render 10.000 dòng import `lazy`.
2. Bọc route bằng `<Suspense fallback={<p>Đang tải báo cáo…</p>}>` và ngoài cùng là `ErrorBoundary` có nút "Thử lại" gọi `location.reload()`.
3. Chạy `npm run build`, ghi lại kích thước `index-*.js` và `Reports-*.js` riêng.
4. Mở DevTools Network, load `/home` xác nhận chunk reports chưa xuất hiện; bấm sang `/reports` xác nhận chunk mới bay về và fallback hiện rồi biến mất.
5. Ngắt mạng (Offline trong DevTools) rồi vào `/reports` để thấy ErrorBoundary hiện nút Thử lại; bật mạng lại, bấm Thử lại xác nhận trang hiện.

## Reference

- [React.lazy](https://react.dev/reference/react/lazy)
- [Suspense](https://react.dev/reference/react/Suspense)
- [React Router — Lazy Loading](https://reactrouter.com/how-to/lazy-loading)
- [Vite — Code Splitting](https://vite.dev/guide/features.html#manual-chunks)
