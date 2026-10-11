// example.tsx — DAY 15: clock + title theo userId
import { useEffect, useState } from "react";

export default function App({ userId = "1" }: { userId?: string }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.title = `User ${userId} — ${now.toLocaleTimeString("vi-VN")}`;
  }, [userId, now]);

  return <p>Đồng hồ: {now.toLocaleTimeString("vi-VN")}</p>;
}
