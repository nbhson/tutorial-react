import { z } from 'zod';

// Validate env lúc khởi động — thiếu là crash sớm, không lỗi ngầm
const EnvSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_APP_NAME: z.string().default('MyApp'),
  VITE_ENABLE_MOCK: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

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
