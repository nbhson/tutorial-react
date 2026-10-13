# LLM Prompts & AI IDE Setup (React)

> Nguồn: https://react.dev/llms.txt — tương đương `angular.dev/ai/develop-with-ai`

## Mục tiêu
- Dẫn AI IDE (Cursor, VSCode Copilot, Antigravity, JetBrains AI) tới nguồn docs chuẩn của React 19.
- Định nghĩa stack, quy ước code và pattern **cấm dùng** để AI không sinh code React cũ.
- Thiết lập `AGENTS.md` / `.cursor/rules` như "hợp đồng" giữa repo và mọi agent.

## Tổng quan
- AI sinh code sai khi dùng kiến thức cũ (React 16/17): class component, `forwardRef`, `defaultProps`, lifecycle. `https://react.dev/llms.txt` là tài liệu máy-đọc được của React 19 để ghim đúng năm 2026.
- Vấn đề cần giải: agent không biết quy ước repo; LLM prompt dài hay ngắn đều lạc. Giải pháp: **AGENTS.md + prompt chuẩn + MCP docs** (bài 3).
- Áp dụng ngay khi bắt đầu dự án React mới hoặc muốn chuẩn hóa cách mọi người (và AI) viết code.

## Khái niệm cốt lõi
- **`llms.txt`**: chuẩn mở do llms.txt mô tả — file văn bản trỏ tới docs theo cấu trúc cây (`https://react.dev/llms.txt`); agent/index đọc nhanh hơn HTML.
- **AGENTS.md**: đặt ở root repo (hoặc `.cursor/rules`, `.github/copilot-instructions.md`) — agent nào cũng nạp khi làm việc; liệt kê stack + quy ước + docs chuẩn.
- **Prompt engineering cho IDE**: model tốt hơn khi được cho "ràng buộc phiên bản + cấm pattern + ví dụ few-shot" thay vì yêu cầu chung chung.
- **React 19 khác biệt cần ghim**: `ref` là prop thường (không cần `forwardRef`), `defaultProps` bỏ, Server Components/`use()` với Next.js, hooks rules v6, Compiler-safe (không mutate props/state).
- **Docs chuẩn > kiến thức mô hình**: kiến thức trong model lệch phiên bản; chỉ định URL docs hiện hành để sinh đúng API.

## Luồng hoạt động / Cách áp dụng
1. Thêm `AGENTS.md` vào root repo với stack + docs + các pattern bị cấm.
2. (Tùy chọn) thêm `.cursor/rules/react.mdc` / `.vscode/copilot` cho quy tắc riêng IDE.
3. Viết prompt chuẩn kèm phiên bản React/TS/tool, kèm 1 file mẫu (few-shot).
4. Trỏ agent tới `https://react.dev/llms.txt` hoặc MCP docs thay vì để model tự nhớ.
5. Rà code AI sinh bằng `tsc --noEmit` + `eslint` (bài 6/2), vi phạm chuẩn → chỉnh prompt.

## Ví dụ chi tiết

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
```tsx
// AiButton.tsx — ref là prop thường từ React 19, không forwardRef
type Props = {
  label: string;
  disabled?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
};

export function AiButton({ label, disabled = false, ref }: Props) {
  return (
    <button ref={ref} disabled={disabled} className="rounded-lg px-4 py-2">
      {label}
    </button>
  );
}
```

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

```json
// .vscode/settings.json — gợi ý riêng cho Copilot trong workspace
{
  "github.copilot.chat.codeGeneration.instructions": [
    { "text": "React 19 + TypeScript strict. Tailwind v4. Không dùng kiến thức React < 18." }
  ]
}
```

## Giải thích từng phần
- `ref?: React.Ref<...>` + `<button ref={ref}>`: chính xác pattern React 19 — không bọc `forwardRef`, không `React.forwardRef`.
- `disabled = false`: default qua destructuring thay `defaultProps`.
- AGENTS.md: agent tự nạp khi mở repo — là nơi duy nhất khai quy ước.
- Prompt liệt kê "không dùng X" + "dùng Y": giảm hẳn pattern cũ sinh từ training data.

## Lỗi thường gặp / Chống chỉ định
- **Không ghim phiên bản** → AI sinh `React.Component`, `defaultProps` → luôn ghi "React 19" + cấm list.
- **Dán docs cũ từ web vào prompt** → API lệch; dùng `llms.txt`/MCP docs lấy bản hiện hành.
- **Prompt quá dài, mô tả mơ hồ** → agent chọn mức trừu tượng sai; dùng prompt ngắn + ví dụ few-shot.
- **Không viết `AGENTS.md`** → agent vi phạm quy ước repo; viết rõ stack + các bước kiểm tra.
- **Tin output AI ngay, không chạy `tsc`** → lỗi type/API len lỏi; luôn có gate lint + type + test.

## Best practices / Mẹo
- Một `AGENTS.md` ở root; tránh trùng lặp `.cursor/rules` trừ khi cần scope riêng.
- Cập nhật `AGENTS.md` đúng lúc nâng major (React 20, Vite 8...) — AI sẽ theo.
- Prompt "chuẩn" nhét vào snippet/command riêng để tái dùng.
- Yêu cầu AI **giải thích thay đổi** (diff summary) — dễ review và học từ agent.
- Kết hợp MCP docs (bài 3) để agent tự tìm API mới thay vì hỏi lại.

## Bài tập nhỏ
Viết `AGENTS.md` cho repo của bạn: stack, 5 quy ước, docs chuẩn, và 1 prompt tạo `useDebouncedValue` hook (React 19 + TS strict). Chạy agent sinh, review xem có vi phạm quy ước nào không.

## Reference
- [React llms.txt](https://react.dev/llms.txt)
- [React — Setup](https://react.dev/learn)
- [AGENTS.md](https://agents.md/)
- [llms.txt](https://llmstxt.org/)