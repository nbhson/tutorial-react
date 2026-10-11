// Đọc + validate env ngay khi boot (nhóm 4_security-config: fail-fast).
// - VITE_* lộ ra client nên KHÔNG bao giờ để secret ở đây.
// - Sai format -> throw sớm thay vì fetch lỗi khó debug.

import { z } from "zod";

const EnvSchema = z.object({
  apiUrl: z.string().url().default("https://jsonplaceholder.typicode.com"),
  postsLimit: z.coerce.number().int().min(1).max(100).default(20),
});

function loadEnv() {
  return EnvSchema.parse({
    apiUrl: import.meta.env.VITE_API_URL,
    postsLimit: import.meta.env.VITE_POSTS_LIMIT,
  });
}

export const env = loadEnv();
export type AppEnv = z.infer<typeof EnvSchema>;
