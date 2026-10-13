# Q1: Theo em, React gọi là library chứ không phải framework thì khác nhau ở chỗ nào?

## Câu hỏi

> Phân biệt library và framework bằng tiêu chí nào (không phải định nghĩa thuộc lòng)?
> React thì thuộc loại gì, Angular thì sao?
## Trả lời ngắn (elevator pitch, 30 giây)

- **Library**: bộ mã dùng lại, *bạn gọi nó* (inversion of control thuộc về bạn) — bạn kiểm soát cấu trúc ứng dụng, library chỉ phụ thuộc.
- **Framework**: bộ xương ứng dụng *gọi bạn* (inversion of control thuộc về framework) — nó quyết định cấu trúc, vòng đời, điểm vào; bạn viết code nhét vào chỗ framework chuẩn bị sẵn.
- **React** (theo nghĩa kỹ thuật): **UI library** — nó chỉ lo render view, bạn tự chọn router, state, HTTP... từ ecosystem.
- **Angular**: **framework full-stack phía client** — đóng gói sẵn Router, Forms, DI, HTTP, module system.

## Trả lời chi tiết

### 1. Khái niệm cốt lõi: Inversion of Control (IoC)

Tiêu chí phân biệt duy nhất, thực sự: **ai giữ quyền điều khiển vòng đời của chương trình**.

| | Library | Framework |
|---|---|---|
| Ai gọi ai | Bạn viết code, gọi vào library | Framework có vòng đời riêng, gọi ngược (callback/lifecycle) vào code của bạn |
| Bạn kiểm soát | Cấu trúc app, thứ tự, điểm vào | Không kiểm soát được — phải theo đúng kiến trúc framework đặt ra |
| Phụ thuộc | Library độc lập, dùng được trong app bất kỳ | Code viết cho framework X thường không chạy được ở framework Y |
| Ví dụ | `lodash`, `moment`/`date-fns`, `axios`, **React** | **Angular**, Django, Spring, Express (borderline) |

```tsx
// Library: BẠN gọi nó, trong THỜI ĐIỂM BẠN muốn.
// lodash là library — không có vòng đời, không hook vào app của bạn.
import { debounce } from "lodash-es";
const onSearch = debounce((q) => fetch(q), 300); // bạn quyết khi nào gọi
```

```ts
// Framework: NÓ gọi bạn, đúng thời điểm NÓ muốn.
// Angular: @Component + lifecycle hook — Angular gọi ngOnInit, ngOnDestroy...
// của bạn, không phải bạn gọi Angular.
@Component({ selector: "app-user", template: "..." })
export class UserComponent implements OnInit {
  ngOnInit(): void { /* do Angular gọi khi component mount */ }
}
```

### 2. React: library "nặng đô" hay framework "nhẹ"?

Theo định nghĩa kỹ thuật trên, **React là UI library**:

- React core (2026, v19.3) chỉ làm đúng một việc: `state => UI` qua function component + hooks. Không có router, HTTP client, DI container trong core.
- Bạn tự lắp ghép: React Router v7, TanStack Query, Zustand, react-hook-form...

> Tuy nhiên trong thực hành, nhiều người vẫn gọi "React framework" vì React (kèm React Router + Next.js) đóng vai trò khung xương phía view rất mạnh, và React có hệ sinh thái chuẩn gần như bắt buộc (JSX, unidirectional data flow, hooks rules). Nên khi phỏng vấn, hãy nói chính xác: **"Về kỹ thuật là library, về mức ảnh hưởng lên kiến trúc UI thì hành xử gần như framework."** — câu trả lời này ăn điểm vì cho thấy bạn phân biệt được định nghĩa và thực tế.

So sánh Angular: mọi thứ *có sẵn trong framework* (Router, Forms, HttpClient, DI) → framework trọn vẹn.

### 3. Hệ quả thiết kế (đây là phần "ăn điểm" nhất)

| Hệ quả | Library (React) | Framework (Angular) |
|---|---|---|
| Bundle size | Chỉ chứa thứ bạn import (tree-shaking) | Chờ kèm một phần bộ khung dù không dùng |
| Độ tự do | Cao: swap router/state tùy ý | Thấp: theo đúng quy tắc framework |
|learning curve | Dễ bắt đầu, khó làm đúng (phải tự biết chọn tool) | Nặng lúc đầu, nhưng có "đường ray" rõ ràng |
| Rủi ro | "Choice paralysis", tự viết sai các thứ lẽ ra framework lo (cache, form validation) | Khóa vào quyết định của framework, upgrade version thường đau |

## Bẫy khi phỏng vấn

1. **Nói "React là framework" suông** → đánh giá là bạn không hiểu IoC. Hãy dùng qualifier "technically a UI library, de facto framework for the view layer".
2. **Nhầm library/framework với "cơ chế" khác** → ví dụ Redux là *state management library*, **không phải framework** (nó không gọi ngược bạn, bạn dispatch action).
3. **Biến "borderline"** (Express, Vue) bị hỏi sâu → chuẩn bị lập trường: Vue = framework (bao gồm template, reactivity, router, devtools mặc định) nhưng vẫn cho phép dùng vanilla; React = library, mọi thứ ngoài render là optional.

## Ví dụ code (React vs Angular, cùng tính năng)

```tsx
// React (library): bạn tự ghép mảnh. Không có module nào "bao" giúp.
// Điều hướng? cài react-router. Lấy data? cài @tanstack/react-query.
import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0); // state là "mảnh ghép" bạn tự quản
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

```ts
// Angular (framework): mọi thứ đóng gói sẵn trong @angular/*.
// Router, HttpClient, DI đều là một phần của framework, không cần cài thêm.
import { Component, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Component({ template: "<p>...</p>" })
export class CounterComponent {
  private http = inject(HttpClient); // DI container của framework
}
```

## Gợi ý câu chốt (nếu được hỏi "tại sao lại chọn React?")

> "React là library nên tôi kiểm soát được mọi layer: bundle nhỏ vì chỉ import đúng thứ cần, tự do thay state/router khi team đổi hướng, và không bị khóa vào một bộ quyết định đóng gói sẵn như Angular framework. Đổi lại là tôi phải tự chịu trách nhiệm lắp ghép đúng — đây chính là bài học xuyên suốt phần 'React chỉ lo view' trong tutorial."

## Reference

- "Inversion of control" — [Wikipedia](https://en.wikipedia.org/wiki/Inversion_of_control)
- "What is the difference between a framework and a library?" — [Stack Overflow (bài hay nhất)](https://stackoverflow.com/questions/453764/what-is-the-difference-between-a-framework-and-a-library)
- DAY 0 "React là UI library, không phải framework full-stack" — [`0-react-explore`](../../3_react-tutorial/0-react-explore)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q2 — nâng từ React 18 lên 19 thay đổi gì?](../02-react-18-vs-19/README.md) · [Q3 — StrictMode?](../03-strictmode/README.md)
- **Đào sâu (xuyên nhóm)**: [Q15 — DI vs store (Redux/Zustand)?](../15-external-stores/README.md) · [Q36 — app lớn tổ chức code thế nào?](../36-architecture-code-org/README.md)
