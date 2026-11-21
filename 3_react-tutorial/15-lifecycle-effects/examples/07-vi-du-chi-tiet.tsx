// example.tsx — DAY 15: clock + title + useEffectEvent + derived (khớp README)
// Mục đích: effect chỉ cho hệ thống ngoài (timer/DOM) — data tính trong render.
import { useEffect, useEffectEvent, useState } from "react"; // (1) Effect đồng bộ ngoài, EffectEvent đọc mới nhất không thêm deps

export default function App({ userId = "1" }: { userId?: string }) {
  const [now, setNow] = useState(() => new Date()); // (2) Lazy init Date — chỉ tạo 1 lần mount, không mỗi render
  const [first, setFirst] = useState("Son"); // (3) Demo derived: first/last đổi thì fullName tính trong render (không effect)
  const [last, setLast] = useState("Nguyen");

  // (4) Effect #1 — ngOnInit + ngOnDestroy: timer là hệ thống ngoài, chạy sau paint, cleanup khi unmount.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000); // functional set, không cần deps now
    return () => clearInterval(id); // cleanup đối xứng — StrictMode dev setup->cleanup->setup lộ thiếu là 2 timer
  }, []); // deps [] = 1 lần sau mount

  // (5) Effect #2 — ngOnChanges cho [userId, now]: DOM ngoài (document.title) đồng bộ sau mỗi render đổi.
  // Không cleanup vì gán title idempotent (lần sau ghi đè, không cần gỡ).
  useEffect(() => {
    document.title = `User ${userId} — ${now.toLocaleTimeString("vi-VN")}`;
  }, [userId, now]); // thiếu userId/now là stale (title cũ); thừa object mới mỗi render là loop

  // (6) useEffectEvent: handler đọc first mới nhất mà effect [roomId] không cần liệt kê — thay eslint-disable.
  const onConnected = useEffectEvent(() => {
    console.log("Connected, tên hiện tại:", first, last); // luôn mới nhất dù effect không deps first/last
  });
  useEffect(() => {
    onConnected(); // deps chỉ [] demo — thật là connect(roomId) + deps [roomId]
  }, []); // onConnected KHÔNG nằm trong deps (quy tắc EffectEvent)

  // (7) Derived trong render — KHÔNG effect: tổng/filter/tên đầy đủ tính trực tiếp, không thêm vòng render.
  const fullName = `${first} ${last}`; // ✅ đúng; ❌ useEffect(() => setFullName(...), [first, last]) là thừa 1 vòng + dễ loop

  return (
    <>
      <p>Đồng hồ: {now.toLocaleTimeString("vi-VN")}</p>
      <p>User: {userId} — Tên: {fullName}</p>
      <input value={first} onChange={(e) => setFirst(e.target.value)} aria-label="Tên" />
      <input value={last} onChange={(e) => setLast(e.target.value)} aria-label="Họ" />
    </>
  );
}
