// ✅ ĐÚNG: giữ UI cũ + badge nhẹ, không chặn thao tác
const [isPending, startTransition] = useTransition();
<button onClick={() => startTransition(() => setTab('reports'))}>Báo cáo</button>
{isPending && <p>Đang chuyển…</p>} {/* báo nhẹ, tab cũ vẫn bấm được */}
