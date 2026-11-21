// src/config/env.ts — validate env lúc khởi động, thiếu là crash sớm
import { z } from 'zod';

const EnvSchema = z.object({
  // Bắt buộc, phải là URL hợp lệ
  VITE_API_URL: z.string().url(),
  // Có mặc định nếu không khai báo
  VITE_APP_NAME: z.string().default('MyApp'),
  // Chuỗi "true" → boolean
  VITE_ENABLE_MOCK: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

// .parse() ném ZodError nếu sai → app dừng ngay thay vì lỗi ngầm undefined
export const env = EnvSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_ENABLE_MOCK: import.meta.env.VITE_ENABLE_MOCK,
});

export function AppConfig() {
  return (
    <p>
      {env.VITE_APP_NAME} → {env.VITE_API_URL}
    </p>
  );
}
