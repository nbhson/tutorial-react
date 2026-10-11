# AI Tutor học React

> Nguồn: tương đương `angular.dev/ai/ai-tutor` (tool `ai_tutor`)

## Mục tiêu
- Hiểu mô hình AI Tutor: agent dạy theo curriculum + quiz, gợi ý theo kiểu Socratic thay vì đưa đáp án.
- Chấm code learner bằng test tự động + checklist, đưa feedback ưu tiên.
- Lưu tiến độ học để buổi sau tiếp tục đúng điểm yếu.

## Tổng quan
- Angular có tool `ai_tutor` trong docs; React không có chính thức — ta xây tutor là **agent + curriculum + tool** (đọc repo, chạy test).
- Vấn đề: người học dễ nhận đáp án AI ngay, không tiến bộ; hoặc AI dạy tràn lan, không theo lộ trình.
- Giải pháp: prompt Socratic (hỏi trước, đáp án sau cùng), curriculum bám repo này, chấm tự động, lưu `learner-progress.md`.
- Áp dụng cho tự học React 19, onboarding dev mới, hoặc lớp nội bộ có lộ trình chuẩn.

## Khái niệm cốt lõi
- **Socratic tutoring**: tutor hỏi gợi mở/đặt câu hỏi dẫn dắt, giới hạn số gợi ý (vd tối đa 3) trước khi hé lộ đáp án. Mục tiêu là learner tự suy ra.
- **Curriculum có cấu trúc**: JSX → hooks → effects → performance → patterns; mỗi chặng có quiz + bài tập lấy từ chính thư mục bài học (nhóm 1–8 trong repo).
- **Chấm tự động**: chạy `vitest` cho bài tập; đọc kết quả, chỉ ra tối đa vài lỗi quan trọng nhất thay vì liệt kê toàn bộ.
- **Feedback có mục tiêu**: ưu tiên lỗi ảnh hưởng lớn (sai deps, stale closure) trước lỗi style.
- **Progress persistence**: file markdown (level, điểm yếu, việc buổi sau) đóng vai "bộ nhớ" giữa các buổi.

## Luồng hoạt động / Cách áp dụng
1. Nạp system prompt tutor (Socratic, tiếng Việt, không đưa đáp án trước).
2. Đọc `learner-progress.md` để biết chặng hiện tại + điểm yếu.
3. Tutor giới thiệu khái niệm + quiz trắc nghiệm.
4. Giao bài tập trong repo (file `example.tsx` có lỗi cố ý).
5. Learner sửa; agent chạy test/chấm, feedback 3 lỗi quan trọng nhất.
6. Cập nhật `learner-progress.md` + bài buổi sau.

## Ví dụ chi tiết
```text
# System prompt tutor đặt ở đầu session (AGENTS.md / custom instruction)
Bạn là tutor React 19 dạy theo kiểu Socratic. Quy tắc bắt buộc:
1. KHÔNG đưa code đáp án ngay — hỏi gợi ý trước (tối đa 3 gợi ý).
2. Mỗi khái niệm kèm 1 quiz trắc nghiệm + 1 bài tập lấy từ repo này.
3. Khi chấm: chạy test (vitest), chỉ ra ĐÚNG 3 lỗi quan trọng nhất + cách sửa.
4. Giải thích bằng tiếng Việt; code comment tiếng Việt ngắn gọn.
5. Kết thúc buổi: cập nhật learner-progress.md (level, điểm yếu, bài sau).
```

### Curriculum gợi ý (bám repo này)
| Chặng | Chủ đề | Tài liệu/nhóm bài | Tiêu chí qua chặng |
|---|---|---|---|
| 1 | JSX, props, list, event | `react.dev/learn` | Viết được form controlled, render list có `key` |
| 2 | State & hooks cơ bản | `1_advanced-features` | `useState`/`useReducer` đúng, không mutate |
| 3 | Effects & lifecycle | `1_advanced-features/4-web-worker` | Cleanup đúng, deps đầy đủ |
| 4 | Performance | `3_performance-optimization` | Đọc Profiler, dùng `memo`/`useDeferredValue` |
| 5 | Kiến trúc & patterns | `2_architecture-patterns` | Tách feature, tránh prop drilling |
| 6 | Bảo mật + best practices | `4_security-config`, `8_best-practices` | a11y pass, boundary đúng |

```tsx
// example.tsx — bài tập tutor giao (chủ đề: useEffect deps)
// 👉 Sửa component dưới để interval không tạo mới mỗi lần render
//    nhưng vẫn log đúng `step` mới nhất. Không xem đáp án vội!
import { useEffect, useState } from 'react';

export function Stepper() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const id = setInterval(() => console.log('step:', step), 1000);
    return () => clearInterval(id); // dọn interval cũ mỗi lần effect chạy lại
  }, [step]); // ❓ tutor hỏi: deps [step] gây vấn đề gì? sửa sao?

  return <button onClick={() => setStep((s) => s + 1)}>Step: {step}</button>;
}
```

```md
<!-- learner-progress.md — bộ nhớ giữa các buổi -->
- Level: hooks cơ bản ✓ | effects ~ | memo ✗
- Điểm yếu: deps array của useEffect, stale closure, cleanup.
- Đã hiểu: controlled input, key trong list.
- Buổi sau: ôn useEffect cleanup + làm bài 1_advanced-features/4-web-worker.
```

```text
# Ví dụ lượt tutor (Socratic) khi learner hỏi
Learner: "Vì sao interval bị tạo lại nhiều lần?"
Tutor: "Hay lắm — trước khi trả lời, em thử đoán: mỗi lần `step` đổi thì useEffect
        chạy lại mấy lần? Và `setInterval` cũ có bị dọn không? (gợi ý 1/3)"
```

## Giải thích từng phần
- Quy tắc 1 (không đáp án ngay): biến agent từ "cỗ máy giải bài" thành "người dẫn dắt".
- Quy tắc 3 (đúng 3 lỗi): tránh learner bị quá tải, tập trung cái quan trọng.
- `example.tsx`: bài tập deps `[step]` — interval bị tạo lại mỗi lần step đổi; đáp án dùng `useRef`/functional update để giữ `setInterval` một lần.
- `learner-progress.md`: ghi trạng thái để tutor không dạy lại phần đã hiểu.

### Tiêu chí chấm điểm (rubric) gợi ý
```text
1. Đúng chức năng  (test xanh)          — 40%
2. Compiler-safe   (không mutate, deps) — 25%
3. a11y            (semantic, label)    — 15%
4. Chất lượng code (đặt tên, tách hook) — 10%
5. Test           (có test hành vi)     — 10%
```
Tutor cập nhật điểm từng mục vào `learner-progress.md`; mục nào < 50% → đưa vào bài ôn buổi sau.

## Lỗi thường gặp / Chống chỉ định
- **Tutor đưa đáp án ngay lượt đầu**: learner thụ động → bắt buộc hỏi gợi ý trước, giới hạn số gợi ý.
- **Không lưu tiến độ**: mỗi buổi dạy lại từ đầu → lưu file và đọc lại đầu buổi.
- **Chấm bài bằng cảm nhận, không chạy test**: feedback sai/chủ quan → luôn chạy `vitest` trước khi nhận xét.
- **Liệt kê mọi lỗi**: learner nản → giới hạn 3 lỗi quan trọng + lộ trình sửa.
- **Curriculum lệch repo**: bài tập không tồn tại → gắn bài tập vào thư mục thật (`1_advanced-features/...`).

## Best practices / Mẹo
- Chia chặng rõ (mỗi chặng 1 nhóm chủ đề) với tiêu chí "qua chặng" cụ thể.
- Quiz ngắn, đáp án có giải thích — củng cố ngay.
- Khuyến khích learner viết dự đoán trước khi chạy code.
- Định kỳ "thi lại" điểm yếu cũ để chống quên.
- Kết hợp agent skills (bài 2) để tutor tự chuẩn hóa cách chấm theo repo.

## Bài tập nhỏ
Tự đóng vai learner: sửa `Stepper` để `setInterval` chỉ tạo **một lần**, vẫn log `step` mới nhất (gợi ý: `useRef` giữ giá trị mới, hoặc functional update). Viết test Vitest dùng fake timers kiểm tra interval không bị tạo lại khi step đổi.

## Reference
- [React Learn](https://react.dev/learn)
- [Angular AI Tutor (tham khảo)](https://angular.dev/ai/ai-tutor)
- [Vitest — fake timers](https://vitest.dev/api/vi.html#vi-usefaketimers)
- [react.dev — useEffect](https://react.dev/reference/react/useEffect)