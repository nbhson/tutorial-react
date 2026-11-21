// 1) Actions + form: <form action> thay boilerplate onSubmit + useState pending
const [state, formAction, isPending] = useActionState(action, initial);

// 2) Optimistic UI: hiện ngay, action lỗi → tự rollback
const [optimistic, addOptimistic] = useOptimistic(state, updater);

// 3) use(): đọc Promise (suspend + Suspense) hoặc Context, gọi được TRONG if/vòng lặp
const data = use(userPromise);

// 4) ref as prop: function component nhận ref bình thường — bỏ forwardRef
function Input({ ref, ...p }: { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...p} />; // NHỚ truyền ref xuống element
}

// 5) Document Metadata: <title>/<meta> hoist lên <head>, dedupe
<article><title>Trang A</title><meta name="description" content="..." /></article>

// 6) Context-as-provider (gọn hơn, vẫn chạy song song)
<ThemeContext value="dark">{children}</ThemeContext>
