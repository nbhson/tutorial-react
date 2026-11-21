// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
// Bài tập tutor giao (chủ đề: useEffect deps):
// 👉 Sửa component dưới để interval không tạo mới mỗi lần render
//    nhưng vẫn log đúng `step` mới nhất. Không xem đáp án vội!
import { useEffect, useState } from 'react';

export function Stepper() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Mỗi lần step đổi, effect chạy lại: dọn interval cũ, tạo interval mới — tốn + giật
    // Vấn đề: deps [step] khiến setInterval tạo lại mỗi lần bấm; muốn 1 interval duy nhất mà vẫn thấy step mới
    const id = setInterval(() => console.log('step:', step), 1000); // closure giữ step cũ của lần effect đó
    return () => clearInterval(id); // dọn interval cũ mỗi lần effect chạy lại — đúng nhưng chưa đủ (vẫn tạo mới)
  }, [step]); // ❓ tutor hỏi: deps [step] gây vấn đề gì? sửa sao? (gợi ý: ref giữ mới nhất / functional update)

  return <button onClick={() => setStep((s) => s + 1)}>Step: {step}</button>;
}

// Đáp án (tutor hé sau 3 gợi ý — learner không đọc trước):
// Cách 1: ref giữ step mới nhất, effect deps [] (1 interval duy nhất)
// const stepRef = useRef(step); stepRef.current = step;
// useEffect(() => { const id = setInterval(() => console.log('step:', stepRef.current), 1000); return () => clearInterval(id); }, []);
