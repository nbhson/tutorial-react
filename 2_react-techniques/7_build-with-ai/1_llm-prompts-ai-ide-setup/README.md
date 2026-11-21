# LLM Prompts & AI IDE Setup (React)

> Nguồn: https://react.dev/llms.txt — tương đương `angular.dev/ai/develop-with-ai`

Bạn dùng AI IDE (Cursor, Copilot...) để code React nhưng AI cứ sinh code kiểu cũ? Mục này chính là "tờ hướng dẫn sử dụng" để dạy AI biết repo của bạn theo chuẩn React 19 — thay vì để nó nhớ lầm kiến thức từ thời React 16.

## Mục tiêu

Mục này nói về 3 việc cần đạt được khi setup AI cho repo React. Đọc để biết đích đến trước khi vào cấu hình chi tiết.

- Dẫn AI IDE (Cursor, VSCode Copilot, Antigravity, JetBrains AI) tới nguồn docs chuẩn của React 19.
- Định nghĩa stack, quy ước code và pattern **cấm dùng** để AI không sinh code React cũ.
- Thiết lập `AGENTS.md` / `.cursor/rules` như "hợp đồng" giữa repo và mọi agent.

> **Tóm gọn 1 câu:** Đích đến: AI IDE của bạn biết repo dùng React 19, theo đúng quy ước, và không dám sinh code cổ.

## Tổng quan

Mục này phác bức tranh lớn: vì sao AI hay sai, bài toán thật sự nằm ở đâu, và khi nào cần áp dụng. Đọc để hiểu "vì sao" trước khi làm "như thế nào".

- AI sinh code sai khi dùng kiến thức cũ (React 16/17): class component, `forwardRef`, `defaultProps`, lifecycle. `https://react.dev/llms.txt` là tài liệu máy-đọc được của React 19 để ghim đúng năm 2026.
- Vấn đề cần giải: agent không biết quy ước repo; LLM prompt dài hay ngắn đều lạc. Giải pháp: **AGENTS.md + prompt chuẩn + MCP docs** (bài 3).
- Áp dụng ngay khi bắt đầu dự án React mới hoặc muốn chuẩn hóa cách mọi người (và AI) viết code.

Hãy hình dung: model AI giống một nhân viên mới tuyển — giỏi nhưng học từ giáo trình cũ. Muốn nó làm đúng việc nhà, bạn phải trao cho nó quy trình nội bộ của công ty, chứ không thể mong nó đoán ra. `AGENTS.md` chính là bộ quy trình đó.

> **Tóm gọn 1 câu:** AI sai không phải vì dốt, mà vì nhớ kiến thức cũ — trao cho nó docs chuẩn + quy ước repo là hết lệch.

## Khái niệm cốt lõi

Mục này định nghĩa từng "mảnh ghép" của hệ thống: file mô tả docs, hợp đồng repo, cách viết prompt, và những khác biệt React 19 cần ghim cứng. Đọc để nắm từ khóa trước khi áp dụng.

- **`llms.txt`**: chuẩn mở do llms.txt mô tả — file văn bản trỏ tới docs theo cấu trúc cây (`https://react.dev/llms.txt`); agent/index đọc nhanh hơn HTML.
- **AGENTS.md**: đặt ở root repo (hoặc `.cursor/rules`, `.github/copilot-instructions.md`) — agent nào cũng nạp khi làm việc; liệt kê stack + quy ước + docs chuẩn.
- **Prompt engineering cho IDE**: model tốt hơn khi được cho "ràng buộc phiên bản + cấm pattern + ví dụ few-shot" thay vì yêu cầu chung chung.
- **React 19 khác biệt cần ghim**: `ref` là prop thường (không cần `forwardRef`), `defaultProps` bỏ, Server Components/`use()` với Next.js, hooks rules v6, Compiler-safe (không mutate props/state).
- **Docs chuẩn > kiến thức mô hình**: kiến thức trong model lệch phiên bản; chỉ định URL docs hiện hành để sinh đúng API.

Ví von dễ nhớ: `llms.txt` là **mục lục sách**, AGENTS.md là **sổ nội quy**, còn prompt few-shot là **một bài tập làm mẫu** — ba thứ này cùng nhau tạo ra nhân viên AI làm đúng việc.

> **Tóm gọn 1 câu:** Năm mảnh ghép: `llms.txt` trỏ docs, AGENTS.md nêu quy ước, prompt kèm ràng buộc, ghim khác biệt React 19, và luôn tin docs hiện hành hơn trí nhớ của model.

## Luồng hoạt động / Cách áp dụng

Mục này là "bản đồ 5 bước" để setup từ con số 0. Làm lần lượt theo thứ tự, đừng nhảy cóc.

1. Thêm `AGENTS.md` vào root repo với stack + docs + các pattern bị cấm.
2. (Tùy chọn) thêm `.cursor/rules/react.mdc` / `.vscode/copilot` cho quy tắc riêng IDE.
3. Viết prompt chuẩn kèm phiên bản React/TS/tool, kèm 1 file mẫu (few-shot).
4. Trỏ agent tới `https://react.dev/llms.txt` hoặc MCP docs thay vì để model tự nhớ.
5. Rà code AI sinh bằng `tsc --noEmit` + `eslint` (bài 6/2), vi phạm chuẩn → chỉnh prompt.

Giống như đón nhân viên mới: ngày 1 phát sổ tay (AGENTS.md), ngày 2 thêm tài liệu riêng từng bộ phận (rule theo IDE), rồi giao việc kèm mẫu (few-shot), chỉ nguồn tra cứu chính thống (llms.txt), và cuối cùng luôn kiểm tra trước khi duyệt.

> **Tóm gọn 1 câu:** 5 bước theo thứ tự: hợp đồng repo → rule theo IDE → prompt có mẫu → trỏ docs chuẩn → kiểm tra trước khi duyệt.

## Ví dụ chi tiết

Mục này đưa ra các prompt và file cấu hình "lấy về dùng ngay". Đọc kỹ prompt mẫu để thấy nguyên tắc "ghi rõ phiên bản + cấm pattern" vận hành thế nào.

### Prompt chuẩn cho component mới
```text
Tạo React 19 + TS component:
- function component, không dùng class
- không dùng forwardRef — React 19 nhận ref như prop thường
- props typed, dùng destructuring + default value
- tuân thủ react-hooks v6 rules (không mutate props/state — Compiler-safe)
- style bằng Tailwind v4
- kèm test Vitest + Testing Library theo hành vi user
```

### Cấu hình IDE (AGENTS.md)
```md
# AGENTS.md — quy ước cho mọi agent làm việc trong repo này

- Stack: React 19, Vite 7, TypeScript strict, Tailwind v4, TanStack Query v5, Zustand v5.
- Docs chuẩn: https://react.dev/llms.txt — KHÔNG dùng kiến thức React < 18.
- Component: function component + props typed; ref là prop thường (không forwardRef).
- Data: mọi fetch qua TanStack Query; client state qua Zustand slice.
- Kiểm tra trước khi xong: `npx tsc --noEmit && npx eslint . --max-warnings=0` rồi chạy Vitest.
```

### Ví dụ output "chuẩn" từ AI tuân thủ prompt (example.tsx)
> 📄 **Code ví dụ:** [`examples/01-vi-du-output-chuan-tu-ai-tuan-thu.tsx`](examples/01-vi-du-output-chuan-tu-ai-tuan-thu.tsx)

### Cấu hình theo từng AI IDE
```md
<!-- .cursor/rules/react.mdc — Cursor đọc rule theo glob -->
---
description: Quy ước React 19 cho repo này
globs: ["**/*.tsx", "**/*.ts"]
alwaysApply: true
---

- React 19 + TS strict; function component; ref là prop thường.
- Không mutate props/state; fetch qua TanStack Query.
- Docs chuẩn: https://react.dev/llms.txt
```

```md
<!-- .github/copilot-instructions.md — VSCode Copilot đọc tự động -->
- Stack: React 19, Vite 7, Tailwind v4.
- Sinh function component + hooks; không class/forwardRef/defaultProps.
- Kèm test Vitest cho mỗi component mới.
- Khi cần API mới, tra https://react.dev thay vì suy đoán.
```

> 📄 **Code ví dụ:** [`examples/02-cau-hinh-theo-tung-ai-ide.json`](examples/02-cau-hinh-theo-tung-ai-ide.json)

> **Tóm gọn 1 câu:** Prompt tốt trông như đặc tả công việc: ghi rõ phiên bản, liệt kê điều cấm, kèm bài làm mẫu — copy về đổi vài dòng là dùng được.

## Giải thích từng phần

Mục này bóc từng dòng trong ví dụ để bạn hiểu "vì sao viết vậy". Đọc khi muốn chỉnh prompt theo ý mình mà không phá vỡ nguyên tắc.

- `ref?: React.Ref<...>` + `<button ref={ref}>`: chính xác pattern React 19 — không bọc `forwardRef`, không `React.forwardRef`.
- `disabled = false`: default qua destructuring thay `defaultProps`.
- AGENTS.md: agent tự nạp khi mở repo — là nơi duy nhất khai quy ước.
- Prompt liệt kê "không dùng X" + "dùng Y": giảm hẳn pattern cũ sinh từ training data.

Điểm mấu chốt: với model, "đừng làm X" cũng quan trọng như "hãy làm Y". Giống giao việc cho thực tập sinh — chỉ nói "làm báo cáo đẹp" thì nó tự nghĩ cách, nói rõ "không dùng màu đỏ, dùng template này" thì kết quả đoán được trước.

> **Tóm gọn 1 câu:** Mỗi dòng cấu hình đều "ghim" một quyết định: dùng pattern mới, thay pattern cũ bằng cách thay thế, và khai quy ước ở đúng một nơi agent luôn đọc.

## Lỗi thường gặp / Chống chỉ định

Mục này liệt kê 5 cái bẫy kinh điển khi setup AI — đọc để đỡ mất thời gian rơi vào từng cái một.

- **Không ghim phiên bản** → AI sinh `React.Component`, `defaultProps` → luôn ghi "React 19" + cấm list.
- **Dán docs cũ từ web vào prompt** → API lệch; dùng `llms.txt`/MCP docs lấy bản hiện hành.
- **Prompt quá dài, mô tả mơ hồ** → agent chọn mức trừu tượng sai; dùng prompt ngắn + ví dụ few-shot.
- **Không viết `AGENTS.md`** → agent vi phạm quy ước repo; viết rõ stack + các bước kiểm tra.
- **Tin output AI ngay, không chạy `tsc`** → lỗi type/API len lỏi; luôn có gate lint + type + test.

Cái bẫy số 1 phổ biến nhất: AI giống người kể chuyện theo ký ức — không nhắc "câu chuyện này xảy ra năm 2026" là nó kể phiên bản cũ.

> **Tóm gọn 1 câu:** Ghim phiên bản, dùng docs hiện hành, prompt ngắn kèm ví dụ, viết AGENTS.md, và luôn chạy gate kiểm tra — bỏ sót một cái là đón lỗi của AI về nhà.

## Best practices / Mẹo

Mục này là "cẩm nang nâng cao" sau khi đã setup cơ bản. Đọc để giữ hệ thống gọn và bền theo thời gian.

- Một `AGENTS.md` ở root; tránh trùng lặp `.cursor/rules` trừ khi cần scope riêng.
- Cập nhật `AGENTS.md` đúng lúc nâng major (React 20, Vite 8...) — AI sẽ theo.
- Prompt "chuẩn" nhét vào snippet/command riêng để tái dùng.
- Yêu cầu AI **giải thích thay đổi** (diff summary) — dễ review và học từ agent.
- Kết hợp MCP docs (bài 3) để agent tự tìm API mới thay vì hỏi lại.

> **Tóm gọn 1 câu:** Giữ một nguồn sự thật, cập nhật khi nâng version, tái dùng prompt như code — và bắt AI tự giải thích việc nó làm.

## Bài tập nhỏ

Viết `AGENTS.md` cho repo của bạn: stack, 5 quy ước, docs chuẩn, và 1 prompt tạo `useDebouncedValue` hook (React 19 + TS strict). Chạy agent sinh, review xem có vi phạm quy ước nào không.

## Reference
- [React llms.txt](https://react.dev/llms.txt)
- [React — Setup](https://react.dev/learn)
- [AGENTS.md](https://agents.md/)
- [llms.txt](https://llmstxt.org/)
