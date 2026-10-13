# 6_interview-question

Bộ câu hỏi phỏng vấn React thực chiến (góc nhìn 2026: React 19.3 + Compiler 1.0), dành cho người chuyển từ Angular. Câu hỏi được đặt theo cách nói chuyện tự nhiên (tình huống thực tế), không hỏi kiểu giáo trình.

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
| 1 | Khi chọn tool cho project, làm sao phân biệt library và framework? React và Angular thuộc loại nào? | [`01-library-vs-framework`](01-library-vs-framework/README.md) |
| 2 | Bạn nâng app từ React 18 lên 19 thì thay đổi gì, vì sao 19 được gọi là bản bước ngoặt? | [`02-react-18-vs-19`](02-react-18-vs-19/README.md) |
| 3 | Vì sao template Vite/Next.js luôn bọc app bằng StrictMode, và nó ảnh hưởng gì đến production? | [`03-strictmode`](03-strictmode/README.md) |
| 4 | HMR thay module mà không mất state được làm thế nào, khác gì khi F5 reload trang? | [`04-hmr`](04-hmr/README.md) |

### Nhóm 2 — JSX & Virtual DOM (Q5–Q8)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 5 | React render lại UI bằng Virtual DOM, cơ chế diff chạy ra sao và vì sao phải dùng key? | [`05-virtual-dom`](05-virtual-dom/README.md) |
| 6 | JSX biên dịch ra gì, và vì sao trong `{}` chỉ được phép đặt expression, không được viết if/for? | [`06-jsx`](06-jsx/README.md) |
| 7 | Vì sao React có Fragment, không dùng div wrap cho tiện? | [`07-fragment`](07-fragment/README.md) |
| 8 | Key là index trong list thì có sao không? | [`08-key-index`](08-key-index/README.md) |

### Nhóm 3 — Component & Props/Children (Q9–Q12)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 9 | Hai component con cùng cần một state thì đặt state ở đâu? | [`09-lifting-state-up`](09-lifting-state-up/README.md) |
| 10 | Cần giữ một giá trị mà không làm UI re-render thì dùng gì? | [`10-useref-vs-usestate`](10-useref-vs-usestate/README.md) |
| 11 | Cha muốn gọi một hành vi của con (vd focus input trong con) thì làm sao? | [`11-parent-calls-child-method`](11-parent-calls-child-method/README.md) |
| 12 | Component nhận children nhưng chỉ muốn render child đầu tiên thì làm thế nào? | [`12-filter-first-child`](12-filter-first-child/README.md) |

### Nhóm 4 — State & Re-render (Q13–Q16)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 13 | Truyền props qua nhiều tầng thì chán — nên dùng Context khi nào? | [`13-context-vs-props`](13-context-vs-props/README.md) |
| 14 | Đổi giá trị Context thì bao nhiêu component render lại? | [`14-context-rerender`](14-context-rerender/README.md) |
| 15 | Nhiều component dùng chung state thì chọn Redux, Zustand hay gì? | [`15-external-stores`](15-external-stores/README.md) |
| 16 | Muốn chặn UI render không cần thiết ở một số component thì làm sao? | [`16-memo`](16-memo/README.md) |

### Nhóm 5 — Forms (Q17–Q19)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 17 | Form trong React: ô input hiện đúng giá trị user gõ thì state và input phối hợp thế nào? | [`17-controlled-form`](17-controlled-form/README.md) |
| 18 | Vì sao nên dùng react-hook-form thay vì viết controlled form bằng useState? | [`18-rhf-vs-controlled`](18-rhf-vs-controlled/README.md) |
| 19 | Form thì dùng useState, hay là phải dùng react-hook-form? | [`19-when-usestate-when-rhf`](19-when-usestate-when-rhf/README.md) |

### Nhóm 6 — Data & HTTP (Q20–Q24, Q32)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 20 | Lấy data từ API trong React — viết bằng gì cho ổn? | [`20-data-fetching`](20-data-fetching/README.md) |
| 21 | API chưa kịp trả lời mà user đã chuyển trang khác thì request đó bị sao? | [`21-abort-on-navigate`](21-abort-on-navigate/README.md) |
| 22 | Muốn mọi request tự động gắn token, xử lý 401 một chỗ tập trung — làm sao? | [`22-interceptor`](22-interceptor/README.md) |
| 24 | Làm sao chặn user không có permission khi vào một route (ví dụ trang admin)? | [`24-router-guard`](24-router-guard/README.md) |
| 32 | Sau khi gọi API (xóa/sửa thêm), UI hiện làm sao để cập nhật ngay mà không phải chờ? | [`32-query-mutations`](32-query-mutations/README.md) |

> Q24 (router guard) được xếp vào nhóm Data & HTTP vì guard dựa vào đọc data (token/role) ở loader. Q32 (mutation) nằm đây vì gắn với lifecycle query/cache của TanStack Query.

### Nhóm 7 — Hooks & Render Pipeline (Q25–Q30)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 25 | Vì sao không được gọi hook (vd useState) bên trong if hay for? | [`25-rules-of-hooks`](25-rules-of-hooks/README.md) |
| 26 | Gọi setState hai lần trong cùng một click thì UI render lại mấy lần? State đọc ra đúng không? | [`26-batching-stale-closure`](26-batching-stale-closure/README.md) |
| 27 | useEffect thì dùng cho việc gì, việc nào không nên nhét vào đó? | [`27-which-effect-when`](27-which-effect-when/README.md) |
| 28 | State nhiều chỗ thay đổi dựa vào nhau — khi nào nên chuyển từ useState sang useReducer? | [`28-usereducer-vs-usestate`](28-usereducer-vs-usestate/README.md) |
| 29 | Search trên list 10.000 item bị giật mỗi lần gõ phím — làm sao giữ UI mượt? | [`29-concurrency-transition-deferred`](29-concurrency-transition-deferred/README.md) |
| 30 | Từ lúc gọi setState đến khi DOM thay đổi, React làm gì qua các bước nào? | [`30-rerender-pipeline`](30-rerender-pipeline/README.md) |

### Nhóm 8 — Performance & List nặng (Q23, Q31)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 23 | Build ra bundle JS quá to thì làm sao tìm và giảm được? | [`23-bundle-size`](23-bundle-size/README.md) |
| 31 | Render list 50.000 item — phải render hết, hay dùng virtualization? | [`31-virtualization`](31-virtualization/README.md) |

> Nhóm hiệu năng: Q23 là "tĩnh" (thời điểm build/bundle), Q31 + Q29 là "động" (runtime khi render list lớn). Cả 2 thường được hỏi cùng một câu chuyện performance.

### Nhóm 9 — Security (Q33)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 33 | Render nội dung user (comment, markdown) vào HTML — làm sao tránh bị XSS? | [`33-xss-dangerously`](33-xss-dangerously/README.md) |

### Nhóm 10 — Type & Architecture (Q34, Q35, Q36)
| # | Câu hỏi | Thư mục |
|---|---|---|
| 34 | Muốn focus một ô input trong list 50 ô — giữ ref cho N phần tử động thế nào? | [`34-ref-callback-n-items`](34-ref-callback-n-items/README.md) |
| 35 | Type safety thực sự xuyên suốt app (schema → state → API) làm sao, và as thì khi nào là dấu hiệu xấu? | [`35-type-safety`](35-type-safety/README.md) |
| 36 | App React lớn, nhiều người làm chung — nên tổ chức code thế nào? App nhỏ thì có cần áp luôn không? | [`36-architecture-code-org`](36-architecture-code-org/README.md) |

> Q34 (ref callback N phần tử) xếp vào nhóm Type & Architecture vì nó là kỹ thuật "nâng cao" về quản lý tham chiếu động, đi kèm typing (Map) và pattern tổ chức component. Bạn cũng có thể coi Q34 là cầu nối với Nhóm 8 (list nặng).

## Đề xuất lộ trình "hỏi liên tục"

- **Cơ bản (phỏng vấn 0–1 năm)**: Q1, Q5, Q6, Q8, Q9, Q13, Q17
- **Trung cấp (1–3 năm)**: Nhóm 2–4 (Q5–Q16) + Q20, Q25, Q26
- **Nâng cao (3–5 năm)**: Nhóm 6–8, Q30, Q35, Q36 (đào sâu render pipeline, data, performance, kiến trúc)
- **Test trình độ 5 năm (theo nhóm, mỗi nhóm hỏi 1–2 câu "hỏi tiếp")**: đi lần lượt Nhóm 1 → 2 → 4 → 6 → 7 → 8 → 10, dừng lại ở nhánh "hỏi tiếp" của mỗi câu để đào sâu trước khi sang nhóm kế tiếp.
