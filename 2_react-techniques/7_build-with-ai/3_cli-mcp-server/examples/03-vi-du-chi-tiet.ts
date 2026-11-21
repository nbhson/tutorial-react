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
