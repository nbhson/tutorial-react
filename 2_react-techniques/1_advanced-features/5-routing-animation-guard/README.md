# Routing Animation + Permission Guard

> Nguồn: https://reactrouter.com/ — https://motion.dev/

## Mục tiêu
- Chặn truy cập route theo quyền (auth / role) trước khi UI được vẽ, không để flash nội dung.
- Thêm animation chuyển trang mượt (fade/slide) với Motion + `AnimatePresence`.
- Tôn trọng `prefers-reduced-motion` cho người dùng nhạy cảm với chuyển động.

## Tổng quan
Hai vấn đề thường đứng riêng trong SPA: **(1) bảo vệ route** — user chưa đăng nhập hay thiếu role không được thấy trang; **(2) trải nghiệm điều hướng** — chuyển trang vụt, không có "chất" khiến app cảm giác rời rạc. React Router v7 cung cấp `loader`/`action` chạy *trước* khi render để làm guard ở tầng dữ liệu, còn guard kiểu JSX (`RequireRole`) bọc cây route con để xử lý điều hướng lại (`<Navigate>`). Motion (kế thừa framer-motion) điều khiển animation ra/vào trang quanh `<Outlet/>`, key theo `pathname`. Áp dụng cho app có phân quyền và muốn chuyển cảnh mượt.

## Khái niệm cốt lõi
- **Guard ở loader (server/client blend)**: `loader` trả data hoặc `redirect()`. Nếu `throw redirect('/403')`, Router dừng render route đó và chuyển hướng — không bao giờ có khung hình "trang tạm rồi bị đá ra". Guard ở loader chạy **trước khi bất kỳ component nào mount**, nên không flash.
- **Guard kiểu component**: `<RequireAuth>`/`<RequireRole>` đọc token/roles (localStorage, store, context), nếu sai trả `<Navigate to=... replace />`. Đơn giản, dễ đọc, nhưng render xảy ra trước khi redirect — nên dùng cho guard nhanh, không nặng.
- **`useRouteLoaderData`**: đọc dữ liệu do loader cha trả về ngay trong component con — tránh fetch lại user ở từng trang (đọc "me" một lần ở root loader).
- **`AnimatePresence`**: cho phép component *exit* — giữ thứ sắp rời đi vài frame trong lúc chạy animation ra, cùng lúc component mới vào. `mode="wait"` bắt buộc: đợi exit xong mới mount component mới → không đè 2 trang cùng lúc.
- **Key & vị trí animation**: thay `key={pathname}` trong `<motion.div>` để React coi mỗi route là một instance riêng — mỗi lần đổi path, element cũ exit, element mới enter. Chữ `initial={{opacity:0, y:8}}` → `animate={{opacity:1, y:0}}` → `exit={{...}}` là tam giác trạng thái animation của Motion.

## Luồng hoạt động / Cách áp dụng
1. Guard dữ liệu: root `loader` fetch `/api/me`, `throw redirect('/403')` nếu thiếu role; component đọc user qua `useRouteLoaderData`.
2. Guard component: `RequireAuth` (có token?) + `RequireRole roles={['admin']}` bọc route con trong route config.
3. Animation: tạo `AnimatedOutlet` (hoặc dùng `useOutlet`) bọc `<AnimatePresence mode="wait">` + `<motion.div key={pathname}>`.
4. Thêm `useReducedMotion()` từ Motion để tắt animation khi cần; giữ thời lượng ngắn (0.18–0.3s).
5. Test luồng: chưa đăng nhập → /login; đúng role → vào trang có fade-in; reduced motion → không animation.

## Ví dụ chi tiết
```tsx
// Các thành phần guard + animation (React Router v7 + Motion)
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';

// Guard theo role: kiểm tra ở component trước khi render con
export function RequireRole({
  roles,      // danh sách role được phép
  children,   // UI chỉ hiện nếu đủ quyền
}: {
  roles: string[];
  children: ReactNode;
}) {
  // đọc roles từ localStorage (đơn giản — production nên lấy từ context/store)
  const myRoles: string[] = JSON.parse(
    localStorage.getItem('roles') ?? '[]',
  );
  const ok = roles.some((r) => myRoles.includes(r)); // có ít nhất 1 role khớp
  if (!ok) return <Navigate to="/403" replace />;    // đá sang trang 403
  return <>{children}</>;                            // đủ quyền thì render
}

// AnimatedOutlet: mỗi lần pathname đổi → page cũ exit, page mới enter
export function AnimatedOutlet() {
  const { pathname } = useLocation(); // key cho animation
  return (
    <AnimatePresence mode="wait">     // chờ exit xong mới mount page mới
      <motion.div
        key={pathname}                // React tạo instance mới theo route
        initial={{ opacity: 0, y: 8 }}// trạng thái vào: mờ + đẩy xuống 8px
        animate={{ opacity: 1, y: 0 }}// trạng thái ổn định: rõ + về 0
        exit={{ opacity: 0, y: -8 }}  // trạng thái ra: mờ + trôi lên
        transition={{ duration: 0.18 }} // thời lượng ngắn, không "lề mề"
      >
        <Outlet />                    // nội dung route hiện tại
      </motion.div>
    </AnimatePresence>
  );
}
```

Guard dữ liệu ở loader (chạy trước khi render, không flash):
```tsx
export async function adminLoader() {
  const me = await fetch('/api/me').then((r) => r.json());
  if (!me?.roles?.includes('admin')) throw redirect('/403'); // chặn từ "cổng"
  return me; // route con đọc qua useRouteLoaderData('root')
}
```

## Giải thích từng phần
- `roles.some(...)` — chuẩn "cần 1 trong các role được phép"; muốn *tất cả* role thì đổi sang `every`.
- `<Navigate to="/403" replace />` — `replace` thay thế history entry, Back không quay về trang cấm (tránh vòng lặp guard).
- `mode="wait"` chống "double render flash": với `mode="sync"` (mặc định), page mới mount ngay khi page cũ đang exit — có khả năng nhìn thấy 2 màn hình chồng lên trong vài frame.
- `key={pathname}` — nếu bỏ key, `motion.div` giữ 1 instance; đổi route chỉ thay nội dung con, animation không cháy vì element có sẵn không bị "thay thế".
- `transition` giữ ~0.18s đủ "mềm" mà không khiến user chờ hiển thị.

## So sánh (nếu có)
- **Guard ở loader vs guard component**: loader chặn trước render — không flash, chạy được cả trên server rendering; guard component đơn giản hơn, đọc store ngay, nhưng vẫn vẽ 1 khung rồi redirect. Đúng nhất: dùng cả hai — loader cho dữ liệu/quyền cuối, component cho redirect nhanh theo state client.
- **`Navigate` (declarative) vs `window.location`**: `Navigate` giữ trong hệ sinh thái Router (không reload toàn trang, giữ SPA); `window.location` reload lại toàn app — chỉ dùng khi cần thoát hẳn domain/redirect ngoài.
- **Animation per-page (key=pathname) vs shared layout animation**: per-page dễ nhất và phổ biến; shared layout (`layoutId`) tạo chuyển cảnh "liền mạch" giữa 2 trạng thái (menu → trang detail) nhưng khó control hơn và dễ lỗi với list lớn.

## Lỗi thường gặp / Chống chỉ định
- **Guard trong component render sau khi page đã hiện nhiều lần** → flash nội dung trước /403. Fix: chuyển guard nặng lên `loader`; **không** nhét guard vào effect trễ.
- **`mode="wait"` giữ animation quá lâu** (>0.4s) → user cảm giác route "đơ". Fix: giữ 0.15–0.25s, hoặc giảm thời lượng exit.
- **Quên `prefers-reduced-motion`** → người dùng nhạy cảm bị chóng mặt bởi slide/parallax. Fix: dùng `useReducedMotion()` và bọc điều kiện cho `initial`/`animate`/`exit`.
- **Lưu roles vào localStorage client-side** — ai cũng sửa được; chỉ là guard UX, không phải bảo mật. Chống chỉ định dùng làm checkpoint truy cập dữ liệu thật: bắt buộc xác thực lại phía server/loader.
- **2 guard cùng cấp trong route tree viết ngược** (RequireRole trong RequireAuth) → log trùng hay render nhầm nhánh 403 cho trang cần login. Fix: tách rõ nhánh login/auth/admin.

## Câu hỏi thường gặp
- **Guard bằng loader hay component?** Loader chặn trước render (không flash, chạy được cả SSR); component guard đơn giản và tức thì với state client. Dùng cả hai ở hai tầng.
- **Tại sao animation không chạy?** Thường do `key` trên `motion.div` không đổi (dùng pathname), hoặc thiếu `AnimatePresence`, hoặc `Outlet` render ngoài `motion.div`.
- **localStorage roles có an toàn không?** Không — chỉ là guard UX; mọi kiểm tra quyền thật phải ở server/loader để không lộ dữ liệu.
- **AnimatePresence có làm chậm route?** `mode="wait"` cộng thêm thời gian exit vào mỗi lần điều hướng; giữ ngắn (0.15–0.25s) để không cảm giác chậm.
- **Có cần animation cho mọi route?** Không — route nặng/danh sách lớn nên để chuyển cảnh tối giản; animation hợp với chuyển giữa các "màn hình" độc lập.

## Ghi chú 2026
- React Router v7 gộp `react-router-dom` vào `react-router`; loader/action + `route.lazy` là mặc định cho data router.
- Motion (motion.dev) là tên mới của framer-motion; import từ `motion/react`.
- Ưu tiên test guard bằng Vitest + `createMemoryRouter` để mô phỏng điều hướng không cần browser.

## Best practices / Mẹo
- Đặt `RequireAuth` ở route `layout` cha, `RequireRole` ở từng route con — một chỗ cho "cần đăng nhập", chi tiết cho "cần role".
- Lưu user/roles vào Context hoặc Zustand (lấy từ `/api/me` một lần), không parse localStorage trong từng component.
- Animation trang: luôn kết hợp với **code-splitting** (bài 3-code-splitting) để page mới "vào" không bị chờ tải chunk giữa anim.
- Thêm fallback `Navigate to="/404"` cho unknown path; test cả nhánh `/403` và `/login` bằng unit test route config.

## Bài tập nhỏ
Xây route tree: `/` công khai, `/admin` (RequireRole admin), `/profile` (RequireAuth). Đặt `adminLoader` kiểm tra role và redirect nếu không đủ. Bọc tất cả bằng `AnimatedOutlet` với fade 0.15s và tôn trọng reduced motion. Đăng nhập với user "viewer" → kiểm tra: vào /admin tự về /403, không flash, Back không quay lại /admin.

## Reference
- [React Router — Loaders](https://reactrouter.com/how-to/data-loading)
- [React Router — Navigate](https://reactrouter.com/api/routes/navigate)
- [Motion — AnimatePresence](https://motion.dev/docs/react-animate-presence)
- [Motion — useReducedMotion](https://motion.dev/docs/react-reduced-motion)