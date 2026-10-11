// Hàm thuần lọc posts — tách khỏi component để test dễ (DAY 21 + nhóm 6 Vitest).
import type { Post } from "../types";

export function filterPosts(posts: Post[], query: string): Post[] {
  const q = query.trim().toLowerCase();
  if (!q) return posts;
  return posts.filter(
    (p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q),
  );
}
