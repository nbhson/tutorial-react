# Agent Skills cho React

> Nguồn: https://agentskills.io/ — tương đương `angular.dev/ai/agent-skills`

Bạn cứ phải nhắc đi nhắc lại "nhớ dùng Zustand nhé, nhớ viết test nhé" mỗi lần hỏi AI? Mục này dạy bạn cách "đóng khung" quy trình đó thành skill — viết một lần, agent tự áp mãi.

## Mục tiêu

Mục này trả lời 3 câu hỏi: skill là gì, viết skill React như thế nào, và kết nối nó với AGENTS.md ra sao. Đọc để có bản đồ trước khi vào chi tiết kỹ thuật.

### 1. Hiểu Agent Skill là gì và cách nó chuẩn hóa hành vi AI agent (Gemini CLI, Antigravity, Claude...)

**Vì sao:** prompt lẻ mỗi lần ("nhớ dùng Zustand, nhớ test...") phụ thuộc trí nhớ người viết — quên là agent sinh code lệch chuẩn, mỗi PR một kiểu. Agent Skill là "standard operating procedure" đóng gói: thư mục chứa `SKILL.md` (hướng dẫn) + `references/` + `scripts/`; host quét và nạp đúng skill khi task khớp mô tả. Update skill một nơi, mọi conversation sau đều theo — tách khỏi hội thoại đơn lẻ.

**Cơ chế load:** host (Gemini CLI/Claude Code/Antigravity) quét `skills/` (qua manifest hoặc khai `AGENTS.md`); task "tạo component X" khớp `description` của `react-developer` → `SKILL.md` vào context → agent làm theo từng bước + checklist. Không khớp thì không nạp (context gọn).

### 2. Viết skill `react-developer` đúng cấu trúc: `SKILL.md` + frontmatter + references/scripts

Frontmatter `name` + `description` (description là bộ lọc trigger — mơ hồ là nạp sai/lỡ). Thân theo số bước + checklist máy kiểm được (`tsc`, `eslint`, `vitest`). `references/` chứa docs dài (không nhét hết vào SKILL.md để context gọn). `scripts/` chứa lệnh an toàn agent được gọi.

### 3. Liên kết skills với `AGENTS.md` để agent tự nạp khi task khớp

`AGENTS.md` là quy ước repo agent luôn đọc (stack, pattern cấm, lệnh kiểm tra). Khai skill ở đó ("Skill có sẵn: react-developer... Xem .agents/skills/") để host biết tồn tại + khi nào mở. Một nguồn sự thật: AGENTS.md quy ước chung, skill đào sâu từng quy trình — không mâu thuẫn nhau.

> **Tóm gọn 1 câu:** Agent Skill là "sổ tay quy trình" bạn viết một lần — đúng skill nạp đúng lúc, update một nơi là mọi phiên làm sau đổi theo.

## Tổng quan

Mục này đặt skill vào bối cảnh: React chưa có bộ chính thức như Angular, skill khác gì doc thường, và khi nào thì đáng để tự xây. Đọc để biết bạn có cần nó không.

- Angular có skills chính thức (`angular-developer`, `angular-new-app`); React không có bộ chính thức nên tự xây skill riêng cho repo (bám chuẩn repo này: function component + TS strict, Zustand + Query, Vitest hành vi, Tailwind v4).
- Agent Skill = thư mục chứa `SKILL.md` + dữ liệu tham chiếu + script; agent nạp **đúng skill** theo mô tả task (tạo component → developer, nâng version → upgrade, review → review).
- Khác doc thường: skill là quy trình có bước + gate kiểm tra (`tsc && eslint && vitest` xanh mới xong), không phải văn mô tả.
- Áp dụng cho nhóm muốn AI sinh code đồng nhất, review được, tái dùng giữa repo. Không cần khi chỉ dùng AI hỏi lẻ không lặp lại.

Giống như nhà hàng: doc thường là **thực đơn**, còn skill là **công thức kèm bước kiểm tra chất lượng** — đầu bếp mới đọc công thức thì món ra đúng vị, dù chủ cửa hàng không đứng cạnh.

> **Tóm gọn 1 câu:** Skill là quy trình có bước + gate kiểm tra — nên tự xây khi nhóm cần AI làm việc đồng nhất, không cần khi chỉ hỏi lẻ.

## Khái niệm cốt lõi

Mục này bóc 5 khái niệm: cấu trúc thư mục skill, cơ chế trigger, khác biệt với prompt, quan hệ với MCP, và tiêu chí một skill tốt. Đọc để hiểu "máy móc chạy thế nào" trước khi viết skill của mình.

### 1. Cấu trúc skill — `SKILL.md` + frontmatter + references/scripts

```
.agents/skills/react-developer/
  SKILL.md          # hướng dẫn (bắt buộc): frontmatter + bước + checklist
  references/       # docs dài (patterns, API) — tách để SKILL.md gọn
  scripts/          # lệnh an toàn agent được chạy (check.sh, test.sh)
```

Frontmatter quyết định trigger — viết theo use-case ("Dùng khi: tạo component/hook mới, review PR React..."), không chung chung ("hỗ trợ React"). Hãy hình dung description như **tấm biển cửa hàng**: biển ghi "sửa xe máy" thì khách đổ xe máy, biển ghi "dịch vụ chung" thì ai đi ngang cũng chạy vào.

```md
---
name: react-developer
description: Viết và review code React 19 + TS theo chuẩn repo này.
  Dùng khi: tạo component/hook mới, review PR React, sửa lỗi hooks.
---
```

**Sai thì sao:** description "hỗ trợ React" → task nào cũng khớp/không khớp, agent nạp sai skill (upgrade cho task tạo component). Fix: mô tả động từ + phạm vi + tín hiệu task.

### 2. Cơ chế load — host quét, task khớp mô tả thì nạp

Host quét `skills/` lúc khởi động (manifest hoặc AGENTS.md liệt kê). Mỗi turn, host so mô tả task với `description` các skill → nạp SKILL.md khớp vào context (kèm references khi cần). Skill không khớp không vào context — giữ context nhỏ, model chính xác. Ví von: host như **thủ thư** — bạn nói cần sách về "sửa ống nước" là thủ thư chỉ đưa đúng ngăn đó, chứ không bê cả thư viện đặt lên bàn.

### 3. Skill ≠ prompt thường — module cắm được, update tách hội thoại

Prompt một lần (xong là mất). Skill là module: update file là mọi lần sau đổi theo, không cần nhắc lại. Version hóa skill theo release để biết bản đang áp (skill cũ + rule mới = agent làm sai mà tưởng đúng). Nếu prompt là **tin nhắn nhắc việc một lần**, thì skill là **quy chế dán lên tường phòng** — ai vào phòng cũng đọc được, sửa quy chế là mọi người cùng áp bản mới.

### 4. Skills + MCP — hướng dẫn + tay chân

Skill = guidelines (làm gì, theo thứ tự nào, gate nào). MCP Server = tool (tra docs, chạy test, thao tác repo). Host có cả hai → agent vừa biết chuẩn vừa làm được thật (đọc SKILL.md rồi gọi MCP chạy `vitest` kiểm chứng). Ví von: skill là **cuốn cẩm nang nấu ăn**, MCP là **bộ bếp** — đọc cẩm nang mà không có bếp thì chỉ nấu trên giấy.

### 5. Skill tốt — mục tiêu rõ, checklist máy kiểm được, < 50 dòng

"Code sạch" máy không kiểm được; "`npx tsc --noEmit && npx eslint . --max-warnings=0 && npx vitest run` xanh" kiểm được. SKILL.md dài (> 50 dòng) agent rối, bỏ phần quan trọng — tách dài ra references, giữ thân là bước + gate.

### Skill vs AGENTS.md vs Prompt vs MCP (giữ bảng gốc + giải thích):

| Cơ chế | Bản chất | Khi dùng |
|---|---|---|
| Prompt | Yêu cầu một lần trong hội thoại | Việc cụ thể, không lặp lại |
| AGENTS.md | Quy ước repo, agent luôn nạp | Stack, pattern cấm, lệnh kiểm tra |
| Agent Skill | Module `SKILL.md`, nạp theo mô tả task | Quy trình lặp (tạo component, review, upgrade) |
| MCP Server | Tool/action cho agent gọi | Tra docs, chạy test, thao tác repo |

| MCP Server | Tool/action cho agent gọi | Tra docs, chạy test, thao tác repo |

> **Cách đọc bảng này:** mỗi dòng là một cơ chế hỗ trợ AI agent, xếp từ nhẹ nhất (prompt) đến mạnh nhất (MCP). Đọc cột "Khi dùng" trước để chọn đúng — sau đó xem "Bản chất" để hiểu vì sao chọn vậy.

Prompt cho việc lẻ; AGENTS.md cho quy ước luôn đúng; Skill cho quy trình lặp cần bước; MCP cho hành động cần tool. Nhầm (nhét quy trình dài vào AGENTS.md) là context phình mọi turn; nhét quy ước chung vào skill là skill nào cũng lặp lại.

> **Tóm gọn 1 câu:** Bốn cơ chế bốn vai trò — prompt cho việc một lần, AGENTS.md cho quy ước, Skill cho quy trình lặp, MCP cho hành động thật.

## Luồng hoạt động / Cách áp dụng

Mục này là lộ trình 5 bước để có skill chạy được, từ tạo thư mục đến test định kỳ. Làm tuần tự theo thứ tự, mỗi bước một việc.

### Bước 1. Tạo `.agents/skills/react-developer/SKILL.md`

Thư mục theo tên skill, file `SKILL.md` bắt buộc. Thêm `references/` khi docs dài, `scripts/` khi có lệnh chuẩn.

### Bước 2. Frontmatter `name` + `description` chính xác

`name` động từ + phạm vi (`react-developer`, `react-upgrade`, `react-review`). `description` liệt kê tín hiệu task (tạo component/hook, review PR, sửa hooks, nâng version) để trigger đúng.

### Bước 3. Thân theo bước + checklist máy kiểm được

Mỗi bước một việc (component → compiler-safe → data → test → gate). Gate cuối là lệnh chạy được, không phải lời khuyên. Ví dụ input→output ngắn để model bắt chước (tốt hơn mô tả trừu tượng).

### Bước 4. Khai trong `AGENTS.md`

Liệt kê skill + khi nào dùng + đường dẫn. Host đọc AGENTS.md đầu tiên nên đây là "mục lục" dẫn tới skill.

### Bước 5. Thử với agent + test định kỳ

Yêu cầu "tạo component X theo chuẩn repo", kiểm tra output có theo bước + gate xanh không. Quy ước đổi mà SKILL.md cũ → cập nhật cùng PR đổi rule (skill là code, không phải doc bỏ quên).

> **Tóm gọn 1 câu:** 5 bước: tạo thư mục → viết frontmatter trigger → thân theo bước + gate → khai trong AGENTS.md → thử thật và cập nhật cùng PR đổi rule.

## Ví dụ chi tiết

Mục này là bộ mirror đầy đủ bạn có thể chép về: 2 SKILL.md + AGENTS.md, khớp `example.tsx` cùng thư mục. Đọc để thấy lý thuyết ở trên "trông thật" ra sao.

Mirror đầy đủ (2 SKILL.md + AGENTS.md + checklist), khớp `example.tsx` cùng thư mục:

```md
<!-- .agents/skills/react-developer/SKILL.md — skill code mới (mirror từ README gốc) -->
---
name: react-developer
description: Viết và review code React 19 + TS theo chuẩn repo này.
  Dùng khi: tạo component/hook mới, review PR React, sửa lỗi hooks.
---

# React Developer

1. **Component**: function component + TS strict, props typed qua type/interface.
   <!-- Vì sao: class/defaultProps cũ + props any là nợ type — typed từ đầu để refactor an toàn -->
2. **Compiler-safe**: không mutate props/state; hooks đúng rules (react-hooks v6).
   <!-- Vì sao: mutate là compiler skip + bug — eslint immutability phải xanh -->
3. **Data**: fetch qua TanStack Query; client state qua Zustand slice — không dùng fetch thủ công.
   <!-- Vì sao: một nguồn cache/dedupe/invalidate — fetch tay là desync (xem bài store) -->
4. **Test**: component mới kèm Vitest + Testing Library theo hành vi user (getByRole).
   <!-- Vì sao hành vi: test implementation (state nội bộ) giòn — test vai trò user thấy -->
5. **Kiểm tra trước khi xong**: chạy `npx tsc --noEmit && npx eslint . --max-warnings=0 && npx vitest run`.
   <!-- Vì sao gate máy: "xong" nghĩa là 3 lệnh xanh, không phải "tôi nghĩ xong" -->
6. **Style**: Tailwind v4, dùng `cn()` từ `shared/ui`; không viết CSS lẻ tẻ.
   <!-- Vì sao cn: gom conditional class một chỗ, tránh chuỗi class rời rạc khó đọc -->
```

```md
<!-- .agents/skills/react-upgrade/SKILL.md — skill nâng version (tách khỏi code mới để context nhỏ) -->
---
name: react-upgrade
description: Nâng cấp an toàn React 18 → 19, Rspack/Vite, thư viện chính.
---

# React Upgrade

1. Đọc breaking changes: https://react.dev/blog + llms.txt.
   <!-- Vì sao docs trước: nâng mù là vỡ runtime mới biết — đọc 15 phút tiết kiệm 2 ngày -->
2. Cập nhật deps trong package.json, chạy `npm install`.
3. Chạy codemod (nếu có): `npx codemod` các rule cũ → mới.
4. Bật React Compiler + bắt lỗi mutate qua eslint-plugin-react-hooks.
5. Check peer deps, chạy đủ tsc/eslint/vitest trước khi commit.
```

```md
<!-- AGENTS.md — khai báo skill cho host (mục lục để host biết mở skill nào) -->
- Skill có sẵn: react-developer (code mới), react-upgrade (lên version).
  Xem .agents/skills/ để biết chi tiết.
```

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.ts`](examples/01-vi-du-chi-tiet.ts)

> **Tóm gọn 1 câu:** Hai skill tách bạch (code mới vs nâng version) + AGENTS.md làm mục lục — chép về là chạy được ngay.

## Giải thích từng phần

Mục này trả lời "vì sao thiết kế vậy" cho từng quyết định trong ví dụ trên. Đọc khi muốn điều chỉnh skill theo repo của mình mà không phá vỡ nguyên tắc.

### `frontmatter.description` — bộ lọc trigger

Kỹ (động từ + phạm vi + tín hiệu task) thì agent nạp đúng. Mơ hồ ("hỗ trợ React") thì nạp sai/lỡ. Viết xong tự test: đọc description, đoán task nào khớp — khớp sai là viết lại.

### Bước 5 gate máy — "xong" có định nghĩa

Không gate, agent "xong" theo cảm giác (code nhìn ổn). Có gate, xong = 3 lệnh xanh — reviewer chỉ cần xem log. Ghi "khi nào KHÔNG dùng skill" nữa để tránh áp nhầm (upgrade skill cho task tạo mới).

### Khai `AGENTS.md` — host ưu tiên đọc

AGENTS.md là entry host đọc đầu; liệt kê skill ở đó là quảng cáo "có module này, mở khi cần". Không khai là skill nằm chết (agent không biết tồn tại).

### 2 skill tách bạch — context nhỏ, chính xác

Một skill khổng lồ (code + upgrade + review) là context phình + trigger lẫn. Tách theo quy trình (mỗi skill một mục đích, > 3 nhóm việc là tách) — agent nạp đúng module nhỏ. Giống tủ hồ sơ: ngăn "hợp đồng", ngăn "hóa đơn", ngăn "nhân sự" — mở đúng ngăn cần chứ không kéo cả cái tủ ra bàn.

> **Tóm gọn 1 câu:** Thiết kế chuẩn: description sắc như bộ lọc, gate máy kiểm được, AGENTS.md làm cửa vào, và mỗi skill một mục đích.

## Lỗi thường gặp / Chống chỉ định

Mục này liệt kê 5 cách "làm hỏng skill" thường gặp nhất. Đọc trước khi viết skill để tránh đi lại đường mòn của người đi trước.

### 1. SKILL.md quá dài → agent rối, bỏ phần quan trọng

Giữ < 50 dòng thân; dài tách `references/`. Mỗi skill một mục đích; ví dụ input→output ngắn để bắt chước.

### 2. Description mơ hồ → trigger sai/lỡ

Mô tả theo use-case (tạo/review/sửa/nâng gì, tín hiệu nào). Test trigger bằng task mẫu trước khi merge skill.

### 3. Trùng/mâu thuẫn AGENTS.md → agent nghe ai?

Một nguồn sự thật: AGENTS.md quy ước chung, skill đào sâu quy trình. Đổi rule là đổi cả hai cùng PR.

### 4. Lệnh shell không kiểm soát → rủi ro bảo mật

Giới hạn lệnh an toàn (`tsc`/`eslint`/`vitest`, script trong `scripts/`). Không cho agent chạy script lạ không review (xóa, exfil, sửa ngoài repo).

### 5. Không test skill định kỳ → skill cũ, rule mới

Quy ước đổi mà SKILL.md cũ là agent làm sai có hệ thống. Test trên task mẫu trong CI (tạo PR demo) + version hóa skill theo release.

> **Tóm gọn 1 câu:** Năm cái bẫy: skill dài, description mơ hồ, mâu thuẫn AGENTS.md, lệnh shell tự do, và skill cũ quên cập nhật — mỗi cái đều làm agent "sai có hệ thống" chứ không phải sai một lần.

## Best practices / Mẹo

Mục này gom các kinh nghiệm vận hành skill về một chỗ. Đọc sau khi đã có skill đầu tiên chạy ổn, để nâng chất lượng dần.

### Machine-checkable + references tách + version + CI demo + MCP + tên động từ + ví dụ + một mục đích + ghi khi không dùng

"Code sạch" → "`eslint --max-warnings=0` xanh". Docs dài ra references. Version theo release. CI tạo PR demo để biết skill còn đúng. MCP để skill gọi build/test thật. Tên `react-review`/`react-upgrade` để chọn nhanh. Ví dụ input→output ngắn. > 3 nhóm việc là tách. Ghi "KHÔNG dùng khi..." để không áp nhầm.

> **Tóm gọn 1 câu:** Skill tốt giống checklist lái máy bay: ngắn, mỗi mục đều kiểm chứng bằng máy được, mỗi việc một mục đích — không phải bài luận dài về "cách bay đẹp".

## Bài tập nhỏ

1. Viết skill `react-review` (5 tiêu chí: hooks rules, type safety, a11y, test coverage, bundle) + gate (`eslint`, `tsc`, `vitest`, visualizer check).
2. Cho agent dùng nó review một PR cũ trong repo (task khớp description).
3. Ghi 3 điểm skill giúp tốt hơn (bắt được gì mà review tay sót, gate nào chặn được, thời gian tiết kiệm).
4. Test trigger sai: hỏi task nâng version xem agent có mở nhầm `react-review` không — sửa description nếu nhầm.

## Reference

- [Agent Skills spec](https://agentskills.io/)
- [agents.md](https://agents.md/)
- [Gemini CLI — skills](https://github.com/google-gemini/gemini-cli)
- [Angular Skills repo (tham khảo)](https://github.com/angular/skills)
