# AI Tutor học React

> Nguồn: tương đương `angular.dev/ai/ai-tutor` (tool `ai_tutor`)

## Mục tiêu

### 1. Hiểu mô hình AI Tutor: agent dạy theo curriculum + quiz, gợi ý Socratic thay vì đưa đáp án

**Vì sao:** đáp án ngay tạo learner thụ động (copy mà không hiểu, mai quên). Socratic (hỏi gợi mở, tối đa 3 gợi ý rồi mới hé đáp án) ép learner suy ra — nhớ lâu hơn. Curriculum (JSX → hooks → effects → performance → patterns → bảo mật) chống dạy tràn lan (hôm hooks mai đã animation). Quiz + bài tập từ chính repo (nhóm 1–8) để học gắn code thật, không lý thuyết suông.

**Cơ chế:** system prompt khóa 5 luật (Socratic, quiz + bài/repo, chấm test + 3 lỗi, tiếng Việt + comment Việt, cập nhật progress). Mỗi turn tutor đọc `learner-progress.md` (level, điểm yếu) → dạy tiếp điểm yếu, không dạy lại cái đã hiểu.

### 2. Chấm code learner bằng test tự động + checklist, đưa feedback ưu tiên

**Vì sao:** cảm nhận chủ quan ("code này chưa đẹp") không thuyết phục và hay sai. `vitest` xanh/đỏ là sự thật — tutor đọc kết quả rồi chỉ ra đúng 3 lỗi quan trọng nhất (ảnh hưởng lớn trước: deps sai, stale closure; style sau). Liệt kê mọi lỗi là learner nản — 3 cái + lộ trình sửa là vừa.

### 3. Lưu tiến độ để buổi sau tiếp tục đúng điểm yếu

`learner-progress.md` (level từng chặng ✓/~/✗, điểm yếu, đã hiểu, bài sau) là bộ nhớ giữa buổi. Không lưu là mỗi buổi dạy lại từ đầu. Tutor đọc đầu buổi, ghi cuối buổi —DEF loop khép kín.

## Tổng quan

- Angular có tool `ai_tutor` trong docs; React không chính thức — ta xây tutor là **agent + curriculum + tool** (đọc repo, chạy test, ghi progress).
- Vấn đề kép: learner nhận đáp án ngay thì không tiến bộ; AI dạy tràn lan không lộ trình thì hổng nền.
- Giải pháp: prompt Socratic (hỏi trước, đáp án sau cùng), curriculum bám repo này, chấm tự động (vitest), feedback 3 lỗi lớn nhất, lưu `learner-progress.md`.
- Áp dụng tự học React 19, onboarding dev mới, lớp nội bộ có lộ trình chuẩn. Không thay mentor người ở debug khó — tutor lo nền + thói quen, người lo kiến trúc + trade-off.

## Khái niệm cốt lõi

### 1. Socratic tutoring — hỏi dẫn dắt, giới hạn gợi ý, đáp án sau cùng

```text
# ❌ SAI (tutor dở): đáp án ngay lượt đầu — learner copy, không suy
Learner: "Vì sao interval tạo lại nhiều lần?"
Tutor: "Dùng useRef như sau: ..." (code đầy đủ)

# ✅ ĐÚNG (Socratic): gợi ý 1/3 — ép đoán trước
Tutor: "Hay lắm — trước khi trả lời, em thử đoán: mỗi lần step đổi thì useEffect
chạy lại mấy lần? Và setInterval cũ có bị dọn không? (gợi ý 1/3)"
```

Tối đa 3 gợi ý rồi mới hé đáp án (không để learner kẹt mãi). Mỗi gợi ý thu hẹp dần (câu hỏi → chỉ chỗ → phác thảo). Mục tiêu là learner tự nói ra đáp án.

### 2. Curriculum có cấu trúc — 6 chặng bám repo (giữ bảng gốc + giải thích)

| Chặng | Chủ đề | Tài liệu/nhóm bài | Tiêu chí qua chặng |
|---|---|---|---|
| 1 | JSX, props, list, event | `react.dev/learn` | Form controlled, list có `key` |
| 2 | State & hooks cơ bản | `1_advanced-features` | `useState`/`useReducer` đúng, không mutate |
| 3 | Effects & lifecycle | `1_advanced-features/4-web-worker` | Cleanup đúng, deps đầy đủ |
| 4 | Performance | `3_performance-optimization` | Profiler, `memo`/`useDeferredValue` |
| 5 | Kiến trúc & patterns | `2_architecture-patterns` | Tách feature, tránh drill |
| 6 | Bảo mật + best practices | `4_security-config`, `8_best-practices` | a11y pass, boundary đúng |

Mỗi chặng: khái niệm → quiz trắc nghiệm → bài tập repo → chấm → đạt tiêu chí mới qua (không học vội). Tiêu chí cụ thể (viết được gì, test nào xanh) thay vì "hiểu là qua".

### 3. Chấm tự động — `vitest` trước, nhận xét sau

Luôn chạy test trước khi khen/chê. Đọc failure (expected/received) rồi map tới luật (deps, closure, cleanup). Không test mà chấm là feedback chủ quan, dễ sai và mất uy tín tutor.

### 4. Feedback có mục tiêu — lớn trước, style sau, tối đa 3

Stale closure/deps sai (sai chức năng) trước; đặt tên/format sau. 3 lỗi + cách sửa từng cái + bài ôn. Hết 3 mới sang đợt sau — learner sửa xong 3 là tiến bộ thấy được.

### 5. Progress persistence — markdown là bộ nhớ

```md
<!-- learner-progress.md — đọc đầu buổi, ghi cuối buổi -->
- Level: hooks cơ bản ✓ | effects ~ | memo ✗
- Điểm yếu: deps array của useEffect, stale closure, cleanup.
- Đã hiểu: controlled input, key trong list.
- Buổi sau: ôn useEffect cleanup + làm bài 1_advanced-features/4-web-worker.
```

Không file này, tutor mỗi buổi hỏi lại "em học tới đâu" — phí và nản. File này cũng là bằng chứng tiến bộ (xem lại tháng trước ✗ nay ✓).

## Luồng hoạt động / Cách áp dụng

### Bước 1. Nạp system prompt tutor (Socratic, Việt, không đáp án trước)

Dán ở đầu session (AGENTS.md/custom instruction). Khóa 5 luật — không luật, model trôi về "đáp án ngay" mặc định.

### Bước 2. Đọc `learner-progress.md` — biết chặng + điểm yếu

Chưa có file thì diagnostic 15 phút (quiz + bài nhỏ) rồi tạo. Có rồi thì tiếp điểm yếu, không dạy lại đã ✓.

### Bước 3. Giới thiệu khái niệm + quiz trắc nghiệm

Một khái niệm một quiz (4 đáp án + giải thích). Quiz sai là biết hổng chỗ nào trước khi giao bài khó.

### Bước 4. Giao bài tập repo (`example.tsx` lỗi cố ý)

Bài thật trong repo (Stepper deps sai, Worker thiếu cleanup...) — sửa xong là hiểu luôn code dự án. Không xem đáp án vội (khóa ở prompt).

### Bước 5. Learner sửa; agent chạy test/chấm, feedback 3 lỗi lớn nhất

`vitest` trước, 3 lỗi + sửa sau. Kèm gợi ý Socratic nếu learner bí (không đáp án ngay).

### Bước 6. Cập nhật progress + bài sau

Ghi level, điểm yếu mới, bài ôn. Buổi sau đọc là tiếp được ngay.

## Ví dụ chi tiết

Mirror đầy đủ (system prompt + curriculum + bài tập + progress + lượt Socratic), khớp `example.tsx`:

```text
# System prompt tutor đặt ở đầu session (AGENTS.md / custom instruction)
# Vì sao 5 luật này: không luật là model đáp án ngay + dạy lan man + chấm cảm tính + quên progress
Bạn là tutor React 19 dạy theo kiểu Socratic. Quy tắc bắt buộc:
1. KHÔNG đưa code đáp án ngay — hỏi gợi ý trước (tối đa 3 gợi ý).
2. Mỗi khái niệm kèm 1 quiz trắc nghiệm + 1 bài tập lấy từ repo này.
3. Khi chấm: chạy test (vitest), chỉ ra ĐÚNG 3 lỗi quan trọng nhất + cách sửa.
4. Giải thích bằng tiếng Việt; code comment tiếng Việt ngắn gọn.
5. Kết thúc buổi: cập nhật learner-progress.md (level, điểm yếu, bài sau).
```

```tsx
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
```

```md
<!-- learner-progress.md — bộ nhớ giữa các buổi (mirror từ README gốc) -->
- Level: hooks cơ bản ✓ | effects ~ | memo ✗
- Điểm yếu: deps array của useEffect, stale closure, cleanup.
- Đã hiểu: controlled input, key trong list.
- Buổi sau: ôn useEffect cleanup + làm bài 1_advanced-features/4-web-worker.
```

```text
# Ví dụ lượt tutor (Socratic) khi learner hỏi — hỏi trước, đáp sau
Learner: "Vì sao interval bị tạo lại nhiều lần?"
Tutor: "Hay lắm — trước khi trả lời, em thử đoán: mỗi lần `step` đổi thì useEffect
        chạy lại mấy lần? Và `setInterval` cũ có bị dọn không? (gợi ý 1/3)"
# Gợi ý 2/3 (nếu bí): "Effect chạy lại khi nào? Nhìn deps [step] xem."
# Gợi ý 3/3 (nếu vẫn bí): "Muốn interval 1 lần duy nhất mà vẫn đọc step mới — cái gì giữ giá trị mới mà không gây chạy lại effect?"
# Đáp án (sau 3 gợi ý): useRef + deps [] như khối trên.
```

## Giải thích từng phần

### Quy tắc 1 (không đáp án ngay) — từ máy giải bài thành người dẫn

Ép suy ra thì nhớ; cho sẵn thì quên. 3 gợi ý là giới hạn chống kẹt (không để bí mãi) + chống ỷ lại (không hỏi là có đáp án).

### Quy tắc 3 (đúng 3 lỗi) — chống quá tải

Liệt kê 15 lỗi là nản + không biết sửa đâu trước. 3 lớn nhất + lộ trình là tiến bộ thấy được mỗi buổi.

### `example.tsx` deps `[step]` — stale closure + tạo mới

Mỗi bấm: effect dọn interval cũ + tạo mới (tốn), closure giữ step lần đó (đúng nhưng đắt). Đáp án ref + `[]`: 1 interval, đọc mới nhất qua ref. Tutor hỏi để learner tự phát hiện "chạy lại mấy lần" trước khi dạy ref.

### `learner-progress.md` — không dạy lại đã hiểu

Tutor đọc là biết bỏ qua controlled input/key, xoáy deps/closure/cleanup. Tiết kiệm nửa buổi mỗi lần.

### Rubric chấm (giữ từ README gốc + giải thích):

```text
1. Đúng chức năng  (test xanh)          — 40%
2. Compiler-safe   (không mutate, deps) — 25%
3. a11y            (semantic, label)    — 15%
4. Chất lượng code (đặt tên, tách hook) — 10%
5. Test           (có test hành vi)     — 10%
```

Chức năng nặng nhất (sai là hỏng), compiler-safe kế (sai là nợ), a11y có phần (sản phẩm thật cần), còn lại khuyến khích. Mục nào < 50% → bài ôn buổi sau. Điểm ghi vào progress để thấy đường tiến.

## Lỗi thường gặp / Chống chỉ định

### 1. Tutor đáp án ngay lượt đầu → learner thụ động

Khóa prompt "hỏi trước, tối đa 3 gợi ý". Review log: lượt đầu có code đáp án là prompt hỏng, sửa prompt.

### 2. Không lưu tiến độ → dạy lại từ đầu mỗi buổi

Đọc/ghi `learner-progress.md` là bước bắt buộc đầu/cuối (như checklist, không phải nhớ).

### 3. Chấm cảm nhận không chạy test → sai/chủ quan

Luôn `vitest` trước. Không test cho bài đó thì viết test trước khi chấm (test là đề, code là bài).

### 4. Liệt kê mọi lỗi → nản

3 lớn nhất + sửa + ôn. Hết 3 mới đợt sau.

### 5. Curriculum lệch repo → bài không tồn tại

Bài nào cũng trỏ thư mục thật (`1_advanced-features/...`). Refactor repo mà curriculum cũ là tutor giao bài ma — cập nhật cùng PR.

## Best practices / Mẹo

### Chặng rõ + quiz giải thích + đoán trước khi chạy + thi lại điểm yếu + skills chuẩn hóa chấm

Mỗi chặng 1 chủ đề + tiêu chí qua cụ thể. Quiz ngắn có giải thích (sai là hiểu ngay). Learner viết dự đoán trước khi chạy (đoán sai mới nhớ). Định kỳ thi lại điểm yếu cũ (chống quên). Kết hợp agent skills (bài 2) để tutor chấm theo chuẩn repo (không phải gu chung chung).

## Bài tập nhỏ

Tự đóng vai learner với `Stepper`:

1. Đoán (viết ra): bấm 3 lần thì bao nhiêu interval được tạo/dọn? Log in ra gì?
2. Sửa để `setInterval` 1 lần, vẫn log `step` mới (gợi ý: ref giữ mới nhất hoặc functional update + ref).
3. Vitest fake timers: advance 3s, bấm step, advance tiếp — assert log đúng mới nhất + `setInterval` chỉ gọi 1 lần (spy).
4. Ghi `learner-progress.md` cho chính mình (level effects, điểm yếu còn lại).

## Reference

- [React Learn](https://react.dev/learn)
- [Angular AI Tutor (tham khảo)](https://angular.dev/ai/ai-tutor)
- [Vitest — fake timers](https://vitest.dev/api/vi.html#vi-usefaketimers)
- [react.dev — useEffect](https://react.dev/reference/react/useEffect)
