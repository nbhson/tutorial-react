# Chống Prop-Drilling

> Nguồn: https://react.dev/learn/passing-props-to-a-component — https://react.dev/reference/react/createContext

## Mục tiêu
- Nhận diện và loại bỏ **prop-drilling**: truyền props qua 4–5 tầng trung gian không sử dụng.
- Ưu tiên đúng giải pháp theo đặc tính dữ liệu: **composition → context → store**.
- Giữ cây component phẳng hơn, tầng giữa không phải "đứng bên" cho props nhà người khác.

## Tổng quan
Prop-drilling (khoan props) là khi data đi qua nhiều tầng chỉ để đến 1 component sâu — mỗi tầng trung gian phải khai báo props dù không dùng, sửa tên prop phải sửa 5 chỗ, và cây component ngày càng "bẩn". Giải pháp không phải lúc nào cũng là context/store: chuẩn 2026 là **thử theo thứ tự**:

1. **Composition** — không truyền data, truyền *component đã lắp sẵn* (`children`/slots). Rẻ nhất, không đổi API, React ưa thích.
2. **Context** — dữ liệu ít đổi, nhiều nơi đọc (theme, locale, auth user).
3. **Store (Zustand)** — state đổi thường xuyên và nhiều nơi ghi thay đổi (cart, filters).

Áp dụng khi thấy "props cầu nối" lặp lại, hoặc cây chìm 4+ tầng cho một mẩu dữ liệu.

## Khái niệm cốt lõi
- **Composition pattern**: thay vì `<Page user={u}/>` và fid dắt `user` qua `Sidebar→Header→Avatar`, Page đã tự lắp `<Sidebar header={<Avatar user={u}/>}>`. Component trung gian không cần biết `user` — chỉ nhận `children: ReactNode`/slot đã sẵn sàng.
- **Context**: `createContext(default)` + `Provider` ở trên + `useContext` ở nơi cần. Data ít đổi thì re-render hầu như không xảy ra dù cây rộng. Nhắc nhở: **mọi consumer của context đều re-render khi value đổi** — vì vậy chớ nhét state đổi liên tục vào một context chung.
- **Zustand**: selector-based — component *chỉ* re-render khi slice nó chọn đổi (`useStore(s => s.cart)`). Phù hợp state "nóng" (thay đổi thường xuyên, nhiều writer), kết hợp `persist` nếu cần.
- **Mẹo Context splitting**: tách `ThemeCtx`, `AuthCtx`, `SettingsCtx` để consumer chỉ đọc cái mình cần; hoặc tách provider thành 2 (giá trị ổn định / hay đổi) để không kéo re-render cả cây.
- **`useReducer` + Context** cho state domain trung bình: context giữ `state` + `dispatch`, consumer chỉ `useSelector`-like qua hook con — nửa đường giữa context và store đầy đủ.

## Luồng hoạt động / Cách áp dụng
1. Phát hiện "drill": grep props cùng tên xuất hiện > 3 tầng, tầng giữa không dùng.
2. Hỏi: data có thể "lắp sẵn" từ trên không? → composition (children/slots) ngay, không cần cơ chế khác.
3. Nếu nhiều nơi đọc và ít đổi → Context: bọc Provider quanh vùng dùng, consumer gọi `useX()`.
4. Nếu thay đổi thường xuyên & nhiều writer → Zustand; gom state theo slice, selector hẹp.
5. Đo re-render bằng React DevTools Profiler trước/sau khi chọn giải pháp.

## Ví dụ chi tiết
```tsx
import { createContext, useContext, type ReactNode } from 'react';

// ---------- Context: theme dùng chung, ít đổi ----------
type Theme = 'light' | 'dark';
const ThemeCtx = createContext<Theme>('light'); // default ngoài Provider
export const useTheme = () => useContext(ThemeCtx); // hook tiện đọc

// ---------- Composition: tầng giữa không cần props ----------
// Card nhận children — không biết card có gì, không biết theme
function Card({ children }: { children: ReactNode }) {
  return <section className="card">{children}</section>;
}

// CardTitle đọc theme TRỰC TIẾP từ context
function CardTitle({ text }: { text: string }) {
  const theme = useTheme();        // không qua trung gian Card
  return <h2 data-theme={theme}>{text}</h2>;
}

export function Page() {
  return (
    <ThemeCtx.Provider value="dark"> {/* cung cấp cho cả cây con */}
      <Card>
        {/* truyền "thành phẩm" xuống, không truyền data thô */}
        <CardTitle text="Không cần truyền props qua Card" />
      </Card>
    </ThemeCtx.Provider>
  );
}
```

## Giải thích từng phần
- `createContext<Theme>('light')` — dùng default 'light' cho trường hợp ngoài Provider (đã có giá trị, không vỡ app khi test lẻ component).
- `useTheme()` chỉ là shortcut `useContext(ThemeCtx)` — tiện và ít gõ; đặt đúng chỗ (cạnh file context) để dễ refactor.
- `Card({ children }: { children: ReactNode })` — Card **không** khai báo `theme` prop; nó là "ống dẫn" vô tri, đúng tinh thần composition: tầng giữa vô hình với data.
- `data-theme={theme}` để CSS attribute-selector styling — ví dụ context được UI tiêu thụ mà không cần truyền theme bằng class.
- Provider đặt càng cao càng rộng; hãy đặt **đúng tầng cần** (gần nơi dùng nhất) để giới hạn phạm vi re-render.

## So sánh (nếu có)
- **Composition vs Context vs Store**: Composition — đơn giản nhất, miễn phí, không cần cơ chế; Context — global-ish, ít đổi, nhưng value mới ⇒ cả cây consumer re-render; Store — trả re-render "chọn lọc" (selector), hi sinh một chút "nhân hóa" khai báo. Chọn theo bảng: ít nơi dùng & lắp sẵn được → composition; nhiều nơi đọc, ít đổi → context; đổi nóng & nhiều writer → store.
- **Context vs Zustand**: Context dùng cho "provider tree" (theme, locale) — gần với React gốc, không cần dependency; Zustand dùng cho global mutable state tần suất cao — thêm dependency nhưng kiểm soát re-render tốt hơn và có `persist`/devtools sẵn.
- **Drilling còn lại vs context cho mọi thứ**: context cho mọi prop là "chuyển bệnh" — mất khả năng infer props, khó tìm ai đọc gì. Giữ drill cho thành phần chỉ cách 1–2 tầng.

## Lỗi thường gặp / Chống chỉ định
- **Value context là object/array literal** (`value={{ theme, setTheme }}`) → mỗi render của provider tạo reference mới, kéo re-render mọi consumer dù giá trị không đổi. Fix: `useMemo` value hoặc tách provider; context (đặc biệt giá trị ổn định) dùng `children` memo.
- **Nhét toàn bộ state vào 1 context "app-wide"** → đổi 1 field re-render cả app. Fix: tách theo domain (ThemeCtx, AuthCtx, CartStore); store với selector cho state nóng.
- **Đưa mọi props lên context ngay khi tầng giữa chỉ "say hiện diện"** → mất kiểm soát scope. Fix: bắt đầu bằng composition; context chỉ khi ≥ 3 nơi đọc xa nhau.
- **Provider đặt sai tầng** (quá cao tạo re-render lan rộng; quá thấp consumer ngoài phạm vi lỗi "null") → đo Profiler và kiểm tra `useContext` giữa vòng cung.
- **Chống chỉ định**: component chỉ cần data ở 1–2 tầng dưới — cứ drill & chấp nhận (thay đổi "kiến trúc" sẽ là over-engineering); context cho dữ liệu tỷ lệ thay đổi ms (game/cursor) khác — phải qua store/useSyncExternalStore.

## Câu hỏi thường gặp
- **Bao nhiêu tầng thì gọi là drilling?** Quy ước thực dụng: 1–2 tầng bình thường, 3+ cân nhắc composition, 4+ là tín hiệu context/store.
- **Context có làm app chậm không?** Chỉ khi value đổi thường xuyên hoặc provider đặt quá cao; value ít đổi + đúng phạm vi thì re-render không đáng kể.
- **Khi nào dùng store thay context?** Khi state đổi "nóng" (gõ phím, kéo thả, cart cập nhật liên tục) hoặc cần selector để giới hạn re-render.
- **Có nên bỏ hết prop-drilling?** Không. Drill 1–2 tầng rõ ràng, tường minh, dễ đọc hơn việc "ẩn" mọi thứ vào context.
- **Context value là hàm có sao không?** Cần `useCallback`/ổn định tham chiếu, nếu không consumer re-render mỗi lần provider render.

## Ghi chú 2026
- React 19 cho phép render `<Context>` trực tiếp thay `<Context.Provider>`; cú pháp mới gọn hơn.
- Zustand v5 + selector (và `useShallow`) là cách "context cho state nóng" phổ biến nhất hiện nay.
- React Compiler tự memo hóa children/provider value khi có thể — giảm bẫy re-render do object literal.

## Best practices / Mẹo
- Đặt rule cá nhân: *"2 cấp drill là bình thường; 3+ là đẹp ra composition; 4+ là tín hiệu context/store."*
- Composition nên là vũ khí đầu tay: `children`, `header`, `footer`, `renderItem` slots — React khuyến khích, dễ đọc, không cần thư viện.
- Đặt hook `useTheme()`/`useAuth()` cạnh `createContext` để import gọn và "self-documenting".
- Dùng React DevTools Profiler: bôi đỏ rõ component nào re-render do context — quyết định dựa trên số liệu, không phải cảm tính.
- Context + `useReducer` cho domain state tầm trung giữ code gọn (auth, cart) trước khi cần đến store nặng.
- Đặt Provider gần nơi dùng nhất để giới hạn phạm vi re-render khi value đổi.
- Tách context thành "state" và "actions" — action ổn định tham chiếu nên không gây re-render consumer.
- Dùng `useSyncExternalStore` cho store ngoài React khi cần tinh chỉnh subscription thủ công.
- Kiểm tra "context flash" do default value bị dùng nhầm khi thứ tự Provider sai.
- Tạo hook con (`useUser`) thay vì export Context thô để ép dùng đúng và dễ refactor.
- Đo re-render trước/sau khi chuyển sang store để chứng minh lợi ích bằng số liệu.
- Với composition, đặt tên slot rõ nghĩa (`header`, `footer`, `actions`) để đọc dễ.
- Đừng context hoá data chỉ dùng ở một nhánh — truyền thẳng đơn giản hơn.
- Kiểm tra SSR: context value phải ổn định để tránh mismatch hydration.
- Với data chỉ đọc, ưu tiên composition truyền `children` hơn là context.
- Ghi chú lý do chọn store thay context trong PR, dựa trên số đo Profiler.

## Bài tập nhỏ
App có cây: `App → Toolbar → Sidebar → Filters → SegmentPicker`. `SegmentPicker` cần `activeSegment` (ốm đổi nhanh) và `locale` (ít đổi). Hiện 2 thứ đều drill qua 3 tầng. Refactor: (1) đưa `activeSegment` vào Zustand `useFilters(s => s.active)`; (2) đưa `locale` vào `LocaleCtx` đặt ở App. Dùng Profiler: bấm nút đổi segment — kiểm tra Toolbar/Sidebar/Filters **không** re-render. Liệt kê: file nào được sửa, file nào trở nên sạch.

## Reference
- [Passing Props (React)](https://react.dev/learn/passing-props-to-a-component)
- [createContext](https://react.dev/reference/react/createContext)
- [Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [Zustand — selectors](https://zustand.docs.pmnd.rs/guides/selectors)