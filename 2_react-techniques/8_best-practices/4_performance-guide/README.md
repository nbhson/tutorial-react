# Performance Guide

> Nguồn: https://react.dev/learn/render-and-commit — https://web.dev/vitals/

App chạy "cảm giác chậm" nhưng không biết chậm ở đâu? Bài này dạy nguyên tắc số 1 của hiệu năng: **đo trước khi sửa** — rồi mới tới các vũng tối ưu kinh điển (re-render, bundle, assets, data).

## Mục tiêu

Mục này nêu 3 mục tiêu: đo lường, giảm re-render, và tối ưu tải. Đọc để có bản đồ của cả bài.

### 1. Đo trước khi tối ưu: Core Web Vitals (LCP, INP, CLS) + React Profiler

**Vì sao:** tối ưu mù (đoán "chắc do memo") hay sai chỗ (memo chỗ không nóng, bỏ qua ảnh 2MB). Quy trình đúng: đo → nghi ngờ → xác nhận → sửa → đo lại. LCP (< 2.5s, phần tử lớn nhất hiện) cho First Load; INP (< 200ms, phản hồi tương tác) cho gõ/bấm; CLS (< 0.1, layout nhảy) cho ổn định. Profiler (render count/duration từng component) + Performance long task + Lighthouse là 3 thước — chưa có số thì chưa sửa gì.

**Ngưỡng nhớ:** LCP < 2.5s tốt; INP < 200ms tốt (React 19 nhắm); CLS < 0.1 tốt. Vượt là backlog theo thứ tự LCP > INP > CLS (mở không được thì tương tác hay cũng vô nghĩa).

### 2. Giảm re-render đúng cách: Compiler, `memo`, state gần nơi dùng, `useDeferredValue`

**Vì sao 4 thứ này:** Compiler memo tự động (viết trần mà nhanh); `memo` chặn tường minh ngoài vùng compiler; state gần nơi dùng cắt gốc (state root là cả cây vẽ); `deferred` giữ gõ nhạy khi list nặng. Thiếu một là một chiều yếu: Compiler không giảm node DOM, memo không giảm lag gõ, deferred không giảm render thừa.

### 3. Tối ưu bundle (lazy, manualChunks) và assets (ảnh, font) để mở nhanh

**Vì sao:** render nhanh mà bundle 3MB thì LCP vẫn 4s (chưa tải xong lấy gì render). Lazy route + vendor riêng đưa critical < 200KB gzip. Ảnh `avif/webp` + `loading="lazy"` + cỡ trước (chống CLS) + font `swap` + preload — assets hay bị bỏ quên mà chiếm nửa LCP trang media.

> **Tóm gọn 1 câu:** Ba mục tiêu: có số trước khi sửa (CWV + Profiler), render ít nhờ 4 công cụ, và tải nhanh nhờ bundle + assets gọn.

## Tổng quan

Mục này phác vòng lặp hiệu năng và lúc nào nên áp dụng. Đọc để có tư duy đúng: không số là không sửa.

- Hiệu năng đi từ **đo → nghi ngờ → xác nhận → sửa → đo lại**, không tối ưu bừa. Mỗi sửa phải có số trước/sau (Profiler duration, LCP, bundle KB) — không số là cảm giác.
- React hiện đại nhắm INP < 200ms, LCP < 2.5s, CLS < 0.1. Với React 19 + Compiler, bớt memo tay; tập trung render ít + bundle nhỏ + assets gọn.
- Áp dụng khi app lớn dần, devtools-perf (bài 6/4) chỉ ra render thừa, hoặc trước release quan trọng. App nhỏ đo nhanh một vòng Lighthouse là đủ — đừng over-engineer.

Tối ưu không đo giống **uống thuốc không khám**: có khi khỏi bệnh thật, có khi uống nhầm thuốc — mà vẫn tốn tiền. Profiler và Lighthouse là máy chụp X-quang của app.

> **Tóm gọn 1 câu:** Hiệu năng là vòng lặp đo → sửa → đo lại, mỗi thay đổi phải có số trước/sau — app nhỏ thì đừng chữa quá bệnh.

## Khái niệm cốt lõi

Mục này định nghĩa 7 khái niệm theo trật tự từ cơ chế (render & commit) đến từng hướng tối ưu. Đọc tuần tự — hiểu khái niệm 1 là hiểu các khái niệm sau.

### 1. Render & Commit — tính toán (pure) rồi mới chạm DOM

Render = gọi component tính JSX (phải thuần để so sánh); Commit = cập nhật DOM thật. Parent re-render kéo con nếu không memo (con "bị vẽ theo" dù props giống). Hiểu để biết Profiler đỏ ở đâu là render thừa (tính lại vô ích) chứ không phải DOM chậm. Ví von: render là **vẽ phác trên giấy nháp**, commit là **tô lên tranh thật** — giấy nháp rẻ, tranh đắt; mọi kỹ thuật tối ưu đều nhằm vẽ lại ít hơn.

### 2. React Compiler — memo tự động cho code sạch; `memo` tay cho ngoài vùng

Code sạch (không mutate — bài 8/1) thì compiler lo rộng rãi miễn phí. Ngoài vùng (lib cũ, skip) + tính đắt + list lớn thì `memo`/`useMemo` tường minh kèm comment lý do. Đừng tô điểm memo tay khi compiler đã xanh.

### 3. State gần nơi dùng — phạm vi render theo vị trí state

State ở root: đổi là cả cây vẽ. Hạ xuống List: đổi chỉ List vẽ. Colocation (đặt state cạnh nơi đọc) là sửa gốc rẻ nhất — rẻ hơn mọi memo. Nhìn cây mà state nằm quá cao so với nơi đọc là mùi. Giống **công tắc điện**: đặt công tắc ở phòng nào thì bật tắt chỉ ảnh hưởng phòng đó; cứ gom hết công tắc về phòng khách thì mỗi lần bật đèn toilet cả nhà phải đứng dậy.

> 📄 **Code ví dụ:** [`examples/01-3-state-gan-noi-dung-pham-vi-render.tsx`](examples/01-3-state-gan-noi-dung-pham-vi-render.tsx)

### 4. `useDeferredValue`/`useTransition` — input nhạy, nặng hoãn

Gõ nhanh + list 50k: input đọc gốc (urgent), list đọc trễ (non-urgent) — chi tiết xem bài deferred nhóm 3. Không thay virtualization (hoãn thời điểm vs giảm node) — list khổng lồ cần cả hai.

### 5. Bundle — lazy route, vendor riêng, bớt polyfill, visualizer

`React.lazy` + `Suspense` từng route sau login; `manualChunks` vendor nặng riêng; xóa lib không dùng (moment → date-fns là bỏ được cả chunk); visualizer treemap để biết khối nào phình. Critical < 200KB gzip là đích. Hãy hình dung bundle như **vali đi máy bay**: lazy là gói mỗi ngày một túi nhỏ, visualizer là cán cân cân hành lý — cân xong mới biết túi nào thừa.

### 6. Assets — ảnh `avif/webp` + lazy + cỡ trước; font `swap` + preload

Ảnh dưới fold `loading="lazy"` (không tải lúc đầu); `width`/`height` hoặc `aspect-ratio` giữ chỗ (không CLS khi ảnh về); `<picture>` multi-format (avif → webp → jpeg). Font `font-display: swap` (chữ hiện ngay font hệ thống, font đẹp về sau) + `preload` font heading. Ảnh 2MB không nén là LCP 4s dù JS đã tối ưu.

### 7. Data — `staleTime`, pagination/infinite, Query cache

`staleTime` theo tần suất đổi (tĩnh `Infinity`, giá `0` + interval). Tải hết 10k thì pagination/infinite + virtualize — không tải hết rồi render hết. Query dedupe + cache để 2 component chung key chỉ 1 request. Giống **tủ lạnh gia đình**: nấu một lần, cả nhà ăn chung — chứ không mỗi đứa một mâm (dedupe), và đồ ăn cũ còn ngon thì đừng nấu lại (staleTime).

> **Tóm gọn 1 câu:** Bảy khái niệm cho bảy mặt trận: vẽ ít (render/state), tính ít (memo/deferred), tải ít (bundle/assets), và xin ít (data cache).

## Luồng hoạt động / Cách áp dụng

Mục này là quy trình 6 bước của vòng lặp hiệu năng, bắt đầu và kết thúc bằng đo lường. Đi tuần tự — bước 6 chốt việc bằng số liệu trước/sau.

### Bước 1. Đo: Lighthouse (LCP/CLS) + Profiler (re-render) + Performance (long task)

Lighthouse/PageSpeed cho vitals; DevTools Profiler record lúc gõ/chuyển (render count/duration); Performance cho long task đỏ (bài 6/4). Lưu baseline (số + screenshot) vào tài liệu.

### Bước 2. Sửa re-render: Compiler + memo đúng chỗ + hạ state + deferred

Bật compiler, memo chỗ Profiler chỉ (list lớn/đắt), hạ state thừa ở root, deferred cho list theo input. Mỗi sửa đo lại một lần — không sửa dồn 5 thứ rồi đo (không biết cái nào có tác dụng).

### Bước 3. Sửa bundle: lazy route + vendor + xóa lib thừa

Route sau login lazy hết; vendor nặng riêng; lib không dùng xóa. Budget CI (`size-limit`) để tăng là đỏ.

### Bước 4. Sửa assets: nén + lazy + preload + swap

Ảnh dưới fold lazy, cỡ trước, format mới. Font heading preload + swap. Đo LCP trước/sau (assets hay ăn nửa LCP).

### Bước 5. Sửa data: staleTime + phân trang + cache

Tĩnh hiếm đổi `staleTime` dài; realtime `setQueryData` từ socket thay polling; list lớn infinite + virtual. Không `refetchOnWindowFocus` khi không cần (đỡ request thừa).

### Bước 6. Đo lại, lưu trước/sau

LCP/INP/CLS + Profiler + bundle KB. Cải thiện < 10% thì revert (phức tạp không xứng). Ghi vào release note để lần sau có mốc.

> **Tóm gọn 1 câu:** 6 bước của vòng tròn: đo → sửa render → sửa bundle → sửa assets → sửa data → đo lại — cải thiện dưới 10% thì trả hàng (revert).

## Ví dụ chi tiết

Mục này trỏ tới các file ví dụ mirror 1-1. Đọc kèm để thấy từng kỹ thuật thành code thật.

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.tsx`](examples/03-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.html`](examples/04-vi-du-chi-tiet.html)

> **Tóm gọn 1 câu:** Bộ ví dụ hiện thực 3 kỹ thuật chính: deferred + memo + slice cho list lớn, lazy từng route, và HTML chuẩn cho ảnh/font.

## Giải thích từng phần

Mục này bóc từng dòng code trong ví dụ để bạn hiểu cơ chế và cách kiểm chứng. Đọc khi cần chỉnh kỹ thuật theo dữ liệu của mình.

### `useDeferredValue(q)` — input ngay, list hoãn, không block gõ

Gõ 5 phím mà list mới bắt kịp 2 lần — đúng thiết kế (INP thấp). Đảo (input đọc `dq`) là gõ lag — kiểm tra mỗi `value` đang đọc biến nào.

### `useMemo` + `slice(0, 100)` — bớt tính + bớt node

Không memo là render nào cũng filter lại; không slice là render 10k node (deferred không cứu node). 100 đầu đủ cho tìm kiếm nhanh; cần hết thì virtualize + infinite.

### `memo(Item)` — parent vẽ không kéo con không đổi

Mỗi phím parent vẽ, Item giữ `v` bỏ qua. `v` là string (so `Object.is` rẻ) nên memo hiệu quả; object mới mỗi lần thì phải ổn định reference trước.

### `React.lazy` từng route — LCP cải thiện ở route đầu

Critical chỉ shell + route đầu; route nặng tải khi vào. Giữ login/home tĩnh (LCP không chờ network).

### `width/height` + `loading="lazy"` — không CLS + đỡ LCP

Không cỡ: ảnh về muộn đẩy chữ nhảy (CLS cao). Dưới fold mà không lazy: tải lúc đầu, LCP chậm oan.

> **Tóm gọn 1 câu:** Mỗi dòng ví dụ trả lời một câu hỏi hiệu năng: gõ có lag không, tính lại mấy lần, parent có kéo con không, và ảnh/font có cản LCP không.

## Lỗi thường gặp / Chống chỉ định

Mục này liệt kê 5 lỗi tối ưu hay gặp nhất — phần lớn đều là "làm thừa". Đọc để đỡ phức tạp hóa code không đáng.

### 1. Memo bừa/`useCallback` vô nghĩa → phức tạp không nhanh

Chỉ memo sau Profiler xác nhận (count cao + props không đổi). Component nhẹ memo là lỗ (so sánh đắt hơn vẽ).

### 2. `useMemo` cả cây cha deps rộng → vẫn chạy lại

Hạ state xuống gần nơi dùng thay vì memo cả cây. Memo không sửa được state đặt sai chỗ.

### 3. Lazy mọi nơi → request nhỏ tràn lan, TTFB tệ

Lazy route lớn, không lazy icon/component nhỏ (< 20KB). Đếm chunk sau tách (< 50, mỗi ≥ 20KB).

### 4. Quên `width/height` → CLS cao

Luôn cỡ trước (hoặc `aspect-ratio`). Ảnh trong virtual row cũng chừa chỗ để đo đúng.

### 5. Retry/refetch liên tục → tải thừa

`staleTime` hợp lý + tắt `refetchOnWindowFocus` khi không cần. Socket đẩy thì `setQueryData`, không polling 2s.

> **Tóm gọn 1 câu:** Năm lỗi đều là "thuốc quá liều": memo bừa, memo cả cây, lazy mọi nơi, quên cỡ ảnh, refetch liên tục — chữa thừa cũng hại như chữa thiếu.

## Best practices / Mẹo

Mục này gom các nguyên tắc vận hành hiệu năng về một chỗ. Đọc để có checklist ngắn nhớ được khi làm thật.

### Đo trước; LCP > INP > CLS; Compiler + sạch là memo miễn phí; font swap + picture; budget CI

Chưa số chưa sửa. Mở được (LCP) trước, bấm mượt (INP) sau, ổn định (CLS) cuối. Compiler + code sạch (bài 8/1) là memo rộng rãi — đừng tô memo tay. Font `swap` + preload heading; ảnh `<picture>` đa format. `size-limit` trong CI để bundle tăng là đỏ.

> **Tóm gọn 1 câu:** Mẹo gọn: chưa số chưa sửa, ưu tiên theo LCP → INP → CLS, code sạch để Compiler lo memo, và CI là đèn đỏ khi bundle béo lên.

## Bài tập nhỏ

1. `data` 10.000 chuỗi, Profiler record lúc gõ vào `FastFilter` — ghi duration + count bản thô (không memo/deferred).
2. Thêm memo item — đo lại, tính % giảm render.
3. Thêm `useDeferredValue` — đo lại, tính % giảm INP/delay gõ.
4. So 3 bản (thô/memo/memo+deferred): bảng số + kết luận giữ bản nào + vì sao. Kèm Network (bundle) + Lighthouse (LCP) nếu có.

## Reference

- [React — Render and Commit](https://react.dev/learn/render-and-commit)
- [Core Web Vitals (web.dev)](https://web.dev/vitals/)
- [React Compiler](https://react.dev/learn/react-compiler)
- [Web Performance Guide (MDN)](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance)
