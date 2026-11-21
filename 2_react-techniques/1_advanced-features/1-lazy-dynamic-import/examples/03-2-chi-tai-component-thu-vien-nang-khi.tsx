// ✅ ĐÚNG: chunk chart chỉ bắt đầu tải khi user bấm nút
const [show, setShow] = useState(false);
<button onClick={() => setShow(true)}>Mở biểu đồ</button>
{show && (
  <Suspense fallback={<p>Đang tải biểu đồ…</p>}>
    <HeavyChart />
  </Suspense>
)}
