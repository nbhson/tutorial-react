// demo-tool.ts — logic đứng sau MCP tool "search_components":
// agent gọi tool này thay vì grep bừa trong repo.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function searchComponents(dir: string, keyword: string): string[] {
  const hits: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      hits.push(...searchComponents(full, keyword));
    } else if (entry.endsWith('.tsx') && readFileSync(full, 'utf8').includes(keyword)) {
      hits.push(full);
    }
  }
  return hits;
}
