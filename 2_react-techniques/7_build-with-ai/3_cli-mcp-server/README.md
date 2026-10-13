# MCP Server cho React Dev

> Nguồn: https://modelcontextprotocol.io/ — tương đương `angular.dev/ai/mcp` (`npx @angular/cli mcp` — Angular có CLI MCP chính thức, React thì dùng cộng đồng)

## Mục tiêu
- Hiểu MCP (Model Context Protocol) và vai trò "tay chân" của nó cho dev agent.
- Cấu hình MCP server (fetch/docs, filesystem, custom) trong `.cursor/mcp.json` / `.vscode/mcp.json`.
- Viết custom MCP tool an toàn với TypeScript SDK để agent đọc repo + chạy test.

## Tổng quan
- Angular có `npx @angular/cli mcp` — MCP server chính thức. React **không có CLI MCP chính thức**; dùng MCP server cộng đồng (fetch có `react.dev/mcp`, filesystem, github, postgres) và tự viết tool riêng.
- MCP cho phép agent **gọi tool** (không đoán): đọc docs chuẩn, tìm component, chạy vitest — thay vì grep bừa hoặc hỏi model.
- Áp dụng khi: agent cần tra docs mới, thao tác repo có kiểm soát, chạy test/build từ IDE.

## Khái niệm cốt lõi
- **MCP là gì**: giao thức client-server cho LLM — server expose **tools** (hàm có schema), **resources** (dữ liệu), **prompts**; client (agent/IDE) gọi qua JSON-RPC.
- **MCP docs chuẩn cho React**: `mcp-remote https://react.dev/mcp` cung cấp công cụ tra cứu docs React 19 cập nhật — tránh kiến thức cũ của model.
- **Tools phổ biến**: `mcp-server-fetch` (đọc URL → markdown), `@modelcontextprotocol/server-filesystem` (đọc/ghi file trong phạm vi allowed), github, postgres.
- **Cấu hình trình duyệt**: mỗi IDE có nơi khai — `.cursor/mcp.json`, `.vscode/mcp.json`, Claude Code `~/.claude.json`, hoặc `npx` chạy adhoc.
- **Custom MCP**: dùng `@modelcontextprotocol/sdk` — `McpServer` + `server.tool(name, schema, handler)`; handler nhận args đã validate và trả `content`.
- **Bảo mật**: filesystem server chỉ trỏ vào repo (không cho đường dẫn tùy ý); tool shell phải whitelist lệnh — không cho shell tự do.

## Luồng hoạt động / Cách áp dụng
1. Xác định nhu cầu: docs tươi (fetch/react-docs), thao tác repo (filesystem), tool riêng (search_components, run_tests).
2. Khai trong file cấu hình của IDE theo cú pháp của host.
3. (Nếu cần) viết custom server bằng TS SDK + zod, build và trỏ command.
4. Kiểm tra: mở agent/IDE, yêu cầu "tìm component có từ 'User' " hoặc "đọc docs useTransition".
5. Phân quyền: filesystem giới hạn thư mục, cấm shell tự do; log tool usage nếu có.

## Ví dụ chi tiết
```json
// .cursor/mcp.json — khai MCP server cho Cursor/agent
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["-y", "mcp-server-fetch"]
    },
    "react-docs": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://react.dev/mcp"]
    },
    "repo-fs": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/son/projects/my-react-app"]
    }
  }
}
```

```json
// .vscode/mcp.json — cú pháp giống cho VSCode Copilot
{
  "servers": {
    "repo-fs": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./"]
    }
  }
}
```

```ts
// custom-mcp.ts — server tool "chạy vitest an toàn" (TypeScript SDK)
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({ name: 'react-repo', version: '1.0.0' });

server.tool(
  'run_component_tests',
  { pattern: z.string().describe('Vitest file pattern, vd **/*.test.tsx') },
  async ({ pattern }) => {
    // CHỈ chạy lệnh test, không cho shell tự do — giới hạn rủi ro
    const out = await Bun.$`npx vitest run ${pattern}`.text();
    return { content: [{ type: 'text', text: out }] };
  },
);

server.tool(
  'search_components',
  { keyword: z.string() },
  async ({ keyword }) => {
    // Logic tìm file .tsx (xem example.tsx — hàm searchComponents)
    const { searchComponents } = await import('./search-components');
    const hits = searchComponents('./src', keyword);
    return { content: [{ type: 'text', text: hits.join('\n') }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport); // chạy qua stdio: npx tsx ./custom-mcp.ts
```

```ts
// example.tsx — searchComponents: agent gọi tool thay vì grep bừa
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function searchComponents(dir: string, keyword: string): string[] {
  const hits: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      hits.push(...searchComponents(full, keyword)); // đệ quy vào thư mục
    } else if (entry.endsWith('.tsx') && readFileSync(full, 'utf8').includes(keyword)) {
      hits.push(full); // file .tsx chứa keyword
    }
  }
  return hits;
}
```

## Giải thích từng phần
- `mcp-remote https://react.dev/mcp`: biến react.dev/mcp thành MCP server qua remote — agent tra docs mới chuẩn hơn model nhớ.
- `server-filesystem` với path: khóa agent trong repo — giảm rủi ro đọc/ghi lung tung.
- `server.tool(name, { args }, handler)`: khai tool với zod schema → agent gọi đúng kiểu, tránh prompt injection.
- `searchComponents`: tìm component trong repo có kiểm soát — chuẩn hóa thay vì để agent tự grep đủ kiểu.

## Lỗi thường gặp / Chống chỉ định
- **Cho MCP filesystem trỏ toàn máy** (`/`): agent vô tình đọc/sửa file hệ thống → chỉ trỏ project.
- **Tool chạy shell tự do** (`Bun.$` nhận chuỗi user): prompt injection có thể chạy lệnh nguy hiểm → whitelist lệnh cố định + validate args.
- **MCP server ở máy chạy HTTP không auth**: kẻ khác gọi tool → dùng stdio/localhoat + auth nếu remote.
- **Không khai `command` đúng (`npx -y`)**: IDE không tìm thấy server → theo đúng cú pháp từng host.
- **Coi MCP là nguồn duy nhất**: server lỗi = agent mù → cấu hình lại/fallback doc text.

## Best practices / Mẹo
- Ưu tiên MCP docs chính thức (`react.dev/mcp`) cho React để lấy API đúng version.
- Viết tool nhỏ, một mục đích, schema rõ ràng (agent dùng đúng hơn).
- Log mọi tool call (vào file) để audit agent đã làm gì.
- Giữ server nhẹ: khởi động nhanh, không kéo dependency nặng.
- Kết hợp với Agent Skills (bài 2): skill hướng dẫn "khi nào gọi tool nào".

## Bài tập nhỏ
Cài `@modelcontextprotocol/sdk`, viết tool `react_docs_search` query `https://react.dev/llms.txt` tìm chủ đề (vd `useActionState`), trả 5 đoạn liên quan. Khai vào `.cursor/mcp.json` và thử yêu cầu agent tra "use" hook.

## Reference
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [React MCP server (community)](https://react.dev/mcp)
- [mcp-server-fetch](https://github.com/modelcontextprotocol/servers)