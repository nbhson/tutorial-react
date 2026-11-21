# Q1: Theo em, React gọi là library chứ không phải framework thì khác nhau ở chỗ nào?

## Câu hỏi

> Phân biệt library và framework bằng tiêu chí nào (không phải định nghĩa thuộc lòng)?
> React thì thuộc loại gì, Angular thì sao?
## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là câu trả lời "30 giây" để nói ngay khi được hỏi — học thuộc được thì phần còn lại của bài chỉ là vũ khí dự phòng.

- **Library = bạn gọi nó**: bạn quyết định kiến trúc app, gọi hàm của library khi cần (ví dụ gọi `debounce` của lodash). Giống như thuê một chuyên gia cụ: cần sửa ống nước thì gọi thợ sửa ống nước.
- **Framework = nó gọi bạn**: framework định sẵn khung (router, vòng đời, điểm vào), bạn chỉ điền code vào chỗ trống nó chừa sẵn. Giống như vào làm ở một công ty có quy trình: giờ giấc, phòng ban, quy trình người ta đặt sẵn, bạn ngồi vào vị trí.
- **React là UI library**: nó chỉ lo vẽ giao diện, còn router/state/HTTP bạn tự chọn từ ecosystem. Được tự do thay từng layer, đổi lại phải tự chịu trách nhiệm lắp ghép cho đúng.

> **Tóm gọn 1 câu:** Library là "bạn gọi nó", framework là "nó gọi bạn" — React là UI library theo kỹ thuật nhưng hành xử gần như framework ở tầng view.

## Trả lời chi tiết

### 1. Khái niệm cốt lõi: Inversion of Control (IoC)

Mục này đưa ra tiêu chí phân biệt duy nhất thực sự có giá trị — IoC. Đọc để trả lời được "không phải định nghĩa thuộc lòng" như đề bài yêu cầu.

Tiêu chí phân biệt duy nhất, thực sự: **ai giữ quyền điều khiển vòng đời của chương trình**.

| | Library | Framework |
|---|---|---|
| Ai gọi ai | Bạn viết code, gọi vào library | Framework có vòng đời riêng, gọi ngược (callback/lifecycle) vào code của bạn |
| Bạn kiểm soát | Cấu trúc app, thứ tự, điểm vào | Không kiểm soát được — phải theo đúng kiến trúc framework đặt ra |
| Phụ thuộc | Library độc lập, dùng được trong app bất kỳ | Code viết cho framework X thường không chạy được ở framework Y |
| Ví dụ | `lodash`, `moment`/`date-fns`, `axios`, **React** | **Angular**, Django, Spring, Express (borderline) |

> **Cách đọc bảng này:** đọc theo hàng — hàng "Ai gọi ai" là chìa khóa của mọi thứ, ba hàng sau là hệ quả rút ra từ đó; so sánh cột Library và Framework ngang nhau từng dòng.

> 📄 **Code ví dụ:** [`examples/01-1-khai-niem-cot-loi-inversion-of-control.tsx`](examples/01-1-khai-niem-cot-loi-inversion-of-control.tsx)

> 📄 **Code ví dụ:** [`examples/02-1-khai-niem-cot-loi-inversion-of-control.ts`](examples/02-1-khai-niem-cot-loi-inversion-of-control.ts)

### 2. React: library "nặng đô" hay framework "nhẹ"?

Theo định nghĩa kỹ thuật trên, **React là UI library**:

- React core (2026, v19.3) chỉ làm đúng một việc: `state => UI` qua function component + hooks. Không có router, HTTP client, DI container trong core.
- Bạn tự lắp ghép: React Router v7, TanStack Query, Zustand, react-hook-form...

> Tuy nhiên trong thực hành, nhiều người vẫn gọi "React framework" vì React (kèm React Router + Next.js) đóng vai trò khung xương phía view rất mạnh, và React có hệ sinh thái chuẩn gần như bắt buộc (JSX, unidirectional data flow, hooks rules). Nên khi phỏng vấn, hãy nói chính xác: **"Về kỹ thuật là library, về mức ảnh hưởng lên kiến trúc UI thì hành xử gần như framework."** — câu trả lời này ăn điểm vì cho thấy bạn phân biệt được định nghĩa và thực tế.

So sánh Angular: mọi thứ *có sẵn trong framework* (Router, Forms, HttpClient, DI) → framework trọn vẹn.

### 3. Hệ quả thiết kế (đây là phần "ăn điểm" nhất)

Mục này dịch tiêu chí IoC sang hệ quả thực tế — bundle, tự do, learning curve, rủi ro. Đây là chỗ thể hiện chiều sâu khi trả lời.

| Hệ quả | Library (React) | Framework (Angular) |
|---|---|---|
| Bundle size | Chỉ chứa thứ bạn import (tree-shaking) | Chờ kèm một phần bộ khung dù không dùng |
| Độ tự do | Cao: swap router/state tùy ý | Thấp: theo đúng quy tắc framework |
|learning curve | Dễ bắt đầu, khó làm đúng (phải tự biết chọn tool) | Nặng lúc đầu, nhưng có "đường ray" rõ ràng |
| Rủi ro | "Choice paralysis", tự viết sai các thứ lẽ ra framework lo (cache, form validation) | Khóa vào quyết định của framework, upgrade version thường đau |

> **Cách đọc bảng này:** đọc ngang từng hàng để thấy "cùng một khía cạnh, hai thái độ khác nhau"; cột "Hệ quả" là tiêu chí, hai cột sau là cái giá mỗi bên phải trả.

> **Tóm gọn 1 câu:** IoC là thước đo duy nhất: framework "gọi ngược" bạn, library thì bạn gọi — và mọi hệ quả (bundle, tự do, rủi ro) đều chảy ra từ một tiêu chí đó.

## Bẫy khi phỏng vấn

Mục này là danh sách 3 cách trả lời "mất điểm" — biết trước bẫy để né.

1. **Nói "React là framework" suông** → đánh giá là bạn không hiểu IoC. Hãy dùng qualifier "technically a UI library, de facto framework for the view layer".
2. **Nhầm library/framework với "cơ chế" khác** → ví dụ Redux là *state management library*, **không phải framework** (nó không gọi ngược bạn, bạn dispatch action).
3. **Biến "borderline"** (Express, Vue) bị hỏi sâu → chuẩn bị lập trường: Vue = framework (bao gồm template, reactivity, router, devtools mặc định) nhưng vẫn cho phép dùng vanilla; React = library, mọi thứ ngoài render là optional.

## Ví dụ code (React vs Angular, cùng tính năng)

> 📄 **Code ví dụ:** [`examples/03-vi-du-code-react-vs-angular-cung-tinh.tsx`](examples/03-vi-du-code-react-vs-angular-cung-tinh.tsx)

> 📄 **Code ví dụ:** [`examples/04-vi-du-code-react-vs-angular-cung-tinh.ts`](examples/04-vi-du-code-react-vs-angular-cung-tinh.ts)

## Gợi ý câu chốt (nếu được hỏi "tại sao lại chọn React?")

> "React là library nên tôi kiểm soát được mọi layer: bundle nhỏ vì chỉ import đúng thứ cần, tự do thay state/router khi team đổi hướng, và không bị khóa vào một bộ quyết định đóng gói sẵn như Angular framework. Đổi lại là tôi phải tự chịu trách nhiệm lắp ghép đúng — đây chính là bài học xuyên suốt phần 'React chỉ lo view' trong tutorial."

## Reference

- "Inversion of control" — [Wikipedia](https://en.wikipedia.org/wiki/Inversion_of_control)
- "What is the difference between a framework and a library?" — [Stack Overflow (bài hay nhất)](https://stackoverflow.com/questions/453764/what-is-the-difference-between-a-framework-and-a-library)
- DAY 0 "React là UI library, không phải framework full-stack" — [`0-react-explore`](../../3_react-tutorial/0-react-explore)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q2 — nâng từ React 18 lên 19 thay đổi gì?](../02-react-18-vs-19/README.md) · [Q3 — StrictMode?](../03-strictmode/README.md)
- **Đào sâu (xuyên nhóm)**: [Q15 — DI vs store (Redux/Zustand)?](../15-external-stores/README.md) · [Q36 — app lớn tổ chức code thế nào?](../36-architecture-code-org/README.md)
