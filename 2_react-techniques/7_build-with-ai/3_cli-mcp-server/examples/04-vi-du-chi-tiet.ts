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
