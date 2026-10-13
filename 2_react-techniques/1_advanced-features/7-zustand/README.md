# Zustand — Mini-track chi tiết

> Nguồn: https://zustand.docs.pmnd.rs/
> Đọc trước: [bài 3](../3-store-zustand-tanstack-query/README.md) (chia client/server state) và
> [DAY 8](../../../3_react-tutorial/8-external-store/README.md) (nguyên lý external store + selector).

## Mục tiêu track
- Hiểu Zustand từ lõi (store + subscribe + selector) đến prod (async, middleware, tổ chức slice).
- Cuối track viết được store đúng chuẩn: selector nhỏ, persist có chọn lọc, tách slice theo domain.

## Bản đồ khái niệm

| # | Thư mục | Khái niệm | Khi nào dùng |
|---|---|---|---|
| 1 | [1-create-selectors/](1-create-selectors/README.md) | `create`, selector, `Object.is`, `useShallow`, đọc ngoài React | Mọi store — nền bắt buộc |
| 2 | [2-async-actions/](2-async-actions/README.md) | Action async, cờ loading/error, optimistic | Gọi API nhẹ trong store (nặng thì Query) |
| 3 | [3-middleware-persist/](3-middleware-persist/README.md) | `persist` + `partialize`/`migrate`, `devtools`, `immer` | Giữ state qua reload, debug |
| 4 | [4-slices-pattern/](4-slices-pattern/README.md) | Tách slice theo domain, gom store, chia file | Store phình >1 domain |

## Thứ tự đọc gợi ý

```
1 (selector) → 2 (async) → 3 (middleware) → 4 (tổ chức)
```

Lý do: `1` là nền — sai selector là re-render thừa cả track; `2` thêm async lên nền đó;
`3` bọc ngoài bằng middleware; `4` refactor khi store lớn (đọc khi cần, không cần ngay).

## Quy ước chung cả track
- Component luôn đọc qua **selector nhỏ** — không `useStore()` trần.
- Server data để Query lo (bài 3) — Zustand giữ client state + kết quả đã xử lý.
- Không lưu derived data — tính bằng selector, tránh lệch.
- Đặt tên action rõ nghĩa (`addItem`, không `setX`) — DevTools log đọc được.

## Reference
- [Zustand](https://zustand.docs.pmnd.rs/) · [Persist](https://zustand.docs.pmnd.rs/middlewares/persist)
