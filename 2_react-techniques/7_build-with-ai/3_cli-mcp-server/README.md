# MCP Server cho React Dev

> Nguồn: https://modelcontextprotocol.io/ — tương đương `angular.dev/ai/mcp` (`npx @angular/cli mcp` — Angular có CLI MCP chính thức, React thì dùng cộng đồng)

Agent của bạn biết "phải làm gì" nhưng không "đụng tay được"? MCP chính là bộ tay chân đó: cho agent tra docs tươi, đọc file đúng chỗ, chạy test thật — thay vì ngồi đoán mò. Mục này hướng dẫn bạn gắn bộ tay chân đó vào IDE.

## Mục tiêu

Mục này nói về 3 đích đến khi làm việc với MCP. Đọc để biết sau bài này bạn sẽ có gì.

- Hiểu MCP (Model Context Protocol) và vai trò "tay chân" của nó cho dev agent.
- Cấu hình MCP server (fetch/docs, filesystem, custom) trong `.cursor/mcp.json` / `.vscode/mcp.json`.
- Viết custom MCP tool an toàn với TypeScript SDK để agent đọc repo + chạy test.

> **Tóm gọn 1 câu:** Sau bài này, agent của bạn sẽ có "bộ tay chân": tra docs React 19, đụng repo có kiểm soát, và chạy tool bạn tự viết.

## Tổng quan

Mục này đặt MCP vào bối cảnh React: Angular có sẵn, React phải đi đường cộng đồng. Đọc để biết dùng gì và MCP giải quyết đúng vấn đề nào.

- Angular có `npx @angular/cli mcp` — MCP server chính thức. React **không có CLI MCP chính thức**; dùng MCP server cộng đồng (fetch có `react.dev/mcp`, filesystem, github, postgres) và tự viết tool riêng.
- MCP cho phép agent **gọi tool** (không đoán): đọc docs chuẩn, tìm component, chạy vitest — thay vì grep bừa hoặc hỏi model.
- Áp dụng khi: agent cần tra docs mới, thao tác repo có kiểm soát, chạy test/build từ IDE.

Ví von cho dễ hình dung: không có MCP, agent như nhân viên bị **trói vào ghế** — chỉ được nói, không được đứng dậy mở tủ tài liệu hay chạy xuống phòng lab. Cài MCP là tháo dây: nó tự tra docs, tự chạy test, nhưng vẫn theo khuôn khổ bạn phê duyệt.

> **Tóm gọn 1 câu:** React không có MCP chính thức như Angular — dựng bộ cộng đồng (docs, filesystem) + tool tự viết, để agent gọi tool thật thay vì đoán.

## Khái niệm cốt lõi

Mục này định nghĩa 6 khái niệm: MCP hoạt động ra sao, server docs cho React, các tool phổ biến, cấu hình từng IDE, cách viết tool riêng, và bảo mật. Đọc để nắm từ khóa trước khi cấu hình.

- **MCP là gì**: giao thức client-server cho LLM — server expose **tools** (hàm có schema), **resources** (dữ liệu), **prompts**; client (agent/IDE) gọi qua JSON-RPC.
- **MCP docs chuẩn cho React**: `mcp-remote https://react.dev/mcp` cung cấp công cụ tra cứu docs React 19 cập nhật — tránh kiến thức cũ của model.
- **Tools phổ biến**: `mcp-server-fetch` (đọc URL → markdown), `@modelcontextprotocol/server-filesystem` (đọc/ghi file trong phạm vi allowed), github, postgres.
- **Cấu hình trình duyệt**: mỗi IDE có nơi khai — `.cursor/mcp.json`, `.vscode/mcp.json`, Claude Code `~/.claude.json`, hoặc `npx` chạy adhoc.
- **Custom MCP**: dùng `@modelcontextprotocol/sdk` — `McpServer` + `server.tool(name, schema, handler)`; handler nhận args đã validate và trả `content`.
- **Bảo mật**: filesystem server chỉ trỏ vào repo (không cho đường dẫn tùy ý); tool shell phải whitelist lệnh — không cho shell tự do.

> **Tóm gọn 1 câu:** MCP là hợp đồng giữa agent và "đồ nghề": tool có schema, cấu hình theo từng IDE, và luôn khóa quyền trong phạm vi an toàn.

## Luồng hoạt động / Cách áp dụng

Mục này là lộ trình 5 bước từ xác định nhu cầu đến khóa quyền. Làm tuần tự — bước 5 là bước đừng bao giờ bỏ qua.

1. Xác định nhu cầu: docs tươi (fetch/react-docs), thao tác repo (filesystem), tool riêng (search_components, run_tests).
2. Khai trong file cấu hình của IDE theo cú pháp của host.
3. (Nếu cần) viết custom server bằng TS SDK + zod, build và trỏ command.
4. Kiểm tra: mở agent/IDE, yêu cầu "tìm component có từ 'User' " hoặc "đọc docs useTransition".
5. Phân quyền: filesystem giới hạn thư mục, cấm shell tự do; log tool usage nếu có.

> **Tóm gọn 1 câu:** Chọn tool theo nhu cầu → khai đúng cú pháp host → tự viết nếu thiếu → chạy thử thật → luôn khóa quyền trước khi coi là xong.

## Ví dụ chi tiết

Mục này trỏ tới các file cấu hình và code tool mẫu. Đọc kèm file để thấy mỗi khái niệm ở trên "hiện hình" trong JSON/TS như thế nào.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.json`](examples/01-vi-du-chi-tiet.json)

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.json`](examples/02-vi-du-chi-tiet.json)

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.ts`](examples/03-vi-du-chi-tiet.ts)

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.ts`](examples/04-vi-du-chi-tiet.ts)

> **Tóm gọn 1 câu:** Bốn file ví dụ = 2 cấu hình JSON + 2 code tool TS — chép về, đổi đường dẫn, là agent của bạn có ngay tay chân.

## Giải thích từng phần

Mục này bóc từng dòng cấu hình/tool để bạn hiểu "vì sao viết vậy". Đọc khi muốn tự chỉnh tool theo repo mình.

- `mcp-remote https://react.dev/mcp`: biến react.dev/mcp thành MCP server qua remote — agent tra docs mới chuẩn hơn model nhớ.
- `server-filesystem` với path: khóa agent trong repo — giảm rủi ro đọc/ghi lung tung.
- `server.tool(name, { args }, handler)`: khai tool với zod schema → agent gọi đúng kiểu, tránh prompt injection.
- `searchComponents`: tìm component trong repo có kiểm soát — chuẩn hóa thay vì để agent tự grep đủ kiểu.

> **Tóm gọn 1 câu:** Mỗi dòng cấu hình đều có hai vai trò: mở một năng lực cho agent và khóa một rủi ro — docs qua remote, file khóa trong repo, tool bắt qua schema.

## Lỗi thường gặp / Chống chỉ định

Mục này liệt kê 5 cái bẫy bảo mật và cấu hình hay gặp nhất với MCP. Đọc trước khi mở server cho cả nhóm dùng.

- **Cho MCP filesystem trỏ toàn máy** (`/`): agent vô tình đọc/sửa file hệ thống → chỉ trỏ project.
- **Tool chạy shell tự do** (`Bun.$` nhận chuỗi user): prompt injection có thể chạy lệnh nguy hiểm → whitelist lệnh cố định + validate args.
- **MCP server ở máy chạy HTTP không auth**: kẻ khác gọi tool → dùng stdio/localhoat + auth nếu remote.
- **Không khai `command` đúng (`npx -y`)**: IDE không tìm thấy server → theo đúng cú pháp từng host.
- **Coi MCP là nguồn duy nhất**: server lỗi = agent mù → cấu hình lại/fallback doc text.

Hãy hình dung filesystem server như **chìa khóa phòng của bạn**: đưa chìa khóa cả toà nhà cho người lạ thì chỉ cần một lần sơ sài là mất sạch — chỉ đưa đúng chìa khóa căn phòng cần dọn.

> **Tóm gọn 1 câu:** Năm bẫy đều chung một bài học: mở quyền càng ít càng tốt — trỏ đúng project, whitelist lệnh, có auth, đúng cú pháp host, và luôn có phương án dự phòng.

## Best practices / Mẹo

Mục này gom kinh nghiệm vận hành MCP về một chỗ. Đọc sau khi server chạy ổn để nâng độ tin cậy.

- Ưu tiên MCP docs chính thức (`react.dev/mcp`) cho React để lấy API đúng version.
- Viết tool nhỏ, một mục đích, schema rõ ràng (agent dùng đúng hơn).
- Log mọi tool call (vào file) để audit agent đã làm gì.
- Giữ server nhẹ: khởi động nhanh, không kéo dependency nặng.
- Kết hợp với Agent Skills (bài 2): skill hướng dẫn "khi nào gọi tool nào".

> **Tóm gọn 1 câu:** Tool nhỏ + schema rõ + có log + server nhẹ, và nhớ: skill chỉ đường, MCP ra tay.

## Bài tập nhỏ

Cài `@modelcontextprotocol/sdk`, viết tool `react_docs_search` query `https://react.dev/llms.txt` tìm chủ đề (vd `useActionState`), trả 5 đoạn liên quan. Khai vào `.cursor/mcp.json` và thử yêu cầu agent tra "use" hook.

## Reference
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [React MCP server (community)](https://react.dev/mcp)
- [mcp-server-fetch](https://github.com/modelcontextprotocol/servers)
