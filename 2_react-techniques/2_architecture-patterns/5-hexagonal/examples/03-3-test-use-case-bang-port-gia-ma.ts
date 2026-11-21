// ✅ ĐÚNG: test không mock fetch — chỉ object literal implement port
import { describe, expect, it } from 'vitest';
const giaRepo = { list: async () => [{ id: 1, title: 'A', done: false }], toggle: async () => {} };
it('đếm đúng todo mở', async () => { expect(await countOpenTodos(giaRepo)()).toBe(1); });
