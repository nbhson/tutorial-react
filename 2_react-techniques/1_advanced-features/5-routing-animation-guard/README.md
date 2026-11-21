# Routing Animation + Permission Guard

> Nguồn: https://reactrouter.com/ — https://motion.dev/

## Mục tiêu

Mục này nói về ba việc bài giải quyết cho SPA: chặn route theo quyền trước khi UI kịp hiện, làm chuyển trang mượt thay vì cắt cứng, và tôn trọng người dùng nhạy cảm với chuyển động. Đọc để biết bài mang lại gì trước khi đi vào chi tiết.

### 1. Chặn truy cập route theo quyền (auth / role) trước khi UI được vẽ, không để flash nội dung

**Vì sao:** route `/admin` mà user thường mở ra thấy bảng quản trị chớp một cái rồi mới bị đá về `/403` là lỗi UX và rò rỉ UI (thậm chí rò data nếu component đã fetch). Guard đúng phải chặn từ "cổng": loader chạy trước khi bất kỳ component nào mount, hoặc component guard redirect ngay lần render đầu với `replace`.

**Cơ chế hai tầng:** tầng loader (`adminLoader` throw `redirect('/403')`) chạy trong router trước khi tạo element — không có khung hình tạm. Tầng component (`RequireRole` trả `<Navigate replace/>`) xử lý redirect nhanh theo state client (token/roles trong store). Dùng cả hai: loader cho quyết định cuối cần data server, component cho phản xạ tức thì. Ví von: loader như bảo vệ ở sảnh tòa nhà (chặn người không có thẻ ngay từ cửa), component như nhân viên phòng thấy người lạ bước vào thì mời ra ngoài.

**Code minh họa (comment tiếng Việt):**

> 📄 **Code ví dụ:** [`examples/01-1-chan-truy-cap-route-theo-quyen-auth.tsx`](examples/01-1-chan-truy-cap-route-theo-quyen-auth.tsx)

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/02-1-chan-truy-cap-route-theo-quyen-auth.tsx`](examples/02-1-chan-truy-cap-route-theo-quyen-auth.tsx)

> **Tóm gọn 1 câu:** Guard đúng phải chặn từ "cổng" (loader) thay vì để khách bước vào phòng rồi mới mời ra — không flash, không rò data.

### 2. Thêm animation chuyển trang mượt (fade/slide) với Motion + `AnimatePresence`

**Vì sao:** chuyển trang vụt (cắt cứng) khiến app cảm giác rời rạc, nhất là khi chunk lazy về chậm. Một fade 180ms + trượt 8px tạo cảm giác "liền mạch" mà không khiến user chờ. `AnimatePresence` giữ trang cũ vài frame để chạy exit trong lúc trang mới enter — không có nó, trang cũ biến mất ngay, animation ra không bao giờ chạy.

**Cơ chế:** `<AnimatePresence mode="wait">` bọc `<motion.div key={pathname}>`. Mỗi lần `pathname` đổi, React coi đây là instance mới: element cũ chạy `exit`, xong mới mount element mới chạy `initial → animate`. `mode="wait"` đảm bảo không đè hai trang cùng lúc (tránh double flash).

### 3. Tôn trọng `prefers-reduced-motion` cho người dùng nhạy cảm với chuyển động

**Vì sao:** slide/parallax gây chóng mặt, buồn nôn với một bộ phận user (tiền đình nhạy cảm). Hệ điều hành có cài đặt "giảm chuyển động" — web phải tôn trọng bằng cách tắt/bớt animation khi `useReducedMotion()` trả `true`. Đây là yêu cầu a11y, không phải tùy chọn thẩm mỹ.

> 📄 **Code ví dụ:** [`examples/03-3-ton-trong-prefers-reduced-motion-cho-nguoi.tsx`](examples/03-3-ton-trong-prefers-reduced-motion-cho-nguoi.tsx)

> **Tóm gọn 1 câu:** Ba mục tiêu của bài: guard không flash, chuyển trang mượt có chừng mực, và animation không gây chóng mặt cho ai.

## Tổng quan

Mục này nói về bức tranh toàn cảnh: hai vấn đề (bảo vệ route + trải nghiệm điều hướng) thường bị xử lý riêng, và bài ghép chúng thành một luồng chuẩn. Đọc để nắm luồng tổng thể trước khi đào sâu từng khái niệm.

Hai vấn đề thường đứng riêng trong SPA: **(1) bảo vệ route** — user chưa đăng nhập hay thiếu role không được thấy trang; **(2) trải nghiệm điều hướng** — chuyển trang vụt, không có "chất" khiến app cảm giác rời rạc. React Router v7 cung cấp `loader`/`action` chạy *trước* khi render để làm guard ở tầng dữ liệu, còn guard kiểu JSX (`RequireRole`) bọc cây route con để xử lý điều hướng lại (`<Navigate>`). Motion (kế thừa framer-motion) điều khiển animation ra/vào trang quanh `<Outlet/>`, key theo `pathname`.

Luồng chuẩn: root `loader` fetch `/api/me` một lần; route `/admin` có `adminLoader` kiểm tra role và `throw redirect` nếu thiếu; cây JSX bọc `RequireAuth` (có token?) ở layout cha và `RequireRole roles={['admin']}` ở route con để phản xạ tức thì; toàn bộ `<Outlet/>` nằm trong `AnimatedOutlet` (AnimatePresence + motion.div keyed). User chưa login → `/login`; thiếu role → `/403` không flash; đủ quyền → fade-in 180ms; bật reduced motion → hiện ngay không animation.

Áp dụng cho app có phân quyền và muốn chuyển cảnh mượt. Không áp dụng animation cho route table 10k dòng (animation + render nặng = giật) — giữ chuyển cảnh tối giản cho trang nặng.

> **Tóm gọn 1 câu:** Loader gác cổng ở tầng dữ liệu, component gác ở tầng UI, `AnimatePresence` hóa trang chuyển cảnh — cả ba hợp thành luồng điều hướng chuẩn.

## Khái niệm cốt lõi

Mục này nói về 5 khái niệm nền móng: guard ở loader, guard ở component, `useRouteLoaderData`, `AnimatePresence`, và key animation. Đọc để hiểu "vì sao" trước khi sang phần "làm thế nào".

### 1. Guard ở loader — chặn từ cổng, không flash

**Vì sao:** loader chạy trong router trước khi React tạo element. `throw redirect('/403')` dừng luôn việc render route đó. Không có khung hình tạm, không fetch data nhạy cảm của trang cấm, hoạt động cả với SSR.

**Cơ chế:** data router gọi loader theo thứ tự cha → con khi điều hướng. Loader trả data hoặc Response redirect. Component đọc data bằng `useLoaderData`/`useRouteLoaderData('root')` — không fetch lại `/api/me` ở từng trang.

> 📄 **Code ví dụ:** [`examples/04-1-guard-o-loader-chan-tu-cong-khong.tsx`](examples/04-1-guard-o-loader-chan-tu-cong-khong.tsx)

**Sai thì sao:** chỉ guard ở component mà trang fetch data trong loader không bảo vệ → data nhạy cảm vẫn bay về dù UI redirect. Fix: guard cả loader (data) lẫn component (UI).

### 2. Guard kiểu component — `<RequireRole>` đọc roles và `<Navigate replace/>`

**Vì sao:** đơn giản, đọc store/context ngay, redirect tức thì không cần roundtrip server. Hợp cho guard nhanh theo state client (đã login? có cờ admin?).

**Cơ chế:** `roles.some(r => myRoles.includes(r))` nghĩa là "cần 1 trong các role". Sai thì trả `<Navigate to="/403" replace/>` — `replace` thay history entry nên nút Back không quay lại trang cấm (tránh vòng lặp guard). Đúng thì `return <>{children}</>`.

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/05-2-guard-kieu-component-requirerole-oc-roles-va.tsx`](examples/05-2-guard-kieu-component-requirerole-oc-roles-va.tsx)

### 3. `useRouteLoaderData` — đọc data loader cha, tránh fetch lại

Root loader fetch `/api/me` một lần; mọi trang con gọi `useRouteLoaderData('root')` để lấy user/roles. Không có nó, mỗi trang tự fetch `/api/me` → N request trùng, N nơi xử lý lỗi, UI nhấp nháy theo từng fetch. Ví von: cả nhà cùng nấu cơm mà ai cũng tự đi chợ riêng, thay vì một người đi chợ một lần đủ cả.

### 4. `AnimatePresence` + `mode="wait"` — cho phép exit, không đè trang

Không có `AnimatePresence`, element cũ unmount ngay khi route đổi — `exit` không bao giờ chạy, chỉ thấy enter. `mode="wait"` bắt "đợi exit xong mới mount mới" → không có 2 trang chồng nhau vài frame (đặc biệt xấu với trang nền trắng + trang nền tối). Giá là mỗi điều hướng cộng thêm thời gian exit (180ms) — giữ ngắn để không cảm giác đơ.

### 5. Key & tam giác animation — `key={pathname}`, `initial/animate/exit`

`key={pathname}` khiến React coi mỗi route là instance riêng: key đổi → unmount cũ (chạy exit) + mount mới (chạy initial→animate). Không key, `motion.div` giữ một instance, đổi route chỉ thay children — animation không cháy. Giống như đổi tem thẻ đỗ xe mà xe vẫn là xe cũ: không có "chuyến mới" thì không có màn trình diễn chào sân. Tam giác `initial={{opacity:0,y:8}} → animate={{opacity:1,y:0}} → exit={{opacity:0,y:-8}}` là fade + trượt nhẹ 8px — đủ mềm mà không lề mề. `transition: { duration: 0.18 }` giữ 150–250ms.

## Luồng hoạt động / Cách áp dụng

Mục này nói về 5 bước dựng hệ thống từ đầu theo đúng thứ tự. Đọc để có lộ trình làm việc, chi tiết kỹ thuật đã nằm ở phần khái niệm phía trên.

### Bước 1. Guard dữ liệu: root loader fetch `/api/me`, throw redirect nếu thiếu role

Viết `adminLoader` như trên. Route con đọc qua `useRouteLoaderData('root')`. Test bằng `createMemoryRouter` với user viewer → xác nhận vào `/admin` tự về `/403`, không có lần render Admin nào.

### Bước 2. Guard component: `RequireAuth` ở layout cha, `RequireRole` ở route con

Một chỗ cho "cần đăng nhập", chi tiết cho "cần role". Không lồng ngược (Role trong Auth sai thứ tự gây log trùng/nhầm nhánh 403 cho trang chỉ cần login). Lưu user/roles vào Context/Zustand từ `/api/me` một lần, không `JSON.parse(localStorage)` trong từng component (localStorage ai cũng sửa được — chỉ là guard UX, quyết định thật ở server/loader).

### Bước 3. Animation: `AnimatedOutlet` bọc AnimatePresence + motion.div keyed

Tạo component như Ví dụ chi tiết. Kết hợp code-splitting để page mới không vừa animation vừa chờ chunk (chia chunk trước, animation sau mới mượt).

### Bước 4. Reduced motion + thời lượng ngắn

`useReducedMotion()` → nếu true thì `initial={false}` (hiện ngay). Giữ 0.15–0.25s. Route list lớn để chuyển cảnh tối giản.

### Bước 5. Test ba nhánh: /login, /403, fade-in

Chưa login → /login; viewer vào /admin → /403 không flash, Back không quay lại /admin; admin vào → fade-in; bật reduced motion (DevTools Rendering → Emulate) → không animation.

> **Tóm gọn 1 câu:** Dựng theo 5 bước: guard loader → guard component → animation → reduced motion → test đủ ba nhánh đi/lỗi/vào được.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh mirror 1-1 với file gốc, chỉ thêm comment tiếng Việt. Đọc để thấy mọi mảnh ghép trước đó trong một file thật.

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn), chỉ thêm comment tiếng Việt:

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.tsx`](examples/06-vi-du-chi-tiet.tsx)

Guard dữ liệu ở loader (chạy trước khi render, không flash):

> 📄 **Code ví dụ:** [`examples/07-vi-du-chi-tiet.tsx`](examples/07-vi-du-chi-tiet.tsx)

Bổ sung reduced motion (pattern chuẩn đi kèm):

> 📄 **Code ví dụ:** [`examples/08-vi-du-chi-tiet.tsx`](examples/08-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về ý nghĩa từng chi tiết nhỏ trong code — những chỗ tưởng nhỏ mà sai một chữ là behavior đổi hẳn. Đọc như đọc bản chú thích dưới mỗi bản vẽ.

### `roles.some(...)` — ngữ nghĩa "1 trong các role"

`some` nghĩa là OR (admin HOẶC editor). Muốn AND (vừa admin vừa billing) thì đổi sang `every`. Ví von: `some` là cửa có nhiều chìa khóa mở một trong số đó là được; `every` là khóa nhiều chốt phải mở đủ các chốt. Chọn sai ngữ nghĩa là lỗi phân quyền phổ biến: trang cần cả hai quyền mà dùng `some` thì user một quyền cũng lọt.

### `<Navigate to="/403" replace />` — xóa entry cấm khỏi history

Không `replace`, history giữ `/admin` → Back quay lại `/admin` → guard đá tiếp → kẹt. `replace` thay entry hiện tại bằng `/403` nên Back về trang trước đó, thoát vòng lặp.

### `mode="wait"` — chống double flash

Mặc định `mode="sync"`: page mới mount ngay khi page cũ đang exit → vài frame thấy hai màn hình chồng (nền đè, scroll nhảy). `wait` đợi exit xong mới mount — sạch nhưng cộng thời gian exit vào mỗi điều hướng, nên giữ exit ngắn.

### `key={pathname}` — điều kiện để animation cháy

Không key, `motion.div` là một instance xuyên suốt: đổi route chỉ thay `children` (Outlet), `initial` không chạy lại vì element không mount mới. Có key, key đổi → React unmount cũ + mount mới → `initial/animate` chạy. Dùng `pathname` (không dùng `key={Math.random()}` gây mount lại mỗi render).

### `transition 0.18s` — đủ mềm, không lề mề

Dưới 100ms mắt khó nhận; trên 400ms user cảm giác route đơ (cộng thêm thời gian tải chunk). 150–250ms là vùng ngọt cho fade/slide trang — giống độ dày lớp kem: quá mỏng không thấy, quá dày gây ngấy.

## So sánh (nếu có)

Mục này nói về các lựa chọn thiết kế đặt cạnh nhau để bạn chọn đúng: guard loader vs guard component, `Navigate` vs `window.location`, per-page vs shared layout. Đọc để tự quyết theo bài toán của mình thay vì chép mù.

### Guard ở loader vs guard component

Loader: chặn trước render, không flash, chạy được SSR, bảo vệ cả data fetch trong loader. Nhược điểm là cần data router, không đọc state client tức thì. Component: đơn giản, đọc store ngay, redirect tức thì, nhưng đã vẽ một khung rồi mới redirect (flash nhẹ) và không bảo vệ data loader. Đúng nhất: cả hai — loader cho quyết định cuối cần server, component cho phản xạ nhanh.

### `Navigate` vs `window.location`

`Navigate` giữ SPA (không reload, giữ state, giữ history React). `window.location` reload toàn app — chỉ khi thoát hẳn domain, đổi từ HTTP sang HTTPS khác origin, hoặc cần reset toàn bộ state.

### Animation per-page vs shared layout (`layoutId`)

Per-page (key=pathname) dễ nhất, mỗi trang fade/slide độc lập. Shared layout (`layoutId`) tạo chuyển cảnh liền mạch (thumbnail phóng thành detail) nhưng khó control, dễ lỗi với list lớn và layout phức tạp. Dùng per-page mặc định; shared chỉ cho hero/thumbnail có chủ đích.

> **Tóm gọn 1 câu:** Luôn dùng cả hai tầng guard (loader + component), giữ SPA bằng `Navigate`, mặc định per-page animation — chỉ nâng cấp shared layout khi thật sự cần.

## Lỗi thường gặp / Chống chỉ định

Mục này nói về 5 bẫy dễ dính nhất, từ guard trễ gây flash đến tin nhầm localStorage là bảo mật. Đọc để đỡ mất buổi tối debug.

### 1. Guard trong effect trễ → flash nội dung cấm

> 📄 **Code ví dụ:** [`examples/09-1-guard-trong-effect-tre-flash-noi-dung.tsx`](examples/09-1-guard-trong-effect-tre-flash-noi-dung.tsx)

### 2. `mode="wait"` + duration dài → route cảm giác đơ

Giữ exit 0.15–0.25s. Route nặng (table lớn) tắt slide, chỉ fade nhanh hoặc không animation.

### 3. Quên reduced motion → gây khó chịu cho user nhạy cảm

Luôn `useReducedMotion()` và bọc điều kiện cho `initial/animate/exit` như ví dụ bổ sung.

### 4. Tin localStorage roles là bảo mật — chỉ là guard UX

Ai cũng sửa được localStorage. Quyết định cho thấy data thật phải ở server/loader có xác thực. Client guard chỉ để UX (ẩn nút, redirect sớm), không thay auth server — như rèm cửa che mắt người nhìn từ đường, chứ không phải ổ khóa cửa.

### 5. Hai guard lồng ngược → nhầm nhánh 403/login

Tách rõ: `RequireAuth` (có token?) ở layout cha; `RequireRole` (đủ role?) ở route con. Test cả ba: chưa login → /login (không phải /403); login thiếu role → /403; đủ role → vào.

> **Tóm gọn 1 câu:** Đừng guard trễ, đừng animation dài, đừng tin localStorage là bảo mật, và đừng lồng guard ngược thứ tự.

## Câu hỏi thường gặp

Mục này nói về các câu hỏi người học hay đắn nhất khi triển khai — tra nhanh khi đang băn khoăn giữa các lựa chọn.

### Guard bằng loader hay component?

Loader chặn trước render (không flash, SSR được); component đơn giản tức thì với state client. Dùng cả hai ở hai tầng: loader cho data/quyền cuối, component cho redirect nhanh.

### Tại sao animation không chạy?

Ba nguyên nhân phổ biến: `key` không đổi (quên `key={pathname}`), thiếu `AnimatePresence` bọc ngoài (exit không chạy), hoặc `Outlet` nằm ngoài `motion.div` (animation bọc nhầm chỗ). Kiểm tra theo thứ tự này.

### localStorage roles có an toàn không?

Không — chỉ guard UX. Mọi kiểm tra quyền thật phải ở server/loader. Đừng dựa vào nó để quyết định trả data nhạy cảm.

### AnimatePresence có làm chậm route?

`mode="wait"` cộng thời gian exit vào mỗi điều hướng. Giữ 0.15–0.25s thì không cảm nhận được; quá 0.4s thì rõ ràng đơ.

### Có cần animation cho mọi route?

Không. Route nặng/danh sách lớn để tối giản; animation hợp với chuyển giữa các màn hình độc lập (dashboard → cài đặt). Đo INP trước/sau để chắc animation không làm input chậm đi.

> **Tóm gọn 1 câu:** FAQ chốt lại: guard hai tầng, animation có key + AnimatePresence mới chạy, localStorage chỉ là rèm che chứ không phải ổ khóa.

## Ghi chú 2026

Mục này nói về những đổi tên/đổi chuẩn mới nhất trong hệ sinh thái — đọc để khỏi dùng import cũ từ tutorial năm trước.

- **React Router v7 gộp `react-router-dom` vào `react-router`:** `loader`/`action` + `route.lazy` là mặc định cho data router. Import từ `react-router-dom` vẫn chạy nhưng tài liệu mới dùng `react-router`. `route.lazy` gộp loader + Component vào một chunk.

- **Motion (motion.dev) là tên mới của framer-motion:** import từ `motion/react` thay vì `framer-motion`. API `AnimatePresence`/`motion`/`useReducedMotion` giữ nguyên, bundle nhẹ hơn.

- **Test guard bằng Vitest + `createMemoryRouter`:** mô phỏng điều hướng không cần browser, assert vào `/admin` với user viewer thì location thành `/403` và không có node Admin nào render.

## Best practices / Mẹo

Mục này nói về ba thói quen đáng áp dụng từ ngày đầu: đặt guard đúng vị trí, tách chunk trước khi animation, và test cả ba nhánh. Đọc để hình thành phác thảo làm việc chuẩn.

### Đặt RequireAuth ở layout cha, RequireRole ở route con

Một chỗ cho "cần đăng nhập", chi tiết cho "cần role". Không parse localStorage trong từng component — lấy `/api/me` một lần vào Context/Zustand, mọi guard đọc từ đó.

### Animation luôn đi cùng code-splitting

Page mới vừa tải chunk vừa animation sẽ giật (animation chạy trong lúc main bận eval JS). Tách chunk trước (route.lazy), prefetch khi hover, animation sau mới mượt.

### Fallback 404 + test cả nhánh 403/login bằng unit test route config

Mọi unknown path có `Navigate to="/404"`. Viết test cho ba nhánh (public/admin/profile) để guard không bị phá vỡ lặng lẽ sau refactor.

> **Tóm gọn 1 câu:** Mẹo bền vững: guard phân tầng rõ ràng, chunk trước animation sau, và test chốt cửa sau mỗi refactor.

## Bài tập nhỏ

Mục này nói về bài thực hành tổng hợp cả bài — làm một lần để mọi khái niệm "chắc tay" thay vì chỉ đọc hiểu.

Xây route tree: `/` công khai, `/admin` (RequireRole admin), `/profile` (RequireAuth). Các bước:

1. Viết `rootLoader` fetch `/api/me` (mock), `adminLoader` throw redirect nếu thiếu admin.
2. Cấu hình router với `RequireAuth` ở layout cha, `RequireRole roles={['admin']}` ở `/admin`.
3. Bọc tất cả bằng `AnimatedOutlet` fade 0.15s + `useReducedMotion`.
4. Đăng nhập user "viewer" (roles `['viewer']`): vào `/admin` xác nhận tự về `/403`, không flash frame Admin nào, bấm Back xác nhận không quay lại `/admin`.
5. Viết test `createMemoryRouter` assert ba nhánh trên.

> **Tóm gọn 1 câu:** Xong bài tập này bạn có sẵn một "template phòng thủ" dùng lại cho mọi dự án có phân quyền.

## Reference

- [React Router — Loaders](https://reactrouter.com/how-to/data-loading)
- [React Router — Navigate](https://reactrouter.com/api/routes/navigate)
- [Motion — AnimatePresence](https://motion.dev/docs/react-animate-presence)
- [Motion — useReducedMotion](https://motion.dev/docs/react-reduced-motion)
