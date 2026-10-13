# 6_interview-question

Bộ câu hỏi phỏng vấn React thực chiến (góc nhìn 2026: React 19.3 + Compiler 1.0). Câu hỏi được đặt theo cách nói chuyện tự nhiên (tình huống thực tế), không hỏi kiểu giáo trình.

Mỗi câu là một thư mục con chứa `README.md` theo đúng cấu trúc quy ước: **Câu hỏi → Trả lời ngắn (elevator pitch) → Trả lời chi tiết → Ví dụ code → Bẫy khi phỏng vấn → Reference → Câu hỏi liên quan** (các link hỏi tiếp theo chiều sâu).

## Cách dùng để "hỏi liên tục"

Mỗi câu hỏi cuối file có section **"Câu hỏi liên quan"** với 2 nhánh:
- **Hỏi tiếp (liên tục)**: câu hỏi cùng chủ đề, đi thẳng, hỏi nhau liên tiếp không nhảy topic.
- **Đào sâu (xuyên nhóm)**: câu hỏi khác nhóm, nhưng cùng một cơ chế/vấn đề nền — giúp đào sâu khi đã nắm chủ đề.

Bạn có thể hỏi theo group (dưới đây) để đi từ nền tảng → nâng cao, hoặc theo nhánh "hỏi tiếp / đào sâu" để mở rộng tự nhiên.

## Nhóm câu hỏi

### Nhóm 1 — Nền tảng React (Q1–Q4)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 1 | Người ta bảo React là library chứ không phải framework — theo em khác nhau ở chỗ nào? | [`01-library-vs-framework`](01-library-vs-framework/README.md) |
| 2 | Em vừa nâng app từ React 18 lên 19, có gì vỡ không? Theo em 19 khác lớn nhất ở đâu? | [`02-react-18-vs-19`](02-react-18-vs-19/README.md) |
| 3 | Sao mở app Vite/Next lên lúc nào cũng thấy StrictMode bọc ngoài? Nó có chạy ở production không? | [`03-strictmode`](03-strictmode/README.md) |
| 4 | Em đang sửa code, lưu phát UI cập nhật mà state không mất — cơ chế đó là gì, khác gì F5? | [`04-hmr`](04-hmr/README.md) |

### Nhóm 2 — JSX & Virtual DOM (Q5–Q8)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 5 | React cập nhật giao diện kiểu gì mà không vẽ lại cả trang? Em giải thích thử cơ chế đó? | [`05-virtual-dom`](05-virtual-dom/README.md) |
| 6 | JSX thực chất là gì? Sao trong dấu `{}` chỉ viết được biểu thức mà không viết được `if`/`for`? | [`06-jsx`](06-jsx/README.md) |
| 7 | Sao React phải đẻ ra Fragment? Cứ bọc `div` cho nhanh thì bị gì? | [`07-fragment`](07-fragment/README.md) |
| 8 | Render danh sách mà lấy index làm key thì sao? Khi nào nó gây bug thấy rõ? | [`08-key-index`](08-key-index/README.md) |

### Nhóm 3 — Component & Props/Children (Q9–Q12)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 9 | Hai component con cùng cần dùng chung một state, em đặt state ở đâu? | [`09-lifting-state-up`](09-lifting-state-up/README.md) |
| 10 | Em cần giữ một giá trị qua các lần render mà không muốn UI render lại, em dùng gì? | [`10-useref-vs-usestate`](10-useref-vs-usestate/README.md) |
| 11 | Cha muốn bấm nút là focus vào ô input nằm trong con, em làm thế nào? | [`11-parent-calls-child-method`](11-parent-calls-child-method/README.md) |
| 12 | Component nhận nhiều children mà em chỉ muốn hiện đứa đầu tiên, em xử lý sao? | [`12-filter-first-child`](12-filter-first-child/README.md) |

### Nhóm 4 — State & Re-render (Q13–Q16)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 13 | Props truyền qua 4-5 tầng thấy oải quá, khi nào em chuyển sang dùng Context? | [`13-context-vs-props`](13-context-vs-props/README.md) |
| 14 | Đổi một giá trị trong Context thì có phải cả app render lại không? | [`14-context-rerender`](14-context-rerender/README.md) |
| 15 | Nhiều chỗ cùng xài chung state, em chọn Redux, Zustand hay cái gì? Vì sao? | [`15-external-stores`](15-external-stores/README.md) |
| 16 | Có component render lại hoài dù props y nguyên, em chặn kiểu gì? | [`16-memo`](16-memo/README.md) |

### Nhóm 5 — Forms (Q17–Q19)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 17 | Em làm ô input mà user gõ chữ gì hiện đúng chữ đó — state với input nối với nhau ra sao? | [`17-controlled-form`](17-controlled-form/README.md) |
| 18 | Sao form đông người lại dùng react-hook-form thay vì mỗi input một `useState`? | [`18-rhf-vs-controlled`](18-rhf-vs-controlled/README.md) |
| 19 | Form login 2 ô thì em dùng `useState` hay lôi react-hook-form vào? Ranh giới ở đâu? | [`19-when-usestate-when-rhf`](19-when-usestate-when-rhf/README.md) |

### Nhóm 6 — Data & HTTP (Q20–Q24, Q32)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 20 | Cần đổ danh sách user từ API lên màn hình, em viết đoạn lấy data thế nào? | [`20-data-fetching`](20-data-fetching/README.md) |
| 21 | Đang gọi API mà user chuyển trang khác, request dở dang đó xử lý sao? | [`21-abort-on-navigate`](21-abort-on-navigate/README.md) |
| 22 | Mọi request đều phải gắn token, gặp 401 thì tự refresh — em đặt logic đó ở đâu để khỏi lặp lại? | [`22-interceptor`](22-interceptor/README.md) |
| 24 | Trang `/admin` chỉ cho user có quyền vào, em chặn từ phía client thế nào? | [`24-router-guard`](24-router-guard/README.md) |
| 32 | Bấm xóa xong, em cho UI cập nhật ngay hay ngồi chờ API trả về? | [`32-query-mutations`](32-query-mutations/README.md) |

> Q24 (router guard) được xếp vào nhóm Data & HTTP vì guard dựa vào đọc data (token/role) ở loader. Q32 (mutation) nằm đây vì gắn với lifecycle query/cache của TanStack Query.

### Nhóm 7 — Hooks & Render Pipeline (Q25–Q30)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 25 | Sao `useState` không được gọi trong `if` hay vòng `for`? | [`25-rules-of-hooks`](25-rules-of-hooks/README.md) |
| 26 | Trong một cú click mà gọi `setCount` hai lần liên tiếp, UI render mấy lần? Giá trị cuối là gì? | [`26-batching-stale-closure`](26-batching-stale-closure/README.md) |
| 27 | Cái gì thì em cho vào `useEffect`, cái gì thì không nên? | [`27-which-effect-when`](27-which-effect-when/README.md) |
| 28 | Khi nào em bỏ nhiều `useState` lẻ để gom về `useReducer`? | [`28-usereducer-vs-usestate`](28-usereducer-vs-usestate/README.md) |
| 29 | Ô search gõ chữ nào là list 10.000 dòng giật theo, em làm sao cho gõ vẫn mượt? | [`29-concurrency-transition-deferred`](29-concurrency-transition-deferred/README.md) |
| 30 | Từ lúc gọi `setState` tới lúc mắt thấy UI đổi, React đã làm những bước gì? | [`30-rerender-pipeline`](30-rerender-pipeline/README.md) |

### Nhóm 8 — Performance & List nặng (Q23, Q31)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 23 | Build xong bundle JS mấy MB, em soi chỗ nào nặng và giảm kiểu gì? | [`23-bundle-size`](23-bundle-size/README.md) |
| 31 | Nếu UI bắt buộc phải render 10.000 record thì làm thế nào? | [`31-virtualization`](31-virtualization/README.md) |

> Nhóm hiệu năng: Q23 là "tĩnh" (thời điểm build/bundle), Q31 + Q29 là "động" (runtime khi render list lớn). Cả 2 thường được hỏi cùng một câu chuyện performance.

### Nhóm 9 — Security (Q33)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 33 | Phải hiển thị comment/markdown do user nhập, em làm sao để không bị dính XSS? | [`33-xss-dangerously`](33-xss-dangerously/README.md) |

### Nhóm 10 — Type & Architecture (Q34, Q35, Q36)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 34 | Có list 50 ô input, muốn focus đúng ô thứ 20 thì em giữ ref kiểu gì? | [`34-ref-callback-n-items`](34-ref-callback-n-items/README.md) |
| 35 | Làm sao để type đi xuyên suốt từ form tới API mà không phải lạm dụng `as`? | [`35-type-safety`](35-type-safety/README.md) |
| 36 | App React to dần, nhiều người làm chung, em chia folder/tổ chức code ra sao? App nhỏ có cần vậy không? | [`36-architecture-code-org`](36-architecture-code-org/README.md) |

> Q34 (ref callback N phần tử) xếp vào nhóm Type & Architecture vì nó là kỹ thuật "nâng cao" về quản lý tham chiếu động, đi kèm typing (Map) và pattern tổ chức component. Bạn cũng có thể coi Q34 là cầu nối với Nhóm 8 (list nặng).

### Nhóm 11 — Real-world Forms, Performance, Data & A11y (Q37–Q42)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 37 | Form mấy chục ô, vừa gõ vừa validate từng ô mà không lag, em làm thế nào? | [`37-form-validation-perf`](37-form-validation-perf/README.md) |
| 38 | App chạy được nhưng chậm, không biết nghẽn ở đâu — em soi bằng gì, soi theo thứ tự nào? | [`38-profile-slow-app`](38-profile-slow-app/README.md) |
| 39 | Data API chưa về, em cho hiện khung chờ hay cứ để trống? Khi nào dùng Suspense? | [`39-loading-skeleton-suspense`](39-loading-skeleton-suspense/README.md) |
| 40 | User gõ search 3 chữ liên tục, response về lộn xộn thì màn hình hiện kết quả của chữ nào? | [`40-race-condition-stale-response`](40-race-condition-stale-response/README.md) |
| 41 | Muốn app mất mạng vẫn xem được data cũ, em cache ở đâu, khi nào xóa? | [`41-offline-cache-pwa`](41-offline-cache-pwa/README.md) |
| 42 | Button custom bấm chuột được mà bấm Tab/phím Enter không ăn — em xử lý sao cho người dùng bàn phím dùng được? | [`42-accessibility`](42-accessibility/README.md) |

### Nhóm 12 — Real-time, Upload & Worker (Q44–Q47)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 44 | Review code React của người khác, dấu hiệu nào cho thấy code chưa đúng chất React? | [`44-code-review-non-react`](44-code-review-non-react/README.md) |
| 45 | Giá nhảy liên tục qua WebSocket, em đưa vào React sao cho không render loạn? | [`45-realtime-websocket-sse`](45-realtime-websocket-sse/README.md) |
| 46 | Upload video vài trăm MB mà có progress bar, bấm hủy được, mất mạng tải tiếp — em làm thế nào? | [`46-upload-file-large`](46-upload-file-large/README.md) |
| 47 | Bấm nút mà UI khựng 200ms vì tính toán nặng, em đẩy ra khỏi main thread kiểu gì? | [`47-lag-worker`](47-lag-worker/README.md) |

> Nhóm 11 là "thực chiến" (forms phức tạp, profile, loading, race condition, offline cache, accessibility). Nhóm 12 là "kỹ thuật nâng cao" (code review, real-time, upload, worker).

## Đề xuất lộ trình "hỏi liên tục"

- **Cơ bản (phỏng vấn 0–1 năm)**: Q1, Q5, Q6, Q8, Q9, Q13, Q17
- **Trung cấp (1–3 năm)**: Nhóm 2–4 (Q5–Q16) + Q20, Q25, Q26
- **Nâng cao (3–5 năm)**: Nhóm 6–8, Q30, Q35, Q36 (đào sâu render pipeline, data, performance, kiến trúc)
- **Thực chiến (5 năm+)**: Nhóm 11 (Q37–Q42) — forms phức tạp, profile, race condition, offline cache, accessibility
- **Test trình độ 5 năm (theo nhóm, mỗi nhóm hỏi 1–2 câu "hỏi tiếp")**: đi lần lượt Nhóm 1 → 2 → 4 → 6 → 7 → 8 → 10 → 11, dừng lại ở nhánh "hỏi tiếp" của mỗi câu để đào sâu trước khi sang nhóm kế tiếp.
