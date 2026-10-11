# Agent Skills cho React

> Nguồn: https://agentskills.io/ — tương đương `angular.dev/ai/agent-skills`

## Mục tiêu
- Hiểu Agent Skill là gì và cách nó chuẩn hóa hành vi của AI agent (Gemini CLI, Antigravity, Claude...).
- Viết một skill `react-developer` đúng cấu trúc: `SKILL.md` + frontmatter + references/scripts.
- Liên kết skills với `AGENTS.md` để agent tự nạp khi task khớp mô tả.

## Tổng quan
- Angular có skills chính thức (`angular-developer`, `angular-new-app`); React không có bộ chính thức như vậy nên tự xây skill riêng cho repo.
- Agent Skill = thư mục chứa `SKILL.md` (hướng dẫn) + dữ liệu tham chiếu + script; agent nạp **đúng skill** theo mô tả task.
- Khác doc thường: skill là "standard operating procedure" — quy định luôn cách tạo component, review, upgrade.
- Áp dụng cho nhóm muốn AI sinh code đồng nhất, có thể review và tái dùng giữa các repo.

## Khái niệm cốt lõi
- **Cấu trúc skill**: `<skill-dir>/SKILL.md` với frontmatter `name` + `description` (description quyết định khi nào agent chọn skill); kèm `references/`, `scripts/`.
- **Cơ chế load**: host (Gemini CLI/Claude Code/Antigravity) quét `skills/` (thường qua `skills/.manifest` hoặc khai AGENTS.md); khi task trùng mô tả → nạp SKILL.md vào context.
- **Skill ≠ prompt thường**: prompt chỉ 1 lần; skill được "plug-in" như module — update tách khỏi conversation.
- **Kết hợp Agent Skills + MCP Server**: skill = hướng dẫn (guidelines), MCP = tay chân (tool build/test). Host hỗ trợ cả hai → agent mạnh nhất.
- **Skill tốt thế nào**: mục tiêu rõ, checklist kiểm tra được (`tsc`, `eslint`, `vitest`), không dài dòng — agent làm theo đúng được.

### Skill vs AGENTS.md vs Prompt vs MCP
| Cơ chế | Bản chất | Khi dùng |
|---|---|---|
| Prompt | Yêu cầu một lần trong hội thoại | Việc cụ thể, không lặp lại |
| AGENTS.md | Quy ước repo, agent luôn nạp | Stack, pattern cấm, lệnh kiểm tra |
| Agent Skill | Module hướng dẫn có `SKILL.md`, nạp theo mô tả task | Quy trình lặp (tạo component, review, upgrade) |
| MCP Server | Tool/action cho agent gọi | Tra docs, chạy test, thao tác repo |

## Luồng hoạt động / Cách áp dụng
1. Tạo thư mục `.agents/skills/react-developer/` với `SKILL.md`.
2. Viết frontmatter (`name`, `description`) — mô tả chính xác để agent trigger đúng lúc.
3. Viết thân skill theo số bước + checklist; thêm `references/` nếu cần docs đính kèm.
4. Khai báo trong `AGENTS.md` để host biết skill tồn tại.
5. Thử với agent: yêu cầu "tạo component X theo chuẩn repo" và kiểm tra output.

## Ví dụ chi tiết
```md
<!-- .agents/skills/react-developer/SKILL.md -->
---
name: react-developer
description: Viết và review code React 19 + TS theo chuẩn repo này.
  Dùng khi: tạo component/hook mới, review PR React, sửa lỗi hooks.
---

# React Developer

1. **Component**: function component + TS strict, props typed qua type/interface.
2. **Compiler-safe**: không mutate props/state; hooks đúng rules (react-hooks v6).
3. **Data**: fetch qua TanStack Query; client state qua Zustand slice — không dùng fetch thủ công.
4. **Test**: component mới kèm Vitest + Testing Library theo hành vi user (getByRole).
5. **Kiểm tra trước khi xong**: chạy `npx tsc --noEmit && npx eslint . --max-warnings=0 && npx vitest run`.
6. **Style**: Tailwind v4, dùng `cn()` từ `shared/ui`; không viết CSS lẻ tẻ.
```

```md
<!-- .agents/skills/react-upgrade/SKILL.md — skill chuyên nâng version -->
---
name: react-upgrade
description: Nâng cấp an toàn React 18 → 19, Rspack/Vite, thư viện chính.
---

# React Upgrade

1. Đọc breaking changes: https://react.dev/blog + llms.txt.
2. Cập nhật deps trong package.json, chạy `npm install`.
3. Chạy codemod (nếu có): `npx codemod` các rule cũ → mới.
4. Bật React Compiler + bắt lỗi mutate qua eslint-plugin-react-hooks.
5. Check peer deps, chạy đủ tsc/eslint/vitest trước khi commit.
```

```md
<!-- AGENTS.md — khai báo skill cho host -->
- Skill có sẵn: react-developer (code mới), react-upgrade (lên version).
  Xem .agents/skills/ để biết chi tiết.
```

```ts
// example.tsx — checklist mà skill "react-developer" bắt agent kiểm tra
export const reactDeveloperChecklist = [
  'Function component + props typed (không class, không defaultProps)',
  'Không mutate props/state (Compiler-safe)',
  'Fetch qua TanStack Query, client state qua Zustand',
  'Kèm test Vitest theo hành vi user',
  'Chạy tsc --noEmit + eslint trước khi xong',
] as const;
```

## Giải thích từng phần
- `frontmatter.description`: là "bộ lọc trigger" — viết kỹ tình huống dùng để agent nạp đúng skill.
- Bước 5 trong SKILL.md: biến thành gate kiểm tra được bằng máy, không phụ thuộc niềm tin.
- Khai trong `AGENTS.md`: host ưu tiên đọc và "mở" skill theo yêu cầu.
- 2 skill tách bạch (code mới vs upgrade): context nhỏ hơn, chính xác hơn một skill khổng lồ.

## Lỗi thường gặp / Chống chỉ định
- **SKILL.md quá dài**: agent rối, bỏ qua phần quan trọng → giữ < 50 dòng, checklist ngắn.
- **Description mơ hồ** ("hỗ trợ React"): agent không trigger hoặc nạp sai lúc → mô tả theo use-case.
- **Trùng quy ước với AGENTS.md**: skill + AGENTS.md mâu thuẫn → một nguồn sự thật, skill đào sâu hơn.
- **Skill chứa lệnh chạy shell không kiểm soát** (chạy mọi script): rủi ro bảo mật → giới hạn lệnh an toàn như `tsc`/`eslint`/`vitest`.
- **Không test skill định kỳ**: quy ước đổi mà SKILL.md cũ → cập nhật cùng lúc với rule repo.

## Best practices / Mẹo
- Skill nên "machine checkable": thay "code sạch" bằng "chạy `npx eslint --max-warnings=0`".
- Tách references (docs dài) ra khỏi SKILL.md để context gọn.
- Version hóa skill theo release để biết bản đang áp dụng.
- Thử skill trên task mẫu trong CI (tạo PR demo) — đảm bảo agent làm đúng.
- Kết hợp MCP (bài 3) để skill gọi được build/test thật.
- Đặt tên skill theo động từ + phạm vi (`react-review`, `react-upgrade`) để agent chọn đúng nhanh.
- Viết ví dụ "input → output" ngắn trong SKILL.md giúp model bắt chước chính xác hơn mô tả trừu tượng.
- Giữ mỗi skill một mục đích; nếu một skill có hơn 3 nhóm việc, tách thành skill mới.
- Ghi "khi nào KHÔNG dùng skill" để tránh agent áp nhầm quy trình.

## Bài tập nhỏ
Viết skill `react-review` (review PR): 5 tiêu chí (hooks rules, type safety, a11y, test coverage, bundle) và yêu cầu agent dùng nó trên một PR cũ trong repo. Ghi lại 3 điểm skill giúp review tốt hơn.

## Reference
- [Agent Skills spec](https://agentskills.io/)
- [agents.md](https://agents.md/)
- [Gemini CLI — skills](https://github.com/google-gemini/gemini-cli)
- [Angular Skills repo (tham khảo)](https://github.com/angular/skills)