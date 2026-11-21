# Build with AI — Tổng quan

> Đối chiếu Angular: `tutorial-angular/2_angular-techniques/7_build-with-ai/` — React chưa có docs AI chính thức như angular.dev/ai nên dùng hệ sinh thái chung (MCP, Agent Skills, llms.txt). Cấu trúc thư mục mirror theo Angular để dễ đối chiếu từng bài.

Bạn đã có AI IDE nhưng nó cứ sinh code React kiểu cũ, hay bạn phải nhắc lại quy ước mỗi lần? Nhóm bài này dạy bạn "nuôi" agent thành đồng đội hiểu đúng repo — từ cấu hình nền đến dạy học. Đọc mục "Các bài con" để chọn lộ trình phù hợp.

## Nhóm này giải quyết gì

Mục này nêu 5 vấn đề điển hình khi code React với AI và bài nào giải vấn đề đó. Đọc để định vị vấn đề của mình trước khi chọn bài.

AI IDE (Cursor, Copilot, Antigravity, JetBrains AI) và agent có thể tăng tốc viết React rất nhiều — **nhưng chỉ khi được "dạy" đúng stack và đúng chuẩn**. Nhóm này giải quyết:

1. **AI sinh code lỗi thời** — dùng `forwardRef`, `defaultProps`, class component, Tailwind v3 → cần prompt + docs context đúng (bài 1).
2. **Lặp lại hướng dẫn mỗi lần** — không muốn dán prompt dài → đóng gói thành Skill tái sử dụng (bài 2).
3. **AI không tra được tài liệu / không chạy được tool** — cần "tay chân" truy cập docs và thực thi (bài 3).
4. **Sinh nhanh nhưng chất lượng thấp** — cần các pattern kèm vòng verify tự động (bài 4).
5. **Muốn học React có hướng dẫn** — cần tutor biết chấm bài và theo dõi tiến độ (bài 5).

Hãy hình dung agent như một **nhân viên trẻ giỏi nhưng chưa biết nội quy công ty**: bài 1 phát thẻ vào cửa và sổ tay, bài 2 viết quy trình từng việc, bài 3 trao quyền truy cập hệ thống, bài 4 dạy cách làm việc có kiểm soát, bài 5 dùng chính nó để đào tạo người mới.

> **Tóm gọn 1 câu:** Năm vấn đề — code lỗi thời, nhắc đi nhắc lại, không tra được, chất lượng thấp, thiếu lộ trình học — mỗi bài con gánh một cái.

## Khi nào cần

Mục này giúp bạn quyết nhanh: tình huống của bạn cần bài nào, hay bỏ qua cả nhóm. Đọc các dòng và đối chiếu với thực tế công việc của bạn.

- Bạn dùng AI IDE hằng ngày và muốn nó sinh React 19 chuẩn → **bài 1** (làm trước tiên).
- Làm việc nhóm, muốn chuẩn hóa cách agent tạo/review/upgrade code → **bài 2**.
- Muốn agent tra docs React và chạy test/tool → **bài 3**.
- Đã có agent, cần kỷ luật để output chất lượng → **bài 4**.
- Muốn tự học React có lộ trình và được chấm → **bài 5**.
- Không dùng AI trong quy trình → có thể bỏ qua nhóm này.

> **Tóm gọn 1 câu:** Có AI trong quy trình là có việc — bắt đầu từ bài 1; không dùng AI thì cả nhóm này bỏ qua được.

## Các bài con

Mục này liệt kê 5 bài trong nhóm kèm mapping sang Angular. Dùng như mục lục để nhảy thẳng tới bài mình cần.

| # | Folder | Mapping Angular | Nội dung |
|---|---|---|---|
| 1 | [1_llm-prompts-ai-ide-setup/](1_llm-prompts-ai-ide-setup/README.md) | `/ai/develop-with-ai` | LLM prompts + AI IDE setup: `llms.txt`, `AGENTS.md`, prompt chuẩn React 19. Dẫn AI tới docs đúng và khai stack/pattern bị cấm. |
| 2 | [2_agent-skills/](2_agent-skills/README.md) | `/ai/agent-skills` | Skill `react-developer` (và `react-upgrade`): `SKILL.md` + frontmatter. Chuẩn hóa cách agent tạo component/review/upgrade. |
| 3 | [3_cli-mcp-server/](3_cli-mcp-server/README.md) | `/ai/mcp` | MCP server cho React docs + custom tool (React không có CLI MCP chính thức). Phân quyền filesystem/github, tránh prompt injection. |
| 4 | [4_design-patterns-ai/](4_design-patterns-ai/README.md) | `/ai/design-patterns` | Pattern dùng AI: generate→verify, small slices, streaming UI. Form AI với `useActionState` + Server Actions. |
| 5 | [5_ai-tutor/](5_ai-tutor/README.md) | `/ai/ai-tutor` | Tutor học React: Socratic, curriculum, chấm bài, lưu tiến độ. Dùng chung context docs của MCP server. |

> **Cách đọc bảng này:** đọc cột # theo thứ tự 1 → 5 là lộ trình gợi ý; cột "Nội dung" tóm tắt mỗi bài đủ để chọn — muốn chi tiết thì bấm vào Folder. Cột "Mapping Angular" để ai quen docs Angular so sánh nhanh.

## Mô tả chi tiết từng bài

Mục này kể mỗi bài dài hơn một chút so với bảng trên. Đọc khi cần hiểu từng bài làm gì trước khi quyết định học sâu.

### 1. LLM Prompts & AI IDE Setup (React)
Dẫn AI IDE (Cursor, VSCode Copilot, Antigravity, JetBrains AI) tới `https://react.dev/llms.txt` để sinh code đúng React 19. Bài này đưa prompt chuẩn (function component, `ref` là prop thường, không `forwardRef`/`defaultProps`, hook v6, Tailwind v4) và mẫu `AGENTS.md` khai stack + pattern bị cấm. Tương đương `angular.dev/ai/develop-with-ai`.

### 2. Agent Skills cho React
Angular có skills chính thức; React tự xây. Skill = thư mục `SKILL.md` (frontmatter `name`, `description`) + `references/` + `scripts/`, chuẩn hóa cách agent tạo component/review/upgrade. Bài này hướng dẫn viết skill `react-developer` (FSD, Compiler-safe, test Vitest) và `react-upgrade` (checklist nâng version), rồi khai trong `AGENTS.md` để agent tự nạp.

### 3. MCP Server cho React Dev
React không có `npx @angular/cli mcp` như Angular; dùng MCP server cộng đồng (`mcp-remote https://react.dev/mcp`, filesystem, github) và tự viết tool bằng TypeScript SDK (`search_components`, `run_component_tests`). Bài này nhấn mạnh phân quyền: filesystem chỉ trỏ repo, tool shell phải whitelist để tránh prompt injection.

### 4. AI Design Patterns (React)
Các pattern đã kiểm chứng khi dùng AI sinh React: **generate-then-verify** (tsc/eslint/vitest as gate), **small slices** (từng component/hook), **example-driven** (few-shot), **streaming UI** (`Suspense` + `use()`), và form AI với `useActionState` + Server Actions. Mục tiêu: tăng tốc nhưng vẫn giữ chất lượng nhờ vòng verify tự động.

### 5. AI Tutor học React
Tutor = agent + curriculum + quiz, dạy theo kiểu **Socratic**: hỏi gợi ý trước (tối đa vài gợi ý), chỉ show đáp án khi learner bí. Chấm bài bằng cách chạy `vitest` + checklist (Compiler-safe, a11y), feedback đúng vài lỗi quan trọng nhất. Tiến độ lưu vào `learner-progress.md` để buổi sau tiếp tục.

> **Tóm gọn 1 câu:** Bài 1 phát luật chơi, bài 2 đóng gói quy trình, bài 3 trao tay chân, bài 4 dạy kỷ luật chất lượng, bài 5 biến agent thành gia sư.

## Thứ tự đọc gợi ý

Mục này chỉ đường đi qua 5 bài. Đọc để không học lan man — một bài này là nền cho phần còn lại.

```
1 (luật chơi) → 2 (đóng gói skill) → 3 (tay chân: MCP) → 4 (pattern sản phẩm) → 5 (tutor)
```

Bài 1 là nền cho cả 4 bài còn lại; nếu chỉ đọc một bài để cải thiện ngay, hãy làm bài 1. Đi 2 → 3 để agent mạnh dần, rồi 4 để áp vào sản phẩm, và 5 nếu muốn dùng cho việc học.

> **Tóm gọn 1 câu:** Dọc theo lối: 1 trước tiên — chỉ kịp đọc một bài thì đọc bài 1, còn lại xếp theo 2 → 3 → 4 → 5.

## Mối quan hệ

Mục này cho thấy các bài ghép với nhau thành một hệ thống. Đọc để hiểu vì sao cấu hình bài 1 ảnh hưởng mọi bài sau.

```
Agent Skills (hướng dẫn) + MCP Server (hành động) = dev agent hoàn chỉnh
AI Tutor (học) dùng chung context docs của MCP Server
LLM Prompts + AGENTS.md (bài 1) là lớp nền cho cả 4 bài còn lại
```

- **Bài 1** định hình "luật chơi" (stack, docs, pattern cấm).
- **Bài 2** đóng gói luật đó thành skill tái sử dụng.
- **Bài 3** cho agent "tay chân" để tra docs và chạy tool.
- **Bài 4** là các pattern áp dụng khi dùng AI tạo sản phẩm.
- **Bài 5** dùng chung context để dạy người học.

> **Tóm gọn 1 câu:** Bài 1 là móng, 2 và 3 là não và tay chân, 4 là cách làm sản phẩm, 5 là lớp học — tất cả đứng chung một nền.

## Liên quan tới bài nào khác

Mục này nối nhóm bài ra các khu vực khác của repo. Đọc khi muốn kéo kiến thức sẵn có vào việc setup AI.

- "Pattern cấm" ở bài 1 lấy từ `8_best-practices/1_style-guide` (quy ước code) và `3_performance-optimization/1-react-compiler-memo` (Compiler-safe).
- Skill test ở bài 2 chạy trên hạ tầng `6_dev-tools/3-vitest` và lint `6_dev-tools/2-eslint-flat-hooks`.
- MCP tool ở bài 3 dùng lại kiến thức Vite/config ở `6_dev-tools/1-vite`.
- Pattern streaming UI ở bài 4 gắn với `4_react-new-feature` (`useActionState`, RSC) và `1_advanced-features/3` (state).

> **Tóm gọn 1 câu:** Nhóm này không đứng một mình — nó "mượn" quy ước, test và tool từ 4 khu khác của repo, nên thấy quen là đúng rồi.

## Tham khảo
- [React llms.txt](https://react.dev/llms.txt)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Agent Skills](https://agentskills.io/)
- [agents.md](https://agents.md/)
