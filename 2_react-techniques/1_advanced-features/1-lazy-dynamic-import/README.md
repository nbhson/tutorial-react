# Lazy + Dynamic Import (React 19)

> Nguồn: https://react.dev/reference/react/lazy — https://react.dev/reference/react/Suspense

## Mục tiêu

### 1. Giảm kích thước bundle ban đầu (First Load) bằng cách tách code thành các chunk nhỏ

**Vì sao mục tiêu này tồn tại:** SPA React khi build thường gom cả trang vào một file `index-*.js` duy nhất. Hãy tưởng tượng đi siêu thị mua một hộp kem: cửa hàng nhét luôn cả tủ lạnh vào túi cho bạn. Người dùng mở trang đăng nhập nhưng phải tải cả dashboard, báo cáo, editor. Trên 4G chậm, mỗi 100KB gzip thêm vào là hàng trăm mili-giây chờ trắng màn hình. LCP và TTI vì thế đi xuống, tỉ lệ rời trang tăng lên.

**Cơ chế đạt được:** khi ta viết `lazy(() => import('./ReportsPage'))`, bundler (Vite/Rollup) cắt module đó ra thành một chunk `.js` riêng. Cứ tưởng nhau như đóng vali: đồ dùng hàng ngày để một vali, đồ leo núi để vali khác, cần gì mở vali đó. File `index` chính chỉ còn một câu lệnh tải lười. Trình duyệt tải chunk nặng đúng lúc route được mở hoặc nút được bấm.

**Code minh họa (comment tiếng Việt):**

> 📄 **Code ví dụ:** [`examples/01-1-giam-kich-thuoc-bundle-ban-au-first.tsx`](examples/01-1-giam-kich-thuoc-bundle-ban-au-first.tsx)

**Sai thì sao + fix:**

> 📄 **Code ví dụ:** [`examples/02-1-giam-kich-thuoc-bundle-ban-au-first.tsx`](examples/02-1-giam-kich-thuoc-bundle-ban-au-first.tsx)

> **Tóm gọn 1 câu:** Tách code thành nhiều file nhỏ để người dùng chỉ tải phần cần thiết lúc mở trang.

### 2. Chỉ tải component/thư viện nặng khi thực sự cần (khi route được mở, khi user bấm nút)

Mục này nói về nguyên tắc "trả tiền đúng lúc dùng" với code. Đây là vũ khí chủ lực để giảm First Load mà không bỏ tính năng.

**Vì sao:** nhiều thư viện nặng hàng trăm KB (recharts, monaco-editor, pdfjs, exceljs) chỉ xuất hiện ở một vài màn hình. Nếu nhét sẵn vào bundle đầu, 90% lượt truy cập phải trả giá cho 10% tính năng. Nguyên tắc là "trả tiền đúng lúc dùng": chưa bấm nút "Mở biểu đồ" thì chưa tải chart.

**Cơ chế:** có hai thời điểm kích hoạt. Một là mount của lazy component — khi `{show && <HeavyChart/>}` chuyển từ `false` sang `true`, React mới gọi factory `() => import(...)` và bắt đầu tải network. Hai là gọi `import()` thủ công trong event handler — promise chạy đúng lúc click, ta tự `setState` module đã tải.

**Code minh họa:**

> 📄 **Code ví dụ:** [`examples/03-2-chi-tai-component-thu-vien-nang-khi.tsx`](examples/03-2-chi-tai-component-thu-vien-nang-khi.tsx)

**Usecase thực tế:** trang quản trị có nút "Xuất Excel" dùng `exceljs` (~800KB). 95% phiên làm việc không bao giờ bấm nút này. Đặt `exceljs` sau `import()` trong handler giúp First Load giảm gần 1MB. Quy tắc nhận diện "khi nào dùng": thư viện chỉ xuất hiện sau một hành động có chủ đích của user (bấm nút, mở modal, chuyển tab ẩn) thì luôn là ứng viên lazy.

> **Tóm gọn 1 câu:** Đừng tải sẵn thứ mà đa số người dùng không bao giờ chạm tới — hãy để nó tải đúng lúc user bấm nút.

### 3. Cải thiện LCP/TTI: màn hình đầu chỉ gồm code cốt lõi, phần còn lại tải song song/trễ

Mục này nói về hai chỉ số tốc độ trang và cách tách code giúp chúng nhanh lên. Nếu bạn từng thắc mắc vì sao trang mình "vào chậm dù mạng khỏe" thì đây là chỗ cần đọc.

**Vì sao:** LCP (Largest Contentful Paint) đo lúc phần tử lớn nhất hiện ra; TTI (Time To Interactive) đo lúc trang bấm được. Hãy hình dung LCP là lúc món ăn được bốc lên bàn, còn TTI là lúc bạn cầm được đũa. Cả hai đều bị chặn bởi việc parse/eval JS trên main thread. Bundle càng to, trình duyệt càng lâu mới vẽ xong khung đầu và gắn xong event.

**Cơ chế:** sau khi tách, file đầu chỉ còn shell (layout, login/home, router). Các chunk còn lại tải song song khi rảnh hoặc khi prefetch (hover link). React 19 + Suspense giữ màn hình cũ/skeleton trong lúc chunk về nên không trắng trang.

**Code minh họa:**

> 📄 **Code ví dụ:** [`examples/04-3-cai-thien-lcp-tti-man-hinh-au.tsx`](examples/04-3-cai-thien-lcp-tti-man-hinh-au.tsx)

> **Tóm gọn 1 câu:** Giữ file JS đầu nhẹ chỉ với code màn hình đầu tiên, phần nặng tải sau — trang hiện và bấm được nhanh hơn hẳn.

## Tổng quan

Bài này giải quyết vấn đề **bundle phình to**: một SPA thường nhét toàn bộ page + thư viện nặng (chart, editor, PDF…) vào một file JS duy nhất → người dùng phải tải những thứ họ không dùng. Giống như mua thêm 1 hộp bút mà cả thùng văn phòng phẩm được giao tới nhà. Hậu quả cụ thể là First Load 2–3MB, parse JS mất 1–2 giây trên máy yếu, LCP vượt 4 giây, user 3G bỏ đi trước khi thấy nội dung. Kỹ thuật gồm hai nửa bổ trợ:

- **Route-level lazy**: mỗi route là một chunk, chỉ tải khi user điều hướng tới (phù hợp app trung bình/lớn). Ví dụ app có `/home`, `/dashboard`, `/reports`: chỉ `/home` nằm trong main bundle, hai route còn lại là hai chunk riêng. Khi user gõ URL `/home`, trình duyệt chỉ tải ~120KB; khi họ bấm sang `/reports`, chunk reports mới được tải và cache lại cho lần sau. Usecase điển hình là admin dashboard 20 màn hình, trang marketing + app dùng chung repo, hoặc bất kỳ app nào có trang "nặng nhưng ít vào" (báo cáo cuối tháng, cài đặt nâng cao).

- **Conditional `import()`**: tải component nặng trong event handler (mở modal, bấm "Chỉnh sửa") — thứ chưa chắc user sẽ dùng (phù hợp feature nhỏ nhưng nặng). Ví dụ nút "Chỉnh sửa ảnh" mới cần `tui-image-editor` 1MB; modal "Xem PDF" mới cần `pdfjs`. Thay vì `lazy`, ta gọi `const mod = await import('./PdfViewer')` ngay trong `onClick`, rồi `setViewer(() => mod.PdfViewer)`. Quy tắc nhận diện: nếu tính năng nằm sau một thao tác có điều kiện (phải bấm, phải có quyền, phải chọn file) và không phải ai cũng dùng, hãy `import()` trong handler thay vì tải sẵn.

Áp dụng khi: bundle JS đầu > 150–200KB gzip, hoặc có module nặng chỉ dùng ở một vài màn hình. Cách đo: chạy `npm run build`, xem dòng `dist/assets/index-*.js` báo bao nhiêu KB (gzip). Nếu vượt ngưỡng trên, mở `vite-bundle-visualizer` xem 3 khối to nhất — đó chính là ứng viên tách đầu tiên. Không áp dụng khi app chỉ 2–3 trang nhẹ dưới 50KB: tách lúc này chỉ thêm request mà không bớt đáng kể thời gian parse.

> **Tóm gọn 1 câu:** Tách code thành các mảnh nhỏ, tải đúng lúc cần — route nặng thì tách theo route, feature nặng ít dùng thì tách sau cú bấm.

## Khái niệm cốt lõi

### 1. `import()` động — dynamic import chuẩn ES

Mục này giải thích `import()` động là gì và khác gì với `import` thường. Hiểu đúng điểm này thì bạn mới tách chunk được thay vì tách trên giấy.

**Vì sao cần hiểu:** nhiều người nhầm `import()` với `import` tĩnh. `import` tĩnh chạy lúc build và gộp code vào bundle. `import()` động trả về `Promise<module>` chạy lúc runtime — nó là tín hiệu để bundler tách chunk. Ví dụ đời thường: `import` tĩnh như mua sẵn cả tủ sách chở về nhà; `import()` như có thư viện cho bạn mượn từng cuốn khi cần. Không hiểu điểm này sẽ viết `import()` mà vẫn gộp nhầm, hoặc ngược lại tách mà không biết vì sao Network xuất hiện file mới.

**Cơ chế chi tiết:** khi Rollup gặp `import('./HeavyChart')` với đường dẫn chuỗi tĩnh, nó tạo một chunk riêng và thay lời gọi bằng `__vitePreload(() => import('./HeavyChart-*.js'))`. Lúc runtime, khi dòng này thực thi, trình duyệt fetch file JS đó, eval, resolve promise với namespace module. Mọi lần gọi sau dùng lại module đã cache — không tải lại.

**Code minh họa (comment tiếng Việt):**

> 📄 **Code ví dụ:** [`examples/05-1-import-ong-dynamic-import-chuan-es.tsx`](examples/05-1-import-ong-dynamic-import-chuan-es.tsx)

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/06-1-import-ong-dynamic-import-chuan-es.tsx`](examples/06-1-import-ong-dynamic-import-chuan-es.tsx)

> **Tóm gọn 1 câu:** `import()` động báo cho bundler "để code này ra file riêng, cần thì mới tải".

### 2. `React.lazy(factory)` — component "chưa có nội dung"

Mục này giới thiệu `React.lazy` — công cụ biến một import động thành component dùng được. Bạn cần nó để khỏi tự tay quản state "đang tải".

**Vì sao:** `import()` trả promise thô, ta phải tự quản state loading/error/cache. `lazy` bọc promise đó thành một component mà React hiểu: lần đầu mount thì suspend, lần sau mount thì dùng ngay. Ví von: `import()` là mình tự đi ăn với đủ công đoạn đặt món, chờ, trả tiền; `lazy` là có người phục vụ lo trọn gói cho mình. Nó giảm boilerplate và tích hợp Suspense nhất quán.

**Cơ chế:** `lazy(() => import('./X'))` trả về một kiểu component đặc biệt có `_payload`. Khi React render gặp nó lần đầu, nó throw một promise (suspend). `Suspense` gần nhất bắt promise này và vẽ fallback. Khi promise resolve, React thử render lại và lần này lấy được `module.default` làm component thật. `lazy` **chỉ đọc `module.default`** — đó là lý do named export phải map lại.

**Code minh họa:**

> 📄 **Code ví dụ:** [`examples/07-2-react-lazy-factory-component-chua-co-noi.tsx`](examples/07-2-react-lazy-factory-component-chua-co-noi.tsx)

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/08-2-react-lazy-factory-component-chua-co-noi.tsx`](examples/08-2-react-lazy-factory-component-chua-co-noi.tsx)

> **Tóm gọn 1 câu:** `React.lazy` biến import động thành component, React tự lo chờ và render khi code tải xong.

### 3. `Suspense` — bộ điều phối chờ đợi

Mục này nói về `Suspense` — cái mà bạn bắt buộc phải có khi dùng `lazy`. Không có nó, trang sẽ đổ lỗi ngay khi code chưa kịp tải.

**Vì sao:** React cần một nơi để vẽ "đang tải" trong lúc chunk bay về. Không có `Suspense`, React không biết vẽ gì khi component suspend và sẽ ném lỗi runtime. Hãy hình dung `Suspense` như tấm rèm che: cửa hàng đang sắp lại hàng thì rèm hạ xuống ghi "chờ chút", khách không thấy bên trong lộn xộn. `Suspense` chính là ranh giới UX: skeleton ở đâu, trắng ở đâu, giữ màn hình cũ hay đè fallback.

**Cơ chế:** khi con suspend, React unmount cây con đó tạm thời và vẽ `fallback`. Có thể lồng nhiều `Suspense`: cái gần nhất bắt trước. Ví dụ outer bọc layout vẽ skeleton trang, inner bọc widget vẽ spinner nhỏ — chỉ widget bị ảnh hưởng khi chunk widget về chậm.

**Code minh họa:**

> 📄 **Code ví dụ:** [`examples/09-3-suspense-bo-ieu-phoi-cho-oi.tsx`](examples/09-3-suspense-bo-ieu-phoi-cho-oi.tsx)

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/10-3-suspense-bo-ieu-phoi-cho-oi.tsx`](examples/10-3-suspense-bo-ieu-phoi-cho-oi.tsx)

> **Tóm gọn 1 câu:** `Suspense` là tấm rèm "đang tải" — nó che phần chưa kịp tải và hiện fallback thay vì để trang đổ lỗi.

### 4. Link prefetch — tải trước khi user bấm

Mục này giới thiệu prefetch: mẹo "đi trước một bước" để user không phải chờ lần đầu vào route nặng. Nó bù cho nhược điểm chính của lazy.

**Vì sao:** lazy giúp First Load nhẹ nhưng lần đầu vào route nặng vẫn phải chờ network. Prefetch lấp khoảng trống này: khi user hover/focus link, chunk đã bay về cache, lúc bấm là có ngay, không thấy fallback. Giống như bạn thấy khách tiến tới quầy thu ngân thì bật sẵn máy POS — khách quẹt thẻ xong là xong.

**Cơ chế:** trình duyệt hỗ trợ `<link rel="modulepreload">` để fetch module trước. Ta có thể tự gọi `import('./pages/Dashboard')` trong `onMouseEnter` (promise chạy, module cache lại, nhưng chưa mount nên chưa vẽ). React Router v7 làm sẵn qua `<Link prefetch="intent">` — hover là preload cả chunk lẫn loader data.

**Code minh họa:**

> 📄 **Code ví dụ:** [`examples/11-4-link-prefetch-tai-truoc-khi-user-bam.tsx`](examples/11-4-link-prefetch-tai-truoc-khi-user-bam.tsx)

> **Tóm gọn 1 câu:** Hover link là tải sẵn chunk — lúc user bấm thì code đã có sẵn, không cần chờ.

### 5. Một module = một lần tải (cache tự nhiên)

Mục này trả lời nỗi lo "mỗi lần mở modal có phải tải lại cả MB code không". Câu trả lời là: không, browser tự nhớ rồi.

**Vì sao:** nhiều người lo "mỗi lần mở modal lại tải lại chart 500KB". Thực tế ES module cache theo URL: lần đầu fetch, lần sau lấy từ module map + HTTP cache. Giống như lần đầu bạn đến phòng gym phải đăng ký, các lần sau chỉ quẹt thẻ vào là xong. Nhờ vậy không cần tự viết cache tay.

**Cơ chế:** cả `import()` động và `lazy` đều trỏ về cùng một module record. `lazy` giữ promise đã resolve; remount chỉ là render lại component đã có, không fetch lại trừ khi hash file đổi (deploy mới).

> **Tóm gọn 1 câu:** Module tải lần đầu rồi thì được cache — mở lại bao nhiêu lần cũng không tải lại, trừ khi deploy phiên bản mới.

### 6. Suspense lồng nhau — skeleton phân tầng

Mục này dạy cách xếp nhiều `Suspense` lồng nhau để chờ tải theo từng khu vực. Mục đích: một widget chậm không được làm trắng cả trang.

**Vì sao:** một fallback toàn trang cho mọi thứ gây "trắng toàn màn hình" mỗi khi một widget nhỏ tải chậm. Tưởng tượng cả chung cư mất điện vì chỉ một căn hộ thay bóng đèn. Chia tầng giúp UX mượt: layout hiện ngay, chỗ nào chưa về thì hiện skeleton chỗ đó.

**Cơ chế:** React tìm `Suspense` gần nhất từ lazy component đi lên. Nếu inner Suspense bọc widget suspend, chỉ inner vẽ fallback; outer không bị ảnh hưởng. Khi chunk về, chỉ subtree đó render lại.

**Code minh họa:**

> 📄 **Code ví dụ:** [`examples/12-6-suspense-long-nhau-skeleton-phan-tang.tsx`](examples/12-6-suspense-long-nhau-skeleton-phan-tang.tsx)

> **Tóm gọn 1 câu:** Lồng nhiều `Suspense` theo khu vực để widget chậm chỉ hiện skeleton của nó, không làm trắng cả trang.

### 7. SSR/hydration với lazy (React 19 streaming)

Mục này dành cho ai dùng server-render (Next/Remix), không phải SPA thuần. Nó giải thích lazy chạy thế nào khi server vẽ trang trước.

**Vì sao:** với SPA Vite thuần, lazy chỉ chạy ở client nên không lo SSR. Nhưng với framework SSR streaming (Next/Remix), server có thể gặp lazy component lúc render. React 19 xử lý bằng cách streaming: server gửi shell trước, chunk lazy gửi sau qua Suspense boundary, client hydrate dần. Giống như nhà hàng dọn bàn và đưa nước trước, món ăn mang ra từng đĩa khi xong.

**Quy tắc nhận diện:** nếu dự án là SPA Vite (không SSR) thì bỏ qua mục này. Nếu dùng SSR, cần đảm bảo lazy component nằm trong client boundary và có `preload` đúng, nếu không hydration mismatch hoặc waterfall.

> **Tóm gọn 1 câu:** Với SSR streaming, server gửi khung trang trước và "bơm" từng phần lazy sau; SPA thuần thì không cần quan tâm mục này.

## Luồng hoạt động / Cách áp dụng

### Bước 1. Xác định "món nặng": đo bằng bundle visualizer, chọn page/thư viện chiếm nhiều KB

Bước đầu tiên của quy trình tách code: tìm ra thứ thật sự nặng trước khi động tay. Đo trước để không tách nhầm chỗ.

**Vì sao:** đoán mò "chắc chart nặng" dễ sai — có khi lodash hay moment mới là thủ phạm. Đo cho con số: mở `dist` sau build, chạy `npx vite-bundle-visualizer` xem treemap, ghi lại 3 khối to nhất (tên + KB). Chỉ tách những khối > 20KB và không nằm ở màn hình đầu.

**Code minh họa:**

> 📄 **Code ví dụ:** [`examples/13-buoc-1-xac-inh-mon-nang-o-bang.sh`](examples/13-buoc-1-xac-inh-mon-nang-o-bang.sh)

> **Tóm gọn 1 câu:** Đo trước bằng bundle visualizer, chọn 3 khối to nhất làm ứng viên tách — đừng đoán mò.

### Bước 2. Chuyển import tĩnh thành `lazy(() => import('./X'))` và bọc trong `<Suspense fallback={...}>`

Đây là bước "phẫu thuật" chính: đổi cách import và thêm vùng chờ. Làm đúng cặp đôi `lazy` + `Suspense` thì không bao giờ trắng trang.

**Vì sao:** đây là thao tác tách thật sự. Import tĩnh gộp; `lazy` tách. `Suspense` giữ UX không vỡ trong lúc chunk về.

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/14-buoc-2-chuyen-import-tinh-thanh-lazy-import.tsx`](examples/14-buoc-2-chuyen-import-tinh-thanh-lazy-import.tsx)

> **Tóm gọn 1 câu:** Đổi `import` tĩnh thành `lazy(() => import(...))` và luôn kèm `<Suspense>` bọc ngoài.

### Bước 3. Chạy build: kiểm tra output gồm nhiều chunk `.js`, `import()` xuất hiện dưới dạng `Promise`

Bước này là "kiểm tra sau mổ": build xong phải nhìn thấy các mảnh được tách thật, chứ không phải tin lời hứa suông.

**Vì sao:** tách mà không kiểm tra thì không biết có tách thật không. Nhiều trường hợp đường dẫn động, config gom lại, hoặc import nhầm chỗ khiến chunk vẫn gộp vào main.

**Cách làm:** chạy `npm run build`, xem terminal in ra `dist/assets/Reports-*.js`, `dist/assets/chart-vendor-*.js` riêng biệt, file `index-*.js` nhỏ đi. Mở tab Network, load trang đầu xác nhận chunk reports chưa xuất hiện; điều hướng tới reports mới thấy request mới.

> **Tóm gọn 1 câu:** Build xong phải thấy nhiều file `.js` riêng và `index-*.js` nhỏ đi — chưa thấy là chưa tách được.

### Bước 4. Bọc `ErrorBoundary` quanh vùng lazy để xử lý cảnh mạng chậm → chunk tải thất bại

Bước này thêm "lưới an toàn" cho lúc mạng hỏng. Chunk là file tải qua mạng, nên lỗi mạng là chuyện chắc chắn sẽ xảy ra với ai đó.

**Vì sao:** chunk là request network — có thể 404 (deploy lệch hash), rớt mạng, CDN lỗi. Không bọc, cả app trắng. Bọc thì chỉ vùng đó hiện "Tải lỗi — Thử lại", như thang máy hỏng thì vẫn đi được cầu thang bộ.

**Code minh họa:**

> 📄 **Code ví dụ:** [`examples/15-buoc-4-boc-errorboundary-quanh-vung-lazy-e.tsx`](examples/15-buoc-4-boc-errorboundary-quanh-vung-lazy-e.tsx)

> **Tóm gọn 1 câu:** Bọc `ErrorBoundary` quanh vùng lazy để lỗi mạng chỉ làm hỏng đúng vùng đó, kèm nút Thử lại.

### Bước 5. Nếu cần tương tác điều kiện (modal/editor), gọi `import()` ngay trong event handler thay vì dùng `lazy`

Bước cuối dành cho feature nằm sau cú bấm. `lazy` gắn với hiển thị; còn khi tải phụ thuộc hành động hay quyền, dùng `import()` tay sẽ mềm dẻo hơn.

**Vì sao:** `lazy` kích hoạt khi mount; nhưng có trường hợp ta muốn tải trước khi mount (hover nút "Sửa" là tải editor, bấm mới mở modal) hoặc quyết định runtime (quyền admin mới tải module admin). `import()` trong handler linh hoạt hơn.

**Code minh họa:**

> 📄 **Code ví dụ:** [`examples/16-buoc-5-neu-can-tuong-tac-ieu-kien.tsx`](examples/16-buoc-5-neu-can-tuong-tac-ieu-kien.tsx)

> **Tóm gọn 1 câu:** Feature chỉ mở sau cú bấm hoặc cần kiểm tra quyền thì gọi `import()` ngay trong handler, đừng ép dùng `lazy`.

## Ví dụ chi tiết

Phần này đưa code hoàn chỉnh để bạn copy về chạy thử. Khối dưới đây mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn), chỉ thêm comment tiếng Việt để giải thích. Sau đó là ví dụ route-level bổ sung.

> 📄 **Code ví dụ:** [`examples/17-vi-du-chi-tiet.tsx`](examples/17-vi-du-chi-tiet.tsx)

Route-level lazy với React Router v7 (ví dụ bổ sung, cùng pattern):

> 📄 **Code ví dụ:** [`examples/18-vi-du-chi-tiet.tsx`](examples/18-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Phần này mổ xẻ từng dòng code quan trọng trong ví dụ trên. Đọc xong bạn sẽ hiểu vì sao mỗi dòng tồn tại, và bỏ nó đi thì chuyện gì xảy ra.

### `const [show, setShow] = useState(false)` — điểm kích hoạt tải

Đây là dòng "công tắc" của cả cơ chế lazy. Hiểu nó thì bạn hiểu vì sao chunk không tải sớm hơn.

**Vì sao:** đây là công tắc network. Khi `show` là `false`, `<HeavyChart/>` không tồn tại trong cây render nên factory `() => import(...)` chưa bao giờ chạy — trình duyệt chưa hề biết chunk chart tồn tại. Khi `setShow(true)`, React mount lazy component, factory chạy, request bay đi. Như công tắc đèn: bật lên thì đèn mới tốn điện. Nhờ vậy bundle đầu không chứa chart library (có thể 300–500KB). **Sai thì sao:** nếu viết `{<HeavyChart/>}` không điều kiện (luôn mount), chunk tải ngay lần đầu — mất ý nghĩa lazy. Fix luôn là render có điều kiện hoặc theo route.

> **Tóm gọn 1 câu:** State điều kiện chính là công tắc quyết định khi nào code nặng được tải về.

### `.then((m) => ({ default: m.HeavyChart }))` — chuyển named export sang default

Dòng này giải quyết yêu cầu riêng của `lazy`: nó chỉ đọc `default` export. Nếu module của bạn export named thì phải "phiên dịch" qua bước này.

**Vì sao:** `lazy` được thiết kế chỉ đọc `module.default`. Nhiều module export named (`export function HeavyChart`) nên phải bọc lại thành object có key `default`. Đây là hợp đồng API, không phải mẹo. **Sai thì sao:** bỏ `.then` khi module chỉ có named export → `lazy` nhận module không có `.default`, render ra `undefined`, trang trắng không báo lỗi rõ. Fix luôn map như trên. Với default export (`export default Dashboard`) thì không cần map.

> **Tóm gọn 1 câu:** `lazy` chỉ nhận `default` export — module export named thì phải map lại qua `.then`.

### `<Suspense fallback={<p>…</p>}>` — giao diện "đang tải"

Dòng này quyết định user thấy gì trong lúc chờ code tải về. Fallback càng giống bố cục trang thật thì trải nghiệm càng mượt.

**Vì sao:** từ lúc request bay đi tới lúc eval xong có thể 200ms–2s. `fallback` là thứ user thấy trong khoảng đó. Với route-level, đặt một `<Suspense>` bọc `<Outlet/>` để dùng chung skeleton toàn trang thay vì mỗi page một spinner rời rạc. **Cơ chế:** React suspend cây con và vẽ fallback; khi promise resolve, React render lại với nội dung thật, fallback biến mất. **Sai thì sao:** đặt fallback là spinner nhỏ giữa trang cho route lớn gây "nhảy layout"; fix là dùng skeleton đầy đủ chiều cao tương đương trang thật.

> **Tóm gọn 1 câu:** Fallback là "màn chờ" của user — làm skeleton giống bố cục thật thì không bị nhảy layout.

### `{show && ...}` — vòng đời lazy bắt đầu khi mount

Đoạn này nhấn mạnh vòng đời của lazy gắn chặt với thời điểm mount. Sai chỗ khai báo `lazy` sẽ khiến nó tải đi tải lại mãi.

**Vì sao:** trước khi bấm, React giữ JSX có điều kiện là `false` nên không tạo fiber cho lazy component. Sau khi bấm, fiber được tạo, vòng đời tải → suspend → render diễn ra. Remount sau (tắt rồi mở lại) dùng module đã cache nên hiện ngay, không tải lại. **Sai thì sao:** tạo `lazy` bên trong render (`function Comp(){ const X = lazy(...) }`) khiến mỗi render tạo một lazy mới, reset trạng thái đã tải — chunk tải lại liên tục. Fix là khai báo `lazy` ở module scope, factory ổn định.

> **Tóm gọn 1 câu:** Khai báo `lazy` một lần ở ngoài component; bấm nút chỉ thay đổi việc mount, không thay đổi việc tải.

## So sánh (nếu có)

Phần này đối chiếu hai cách tải code trễ để bạn chọn đúng cái cho từng tình huống. Cả hai đều dùng được, nhưng "vùng sáng" của mỗi cái khác nhau.

### `React.lazy` + `Suspense` vs gọi `import()` thủ công + `useState`

**`lazy`:** giữ trạng thái "đã tải" của module, tránh tải lại khi remount, vẽ qua Suspense nhất quán, ít code. Phù hợp khi quyết định tải gắn với mount (route, điều kiện hiển thị). Nhược điểm là kém linh hoạt với logic runtime phức tạp (quyền, feature flag, preload hover).

**`import()` thủ công:** linh hoạt tối đa — gọi lúc nào, với điều kiện gì, cache ra sao đều do ta quyết. Ví dụ `if (isAdmin) mod = await import('./AdminPanel')`. Nhược điểm là phải tự quản loading/error/cache bằng `useState`/`useEffect`, dễ quên cleanup và xử lý race.

**Khi nào dùng cái nào:** mount là tín hiệu tải → `lazy`. Hành động/tín hiệu khác (hover, quyền, feature flag) là tín hiệu tải → `import()` thủ công. Thực tế dùng cả hai trong cùng app.

> 📄 **Code ví dụ:** [`examples/19-react-lazy-suspense-vs-goi-import-thu-cong.tsx`](examples/19-react-lazy-suspense-vs-goi-import-thu-cong.tsx)

> **Tóm gọn 1 câu:** Tải gắn với hiển thị thì dùng `lazy`; tải gắn với hành động/quyền thì dùng `import()` thủ công.

### Route-level vs component-level splitting

**Route-level** tách theo điều hướng (1 chunk/page) — đơn giản, hiệu quả cao, thường đủ tốt cho app vừa. Nhược điểm là trong một page vẫn có thể chứa widget nặng mà 90% lượt xem không dùng (chart trong dashboard).

**Component-level** tách widget nặng trong page — tinh chỉnh hơn, First Load của chính page đó cũng nhẹ. Nhược điểm là nhiều chunk nhỏ, nhiều Suspense lồng, phức tạp hơn.

**Thực tế:** dùng cả hai — route-level cho mọi page sau login, component-level cho chart/editor/modal nặng nằm trong page.

> **Tóm gọn 1 câu:** Tách theo route trước cho rẻ và đơn giản, rồi tinh chỉnh bằng component-level với widget nặng bên trong.

## Lỗi thường gặp / Chống chỉ định

Phần này liệt kê những cú ngã phổ biến khi lazy hóa code, kèm cách đỡ. Đọc trước giúp bạn tránh mất cả buổi tối debug.

### 1. Quên `<Suspense>`

**Vì sao sai:** React suspend nhưng không có ranh giới để vẽ fallback → ném lỗi runtime `A component suspended while responding to synchronous input` và trắng trang.

> 📄 **Code ví dụ:** [`examples/20-1-quen-suspense.tsx`](examples/20-1-quen-suspense.tsx)

### 2. `lazy` với named export để nguyên

**Vì sao sai:** chunk tải xong nhưng `module.default` là `undefined` → render rỗng, không báo lỗi mạng nên khó phát hiện.

> 📄 **Code ví dụ:** [`examples/21-2-lazy-voi-named-export-e-nguyen.tsx`](examples/21-2-lazy-voi-named-export-e-nguyen.tsx)

### 3. Không bọc ErrorBoundary — mạng lỗi khi tải chunk crash cả app

**Vì sao sai:** chunk là fetch network — rớt mạng, 404 hash cũ, CDN lỗi đều có thể xảy ra. Không bắt, lỗi lan lên root và unmount toàn app.

> 📄 **Code ví dụ:** [`examples/22-3-khong-boc-errorboundary-mang-loi-khi-tai.tsx`](examples/22-3-khong-boc-errorboundary-mang-loi-khi-tai.tsx)

### 4. Split quá nhỏ / quá nhiều chunk

**Vì sao sai:** mỗi request có overhead (DNS, handshake, header) 30–80ms. Chia 200 chunk 5KB chậm hơn 20 chunk 50KB, nhất là mạng yếu.

> 📄 **Code ví dụ:** [`examples/23-4-split-qua-nho-qua-nhieu-chunk.tsx`](examples/23-4-split-qua-nho-qua-nhieu-chunk.tsx)

### 5. Chống chỉ định: app nhỏ, thư viện dùng chung, module có side-effect

App < 50KB gzip hoặc mọi route dùng chung một thư viện lớn — lazy chỉ thêm request mà không bớt parse đáng kể. Module có side-effect lúc import (tự chạy `window.x = ...`, đăng ký global) mà lazy sẽ khiến side-effect chạy trễ/không đoán được — giữ import tĩnh cho loại này.

> **Tóm gọn 1 câu:** App nhỏ, thư viện dùng chung, và module có side-effect lúc import thì đừng lazy — lợi không thấy mà hại tăng.

## Câu hỏi thường gặp

### Khác nhau giữa `React.lazy` và gọi `import()` trực tiếp?

`lazy` trả về component tích hợp Suspense — mount là tải, remount là dùng cache, không cần quản state. `import()` trả promise module thô — ta tự quyết khi nào gọi, tự `setState`, tự bắt lỗi, tự cache nếu cần. Dùng `lazy` khi tải gắn với hiển thị; dùng `import()` khi tải gắn với hành động/quyền/prefetch.

> **Tóm gọn 1 câu:** `lazy` gọn vì React lo hết; `import()` tay thì tự do hơn nhưng phải tự lo loading, lỗi, cache.

### Chunk tải thất bại vì mạng thì sao?

Bọc `ErrorBoundary` quanh vùng lazy với nút "Thử lại" gọi `location.reload()` hoặc gọi lại `import()`. Module lỗi lần đầu vẫn có thể tải lại thành công khi mạng hồi vì browser retry request mới. Với deploy mới đổi hash, reload là cách chắc chắn nhất để lấy HTML mới trỏ chunk mới.

> **Tóm gọn 1 câu:** Đặt ErrorBoundary + nút Thử lại — lỗi mạng chunk là tạm thời, retry thường là xong.

### Có nên lazy hóa mọi component?

Không. Chỉ lazy route lớn và module nặng dùng không thường xuyên. Component nhỏ (< 20KB) lazy hóa chỉ tăng request, tăng Suspense lồng, tăng phức tạp mà First Load không giảm đáng kể. Giữ màn hình đầu (login/home) import tĩnh để LCP không phải chờ network.

> **Tóm gọn 1 câu:** Chỉ lazy thứ nặng và ít dùng — lazy tràn lan làm app phức tạp mà không nhanh hơn.

### Lazy ảnh hưởng SEO không?

Với SPA client-render, nội dung phụ thuộc JS dù lazy hay không — crawler phải chạy JS mới thấy. Với SSR/streaming React 19, lazy boundary được stream: server gửi shell trước, chunk lazy gửi sau, crawler vẫn thấy đủ nếu chờ stream xong. Cần cấu hình `preload` đúng để chunk ưu tiên cao không bị trì hoãn.

> **Tóm gọn 1 câu:** SPA thuần thì lazy không làm SEO tệ thêm; SSR streaming vẫn cho crawler thấy đủ nếu cấu hình preload đúng.

### Làm sao biết chunk đã tách đúng?

Chạy `npm run build`, xem output có nhiều file `.js` (không chỉ một `index-*.js`). Mở `vite-bundle-visualizer` xác nhận module nặng nằm chunk riêng. Mở DevTools Network, load trang đầu xác nhận chunk nặng chưa xuất hiện; điều hướng tới route nặng mới thấy request mới. Nếu chunk nặng vẫn xuất hiện ngay lần đầu, kiểm tra lại có import tĩnh lọt ở đâu không.

> **Tóm gọn 1 câu:** Nhìn output build nhiều file `.js` + tab Network không thấy chunk nặng lúc mở trang đầu nghĩa là tách đúng.

## Ghi chú 2026

- **React 19.3 ổn định Suspense + streaming SSR:** `lazy` hoạt động tốt trong RSC khi kết hợp client boundary. Server stream shell trước, client hydrate từng boundary khi chunk về, không block toàn trang. Với SPA thuần Vite, cơ chế này không cần cấu hình thêm.

- **Ưu tiên `route.lazy` của React Router v7:** thay vì `const P = lazy(() => import('./P'))` rồi `<P/>`, khai `route.lazy = () => import('./pages/p')` để chunk mang cả `Component` lẫn `loader` trong một request. Giảm một tầng bọc, giảm waterfall (tải component xong mới tải data).

- **Vite 7 gom chunk nhỏ thông minh hơn:** `import()` trỏ module < 10KB có thể được gom vào chunk cha thay vì tách file riêng, tránh phân mảnh. Vẫn nên kiểm tra bằng `vite-bundle-visualizer` sau mỗi lần thêm lazy mới để xác nhận số lượng và kích thước chunk như kỳ vọng.

## Best practices / Mẹo

### Luôn đặt `Suspense` trên vùng lazy, dùng skeleton chung cho route

**Vì sao:** fallback rời rạc mỗi component gây chớp nhiều lần. Một `Suspense` bọc `<Outlet/>` với skeleton toàn trang cho cảm giác tải một lần, mượt hơn.

> 📄 **Code ví dụ:** [`examples/24-luon-at-suspense-tren-vung-lazy-dung-skeleton.tsx`](examples/24-luon-at-suspense-tren-vung-lazy-dung-skeleton.tsx)

> **Tóm gọn 1 câu:** Một skeleton chung cho cả route sẽ mượt hơn nhiều spinner rời rạc chớp liên tục.

### Kết hợp prefetch khi hover/focus link

**Vì sao:** xóa độ trễ lần đầu vào route nặng. User hover trung bình 200–400ms trước khi bấm — đủ để chunk 100KB về trước.

> 📄 **Code ví dụ:** [`examples/25-ket-hop-prefetch-khi-hover-focus-link.tsx`](examples/25-ket-hop-prefetch-khi-hover-focus-link.tsx)

> **Tóm gọn 1 câu:** Dùng thời gian hover để tải sẵn chunk — user bấm thì trang đã sẵn sàng.

### Giữ `lazy` factory ổn định ở module scope

**Vì sao:** tạo `lazy` trong render khiến mỗi render sinh component mới, mất cache đã tải, tải lại liên tục.

> 📄 **Code ví dụ:** [`examples/26-giu-lazy-factory-on-inh-o-module-scope.tsx`](examples/26-giu-lazy-factory-on-inh-o-module-scope.tsx)

> **Tóm gọn 1 câu:** Khai báo `lazy` một lần ngoài component — khai trong render là tự hủy cache của chính mình.

### Kết hợp `lazy` + ErrorBoundary + nút "Thử lại"

**Vì sao:** chunk lỗi là lỗi mạng tạm thời, retry thường thành công. Không có nút này user chỉ còn cách reload tay hoặc bỏ đi.

> **Tóm gọn 1 câu:** Bộ ba lazy + ErrorBoundary + Thử lại giúp app tự hồi phục khi mạng chập chờn.

### Ở tầng route dùng `route.lazy` để gộp loader + component

**Vì sao:** giảm waterfall: một chunk mang cả UI lẫn data loader, không phải tải component xong mới biết cần fetch gì.

> **Tóm gọn 1 câu:** `route.lazy` gom code giao diện và code lấy data vào một chuyến tải — bớt chờ đợi nối tiếp.

### Kiểm tra chunk trong CI để bắt module lọt nhầm

**Vì sao:** một import tĩnh vô tình (`import {x} from './Reports'` trong file dùng chung) sẽ kéo cả chunk nặng về main bundle mà không ai hay. Script CI kiểm tra `dist` có chunk reports riêng và `index-*.js` dưới budget (ví dụ 200KB gzip) sẽ bắt hồi quy sớm.

> **Tóm gọn 1 câu:** Cho script CI kiểm tra kích thước bundle để import tĩnh lọt nhầm bị phát hiện ngay trong PR.

### Tránh lazy cho màn hình đầu và component giữ state khởi tạo

Màn hình đầu lazy sẽ khiến LCP phải chờ network — giữ tĩnh. Component giữ state khởi tạo (form đang nhập) mà lazy/remount sẽ mất state — cân nhắc `key` ổn định hoặc không lazy.

> **Tóm gọn 1 câu:** Không lazy màn hình đầu (chậm LCP) và component đang giữ state (mất dữ liệu user).

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
