// Bài tập mẫu tutor giao cho learner (chủ đề: useEffect deps):
// 👉 Sửa component dưới để interval không tạo mới mỗi lần render
//    nhưng vẫn log đúng `step` mới nhất. Không xem đáp án vội!
import { useEffect, useState } from 'react';

export function Stepper() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const id = setInterval(() => console.log('step:', step), 1000);
    return () => clearInterval(id);
  }, [step]); // ❓ tutor hỏi: deps này gây vấn đề gì? sửa sao?

  return <button onClick={() => setStep((s) => s + 1)}>Step: {step}</button>;
}
