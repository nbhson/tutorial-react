# Routing Animation + Permission Guard

> Nguồn: https://reactrouter.com/ — https://motion.dev/

## Mục tiêu

### 1. Chặn truy cập route theo quyền (auth / role) trước khi UI được vẽ, không để flash nội dung

**Vì sao:** route `/admin` mà user thường mở ra thấy bảng quản trị chớp một cái rồi mới bị đá về `/403` là lỗi UX và rò rỉ UI (thậm chí rò data nếu component đã fetch). Guard đúng phải chặn từ "cổng": loader chạy trước khi bất kỳ component nào mount, hoặc component guard redirect ngay lần render đầu với `replace`.

**Cơ chế hai tầng:** tầng loader (`adminLoader` throw `redirect('/403')`) chạy trong router trước khi tạo element — không có khung hình tạm. Tầng component (`RequireRole` trả `<Navigate replace/>`) xử lý redirect nhanh theo state client (token/roles trong store). Dùng cả hai: loader cho quyết định cuối cần data server, component cho phản xạ tức thì.

**Code minh họa (comment tiếng Việt):**

```tsx
// ✅ ĐÚNG: loader chặn trước render — không flash
import { redirect } from 'react-router-dom';
export async function adminLoader() {
  const me = await fetch('/api/me').then((r) => r.json()); // lấy user ở cổng
  if (!me?.roles?.includes('admin')) throw redirect('/403'); // thiếu quyền → chuyển hướng, không render
  return me; // đủ quyền → route con đọc qua useRouteLoaderData
}
```

**Sai thì sao:**

```tsx
// ❌ SAI: guard trong useEffect trễ — page hiện rồi mới đá
function Admin() {
  useEffect(() => { if (!isAdmin) navigate('/403'); }, []); // user thấy nội dung 1-2 frame
  return <BangQuanTri />; // đã render, đã fetch data nhạy cảm
}
// ✅ ĐÚNG: guard ở loader hoặc render đầu (xem RequireRole ở Ví dụ chi tiết)
```

### 2. Thêm animation chuyển trang mượt (fade/slide) với Motion + `AnimatePresence`

**Vì sao:** chuyển trang vụt (cắt cứng) khiến app cảm giác rời rạc, nhất là khi chunk lazy về chậm. Một fade 180ms + trượt 8px tạo cảm giác "liền mạch" mà không khiến user chờ. `AnimatePresence` giữ trang cũ vài frame để chạy exit trong lúc trang mới enter — không có nó, trang cũ biến mất ngay, animation ra không bao giờ chạy.

**Cơ chế:** `<AnimatePresence mode="wait">` bọc `<motion.div key={pathname}>`. Mỗi lần `pathname` đổi, React coi đây là instance mới: element cũ chạy `exit`, xong mới mount element mới chạy `initial → animate`. `mode="wait"` đảm bảo không đè hai trang cùng lúc (tránh double flash).

### 3. Tôn trọng `prefers-reduced-motion` cho người dùng nhạy cảm với chuyển động

**Vì sao:** slide/parallax gây chóng mặt, buồn nôn với một bộ phận user (tiền đình nhạy cảm). Hệ điều hành có cài đặt "giảm chuyển động" — web phải tôn trọng bằng cách tắt/bớt animation khi `useReducedMotion()` trả `true`. Đây là yêu cầu a11y, không phải tùy chọn thẩm mỹ.

```tsx
// ✅ ĐÚNG: tắt animation khi user yêu cầu giảm chuyển động
import { useReducedMotion } from 'motion/react';
const giam = useReducedMotion(); // true khi OS bật reduce motion
<motion.div initial={giam ? false : { opacity: 0 }} animate={{ opacity: 1 }} />
```

## Tổng quan

Hai vấn đề thường đứng riêng trong SPA: **(1) bảo vệ route** — user chưa đăng nhập hay thiếu role không được thấy trang; **(2) trải nghiệm điều hướng** — chuyển trang vụt, không có "chất" khiến app cảm giác rời rạc. React Router v7 cung cấp `loader`/`action` chạy *trước* khi render để làm guard ở tầng dữ liệu, còn guard kiểu JSX (`RequireRole`) bọc cây route con để xử lý điều hướng lại (`<Navigate>`). Motion (kế thừa framer-motion) điều khiển animation ra/vào trang quanh `<Outlet/>`, key theo `pathname`.

Luồng chuẩn: root `loader` fetch `/api/me` một lần; route `/admin` có `adminLoader` kiểm tra role và `throw redirect` nếu thiếu; cây JSX bọc `RequireAuth` (có token?) ở layout cha và `RequireRole roles={['admin']}` ở route con để phản xạ tức thì; toàn bộ `<Outlet/>` nằm trong `AnimatedOutlet` (AnimatePresence + motion.div keyed). User chưa login → `/login`; thiếu role → `/403` không flash; đủ quyền → fade-in 180ms; bật reduced motion → hiện ngay không animation.

Áp dụng cho app có phân quyền và muốn chuyển cảnh mượt. Không áp dụng animation cho route table 10k dòng (animation + render nặng = giật) — giữ chuyển cảnh tối giản cho trang nặng.

## Khái niệm cốt lõi

### 1. Guard ở loader — chặn từ cổng, không flash

**Vì sao:** loader chạy trong router trước khi React tạo element. `throw redirect('/403')` dừng luôn việc render route đó. Không có khung hình tạm, không fetch data nhạy cảm của trang cấm, hoạt động cả với SSR.

**Cơ chế:** data router gọi loader theo thứ tự cha → con khi điều hướng. Loader trả data hoặc Response redirect. Component đọc data bằng `useLoaderData`/`useRouteLoaderData('root')` — không fetch lại `/api/me` ở từng trang.

```tsx
// ✅ ĐÚNG: một lần ở root, con đọc lại — không fetch N lần
// root loader trả me; AdminPage đọc useRouteLoaderData('root') thay vì fetch lại
```

**Sai thì sao:** chỉ guard ở component mà trang fetch data trong loader không bảo vệ → data nhạy cảm vẫn bay về dù UI redirect. Fix: guard cả loader (data) lẫn component (UI).

### 2. Guard kiểu component — `<RequireRole>` đọc roles và `<Navigate replace/>`

**Vì sao:** đơn giản, đọc store/context ngay, redirect tức thì không cần roundtrip server. Hợp cho guard nhanh theo state client (đã login? có cờ admin?).

**Cơ chế:** `roles.some(r => myRoles.includes(r))` nghĩa là "cần 1 trong các role". Sai thì trả `<Navigate to="/403" replace/>` — `replace` thay history entry nên nút Back không quay lại trang cấm (tránh vòng lặp guard). Đúng thì `return <>{children}</>`.

**Sai thì sao:**

```tsx
// ❌ SAI: quên replace — Back quay lại trang cấm, lại bị đá, kẹt vòng lặp
if (!ok) return <Navigate to="/403" />;
// ✅ ĐÚNG: replace để xóa entry cấm khỏi history
if (!ok) return <Navigate to="/403" replace />;
```

### 3. `useRouteLoaderData` — đọc data loader cha, tránh fetch lại

Root loader fetch `/api/me` một lần; mọi trang con gọi `useRouteLoaderData('root')` để lấy user/roles. Không có nó, mỗi trang tự fetch `/api/me` → N request trùng, N nơi xử lý lỗi, UI nhấp nháy theo từng fetch.

### 4. `AnimatePresence` + `mode="wait"` — cho phép exit, không đè trang

Không có `AnimatePresence`, element cũ unmount ngay khi route đổi — `exit` không bao giờ chạy, chỉ thấy enter. `mode="wait"` bắt "đợi exit xong mới mount mới" → không có 2 trang chồng nhau vài frame (đặc biệt xấu với trang nền trắng + trang nền tối). Giá là mỗi điều hướng cộng thêm thời gian exit (180ms) — giữ ngắn để không cảm giác đơ.

### 5. Key & tam giác animation — `key={pathname}`, `initial/animate/exit`

`key={pathname}` khiến React coi mỗi route là instance riêng: key đổi → unmount cũ (chạy exit) + mount mới (chạy initial→animate). Không key, `motion.div` giữ một instance, đổi route chỉ thay children — animation không cháy. Tam giác `initial={{opacity:0,y:8}} → animate={{opacity:1,y:0}} → exit={{opacity:0,y:-8}}` là fade + trượt nhẹ 8px — đủ mềm mà không lề mề. `transition: { duration: 0.18 }` giữ 150–250ms.

## Luồng hoạt động / Cách áp dụng

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

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn), chỉ thêm comment tiếng Việt:

```tsx
// Các thành phần guard + animation (React Router v7 + Motion)
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react'; // motion.dev — tên mới của framer-motion
import type { ReactNode } from 'react';

// Guard theo role: kiểm tra ở component trước khi render con
// Vì sao ở component: phản xạ tức thì theo state client, không cần roundtrip server
export function RequireRole({
  roles, // danh sách role được phép (ví dụ ['admin'])
  children, // UI chỉ hiện nếu đủ quyền — không đủ thì redirect, không render con
}: {
  roles: string[];
  children: ReactNode;
}) {
  // đọc roles từ localStorage (đơn giản cho demo — production lấy từ context/store sau khi fetch /api/me)
  const myRoles: string[] = JSON.parse(
    localStorage.getItem('roles') ?? '[]', // chưa có thì mảng rỗng → không quyền nào khớp
  );
  const ok = roles.some((r) => myRoles.includes(r)); // có ít nhất 1 role khớp là qua (muốn TẤT CẢ thì dùng every)
  if (!ok) return <Navigate to="/403" replace />; // đá sang 403; replace để Back không quay lại trang cấm
  return <>{children}</>; // đủ quyền thì render con bình thường
}

// AnimatedOutlet: mỗi lần pathname đổi → page cũ exit, page mới enter
export function AnimatedOutlet() {
  const { pathname } = useLocation(); // key cho animation — đổi path là đổi instance
  return (
    <AnimatePresence mode="wait"> {/* chờ exit xong mới mount page mới — không đè 2 trang */}
      <motion.div
        key={pathname} // React tạo instance mới theo route — không key là animation không cháy
        initial={{ opacity: 0, y: 8 }} // trạng thái vào: mờ + đẩy xuống 8px
        animate={{ opacity: 1, y: 0 }} // trạng thái ổn định: rõ + về vị trí 0
        exit={{ opacity: 0, y: -8 }} // trạng thái ra: mờ + trôi lên 8px
        transition={{ duration: 0.18 }} // ngắn để không cảm giác chờ (0.15–0.25s chuẩn)
      >
        <Outlet /> {/* nội dung route hiện tại — mọi page đều đi qua animation này */}
      </motion.div>
    </AnimatePresence>
  );
}
```

Guard dữ liệu ở loader (chạy trước khi render, không flash):

```tsx
// adminLoader — chặn từ cổng: chạy trước khi bất kỳ component nào của /admin mount
import { redirect } from 'react-router-dom';
export async function adminLoader() {
  const me = await fetch('/api/me').then((r) => r.json()); // lấy user thật từ server
  if (!me?.roles?.includes('admin')) throw redirect('/403'); // thiếu quyền → chuyển hướng, không render
  return me; // đủ quyền → route con đọc qua useRouteLoaderData('root'), không fetch lại
}
```

Bổ sung reduced motion (pattern chuẩn đi kèm):

```tsx
// ✅ ĐÚNG: tôn trọng người dùng nhạy cảm chuyển động
import { useReducedMotion } from 'motion/react';
export function AnimatedOutletA11y() {
  const giam = useReducedMotion(); // true khi OS bật "giảm chuyển động"
  const { pathname } = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={giam ? false : { opacity: 0, y: 8 }} // giảm motion → hiện ngay, không fade/slide
        animate={{ opacity: 1, y: 0 }}
        exit={giam ? { opacity: 0 } : { opacity: 0, y: -8 }}
        transition={{ duration: giam ? 0 : 0.18 }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
```

## Giải thích từng phần

### `roles.some(...)` — ngữ nghĩa "1 trong các role"

`some` nghĩa là OR (admin HOẶC editor). Muốn AND (vừa admin vừa billing) thì đổi sang `every`. Chọn sai ngữ nghĩa là lỗi phân quyền phổ biến: trang cần cả hai quyền mà dùng `some` thì user một quyền cũng lọt.

### `<Navigate to="/403" replace />` — xóa entry cấm khỏi history

Không `replace`, history giữ `/admin` → Back quay lại `/admin` → guard đá tiếp → kẹt. `replace` thay entry hiện tại bằng `/403` nên Back về trang trước đó, thoát vòng lặp.

### `mode="wait"` — chống double flash

Mặc định `mode="sync"`: page mới mount ngay khi page cũ đang exit → vài frame thấy hai màn hình chồng (nền đè, scroll nhảy). `wait` đợi exit xong mới mount — sạch nhưng cộng thời gian exit vào mỗi điều hướng, nên giữ exit ngắn.

### `key={pathname}` — điều kiện để animation cháy

Không key, `motion.div` là một instance xuyên suốt: đổi route chỉ thay `children` (Outlet), `initial` không chạy lại vì element không mount mới. Có key, key đổi → React unmount cũ + mount mới → `initial/animate` chạy. Dùng `pathname` (không dùng `key={Math.random()}` gây mount lại mỗi render).

### `transition 0.18s` — đủ mềm, không lề mề

Dưới 100ms mắt khó nhận; trên 400ms user cảm giác route đơ (cộng thêm thời gian tải chunk). 150–250ms là vùng ngọt cho fade/slide trang.

## So sánh (nếu có)

### Guard ở loader vs guard component

Loader: chặn trước render, không flash, chạy được SSR, bảo vệ cả data fetch trong loader. Nhược điểm là cần data router, không đọc state client tức thì. Component: đơn giản, đọc store ngay, redirect tức thì, nhưng đã vẽ một khung rồi mới redirect (flash nhẹ) và không bảo vệ data loader. Đúng nhất: cả hai — loader cho quyết định cuối cần server, component cho phản xạ nhanh.

### `Navigate` vs `window.location`

`Navigate` giữ SPA (không reload, giữ state, giữ history React). `window.location` reload toàn app — chỉ khi thoát hẳn domain, đổi từ HTTP sang HTTPS khác origin, hoặc cần reset toàn bộ state.

### Animation per-page vs shared layout (`layoutId`)

Per-page (key=pathname) dễ nhất, mỗi trang fade/slide độc lập. Shared layout (`layoutId`) tạo chuyển cảnh liền mạch (thumbnail phóng thành detail) nhưng khó control, dễ lỗi với list lớn và layout phức tạp. Dùng per-page mặc định; shared chỉ cho hero/thumbnail có chủ đích.

## Lỗi thường gặp / Chống chỉ định

### 1. Guard trong effect trễ → flash nội dung cấm

```tsx
// ❌ SAI: effect chạy sau render — user thấy BangQuanTri 1-2 frame
function Admin() { useEffect(() => { if (!admin) nav('/403'); }, []); return <BangQuanTri />; }
// ✅ ĐÚNG: loader throw redirect + RequireRole ở render đầu
```

### 2. `mode="wait"` + duration dài → route cảm giác đơ

Giữ exit 0.15–0.25s. Route nặng (table lớn) tắt slide, chỉ fade nhanh hoặc không animation.

### 3. Quên reduced motion → gây khó chịu cho user nhạy cảm

Luôn `useReducedMotion()` và bọc điều kiện cho `initial/animate/exit` như ví dụ bổ sung.

### 4. Tin localStorage roles là bảo mật — chỉ là guard UX

Ai cũng sửa được localStorage. Quyết định cho thấy data thật phải ở server/loader có xác thực. Client guard chỉ để UX (ẩn nút, redirect sớm), không thay auth server.

### 5. Hai guard lồng ngược → nhầm nhánh 403/login

Tách rõ: `RequireAuth` (có token?) ở layout cha; `RequireRole` (đủ role?) ở route con. Test cả ba: chưa login → /login (không phải /403); login thiếu role → /403; đủ role → vào.

## Câu hỏi thường gặp

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

## Ghi chú 2026

- **React Router v7 gộp `react-router-dom` vào `react-router`:** `loader`/`action` + `route.lazy` là mặc định cho data router. Import từ `react-router-dom` vẫn chạy nhưng tài liệu mới dùng `react-router`. `route.lazy` gộp loader + Component vào một chunk.

- **Motion (motion.dev) là tên mới của framer-motion:** import từ `motion/react` thay vì `framer-motion`. API `AnimatePresence`/`motion`/`useReducedMotion` giữ nguyên, bundle nhẹ hơn.

- **Test guard bằng Vitest + `createMemoryRouter`:** mô phỏng điều hướng không cần browser, assert vào `/admin` với user viewer thì location thành `/403` và không có node Admin nào render.

## Best practices / Mẹo

### Đặt RequireAuth ở layout cha, RequireRole ở route con

Một chỗ cho "cần đăng nhập", chi tiết cho "cần role". Không parse localStorage trong từng component — lấy `/api/me` một lần vào Context/Zustand, mọi guard đọc từ đó.

### Animation luôn đi cùng code-splitting

Page mới vừa tải chunk vừa animation sẽ giật (animation chạy trong lúc main bận eval JS). Tách chunk trước (route.lazy), prefetch khi hover, animation sau mới mượt.

### Fallback 404 + test cả nhánh 403/login bằng unit test route config

Mọi unknown path có `Navigate to="/404"`. Viết test cho ba nhánh (public/admin/profile) để guard không bị phá vỡ lặng lẽ sau refactor.

## Bài tập nhỏ

Xây route tree: `/` công khai, `/admin` (RequireRole admin), `/profile` (RequireAuth). Các bước:

1. Viết `rootLoader` fetch `/api/me` (mock), `adminLoader` throw redirect nếu thiếu admin.
2. Cấu hình router với `RequireAuth` ở layout cha, `RequireRole roles={['admin']}` ở `/admin`.
3. Bọc tất cả bằng `AnimatedOutlet` fade 0.15s + `useReducedMotion`.
4. Đăng nhập user "viewer" (roles `['viewer']`): vào `/admin` xác nhận tự về `/403`, không flash frame Admin nào, bấm Back xác nhận không quay lại `/admin`.
5. Viết test `createMemoryRouter` assert ba nhánh trên.

## Reference

- [React Router — Loaders](https://reactrouter.com/how-to/data-loading)
- [React Router — Navigate](https://reactrouter.com/api/routes/navigate)
- [Motion — AnimatePresence](https://motion.dev/docs/react-animate-presence)
- [Motion — useReducedMotion](https://motion.dev/docs/react-reduced-motion)
