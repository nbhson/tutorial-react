# 1. Khác nhau giữa library và framework?

## Câu hỏi

"Library và framework khác nhau thế nào? React nằm ở đâu trong hai khái niệm đó?"

## Trả lời ngắn

- **Library** là bộ mã nguồn *thụ động* (passive): bạn chủ động **gọi** nó khi cần. Nó cung cấp các chức năng cụ thể (utility, tiện ích) nhưng không kiểm soát cấu trúc hay luồng ứng dụng. Bạn có thể dùng một phần, thay thế, hoặc kết hợp nhiều library với nhau.
- **Framework** là bộ khung *chủ động* (active): chính nó kiểm soát toàn bộ luồng (control flow), và bạn **nạp (inject)** logic của mình vào các điểm có sẵn của framework. Đây gọi là **Inversion of Control (IoC)**.

## Giải thích mở rộng

| Tiêu chí | Library | Framework |
|----------|---------|-----------|
| Quyền kiểm soát | Bạn kiểm soát (passive) | Framework kiểm soát (active / IoC) |
| Hướng gọi | Bạn gọi library | Framework gọi code của bạn |
| Phạm vi | Giải quyết 1 nhiệm vụ | Nền tảng xây dựng cả ứng dụng |
| Độ linh hoạt | Cao, dễ thay thế | Thấp, phải tuân theo "luật" của nó |
| Ví dụ | Lodash, Axios, Moment | Spring, Django, Express, Rails |

### React nằm ở đâu?

React **thường được gọi là library** vì:
- Nó chỉ chịu trách nhiệm cho **view (thuyết minh UI)**, không kiểm soát toàn bộ app (không có routing, HTTP, auth sẵn như một framework).
- Bạn chủ động *dùng* React: import và render ở nơi bạn muốn, không phải "nạp code vào một điểm cố định" như framework.
- React **không áp đặt kiến trúc** — tự do kết hợp routing, state, dữ liệu theo cách riêng.

Tuy nhiên, nhiều người gọi React là **micro-framework** vì:
- Nó thực sự có mô hình khai báo (declarative) và vòng đời component rõ ràng.
- Cùng hệ sinh thái lớn (Redux, Router, Next.js) thì gần như bạn "đi theo luật" của hệ ấy → Next.js là framework đúng nghĩa (có SSR, file-based routing, convention).

> Mẹo trả lời phỏng vấn: nói rõ "React là library view; khi dùng kèm Next.js thì thành framework full-stack". Điều này cho thấy bạn hiểu ranh giới, không phải nhớ máy móc.
